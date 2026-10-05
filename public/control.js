// ================= UID & Board Selection ================= //
const urlParams = new URLSearchParams(window.location.search);
let uid = urlParams.get('uid');

if (!uid) {
    uid = localStorage.getItem('gifts_last_uid') || 'board_XXXX';
    const newUrl = `${window.location.pathname}?uid=${encodeURIComponent(uid)}`;
    window.history.replaceState({}, '', newUrl);
}

localStorage.setItem('gifts_last_uid', uid);

const uidInput = document.getElementById('uidInput');
uidInput.value = uid;

document.getElementById('switchUidBtn').addEventListener('click', switchBoard);
uidInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') switchBoard();
});

function switchBoard() {
    const newUid = uidInput.value.trim();
    if (!newUid) return;
    localStorage.setItem('gifts_last_uid', newUid);
    window.location.search = `?uid=${encodeURIComponent(newUid)}`;
}

// URLs for Overlay
const overlayUrl = `${window.location.origin}/fire-widget.html?uid=${encodeURIComponent(uid)}`;
document.getElementById('fullOverlayUrl').value = overlayUrl;
document.getElementById('openOverlayBtn').href = overlayUrl;
document.getElementById('previewExternalLink').href = overlayUrl;

function copyOverlayUrl() {
    const input = document.getElementById('fullOverlayUrl');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value).then(() => {
        alert('✅ تم نسخ رابط الـ Overlay بنجاح! الصقه في Browser Source داخل TikTok Live Studio أو OBS.');
    }).catch(() => {
        document.execCommand('copy');
        alert('✅ تم نسخ الرابط!');
    });
}

// ================= Image URL Helper ================= //
function getImageSrc(image) {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
        return image;
    }
    return `/images/${image}`;
}

// ================= State ================= //
let currentBoard = {
    color: '#a855f7',
    verticalAlign: 'center',
    offsetY: 0,
    horizontalAlign: 'right',
    offsetX: 30,
    scale: 100,
    fontSize: 22,
    glowIntensity: 15,
    animationType: 'slide',
    animationDuration: 7,
    gifts: []
};

// ================= Status & Cloud Diagnostics ================= //
async function checkStatus() {
    try {
        const res = await fetch('/api/status');
        const status = await res.json();
        const badge = document.getElementById('storageStatusBadge');
        const text = document.getElementById('storageStatusText');

        if (status.cloudinary) {
            badge.classList.add('active');
            text.textContent = '☁️ Cloudinary سحابي دائم';
            badge.title = 'الصور تُحفظ سحابياً على Cloudinary ولن تُحذف عند إعادة تشغيل ريندر!';
        } else if (status.imgbb) {
            badge.classList.add('active');
            text.textContent = '☁️ ImgBB سحابي دائم';
            badge.title = 'الصور تُحفظ سحابياً على ImgBB ولن تُحذف!';
        } else if (status.persistentDisk) {
            badge.classList.add('active');
            text.textContent = '💾 قرص Render الثابت';
        } else {
            badge.classList.remove('active');
            text.textContent = '⚠️ حفظ محلي (اضغط للضبط)';
            badge.title = 'اضغط على زر "إعدادات Render" لتفعيل الحفظ السحابي الدائم المجاني حتى لا تُمسح الصور!';
            badge.style.cursor = 'pointer';
            badge.onclick = openCloudModal;
        }
    } catch (e) {
        console.warn('Status check failed:', e);
    }
}

// ================= Load Board Data ================= //
async function loadBoardData() {
    try {
        const res = await fetch(`/api/data/${uid}`);
        if (!res.ok) throw new Error('فشل جلب البيانات');
        const data = await res.json();

        currentBoard = {
            ...currentBoard,
            ...data
        };

        // Cache in localStorage for safe auto-recovery
        if (currentBoard.gifts && currentBoard.gifts.length > 0) {
            localStorage.setItem(`gifts_board_${uid}`, JSON.stringify(currentBoard));
        } else {
            // Check if we have cached local data to offer restore
            const cached = localStorage.getItem(`gifts_board_${uid}`);
            if (cached) {
                document.getElementById('localRestoreBox').style.display = 'flex';
            }
        }

        applySettingsToUI();
        renderGiftsList();
        updatePreview();
    } catch (err) {
        console.error('Error loading board data:', err);
    }
}

// ================= Apply Settings to Controls ================= //
function applySettingsToUI() {
    // Color
    const color = currentBoard.color || '#a855f7';
    document.getElementById('neonColor').value = color;
    document.getElementById('colorHex').textContent = color;
    document.documentElement.style.setProperty('--primary-neon', color);

    // Position Buttons
    const vAlign = currentBoard.verticalAlign || 'center';
    document.querySelectorAll('.btn-pos').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.valign === vAlign);
    });

    // Offset Y Slider
    const offsetY = currentBoard.offsetY !== undefined ? currentBoard.offsetY : 0;
    const offsetYSlider = document.getElementById('offsetYSlider');
    offsetYSlider.value = offsetY;
    document.getElementById('offsetYValue').textContent = `${offsetY > 0 ? '+' : ''}${offsetY} px`;

    // Horizontal Align
    const hAlign = currentBoard.horizontalAlign || 'right';
    document.getElementById('btnAlignRight').classList.toggle('active', hAlign === 'right');
    document.getElementById('btnAlignLeft').classList.toggle('active', hAlign === 'left');

    // Scale & Glow & Anim
    const scale = currentBoard.scale !== undefined ? currentBoard.scale : 100;
    document.getElementById('scaleSlider').value = scale;
    document.getElementById('scaleValue').textContent = `${scale}%`;

    const glow = currentBoard.glowIntensity !== undefined ? currentBoard.glowIntensity : 15;
    document.getElementById('glowSlider').value = glow;
    document.getElementById('glowValue').textContent = `${glow} px`;

    const anim = currentBoard.animationType || 'slide';
    document.getElementById('animTypeSelect').value = anim;
}

// ================= Save Settings ================= //
let saveDebounceTimer = null;
async function saveSettings(settingsToSave) {
    currentBoard = { ...currentBoard, ...settingsToSave };
    updatePreview();

    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
        try {
            await fetch(`/api/board/${uid}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentBoard)
            });
            localStorage.setItem(`gifts_board_${uid}`, JSON.stringify(currentBoard));
        } catch (err) {
            console.error('Error saving settings:', err);
        }
    }, 300);
}

// Position Presets
function setPosition(valign, offsetY = 0) {
    document.querySelectorAll('.btn-pos').forEach(b => b.classList.remove('active'));
    const targetBtn = document.querySelector(`.btn-pos[data-valign="${valign}"]`);
    if (targetBtn) targetBtn.classList.add('active');

    document.getElementById('offsetYSlider').value = offsetY;
    document.getElementById('offsetYValue').textContent = `${offsetY > 0 ? '+' : ''}${offsetY} px`;

    saveSettings({ verticalAlign: valign, offsetY: offsetY });
}

function resetOffsetY() {
    document.getElementById('offsetYSlider').value = 0;
    document.getElementById('offsetYValue').textContent = '0 px';
    saveSettings({ offsetY: 0 });
}

function setHorizontalAlign(align) {
    document.getElementById('btnAlignRight').classList.toggle('active', align === 'right');
    document.getElementById('btnAlignLeft').classList.toggle('active', align === 'left');
    saveSettings({ horizontalAlign: align });
}

// Sliders Listeners
document.getElementById('offsetYSlider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('offsetYValue').textContent = `${val > 0 ? '+' : ''}${val} px`;
    saveSettings({ offsetY: val });
});

document.getElementById('scaleSlider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('scaleValue').textContent = `${val}%`;
    saveSettings({ scale: val });
});

document.getElementById('glowSlider').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById('glowValue').textContent = `${val} px`;
    saveSettings({ glowIntensity: val });
});

document.getElementById('animTypeSelect').addEventListener('change', (e) => {
    saveSettings({ animationType: e.target.value });
});

// Color
const neonColorInput = document.getElementById('neonColor');
const colorHex = document.getElementById('colorHex');

neonColorInput.addEventListener('input', (e) => {
    const color = e.target.value;
    colorHex.textContent = color;
    document.documentElement.style.setProperty('--primary-neon', color);
    saveSettings({ color });
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        neonColorInput.value = color;
        colorHex.textContent = color;
        document.documentElement.style.setProperty('--primary-neon', color);
        saveSettings({ color });
    });
});

// ================= Mini Live Preview ================= //
function updatePreview() {
    const previewScreen = document.getElementById('previewScreen');
    const content = document.getElementById('previewOverlayContent');
    if (!previewScreen || !content) return;

    // Apply color
    const color = currentBoard.color || '#a855f7';
    content.style.setProperty('--primary-neon', color);

    // Apply alignment
    const vAlign = currentBoard.verticalAlign || 'center';
    const hAlign = currentBoard.horizontalAlign || 'right';
    const offsetY = currentBoard.offsetY || 0;

    if (vAlign === 'top') {
        previewScreen.style.alignItems = 'flex-start';
        previewScreen.style.paddingTop = '15px';
        previewScreen.style.paddingBottom = '0px';
    } else if (vAlign === 'bottom') {
        previewScreen.style.alignItems = 'flex-end';
        previewScreen.style.paddingBottom = '15px';
        previewScreen.style.paddingTop = '0px';
    } else {
        previewScreen.style.alignItems = 'center';
        previewScreen.style.paddingTop = '0px';
        previewScreen.style.paddingBottom = '0px';
    }

    if (hAlign === 'left') {
        previewScreen.style.justifyContent = 'flex-start';
        previewScreen.style.paddingLeft = '15px';
        previewScreen.style.paddingRight = '0px';
        content.style.alignItems = 'flex-start';
    } else {
        previewScreen.style.justifyContent = 'flex-end';
        previewScreen.style.paddingRight = '15px';
        previewScreen.style.paddingLeft = '0px';
        content.style.alignItems = 'flex-end';
    }

    // Scaled down offset for preview
    content.style.transform = `translateY(${offsetY * 0.35}px)`;

    // Render 3 preview items
    const gifts = currentBoard.gifts || [];
    content.innerHTML = '';

    if (gifts.length === 0) {
        content.innerHTML = `<span style="color:#666;font-size:12px;">لا توجد هدايا بعد</span>`;
        return;
    }

    const previewList = gifts.slice(0, 4);
    previewList.forEach(g => {
        const item = document.createElement('div');
        item.className = 'preview-gift-item';
        item.innerHTML = `
            <span>${escapeHtml(g.name)}</span>
            <img src="${getImageSrc(g.image)}" alt="${escapeHtml(g.name)}" onerror="this.src='/images/rose.png'">
        `;
        content.appendChild(item);
    });
}

// ================= Current Gifts List Rendering ================= //
function renderGiftsList() {
    const list = document.getElementById('giftsList');
    const badge = document.getElementById('giftsCountBadge');
    const gifts = currentBoard.gifts || [];

    badge.textContent = `${gifts.length} هدية`;
    list.innerHTML = '';

    if (gifts.length === 0) {
        list.innerHTML = `
            <div style="text-align:center;padding:30px 10px;color:#9ca3af;">
                <p style="font-size:28px;margin-bottom:8px;">🎁</p>
                <p>لا توجد هدايا مضافة حالياً. اختر من المكتبة بالأسفل أو ارفع صوراً جديدة!</p>
            </div>
        `;
        return;
    }

    gifts.forEach((gift, index) => {
        const row = document.createElement('div');
        row.className = 'gift-item-row';
        row.setAttribute('data-id', gift.id);

        row.innerHTML = `
            <img src="${getImageSrc(gift.image)}" class="gift-thumb" onerror="this.src='/images/rose.png'">
            <input type="text" class="gift-name-input" value="${escapeHtml(gift.name)}" data-id="${gift.id}" placeholder="اسم الهدية">
            <span class="saved-pill" id="saved-${gift.id}">✅ تم الحفظ</span>
            <div class="item-actions">
                <button class="btn-ctrl btn-up" onclick="moveGiftUp(${gift.id})" title="تحريك لأعلى ⬆️">⬆️</button>
                <button class="btn-ctrl btn-down" onclick="moveGiftDown(${gift.id})" title="تحريك لأسفل ⬇️">⬇️</button>
                <button class="btn-ctrl btn-del" onclick="deleteGift(${gift.id})" title="حذف الهدية 🗑️">🗑️</button>
            </div>
        `;

        list.appendChild(row);
    });

    // Auto-save on typing gift name
    document.querySelectorAll('.gift-name-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const id = parseInt(e.target.dataset.id);
            const newName = e.target.value.trim();
            if (!newName) return;

            try {
                await fetch(`/api/gifts/${uid}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newName })
                });

                const giftItem = currentBoard.gifts.find(g => g.id === id);
                if (giftItem) giftItem.name = newName;

                const savedPill = document.getElementById(`saved-${id}`);
                if (savedPill) {
                    savedPill.classList.add('show');
                    setTimeout(() => savedPill.classList.remove('show'), 1500);
                }
                updatePreview();
            } catch (err) {
                alert('فشل حفظ الاسم: ' + err.message);
            }
        });
    });
}

// Move Up
async function moveGiftUp(id) {
    try {
        const res = await fetch(`/api/gifts/${uid}/${id}/up`, { method: 'POST' });
        const json = await res.json();
        if (json.success && json.gifts) {
            currentBoard.gifts = json.gifts;
            renderGiftsList();
            updatePreview();
        }
    } catch (err) {
        console.error(err);
    }
}

// Move Down
async function moveGiftDown(id) {
    try {
        const res = await fetch(`/api/gifts/${uid}/${id}/down`, { method: 'POST' });
        const json = await res.json();
        if (json.success && json.gifts) {
            currentBoard.gifts = json.gifts;
            renderGiftsList();
            updatePreview();
        }
    } catch (err) {
        console.error(err);
    }
}

// Delete
async function deleteGift(id) {
    if (!confirm('هل أنت متأكد من حذف هذه الهدية؟')) return;
    try {
        await fetch(`/api/gifts/${uid}/${id}`, { method: 'DELETE' });
        currentBoard.gifts = currentBoard.gifts.filter(g => g.id !== id);
        renderGiftsList();
        updatePreview();
    } catch (err) {
        alert('فشل الحذف: ' + err.message);
    }
}

// ================= Add Gifts Tab Navigation ================= //
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.dataset.tab;
        document.getElementById(targetId).classList.add('active');
    });
});

// ================= Tab 1: File Upload ================= //
const fileInput = document.getElementById('fileInput');
const pendingBox = document.getElementById('pendingBox');
const saveAllBtn = document.getElementById('saveAllGiftsBtn');
let pendingFiles = [];

fileInput.addEventListener('change', (e) => {
    handleSelectedFiles(e.target.files);
    fileInput.value = '';
});

// Drag & drop support
const dropZone = document.getElementById('dropZone');
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#c084fc';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = '';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '';
    handleSelectedFiles(e.dataTransfer.files);
});

function handleSelectedFiles(files) {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    images.forEach(file => {
        pendingFiles.push({
            file: file,
            name: file.name.replace(/\.[^/.]+$/, ''), // default name from filename
            previewUrl: URL.createObjectURL(file)
        });
    });
    renderPendingList();
}

function renderPendingList() {
    pendingBox.innerHTML = '';
    pendingFiles.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'pending-item';
        div.innerHTML = `
            <img src="${item.previewUrl}">
            <input type="text" value="${escapeHtml(item.name)}" placeholder="✍️ اكتب اسم الهدية هنا" oninput="updatePendingName(${index}, this.value)">
            <button class="btn-remove" onclick="removePendingFile(${index})">✖</button>
        `;
        pendingBox.appendChild(div);
    });

    saveAllBtn.style.display = pendingFiles.length > 0 ? 'block' : 'none';
}

function updatePendingName(idx, val) {
    pendingFiles[idx].name = val;
}

function removePendingFile(idx) {
    pendingFiles.splice(idx, 1);
    renderPendingList();
}

async function savePendingGifts() {
    if (pendingFiles.length === 0) return;

    const empty = pendingFiles.find(item => !item.name.trim());
    if (empty) {
        alert('⚠️ يرجى كتابة اسم لكل صورة قبل الحفظ.');
        return;
    }

    saveAllBtn.disabled = true;
    saveAllBtn.textContent = '⏳ جاري الرفع والحفظ...';

    const formData = new FormData();
    const names = [];

    pendingFiles.forEach(item => {
        formData.append('images', item.file);
        names.push(item.name.trim());
    });
    formData.append('names', JSON.stringify(names));

    try {
        const res = await fetch(`/api/gifts/${uid}/bulk`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error('فشل الرفع من الخادم');
        const newGifts = await res.json();

        alert('✅ تم حفظ وإضافة الهدايا بنجاح!');
        pendingFiles = [];
        renderPendingList();
        loadBoardData();
    } catch (err) {
        alert('❌ حدث خطأ: ' + err.message);
    } finally {
        saveAllBtn.disabled = false;
        saveAllBtn.textContent = '💾 حفظ وإضافة كل الصور';
    }
}

// ================= Tab 2: Direct Image URL ================= //
const giftUrlInput = document.getElementById('giftUrlInput');
const giftUrlName = document.getElementById('giftUrlName');
const urlPreviewBox = document.getElementById('urlPreviewBox');
const urlPreviewImg = document.getElementById('urlPreviewImg');
const urlPreviewName = document.getElementById('urlPreviewName');

giftUrlInput.addEventListener('input', () => {
    const url = giftUrlInput.value.trim();
    if (url) {
        urlPreviewImg.src = url;
        urlPreviewBox.style.display = 'flex';
        urlPreviewName.textContent = giftUrlName.value.trim() || 'اسم الهدية';
    } else {
        urlPreviewBox.style.display = 'none';
    }
});

giftUrlName.addEventListener('input', () => {
    urlPreviewName.textContent = giftUrlName.value.trim() || 'اسم الهدية';
});

async function addGiftByUrl() {
    const url = giftUrlInput.value.trim();
    const name = giftUrlName.value.trim();

    if (!url || !name) {
        alert('⚠️ يرجى إدخال رابط الصورة واسم الهدية معاً');
        return;
    }

    try {
        const res = await fetch(`/api/gifts/${uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, imageUrl: url })
        });

        if (!res.ok) throw new Error('فشل الإضافة');

        alert('✅ تمت إضافة الهدية بنجاح!');
        giftUrlInput.value = '';
        giftUrlName.value = '';
        urlPreviewBox.style.display = 'none';
        loadBoardData();
    } catch (err) {
        alert('❌ حدث خطأ: ' + err.message);
    }
}

// ================= Tab 3: Preset TikTok Library ================= //
const libraryGifts = [
    { name: 'تيربو 🌹', image: 'rose.png' },
    { name: 'بوابة 🍩', image: 'donut.png' },
    { name: 'صاروخ 🧴', image: 'perfume.png' },
    { name: 'قلب حب 💖', image: 'heart.png' },
    { name: 'مكوك فضائي 🚀', image: '1791197817001-eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' },
    { name: 'درع حماية 🛡️', image: '1791197852391-e033c3f28632e233bebac1668ff66a2f.png~tplv-obj.webp' },
    { name: 'نيزك مشتعل ☄️', image: '1791197748042-81cb495abfe066981b9c135cfff21c7a.png~tplv-obj.webp' },
    { name: 'تبطئ اللاعبين ⏳', image: '1791197915043-374dfe46d5b09ce1db19be06202d34f5.png~tplv-obj.webp' },
    { name: 'أسرع لاعب ⚡', image: '1791198042522-9f8bd92363c400c284179f6719b6ba9c~tplv-obj.webp' },
    { name: 'نقل أسطوري 🌌', image: '1791198055544-79a02148079526539f7599150da9fd28.png~tplv-obj.webp' },
    { name: 'فوز أسطوري 🏆', image: '1791198066523-1d067d13988e8754ed6adbebd89b9ee8.png~tplv-obj.webp' }
];

function renderLibrary() {
    const grid = document.getElementById('libraryGrid');
    grid.innerHTML = '';

    libraryGifts.forEach(item => {
        const div = document.createElement('div');
        div.className = 'library-item';
        div.innerHTML = `
            <img src="${getImageSrc(item.image)}" alt="${item.name}">
            <span>${item.name}</span>
        `;
        div.addEventListener('click', () => addLibraryGift(item));
        grid.appendChild(div);
    });
}

async function addLibraryGift(item) {
    const customName = prompt(`أدخل اسم الهدية للظهور على الشاشة:`, item.name);
    if (!customName) return;

    try {
        const res = await fetch(`/api/gifts/${uid}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: customName.trim(), imageUrl: item.image })
        });

        if (!res.ok) throw new Error('فشل الإضافة');
        loadBoardData();
    } catch (err) {
        alert('❌ حدث خطأ: ' + err.message);
    }
}

// ================= Modals Logic ================= //
function openObsModal() {
    document.getElementById('obsModal').classList.add('open');
}
function closeObsModal() {
    document.getElementById('obsModal').classList.remove('open');
}

function openCloudModal() {
    document.getElementById('cloudModal').classList.add('open');
}
function closeCloudModal() {
    document.getElementById('cloudModal').classList.remove('open');
}

function openBackupModal() {
    document.getElementById('backupModal').classList.add('open');
}
function closeBackupModal() {
    document.getElementById('backupModal').classList.remove('open');
}

// Restore from local cache
function restoreFromLocal() {
    const cached = localStorage.getItem(`gifts_board_${uid}`);
    if (!cached) return;
    try {
        const boardData = JSON.parse(cached);
        saveSettings(boardData);
        alert('✅ تمت استعادة الهدايا من الذاكرة المحلية بنجاح!');
        closeBackupModal();
        loadBoardData();
    } catch (e) {
        alert('فشل استعادة البيانات');
    }
}

// Restore from file
document.getElementById('restoreFileInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const json = JSON.parse(text);

        const res = await fetch('/api/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: json })
        });

        if (!res.ok) throw new Error('فشل الاستعادة');
        alert('✅ تمت استعادة النسخة الاحتياطية بنجاح!');
        closeBackupModal();
        loadBoardData();
    } catch (err) {
        alert('❌ فشل قراءة أو استعادة الملف: ' + err.message);
    }
});

// Close modals when clicking backdrop
document.querySelectorAll('.modal-backdrop').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
    });
});

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ================= Fire Widget Modal Logic ================= //
function openFireModal() {
    const fireUrl = `${window.location.origin}/fire-text.html?uid=${encodeURIComponent(uid)}`;
    document.getElementById('fireWidgetObsUrl').value = fireUrl;
    document.getElementById('openFireTextBtn').href = fireUrl;
    document.getElementById('fireModal').classList.add('open');
}
function closeFireModal() {
    document.getElementById('fireModal').classList.remove('open');
}

function copyFireWidgetUrl() {
    const input = document.getElementById('fireWidgetObsUrl');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value).then(() => {
        alert('✅ تم نسخ رابط شريط النص الناري! الصقه في Browser Source داخل TikTok Live Studio أو OBS.');
    }).catch(() => {
        document.execCommand('copy');
        alert('✅ تم نسخ الرابط!');
    });
}

// ================= Initial Load ================= //
checkStatus();
loadBoardData();
renderLibrary();