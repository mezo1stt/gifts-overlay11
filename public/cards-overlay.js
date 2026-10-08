const params = new URLSearchParams(window.location.search);
const uid = params.get('uid') || 'board_XXXX';
const teamParam = (params.get('team') || 'dual').toLowerCase(); // 'red', 'blue', or 'dual'

const stageContainer = document.getElementById('cardsStageContainer');
const deckBlue = document.getElementById('cardsDeckBlue');
const deckRed = document.getElementById('cardsDeckRed');
const badgeBlue = document.getElementById('cardsTeamBlueBadge');
const badgeRed = document.getElementById('cardsTeamRedBadge');

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

        // 1. Neon Mode
        const neonEnabled = board.neonEnabled !== false;
        document.body.classList.toggle('neon-on', neonEnabled);
        document.body.classList.toggle('neon-off', !neonEnabled);

        const glow = board.glowIntensity !== undefined ? Number(board.glowIntensity) : 18;
        document.documentElement.style.setProperty('--glow-intensity', `${glow}px`);

        // 2. Scale & Sizing
        const scale = board.scale ? Number(board.scale) / 100 : 1;
        const baseSize = 95 * scale;
        const countFontSize = 26 * scale;
        document.documentElement.style.setProperty('--card-size', `${Math.round(baseSize)}px`);
        document.documentElement.style.setProperty('--count-font-size', `${Math.round(countFontSize)}px`);

        // 3. Fonts
        const font = board.fontFamily || 'cairo';
        document.body.classList.remove('font-impact', 'font-pixel', 'font-cyber', 'font-changa', 'font-cairo', 'font-rubik', 'font-tajawal');
        document.body.classList.add(`font-${font}`);

        // 4. Disappearance Mode
        const mode = board.disappearMode || 'gift_only';
        document.body.classList.toggle('mode-gift-only', mode === 'gift_only');
        document.body.classList.toggle('mode-card-and-gift', mode === 'card_and_gift');

        // 5. Visibility based on ?team=red or ?team=blue
        if (teamParam === 'red' || teamParam === '1') {
            document.body.classList.add('only-team-red');
            document.body.classList.remove('only-team-blue');
        } else if (teamParam === 'blue' || teamParam === '2') {
            document.body.classList.add('only-team-blue');
            document.body.classList.remove('only-team-red');
        } else {
            document.body.classList.remove('only-team-red', 'only-team-blue');
        }

        // Y-Offset
        const offsetY = board.offsetY !== undefined ? Number(board.offsetY) : 0;
        if (stageContainer) stageContainer.style.transform = `translateY(${offsetY}px)`;

        const giftPos = board.giftPosition || 'top-right';

        // 6. Render Team Red
        const teamRed = board.teamRed || {
            title: 'الفريق الأحمر',
            color: '#ff2a4a',
            cards: board.cards || []
        };
        const redCol = document.getElementById('cardsTeamRedCol');
        if (redCol) redCol.style.setProperty('--team-color', teamRed.color || '#ff2a4a');
        if (badgeRed) badgeRed.textContent = teamRed.title || '🔴 الفريق الأحمر';
        renderCardsToColumn(deckRed, teamRed.cards || [], giftPos, teamRed.color || '#ff2a4a');

        // 7. Render Team Blue
        const teamBlue = board.teamBlue || {
            title: 'الفريق الأزرق',
            color: '#00b4d8',
            cards: []
        };
        const blueCol = document.getElementById('cardsTeamBlueCol');
        if (blueCol) blueCol.style.setProperty('--team-color', teamBlue.color || '#00b4d8');
        if (badgeBlue) badgeBlue.textContent = teamBlue.title || '🔵 الفريق الأزرق';
        renderCardsToColumn(deckBlue, teamBlue.cards || [], giftPos, teamBlue.color || '#00b4d8');

    } catch (err) {
        console.error('Error loading cards overlay data:', err);
    }
}

const CARD_GIF_MAP = {
    meteor: '/images/cards_gif/meteor.gif',
    nitro: '/images/cards_gif/nitro.gif',
    barrels: '/images/cards_gif/barrels.gif',
    fuel: '/images/cards_gif/fuel.gif',
    leak: '/images/cards_gif/leak.gif',
    rain: '/images/cards_gif/rain.gif',
    seagull: '/images/cards_gif/seagull.gif',
    toolbox: '/images/cards_gif/toolbox.gif',
    wind: '/images/cards_gif/wind.gif',
    // Fallbacks for legacy character types
    skeleton_bandana: '/images/cards_gif/barrels.gif',
    evoker_mage: '/images/cards_gif/meteor.gif',
    skeleton_cap: '/images/cards_gif/nitro.gif',
    hog_rider: '/images/cards_gif/fuel.gif',
    golem_pumpkin: '/images/cards_gif/toolbox.gif'
};

function getCardMediaSrc(card) {
    if (!card) return '/images/cards_gif/meteor.gif';
    if (card.customImage) return getImageSrc(card.customImage);
    const key = card.cardType || 'meteor';
    return CARD_GIF_MAP[key] || `/images/cards_gif/${key}.gif`;
}

function renderCardsToColumn(columnEl, cards, giftPos, teamColor) {
    if (!columnEl) return;

    const currentKey = Array.from(columnEl.children).map(c => c.getAttribute('data-card-key')).join('|');
    const newKey = cards.map(c => `${c.id}_${c.cardType}_${c.customImage || ''}_${c.customText || ''}_${c.count}_${c.giftImage}_${c.giftName || ''}_${giftPos}_${teamColor}`).join('|');

    if (currentKey !== newKey) {
        columnEl.innerHTML = '';
        cards.forEach(card => {
            const item = document.createElement('div');
            item.className = 'card-unit-item';
            item.setAttribute('data-card-key', `${card.id}_${card.cardType}_${card.customImage || ''}_${card.customText || ''}_${card.count}_${card.giftImage}_${card.giftName || ''}_${giftPos}_${teamColor}`);
            item.setAttribute('data-card-id', card.id);

            const cardSrc = getCardMediaSrc(card);
            const giftSrc = getImageSrc(card.giftImage);
            const displayText = (card.customText !== undefined && card.customText !== null)
                ? card.customText
                : (card.count ? `X${card.count}` : '');

            const isLikes = (card.giftName && card.giftName.includes('تكبيس')) || (card.giftImage && card.giftImage.includes('tiktok_likes'));
            const isFollow = (card.giftName && card.giftName.includes('فولو')) || (card.giftImage && card.giftImage.includes('tiktok_follow'));
            const badgeTypeClass = isLikes ? 'badge-likes' : (isFollow ? 'badge-follow' : '');

            item.innerHTML = `
                <div class="card-gift-badge pos-${giftPos} ${badgeTypeClass}" title="${escapeHtml(card.giftName || 'هدية')}">
                    <img src="${giftSrc}" alt="${escapeHtml(card.giftName || '')}" onerror="this.src='/images/rose.png'">
                </div>
                <img class="card-character-img" src="${cardSrc}" alt="Card Item" onerror="this.src='/images/cards_gif/meteor.gif'">
                ${displayText ? `<div class="troop-count-badge card-bottom-text">${escapeHtml(displayText)}</div>` : ''}
            `;
            columnEl.appendChild(item);
        });
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
