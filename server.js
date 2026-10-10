require('dotenv').config();
const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const db = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 3001;

// Paths & Directories
const dataDir = process.env.DATA_DIR || __dirname;
const dataPath = path.join(dataDir, 'gifts-data.json');
const imagesDir = process.env.DATA_DIR 
    ? path.join(process.env.DATA_DIR, 'images') 
    : path.join(__dirname, 'public', 'images');

if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/images', express.static(imagesDir));
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
        if (/\.(html|js|css|json)$/i.test(filePath)) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// Configure Multer (Memory Storage for easy upload to Cloud / Disk)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

// 24/7 Keep-Alive State (Anti-Sleep for Render Free Tier)
let keepAliveStatus = {
    active: false,
    targetUrl: '',
    lastPing: null,
    totalPings: 0
};

function startKeepAlive() {
    const targetUrl = process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_URL;
    if (!targetUrl) {
        console.log('ℹ️ Keep-Alive: No public URL detected (local dev). Will activate automatically on Render!');
        return;
    }

    keepAliveStatus.active = true;
    keepAliveStatus.targetUrl = targetUrl;
    console.log(`⚡ Keep-Alive: 24/7 Anti-Sleep activated for ${targetUrl}`);

    // Ping every 8 minutes (Render sleeps after 15 min idle)
    const PING_INTERVAL = 8 * 60 * 1000;
    setInterval(async () => {
        try {
            const pingUrl = `${targetUrl.replace(/\/$/, '')}/api/status`;
            const res = await fetch(pingUrl);
            if (res.ok) {
                keepAliveStatus.lastPing = new Date().toISOString();
                keepAliveStatus.totalPings++;
                console.log(`💓 Keep-Alive ping #${keepAliveStatus.totalPings} to ${pingUrl}`);
            }
        } catch (err) {
            console.warn('⚠️ Keep-Alive ping error:', err.message);
        }
    }, PING_INTERVAL);
}

// Configure Cloudinary
function getCloudinaryConfig() {
    return {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUD_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || process.env.API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || process.env.API_SECRET || ''
    };
}

function isCloudinaryConfigured() {
    if (process.env.CLOUDINARY_URL) return true;
    const cfg = getCloudinaryConfig();
    return Boolean(cfg.cloud_name && cfg.api_key && cfg.api_secret);
}

if (isCloudinaryConfigured()) {
    if (!process.env.CLOUDINARY_URL) {
        cloudinary.config({
            ...getCloudinaryConfig(),
            secure: true
        });
    }
    console.log('☁️ Cloudinary storage is active!');
}

// MongoDB Atlas Persistence (Optional for 100% Free Persistent DB on Render)
let mongoCollection = null;
if (process.env.MONGODB_URI) {
    try {
        const { MongoClient } = require('mongodb');
        const client = new MongoClient(process.env.MONGODB_URI);
        client.connect()
            .then(() => {
                mongoCollection = client.db().collection('gift_boards');
                console.log('🍃 MongoDB Atlas connected! Data is 100% persistent across Render restarts.');
                
                // Load initial data from MongoDB if available
                mongoCollection.findOne({ _id: 'all_boards' }).then(doc => {
                    if (doc && doc.data && Object.keys(doc.data).length > 0) {
                        const localData = readDataFromFile();
                        const merged = { ...localData, ...doc.data };
                        writeDataToFile(merged);
                        console.log('✅ Loaded persistent boards from MongoDB Atlas.');
                    }
                }).catch(err => console.error('MongoDB sync error:', err.message));
            })
            .catch(err => {
                console.warn('⚠️ MongoDB connection failed, fallback to local JSON:', err.message);
            });
    } catch (err) {
        console.warn('⚠️ MongoDB driver error:', err.message);
    }
}

// Data Helper Functions
function readDataFromFile() {
    try {
        if (!fs.existsSync(dataPath)) {
            return {};
        }
        return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch (err) {
        console.error('Error reading data file:', err);
        return {};
    }
}

function writeDataToFile(data) {
    try {
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error('Error writing data file:', err);
    }
}

function readData() {
    return readDataFromFile();
}

function writeData(data) {
    writeDataToFile(data);
    if (mongoCollection) {
        mongoCollection.updateOne(
            { _id: 'all_boards' },
            { $set: { data: data, updatedAt: new Date() } },
            { upsert: true }
        ).catch(err => console.error('MongoDB update error:', err.message));
    }
}

// Helper function to upload image file (Cloudinary -> ImgBB -> Local Disk)
async function saveUploadedFile(file) {
    // 1. Try Cloudinary
    if (isCloudinaryConfigured()) {
        try {
            const resultUrl = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'gifts_overlay',
                        resource_type: 'image'
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result.secure_url);
                    }
                );
                stream.end(file.buffer);
            });
            return resultUrl;
        } catch (err) {
            console.error('⚠️ Cloudinary upload failed, trying next method:', err.message);
        }
    }

    // 2. Try ImgBB if key exists
    if (process.env.IMGBB_API_KEY) {
        try {
            const formData = new FormData();
            formData.append('image', file.buffer.toString('base64'));
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const json = await res.json();
            if (json.success && json.data && json.data.url) {
                return json.data.url;
            }
        } catch (err) {
            console.error('⚠️ ImgBB upload failed, falling back to disk:', err.message);
        }
    }

    // 3. Fallback to Local Disk
    const ext = path.extname(file.originalname) || '.png';
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${Date.now()}-${cleanName || 'gift'}${ext}`;
    const targetPath = path.join(imagesDir, filename);
    fs.writeFileSync(targetPath, file.buffer);
    return filename;
}

// Permanent default gifts from New folder (6)
const PERMANENT_DEFAULT_GIFTS = [
    { id: 1, name: "تيربو", image: "rose.png" },
    { id: 2, name: "مكوك فضائي", image: "1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp" },
    { id: 3, name: "حمايه", image: "1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp" },
    { id: 4, name: "صاروخ", image: "perfume.png" },
    { id: 5, name: "بوابه", image: "donut.png" },
    { id: 6, name: "نيزك", image: "1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp" },
    { id: 7, name: "تبطئ الاعبين", image: "1791197915043-374dfe46d5b09ce1db19be06202d34f5.png~tplv-obj.webp" },
    { id: 8, name: "اسرع لاعب", image: "1791198042522-9f8bd92363c400c284179f6719b6ba9c~tplv-obj.webp" },
    { id: 9, name: "نقل اسطوري", image: "1791198055544-79a02148079526539f7599150da9fd28.png~tplv-obj.webp" },
    { id: 10, name: "فوز", image: "1791198066523-1d067d13988e8754ed6adbebd89b9ee8.png~tplv-obj.webp" },
    { id: 11, name: "قلب", image: "heart.png" }
];

// Default Team Gifts Template (Strictly no duplicate images between Team 1 and Team 2)
function getDefaultTeamGifts() {
    return {
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
}

// Default board template
function getDefaultBoard(uid = 'default') {
    return {
        color: '#a855f7',
        verticalAlign: 'center', // 'top', 'center', 'bottom'
        offsetY: 0,              // in px: -400 to +400
        horizontalAlign: 'right',// 'right', 'left'
        offsetX: 30,             // in px
        scale: 100,              // % scale: 70 to 140
        fontSize: 22,            // px font size
        glowIntensity: 15,       // px blur
        animationType: 'slide',  // 'slide', 'fade', 'bounce', 'pulse', 'none'
        animationDuration: 7,    // seconds
        textStaticMode: false,   // Keeps text static while only images animate
        giftDisplayMode: 'classic', // 'classic' or 'mcroyale'
        mcroyaleCards: [
            { id: 1, cardType: 'skeleton_bandana', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
            { id: 2, cardType: 'evoker_mage', count: 1, giftName: 'عطر', giftImage: '/images/perfume.png' },
            { id: 3, cardType: 'skeleton_cap', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
            { id: 4, cardType: 'hog_rider', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
            { id: 5, cardType: 'golem_pumpkin', count: 1, giftName: 'آيس كريم', giftImage: '/images/icecream.png' }
        ],
        gifts: [...PERMANENT_DEFAULT_GIFTS],
        teamGifts: getDefaultTeamGifts()
    };
}

function getDefaultCardsBoard(uid = 'default') {
    return {
        neonEnabled: true,
        glowIntensity: 18,
        fontFamily: 'cairo', // 'cairo', 'changa', 'rubik', 'tajawal', 'pixel', 'impact'
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
}

function getDefaultCards4Board(uid = 'default') {
    const defaultDeck = [
        { id: 1, cardType: 'skeleton_bandana', customText: 'X1', count: 1, giftName: 'تكبيس (❤️ X100)', giftImage: '/images/tiktok_likes.png', likesCount: 100 },
        { id: 2, cardType: 'evoker_mage', customText: 'X1', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
        { id: 3, cardType: 'skeleton_cap', customText: 'X2', count: 2, giftName: 'قلب', giftImage: '/images/heart.png' },
        { id: 4, cardType: 'hog_rider', customText: 'X1', count: 1, giftName: 'دونات', giftImage: '/images/donut.png' },
        { id: 5, cardType: 'golem_pumpkin', customText: 'X1', count: 1, giftName: 'مكوك فضائي', giftImage: '/images/1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' }
    ];

    return {
        neonEnabled: true,
        glowIntensity: 18,
        fontFamily: 'cairo',
        giftPosition: 'top-left',
        disappearMode: 'gift_only',
        offsetY: 0,
        scale: 100,
        teamRed: {
            title: 'الفريق الأحمر',
            color: '#ff2a4a',
            cards: JSON.parse(JSON.stringify(defaultDeck))
        },
        teamBlue: {
            title: 'الفريق الأزرق',
            color: '#00b4d8',
            cards: defaultDeck.map((c, i) => ({ ...c, id: 101 + i }))
        }
    };
}

function getDefaultSupporterFrame(uid = 'default') {
    return {
        uid: uid,
        frameStyle: 'sakura', // 'sakura', 'cyber_neon', 'gold_fire', 'crystal_ice', 'emerald_nature', 'crimson_dragon', 'custom'
        frameColor: '#b594f8',
        hueRotate: 0,
        saturation: 100,
        brightness: 100,
        glowIntensity: 1.0,
        widgetUrl: 'https://tikalert-eg.com/last-supporter/widget?username=mezo',
        frameScale: 100,
        iframeWidth: 800,
        iframeHeight: 140,
        offsetX: 0,
        offsetY: 0,
        customMediaUrl: '',
        customMediaType: 'video',
        updatedAt: Date.now()
    };
}

// ================= ROUTES ================= //

// Control Panel
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.get('/control', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

// Overlay Widget (Gifts 1)
app.get('/fire-widget.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

app.get('/overlay', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

// Cards Overlay Widget (Gifts 3 - Cards Mode)
app.get(['/cards-overlay.html', '/cards', '/cards-overlay'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cards-overlay.html'));
});

// ================= FIRE WIDGET ROUTES ================= //

// Fire Widget Display Page (صفحة العرض لشاشات البث OBS / TikTok Live Studio)
app.get('/fire-text.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fire-text.html'));
});

app.get('/fire-text', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fire-text.html'));
});

// Fire Widget Settings Page (صفحة إعدادات النص الناري)
app.get('/fire.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fire.html'));
});

app.get('/fire', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fire.html'));
});

app.get('/fire-text', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'fire-text.html'));
});

// Camera Overlay routes
app.get('/camera-overlay.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'camera-overlay.html'));
});
app.get('/camera-overlay', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'camera-overlay.html'));
});

// Scoreboard Overlay routes
app.get('/scoreboard-overlay.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scoreboard-overlay.html'));
});
app.get('/scoreboard-overlay', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'scoreboard-overlay.html'));
});

// ================= AUTHENTICATION & USER DB ================= //
function ensureEncryptedBoardDataMigrated(boardId) {
    if (!boardId) return;
    try {
        const data = readData();
        if (!data[boardId]) {
            const sourceBoard = data['board_1212'] || data['default'] || data['board_XXXX'];
            if (sourceBoard) {
                data[boardId] = JSON.parse(JSON.stringify(sourceBoard));
                writeData(data);
            }
        }
    } catch (e) {}
}

app.post('/api/auth/register', (req, res) => {
    try {
        const { username, password, displayName } = req.body;
        const result = db.registerUser(username, password, displayName);
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { username, password } = req.body;
        const result = db.loginUser(username, password);
        if (result.user && result.user.boardId) {
            ensureEncryptedBoardDataMigrated(result.user.boardId);
        }
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
    db.destroySession(token);
    res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    const user = db.getUserByToken(token);
    if (!user) {
        return res.status(401).json({ success: false, error: 'غير مسجل الدخول' });
    }
    if (user.boardId) {
        ensureEncryptedBoardDataMigrated(user.boardId);
    }
    res.json({ success: true, user });
});

app.post('/api/auth/regenerate-board', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || req.body.token;
        const { oldBoardId, newBoardId, user } = db.regenerateUserBoardId(token);
        if (oldBoardId && newBoardId) {
            const data = readData();
            if (data[oldBoardId]) {
                data[newBoardId] = JSON.parse(JSON.stringify(data[oldBoardId]));
                writeData(data);
            }
        }
        res.json({ success: true, oldBoardId, newBoardId, user });
    } catch (e) {
        res.status(400).json({ success: false, error: e.message });
    }
});

// ================= SCOREBOARD ROUTES ================= //
const recentScoreFingerprints = new Map();

app.get('/api/scoreboard/:id', (req, res) => {
    const board = db.getScoreboard(req.params.id);
    res.json({ success: true, board });
});

app.post('/api/scoreboard/:id/update', (req, res) => {
    const board = db.updateScoreboard(req.params.id, req.body);
    io.emit('scoreboard_update', board);
    res.json({ success: true, board });
});

app.post('/api/scoreboard/:id/score', (req, res) => {
    const { team, delta, score, reqId } = req.body;
    // Deduplicate identical rapid requests within 120ms to prevent any double-incrementing
    if (delta !== undefined && delta !== null && score === undefined) {
        const fpKey = `${req.params.id}:${team}:${delta}`;
        const now = Date.now();
        const lastTime = recentScoreFingerprints.get(fpKey) || 0;
        if (now - lastTime < 120 && !reqId) {
            const currentBoard = db.getScoreboard(req.params.id);
            return res.json({ success: true, board: currentBoard, deduplicated: true });
        }
        recentScoreFingerprints.set(fpKey, now);
    }

    const board = db.adjustScore(req.params.id, team, delta, score);
    io.emit('scoreboard_update', board);
    res.json({ success: true, board });
});

app.post('/api/scoreboard/:id/reset', (req, res) => {
    const board = db.resetScoreboard(req.params.id);
    io.emit('scoreboard_update', board);
    res.json({ success: true, board });
});

// ================= SCOREBOARD TRIGGER & WEBHOOK ROUTES ================= //
// Compatibility with original C:\Users\mezo_1sttt\Desktop\scoreboard
app.all('/trigger', (req, res) => {
    try {
        const params = { ...req.query, ...req.body };
        const boardId = params.id || params.board_id || 'board_XXXX';
        let { team, action, value } = params;

        team = team || 'a';
        action = action || 'add';
        value = parseInt(value);
        if (isNaN(value)) value = 1;
        if (!['a', 'b'].includes(team)) team = 'a';

        let delta = value;
        if (action === 'subtract') delta = -value;

        let updatedBoard;
        if (action === 'set') {
            const updates = team === 'a' ? { team_a_score: value } : { team_b_score: value };
            updatedBoard = db.updateScoreboard(boardId, updates);
        } else if (action === 'reset') {
            updatedBoard = db.resetScoreboard(boardId);
        } else {
            updatedBoard = db.adjustScore(boardId, team, delta);
        }

        io.emit('scoreboard_update', updatedBoard);
        console.log(`⚡ /trigger → ${action} ${value} to team ${team} (board: ${boardId})`);
        res.send('OK');
    } catch (err) {
        console.error('Trigger error:', err);
        res.send('OK');
    }
});

app.all('/tiktok-trigger', (req, res) => {
    try {
        const params = { ...req.query, ...req.body };
        const boardId = params.id || params.board_id || 'board_XXXX';
        let team = params.team || 'a';
        let value = parseInt(params.value);
        if (isNaN(value)) value = 1;
        if (!['a', 'b'].includes(team)) team = 'a';

        const updatedBoard = db.adjustScore(boardId, team, value);
        io.emit('scoreboard_update', updatedBoard);
        console.log(`⚡ /tiktok-trigger → +${value} to team ${team} (board: ${boardId})`);
        res.send('OK');
    } catch (err) {
        console.error('TikTok trigger error:', err);
        res.send('OK');
    }
});

// TikFinity Webhook
async function handleTikFinityWebhook(event, boardId = 'board_XXXX') {
    const giftName = (event.giftName || '').toLowerCase();
    const giftId = event.giftId || '';
    const coins = parseInt(event.coins || 0);
    const repeatCount = parseInt(event.repeatCount || 1);
    const likeCount = parseInt(event.likeCount || 0);
    const subMonth = parseInt(event.subMonth || 0);
    const username = event.username || '';
    const nickname = event.nickname || '';

    let team = 'b';
    let points = 0;

    if (giftName && giftId) {
        console.log(`🎁 TikFinity Gift: ${giftName} x${repeatCount} from ${nickname}`);
        if (giftName.includes('rose')) {
            team = 'a';
            points = 1 * repeatCount;
        } else if (giftName.includes('galaxy')) {
            team = 'b';
            points = 50 * repeatCount;
        } else if (giftName.includes('tiktok')) {
            team = 'b';
            points = 100 * repeatCount;
        } else if (giftName.includes('lion')) {
            team = 'a';
            points = 30 * repeatCount;
        } else {
            team = 'b';
            points = (coins || 1) * repeatCount;
        }
    } else if (likeCount > 0) {
        points = Math.floor(likeCount / 10);
        team = 'b';
    } else if (subMonth > 0) {
        points = 50;
        team = 'b';
    } else if (username) {
        points = 5;
        team = 'b';
    }

    if (points > 0) {
        const updatedBoard = db.adjustScore(boardId, team, points);
        io.emit('scoreboard_update', updatedBoard);
        console.log(`✅ Webhook: +${points} to team ${team} (board: ${boardId})`);
    }
}

app.all(['/tiktok-webhook', '/webhook/tikfinity'], async (req, res) => {
    try {
        const payload = req.method === 'POST' ? req.body : req.query;
        const boardId = (req.query && (req.query.id || req.query.board_id)) || 'board_XXXX';
        res.status(200).send('OK');
        await handleTikFinityWebhook(payload || {}, boardId);
    } catch (err) {
        console.error('Webhook error:', err);
        if (!res.headersSent) res.send('OK');
    }
});

// ================= TIKTOK EGYPT GIFTS CATALOG (STREAMTOEARN.IO) ================= //
app.get('/api/tiktok-gifts', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'public', 'data', 'tiktok_gifts_eg.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.send(raw);
        } else {
            res.json([]);
        }
    } catch (e) {
        res.status(500).json({ error: 'Failed to load gifts library' });
    }
});

// ================= CORNER OVERLAY (APPEAR FROM SKY) ROUTES ================= //
app.get('/corner-overlay.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'corner-overlay.html'));
});

// ================= TEAM GIFTS (هدايا تيك توك 2) ROUTES ================= //
app.get('/overlay-team.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'overlay-team.html'));
});

app.get('/api/team-gifts/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const board = data[uid] || getDefaultBoard(uid);
    let tg = board.teamGifts || getDefaultTeamGifts();
    if (tg.teamGifts && !tg.team1) {
        tg = tg.teamGifts;
    }
    const cleanTeamGifts = {
        team1: tg.team1 || getDefaultTeamGifts().team1,
        team2: tg.team2 || getDefaultTeamGifts().team2
    };
    res.json({ success: true, teamGifts: cleanTeamGifts });
});

app.post('/api/team-gifts/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    const body = req.body || {};
    const defaultTG = getDefaultTeamGifts();
    const t1 = body.team1 || (body.teamGifts && body.teamGifts.team1) || data[uid].teamGifts?.team1 || defaultTG.team1;
    const t2 = body.team2 || (body.teamGifts && body.teamGifts.team2) || data[uid].teamGifts?.team2 || defaultTG.team2;

    data[uid].teamGifts = {
        team1: {
            title: (t1 && t1.title) ? t1.title : 'المساعدين',
            color: (t1 && t1.color) ? t1.color : '#22ff88',
            icon: (t1 && t1.icon) ? t1.icon : '💚',
            imageOnlyAnimation: t1 && t1.imageOnlyAnimation !== false,
            gifts: Array.isArray(t1 && t1.gifts) ? t1.gifts : []
        },
        team2: {
            title: (t2 && t2.title) ? t2.title : 'المخربين',
            color: (t2 && t2.color) ? t2.color : '#ff2a4a',
            icon: (t2 && t2.icon) ? t2.icon : '🔥',
            imageOnlyAnimation: t2 && t2.imageOnlyAnimation !== false,
            gifts: Array.isArray(t2 && t2.gifts) ? t2.gifts : []
        }
    };

    writeData(data);
    io.emit('team_gifts_update', { uid, teamGifts: data[uid].teamGifts });
    res.json({ success: true, teamGifts: data[uid].teamGifts });
});

// ================= CAMERA SETTINGS ROUTES ================= //
function getDefaultCameraSettings() {
    return {
        style: 'volcano',
        ratio: '16-9',
        tag: '',
        tagPos: 'none',
        glow: 24,
        radius: 18,
        thickness: 4
    };
}

app.get('/api/camera-settings/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const board = data[uid] || getDefaultBoard(uid);
    const settings = {
        ...getDefaultCameraSettings(),
        ...(board.cameraSettings || {})
    };
    res.json({ success: true, settings });
});

app.post('/api/camera-settings/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    data[uid].cameraSettings = {
        ...(data[uid].cameraSettings || getDefaultCameraSettings()),
        ...req.body
    };

    writeData(data);
    io.emit('camera_settings_update', { uid, settings: data[uid].cameraSettings });
    res.json({ success: true, settings: data[uid].cameraSettings });
});

// MEZO TIK Last Supporter proxy helper
app.get('/api/last-supporter', async (req, res) => {
    const username = req.query.username || 'mezo';
    try {
        const response = await fetch(
            `https://tikalert-eg.com/last-supporter/widget?username=${username}`,
            { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }
        );
        const html = await response.text();
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (err) {
        res.status(500).send('Error loading widget');
    }
});

// Device board UID helper
app.get('/api/device-board', (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || 'default';
    const board_id = 'board_' + Buffer.from(ip).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 12);
    res.json({ success: true, board_id });
});

// Default Fire Settings
function getDefaultFireSettings() {
    return {
        text: 'رابط الدعم في البايو 🔥',
        smoke_enabled: true,
        color: '#ff1e00',
        shine_color: '#ffd700',
        font_size: 64,
        font_family: 'Cairo',
        letter_spacing: 2,
        animation_style: 'realistic_flames',
        display_mode: 'cycle',           // 'continuous', 'cycle'
        banner_style: 'transparent',     // 'transparent', 'glass', 'magma'
        intro_style: 'burst',            // 'burst', 'volcano', 'slide', 'burn', 'fade'
        outro_style: 'burn',             // 'burn', 'slide', 'melt', 'fade'
        intro_duration: 2.5,
        hold_duration: 4.0,
        outro_duration: 2.5,
        loop_interval: 8,
        neon_enabled: 1,
        neon_strength: 95,
        flame_height: 120,
        flame_density: 100,
        flame_particles: true,           // realistic rising sparks & flames
        sound_enabled: true,
        position_v: 'center',            // 'top', 'center', 'bottom'
        position_h: 'center',            // 'right', 'center', 'left'
        offset_y: 0,
        scale: 100,
        display_type: 'text',            // 'text', 'image'
        card_image: 'https://raw.githubusercontent.com/RoyaleAPI/cr-api-assets/master/cards/king.png',
        card_position: 'edge-right',     // 'edge-right', 'edge-left', 'center'
        card_width: 220,
        card_badge: '👑 ROYALE',
        card_title: 'الملك'
    };
}

// Get Fire Settings
app.get('/api/fire-settings/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const board = data[uid] || getDefaultBoard(uid);
    const settings = {
        ...getDefaultFireSettings(),
        ...(board.fireSettings || {})
    };
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, settings });
});

// Save Fire Settings
app.post('/api/fire-settings/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    data[uid].fireSettings = {
        ...(data[uid].fireSettings || getDefaultFireSettings()),
        ...req.body
    };

    writeData(data);

    // Real-time broadcast to OBS and preview clients
    io.emit('fire_settings_update', { uid, settings: data[uid].fireSettings });

    res.json({ success: true, settings: data[uid].fireSettings });
});

// ================= SUPPORT LINK (TIKOVERLAY 3D LIQUID FIRE) ROUTES ================= //

function getDefaultSupportLinkSettings() {
    return {
        mode: 'text',
        text: 'رابط الدعم بالبايو 🔥',
        accentColor: '#ff1e00',
        secondaryColor: '#ffd700',
        fontFamily: 'Cairo',
        fontSize: 72,
        scale: 1.0,
        offsetY: 0,
        vAlign: 'center',
        hAlign: 'center',
        sparks: true,
        glowIntensity: 100,
        subtitle: ''
    };
}

// Exact TikOverlay compatibility route
app.get('/widgets/support-link/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'widgets', 'support-link', 'index.html'));
});

app.get('/widgets/support-link', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'widgets', 'support-link', 'index.html'));
});

app.get('/support-link.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'support-link.html'));
});

app.get('/support-link', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'support-link.html'));
});

// TikOverlay native settings endpoint
app.get('/api/widget/support-link/settings', (req, res) => {
    const uid = req.query.uid || 'board_XXXX';
    const data = readData();
    const board = data[uid] || getDefaultBoard(uid);
    const settings = board.supportLink || getDefaultSupportLinkSettings();
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, settings });
});

// Support Link Settings by UID
app.get('/api/support-link/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const board = data[uid] || getDefaultBoard(uid);
    const settings = board.supportLink || getDefaultSupportLinkSettings();
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, settings });
});

app.post('/api/support-link/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    data[uid].supportLink = {
        ...(data[uid].supportLink || getDefaultSupportLinkSettings()),
        ...req.body
    };

    writeData(data);
    res.json({ success: true, settings: data[uid].supportLink });
});

// System Status & Storage Diagnostics
app.get('/api/status', (req, res) => {
    const data = readData();
    const boards = Object.keys(data);
    res.json({
        cloudinary: isCloudinaryConfigured(),
        imgbb: Boolean(process.env.IMGBB_API_KEY),
        mongodb: Boolean(mongoCollection),
        persistentDisk: Boolean(process.env.DATA_DIR),
        storageMode: isCloudinaryConfigured() 
            ? 'Cloudinary (سحابي دائم ☁️)' 
            : (process.env.IMGBB_API_KEY ? 'ImgBB (سحابي دائم ☁️)' : 'محلي (قرص الخادم)'),
        dataPersistence: mongoCollection 
            ? 'MongoDB Atlas (قاعدة بيانات سحابية دائمة)' 
            : (process.env.DATA_DIR ? 'قرص ثابت (Render Disk)' : 'ملف محلي (JSON File)'),
        keepAlive: keepAliveStatus,
        boardsCount: boards.length,
        boards: boards
    });
});

// Save Cloud Config to .env (Useful for local or admin setup)
app.post('/api/config/save', (req, res) => {
    try {
        const { cloudinaryCloudName, cloudinaryApiKey, cloudinaryApiSecret, imgbbKey, mongoUri } = req.body;
        const envPath = path.join(__dirname, '.env');
        let currentEnv = '';
        if (fs.existsSync(envPath)) {
            currentEnv = fs.readFileSync(envPath, 'utf8');
        }

        const updates = {
            CLOUDINARY_CLOUD_NAME: cloudinaryCloudName,
            CLOUDINARY_API_KEY: cloudinaryApiKey,
            CLOUDINARY_API_SECRET: cloudinaryApiSecret,
            IMGBB_API_KEY: imgbbKey,
            MONGODB_URI: mongoUri
        };

        let envLines = currentEnv ? currentEnv.split('\n') : [];
        for (const [key, val] of Object.entries(updates)) {
            if (val !== undefined) {
                process.env[key] = val;
                const index = envLines.findIndex(line => line.trim().startsWith(`${key}=`));
                if (index !== -1) {
                    envLines[index] = `${key}=${val}`;
                } else {
                    envLines.push(`${key}=${val}`);
                }
            }
        }

        fs.writeFileSync(envPath, envLines.join('\n').trim() + '\n', 'utf8');
        
        // Re-configure Cloudinary if updated
        if (isCloudinaryConfigured()) {
            cloudinary.config({
                ...getCloudinaryConfig(),
                secure: true
            });
        }

        res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Full Backup (Export JSON)
app.get('/api/backup', (req, res) => {
    const data = readData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="gifts-overlay-backup.json"');
    res.send(JSON.stringify(data, null, 2));
});

// Restore from Backup JSON
app.post('/api/restore', (req, res) => {
    try {
        const { data, overwrite } = req.body;
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'ملف النسخة الاحتياطية غير صالح' });
        }
        let current = overwrite ? {} : readData();
        const merged = { ...current, ...data };
        writeData(merged);
        res.json({ success: true, message: 'تمت استعادة البيانات بنجاح!', count: Object.keys(merged).length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Board Data
app.get('/api/data/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const def = getDefaultBoard(uid);
    const board = { ...def, ...(data[uid] || {}) };
    res.json(board);
});

// Update Board Settings (Positions, Offsets, Color, Scale, etc.)
app.all(['/api/board/:uid/settings', '/api/board/:uid'], (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const def = getDefaultBoard(uid);
    if (!data[uid]) {
        data[uid] = def;
    } else {
        data[uid] = { ...def, ...data[uid] };
    }

    if (req.method === 'GET') {
        return res.json({ success: true, board: data[uid] });
    }

    const settings = req.body || {};
    data[uid] = {
        ...data[uid],
        ...settings,
        gifts: data[uid].gifts || [] // preserve gifts
    };

    writeData(data);
    io.emit('board_settings_update', { uid, board: data[uid] });
    res.json({ success: true, board: data[uid] });
});

// Legacy Color update endpoint
app.put('/api/color/:uid', (req, res) => {
    const uid = req.params.uid;
    const { color } = req.body;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);
    data[uid].color = color;
    writeData(data);
    io.emit('board_settings_update', { uid, board: data[uid] });
    res.json({ success: true, color });
});

// ================= CARDS BOARD (GIFTS 3) ENDPOINTS ================= //

// Get Cards Board Data
app.get('/api/cards-board/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const def = getDefaultCardsBoard(uid);
    const board = (data[uid] && data[uid].cardsBoard) ? { ...def, ...data[uid].cardsBoard } : def;
    res.json({ success: true, board });
});

// Update Cards Board Data (Settings, Cards, Multiplier, Fonts, Position, Neon)
app.all(['/api/cards-board/:uid/settings', '/api/cards-board/:uid'], (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    const def = getDefaultCardsBoard(uid);
    const currentCardsBoard = data[uid].cardsBoard ? { ...def, ...data[uid].cardsBoard } : def;

    if (req.method === 'GET') {
        return res.json({ success: true, board: currentCardsBoard });
    }

    const settings = req.body || {};
    data[uid].cardsBoard = {
        ...currentCardsBoard,
        ...settings,
        teamRed: settings.teamRed || currentCardsBoard.teamRed || def.teamRed,
        teamBlue: settings.teamBlue || currentCardsBoard.teamBlue || def.teamBlue
    };

    writeData(data);
    io.emit('cards_board_update', { uid, board: data[uid].cardsBoard });
    res.json({ success: true, board: data[uid].cardsBoard });
});

// ================= CARDS 4 BOARD (GIFTS 4 - CLASSIC MC ROYALE) ENDPOINTS ================= //
app.get('/api/cards4-board/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const def = getDefaultCards4Board(uid);
    const board = (data[uid] && data[uid].cards4Board) ? { ...def, ...data[uid].cards4Board } : def;
    res.json({ success: true, board });
});

app.all(['/api/cards4-board/:uid/settings', '/api/cards4-board/:uid'], (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    const def = getDefaultCards4Board(uid);
    const currentCards4Board = data[uid].cards4Board ? { ...def, ...data[uid].cards4Board } : def;

    if (req.method === 'GET') {
        return res.json({ success: true, board: currentCards4Board });
    }

    const settings = req.body || {};
    data[uid].cards4Board = {
        ...currentCards4Board,
        ...settings,
        teamRed: settings.teamRed || currentCards4Board.teamRed || def.teamRed,
        teamBlue: settings.teamBlue || currentCards4Board.teamBlue || def.teamBlue
    };

    writeData(data);
    io.emit('cards4_board_update', { uid, board: data[uid].cards4Board });
    res.json({ success: true, board: data[uid].cards4Board });
});

// Get Gifts only
app.get('/api/gifts/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    const board = data[uid] || getDefaultBoard(uid);
    res.json(board.gifts || []);
});

// Add Single Gift (Supports File Upload OR Direct Image URL)
app.post('/api/gifts/:uid', upload.single('imageFile'), async (req, res) => {
    try {
        const uid = req.params.uid;
        const { name, imageUrl } = req.body;
        const data = readData();
        if (!data[uid]) data[uid] = getDefaultBoard(uid);

        let finalImage = '';

        if (req.file) {
            finalImage = await saveUploadedFile(req.file);
        } else if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
            finalImage = imageUrl.trim();
        }

        if (!name || !finalImage) {
            return res.status(400).json({ error: 'الاسم والصورة مطلوبان' });
        }

        const newGift = {
            id: Date.now(),
            name: name.trim(),
            image: finalImage
        };

        if (!data[uid].gifts) data[uid].gifts = [];
        data[uid].gifts.push(newGift);
        writeData(data);

        res.status(201).json(newGift);
    } catch (err) {
        console.error('Error adding gift:', err);
        res.status(500).json({ error: 'فشل إضافة الهدية: ' + err.message });
    }
});

// Upload Custom Card Image for TikTok Cards 3
app.post('/api/upload-card-image', upload.single('cardImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم إرسال ملف' });
        }
        const savedImg = await saveUploadedFile(req.file);
        const finalUrl = (savedImg.startsWith('http://') || savedImg.startsWith('https://') || savedImg.startsWith('/'))
            ? savedImg
            : `/images/${savedImg}`;
        res.json({ success: true, url: finalUrl });
    } catch (e) {
        console.error('Upload card image error:', e);
        res.status(500).json({ error: 'فشل رفع صورة البطاقة' });
    }
});

// ================= LAST SUPPORTER FRAMES ENDPOINTS ================= //
app.get('/api/supporter-frame/:uid', (req, res) => {
    const uid = req.params.uid || 'default';
    const data = readData();
    const def = getDefaultSupporterFrame(uid);
    const frame = (data[uid] && data[uid].supporterFrame) ? { ...def, ...data[uid].supporterFrame } : def;
    res.json({ success: true, frame });
});

app.post('/api/supporter-frame/:uid', (req, res) => {
    const uid = req.params.uid || 'default';
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);
    const def = getDefaultSupporterFrame(uid);
    const current = (data[uid] && data[uid].supporterFrame) ? { ...def, ...data[uid].supporterFrame } : def;
    const updates = req.body || {};
    data[uid].supporterFrame = {
        ...current,
        ...updates,
        updatedAt: Date.now()
    };
    writeData(data);
    io.emit('supporter_frame_update', { uid, frame: data[uid].supporterFrame });
    res.json({ success: true, frame: data[uid].supporterFrame });
});

app.post('/api/upload-frame-media', upload.single('frameMedia'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'لم يتم تحديد ملف إطار' });
        }
        const savedMedia = await saveUploadedFile(req.file);
        const finalUrl = (savedMedia.startsWith('http://') || savedMedia.startsWith('https://') || savedMedia.startsWith('/'))
            ? savedMedia
            : `/images/${savedMedia}`;
        res.json({ success: true, url: finalUrl });
    } catch (e) {
        console.error('Upload frame media error:', e);
        res.status(500).json({ error: 'فشل رفع ملف الإطار: ' + e.message });
    }
});

// Bulk Upload Gifts (Multiple Files or Array of {name, imageUrl})
app.post('/api/gifts/:uid/bulk', upload.array('images', 30), async (req, res) => {
    try {
        const uid = req.params.uid;
        const { names, items } = req.body;
        const data = readData();
        if (!data[uid]) data[uid] = getDefaultBoard(uid);
        if (!data[uid].gifts) data[uid].gifts = [];

        const newGifts = [];

        // Case A: Multipart uploaded files
        if (req.files && req.files.length > 0) {
            let namesArray = [];
            try {
                namesArray = JSON.parse(names || '[]');
            } catch {
                namesArray = [];
            }

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const savedImage = await saveUploadedFile(file);
                const newGift = {
                    id: Date.now() + i,
                    name: namesArray[i] || `هدية ${data[uid].gifts.length + 1}`,
                    image: savedImage
                };
                data[uid].gifts.push(newGift);
                newGifts.push(newGift);
            }
        } 
        // Case B: JSON Items with direct URLs
        else if (items) {
            let itemsArray = typeof items === 'string' ? JSON.parse(items) : items;
            itemsArray.forEach((item, i) => {
                if (item.name && item.image) {
                    const newGift = {
                        id: Date.now() + i,
                        name: item.name.trim(),
                        image: item.image.trim()
                    };
                    data[uid].gifts.push(newGift);
                    newGifts.push(newGift);
                }
            });
        }

        writeData(data);
        res.status(201).json(newGifts);
    } catch (err) {
        console.error('Error in bulk upload:', err);
        res.status(500).json({ error: 'فشل حفظ الهدايا: ' + err.message });
    }
});

// Update a Gift (Name or Image)
app.put('/api/gifts/:uid/:id', upload.single('imageFile'), async (req, res) => {
    try {
        const uid = req.params.uid;
        const id = parseInt(req.params.id);
        const data = readData();
        if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });

        const index = data[uid].gifts.findIndex(g => g.id === id);
        if (index === -1) return res.status(404).json({ error: 'الهدية غير موجودة' });

        if (req.body.name) {
            data[uid].gifts[index].name = req.body.name.trim();
        }
        if (req.body.imageUrl) {
            data[uid].gifts[index].image = req.body.imageUrl.trim();
        }
        if (req.file) {
            data[uid].gifts[index].image = await saveUploadedFile(req.file);
        }

        writeData(data);
        res.json(data[uid].gifts[index]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a Gift
app.delete('/api/gifts/:uid/:id', (req, res) => {
    const uid = req.params.uid;
    const id = parseInt(req.params.id);
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });

    data[uid].gifts = data[uid].gifts.filter(g => g.id !== id);
    writeData(data);
    res.json({ success: true });
});

// Move Gift Up
app.post('/api/gifts/:uid/:id/up', (req, res) => {
    const uid = req.params.uid;
    const id = parseInt(req.params.id);
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });

    const arr = data[uid].gifts;
    const index = arr.findIndex(g => g.id === id);
    if (index <= 0) return res.json({ success: false });

    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    writeData(data);
    res.json({ success: true, gifts: arr });
});

// Move Gift Down
app.post('/api/gifts/:uid/:id/down', (req, res) => {
    const uid = req.params.uid;
    const id = parseInt(req.params.id);
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });

    const arr = data[uid].gifts;
    const index = arr.findIndex(g => g.id === id);
    if (index === -1 || index >= arr.length - 1) return res.json({ success: false });

    [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
    writeData(data);
    res.json({ success: true, gifts: arr });
});

// Reorder Gifts (Drag & Drop array of IDs)
app.put('/api/gifts/:uid/reorder', (req, res) => {
    const uid = req.params.uid;
    const { order } = req.body; // array of IDs
    const data = readData();
    if (!data[uid]) return res.status(404).json({ error: 'اللوحة غير موجودة' });
    if (!Array.isArray(order)) return res.status(400).json({ error: 'الترتيب غير صالح' });

    const currentGifts = data[uid].gifts || [];
    const giftsMap = new Map(currentGifts.map(g => [g.id, g]));

    const reordered = [];
    order.forEach(id => {
        const gift = giftsMap.get(parseInt(id));
        if (gift) {
            reordered.push(gift);
            giftsMap.delete(parseInt(id));
        }
    });

    // Add any remaining gifts that were not in order array
    giftsMap.forEach(gift => reordered.push(gift));

    data[uid].gifts = reordered;
    writeData(data);
    res.json({ success: true, gifts: reordered });
});

// ================= صراع الحكام (JUDGES CHALLENGE / ROBLOX RACE) ================= //
const raceDataPath = path.join(dataDir, 'race-data.json');

function getDefaultRaceState() {
    return {
        title: 'صراع الحكام',
        activeJudgeId: null,
        judges: {},
        history: [],
        settings: {
            soundEnabled: true,
            overlayScale: 100,
            showLeaderboard: true
        }
    };
}

let raceState = getDefaultRaceState();
if (fs.existsSync(raceDataPath)) {
    try {
        const raw = fs.readFileSync(raceDataPath, 'utf8');
        const parsed = JSON.parse(raw);
        raceState = { ...getDefaultRaceState(), ...parsed };
    } catch (e) {
        console.error('Error reading race-data.json:', e.message);
    }
}

function saveRaceState() {
    try {
        fs.writeFileSync(raceDataPath, JSON.stringify(raceState, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving race-data.json:', e.message);
    }
}

function getRaceLeaderboard() {
    const list = Object.values(raceState.judges || {});
    list.sort((a, b) => (b.wins || 0) - (a.wins || 0));
    return list;
}

function getRaceActiveJudge() {
    if (raceState.activeJudgeId && raceState.judges && raceState.judges[raceState.activeJudgeId]) {
        return raceState.judges[raceState.activeJudgeId];
    }
    const lb = getRaceLeaderboard();
    return lb.length > 0 ? lb[0] : null;
}

function broadcastRaceState() {
    const payload = {
        title: raceState.title || 'صراع الحكام',
        activeJudge: getRaceActiveJudge(),
        leaderboard: getRaceLeaderboard(),
        settings: raceState.settings,
        history: (raceState.history || []).slice(0, 30)
    };
    io.emit('race_state_update', payload);
    io.emit('state_update', payload);
}

function addRaceHistory(type, text) {
    if (!raceState.history) raceState.history = [];
    raceState.history.unshift({
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        type,
        text,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    if (raceState.history.length > 100) raceState.history.pop();
}

// 1. TikTok User Info & Live Stats Fetcher (Exact statsV2 followerCount)
function fetchTikTokUser(username) {
    return new Promise((resolve) => {
        const cleanUser = username.trim().replace(/^@/, '');
        const url = `https://www.tiktok.com/@${encodeURIComponent(cleanUser)}`;

        const req = https.get(url, {
            timeout: 4500,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        }, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                let nickname = cleanUser;
                let avatar = '';
                let verified = false;
                let followers = null;
                let likes = null;
                let following = null;
                let videos = null;

                const sgiMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
                if (sgiMatch && sgiMatch[1]) {
                    try {
                        const parsed = JSON.parse(sgiMatch[1]);
                        const userInfo = parsed['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo;
                        const userDetail = userInfo?.user;
                        const statsV2 = userInfo?.statsV2;
                        const stats = userInfo?.stats;

                        if (userDetail) {
                            nickname = userDetail.nickname || userDetail.uniqueId || cleanUser;
                            avatar = userDetail.avatarLarger || userDetail.avatarMedium || userDetail.avatarThumb || '';
                            verified = !!userDetail.verified;
                        }
                        if (statsV2 || stats) {
                            const fRaw = statsV2?.followerCount ?? stats?.followerCount;
                            const lRaw = statsV2?.heartCount ?? statsV2?.heart ?? stats?.heartCount ?? stats?.heart;
                            const fgRaw = statsV2?.followingCount ?? stats?.followingCount;
                            const vRaw = statsV2?.videoCount ?? stats?.videoCount;

                            if (fRaw !== undefined && fRaw !== null) followers = Math.max(0, parseInt(fRaw, 10) || 0);
                            if (lRaw !== undefined && lRaw !== null) likes = Math.max(0, parseInt(lRaw, 10) || 0);
                            if (fgRaw !== undefined && fgRaw !== null) following = Math.max(0, parseInt(fgRaw, 10) || 0);
                            if (vRaw !== undefined && vRaw !== null) videos = Math.max(0, parseInt(vRaw, 10) || 0);
                        }
                    } catch (e) {}
                }

                if (!avatar) {
                    const avatarMatch = html.match(/"avatarLarger":"([^"]+)"/) || html.match(/"avatarMedium":"([^"]+)"/);
                    if (avatarMatch) avatar = avatarMatch[1].replace(/\\u002F/g, '/');
                }
                if (nickname === cleanUser) {
                    const nickMatch = html.match(/"nickname":"([^"]+)"/);
                    if (nickMatch) nickname = nickMatch[1];
                }
                if (followers === null) {
                    const fMatch = html.match(/"followerCount"\s*:\s*"?(\d+)"?/);
                    if (fMatch) followers = parseInt(fMatch[1], 10) || 0;
                }
                if (likes === null) {
                    const lMatch = html.match(/"heartCount"\s*:\s*"?(\d+)"?/) || html.match(/"heart"\s*:\s*"?(\d+)"?/);
                    if (lMatch) likes = parseInt(lMatch[1], 10) || 0;
                }

                if (!avatar) {
                    avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`;
                }

                resolve({
                    platform: 'tiktok',
                    username: cleanUser,
                    nickname,
                    avatar,
                    verified,
                    followers: followers !== null ? followers : 0,
                    likes: likes !== null ? likes : 0,
                    following: following !== null ? following : 0,
                    videos: videos !== null ? videos : 0,
                    fetchedLive: followers !== null
                });
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                platform: 'tiktok',
                username: cleanUser,
                nickname: cleanUser,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
                verified: false,
                followers: 0,
                likes: 0,
                following: 0,
                videos: 0,
                fetchedLive: false
            });
        });

        req.on('error', () => {
            resolve({
                platform: 'tiktok',
                username: cleanUser,
                nickname: cleanUser,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
                verified: false,
                followers: 0,
                likes: 0,
                following: 0,
                videos: 0,
                fetchedLive: false
            });
        });
    });
}

// 2. Roblox User Info Fetcher
function fetchRobloxUser(username) {
    return new Promise((resolve) => {
        const cleanUser = username.trim();
        const postData = JSON.stringify({
            usernames: [cleanUser],
            excludeBannedUsers: false
        });

        const req = https.request('https://users.roblox.com/v1/usernames/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.data && json.data.length > 0) {
                        const user = json.data[0];
                        const userId = user.id;
                        const displayName = user.displayName || user.name;

                        https.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`, (tRes) => {
                            let tData = '';
                            tRes.on('data', c => tData += c);
                            tRes.on('end', () => {
                                let avatar = '';
                                try {
                                    const tJson = JSON.parse(tData);
                                    if (tJson.data && tJson.data.length > 0) {
                                        avatar = tJson.data[0].imageUrl;
                                    }
                                } catch (e) {}

                                resolve({
                                    platform: 'roblox',
                                    userId,
                                    username: user.name,
                                    nickname: displayName,
                                    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`
                                });
                            });
                        });
                    } else {
                        resolve({
                            platform: 'roblox',
                            username: cleanUser,
                            nickname: cleanUser,
                            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`
                        });
                    }
                } catch (e) {
                    resolve({
                        platform: 'roblox',
                        username: cleanUser,
                        nickname: cleanUser,
                        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`
                    });
                }
            });
        });

        req.on('error', () => {
            resolve({
                platform: 'roblox',
                username: cleanUser,
                nickname: cleanUser,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`
            });
        });

        req.write(postData);
        req.end();
    });
}

async function fetchRaceUserInfo(platform, username) {
    if (platform === 'roblox') {
        return await fetchRobloxUser(username);
    }
    return await fetchTikTokUser(username);
}

// Race API Endpoints
const handleGetRaceState = (req, res) => {
    res.json({
        success: true,
        title: raceState.title || 'صراع الحكام',
        activeJudge: getRaceActiveJudge(),
        leaderboard: getRaceLeaderboard(),
        settings: raceState.settings,
        history: (raceState.history || []).slice(0, 30)
    });
};
app.get('/api/race/state', handleGetRaceState);
app.get('/api/state', handleGetRaceState);

const handleRaceUserLookup = async (req, res) => {
    const { platform, username } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم' });
    }
    try {
        const info = await fetchRaceUserInfo(platform || 'tiktok', username.trim());
        res.json({ success: true, user: info });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
app.post('/api/race/user/lookup', handleRaceUserLookup);
app.post('/api/user/lookup', handleRaceUserLookup);

const handleAddOrUpdateJudge = async (req, res) => {
    const { username, platform, wins, role, customNickname, customAvatar } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'يرجى إدخال اسم المستخدم' });
    }

    const plat = platform || 'tiktok';
    const cleanUser = username.trim().replace(/^@/, '');
    const id = `${plat}_${cleanUser.toLowerCase()}`;

    const fetched = await fetchRaceUserInfo(plat, cleanUser);
    const initialWins = parseInt(wins !== undefined ? wins : 0);
    const nickname = customNickname || fetched.nickname || cleanUser;
    const avatar = customAvatar || fetched.avatar;

    if (!raceState.judges) raceState.judges = {};
    raceState.judges[id] = {
        id,
        username: cleanUser,
        platform: plat,
        nickname,
        avatar,
        wins: Math.max(0, initialWins),
        role: role || 'حكم',
        updatedAt: Date.now()
    };

    if (!raceState.activeJudgeId || req.body.setActive) {
        raceState.activeJudgeId = id;
    }

    addRaceHistory('add', `👤 تم إضافة: ${nickname} (@${cleanUser}) برصيد ${initialWins} فوز`);
    saveRaceState();
    broadcastRaceState();

    res.json({ success: true, judge: raceState.judges[id] });
};
app.post('/api/race/judge', handleAddOrUpdateJudge);
app.post('/api/judge', handleAddOrUpdateJudge);

const handleActivateJudge = (req, res) => {
    const { id } = req.params;
    if (!raceState.judges || !raceState.judges[id]) {
        return res.status(404).json({ error: 'غير موجود' });
    }
    raceState.activeJudgeId = id;
    saveRaceState();
    broadcastRaceState();
    res.json({ success: true, activeJudge: raceState.judges[id] });
};
app.post('/api/race/judge/:id/activate', handleActivateJudge);
app.post('/api/judge/:id/activate', handleActivateJudge);

const handleJudgeWin = (req, res) => {
    const { id } = req.params;
    const count = parseInt(req.body.count || 1);

    if (!raceState.judges || !raceState.judges[id]) {
        return res.status(404).json({ error: 'غير موجود' });
    }

    raceState.judges[id].wins = Math.max(0, (raceState.judges[id].wins || 0) + count);
    const judge = raceState.judges[id];

    addRaceHistory('win', `🏆 فوز جديد لـ ${judge.nickname}! (+${count} فوز) الإجمالي: ${judge.wins} 🏆`);
    saveRaceState();
    broadcastRaceState();

    const celebData = {
        id: judge.id,
        nickname: judge.nickname,
        username: judge.username,
        avatar: judge.avatar,
        wins: judge.wins,
        addedWins: count
    };
    io.emit('race_win_celebration', celebData);
    io.emit('win_celebration', celebData);

    res.json({ success: true, wins: judge.wins, judge });
};
app.post('/api/race/judge/:id/win', handleJudgeWin);
app.post('/api/judge/:id/win', handleJudgeWin);

const handleJudgeMinus = (req, res) => {
    const { id } = req.params;
    if (!raceState.judges || !raceState.judges[id]) return res.status(404).json({ error: 'غير موجود' });

    raceState.judges[id].wins = Math.max(0, (raceState.judges[id].wins || 0) - 1);
    saveRaceState();
    broadcastRaceState();
    res.json({ success: true, wins: raceState.judges[id].wins });
};
app.post('/api/race/judge/:id/minus', handleJudgeMinus);
app.post('/api/judge/:id/minus', handleJudgeMinus);

const handleJudgeSetWins = (req, res) => {
    const { id } = req.params;
    const count = parseInt(req.body.wins || 0);

    if (!raceState.judges || !raceState.judges[id]) return res.status(404).json({ error: 'غير موجود' });

    raceState.judges[id].wins = Math.max(0, count);
    const judge = raceState.judges[id];

    addRaceHistory('update', `✏️ تم تعديل انتصارات ${judge.nickname} إلى ${judge.wins} فوز`);
    saveRaceState();
    broadcastRaceState();

    const celebData = {
        id: judge.id,
        nickname: judge.nickname,
        username: judge.username,
        avatar: judge.avatar,
        wins: judge.wins,
        addedWins: 0
    };
    io.emit('race_win_celebration', celebData);
    io.emit('win_celebration', celebData);

    res.json({ success: true, wins: judge.wins, judge });
};
app.post('/api/race/judge/:id/set-wins', handleJudgeSetWins);
app.post('/api/judge/:id/set-wins', handleJudgeSetWins);

const handleDeleteJudge = (req, res) => {
    const { id } = req.params;
    if (raceState.judges && raceState.judges[id]) {
        delete raceState.judges[id];
        if (raceState.activeJudgeId === id) {
            raceState.activeJudgeId = null;
        }
        saveRaceState();
        broadcastRaceState();
    }
    res.json({ success: true });
};
app.delete('/api/race/judge/:id', handleDeleteJudge);
app.delete('/api/judge/:id', handleDeleteJudge);

const handleResetAllWins = (req, res) => {
    if (raceState.judges) {
        Object.keys(raceState.judges).forEach(k => {
            raceState.judges[k].wins = 0;
        });
    }
    addRaceHistory('reset', '🔄 تم تصفير جميع عدادات الفوز');
    saveRaceState();
    broadcastRaceState();
    res.json({ success: true });
};
app.post('/api/race/reset-all-wins', handleResetAllWins);
app.post('/api/reset-all-wins', handleResetAllWins);

const handleRaceSettings = (req, res) => {
    if (req.body.title) raceState.title = req.body.title.trim();
    if (req.body.settings) raceState.settings = { ...(raceState.settings || {}), ...req.body.settings };
    saveRaceState();
    broadcastRaceState();
    res.json({ success: true });
};
app.post('/api/race/settings', handleRaceSettings);
app.post('/api/settings', handleRaceSettings);

// ================= إجمالي المتابعين (LIVE TIKTOK FOLLOWERS - 1s AUTO REFRESH) ================= //
const followersDataPath = path.join(dataDir, 'followers-data.json');

function getDefaultFollowersState() {
    return {
        title: 'إجمالي المتابعين',
        featuredUserId: 'mezo_1st',
        users: {},
        history: [],
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
        }
    };
}

let followersState = getDefaultFollowersState();
if (fs.existsSync(followersDataPath)) {
    try {
        const raw = fs.readFileSync(followersDataPath, 'utf8');
        const parsed = JSON.parse(raw);
        followersState = {
            ...getDefaultFollowersState(),
            ...parsed,
            settings: { ...getDefaultFollowersState().settings, ...(parsed.settings || {}) }
        };
    } catch (e) {
        console.error('Error reading followers-data.json:', e.message);
    }
}

function saveFollowersState() {
    try {
        fs.writeFileSync(followersDataPath, JSON.stringify(followersState, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving followers-data.json:', e.message);
    }
}

function seedDefaultFollowerUserIfNeeded() {
    if (!followersState.users) followersState.users = {};
    if (!followersState.users['mezo_1st']) {
        const judgeMezo = (raceState && raceState.judges && raceState.judges['tiktok_mezo_1st']) || null;
        followersState.users['mezo_1st'] = {
            id: 'mezo_1st',
            username: 'mezo_1st',
            nickname: judgeMezo ? judgeMezo.nickname : 'M E Z O',
            avatar: judgeMezo && judgeMezo.avatar ? judgeMezo.avatar : 'https://api.dicebear.com/7.x/bottts/svg?seed=mezo_1st',
            followers: 104393,
            initialFollowers: 104393,
            sessionGain: 0,
            lastDelta: 0,
            likes: 1250000,
            following: 45,
            videos: 120,
            verified: true,
            role: 'نجم البث 👑',
            updatedAt: Date.now()
        };
    }
    if (!followersState.featuredUserId || !followersState.users[followersState.featuredUserId]) {
        followersState.featuredUserId = 'mezo_1st';
    }
    saveFollowersState();
}

seedDefaultFollowerUserIfNeeded();

function getFollowersSortedList() {
    const list = Object.values(followersState.users || {});
    list.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    return list;
}

function getFollowersFeaturedUser() {
    if (followersState.featuredUserId && followersState.users && followersState.users[followersState.featuredUserId]) {
        return followersState.users[followersState.featuredUserId];
    }
    const list = getFollowersSortedList();
    return list.length > 0 ? list[0] : null;
}

function getNextFollowerMilestone(count) {
    const c = Math.max(0, parseInt(count, 10) || 0);
    if (c < 100) return 100;
    if (c < 500) return Math.ceil((c + 1) / 100) * 100;
    if (c < 1000) return 1000;
    if (c < 10000) return Math.ceil((c + 1) / 500) * 500;
    if (c < 100000) return Math.ceil((c + 1) / 1000) * 1000;
    return Math.ceil((c + 1) / 1000) * 1000;
}

function buildFollowersPayload() {
    const cfg = followersState.settings || getDefaultFollowersState().settings;
    const customGoalNum = parseInt(cfg.customGoal, 10) || 0;

    const usersList = getFollowersSortedList().map((u, idx) => {
        const fCount = parseInt(u.followers, 10) || 0;
        const autoGoal = getNextFollowerMilestone(fCount);
        const nextGoal = customGoalNum > 0 ? customGoalNum : autoGoal;
        const stepSize = nextGoal <= 100 ? 100 : (nextGoal <= 1000 ? 100 : (nextGoal <= 10000 ? 500 : 1000));
        const prevStep = customGoalNum > 0
            ? Math.max(0, Math.min(u.initialFollowers || Math.floor(fCount * 0.95), nextGoal - stepSize))
            : Math.max(0, nextGoal - stepSize);
        const span = Math.max(1, nextGoal - prevStep);
        const rawPct = fCount >= nextGoal ? 100 : Math.round(((fCount - prevStep) / span) * 100);
        const progressPct = Math.min(100, Math.max(6, rawPct));
        return {
            ...u,
            rank: idx + 1,
            nextGoal,
            remainingToGoal: Math.max(0, nextGoal - fCount),
            goalProgressPct: progressPct
        };
    });

    const featuredRaw = getFollowersFeaturedUser();
    const featuredUser = featuredRaw ? (usersList.find(u => u.id === featuredRaw.id) || usersList[0]) : null;

    return {
        success: true,
        title: followersState.title || 'إجمالي المتابعين',
        featuredUser,
        usersList,
        grandTotalFollowers: featuredUser ? (parseInt(featuredUser.followers, 10) || 0) : 0,
        grandTotalLikes: featuredUser ? (parseInt(featuredUser.likes, 10) || 0) : 0,
        grandTotalFollowing: featuredUser ? (parseInt(featuredUser.following, 10) || 0) : 0,
        grandTotalSessionGain: featuredUser ? (parseInt(featuredUser.sessionGain, 10) || 0) : 0,
        totalUsersCount: usersList.length,
        settings: cfg,
        history: (followersState.history || []).slice(0, 35),
        lastTickAt: Date.now()
    };
}

function broadcastFollowersState() {
    io.emit('followers_state_update', buildFollowersPayload());
}

function addFollowersHistory(type, text, meta = {}) {
    if (!followersState.history) followersState.history = [];
    followersState.history.unshift({
        id: Date.now() + Math.random().toString(36).substr(2, 4),
        type,
        text,
        ...meta,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });
    if (followersState.history.length > 100) followersState.history.pop();
}

async function refreshSingleFollowerUser(userKey, forceExact = false) {
    const existing = followersState.users ? followersState.users[userKey] : null;
    if (!existing || !existing.username) return null;

    try {
        const fetched = await fetchTikTokUser(existing.username);
        if (!fetched) return existing;

        let changed = false;
        if (fetched.nickname && fetched.nickname !== existing.username && fetched.nickname !== existing.nickname) {
            existing.nickname = fetched.nickname;
            changed = true;
        }
        if (fetched.avatar && !fetched.avatar.includes('dicebear') && fetched.avatar !== existing.avatar) {
            existing.avatar = fetched.avatar;
            changed = true;
        }
        if (fetched.verified !== undefined) {
            existing.verified = !!fetched.verified;
        }

        if (fetched.fetchedLive && fetched.followers > 0) {
            const oldFollowers = parseInt(existing.followers, 10) || 0;
            if (!existing.initialFollowers || existing.initialFollowers <= 0) {
                existing.initialFollowers = fetched.followers;
            }

            const newFollowers = forceExact ? fetched.followers : Math.max(oldFollowers, fetched.followers);
            const delta = oldFollowers > 0 ? (newFollowers - oldFollowers) : 0;

            if (newFollowers !== oldFollowers) {
                existing.followers = newFollowers;
                changed = true;
            }

            if (delta > 0) {
                existing.sessionGain = (parseInt(existing.sessionGain, 10) || 0) + delta;
                existing.lastDelta = delta;
                existing.lastGainAt = Date.now();
                changed = true;

                addFollowersHistory(
                    'gain',
                    `🔥 متابع جديد لـ ${existing.nickname} (+${delta})! الإجمالي الآن: ${newFollowers.toLocaleString()} متابع`,
                    { username: existing.username, nickname: existing.nickname, avatar: existing.avatar, delta, followers: newFollowers }
                );

                io.emit('followers_gain_celebration', {
                    id: existing.id,
                    username: existing.username,
                    nickname: existing.nickname,
                    avatar: existing.avatar,
                    followers: newFollowers,
                    delta
                });
            }

            if (fetched.likes > 0) existing.likes = fetched.likes;
            if (fetched.following > 0) existing.following = fetched.following;
            if (fetched.videos > 0) existing.videos = fetched.videos;
        }

        existing.lastCheckedAt = Date.now();
        if (changed) {
            existing.updatedAt = Date.now();
            saveFollowersState();
        }
        return existing;
    } catch (e) {
        return existing;
    }
}

async function refreshAllFollowersUsers(forceExact = false) {
    const activeKey = followersState.featuredUserId || 'mezo_1st';
    await refreshSingleFollowerUser(activeKey, forceExact);
    saveFollowersState();
    broadcastFollowersState();
}

// 1-Second Live Auto-Refresh Loop for the Active Single User ("بتتجدد كل ثانيه")
let isFollowersTickRunning = false;

function startFollowersLiveEngine() {
    setTimeout(() => {
        refreshAllFollowersUsers(true).catch(() => {});
    }, 200);

    setInterval(async () => {
        if (isFollowersTickRunning) {
            broadcastFollowersState();
            return;
        }
        isFollowersTickRunning = true;
        try {
            const activeKey = followersState.featuredUserId || 'mezo_1st';
            if (followersState.users && followersState.users[activeKey]) {
                await refreshSingleFollowerUser(activeKey, false);
            }
            broadcastFollowersState();
        } catch (err) {
            broadcastFollowersState();
        } finally {
            isFollowersTickRunning = false;
        }
    }, 1000);
}

startFollowersLiveEngine();

// Followers REST API Endpoints
app.get('/api/followers/state', (req, res) => {
    res.json(buildFollowersPayload());
});

app.post('/api/followers/user', async (req, res) => {
    const { username, role, setFeatured, singleUserOnly } = req.body;
    if (!username || !username.trim()) {
        return res.status(400).json({ error: 'يرجى إدخال اسم حساب التيك توك (@username)' });
    }

    const cleanUser = username.trim().replace(/^@/, '');
    const id = cleanUser.toLowerCase();

    try {
        const fetched = await fetchTikTokUser(cleanUser);
        if (!followersState.users) followersState.users = {};

        const prev = followersState.users[id];
        const followersCount = fetched.followers || (prev ? prev.followers : 0) || 0;

        const userObj = {
            id,
            username: fetched.username || cleanUser,
            nickname: fetched.nickname || (prev ? prev.nickname : cleanUser),
            avatar: fetched.avatar || (prev ? prev.avatar : `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`),
            followers: followersCount,
            initialFollowers: prev && prev.initialFollowers > 0 ? prev.initialFollowers : followersCount,
            sessionGain: prev ? (prev.sessionGain || 0) : 0,
            lastDelta: 0,
            likes: fetched.likes || (prev ? prev.likes : 0) || 0,
            following: fetched.following || (prev ? prev.following : 0) || 0,
            videos: fetched.videos || (prev ? prev.videos : 0) || 0,
            verified: !!fetched.verified,
            role: role || (prev ? prev.role : 'نجم البث 👑'),
            updatedAt: Date.now(),
            lastCheckedAt: Date.now()
        };

        if (singleUserOnly !== false) {
            followersState.users = { [id]: userObj };
        } else {
            followersState.users[id] = userObj;
        }
        followersState.featuredUserId = id;

        addFollowersHistory('add', `✅ تم تفعيل حساب ${userObj.nickname} (@${cleanUser}) بإجمالي ${followersCount.toLocaleString()} متابع`);
        saveFollowersState();
        broadcastFollowersState();

        res.json({ success: true, user: userObj, state: buildFollowersPayload() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/followers/user/:id/feature', (req, res) => {
    const id = req.params.id.toLowerCase();
    if (!followersState.users || !followersState.users[id]) {
        return res.status(404).json({ error: 'الحساب غير موجود' });
    }
    followersState.featuredUserId = id;
    saveFollowersState();
    broadcastFollowersState();
    res.json({ success: true, featuredUser: followersState.users[id] });
});

app.post('/api/followers/user/:id/refresh', async (req, res) => {
    const id = req.params.id.toLowerCase();
    if (!followersState.users || !followersState.users[id]) {
        return res.status(404).json({ error: 'الحساب غير موجود' });
    }
    const updated = await refreshSingleFollowerUser(id, true);
    saveFollowersState();
    broadcastFollowersState();
    res.json({ success: true, user: updated, state: buildFollowersPayload() });
});

app.post('/api/followers/refresh-all', async (req, res) => {
    await refreshAllFollowersUsers(true);
    res.json(buildFollowersPayload());
});

app.post('/api/followers/import-judges', async (req, res) => {
    if (!followersState.users) followersState.users = {};
    let importedCount = 0;

    if (raceState && raceState.judges) {
        for (const j of Object.values(raceState.judges)) {
            if (j && (!j.platform || j.platform === 'tiktok') && j.username) {
                const clean = j.username.trim().replace(/^@/, '');
                const key = clean.toLowerCase();
                if (!followersState.users[key]) {
                    followersState.users[key] = {
                        id: key,
                        username: clean,
                        nickname: j.nickname || clean,
                        avatar: j.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${clean}`,
                        followers: 0,
                        initialFollowers: 0,
                        sessionGain: 0,
                        lastDelta: 0,
                        likes: 0,
                        following: 0,
                        videos: 0,
                        verified: false,
                        role: j.role || 'حكم / داعم',
                        updatedAt: Date.now()
                    };
                    importedCount++;
                }
            }
        }
    }

    await refreshAllFollowersUsers(true);
    addFollowersHistory('import', `📥 تم استيراد وتحديث ${Object.keys(followersState.users).length} حساب تيك توك بنجاح`);
    saveFollowersState();
    broadcastFollowersState();
    res.json({ success: true, importedCount, state: buildFollowersPayload() });
});

app.post('/api/followers/simulate-gain', (req, res) => {
    const targetId = (req.body.id || followersState.featuredUserId || '').toLowerCase();
    const count = Math.max(1, parseInt(req.body.count || 1, 10));
    const user = (followersState.users && followersState.users[targetId]) || getFollowersFeaturedUser();

    if (!user) {
        return res.status(404).json({ error: 'يرجى إضافة حساب أولاً' });
    }

    user.followers = (parseInt(user.followers, 10) || 0) + count;
    user.sessionGain = (parseInt(user.sessionGain, 10) || 0) + count;
    user.lastDelta = count;
    user.lastGainAt = Date.now();
    user.updatedAt = Date.now();

    addFollowersHistory(
        'gain',
        `🎉 متابع جديد لـ ${user.nickname} (+${count})! الإجمالي: ${user.followers.toLocaleString()} متابع`,
        { username: user.username, nickname: user.nickname, avatar: user.avatar, delta: count, followers: user.followers }
    );

    saveFollowersState();
    broadcastFollowersState();

    io.emit('followers_gain_celebration', {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        followers: user.followers,
        delta: count
    });

    res.json({ success: true, user, state: buildFollowersPayload() });
});

app.post('/api/followers/reset-gains', (req, res) => {
    if (followersState.users) {
        Object.values(followersState.users).forEach(u => {
            u.sessionGain = 0;
            u.lastDelta = 0;
            u.initialFollowers = u.followers || 0;
        });
    }
    addFollowersHistory('reset', '🔄 تم تصفير عداد الزيادة المباشرة لهذه الجلسة');
    saveFollowersState();
    broadcastFollowersState();
    res.json({ success: true, state: buildFollowersPayload() });
});

app.delete('/api/followers/user/:id', (req, res) => {
    const id = req.params.id.toLowerCase();
    if (followersState.users && followersState.users[id]) {
        const name = followersState.users[id].nickname || id;
        delete followersState.users[id];
        if (followersState.featuredUserId === id) {
            const remaining = getFollowersSortedList();
            followersState.featuredUserId = remaining.length > 0 ? remaining[0].id : null;
        }
        addFollowersHistory('delete', `🗑️ تم حذف حساب ${name} من القائمة`);
        saveFollowersState();
        broadcastFollowersState();
    }
    res.json({ success: true, state: buildFollowersPayload() });
});

app.post('/api/followers/settings', (req, res) => {
    if (req.body.title !== undefined) {
        followersState.title = req.body.title.trim() || 'إجمالي المتابعين المباشر';
    }
    if (req.body.settings) {
        followersState.settings = {
            ...(followersState.settings || getDefaultFollowersState().settings),
            ...req.body.settings
        };
    }
    saveFollowersState();
    broadcastFollowersState();
    res.json({ success: true, settings: followersState.settings, state: buildFollowersPayload() });
});

app.post('/api/followers/trigger-event', (req, res) => {
    const { type, message } = req.body;
    const payload = buildFollowersPayload();
    const user = payload.featuredUser || (payload.usersList && payload.usersList[0]);
    const eventData = {
        type: type || 'hype_goal',
        message: message || '',
        user,
        timestamp: Date.now()
    };

    if (type === 'goal_reached') {
        addFollowersHistory('gain', `🏆 احتفالية تحقيق الهدف (${user ? user.nextGoal.toLocaleString() : ''} متابع) على البث المباشر!`);
    } else if (type === 'hype_goal') {
        addFollowersHistory('info', `🔥 نداء حماسي للمتابعين: متبقي ${user ? user.remainingToGoal.toLocaleString() : 0} متابع للوصول للهدف!`);
    } else if (message) {
        addFollowersHistory('info', `📢 رسالة مباشرة على الأوفرلاي: ${message}`);
    }

    saveFollowersState();
    broadcastFollowersState();
    io.emit('followers_special_event', eventData);
    res.json({ success: true, event: eventData, state: buildFollowersPayload() });
});

// ================= SECTION: تركيبات تيك توك لايف (TikTok Live Connector & Gift Combinations) ================= //
const { TikTokLiveConnection } = require('tiktok-live-connector');
const TARKIBAT_FILE = path.join(__dirname, 'tarkibat-data.json');

const DEFAULT_TARKIBAT_ITEMS = [
    {
        id: 'trk_1',
        enabled: true,
        name: '🚀 تيربو السرعة (وردة)',
        triggerType: 'gift',
        giftName: 'وردة',
        giftNameEn: 'Rose',
        giftImage: '/images/rose.png',
        giftCoins: 1,
        minRepeat: 1,
        scoreboardAction: 'team_b_add',
        scoreboardPoints: 1,
        multiplyByRepeat: true,
        showOverlayAlert: true,
        overlayCustomText: '🚀 تيربو سريع للمساعدين!',
        overlayCardImage: '/images/mcroyale/hog_rider.png',
        overlayColor: '#22ff88',
        soundEffect: 'score_up',
        addJudgeWin: false
    },
    {
        id: 'trk_2',
        enabled: true,
        name: '☄️ نيزك التدمير (قلب)',
        triggerType: 'gift',
        giftName: 'قلب',
        giftNameEn: 'Finger Heart',
        giftImage: '/images/heart.png',
        giftCoins: 5,
        minRepeat: 1,
        scoreboardAction: 'team_a_add',
        scoreboardPoints: 1,
        multiplyByRepeat: true,
        showOverlayAlert: true,
        overlayCustomText: '☄️ هجوم نيزك للمخربين!',
        overlayCardImage: '/images/mcroyale/golem_pumpkin.png',
        overlayColor: '#ff2a4a',
        soundEffect: 'explosion',
        addJudgeWin: false
    },
    {
        id: 'trk_3',
        enabled: true,
        name: '🛡️ درع الحماية الأسطوري (دونات)',
        triggerType: 'gift',
        giftName: 'دونات',
        giftNameEn: 'Doughnut',
        giftImage: '/images/donut.png',
        giftCoins: 30,
        minRepeat: 1,
        scoreboardAction: 'team_b_add',
        scoreboardPoints: 3,
        multiplyByRepeat: true,
        showOverlayAlert: true,
        overlayCustomText: '🛡️ درع حماية +3 نقاط للمساعدين!',
        overlayCardImage: '/images/mcroyale/evoker_mage.png',
        overlayColor: '#00f2fe',
        soundEffect: 'victory',
        addJudgeWin: false
    },
    {
        id: 'trk_4',
        enabled: true,
        name: '💣 صاروخ عاصف (عطر)',
        triggerType: 'gift',
        giftName: 'عطر',
        giftNameEn: 'Perfume',
        giftImage: '/images/perfume.png',
        giftCoins: 20,
        minRepeat: 1,
        scoreboardAction: 'team_a_add',
        scoreboardPoints: 2,
        multiplyByRepeat: true,
        showOverlayAlert: true,
        overlayCustomText: '💣 صاروخ هجومي +2 للمخربين!',
        overlayCardImage: '/images/mcroyale/skeleton_cap.png',
        overlayColor: '#ff0055',
        soundEffect: 'explosion',
        addJudgeWin: false
    },
    {
        id: 'trk_5',
        enabled: true,
        name: '➕ متابعة جديدة في البث (Follow)',
        triggerType: 'follow',
        giftName: 'فولو (متابعة)',
        giftNameEn: 'Follow',
        giftImage: '/images/tiktok_follow.png',
        giftCoins: 0,
        minRepeat: 1,
        scoreboardAction: 'none',
        scoreboardPoints: 1,
        multiplyByRepeat: false,
        showOverlayAlert: true,
        overlayCustomText: '👑 نورت البث بمتابعتك الأسطورية!',
        overlayCardImage: '/images/mezotik-logo.png',
        overlayColor: '#ffd700',
        soundEffect: 'victory',
        addJudgeWin: false
    }
];

const TARKIBAT_PRESETS = {
    helpers_vs_saboteurs: DEFAULT_TARKIBAT_ITEMS,
    mcroyale_cards: [
        {
            id: 'trk_mc_1',
            enabled: true,
            name: '💀 إنزال سكلتون بعصابة (وردة)',
            triggerType: 'gift',
            giftName: 'وردة',
            giftNameEn: 'Rose',
            giftImage: '/images/rose.png',
            giftCoins: 1,
            minRepeat: 1,
            scoreboardAction: 'team_a_add',
            scoreboardPoints: 1,
            multiplyByRepeat: true,
            showOverlayAlert: true,
            overlayCustomText: '💀 تم إنزال جندي سكلتون (X1)!',
            overlayCardImage: '/images/mcroyale/skeleton_bandana.png',
            overlayColor: '#ff2a4a',
            soundEffect: 'score_up',
            addJudgeWin: false
        },
        {
            id: 'trk_mc_2',
            enabled: true,
            name: '🧙‍♂️ استدعاء ساحر إيفوكر (قلب)',
            triggerType: 'gift',
            giftName: 'قلب',
            giftNameEn: 'Finger Heart',
            giftImage: '/images/heart.png',
            giftCoins: 5,
            minRepeat: 1,
            scoreboardAction: 'team_b_add',
            scoreboardPoints: 1,
            multiplyByRepeat: true,
            showOverlayAlert: true,
            overlayCustomText: '🧙‍♂️ ساحر إيفوكر دخل المعركة (X1)!',
            overlayCardImage: '/images/mcroyale/evoker_mage.png',
            overlayColor: '#00f2fe',
            soundEffect: 'victory',
            addJudgeWin: false
        },
        {
            id: 'trk_mc_3',
            enabled: true,
            name: '🐗 هجوم راكب الخنزير (عطر)',
            triggerType: 'gift',
            giftName: 'عطر',
            giftNameEn: 'Perfume',
            giftImage: '/images/perfume.png',
            giftCoins: 20,
            minRepeat: 1,
            scoreboardAction: 'team_a_add',
            scoreboardPoints: 2,
            multiplyByRepeat: true,
            showOverlayAlert: true,
            overlayCustomText: '🐗 هجوم راكب الخنزير بالمطرقة (X2)!',
            overlayCardImage: '/images/mcroyale/hog_rider.png',
            overlayColor: '#ff9900',
            soundEffect: 'explosion',
            addJudgeWin: false
        },
        {
            id: 'trk_mc_4',
            enabled: true,
            name: '🎃 وحش الغولم العملاق (دونات)',
            triggerType: 'gift',
            giftName: 'دونات',
            giftNameEn: 'Doughnut',
            giftImage: '/images/donut.png',
            giftCoins: 30,
            minRepeat: 1,
            scoreboardAction: 'team_b_add',
            scoreboardPoints: 3,
            multiplyByRepeat: true,
            showOverlayAlert: true,
            overlayCustomText: '🎃 وحش الغولم برأس اليقطين (X3)!',
            overlayCardImage: '/images/mcroyale/golem_pumpkin.png',
            overlayColor: '#a855f7',
            soundEffect: 'victory',
            addJudgeWin: false
        }
    ],
    interactive_stream: [
        {
            id: 'trk_int_1',
            enabled: true,
            name: '🎁 أي هدية في البث (Wildcard)',
            triggerType: 'gift',
            giftName: 'أي هدية',
            giftNameEn: 'Any Gift',
            giftImage: '/images/rose.png',
            giftCoins: 1,
            minRepeat: 1,
            scoreboardAction: 'team_b_add',
            scoreboardPoints: 1,
            multiplyByRepeat: true,
            showOverlayAlert: true,
            overlayCustomText: '🎁 شكراً على الهدية والدعم الأسطوري!',
            overlayCardImage: '/images/mezotik-logo.png',
            overlayColor: '#ffd700',
            soundEffect: 'victory',
            addJudgeWin: false
        },
        {
            id: 'trk_int_2',
            enabled: true,
            name: '➕ متابع جديد للبث',
            triggerType: 'follow',
            giftName: 'فولو (متابعة)',
            giftNameEn: 'Follow',
            giftImage: '/images/tiktok_follow.png',
            giftCoins: 0,
            minRepeat: 1,
            scoreboardAction: 'none',
            scoreboardPoints: 1,
            multiplyByRepeat: false,
            showOverlayAlert: true,
            overlayCustomText: '👑 أهلاً بك في جيش الأساطير!',
            overlayCardImage: '/images/mezotik-logo.png',
            overlayColor: '#22ff88',
            soundEffect: 'score_up',
            addJudgeWin: false
        },
        {
            id: 'trk_int_3',
            enabled: true,
            name: '❤️ تكبيس لايكات البث',
            triggerType: 'like',
            giftName: 'تكبيس لايكات',
            giftNameEn: 'Likes',
            giftImage: '/images/tiktok_likes.png',
            giftCoins: 0,
            minRepeat: 50,
            scoreboardAction: 'none',
            scoreboardPoints: 1,
            multiplyByRepeat: false,
            showOverlayAlert: true,
            overlayCustomText: '❤️ وحش التكبيس فجر الشاشة!',
            overlayCardImage: '/images/tiktok_likes.png',
            overlayColor: '#ff0055',
            soundEffect: 'score_up',
            addJudgeWin: false
        }
    ]
};

// Bilingual Arabic <-> English TikTok Gift Name Dictionary for 100% accurate live matching
const GIFT_AR_EN_ALIASES = {
    'وردة': ['rose', 'rosa', 'تيربو'],
    'تيربو': ['rose', 'وردة'],
    'قلب': ['finger heart', 'heart', 'heart me', 'hand heart', 'love'],
    'دونات': ['doughnut', 'donut', 'بوابه', 'بوابة'],
    'بوابه': ['doughnut', 'donut', 'دونات'],
    'عطر': ['perfume', 'صاروخ'],
    'صاروخ': ['perfume', 'rocket', 'عطر'],
    'آيس كريم': ['ice cream', 'ice cream cone'],
    'تيك توك': ['tiktok'],
    'جلاكسي': ['galaxy'],
    'أسد': ['lion'],
    'مكوك فضائي': ['space shuttle', 'spaceship', 'interstellar', 'eb77ead5c3abb6da6034d3cf6cfeb438'],
    'حمايه': ['shield', 'protection', 'e033c3f28632e233bebac1668ff66a2f'],
    'نيزك': ['meteor', 'meteor shower', '81cb495abfe066981b9c135cfff21c7a'],
    'تبطئ الاعبين': ['374dfe46d5b09ce1db19be06202d34f5'],
    'اسرع لاعب': ['9f8bd92363c400c284179f6719b6ba9c'],
    'نقل اسطوري': ['79a02148079526539f7599150da9fd28'],
    'فوز': ['1d067d13988e8754ed6adbebd89b9ee8', 'gg', 'win']
};

function readTarkibatData() {
    try {
        if (fs.existsSync(TARKIBAT_FILE)) {
            return JSON.parse(fs.readFileSync(TARKIBAT_FILE, 'utf8'));
        }
    } catch (e) {}
    return {};
}

function writeTarkibatData(data) {
    try {
        fs.writeFileSync(TARKIBAT_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {}
}

let tarkibatStore = readTarkibatData();
const activeLiveConnections = new Map(); // uid -> { conn, state, watchdogTimer, events }

function getTarkibatConfig(uid) {
    const cleanUid = uid || 'default';
    if (!tarkibatStore[cleanUid]) {
        tarkibatStore[cleanUid] = {
            tiktokUsername: 'mezo_1st',
            autoWatchdog: false,
            overlayStyle: {
                theme: 'royal_purple',
                position: 'top-center',
                alertDuration: 5,
                soundEnabled: true,
                showDonorAvatar: true,
                showGiftCoins: true,
                scale: 100
            },
            items: JSON.parse(JSON.stringify(DEFAULT_TARKIBAT_ITEMS))
        };
        writeTarkibatData(tarkibatStore);
    }
    return tarkibatStore[cleanUid];
}

function normalizeTikTokUsername(input) {
    if (!input) return '';
    let str = String(input).trim();
    const urlMatch = str.match(/tiktok\.com\/@([a-zA-Z0-9_.-]+)/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1].toLowerCase();
    }
    return str.replace(/^@+/, '').split('/')[0].split('?')[0].trim().toLowerCase();
}

function getLiveSessionRecord(uid) {
    const cleanUid = uid || 'default';
    if (!activeLiveConnections.has(cleanUid)) {
        activeLiveConnections.set(cleanUid, {
            conn: null,
            watchdogTimer: null,
            state: {
                username: getTarkibatConfig(cleanUid).tiktokUsername || 'mezo_1st',
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
                statusMessage: 'غير متصل حالياً — أدخل يوزر التيك توك واضغط فحص أو Connect'
            },
            events: []
        });
    }
    return activeLiveConnections.get(cleanUid);
}

function buildPublicLiveState(uid) {
    const rec = getLiveSessionRecord(uid);
    return {
        ...rec.state,
        events: rec.events.slice(0, 35)
    };
}

function pushLiveEventLog(uid, evt) {
    const rec = getLiveSessionRecord(uid);
    const entry = {
        id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        ...evt
    };
    rec.events.unshift(entry);
    if (rec.events.length > 50) rec.events.length = 50;
    io.emit('tarkibat_live_event', { uid, event: entry, state: buildPublicLiveState(uid) });
    return entry;
}

async function checkTikTokUserLiveStatus(rawUsername) {
    const username = normalizeTikTokUsername(rawUsername);
    if (!username) {
        throw new Error('يرجى إدخال يوزر تيك توك صحيح');
    }

    const conn = new TikTokLiveConnection(username, {
        processInitialData: true,
        fetchRoomInfoOnConnect: true,
        enableExtendedGiftInfo: true
    });

    const [isLiveResult, profileResult] = await Promise.allSettled([
        conn.fetchIsLive(),
        fetchTikTokUserProfile(username)
    ]);

    const isLive = isLiveResult.status === 'fulfilled' ? Boolean(isLiveResult.value) : false;
    const profile = profileResult.status === 'fulfilled' && profileResult.value
        ? profileResult.value
        : {
            username,
            nickname: username,
            avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
            followers: 0,
            likes: 0
        };

    let roomId = conn.roomId || null;
    let viewerCount = 0;
    let liveTitle = '';

    if (isLive) {
        try {
            if (!roomId) roomId = await conn.fetchRoomId();
            const roomInfo = await conn.fetchRoomInfo(roomId);
            const rData = roomInfo?.data || roomInfo || {};
            viewerCount = Number(rData.user_count || rData.stats?.total_user || 0);
            liveTitle = rData.title || '';
        } catch (e) {}
    }

    return {
        username,
        isLive,
        roomId: roomId ? String(roomId) : null,
        viewerCount,
        liveTitle,
        profile,
        checkedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
}

function doesItemMatchGift(item, giftData) {
    if (!item || !item.enabled || item.triggerType !== 'gift') return false;
    const targetName = String(item.giftName || '').trim().toLowerCase();
    const targetNameEn = String(item.giftNameEn || '').trim().toLowerCase();
    const incomingName = String(giftData.giftName || '').trim().toLowerCase();
    const incomingImg = String(giftData.giftImage || '').toLowerCase();
    const itemImg = String(item.giftImage || '').toLowerCase();

    if ((giftData.repeatCount || 1) < (parseInt(item.minRepeat, 10) || 1)) return false;

    // 1. Wildcard: "أي هدية" / "Any Gift"
    if (targetName === 'أي هدية' || targetName === 'اي هدية' || targetName === 'any gift' || targetName === '*') {
        return (giftData.diamondCount || 1) >= (parseInt(item.giftCoins, 10) || 1);
    }

    // 2. Direct name match (Arabic or English)
    if (targetName && incomingName && (incomingName === targetName || incomingName.includes(targetName) || targetName.includes(incomingName))) {
        return true;
    }
    if (targetNameEn && incomingName && (incomingName === targetNameEn || incomingName.includes(targetNameEn))) {
        return true;
    }

    // 3. Alias dictionary match
    const aliases = GIFT_AR_EN_ALIASES[item.giftName?.trim()] || [];
    for (const al of aliases) {
        const cleanAl = al.toLowerCase();
        if (incomingName === cleanAl || incomingName.includes(cleanAl) || incomingImg.includes(cleanAl)) {
            return true;
        }
    }

    // 4. Image filename/hash match (e.g. tplv-obj hash or rose.png)
    const hashMatch = itemImg.match(/([a-f0-9]{24,36})/i);
    if (hashMatch && incomingImg.includes(hashMatch[1].toLowerCase())) {
        return true;
    }

    return false;
}

function executeTarkibaItemActions(uid, item, eventMeta) {
    let scoreImpactText = '';
    const repeatCount = Math.max(1, parseInt(eventMeta.repeatCount, 10) || 1);
    const basePoints = Math.max(1, parseInt(item.scoreboardPoints, 10) || 1);
    const totalPoints = item.multiplyByRepeat !== false ? (basePoints * repeatCount) : basePoints;

    // 1. Scoreboard Action
    if (item.scoreboardAction && item.scoreboardAction !== 'none') {
        let team = 'a';
        let delta = totalPoints;
        if (item.scoreboardAction === 'team_a_add') { team = 'a'; delta = totalPoints; }
        else if (item.scoreboardAction === 'team_b_add') { team = 'b'; delta = totalPoints; }
        else if (item.scoreboardAction === 'team_a_sub') { team = 'a'; delta = -totalPoints; }
        else if (item.scoreboardAction === 'team_b_sub') { team = 'b'; delta = -totalPoints; }

        const updatedBoard = db.adjustScore(uid, team, delta);
        io.emit('scoreboard_update', updatedBoard);
        const teamLabel = team === 'a' ? (updatedBoard.team_a_name || 'الفريق 1') : (updatedBoard.team_b_name || 'الفريق 2');
        scoreImpactText = `${delta > 0 ? '+' + delta : delta} لـ ${teamLabel}`;
    }

    // 2. Judges Challenge Win Action
    if (item.addJudgeWin) {
        const activeJ = getRaceActiveJudge();
        if (activeJ) {
            activeJ.wins = (activeJ.wins || 0) + 1;
            saveRaceState();
            io.emit('race_state_update', {
                title: raceState.title || 'صراع الحكام',
                activeJudge: getRaceActiveJudge(),
                leaderboard: getRaceLeaderboard(),
                settings: raceState.settings,
                history: (raceState.history || []).slice(0, 30)
            });
        }
    }

    // 3. Emit Overlay Alert to tarkibat-overlay.html
    if (item.showOverlayAlert !== false) {
        io.emit('tarkibat_alert', {
            uid,
            tarkibaId: item.id,
            tarkibaName: item.name,
            username: eventMeta.username || 'viewer',
            nickname: eventMeta.nickname || eventMeta.username || 'داعم البث',
            avatar: eventMeta.avatar || '/images/mezotik-logo.png',
            giftName: eventMeta.giftName || item.giftName || 'هدية',
            giftImage: eventMeta.giftImage || item.giftImage || '/images/rose.png',
            overlayCardImage: item.overlayCardImage || eventMeta.giftImage || item.giftImage || '/images/rose.png',
            actionText: item.overlayCustomText || item.name,
            scoreImpactText,
            repeatCount,
            color: item.overlayColor || '#a855f7',
            soundEffect: item.soundEffect || 'victory'
        });
    }

    return scoreImpactText;
}

function extractEventUser(data) {
    const u = data?.user || data || {};
    const username = u.uniqueId || u.displayId || data?.uniqueId || 'viewer';
    const nickname = u.nickname || data?.nickname || username;
    const avatar =
        u.profilePicture?.url?.[0] ||
        u.profilePicture?.urls?.[0] ||
        u.avatarThumb?.urlList?.[0] ||
        data?.profilePictureUrl ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`;
    return { username, nickname, avatar };
}

async function connectTarkibatToTikTokLive(uid, rawUsername, autoWatchdog = false) {
    const cleanUid = uid || 'default';
    const rec = getLiveSessionRecord(cleanUid);
    const config = getTarkibatConfig(cleanUid);
    const username = normalizeTikTokUsername(rawUsername || config.tiktokUsername || 'mezo_1st');

    config.tiktokUsername = username;
    config.autoWatchdog = Boolean(autoWatchdog);
    writeTarkibatData(tarkibatStore);

    // Disconnect previous connection if any
    if (rec.conn) {
        try { await rec.conn.disconnect(); } catch (e) {}
        rec.conn = null;
    }
    if (rec.watchdogTimer) {
        clearInterval(rec.watchdogTimer);
        rec.watchdogTimer = null;
    }

    rec.state.username = username;
    rec.state.isConnecting = true;
    rec.state.watchdogActive = Boolean(autoWatchdog);
    rec.state.statusMessage = `⏳ جاري فحص حالة البث المباشر لحساب @${username}...`;
    io.emit('tarkibat_status_update', { uid: cleanUid, state: buildPublicLiveState(cleanUid) });

    const checkResult = await checkTikTokUserLiveStatus(username);
    rec.state.profile = checkResult.profile;
    rec.state.isLive = checkResult.isLive;
    rec.state.roomId = checkResult.roomId;
    rec.state.viewerCount = checkResult.viewerCount;
    rec.state.liveTitle = checkResult.liveTitle;
    rec.state.lastCheckedAt = checkResult.checkedAt;

    if (!checkResult.isLive) {
        rec.state.isConnecting = false;
        rec.state.isConnected = false;
        rec.state.statusMessage = autoWatchdog
            ? `🔴 الحساب @${username} غير فاتح لايف حالياً — المراقب التلقائي مفعل وسيتصل فور فتح اللايف!`
            : `🔴 الحساب @${username} غير فاتح لايف حالياً على تيك توك (Offline)`;

        if (autoWatchdog) {
            rec.watchdogTimer = setInterval(async () => {
                try {
                    const st = await checkTikTokUserLiveStatus(username);
                    rec.state.lastCheckedAt = st.checkedAt;
                    if (st.isLive && !rec.state.isConnected && !rec.state.isConnecting) {
                        clearInterval(rec.watchdogTimer);
                        rec.watchdogTimer = null;
                        await connectTarkibatToTikTokLive(cleanUid, username, true);
                    }
                } catch (e) {}
            }, 20000);
        }

        io.emit('tarkibat_status_update', { uid: cleanUid, state: buildPublicLiveState(cleanUid) });
        return {
            isLive: false,
            connected: false,
            state: buildPublicLiveState(cleanUid)
        };
    }

    // Streamer IS LIVE! Establish real-time WebSocket connection
    const liveConn = new TikTokLiveConnection(username, {
        processInitialData: true,
        fetchRoomInfoOnConnect: true,
        enableExtendedGiftInfo: true
    });
    rec.conn = liveConn;

    try {
        const connState = await liveConn.connect();
        rec.state.isConnecting = false;
        rec.state.isConnected = true;
        rec.state.isLive = true;
        rec.state.roomId = String(connState?.roomId || liveConn.roomId || checkResult.roomId || '');
        rec.state.statusMessage = `🟢 متصل الآن باللايف المباشر لحساب @${username} (Room: ${rec.state.roomId})`;

        pushLiveEventLog(cleanUid, {
            type: 'system',
            title: `🟢 تم الاتصال ببث @${username} المباشر بنجاح!`,
            subtitle: `رقم غرفة اللايف: ${rec.state.roomId}`
        });

        // 1. GIFT EVENT
        liveConn.on('gift', (data) => {
            try {
                const giftType = Number(data?.giftDetails?.giftType ?? data?.gift?.giftType ?? data?.giftType ?? 0);
                const repeatEnd = Boolean(data?.repeatEnd);
                // Wait for combo streak end on streakable gifts (giftType === 1) so we don't double-count
                if (giftType === 1 && !repeatEnd) return;

                const user = extractEventUser(data);
                const giftName =
                    data?.giftDetails?.giftName ||
                    data?.extendedGiftInfo?.name ||
                    data?.gift?.name ||
                    data?.giftName ||
                    data?.describe ||
                    'Gift';
                const repeatCount = Math.max(1, Number(data?.repeatCount || data?.comboCount || 1));
                const diamondCount = Math.max(1, Number(
                    data?.giftDetails?.diamondCount ||
                    data?.extendedGiftInfo?.diamond_count ||
                    data?.gift?.diamondCount ||
                    data?.diamondCount ||
                    1
                ));
                const giftImage =
                    data?.giftDetails?.giftImage?.url?.[0] ||
                    data?.extendedGiftInfo?.image?.url_list?.[0] ||
                    data?.gift?.icon?.urlList?.[0] ||
                    data?.giftPictureUrl ||
                    '/images/rose.png';

                rec.state.totalGiftsReceived += repeatCount;
                rec.state.totalDiamondsReceived += (diamondCount * repeatCount);

                const cfg = getTarkibatConfig(cleanUid);
                const matchedNames = [];
                (cfg.items || []).forEach(item => {
                    if (doesItemMatchGift(item, { giftName, giftImage, repeatCount, diamondCount })) {
                        const impact = executeTarkibaItemActions(cleanUid, item, {
                            ...user,
                            giftName,
                            giftImage,
                            repeatCount,
                            diamondCount
                        });
                        matchedNames.push(`${item.name}${impact ? ' (' + impact + ')' : ''}`);
                    }
                });

                pushLiveEventLog(cleanUid, {
                    type: 'gift',
                    username: user.username,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    giftName,
                    giftImage,
                    repeatCount,
                    diamondCount,
                    triggeredText: matchedNames.length > 0 ? `⚡ تفعيل: ${matchedNames.join(' + ')}` : 'بدون تركيبة مربوطة'
                });
            } catch (e) {}
        });

        // 2. FOLLOW EVENT
        liveConn.on('follow', (data) => {
            try {
                const user = extractEventUser(data);
                const cfg = getTarkibatConfig(cleanUid);
                const matchedNames = [];
                (cfg.items || []).forEach(item => {
                    if (item.enabled && item.triggerType === 'follow') {
                        const impact = executeTarkibaItemActions(cleanUid, item, {
                            ...user,
                            giftName: 'متابعة جديدة (Follow)',
                            giftImage: '/images/tiktok_follow.png',
                            repeatCount: 1
                        });
                        matchedNames.push(`${item.name}${impact ? ' (' + impact + ')' : ''}`);
                    }
                });
                pushLiveEventLog(cleanUid, {
                    type: 'follow',
                    username: user.username,
                    nickname: user.nickname,
                    avatar: user.avatar,
                    giftName: 'متابعة جديدة ➕',
                    giftImage: '/images/tiktok_follow.png',
                    repeatCount: 1,
                    triggeredText: matchedNames.length > 0 ? `⚡ تفعيل: ${matchedNames.join(' + ')}` : ''
                });
            } catch (e) {}
        });

        // 3. LIKE EVENT
        liveConn.on('like', (data) => {
            try {
                const user = extractEventUser(data);
                const likeCount = Math.max(1, Number(data?.likeCount || 15));
                rec.state.totalLikesReceived += likeCount;
                const cfg = getTarkibatConfig(cleanUid);
                (cfg.items || []).forEach(item => {
                    if (item.enabled && item.triggerType === 'like' && likeCount >= (parseInt(item.minRepeat, 10) || 1)) {
                        executeTarkibaItemActions(cleanUid, item, {
                            ...user,
                            giftName: `تكبيس (${likeCount} ❤️)`,
                            giftImage: '/images/tiktok_likes.png',
                            repeatCount: likeCount
                        });
                    }
                });
            } catch (e) {}
        });

        // 4. SHARE EVENT
        liveConn.on('share', (data) => {
            try {
                const user = extractEventUser(data);
                const cfg = getTarkibatConfig(cleanUid);
                (cfg.items || []).forEach(item => {
                    if (item.enabled && item.triggerType === 'share') {
                        executeTarkibaItemActions(cleanUid, item, {
                            ...user,
                            giftName: 'مشاركة البث 🔄',
                            giftImage: '/images/mezotik-logo.png',
                            repeatCount: 1
                        });
                    }
                });
            } catch (e) {}
        });

        // 5. CHAT EVENT
        liveConn.on('chat', (data) => {
            try {
                const user = extractEventUser(data);
                const comment = String(data?.comment || '').trim();
                if (!comment) return;
                const cfg = getTarkibatConfig(cleanUid);
                (cfg.items || []).forEach(item => {
                    if (item.enabled && item.triggerType === 'chat' && item.chatKeyword) {
                        if (comment.toLowerCase().includes(String(item.chatKeyword).trim().toLowerCase())) {
                            executeTarkibaItemActions(cleanUid, item, {
                                ...user,
                                giftName: `تعليق: ${comment}`,
                                giftImage: '/images/mezotik-logo.png',
                                repeatCount: 1
                            });
                        }
                    }
                });
            } catch (e) {}
        });

        // 6. ROOM VIEWER COUNT
        liveConn.on('roomUser', (data) => {
            if (data && data.viewerCount !== undefined) {
                rec.state.viewerCount = Number(data.viewerCount) || 0;
                io.emit('tarkibat_status_update', { uid: cleanUid, state: buildPublicLiveState(cleanUid) });
            }
        });

        // 7. STREAM END / DISCONNECT
        liveConn.on('streamEnd', () => {
            rec.state.isLive = false;
            rec.state.isConnected = false;
            rec.state.statusMessage = `🔴 انتهى البث المباشر لحساب @${username}`;
            io.emit('tarkibat_status_update', { uid: cleanUid, state: buildPublicLiveState(cleanUid) });
        });

        liveConn.on('disconnected', () => {
            rec.state.isConnected = false;
            rec.state.statusMessage = `⚠️ انقطع الاتصال باللايف لحساب @${username}`;
            io.emit('tarkibat_status_update', { uid: cleanUid, state: buildPublicLiveState(cleanUid) });
        });

        liveConn.on('error', () => {});

        io.emit('tarkibat_status_update', { uid: cleanUid, state: buildPublicLiveState(cleanUid) });
        return {
            isLive: true,
            connected: true,
            state: buildPublicLiveState(cleanUid)
        };
    } catch (err) {
        rec.state.isConnecting = false;
        rec.state.isConnected = false;
        rec.state.statusMessage = `⚠️ تعذر الاتصال بغرفة اللايف: ${err.message || 'الحساب غير فاتح لايف'}`;
        io.emit('tarkibat_status_update', { uid: cleanUid, state: buildPublicLiveState(cleanUid) });
        return {
            isLive: checkResult.isLive,
            connected: false,
            error: err.message,
            state: buildPublicLiveState(cleanUid)
        };
    }
}

// 1. Get Tarkibat Config & Live State
app.get('/api/tarkibat/:uid', (req, res) => {
    const uid = req.params.uid || 'default';
    ensureEncryptedBoardDataMigrated(uid);
    const config = getTarkibatConfig(uid);
    const liveState = buildPublicLiveState(uid);
    res.json({
        success: true,
        config,
        liveState
    });
});

// 2. Check if TikTok User is LIVE right now (using tiktok-live-connector fetchIsLive)
app.post('/api/tarkibat/:uid/check-live', async (req, res) => {
    const uid = req.params.uid || 'default';
    const rawUsername = req.body.username || getTarkibatConfig(uid).tiktokUsername || 'mezo_1st';
    try {
        const result = await checkTikTokUserLiveStatus(rawUsername);
        const rec = getLiveSessionRecord(uid);
        const cfg = getTarkibatConfig(uid);
        cfg.tiktokUsername = result.username;
        writeTarkibatData(tarkibatStore);

        rec.state.username = result.username;
        rec.state.isLive = result.isLive;
        rec.state.roomId = result.roomId;
        rec.state.viewerCount = result.viewerCount;
        rec.state.liveTitle = result.liveTitle;
        rec.state.profile = result.profile;
        rec.state.lastCheckedAt = result.checkedAt;
        rec.state.statusMessage = result.isLive
            ? `🟢 الحساب @${result.username} فاتح لايف الآن على تيك توك! (Room ID: ${result.roomId || 'نشط'})`
            : `🔴 الحساب @${result.username} قافل (غير فاتح لايف حالياً على تيك توك)`;

        io.emit('tarkibat_status_update', { uid, state: buildPublicLiveState(uid) });
        res.json({
            success: true,
            ...result,
            liveState: buildPublicLiveState(uid)
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message || 'فشل فحص حالة اللايف' });
    }
});

// 3. Connect to TikTok Live Stream (checks isLive first + connects WebSocket)
app.post('/api/tarkibat/:uid/connect', async (req, res) => {
    const uid = req.params.uid || 'default';
    const { username, autoWatchdog } = req.body;
    try {
        const outcome = await connectTarkibatToTikTokLive(uid, username, autoWatchdog);
        res.json({
            success: true,
            ...outcome
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message || 'تعذر الاتصال باللايف' });
    }
});

// 4. Disconnect from TikTok Live Stream
app.post('/api/tarkibat/:uid/disconnect', async (req, res) => {
    const uid = req.params.uid || 'default';
    const rec = getLiveSessionRecord(uid);
    if (rec.watchdogTimer) {
        clearInterval(rec.watchdogTimer);
        rec.watchdogTimer = null;
    }
    if (rec.conn) {
        try { await rec.conn.disconnect(); } catch (e) {}
        rec.conn = null;
    }
    rec.state.isConnected = false;
    rec.state.isConnecting = false;
    rec.state.watchdogActive = false;
    rec.state.statusMessage = '⚪ تم قطع الاتصال باللايف يدوياً';
    io.emit('tarkibat_status_update', { uid, state: buildPublicLiveState(uid) });
    res.json({ success: true, liveState: buildPublicLiveState(uid) });
});

// 5. Save Tarkibat Config (items & overlayStyle)
app.post('/api/tarkibat/:uid/save', (req, res) => {
    const uid = req.params.uid || 'default';
    const cfg = getTarkibatConfig(uid);
    if (req.body.tiktokUsername !== undefined) {
        cfg.tiktokUsername = normalizeTikTokUsername(req.body.tiktokUsername) || cfg.tiktokUsername;
    }
    if (req.body.overlayStyle) {
        cfg.overlayStyle = { ...cfg.overlayStyle, ...req.body.overlayStyle };
    }
    if (Array.isArray(req.body.items)) {
        cfg.items = req.body.items;
    }
    writeTarkibatData(tarkibatStore);
    io.emit('tarkibat_config_update', { uid, config: cfg });
    res.json({ success: true, config: cfg });
});

// 6. Load Ready-Made Tarkibat Preset
app.post('/api/tarkibat/:uid/preset', (req, res) => {
    const uid = req.params.uid || 'default';
    const presetKey = req.body.preset || 'helpers_vs_saboteurs';
    const presetItems = TARKIBAT_PRESETS[presetKey] || DEFAULT_TARKIBAT_ITEMS;
    const cfg = getTarkibatConfig(uid);
    cfg.items = JSON.parse(JSON.stringify(presetItems));
    writeTarkibatData(tarkibatStore);
    io.emit('tarkibat_config_update', { uid, config: cfg });
    res.json({ success: true, config: cfg });
});

// 7. Test / Simulate a Tarkiba Item Immediately (Works Online or Offline)
app.post('/api/tarkibat/:uid/test-trigger', (req, res) => {
    const uid = req.params.uid || 'default';
    const cfg = getTarkibatConfig(uid);
    const { itemId, customRepeat } = req.body;
    const item = (cfg.items || []).find(x => x.id === itemId) || (cfg.items || [])[0];
    if (!item) {
        return res.status(404).json({ success: false, error: 'لم يتم العثور على التركيبة' });
    }

    const repeatCount = Math.max(1, parseInt(customRepeat, 10) || 1);
    const rec = getLiveSessionRecord(uid);
    const donorProfile = rec.state.profile || {
        username: cfg.tiktokUsername || 'mezo_1st',
        nickname: 'MEZO 1ST (تجربة) 🔥',
        avatar: '/images/mezotik-logo.png'
    };

    const impact = executeTarkibaItemActions(uid, item, {
        username: donorProfile.username,
        nickname: donorProfile.nickname,
        avatar: donorProfile.avatar,
        giftName: item.giftName || 'هدية تجريبية',
        giftImage: item.giftImage || '/images/rose.png',
        repeatCount,
        diamondCount: item.giftCoins || 1
    });

    const evt = pushLiveEventLog(uid, {
        type: 'test',
        username: donorProfile.username,
        nickname: donorProfile.nickname,
        avatar: donorProfile.avatar,
        giftName: `${item.giftName} (تجربة 🧪)`,
        giftImage: item.giftImage || '/images/rose.png',
        repeatCount,
        diamondCount: item.giftCoins || 1,
        triggeredText: `⚡ تم تنفيذ: ${item.name}${impact ? ' (' + impact + ')' : ''}`
    });

    res.json({
        success: true,
        impact,
        event: evt
    });
});

// ================= SECTION: LUCKYSPIN OVERLAY & REAL-TIME RELAY ================= //
const luckyspinBoards = {};
const luckyspinSeenCtrlIds = new Set();

function getLuckySpinBoard(rawId) {
    let id = String(rawId || 'mz_6e60223656d3863d21bb918dc1dc').trim();
    if (!id || id === 'default') id = 'mz_6e60223656d3863d21bb918dc1dc';
    if (!luckyspinBoards[id]) {
        luckyspinBoards[id] = {
            id,
            settings: null,
            fullState: null,
            fastSync: null,
            controlLog: [],
            sseClients: new Set(),
            updatedAt: Date.now(),
            ttConn: null,
            ttStatus: 'disconnected',
            ttUsername: '',
            ttError: null
        };
    }
    return luckyspinBoards[id];
}

function broadcastLuckySpinSSE(board, payload) {
    if (!board || !board.sseClients || board.sseClients.size === 0) return;
    const msg = `data: ${JSON.stringify(payload)}\n\n`;
    for (const clientRes of board.sseClients) {
        try {
            clientRes.write(msg);
        } catch (e) {
            board.sseClients.delete(clientRes);
        }
    }
}

app.get(['/luckyspin-overlay.html', '/luckyspin-overlay'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'luckyspin-overlay.html'));
});

app.get('/api/luckyspin/:id/state', (req, res) => {
    const board = getLuckySpinBoard(req.params.id);
    const now = Date.now();
    board.controlLog = (board.controlLog || []).filter(c => c && (now - (c.ts || 0) < 15000));
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json({
        success: true,
        board_id: board.id,
        settings: board.settings,
        fullState: board.fullState,
        fastSync: board.fastSync,
        controlLog: board.controlLog,
        updatedAt: board.updatedAt
    });
});

app.get('/api/luckyspin/:id/events', (req, res) => {
    const board = getLuckySpinBoard(req.params.id);
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    if (board.ttStatus && board.ttStatus !== 'disconnected') {
        res.write(`data: ${JSON.stringify({
            type: 'TIKTOK_STATUS',
            data: { status: board.ttStatus, username: board.ttUsername, error: board.ttError }
        })}\n\n`);
    }
    if (board.settings) {
        res.write(`data: ${JSON.stringify({ type: 'LUCKYSPIN_GAME_SETTINGS', data: board.settings })}\n\n`);
    }
    if (board.fullState) {
        res.write(`data: ${JSON.stringify({ type: 'LUCKYSPIN_FULL_STATE', data: board.fullState })}\n\n`);
    }
    if (board.fastSync) {
        res.write(`data: ${JSON.stringify({ type: 'LUCKYSPIN_FAST_SYNC', data: board.fastSync })}\n\n`);
    }

    board.sseClients.add(res);
    req.on('close', () => {
        board.sseClients.delete(res);
    });
});

app.post('/api/luckyspin/:id/broadcast', (req, res) => {
    const board = getLuckySpinBoard(req.params.id);
    const body = req.body || {};
    const type = body.type;
    const data = body.data;

    if (!type) {
        return res.json({ ok: false, error: 'Missing type' });
    }

    if (type === 'LUCKYSPIN_GAME_CONTROL' && data) {
        const ctrlKey = data.ctrlId || `${board.id}_${data.action}_${data.ts || data.targetRotation || ''}`;
        if (ctrlKey && luckyspinSeenCtrlIds.has(ctrlKey)) {
            return res.json({ ok: true, deduplicated: true });
        }
        if (ctrlKey) {
            luckyspinSeenCtrlIds.add(ctrlKey);
            if (luckyspinSeenCtrlIds.size > 500) {
                const first = luckyspinSeenCtrlIds.values().next().value;
                luckyspinSeenCtrlIds.delete(first);
            }
        }
        const now = Date.now();
        board.controlLog.push({ ts: now, data });
        board.controlLog = board.controlLog.filter(c => now - c.ts < 15000).slice(-25);
    } else if (type === 'LUCKYSPIN_GAME_SETTINGS') {
        board.settings = data;
    } else if (type === 'LUCKYSPIN_FULL_STATE') {
        board.fullState = data;
    } else if (type === 'LUCKYSPIN_FAST_SYNC') {
        board.fastSync = data;
    } else if (type === 'LUCKYSPIN_SPIN_DATA') {
        broadcastLuckySpinSSE(board, { type: 'SPIN_DATA', data });
    }

    board.updatedAt = Date.now();
    broadcastLuckySpinSSE(board, { type, data });
    io.emit('luckyspin_update', { board_id: board.id, type, data });
    res.json({ ok: true });
});

app.post('/api/luckyspin/:id/connect', async (req, res) => {
    const board = getLuckySpinBoard(req.params.id);
    const cleanUser = normalizeTikTokUsername(req.body && req.body.username);
    if (!cleanUser) {
        return res.json({ ok: false, status: 'error', error: 'Username is required' });
    }
    if (board.ttConn) {
        try {
            board.ttConn.removeAllListeners();
            board.ttConn.disconnect();
        } catch (e) {}
        board.ttConn = null;
    }
    board.ttUsername = cleanUser;
    board.ttStatus = 'connecting';
    board.ttError = null;
    broadcastLuckySpinSSE(board, {
        type: 'TIKTOK_STATUS',
        data: { status: 'connecting', username: cleanUser, error: null }
    });

    const conn = new TikTokLiveConnection(cleanUser, {
        processInitialData: true,
        enableExtendedGiftInfo: false,
        fetchRoomInfoOnConnect: false,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 2000
    });
    board.ttConn = conn;

    conn.on('connected', (state) => {
        if (board.ttConn !== conn) return;
        board.ttStatus = 'connected';
        board.ttError = null;
        broadcastLuckySpinSSE(board, {
            type: 'TIKTOK_STATUS',
            data: { status: 'connected', username: cleanUser, error: null, isLive: true, roomId: state?.roomId || null }
        });
    });

    conn.on('disconnected', () => {
        if (board.ttConn !== conn) return;
        board.ttStatus = 'disconnected';
        broadcastLuckySpinSSE(board, {
            type: 'TIKTOK_STATUS',
            data: { status: 'disconnected', username: cleanUser, error: null }
        });
    });

    conn.on('streamEnd', () => {
        if (board.ttConn !== conn) return;
        board.ttStatus = 'offline';
        board.ttError = 'انتهى البث المباشر (Stream Ended)';
        broadcastLuckySpinSSE(board, {
            type: 'TIKTOK_STATUS',
            data: { status: 'offline', username: cleanUser, isLive: false, error: 'انتهى البث المباشر (Stream Ended)' }
        });
    });

    conn.on('error', () => {});

    conn.on('roomUser', (data) => {
        if (board.ttConn !== conn) return;
        broadcastLuckySpinSSE(board, {
            type: 'TIKTOK_VIEWERS',
            data: { count: Number(data?.viewerCount) || 0 }
        });
    });

    conn.on('gift', (data) => {
        if (board.ttConn !== conn) return;
        const u = extractEventUser(data);
        const giftType = data?.giftType !== undefined ? data.giftType : data?.giftDetails?.giftType;
        const repeatEnd = data?.repeatEnd !== undefined ? Boolean(data.repeatEnd) : Boolean(data?.repeatEnd);
        if (giftType === 1 && !repeatEnd) return;

        const repeatCount = Math.max(1, Number(data?.repeatCount) || 1);
        const unitDiamonds = Math.max(1, Number(data?.diamondCount || data?.giftDetails?.diamondCount || data?.gift?.diamondCount || 1));
        const totalCoins = Math.max(1, unitDiamonds * repeatCount);
        const giftId = data?.giftId || data?.gift?.giftId || 0;
        const giftName = data?.giftName || data?.giftDetails?.giftName || data?.describe || `Gift #${giftId}`;
        const giftPictureUrl =
            data?.giftPictureUrl ||
            data?.giftDetails?.giftImage?.url?.[0] ||
            data?.giftDetails?.giftImage?.urlList?.[0] ||
            data?.gift?.icon?.url?.[0] ||
            null;
        const eventId = `${data?.msgId || data?.common?.msgId || Date.now()}_${u.username}_${giftId}_${repeatCount}`;
        broadcastLuckySpinSSE(board, {
            type: 'SPIN_DATA',
            data: {
                eventId,
                coins: totalCoins,
                unitDiamonds,
                repeatCount,
                giftId,
                giftName,
                giftPictureUrl,
                userName: u.nickname,
                userId: u.username,
                usernameId: u.username,
                pictureProfil: u.avatar,
                timestamp: Date.now()
            }
        });
    });

    conn.on('like', (data) => {
        if (board.ttConn !== conn) return;
        const u = extractEventUser(data);
        const likes = Math.max(1, Number(data?.likeCount) || 1);
        broadcastLuckySpinSSE(board, {
            type: 'LIKE_DATA',
            data: {
                likes,
                roomLikes: likes,
                totalLikeCount: Number(data?.totalLikeCount) || 0,
                userName: u.nickname,
                userId: u.username,
                pictureProfil: u.avatar
            }
        });
    });

    const handleFollowShare = (data, defaultType) => {
        if (board.ttConn !== conn) return;
        const u = extractEventUser(data);
        const displayType = String(data?.displayType || data?.label || defaultType || '').toLowerCase();
        let evType = defaultType || 'follow';
        if (displayType.includes('share')) evType = 'share';
        else if (displayType.includes('follow')) evType = 'follow';
        broadcastLuckySpinSSE(board, {
            type: 'EVENT_DATA',
            data: {
                type: evType,
                nickname: u.nickname,
                uniqueId: u.username,
                userId: u.username,
                profilePictureUrl: u.avatar
            }
        });
    };

    conn.on('follow', (data) => handleFollowShare(data, 'follow'));
    conn.on('share', (data) => handleFollowShare(data, 'share'));
    conn.on('social', (data) => handleFollowShare(data, 'follow'));

    conn.on('chat', (data) => {
        if (board.ttConn !== conn) return;
        const u = extractEventUser(data);
        broadcastLuckySpinSSE(board, {
            type: 'CHAT_DATA',
            data: {
                comment: data?.comment || '',
                userId: u.username,
                nickname: u.nickname,
                profilePictureUrl: u.avatar
            }
        });
    });

    try {
        let isLive = true;
        if (typeof conn.fetchIsLive === 'function') {
            try {
                isLive = await conn.fetchIsLive();
            } catch (liveErr) {
                isLive = true;
            }
        }

        if (!isLive) {
            board.ttStatus = 'offline';
            board.ttError = `الحساب @${cleanUser} غير فاتح لايف حالياً (Offline)`;
            board.ttConn = null;
            broadcastLuckySpinSSE(board, {
                type: 'TIKTOK_STATUS',
                data: { status: 'offline', username: cleanUser, isLive: false, error: board.ttError }
            });
            return res.json({ ok: false, status: 'offline', isLive: false, username: cleanUser, error: board.ttError });
        }

        const state = await conn.connect();
        board.ttStatus = 'connected';
        board.ttError = null;
        broadcastLuckySpinSSE(board, {
            type: 'TIKTOK_STATUS',
            data: { status: 'connected', username: cleanUser, isLive: true, error: null, roomId: state?.roomId || null }
        });
        res.json({ ok: true, status: 'connected', isLive: true, username: cleanUser, roomId: state?.roomId || null });
    } catch (err) {
        const rawMsg = String(err?.message || err || 'Failed to connect');
        const isOfflineErr =
            rawMsg.toLowerCase().includes('offline') ||
            rawMsg.toLowerCase().includes('not live') ||
            rawMsg.toLowerCase().includes('live has ended') ||
            rawMsg.toLowerCase().includes('room_id');
        board.ttStatus = isOfflineErr ? 'offline' : 'error';
        board.ttError = isOfflineErr
            ? `الحساب @${cleanUser} غير فاتح لايف حالياً (Offline)`
            : rawMsg;
        broadcastLuckySpinSSE(board, {
            type: 'TIKTOK_STATUS',
            data: { status: board.ttStatus, username: cleanUser, isLive: false, error: board.ttError }
        });
        res.json({ ok: false, status: board.ttStatus, isLive: false, username: cleanUser, error: board.ttError });
    }
});

app.post('/api/luckyspin/:id/disconnect', (req, res) => {
    const board = getLuckySpinBoard(req.params.id);
    if (board.ttConn) {
        try {
            board.ttConn.removeAllListeners();
            board.ttConn.disconnect();
        } catch (e) {}
        board.ttConn = null;
    }
    board.ttStatus = 'disconnected';
    board.ttError = null;
    broadcastLuckySpinSSE(board, {
        type: 'TIKTOK_STATUS',
        data: { status: 'disconnected', username: board.ttUsername, error: null }
    });
    res.json({ ok: true, status: 'disconnected' });
});

app.get(['/luckyspin', '/spin', '/games/luckyspin', '/games/luckyspin/'], (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'games', 'luckyspin', 'index.html'));
});

// Socket.io Connection & Event Forwarding
io.on('connection', (socket) => {
    socket.emit('race_state_update', {
        title: raceState.title || 'صراع الحكام',
        activeJudge: getRaceActiveJudge(),
        leaderboard: getRaceLeaderboard(),
        settings: raceState.settings,
        history: (raceState.history || []).slice(0, 30)
    });
    socket.emit('state_update', {
        title: raceState.title || 'صراع الحكام',
        activeJudge: getRaceActiveJudge(),
        leaderboard: getRaceLeaderboard(),
        settings: raceState.settings,
        history: (raceState.history || []).slice(0, 30)
    });
    socket.emit('followers_state_update', buildFollowersPayload());
    socket.on('corner_trigger', (data) => {
        io.emit('corner_trigger', data);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 Storage Mode: ${isCloudinaryConfigured() ? 'Cloudinary (Cloud)' : (process.env.IMGBB_API_KEY ? 'ImgBB (Cloud)' : 'Local Disk')}`);
    startKeepAlive();
});

module.exports = { app, server, io };