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
app.use(express.static(path.join(__dirname, 'public')));

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
        fontFamily: 'impact', // 'impact', 'pixel', 'cyber', 'cairo', 'tajawal'
        giftPosition: 'top-right', // 'top-right', 'top-left', 'center', 'bottom-right', 'bottom-left', 'beside', 'none'
        disappearMode: 'gift_only', // 'gift_only' or 'card_and_gift'
        offsetY: 0,
        scale: 100,
        teamRed: {
            title: 'الفريق الأحمر',
            color: '#ff2a4a',
            cards: [
                { id: 1, cardType: 'skeleton_bandana', count: 1, giftName: 'تيربو', giftImage: '/images/rose.png' },
                { id: 2, cardType: 'skeleton_cap', count: 2, giftName: 'بوابه', giftImage: '/images/donut.png' },
                { id: 3, cardType: 'golem_pumpkin', count: 1, giftName: 'نيزك', giftImage: '/images/1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
                { id: 4, cardType: 'hog_rider', count: 3, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                { id: 5, cardType: 'evoker_mage', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' }
            ]
        },
        teamBlue: {
            title: 'الفريق الأزرق',
            color: '#00b4d8',
            cards: [
                { id: 101, cardType: 'evoker_mage', count: 1, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                { id: 102, cardType: 'hog_rider', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
                { id: 103, cardType: 'skeleton_bandana', count: 2, giftName: 'مكوك فضائي', giftImage: '/images/1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' },
                { id: 104, cardType: 'golem_pumpkin', count: 1, giftName: 'حمايه', giftImage: '/images/1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
                { id: 105, cardType: 'skeleton_cap', count: 3, giftName: 'بوابه', giftImage: '/images/donut.png' }
            ]
        }
    };
}

function getDefaultCards4Board(uid = 'default') {
    return {
        neonEnabled: true,
        glowIntensity: 18,
        fontFamily: 'impact', // 'impact', 'pixel', 'cyber', 'cairo', 'tajawal'
        giftPosition: 'top-right', // 'top-right', 'top-left', 'center', 'bottom-right', 'bottom-left', 'beside', 'none'
        disappearMode: 'gift_only', // 'gift_only' or 'card_and_gift'
        offsetY: 0,
        scale: 100,
        teamRed: {
            title: 'الفريق الأحمر',
            color: '#ff2a4a',
            cards: [
                { id: 1, cardType: 'skeleton_bandana', customText: 'X1', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
                { id: 2, cardType: 'skeleton_cap', customText: 'X2', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
                { id: 3, cardType: 'golem_pumpkin', customText: 'X1', count: 1, giftName: 'حوت', giftImage: '/images/whale.png' },
                { id: 4, cardType: 'hog_rider', customText: 'X3', count: 3, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                { id: 5, cardType: 'evoker_mage', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' }
            ]
        },
        teamBlue: {
            title: 'الفريق الأزرق',
            color: '#00b4d8',
            cards: [
                { id: 101, cardType: 'evoker_mage', customText: 'X1', count: 1, giftName: 'صاروخ', giftImage: '/images/perfume.png' },
                { id: 102, cardType: 'hog_rider', customText: 'X1', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
                { id: 103, cardType: 'skeleton_bandana', customText: 'X2', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
                { id: 104, cardType: 'golem_pumpkin', customText: 'X1', count: 1, giftName: 'حمايه', giftImage: '/images/1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
                { id: 105, cardType: 'skeleton_cap', customText: 'X3', count: 3, giftName: 'وردة', giftImage: '/images/rose.png' }
            ]
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
    res.json({ success: true, user });
});

// ================= SCOREBOARD ROUTES ================= //
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
    const { team, delta, score } = req.body;
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
    const teamGifts = board.teamGifts || getDefaultTeamGifts();
    res.json({ success: true, teamGifts });
});

app.post('/api/team-gifts/:uid', (req, res) => {
    const uid = req.params.uid;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    const payload = (req.body && req.body.teamGifts) ? req.body.teamGifts : req.body;
    data[uid].teamGifts = {
        ...(data[uid].teamGifts || getDefaultTeamGifts()),
        ...payload
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

// 1. TikTok User Info Fetcher
function fetchTikTokUser(username) {
    return new Promise((resolve) => {
        const cleanUser = username.trim().replace(/^@/, '');
        const url = `https://www.tiktok.com/@${cleanUser}`;

        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        }, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                let nickname = cleanUser;
                let avatar = '';

                const sgiMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
                if (sgiMatch && sgiMatch[1]) {
                    try {
                        const parsed = JSON.parse(sgiMatch[1]);
                        const userDetail = parsed['__DEFAULT_SCOPE__']?.['webapp.user-detail']?.userInfo?.user;
                        if (userDetail) {
                            nickname = userDetail.nickname || userDetail.uniqueId || cleanUser;
                            avatar = userDetail.avatarLarger || userDetail.avatarMedium || userDetail.avatarThumb || '';
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

                if (!avatar) {
                    avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`;
                }

                resolve({
                    platform: 'tiktok',
                    username: cleanUser,
                    nickname,
                    avatar
                });
            });
        }).on('error', () => {
            resolve({
                platform: 'tiktok',
                username: cleanUser,
                nickname: cleanUser,
                avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`
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
    socket.on('corner_trigger', (data) => {
        io.emit('corner_trigger', data);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 Storage Mode: ${isCloudinaryConfigured() ? 'Cloudinary (Cloud)' : (process.env.IMGBB_API_KEY ? 'ImgBB (Cloud)' : 'Local Disk')}`);
    startKeepAlive();
});