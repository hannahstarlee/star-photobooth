// script.js for starbooth

const beginBtn = document.getElementById("begin");
const startCameraBtn = document.getElementById("start-camera");
const startBtn = document.getElementById("start-btn");
const backToLandingBtn = document.getElementById("back-to-landing");
const backToSetupBtn = document.getElementById("back-to-setup");

const landing = document.querySelector(".landing");
const setup = document.getElementById("setup");
const photobooth = document.getElementById("photobooth");

const camera = document.getElementById("camera");
const preview = document.getElementById("preview");
const finalStrip = document.getElementById("final-strip");
const photoCounter = document.querySelector(".photo-counter");

const filterSelect = document.getElementById("filter");
const frameSelect = document.getElementById("frame");

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
const finalWrapper = document.getElementById("final-wrapper");

let photos = [];
const photoLimit = 6;
let stream = null;
let isCapturing = false;

// navigation
beginBtn.addEventListener("click", () => {
    landing.classList.add("hidden");
    setup.classList.remove("hidden");
});

backToLandingBtn.addEventListener("click", () => {
    setup.classList.add("hidden");
    landing.classList.remove("hidden");
});

backToSetupBtn.addEventListener("click", () => {
    photobooth.classList.add("hidden");
    setup.classList.remove("hidden");
    stopCamera();
    resetPhotobooth();
    finalStrip.classList.remove('active');
    document.querySelector('.photobooth').classList.remove('hide-preview');
});

// camera functions
function startCamera() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        })
        .then(newStream => {
            stream = newStream;
            camera.srcObject = stream;
            camera.play();
            applyFilterToVideo();
        })
        .catch(err => {
            console.error("camera access error:", err);
            alert("camera not available — please check browser permissions");
        });
    } else {
        alert("getUserMedia is not supported in this browser.");
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        camera.srcObject = null;
        stream = null;
    }
}

// move from setup → photobooth
startCameraBtn.addEventListener("click", () => {
    setup.classList.add("hidden");
    photobooth.classList.remove("hidden");
    startCamera();
    resetPhotobooth();
});

// filter handling
filterSelect.addEventListener("change", () => {
    if (camera.srcObject) {
        applyFilterToVideo();
    }
});

function applyFilterToVideo() {
    const filter = filterSelect?.value || "none";
    let filterStyle = "";

    switch (filter) {
        case "pink-glow":
            filterStyle = "brightness(1.1) contrast(1.1) saturate(1.2) sepia(0.1)";
            break;
        case "milky-way":
            filterStyle = "brightness(1.05) contrast(0.95) saturate(0.8) hue-rotate(5deg)";
            break;
        case "soft-blur":
            filterStyle = "blur(1px) brightness(1.05)";
            break;
        case "bw":
            filterStyle = "grayscale(1) contrast(1.1)";
            break;
        default:
            filterStyle = "none";
    }

    camera.style.filter = filterStyle;
}

// take photo
startBtn.addEventListener("click", () => {
    if (isCapturing) return;
    if (photos.length >= photoLimit) {
        alert("you've reached the max pics.");
        return;
    }
    startCountdown();
});

function startCountdown() {
    isCapturing = true;
    let count = 3;
    
    const countdownEl = document.createElement("div");
    countdownEl.className = "countdown";
    countdownEl.textContent = count;
    document.querySelector(".preview-container").appendChild(countdownEl);
    
    const interval = setInterval(() => {
        count--;
        countdownEl.textContent = count;
        
        if (count === 0) {
            clearInterval(interval);
            countdownEl.remove();
            capturePhoto();
            isCapturing = false;
        }
    }, 1000);
}

function capturePhoto() {
    if (!camera.videoWidth || !camera.videoHeight) {
        alert("camera not ready yet.");
        return;
    }

    // flash effect
    const flash = document.createElement("div");
    flash.className = "flash";
    document.querySelector(".preview-container").appendChild(flash);
    setTimeout(() => flash.remove(), 200);

    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    context.drawImage(camera, 0, 0, canvas.width, canvas.height);
    applyFilterToCanvas();

    const photo = canvas.toDataURL("image/png");
    photos.push(photo);
    updatePreview();

    if (photos.length === photoLimit) {
        document.getElementById("select-four").classList.remove("hidden");
    }
}

function applyFilterToCanvas() {
    const filter = filterSelect?.value || "none";
    context.globalAlpha = 1;

    switch (filter) {
        case "pink-glow":
            context.fillStyle = "rgba(255, 192, 203, 0.15)";
            context.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case "milky-way":
            context.fillStyle = "rgba(220, 220, 255, 0.1)";
            context.fillRect(0, 0, canvas.width, canvas.height);
            break;
        case "soft-blur":
            context.filter = "blur(1px)";
            break;
        case "bw":
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = avg;
                data[i + 1] = avg;
                data[i + 2] = avg;
            }
            context.putImageData(imageData, 0, 0);
            break;
        default:
            context.filter = "none";
    }
}

function updatePreview() {
  preview.innerHTML = "";
  photoCounter.textContent = `photo ${photos.length} of ${photoLimit}`;

  // fill 6 slots, with photo thumbnails or placeholders
  for (let i = 0; i < photoLimit; i++) {
    if (photos[i]) {
      const img = document.createElement("img");
      img.src = photos[i];
      img.alt = "captured photo";
      img.className = "thumbnail";
      img.dataset.index = i;

      img.addEventListener("click", () => {
        img.classList.toggle("selected");
        const selected = preview.querySelectorAll(".selected");
        if (selected.length > 4) {
          img.classList.remove("selected");
          alert("only choose 4 photos for your strip!");
        }
      });

      preview.appendChild(img);
    } else {
      // placeholder slot
      const placeholder = document.createElement("div");
      placeholder.className = "thumbnail";
      placeholder.style.background = "#f9f5f5";
      placeholder.style.border = "2px dashed #f2dcdc";
      placeholder.style.width = "120px";
      placeholder.style.height = "120px";
      placeholder.style.borderRadius = "12px";
      preview.appendChild(placeholder);
    }
  }

  if (photos.length === photoLimit) {
    document.getElementById("select-four").classList.remove("hidden");
  }
}

const selectBtn = document.getElementById("select-four");
const resetBtn = document.getElementById("reset");
const saveBtn = document.getElementById("save");

selectBtn.addEventListener("click", () => {
    const selected = [...preview.querySelectorAll(".selected")];
    if (selected.length !== 4) {
        alert("please select exactly 4 photos.");
        return;
    }

    const selectedIndexes = selected.map(img => parseInt(img.dataset.index));
    const chosen = selectedIndexes.map(i => photos[i]);
    renderFinalStrip(chosen);

    saveBtn.classList.remove("hidden");
    resetBtn.classList.remove("hidden");
    backToSetupBtn.classList.remove("hidden");
    selectBtn.classList.add("hidden");
});

function renderFinalStrip(chosenPhotos) {
    finalStrip.innerHTML = "";
    finalStrip.classList.add('active');
    finalWrapper.classList.remove("hidden");
    document.querySelector('.photobooth').classList.add('hide-preview');

    const strip = document.createElement("div");
    const frameColor = frameSelect?.value || "white";
    strip.className = `strip ${frameColor}`;

    chosenPhotos.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        const filter = filterSelect?.value || "none";
        switch (filter) {
            case "pink-glow":
                img.style.filter = "brightness(1.1) contrast(1.1) saturate(1.2) sepia(0.1)";
                break;
            case "milky-way":
                img.style.filter = "brightness(1.05) contrast(0.95) saturate(0.8) hue-rotate(5deg)";
                break;
            case "soft-blur":
                img.style.filter = "blur(1px) brightness(1.05)";
                break;
            case "bw":
                img.style.filter = "grayscale(1) contrast(1.1)";
                break;
            default:
                img.style.filter = "none";
        }
        strip.appendChild(img);
    });

    const label = document.createElement("p");
    label.className = "strip-signature";
    label.textContent = "starbooth ˙⋆✮";

    strip.appendChild(label);
    finalStrip.appendChild(strip);
}

function resetPhotobooth() {
    photos = [];
    preview.innerHTML = "";
    finalStrip.innerHTML = "";
    saveBtn.classList.add("hidden");
    resetBtn.classList.add("hidden");
    selectBtn.classList.add("hidden");
    backToSetupBtn.classList.add("hidden");
    finalWrapper.classList.add("hidden");
    photoCounter.textContent = "photo 0 of 6";
}

// reset everything
resetBtn.addEventListener("click", () => {
    resetPhotobooth();
    finalStrip.classList.remove('active');
    document.querySelector('.photobooth').classList.remove('hide-preview');
});

// save strip
saveBtn.addEventListener("click", () => {
    // find the current strip and its images
    const strip = finalStrip.querySelector('.strip');
    const imgs = strip.querySelectorAll('img');
    const frameClass = strip.className.replace('strip', '').trim();
    const signature = strip.querySelector('.strip-signature')?.textContent || '';

    // use square size for all
    const stripEl = strip.getBoundingClientRect();
    const stripWidth = Math.round(stripEl.width);
    const imgSize = Math.round(strip.querySelector('img').getBoundingClientRect().width);
    const gap = 19.2;
    const signatureHeight = 32;
    const paddingTop = 24;
    const paddingBottom = 19.2;
    const totalHeight = imgs.length * imgSize + (imgs.length - 1) * gap + signatureHeight + paddingTop + paddingBottom;
    const borderRadius = 16; // Match the CSS border-radius

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = stripWidth;
    exportCanvas.height = totalHeight;
    const ctx = exportCanvas.getContext('2d');

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Create rounded rectangle path
    ctx.beginPath();
    ctx.moveTo(borderRadius, 0);
    ctx.lineTo(stripWidth - borderRadius, 0);
    ctx.quadraticCurveTo(stripWidth, 0, stripWidth, borderRadius);
    ctx.lineTo(stripWidth, totalHeight - borderRadius);
    ctx.quadraticCurveTo(stripWidth, totalHeight, stripWidth - borderRadius, totalHeight);
    ctx.lineTo(borderRadius, totalHeight);
    ctx.quadraticCurveTo(0, totalHeight, 0, totalHeight - borderRadius);
    ctx.lineTo(0, borderRadius);
    ctx.quadraticCurveTo(0, 0, borderRadius, 0);
    ctx.closePath();
    ctx.clip();

    // draw frame background
    switch (frameClass) {
        case 'dusty': ctx.fillStyle = '#fff5f5'; break;
        case 'vintage': ctx.fillStyle = '#f8f4f2'; break;
        case 'modern': ctx.fillStyle = '#f0f0f0'; break;
        case 'pastel': ctx.fillStyle = '#f8f0ff'; break;
        default: ctx.fillStyle = '#fff';
    }
    ctx.fillRect(0, 0, stripWidth, totalHeight);

    // draw border
    ctx.strokeStyle = {
        'dusty': '#f2b5c8',
        'vintage': '#d4b5a0',
        'modern': '#333',
        'pastel': '#d4b5ff',
        'white': '#f2dcdc',
    }[frameClass] || '#f2dcdc';
    ctx.lineWidth = 4;
    ctx.stroke();

    // draw each image as a square, cropping to center
    let y = paddingTop;
    let loaded = 0;
    imgs.forEach((img, i) => {
        const photoImg = new window.Image();
        photoImg.src = img.src;
        photoImg.onload = () => {
            ctx.save();
            ctx.filter = img.style.filter || 'none';
            
            // Create rounded rectangle for image
            const imgX = (stripWidth - imgSize) / 2;
            ctx.beginPath();
            ctx.moveTo(imgX + borderRadius, y);
            ctx.lineTo(imgX + imgSize - borderRadius, y);
            ctx.quadraticCurveTo(imgX + imgSize, y, imgX + imgSize, y + borderRadius);
            ctx.lineTo(imgX + imgSize, y + imgSize - borderRadius);
            ctx.quadraticCurveTo(imgX + imgSize, y + imgSize, imgX + imgSize - borderRadius, y + imgSize);
            ctx.lineTo(imgX + borderRadius, y + imgSize);
            ctx.quadraticCurveTo(imgX, y + imgSize, imgX, y + imgSize - borderRadius);
            ctx.lineTo(imgX, y + borderRadius);
            ctx.quadraticCurveTo(imgX, y, imgX + borderRadius, y);
            ctx.closePath();
            ctx.clip();

            // crop to center square
            const minSide = Math.min(photoImg.naturalWidth, photoImg.naturalHeight);
            const sx = (photoImg.naturalWidth - minSide) / 2;
            const sy = (photoImg.naturalHeight - minSide) / 2;
            ctx.drawImage(photoImg, sx, sy, minSide, minSide, imgX, y, imgSize, imgSize);
            ctx.restore();
            
            y += imgSize + gap;
            loaded++;
            if (loaded === imgs.length) {
                // draw signature with proper font
                ctx.font = '16.8px "Patrick Hand", "Special Elite", "Quicksand", sans-serif';
                ctx.fillStyle = '#c7b6c9';
                ctx.textAlign = 'center';
                ctx.globalAlpha = 0.7;
                ctx.fillText(signature, stripWidth / 2, y + 12);
                ctx.globalAlpha = 1;
                
                // export with higher quality
                setTimeout(() => {
                    const link = document.createElement('a');
                    link.download = 'starbooth-strip.png';
                    link.href = exportCanvas.toDataURL('image/png', 1.0);
                    link.click();
                }, 100);
            }
        };
    });
});

// cleanup on page unload
window.addEventListener("beforeunload", () => {
    stopCamera();
});
