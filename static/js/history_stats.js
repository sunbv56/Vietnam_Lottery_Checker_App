// --- History Logic ---
function saveToHistory(data) {
    let history = JSON.parse(localStorage.getItem('lottery_history') || '[]');
    const newItem = {
        id: Date.now(),
        timestamp: new Date().toLocaleString('vi-VN'),
        info: data.info,
        isWin: data.win_details && data.win_details.length > 0,
        win_details: data.win_details
    };
    history.unshift(newItem);
    history = history.slice(0, 50); // Keep last 50
    localStorage.setItem('lottery_history', JSON.stringify(history));
    renderHistory();
    renderStatistics();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('lottery_history') || '[]');
    if (history.length === 0) {
        if (emptyHistory) emptyHistory.style.display = 'block';
        if (historyList) historyList.innerHTML = '';
        return;
    }
    if (emptyHistory) emptyHistory.style.display = 'none';

    if (historyList) {
        historyList.innerHTML = history.map(item => `
            <div class="premium-glass p-4 rounded-2xl history-card cursor-pointer bg-[var(--input-bg)] border-[var(--glass-border)]" onclick='reShow(${JSON.stringify(item)})'>
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">${item.timestamp}</span>
                    ${item.isWin ? '<span class="px-2 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-bold rounded uppercase">Trúng giải</span>' : ''}
                </div>
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-bold text-sm text-[var(--text-main)]">${formatProvinceName(item.info.province)}</p>
                        <p class="text-xs text-[var(--text-muted)]">${item.info.date}</p>
                    </div>
                    <p class="text-lg font-black tracking-widest ${item.isWin ? 'text-green-400' : 'text-[var(--text-main)]'}">${item.info.number}</p>
                </div>
            </div>
        `).join('');
    }
}

function reShow(item) {
    resetUI();
    dropZone.classList.add('hidden');
    processingView.classList.remove('hidden');
    previewImg.classList.add('hidden'); // Hide preview for history recall
    loading.classList.add('hidden');

    // Set as current batch of 1 for navigation/history context
    currentBatch = [item];
    currentIndex = 0;

    renderNavigation(); // Ensure nav is hidden/updated for single item
    showResults(item, true); // showResults will handle history pushing and auto-opening modal
}

function clearHistory() {
    if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
        localStorage.removeItem('lottery_history');
        renderHistory();
        renderStatistics();
    }
}

// --- Statistics Logic ---
function renderStatistics() {
    const history = JSON.parse(localStorage.getItem('lottery_history') || '[]');
    let totalWin = 0;
    let luckyCount = 0;
    const scannedCount = history.length;

    history.forEach(item => {
        if (item.isWin && item.win_details) {
            luckyCount++;
            item.win_details.forEach(d => totalWin += d.value);
        }
    });

    const totalWinEl = document.getElementById('stat-total-win');
    const scannedEl = document.getElementById('stat-scanned');
    const luckyEl = document.getElementById('stat-lucky');

    if (totalWinEl) totalWinEl.textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalWin);
    if (scannedEl) scannedEl.textContent = scannedCount;
    if (luckyEl) luckyEl.textContent = luckyCount;
}

// Initial render
renderHistory();
renderStatistics();
