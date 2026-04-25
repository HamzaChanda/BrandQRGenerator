const DEFAULT_LOGO_PATH = "circular preta logo (3).png";
const STORAGE_KEY = "pretaqr.settings.v1";

const els = {
    preset: document.getElementById("preset"),
    url: document.getElementById("url"),
    caption: document.getElementById("caption"),
    fg: document.getElementById("fg"),
    bg: document.getElementById("bg"),
    finder: document.getElementById("finder"),
    captionColor: document.getElementById("caption-color"),
    fgVal: document.getElementById("fg-val"),
    bgVal: document.getElementById("bg-val"),
    finderVal: document.getElementById("finder-val"),
    captionColorVal: document.getElementById("caption-color-val"),
    transparent: document.getElementById("transparent"),
    gradient: document.getElementById("gradient"),
    gradEnd: document.getElementById("grad-end"),
    gradEndVal: document.getElementById("grad-end-val"),
    gradAngle: document.getElementById("grad-angle"),
    gradAngleVal: document.getElementById("grad-angle-val"),
    gradientGroup: document.querySelector(".gradient-only"),
    style: document.getElementById("style"),
    finderStyle: document.getElementById("finder-style"),
    ecl: document.getElementById("ecl"),
    margin: document.getElementById("margin"),
    marginVal: document.getElementById("margin-val"),
    logoOn: document.getElementById("logo-on"),
    logoSource: document.getElementById("logo-source"),
    logoShape: document.getElementById("logo-shape"),
    dropzone: document.getElementById("dropzone"),
    logoFile: document.getElementById("logo-file"),
    logoClear: document.getElementById("logo-clear"),
    logoThumb: document.getElementById("logo-thumb"),
    dropzoneTitle: document.getElementById("dropzone-title"),
    logoSize: document.getElementById("logo-size"),
    logoSizeVal: document.getElementById("logo-size-val"),
    logoPad: document.getElementById("logo-pad"),
    logoPadVal: document.getElementById("logo-pad-val"),
    logoBgOn: document.getElementById("logo-bg-on"),
    preview: document.getElementById("qr-final"),
    status: document.getElementById("status"),
    dlSize: document.getElementById("dl-size"),
    reset: document.getElementById("reset"),
    btnSvg: document.getElementById("download-svg"),
    btnPng: document.getElementById("download-png"),
    btnJpg: document.getElementById("download-jpg"),
    btnCopy: document.getElementById("copy-svg"),
};

const PRESETS = {
    classic: {
        fg: "#000000", bg: "#ffffff", finder: "#000000", captionColor: "#222222",
        style: "square", finderStyle: "default",
        transparent: false, gradient: false, gradEnd: "#444444", gradAngle: 135,
        ecl: "H", margin: 2, logoOn: true, logoShape: "circle",
        logoSize: 22, logoPad: 8, logoBgOn: true,
    },
    branded: {
        fg: "#e6e9ee", bg: "#0d1b2a", finder: "#3ad15a", captionColor: "#e6e9ee",
        style: "dots-spaced", finderStyle: "rounded",
        transparent: false, gradient: false, gradEnd: "#3ad15a", gradAngle: 135,
        ecl: "H", margin: 2, logoOn: true, logoShape: "circle",
        logoSize: 22, logoPad: 8, logoBgOn: true,
    },
    midnight: {
        fg: "#a0c8ff", bg: "#0a0e1a", finder: "#7c5cff", captionColor: "#a0c8ff",
        style: "dots", finderStyle: "circle",
        transparent: false, gradient: true, gradEnd: "#7c5cff", gradAngle: 135,
        ecl: "H", margin: 2, logoOn: true, logoShape: "circle",
        logoSize: 22, logoPad: 8, logoBgOn: true,
    },
    sunset: {
        fg: "#ff6a3d", bg: "#fff5ec", finder: "#d6326b", captionColor: "#3a1a1a",
        style: "rounded", finderStyle: "rounded",
        transparent: false, gradient: true, gradEnd: "#d6326b", gradAngle: 90,
        ecl: "H", margin: 2, logoOn: true, logoShape: "rounded",
        logoSize: 20, logoPad: 8, logoBgOn: true,
    },
};

let defaultLogoDataUrl = null;
let uploadedLogoDataUrl = null;

function setStatus(msg, kind) {
    els.status.textContent = msg || "";
    els.status.className = "status" + (kind ? " " + kind : "");
    if (msg) {
        clearTimeout(setStatus._t);
        setStatus._t = setTimeout(() => setStatus(""), 2400);
    }
}

function fetchAsDataUrl(path) {
    return fetch(path)
        .then(r => { if (!r.ok) throw new Error("not found"); return r.blob(); })
        .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }));
}

function isFinderModule(r, c, count) {
    const inBox = (r0, c0) => r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, count - 7) || inBox(count - 7, 0);
}

function buildModulesPath(qr, count, cell, style) {
    let out = "";
    const radius = cell / 2;
    const dotR = style === "dots-spaced" ? radius * 0.78 : radius * 0.92;

    for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
            if (!qr.isDark(r, c)) continue;
            if (isFinderModule(r, c, count)) continue;

            if (style === "dots" || style === "dots-spaced") {
                const cx = c * cell + radius;
                const cy = r * cell + radius;
                out += `<circle cx="${cx}" cy="${cy}" r="${dotR}"/>`;
            } else if (style === "rounded") {
                const rr = cell * 0.35;
                out += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" rx="${rr}" ry="${rr}"/>`;
            } else {
                out += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}"/>`;
            }
        }
    }
    return out;
}

function buildFinderPatterns(count, cell, finderStyle, fg, accent) {
    const positions = [[0, 0], [0, count - 7], [count - 7, 0]];
    let out = "";
    for (const [r0, c0] of positions) {
        const x = c0 * cell;
        const y = r0 * cell;
        const outerW = 7 * cell;
        const innerSize = 3 * cell;
        const innerX = x + 2 * cell;
        const innerY = y + 2 * cell;
        const stroke = cell;

        if (finderStyle === "circle") {
            const cx = x + outerW / 2;
            const cy = y + outerW / 2;
            const outerR = (outerW - stroke) / 2;
            const innerR = innerSize / 2;
            out += `
                <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="none" stroke="${fg}" stroke-width="${stroke}"/>
                <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${accent}"/>
            `;
        } else {
            const rounded = finderStyle === "rounded";
            const outerRr = rounded ? cell * 1.6 : 0;
            const innerRr = rounded ? cell * 0.7 : 0;
            out += `
                <rect x="${x + stroke / 2}" y="${y + stroke / 2}" width="${outerW - stroke}" height="${outerW - stroke}" rx="${outerRr}" ry="${outerRr}" fill="none" stroke="${fg}" stroke-width="${stroke}"/>
                <rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" rx="${innerRr}" ry="${innerRr}" fill="${accent}"/>
            `;
        }
    }
    return out;
}

function escapeXml(s) {
    return s.replace(/[<>&"']/g, ch => ({
        "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
    }[ch]));
}

function activeLogoUrl(opts) {
    if (!opts.logoOn) return null;
    if (opts.logoSource === "upload") return uploadedLogoDataUrl;
    return defaultLogoDataUrl;
}

function buildSvg(opts) {
    const qr = qrcode(0, opts.ecl);
    qr.addData(opts.text);
    qr.make();
    const count = qr.getModuleCount();

    const targetSize = 1024;
    const cell = Math.max(2, Math.floor(targetSize / (count + opts.margin * 2)));
    const qrPx = cell * count;
    const marginPx = cell * opts.margin;
    const captionH = opts.caption ? cell * 6 : 0;
    const captionGap = opts.caption ? cell * 2 : 0;
    const W = qrPx + marginPx * 2;
    const H = W + captionH + captionGap;

    const modules = buildModulesPath(qr, count, cell, opts.style);
    const finders = buildFinderPatterns(count, cell, opts.finderStyle, opts.fg, opts.finder);

    const cx = marginPx + qrPx / 2;
    const cy = marginPx + qrPx / 2;
    const logoSizePx = qrPx * opts.logoRatio;
    const halfLogo = logoSizePx / 2;
    const padPx = logoSizePx * (opts.logoPad / 100);

    const bgRect = opts.transparent ? "" : `<rect width="${W}" height="${H}" fill="${opts.bg}"/>`;

    let defs = "";
    let modulesFill = opts.fg;
    if (opts.gradient) {
        const angle = opts.gradAngle * Math.PI / 180;
        const x2 = 50 + 50 * Math.cos(angle);
        const y2 = 50 + 50 * Math.sin(angle);
        const x1 = 100 - x2;
        const y1 = 100 - y2;
        defs += `
            <linearGradient id="modGrad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
                <stop offset="0%" stop-color="${opts.fg}"/>
                <stop offset="100%" stop-color="${opts.gradEnd}"/>
            </linearGradient>
        `;
        modulesFill = "url(#modGrad)";
    }

    const logoUrl = activeLogoUrl(opts);
    let logoEl = "";
    if (logoUrl) {
        const shape = opts.logoShape;
        const clipId = "logoClip";
        let clipShape;
        if (shape === "circle") {
            clipShape = `<circle cx="${cx}" cy="${cy}" r="${halfLogo}"/>`;
        } else if (shape === "rounded") {
            const rr = logoSizePx * 0.18;
            clipShape = `<rect x="${cx - halfLogo}" y="${cy - halfLogo}" width="${logoSizePx}" height="${logoSizePx}" rx="${rr}" ry="${rr}"/>`;
        } else {
            clipShape = `<rect x="${cx - halfLogo}" y="${cy - halfLogo}" width="${logoSizePx}" height="${logoSizePx}"/>`;
        }
        defs += `<clipPath id="${clipId}">${clipShape}</clipPath>`;

        let bgShape = "";
        if (opts.logoBgOn) {
            const bgFill = opts.transparent ? "#ffffff" : opts.bg;
            const bgR = halfLogo + padPx;
            if (shape === "circle") {
                bgShape = `<circle cx="${cx}" cy="${cy}" r="${bgR}" fill="${bgFill}"/>`;
            } else if (shape === "rounded") {
                const rr = (logoSizePx + padPx * 2) * 0.18;
                bgShape = `<rect x="${cx - halfLogo - padPx}" y="${cy - halfLogo - padPx}" width="${logoSizePx + padPx * 2}" height="${logoSizePx + padPx * 2}" rx="${rr}" ry="${rr}" fill="${bgFill}"/>`;
            } else {
                bgShape = `<rect x="${cx - halfLogo - padPx}" y="${cy - halfLogo - padPx}" width="${logoSizePx + padPx * 2}" height="${logoSizePx + padPx * 2}" fill="${bgFill}"/>`;
            }
        }

        logoEl = `
            ${bgShape}
            <image href="${logoUrl}" x="${cx - halfLogo}" y="${cy - halfLogo}" width="${logoSizePx}" height="${logoSizePx}" clip-path="url(#${clipId})" preserveAspectRatio="xMidYMid slice"/>
        `;
    }

    let captionEl = "";
    if (opts.caption) {
        const fontSize = cell * 4;
        const ty = W + captionGap + fontSize;
        captionEl = `<text x="${W / 2}" y="${ty}" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="${fontSize}" font-weight="600" fill="${opts.captionColor}">${escapeXml(opts.caption)}</text>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
        <defs>${defs}</defs>
        ${bgRect}
        <g transform="translate(${marginPx} ${marginPx})">
            <g fill="${modulesFill}">${modules}</g>
            <g>${finders.replace(/fill="([^"]+)"/g, (m, val) => val === opts.fg && opts.gradient ? `fill="url(#modGrad)"` : m)}</g>
        </g>
        <g transform="translate(${marginPx} ${marginPx})">${logoEl}</g>
        ${captionEl}
    </svg>`;
}

function currentOpts() {
    return {
        text: els.url.value || " ",
        caption: els.caption.value.trim(),
        fg: els.fg.value,
        bg: els.bg.value,
        finder: els.finder.value,
        captionColor: els.captionColor.value,
        transparent: els.transparent.checked,
        gradient: els.gradient.checked,
        gradEnd: els.gradEnd.value,
        gradAngle: parseInt(els.gradAngle.value, 10),
        style: els.style.value,
        finderStyle: els.finderStyle.value,
        ecl: els.ecl.value,
        margin: parseInt(els.margin.value, 10),
        logoOn: els.logoOn.checked,
        logoSource: els.logoSource.value,
        logoShape: els.logoShape.value,
        logoRatio: parseInt(els.logoSize.value, 10) / 100,
        logoPad: parseInt(els.logoPad.value, 10),
        logoBgOn: els.logoBgOn.checked,
    };
}

let currentSvg = "";

function syncLabels() {
    els.fgVal.textContent = els.fg.value;
    els.bgVal.textContent = els.bg.value;
    els.finderVal.textContent = els.finder.value;
    els.captionColorVal.textContent = els.captionColor.value;
    els.gradEndVal.textContent = els.gradEnd.value;
    els.gradAngleVal.textContent = els.gradAngle.value;
    els.marginVal.textContent = els.margin.value;
    els.logoSizeVal.textContent = els.logoSize.value;
    els.logoPadVal.textContent = els.logoPad.value;
    els.gradientGroup.classList.toggle("active", els.gradient.checked);
    if (uploadedLogoDataUrl) {
        els.logoThumb.src = uploadedLogoDataUrl;
        els.logoThumb.classList.remove("hidden");
        els.dropzoneTitle.textContent = "Custom logo loaded";
    } else {
        els.logoThumb.classList.add("hidden");
        els.logoThumb.removeAttribute("src");
        els.dropzoneTitle.textContent = "Drop your logo here";
    }
}

function render() {
    syncLabels();
    try {
        currentSvg = buildSvg(currentOpts());
        els.preview.innerHTML = currentSvg;
    } catch (e) {
        setStatus("Render error: " + e.message, "err");
    }
}

function applyPreset(name) {
    const p = PRESETS[name];
    if (!p) return;
    els.fg.value = p.fg;
    els.bg.value = p.bg;
    els.finder.value = p.finder;
    els.captionColor.value = p.captionColor;
    els.style.value = p.style;
    els.finderStyle.value = p.finderStyle;
    els.transparent.checked = p.transparent;
    els.gradient.checked = p.gradient;
    els.gradEnd.value = p.gradEnd;
    els.gradAngle.value = p.gradAngle;
    els.ecl.value = p.ecl;
    els.margin.value = p.margin;
    els.logoOn.checked = p.logoOn;
    els.logoShape.value = p.logoShape;
    els.logoSize.value = p.logoSize;
    els.logoPad.value = p.logoPad;
    els.logoBgOn.checked = p.logoBgOn;
}

function saveSettings() {
    try {
        const data = {
            opts: currentOpts(),
            preset: els.preset.value,
            uploadedLogo: uploadedLogoDataUrl,
            dlSize: els.dlSize.value,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        const o = data.opts;
        if (!o) return false;
        els.url.value = o.text === " " ? "" : o.text;
        els.caption.value = o.caption || "";
        els.fg.value = o.fg;
        els.bg.value = o.bg;
        els.finder.value = o.finder;
        els.captionColor.value = o.captionColor;
        els.transparent.checked = !!o.transparent;
        els.gradient.checked = !!o.gradient;
        els.gradEnd.value = o.gradEnd;
        els.gradAngle.value = o.gradAngle;
        els.style.value = o.style;
        els.finderStyle.value = o.finderStyle;
        els.ecl.value = o.ecl;
        els.margin.value = o.margin;
        els.logoOn.checked = !!o.logoOn;
        els.logoSource.value = o.logoSource;
        els.logoShape.value = o.logoShape;
        els.logoSize.value = Math.round(o.logoRatio * 100);
        els.logoPad.value = o.logoPad;
        els.logoBgOn.checked = !!o.logoBgOn;
        if (data.preset) els.preset.value = data.preset;
        if (data.dlSize) els.dlSize.value = data.dlSize;
        if (data.uploadedLogo) uploadedLogoDataUrl = data.uploadedLogo;
        return true;
    } catch {
        return false;
    }
}

function rasterize(format, size) {
    return new Promise((resolve, reject) => {
        const svg = currentSvg;
        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = Math.round(size * (img.naturalHeight / img.naturalWidth));
            const ctx = canvas.getContext("2d");
            if (format === "image/jpeg") {
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), format, 0.95);
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("svg load failed")); };
        img.src = url;
    });
}

function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

els.preset.addEventListener("change", () => {
    if (els.preset.value !== "custom") applyPreset(els.preset.value);
    render();
    saveSettings();
});

document.querySelectorAll(".controls input, .controls select").forEach(el => {
    if (el.id === "preset" || el.id === "logo-file") return;
    ["input", "change"].forEach(evt => {
        el.addEventListener(evt, () => {
            els.preset.value = "custom";
            render();
            saveSettings();
        });
    });
});

function handleLogoFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        setStatus("Please choose an image file", "err");
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        setStatus("Image too large (max 5 MB)", "err");
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        uploadedLogoDataUrl = reader.result;
        els.logoSource.value = "upload";
        els.logoOn.checked = true;
        syncLabels();
        render();
        saveSettings();
        setStatus(`Logo uploaded (${file.name})`, "ok");
    };
    reader.onerror = () => setStatus("Failed to read file", "err");
    reader.readAsDataURL(file);
}

els.logoFile.addEventListener("change", e => {
    handleLogoFile(e.target.files && e.target.files[0]);
});

["dragenter", "dragover"].forEach(evt => {
    els.dropzone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        els.dropzone.classList.add("dragover");
    });
});

["dragleave", "drop"].forEach(evt => {
    els.dropzone.addEventListener(evt, e => {
        e.preventDefault();
        e.stopPropagation();
        if (evt === "dragleave" && e.target !== els.dropzone) return;
        els.dropzone.classList.remove("dragover");
    });
});

els.dropzone.addEventListener("drop", e => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    handleLogoFile(file);
});

els.logoClear.addEventListener("click", () => {
    uploadedLogoDataUrl = null;
    els.logoFile.value = "";
    els.logoSource.value = "default";
    syncLabels();
    render();
    saveSettings();
    setStatus("Uploaded logo cleared");
});

els.reset.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    uploadedLogoDataUrl = null;
    els.logoFile.value = "";
    els.url.value = "https://showcase.pretasystems.com";
    els.caption.value = "";
    els.preset.value = "branded";
    applyPreset("branded");
    els.dlSize.value = "512";
    render();
    setStatus("Reset to defaults", "ok");
});

els.btnSvg.addEventListener("click", () => {
    const blob = new Blob([currentSvg], { type: "image/svg+xml;charset=utf-8" });
    downloadBlob(blob, "pretaqr.svg");
    setStatus("SVG downloaded", "ok");
});

els.btnPng.addEventListener("click", async () => {
    try {
        const size = parseInt(els.dlSize.value, 10);
        const blob = await rasterize("image/png", size);
        downloadBlob(blob, `pretaqr-${size}.png`);
        setStatus("PNG downloaded", "ok");
    } catch (e) {
        setStatus("PNG export failed: " + e.message, "err");
    }
});

els.btnJpg.addEventListener("click", async () => {
    try {
        const size = parseInt(els.dlSize.value, 10);
        const blob = await rasterize("image/jpeg", size);
        downloadBlob(blob, `pretaqr-${size}.jpg`);
        setStatus("JPG downloaded", "ok");
    } catch (e) {
        setStatus("JPG export failed: " + e.message, "err");
    }
});

els.btnCopy.addEventListener("click", async () => {
    try {
        await navigator.clipboard.writeText(currentSvg);
        setStatus("SVG copied to clipboard", "ok");
    } catch (e) {
        setStatus("Copy failed: " + e.message, "err");
    }
});

els.dlSize.addEventListener("change", saveSettings);

(async function init() {
    const restored = loadSettings();
    if (!restored) {
        applyPreset("branded");
        els.preset.value = "branded";
    }
    try {
        defaultLogoDataUrl = await fetchAsDataUrl(DEFAULT_LOGO_PATH);
    } catch {
        setStatus("Default logo unavailable (run via http server)", "err");
    }
    render();
})();
