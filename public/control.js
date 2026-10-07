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

// 11 Permanent TikTok Gifts from New folder (6) with their exact names
const POPULAR_GIFTS = [
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
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get Board UID from URL or fallback
    const urlParams = new URLSearchParams(window.location.search);
    const paramUid = urlParams.get('uid') || urlParams.get('id');
    if (paramUid) {
        currentUid = paramUid;
    } else {
        const saved = localStorage.getItem('last_board_uid');
        if (saved) currentUid = saved;
    }

    const uidInput = document.getElementById('uidInput');
    if (uidInput) uidInput.value = currentUid;

    // 2. Setup Sidebar Navigation
    setupSidebarNav();

    // 3. Check User Authentication (Shows welcome screen if not logged in)
    await checkAuth();

    // 4. Load Data for All Sections
    loadGiftsData();
    loadTeamGiftsData();
    loadFireData();
    loadCameraData();
    loadScoreboardData();

    // 5. Populate Library
    populateGiftsLibrary();

    // 6. Setup Socket.IO
    setupSocket();

    // 7. Setup Event Listeners
    setupEventListeners();
});

// ================= SIDEBAR NAVIGATION ================= //
function setupSidebarNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const titles = {
        giftsSection: '🎁 هدايا التيك توك 1 · لوحة التحكم التفاعلية',
        teamGiftsSection: '⚔️ هدايا تيك توك 2 · أوفرلاي الفرق المتنافسة (ممنوع تكرار الصور)',
        fireSection: '🔥 رابط آخر داعم (الشريط الناري) · إعدادات البث',
        cameraSection: '📷 بنرات الكاميرا · 10 أنماط إطارات نيون للبث',
        scoreboardSection: '⚡ لوحة النتائج (Scoreboard) · نقاط الفرق والتحديات والتراجر',
        accountSection: '👤 إدارة الحساب والمستخدمين · قاعدة البيانات'
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.dataset.tab;
            if (!targetTab) return;

            // Switch active classes
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));
            const activeSec = document.getElementById(targetTab);
            if (activeSec) activeSec.classList.add('active');

            currentTab = targetTab;
            const titleEl = document.getElementById('activePageTitle');
            if (titleEl && titles[targetTab]) titleEl.textContent = titles[targetTab];
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

            // Switch to user's assigned board if not explicitly set in query
            if (!new URLSearchParams(window.location.search).get('uid') && currentUser.boardId) {
                currentUid = currentUser.boardId;
                const uidInput = document.getElementById('uidInput');
                if (uidInput) uidInput.value = currentUid;
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
    if (pillName) pillName.textContent = 'زائر (تجريبي)';
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
            loadGiftsData();
            loadTeamGiftsData();
            showToast(`👋 مرحباً بك يا ${data.user.displayName || data.user.username}! تم تسجيل الدخول بنجاح.`, 'success');
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
            loadGiftsData();
            loadTeamGiftsData();
            showToast('✨ تم إنشاء حسابك وتسجيل الدخول بنجاح!', 'success');
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
            showToast(`✨ تم إنشاء حساب ${data.user.displayName} بنجاح!`, 'success');
            document.getElementById('registerNewUserForm').reset();
        } else {
            showToast(data.error || 'فشل إنشاء الحساب', 'error');
        }
    } catch (err) {
        showToast('خطأ في الاتصال: ' + err.message, 'error');
    }
}

function quickFillAdmin() {
    document.getElementById('loginUsername').value = 'mezo';
    document.getElementById('loginPassword').value = '123456';
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
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
}

function openAuthModal() {
    document.getElementById('authModal').classList.add('open');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('open');
}

function switchAuthTab(tab) {
    document.getElementById('tabLoginBtn').classList.toggle('active', tab === 'login');
    document.getElementById('tabRegisterBtn').classList.toggle('active', tab === 'register');
    document.getElementById('loginForm').classList.toggle('active', tab === 'login');
    document.getElementById('registerForm').classList.toggle('active', tab === 'register');
}

// ================= SECTION 1: GIFTS OVERLAY ================= //
async function loadGiftsData() {
    try {
        const res = await fetch(`/api/board/${currentUid}`);
        const data = await res.json();
        if (data.success && data.board) {
            const board = data.board;
            currentBoardData = board;
            currentGifts = board.gifts || [];

            // Update UI elements
            if (board.color) document.getElementById('neonColor').value = board.color;
            if (board.scale) document.getElementById('scaleSlider').value = board.scale;
            if (board.glowIntensity) document.getElementById('glowSlider').value = board.glowIntensity;
            if (board.offsetY !== undefined) document.getElementById('offsetYSlider').value = board.offsetY;
            if (board.animationType) document.getElementById('animTypeSelect').value = board.animationType;

            // Sync static text mode
            const staticCheck = document.getElementById('textStaticModeCheck');
            if (staticCheck) staticCheck.checked = Boolean(board.textStaticMode);

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
    const color = board.color || document.getElementById('neonColor').value || '#a855f7';
    const align = board.horizontalAlign || 'right';
    content.style.alignItems = align === 'right' ? 'flex-start' : 'flex-end';

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
            allTiktokGifts = await res.json();
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

    // Render up to 250 items for rapid scrolling
    const itemsToRender = filtered.slice(0, 250);

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
        }
    } catch (e) {}
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
            document.getElementById('sbScoreADisplay').textContent = b.team_a_score || 0;
            document.getElementById('sbScoreBDisplay').textContent = b.team_b_score || 0;
        }

        // Update trigger URLs on screen
        const origin = window.location.origin;
        const trigA = document.getElementById('trigAUrl');
        const trigB = document.getElementById('trigBUrl');
        const webh = document.getElementById('webhookUrl');
        if (trigA) trigA.textContent = `${origin}/trigger?team=a&action=add&value=1&id=${currentUid}`;
        if (trigB) trigB.textContent = `${origin}/trigger?team=b&action=add&value=1&id=${currentUid}`;
        if (webh) webh.textContent = `${origin}/webhook/tikfinity?id=${currentUid}`;
    } catch (e) {}
}

async function adjustSbScore(team, delta) {
    try {
        const res = await fetch(`/api/scoreboard/${currentUid}/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ team, delta })
        });
        const data = await res.json();
        if (data.success && data.board) {
            document.getElementById('sbScoreADisplay').textContent = data.board.team_a_score || 0;
            document.getElementById('sbScoreBDisplay').textContent = data.board.team_b_score || 0;
        }
    } catch (e) {}
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

    try {
        const res = await fetch(`/api/scoreboard/${currentUid}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, team_a_name: a, team_b_name: b })
        });
        const data = await res.json();
        if (data.success) {
            showToast('⚡ تم تحديث أسماء الفرق وعنوان لوحة النتائج!', 'success');
        }
    } catch (e) {}
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

    // 3. Render Mutual Exclusion Library Chips
    renderMutualExclusionGrid();
}

function renderMutualExclusionGrid() {
    const grid = document.getElementById('teamGiftsLibraryGrid');
    if (!grid) return;

    grid.innerHTML = '';

    const t1Images = new Set((currentTeamGifts.team1?.gifts || []).map(g => normalizeImgPath(g.image)));
    const t2Images = new Set((currentTeamGifts.team2?.gifts || []).map(g => normalizeImgPath(g.image)));

    const librarySource = [...POPULAR_GIFTS];
    if (allTiktokGifts && allTiktokGifts.length > 0) {
        const seenNorms = new Set(POPULAR_GIFTS.map(g => normalizeImgPath(g.image)));
        for (const g of allTiktokGifts) {
            const n = normalizeImgPath(g.image);
            if (!seenNorms.has(n)) {
                seenNorms.add(n);
                librarySource.push({ name: g.name, image: g.image });
            }
            if (librarySource.length >= 80) break;
        }
    }

    librarySource.forEach(gift => {
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
            <span>${escapeHtml(gift.name)} ${statusBadge}</span>
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

function toggleGiftInTeam(gift) {
    const target = currentTeamGifts[activeTargetTeam];
    if (!target) return;

    const norm = normalizeImgPath(gift.image);
    const otherTeamKey = activeTargetTeam === 'team1' ? 'team2' : 'team1';
    const otherImages = new Set((currentTeamGifts[otherTeamKey]?.gifts || []).map(g => normalizeImgPath(g.image)));

    if (otherImages.has(norm)) {
        showToast('⚠️ لا يمكن إضافة هذه الهدية لأنها مستخدمة في الفريق الآخر! ممنوع التكرار.', 'warning');
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
    if (currentTeamGifts[teamKey] && currentTeamGifts[teamKey].gifts[index]) {
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
        const res = await fetch(`/api/team-gifts/${currentUid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentTeamGifts)
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
    else if (type === 'fire') url = `${origin}/fire-text.html?uid=${currentUid}`;
    else if (type === 'camera') url = `${origin}/camera-overlay.html?uid=${currentUid}`;
    else if (type === 'scoreboard') url = `${origin}/scoreboard-overlay.html?id=${currentUid}`;

    navigator.clipboard.writeText(url);
    showToast(`📺 تم نسخ رابط (${type}) بنجاح!`, 'copy');
}

// ================= SOCKET.IO & EVENT LISTENERS ================= //
function setupSocket() {
    try {
        const socket = io();

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
    } catch (e) {}
}

function setupEventListeners() {
    // Board switch
    const switchBtn = document.getElementById('switchUidBtn');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            const val = document.getElementById('uidInput').value.trim();
            if (val) {
                currentUid = val;
                localStorage.setItem('last_board_uid', currentUid);
                loadGiftsData();
                loadTeamGiftsData();
                loadFireData();
                loadCameraData();
                loadScoreboardData();
                showToast(`🔄 تم التبديل إلى معرف اللوحة: ${currentUid}`, 'info');
            }
        });
    }

    // UID input enter key
    const uidInp = document.getElementById('uidInput');
    if (uidInp) {
        uidInp.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                switchBtn.click();
            }
        });
    }

    // Sliders live badges
    const offsetYSlider = document.getElementById('offsetYSlider');
    if (offsetYSlider) {
        offsetYSlider.addEventListener('input', (e) => {
            document.getElementById('offsetYValue').textContent = e.target.value + ' px';
            setPosition(document.querySelector('.pos-preset-buttons .btn-pos.active')?.dataset.valign || 'center', e.target.value);
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
}
