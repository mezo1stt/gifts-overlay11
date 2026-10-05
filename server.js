require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const app = express();
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
        gifts: []
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

// Overlay Widget
app.get('/fire-widget.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

app.get('/overlay', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'overlay.html'));
});

// Last Supporter Widget (صفحة آخر داعم مع تأثيرات النار والأنترو والأوترو)
app.get('/last-supporter.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'last-supporter.html'));
});

app.get('/last-supporter', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'last-supporter.html'));
});

app.get('/supporter', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'last-supporter.html'));
});

// Proxy for TikAlert (لتجاوز قيود X-Frame-Options وحل الروابط النسبية)
app.get('/api/last-supporter', async (req, res) => {
    const username = req.query.username || 'mezo';

    try {
        const response = await fetch(
            `https://tikalert-eg.com/last-supporter/widget?username=${encodeURIComponent(username)}`,
            {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                }
            }
        );

        let html = await response.text();

        // حقن رابط Base لتصحيح كافة مسارات ملفات الـ JS والـ CSS من TikAlert
        if (html.includes('<head>')) {
            html = html.replace('<head>', '<head><base href="https://tikalert-eg.com/">');
        } else if (html.includes('<HEAD>')) {
            html = html.replace('<HEAD>', '<HEAD><base href="https://tikalert-eg.com/">');
        }

        // إزالة سياسة الأمان الصارمة للسماح بتشغيل الـ iframe
        html = html.replace(/<meta\s+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');

        res.removeHeader('X-Frame-Options');
        res.removeHeader('Content-Security-Policy');
        res.set('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    } catch (err) {
        console.error('Proxy error for last-supporter:', err);
        res.status(500).send('Error loading widget: ' + err.message);
    }
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
    const board = data[uid] || getDefaultBoard(uid);
    res.json(board);
});

// Update Board Settings (Positions, Offsets, Color, Scale, etc.)
app.put('/api/board/:uid/settings', (req, res) => {
    const uid = req.params.uid;
    const settings = req.body;
    const data = readData();
    if (!data[uid]) data[uid] = getDefaultBoard(uid);

    data[uid] = {
        ...data[uid],
        ...settings,
        gifts: data[uid].gifts || [] // preserve gifts
    };

    writeData(data);
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
    res.json({ success: true, color });
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

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📡 Storage Mode: ${isCloudinaryConfigured() ? 'Cloudinary (Cloud)' : (process.env.IMGBB_API_KEY ? 'ImgBB (Cloud)' : 'Local Disk')}`);
    startKeepAlive();
});