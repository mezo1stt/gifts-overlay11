// ================= STATE & CONFIG ================= //
let currentUid = 'board_XXXX';
let currentUser = null;
let currentGifts = [];
let currentBoardData = {};
let currentTab = 'giftsSection';

// Toast Notification System (بديل احترافي لرسائل المتصفح العادية)
function showToast(message, type = 'success', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        copy: '📋'
    };

    const titles = {
        success: 'تمت العملية بنجاح',
        error: 'حدث خطأ',
        warning: 'تنبيه نظام MEZO TIK',
        info: 'معلومات الأوفرلاي',
        copy: 'تم النسخ بنجاح'
    };

    const toast = document.createElement('div');
    toast.className = `custom-toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || '🔔'}</div>
        <div class="toast-content">
            <div class="toast-title">${titles[type] || 'إشعار'}</div>
            <div class="toast-message">${escapeHtml(message)}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 13 Permanent TikTok Gifts & Triggers (شاملة التكبيس والفولو)
const POPULAR_GIFTS = [
    { name: 'تكبيس', image: '/images/tiktok_likes.png', type: 'likes' },
    { name: 'فولو', image: '/images/tiktok_follow.png', type: 'follow' },
    { name: 'تيربو', image: '/images/rose.png' },
    { name: 'مكوك فضائي', image: '/images/1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' },
    { name: 'حمايه', image: '/images/1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
    { name: 'صاروخ', image: '/images/perfume.png' },
    { name: 'بوابه', image: '/images/donut.png' },
    { name: 'نيزك', image: '/images/1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
    { name: 'تبطئ الاعبين', image: '/images/1791197915043-374dfe46d5b09ce1db19be06202d34f5.png~tplv-obj.webp' },
    { name: 'اسرع لاعب', image: '/images/1791198042522-9f8bd92363c400c284179f6719b6ba9c~tplv-obj.webp' },
    { name: 'نقل اسطوري', image: '/images/1791198055544-79a02148079526539f7599150da9fd28.png~tplv-obj.webp' },
    { name: 'فوز', image: '/images/1791198066523-1d067d13988e8754ed6adbebd89b9ee8.png~tplv-obj.webp' },
    { name: 'قلب', image: '/images/heart.png' }
];

// Pending files to upload
let pendingFiles = [];

// Camera Settings State (Default: Without LIVE tag as requested)
let cameraConfig = {
    style: 'volcano',
    ratio: '16-9',
    tag: '',
    tagPos: 'none',
    glow: 24,
    radius: 18,
    thickness: 4
};

// Fire Settings State
let fireConfig = {
    text: 'رابط الدعم بالبايو 🔥',
    font_size: 64,
    neon_enabled: true,
    neon_strength: 95,
    banner_style: 'transparent',
    display_mode: 'continuous',
    hold_duration: 6,
    loop_interval: 8,
    position_v: 'center',
    offset_y: 0,
    color: '#ff1e00',
    shine_color: '#ffd700'
};

// ================= INITIALIZATION ================= //
function loadAllSectionsForCurrentUid() {
    const uidInput = document.getElementById('uidInput');
    if (uidInput) uidInput.value = currentUid;
    const profileBoard = document.getElementById('profileBoardId');
    if (profileBoard) profileBoard.textContent = currentUid;

    loadGiftsData();
    loadTeamGiftsData();
    loadCardsData();
    loadCards4Data();
    loadFireData();
    loadSupporterFrameConfig();
    loadCameraData();
    loadScoreboardData();
    loadRaceState();
    loadFollowersState();
    if (typeof loadTarkibatData === 'function') loadTarkibatData();
}

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get Board UID from URL or localStorage fallback
    const urlParams = new URLSearchParams(window.location.search);
    const paramUid = urlParams.get('uid') || urlParams.get('id');
    if (paramUid && paramUid !== 'default' && paramUid !== 'board_XXXX') {
        currentUid = paramUid;
    } else {
        const saved = localStorage.getItem('last_board_uid');
        if (saved && saved !== 'default' && saved !== 'board_XXXX') {
            currentUid = saved;
        }
    }

    const uidInput = document.getElementById('uidInput');
    if (uidInput) uidInput.value = currentUid;

    // 2. Setup Sidebar Navigation
    setupSidebarNav();

    // 3. Check User Authentication (Assigns encrypted boardId when logged in)
    await checkAuth();

    // 4. Load Data for All Sections using encrypted currentUid
    loadAllSectionsForCurrentUid();

    // 5. Populate Library
    populateGiftsLibrary();

    // 6. Setup Socket.IO
    setupSocket();

    // 7. Setup Event Listeners
    setupEventListeners();
});

// ================= SIDEBAR NAVIGATION ================= //
const NAV_TAB_TITLES = {
    giftsSection: '🎁 هدايا التيك توك 1 · لوحة التحكم التفاعلية',
    teamGiftsSection: '⚔️ هدايا تيك توك 2 · أوفرلاي الفرق المتنافسة (ممنوع تكرار الصور)',
    cardsGiftsSection: '🃏 هدايا تيك توك 3 (عناصر GIF متحركة) · إعدادات البطاقات والنيون',
    cards4GiftsSection: '🎴 هدايا تيك توك 4 (بطاقات كلاسيك رويال) · بطاقات MC Royale مع الهدايا والنص',
    fireSection: '📝 نص (متغير) · شريط النصوص والدخان والبانرات الديناميكية',
    lastSupporterFramesSection: '👑 إطارات آخر داعم · إطارات فيديو أزهار الساكورا والنيون الموحدة لـ OBS',
    cameraSection: '📷 بنرات الكاميرا · 10 أنماط إطارات نيون للبث',
    scoreboardSection: '⚡ لوحة النتائج (Scoreboard) · نقاط وألوان الفرق والتحديات',
    raceSection: '⚔️ صراع الحكام 👑 · نظام تسجيل انتصارات الحكام والمتسابقين في روبلوكس وتيك توك',
    followersSection: '📈 إجمالي المتابعين المباشر ⚡ · يتجدد كل ثانية مع صورة واسم كل مستخدم في تيك توك',
    tarkibatSection: '🧩 تركيبات تيك توك لايف (TikTok Live Connector) · فحص اللايف وربط الهدايا بالأوامر',
    accountSection: '👤 إدارة الحساب والمستخدمين · قاعدة البيانات'
};

function switchMainTab(targetTab) {
    if (!targetTab) return;
    const navItems = document.querySelectorAll('.nav-item');

    // Switch active classes
    navItems.forEach(i => {
        if (i.dataset.tab === targetTab) i.classList.add('active');
        else i.classList.remove('active');
    });

    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
    const activeSec = document.getElementById(targetTab);
    if (activeSec) activeSec.classList.add('active');

    currentTab = targetTab;
    const titleEl = document.getElementById('activePageTitle');
    if (titleEl && NAV_TAB_TITLES[targetTab]) titleEl.textContent = NAV_TAB_TITLES[targetTab];

    // Persist active tab across refreshes WITHOUT hash anchor jump!
    try {
        localStorage.setItem('active_control_tab', targetTab);
        if (window.history && window.history.replaceState) {
            const url = new URL(window.location);
            url.hash = ''; // Remove hash completely to kill native anchor jumps!
            url.searchParams.set('tab', targetTab);
            window.history.replaceState(null, '', url.toString());
        }
    } catch (e) {}

    // Force instant scroll to top on content container and window
    const pageContent = document.querySelector('.page-content-area');
    if (pageContent) pageContent.scrollTop = 0;
    const mainWrap = document.querySelector('.main-wrapper');
    if (mainWrap) mainWrap.scrollTop = 0;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

function setupSidebarNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.dataset.tab;
            if (targetTab) switchMainTab(targetTab);
        });
    });

    // Toggle Sidebar collapse
    const toggleBtn = document.getElementById('btnSidebarToggle');
    const sidebar = document.getElementById('sidebarNav');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // Restore saved tab - check query param, hash (cleaned immediately), or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const queryTab = urlParams.get('tab');
    let hashTab = window.location.hash ? window.location.hash.replace('#', '') : null;
    const savedTab = localStorage.getItem('active_control_tab');

    // Remove any leftover hash from previous versions
    if (window.location.hash) {
        try {
            history.replaceState(null, '', window.location.pathname + (window.location.search || ''));
        } catch (e) {}
    }

    const initialTab = (queryTab && document.getElementById(queryTab)) ? queryTab
        : (hashTab && document.getElementById(hashTab)) ? hashTab
        : (savedTab && document.getElementById(savedTab)) ? savedTab
        : 'giftsSection';

    switchMainTab(initialTab);
}

// ================= AUTHENTICATION ================= //
async function checkAuth() {
    const token = localStorage.getItem('auth_token');
    const authBtn = document.getElementById('btnAuthToggle');
    const pillName = document.getElementById('sidebarUserName');
    const profileName = document.getElementById('profileDisplayName');
    const profileUser = document.getElementById('profileUsername');
    const profileBoard = document.getElementById('profileBoardId');

    if (!token) {
        setGuestMode();
        // Immediately show the login/welcome interface when entering the website if not logged in
        setTimeout(() => {
            if (!localStorage.getItem('auth_token')) openAuthModal();
        }, 400);
        return;
    }

    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.user) {
            currentUser = data.user;
            if (authBtn) authBtn.textContent = `🚪 خروج (${currentUser.displayName || currentUser.username})`;
            if (pillName) pillName.textContent = currentUser.displayName || currentUser.username;
            if (profileName) profileName.textContent = currentUser.displayName || currentUser.username;
            if (profileUser) profileUser.textContent = `@${currentUser.username}`;
            if (profileBoard) profileBoard.textContent = currentUser.boardId;

            // Always bind currentUid to the logged-in user's unique encrypted boardId
            if (currentUser.boardId) {
                currentUid = currentUser.boardId;
                localStorage.setItem('last_board_uid', currentUid);
                const uidInput = document.getElementById('uidInput');
                if (uidInput) uidInput.value = currentUid;

                // Clean any legacy ?uid=default from the URL bar
                try {
                    const url = new URL(window.location);
                    if (url.searchParams.has('uid')) {
                        url.searchParams.delete('uid');
                        window.history.replaceState(null, '', url.toString());
                    }
                } catch (e) {}
            }
        } else {
            setGuestMode();
            setTimeout(() => {
                if (!localStorage.getItem('auth_token')) openAuthModal();
            }, 400);
        }
    } catch (e) {
        setGuestMode();
    }
}

function setGuestMode() {
    currentUser = null;
    const authBtn = document.getElementById('btnAuthToggle');
    const pillName = document.getElementById('sidebarUserName');
    if (authBtn) authBtn.textContent = '👤 تسجيل الدخول';
    if (pillName) pillName.textContent = 'زائر (غير مسجل)';
}

function handleAuthBtnClick() {
    if (currentUser) {
        logoutUser();
    } else {
        openAuthModal();
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const user = document.getElementById('loginUsername').value.trim();
    const pass = document.getElementById('loginPassword').value.trim();

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('auth_token', data.token);
            closeAuthModal();
            await checkAuth();
            loadAllSectionsForCurrentUid();
            showToast(`👋 مرحباً بك يا ${data.user.displayName || data.user.username}! تم تفعيل البورد المشفر الخاص بك.`, 'success');
        } else {
            showToast(data.error || 'فشل تسجيل الدخول', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال: ' + err.message, 'error');
    }
}

async function handleRegisterModalSubmit(e) {
    e.preventDefault();
    const user = document.getElementById('regModalUsername').value.trim();
    const disp = document.getElementById('regModalDisplayName').value.trim();
    const pass = document.getElementById('regModalPassword').value.trim();

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass, displayName: disp })
        });
        const data = await res.json();
        if (data.success) {
            localStorage.setItem('auth_token', data.token);
            closeAuthModal();
            await checkAuth();
            loadAllSectionsForCurrentUid();
            showToast('✨ تم إنشاء حسابك وتوليد بورد مشفر خاص بك بنجاح!', 'success');
        } else {
            showToast(data.error || 'فشل إنشاء الحساب', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال: ' + err.message, 'error');
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    const user = document.getElementById('regUsername').value.trim();
    const disp = document.getElementById('regDisplayName').value.trim();
    const pass = document.getElementById('regPassword').value.trim();

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass, displayName: disp })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✨ تم إنشاء حساب ${data.user.displayName} ببورد مشفر (${data.user.boardId})!`, 'success');
            document.getElementById('registerNewUserForm').reset();
        } else {
            showToast(data.error || 'فشل إنشاء الحساب', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال: ' + err.message, 'error');
    }
}

function copyEncryptedBoardId() {
    if (!currentUid) return;
    navigator.clipboard.writeText(currentUid);
    showToast(`🔐 تم نسخ كود البورد المشفر الخاص بك: ${currentUid}`, 'copy');
}

async function regenerateMyEncryptedBoardId() {
    const token = localStorage.getItem('auth_token');
    if (!token || !currentUser) {
        showToast('⚠️ يرجى تسجيل الدخول أولاً لتوليد كود بورد مشفر خاص بحسابك', 'warning');
        openAuthModal();
        return;
    }
    if (!confirm('🔐 هل تريد توليد كود بورد مشفر سري جديد لحسابك؟\nسيتم نقل جميع إعداداتك وهداياك تلقائياً للكود الجديد، وإبطال الروابط القديمة لحمايتك من أي متطفلين.')) {
        return;
    }
    try {
        const res = await fetch('/api/auth/regenerate-board', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ oldBoardId: currentUid })
        });
        const data = await res.json();
        if (data.success && data.boardId) {
            currentUid = data.boardId;
            if (currentUser) currentUser.boardId = data.boardId;
            localStorage.setItem('last_board_uid', currentUid);
            loadAllSectionsForCurrentUid();
            showToast(`🔐 تم توليد كود بورد مشفر جديد لحسابك بنجاح! انسخ روابط OBS الجديدة الآن.`, 'success', 4500);
        } else {
            showToast(data.error || 'تعذر توليد البورد المشفر الجديد', 'error');
        }
    } catch (e) {
        showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

async function logoutUser() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
        } catch (e) {}
    }
    localStorage.removeItem('auth_token');
    setGuestMode();
    showToast('🚪 تم تسجيل الخروج بنجاح', 'info');
    openAuthModal();
}

function openAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('open');
    switchAuthModalTab('login');
    const uInput = document.getElementById('loginUsername');
    const pInput = document.getElementById('loginPassword');
    if (uInput && !currentUser) {
        uInput.value = '';
        if (pInput) pInput.value = '';
        setTimeout(() => uInput.focus(), 150);
    }
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('open');
}

function switchAuthModalTab(tab) {
    const isLogin = tab === 'login';
    const btnLogin = document.getElementById('authModalTabLogin');
    const btnReg = document.getElementById('authModalTabRegister');
    const loginForm = document.getElementById('loginForm');
    const regForm = document.getElementById('registerModalForm');
    if (btnLogin) {
        btnLogin.classList.toggle('active', isLogin);
        btnLogin.style.background = isLogin ? 'linear-gradient(135deg, #7928ca, #ff0080)' : 'transparent';
        btnLogin.style.color = isLogin ? '#fff' : '#94a3b8';
    }
    if (btnReg) {
        btnReg.classList.toggle('active', !isLogin);
        btnReg.style.background = !isLogin ? 'linear-gradient(135deg, #7928ca, #ff0080)' : 'transparent';
        btnReg.style.color = !isLogin ? '#fff' : '#94a3b8';
    }
    if (loginForm) loginForm.style.display = isLogin ? 'block' : 'none';
    if (regForm) regForm.style.display = !isLogin ? 'block' : 'none';
}

function switchAuthTab(tab) {
    switchAuthModalTab(tab);
}

// ================= SECTION 1: GIFTS OVERLAY & MC ROYALE CARDS ================= //
const MCROYALE_AVAILABLE_CARDS = [
    { type: 'skeleton_bandana', name: 'سكلتون بعصابة زرقاء (X1)', img: '/images/mcroyale/skeleton_bandana.png' },
    { type: 'evoker_mage', name: 'ساحر إيفوكر (X1)', img: '/images/mcroyale/evoker_mage.png' },
    { type: 'skeleton_cap', name: 'سكلتون بقبعة ونظارة (X2)', img: '/images/mcroyale/skeleton_cap.png' },
    { type: 'hog_rider', name: 'راكب الخنزير بمطرقة (X1)', img: '/images/mcroyale/hog_rider.png' },
    { type: 'golem_pumpkin', name: 'وحش الجولم برأس يقطين (X1)', img: '/images/mcroyale/golem_pumpkin.png' }
];

function onNeonColorChange(color) {
    if (!color) return;
    const colorHex = document.getElementById('colorHex');
    if (colorHex) colorHex.textContent = color;
    const neonInput = document.getElementById('neonColor');
    if (neonInput && neonInput.value !== color) neonInput.value = color;

    if (currentBoardData) {
        currentBoardData.color = color;
    }
    saveBoardSettings({ color });
    renderPreviewSimulator(currentBoardData);
}

function switchGiftDisplayMode(mode, doSave = true) {
    const isMcRoyale = mode === 'mcroyale';
    const btnClassic = document.getElementById('btnModeClassic');
    const btnMcRoyale = document.getElementById('btnModeMcRoyale');
    const mcCard = document.getElementById('mcroyaleCardsCard');
    const classicAdd = document.getElementById('classicAddGiftCard');
    const classicList = document.getElementById('classicCurrentGiftsCard');
    const tag = document.getElementById('currentDisplayModeTag');

    if (btnClassic) btnClassic.classList.toggle('active', !isMcRoyale);
    if (btnMcRoyale) btnMcRoyale.classList.toggle('active', isMcRoyale);
    if (mcCard) mcCard.style.display = isMcRoyale ? 'block' : 'none';
    if (classicAdd) classicAdd.style.display = isMcRoyale ? 'none' : 'block';
    if (classicList) classicList.style.display = isMcRoyale ? 'none' : 'block';
    if (tag) tag.textContent = isMcRoyale ? '🃏 بطاقات MC Royale' : '🎁 كلاسيكي';

    if (currentBoardData) {
        currentBoardData.giftDisplayMode = mode;
    }

    if (isMcRoyale) {
        renderMcRoyaleCardsEditor();
    }

    if (doSave) {
        saveBoardSettings({ giftDisplayMode: mode });
        showToast(isMcRoyale ? '🃏 تم تفعيل وضع بطاقات MC Royale على البث' : '🎁 تم تفعيل وضع هدايا تيك توك الكلاسيكي', 'success');
    }
    renderPreviewSimulator(currentBoardData);
}

function renderMcRoyaleCardsEditor() {
    const container = document.getElementById('mcroyaleCardsGrid');
    if (!container) return;

    if (!currentBoardData.mcroyaleCards || currentBoardData.mcroyaleCards.length === 0) {
        currentBoardData.mcroyaleCards = [
            { id: 1, cardType: 'skeleton_bandana', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
            { id: 2, cardType: 'evoker_mage', count: 1, giftName: 'عطر', giftImage: '/images/perfume.png' },
            { id: 3, cardType: 'skeleton_cap', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
            { id: 4, cardType: 'hog_rider', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
            { id: 5, cardType: 'golem_pumpkin', count: 1, giftName: 'آيس كريم', giftImage: '/images/icecream.png' }
        ];
    }

    container.innerHTML = '';
    currentBoardData.mcroyaleCards.forEach((card, idx) => {
        const slot = document.createElement('div');
        slot.className = 'mcroyale-card-slot';

        const cardImg = `/images/mcroyale/${card.cardType || 'skeleton_bandana'}.png`;
        const giftImg = card.giftImage && card.giftImage.startsWith('http') ? card.giftImage : `/images/${card.giftImage || 'rose.png'}`;

        let cardOptionsHtml = MCROYALE_AVAILABLE_CARDS.map(c => 
            `<option value="${c.type}" ${c.type === card.cardType ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        // Prepare gifts catalog options
        const giftList = allTiktokGifts.length > 0 ? allTiktokGifts : [
            { name: 'وردة', image: '/images/rose.png' },
            { name: 'عطر', image: '/images/perfume.png' },
            { name: 'دونات', image: '/images/donut.png' },
            { name: 'قلب', image: '/images/heart.png' },
            { name: 'آيس كريم', image: '/images/icecream.png' },
            { name: 'جلاكسي', image: '/images/galaxy.png' },
            { name: 'أسد', image: '/images/lion.png' }
        ];

        let giftOptionsHtml = giftList.slice(0, 80).map(g => {
            const isSel = (g.name === card.giftName) || (g.image === card.giftImage);
            return `<option value="${escapeHtml(g.name)}" data-img="${escapeHtml(g.image)}" ${isSel ? 'selected' : ''}>🎁 ${escapeHtml(g.name)}</option>`;
        }).join('');

        slot.innerHTML = `
            <div class="mcroyale-slot-preview">
                <img class="mcroyale-slot-card-img" id="slotCardImg_${idx}" src="${cardImg}" alt="Card">
                <img class="mcroyale-slot-gift-tag" id="slotGiftImg_${idx}" src="${giftImg}" alt="Gift">
            </div>
            <div class="mcroyale-slot-fields">
                <div class="mcroyale-field-group">
                    <label>🃏 نوع البطاقة المصورة:</label>
                    <select onchange="onMcRoyaleCardTypeChange(${idx}, this.value)">
                        ${cardOptionsHtml}
                    </select>
                </div>
                <div class="mcroyale-field-group">
                    <label>⚔️ عدد الجنود (Multiplier):</label>
                    <input type="number" min="1" max="999" class="mcroyale-count-badge-input" value="${card.count || 1}" onchange="onMcRoyaleCardCountChange(${idx}, this.value)">
                </div>
                <div class="mcroyale-field-group">
                    <label>🎁 الهدية المرتبطة:</label>
                    <select onchange="onMcRoyaleGiftChange(${idx}, this)">
                        ${giftOptionsHtml}
                    </select>
                </div>
            </div>
            <button type="button" class="btn-slot-del" onclick="deleteMcRoyaleCardSlot(${idx})" title="حذف الخانة">✕</button>
        `;
        container.appendChild(slot);
    });
}

function onMcRoyaleCardTypeChange(idx, val) {
    if (!currentBoardData.mcroyaleCards || !currentBoardData.mcroyaleCards[idx]) return;
    currentBoardData.mcroyaleCards[idx].cardType = val;
    const imgEl = document.getElementById(`slotCardImg_${idx}`);
    if (imgEl) imgEl.src = `/images/mcroyale/${val}.png`;
    renderPreviewSimulator(currentBoardData);
}

function onMcRoyaleCardCountChange(idx, val) {
    if (!currentBoardData.mcroyaleCards || !currentBoardData.mcroyaleCards[idx]) return;
    currentBoardData.mcroyaleCards[idx].count = Math.max(1, parseInt(val) || 1);
    renderPreviewSimulator(currentBoardData);
}

function onMcRoyaleGiftChange(idx, selectEl) {
    if (!currentBoardData.mcroyaleCards || !currentBoardData.mcroyaleCards[idx]) return;
    const opt = selectEl.options[selectEl.selectedIndex];
    const giftName = opt.value;
    const giftImg = opt.getAttribute('data-img') || '/images/rose.png';

    currentBoardData.mcroyaleCards[idx].giftName = giftName;
    currentBoardData.mcroyaleCards[idx].giftImage = giftImg;

    const imgEl = document.getElementById(`slotGiftImg_${idx}`);
    if (imgEl) imgEl.src = giftImg.startsWith('http') ? giftImg : `/images/${giftImg}`;
    renderPreviewSimulator(currentBoardData);
}

function addMcRoyaleCardSlot() {
    if (!currentBoardData.mcroyaleCards) currentBoardData.mcroyaleCards = [];
    const newIdx = currentBoardData.mcroyaleCards.length;
    const defaultTypes = ['skeleton_bandana', 'evoker_mage', 'skeleton_cap', 'hog_rider', 'golem_pumpkin'];
    const cardType = defaultTypes[newIdx % defaultTypes.length];

    currentBoardData.mcroyaleCards.push({
        id: Date.now(),
        cardType: cardType,
        count: 1,
        giftName: 'وردة',
        giftImage: '/images/rose.png'
    });

    renderMcRoyaleCardsEditor();
    renderPreviewSimulator(currentBoardData);
    showToast('✨ تمت إضافة خانة بطاقة جديدة', 'success');
}

function deleteMcRoyaleCardSlot(idx) {
    if (!currentBoardData.mcroyaleCards) return;
    currentBoardData.mcroyaleCards.splice(idx, 1);
    renderMcRoyaleCardsEditor();
    renderPreviewSimulator(currentBoardData);
}

async function saveMcRoyaleCardsConfig() {
    try {
        await saveBoardSettings({
            giftDisplayMode: 'mcroyale',
            mcroyaleCards: currentBoardData.mcroyaleCards
        });
        showToast('💾 تم حفظ بطاقات MC Royale وتحديث شاشة البث فورياً!', 'success');
    } catch (e) {
        showToast('فشل حفظ البطاقات', 'error');
    }
}

async function loadGiftsData() {
    try {
        const res = await fetch(`/api/board/${currentUid}`);
        const data = await res.json();
        if (data.success && data.board) {
            const board = data.board;
            currentBoardData = board;
            currentGifts = board.gifts || [];

            // Update UI elements
            if (board.color) {
                const neonColorInput = document.getElementById('neonColor');
                if (neonColorInput) neonColorInput.value = board.color;
                const colorHex = document.getElementById('colorHex');
                if (colorHex) colorHex.textContent = board.color;
            }
            if (board.scale) {
                const scaleSlider = document.getElementById('scaleSlider');
                if (scaleSlider) scaleSlider.value = board.scale;
                const scaleBadge = document.getElementById('scaleValue');
                if (scaleBadge) scaleBadge.textContent = board.scale + '%';
            }
            if (board.glowIntensity !== undefined) {
                const glowSlider = document.getElementById('glowSlider');
                if (glowSlider) glowSlider.value = board.glowIntensity;
                const glowBadge = document.getElementById('glowValue');
                if (glowBadge) glowBadge.textContent = board.glowIntensity + ' px';
            }
            if (board.offsetY !== undefined) {
                const offsetYSlider = document.getElementById('offsetYSlider');
                if (offsetYSlider) offsetYSlider.value = board.offsetY;
                const offsetYBadge = document.getElementById('offsetYValue');
                if (offsetYBadge) offsetYBadge.textContent = board.offsetY + ' px';
            }
            if (board.animationType) {
                const animSelect = document.getElementById('animTypeSelect');
                if (animSelect) animSelect.value = board.animationType;
            }

            // Sync static text mode
            const staticCheck = document.getElementById('textStaticModeCheck');
            if (staticCheck) staticCheck.checked = Boolean(board.textStaticMode);

            // Sync display mode (Classic vs MC Royale Cards)
            switchGiftDisplayMode(board.giftDisplayMode || 'classic', false);

            renderGiftsList();
            renderPreviewSimulator(board);
        }
    } catch (e) {
        console.error('Failed to load gifts data:', e);
    }
}

function renderGiftsList() {
    const listEl = document.getElementById('giftsList');
    const badgeEl = document.getElementById('giftsCountBadge');
    if (!listEl) return;

    badgeEl.textContent = `${currentGifts.length} هدية`;
    listEl.innerHTML = '';

    if (currentGifts.length === 0) {
        listEl.innerHTML = '<div style="text-align:center;color:#94a3b8;padding:20px;">لم تقم بإضافة أي هدايا حتى الآن. ارفع صورة أو اختر من المكتبة أعلاه!</div>';
        return;
    }

    currentGifts.forEach((gift, index) => {
        const row = document.createElement('div');
        row.className = 'gift-row-item';
        const imgUrl = gift.image.startsWith('http') ? gift.image : `/images/${gift.image}`;

        row.innerHTML = `
            <img class="gift-row-img" src="${imgUrl}" alt="${gift.name}" onerror="this.src='/images/rose.png'">
            <input type="text" class="gift-row-input" value="${gift.name}" onchange="updateGiftName(${gift.id}, this.value)">
            <div class="gift-row-actions">
                <button class="btn-mini" onclick="moveGift(${gift.id}, -1)" title="تحريك لأعلى">⬆️</button>
                <button class="btn-mini" onclick="moveGift(${gift.id}, 1)" title="تحريك لأسفل">⬇️</button>
                <button class="btn-mini del" onclick="deleteGift(${gift.id})" title="حذف الهدية">✕</button>
            </div>
        `;
        listEl.appendChild(row);
    });
}

function renderPreviewSimulator(board = {}) {
    const content = document.getElementById('previewOverlayContent');
    if (!content) return;

    content.innerHTML = '';
    const color = board.color || document.getElementById('neonColor')?.value || '#a855f7';
    const align = board.horizontalAlign || 'right';
    content.style.alignItems = align === 'right' ? 'flex-start' : 'flex-end';
    content.style.setProperty('--neon-color', color);

    const isMcRoyale = (board.giftDisplayMode === 'mcroyale') || (currentBoardData && currentBoardData.giftDisplayMode === 'mcroyale');

    if (isMcRoyale) {
        const cards = (board.mcroyaleCards && board.mcroyaleCards.length > 0)
            ? board.mcroyaleCards
            : (currentBoardData && currentBoardData.mcroyaleCards && currentBoardData.mcroyaleCards.length > 0)
                ? currentBoardData.mcroyaleCards
                : [
                    { id: 1, cardType: 'skeleton_bandana', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
                    { id: 2, cardType: 'evoker_mage', count: 1, giftName: 'عطر', giftImage: '/images/perfume.png' },
                    { id: 3, cardType: 'skeleton_cap', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
                    { id: 4, cardType: 'hog_rider', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
                    { id: 5, cardType: 'golem_pumpkin', count: 1, giftName: 'آيس كريم', giftImage: '/images/icecream.png' }
                ];

        const col = document.createElement('div');
        col.style.display = 'flex';
        col.style.flexDirection = 'column';
        col.style.gap = '8px';
        col.style.alignItems = align === 'right' ? 'flex-end' : 'flex-start';

        cards.forEach(card => {
            const item = document.createElement('div');
            item.style.position = 'relative';
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'center';
            item.style.width = '68px';

            const cardSrc = `/images/mcroyale/${card.cardType || 'skeleton_bandana'}.png`;
            const giftSrc = card.giftImage && card.giftImage.startsWith('http') ? card.giftImage : `/images/${card.giftImage || 'rose.png'}`;

            item.innerHTML = `
                <div style="position:absolute; top:-4px; right:-4px; width:22px; height:22px; border-radius:50%; background:#0a0814; border:1.5px solid #ffd700; display:flex; align-items:center; justify-content:center; box-shadow:0 0 6px #ffd700; z-index:5;">
                    <img src="${giftSrc}" style="width:16px; height:16px; object-fit:contain;" onerror="this.src='/images/rose.png'">
                </div>
                <img src="${cardSrc}" style="width:64px; height:auto; object-fit:contain; filter:drop-shadow(0 0 8px rgba(255,30,60,0.9));" onerror="this.src='/images/mcroyale/skeleton_bandana.png'">
                <div style="font-family:'Impact','Arial Black',sans-serif; font-size:18px; font-weight:900; color:#ffe600; -webkit-text-stroke:1px #000; text-shadow:1px 1px 0 #000,-1px -1px 0 #000; margin-top:-6px; z-index:4;">X${card.count || 1}</div>
            `;
            col.appendChild(item);
        });
        content.appendChild(col);
    } else {
        currentGifts.slice(0, 5).forEach(gift => {
            const item = document.createElement('div');
            item.className = 'preview-card-item';
            item.style.borderColor = color;
            item.style.boxShadow = `0 0 15px ${color}66`;

            const imgUrl = gift.image.startsWith('http') ? gift.image : `/images/${gift.image}`;
            item.innerHTML = `
                <img src="${imgUrl}" onerror="this.src='/images/rose.png'">
                <span>${gift.name}</span>
            `;
            content.appendChild(item);
        });
    }
}

async function updateGiftName(id, newName) {
    try {
        await fetch(`/api/gifts/${currentUid}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newName })
        });
        const g = currentGifts.find(x => x.id === id);
        if (g) g.name = newName;
        renderPreviewSimulator();
    } catch (e) {}
}

async function deleteGift(id) {
    if (!confirm('هل تريد حذف هذه الهدية؟')) return;
    try {
        await fetch(`/api/gifts/${currentUid}/${id}`, { method: 'DELETE' });
        currentGifts = currentGifts.filter(x => x.id !== id);
        renderGiftsList();
        renderPreviewSimulator();
        showToast('تم حذف الهدية من اللوحة', 'info');
    } catch (e) {
        showToast('فشل حذف الهدية', 'error');
    }
}

async function moveGift(id, direction) {
    const endpoint = direction === -1 ? 'up' : 'down';
    try {
        const res = await fetch(`/api/gifts/${currentUid}/${id}/${endpoint}`, { method: 'POST' });
        const data = await res.json();
        if (data.success && data.gifts) {
            currentGifts = data.gifts;
            renderGiftsList();
            renderPreviewSimulator();
        }
    } catch (e) {}
}

async function addGiftByUrl() {
    const url = document.getElementById('giftUrlInput').value.trim();
    const name = document.getElementById('giftUrlName').value.trim() || 'هدية جديدة';
    if (!url) {
        showToast('يرجى وضع رابط الصورة أولاً', 'warning');
        return;
    }

    try {
        const res = await fetch(`/api/gifts/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, imageUrl: url })
        });
        const data = await res.json();
        if (data.id) {
            currentGifts.push(data);
            document.getElementById('giftUrlInput').value = '';
            document.getElementById('giftUrlName').value = '';
            renderGiftsList();
            renderPreviewSimulator();
            showToast(`✨ تمت إضافة (${data.name}) بنجاح!`, 'success');
        }
    } catch (e) {
        showToast('فشل إضافة الهدية', 'error');
    }
}

// Static text mode functions
async function saveBoardSettings(settings = {}) {
    try {
        const res = await fetch(`/api/board/${currentUid}/settings`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const data = await res.json();
        if (data.success && data.board) {
            currentBoardData = data.board;
            renderPreviewSimulator(currentBoardData);
        }
    } catch (e) {
        console.error('Failed to save board settings:', e);
    }
}

function onTextStaticModeChange(checked) {
    saveBoardSettings({ textStaticMode: checked });
    showToast(checked ? '📌 تم تفعيل وضع تثبيت النص (الصور فقط متحركة)' : 'تم إلغاء تثبيت النص (الكل متحرك)', 'info');
}

function toggleTextStaticMode() {
    const check = document.getElementById('textStaticModeCheck');
    if (check) {
        check.checked = !check.checked;
        onTextStaticModeChange(check.checked);
    }
}

let allTiktokGifts = [];
let currentPriceFilter = 'all';
let currentSearchQuery = '';

async function loadTiktokGiftsCatalog() {
    try {
        const res = await fetch('/api/tiktok-gifts');
        if (res.ok) {
            const rawGifts = await res.json();
            allTiktokGifts = Array.isArray(rawGifts) ? rawGifts.sort((a, b) => (a.coins || 1) - (b.coins || 1)) : [];
            renderTiktokGiftsCatalog();
            renderMutualExclusionGrid();
        }
    } catch (e) {
        console.error('Failed to load gifts catalog:', e);
    }
}

function setCatalogPriceFilter(filter) {
    currentPriceFilter = filter;
    document.querySelectorAll('#catalogPriceChips .chip').forEach(c => {
        c.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    renderTiktokGiftsCatalog();
}

function onCatalogSearchInput(val) {
    currentSearchQuery = (val || '').trim().toLowerCase();
    renderTiktokGiftsCatalog();
}

function renderTiktokGiftsCatalog() {
    const grid = document.getElementById('tiktokCatalogGrid');
    const countDisplay = document.getElementById('catalogCountDisplay');
    if (!grid) return;

    let filtered = allTiktokGifts;

    // Filter by price
    if (currentPriceFilter === '1') {
        filtered = filtered.filter(g => g.coins === 1);
    } else if (currentPriceFilter === 'lt10') {
        filtered = filtered.filter(g => g.coins > 1 && g.coins < 10);
    } else if (currentPriceFilter === 'lt100') {
        filtered = filtered.filter(g => g.coins >= 10 && g.coins < 100);
    } else if (currentPriceFilter === 'lt1000') {
        filtered = filtered.filter(g => g.coins >= 100 && g.coins < 1000);
    } else if (currentPriceFilter === 'gt1000') {
        filtered = filtered.filter(g => g.coins >= 1000);
    }

    // Filter by search
    if (currentSearchQuery) {
        filtered = filtered.filter(g => 
            g.name.toLowerCase().includes(currentSearchQuery) || 
            String(g.coins).includes(currentSearchQuery)
        );
    }

    if (countDisplay) {
        countDisplay.textContent = `المعروض: ${filtered.length} من أصل ${allTiktokGifts.length} هدية (TikTok مصر)`;
    }

    grid.innerHTML = '';
    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #888; padding: 30px;">لم يتم العثور على هدايا تطابق البحث</div>';
        return;
    }

    // Render all items sorted ascending by coins
    const itemsToRender = filtered;

    itemsToRender.forEach(gift => {
        const card = document.createElement('div');
        card.className = 'tiktok-gift-card';
        card.title = `اضغط لإضافة ${gift.name} (${gift.coins} عملة) إلى الأوفرلاي`;
        card.innerHTML = `
            <img src="${gift.image}" loading="lazy" alt="${escapeHtml(gift.name)}" onerror="this.src='/images/rose.png'">
            <span class="gift-name">${escapeHtml(gift.name)}</span>
            <span class="coin-tag">🪙 ${gift.coins}</span>
        `;

        card.onclick = async () => {
            try {
                const res = await fetch(`/api/gifts/${currentUid}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: gift.name, imageUrl: gift.image })
                });
                const added = await res.json();
                if (added.id) {
                    currentGifts.push(added);
                    renderGiftsList();
                    renderPreviewSimulator();
                    showToast(`🎁 تم إضافة هدية (${gift.name}) بنجاح!`, 'success');
                } else {
                    showToast('تعذر إضافة الهدية', 'error');
                }
            } catch (e) {
                showToast('خطأ أثناء إضافة الهدية', 'error');
            }
        };

        grid.appendChild(card);
    });
}

function populateGiftsLibrary() {
    loadTiktokGiftsCatalog();
}

// File dropzone
const fileInput = document.getElementById('fileInput');
if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        handleFilesSelected(Array.from(e.target.files));
    });
}

function handleFilesSelected(files) {
    pendingFiles = files;
    const box = document.getElementById('pendingBox');
    const saveBtn = document.getElementById('saveAllGiftsBtn');
    box.innerHTML = '';

    if (files.length === 0) {
        saveBtn.style.display = 'none';
        return;
    }

    saveBtn.style.display = 'block';
    files.forEach(f => {
        const img = document.createElement('img');
        img.className = 'pending-thumb';
        img.src = URL.createObjectURL(f);
        box.appendChild(img);
    });
}

async function savePendingGifts() {
    if (pendingFiles.length === 0) return;
    const saveBtn = document.getElementById('saveAllGiftsBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ جاري الرفع والحفظ...';

    for (const f of pendingFiles) {
        const formData = new FormData();
        const baseName = f.name.replace(/\.[^/.]+$/, "");
        formData.append('image', f);
        formData.append('name', baseName);

        try {
            const res = await fetch(`/api/gifts/${currentUid}`, {
                method: 'POST',
                body: formData
            });
            const added = await res.json();
            if (added.id) currentGifts.push(added);
        } catch (e) {}
    }

    pendingFiles = [];
    document.getElementById('pendingBox').innerHTML = '';
    saveBtn.style.display = 'none';
    saveBtn.disabled = false;
    saveBtn.textContent = '💾 حفظ وإضافة كل الصور';

    renderGiftsList();
    renderPreviewSimulator();
}

// Positions & Sliders
async function setPosition(vAlign, offset) {
    try {
        await fetch(`/api/board/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ verticalAlign: vAlign, offsetY: offset })
        });
        document.querySelectorAll('.pos-preset-buttons .btn-pos').forEach(b => b.classList.remove('active'));
        const btn = document.querySelector(`[data-valign="${vAlign}"]`);
        if (btn) btn.classList.add('active');
    } catch (e) {}
}

function resetOffsetY() {
    const slider = document.getElementById('offsetYSlider');
    slider.value = 0;
    slider.dispatchEvent(new Event('input'));
}

async function setHorizontalAlign(align) {
    try {
        await fetch(`/api/board/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ horizontalAlign: align })
        });
        document.getElementById('btnAlignRight').classList.toggle('active', align === 'right');
        document.getElementById('btnAlignLeft').classList.toggle('active', align === 'left');
    } catch (e) {}
}

// ================= SECTION 2: FIRE TEXT ================= //
async function loadFireData() {
    try {
        const res = await fetch(`/api/fire-settings/${currentUid}`);
        const data = await res.json();
        if (data.success && data.settings) {
            fireConfig = { ...fireConfig, ...data.settings };
            document.getElementById('fireTextInput').value = fireConfig.text || 'رابط الدعم بالبايو 🔥';
            document.getElementById('fireFontSizeSlider').value = fireConfig.font_size || 64;
            document.getElementById('fireFontSizeBadge').textContent = (fireConfig.font_size || 64) + ' px';

            // Neon Glow Toggle (خيار خط نيون ولا لا)
            const isNeon = fireConfig.neon_enabled !== false && fireConfig.neon_enabled !== 0;
            toggleFireNeon(isNeon, false);

            document.getElementById('fireNeonStrengthSlider').value = fireConfig.neon_strength || 95;
            document.getElementById('fireNeonStrengthBadge').textContent = (fireConfig.neon_strength || 95) + '%';
            document.getElementById('fireOffsetYSlider').value = fireConfig.offset_y || 0;
            document.getElementById('fireOffsetYBadge').textContent = (fireConfig.offset_y || 0) + ' px';

            // Display Mode: Continuous vs Cycle (يا ثابت يا متحرك)
            const dispMode = fireConfig.display_mode || 'continuous';
            setFireDisplayMode(dispMode);
            if (fireConfig.hold_duration) {
                const s = document.getElementById('fireHoldDurationSlider');
                if (s) s.value = fireConfig.hold_duration;
                const b = document.getElementById('fireHoldDurationBadge');
                if (b) b.textContent = fireConfig.hold_duration + ' ثواني';
            }
            if (fireConfig.loop_interval) {
                const s = document.getElementById('fireLoopIntervalSlider');
                if (s) s.value = fireConfig.loop_interval;
                const b = document.getElementById('fireLoopIntervalBadge');
                if (b) b.textContent = fireConfig.loop_interval + ' ثواني';
            }

            // Colors
            const pri = fireConfig.color || '#ff1e00';
            const sec = fireConfig.shine_color || '#ffd700';
            const priInput = document.getElementById('fireColorInput');
            const secInput = document.getElementById('fireSecColorInput');
            if (priInput) priInput.value = pri;
            if (secInput) secInput.value = sec;
            const priHex = document.getElementById('fireColorHex');
            const secHex = document.getElementById('fireSecColorHex');
            if (priHex) { priHex.textContent = pri; priHex.style.color = pri; }
            if (secHex) { secHex.textContent = sec; secHex.style.color = sec; }

            // Frame style (خيارات الإطار)
            const bannerFrame = fireConfig.banner_style || 'transparent';
            document.querySelectorAll('#fireFrameChipsGrid .style-chip').forEach(c => {
                c.classList.toggle('active', c.dataset.framestyle === bannerFrame);
            });

            // Animation style (نمط ظهور النص)
            const animStyle = fireConfig.animation_style || 'slide_up';
            document.querySelectorAll('#fireAnimationChipsGrid .style-chip').forEach(c => {
                c.classList.toggle('active', c.dataset.animstyle === animStyle);
            });

            // Smoke toggle (يا اشغله يا لا)
            const isSmoke = fireConfig.smoke_enabled !== false && fireConfig.smoke_enabled !== 0 && fireConfig.smoke_enabled !== 'false';
            // Display Type: 'text' vs 'image'
            const dispType = fireConfig.display_type || 'text';
            setFireDisplayType(dispType, false);

            // Card Edge Pos
            const cardPos = fireConfig.card_position || 'edge-right';
            setCardEdgePos(cardPos);

            // Card Image & Presets
            if (fireConfig.card_image) {
                const urlInput = document.getElementById('cardImageUrlInput');
                if (urlInput) urlInput.value = fireConfig.card_image;
                const thumb = document.getElementById('customCardThumb');
                if (thumb) thumb.src = fireConfig.card_image;
            }
            if (fireConfig.card_width) {
                const s = document.getElementById('cardWidthSlider');
                if (s) s.value = fireConfig.card_width;
                const b = document.getElementById('cardWidthBadge');
                if (b) b.textContent = fireConfig.card_width + ' px';
            }
            if (fireConfig.card_badge) {
                const b = document.getElementById('cardBadgeInput');
                if (b) b.value = fireConfig.card_badge;
            }
            if (fireConfig.card_title) {
                const t = document.getElementById('cardTitleInput');
                if (t) t.value = fireConfig.card_title;
            }
        }
    } catch (e) {}
}

function setFireDisplayType(type, updateSim = true) {
    fireConfig.display_type = type;
    const btnT = document.getElementById('btnDispTypeText');
    const btnI = document.getElementById('btnDispTypeImage');
    if (btnT) btnT.classList.toggle('active', type === 'text');
    if (btnI) btnI.classList.toggle('active', type === 'image');

    const textBox = document.getElementById('textModeSettingsBox');
    const cardBox = document.getElementById('cardModeSettingsBox');
    if (textBox) textBox.style.display = type === 'text' ? 'block' : 'none';
    if (cardBox) cardBox.style.display = type === 'image' ? 'block' : 'none';

    if (updateSim) {
        updateFireSimLive();
        showToast(type === 'image' ? '🃏 تم تفعيل وضع البطاقة/الصورة من طرف الشاشة' : '✍️ تم تفعيل وضع نص النيون', 'info');
    }
}

function setCardEdgePos(pos) {
    fireConfig.card_position = pos;
    const btnR = document.getElementById('btnCardEdgeRight');
    const btnL = document.getElementById('btnCardEdgeLeft');
    const btnC = document.getElementById('btnCardEdgeCenter');
    if (btnR) btnR.classList.toggle('active', pos === 'edge-right');
    if (btnL) btnL.classList.toggle('active', pos === 'edge-left');
    if (btnC) btnC.classList.toggle('active', pos === 'center');
    updateFireSimLive();
}

function selectCardPreset(url, badge, title) {
    fireConfig.card_image = url;
    fireConfig.card_badge = badge;
    fireConfig.card_title = title;

    const urlInput = document.getElementById('cardImageUrlInput');
    if (urlInput) urlInput.value = url;
    const thumb = document.getElementById('customCardThumb');
    if (thumb) thumb.src = url;
    const badgeInput = document.getElementById('cardBadgeInput');
    if (badgeInput) badgeInput.value = badge;
    const titleInput = document.getElementById('cardTitleInput');
    if (titleInput) titleInput.value = title;

    document.querySelectorAll('#cardPresetsGrid .card-preset-item').forEach(item => {
        const img = item.querySelector('img');
        item.classList.toggle('active', img && img.src.includes(url));
    });

    updateFireSimLive();
    showToast(`🃏 تم اختيار ${title || 'البطاقة'} بنجاح!`, 'success');
}

function onCardUrlInput(val) {
    fireConfig.card_image = val.trim();
    const thumb = document.getElementById('customCardThumb');
    if (thumb) thumb.src = val.trim();
    updateFireSimLive();
}

function onCardWidthChange(val) {
    fireConfig.card_width = parseInt(val) || 220;
    const b = document.getElementById('cardWidthBadge');
    if (b) b.textContent = val + ' px';
    updateFireSimLive();
}

function onCardBadgeChange(val) {
    fireConfig.card_badge = val.trim();
    updateFireSimLive();
}

function onCardTitleChange(val) {
    fireConfig.card_title = val.trim();
    updateFireSimLive();
}

function setFireSmokeEnabled(enabled, updateSim = true) {
    fireConfig.smoke_enabled = !!enabled;
    const btnOn = document.getElementById('btnSmokeOn');
    const btnOff = document.getElementById('btnSmokeOff');
    if (btnOn) btnOn.classList.toggle('active', !!enabled);
    if (btnOff) btnOff.classList.toggle('active', !enabled);
    if (updateSim) updateFireSimLive();
}

function toggleFireNeon(enabled, updateSim = true) {
    fireConfig.neon_enabled = !!enabled;
    const btnOn = document.getElementById('btnNeonOn');
    const btnOff = document.getElementById('btnNeonOff');
    if (btnOn) btnOn.classList.toggle('active', !!enabled);
    if (btnOff) btnOff.classList.toggle('active', !enabled);

    const strengthBox = document.getElementById('neonStrengthBox');
    if (strengthBox) {
        strengthBox.style.opacity = enabled ? '1' : '0.4';
        strengthBox.style.pointerEvents = enabled ? 'auto' : 'none';
    }

    if (updateSim) {
        updateFireSimLive();
        showToast(enabled ? '💡 تم تفعيل توهج خط النيون' : '⚪ تم تعطيل توهج النيون (خط ناعم كلاسيكي)', 'info');
    }
}

function onFireColorChange(val) {
    fireConfig.color = val;
    const hex = document.getElementById('fireColorHex');
    if (hex) { hex.textContent = val; hex.style.color = val; }
    updateFireSimLive();
}

function onFireSecColorChange(val) {
    fireConfig.shine_color = val;
    const hex = document.getElementById('fireSecColorHex');
    if (hex) { hex.textContent = val; hex.style.color = val; }
    updateFireSimLive();
}

function applyFirePalette(pri, sec) {
    fireConfig.color = pri;
    fireConfig.shine_color = sec;
    const priInput = document.getElementById('fireColorInput');
    const secInput = document.getElementById('fireSecColorInput');
    if (priInput) priInput.value = pri;
    if (secInput) secInput.value = sec;
    const priHex = document.getElementById('fireColorHex');
    const secHex = document.getElementById('fireSecColorHex');
    if (priHex) { priHex.textContent = pri; priHex.style.color = pri; }
    if (secHex) { secHex.textContent = sec; secHex.style.color = sec; }

    document.querySelectorAll('#firePaletteChips .chip').forEach(c => c.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');

    updateFireSimLive();
    showToast(`🎨 تم تفعيل بالتة الألوان بنجاح!`, 'info');
}

function setFireBannerFrame(style) {
    fireConfig.banner_style = style;
    document.querySelectorAll('#fireFrameChipsGrid .style-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.framestyle === style);
    });
    updateFireSimLive();
    if (style === 'transparent') {
        showToast('✨ تم إزالة الإطار بالكامل (نص حر شفاف)', 'info');
    } else {
        showToast(`🖼️ تم تفعيل الإطار بنجاح`, 'info');
    }
}

function setFireAnimationStyle(style) {
    fireConfig.animation_style = style;
    document.querySelectorAll('#fireAnimationChipsGrid .style-chip').forEach(c => {
        c.classList.toggle('active', c.dataset.animstyle === style);
    });
    updateFireSimLive();
    showToast(`🎭 تم تفعيل أنيميشن النص: ${style}`, 'info');
}

function updateFireSimLive() {
    const iframe = document.getElementById('fireSimIframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'fire_settings_update',
            settings: fireConfig
        }, '*');
    }
}

function testFireSmokeCycle() {
    const iframe = document.getElementById('fireSimIframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'test_action',
            action: 'smoke_cycle'
        }, '*');
    }
    showToast('🌪️ جاري تجربة هبوط الدخان ومسح النص في المحاكي...', 'info');
}

function setFireDisplayMode(mode) {
    fireConfig.display_mode = mode;
    const btnC = document.getElementById('btnModeContinuous');
    const btnL = document.getElementById('btnModeCycle');
    if (btnC) btnC.classList.toggle('active', mode === 'continuous');
    if (btnL) btnL.classList.toggle('active', mode === 'cycle');

    const cycleBox = document.getElementById('fireCycleControlsBox');
    if (cycleBox) {
        cycleBox.style.display = (mode === 'cycle') ? 'block' : 'none';
    }
    updateFireSimLive();
}

function onFireHoldDurationChange(val) {
    fireConfig.hold_duration = parseFloat(val);
    const b = document.getElementById('fireHoldDurationBadge');
    if (b) b.textContent = val + ' ثواني';
}

function onFireLoopIntervalChange(val) {
    fireConfig.loop_interval = parseFloat(val);
    const b = document.getElementById('fireLoopIntervalBadge');
    if (b) b.textContent = val + ' ثواني';
}

async function saveFireSettingsAction() {
    fireConfig.text = document.getElementById('fireTextInput').value.trim();
    fireConfig.font_size = parseInt(document.getElementById('fireFontSizeSlider').value);
    fireConfig.neon_strength = parseInt(document.getElementById('fireNeonStrengthSlider').value);
    fireConfig.offset_y = parseInt(document.getElementById('fireOffsetYSlider').value);

    // Card fields
    const cardUrlInp = document.getElementById('cardImageUrlInput');
    if (cardUrlInp && cardUrlInp.value.trim()) fireConfig.card_image = cardUrlInp.value.trim();
    const cardWidthInp = document.getElementById('cardWidthSlider');
    if (cardWidthInp) fireConfig.card_width = parseInt(cardWidthInp.value) || 220;
    const cardBadgeInp = document.getElementById('cardBadgeInput');
    if (cardBadgeInp) fireConfig.card_badge = cardBadgeInp.value.trim();
    const cardTitleInp = document.getElementById('cardTitleInput');
    if (cardTitleInp) fireConfig.card_title = cardTitleInp.value.trim();

    const holdSlider = document.getElementById('fireHoldDurationSlider');
    if (holdSlider) fireConfig.hold_duration = parseFloat(holdSlider.value) || 6;
    const loopSlider = document.getElementById('fireLoopIntervalSlider');
    if (loopSlider) fireConfig.loop_interval = parseFloat(loopSlider.value) || 8;

    try {
        const res = await fetch(`/api/fire-settings/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fireConfig)
        });
        const data = await res.json();
        if (data.success) {
            updateFireSimLive();
            reloadFireSim();
            showToast('🔥 تم حفظ ونشر إعدادات الشريط لـ OBS بنجاح!', 'success');
        }
    } catch (e) {
        showToast('خطأ في حفظ إعدادات الشريط', 'error');
    }
}

function setFirePos(pos) {
    fireConfig.position_v = pos;
    document.querySelectorAll('#fireSection .btn-pos').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    updateFireSimLive();
}

function reloadFireSim() {
    const iframe = document.getElementById('fireSimIframe');
    if (iframe) iframe.src = `/fire-text.html?uid=${currentUid}&t=${Date.now()}`;
}

// ================= SECTION 3: CAMERA FRAMES ================= //
async function loadCameraData() {
    try {
        const res = await fetch(`/api/camera-settings/${currentUid}`);
        const data = await res.json();
        if (data.success && data.settings) {
            cameraConfig = { ...cameraConfig, ...data.settings };
            applyCameraConfigToUI();
            const iframe = document.getElementById('camSimIframe');
            if (iframe && !iframe.src.includes('uid=')) {
                iframe.src = `/camera-overlay.html?uid=${currentUid}`;
            }
            const extLink = document.getElementById('camPreviewExternalLink');
            if (extLink) extLink.href = `/camera-overlay.html?uid=${currentUid}`;
        }
    } catch (e) {}
}

function applyCameraConfigToUI() {
    // Style cards
    document.querySelectorAll('.cam-style-card').forEach(card => {
        card.classList.toggle('active', card.dataset.camstyle === cameraConfig.style);
    });

    // Tag
    document.getElementById('camTagInput').value = cameraConfig.tag || '';
    document.getElementById('camGlowSlider').value = cameraConfig.glow || 24;
    document.getElementById('camGlowBadge').textContent = (cameraConfig.glow || 24) + ' px';
    document.getElementById('camRadiusSlider').value = cameraConfig.radius || 18;
    document.getElementById('camRadiusBadge').textContent = (cameraConfig.radius || 18) + ' px';
    document.getElementById('camThicknessSlider').value = cameraConfig.thickness || 4;
    document.getElementById('camThicknessBadge').textContent = (cameraConfig.thickness || 4) + ' px';

    // Broadcast update to live simulator iframe
    updateCamSimIframe();
}

function setCamRatio(ratio) {
    cameraConfig.ratio = ratio;
    document.querySelectorAll('#cameraSection .pos-preset-buttons .btn-pos').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    updateCamSimIframe();
}

function setCamTagPos(pos) {
    cameraConfig.tagPos = pos;
    document.getElementById('btnTagBottom').classList.toggle('active', pos === 'bottom');
    document.getElementById('btnTagTop').classList.toggle('active', pos === 'top');
    document.getElementById('btnTagNone').classList.toggle('active', pos === 'none');
    updateCamSimIframe();
}

function updateCamSimIframe() {
    const iframe = document.getElementById('camSimIframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'UPDATE_CAM_FRAME',
            config: cameraConfig
        }, '*');
    }
}

async function saveCameraSettingsAction() {
    const activeCard = document.querySelector('.cam-style-card.active');
    if (activeCard && activeCard.dataset.camstyle) {
        cameraConfig.style = activeCard.dataset.camstyle;
    }
    const tagInput = document.getElementById('camTagInput');
    if (tagInput) cameraConfig.tag = tagInput.value.trim();
    const glowSlider = document.getElementById('camGlowSlider');
    if (glowSlider) cameraConfig.glow = parseInt(glowSlider.value) || 24;
    const radSlider = document.getElementById('camRadiusSlider');
    if (radSlider) cameraConfig.radius = parseInt(radSlider.value) || 18;
    const thkSlider = document.getElementById('camThicknessSlider');
    if (thkSlider) cameraConfig.thickness = parseInt(thkSlider.value) || 4;

    try {
        const res = await fetch(`/api/camera-settings/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cameraConfig)
        });
        const data = await res.json();
        if (data.success) {
            updateCamSimIframe();
            const iframe = document.getElementById('camSimIframe');
            if (iframe) iframe.src = `/camera-overlay.html?uid=${currentUid}&t=${Date.now()}`;
            showToast('📷 تم حفظ إعدادات إطار الكاميرا وتحديث OBS مباشرة!', 'success');
        }
    } catch (e) {
        showToast('فشل حفظ إعدادات الكاميرا', 'error');
    }
}

// ================= SECTION 4: SCOREBOARD ================= //
async function loadScoreboardData() {
    try {
        const res = await fetch(`/api/scoreboard/${currentUid}`);
        const data = await res.json();
        if (data.success && data.board) {
            const b = data.board;
            document.getElementById('sbTitleInput').value = b.title || '🏆 تحدي الأساطير 🏆';
            document.getElementById('sbTeamAName').value = b.team_a_name || 'المخربين';
            document.getElementById('sbTeamBName').value = b.team_b_name || 'المساعدين';

            if (b.team_a_color) {
                const colA = document.getElementById('sbColorA');
                const tagA = document.getElementById('sbTagA');
                if (colA) colA.value = b.team_a_color;
                if (tagA) tagA.style.background = b.team_a_color;
            }
            if (b.team_b_color) {
                const colB = document.getElementById('sbColorB');
                const tagB = document.getElementById('sbTagB');
                if (colB) colB.value = b.team_b_color;
                if (tagB) tagB.style.background = b.team_b_color;
            }

            const scA = b.team_a_score || 0;
            const scB = b.team_b_score || 0;
            document.getElementById('sbScoreADisplay').textContent = scA >= 1000 ? scA.toLocaleString() : scA;
            document.getElementById('sbScoreBDisplay').textContent = scB >= 1000 ? scB.toLocaleString() : scB;
        }

        // Update trigger URLs and simulator on screen
        const origin = window.location.origin;
        const trigA = document.getElementById('trigAUrl');
        const trigB = document.getElementById('trigBUrl');
        const webh = document.getElementById('webhookUrl');
        if (trigA) trigA.textContent = `${origin}/trigger?team=a&action=add&value=1&id=${currentUid}`;
        if (trigB) trigB.textContent = `${origin}/trigger?team=b&action=add&value=1&id=${currentUid}`;
        if (webh) webh.textContent = `${origin}/webhook/tikfinity?id=${currentUid}`;

        const sbSim = document.getElementById('sbSimIframe');
        if (sbSim && (!sbSim.src || !sbSim.src.includes(`id=${currentUid}`))) {
            sbSim.src = `/scoreboard-overlay.html?id=${currentUid}`;
        }
        const sbExt = document.getElementById('sbPreviewExternalLink');
        if (sbExt) sbExt.href = `/scoreboard-overlay.html?id=${currentUid}`;
    } catch (e) {}
}

// Web Audio chime for Scoreboard adjustments
let sbAudioCtx = null;
let sbSoundEnabled = true;
let sbHotkeyTargetTeam = 'a'; // 'a' or 'b'

function playScoreChime(type = 'up') {
    if (!sbSoundEnabled) return;

    // Try HTML5 Audio file playback first (crisp authentic sound)
    try {
        const soundSrc = type === 'up' ? '/sounds/score_up.wav' : '/sounds/score_down.wav';
        const snd = new Audio(soundSrc);
        snd.volume = 0.85;
        const playPromise = snd.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                return;
            }).catch(() => {
                playSynthChime(type);
            });
            return;
        }
    } catch (e) {
        // Fallback to synthesizer
    }

    playSynthChime(type);
}

function playSynthChime(type = 'up') {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!sbAudioCtx) {
            sbAudioCtx = new AudioContext();
        }
        if (sbAudioCtx.state === 'suspended') {
            sbAudioCtx.resume();
        }
        const ctx = sbAudioCtx;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'up') {
            // Ascending bright chime (D5 -> A5)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now);
            osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.12);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else {
            // Descending deeper chime (A4 -> C4)
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440.0, now);
            osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.15);
            gain.gain.setValueAtTime(0.32, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc.start(now);
            osc.stop(now + 0.28);
        }
    } catch (e) {
        console.warn('Audio chime error:', e);
    }
}

function setSbHotkeyTargetTeam(team) {
    sbHotkeyTargetTeam = team === 'b' ? 'b' : 'a';
    const btnA = document.getElementById('sbHotkeyTeamA');
    const btnB = document.getElementById('sbHotkeyTeamB');
    if (btnA) btnA.classList.toggle('active', sbHotkeyTargetTeam === 'a');
    if (btnB) btnB.classList.toggle('active', sbHotkeyTargetTeam === 'b');
    const teamName = sbHotkeyTargetTeam === 'a' 
        ? (document.getElementById('sbTeamAName')?.value || 'الفريق الأول') 
        : (document.getElementById('sbTeamBName')?.value || 'الفريق الثاني');
    showToast(`🎯 تم تحديد ${teamName} للتحكم بالاختصارات (Alt + / Alt -)`, 'info');
}

function toggleSbSound() {
    sbSoundEnabled = !sbSoundEnabled;
    const icon = document.getElementById('sbSoundIcon');
    const btn = document.getElementById('btnToggleSbSound');
    if (icon) icon.textContent = sbSoundEnabled ? '🔔 الصوت مفعل' : '🔕 الصوت صامت';
    if (btn) {
        btn.style.borderColor = sbSoundEnabled ? '#ffd700' : 'rgba(255,255,255,0.2)';
        btn.style.opacity = sbSoundEnabled ? '1' : '0.6';
    }
    if (sbSoundEnabled) {
        playScoreChime('up');
        showToast('🔔 تم تفعيل التنبيه الصوتي عند تعديل النتيجة', 'success');
    } else {
        showToast('🔕 تم كتم صوت النتيجة', 'info');
    }
}

let lastSbScoreAdjustTs = 0;

async function adjustSbScore(team, delta) {
    const now = Date.now();
    if (now - lastSbScoreAdjustTs < 120) return;
    lastSbScoreAdjustTs = now;

    const cleanDelta = Number(delta) > 0 ? 1 : -1;
    playScoreChime(cleanDelta > 0 ? 'up' : 'down');
    try {
        const res = await fetch(`/api/scoreboard/${currentUid}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team, delta: cleanDelta })
        });
        const data = await res.json();
        if (data.success && data.board) {
            const scA = data.board.team_a_score || 0;
            const scB = data.board.team_b_score || 0;
            document.getElementById('sbScoreADisplay').textContent = scA >= 1000 ? scA.toLocaleString() : scA;
            document.getElementById('sbScoreBDisplay').textContent = scB >= 1000 ? scB.toLocaleString() : scB;
        }
    } catch (e) {}
}

window.triggerGlobalHotkeyScore = function(team, delta) {
    const cleanTeam = team === 'b' ? 'b' : 'a';
    const cleanDelta = Number(delta) > 0 ? 1 : -1;
    sbHotkeyTargetTeam = cleanTeam;
    adjustSbScore(cleanTeam, cleanDelta);
    const teamName = cleanTeam === 'a'
        ? (document.getElementById('sbTeamAName')?.value || 'الفريق الأول (الأحمر)')
        : (document.getElementById('sbTeamBName')?.value || 'الفريق الثاني');
    const sign = cleanDelta > 0 ? '+1' : '-1';
    showToast(`🎮 اختصار سريع: ${sign} نقطة لـ (${teamName})`, cleanDelta > 0 ? 'success' : 'info');
};

async function setSbDirectScore(team) {
    const inputId = team === 'a' ? 'sbScoreACustom' : 'sbScoreBCustom';
    const input = document.getElementById(inputId);
    if (!input || input.value === '') return;
    const val = parseInt(input.value);
    if (isNaN(val) || val < 0) return;

    try {
        const res = await fetch(`/api/scoreboard/${currentUid}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team, score: val })
        });
        const data = await res.json();
        if (data.success && data.board) {
            const scA = data.board.team_a_score || 0;
            const scB = data.board.team_b_score || 0;
            document.getElementById('sbScoreADisplay').textContent = scA >= 1000 ? scA.toLocaleString() : scA;
            document.getElementById('sbScoreBDisplay').textContent = scB >= 1000 ? scB.toLocaleString() : scB;
            showToast(`⚡ تم ضبط نتيجة الفريق ${team === 'a' ? 'الأول' : 'الثاني'} على: ${val.toLocaleString()}`, 'success');
            input.value = '';
        }
    } catch (e) {
        showToast('خطأ في تعيين النتيجة', 'error');
    }
}

async function resetSbScores() {
    if (!confirm('هل تريد تصفير نتيجة المباراة إلى 0 - 0؟')) return;
    try {
        const res = await fetch(`/api/scoreboard/${currentUid}/reset`, { method: 'POST' });
        const data = await res.json();
        if (data.success && data.board) {
            document.getElementById('sbScoreADisplay').textContent = 0;
            document.getElementById('sbScoreBDisplay').textContent = 0;
            showToast('🔄 تم تصفير النتيجة بنجاح', 'info');
        }
    } catch (e) {}
}

async function saveSbTitles() {
    const title = document.getElementById('sbTitleInput').value.trim();
    const a = document.getElementById('sbTeamAName').value.trim();
    const b = document.getElementById('sbTeamBName').value.trim();
    const colorA = document.getElementById('sbColorA')?.value || '#ff2a4a';
    const colorB = document.getElementById('sbColorB')?.value || '#22ff88';

    try {
        const res = await fetch(`/api/scoreboard/${currentUid}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                team_a_name: a,
                team_b_name: b,
                team_a_color: colorA,
                team_b_color: colorB
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast('⚡ تم تحديث أسماء وألوان الفرق وعنوان لوحة النتائج!', 'success');
        }
    } catch (e) {}
}

function onSbColorChange(team, color) {
    if (team === 'a') {
        const tag = document.getElementById('sbTagA');
        if (tag) tag.style.background = color;
    } else {
        const tag = document.getElementById('sbTagB');
        if (tag) tag.style.background = color;
    }
    saveSbTitles();
}

function applySbPalette(colA, colB) {
    const elA = document.getElementById('sbColorA');
    const elB = document.getElementById('sbColorB');
    const tagA = document.getElementById('sbTagA');
    const tagB = document.getElementById('sbTagB');
    if (elA) elA.value = colA;
    if (elB) elB.value = colB;
    if (tagA) tagA.style.background = colA;
    if (tagB) tagB.style.background = colB;
    saveSbTitles();
}

function copyTriggerLink(team, val) {
    const origin = window.location.origin;
    const url = `${origin}/trigger?team=${team}&action=add&value=${val}&id=${currentUid}`;
    navigator.clipboard.writeText(url);
    showToast(`📋 تم نسخ رابط التراجر للفريق ${team === 'a' ? 'الأحمر' : 'الأخضر'}:\n${url}`, 'copy');
}

function copyWebhookLink() {
    const origin = window.location.origin;
    const url = `${origin}/webhook/tikfinity?id=${currentUid}`;
    navigator.clipboard.writeText(url);
    showToast(`📋 تم نسخ رابط ويب هوك تيك فينيتي:\n${url}`, 'copy');
}

// ================= SECTION: هدايا تيك توك 2 (DUAL TEAM GIFTS) ================= //
let currentTeamGifts = {
    team1: {
        title: 'المساعدين',
        color: '#22ff88',
        icon: '💚',
        imageOnlyAnimation: true,
        gifts: [
            { id: 101, name: 'تيربو', image: 'rose.png' },
            { id: 102, name: 'حمايه', image: '1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
            { id: 103, name: 'بوابه', image: 'donut.png' },
            { id: 104, name: 'اسرع لاعب', image: '1791198042522-9f8bd92363c400c284179f6719b6ba9c~tplv-obj.webp' }
        ]
    },
    team2: {
        title: 'المخربين',
        color: '#ff2a4a',
        icon: '🔥',
        imageOnlyAnimation: true,
        gifts: [
            { id: 201, name: 'صاروخ', image: 'perfume.png' },
            { id: 202, name: 'نيزك', image: '1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
            { id: 203, name: 'تبطئ الاعبين', image: '1791197915043-374dfe46d5b09ce1db19be06202d34f5.png~tplv-obj.webp' },
            { id: 204, name: 'نقل اسطوري', image: '1791198055544-79a02148079526539f7599150da9fd28.png~tplv-obj.webp' }
        ]
    }
};

let activeTargetTeam = 'team1';

async function loadTeamGiftsData() {
    try {
        const res = await fetch(`/api/team-gifts/${currentUid}`);
        const data = await res.json();
        if (data.success && data.teamGifts) {
            currentTeamGifts = data.teamGifts;
            renderTeamGiftsUI();
        }
    } catch (e) {
        console.error('Failed to load team gifts:', e);
    }
}

function normalizeImgPath(img) {
    if (!img) return '';
    return img.replace(/^\/images\//, '').replace(/^images\//, '');
}

function renderTeamGiftsUI() {
    // 1. Team 1 Controls
    const t1 = currentTeamGifts.team1 || { title: 'المساعدين', color: '#22ff88', gifts: [] };
    const t1Title = document.getElementById('team1TitleInput');
    const t1Color = document.getElementById('team1ColorInput');
    const t1Hex = document.getElementById('team1ColorHex');
    const t1Check = document.getElementById('team1ImgOnlyCheck');
    const t1List = document.getElementById('team1AssignedList');
    const t1Badge = document.getElementById('team1CountBadge');

    if (t1Title) t1Title.value = t1.title;
    if (t1Color) t1Color.value = t1.color;
    if (t1Hex) { t1Hex.textContent = t1.color; t1Hex.style.color = t1.color; }
    if (t1Check) t1Check.checked = t1.imageOnlyAnimation !== false;
    if (t1Badge) t1Badge.textContent = `${t1.gifts.length} هدية`;

    if (t1List) {
        t1List.innerHTML = '';
        if (t1.gifts.length === 0) {
            t1List.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:15px;">لا توجد هدايا مخصصة للفريق 1 حتى الآن</div>';
        } else {
            t1.gifts.forEach((g, idx) => {
                const item = document.createElement('div');
                item.className = 'team-gift-assigned-item';
                const imgSrc = g.image.startsWith('http') || g.image.startsWith('/') ? g.image : `/images/${g.image}`;
                item.innerHTML = `
                    <div class="team-gift-meta-item">
                        <img src="${imgSrc}" alt="${escapeHtml(g.name)}" onerror="this.src='/images/rose.png'">
                        <span>${escapeHtml(g.name)}</span>
                    </div>
                    <button class="btn-remove-team-gift" onclick="removeGiftFromTeam('team1', ${idx})" title="حذف">✕</button>
                `;
                t1List.appendChild(item);
            });
        }
    }

    // 2. Team 2 Controls
    const t2 = currentTeamGifts.team2 || { title: 'المخربين', color: '#ff2a4a', gifts: [] };
    const t2Title = document.getElementById('team2TitleInput');
    const t2Color = document.getElementById('team2ColorInput');
    const t2Hex = document.getElementById('team2ColorHex');
    const t2Check = document.getElementById('team2ImgOnlyCheck');
    const t2List = document.getElementById('team2AssignedList');
    const t2Badge = document.getElementById('team2CountBadge');

    if (t2Title) t2Title.value = t2.title;
    if (t2Color) t2Color.value = t2.color;
    if (t2Hex) { t2Hex.textContent = t2.color; t2Hex.style.color = t2.color; }
    if (t2Check) t2Check.checked = t2.imageOnlyAnimation !== false;
    if (t2Badge) t2Badge.textContent = `${t2.gifts.length} هدية`;

    if (t2List) {
        t2List.innerHTML = '';
        if (t2.gifts.length === 0) {
            t2List.innerHTML = '<div style="color:#94a3b8; font-size:12px; text-align:center; padding:15px;">لا توجد هدايا مخصصة للفريق 2 حتى الآن</div>';
        } else {
            t2.gifts.forEach((g, idx) => {
                const item = document.createElement('div');
                item.className = 'team-gift-assigned-item';
                const imgSrc = g.image.startsWith('http') || g.image.startsWith('/') ? g.image : `/images/${g.image}`;
                item.innerHTML = `
                    <div class="team-gift-meta-item">
                        <img src="${imgSrc}" alt="${escapeHtml(g.name)}" onerror="this.src='/images/rose.png'">
                        <span>${escapeHtml(g.name)}</span>
                    </div>
                    <button class="btn-remove-team-gift" onclick="removeGiftFromTeam('team2', ${idx})" title="حذف">✕</button>
                `;
                t2List.appendChild(item);
            });
        }
    }

    // Update preview links with UID
    const p1 = document.getElementById('team1PreviewLink');
    if (p1) p1.href = `/overlay-team.html?team=1&uid=${currentUid}`;
    const p2 = document.getElementById('team2PreviewLink');
    if (p2) p2.href = `/overlay-team.html?team=2&uid=${currentUid}`;

    // 3. Render Mutual Exclusion Library Chips
    renderMutualExclusionGrid();
}

let teamGiftsSearchQuery = '';
let teamGiftsPriceFilter = 'all';

function onTeamGiftsSearchInput(val) {
    teamGiftsSearchQuery = (val || '').trim().toLowerCase();
    renderMutualExclusionGrid();
}

function setTeamGiftsPriceFilter(filter) {
    teamGiftsPriceFilter = filter;
    document.querySelectorAll('#teamGiftsPriceChips .chip').forEach(c => c.classList.remove('active'));
    if (window.event && window.event.target) window.event.target.classList.add('active');
    renderMutualExclusionGrid();
}

function renderMutualExclusionGrid() {
    const grid = document.getElementById('teamGiftsLibraryGrid');
    const countBadge = document.getElementById('teamGiftsFilteredCount');
    if (!grid) return;

    grid.innerHTML = '';

    const t1Images = new Set((currentTeamGifts.team1?.gifts || []).map(g => normalizeImgPath(g.image)));
    const t2Images = new Set((currentTeamGifts.team2?.gifts || []).map(g => normalizeImgPath(g.image)));

    // Collect ALL gifts deduplicated
    const librarySource = [];
    const seenNorms = new Set();

    POPULAR_GIFTS.forEach(g => {
        const norm = normalizeImgPath(g.image);
        if (!seenNorms.has(norm)) {
            seenNorms.add(norm);
            librarySource.push({ name: g.name, image: g.image, coins: g.coins || 1 });
        }
    });

    if (Array.isArray(allTiktokGifts) && allTiktokGifts.length > 0) {
        allTiktokGifts.forEach(g => {
            const norm = normalizeImgPath(g.image);
            if (!seenNorms.has(norm)) {
                seenNorms.add(norm);
                librarySource.push({
                    name: g.name,
                    image: g.image,
                    coins: g.coins || g.diamonds || 1
                });
            }
        });
    }
    // Sort strictly from 1 coin to highest
    librarySource.sort((a, b) => (a.coins || 1) - (b.coins || 1));

    // Filter by search & price
    let filtered = librarySource;
    if (teamGiftsPriceFilter === '1') {
        filtered = filtered.filter(g => g.coins === 1);
    } else if (teamGiftsPriceFilter === 'lt10') {
        filtered = filtered.filter(g => g.coins > 1 && g.coins < 10);
    } else if (teamGiftsPriceFilter === 'lt100') {
        filtered = filtered.filter(g => g.coins >= 10 && g.coins < 100);
    } else if (teamGiftsPriceFilter === 'lt1000') {
        filtered = filtered.filter(g => g.coins >= 100 && g.coins < 1000);
    } else if (teamGiftsPriceFilter === 'gt1000') {
        filtered = filtered.filter(g => g.coins >= 1000);
    }

    if (teamGiftsSearchQuery) {
        filtered = filtered.filter(g =>
            (g.name || '').toLowerCase().includes(teamGiftsSearchQuery) ||
            String(g.coins).includes(teamGiftsSearchQuery)
        );
    }

    if (countBadge) {
        countBadge.textContent = `معروض ${filtered.length} من أصل ${librarySource.length} هدية`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #94a3b8; padding: 25px;">لا توجد هدايا مطابقة لبحثك</div>';
        return;
    }

    // Render chips
    filtered.forEach(gift => {
        const norm = normalizeImgPath(gift.image);
        const inTeam1 = t1Images.has(norm);
        const inTeam2 = t2Images.has(norm);

        const chip = document.createElement('div');
        chip.className = 'exclusion-chip';

        let isBlocked = false;
        let statusBadge = '';

        if (activeTargetTeam === 'team1') {
            if (inTeam2) {
                isBlocked = true;
                chip.classList.add('disabled');
                statusBadge = '<span style="font-size:10px; color:#ff2a4a;">[في الفريق 2]</span>';
            } else if (inTeam1) {
                chip.classList.add('selected-current');
                statusBadge = '<span style="font-size:10px; color:#22ff88;">✓ مضافة</span>';
            }
        } else {
            if (inTeam1) {
                isBlocked = true;
                chip.classList.add('disabled');
                statusBadge = '<span style="font-size:10px; color:#22ff88;">[في الفريق 1]</span>';
            } else if (inTeam2) {
                chip.classList.add('selected-current');
                statusBadge = '<span style="font-size:10px; color:#ff2a4a;">✓ مضافة</span>';
            }
        }

        chip.innerHTML = `
            <img src="${gift.image}" alt="${escapeHtml(gift.name)}" onerror="this.src='/images/rose.png'">
            <div style="display:flex; flex-direction:column; min-width:0; overflow:hidden;">
                <span style="font-weight:800; font-size:11.5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(gift.name)}</span>
                <span style="font-size:9.5px; color:var(--gold);">${gift.coins} 🪙 ${statusBadge}</span>
            </div>
        `;

        chip.onclick = () => {
            if (isBlocked) {
                showToast(`⚠️ هذه الهدية (${gift.name}) محجوزة بالفعل في الفريق المعاكس! قاعدة النظام تمنع تكرار الصور بين الفرق نهائياً.`, 'warning');
                return;
            }
            toggleGiftInTeam(gift);
        };

        grid.appendChild(chip);
    });
}

function setActiveTargetTeam(team) {
    activeTargetTeam = team;
    document.getElementById('btnTargetTeam1').classList.toggle('active', team === 'team1');
    document.getElementById('btnTargetTeam2').classList.toggle('active', team === 'team2');
    renderMutualExclusionGrid();
}

function openAddGiftModalForTeam(teamKey) {
    setActiveTargetTeam(teamKey);
    const box = document.querySelector('.exclusion-library-box');
    if (box) {
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
        box.style.boxShadow = '0 0 25px rgba(0,255,200,0.6)';
        box.style.border = '2px solid #00ffcc';
        setTimeout(() => {
            box.style.boxShadow = '';
            box.style.border = '';
        }, 1800);
    }
    const searchInp = document.getElementById('teamGiftsSearchInput');
    if (searchInp) {
        searchInp.focus();
    }
    const teamTitle = teamKey === 'team1' ? (currentTeamGifts.team1?.title || 'الفريق 1') : (currentTeamGifts.team2?.title || 'الفريق 2');
    showToast(`🎯 تم تفعيل الإضافة لـ (${teamTitle}). اضغط على أي هدية من المكتبة أدناه لإضافتها فوراً!`, 'info');
}

function toggleGiftInTeam(gift) {
    if (!currentTeamGifts.team1) currentTeamGifts.team1 = { title: 'المساعدين', color: '#22ff88', icon: '💚', imageOnlyAnimation: true, gifts: [] };
    if (!currentTeamGifts.team2) currentTeamGifts.team2 = { title: 'المخربين', color: '#ff2a4a', icon: '🔥', imageOnlyAnimation: true, gifts: [] };
    if (!Array.isArray(currentTeamGifts.team1.gifts)) currentTeamGifts.team1.gifts = [];
    if (!Array.isArray(currentTeamGifts.team2.gifts)) currentTeamGifts.team2.gifts = [];

    const target = currentTeamGifts[activeTargetTeam];
    if (!target) return;

    const norm = normalizeImgPath(gift.image);
    const otherTeamKey = activeTargetTeam === 'team1' ? 'team2' : 'team1';
    const otherImages = new Set((currentTeamGifts[otherTeamKey]?.gifts || []).map(g => normalizeImgPath(g.image)));

    if (otherImages.has(norm)) {
        showToast(`⚠️ هذه الهدية (${gift.name}) محجوزة بالفعل في الفريق المعاكس! قاعدة النظام تمنع تكرار الصور بين الفرق نهائياً.`, 'warning');
        return;
    }

    const existingIdx = target.gifts.findIndex(g => normalizeImgPath(g.image) === norm);
    if (existingIdx !== -1) {
        target.gifts.splice(existingIdx, 1);
        showToast(`تمت إزالة (${gift.name}) من ${target.title}`, 'info');
    } else {
        target.gifts.push({
            id: Date.now(),
            name: gift.name,
            image: gift.image
        });
        showToast(`✨ تمت إضافة (${gift.name}) إلى ${target.title} بنجاح!`, 'success');
    }

    renderTeamGiftsUI();
    saveTeamGiftsAction(false);
}

function removeGiftFromTeam(teamKey, index) {
    if (currentTeamGifts[teamKey] && currentTeamGifts[teamKey].gifts && currentTeamGifts[teamKey].gifts[index]) {
        const removed = currentTeamGifts[teamKey].gifts.splice(index, 1);
        showToast(`تمت إزالة (${removed[0]?.name})`, 'info');
        renderTeamGiftsUI();
        saveTeamGiftsAction(false);
    }
}

function onTeamColorChange(teamKey, color) {
    if (currentTeamGifts[teamKey]) {
        currentTeamGifts[teamKey].color = color;
        const hex = document.getElementById(`${teamKey}ColorHex`);
        if (hex) { hex.textContent = color; hex.style.color = color; }
    }
}

function onTeamTitleChange(teamKey, val) {
    if (currentTeamGifts[teamKey]) {
        currentTeamGifts[teamKey].title = val.trim();
    }
}

function onTeamImgOnlyChange(teamKey, checked) {
    if (currentTeamGifts[teamKey]) {
        currentTeamGifts[teamKey].imageOnlyAnimation = checked;
    }
}

function toggleTeamImageOnly(teamKey) {
    const check = document.getElementById(`${teamKey}ImgOnlyCheck`);
    if (check) {
        check.checked = !check.checked;
        onTeamImgOnlyChange(teamKey, check.checked);
    }
}

async function saveTeamGiftsAction(showFeedback = true) {
    try {
        const cleanPayload = {
            team1: {
                title: currentTeamGifts.team1?.title || 'المساعدين',
                color: currentTeamGifts.team1?.color || '#22ff88',
                icon: currentTeamGifts.team1?.icon || '💚',
                imageOnlyAnimation: currentTeamGifts.team1?.imageOnlyAnimation !== false,
                gifts: Array.isArray(currentTeamGifts.team1?.gifts) ? currentTeamGifts.team1.gifts : []
            },
            team2: {
                title: currentTeamGifts.team2?.title || 'المخربين',
                color: currentTeamGifts.team2?.color || '#ff2a4a',
                icon: currentTeamGifts.team2?.icon || '🔥',
                imageOnlyAnimation: currentTeamGifts.team2?.imageOnlyAnimation !== false,
                gifts: Array.isArray(currentTeamGifts.team2?.gifts) ? currentTeamGifts.team2.gifts : []
            }
        };

        const res = await fetch(`/api/team-gifts/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cleanPayload)
        });
        const data = await res.json();
        if (data.success) {
            if (showFeedback) {
                showToast('✨ تم حفظ ونشر إعدادات الفرق لـ OBS بنجاح!', 'success');
            }
            // Refresh preview iframes
            const if1 = document.getElementById('team1SimIframe');
            const if2 = document.getElementById('team2SimIframe');
            if (if1) if1.src = `/overlay-team.html?team=1&uid=${currentUid}&t=${Date.now()}`;
            if (if2) if2.src = `/overlay-team.html?team=2&uid=${currentUid}&t=${Date.now()}`;
        } else {
            if (showFeedback) showToast('فشل حفظ إعدادات الفرق', 'error');
        }
    } catch (e) {
        if (showFeedback) showToast('خطأ في الاتصال بالسيرفر', 'error');
    }
}

function resetTeamGiftsDefaults() {
    currentTeamGifts = {
        team1: {
            title: 'المساعدين',
            color: '#22ff88',
            icon: '💚',
            imageOnlyAnimation: true,
            gifts: [
                { id: 101, name: 'تيربو', image: 'rose.png' },
                { id: 102, name: 'حمايه', image: '1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
                { id: 103, name: 'بوابه', image: 'donut.png' },
                { id: 104, name: 'اسرع لاعب', image: '1791198042522-9f8bd92363c400c284179f6719b6ba9c~tplv-obj.webp' }
            ]
        },
        team2: {
            title: 'المخربين',
            color: '#ff2a4a',
            icon: '🔥',
            imageOnlyAnimation: true,
            gifts: [
                { id: 201, name: 'صاروخ', image: 'perfume.png' },
                { id: 202, name: 'نيزك', image: '1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
                { id: 203, name: 'تبطئ الاعبين', image: '1791197915043-374dfe46d5b09ce1db19be06202d34f5.png~tplv-obj.webp' },
                { id: 204, name: 'نقل اسطوري', image: '1791198055544-79a02148079526539f7599150da9fd28.png~tplv-obj.webp' }
            ]
        }
    };
    renderTeamGiftsUI();
    saveTeamGiftsAction();
}

function copyTeamOverlayUrl(teamKey) {
    const origin = window.location.origin;
    const url = `${origin}/overlay-team.html?team=${teamKey}&uid=${currentUid}`;
    navigator.clipboard.writeText(url);
    showToast(`📋 تم نسخ رابط أوفرلاي الفريق ${teamKey} بنجاح!\n${url}`, 'copy');
}

// ================= MODAL: ALL OBS LINKS ================= //
function openAllObsModal() {
    const origin = window.location.origin;

    document.getElementById('linkGiftsUrl').value = `${origin}/overlay.html?uid=${currentUid}`;
    document.getElementById('openGiftsUrl').href = `${origin}/overlay.html?uid=${currentUid}`;

    document.getElementById('linkTeam1Url').value = `${origin}/overlay-team.html?team=1&uid=${currentUid}`;
    document.getElementById('openTeam1Url').href = `${origin}/overlay-team.html?team=1&uid=${currentUid}`;

    document.getElementById('linkTeam2Url').value = `${origin}/overlay-team.html?team=2&uid=${currentUid}`;
    document.getElementById('openTeam2Url').href = `${origin}/overlay-team.html?team=2&uid=${currentUid}`;

    document.getElementById('linkFireUrl').value = `${origin}/fire-text.html?uid=${currentUid}`;
    document.getElementById('openFireUrl').href = `${origin}/fire-text.html?uid=${currentUid}`;

    document.getElementById('linkCameraUrl').value = `${origin}/camera-overlay.html?uid=${currentUid}`;
    document.getElementById('openCameraUrl').href = `${origin}/camera-overlay.html?uid=${currentUid}`;

    document.getElementById('linkScoreboardUrl').value = `${origin}/scoreboard-overlay.html?id=${currentUid}`;
    document.getElementById('openScoreboardUrl').href = `${origin}/scoreboard-overlay.html?id=${currentUid}`;

    const linkRace = document.getElementById('linkRaceUrl');
    if (linkRace) linkRace.value = `${origin}/race-overlay.html`;
    const openRace = document.getElementById('openRaceUrl');
    if (openRace) openRace.href = `${origin}/race-overlay.html`;

    const linkCards = document.getElementById('linkCardsUrl');
    if (linkCards) linkCards.value = `${origin}/cards-overlay.html?uid=${currentUid}`;
    const openCards = document.getElementById('openCardsUrl');
    if (openCards) openCards.href = `${origin}/cards-overlay.html?uid=${currentUid}`;

    const linkCards4 = document.getElementById('linkCards4Url');
    if (linkCards4) linkCards4.value = `${origin}/cards4-overlay.html?uid=${currentUid}`;
    const openCards4 = document.getElementById('openCards4Url');
    if (openCards4) openCards4.href = `${origin}/cards4-overlay.html?uid=${currentUid}`;

    const linkSupporter = document.getElementById('linkSupporterFrameUrl');
    if (linkSupporter) linkSupporter.value = `${origin}/supporter-frame-overlay.html?uid=${currentUid}`;
    const openSupporter = document.getElementById('openSupporterFrameUrl');
    if (openSupporter) openSupporter.href = `${origin}/supporter-frame-overlay.html?uid=${currentUid}`;

    const linkFollowers = document.getElementById('linkFollowersUrl');
    if (linkFollowers) linkFollowers.value = `${origin}/followers-overlay.html`;
    const openFollowers = document.getElementById('openFollowersUrl');
    if (openFollowers) openFollowers.href = `${origin}/followers-overlay.html`;

    const linkTarkibat = document.getElementById('linkTarkibatUrl');
    if (linkTarkibat) linkTarkibat.value = `${origin}/tarkibat-overlay.html?uid=${currentUid}`;
    const openTarkibat = document.getElementById('openTarkibatUrl');
    if (openTarkibat) openTarkibat.href = `${origin}/tarkibat-overlay.html?uid=${currentUid}`;

    document.getElementById('allObsModal').classList.add('open');
}

function closeAllObsModal() {
    document.getElementById('allObsModal').classList.remove('open');
}

function copyInput(id) {
    const el = document.getElementById(id);
    if (el) {
        el.select();
        navigator.clipboard.writeText(el.value);
        showToast('📋 تم نسخ الرابط بنجاح! الصقه في OBS كمصدر متصفح (Browser Source).', 'copy');
    }
}

function copyCurrentOverlayUrl(type) {
    const origin = window.location.origin;
    let url = '';

    if (type === 'gifts') url = `${origin}/overlay.html?uid=${currentUid}`;
    else if (type === 'team1') url = `${origin}/overlay-team.html?team=1&uid=${currentUid}`;
    else if (type === 'team2') url = `${origin}/overlay-team.html?team=2&uid=${currentUid}`;
    else if (type === 'cards') url = `${origin}/cards-overlay.html?uid=${currentUid}`;
    else if (type === 'cards4') url = `${origin}/cards4-overlay.html?uid=${currentUid}`;
    else if (type === 'fire') url = `${origin}/fire-text.html?uid=${currentUid}`;
    else if (type === 'supporterFrame') url = `${origin}/supporter-frame-overlay.html?uid=${currentUid}`;
    else if (type === 'camera') url = `${origin}/camera-overlay.html?uid=${currentUid}`;
    else if (type === 'scoreboard') url = `${origin}/scoreboard-overlay.html?id=${currentUid}`;
    else if (type === 'race') url = `${origin}/race-overlay.html`;
    else if (type === 'followers') url = `${origin}/followers-overlay.html`;
    else if (type === 'tarkibat') url = `${origin}/tarkibat-overlay.html?uid=${currentUid}`;

    navigator.clipboard.writeText(url);
    const labelMap = { race: 'صراع الحكام', followers: 'إجمالي المتابعين المباشر', tarkibat: 'أوفرلاي التركيبات المباشر', cards: 'بطاقات تيك توك 3', cards4: 'بطاقات تيك توك 4 كلاسيك', fire: 'نص (متغير)', supporterFrame: 'إطار آخر داعم', camera: 'إطار الكاميرا', scoreboard: 'لوحة النتائج' };
    showToast(`📺 تم نسخ رابط (${labelMap[type] || type}) المشفر بنجاح!`, 'copy');
}

// ================= SOCKET.IO & EVENT LISTENERS ================= //
function setupSocket() {
    try {
        const socket = io();

        socket.on('cards_board_update', (data) => {
            if (!data || !data.uid || data.uid === currentUid) {
                const sim = document.getElementById('cardsSimIframe');
                if (sim) sim.src = `/cards-overlay.html?uid=${currentUid}&t=${Date.now()}`;
            }
        });

        socket.on('cards4_board_update', (data) => {
            if (!data || !data.uid || data.uid === currentUid) {
                const sim = document.getElementById('cards4SimIframe');
                if (sim) sim.src = `/cards4-overlay.html?uid=${currentUid}&t=${Date.now()}`;
                loadCards4Data();
            }
        });

        socket.on('supporter_frame_update', (data) => {
            if (data && (data.uid === currentUid || data.uid === 'default')) {
                supporterFrameConfig = { ...supporterFrameConfig, ...data.frame };
                syncSupporterFrameUI();
            }
        });

        socket.on('scoreboard_update', (board) => {
            if (board && board.board_id === currentUid) {
                document.getElementById('sbScoreADisplay').textContent = board.team_a_score || 0;
                document.getElementById('sbScoreBDisplay').textContent = board.team_b_score || 0;
            }
        });

        socket.on('fire_settings_update', (data) => {
            if (data && data.uid === currentUid) {
                reloadFireSim();
            }
        });

        socket.on('camera_settings_update', (data) => {
            if (data && data.uid === currentUid) {
                updateCamSimIframe();
            }
        });

        socket.on('team_gifts_update', (data) => {
            if (data && data.uid === currentUid && data.teamGifts) {
                currentTeamGifts = data.teamGifts;
                renderTeamGiftsUI();
            }
        });

        socket.on('race_state_update', (data) => {
            if (data) {
                currentRaceState = { ...currentRaceState, ...data };
                renderRaceUI();
            }
        });
        socket.on('state_update', (data) => {
            if (data && data.leaderboard) {
                currentRaceState = { ...currentRaceState, ...data };
                renderRaceUI();
            }
        });

        socket.on('cards_board_update', (data) => {
            if (data && (!data.uid || data.uid === currentUid)) {
                loadCardsData();
            }
        });

        socket.on('race_win_celebration', (data) => {
            triggerRaceCelebration(data);
        });
        socket.on('win_celebration', (data) => {
            triggerRaceCelebration(data);
        });

        socket.on('followers_state_update', (data) => {
            if (data) {
                currentFollowersState = { ...currentFollowersState, ...data };
                renderFollowersSectionUI();
            }
        });

        socket.on('followers_gain_celebration', (celeb) => {
            triggerFollowersGainCelebration(celeb);
        });

        socket.on('tarkibat_status_update', (data) => {
            if (data && data.uid === currentUid && data.state) {
                currentTarkibatLiveState = { ...currentTarkibatLiveState, ...data.state };
                renderTarkibatStatusUI();
            }
        });

        socket.on('tarkibat_live_event', (data) => {
            if (data && data.uid === currentUid) {
                if (data.state) {
                    currentTarkibatLiveState = { ...currentTarkibatLiveState, ...data.state };
                    renderTarkibatStatusUI();
                } else if (data.event) {
                    currentTarkibatLiveState.events = [data.event, ...(currentTarkibatLiveState.events || [])].slice(0, 35);
                    renderTarkibatEventsFeed();
                }
            }
        });

        socket.on('tarkibat_config_update', (data) => {
            if (data && data.uid === currentUid && data.config) {
                currentTarkibatConfig = { ...currentTarkibatConfig, ...data.config };
                renderTarkibatItemsList();
            }
        });
    } catch (e) {}
}

function setupEventListeners() {
    // Sliders live badges
    const offsetYSlider = document.getElementById('offsetYSlider');
    if (offsetYSlider) {
        offsetYSlider.addEventListener('input', (e) => {
            document.getElementById('offsetYValue').textContent = e.target.value + ' px';
            setPosition(document.querySelector('.pos-preset-buttons .btn-pos.active')?.dataset.valign || 'center', e.target.value);
        });
    }

    // Neon Color Picker & Preset Swatches
    const neonColorInput = document.getElementById('neonColor');
    if (neonColorInput) {
        neonColorInput.addEventListener('input', (e) => {
            onNeonColorChange(e.target.value);
        });
        neonColorInput.addEventListener('change', (e) => {
            onNeonColorChange(e.target.value);
        });
    }

    document.querySelectorAll('.color-presets .preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const color = btn.getAttribute('data-color') || btn.style.getPropertyValue('--c');
            if (color) {
                onNeonColorChange(color.trim());
            }
        });
    });

    // Scale slider (حجم الهدايا والخط)
    const scaleSlider = document.getElementById('scaleSlider');
    if (scaleSlider) {
        scaleSlider.addEventListener('input', (e) => {
            const badge = document.getElementById('scaleValue');
            if (badge) badge.textContent = e.target.value + '%';
            if (currentBoardData) currentBoardData.scale = e.target.value;
            saveBoardSettings({ scale: e.target.value });
            renderPreviewSimulator(currentBoardData);
        });
    }

    // Glow intensity slider (قوة توهج النيون)
    const glowSlider = document.getElementById('glowSlider');
    if (glowSlider) {
        glowSlider.addEventListener('input', (e) => {
            const badge = document.getElementById('glowValue');
            if (badge) badge.textContent = e.target.value + ' px';
            if (currentBoardData) currentBoardData.glowIntensity = e.target.value;
            saveBoardSettings({ glowIntensity: e.target.value });
            renderPreviewSimulator(currentBoardData);
        });
    }

    // Animation type select
    const animTypeSelect = document.getElementById('animTypeSelect');
    if (animTypeSelect) {
        animTypeSelect.addEventListener('change', (e) => {
            if (currentBoardData) currentBoardData.animationType = e.target.value;
            saveBoardSettings({ animationType: e.target.value });
            renderPreviewSimulator(currentBoardData);
        });
    }

    const fireFontSlider = document.getElementById('fireFontSizeSlider');
    if (fireFontSlider) {
        fireFontSlider.addEventListener('input', (e) => {
            document.getElementById('fireFontSizeBadge').textContent = e.target.value + ' px';
        });
    }

    const fireNeonSlider = document.getElementById('fireNeonStrengthSlider');
    if (fireNeonSlider) {
        fireNeonSlider.addEventListener('input', (e) => {
            document.getElementById('fireNeonStrengthBadge').textContent = e.target.value + '%';
        });
    }

    const fireOffsetYSlider = document.getElementById('fireOffsetYSlider');
    if (fireOffsetYSlider) {
        fireOffsetYSlider.addEventListener('input', (e) => {
            document.getElementById('fireOffsetYBadge').textContent = e.target.value + ' px';
        });
    }

    // Camera sliders
    const camGlow = document.getElementById('camGlowSlider');
    if (camGlow) {
        camGlow.addEventListener('input', (e) => {
            cameraConfig.glow = parseInt(e.target.value);
            document.getElementById('camGlowBadge').textContent = e.target.value + ' px';
            updateCamSimIframe();
        });
    }

    const camRadius = document.getElementById('camRadiusSlider');
    if (camRadius) {
        camRadius.addEventListener('input', (e) => {
            cameraConfig.radius = parseInt(e.target.value);
            document.getElementById('camRadiusBadge').textContent = e.target.value + ' px';
            updateCamSimIframe();
        });
    }

    const camThickness = document.getElementById('camThicknessSlider');
    if (camThickness) {
        camThickness.addEventListener('input', (e) => {
            cameraConfig.thickness = parseInt(e.target.value);
            document.getElementById('camThicknessBadge').textContent = e.target.value + ' px';
            updateCamSimIframe();
        });
    }

    const camTag = document.getElementById('camTagInput');
    if (camTag) {
        camTag.addEventListener('input', (e) => {
            cameraConfig.tag = e.target.value;
            updateCamSimIframe();
        });
    }

    // Camera styles chips
    document.querySelectorAll('.cam-style-card').forEach(card => {
        card.addEventListener('click', () => {
            document.querySelectorAll('.cam-style-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            cameraConfig.style = card.dataset.camstyle;
            updateCamSimIframe();
        });
    });


    // Gifts tabs
    document.querySelectorAll('.tabs-nav .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tabs-nav .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.add-gift-card .tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Global Keyboard Hotkeys for Scoreboard (Alt 1 / Alt 2 / Alt + / Alt -)
    window.addEventListener('keydown', (e) => {
        if (!e.altKey || e.repeat) return;
        // In desktop app, Electron globalShortcut handles hotkeys natively to prevent double-counting!
        if (window.electronAPI) return;

        const isEditing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);

        // Alt + 1: Direct Increase (+1) to Team 1 (Red)
        if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
            if (!isEditing) {
                e.preventDefault();
                sbHotkeyTargetTeam = 'a';
                adjustSbScore('a', 1);
                const teamName = document.getElementById('sbTeamAName')?.value || 'الفريق الأول (الأحمر)';
                showToast(`🔴 +1 نقطة لـ (${teamName}) [Alt 1]`, 'success');
            }
        }
        // Alt + 2: Direct Increase (+1) to Team 2
        else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
            if (!isEditing) {
                e.preventDefault();
                sbHotkeyTargetTeam = 'b';
                adjustSbScore('b', 1);
                const teamName = document.getElementById('sbTeamBName')?.value || 'الفريق الثاني';
                showToast(`🟢 +1 نقطة لـ (${teamName}) [Alt 2]`, 'success');
            }
        }
        // Alt + 3: Direct Decrease (-1) to Team 1 (Red)
        else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
            if (!isEditing) {
                e.preventDefault();
                adjustSbScore('a', -1);
                const teamName = document.getElementById('sbTeamAName')?.value || 'الفريق الأول (الأحمر)';
                showToast(`🔴 -1 نقطة لـ (${teamName}) [Alt 3]`, 'info');
            }
        }
        // Alt + 4: Direct Decrease (-1) to Team 2
        else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
            if (!isEditing) {
                e.preventDefault();
                adjustSbScore('b', -1);
                const teamName = document.getElementById('sbTeamBName')?.value || 'الفريق الثاني';
                showToast(`🟢 -1 نقطة لـ (${teamName}) [Alt 4]`, 'info');
            }
        }
        // Alt + Plus / Alt + Equals / Numpad Plus: Increase Active Team
        else if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd' || (e.shiftKey && e.code === 'Equal')) {
            e.preventDefault();
            adjustSbScore(sbHotkeyTargetTeam, 1);
            const teamName = sbHotkeyTargetTeam === 'a' 
                ? (document.getElementById('sbTeamAName')?.value || 'الفريق الأول') 
                : (document.getElementById('sbTeamBName')?.value || 'الفريق الثاني');
            showToast(`➕ +1 نقطة لـ (${teamName}) [Alt +]`, 'success');
        }
        // Alt + Minus / Numpad Subtract: Decrease Active Team
        else if (e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract' || e.code === 'Minus') {
            e.preventDefault();
            adjustSbScore(sbHotkeyTargetTeam, -1);
            const teamName = sbHotkeyTargetTeam === 'a' 
                ? (document.getElementById('sbTeamAName')?.value || 'الفريق الأول') 
                : (document.getElementById('sbTeamBName')?.value || 'الفريق الثاني');
            showToast(`➖ -1 نقطة لـ (${teamName}) [Alt -]`, 'info');
        }
    });
}

// ================= SECTION 5: صراع الحكام (JUDGES CHALLENGE) ================= //
let currentRacePlatform = 'tiktok';
let raceFetchedUserData = null;

let currentRaceState = {
    title: 'صراع الحكام',
    activeJudge: null,
    leaderboard: [],
    settings: { soundEnabled: true },
    history: []
};

// Victory fanfare sound for dashboard
let raceAudioCtx = null;
function playRaceVictorySound() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!raceAudioCtx) raceAudioCtx = new AudioCtx();
        if (raceAudioCtx.state === 'suspended') raceAudioCtx.resume();

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = raceAudioCtx.createOscillator();
            const gain = raceAudioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, raceAudioCtx.currentTime + idx * 0.1);

            gain.gain.setValueAtTime(0, raceAudioCtx.currentTime + idx * 0.1);
            gain.gain.linearRampToValueAtTime(0.3, raceAudioCtx.currentTime + idx * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, raceAudioCtx.currentTime + idx * 0.1 + 0.65);

            osc.connect(gain);
            gain.connect(raceAudioCtx.destination);

            osc.start(raceAudioCtx.currentTime + idx * 0.1);
            osc.stop(raceAudioCtx.currentTime + idx * 0.1 + 0.7);
        });
    } catch (e) {}
}

function setRacePlatform(plat) {
    currentRacePlatform = plat;
    const btnTik = document.getElementById('platTikTok');
    const btnRob = document.getElementById('platRoblox');
    const ico = document.getElementById('racePlatIcon');
    if (btnTik) btnTik.classList.toggle('active', plat === 'tiktok');
    if (btnRob) btnRob.classList.toggle('active', plat === 'roblox');
    if (ico) ico.textContent = plat === 'tiktok' ? '@' : '🎮';
    raceFetchedUserData = null;
    const box = document.getElementById('raceFetchedBox');
    if (box) box.style.display = 'none';
}

async function handleRaceLookupUser() {
    const input = document.getElementById('raceUsernameInput');
    const btn = document.getElementById('btnRaceFetch');
    const user = input ? input.value.trim().replace(/^@/, '') : '';
    if (!user) {
        showToast('⚠️ يرجى كتابة اسم المستخدم أولاً!', 'error');
        if (input) input.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جاري الفحص...';
    }

    try {
        const res = await fetch('/api/race/user/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: currentRacePlatform, username: user })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        raceFetchedUserData = data.user;
        const box = document.getElementById('raceFetchedBox');
        const av = document.getElementById('raceFetchedAvatar');
        const nm = document.getElementById('raceFetchedName');
        const hnd = document.getElementById('raceFetchedHandle');
        if (av) av.src = raceFetchedUserData.avatar;
        if (nm) nm.textContent = raceFetchedUserData.nickname;
        if (hnd) hnd.textContent = `@${raceFetchedUserData.username} (${currentRacePlatform === 'tiktok' ? 'تيك توك' : 'روبلوكس'})`;
        if (box) box.style.display = 'flex';
        showToast(`✅ تم العثور على: ${raceFetchedUserData.nickname}`, 'success');
    } catch (err) {
        showToast('فشل فحص الحساب: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔍 فحص الحساب';
        }
    }
}

async function handleAddRaceJudge(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('raceUsernameInput');
    const winsInput = document.getElementById('raceWinsInput');
    const roleInput = document.getElementById('raceRoleInput');
    const btn = document.getElementById('btnRaceSubmit');

    const user = input ? input.value.trim().replace(/^@/, '') : '';
    if (!user) {
        showToast('يرجى كتابة اسم المستخدم', 'error');
        return;
    }

    const wins = parseInt(winsInput ? winsInput.value : 0) || 0;
    const role = roleInput ? roleInput.value.trim() : 'الحكم';

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جاري الحفظ...';
    }

    try {
        const payload = {
            username: user,
            platform: currentRacePlatform,
            wins: wins,
            role: role || 'الحكم',
            setActive: true,
            customNickname: raceFetchedUserData ? raceFetchedUserData.nickname : null,
            customAvatar: raceFetchedUserData ? raceFetchedUserData.avatar : null
        };

        const res = await fetch('/api/race/judge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);

        if (input) input.value = '';
        if (winsInput) winsInput.value = '0';
        raceFetchedUserData = null;
        const box = document.getElementById('raceFetchedBox');
        if (box) box.style.display = 'none';

        showToast(`🎉 تم حفظ ${data.judge.nickname} في صراع الحكام!`, 'success');
    } catch (err) {
        showToast('حدث خطأ: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '💾 إضافة / تحديث في صراع الحكام';
        }
    }
}

function renderRaceUI() {
    const active = currentRaceState.activeJudge;
    const content = document.getElementById('raceSpotlightContent');
    const empty = document.getElementById('raceSpotlightEmpty');
    const av = document.getElementById('raceActiveAvatar');
    const nm = document.getElementById('raceActiveName');
    const hnd = document.getElementById('raceActiveHandle');
    const rol = document.getElementById('raceActiveRole');
    const plat = document.getElementById('raceActivePlatBadge');
    const wins = document.getElementById('raceActiveWinsDigits');

    if (active) {
        if (content) content.style.display = 'flex';
        if (empty) empty.style.display = 'none';
        if (av) av.src = active.avatar || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + active.username);
        if (nm) nm.textContent = active.nickname || active.username;
        if (hnd) hnd.textContent = `@${active.username}`;
        if (rol) rol.textContent = active.role || 'الحكم';
        if (plat) plat.textContent = active.platform === 'tiktok' ? '📱 TikTok' : '🎮 Roblox';
        if (wins) wins.textContent = active.wins || 0;
    } else {
        if (content) content.style.display = 'none';
        if (empty) empty.style.display = 'block';
    }

    renderRaceJudgesList(currentRaceState.leaderboard);
    renderRaceLog(currentRaceState.history);
}

function renderRaceJudgesList(list) {
    const countEl = document.getElementById('raceJudgesCount');
    const listEl = document.getElementById('raceJudgesList');
    if (countEl) countEl.textContent = list ? list.length : 0;
    if (!listEl) return;

    listEl.innerHTML = '';
    if (!list || list.length === 0) {
        listEl.innerHTML = '<div class="empty-list">لم تقم بإضافة أي حكام حتى الآن</div>';
        return;
    }

    const activeId = currentRaceState.activeJudge ? currentRaceState.activeJudge.id : null;

    list.forEach((item, idx) => {
        const isActive = item.id === activeId;
        let rankBadge = '';
        let streamTag = '';

        if (idx === 0) {
            rankBadge = '👑 1';
            streamTag = '<span class="judge-badge-stream top1">👑 المتصدر على البث (Top 1)</span>';
        } else if (idx === 1) {
            rankBadge = '🥈 2';
            streamTag = '<span class="judge-badge-stream top2">🥈 معروض بالبث (Top 2)</span>';
        } else if (idx === 2) {
            rankBadge = '🥉 3';
            streamTag = '<span class="judge-badge-stream top3">🥉 معروض بالبث (Top 3)</span>';
        } else {
            rankBadge = '#' + (idx + 1);
            streamTag = `<span class="judge-badge-stream saved">💾 محفوظ باللوحة (#${idx + 1})</span>`;
        }

        const div = document.createElement('div');
        div.className = `judge-item ${isActive ? 'is-active' : ''}`;
        div.innerHTML = `
            <span class="judge-rank">${rankBadge}</span>
            <img class="judge-avatar" src="${item.avatar || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + item.username)}" alt="${escapeHtml(item.nickname)}" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}'">
            <div class="judge-details">
                <div class="judge-name-row">
                    <span class="judge-name">${escapeHtml(item.nickname)}</span>
                    ${streamTag}
                </div>
                <div class="judge-meta">@${escapeHtml(item.username)} · ${item.role || 'حكم'} · ${item.platform === 'tiktok' ? 'تيك توك' : 'روبلوكس'}</div>
            </div>
            <div class="judge-wins-display">
                <span>🏆</span>
                <span>${item.wins || 0}</span>
            </div>
            <div class="judge-actions">
                <button class="btn-action-mini" onclick="addRaceWinToJudge('${item.id}')" title="إضافة فوز">+1</button>
                <button class="btn-action-mini" onclick="promptSetRaceWins('${item.id}', '${escapeHtml(item.nickname)}', ${item.wins || 0})" title="تعديل عدد الانتصارات">✏️</button>
                <button class="btn-action-mini" onclick="activateRaceJudge('${item.id}')" title="عرض على شاشة البث كحكم رئيسي">👁️</button>
                <button class="btn-action-mini del" onclick="deleteRaceJudge('${item.id}')" title="حذف">✕</button>
            </div>
        `;
        listEl.appendChild(div);
    });
}

function renderRaceLog(history) {
    const logEl = document.getElementById('raceLogList');
    if (!logEl) return;
    logEl.innerHTML = '';
    if (!history || history.length === 0) {
        logEl.innerHTML = '<div class="log-item info"><span>لا توجد سجلات حتى الآن</span></div>';
        return;
    }

    history.forEach(item => {
        const div = document.createElement('div');
        div.className = `log-item ${item.type || 'info'}`;
        div.innerHTML = `
            <span>${escapeHtml(item.text)}</span>
            <span class="log-time" style="font-size:11px; color:#94a3b8; direction:ltr;">${item.time || ''}</span>
        `;
        logEl.appendChild(div);
    });
}

async function addRaceWinToActive() {
    if (!currentRaceState.activeJudge) {
        showToast('يرجى تحديد أو إضافة حكم أولاً!', 'error');
        return;
    }
    await addRaceWinToJudge(currentRaceState.activeJudge.id);
}

async function addRaceWinToJudge(id) {
    try {
        const res = await fetch(`/api/race/judge/${encodeURIComponent(id)}/win`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count: 1 })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
    } catch (err) {
        showToast('حدث خطأ: ' + err.message, 'error');
    }
}

async function minusRaceWinActive() {
    if (!currentRaceState.activeJudge) return;
    try {
        await fetch(`/api/race/judge/${encodeURIComponent(currentRaceState.activeJudge.id)}/minus`, { method: 'POST' });
    } catch (e) {}
}

async function resetRaceWinActive() {
    if (!currentRaceState.activeJudge) return;
    if (!confirm(`هل أنت متأكد من تصفير انتصارات ${currentRaceState.activeJudge.nickname}؟`)) return;
    try {
        await fetch(`/api/race/judge/${encodeURIComponent(currentRaceState.activeJudge.id)}/set-wins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wins: 0 })
        });
    } catch (e) {}
}

function promptSetRaceWinsActive() {
    if (!currentRaceState.activeJudge) return;
    promptSetRaceWins(currentRaceState.activeJudge.id, currentRaceState.activeJudge.nickname, currentRaceState.activeJudge.wins || 0);
}

async function promptSetRaceWins(id, name, currentWins) {
    const val = prompt(`أدخل عدد الانتصارات (Wins) الجديد لـ ${name}:`, currentWins);
    if (val === null) return;
    const wins = parseInt(val);
    if (isNaN(wins) || wins < 0) {
        showToast('يرجى كتابة رقم صحيح', 'error');
        return;
    }

    try {
        await fetch(`/api/race/judge/${encodeURIComponent(id)}/set-wins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wins })
        });
    } catch (e) {
        showToast('خطأ أثناء التعديل', 'error');
    }
}

async function activateRaceJudge(id) {
    try {
        await fetch(`/api/race/judge/${encodeURIComponent(id)}/activate`, { method: 'POST' });
    } catch (e) {}
}

async function deleteRaceJudge(id) {
    if (!confirm('هل تريد حذف هذا المتسابق من صراع الحكام؟')) return;
    try {
        await fetch(`/api/race/judge/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (e) {}
}

async function resetAllRaceWins() {
    if (!confirm('هل أنت متأكد من تصفير جميع انتصارات الحكام والمتسابقين؟')) return;
    try {
        await fetch('/api/race/reset-all-wins', { method: 'POST' });
    } catch (e) {}
}

function triggerRaceCelebration(data) {
    if (!data) return;
    playRaceVictorySound();
    const banner = document.getElementById('raceCelebrationBanner');
    const nameEl = document.getElementById('raceBannerWinnerName');
    const countEl = document.getElementById('raceBannerWinsCount');

    if (nameEl) nameEl.textContent = data.nickname || data.username;
    if (countEl) countEl.textContent = data.wins || 1;

    if (banner) {
        banner.classList.add('show');
        setTimeout(() => {
            banner.classList.remove('show');
        }, 3800);
    }
}

function loadRaceState() {
    fetch('/api/race/state')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                currentRaceState = { ...currentRaceState, ...data };
                renderRaceUI();
            }
        })
        .catch(() => {});
}

// ================= SECTION 3: هدايا تيك توك 3 (بطاقات وجنود اللعبة) ================= //

let cardsBoardConfig = {
    neonEnabled: true,
    glowIntensity: 18,
    fontFamily: 'cairo',
    giftPosition: 'top-right',
    disappearMode: 'gift_only',
    offsetY: 0,
    scale: 100,
    teamRed: {
        title: 'الفريق الأحمر',
        color: '#ff2a4a',
        cards: [
            { id: 1, cardType: 'meteor', customText: 'X1', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
            { id: 2, cardType: 'nitro', customText: 'X2', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
            { id: 3, cardType: 'barrels', customText: 'X1', count: 1, giftName: 'نيزك', giftImage: '/images/1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
            { id: 4, cardType: 'fuel', customText: 'X3', count: 3, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
            { id: 5, cardType: 'wind', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' }
        ]
    },
    teamBlue: {
        title: 'الفريق الأزرق',
        color: '#00b4d8',
        cards: [
            { id: 101, cardType: 'leak', customText: 'X1', count: 1, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
            { id: 102, cardType: 'rain', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
            { id: 103, cardType: 'seagull', customText: 'X2', count: 2, giftName: 'مكوك فضائي', giftImage: '/images/1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' },
            { id: 104, cardType: 'toolbox', customText: 'X1', count: 1, giftName: 'حمايه', giftImage: '/images/1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
            { id: 105, cardType: 'nitro', customText: 'X3', count: 3, giftName: 'دونات', giftImage: '/images/donut.png' }
        ]
    }
};

const CARD_GIF_ITEMS = [
    { id: 'meteor', name: 'نيزك مشتعل (Meteor)', img: '/images/cards_gif/meteor.gif', icon: '☄️' },
    { id: 'nitro', name: 'نيترو سرعة (Nitro)', img: '/images/cards_gif/nitro.gif', icon: '🚀' },
    { id: 'barrels', name: 'براميل متفجرة (Barrels)', img: '/images/cards_gif/barrels.gif', icon: '🛢️' },
    { id: 'fuel', name: 'وقود وبوش (Fuel)', img: '/images/cards_gif/fuel.gif', icon: '⛽' },
    { id: 'leak', name: 'تسريب مياه (Leak)', img: '/images/cards_gif/leak.gif', icon: '💧' },
    { id: 'rain', name: 'عاصفة مطر (Rain)', img: '/images/cards_gif/rain.gif', icon: '🌧️' },
    { id: 'seagull', name: 'طائر نورس (Seagull)', img: '/images/cards_gif/seagull.gif', icon: '🕊️' },
    { id: 'toolbox', name: 'صندوق أدوات (Toolbox)', img: '/images/cards_gif/toolbox.gif', icon: '🧰' },
    { id: 'wind', name: 'رياح وإعصار (Wind)', img: '/images/cards_gif/wind.gif', icon: '🌪️' }
];

function getCardGifItem(cardType) {
    const found = CARD_GIF_ITEMS.find(c => c.id === cardType);
    if (found) return found;
    if (cardType === 'skeleton_bandana') return CARD_GIF_ITEMS.find(c => c.id === 'barrels') || CARD_GIF_ITEMS[0];
    if (cardType === 'evoker_mage') return CARD_GIF_ITEMS.find(c => c.id === 'meteor') || CARD_GIF_ITEMS[0];
    if (cardType === 'skeleton_cap') return CARD_GIF_ITEMS.find(c => c.id === 'nitro') || CARD_GIF_ITEMS[0];
    if (cardType === 'hog_rider') return CARD_GIF_ITEMS.find(c => c.id === 'fuel') || CARD_GIF_ITEMS[0];
    if (cardType === 'golem_pumpkin') return CARD_GIF_ITEMS.find(c => c.id === 'toolbox') || CARD_GIF_ITEMS[0];
    return CARD_GIF_ITEMS[0];
}

let activeVisualCharTeam = 'teamRed';
let activeVisualCharSlotIdx = null;
let cardsActiveTargetTeam = 'teamRed'; // 'teamRed' or 'teamBlue'
let activeCardSlotIndex = null;
let visualGiftPriceFilter = 'all';
let visualGiftSearchQuery = '';

async function loadCardsData() {
    if (!currentUid) return;

    try {
        const res = await fetch(`/api/cards-board/${currentUid}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.board) {
                cardsBoardConfig = {
                    ...cardsBoardConfig,
                    ...data.board,
                    teamRed: {
                        ...cardsBoardConfig.teamRed,
                        ...(data.board.teamRed || {})
                    },
                    teamBlue: {
                        ...cardsBoardConfig.teamBlue,
                        ...(data.board.teamBlue || {})
                    }
                };

                // Backward compatibility if board.cards existed without teamRed
                if (Array.isArray(data.board.cards) && data.board.cards.length > 0 && (!data.board.teamRed || !data.board.teamRed.cards)) {
                    cardsBoardConfig.teamRed.cards = [...data.board.cards];
                }

                if (!Array.isArray(cardsBoardConfig.teamRed.cards) || cardsBoardConfig.teamRed.cards.length === 0) {
                    cardsBoardConfig.teamRed.cards = [
                        { id: 1, cardType: 'meteor', customText: 'X1', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
                        { id: 2, cardType: 'nitro', customText: 'X2', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
                        { id: 3, cardType: 'barrels', customText: 'X1', count: 1, giftName: 'نيزك', giftImage: '/images/1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
                        { id: 4, cardType: 'fuel', customText: 'X3', count: 3, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                        { id: 5, cardType: 'wind', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' }
                    ];
                }

                if (!Array.isArray(cardsBoardConfig.teamBlue.cards) || cardsBoardConfig.teamBlue.cards.length === 0) {
                    cardsBoardConfig.teamBlue.cards = [
                        { id: 101, cardType: 'leak', customText: 'X1', count: 1, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                        { id: 102, cardType: 'rain', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
                        { id: 103, cardType: 'seagull', customText: 'X2', count: 2, giftName: 'مكوك فضائي', giftImage: '/images/1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' },
                        { id: 104, cardType: 'toolbox', customText: 'X1', count: 1, giftName: 'حمايه', giftImage: '/images/1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
                        { id: 105, cardType: 'nitro', customText: 'X3', count: 3, giftName: 'دونات', giftImage: '/images/donut.png' }
                    ];
                }
            }
        }
    } catch (e) {
        console.error('Failed to load cards board data:', e);
    }

    applyCardsConfigToUI();
    renderCardsDeckList();
}

function applyCardsConfigToUI() {
    // 1. Neon Toggle
    const neonOnBtn = document.getElementById('btnCardsNeonOn');
    const neonOffBtn = document.getElementById('btnCardsNeonOff');
    if (neonOnBtn && neonOffBtn) {
        neonOnBtn.classList.toggle('active', cardsBoardConfig.neonEnabled !== false);
        neonOffBtn.classList.toggle('active', cardsBoardConfig.neonEnabled === false);
    }

    // 2. Team Red Color & Title
    const redColorInput = document.getElementById('cardsTeamRedColor');
    const redHexSpan = document.getElementById('cardsTeamRedColorHex');
    const redTitleInput = document.getElementById('cardsTeamRedTitle');
    if (redColorInput) redColorInput.value = cardsBoardConfig.teamRed.color || '#ff2a4a';
    if (redHexSpan) {
        redHexSpan.textContent = cardsBoardConfig.teamRed.color || '#ff2a4a';
        redHexSpan.style.color = cardsBoardConfig.teamRed.color || '#ff2a4a';
    }
    if (redTitleInput) redTitleInput.value = cardsBoardConfig.teamRed.title || 'الفريق الأحمر';

    // 3. Team Blue Color & Title
    const blueColorInput = document.getElementById('cardsTeamBlueColor');
    const blueHexSpan = document.getElementById('cardsTeamBlueColorHex');
    const blueTitleInput = document.getElementById('cardsTeamBlueTitle');
    if (blueColorInput) blueColorInput.value = cardsBoardConfig.teamBlue.color || '#00b4d8';
    if (blueHexSpan) {
        blueHexSpan.textContent = cardsBoardConfig.teamBlue.color || '#00b4d8';
        blueHexSpan.style.color = cardsBoardConfig.teamBlue.color || '#00b4d8';
    }
    if (blueTitleInput) blueTitleInput.value = cardsBoardConfig.teamBlue.title || 'الفريق الأزرق';

    // 4. Fonts
    document.querySelectorAll('#cardsFontChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.font === cardsBoardConfig.fontFamily);
    });

    // 5. Gift Position
    document.querySelectorAll('#cardsGiftPosChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.pos === cardsBoardConfig.giftPosition);
    });

    // 6. Disappearance Mode
    const disGiftOnly = document.getElementById('btnDisappearGiftOnly');
    const disCardAndGift = document.getElementById('btnDisappearCardAndGift');
    if (disGiftOnly && disCardAndGift) {
        disGiftOnly.classList.toggle('active', cardsBoardConfig.disappearMode !== 'card_and_gift');
        disCardAndGift.classList.toggle('active', cardsBoardConfig.disappearMode === 'card_and_gift');
    }

    // 7. Vertical Offset
    const offsetSlider = document.getElementById('cardsOffsetYSlider');
    const offsetBadge = document.getElementById('cardsOffsetYBadge');
    if (offsetSlider) offsetSlider.value = cardsBoardConfig.offsetY || 0;
    if (offsetBadge) offsetBadge.textContent = `${cardsBoardConfig.offsetY || 0} px`;

    // 8. Preview external links
    const extLink = document.getElementById('cardsPreviewExternalLink');
    if (extLink) extLink.href = `/cards-overlay.html?uid=${currentUid}`;
    const redLink = document.getElementById('cardsRedPreviewLink');
    if (redLink) redLink.href = `/cards-overlay.html?uid=${currentUid}&team=red`;
    const blueLink = document.getElementById('cardsBluePreviewLink');
    if (blueLink) blueLink.href = `/cards-overlay.html?uid=${currentUid}&team=blue`;

    // Simulator iframe
    const sim = document.getElementById('cardsSimIframe');
    if (sim) {
        sim.src = `/cards-overlay.html?uid=${currentUid}`;
    }
}

function renderCardsDeckList() {
    renderTeamCardsDeck('teamRed', 'cardsRedDeckList', 'cardsRedCount');
    renderTeamCardsDeck('teamBlue', 'cardsBlueDeckList', 'cardsBlueCount');
}

function renderTeamCardsDeck(teamKey, listContainerId, countDisplayId) {
    const listContainer = document.getElementById(listContainerId);
    const countDisplay = document.getElementById(countDisplayId);
    if (!listContainer) return;

    const team = cardsBoardConfig[teamKey];
    if (!team || !Array.isArray(team.cards)) return;

    if (countDisplay) countDisplay.textContent = team.cards.length;
    listContainer.innerHTML = '';

    if (team.cards.length === 0) {
        listContainer.innerHTML = `
            <div style="text-align:center; padding:25px 12px; color:#94a3b8; background:rgba(0,0,0,0.35); border:1.5px dashed rgba(255,255,255,0.14); border-radius:12px; margin:8px 0;">
                <div style="font-size:22px; margin-bottom:4px;">📭</div>
                <div style="font-weight:800; font-size:12.5px; color:#fff;">لا توجد عناصر في هذا الفريق حالياً</div>
                <div style="font-size:11px; color:#cbd5e1; margin-top:3px;">اضغط <strong>➕ إضافة بطاقة</strong> لاختيار العناصر المتحركة والبدء!</div>
            </div>
        `;
        return;
    }

    team.cards.forEach((card, idx) => {
        const item = document.createElement('div');
        item.className = 'card-deck-slot-item';
        item.setAttribute('data-slot-index', idx);
        item.setAttribute('data-team', teamKey);

        const charItem = getCardGifItem(card.cardType);
        const cardSrc = charItem.img;
        const giftSrc = normalizeImgPath(card.giftImage || '/images/rose.png');

        item.innerHTML = `
            <!-- Order Arrows (رفع بطاقة فوق أو تنزيل تحت زي هدايا تيك توك 1) -->
            <div class="card-slot-order-col">
                <button type="button" class="btn-card-arrow up" onclick="moveCardSlot('${teamKey}', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''} title="رفع بطاقة لأعلى ⬆️">⬆️</button>
                <button type="button" class="btn-card-arrow down" onclick="moveCardSlot('${teamKey}', ${idx}, 1)" ${idx === team.cards.length - 1 ? 'disabled' : ''} title="تنزيل بطاقة لأسفل ⬇️">⬇️</button>
            </div>

            <span class="card-slot-idx">#${idx + 1}</span>

            <div class="card-slot-avatar-wrap">
                <img class="card-slot-avatar-img" src="${cardSrc}" alt="${escapeHtml(charItem.name)}" id="${teamKey}_slotAvatar_${idx}" onerror="this.src='/images/cards_gif/meteor.gif'">
                <img class="card-slot-badge-preview" src="${giftSrc}" alt="Gift" id="${teamKey}_slotBadge_${idx}" onerror="this.src='/images/rose.png'">
            </div>

            <div class="card-slot-controls-wrap">
                <!-- Character & Item Visual Selector (اختيار العنصر بنافذة عرض كبيرة ومجسمة) -->
                <div class="card-slot-field">
                    <label>عنصر البطاقة (GIF متحرك شفاف):</label>
                    <button type="button" class="btn-visual-char-trigger" onclick="openVisualCharacterPicker('${teamKey}', ${idx})" title="انقر لفتح معرض العناصر واختيار عنصر من المعرض الكبير">
                        <img class="char-thumb-img" src="${cardSrc}" alt="${escapeHtml(charItem.name)}" onerror="this.src='/images/cards_gif/meteor.gif'">
                        <span class="char-name-label">${escapeHtml(charItem.name)}</span>
                        <span class="char-click-hint">تغيير العنصر 🖼️</span>
                    </button>
                </div>

                <!-- Card Bottom Text (بدل عدد الجنود حط نص تحت البطاقه وانا اكتبه) -->
                <div class="card-slot-field">
                    <label>✍️ النص أسفل البطاقة:</label>
                    <input type="text" 
                           class="form-input card-bottom-text-input" 
                           placeholder="اكتب النص هنا (مثلاً: X1 أو تيربو أو نيزك...)" 
                           value="${escapeHtml(card.customText !== undefined && card.customText !== null ? card.customText : (card.count ? 'X' + card.count : ''))}" 
                           oninput="onCardTextChange('${teamKey}', ${idx}, this.value)">
                </div>

                <!-- Visual Gift Trigger -->
                <div class="card-slot-field">
                    <label>صورة هدية تيك توك المرتبطة:</label>
                    <button type="button" class="btn-visual-gift-trigger" onclick="openVisualGiftPicker('${teamKey}', ${idx})" title="انقر لاختيار أي هدية بالصورة">
                        <img src="${giftSrc}" alt="${escapeHtml(card.giftName || 'هدية')}" onerror="this.src='/images/rose.png'">
                        <span class="gift-name-label">${escapeHtml(card.giftName || 'اختر هدية')}</span>
                        <span class="gift-click-hint">تغيير الهدية 🎁</span>
                    </button>
                </div>
            </div>

            <button type="button" class="btn-slot-del" onclick="deleteCardSlot('${teamKey}', ${idx})" title="حذف هذه البطاقة">✕</button>
        `;

        listContainer.appendChild(item);
    });
}

function moveCardSlot(teamKey, idx, direction) {
    const team = cardsBoardConfig[teamKey];
    if (!team || !Array.isArray(team.cards)) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= team.cards.length) return;

    const temp = team.cards[idx];
    team.cards[idx] = team.cards[targetIdx];
    team.cards[targetIdx] = temp;

    renderCardsDeckList();
    saveCardsBoardConfig(true);
    showToast('تمت إعادة ترتيب البطاقات بنجاح! 🔄', 'info');
}

function onCardTextChange(teamKey, idx, val) {
    if (!cardsBoardConfig[teamKey] || !cardsBoardConfig[teamKey].cards[idx]) return;
    cardsBoardConfig[teamKey].cards[idx].customText = val;
    const numMatch = (val || '').match(/\d+/);
    if (numMatch) {
        cardsBoardConfig[teamKey].cards[idx].count = parseInt(numMatch[0]) || 1;
    }
    saveCardsBoardConfig(true);
}

function onCardCountChange(teamKey, idx, val) {
    if (!cardsBoardConfig[teamKey] || !cardsBoardConfig[teamKey].cards[idx]) return;
    cardsBoardConfig[teamKey].cards[idx].count = Math.max(1, parseInt(val) || 1);
    if (!cardsBoardConfig[teamKey].cards[idx].customText) {
        cardsBoardConfig[teamKey].cards[idx].customText = `X${cardsBoardConfig[teamKey].cards[idx].count}`;
    }
    saveCardsBoardConfig(true);
}

function addNewCardSlot(teamKey = 'teamRed') {
    if (!cardsBoardConfig[teamKey]) return;
    const teamCards = cardsBoardConfig[teamKey].cards;
    const nextId = (teamCards.length ? Math.max(...teamCards.map(c => c.id || 0)) : 0) + 1;
    const itemChoice = CARD_GIF_ITEMS[teamCards.length % CARD_GIF_ITEMS.length];
    
    teamCards.push({
        id: nextId,
        cardType: itemChoice.id,
        customText: 'X1',
        count: 1,
        giftName: 'وردة',
        giftImage: '/images/rose.png'
    });

    renderCardsDeckList();
    saveCardsBoardConfig(true);
    showToast(`تمت إضافة عنصر بطاقة جديد (${itemChoice.name}) بنجاح! ➕`, 'success');
}

function deleteCardSlot(teamKey, idx) {
    if (!cardsBoardConfig[teamKey] || !cardsBoardConfig[teamKey].cards[idx]) return;
    cardsBoardConfig[teamKey].cards.splice(idx, 1);
    renderCardsDeckList();
    saveCardsBoardConfig(true);
    showToast('تم حذف خانة البطاقة.', 'info');
}

function clearTeamCards(teamKey) {
    if (!cardsBoardConfig[teamKey]) return;
    const teamTitle = cardsBoardConfig[teamKey].title || (teamKey === 'teamRed' ? 'الفريق الأحمر' : 'الفريق الأزرق');
    if (confirm(`هل أنت متأكد من مسح جميع عناصر ${teamTitle}؟`)) {
        cardsBoardConfig[teamKey].cards = [];
        renderCardsDeckList();
        saveCardsBoardConfig(true);
        showToast(`🗑️ تم مسح جميع بطاقات ${teamTitle}.`, 'info');
    }
}

function toggleCardsNeon(enabled) {
    cardsBoardConfig.neonEnabled = !!enabled;
    const neonOnBtn = document.getElementById('btnCardsNeonOn');
    const neonOffBtn = document.getElementById('btnCardsNeonOff');
    if (neonOnBtn) neonOnBtn.classList.toggle('active', cardsBoardConfig.neonEnabled);
    if (neonOffBtn) neonOffBtn.classList.toggle('active', !cardsBoardConfig.neonEnabled);
    saveCardsBoardConfig(true);
}

function setCardsFont(font) {
    cardsBoardConfig.fontFamily = font;
    document.querySelectorAll('#cardsFontChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.font === font);
    });
    saveCardsBoardConfig(true);
}

function setCardsGiftPos(pos) {
    cardsBoardConfig.giftPosition = pos;
    document.querySelectorAll('#cardsGiftPosChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.pos === pos);
    });
    saveCardsBoardConfig(true);
}

function setCardsDisappearMode(mode) {
    cardsBoardConfig.disappearMode = mode;
    const disGiftOnly = document.getElementById('btnDisappearGiftOnly');
    const disCardAndGift = document.getElementById('btnDisappearCardAndGift');
    if (disGiftOnly) disGiftOnly.classList.toggle('active', mode !== 'card_and_gift');
    if (disCardAndGift) disCardAndGift.classList.toggle('active', mode === 'card_and_gift');
    saveCardsBoardConfig(true);
}

function onCardsOffsetYChange(val) {
    cardsBoardConfig.offsetY = parseInt(val) || 0;
    const offsetBadge = document.getElementById('cardsOffsetYBadge');
    if (offsetBadge) offsetBadge.textContent = `${val} px`;
    saveCardsBoardConfig(true);
}

function copyCardsOverlayUrl(type = 'dual') {
    const url = new URL(window.location.origin + '/cards-overlay.html');
    url.searchParams.set('uid', currentUid || 'board_XXXX');
    if (type === 'red') {
        url.searchParams.set('team', 'red');
    } else if (type === 'blue') {
        url.searchParams.set('team', 'blue');
    } else {
        url.searchParams.set('team', 'dual');
    }
    navigator.clipboard.writeText(url.toString()).then(() => {
        const teamName = type === 'red' ? 'الفريق الأحمر' : type === 'blue' ? 'الفريق الأزرق' : 'الشاشتين معاً (Dual)';
        showToast(`تم نسخ رابط ${teamName} لـ OBS بنجاح! 📋`, 'success');
    }).catch(() => {
        prompt('انسخ الرابط يدوياً:', url.toString());
    });
}

async function saveCardsBoardConfig(silent = false) {
    if (!currentUid) return;

    try {
        const res = await fetch(`/api/cards-board/${currentUid}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cardsBoardConfig)
        });

        if (res.ok) {
            // Update preview simulator iframe
            const sim = document.getElementById('cardsSimIframe');
            if (sim) {
                sim.src = `/cards-overlay.html?uid=${currentUid}&t=${Date.now()}`;
            }

            if (!silent) {
                showToast('تم حفظ إعدادات البطاقات للفريقين ونشرها لـ OBS بنجاح! 💾', 'success');
            }
        } else {
            if (!silent) showToast('حدث خطأ أثناء حفظ البطاقات', 'error');
        }
    } catch (e) {
        console.error('Save cards failed:', e);
        if (!silent) showToast('فشل الاتصال بالخادم لحفظ البطاقات', 'error');
    }
}

// ================= VISUAL CHARACTER / ITEM PICKER MODAL (اختيار عنصر البطاقة كـ GIF متحرك كبير) ================= //
function openVisualCharacterPicker(teamKey, slotIdx) {
    activeVisualCharTeam = teamKey || 'teamRed';
    activeVisualCharSlotIdx = slotIdx;
    const modal = document.getElementById('visualCharacterPickerModal');
    if (!modal) return;
    modal.classList.add('open');
    renderVisualCharactersGallery();
}

function closeVisualCharacterPicker() {
    const modal = document.getElementById('visualCharacterPickerModal');
    if (modal) modal.classList.remove('open');
    activeVisualCharSlotIdx = null;
}

function renderVisualCharactersGallery() {
    const grid = document.getElementById('visualCharactersGalleryGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const currentCard = (activeVisualCharSlotIdx !== null && cardsBoardConfig[activeVisualCharTeam]?.cards[activeVisualCharSlotIdx])
        ? cardsBoardConfig[activeVisualCharTeam].cards[activeVisualCharSlotIdx]
        : null;
    const currentType = currentCard ? (currentCard.cardType || 'meteor') : '';

    CARD_GIF_ITEMS.forEach(item => {
        const isSelected = currentType === item.id;
        const card = document.createElement('div');
        card.className = `visual-character-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => selectVisualCharacter(item.id, item.name, item.img);

        card.innerHTML = `
            <img src="${item.img}" alt="${escapeHtml(item.name)}" loading="lazy">
            <span class="v-char-name">${escapeHtml(item.name)}</span>
            <span class="v-char-badge">${isSelected ? '✅ العنصر المحدد حالياً' : 'اختر هذا العنصر 🎯'}</span>
        `;
        grid.appendChild(card);
    });
}

function selectVisualCharacter(itemId, itemName, itemImg) {
    if (activeVisualCharSlotIdx === null) return;
    const team = cardsBoardConfig[activeVisualCharTeam];
    if (!team || !team.cards[activeVisualCharSlotIdx]) return;

    delete team.cards[activeVisualCharSlotIdx].customImage;
    team.cards[activeVisualCharSlotIdx].cardType = itemId;

    closeVisualCharacterPicker();
    renderCardsDeckList();
    saveCardsBoardConfig(true);
    const teamLabel = activeVisualCharTeam === 'teamRed' ? 'الفريق الأحمر' : 'الفريق الأزرق';
    showToast(`تم اختيار (${itemName}) لـ ${teamLabel} للبطاقة رقم ${activeVisualCharSlotIdx + 1}! ✨`, 'success');
}

// ================= VISUAL GIFT PICKER MODAL (اختيار الهدية كصورة) ================= //

let activeVisualGiftContext = 'cards3'; // 'cards3' or 'cards4'

function openVisualGiftPicker(teamKey, slotIdx, context = 'cards3') {
    cardsActiveTargetTeam = teamKey || 'teamRed';
    activeCardSlotIndex = slotIdx;
    activeVisualGiftContext = context || 'cards3';
    const modal = document.getElementById('visualGiftPickerModal');
    if (!modal) return;

    modal.classList.add('open');
    visualGiftSearchQuery = '';
    const searchInput = document.getElementById('visualGiftSearchInput');
    if (searchInput) searchInput.value = '';

    const likesBox = document.getElementById('likesConfigInlineBox');
    if (likesBox) likesBox.style.display = 'none';

    renderVisualGiftsGallery();
}

function closeVisualGiftPicker() {
    const modal = document.getElementById('visualGiftPickerModal');
    if (modal) modal.classList.remove('open');
    const likesBox = document.getElementById('likesConfigInlineBox');
    if (likesBox) likesBox.style.display = 'none';
    activeCardSlotIndex = null;
}

function filterVisualGiftsList(query) {
    visualGiftSearchQuery = (query || '').trim().toLowerCase();
    renderVisualGiftsGallery();
}

function filterVisualGiftsByPrice(filter, btn) {
    visualGiftPriceFilter = filter;
    document.querySelectorAll('#visualGiftPickerModal .price-chips-row .chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderVisualGiftsGallery();
}

function renderVisualGiftsGallery() {
    const grid = document.getElementById('visualGiftsGalleryGrid');
    const countEl = document.getElementById('visualGiftPickerCount');
    if (!grid) return;

    // Collect all gifts: allTiktokGifts (707 gifts) + POPULAR_GIFTS deduplicated
    const giftList = [];
    const seenImages = new Set();

    // 1. Add official TikTok gifts
    if (Array.isArray(allTiktokGifts) && allTiktokGifts.length > 0) {
        allTiktokGifts.forEach(g => {
            const norm = normalizeImgPath(g.image);
            if (!seenImages.has(norm)) {
                seenImages.add(norm);
                const coins = g.coins || g.diamonds || 1;
                giftList.push({
                    name: g.name,
                    image: g.image,
                    diamonds: coins,
                    coins: coins,
                    popular: coins >= 100
                });
            }
        });
    }

    // 2. Also add popular gifts if not already present
    POPULAR_GIFTS.forEach(g => {
        const norm = normalizeImgPath(g.image);
        if (!seenImages.has(norm)) {
            seenImages.add(norm);
            const coins = g.diamonds || g.coins || 1;
            giftList.push({
                name: g.name,
                image: g.image,
                diamonds: coins,
                coins: coins,
                popular: true
            });
        }
    });

    // 3. Sort strictly by price ascending: from 1 coin to highest!
    giftList.sort((a, b) => (a.diamonds || 1) - (b.diamonds || 1));

    // Filter by search query
    let filtered = giftList;
    if (visualGiftSearchQuery) {
        filtered = filtered.filter(g =>
            (g.name || '').toLowerCase().includes(visualGiftSearchQuery) ||
            String(g.diamonds || '').includes(visualGiftSearchQuery)
        );
    }

    // Filter by price chip
    if (visualGiftPriceFilter === '1') {
        filtered = filtered.filter(g => (g.diamonds || 1) === 1);
    } else if (visualGiftPriceFilter === 'lt10') {
        filtered = filtered.filter(g => (g.diamonds || 1) >= 2 && (g.diamonds || 1) < 10);
    } else if (visualGiftPriceFilter === 'lt100') {
        filtered = filtered.filter(g => (g.diamonds || 1) >= 10 && (g.diamonds || 1) < 100);
    } else if (visualGiftPriceFilter === 'lt1000') {
        filtered = filtered.filter(g => (g.diamonds || 1) >= 100 && (g.diamonds || 1) < 1000);
    } else if (visualGiftPriceFilter === 'lt10000') {
        filtered = filtered.filter(g => (g.diamonds || 1) >= 1000 && (g.diamonds || 1) < 10000);
    } else if (visualGiftPriceFilter === 'gt10000') {
        filtered = filtered.filter(g => (g.diamonds || 1) >= 10000);
    } else if (visualGiftPriceFilter === 'popular') {
        filtered = filtered.filter(g => g.popular);
    } else if (visualGiftPriceFilter === '1-100') {
        filtered = filtered.filter(g => (g.diamonds || 1) < 100);
    } else if (visualGiftPriceFilter === '100+') {
        filtered = filtered.filter(g => (g.diamonds || 1) >= 100);
    }

    // Show ALL matching gifts (no artificial slicing cap!)
    const displayList = filtered;

    grid.innerHTML = '';
    const activeCfg = activeVisualGiftContext === 'cards4' ? cards4BoardConfig : cardsBoardConfig;
    const currentSelectedImg = (activeCardSlotIndex !== null && activeCfg[cardsActiveTargetTeam]?.cards[activeCardSlotIndex])
        ? normalizeImgPath(activeCfg[cardsActiveTargetTeam].cards[activeCardSlotIndex].giftImage)
        : null;

    displayList.forEach(g => {
        const card = document.createElement('div');
        const normImg = normalizeImgPath(g.image);
        const isSelected = currentSelectedImg === normImg;

        card.className = `visual-gift-card ${isSelected ? 'selected' : ''}`;
        card.onclick = () => selectVisualGift(g.name, g.image);

        card.innerHTML = `
            <img src="${normImg}" loading="lazy" alt="${escapeHtml(g.name)}" onerror="this.src='/images/rose.png'">
            <span class="v-gift-name" title="${escapeHtml(g.name)}">${escapeHtml(g.name)}</span>
            <span class="v-gift-coins">🪙 ${(g.diamonds || 1).toLocaleString()}</span>
        `;
        grid.appendChild(card);
    });

    if (countEl) {
        countEl.textContent = `تم العثور على ${displayList.length} من أصل ${giftList.length} هدية (مرتبة من 1 عملة إلى أعلى سعر 💎)`;
    }
}

function toggleLikesConfigBox(forceState) {
    if (activeCardSlotIndex === null) {
        showToast('يرجى النقر على زر اختيار الهدية في البطاقة أولاً!', 'warning');
        return;
    }
    const box = document.getElementById('likesConfigInlineBox');
    if (!box) return;
    if (typeof forceState === 'boolean') {
        box.style.display = forceState ? 'block' : 'none';
    } else {
        box.style.display = (box.style.display === 'none' || !box.style.display) ? 'block' : 'none';
    }
    if (box.style.display === 'block') {
        const inp = document.getElementById('likesCountCustomInput');
        if (inp) {
            inp.focus();
            inp.select();
        }
    }
}

function setLikesCountValue(val, chipElem) {
    const inp = document.getElementById('likesCountCustomInput');
    if (inp) inp.value = val;
    document.querySelectorAll('.likes-preset-chip').forEach(c => c.classList.remove('active'));
    if (chipElem) chipElem.classList.add('active');
}

function confirmLikesTrigger() {
    if (activeCardSlotIndex === null) {
        showToast('يرجى النقر على زر اختيار الهدية في البطاقة أولاً!', 'warning');
        return;
    }
    const inp = document.getElementById('likesCountCustomInput');
    const val = parseInt(inp ? inp.value : '100') || 100;
    const finalCount = Math.max(1, Math.min(999999, val));
    const giftName = `تكبيس (❤️ X${finalCount})`;
    const giftImage = '/images/tiktok_likes.png';
    applyGiftToCardSlot(giftName, giftImage, finalCount);
    toggleLikesConfigBox(false);
}

function selectSpecialTrigger(type) {
    if (activeCardSlotIndex === null) {
        showToast('يرجى النقر على زر اختيار الهدية في البطاقة أولاً!', 'warning');
        return;
    }

    if (type === 'likes') {
        toggleLikesConfigBox(true);
    } else if (type === 'follow') {
        const giftName = 'متابعة (فولو 👤+)';
        const giftImage = '/images/tiktok_follow.png';
        applyGiftToCardSlot(giftName, giftImage, null);
    }
}

function applyGiftToCardSlot(giftName, giftImage, likesCount = null) {
    if (activeCardSlotIndex === null) return;

    if (activeVisualGiftContext === 'tarkibat') {
        const foundGift = (allTiktokGifts || []).find(g => g.name === giftName || g.image === giftImage);
        const coins = foundGift ? (foundGift.coins || foundGift.diamonds || 1) : 1;

        if (activeCardSlotIndex === 'new') {
            newTrkSelectedGift = {
                name: giftName,
                image: giftImage,
                coins: coins
            };
            const imgEl = document.getElementById('newTrkGiftPreviewImg');
            const nameEl = document.getElementById('newTrkGiftPreviewName');
            if (imgEl) imgEl.src = giftImage;
            if (nameEl) nameEl.textContent = `${giftName} (${coins} 🪙)`;
            closeVisualGiftPicker();
            showToast(`🎁 تم اختيار هدية (${giftName}) للتركيبة الجديدة!`, 'success');
        } else if (typeof activeCardSlotIndex === 'number' && currentTarkibatConfig.items[activeCardSlotIndex]) {
            currentTarkibatConfig.items[activeCardSlotIndex].giftName = giftName;
            currentTarkibatConfig.items[activeCardSlotIndex].giftImage = giftImage;
            currentTarkibatConfig.items[activeCardSlotIndex].giftCoins = coins;
            closeVisualGiftPicker();
            renderTarkibatItemsList();
            saveTarkibatConfigAction(true);
            showToast(`✅ تم تحديث الهدية إلى (${giftName}) للتركيبة رقم ${activeCardSlotIndex + 1}!`, 'success');
        }
        return;
    }

    if (activeVisualGiftContext === 'cards4') {
        const team = cards4BoardConfig[cardsActiveTargetTeam];
        if (!team || !team.cards[activeCardSlotIndex]) return;

        team.cards[activeCardSlotIndex].giftName = giftName;
        team.cards[activeCardSlotIndex].giftImage = giftImage;
        if (likesCount) {
            team.cards[activeCardSlotIndex].likesCount = likesCount;
            team.cards[activeCardSlotIndex].customText = `X${likesCount}`;
            team.cards[activeCardSlotIndex].count = likesCount;
        } else {
            delete team.cards[activeCardSlotIndex].likesCount;
        }

        closeVisualGiftPicker();
        renderCards4DeckList();
        saveCards4BoardConfig(true);
        const teamLabel = cardsActiveTargetTeam === 'teamRed' ? 'الفريق الأحمر' : 'الفريق الأزرق';
        showToast(`✅ تم حفظ ${giftName} لـ ${teamLabel} للبطاقة ${activeCardSlotIndex + 1}! ✨`, 'success');
    } else {
        const team = cardsBoardConfig[cardsActiveTargetTeam];
        if (!team || !team.cards[activeCardSlotIndex]) return;

        team.cards[activeCardSlotIndex].giftName = giftName;
        team.cards[activeCardSlotIndex].giftImage = giftImage;
        if (likesCount) {
            team.cards[activeCardSlotIndex].likesCount = likesCount;
            team.cards[activeCardSlotIndex].customText = `X${likesCount}`;
            team.cards[activeCardSlotIndex].count = likesCount;
        } else {
            delete team.cards[activeCardSlotIndex].likesCount;
        }

        closeVisualGiftPicker();
        renderCardsDeckList();
        saveCardsBoardConfig(true);
        const teamLabel = cardsActiveTargetTeam === 'teamRed' ? 'الفريق الأحمر' : 'الفريق الأزرق';
        showToast(`✅ تم حفظ ${giftName} لـ ${teamLabel} للبطاقة ${activeCardSlotIndex + 1}! ✨`, 'success');
    }
}

function selectVisualGift(giftName, giftImage) {
    applyGiftToCardSlot(giftName, giftImage, null);
}

// ================= SECTION: TIKTOK GIFTS 4 (بطاقات كلاسيك رويال MC Royale) ================= //
const CARD4_MC_ITEMS = [
    {
        id: 'skeleton_bandana',
        name: 'الهيكل ذو العصابة (Skeleton Bandana)',
        badge: '💀 هيكل بسيف',
        desc: 'الهيكل العظمي ذو العصابة الزرقاء والسيف',
        image: '/images/mcroyale/skeleton_bandana.png'
    },
    {
        id: 'evoker_mage',
        name: 'الساحر إيفوكر (Evoker Mage)',
        badge: '🧙 ساحر ذهبي',
        desc: 'الساحر إيفوكر برداء أزرق وعيون ذهبية',
        image: '/images/mcroyale/evoker_mage.png'
    },
    {
        id: 'skeleton_cap',
        name: 'الهيكل ذو القبعة (Skeleton Cap)',
        badge: '🧢 هيكل بقبعة',
        desc: 'الهيكل العظمي بقبعة خضراء وعيون وردية',
        image: '/images/mcroyale/skeleton_cap.png'
    },
    {
        id: 'hog_rider',
        name: 'راكب الخنزير (Hog Rider)',
        badge: '🐗 راكب المطرقة',
        desc: 'راكب الخنزير السريع بمطرقة الحرب',
        image: '/images/mcroyale/hog_rider.png'
    },
    {
        id: 'golem_pumpkin',
        name: 'الغول برأس اليقطين (Pumpkin Golem)',
        badge: '🎃 غول اليقطين',
        desc: 'الغول الحديدي برأس وقبعة اليقطين',
        image: '/images/mcroyale/golem_pumpkin.png'
    },
    {
        id: 'knight',
        name: 'الفارس المدرع (Caballero)',
        badge: '⚔️ فارس متحرك',
        desc: 'فارس كلاسيك رويال المتحرك بالسيف والدرع',
        image: '/images/mcroyale/knight.gif'
    },
    {
        id: 'skeleton',
        name: 'الهيكل العظمي (Esqueletos)',
        badge: '💀 هيكل متحرك',
        desc: 'جيش الهياكل العظمية السريعة المتحركة',
        image: '/images/mcroyale/skeleton.gif'
    },
    {
        id: 'archer',
        name: 'رامية السهام (Arqueras)',
        badge: '🏹 رماة متحرك',
        desc: 'رامية السهام الملكية الأسطورية المتحركة',
        image: '/images/mcroyale/archer.gif'
    },
    {
        id: 'giant',
        name: 'العملاق الضخم (Gigante)',
        badge: '🛡️ عملاق متحرك',
        desc: 'العملاق الجبار الدبابة ذو اللكمات القوية',
        image: '/images/mcroyale/giant.gif'
    },
    {
        id: 'hog',
        name: 'راكب الخنزير (Montapuercos)',
        badge: '🐗 هوغ متحرك',
        desc: 'راكب الخنزير السريع بمطرقة الحرب',
        image: '/images/mcroyale/hog.gif'
    },
    {
        id: 'crown_win',
        name: 'تاج الفوز الملكي (Crown Win)',
        badge: '👑 فوز متحرك',
        desc: 'تاج الفوز الذهبي المتحرك ذو الإشعاع المضيء',
        image: '/images/mcroyale/crown_win.gif'
    },
    {
        id: 'dragon',
        name: 'التنين المجنح (Dragon Boss)',
        badge: '🐉 تنين متحرك',
        desc: 'تنين المعارك الطائر العملاق',
        image: '/images/mcroyale/dragon.gif'
    },
    {
        id: 'wither',
        name: 'وحش الويذر (Wither Boss)',
        badge: '⚡ ويذر متحرك',
        desc: 'زعيم الويذر ذو الرؤوس الثلاثة النارية',
        image: '/images/mcroyale/wither.gif'
    },
    {
        id: 'tnt',
        name: 'صندوق التي إن تي (TNT Blast)',
        badge: '💣 متفجرات متحركة',
        desc: 'صندوق المتفجرات الكلاسيكي المضيء',
        image: '/images/mcroyale/tnt.gif'
    },
    {
        id: 'zombie',
        name: 'الزومبي الزاحف (Zombie Rush)',
        badge: '🧟 زومبي متحرك',
        desc: 'وحش الزومبي الكلاسيكي السريع',
        image: '/images/mcroyale/zombie.gif'
    }
];

function getCard4McItem(cardType) {
    let found = CARD4_MC_ITEMS.find(c => c.id === cardType);
    if (found) return found;

    return CARD4_MC_ITEMS[0];
}

const DEFAULT_DECK_CARDS4 = [
    { id: 1, cardType: 'skeleton_bandana', customText: 'X1', count: 1, giftName: 'تكبيس (❤️ X100)', giftImage: '/images/tiktok_likes.png', likesCount: 100 },
    { id: 2, cardType: 'evoker_mage', customText: 'X1', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
    { id: 3, cardType: 'skeleton_cap', customText: 'X2', count: 2, giftName: 'قلب', giftImage: '/images/heart.png' },
    { id: 4, cardType: 'hog_rider', customText: 'X1', count: 1, giftName: 'دونات', giftImage: '/images/donut.png' },
    { id: 5, cardType: 'golem_pumpkin', customText: 'X1', count: 1, giftName: 'مكوك فضائي', giftImage: '/images/1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' }
];

let cards4BoardConfig = {
    neonEnabled: true,
    fontFamily: 'cairo',
    giftPosition: 'top-left',
    disappearMode: 'gift_only',
    offsetY: 0,
    teamRed: {
        color: '#ff2a4a',
        title: 'الفريق الأحمر',
        cards: JSON.parse(JSON.stringify(DEFAULT_DECK_CARDS4))
    },
    teamBlue: {
        color: '#00b4d8',
        title: 'الفريق الأزرق',
        cards: DEFAULT_DECK_CARDS4.map((c, i) => ({ ...c, id: 101 + i }))
    }
};

let activeVisualCard4Team = 'teamRed';
let activeVisualCard4SlotIdx = null;

async function loadCards4Data() {
    if (!currentUid) return;

    try {
        const res = await fetch(`/api/cards4-board/${currentUid}`);
        if (res.ok) {
            const data = await res.json();
            if (data && data.board) {
                cards4BoardConfig = {
                    ...cards4BoardConfig,
                    ...data.board,
                    teamRed: {
                        ...cards4BoardConfig.teamRed,
                        ...(data.board.teamRed || {})
                    },
                    teamBlue: {
                        ...cards4BoardConfig.teamBlue,
                        ...(data.board.teamBlue || {})
                    }
                };

                if (!Array.isArray(cards4BoardConfig.teamRed.cards) || cards4BoardConfig.teamRed.cards.length === 0) {
                    cards4BoardConfig.teamRed.cards = [
                        { id: 1, cardType: 'skeleton_bandana', customText: 'X1', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
                        { id: 2, cardType: 'skeleton_cap', customText: 'X2', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
                        { id: 3, cardType: 'golem_pumpkin', customText: 'X1', count: 1, giftName: 'نيزك', giftImage: '/images/1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
                        { id: 4, cardType: 'hog_rider', customText: 'X3', count: 3, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                        { id: 5, cardType: 'evoker_mage', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' }
                    ];
                }

                if (!Array.isArray(cards4BoardConfig.teamBlue.cards) || cards4BoardConfig.teamBlue.cards.length === 0) {
                    cards4BoardConfig.teamBlue.cards = [
                        { id: 101, cardType: 'evoker_mage', customText: 'X1', count: 1, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                        { id: 102, cardType: 'hog_rider', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
                        { id: 103, cardType: 'skeleton_bandana', customText: 'X2', count: 2, giftName: 'مكوك فضائي', giftImage: '/images/1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' },
                        { id: 104, cardType: 'golem_pumpkin', customText: 'X1', count: 1, giftName: 'حمايه', giftImage: '/images/1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
                        { id: 105, cardType: 'skeleton_cap', customText: 'X3', count: 3, giftName: 'دونات', giftImage: '/images/donut.png' }
                    ];
                }
            }
        }
    } catch (e) {
        console.error('Failed to load cards4 board data:', e);
    }

    applyCards4ConfigToUI();
    renderCards4DeckList();
}

function applyCards4ConfigToUI() {
    // 1. Neon Toggle
    const neonOnBtn = document.getElementById('btnCards4NeonOn');
    const neonOffBtn = document.getElementById('btnCards4NeonOff');
    if (neonOnBtn && neonOffBtn) {
        neonOnBtn.classList.toggle('active', cards4BoardConfig.neonEnabled !== false);
        neonOffBtn.classList.toggle('active', cards4BoardConfig.neonEnabled === false);
    }

    // 2. Team Red Color & Title
    const redColorInput = document.getElementById('cards4TeamRedColor');
    const redHexSpan = document.getElementById('cards4TeamRedColorHex');
    const redTitleInput = document.getElementById('cards4TeamRedTitle');
    if (redColorInput) redColorInput.value = cards4BoardConfig.teamRed.color || '#ff2a4a';
    if (redHexSpan) {
        redHexSpan.textContent = cards4BoardConfig.teamRed.color || '#ff2a4a';
        redHexSpan.style.color = cards4BoardConfig.teamRed.color || '#ff2a4a';
    }
    if (redTitleInput) redTitleInput.value = cards4BoardConfig.teamRed.title || 'الفريق الأحمر';

    // 3. Team Blue Color & Title
    const blueColorInput = document.getElementById('cards4TeamBlueColor');
    const blueHexSpan = document.getElementById('cards4TeamBlueColorHex');
    const blueTitleInput = document.getElementById('cards4TeamBlueTitle');
    if (blueColorInput) blueColorInput.value = cards4BoardConfig.teamBlue.color || '#00b4d8';
    if (blueHexSpan) {
        blueHexSpan.textContent = cards4BoardConfig.teamBlue.color || '#00b4d8';
        blueHexSpan.style.color = cards4BoardConfig.teamBlue.color || '#00b4d8';
    }
    if (blueTitleInput) blueTitleInput.value = cards4BoardConfig.teamBlue.title || 'الفريق الأزرق';

    // 4. Font Chips
    document.querySelectorAll('#cards4FontChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.font === (cards4BoardConfig.fontFamily || 'impact'));
    });

    // 5. Gift Pos Chips
    document.querySelectorAll('#cards4GiftPosChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.pos === (cards4BoardConfig.giftPosition || 'top-right'));
    });

    // 6. Disappear Mode
    const disGiftOnly = document.getElementById('btnDisappear4GiftOnly');
    const disCardAndGift = document.getElementById('btnDisappear4CardAndGift');
    if (disGiftOnly && disCardAndGift) {
        disGiftOnly.classList.toggle('active', cards4BoardConfig.disappearMode !== 'card_and_gift');
        disCardAndGift.classList.toggle('active', cards4BoardConfig.disappearMode === 'card_and_gift');
    }

    // 7. Offset Slider
    const offsetSlider = document.getElementById('cards4OffsetYSlider');
    const offsetBadge = document.getElementById('cards4OffsetYBadge');
    if (offsetSlider) offsetSlider.value = cards4BoardConfig.offsetY || 0;
    if (offsetBadge) offsetBadge.textContent = `${cards4BoardConfig.offsetY || 0} px`;

    // 8. Preview links
    const redLink = document.getElementById('cards4RedPreviewLink');
    const blueLink = document.getElementById('cards4BluePreviewLink');
    const extLink = document.getElementById('cards4PreviewExternalLink');
    const simIframe = document.getElementById('cards4SimIframe');

    if (redLink) redLink.href = `/cards4-overlay.html?uid=${currentUid}&team=red`;
    if (blueLink) blueLink.href = `/cards4-overlay.html?uid=${currentUid}&team=blue`;
    if (extLink) extLink.href = `/cards4-overlay.html?uid=${currentUid}`;
    if (simIframe && (!simIframe.src || simIframe.src.endsWith('/cards4-overlay.html'))) {
        simIframe.src = `/cards4-overlay.html?uid=${currentUid}`;
    }
}

function renderCards4DeckList() {
    renderTeam4CardsDeck('teamRed', 'cards4RedDeckList', 'cards4RedCount');
    renderTeam4CardsDeck('teamBlue', 'cards4BlueDeckList', 'cards4BlueCount');
}

function renderTeam4CardsDeck(teamKey, containerId, countId) {
    const container = document.getElementById(containerId);
    const countBadge = document.getElementById(countId);
    if (!container) return;

    const team = cards4BoardConfig[teamKey];
    if (!team || !Array.isArray(team.cards)) return;

    if (countBadge) countBadge.textContent = team.cards.length;

    if (team.cards.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:24px 10px; color:#64748b; font-size:12.5px;">
                لا توجد بطاقات مضافة لهذا الفريق حالياً.<br>
                <button type="button" class="btn-mini mt-2" onclick="addNewCard4Slot('${teamKey}')" style="background:rgba(121,40,202,0.3); border:1px solid #7928ca; color:#fff;">➕ أضف بطاقة كلاسيك الآن</button>
            </div>
        `;
        return;
    }

    container.innerHTML = team.cards.map((card, idx) => {
        const charItem = getCard4McItem(card.cardType);
        const cardSrc = charItem.image || `/images/mcroyale/${card.cardType}.png`;
        const giftSrc = normalizeImgPath(card.giftImage || '/images/rose.png');

        return `
            <div class="card-slot-item ${idx % 2 === 1 ? 'even' : ''}" data-idx="${idx}" style="border-right: 4px solid ${team.color || '#7928ca'};">
                <div class="card-slot-header">
                    <div class="card-slot-badge">
                        <span class="slot-num">#${idx + 1}</span>
                        <span class="slot-name">${escapeHtml(charItem.name)}</span>
                    </div>
                    <div class="card-slot-actions">
                        ${idx > 0 ? `<button type="button" class="btn-order" onclick="moveCard4Slot('${teamKey}', ${idx}, -1)" title="رفع للأعلى">⬆️</button>` : ''}
                        ${idx < team.cards.length - 1 ? `<button type="button" class="btn-order" onclick="moveCard4Slot('${teamKey}', ${idx}, 1)" title="تنزيل للأسفل">⬇️</button>` : ''}
                        <button type="button" class="btn-del-slot" onclick="deleteCard4Slot('${teamKey}', ${idx})" title="حذف البطاقة">🗑️</button>
                    </div>
                </div>

                <!-- MC Royale Card Visual Trigger -->
                <div class="card-slot-field">
                    <label>بطاقة كلاسيك رويال:</label>
                    <button type="button" class="btn-visual-char-trigger" onclick="openVisualCard4Picker('${teamKey}', ${idx})" title="انقر لاختيار بطاقة كلاسيك رويال">
                        <img class="char-thumb-img" src="${cardSrc}" alt="${escapeHtml(charItem.name)}" onerror="this.src='/images/mcroyale/skeleton_bandana.png'">
                        <span class="char-name-label">${escapeHtml(charItem.name)}</span>
                        <span class="char-click-hint">انقر للتغيير 🎴</span>
                    </button>
                </div>

                <!-- Card Bottom Text (النص أسفل البطاقة) -->
                <div class="card-slot-field">
                    <label>النص الظاهر أسفل البطاقة:</label>
                    <input type="text" 
                           class="form-input card-bottom-text-input" 
                           placeholder="اكتب النص هنا (مثال: X1 أو هجوم أو دفاع...)" 
                           value="${escapeHtml(card.customText !== undefined && card.customText !== null ? card.customText : (card.count ? 'X' + card.count : ''))}" 
                           oninput="onCard4TextChange('${teamKey}', ${idx}, this.value)">
                </div>

                <!-- Visual Gift Trigger -->
                <div class="card-slot-field">
                    <label>الهدية المطلوبة لإسقاط البطاقة:</label>
                    <button type="button" class="btn-visual-gift-trigger" onclick="openVisualGiftPicker('${teamKey}', ${idx}, 'cards4')" title="اختيار الهدية من قائمة الهدايا">
                        <img src="${giftSrc}" alt="${escapeHtml(card.giftName || 'هدية')}" onerror="this.src='/images/rose.png'">
                        <span class="gift-name-label">${escapeHtml(card.giftName || 'اختر هدية')}</span>
                        <span class="gift-click-hint">انقر للتغيير 🎁</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function onCard4TextChange(teamKey, idx, val) {
    if (!cards4BoardConfig[teamKey] || !cards4BoardConfig[teamKey].cards[idx]) return;
    cards4BoardConfig[teamKey].cards[idx].customText = val;
    const numMatch = (val || '').match(/\d+/);
    if (numMatch) {
        cards4BoardConfig[teamKey].cards[idx].count = parseInt(numMatch[0]) || 1;
    }
    saveCards4BoardConfig(true);
}

function moveCard4Slot(teamKey, idx, direction) {
    const team = cards4BoardConfig[teamKey];
    if (!team || !Array.isArray(team.cards)) return;
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= team.cards.length) return;
    const temp = team.cards[idx];
    team.cards[idx] = team.cards[targetIdx];
    team.cards[targetIdx] = temp;
    renderCards4DeckList();
    saveCards4BoardConfig(true);
    showToast('تم تعديل ترتيب البطاقات بنجاح! 🔄', 'info');
}

function addNewCard4Slot(teamKey) {
    if (!cards4BoardConfig[teamKey]) return;
    const teamCards = cards4BoardConfig[teamKey].cards;
    const nextId = (teamCards.length ? Math.max(...teamCards.map(c => c.id || 0)) : 0) + 1;
    const itemChoice = CARD4_MC_ITEMS[teamCards.length % CARD4_MC_ITEMS.length];
    teamCards.push({
        id: nextId,
        cardType: itemChoice.id,
        customText: `X${teamCards.length + 1}`,
        count: teamCards.length + 1,
        giftName: 'وردة',
        giftImage: '/images/rose.png'
    });
    renderCards4DeckList();
    saveCards4BoardConfig(true);
    showToast(`تمت إضافة بطاقة كلاسيك جديدة (${itemChoice.name}) بنجاح! ✨`, 'success');
}

function deleteCard4Slot(teamKey, idx) {
    if (!cards4BoardConfig[teamKey] || !cards4BoardConfig[teamKey].cards[idx]) return;
    cards4BoardConfig[teamKey].cards.splice(idx, 1);
    renderCards4DeckList();
    saveCards4BoardConfig(true);
    showToast('تم حذف بطاقة الكلاسيك.', 'info');
}

function clearTeam4Cards(teamKey) {
    if (!cards4BoardConfig[teamKey]) return;
    const teamTitle = cards4BoardConfig[teamKey].title || (teamKey === 'teamRed' ? 'الفريق الأحمر' : 'الفريق الأزرق');
    if (confirm(`هل أنت متأكد من حذف جميع بطاقات ${teamTitle}؟`)) {
        cards4BoardConfig[teamKey].cards = [];
        renderCards4DeckList();
        saveCards4BoardConfig(true);
        showToast(`تم تفريغ بطاقات ${teamTitle}.`, 'info');
    }
}

function toggleCards4Neon(enabled) {
    cards4BoardConfig.neonEnabled = !!enabled;
    const neonOnBtn = document.getElementById('btnCards4NeonOn');
    const neonOffBtn = document.getElementById('btnCards4NeonOff');
    if (neonOnBtn) neonOnBtn.classList.toggle('active', cards4BoardConfig.neonEnabled);
    if (neonOffBtn) neonOffBtn.classList.toggle('active', !cards4BoardConfig.neonEnabled);
    saveCards4BoardConfig(true);
}

function setCards4Font(font) {
    cards4BoardConfig.fontFamily = font;
    document.querySelectorAll('#cards4FontChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.font === font);
    });
    saveCards4BoardConfig(true);
}

function setCards4GiftPos(pos) {
    cards4BoardConfig.giftPosition = pos;
    document.querySelectorAll('#cards4GiftPosChips .chip').forEach(c => {
        c.classList.toggle('active', c.dataset.pos === pos);
    });
    saveCards4BoardConfig(true);
}

function setCards4DisappearMode(mode) {
    cards4BoardConfig.disappearMode = mode;
    const disGiftOnly = document.getElementById('btnDisappear4GiftOnly');
    const disCardAndGift = document.getElementById('btnDisappear4CardAndGift');
    if (disGiftOnly) disGiftOnly.classList.toggle('active', mode !== 'card_and_gift');
    if (disCardAndGift) disCardAndGift.classList.toggle('active', mode === 'card_and_gift');
    saveCards4BoardConfig(true);
}

function onCards4OffsetYChange(val) {
    cards4BoardConfig.offsetY = parseInt(val) || 0;
    const offsetBadge = document.getElementById('cards4OffsetYBadge');
    if (offsetBadge) offsetBadge.textContent = `${val} px`;
    saveCards4BoardConfig(true);
}

function onCards4TeamColorChange(teamKey, colorVal) {
    if (!cards4BoardConfig[teamKey]) return;
    cards4BoardConfig[teamKey].color = colorVal;
    const hexSpan = document.getElementById(teamKey === 'teamRed' ? 'cards4TeamRedColorHex' : 'cards4TeamBlueColorHex');
    if (hexSpan) {
        hexSpan.textContent = colorVal;
        hexSpan.style.color = colorVal;
    }
    saveCards4BoardConfig(true);
}

function onCards4TeamTitleChange(teamKey, titleVal) {
    if (!cards4BoardConfig[teamKey]) return;
    cards4BoardConfig[teamKey].title = titleVal;
    saveCards4BoardConfig(true);
}

async function saveCards4BoardConfig(silent = false) {
    if (!currentUid) return;
    try {
        const res = await fetch(`/api/cards4-board/${currentUid}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cards4BoardConfig)
        });
        const data = await res.json();
        if (data.success) {
            if (!silent) showToast('✅ تم حفظ ونشر إعدادات بطاقات كلاسيك (هدايا 4) لـ OBS بنجاح!', 'success');
            const iframe = document.getElementById('cards4SimIframe');
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.location.reload();
            }
        }
    } catch (e) {
        console.error('Error saving cards4 settings:', e);
        if (!silent) showToast('حدث خطأ أثناء حفظ الإعدادات', 'error');
    }
}

function copyCards4OverlayUrl(type = 'dual') {
    const origin = window.location.origin;
    let url = `${origin}/cards4-overlay.html?uid=${currentUid}`;
    if (type === 'red') url += '&team=red';
    else if (type === 'blue') url += '&team=blue';
    navigator.clipboard.writeText(url).then(() => {
        const label = type === 'red' ? 'الفريق الأحمر' : type === 'blue' ? 'الفريق الأزرق' : 'الشاشتين معاً (Dual Screen)';
        showToast(`📋 تم نسخ رابط بطاقات كلاسيك 4 (${label}) لـ OBS!`, 'success');
    }).catch(() => {
        prompt('انسخ الرابط يدوياً:', url);
    });
}

// ================= MODAL: VISUAL CARD 4 PICKER (MC Royale) ================= //
function openVisualCard4Picker(teamKey, slotIdx) {
    activeVisualCard4Team = teamKey || 'teamRed';
    activeVisualCard4SlotIdx = slotIdx;
    const modal = document.getElementById('visualCard4PickerModal');
    if (!modal) return;
    modal.classList.add('open');
    renderVisualCard4Gallery();
}

function closeVisualCard4Picker() {
    const modal = document.getElementById('visualCard4PickerModal');
    if (modal) modal.classList.remove('open');
    activeVisualCard4SlotIdx = null;
}

function renderVisualCard4Gallery() {
    const grid = document.getElementById('visualCard4GalleryGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const currentCard = (activeVisualCard4SlotIdx !== null && cards4BoardConfig[activeVisualCard4Team]?.cards[activeVisualCard4SlotIdx])
        ? cards4BoardConfig[activeVisualCard4Team].cards[activeVisualCard4SlotIdx]
        : null;
    const currentType = currentCard ? (currentCard.cardType || 'skeleton_bandana') : '';

    CARD4_MC_ITEMS.forEach(item => {
        const isSelected = currentType === item.id;
        const cardEl = document.createElement('div');
        cardEl.className = `visual-char-option-card ${isSelected ? 'selected' : ''}`;
        cardEl.style.cssText = `
            position: relative;
            background: ${isSelected ? 'rgba(121, 40, 202, 0.25)' : 'rgba(255, 255, 255, 0.04)'};
            border: 2px solid ${isSelected ? '#b594f8' : 'rgba(255, 255, 255, 0.12)'};
            border-radius: 14px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.22s ease;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        `;
        cardEl.onclick = () => selectVisualCard4(item.id, item.name);

        cardEl.innerHTML = `
            <div style="width:100%; height:110px; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle, rgba(121,40,202,0.2), transparent); border-radius:10px; margin-bottom:8px;">
                <img src="${item.image}" alt="${escapeHtml(item.name)}" style="max-height:95px; max-width:95px; object-fit:contain; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.6));" onerror="this.src='/images/mcroyale/skeleton.gif'">
            </div>
            <div style="width:100%;">
                <span style="background:rgba(121,40,202,0.35); color:#e2bbf7; border:1px solid #7928ca; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:10px; display:inline-block; margin-bottom:4px;">${escapeHtml(item.badge)}</span>
                <h4 style="margin:2px 0 4px 0; color:#fff; font-size:13.5px; font-weight:900;">${escapeHtml(item.name)}</h4>
                <p style="margin:0; font-size:11px; color:#94a3b8; line-height:1.3;">${escapeHtml(item.desc)}</p>
            </div>
            ${isSelected ? '<div style="position:absolute; top:8px; right:8px; background:#22c55e; color:#fff; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:900; box-shadow:0 0 8px #22c55e;">✓</div>' : ''}
        `;
        grid.appendChild(cardEl);
    });
}

function selectVisualCard4(cardTypeId, cardTypeName) {
    if (activeVisualCard4SlotIdx === null) return;
    const team = cards4BoardConfig[activeVisualCard4Team];
    if (!team || !team.cards[activeVisualCard4SlotIdx]) return;

    team.cards[activeVisualCard4SlotIdx].cardType = cardTypeId;
    closeVisualCard4Picker();
    renderCards4DeckList();
    saveCards4BoardConfig(true);
    const teamLabel = activeVisualCard4Team === 'teamRed' ? 'الفريق الأحمر' : 'الفريق الأزرق';
    showToast(`تم اختيار بطاقة (${cardTypeName}) لـ ${teamLabel} للخانة رقم ${activeVisualCard4SlotIdx + 1}! 🎴`, 'success');
}



// ================= SECTION: LAST SUPPORTER FRAMES (إطارات آخر داعم) ================= //
let supporterFrameConfig = {
    frameStyle: 'sakura',
    frameColor: '#b594f8',
    hueRotate: 0,
    saturation: 100,
    brightness: 100,
    glowIntensity: 1.0,
    widgetUrl: 'https://tikalert-eg.com/last-supporter/widget?username=mezo',
    frameScale: 100,
    offsetX: 0,
    offsetY: 0,
    animationStyle: 'slide_up',
    customMediaUrl: ''
};

async function loadSupporterFrameConfig() {
    try {
        const res = await fetch(`/api/supporter-frame/${currentUid}`);
        const data = await res.json();
        if (data.success && data.frame) {
            supporterFrameConfig = { ...supporterFrameConfig, ...data.frame };
            syncSupporterFrameUI();
        }
    } catch (e) {
        console.error('Failed to load supporter frame config:', e);
    }
}

function syncSupporterFrameUI() {
    // 1. Style Cards
    document.querySelectorAll('#framesPresetGrid .frame-preset-card').forEach(card => {
        card.classList.toggle('active', card.dataset.framestyle === supporterFrameConfig.frameStyle);
    });

    // 1.1 Animation Style Chips
    document.querySelectorAll('#supporterAnimChipsGrid .style-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.animstyle === (supporterFrameConfig.animationStyle || 'slide_up'));
    });

    // 2. Colors & Sliders
    const colEl = document.getElementById('supporterFrameColor');
    const colHex = document.getElementById('supporterFrameColorHex');
    if (colEl) colEl.value = supporterFrameConfig.frameColor || '#b594f8';
    if (colHex) {
        colHex.textContent = supporterFrameConfig.frameColor || '#b594f8';
        colHex.style.color = supporterFrameConfig.frameColor || '#b594f8';
    }

    const hueEl = document.getElementById('supporterFrameHue');
    const hueVal = document.getElementById('supporterFrameHueVal');
    if (hueEl) hueEl.value = supporterFrameConfig.hueRotate || 0;
    if (hueVal) hueVal.textContent = `${supporterFrameConfig.hueRotate || 0}°`;

    const satEl = document.getElementById('supporterFrameSat');
    const satVal = document.getElementById('supporterFrameSatVal');
    if (satEl) satEl.value = supporterFrameConfig.saturation !== undefined ? supporterFrameConfig.saturation : 100;
    if (satVal) satVal.textContent = `${supporterFrameConfig.saturation !== undefined ? supporterFrameConfig.saturation : 100}%`;

    const glowEl = document.getElementById('supporterFrameGlow');
    const glowVal = document.getElementById('supporterFrameGlowVal');
    const glowPct = Math.round((supporterFrameConfig.glowIntensity !== undefined ? supporterFrameConfig.glowIntensity : 1.0) * 100);
    if (glowEl) glowEl.value = glowPct;
    if (glowVal) glowVal.textContent = `${glowPct}%`;

    // 3. Widget URL & Transform
    const urlEl = document.getElementById('supporterFrameWidgetUrl');
    if (urlEl) urlEl.value = supporterFrameConfig.widgetUrl || 'https://tikalert-eg.com/last-supporter/widget?username=mezo';

    const scaleEl = document.getElementById('supporterFrameScale');
    const scaleVal = document.getElementById('supporterFrameScaleVal');
    if (scaleEl) scaleEl.value = supporterFrameConfig.frameScale || 100;
    if (scaleVal) scaleVal.textContent = `${supporterFrameConfig.frameScale || 100}%`;

    const offXEl = document.getElementById('supporterFrameOffsetX');
    const offXVal = document.getElementById('supporterFrameOffsetXVal');
    if (offXEl) offXEl.value = supporterFrameConfig.offsetX || 0;
    if (offXVal) offXVal.textContent = `${supporterFrameConfig.offsetX || 0}px`;

    const offYEl = document.getElementById('supporterFrameOffsetY');
    const offYVal = document.getElementById('supporterFrameOffsetYVal');
    if (offYEl) offYEl.value = supporterFrameConfig.offsetY || 0;
    if (offYVal) offYVal.textContent = `${supporterFrameConfig.offsetY || 0}px`;

    // 4. Update Preview Simulator Iframe
    updateSupporterFramePreview();
}

function hexToHsl(hex) {
    if (!hex) return { h: 0, s: 100, l: 50 };
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function selectSupporterFrameStyle(style) {
    supporterFrameConfig.frameStyle = style;
    document.querySelectorAll('#framesPresetGrid .frame-preset-card').forEach(card => {
        card.classList.toggle('active', card.dataset.framestyle === style);
    });
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

function setSupporterAnimationStyle(style) {
    supporterFrameConfig.animationStyle = style;
    document.querySelectorAll('#supporterAnimChipsGrid .style-chip').forEach(chip => {
        chip.classList.toggle('active', chip.dataset.animstyle === style);
    });
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
    showToast(`🎭 تم تفعيل أنيميشن الإطار: ${style}`, 'info');
}

function onSupporterFrameColorChange(val) {
    supporterFrameConfig.frameColor = val;
    // Base video hue is lilac (~250deg). Calculate delta rotation needed to shift lilac to target color:
    const hsl = hexToHsl(val);
    const deltaHue = Math.round((hsl.h - 250 + 360) % 360);
    supporterFrameConfig.hueRotate = deltaHue;

    const colHex = document.getElementById('supporterFrameColorHex');
    if (colHex) {
        colHex.textContent = val;
        colHex.style.color = val;
    }
    const hueInput = document.getElementById('supporterFrameHue');
    const hueVal = document.getElementById('supporterFrameHueVal');
    if (hueInput) hueInput.value = deltaHue;
    if (hueVal) hueVal.textContent = `${deltaHue}°`;

    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

function onSupporterFrameHueChange(val) {
    supporterFrameConfig.hueRotate = parseInt(val) || 0;
    const hueVal = document.getElementById('supporterFrameHueVal');
    if (hueVal) hueVal.textContent = `${val}°`;
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

function onSupporterFrameSatChange(val) {
    supporterFrameConfig.saturation = parseInt(val) || 100;
    const satVal = document.getElementById('supporterFrameSatVal');
    if (satVal) satVal.textContent = `${val}%`;
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

function onSupporterFrameGlowChange(val) {
    const num = parseInt(val) || 100;
    supporterFrameConfig.glowIntensity = num / 100;
    const glowVal = document.getElementById('supporterFrameGlowVal');
    if (glowVal) glowVal.textContent = `${num}%`;
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

function applyFrameColorPreset(hex, hue) {
    supporterFrameConfig.frameColor = hex;
    if (hue !== undefined && hue !== null) {
        supporterFrameConfig.hueRotate = hue;
    } else {
        const hsl = hexToHsl(hex);
        supporterFrameConfig.hueRotate = Math.round((hsl.h - 250 + 360) % 360);
    }
    syncSupporterFrameUI();
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

function onSupporterFrameWidgetUrlChange(val) {
    supporterFrameConfig.widgetUrl = val.trim();
    updateSupporterFramePreview();
}

function onSupporterFrameScaleChange(val) {
    supporterFrameConfig.frameScale = parseInt(val) || 100;
    const scaleVal = document.getElementById('supporterFrameScaleVal');
    if (scaleVal) scaleVal.textContent = `${val}%`;
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

function onSupporterFrameOffsetChange(axis, val) {
    if (axis === 'y') {
        supporterFrameConfig.offsetY = parseInt(val) || 0;
        const offYVal = document.getElementById('supporterFrameOffsetYVal');
        if (offYVal) offYVal.textContent = `${val}px`;
    } else if (axis === 'x') {
        supporterFrameConfig.offsetX = parseInt(val) || 0;
        const offXVal = document.getElementById('supporterFrameOffsetXVal');
        if (offXVal) offXVal.textContent = `${val}px`;
    }
    updateSupporterFramePreview();
    saveSupporterFrameConfigAction(true);
}

async function uploadCustomFrameMedia(file) {
    if (!file) return;
    try {
        const formData = new FormData();
        formData.append('frameMedia', file);
        showToast('⏳ جاري رفع ملف الإطار...', 'info');
        const res = await fetch('/api/upload-frame-media', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.success && data.url) {
            supporterFrameConfig.customMediaUrl = data.url;
            supporterFrameConfig.frameStyle = 'custom';
            const info = document.getElementById('customFrameUploadedInfo');
            if (info) {
                info.style.display = 'block';
                info.textContent = `✅ تم رفع الإطار بنجاح: ${data.url}`;
            }
            syncSupporterFrameUI();
            saveSupporterFrameConfigAction(false);
            showToast('✅ تم تفعيل إطارك المرفوع بنجاح!', 'success');
        } else {
            showToast('فشل رفع ملف الإطار', 'error');
        }
    } catch (e) {
        showToast('خطأ أثناء رفع ملف الإطار', 'error');
    }
}

function updateSupporterFramePreview() {
    const iframe = document.getElementById('supporterFramePreviewFrame');
    if (!iframe || !iframe.contentWindow) return;
    try {
        if (typeof iframe.contentWindow.applyFrameConfig === 'function') {
            iframe.contentWindow.applyFrameConfig(supporterFrameConfig);
        }
    } catch (e) {}
}

let saveSupporterFrameTimeout = null;
async function saveSupporterFrameConfigAction(silent = false) {
    if (silent) {
        if (saveSupporterFrameTimeout) clearTimeout(saveSupporterFrameTimeout);
        saveSupporterFrameTimeout = setTimeout(() => saveSupporterFrameConfigAction(false), 500);
        return;
    }
    try {
        const res = await fetch(`/api/supporter-frame/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(supporterFrameConfig)
        });
        const data = await res.json();
        if (data.success) {
            showToast('👑 تم حفظ إعدادات إطار آخر داعم ونشرها لـ OBS بنجاح!', 'success');
        }
    } catch (e) {
        showToast('خطأ أثناء حفظ إعدادات الإطار', 'error');
    }
}

// ================= SECTION 5.5: إجمالي المتابعين المباشر (3D CYBER HUD + STREAMER EXTRAS) ================= //
let currentFollowersState = {
    title: 'إجمالي المتابعين',
    featuredUser: null,
    usersList: [],
    grandTotalFollowers: 0,
    grandTotalLikes: 0,
    grandTotalFollowing: 0,
    grandTotalSessionGain: 0,
    totalUsersCount: 1,
    settings: {
        layoutStyle: 'royal_hud',
        theme: 'cyber_tiktok',
        customLabel: 'إجمالي المتابعين',
        customBadgeText: 'نجم البث المباشر 👑',
        customGoal: 0,
        showGoalBar: true,
        showLikesBadge: true,
        showSessionGain: true,
        showParticles: true,
        digitBoxes: true,
        soundEnabled: true,
        overlayScale: 100
    },
    history: []
};

let prevFolSingleCount = 0;

function formatFolNum(n) {
    return (parseInt(n, 10) || 0).toLocaleString('en-US');
}

function loadFollowersState() {
    fetch('/api/followers/state')
        .then(r => r.json())
        .then(data => {
            if (data && data.success) {
                currentFollowersState = { ...currentFollowersState, ...data };
                renderFollowersSectionUI();
            }
        })
        .catch(() => {});
}

// Ensure 1-second active tick when viewing the Followers section
setInterval(() => {
    if (currentTab === 'followersSection') {
        loadFollowersState();
    }
}, 1000);

function renderFollowersSectionUI() {
    const st = currentFollowersState;
    if (!st) return;

    // 1. Live Tick Timestamp
    const tickEl = document.getElementById('followersLastTickText');
    if (tickEl) {
        const nowStr = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        tickEl.textContent = `يتجدد كل ثانية ⚡ (${nowStr})`;
    }

    // 2. Sync Direct OBS URL Input
    const obsUrlInp = document.getElementById('folObsDirectUrlInput');
    if (obsUrlInp) {
        obsUrlInp.value = `${window.location.origin}/followers-overlay.html`;
    }

    // 3. Sync Layout Style, Theme Chips, Feature Toggles & Custom Inputs
    if (st.settings) {
        const cfg = st.settings;
        const activeLayout = cfg.layoutStyle || 'royal_hud';
        document.querySelectorAll('#folLayoutStyleChips .style-chip').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.layout === activeLayout);
        });

        const activeTheme = cfg.theme || 'cyber_tiktok';
        document.querySelectorAll('#folThemeChips .style-chip').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === activeTheme);
        });

        const togMap = {
            togFolDigitBoxes: cfg.digitBoxes !== false,
            togFolGoalBar: cfg.showGoalBar !== false,
            togFolLikes: cfg.showLikesBadge !== false,
            togFolGain: cfg.showSessionGain !== false,
            togFolParticles: cfg.showParticles !== false,
            togFolSound: cfg.soundEnabled !== false
        };
        Object.entries(togMap).forEach(([id, isActive]) => {
            const btn = document.getElementById(id);
            if (btn) btn.classList.toggle('active', isActive);
        });

        const lblInp = document.getElementById('folCustomLabelInput');
        if (lblInp && document.activeElement !== lblInp && cfg.customLabel) {
            lblInp.value = cfg.customLabel;
        }

        const goalInp = document.getElementById('folCustomGoalInput');
        if (goalInp && document.activeElement !== goalInp && cfg.customGoal !== undefined) {
            goalInp.value = cfg.customGoal;
        }
    }

    // 4. Active Single User Panel
    const spot = st.featuredUser || (st.usersList && st.usersList[0]);
    if (spot) {
        const av = document.getElementById('folSpotAvatar');
        const fallbackAv = `https://api.dicebear.com/7.x/bottts/svg?seed=${spot.username}`;
        if (av && av.getAttribute('data-LastSrc') !== spot.avatar) {
            av.src = spot.avatar || fallbackAv;
            av.setAttribute('data-LastSrc', spot.avatar || fallbackAv);
            av.onerror = () => { av.src = fallbackAv; };
        }

        const nm = document.getElementById('folSpotName');
        if (nm) nm.textContent = spot.nickname || spot.username;

        const hnd = document.getElementById('folSpotHandle');
        if (hnd) hnd.textContent = `@${spot.username}`;

        const lks = document.getElementById('folSpotLikes');
        if (lks) lks.textContent = `❤️ ${formatFolNum(spot.likes || 0)} لايك`;

        const flg = document.getElementById('folSpotFollowing');
        if (flg) flg.textContent = `👥 ${formatFolNum(spot.following || 0)} يتابع`;

        const goalInfo = document.getElementById('folSpotGoalInfo');
        if (goalInfo) {
            goalInfo.textContent = `🎯 الهدف: ${formatFolNum(spot.nextGoal || 105000)} (متبقي ${formatFolNum(spot.remainingToGoal || 0)})`;
        }

        const dig = document.getElementById('folSpotDigits');
        const newCount = parseInt(spot.followers, 10) || 0;
        if (dig) {
            if (prevFolSingleCount > 0 && newCount !== prevFolSingleCount) {
                dig.style.transform = 'scale(1.12)';
                setTimeout(() => { dig.style.transform = 'scale(1)'; }, 350);
            }
            dig.textContent = formatFolNum(newCount);
        }
        prevFolSingleCount = newCount;

        const gn = document.getElementById('folSpotGain');
        if (gn) gn.textContent = `+${formatFolNum(spot.sessionGain || 0)} اليوم ⚡`;

        const userInp = document.getElementById('folUsernameInput');
        if (userInp && document.activeElement !== userInp && !userInp.value) {
            userInp.value = spot.username;
        }
    }
}

async function handleLookupFollowerUser() {
    const inp = document.getElementById('folUsernameInput');
    const btn = document.getElementById('btnFolLookup');
    const user = inp ? inp.value.trim().replace(/^@/, '') : '';
    if (!user) {
        showToast('⚠️ يرجى كتابة يوزر التيك توك أولاً!', 'warning');
        if (inp) inp.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جاري الفحص...';
    }

    try {
        const res = await fetch('/api/race/user/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: 'tiktok', username: user })
        });
        const data = await res.json();
        if (!data.success || !data.user) throw new Error(data.error || 'تعذر جلب الحساب');

        const box = document.getElementById('folFetchedPreviewBox');
        const av = document.getElementById('folFetchedAvatar');
        const nm = document.getElementById('folFetchedName');
        const hnd = document.getElementById('folFetchedHandle');
        const fBadge = document.getElementById('folFetchedFollowersBadge');

        if (av) av.src = data.user.avatar;
        if (nm) nm.textContent = data.user.nickname;
        if (hnd) hnd.textContent = `@${data.user.username}`;
        if (fBadge) fBadge.textContent = `👥 إجمالي المتابعين الآن: ${formatFolNum(data.user.followers || 0)} متابع · ❤️ ${formatFolNum(data.user.likes || 0)} لايك`;
        if (box) box.style.display = 'flex';

        showToast(`✅ تم العثور على ${data.user.nickname} (${formatFolNum(data.user.followers || 0)} متابع)`, 'success');
    } catch (err) {
        showToast('فشل فحص الحساب: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔍 فحص الحساب';
        }
    }
}

async function handleAddFollowerUser(e) {
    if (e && e.preventDefault) e.preventDefault();
    const inp = document.getElementById('folUsernameInput');
    const btn = document.getElementById('btnFolSubmit');

    const user = inp ? inp.value.trim().replace(/^@/, '') : '';
    if (!user) {
        showToast('يرجى إدخال يوزر التيك توك', 'error');
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جاري ربط الحساب وتحديث الأوفرلاي...';
    }

    try {
        const res = await fetch('/api/followers/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: user,
                setFeatured: true,
                singleUserOnly: true
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'فشل ربط الحساب');

        const box = document.getElementById('folFetchedPreviewBox');
        if (box) box.style.display = 'none';

        if (data.state) {
            currentFollowersState = { ...currentFollowersState, ...data.state };
            renderFollowersSectionUI();
        }
        showToast(`🎉 تم تفعيل حساب ${data.user.nickname} (@${data.user.username}) في الأوفرلاي (${formatFolNum(data.user.followers)} متابع)!`, 'success');
    } catch (err) {
        showToast('حدث خطأ: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⚡ تفعيل الحساب وتحديثه كل ثانية';
        }
    }
}

async function forceRefreshAllFollowers() {
    const btn = document.getElementById('btnForceRefreshAllFol');
    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جاري المزامنة...';
    }
    try {
        const res = await fetch('/api/followers/refresh-all', { method: 'POST' });
        const data = await res.json();
        if (data && data.success) {
            currentFollowersState = { ...currentFollowersState, ...data };
            renderFollowersSectionUI();
            const spot = data.featuredUser || (data.usersList && data.usersList[0]);
            showToast(`✅ تم التحديث الفوري! إجمالي المتابعين: ${formatFolNum(spot ? spot.followers : data.grandTotalFollowers)}`, 'success');
        }
    } catch (e) {
        showToast('تعذر التحديث الفوري', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔄 مزامنة حقيقية مع تيك توك الآن';
        }
    }
}

async function simulateFollowerGain(id = null, count = 1) {
    try {
        const res = await fetch('/api/followers/simulate-gain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, count })
        });
        const data = await res.json();
        if (data && data.success) {
            playRaceVictorySound();
            showToast(`🎉 +${count} متابع جديد لـ ${data.user.nickname}! الإجمالي: ${formatFolNum(data.user.followers)}`, 'success');
        }
    } catch (e) {}
}

async function resetFollowersSessionGains() {
    try {
        await fetch('/api/followers/reset-gains', { method: 'POST' });
        showToast('↺ تم تصفير عداد الزيادة المباشرة لهذه الجلسة', 'info');
    } catch (e) {}
}

async function setFollowersLayoutStyle(layoutStyle) {
    try {
        const res = await fetch('/api/followers/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { layoutStyle } })
        });
        const data = await res.json();
        if (data && data.state) {
            currentFollowersState = { ...currentFollowersState, ...data.state };
            renderFollowersSectionUI();
        }
        showToast(`📐 تم تغيير تصميم الأوفرلاي بنجاح!`, 'info', 2000);
    } catch (e) {}
}

async function setFollowersTheme(theme) {
    try {
        const res = await fetch('/api/followers/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { theme } })
        });
        const data = await res.json();
        if (data && data.state) {
            currentFollowersState = { ...currentFollowersState, ...data.state };
            renderFollowersSectionUI();
        }
        showToast(`🎨 تم تطبيق ثيم الإضاءة بنجاح!`, 'info', 2000);
    } catch (e) {}
}

async function toggleFollowersFeature(featureKey) {
    const cfg = currentFollowersState.settings || {};
    const nextVal = cfg[featureKey] === false ? true : false;
    try {
        const res = await fetch('/api/followers/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { [featureKey]: nextVal } })
        });
        const data = await res.json();
        if (data && data.state) {
            currentFollowersState = { ...currentFollowersState, ...data.state };
            renderFollowersSectionUI();
        }
        showToast(nextVal ? '✅ تم تفعيل الإضافة في الأوفرلاي' : '⚪ تم إخفاء العنصر من الأوفرلاي', 'info', 1800);
    } catch (e) {}
}

async function saveFollowersCustomGoal() {
    const inp = document.getElementById('folCustomGoalInput');
    const customGoal = inp ? Math.max(0, parseInt(inp.value, 10) || 0) : 0;
    try {
        const res = await fetch('/api/followers/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { customGoal } })
        });
        const data = await res.json();
        if (data && data.state) {
            currentFollowersState = { ...currentFollowersState, ...data.state };
            renderFollowersSectionUI();
        }
        showToast(
            customGoal > 0
                ? `🎯 تم تحديد هدف المتابعين عند ${formatFolNum(customGoal)} متابع!`
                : `🎯 تم تفعيل حساب الهدف الذكي التلقائي!`,
            'success',
            2200
        );
    } catch (e) {}
}

async function saveFollowersCustomLabel() {
    const inp = document.getElementById('folCustomLabelInput');
    const customLabel = inp && inp.value.trim() ? inp.value.trim() : 'إجمالي المتابعين';
    try {
        await fetch('/api/followers/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settings: { customLabel } })
        });
        showToast(`✏️ تم تحديث نص العنوان إلى "${customLabel}"`, 'success', 2000);
    } catch (e) {}
}

async function triggerFollowersOverlayEvent(type) {
    try {
        const res = await fetch('/api/followers/trigger-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
        const data = await res.json();
        if (data && data.success) {
            playRaceVictorySound();
            showToast(
                type === 'goal_reached'
                    ? '🏆 تم إطلاق احتفالية تحقيق الهدف والألعاب النارية على الأوفرلاي!'
                    : '🔥 تم إرسال نداء حماسي للمتابعين على الأوفرلاي!',
                'success',
                2500
            );
        }
    } catch (e) {}
}

async function sendFollowersCustomShoutout() {
    const inp = document.getElementById('folLiveShoutoutInput');
    const msg = inp ? inp.value.trim() : '';
    if (!msg) {
        showToast('⚠️ اكتب الرسالة الحماسية أولاً!', 'warning');
        if (inp) inp.focus();
        return;
    }
    try {
        const res = await fetch('/api/followers/trigger-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'custom_shoutout', message: msg })
        });
        const data = await res.json();
        if (data && data.success) {
            if (inp) inp.value = '';
            playRaceVictorySound();
            showToast(`📢 تم عرض رسالتك مباشرة على شاشة الأوفرلاي!`, 'success', 2200);
        }
    } catch (e) {}
}

function triggerFollowersGainCelebration(celeb) {
    if (!celeb) return;
    if (currentFollowersState.settings && currentFollowersState.settings.soundEnabled !== false) {
        playRaceVictorySound();
    }
}

// ================= SECTION 5.8: تركيبات تيك توك لايف (TIKTOK LIVE CONNECTOR & GIFT COMBINATIONS) ================= //
let currentTarkibatConfig = {
    tiktokUsername: 'mezo_1st',
    autoWatchdog: true,
    overlayStyle: {
        theme: 'royal_purple',
        position: 'top-center',
        alertDuration: 5,
        soundEnabled: true,
        showDonorAvatar: true,
        showGiftCoins: true,
        scale: 100
    },
    items: []
};

let currentTarkibatLiveState = {
    username: 'mezo_1st',
    isLive: false,
    isConnected: false,
    isConnecting: false,
    watchdogActive: false,
    roomId: null,
    viewerCount: 0,
    totalGiftsReceived: 0,
    totalDiamondsReceived: 0,
    totalLikesReceived: 0,
    liveTitle: '',
    profile: null,
    lastCheckedAt: null,
    statusMessage: 'غير متصل حالياً — أدخل يوزر التيك توك واضغط فحص أو Connect',
    events: []
};

let newTrkSelectedGift = {
    name: 'وردة',
    image: '/images/rose.png',
    coins: 1
};

async function loadTarkibatData() {
    if (!currentUid) return;
    try {
        const res = await fetch(`/api/tarkibat/${encodeURIComponent(currentUid)}`);
        const data = await res.json();
        if (data && data.success) {
            if (data.config) {
                currentTarkibatConfig = { ...currentTarkibatConfig, ...data.config };
            }
            if (data.liveState) {
                currentTarkibatLiveState = { ...currentTarkibatLiveState, ...data.liveState };
            }
            const userInp = document.getElementById('trkUsernameInput');
            if (userInp && document.activeElement !== userInp && currentTarkibatConfig.tiktokUsername) {
                userInp.value = currentTarkibatConfig.tiktokUsername;
            }
            renderTarkibatStatusUI();
            renderTarkibatItemsList();
        }
    } catch (e) {}

    // Update OBS URL & Simulator Iframe with encrypted currentUid
    const obsInp = document.getElementById('trkObsDirectUrlInput');
    if (obsInp) {
        obsInp.value = `${window.location.origin}/tarkibat-overlay.html?uid=${currentUid}`;
    }
    const extLink = document.getElementById('trkExternalPreviewLink');
    if (extLink) {
        extLink.href = `/tarkibat-overlay.html?uid=${currentUid}&preview=1`;
    }
    const sim = document.getElementById('trkSimIframe');
    if (sim && (!sim.src || !sim.src.includes(`uid=${currentUid}`))) {
        sim.src = `/tarkibat-overlay.html?uid=${currentUid}&preview=1`;
    }
}

function renderTarkibatStatusUI() {
    const st = currentTarkibatLiveState;
    if (!st) return;

    const pill = document.getElementById('trkConnectionPill');
    const isLiveBadge = document.getElementById('trkIsLiveBadge');
    const msgEl = document.getElementById('trkStatusMessageText');
    const btnConn = document.getElementById('btnTrkConnect');
    const btnDisc = document.getElementById('btnTrkDisconnect');

    if (st.isConnected) {
        if (pill) {
            pill.textContent = '🟢 متصل باللايف الآن (Connected)';
            pill.style.background = 'rgba(16, 185, 129, 0.22)';
            pill.style.borderColor = '#10b981';
            pill.style.color = '#6ee7b7';
        }
        if (btnConn) btnConn.style.display = 'none';
        if (btnDisc) btnDisc.style.display = 'inline-block';
    } else if (st.isConnecting) {
        if (pill) {
            pill.textContent = '⏳ جاري الاتصال وفحص البث...';
            pill.style.background = 'rgba(245, 158, 11, 0.22)';
            pill.style.borderColor = '#f59e0b';
            pill.style.color = '#fde68a';
        }
    } else {
        if (pill) {
            pill.textContent = st.watchdogActive ? '🔄 مراقبة اللايف مفعلة (Auto-Watchdog)' : '⚪ غير متصل حالياً';
            pill.style.background = st.watchdogActive ? 'rgba(56, 189, 248, 0.2)' : 'rgba(239, 68, 68, 0.22)';
            pill.style.borderColor = st.watchdogActive ? '#38bdf8' : '#ef4444';
            pill.style.color = st.watchdogActive ? '#7dd3fc' : '#fca5a5';
        }
        if (btnConn) btnConn.style.display = 'inline-block';
        if (btnDisc) btnDisc.style.display = st.watchdogActive ? 'inline-block' : 'none';
    }

    if (isLiveBadge) {
        if (st.isLive) {
            isLiveBadge.textContent = '🟢 فاتح لايف الآن (LIVE ON TIKTOK)';
            isLiveBadge.style.background = 'rgba(16, 185, 129, 0.25)';
            isLiveBadge.style.border = '1px solid #10b981';
            isLiveBadge.style.color = '#34d399';
        } else if (st.lastCheckedAt) {
            isLiveBadge.textContent = `🔴 قافل حالياً (Offline - فحص ${st.lastCheckedAt})`;
            isLiveBadge.style.background = 'rgba(239, 68, 68, 0.22)';
            isLiveBadge.style.border = '1px solid #ef4444';
            isLiveBadge.style.color = '#fca5a5';
        } else {
            isLiveBadge.textContent = '⏳ لم يتم الفحص بعد';
            isLiveBadge.style.background = 'rgba(148, 163, 184, 0.2)';
            isLiveBadge.style.border = 'none';
            isLiveBadge.style.color = '#cbd5e1';
        }
    }

    if (msgEl && st.statusMessage) {
        msgEl.textContent = st.statusMessage;
        msgEl.style.color = st.isLive ? '#34d399' : '#cbd5e1';
    }

    const prof = st.profile;
    if (prof) {
        const av = document.getElementById('trkStreamerAvatar');
        if (av && prof.avatar) av.src = prof.avatar;
        const nm = document.getElementById('trkStreamerName');
        if (nm) nm.textContent = prof.nickname || prof.username || st.username;
        const hnd = document.getElementById('trkStreamerHandle');
        if (hnd) hnd.textContent = `@${prof.username || st.username}`;
    } else if (st.username) {
        const hnd = document.getElementById('trkStreamerHandle');
        if (hnd) hnd.textContent = `@${st.username}`;
    }

    const vw = document.getElementById('trkStatViewers');
    if (vw) vw.textContent = `👁️ المشاهدون: ${(st.viewerCount || 0).toLocaleString()}`;
    const gf = document.getElementById('trkStatGifts');
    if (gf) gf.textContent = `🎁 هدايا الجلسة: ${(st.totalGiftsReceived || 0).toLocaleString()}`;
    const dm = document.getElementById('trkStatDiamonds');
    if (dm) dm.textContent = `💎 العملات: ${(st.totalDiamondsReceived || 0).toLocaleString()}`;
    const rm = document.getElementById('trkStatRoomId');
    if (rm) rm.textContent = `Room: ${st.roomId || '—'}`;

    renderTarkibatEventsFeed();
}

async function checkTarkibatLiveStatus() {
    const inp = document.getElementById('trkUsernameInput');
    const btn = document.getElementById('btnTrkCheckLive');
    const username = inp ? inp.value.trim() : '';
    if (!username) {
        showToast('⚠️ يرجى كتابة يوزر التيك توك أولاً!', 'warning');
        if (inp) inp.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جاري الفحص...';
    }

    try {
        const res = await fetch(`/api/tarkibat/${encodeURIComponent(currentUid)}/check-live`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'فشل فحص اللايف');

        if (data.liveState) {
            currentTarkibatLiveState = { ...currentTarkibatLiveState, ...data.liveState };
            renderTarkibatStatusUI();
        }

        if (data.isLive) {
            playScoreChime('up');
            showToast(`🟢 الحساب @${data.username} فاتح لايف الآن على تيك توك! اضغط Connect للربط المباشر.`, 'success', 4500);
        } else {
            showToast(`🔴 الحساب @${data.username} غير فاتح لايف حالياً على تيك توك (Offline). يمكنك تجهيز وتجربة التركيبات الآن!`, 'info', 4500);
        }
    } catch (err) {
        showToast('خطأ أثناء فحص اللايف: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🔍 فحص هل فاتح لايف؟';
        }
    }
}

async function connectTarkibatLive() {
    const inp = document.getElementById('trkUsernameInput');
    const btn = document.getElementById('btnTrkConnect');
    const watchdogCheck = document.getElementById('trkAutoWatchdogCheck');
    const username = inp ? inp.value.trim() : '';
    if (!username) {
        showToast('⚠️ يرجى كتابة يوزر التيك توك أولاً!', 'warning');
        if (inp) inp.focus();
        return;
    }

    if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ جاري فحص اللايف والاتصال...';
    }

    try {
        const res = await fetch(`/api/tarkibat/${encodeURIComponent(currentUid)}/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                autoWatchdog: watchdogCheck ? watchdogCheck.checked : true
            })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'تعذر الاتصال');

        if (data.state) {
            currentTarkibatLiveState = { ...currentTarkibatLiveState, ...data.state };
            renderTarkibatStatusUI();
        }

        if (data.connected && data.isLive) {
            playRaceVictorySound();
            showToast(`🟢 تم الاتصال ببث @${currentTarkibatLiveState.username} المباشر بنجاح! جميع التركيبات نشطة الآن.`, 'success', 4500);
        } else if (!data.isLive) {
            const wdMsg = (watchdogCheck && watchdogCheck.checked)
                ? 'تم تفعيل المراقب الذكي وسيتصل تلقائياً فور فتح اللايف!'
                : 'افتح البث المباشر على تيك توك ثم اضغط Connect.';
            showToast(`🔴 الحساب @${currentTarkibatLiveState.username} غير فاتح لايف حالياً. ${wdMsg}`, 'warning', 5000);
        }
    } catch (err) {
        showToast('خطأ أثناء الاتصال: ' + err.message, 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '🟢 Connect (اتصال باللايف)';
        }
    }
}

async function disconnectTarkibatLive() {
    try {
        const res = await fetch(`/api/tarkibat/${encodeURIComponent(currentUid)}/disconnect`, {
            method: 'POST'
        });
        const data = await res.json();
        if (data && data.liveState) {
            currentTarkibatLiveState = { ...currentTarkibatLiveState, ...data.liveState };
            renderTarkibatStatusUI();
        }
        showToast('⚪ تم قطع الاتصال باللايف وإيقاف المراقب التلقائي.', 'info');
    } catch (e) {}
}

function onNewTrkTriggerTypeChange(val) {
    const giftBox = document.getElementById('newTrkGiftPickerBox');
    const chatBox = document.getElementById('newTrkChatKeywordBox');
    if (giftBox) giftBox.style.display = val === 'gift' ? 'flex' : 'none';
    if (chatBox) chatBox.style.display = val === 'chat' ? 'block' : 'none';
}

function openTarkibatGiftPicker(slotTarget = 'new') {
    openVisualGiftPicker('tarkibat', slotTarget, 'tarkibat');
}

function selectWildcardGiftForNewTrk() {
    newTrkSelectedGift = {
        name: 'أي هدية',
        image: '/images/rose.png',
        coins: 1
    };
    const imgEl = document.getElementById('newTrkGiftPreviewImg');
    const nameEl = document.getElementById('newTrkGiftPreviewName');
    if (imgEl) imgEl.src = '/images/rose.png';
    if (nameEl) nameEl.textContent = '🌟 أي هدية في البث (Wildcard)';
    showToast('🌟 تم تحديد (أي هدية) لتشغيل هذه التركيبة مع جميع هدايا البث!', 'info');
}

function getSbActionLabel(action, points = 1) {
    if (action === 'team_b_add') return `🟢 +${points} نقطة للفريق 2 (المساعدين)`;
    if (action === 'team_a_add') return `🔴 +${points} نقطة للفريق 1 (المخربين)`;
    if (action === 'team_b_sub') return `➖ -${points} من الفريق 2`;
    if (action === 'team_a_sub') return `➖ -${points} من الفريق 1`;
    return '📺 تنبيه شاشة فقط (بدون نقاط)';
}

function renderTarkibatItemsList() {
    const container = document.getElementById('trkItemsListContainer');
    const badge = document.getElementById('trkItemsCountBadge');
    const items = currentTarkibatConfig.items || [];
    if (badge) badge.textContent = `${items.length} تركيبات`;
    if (!container) return;

    if (items.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:24px; color:#94a3b8;">لا توجد تركيبات مضافة حالياً. اختر قالباً جاهزاً أو أضف تركيبتك من الأعلى!</div>`;
        return;
    }

    container.innerHTML = items.map((item, idx) => {
        const isEnabled = item.enabled !== false;
        const borderCol = item.overlayColor || '#a855f7';
        const giftImg = item.giftImage || '/images/rose.png';
        const sbLabel = getSbActionLabel(item.scoreboardAction, item.scoreboardPoints || 1);

        return `
            <div style="background:rgba(15, 23, 42, 0.85); border:1.5px solid ${isEnabled ? borderCol + '66' : 'rgba(255,255,255,0.08)'}; border-right:4px solid ${borderCol}; border-radius:14px; padding:12px 14px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; opacity:${isEnabled ? '1' : '0.55'};">
                <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:210px;">
                    <div onclick="openTarkibatGiftPicker(${idx})" title="اضغط لتغيير الهدية من مكتبة تيك توك" style="position:relative; width:50px; height:50px; border-radius:12px; background:rgba(255,255,255,0.06); border:1.5px solid ${borderCol}; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0;">
                        <img src="${escapeHtml(giftImg)}" alt="Gift" style="width:38px; height:38px; object-fit:contain;" onerror="this.src='/images/rose.png'">
                    </div>
                    <div style="min-width:0; flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <span style="font-size:14.5px; font-weight:900; color:#fff;">${escapeHtml(item.name)}</span>
                            <span style="font-size:11px; background:rgba(255,215,0,0.15); color:#ffd700; padding:1px 8px; border-radius:999px; font-weight:800;">
                                🎁 ${escapeHtml(item.giftName || 'هدية')}
                            </span>
                        </div>
                        <div style="font-size:12px; color:#cbd5e1; margin-top:3px; font-weight:700;">
                            ${escapeHtml(sbLabel)} · 💬 <span style="color:${borderCol};">${escapeHtml(item.overlayCustomText || item.name)}</span>
                        </div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:6px;">
                    <button type="button" onclick="testTarkibaItem('${escapeHtml(item.id)}')" style="padding:7px 12px; font-size:12px; font-weight:900; border-radius:9px; border:none; background:linear-gradient(135deg, #0284c7, #10b981); color:#fff; cursor:pointer;" title="تجربة التركيبة على السكوربورد والأوفرلاي الآن">
                        🧪 تجربة
                    </button>
                    <button type="button" onclick="toggleTarkibaItemEnabled(${idx})" style="padding:7px 10px; font-size:11.5px; font-weight:800; border-radius:9px; border:1px solid rgba(255,255,255,0.15); background:${isEnabled ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.15)'}; color:${isEnabled ? '#34d399' : '#94a3b8'}; cursor:pointer;">
                        ${isEnabled ? '✅ شغال' : '⏸️ متوقف'}
                    </button>
                    <button type="button" onclick="deleteTarkibaItem(${idx})" style="padding:7px 10px; font-size:12px; font-weight:900; border-radius:9px; border:none; background:rgba(239,68,68,0.2); color:#fca5a5; cursor:pointer;" title="حذف التركيبة">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderTarkibatEventsFeed() {
    const feed = document.getElementById('trkEventsFeedList');
    if (!feed) return;
    const events = currentTarkibatLiveState.events || [];
    if (events.length === 0) {
        feed.innerHTML = `<div style="text-align:center; color:#64748b; padding:24px; font-size:13px;">لا توجد أحداث حتى الآن — اضغط «🧪 تجربة» على أي تركيبة أو اتصل باللايف لرؤية التفاعلات فوراً!</div>`;
        return;
    }

    feed.innerHTML = events.map(ev => {
        if (ev.type === 'system') {
            return `
                <div style="background:rgba(16,185,129,0.12); border:1px solid rgba(16,185,129,0.35); border-radius:10px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:12.5px; font-weight:800; color:#34d399;">${escapeHtml(ev.title)}</span>
                    <span style="font-size:11px; color:#94a3b8;">${escapeHtml(ev.time || '')}</span>
                </div>
            `;
        }
        return `
            <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:11px; padding:9px 12px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
                <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    <img src="${escapeHtml(ev.avatar || '/images/mezotik-logo.png')}" style="width:36px; height:36px; border-radius:50%; object-fit:cover; border:1.5px solid #ffd700;" onerror="this.src='/images/mezotik-logo.png'">
                    <div style="min-width:0;">
                        <div style="font-size:13px; font-weight:900; color:#fff;">
                            ${escapeHtml(ev.nickname || ev.username || 'مشاهد')}
                            <span style="font-size:11.5px; color:#ffd700; font-weight:800;">← ${escapeHtml(ev.giftName || 'تفاعل')} ${ev.repeatCount > 1 ? `(x${ev.repeatCount})` : ''}</span>
                        </div>
                        <div style="font-size:11.5px; color:#34d399; font-weight:800;">
                            ${escapeHtml(ev.triggeredText || '')}
                        </div>
                    </div>
                </div>
                <span style="font-size:10.5px; color:#64748b; direction:ltr; white-space:nowrap;">${escapeHtml(ev.time || '')}</span>
            </div>
        `;
    }).join('');
}

async function addNewTarkibaItem() {
    const name = document.getElementById('newTrkNameInput')?.value.trim() || 'تركيبة جديدة';
    const triggerType = document.getElementById('newTrkTriggerType')?.value || 'gift';
    const sbAction = document.getElementById('newTrkSbAction')?.value || 'team_b_add';
    const sbPoints = Math.max(1, parseInt(document.getElementById('newTrkSbPoints')?.value, 10) || 1);
    const overlayText = document.getElementById('newTrkOverlayText')?.value.trim() || name;
    const soundEffect = document.getElementById('newTrkSoundEffect')?.value || 'victory';
    const color = document.getElementById('newTrkColorInput')?.value || '#22ff88';
    const chatKeyword = document.getElementById('newTrkChatKeyword')?.value.trim() || '';

    let giftName = newTrkSelectedGift.name || 'وردة';
    let giftImage = newTrkSelectedGift.image || '/images/rose.png';
    let giftCoins = newTrkSelectedGift.coins || 1;

    if (triggerType === 'follow') {
        giftName = 'فولو (متابعة)';
        giftImage = '/images/tiktok_follow.png';
        giftCoins = 0;
    } else if (triggerType === 'like') {
        giftName = 'تكبيس لايكات';
        giftImage = '/images/tiktok_likes.png';
        giftCoins = 0;
    } else if (triggerType === 'share') {
        giftName = 'مشاركة البث';
        giftImage = '/images/mezotik-logo.png';
        giftCoins = 0;
    } else if (triggerType === 'chat') {
        giftName = `شات: ${chatKeyword || 'كلمة'}`;
        giftImage = '/images/mezotik-logo.png';
        giftCoins = 0;
    }

    const newItem = {
        id: 'trk_' + Date.now(),
        enabled: true,
        name,
        triggerType,
        giftName,
        giftImage,
        giftCoins,
        minRepeat: 1,
        chatKeyword,
        scoreboardAction: sbAction,
        scoreboardPoints: sbPoints,
        multiplyByRepeat: true,
        showOverlayAlert: true,
        overlayCustomText: overlayText,
        overlayCardImage: giftImage,
        overlayColor: color,
        soundEffect,
        addJudgeWin: false
    };

    if (!Array.isArray(currentTarkibatConfig.items)) currentTarkibatConfig.items = [];
    currentTarkibatConfig.items.unshift(newItem);
    renderTarkibatItemsList();
    await saveTarkibatConfigAction(false);
    showToast(`🧩 تمت إضافة التركيبة (${name}) بنجاح! اضغط «🧪 تجربة» لاختبارها.`, 'success');
}

async function toggleTarkibaItemEnabled(idx) {
    if (!currentTarkibatConfig.items || !currentTarkibatConfig.items[idx]) return;
    currentTarkibatConfig.items[idx].enabled = !currentTarkibatConfig.items[idx].enabled;
    renderTarkibatItemsList();
    await saveTarkibatConfigAction(true);
}

async function deleteTarkibaItem(idx) {
    if (!currentTarkibatConfig.items || !currentTarkibatConfig.items[idx]) return;
    const removed = currentTarkibatConfig.items.splice(idx, 1);
    renderTarkibatItemsList();
    await saveTarkibatConfigAction(true);
    showToast(`🗑️ تم حذف التركيبة (${removed[0]?.name || ''})`, 'info');
}

async function saveTarkibatConfigAction(silent = false) {
    try {
        const res = await fetch(`/api/tarkibat/${encodeURIComponent(currentUid)}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentTarkibatConfig)
        });
        const data = await res.json();
        if (data && data.success && !silent) {
            showToast('💾 تم حفظ إعدادات التركيبات بنجاح!', 'success');
        }
    } catch (e) {}
}

async function loadTarkibatPreset(presetKey) {
    try {
        const res = await fetch(`/api/tarkibat/${encodeURIComponent(currentUid)}/preset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ preset: presetKey })
        });
        const data = await res.json();
        if (data && data.success && data.config) {
            currentTarkibatConfig = { ...currentTarkibatConfig, ...data.config };
            renderTarkibatItemsList();
            showToast('⚡ تم تحميل قالب التركيبات الجاهز بنجاح!', 'success');
        }
    } catch (e) {
        showToast('تعذر تحميل القالب', 'error');
    }
}

async function testTarkibaItem(itemId) {
    try {
        const res = await fetch(`/api/tarkibat/${encodeURIComponent(currentUid)}/test-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, customRepeat: 1 })
        });
        const data = await res.json();
        if (data && data.success) {
            playScoreChime('up');
            showToast(`🧪 تم تشغيل التركيبة بنجاح! ${data.impact ? '(' + data.impact + ')' : ''}`, 'success');
        }
    } catch (e) {
        showToast('تعذر تجربة التركيبة', 'error');
    }
}





