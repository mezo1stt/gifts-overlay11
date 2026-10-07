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
    loadRaceState();

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
        raceSection: '⚔️ صراع الحكام 👑 · نظام تسجيل انتصارات الحكام والمتسابقين في روبلوكس وتيك توك',
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
            const scA = b.team_a_score || 0;
            const scB = b.team_b_score || 0;
            document.getElementById('sbScoreADisplay').textContent = scA >= 1000 ? scA.toLocaleString() : scA;
            document.getElementById('sbScoreBDisplay').textContent = scB >= 1000 ? scB.toLocaleString() : scB;
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
            const scA = data.board.team_a_score || 0;
            const scB = data.board.team_b_score || 0;
            document.getElementById('sbScoreADisplay').textContent = scA >= 1000 ? scA.toLocaleString() : scA;
            document.getElementById('sbScoreBDisplay').textContent = scB >= 1000 ? scB.toLocaleString() : scB;
        }
    } catch (e) {}
}

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
            showToast(`⚡ تم ضبط نتيجة الفريق ${team === 'a' ? 'الأحمر' : 'الأخضر'} على: ${val.toLocaleString()}`, 'success');
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

    const linkRace = document.getElementById('linkRaceUrl');
    if (linkRace) linkRace.value = `${origin}/race-overlay.html`;
    const openRace = document.getElementById('openRaceUrl');
    if (openRace) openRace.href = `${origin}/race-overlay.html`;

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
    else if (type === 'race') url = `${origin}/race-overlay.html`;

    navigator.clipboard.writeText(url);
    showToast(`📺 تم نسخ رابط (${type === 'race' ? 'صراع الحكام' : type}) بنجاح!`, 'copy');
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

        socket.on('race_win_celebration', (data) => {
            triggerRaceCelebration(data);
        });
        socket.on('win_celebration', (data) => {
            triggerRaceCelebration(data);
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
