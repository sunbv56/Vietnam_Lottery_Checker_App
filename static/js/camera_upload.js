// --- Manual Input Mode ---
function showManualInput(e) {
    if (e) e.stopPropagation();
    isManualMode = true;
    uploadUI.classList.add('hidden');
    document.getElementById('manual-input-ui').classList.remove('hidden');

    // Auto-set today's date in DD/MM/YYYY
    const now = new Date();
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    document.getElementById('manual-date').value = `${d}/${m}/${y}`;
}

// Auto-format DD/MM/YYYY as user types
const manualDateInput = document.getElementById('manual-date');
if (manualDateInput) {
    manualDateInput.addEventListener('input', function (e) {
        let v = e.target.value.replace(/\D/g, '').slice(0, 8);
        if (v.length >= 5) {
            v = v.slice(0, 2) + '/' + v.slice(2, 4) + '/' + v.slice(4);
        } else if (v.length >= 3) {
            v = v.slice(0, 2) + '/' + v.slice(2);
        }
        e.target.value = v;
    });
}

function hideManualInput(e) {
    if (e) e.stopPropagation();
    isManualMode = false;
    document.getElementById('manual-input-ui').classList.add('hidden');
    uploadUI.classList.remove('hidden');
}

async function submitManualInput() {
    const province = document.getElementById('manual-province').value;
    const date = document.getElementById('manual-date').value.trim();
    const number = document.getElementById('manual-number').value.trim();

    if (!province || !date || !number) {
        alert('Vui lòng nhập đầy đủ thông tin: Tỉnh thành, Ngày và Số dự thưởng.');
        return;
    }

    if (number.length !== 6 || isNaN(number)) {
        alert('Số dự thưởng phải là 6 chữ số (ví dụ: 123456).');
        return;
    }

    const manualInfo = { province, date, number };
    const apiKey = localStorage.getItem('gemini_api_key');

    // Switch to loading UI
    hideManualInput();
    dropZone.classList.add('hidden');
    processingView.classList.remove('hidden');
    previewImg.classList.add('hidden'); // No image for manual input
    loading.classList.remove('hidden');
    resultsData.classList.add('hidden');

    try {
        const response = await fetch('/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ manualInfo, apiKey })
        });

        const data = await response.json();
        loading.classList.add('hidden');

        if (data.results && data.results[0]) {
            const res = data.results[0];
            if (res.status === 'OK') {
                currentBatch = [res];
                currentIndex = 0;
                showResults(res, true);
                saveToHistory(res);
            } else {
                showError(res.message || 'Không tìm thấy kết quả.');
            }
        } else {
            showError(data.error || 'Lỗi xử lý');
        }
    } catch (err) {
        loading.classList.add('hidden');
        showError('Kết nối server thất bại: ' + err.message);
    }
}

// --- Camera Logic ---
function isAndroid() {
    return /Android/i.test(navigator.userAgent);
}

function isIOS() {
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

const nativeCameraInput = document.getElementById('native-camera-input');

// Stop propagation on input clicks to ensure they don't trigger the drop-zone uploader
[fileInput, nativeCameraInput].forEach(input => {
    if (input) {
        input.addEventListener('click', (e) => e.stopPropagation());
    }
});

const openCameraBtn = document.getElementById('open-camera');
if (openCameraBtn) {
    openCameraBtn.addEventListener('click', async (e) => {
        e.stopPropagation();

        // Android & iOS use native camera app as requested
        if (isAndroid() || isIOS()) {
            setTimeout(() => {
                nativeCameraInput.click();
            }, 100);
            return;
        }

        // Desktop use the custom UI (improved)
        if (!navigator.mediaDevices?.getUserMedia) return alert('Trình duyệt không hỗ trợ camera');

        try {
            // Enumerating devices to decide if we show the flip button
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');

            if (flipBtn) {
                flipBtn.style.display = videoDevices.length > 1 ? 'flex' : 'none';
            }

            // Desktop try: high resolution, prioritize user-facing for laptops if environment not found
            const constraints = {
                video: {
                    facingMode: 'environment', // Will try environment first
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            };

            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn('Environment camera failed, trying default user camera');
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            video.srcObject = stream;
            videoTrack = stream.getVideoTracks()[0];

            // Auto-mirror if it looks like a front camera (user) or if only one camera on desktop
            const settings = videoTrack.getSettings();
            isMirrored = (settings.facingMode === 'user' || videoDevices.length === 1);
            video.classList.toggle('mirror', isMirrored);

            openModal(cameraUI);
        } catch (err) {
            alert('Lỗi camera: ' + err.message);
        }
    });
}

// Native camera result handling (Android)
if (nativeCameraInput) {
    nativeCameraInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) handleFiles(files);
    });
}

// Toggle Manual Input
const openManualBtn = document.getElementById('open-manual');
if (openManualBtn) {
    openManualBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showManualInput();
    });
}

const closeCameraBtn = document.getElementById('close-camera');
if (closeCameraBtn) {
    closeCameraBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal(cameraUI);
    });
}

if (flipBtn) {
    flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isMirrored = !isMirrored;
        video.classList.toggle('mirror', isMirrored);
    });
}

function stopCamera() {
    if (video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
    videoTrack = null;
}

const captureBtn = document.getElementById('capture-btn');
if (captureBtn) {
    captureBtn.addEventListener('click', (e) => {
        e.stopPropagation();

        // 1. Get natural video dimensions (full resolution)
        const vWidth = video.videoWidth;
        const vHeight = video.videoHeight;

        if (!vWidth || !vHeight) return alert('Camera chưa sẵn sàng');

        // 2. Create canvas with exact video dimensions (No cropping)
        const canvas = document.createElement('canvas');
        canvas.width = vWidth;
        canvas.height = vHeight;
        const ctx = canvas.getContext('2d');

        // 3. Handle mirroring if active
        if (isMirrored) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        // 4. Draw the entire video frame
        ctx.drawImage(video, 0, 0, vWidth, vHeight);

        const dataUrl = canvas.toDataURL('image/png');
        playSound('shutter');
        stopCamera();
        processImages([dataUrl]);
    });
}

// --- File Upload Logic ---
if (dropZone) {
    dropZone.addEventListener('click', (e) => {
        // Prevent if in manual mode or if clicking buttons (though propagation should stop them)
        if (isManualMode) return;
        if (e.target.closest('button')) return;

        fileInput.click();
    });
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (isManualMode) return;
        dropZone.classList.add('scale-[1.02]', 'border-orange-500');
    });
    dropZone.addEventListener('dragleave', () => {
        if (isManualMode) return;
        dropZone.classList.remove('scale-[1.02]', 'border-orange-500');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (isManualMode) return;
        dropZone.classList.remove('scale-[1.02]', 'border-orange-500');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) handleFiles(files);
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (isManualMode) return;
        const files = Array.from(e.target.files);
        if (files.length > 0) handleFiles(files);
    });
}

// --- Clipboard (Paste) Support ---
window.addEventListener('paste', (e) => {
    if (isManualMode) return;
    const items = e.clipboardData.items;
    const files = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const blob = items[i].getAsFile();
            if (blob) files.push(blob);
        }
    }
    if (files.length > 0) {
        // UI Feedback
        if (dropZone) {
            dropZone.classList.add('border-orange-500', 'bg-orange-500/10', 'scale-[1.02]');
            setTimeout(() => {
                dropZone.classList.remove('border-orange-500', 'bg-orange-500/10', 'scale-[1.02]');
            }, 500);
        }

        handleFiles(files);
    }
});

async function handleFiles(files) {
    const dataUrls = [];
    for (const file of files) {
        const url = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });
        dataUrls.push(url);
    }
    processImages(dataUrls);
}

function resetUI() {
    processingView.classList.add('hidden');
    errorSection.classList.add('hidden');
    dropZone.classList.remove('hidden');
    uploadUI.classList.remove('hidden');
    resultsData.classList.add('hidden');
    loading.classList.remove('hidden');
    previewImg.classList.remove('hidden');
    document.getElementById('results-table-container').classList.add('hidden');
    resultsModal.style.display = 'none';
    fileInput.value = ''; // Fix: allow re-uploading same file after error

    // Hide batch navigation
    const nav = document.getElementById('batch-nav');
    if (nav) nav.classList.add('hidden');

    // Close mobile history if open
    const drawer = document.getElementById('history-drawer');
    const overlay = document.getElementById('history-drawer-overlay');
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
}

let currentBatch = [];
let currentIndex = 0;
let batchErrors = [];

async function processImages(dataUrls) {
    resetUI();
    if (dataUrls.length === 0) return;

    dropZone.classList.add('hidden');
    processingView.classList.remove('hidden');
    previewImg.src = dataUrls[0]; // Preview first image

    const apiKey = localStorage.getItem('gemini_api_key');
    currentBatch = [];
    currentIndex = 0;
    batchErrors = [];

    for (let i = 0; i < dataUrls.length; i++) {
        if (dataUrls.length > 1) {
            loading.querySelector('p').textContent = `Đang xử lý ảnh ${i + 1}/${dataUrls.length}...`;
            previewImg.src = dataUrls[i];
        }

        try {
            const response = await fetch('/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: dataUrls[i], apiKey })
            });

            const data = await response.json();

            if (data.results && Array.isArray(data.results)) {
                data.results.forEach(res => {
                    res.imageUrl = dataUrls[i]; // Store image
                    if (res.status === 'OK' || res.status === 'NOT_READY') {
                        currentBatch.push(res);
                        saveToHistory(res);
                    } else {
                        batchErrors.push(res);
                    }
                });
            } else if (data.error) {
                batchErrors.push({ status: 'ERROR', message: data.error });
            }
        } catch (err) {
            console.error("Lỗi xử lý ảnh:", err);
            batchErrors.push({ status: 'ERROR', message: 'Kết nối mạng thất bại' });
        }
    }

    loading.classList.add('hidden');
    loading.querySelector('p').textContent = 'AI đang nhận diện số và tỉnh thành';

    if (currentBatch.length > 0) {
        showBatchResults();
        if (batchErrors.length > 0) {
            showBatchSummaryNotification();
        }
    } else {
        const errorMsgText = batchErrors.length > 0
            ? `Không thể nhận diện được vé số nào hợp lệ từ ${dataUrls.length} ảnh.`
            : 'Không thể nhận diện vé số.';
        showError(errorMsgText);
    }
}

function showBatchSummaryNotification() {
    // Create a temporary toast/notification for batch errors
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[2000] premium-glass px-6 py-4 rounded-2xl border-orange-500/30 text-orange-400 font-bold shadow-2xl animate-fade-in flex items-center gap-3 backdrop-blur-xl';
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>Phát hiện ${batchErrors.length} vé có lỗi hoặc chưa có kết quả.</span>
        <button onclick="this.parentElement.remove()" class="ml-2 opacity-50 hover:opacity-100"><i class="fas fa-times"></i></button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => { if (notification.parentNode) notification.remove(); }, 6000);
}

function showBatchResults() {
    if (!currentBatch || currentBatch.length === 0) return;

    const data = currentBatch[currentIndex];

    // Sync image
    if (data.imageUrl) {
        previewImg.src = data.imageUrl;
        previewImg.classList.remove('hidden');
    }

    if (data.status === 'OK') {
        showResults(data, false);
    } else if (data.status === 'NOT_READY') {
        showResults(data, false); // showResults supports showing messages
    }

    renderNavigation();
}
