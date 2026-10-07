const params = new URLSearchParams(window.location.search);
const uid = params.get('uid') || 'board_XXXX';

const container = document.getElementById('giftContainer');
const column = document.getElementById('giftColumn');

function getImageSrc(image) {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
        return image;
    }
    return `/images/${image}`;
}

async function loadData() {
    if (!uid) return;

    try {
        const res = await fetch(`/api/data/${uid}`);
        if (!res.ok) return;
        const boardData = await res.json();

        // 1. Neon Color
        const color = boardData.color || '#a855f7';
        document.documentElement.style.setProperty('--neon-color', color);

        // 2. Size & Typography
        const scale = boardData.scale ? Number(boardData.scale) / 100 : 1;
        const baseSize = 95 * scale;
        const baseFontSize = (boardData.fontSize ? Number(boardData.fontSize) : 22) * scale;
        const glow = (boardData.glowIntensity !== undefined ? Number(boardData.glowIntensity) : 15);
        const animDuration = (boardData.animationDuration ? Number(boardData.animationDuration) : 7);

        document.documentElement.style.setProperty('--gift-size', `${Math.round(baseSize)}px`);
        document.documentElement.style.setProperty('--font-size', `${Math.round(baseFontSize)}px`);
        document.documentElement.style.setProperty('--glow-intensity', `${glow}px`);
        document.documentElement.style.setProperty('--anim-duration', `${animDuration}s`);

        // 3. Screen Alignment & Positions (تحريك لأعلى ولأسفل)
        const vAlign = boardData.verticalAlign || 'center';
        const offsetY = boardData.offsetY !== undefined ? Number(boardData.offsetY) : 0;
        const hAlign = boardData.horizontalAlign || 'right';
        const offsetX = boardData.offsetX !== undefined ? Number(boardData.offsetX) : 30;

        // Apply Vertical Alignment
        if (vAlign === 'top') {
            document.body.style.alignItems = 'flex-start';
            document.body.style.paddingTop = '40px';
            document.body.style.paddingBottom = '0px';
        } else if (vAlign === 'bottom') {
            document.body.style.alignItems = 'flex-end';
            document.body.style.paddingBottom = '40px';
            document.body.style.paddingTop = '0px';
        } else {
            document.body.style.alignItems = 'center';
            document.body.style.paddingTop = '0px';
            document.body.style.paddingBottom = '0px';
        }

        // Apply Vertical Offset (Y-Offset)
        container.style.transform = `translateY(${offsetY}px)`;

        // Apply Horizontal Alignment
        if (hAlign === 'left') {
            document.body.style.justifyContent = 'flex-start';
            document.body.style.paddingLeft = `${offsetX}px`;
            document.body.style.paddingRight = '0px';
            document.body.classList.add('align-left');
        } else {
            document.body.style.justifyContent = 'flex-end';
            document.body.style.paddingRight = `${offsetX}px`;
            document.body.style.paddingLeft = '0px';
            document.body.classList.remove('align-left');
        }

        // 4. Animation Type
        const animType = boardData.animationType || 'slide';
        document.body.classList.remove('anim-fade', 'anim-bounce', 'anim-pulse', 'anim-none');
        if (animType !== 'slide') {
            document.body.classList.add(`anim-${animType}`);
        }

        // 4.1 Static Text Mode (الكلام ثابت والصور فقط متحركة)
        if (boardData.textStaticMode) {
            document.body.classList.add('static-text');
        } else {
            document.body.classList.remove('static-text');
        }

        // 5. Gifts List
        const gifts = boardData.gifts || [];

        // Check if items changed
        const currentIds = Array.from(column.children).map(c => c.getAttribute('data-id'));
        const newIds = gifts.map(g => String(g.id));

        const isDifferent = currentIds.length !== newIds.length || !currentIds.every((id, idx) => id === newIds[idx]);

        if (isDifferent) {
            column.innerHTML = '';
            gifts.forEach((gift) => {
                const div = document.createElement('div');
                div.className = 'gift-item';
                div.setAttribute('data-id', gift.id);
                div.innerHTML = `
                    <span>${escapeHtml(gift.name)}</span>
                    <img src="${getImageSrc(gift.image)}" alt="${escapeHtml(gift.name)}" onerror="this.src='/images/rose.png'">
                `;
                column.appendChild(div);
            });
        } else {
            // Update contents in place
            gifts.forEach((gift, i) => {
                const itemEl = column.children[i];
                if (!itemEl) return;
                const span = itemEl.querySelector('span');
                const img = itemEl.querySelector('img');
                if (span && span.textContent !== gift.name) {
                    span.textContent = gift.name;
                }
                const targetSrc = getImageSrc(gift.image);
                if (img && img.getAttribute('src') !== targetSrc) {
                    img.setAttribute('src', targetSrc);
                }
            });
        }
    } catch (err) {
        console.error('Error loading overlay data:', err);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

loadData();
setInterval(loadData, 1000);