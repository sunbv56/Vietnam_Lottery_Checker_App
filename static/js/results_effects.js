function renderNavigation() {
    let navContainer = document.getElementById('batch-nav');
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.id = 'batch-nav';
        navContainer.className = 'flex justify-between items-center gap-4 mt-6 px-2';
        resultsData.parentNode.insertBefore(navContainer, resultsData);
    }

    if (currentBatch.length <= 1) {
        navContainer.classList.add('hidden');
        return;
    }

    navContainer.classList.remove('hidden');
    navContainer.innerHTML = `
        <button onclick="prevTicket()" class="w-12 h-12 rounded-2xl premium-glass flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all hover:bg-white/10 ${currentIndex === 0 ? 'opacity-20 pointer-events-none' : ''}">
            <i class="fas fa-arrow-left"></i>
        </button>
        <div class="flex flex-col items-center">
            <span class="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 mb-1">Vé ${currentIndex + 1}/${currentBatch.length}</span>
            <div class="flex gap-1.5">
                ${currentBatch.map((_, i) => `<div class="w-1.5 h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-orange-500 w-4' : 'bg-white/10'}"></div>`).join('')}
            </div>
        </div>
        <button onclick="nextTicket()" class="w-12 h-12 rounded-2xl premium-glass flex items-center justify-center text-[var(--text-muted)] hover:text-white transition-all hover:bg-white/10 ${currentIndex === currentBatch.length - 1 ? 'opacity-20 pointer-events-none' : ''}">
            <i class="fas fa-arrow-right"></i>
        </button>
    `;
}

function nextTicket() {
    if (currentIndex < currentBatch.length - 1) {
        currentIndex++;
        showBatchResults();
    }
}

function prevTicket() {
    if (currentIndex > 0) {
        currentIndex--;
        showBatchResults();
    }
}

function showResults(data, autoOpen = false) {
    // Push RESULTS_STATE if we are in the base/home state (null)
    if (window.history.state === null) {
        window.history.pushState(RESULTS_STATE, '');
    }

    // Reset edit mode if it was on
    if (isEditMode) toggleEditMode();

    // Clear any previous error/pending state if we are showing a success result
    errorSection.classList.add('hidden');
    resultsData.classList.remove('hidden');

    // Main UI
    document.getElementById('res-province').textContent = formatProvinceName(data.info.province);
    document.getElementById('res-date').textContent = data.info.date;
    document.getElementById('res-number').textContent = data.info.number;

    // Modal UI
    document.getElementById('modal-res-province').textContent = formatProvinceName(data.info.province);
    document.getElementById('modal-res-date').textContent = data.info.date;
    document.getElementById('modal-res-number').textContent = data.info.number;
    renderResultsTable(data.results, 'results-table-container');
    renderResultsTable(data.results, 'modal-results-table-container');

    const winStatus = document.getElementById('win-status');
    const modalWinContainer = document.getElementById('modal-win-container');
    const modalLoseContainer = document.getElementById('modal-lose-container');
    const modalPrizeDisplay = document.getElementById('modal-prize-display');

    let winHtml = '';
    let modalPrizeHtml = '';
    const isWin = data.win_details && data.win_details.length > 0;

    if (isWin) {
        modalWinContainer.classList.remove('hidden');
        modalLoseContainer.classList.add('hidden');
        document.getElementById('share-win-btn').classList.remove('hidden');

        const maxPrize = Math.max(...data.win_details.map(d => d.value));

        data.win_details.forEach(detail => {
            const val = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detail.value);
            const isBigWin = detail.value >= 10000000; // Big win if >= 10M

            // Main UI HTML
            winHtml += `
                <div class="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl text-center shadow-lg mb-4">
                    <i class="fas fa-trophy text-3xl mb-2 block"></i>
                    <h4 class="font-extrabold text-xl uppercase">${detail.name}</h4>
                    <p class="text-3xl font-black mt-1 text-white">${val}</p>
                </div>
            `;

            // Modal UI HTML
            modalPrizeHtml += `
                <div class="premium-glass p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-green-500/20 to-emerald-500/5 border-green-500/30 text-center relative overflow-hidden shadow-2xl flex flex-col items-center justify-center min-h-[160px] md:min-h-[200px]">
                    <div class="prize-badge mb-4 md:mb-6 ${detail.name.includes('Đặc Biệt') ? 'gold-glow' : 'silver-glow'}">
                        <i class="fas fa-star text-[10px]"></i>
                        <span class="text-[10px] md:text-[12px] opacity-80">${detail.name}</span>
                    </div>
                    <p class="text-3xl md:text-5xl lg:text-7xl font-black text-[var(--text-main)] win-glow mb-2 md:mb-4 tracking-tight uppercase leading-none break-words w-full">${val}</p>
                    ${isBigWin ? '<p class="text-green-500 text-[10px] md:text-[12px] font-bold uppercase tracking-[0.2em] mt-2 animate-pulse">JACKPOT WINNER!</p>' : ''}
                </div>
            `;
        });
        modalPrizeDisplay.innerHTML = modalPrizeHtml;
        startConfetti();

        // Enhanced Sound & Haptic based on prize
        if (maxPrize >= 10000000) playSound('big_win');
        else playSound('small_win');

    } else {
        modalWinContainer.classList.add('hidden');
        modalLoseContainer.classList.remove('hidden');
        document.getElementById('share-win-btn').classList.add('hidden');

        if (data.status === 'NOT_READY') {
            winHtml = `
                <div class="premium-glass p-6 rounded-2xl text-center border-orange-500/30 bg-orange-500/5">
                    <i class="fas fa-clock text-orange-500 mb-2 block text-2xl"></i>
                    <p class="font-bold text-orange-200">${data.message || 'Kết quả hiện chưa có chính thức. Vui lòng quay lại sau!'}</p>
                </div>
            `;
        } else {
            winHtml = `
                <div class="premium-glass p-6 rounded-2xl text-center border-[var(--glass-border)] bg-[var(--input-bg)]">
                    <i class="fas fa-heart text-pink-500 mb-2 block"></i>
                    <p class="font-bold text-[var(--text-muted)]">Không trúng giải - Chúc bạn may mắn lần sau!</p>
                </div>
            `;
            playSound('no_win');
        }
    }

    winStatus.innerHTML = winHtml;

    // Only auto-open modal if explicitly requested (history) or ONLY one ticket in batch
    if (autoOpen || (currentBatch && currentBatch.length === 1 && data.status === 'OK')) {
        openModal(resultsModal);
    }
}

// Simple Confetti
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    const colors = ['#ff5e3a', '#ff2a6d', '#fbbf24', '#34d399', '#60a5fa'];

    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            size: Math.random() * 8 + 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 5 + 2,
            angle: Math.random() * 6.28
        });
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, i) => {
            p.y += p.speed;
            p.x += Math.sin(p.angle) * 1.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, 6.28);
            ctx.fill();

            if (p.y > canvas.height) particles[i].y = -10;
        });
        if (resultsModal && resultsModal.classList.contains('active')) requestAnimationFrame(draw);
    }
    draw();
}

let audioCtx;

function playSound(type) {
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const playNote = (freq, start, duration, vol = 0.1, wave = 'sine') => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = wave;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, start);
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(vol, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
            osc.start(start);
            osc.stop(start + duration);
        };

        const now = audioCtx.currentTime;

        switch (type) {
            case 'small_win':
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                playNote(523.25, now, 0.4, 0.1, 'triangle'); // C5
                playNote(659.25, now + 0.1, 0.4, 0.1, 'triangle'); // E5
                playNote(783.99, now + 0.2, 0.4, 0.1, 'triangle'); // G5
                playNote(1046.50, now + 0.3, 0.6, 0.15, 'sine'); // C6
                break;
            case 'big_win':
                if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
                [523.25, 659.25, 783.99].forEach(f => playNote(f, now, 0.8, 0.1, 'square'));
                [659.25, 830.61, 1046.50].forEach(f => playNote(f, now + 0.3, 0.8, 0.1, 'square'));
                [783.99, 987.77, 1318.51].forEach(f => playNote(f, now + 0.6, 1.2, 0.2, 'sine'));
                break;
            case 'no_win':
                playNote(392.00, now, 0.15, 0.05, 'sine'); // G4
                playNote(329.63, now + 0.1, 0.2, 0.05, 'sine'); // E4
                break;
            case 'shutter':
                const shutterOsc = audioCtx.createOscillator();
                const shutterGain = audioCtx.createGain();
                shutterOsc.type = 'square';
                shutterOsc.frequency.setValueAtTime(1000, now);
                shutterOsc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
                shutterGain.gain.setValueAtTime(0.2, now);
                shutterGain.gain.linearRampToValueAtTime(0, now + 0.1);
                shutterOsc.connect(shutterGain);
                shutterGain.connect(audioCtx.destination);
                shutterOsc.start(now);
                shutterOsc.stop(now + 0.1);
                break;
        }
    } catch (e) {
        console.log('Audio Error:', e);
    }
}

async function downloadWinImage() {
    const data = currentBatch[currentIndex];
    if (!data || !data.win_details || data.win_details.length === 0) return;

    const detail = data.win_details[0]; // Primary prize
    const valNum = detail.value;
    const valStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(valNum);

    // Determine Tier
    let theme = {
        id: 'standard',
        primary: '#ff5e3a',
        accent: '#ff2a6d',
        bgStart: '#1a1b26',
        bgEnd: '#0a0b14',
        cardBg: 'rgba(255, 255, 255, 0.08)',
        glow: 'rgba(255, 94, 58, 0.15)',
        text: '#ffffff',
        badgeText: '#ff5e3a'
    };

    if (valNum >= 500000000) { // Grand Tier (>= 500M)
        theme = {
            id: 'grand',
            primary: '#fbbf24', // Gold
            accent: '#f59e0b',
            bgStart: '#1e1b10', // Dark Gold/Earth
            bgEnd: '#0a0904',
            cardBg: 'rgba(251, 191, 36, 0.1)',
            glow: 'rgba(251, 191, 36, 0.2)',
            text: '#fbbf24',
            badgeText: '#000000'
        };
    } else if (valNum >= 10000000) { // Major Tier (>= 10M)
        theme = {
            id: 'major',
            primary: '#e2e8f0', // Bright Silver
            accent: '#94a3b8',
            bgStart: '#0f172a', // Deeper Blue-Black
            bgEnd: '#020617',
            cardBg: 'rgba(255, 255, 255, 0.12)',
            glow: 'rgba(255, 255, 255, 0.1)',
            text: '#ffffff',
            badgeText: '#0f172a'
        };
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1200;
    canvas.height = 630;

    // 1. Background
    const baseGrad = ctx.createRadialGradient(600, 315, 0, 600, 315, 800);
    baseGrad.addColorStop(0, theme.bgStart);
    baseGrad.addColorStop(1, theme.bgEnd);
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 1200, 630);

    // 2. Ambient Lights
    const drawGlow = (x, y, radius, color) => {
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
        ctx.globalCompositeOperation = 'source-over';
    };
    drawGlow(0, 0, 400, theme.glow);
    drawGlow(1200, 630, 500, theme.glow);

    // 2.5 Background Watermark
    ctx.save();
    ctx.globalAlpha = theme.id === 'grand' ? 0.08 : 0.05;
    ctx.font = '280px Be Vietnam Pro, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = theme.primary;
    ctx.fillText('🏆', 600, 420);

    // Tier Specific Effects
    if (theme.id === 'grand' || theme.id === 'major') {
        const drawStar = (x, y, radius, color) => {
            ctx.save();
            ctx.beginPath();
            ctx.translate(x, y);
            ctx.moveTo(0, 0 - radius);
            for (let i = 0; i < 5; i++) {
                ctx.rotate(Math.PI / 5);
                ctx.lineTo(0, 0 - (radius * 0.4));
                ctx.rotate(Math.PI / 5);
                ctx.lineTo(0, 0 - radius);
            }
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.restore();
        };

        const starCount = theme.id === 'grand' ? 60 : 40;
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * 1200;
            const y = Math.random() * 630;
            const size = Math.random() * (theme.id === 'grand' ? 8 : 6) + 2;
            ctx.globalAlpha = Math.random() * 0.4 + 0.1;

            if (Math.random() > 0.7) {
                drawStar(x, y, size, theme.primary);
            } else {
                ctx.beginPath();
                ctx.arc(x, y, size / 3, 0, Math.PI * 2);
                ctx.fillStyle = theme.primary;
                ctx.fill();
            }
        }

        if (theme.id === 'major') {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            for (let i = 0; i < 3; i++) {
                const grad = ctx.createLinearGradient(0, 0, 1200, 630);
                grad.addColorStop(0, 'transparent');
                grad.addColorStop(Math.random() * 0.5 + 0.2, 'rgba(255, 255, 255, 0.05)');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.rotate((Math.random() - 0.5) * 0.1);
                ctx.fillRect(0, -1000, 2000, 2000);
            }
            ctx.restore();
        }
    }
    ctx.restore();

    // 3. Central Glass Card
    const cardWidth = 1000;
    const cardHeight = 450;
    const cardX = (1200 - cardWidth) / 2;
    const cardY = (630 - cardHeight) / 2 + 20;
    const radius = 40;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;

    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(cardX, cardY, cardWidth, cardHeight, radius) : ctx.rect(cardX, cardY, cardWidth, cardHeight);

    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    cardGrad.addColorStop(0, theme.cardBg);
    cardGrad.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = cardGrad;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
    borderGrad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    borderGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.strokeStyle = borderGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. Header Section
    const logoGrad = ctx.createLinearGradient(540, 0, 660, 0);
    logoGrad.addColorStop(0, theme.primary);
    logoGrad.addColorStop(1, theme.accent || theme.primary);
    ctx.fillStyle = logoGrad;
    ctx.font = '800 32px Be Vietnam Pro, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DÒ VÉ SỐ AI', 600, 60);

    ctx.font = '700 12px Be Vietnam Pro, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('OFFICIAL VERIFIED RESULT', 600, 85);

    // 5. Winning Content
    const prizeLabel = detail.name.toUpperCase();
    ctx.font = '800 18px Be Vietnam Pro, sans-serif';
    const textWidth = ctx.measureText(prizeLabel).width;
    const badgeW = textWidth + 40;
    const badgeH = 34;
    const badgeX = 600 - badgeW / 2;
    const badgeY = cardY + 60;

    if (theme.id === 'major') {
        const silverBadgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY + badgeH);
        silverBadgeGrad.addColorStop(0, '#f8fafc');
        silverBadgeGrad.addColorStop(0.5, '#cbd5e1');
        silverBadgeGrad.addColorStop(1, '#94a3b8');
        ctx.save();
        ctx.fillStyle = silverBadgeGrad;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = '#0f172a';
    } else {
        ctx.fillStyle = theme.id === 'grand' ? theme.primary : 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 17) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
        ctx.fill();
        ctx.fillStyle = theme.badgeText;
    }
    ctx.fillText(prizeLabel, 600, badgeY + 23);

    ctx.shadowColor = theme.id === 'grand' ? 'rgba(251, 191, 36, 0.6)' : theme.id === 'major' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 94, 58, 0.5)';
    ctx.shadowBlur = 40;
    ctx.fillStyle = theme.text;
    ctx.font = '900 110px Be Vietnam Pro, sans-serif';
    ctx.fillText(valStr, 600, cardY + 220);
    ctx.shadowBlur = 0;

    ctx.font = '600 24px Be Vietnam Pro, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText('CHÚC MỪNG BẠN ĐÃ TRÚNG GIẢI!', 600, cardY + 280);

    // 6. Footer Details
    const infoY = cardY + 360;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.moveTo(cardX + 100, infoY - 20);
    ctx.lineTo(cardX + cardWidth - 100, infoY - 20);
    ctx.stroke();

    const drawInfo = (label, value, x) => {
        ctx.textAlign = 'center';
        ctx.font = '800 12px Be Vietnam Pro, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillText(label, x, infoY);
        ctx.font = '700 24px Be Vietnam Pro, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(value, x, infoY + 35);
    };

    drawInfo('SỐ VÉ', data.info.number, 600 - 300);
    drawInfo('TỈNH THÀNH', formatProvinceName(data.info.province).toUpperCase(), 600);
    drawInfo('NGÀY MỞ', data.info.date, 600 + 300);

    ctx.font = '400 14px Outfit, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.textAlign = 'center';
    ctx.fillText('Kết quả được đối soát tự động từ hệ thống KQXS Xây Số', 600, 620);

    const link = document.createElement('a');
    link.download = `DoVeSoAI_Win_${data.info.number}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

function showError(msg) {
    processingView.classList.add('hidden');
    errorSection.classList.remove('hidden');

    errorSection.className = 'premium-glass border-red-500/30 rounded-3xl p-8 text-center animate-fade-in shadow-2xl';
    document.getElementById('error-icon').classList.remove('hidden');
    document.getElementById('pending-icon').classList.add('hidden');

    document.getElementById('error-title').textContent = 'Oops! Có lỗi rồi';
    errorMsg.textContent = msg || 'Lỗi không xác định';

    const btn = document.getElementById('error-action-btn');
    if (btn) {
        btn.textContent = 'Thử lại';
        btn.className = 'px-10 py-3 bg-red-500/20 text-red-400 rounded-2xl hover:bg-red-500/30 transition-all font-bold min-w-[150px]';
    }
}

function showPendingMessage(msg) {
    processingView.classList.add('hidden');
    errorSection.classList.remove('hidden');

    errorSection.className = 'premium-glass border-orange-500/30 rounded-3xl p-8 text-center animate-fade-in shadow-2xl';
    document.getElementById('error-icon').classList.add('hidden');
    document.getElementById('pending-icon').classList.remove('hidden');

    document.getElementById('error-title').textContent = 'Kết quả đang chờ';
    errorMsg.textContent = msg;

    const btn = document.getElementById('error-action-btn');
    if (btn) {
        btn.textContent = 'Quay lại';
        btn.className = 'px-10 py-3 bg-orange-500/20 text-orange-400 rounded-2xl hover:bg-orange-500/30 transition-all font-bold min-w-[150px]';
    }
}

function renderResultsTable(results, containerId = 'results-table-container') {
    const container = document.getElementById(containerId);
    if (!results) {
        container.classList.add('hidden');
        return;
    }
    container.classList.remove('hidden');

    let tableHtml = `
        <div class="premium-glass rounded-2xl overflow-hidden bg-[var(--input-bg)] border-[var(--glass-border)]">
            <table class="w-full text-sm">
                <thead class="bg-black/5 text-[10px] uppercase font-bold text-[var(--text-muted)] border-b border-[var(--glass-border)]">
                    <tr>
                        <th class="py-3 px-4 text-left">Giải</th>
                        <th class="py-3 px-4 text-center">Các số trúng</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--glass-border)]">
    `;

    const prizeOrder = ['Giải Đặc Biệt', 'Giải Nhất', 'Giải Nhì', 'Giải Ba', 'Giải Tư', 'Giải Năm', 'Giải Sáu', 'Giải Bảy', 'Giải Tám'];

    const sortedEntries = Object.entries(results).sort((a, b) => {
        const aIdx = prizeOrder.indexOf(a[0]);
        const bIdx = prizeOrder.indexOf(b[0]);
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
    });

    sortedEntries.forEach(([prize, numbers]) => {
        tableHtml += `
            <tr>
                <td class="py-3 px-4 font-bold text-[var(--text-muted)] text-xs">${prize}</td>
                <td class="py-3 px-4 text-center font-mono tracking-wider text-orange-400 font-bold">${Array.isArray(numbers) ? numbers.join(' - ') : numbers}</td>
            </tr>
        `;
    });

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = tableHtml;
}

// --- Manual Edit Logic ---
function toggleEditMode() {
    isEditMode = !isEditMode;
    const fields = ['res-province', 'res-date', 'res-number'];
    const btn = document.getElementById('edit-toggle-btn');
    const recheckContainer = document.getElementById('recheck-container');
    const scanNewBtn = document.getElementById('scan-new-btn');

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.contentEditable = isEditMode;
            if (isEditMode) {
                el.classList.add('bg-[var(--input-bg)]', 'rounded', 'px-2', 'py-1', 'border', 'border-[var(--glass-border)]');
            } else {
                el.classList.remove('bg-[var(--input-bg)]', 'rounded', 'px-2', 'py-1', 'border', 'border-[var(--glass-border)]');
            }
        }
    });

    if (isEditMode) {
        btn.innerHTML = '<i class="fas fa-times mr-1"></i>Hủy';
        btn.classList.replace('text-orange-400', 'text-red-400');
        recheckContainer.classList.remove('hidden');
        scanNewBtn.classList.add('hidden');
    } else {
        btn.innerHTML = '<i class="fas fa-edit mr-1"></i>Chỉnh sửa';
        btn.classList.replace('text-red-400', 'text-orange-400');
        recheckContainer.classList.add('hidden');
        scanNewBtn.classList.remove('hidden');
    }
}

async function reCheckManual() {
    const province = document.getElementById('res-province').textContent.trim();
    const date = document.getElementById('res-date').textContent.trim();
    const number = document.getElementById('res-number').textContent.trim();

    if (isEditMode) toggleEditMode(); // Turn off edit mode

    resultsData.classList.add('hidden');
    loading.classList.remove('hidden');
    document.getElementById('win-status').innerHTML = '';

    const apiKey = localStorage.getItem('gemini_api_key');

    try {
        const response = await fetch('/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                apiKey,
                manualInfo: { province, date, number }
            })
        });

        if (response.status === 202) {
            const data = await response.json();
            loading.classList.add('hidden');
            showPendingMessage(data.message);
            return;
        }

        const data = await response.json();
        loading.classList.add('hidden');

        if (data.results && data.results[0]) {
            const res = data.results[0];
            showResults(res);
            saveToHistory(res);
        } else {
            showError(data.error || 'Lỗi xử lý');
            resultsData.classList.remove('hidden');
        }
    } catch (err) {
        loading.classList.add('hidden');
        showError('Kết nối server thất bại: ' + err.message);
        resultsData.classList.remove('hidden');
    }
}
