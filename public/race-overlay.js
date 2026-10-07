const socket = io();

// ================= DOM Elements ================= //
const top1Card = document.getElementById('top1Card');
const top1Avatar = document.getElementById('top1Avatar');
const top1Name = document.getElementById('top1Name');
const top1Handle = document.getElementById('top1Handle');
const top1Role = document.getElementById('top1Role');
const top1Wins = document.getElementById('top1Wins');
const top1FloatTag = document.getElementById('top1FloatTag');
const towerList = document.getElementById('towerList');
const towerTitle = document.getElementById('towerTitle');

let currentLeaderId = null;
let previousWinsMap = {};

// ================= Web Audio Fanfare Chime ================= //
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

window.addEventListener('click', () => getAudioContext());
window.addEventListener('keydown', () => getAudioContext());

function playFanfareSound() {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Upbeat victory chime (C5 -> E5 -> G5 -> C6)
        const notes = [
            { f: 523.25, t: 0.00, d: 0.16 },
            { f: 659.25, t: 0.12, d: 0.16 },
            { f: 783.99, t: 0.24, d: 0.22 },
            { f: 1046.50, t: 0.40, d: 0.55 }
        ];

        notes.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, ctx.currentTime + note.t);

            gain.gain.setValueAtTime(0, ctx.currentTime + note.t);
            gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + note.t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.t + note.d);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(ctx.currentTime + note.t);
            osc.stop(ctx.currentTime + note.t + note.d + 0.05);
        });
    } catch (e) {}
}

// ================= Socket Events ================= //
socket.on('race_state_update', data => {
    updateOverlayHUD(data);
});
socket.on('state_update', data => {
    if (data && data.leaderboard) {
        updateOverlayHUD(data);
    }
});

socket.on('race_win_celebration', data => {
    triggerWinAnimation(data);
});
socket.on('win_celebration', data => {
    triggerWinAnimation(data);
});

// ================= Update Overlay HUD ================= //
function updateOverlayHUD(data) {
    if (!data) return;
    if (data.title && towerTitle) {
        towerTitle.textContent = data.title;
    }

    const leaderboard = data.leaderboard || [];

    // 1. Top 1 Leader Card (صاحب أعلى عدد وينات - صورته كبيرة دائماً)
    if (leaderboard.length > 0) {
        const leader = leaderboard[0];
        currentLeaderId = leader.id;

        top1Avatar.src = leader.avatar || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(leader.username));
        top1Name.textContent = leader.nickname || leader.username;
        top1Handle.textContent = `@${leader.username}`;
        top1Role.textContent = leader.role || 'المتصدر الأول 👑';

        const prevWins = previousWinsMap[leader.id];
        if (prevWins !== undefined && leader.wins > prevWins) {
            // Wins bumped on update
            animateTop1Wins(leader.wins - prevWins);
        }
        top1Wins.textContent = leader.wins || 0;
    } else {
        currentLeaderId = null;
        top1Avatar.src = 'https://api.dicebear.com/7.x/bottts/svg?seed=waiting';
        top1Name.textContent = 'في انتظار الحكام...';
        top1Handle.textContent = '@username';
        top1Role.textContent = 'المتصدر الأول 👑';
        top1Wins.textContent = '0';
    }

    // 2. The Leaderboard List (Top 3 only: #2 and #3)
    const others = leaderboard.slice(1, 3);
    renderTowerList(others);

    // Save previous wins map
    leaderboard.forEach(item => {
        previousWinsMap[item.id] = item.wins || 0;
    });
}

function renderTowerList(others) {
    towerList.innerHTML = '';

    if (!others || others.length === 0) {
        return;
    }

    others.forEach((item, index) => {
        const rank = index + 2;
        const rankClass = rank === 2 ? 'rank-2' : 'rank-3';
        const rankBadge = rank === 2 ? '🥈' : '🥉';
        const row = document.createElement('div');
        row.className = `tower-item ${rankClass}`;
        row.id = `tower-item-${item.id}`;

        const avatarUrl = item.avatar || ('https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(item.username));

        row.innerHTML = `
            <div class="tower-rank-wrapper">
                <span class="tower-rank-badge">${rankBadge}</span>
                <span class="tower-rank-num">#${rank}</span>
            </div>
            <div class="tower-avatar-wrapper">
                <img class="tower-avatar" src="${avatarUrl}" alt="${escapeHtml(item.nickname)}" onerror="this.src='https://api.dicebear.com/7.x/bottts/svg?seed=${item.username}'">
            </div>
            <div class="tower-info">
                <div class="tower-name">${escapeHtml(item.nickname)}</div>
                <div class="tower-handle">@${escapeHtml(item.username)}</div>
            </div>
            <div class="tower-wins-badge">
                <span class="tower-float-win" id="tower-float-${item.id}">+1 🏆</span>
                <span class="tower-trophy-ico">🏆</span>
                <span class="win-digit" id="tower-wins-${item.id}">${item.wins || 0}</span>
            </div>
        `;
        towerList.appendChild(row);
    });
}

// ================= Trigger Win Animation ================= //
function triggerWinAnimation(data) {
    if (!data) return;
    playFanfareSound();

    const addedWins = data.addedWins || 1;

    // Check if the winner is currently in the Top 1 Spotlight
    if (data.id === currentLeaderId) {
        animateTop1Wins(addedWins);
    } else {
        // Winner is in the tower list below
        animateTowerRow(data.id, addedWins);
    }
}

function animateTop1Wins(addedCount) {
    if (!top1FloatTag || !top1Wins || !top1Card) return;
    // 1. Floating Win Tag (+1 WIN 🏆)
    top1FloatTag.textContent = `+${addedCount} WIN 🏆`;
    top1FloatTag.classList.remove('animate');
    void top1FloatTag.offsetWidth; // Force reflow
    top1FloatTag.classList.add('animate');

    // 2. Bump the big wins digits
    top1Wins.classList.remove('bump');
    void top1Wins.offsetWidth;
    top1Wins.classList.add('bump');
    setTimeout(() => top1Wins.classList.remove('bump'), 400);

    // 3. Golden Aura Flash on Top 1 Card
    top1Card.classList.remove('win-flash');
    void top1Card.offsetWidth;
    top1Card.classList.add('win-flash');
    setTimeout(() => top1Card.classList.remove('win-flash'), 1600);
}

function animateTowerRow(id, addedCount) {
    const row = document.getElementById(`tower-item-${id}`);
    if (row) {
        // Golden Flash on Row
        row.classList.remove('win-flash');
        void row.offsetWidth;
        row.classList.add('win-flash');
        setTimeout(() => row.classList.remove('win-flash'), 1600);

        // Floating Tag
        const floatTag = document.getElementById(`tower-float-${id}`);
        if (floatTag) {
            floatTag.textContent = `+${addedCount} 🏆`;
            floatTag.classList.remove('animate');
            void floatTag.offsetWidth;
            floatTag.classList.add('animate');
        }

        // Bump digits
        const digit = document.getElementById(`tower-wins-${id}`);
        if (digit) {
            digit.classList.remove('bump');
            void digit.offsetWidth;
            digit.classList.add('bump');
            setTimeout(() => digit.classList.remove('bump'), 300);
        }
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Initial fetch & polling fallback
function fetchRaceState() {
    fetch('/api/race/state')
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                updateOverlayHUD(data);
            }
        })
        .catch(() => {});
}

fetchRaceState();
setInterval(fetchRaceState, 3000);
