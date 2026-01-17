// --- Theme Management ---
const themeSelect = document.getElementById('theme-select');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

function applyTheme(theme) {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let targetTheme = theme;
    if (theme === 'auto') {
        targetTheme = systemDark ? 'dark' : 'light';
    }

    root.setAttribute('data-theme', targetTheme);

    // Update Meta Theme Color for mobile status bars
    const statusBarColor = getComputedStyle(root).getPropertyValue('--status-bar').trim();
    if (themeColorMeta) themeColorMeta.setAttribute('content', statusBarColor);

    // Update Apple status bar style
    const appleStatusMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (appleStatusMeta) {
        appleStatusMeta.setAttribute('content', targetTheme === 'light' ? 'default' : 'black-translucent');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('app_theme') || 'auto';
    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
    }
    applyTheme(savedTheme);
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (localStorage.getItem('app_theme') === 'auto' || !localStorage.getItem('app_theme')) {
        applyTheme('auto');
    }
});

// Immediate initialization to prevent flash
initTheme();
