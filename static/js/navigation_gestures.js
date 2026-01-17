// --- Settings ---
const settingsModal = document.getElementById('settings-modal');
const apiKeyInput = document.getElementById('api-key-input');

if (apiKeyInput) {
    apiKeyInput.value = localStorage.getItem('gemini_api_key') || '';
}

const openSettingsBtn = document.getElementById('open-settings');
if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => openModal(settingsModal));
}

const closeSettingsBtn = document.getElementById('close-settings');
if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', () => closeModal(settingsModal));
}

const saveSettingsBtn = document.getElementById('save-settings');
if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
        // Save API Key
        const key = apiKeyInput.value.trim();
        if (key) localStorage.setItem('gemini_api_key', key);
        else localStorage.removeItem('gemini_api_key');

        // Save Theme
        const selectedTheme = themeSelect.value;
        localStorage.setItem('app_theme', selectedTheme);
        applyTheme(selectedTheme);

        closeModal(settingsModal);
    });
}

// --- Modal & Back Button Management ---
const MODAL_STATE = 'modal-open';
const HISTORY_STATE = 'history-open';
const RESULTS_STATE = 'results-view';

function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
    window.history.pushState(MODAL_STATE, '');
}

function closeModal(modal, isPopState = false) {
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (modal === cameraUI) stopCamera();

    if (!isPopState) {
        window.history.back();
    }
}

window.addEventListener('popstate', (event) => {
    const state = event.state;

    // 1. Handle Modals & Drawer
    if (state !== MODAL_STATE) {
        [resultsModal, settingsModal, cameraUI].forEach(modal => {
            if (modal && modal.classList.contains('active')) {
                modal.classList.remove('active');
                if (modal === cameraUI) stopCamera();
                document.body.style.overflow = '';
            }
        });
    }

    // Close History Drawer if not in HISTORY_STATE
    if (state !== HISTORY_STATE) {
        const drawer = document.getElementById('history-drawer');
        const overlay = document.getElementById('history-drawer-overlay');
        if (drawer && drawer.classList.contains('open')) {
            drawer.classList.remove('open');
            overlay.classList.remove('visible');
            document.body.style.overflow = '';
        }
    }

    // 2. Handle Results View: If state is null (Home), reset UI
    if (!state) {
        resetUI();
    }
});

// Results Modal Events
const closeResultsBtn = document.getElementById('close-results');
if (closeResultsBtn) closeResultsBtn.addEventListener('click', () => closeModal(resultsModal));

const closeResultsBtnBottom = document.getElementById('close-results-btn');
if (closeResultsBtnBottom) closeResultsBtnBottom.addEventListener('click', () => closeModal(resultsModal));

window.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal(settingsModal);
    if (e.target === resultsModal) closeModal(resultsModal);
});

// PWA Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('SW Registered!', reg);
        }).catch(err => {
            console.log('SW Registration failed!', err);
        });
    });
}

// --- Swipe Gesture Handler ---
class SwipeGestureHandler {
    constructor(modalElement, contentElement, onClose) {
        this.modal = modalElement;
        this.content = contentElement;
        this.onClose = onClose;
        this.startY = 0;
        this.currentY = 0;
        this.isSwiping = false;
        this.init();
    }

    init() {
        if (!this.content) return;
        // Touch Events
        this.content.addEventListener('touchstart', (e) => this.onStart(e.touches[0].pageY), { passive: true });
        window.addEventListener('touchmove', (e) => this.onMove(e.touches[0].pageY), { passive: false });
        window.addEventListener('touchend', () => this.onEnd());

        // Mouse Events
        this.content.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            this.onStart(e.pageY);
        });
        window.addEventListener('mousemove', (e) => this.onMove(e.pageY));
        window.addEventListener('mouseup', () => this.onEnd());
    }

    onStart(y) {
        if (!this.modal || !this.modal.classList.contains('active')) return;
        this.startY = y;
        this.isSwiping = true;
        this.content.classList.add('swiping');
    }

    onMove(y) {
        if (!this.isSwiping) return;
        this.currentY = y - this.startY;

        if (this.currentY < 0) this.currentY = 0;

        this.content.style.setProperty('--swipe-y', `${this.currentY}px`);

        const opacity = 1 - (this.currentY / (window.innerHeight * 0.5));
        this.modal.style.opacity = Math.max(0.5, opacity);
    }

    onEnd() {
        if (!this.isSwiping) return;
        this.isSwiping = false;
        this.content.classList.remove('swiping');

        const threshold = window.innerHeight * 0.25;

        if (this.currentY > threshold) {
            this.onClose();
        }

        this.content.style.removeProperty('--swipe-y');
        this.modal.style.opacity = '';
        this.currentY = 0;
    }
}

// Initialize Gestures
if (resultsModal) {
    new SwipeGestureHandler(resultsModal, resultsModal.querySelector('.modal-content-glass'), () => closeModal(resultsModal));
}
if (settingsModal) {
    new SwipeGestureHandler(settingsModal, settingsModal.querySelector('.premium-glass'), () => closeModal(settingsModal));
}
if (cameraUI) {
    new SwipeGestureHandler(cameraUI, cameraUI.querySelector('.camera-wrapper'), () => closeModal(cameraUI));
}

function toggleMobileHistory(isPopState = false) {
    const drawer = document.getElementById('history-drawer');
    const overlay = document.getElementById('history-drawer-overlay');

    if (!drawer.classList.contains('open')) {
        drawer.classList.add('open');
        overlay.classList.add('visible');
        document.body.style.overflow = 'hidden';
        if (!isPopState) window.history.pushState(HISTORY_STATE, '');
    } else {
        drawer.classList.remove('open');
        overlay.classList.remove('visible');
        document.body.style.overflow = '';
        if (!isPopState) window.history.back();
    }
}
