const { app, BrowserWindow, Tray, Menu, globalShortcut, shell, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

// Set Application User Model ID for Windows Taskbar Icon & Notifications
if (process.platform === 'win32') {
    app.setAppUserModelId('MEZO TIK Live Overlay');
}

// Read Active Online Domain from domain.txt (Never localhost!)
function getOnlineDomain() {
    try {
        const candidates = [
            path.join(path.dirname(process.execPath), 'domain.txt'),
            path.join(__dirname, 'domain.txt')
        ];
        for (const p of candidates) {
            if (fs.existsSync(p)) {
                const raw = fs.readFileSync(p, 'utf8').trim().replace(/\/+$/, '');
                if (raw && raw.startsWith('http')) return raw;
            }
        }
    } catch (e) {}
    return (process.env.APP_DOMAIN || 'https://gifts-overlay11.onrender.com').replace(/\/+$/, '');
}

let ONLINE_DOMAIN = getOnlineDomain();
let mainWindow = null;
let tray = null;
let isQuitting = false;
let currentActiveTeam = 'a';

// Resolves authentic icon for Windows
function getAppIcon() {
    const icoPath = path.join(__dirname, 'mezotik.ico');
    if (fs.existsSync(icoPath)) return icoPath;
    const pubIco = path.join(__dirname, 'public', 'images', 'mezotik.ico');
    if (fs.existsSync(pubIco)) return pubIco;
    return path.join(__dirname, 'public', 'images', 'mezotik-logo.png');
}

// Initialize safe ASCII audio paths in Windows Temp (bypasses any Arabic path encoding issues)
let safeTempUp = '';
let safeTempDown = '';

function initAudioFiles() {
    try {
        safeTempUp = path.join(app.getPath('temp'), 'mezotik_score_up.wav');
        safeTempDown = path.join(app.getPath('temp'), 'mezotik_score_down.wav');
        const srcUp = path.join(__dirname, 'public', 'sounds', 'score_up.wav');
        const srcDown = path.join(__dirname, 'public', 'sounds', 'score_down.wav');
        if (fs.existsSync(srcUp)) fs.copyFileSync(srcUp, safeTempUp);
        if (fs.existsSync(srcDown)) fs.copyFileSync(srcDown, safeTempDown);
    } catch (e) {}
}

// Sound chime using custom arcade game audio files
function playBeep(type = 'up') {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
            try {
                if (typeof playScoreChime === 'function') {
                    playScoreChime('${type}');
                } else {
                    const snd = new Audio('/sounds/${type === 'up' ? 'score_up.wav' : 'score_down.wav'}');
                    snd.currentTime = 0;
                    snd.play().catch(() => {});
                }
            } catch(e) {}
        `).catch(() => {});
    }

    try {
        const soundFile = type === 'up' ? safeTempUp : safeTempDown;
        if (fs.existsSync(soundFile)) {
            const cp = require('child_process');
            cp.exec(`powershell -NoProfile -NonInteractive -Command "(New-Object System.Media.SoundPlayer '${soundFile.replace(/\\/g, '\\\\')}').Play()"`, { windowsHide: true });
        }
    } catch (e) {}
}

// Send score update strictly once (+1 or -1) via the active user's encrypted board in mainWindow
let lastHotkeyTriggerTime = 0;

function sendScoreUpdate(team, delta) {
    const now = Date.now();
    if (now - lastHotkeyTriggerTime < 150) return;
    lastHotkeyTriggerTime = now;

    const cleanDelta = delta > 0 ? 1 : -1;

    // Play native Windows audio chime if window is minimized/hidden
    if (!mainWindow || mainWindow.isDestroyed() || !mainWindow.isVisible()) {
        try {
            const soundFile = cleanDelta > 0 ? safeTempUp : safeTempDown;
            if (fs.existsSync(soundFile)) {
                const cp = require('child_process');
                cp.exec(`powershell -NoProfile -NonInteractive -Command "(New-Object System.Media.SoundPlayer '${soundFile.replace(/\\/g, '\\\\')}').Play()"`, { windowsHide: true });
            }
        } catch (e) {}
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
            if (typeof window.triggerGlobalHotkeyScore === 'function') {
                window.triggerGlobalHotkeyScore('${team}', ${cleanDelta});
            }
        `).catch(() => {});
    }
}

function copyOverlayFromRenderer(type, fallbackPath) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript(`
            if (typeof copyCurrentOverlayUrl === 'function') {
                copyCurrentOverlayUrl('${type}');
            }
        `).catch(() => {
            electronClipboardCopy(`${getOnlineDomain()}${fallbackPath}`);
        });
    } else {
        electronClipboardCopy(`${getOnlineDomain()}${fallbackPath}`);
    }
}

// Register Native Windows Global Hotkeys (Main row + Numpad)
function registerGlobalHotkeys() {
    globalShortcut.unregisterAll();

    ['Alt+1', 'Alt+num1'].forEach(k => {
        try {
            globalShortcut.register(k, () => {
                currentActiveTeam = 'a';
                sendScoreUpdate('a', 1);
            });
        } catch (e) {}
    });

    ['Alt+2', 'Alt+num2'].forEach(k => {
        try {
            globalShortcut.register(k, () => {
                currentActiveTeam = 'b';
                sendScoreUpdate('b', 1);
            });
        } catch (e) {}
    });

    ['Alt+3', 'Alt+num3'].forEach(k => {
        try {
            globalShortcut.register(k, () => {
                currentActiveTeam = 'a';
                sendScoreUpdate('a', -1);
            });
        } catch (e) {}
    });

    ['Alt+4', 'Alt+num4'].forEach(k => {
        try {
            globalShortcut.register(k, () => {
                currentActiveTeam = 'b';
                sendScoreUpdate('b', -1);
            });
        } catch (e) {}
    });

    ['Alt+=', 'Alt+Plus', 'Alt+numadd'].forEach(k => {
        try {
            globalShortcut.register(k, () => {
                sendScoreUpdate(currentActiveTeam, 1);
            });
        } catch (e) {}
    });

    ['Alt+-', 'Alt+numsub'].forEach(k => {
        try {
            globalShortcut.register(k, () => {
                sendScoreUpdate(currentActiveTeam, -1);
            });
        } catch (e) {}
    });
}

// Create Main Application Window (Connects directly to Online Domain, NOT localhost)
function createMainWindow() {
    const iconPath = getAppIcon();
    ONLINE_DOMAIN = getOnlineDomain();

    mainWindow = new BrowserWindow({
        width: 1420,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        title: `MEZO TIK - البرنامج الرسمي (${ONLINE_DOMAIN})`,
        icon: iconPath,
        backgroundColor: '#0c0a17',
        autoHideMenuBar: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            backgroundThrottling: false
        }
    });

    const menuTemplate = [
        {
            label: 'لوحة التحكم',
            submenu: [
                {
                    label: 'إعادة تحميل اللوحة (Reload)',
                    accelerator: 'CmdOrCtrl+R',
                    click: () => {
                        ONLINE_DOMAIN = getOnlineDomain();
                        mainWindow.loadURL(`${ONLINE_DOMAIN}/control.html`);
                    }
                },
                {
                    label: 'فتح الدومين في المتصفح الخارجي',
                    click: () => shell.openExternal(`${getOnlineDomain()}/control.html`)
                },
                {
                    label: '🌐 تعديل ملف الدومين (domain.txt)',
                    click: () => {
                        const domFile = fs.existsSync(path.join(path.dirname(process.execPath), 'domain.txt'))
                            ? path.join(path.dirname(process.execPath), 'domain.txt')
                            : path.join(__dirname, 'domain.txt');
                        shell.openPath(domFile);
                    }
                },
                { type: 'separator' },
                {
                    label: 'إخفاء في الخلفية بجانب الساعة (Tray)',
                    click: () => mainWindow.hide()
                },
                {
                    label: 'خروج نهائي من البرنامج',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        isQuitting = true;
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'روابط OBS المشفرة السريعة (على الدومين المباشر)',
            submenu: [
                {
                    label: 'نسخ رابط: هدايا تيك توك 1 (الأساسي)',
                    click: () => copyOverlayFromRenderer('gifts', '/overlay.html')
                },
                {
                    label: 'نسخ رابط: هدايا تيك توك 3 (البطاقات والجنود)',
                    click: () => copyOverlayFromRenderer('cards', '/cards-overlay.html')
                },
                {
                    label: 'نسخ رابط: هدايا تيك توك 4 (بطاقات كلاسيك MC Royale)',
                    click: () => copyOverlayFromRenderer('cards4', '/cards4-overlay.html')
                },
                {
                    label: 'نسخ رابط: لوحة النتائج (Scoreboard)',
                    click: () => copyOverlayFromRenderer('scoreboard', '/scoreboard-overlay.html')
                },
                {
                    label: 'نسخ رابط: إطار آخر داعم (Supporter Frame)',
                    click: () => copyOverlayFromRenderer('supporterFrame', '/supporter-frame-overlay.html')
                },
                {
                    label: 'نسخ رابط: إجمالي المتابعين المباشر (Followers Live)',
                    click: () => copyOverlayFromRenderer('followers', '/followers-overlay.html')
                },
                {
                    label: '🧩 نسخ رابط: تركيبات تيك توك لايف (Tarkibat Live)',
                    click: () => copyOverlayFromRenderer('tarkibat', '/tarkibat-overlay.html')
                }
            ]
        },
        {
            label: 'مساعدة وأدوات',
            submenu: [
                {
                    label: 'فتح أدوات المطور (DevTools)',
                    accelerator: 'F12',
                    click: () => mainWindow.webContents.toggleDevTools()
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    const targetUrl = `${ONLINE_DOMAIN}/control.html`;

    function loadUrlWithRetry(retries = 12) {
        mainWindow.loadURL(targetUrl).catch(() => {
            if (retries > 0) {
                setTimeout(() => loadUrlWithRetry(retries - 1), 1000);
            }
        });
    }

    mainWindow.webContents.session.clearCache().finally(() => {
        loadUrlWithRetry();
    });

    mainWindow.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault();
            mainWindow.hide();
            if (tray) {
                try {
                    tray.displayBalloon({
                        title: 'MEZO TIK يعمل في الخلفية 🎮',
                        content: 'البرنامج متصل بالدومين ومستمر في العمل بجانب الساعة!'
                    });
                } catch (err) {}
            }
        }
    });
}

function electronClipboardCopy(text) {
    const { clipboard } = require('electron');
    clipboard.writeText(text);
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('copied-to-clipboard', text);
    }
}

// Create System Tray Icon
function createTray() {
    const iconPath = getAppIcon();
    tray = new Tray(iconPath);
    tray.setToolTip(`MEZO TIK (${getOnlineDomain()})`);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '🟢 إظهار البرنامج',
            click: () => {
                if (mainWindow) {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        },
        { type: 'separator' },
        {
            label: '🔴 +1 للأحمر (Alt + 1)',
            click: () => sendScoreUpdate('a', 1)
        },
        {
            label: '🟢 +1 للأزرق (Alt + 2)',
            click: () => sendScoreUpdate('b', 1)
        },
        { type: 'separator' },
        {
            label: '📋 نسخ رابط أوفرلاي البطاقات 3 المشفر',
            click: () => copyOverlayFromRenderer('cards', '/cards-overlay.html')
        },
        {
            label: '📋 نسخ رابط أوفرلاي البطاقات 4 المشفر',
            click: () => copyOverlayFromRenderer('cards4', '/cards4-overlay.html')
        },
        {
            label: '📋 نسخ رابط الاسكوربورد المشفر',
            click: () => copyOverlayFromRenderer('scoreboard', '/scoreboard-overlay.html')
        },
        {
            label: '📋 نسخ رابط إطار آخر داعم المشفر',
            click: () => copyOverlayFromRenderer('supporterFrame', '/supporter-frame-overlay.html')
        },
        {
            label: '📈 نسخ رابط إجمالي المتابعين المباشر',
            click: () => copyOverlayFromRenderer('followers', '/followers-overlay.html')
        },
        { type: 'separator' },
        {
            label: '❌ خروج نهائي من البرنامج',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        if (mainWindow) {
            mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
        }
    });
}

// Single Instance Lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
            mainWindow.focus();
        }
    });

    app.whenReady().then(() => {
        initAudioFiles();
        createMainWindow();
        createTray();
        registerGlobalHotkeys();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createMainWindow();
            }
        });
    });

    app.on('will-quit', () => {
        globalShortcut.unregisterAll();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'win32') {
            app.quit();
        }
    });
}
