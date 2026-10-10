const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'users-data.json');
const SCOREBOARDS_FILE = path.join(__dirname, 'scoreboard-data.json');

// Memory cache
let db = {
    users: {},
    sessions: {}
};

let scoreboards = {};

// Generate a long, cryptographically encrypted Board ID per user (31 chars: mz_ + 28 hex chars)
// Impossible for other users to guess or fabricate in overlay URLs
function generateEncryptedBoardId(username, customSalt = '') {
    const clean = String(username || 'user').trim().toLowerCase();
    const hmac = crypto.createHmac('sha256', 'MEZO_TIK_ENCRYPTED_BOARD_SECRET_2026_V2')
        .update(`mezotik_board:${clean}:${customSalt}`)
        .digest('hex')
        .slice(0, 28);
    return `mz_${hmac}`;
}

function isLegacyShortBoardId(boardId) {
    if (!boardId || typeof boardId !== 'string') return true;
    if (boardId === 'default' || boardId === 'board_XXXX' || boardId === 'board_1212') return true;
    if (!boardId.startsWith('mz_') || boardId.length < 24) return true;
    return false;
}

// Load database
function loadDatabase() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const raw = fs.readFileSync(DB_FILE, 'utf8');
            db = JSON.parse(raw);
        } else {
            saveDatabase();
        }
    } catch (e) {
        console.error('Error loading users-data.json:', e);
        db = { users: {}, sessions: {} };
    }

    if (!db.users) db.users = {};
    if (!db.sessions) db.sessions = {};

    // Ensure default user exists
    if (Object.keys(db.users).length === 0) {
        createDefaultUser();
    }

    // Load scoreboards
    try {
        if (fs.existsSync(SCOREBOARDS_FILE)) {
            scoreboards = JSON.parse(fs.readFileSync(SCOREBOARDS_FILE, 'utf8'));
        }
    } catch (e) {
        scoreboards = {};
    }

    // Upgrade any user with a short/predictable boardId to a long encrypted boardId
    let upgraded = false;
    for (const user of Object.values(db.users)) {
        if (isLegacyShortBoardId(user.boardId)) {
            const oldBoardId = user.boardId;
            const newEncryptedId = generateEncryptedBoardId(user.username);
            user.boardId = newEncryptedId;
            if (oldBoardId && scoreboards[oldBoardId] && !scoreboards[newEncryptedId]) {
                scoreboards[newEncryptedId] = {
                    ...scoreboards[oldBoardId],
                    board_id: newEncryptedId
                };
            }
            upgraded = true;
        }
    }
    if (upgraded) {
        saveDatabase();
        saveScoreboards();
    }
}

function saveDatabase() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving users-data.json:', e);
    }
}

function saveScoreboards() {
    try {
        fs.writeFileSync(SCOREBOARDS_FILE, JSON.stringify(scoreboards, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving scoreboard-data.json:', e);
    }
}

// Password hashing
function hashPassword(password, salt) {
    if (!salt) salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
    const { hash } = hashPassword(password, salt);
    return hash === expectedHash;
}

// Create default user (1212 / 1212) with long encrypted Board ID
function createDefaultUser() {
    const { salt, hash } = hashPassword('1212');
    const userId = 'user_1212_admin';
    const encryptedBoardId = generateEncryptedBoardId('1212');
    db.users[userId] = {
        id: userId,
        username: '1212',
        displayName: 'MEZO',
        salt,
        hash,
        boardId: encryptedBoardId,
        role: 'admin',
        createdAt: Date.now()
    };
    saveDatabase();
    console.log(`👑 Default user ready with encrypted board ID: ${encryptedBoardId}`);
}

// ================= USER CRUD ================= //
function registerUser(username, password, displayName = '') {
    const cleanUser = String(username || '').trim().toLowerCase();
    if (!cleanUser || cleanUser.length < 2) {
        throw new Error('اسم المستخدم يجب أن يكون حرفين على الأقل');
    }
    if (!password || password.length < 3) {
        throw new Error('كلمة المرور يجب أن تكون 3 أحرف على الأقل');
    }

    // Check duplicate
    for (const u of Object.values(db.users)) {
        if (u.username.toLowerCase() === cleanUser) {
            throw new Error('اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر أو تسجيل الدخول');
        }
    }

    const userId = 'usr_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    const { salt, hash } = hashPassword(password);
    // Long 31-character encrypted board ID unique to this user
    const boardId = generateEncryptedBoardId(cleanUser, crypto.randomBytes(8).toString('hex'));

    const newUser = {
        id: userId,
        username: cleanUser,
        displayName: displayName.trim() || cleanUser,
        salt,
        hash,
        boardId,
        role: 'user',
        createdAt: Date.now()
    };

    db.users[userId] = newUser;
    saveDatabase();

    // Create session
    const token = createSession(userId);
    return { user: sanitizeUser(newUser), token };
}

function loginUser(username, password) {
    const cleanUser = String(username || '').trim().toLowerCase();
    let foundUser = null;

    for (const u of Object.values(db.users)) {
        if (u.username.toLowerCase() === cleanUser) {
            foundUser = u;
            break;
        }
    }

    if (!foundUser) {
        throw new Error('اسم المستخدم غير مسجل');
    }

    const isValid = verifyPassword(password, foundUser.salt, foundUser.hash);
    if (!isValid) {
        throw new Error('كلمة المرور غير صحيحة');
    }

    // Ensure user has an encrypted long boardId
    if (isLegacyShortBoardId(foundUser.boardId)) {
        foundUser.boardId = generateEncryptedBoardId(foundUser.username);
        saveDatabase();
    }

    const token = createSession(foundUser.id);
    return { user: sanitizeUser(foundUser), token };
}

function regenerateUserBoardId(token) {
    if (!token || !db.sessions[token]) {
        throw new Error('يرجى تسجيل الدخول أولاً');
    }
    const session = db.sessions[token];
    const user = db.users[session.userId];
    if (!user) {
        throw new Error('المستخدم غير موجود');
    }

    const oldBoardId = user.boardId;
    const newBoardId = generateEncryptedBoardId(user.username, crypto.randomBytes(16).toString('hex'));
    user.boardId = newBoardId;

    if (oldBoardId && scoreboards[oldBoardId]) {
        scoreboards[newBoardId] = {
            ...scoreboards[oldBoardId],
            board_id: newBoardId,
            updated_at: Date.now()
        };
        saveScoreboards();
    }

    saveDatabase();
    return { oldBoardId, newBoardId, user: sanitizeUser(user) };
}

function createSession(userId) {
    const token = 'tok_' + crypto.randomBytes(24).toString('hex');
    // 30 days expiration
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    db.sessions[token] = {
        userId,
        expiresAt,
        createdAt: Date.now()
    };
    saveDatabase();
    return token;
}

function getUserByToken(token) {
    if (!token || !db.sessions[token]) return null;
    const session = db.sessions[token];
    if (Date.now() > session.expiresAt) {
        delete db.sessions[token];
        saveDatabase();
        return null;
    }
    const user = db.users[session.userId];
    if (user && isLegacyShortBoardId(user.boardId)) {
        user.boardId = generateEncryptedBoardId(user.username);
        saveDatabase();
    }
    return user ? sanitizeUser(user) : null;
}

function destroySession(token) {
    if (token && db.sessions[token]) {
        delete db.sessions[token];
        saveDatabase();
    }
}

function sanitizeUser(user) {
    if (!user) return null;
    const { salt, hash, ...clean } = user;
    return clean;
}

// ================= SCOREBOARD CRUD ================= //
function getScoreboard(boardId = 'default') {
    if (!scoreboards[boardId]) {
        scoreboards[boardId] = {
            board_id: boardId,
            title: '🏆 تحدي الأساطير 🏆',
            team_a_name: 'المخربين',
            team_b_name: 'المساعدين',
            team_a_score: 0,
            team_b_score: 0,
            team_a_color: '#ff2a4a',
            team_b_color: '#22ff88',
            updated_at: Date.now()
        };
        saveScoreboards();
    }
    if (!scoreboards[boardId].team_a_color) scoreboards[boardId].team_a_color = '#ff2a4a';
    if (!scoreboards[boardId].team_b_color) scoreboards[boardId].team_b_color = '#22ff88';
    return scoreboards[boardId];
}

function updateScoreboard(boardId, updates) {
    const sb = getScoreboard(boardId);
    if (updates.title !== undefined) sb.title = String(updates.title).trim();
    if (updates.team_a_name !== undefined) sb.team_a_name = String(updates.team_a_name).trim();
    if (updates.team_b_name !== undefined) sb.team_b_name = String(updates.team_b_name).trim();
    if (updates.team_a_score !== undefined) sb.team_a_score = Math.max(0, parseInt(updates.team_a_score) || 0);
    if (updates.team_b_score !== undefined) sb.team_b_score = Math.max(0, parseInt(updates.team_b_score) || 0);
    if (updates.team_a_color !== undefined) sb.team_a_color = String(updates.team_a_color).trim();
    if (updates.team_b_color !== undefined) sb.team_b_color = String(updates.team_b_color).trim();
    sb.updated_at = Date.now();
    saveScoreboards();
    return sb;
}

function adjustScore(boardId, team, delta, directScore) {
    const sb = getScoreboard(boardId);
    if (directScore !== undefined && directScore !== null) {
        const val = Math.max(0, parseInt(directScore) || 0);
        if (team === 'a') sb.team_a_score = val;
        else if (team === 'b') sb.team_b_score = val;
    } else {
        const num = parseInt(delta) || 0;
        if (team === 'a') {
            sb.team_a_score = Math.max(0, (sb.team_a_score || 0) + num);
        } else if (team === 'b') {
            sb.team_b_score = Math.max(0, (sb.team_b_score || 0) + num);
        }
    }
    sb.updated_at = Date.now();
    saveScoreboards();
    return sb;
}

function resetScoreboard(boardId) {
    const sb = getScoreboard(boardId);
    sb.team_a_score = 0;
    sb.team_b_score = 0;
    sb.updated_at = Date.now();
    saveScoreboards();
    return sb;
}

// Initialize on require
loadDatabase();

module.exports = {
    registerUser,
    loginUser,
    getUserByToken,
    destroySession,
    regenerateUserBoardId,
    generateEncryptedBoardId,
    getScoreboard,
    updateScoreboard,
    adjustScore,
    resetScoreboard
};
