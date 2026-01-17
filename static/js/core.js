// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const video = document.getElementById('video');
const cameraUI = document.getElementById('camera-ui');
const uploadUI = document.getElementById('upload-ui');
const processingView = document.getElementById('processing-view');
const previewImg = document.getElementById('preview-img');
const loading = document.getElementById('loading');
const resultsData = document.getElementById('results-data');
const errorSection = document.getElementById('error-section');
const errorMsg = document.getElementById('error-msg');
const historyList = document.getElementById('history-list');
const emptyHistory = document.getElementById('empty-history');
const resultsModal = document.getElementById('results-modal');

const flipBtn = document.getElementById('flip-camera');
let isMirrored = false;
let videoTrack = null;
let isEditMode = false;
let isManualMode = false;
let datePicker = null;

// Initialize Premium Date Picker
function initDatePicker() {
    datePicker = flatpickr("#manual-date", {
        locale: "vn",
        dateFormat: "d/m/Y",
        disableMobile: "true",
        theme: "dark",
        defaultDate: "today",
        monthSelectorType: "dropdown",
        allowInput: true, // Allow direct typing as a fallback
        onOpen: function (selectedDates, dateStr, instance) {
            // Ensure the year input is properly visible when opened
            setTimeout(() => {
                const yearInput = instance.calendarContainer.querySelector('.cur-year');
                if (yearInput) yearInput.style.display = 'inline-block';
            }, 10);
        }
    });
}
initDatePicker();

// Populate Province Select for Manual Input
function populateProvinces() {
    const select = document.getElementById('manual-province');
    if (!select) return;

    // Simple grouped list from PROVINCE_MAP keys
    const provinces = [
        "TP.HCM", "An Giang", "Bạc Liêu", "Bến Tre", "Bình Dương", "Bình Phước", "Bình Thuận", "Cà Mau", "Cần Thơ", "Đà Lạt",
        "Đồng Nai", "Đồng Tháp", "Hậu Giang", "Kiên Giang", "Long An", "Sóc Trăng", "Tây Ninh", "Tiền Giang", "Trà Vinh", "Vĩnh Long", "Vũng Tàu",
        "Đà Nẵng", "Đắk Lắk", "Đắk Nông", "Gia Lai", "Khánh Hòa", "Kon Tum", "Ninh Thuận", "Phú Yên", "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Trị", "Thừa Thiên Huế",
        "Miền Bắc"
    ];

    provinces.sort().forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        opt.className = "bg-[var(--bg-main)] text-[var(--text-main)]";
        select.appendChild(opt);
    });
}
populateProvinces();

function formatProvinceName(name) {
    if (!name) return '---';
    let cleanName = name.trim().replace(/tp\.\s*/gi, '');
    return cleanName.toLowerCase().split(/\s+/).filter(w => w).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
