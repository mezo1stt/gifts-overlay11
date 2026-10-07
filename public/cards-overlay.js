const params = new URLSearchParams(window.location.search);
const uid = params.get('uid') || 'board_XXXX';

const stageContainer = document.getElementById('cardsStageContainer');
const deckColumn = document.getElementById('cardsDeckColumn');

function getImageSrc(image) {
    if (!image) return '/images/rose.png';
    if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('data:')) {
        return image;
    }
    return image.startsWith('/') ? image : `/images/${image}`;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function loadCardsData() {
    if (!uid) return;

    try {
        const res = await fetch(`/api/cards-board/${uid}`);
        if (!res.ok) return;
        const data = await res.json();
        const board = data.board || {};

        // 1. Neon Color & Glow
        const color = board.color || '#ff2a4a';
        const glow = board.glowIntensity !== undefined ? Number(board.glowIntensity) : 18;
        document.documentElement.style.setProperty('--neon-color', color);
        document.documentElement.style.setProperty('--glow-intensity', `${glow}px`);

        // Neon ON / OFF
        const neonEnabled = board.neonEnabled !== false;
        document.body.classList.toggle('neon-on', neonEnabled);
        document.body.classList.toggle('neon-off', !neonEnabled);

        // 2. Scale & Sizing
        const scale = board.scale ? Number(board.scale) / 100 : 1;
        const baseSize = 100 * scale;
        const countFontSize = 26 * scale;
        document.documentElement.style.setProperty('--card-size', `${Math.round(baseSize)}px`);
        document.documentElement.style.setProperty('--count-font-size', `${Math.round(countFontSize)}px`);

        // 3. Fonts
        const font = board.fontFamily || 'impact';
        document.body.classList.remove('font-impact', 'font-pixel', 'font-cyber', 'font-cairo', 'font-tajawal');
        document.body.classList.add(`font-${font}`);

        // 4. Disappearance Mode
        const mode = board.disappearMode || 'gift_only';
        document.body.classList.toggle('mode-gift-only', mode === 'gift_only');
        document.body.classList.toggle('mode-card-and-gift', mode === 'card_and_gift');

        // 5. Positions & Alignment
        const hAlign = board.horizontalAlign || 'right';
        const offsetX = board.offsetX !== undefined ? Number(board.offsetX) : 30;
        const offsetY = board.offsetY !== undefined ? Number(board.offsetY) : 0;

        if (hAlign === 'left') {
            document.body.classList.add('align-left');
            document.body.style.paddingLeft = `${offsetX}px`;
            document.body.style.paddingRight = '0px';
        } else {
            document.body.classList.remove('align-left');
            document.body.style.paddingRight = `${offsetX}px`;
            document.body.style.paddingLeft = '0px';
        }
        stageContainer.style.transform = `translateY(${offsetY}px)`;

        // 6. Cards Deck Rendering
        const cards = board.cards && board.cards.length > 0
            ? board.cards
            : [
                { id: 1, cardType: 'skeleton_bandana', count: 1, giftName: 'وردة', giftImage: '/images/rose.png' },
                { id: 2, cardType: 'evoker_mage', count: 1, giftName: 'عطر', giftImage: '/images/perfume.png' },
                { id: 3, cardType: 'skeleton_cap', count: 2, giftName: 'دونات', giftImage: '/images/donut.png' },
                { id: 4, cardType: 'hog_rider', count: 1, giftName: 'قلب', giftImage: '/images/heart.png' },
                { id: 5, cardType: 'golem_pumpkin', count: 1, giftName: 'آيس كريم', giftImage: '/images/icecream.png' }
            ];

        const giftPos = board.giftPosition || 'top-right';

        const currentKey = Array.from(deckColumn.children).map(c => c.getAttribute('data-card-key')).join('|');
        const newKey = cards.map(c => `${c.id}_${c.cardType}_${c.count}_${c.giftImage}_${giftPos}`).join('|');

        if (currentKey !== newKey) {
            deckColumn.innerHTML = '';
            cards.forEach(card => {
                const item = document.createElement('div');
                item.className = 'card-unit-item';
                item.setAttribute('data-card-key', `${card.id}_${card.cardType}_${card.count}_${card.giftImage}_${giftPos}`);
                item.setAttribute('data-card-id', card.id);

                const cardSrc = `/images/mcroyale/${card.cardType || 'skeleton_bandana'}.png`;
                const giftSrc = getImageSrc(card.giftImage);

                item.innerHTML = `
                    <div class="card-gift-badge pos-${giftPos}" title="${escapeHtml(card.giftName || 'هدية')}">
                        <img src="${giftSrc}" alt="${escapeHtml(card.giftName || '')}" onerror="this.src='/images/rose.png'">
                    </div>
                    <img class="card-character-img" src="${cardSrc}" alt="Card" onerror="this.src='/images/mcroyale/skeleton_bandana.png'">
                    <div class="troop-count-badge">X${card.count || 1}</div>
                `;
                deckColumn.appendChild(item);
            });
        }
    } catch (err) {
        console.error('Error loading cards overlay data:', err);
    }
}

// Socket.io Real-time reaction
if (typeof io !== 'undefined') {
    const socket = io();
    socket.on('cards_board_update', (msg) => {
        if (!msg || !msg.uid || msg.uid === uid) {
            loadCardsData();
        }
    });
}

loadCardsData();
setInterval(loadCardsData, 1000);
