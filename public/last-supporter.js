// ================= URL Parameters ================= //
const params = new URLSearchParams(window.location.search);
const username = params.get('username') || 'mezo';
const theme = params.get('theme') || 'fire';
const introType = params.get('intro') || 'burst';
const outroType = params.get('outro') || 'burn';
const customTitle = params.get('title') || 'آخر داعم للبث';
const isLoop = params.get('loop') === 'true';
const isTestMode = params.get('test') === 'true';

// Elements
const frame = document.getElementById('supporterFrame');
const iframe = document.getElementById('supporterIframe');
const fallbackCard = document.getElementById('fallbackCard');
const shockwave = document.getElementById('shockwave');
const badgeText = document.getElementById('badgeText');
const testBar = document.getElementById('testBar');

// Apply Initial Config
badgeText.textContent = customTitle;
frame.className = `supporter-frame theme-${theme}`;

if (isTestMode) {
    testBar.classList.add('show');
}

// Set Iframe Source to our Server Proxy
iframe.src = `/api/last-supporter?username=${encodeURIComponent(username)}`;

iframe.onerror = () => {
    iframe.style.display = 'none';
    fallbackCard.classList.remove('hidden');
};

// ================= Web Audio API Fire Synth Sound ================= //
function playFireWhoosh() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // White noise buffer for fire roar
        const bufferSize = ctx.sampleRate * 0.6;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter for fiery whoosh
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
        filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.6);

        // Gain envelope
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
        noise.stop(ctx.currentTime + 0.6);
    } catch (e) {
        // Audio might be blocked before user gesture in plain browser, fine in OBS
    }
}

// ================= Intro Trigger ================= //
function triggerIntro(type = introType) {
    playFireWhoosh();

    // Trigger Shockwave
    shockwave.classList.remove('active');
    void shockwave.offsetWidth;
    shockwave.classList.add('active');

    // Burst Embers
    burstEmbers(40);

    // Apply Intro Class
    frame.classList.remove('intro-burst', 'intro-slide', 'intro-burn', 'outro-burn', 'outro-slide');
    void frame.offsetWidth;
    frame.classList.add(`intro-${type}`);
}

// ================= Outro Trigger ================= //
function triggerOutro(type = outroType, callback) {
    frame.classList.remove('intro-burst', 'intro-slide', 'intro-burn', 'outro-burn', 'outro-slide');
    void frame.offsetWidth;
    frame.classList.add(`outro-${type}`);

    burstEmbers(25);

    setTimeout(() => {
        if (callback) callback();
    }, 750);
}

// ================= Theme Switcher ================= //
const themes = ['fire', 'gold', 'neon', 'galaxy'];
let currentThemeIdx = themes.indexOf(theme) !== -1 ? themes.indexOf(theme) : 0;

function toggleTheme() {
    currentThemeIdx = (currentThemeIdx + 1) % themes.length;
    const newTheme = themes[currentThemeIdx];
    frame.classList.remove('theme-fire', 'theme-gold', 'theme-neon', 'theme-galaxy');
    frame.classList.add(`theme-${newTheme}`);
    triggerIntro();
}

// ================= Simulate New Supporter ================= //
const demoSupporters = [
    { name: 'سلطان الداعمين 💎', gift: 'أسد التيك توك 🦁', coins: '29,999', avatar: '/images/rose.png' },
    { name: 'البرنس المصري 👑', gift: 'مكوك فضائي 🚀', coins: '15,000', avatar: '/images/donut.png' },
    { name: 'صقر المملكة 🦅', gift: 'نيزك مشتعل ☄️', coins: '10,000', avatar: '/images/heart.png' },
    { name: 'تيربو جيمنج ⚡', gift: 'درع حماية أسطوري 🛡️', coins: '5,000', avatar: '/images/perfume.png' }
];

let demoIdx = 0;
function simulateNewSupporter() {
    triggerOutro('burn', () => {
        iframe.style.display = 'none';
        fallbackCard.classList.remove('hidden');

        demoIdx = (demoIdx + 1) % demoSupporters.length;
        const sup = demoSupporters[demoIdx];

        document.getElementById('supporterName').textContent = sup.name;
        document.getElementById('supporterGift').innerHTML = `أرسل: <strong>${sup.gift}</strong>`;
        document.getElementById('supporterCoins').innerHTML = `<span>💎 ${sup.coins}</span>`;
        document.getElementById('supporterAvatar').src = sup.avatar;

        triggerIntro('burst');
    });
}

// ================= Realistic Canvas Fire Particle System ================= //
const canvas = document.getElementById('fireCanvas');
const ctx = canvas.getContext('2d');

let width, height;
function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const particles = [];
const PARTICLE_COUNT = 55;

class FireParticle {
    constructor(x, y, isBurst = false) {
        this.reset(x, y, isBurst);
    }

    reset(x, y, isBurst = false) {
        const rect = frame.getBoundingClientRect();
        this.x = x !== undefined ? x : rect.left + Math.random() * rect.width;
        this.y = y !== undefined ? y : rect.bottom - Math.random() * 15;

        if (isBurst) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 7;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed - 2;
            this.life = 0.8 + Math.random() * 0.6;
        } else {
            this.vx = (Math.random() - 0.5) * 1.5;
            this.vy = -(1.2 + Math.random() * 2.5);
            this.life = 1;
        }

        this.maxLife = this.life;
        this.decay = 0.012 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 4.5;
        this.color = this.getRandomColor();
    }

    getRandomColor() {
        // Theme-based spark colors
        if (frame.classList.contains('theme-neon')) {
            const colors = ['#a855f7', '#06b6d4', '#ec4899', '#ffffff'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else if (frame.classList.contains('theme-gold')) {
            const colors = ['#ffd700', '#f59e0b', '#ffffff', '#fbbf24'];
            return colors[Math.floor(Math.random() * colors.length)];
        } else {
            // Fire colors: Red, Orange, Gold, Yellow
            const colors = ['#ff4500', '#ff8c00', '#ffd700', '#ff0000', '#fff'];
            return colors[Math.floor(Math.random() * colors.length)];
        }
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.size = Math.max(0.5, this.size * 0.98);

        if (this.life <= 0) {
            this.reset();
        }
    }

    draw() {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Initialize continuous particles
for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new FireParticle());
}

function burstEmbers(count = 30) {
    const rect = frame.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < count; i++) {
        particles.push(new FireParticle(cx, cy, true));
    }
}

function animateFire() {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();

        // Remove extra burst particles when dead
        if (p.life <= 0 && particles.length > PARTICLE_COUNT) {
            particles.splice(i, 1);
        }
    }

    requestAnimationFrame(animateFire);
}

animateFire();

// ================= Trigger Initial Intro on Page Load ================= //
setTimeout(() => {
    triggerIntro();
}, 200);

// Optional Periodic Loop (e.g. re-intro every 40s)
if (isLoop) {
    setInterval(() => {
        triggerOutro('burn', () => {
            setTimeout(() => {
                triggerIntro('burst');
            }, 500);
        });
    }, 35000);
}
