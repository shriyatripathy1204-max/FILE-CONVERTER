/**
 * PixelFlow — Client-Side Image & Document Converter Suite
 * Strictly Vanilla ES6+ JavaScript, 100% In-Browser Execution
 */

// =============================================================================
// 1. TOOL DEFINITIONS & CONFIGURATION
// =============================================================================

const TOOL_CONFIGS = {
  'image-to-pdf': {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    category: 'Document',
    desc: 'Merge multiple images (PNG, JPG, WEBP, SVG) into a single PDF document with custom page order.',
    icon: 'file-text',
    iconColor: 'text-red-500',
    acceptedMimes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/gif'],
    acceptedText: 'PNG, JPG, WEBP, SVG, BMP',
    allowReorder: true,
    defaultSettings: {
      pageSize: 'a4',        // 'a4', 'letter', 'fit'
      orientation: 'auto',   // 'auto', 'portrait', 'landscape'
      margin: '10',          // '0', '10', '20' (mm)
      pdfName: 'PixelFlow_Document.pdf',
      fitMode: 'contain'     // 'contain', 'fill'
    }
  },
  'png-to-jpg': {
    id: 'png-to-jpg',
    title: 'PNG to JPG',
    category: 'Format Conversion',
    desc: 'Convert PNG images to compact JPEGs. Customize background fill color for transparent areas.',
    icon: 'image',
    iconColor: 'text-emerald-500',
    acceptedMimes: ['image/png', 'image/x-png'],
    acceptedText: 'PNG files only',
    allowReorder: false,
    defaultSettings: {
      quality: 92,
      bgColor: '#ffffff',
      outputFormat: 'image/jpeg',
      extension: 'jpg'
    }
  },
  'jpg-to-png': {
    id: 'jpg-to-png',
    title: 'JPG to PNG',
    category: 'Lossless Conversion',
    desc: 'Convert compressed JPEG images to high-fidelity lossless PNG format.',
    icon: 'file-check',
    iconColor: 'text-blue-500',
    acceptedMimes: ['image/jpeg', 'image/jpg'],
    acceptedText: 'JPG / JPEG files only',
    allowReorder: false,
    defaultSettings: {
      outputFormat: 'image/png',
      extension: 'png'
    }
  },
  'webp-to-jpg': {
    id: 'webp-to-jpg',
    title: 'WEBP to JPG',
    category: 'Transcode',
    desc: 'Convert downloaded WEBP files into universally compatible JPEGs.',
    icon: 'sparkles',
    iconColor: 'text-amber-500',
    acceptedMimes: ['image/webp'],
    acceptedText: 'WEBP files only',
    allowReorder: false,
    defaultSettings: {
      quality: 90,
      bgColor: '#ffffff',
      outputFormat: 'image/jpeg',
      extension: 'jpg'
    }
  },
  'compressor': {
    id: 'compressor',
    title: 'Compress & Resize',
    category: 'Image Optimization',
    desc: 'Shrink file sizes and resize image dimensions proportionally with live quality control.',
    icon: 'minimize-2',
    iconColor: 'text-purple-500',
    acceptedMimes: ['image/jpeg', 'image/png', 'image/webp'],
    acceptedText: 'JPG, PNG, WEBP',
    allowReorder: false,
    defaultSettings: {
      quality: 75,
      resizeMode: 'scale',   // 'original', 'scale', 'custom'
      scalePercent: 75,      // 25, 50, 75, 100
      customWidth: 0,
      customHeight: 0,
      lockAspect: true,
      targetFormat: 'original' // 'original', 'image/webp', 'image/jpeg', 'image/png'
    }
  },
  'universal': {
    id: 'universal',
    title: 'Universal Image Converter',
    category: 'Multi-Format',
    desc: 'Convert any image into modern WEBP, clean PNG, or standard JPEG.',
    icon: 'refresh-cw',
    iconColor: 'text-pink-500',
    acceptedMimes: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/gif'],
    acceptedText: 'Any image format',
    allowReorder: false,
    defaultSettings: {
      targetFormat: 'image/webp',
      quality: 88,
      bgColor: '#ffffff',
      extension: 'webp'
    }
  }
};

// =============================================================================
// 2. CENTRAL APPLICATION STATE
// =============================================================================

const AppState = {
  currentView: 'dashboard', // 'dashboard' | 'workspace'
  activeToolId: 'image-to-pdf',
  queue: [],               // Array of FileItem objects
  results: [],             // Array of ResultItem objects
  isProcessing: false,
  settings: {},            // Active tool settings
  draggedCardIndex: null,  // For drag & drop reordering
};

// =============================================================================
// 3. INITIALIZATION & THEME HANDLER
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initDropzone();
  initClipboardPaste();
  initActionButtons();
  initPreviewModal();
  renderIcons();

  // Check URL hash for direct tool linking (e.g. #compressor or #image-to-pdf)
  handleUrlHash();
  window.addEventListener('hashchange', handleUrlHash);
});

function handleUrlHash() {
  let toolParam = null;
  const href = window.location.href;
  const match = href.match(/[?&#]tool=([^&#]+)/) || href.match(/#([^?&#]+)/);
  if (match && match[1]) {
    toolParam = decodeURIComponent(match[1]).trim();
  }
  if (toolParam && TOOL_CONFIGS[toolParam]) {
    openToolWorkspace(toolParam);
  } else if (!toolParam && AppState.currentView === 'workspace') {
    switchToDashboard();
  }
}

function initTheme() {
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (!themeToggleBtn) return;
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');

  // Check persisted or system preference
  const savedTheme = localStorage.getItem('pixelflow_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

  if (isDark) {
    document.documentElement.classList.add('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
  }

  themeToggleBtn.addEventListener('click', () => {
    const isCurrentlyDark = document.documentElement.classList.contains('dark');
    if (isCurrentlyDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pixelflow_theme', 'light');
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pixelflow_theme', 'dark');
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    }
    renderIcons();
  });
}

function renderIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// =============================================================================
// 4. VIEW & TOOL SWITCHING
// =============================================================================

function initNavigation() {
  const brandLogo = document.getElementById('brandLogo');
  const navHomeBtn = document.getElementById('navHomeBtn');
  const backToHomeBtn = document.getElementById('backToHomeBtn');
  const quickToolBtn = document.getElementById('quickToolBtn');
  const quickToolDropdown = document.getElementById('quickToolDropdown');

  // Dashboard Links
  brandLogo.addEventListener('click', (e) => {
    e.preventDefault();
    switchToDashboard();
  });

  navHomeBtn.addEventListener('click', () => {
    switchToDashboard();
  });

  backToHomeBtn.addEventListener('click', () => {
    switchToDashboard();
  });

  // Tool cards on dashboard
  document.querySelectorAll('.tool-card').forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.getAttribute('data-tool');
      if (toolId && TOOL_CONFIGS[toolId]) {
        openToolWorkspace(toolId);
      }
    });
  });

  // Quick switcher dropdown toggle
  quickToolBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    quickToolDropdown.classList.toggle('hidden');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!quickToolBtn.contains(e.target) && !quickToolDropdown.contains(e.target)) {
      quickToolDropdown.classList.add('hidden');
    }
  });

  // Quick switcher menu links
  document.querySelectorAll('.nav-tool-link').forEach(link => {
    link.addEventListener('click', () => {
      const toolId = link.getAttribute('data-tool');
      quickToolDropdown.classList.add('hidden');
      if (toolId && TOOL_CONFIGS[toolId]) {
        openToolWorkspace(toolId);
      }
    });
  });
}

function switchToDashboard() {
  AppState.currentView = 'dashboard';
  document.getElementById('dashboardView').classList.remove('hidden');
  document.getElementById('workspaceView').classList.add('hidden');
  document.getElementById('navHomeBtn').classList.add('hidden');
  document.getElementById('quickToolText').textContent = 'All Tools';
  if (window.location.hash) {
    history.pushState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openToolWorkspace(toolId) {
  const config = TOOL_CONFIGS[toolId];
  if (!config) return;

  AppState.currentView = 'workspace';
  AppState.activeToolId = toolId;
  AppState.settings = JSON.parse(JSON.stringify(config.defaultSettings));

  if (window.location.hash !== '#' + toolId) {
    history.pushState(null, '', '#' + toolId);
  }

  // Reset results and UI state
  AppState.results = [];
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('resultsGrid').innerHTML = '';
  document.getElementById('processingSection').classList.add('hidden');

  // Update header text and icons
  document.getElementById('dashboardView').classList.add('hidden');
  document.getElementById('workspaceView').classList.remove('hidden');
  document.getElementById('navHomeBtn').classList.remove('hidden');
  document.getElementById('navHomeBtn').classList.add('flex');
  document.getElementById('quickToolText').textContent = config.title;

  document.getElementById('toolHeaderTitle').textContent = config.title;
  document.getElementById('toolHeaderDesc').textContent = config.desc;
  document.getElementById('activeToolTag').textContent = config.category.toUpperCase();

  const iconContainer = document.getElementById('toolHeaderIcon');
  iconContainer.innerHTML = `<i data-lucide="${config.icon}" class="w-4 h-4 ${config.iconColor}"></i>`;

  // Update accepted formats hint
  document.getElementById('acceptedFormatsPill').textContent = `Accepts: ${config.acceptedText}`;

  // Toggle reorder instructions for PDF
  const reorderTip = document.getElementById('reorderTipBadge');
  if (config.allowReorder) {
    reorderTip.classList.remove('hidden');
  } else {
    reorderTip.classList.add('hidden');
  }

  // Generate settings panel
  renderToolSettings(toolId);

  // Update queue UI
  renderQueueList();
  updateConvertButtonState();

  renderIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================================================
// 5. SETTINGS PANEL GENERATOR
// =============================================================================

function renderToolSettings(toolId) {
  const container = document.getElementById('toolSettingsContainer');
  container.innerHTML = '';
  const config = TOOL_CONFIGS[toolId];

  if (toolId === 'image-to-pdf') {
    container.innerHTML = `
      <div class="space-y-4 text-xs font-bold text-slate-700">
        <div>
          <label class="block font-black text-slate-800 mb-2">Page Format</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="opt-btn ${AppState.settings.pageSize === 'a4' ? 'active' : ''} pop-pill-option" data-setting="pageSize" data-value="a4">
              A4 Standard
            </button>
            <button type="button" class="opt-btn ${AppState.settings.pageSize === 'letter' ? 'active' : ''} pop-pill-option" data-setting="pageSize" data-value="letter">
              US Letter
            </button>
            <button type="button" class="opt-btn ${AppState.settings.pageSize === 'fit' ? 'active' : ''} pop-pill-option" data-setting="pageSize" data-value="fit">
              Fit Image
            </button>
          </div>
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-2">Page Orientation</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="opt-btn ${AppState.settings.orientation === 'auto' ? 'active' : ''} pop-pill-option" data-setting="orientation" data-value="auto">
              Auto Detect
            </button>
            <button type="button" class="opt-btn ${AppState.settings.orientation === 'portrait' ? 'active' : ''} pop-pill-option" data-setting="orientation" data-value="portrait">
              Portrait
            </button>
            <button type="button" class="opt-btn ${AppState.settings.orientation === 'landscape' ? 'active' : ''} pop-pill-option" data-setting="orientation" data-value="landscape">
              Landscape
            </button>
          </div>
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-2">Page Margins</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="opt-btn ${AppState.settings.margin === '0' ? 'active' : ''} pop-pill-option" data-setting="margin" data-value="0">
              None (0mm)
            </button>
            <button type="button" class="opt-btn ${AppState.settings.margin === '10' ? 'active' : ''} pop-pill-option" data-setting="margin" data-value="10">
              Small (10mm)
            </button>
            <button type="button" class="opt-btn ${AppState.settings.margin === '20' ? 'active' : ''} pop-pill-option" data-setting="margin" data-value="20">
              Normal (20mm)
            </button>
          </div>
        </div>

        <div>
          <label for="pdfNameInput" class="block font-black text-slate-800 mb-2">PDF Filename</label>
          <div class="flex items-center rounded-2xl border-2 border-slate-100 bg-slate-50 px-3.5 py-2.5 shadow-inner">
            <input type="text" id="pdfNameInput" value="${AppState.settings.pdfName}" class="bg-transparent text-xs font-bold w-full outline-none text-slate-800" placeholder="PixelFlow_Document.pdf" />
          </div>
        </div>
      </div>
    `;

    document.getElementById('pdfNameInput').addEventListener('input', (e) => {
      let val = e.target.value.trim();
      if (!val.toLowerCase().endsWith('.pdf')) val += '.pdf';
      AppState.settings.pdfName = val;
    });

  } else if (toolId === 'png-to-jpg' || toolId === 'webp-to-jpg') {
    container.innerHTML = `
      <div class="space-y-4 text-xs font-bold text-slate-700">
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="font-black text-slate-800">JPEG Quality</label>
            <span id="qualityValDisplay" class="font-mono font-black text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">${AppState.settings.quality}%</span>
          </div>
          <input type="range" id="qualityRange" min="10" max="100" value="${AppState.settings.quality}" />
          <div class="flex justify-between text-[10px] text-slate-400 font-extrabold mt-1.5">
            <span>Smaller File (10%)</span>
            <span>Balanced (80%)</span>
            <span>Maximum (100%)</span>
          </div>
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-2">
            Background Color for Transparent Areas
          </label>
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <input type="color" id="bgColorPicker" value="${AppState.settings.bgColor}" class="cursor-pointer" />
              <span id="colorHexText" class="font-mono font-black text-xs text-slate-700 uppercase">${AppState.settings.bgColor}</span>
            </div>
            <div class="flex gap-2 ml-auto">
              <button type="button" class="preset-color w-8 h-8 rounded-xl border-2 border-slate-200 bg-white shadow-sm" data-color="#ffffff" title="White"></button>
              <button type="button" class="preset-color w-8 h-8 rounded-xl border-2 border-slate-700 bg-black shadow-sm" data-color="#000000" title="Black"></button>
              <button type="button" class="preset-color w-8 h-8 rounded-xl border-2 border-slate-200 bg-[#f8fafc] shadow-sm" data-color="#f8fafc" title="Off-White"></button>
            </div>
          </div>
          <p class="text-[11px] text-slate-400 font-semibold mt-2 leading-relaxed">
            JPEG has no transparency. PixelFlow fills transparent pixels with your chosen color!
          </p>
        </div>
      </div>
    `;

    const qualityRange = document.getElementById('qualityRange');
    const qualityValDisplay = document.getElementById('qualityValDisplay');
    qualityRange.addEventListener('input', (e) => {
      AppState.settings.quality = parseInt(e.target.value, 10);
      qualityValDisplay.textContent = `${AppState.settings.quality}%`;
    });

    const bgColorPicker = document.getElementById('bgColorPicker');
    const colorHexText = document.getElementById('colorHexText');
    bgColorPicker.addEventListener('input', (e) => {
      AppState.settings.bgColor = e.target.value;
      colorHexText.textContent = e.target.value.toUpperCase();
    });

    container.querySelectorAll('.preset-color').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = btn.getAttribute('data-color');
        bgColorPicker.value = col;
        AppState.settings.bgColor = col;
        colorHexText.textContent = col.toUpperCase();
      });
    });

  } else if (toolId === 'jpg-to-png') {
    container.innerHTML = `
      <div class="space-y-3 text-xs">
        <div class="p-4 rounded-2xl bg-blue-50 border-2 border-blue-100 text-blue-900 font-bold leading-relaxed">
          <span class="font-black font-heading text-sm block mb-1">✨ Lossless Export:</span>
          All JPEGs will be re-encoded into crisp, full-color lossless PNG raster format without loss.
        </div>
      </div>
    `;

  } else if (toolId === 'compressor') {
    container.innerHTML = `
      <div class="space-y-4 text-xs font-bold text-slate-700">
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="font-black text-slate-800">Compression Level</label>
            <span id="compressQualityDisplay" class="font-mono font-black text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">${AppState.settings.quality}%</span>
          </div>
          <input type="range" id="compressQualityRange" min="10" max="100" value="${AppState.settings.quality}" />
          <div class="flex justify-between text-[10px] text-slate-400 font-extrabold mt-1.5">
            <span>High Compression (30%)</span>
            <span>Balanced (75%)</span>
            <span>Sharp (95%)</span>
          </div>
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-2">Resize Dimensions</label>
          <div class="grid grid-cols-3 gap-2 mb-2.5">
            <button type="button" class="opt-btn ${AppState.settings.resizeMode === 'original' ? 'active' : ''} pop-pill-option" data-setting="resizeMode" data-value="original">
              Original (100%)
            </button>
            <button type="button" class="opt-btn ${AppState.settings.resizeMode === 'scale' ? 'active' : ''} pop-pill-option" data-setting="resizeMode" data-value="scale">
              Scale %
            </button>
            <button type="button" class="opt-btn ${AppState.settings.resizeMode === 'custom' ? 'active' : ''} pop-pill-option" data-setting="resizeMode" data-value="custom">
              Custom Px
            </button>
          </div>

          <!-- Scale Sub-options -->
          <div id="scaleOptionsBox" class="${AppState.settings.resizeMode === 'scale' ? '' : 'hidden'} space-y-2">
            <div class="grid grid-cols-4 gap-2">
              <button type="button" class="scale-btn ${AppState.settings.scalePercent === 25 ? 'active' : ''} pop-pill-option" data-scale="25">25%</button>
              <button type="button" class="scale-btn ${AppState.settings.scalePercent === 50 ? 'active' : ''} pop-pill-option" data-scale="50">50%</button>
              <button type="button" class="scale-btn ${AppState.settings.scalePercent === 75 ? 'active' : ''} pop-pill-option" data-scale="75">75%</button>
              <button type="button" class="scale-btn ${AppState.settings.scalePercent === 90 ? 'active' : ''} pop-pill-option" data-scale="90">90%</button>
            </div>
          </div>

          <!-- Custom Dimensions Sub-options -->
          <div id="customDimsBox" class="${AppState.settings.resizeMode === 'custom' ? '' : 'hidden'} flex items-center gap-2 mt-2">
            <div class="flex-1">
              <label class="text-[10px] text-slate-400 font-extrabold block mb-1">Width (px)</label>
              <input type="number" id="customWidthInput" placeholder="Auto" value="${AppState.settings.customWidth || ''}" class="w-full px-3 py-2 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none" />
            </div>
            <div class="pt-5 text-slate-400 font-black">×</div>
            <div class="flex-1">
              <label class="text-[10px] text-slate-400 font-extrabold block mb-1">Height (px)</label>
              <input type="number" id="customHeightInput" placeholder="Auto" value="${AppState.settings.customHeight || ''}" class="w-full px-3 py-2 rounded-xl border-2 border-slate-100 bg-slate-50 text-xs font-bold outline-none" />
            </div>
            <div class="pt-5">
              <button type="button" id="toggleAspectLockBtn" class="pop-btn ${AppState.settings.lockAspect ? 'pop-btn-yellow' : 'pop-btn-white'} p-2 text-xs" title="Lock Aspect Ratio">
                <i data-lucide="${AppState.settings.lockAspect ? 'link' : 'unlink'}" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>

        <div>
          <label class="block font-black text-slate-800 mb-2">Target Format</label>
          <select id="targetFormatSelect" class="w-full px-3.5 py-2.5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-xs font-black text-slate-800 outline-none shadow-sm cursor-pointer">
            <option value="original" ${AppState.settings.targetFormat === 'original' ? 'selected' : ''}>Keep Original Format</option>
            <option value="image/webp" ${AppState.settings.targetFormat === 'image/webp' ? 'selected' : ''}>WEBP (Smallest Size!)</option>
            <option value="image/jpeg" ${AppState.settings.targetFormat === 'image/jpeg' ? 'selected' : ''}>JPEG (Standard Web)</option>
            <option value="image/png" ${AppState.settings.targetFormat === 'image/png' ? 'selected' : ''}>PNG (Transparent)</option>
          </select>
        </div>
      </div>
    `;

    const compressQualityRange = document.getElementById('compressQualityRange');
    const compressQualityDisplay = document.getElementById('compressQualityDisplay');
    compressQualityRange.addEventListener('input', (e) => {
      AppState.settings.quality = parseInt(e.target.value, 10);
      compressQualityDisplay.textContent = `${AppState.settings.quality}%`;
    });

    container.querySelectorAll('.scale-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.scale-btn').forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        AppState.settings.scalePercent = parseInt(btn.getAttribute('data-scale'), 10);
      });
    });

    const customWidthInput = document.getElementById('customWidthInput');
    const customHeightInput = document.getElementById('customHeightInput');
    const toggleAspectLockBtn = document.getElementById('toggleAspectLockBtn');

    if (customWidthInput && customHeightInput) {
      customWidthInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) || 0;
        AppState.settings.customWidth = val;
        if (AppState.settings.lockAspect && AppState.queue.length > 0 && val > 0) {
          const firstImg = AppState.queue[0];
          if (firstImg.aspectRatio) {
            const computedHeight = Math.round(val / firstImg.aspectRatio);
            AppState.settings.customHeight = computedHeight;
            customHeightInput.value = computedHeight;
          }
        }
      });

      customHeightInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10) || 0;
        AppState.settings.customHeight = val;
        if (AppState.settings.lockAspect && AppState.queue.length > 0 && val > 0) {
          const firstImg = AppState.queue[0];
          if (firstImg.aspectRatio) {
            const computedWidth = Math.round(val * firstImg.aspectRatio);
            AppState.settings.customWidth = computedWidth;
            customWidthInput.value = computedWidth;
          }
        }
      });
    }

    if (toggleAspectLockBtn) {
      toggleAspectLockBtn.addEventListener('click', () => {
        AppState.settings.lockAspect = !AppState.settings.lockAspect;
        renderToolSettings(toolId);
        renderIcons();
      });
    }

    const targetFormatSelect = document.getElementById('targetFormatSelect');
    targetFormatSelect.addEventListener('change', (e) => {
      AppState.settings.targetFormat = e.target.value;
    });

  } else if (toolId === 'universal') {
    container.innerHTML = `
      <div class="space-y-4 text-xs font-bold text-slate-700">
        <div>
          <label class="block font-black text-slate-800 mb-2">Convert Target Format</label>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" class="opt-btn ${AppState.settings.targetFormat === 'image/webp' ? 'active' : ''} pop-pill-option" data-setting="targetFormat" data-value="image/webp">
              WEBP
            </button>
            <button type="button" class="opt-btn ${AppState.settings.targetFormat === 'image/png' ? 'active' : ''} pop-pill-option" data-setting="targetFormat" data-value="image/png">
              PNG
            </button>
            <button type="button" class="opt-btn ${AppState.settings.targetFormat === 'image/jpeg' ? 'active' : ''} pop-pill-option" data-setting="targetFormat" data-value="image/jpeg">
              JPG
            </button>
          </div>
        </div>

        <div id="universalQualityBox">
          <div class="flex justify-between items-center mb-2">
            <label class="font-black text-slate-800">Target Quality</label>
            <span id="uQualityDisplay" class="font-mono font-black text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">${AppState.settings.quality}%</span>
          </div>
          <input type="range" id="uQualityRange" min="10" max="100" value="${AppState.settings.quality}" />
        </div>
      </div>
    `;

    const uQualityRange = document.getElementById('uQualityRange');
    const uQualityDisplay = document.getElementById('uQualityDisplay');
    uQualityRange.addEventListener('input', (e) => {
      AppState.settings.quality = parseInt(e.target.value, 10);
      uQualityDisplay.textContent = `${AppState.settings.quality}%`;
    });
  }

  // Handle generic option buttons toggle styling
  container.querySelectorAll('.opt-btn').forEach(btn => {
    applyOptBtnStyle(btn);
    btn.addEventListener('click', () => {
      const setting = btn.getAttribute('data-setting');
      const val = btn.getAttribute('data-value');
      AppState.settings[setting] = val;

      // Re-render settings for dependent UI states
      renderToolSettings(toolId);
      renderIcons();
    });
  });
}

function applyOptBtnStyle(btn) {
  const isActive = btn.classList.contains('active');
  if (isActive) {
    btn.className = 'opt-btn pop-pill-option active';
  } else {
    btn.className = 'opt-btn pop-pill-option';
  }
}

// =============================================================================
// 6. DROPZONE & FILE INPUT HANDLERS
// =============================================================================

function initDropzone() {
  const dropzone = document.getElementById('dropzoneContainer');
  const fileInput = document.getElementById('fileInput');
  const dragOverlay = document.getElementById('dragOverlay');

  // Trigger input on dropzone click
  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleIncomingFiles(Array.from(e.target.files));
      fileInput.value = ''; // Reset so the same file can be re-uploaded if needed
    }
  });

  // Drag & drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-active');
      dragOverlay.classList.remove('hidden');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-active');
      dragOverlay.classList.add('hidden');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleIncomingFiles(Array.from(dt.files));
    }
  });
}

// Global Clipboard Paste Support (Ctrl+V / Cmd+V)
function initClipboardPaste() {
  window.addEventListener('paste', (e) => {
    // Avoid capturing paste inside text inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    const files = [];

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file' && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      // If currently on dashboard, open default or first tool
      if (AppState.currentView === 'dashboard') {
        openToolWorkspace('compressor');
      }
      handleIncomingFiles(files);
      showToast(`Pasted ${files.length} image(s) from clipboard!`, 'info');
    }
  });
}

async function handleIncomingFiles(fileList) {
  const config = TOOL_CONFIGS[AppState.activeToolId];
  let validCount = 0;
  let rejectedCount = 0;

  for (const file of fileList) {
    // Validate MIME type
    const isImage = file.type.startsWith('image/') || file.name.match(/\.(png|jpe?g|webp|svg|bmp|gif)$/i);
    const isAccepted = config.acceptedMimes.some(mime => file.type === mime || file.type === '');

    if (!isImage || !isAccepted) {
      rejectedCount++;
      continue;
    }

    // Read image metadata and generate preview
    try {
      const fileData = await readFileMetadata(file);
      AppState.queue.push(fileData);
      validCount++;
    } catch (err) {
      console.error('Error reading file:', err);
      rejectedCount++;
    }
  }

  if (validCount > 0) {
    showToast(`Added ${validCount} file${validCount > 1 ? 's' : ''} to queue`, 'success');
  }

  if (rejectedCount > 0) {
    showToast(`${rejectedCount} file(s) skipped. Supported: ${config.acceptedText}`, 'warning');
  }

  renderQueueList();
  updateConvertButtonState();
}

function readFileMetadata(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        resolve({
          id: 'file_' + Math.random().toString(36).substr(2, 9),
          file: file,
          name: file.name,
          size: file.size,
          type: file.type || 'image/png',
          dataUrl: dataUrl,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height)
        });
      };
      img.onerror = () => {
        // Fallback for SVGs or corrupted images
        resolve({
          id: 'file_' + Math.random().toString(36).substr(2, 9),
          file: file,
          name: file.name,
          size: file.size,
          type: file.type || 'image/png',
          dataUrl: dataUrl,
          width: 800,
          height: 600,
          aspectRatio: 800 / 600
        });
      };
      img.src = dataUrl;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// =============================================================================
// 7. QUEUE LIST RENDERING & DRAG-SORTING
// =============================================================================

function renderQueueList() {
  const queueSection = document.getElementById('fileQueueSection');
  const cardsGrid = document.getElementById('fileCardsGrid');
  const fileCountBadge = document.getElementById('fileCountBadge');
  const queueCountBadge = document.getElementById('queueCountBadge');
  const workspaceStats = document.getElementById('workspaceStats');
  const isSortable = TOOL_CONFIGS[AppState.activeToolId].allowReorder;

  if (AppState.queue.length === 0) {
    queueSection.classList.add('hidden');
    workspaceStats.classList.add('hidden');
    cardsGrid.innerHTML = '';
    return;
  }

  queueSection.classList.remove('hidden');
  workspaceStats.classList.remove('hidden');
  workspaceStats.classList.add('flex');

  const countStr = `${AppState.queue.length} file${AppState.queue.length > 1 ? 's' : ''}`;
  fileCountBadge.textContent = AppState.queue.length;
  queueCountBadge.textContent = `${countStr} queued`;

  cardsGrid.innerHTML = '';

  AppState.queue.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = `sortable-card pop-card relative p-4 bg-white border-2 border-slate-100 flex flex-col gap-3 ${isSortable ? 'cursor-grab' : ''}`;
    card.setAttribute('data-index', index);

    if (isSortable) {
      card.setAttribute('draggable', 'true');
    }

    // Thumbnail and details
    card.innerHTML = `
      <div class="relative w-full h-36 rounded-2xl overflow-hidden checkerboard-bg flex items-center justify-center border-2 border-slate-100">
        <img src="${item.dataUrl}" alt="${escapeHtml(item.name)}" class="w-full h-full object-contain pointer-events-none select-none" />
        
        <!-- Page sequence circular badge for PDF -->
        ${isSortable ? `
          <span class="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-ground text-white font-black text-xs shadow-md">
            #${index + 1}
          </span>
        ` : ''}

        <!-- Quick Preview button -->
        <button type="button" class="preview-btn pop-btn pop-btn-white absolute bottom-2.5 right-2.5 !p-1.5 text-slate-700 shadow-md" data-index="${index}" title="Preview full size">
          <i data-lucide="eye" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <div class="flex items-start justify-between gap-1">
        <div class="overflow-hidden">
          <p class="text-xs font-black text-slate-800 truncate" title="${escapeHtml(item.name)}">
            ${escapeHtml(item.name)}
          </p>
          <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold mt-0.5">
            <span>${item.width} × ${item.height}</span>
            <span>•</span>
            <span>${formatBytes(item.size)}</span>
          </div>
        </div>

        <button type="button" class="remove-btn p-1.5 rounded-full text-slate-400 hover:text-pop-coral hover:bg-red-50 transition-colors shrink-0" data-index="${index}" title="Remove file">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>

      <!-- Left / Right Reorder controls -->
      ${isSortable ? `
        <div class="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
          <span class="text-[11px] text-slate-400 font-bold">Page order</span>
          <div class="flex items-center gap-1.5">
            <button type="button" class="move-left-btn pop-btn pop-btn-white !p-1.5 text-slate-600 disabled:opacity-30" data-index="${index}" ${index === 0 ? 'disabled' : ''} title="Move page up">
              <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
            </button>
            <button type="button" class="move-right-btn pop-btn pop-btn-white !p-1.5 text-slate-600 disabled:opacity-30" data-index="${index}" ${index === AppState.queue.length - 1 ? 'disabled' : ''} title="Move page down">
              <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        </div>
      ` : ''}
    `;

    cardsGrid.appendChild(card);
  });

  // Attach card event listeners
  attachQueueCardEvents();
  renderIcons();
}

function attachQueueCardEvents() {
  const isSortable = TOOL_CONFIGS[AppState.activeToolId].allowReorder;

  // Remove button
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'), 10);
      AppState.queue.splice(index, 1);
      renderQueueList();
      updateConvertButtonState();
    });
  });

  // Preview button
  document.querySelectorAll('.preview-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'), 10);
      const item = AppState.queue[index];
      if (item) {
        openPreviewModal(item.dataUrl, item.name, `${item.width} × ${item.height} • ${formatBytes(item.size)}`, item.dataUrl);
      }
    });
  });

  // Move left / right buttons
  document.querySelectorAll('.move-left-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'), 10);
      if (index > 0) {
        swapQueueItems(index, index - 1);
      }
    });
  });

  document.querySelectorAll('.move-right-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'), 10);
      if (index < AppState.queue.length - 1) {
        swapQueueItems(index, index + 1);
      }
    });
  });

  // Drag-and-Drop Sortable Events
  if (isSortable) {
    const cards = document.querySelectorAll('.sortable-card');
    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        AppState.draggedCardIndex = parseInt(card.getAttribute('data-index'), 10);
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        cards.forEach(c => c.classList.remove('drag-over-left', 'drag-over-right'));
        AppState.draggedCardIndex = null;
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const targetIndex = parseInt(card.getAttribute('data-index'), 10);
        if (targetIndex !== AppState.draggedCardIndex) {
          const rect = card.getBoundingClientRect();
          const midX = rect.left + rect.width / 2;
          if (e.clientX < midX) {
            card.classList.add('drag-over-left');
            card.classList.remove('drag-over-right');
          } else {
            card.classList.add('drag-over-right');
            card.classList.remove('drag-over-left');
          }
        }
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over-left', 'drag-over-right');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over-left', 'drag-over-right');
        const targetIndex = parseInt(card.getAttribute('data-index'), 10);
        const sourceIndex = AppState.draggedCardIndex;

        if (sourceIndex !== null && sourceIndex !== targetIndex) {
          const movedItem = AppState.queue.splice(sourceIndex, 1)[0];
          AppState.queue.splice(targetIndex, 0, movedItem);
          renderQueueList();
        }
      });
    });
  }
}

function swapQueueItems(i, j) {
  const temp = AppState.queue[i];
  AppState.queue[i] = AppState.queue[j];
  AppState.queue[j] = temp;
  renderQueueList();
}

function updateConvertButtonState() {
  const convertBtn = document.getElementById('convertBtn');
  const convertBtnText = document.getElementById('convertBtnText');
  const convertBtnHelp = document.getElementById('convertBtnHelp');

  if (AppState.queue.length === 0) {
    convertBtn.disabled = true;
    convertBtnText.textContent = 'Convert Now';
    convertBtnHelp.textContent = 'Select or drop files above to enable conversion.';
  } else {
    convertBtn.disabled = false;
    const fileCount = AppState.queue.length;
    convertBtnText.textContent = `Convert ${fileCount} File${fileCount > 1 ? 's' : ''}`;
    convertBtnHelp.textContent = 'Ready to process instantly in your browser.';
  }
}

// =============================================================================
// 8. ACTION BUTTONS & WORKSPACE CONTROLS
// =============================================================================

function initActionButtons() {
  const clearAllQueueBtn = document.getElementById('clearAllQueueBtn');
  const clearQueueMobileBtn = document.getElementById('clearQueueMobileBtn');
  const addMoreBtn = document.getElementById('addMoreBtn');
  const convertBtn = document.getElementById('convertBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const convertAnotherBtn = document.getElementById('convertAnotherBtn');
  const fileInput = document.getElementById('fileInput');

  clearAllQueueBtn.addEventListener('click', clearQueue);
  clearQueueMobileBtn.addEventListener('click', clearQueue);

  addMoreBtn.addEventListener('click', () => {
    fileInput.click();
  });

  convertBtn.addEventListener('click', () => {
    if (!AppState.isProcessing && AppState.queue.length > 0) {
      startConversionPipeline();
    }
  });

  downloadZipBtn.addEventListener('click', () => {
    downloadAllAsZip();
  });

  convertAnotherBtn.addEventListener('click', () => {
    clearQueue();
    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('resultsGrid').innerHTML = '';
  });
}

function clearQueue() {
  AppState.queue = [];
  renderQueueList();
  updateConvertButtonState();
}

// =============================================================================
// 9. CONVERSION ENGINE (CANVAS, PDF, ZIP)
// =============================================================================

async function startConversionPipeline() {
  const toolId = AppState.activeToolId;
  const config = TOOL_CONFIGS[toolId];
  AppState.isProcessing = true;
  AppState.results = [];

  const convertBtn = document.getElementById('convertBtn');
  const processingSection = document.getElementById('processingSection');
  const progressBarFill = document.getElementById('progressBarFill');
  const processingPercentText = document.getElementById('processingPercentText');
  const processingStatusText = document.getElementById('processingStatusText');
  const resultsSection = document.getElementById('resultsSection');

  convertBtn.disabled = true;
  processingSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');

  const updateProgress = (completed, total, currentFileName = '') => {
    const percent = Math.round((completed / total) * 100);
    progressBarFill.style.width = `${percent}%`;
    processingPercentText.textContent = `${percent}%`;
    if (currentFileName) {
      processingStatusText.textContent = `Processing (${completed}/${total}): ${truncateString(currentFileName, 24)}`;
    } else {
      processingStatusText.textContent = `Completed ${completed} of ${total}`;
    }
  };

  try {
    if (toolId === 'image-to-pdf') {
      await processImageToPdf(updateProgress);
    } else {
      await processImageConversions(toolId, updateProgress);
    }

    showToast('Conversion completed successfully!', 'success');
    renderResults();
  } catch (err) {
    console.error('Conversion Pipeline Error:', err);
    showToast('An error occurred during conversion: ' + err.message, 'error');
  } finally {
    AppState.isProcessing = false;
    processingSection.classList.add('hidden');
    convertBtn.disabled = false;
  }
}

/**
 * Image to PDF Generator using jsPDF
 */
async function processImageToPdf(progressCb) {
  const jsPDFClass = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (!jsPDFClass) {
    throw new Error('jsPDF library failed to load. Please check your internet connection.');
  }

  const settings = AppState.settings;
  const files = AppState.queue;
  const total = files.length;
  let pdf = null;

  for (let i = 0; i < total; i++) {
    const item = files[i];
    progressCb(i, total, item.name);

    // Yield control to UI thread
    await new Promise(r => setTimeout(r, 20));

    // Determine orientation & page dimensions in mm
    let orientation = settings.orientation; // 'auto', 'portrait', 'landscape'
    if (orientation === 'auto') {
      orientation = item.width >= item.height ? 'landscape' : 'portrait';
    }

    let format = settings.pageSize; // 'a4', 'letter', 'fit'
    let pageWidth, pageHeight;

    if (format === 'fit') {
      // In fit mode, page dimensions match the image aspect ratio
      const pxToMm = 0.264583;
      pageWidth = item.width * pxToMm;
      pageHeight = item.height * pxToMm;
      format = [pageWidth, pageHeight];
    } else {
      // Standard paper dimensions in mm
      if (format === 'a4') {
        pageWidth = orientation === 'portrait' ? 210 : 297;
        pageHeight = orientation === 'portrait' ? 297 : 210;
      } else { // letter
        pageWidth = orientation === 'portrait' ? 215.9 : 279.4;
        pageHeight = orientation === 'portrait' ? 279.4 : 215.9;
      }
    }

    if (i === 0) {
      pdf = new jsPDFClass({
        orientation: orientation === 'landscape' ? 'l' : 'p',
        unit: 'mm',
        format: format,
        compress: true
      });
    } else {
      pdf.addPage(format, orientation === 'landscape' ? 'l' : 'p');
    }

    // Calculate margins and image positioning
    const marginMm = format === 'fit' ? 0 : parseFloat(settings.margin || 0);
    const usableWidth = Math.max(10, pageWidth - (marginMm * 2));
    const usableHeight = Math.max(10, pageHeight - (marginMm * 2));

    const imgAspect = item.width / item.height;
    const pageAspect = usableWidth / usableHeight;

    let destWidth, destHeight, destX, destY;

    if (format === 'fit') {
      destWidth = pageWidth;
      destHeight = pageHeight;
      destX = 0;
      destY = 0;
    } else {
      if (imgAspect > pageAspect) {
        destWidth = usableWidth;
        destHeight = usableWidth / imgAspect;
      } else {
        destHeight = usableHeight;
        destWidth = usableHeight * imgAspect;
      }
      destX = marginMm + (usableWidth - destWidth) / 2;
      destY = marginMm + (usableHeight - destHeight) / 2;
    }

    // Convert to high quality JPEG via canvas to ensure universal compatibility with jsPDF (even for WEBP, SVG, GIF)
    const imgEl = await loadHtmlImage(item.dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = item.width;
    canvas.height = item.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, item.width, item.height);
    ctx.drawImage(imgEl, 0, 0);
    const safeDataUrl = canvas.toDataURL('image/jpeg', 0.95);

    pdf.addImage(safeDataUrl, 'JPEG', destX, destY, destWidth, destHeight, undefined, 'FAST');
  }

  progressCb(total, total, 'Finalizing PDF document...');

  const pdfBlob = pdf.output('blob');
  const pdfBlobUrl = URL.createObjectURL(pdfBlob);
  const outputFileName = settings.pdfName || 'PixelFlow_Document.pdf';

  // Total original bytes
  const totalOriginalSize = files.reduce((acc, cur) => acc + cur.size, 0);

  AppState.results.push({
    id: 'res_pdf',
    originalName: `${total} images merged`,
    outputName: outputFileName,
    originalSize: totalOriginalSize,
    outputSize: pdfBlob.size,
    blob: pdfBlob,
    blobUrl: pdfBlobUrl,
    type: 'application/pdf',
    previewUrl: files[0].dataUrl
  });
}

/**
 * Single/Batch Image Conversion Engine using HTML5 Canvas
 */
async function processImageConversions(toolId, progressCb) {
  const files = AppState.queue;
  const total = files.length;
  const settings = AppState.settings;

  for (let i = 0; i < total; i++) {
    const item = files[i];
    progressCb(i, total, item.name);
    await new Promise(r => setTimeout(r, 20));

    // Determine target format & extension
    let mimeType = 'image/jpeg';
    let extension = 'jpg';
    let quality = (settings.quality || 90) / 100;
    let bgColor = settings.bgColor || '#ffffff';

    if (toolId === 'png-to-jpg' || toolId === 'webp-to-jpg') {
      mimeType = 'image/jpeg';
      extension = 'jpg';
    } else if (toolId === 'jpg-to-png') {
      mimeType = 'image/png';
      extension = 'png';
      quality = 1.0; // PNG is lossless
    } else if (toolId === 'compressor') {
      if (settings.targetFormat === 'original') {
        mimeType = item.type || 'image/jpeg';
        extension = mimeType.split('/')[1] || 'jpg';
      } else {
        mimeType = settings.targetFormat;
        extension = mimeType.split('/')[1] || 'jpg';
      }
      if (extension === 'jpeg') extension = 'jpg';
    } else if (toolId === 'universal') {
      mimeType = settings.targetFormat;
      extension = mimeType.split('/')[1] || 'webp';
      if (extension === 'jpeg') extension = 'jpg';
    }

    // Compute dimensions
    let targetWidth = item.width;
    let targetHeight = item.height;

    if (toolId === 'compressor') {
      if (settings.resizeMode === 'scale') {
        const scale = (settings.scalePercent || 75) / 100;
        targetWidth = Math.max(1, Math.round(item.width * scale));
        targetHeight = Math.max(1, Math.round(item.height * scale));
      } else if (settings.resizeMode === 'custom') {
        if (settings.customWidth > 0 && settings.customHeight > 0) {
          targetWidth = settings.customWidth;
          targetHeight = settings.customHeight;
        } else if (settings.customWidth > 0) {
          targetWidth = settings.customWidth;
          targetHeight = Math.round(targetWidth / item.aspectRatio);
        } else if (settings.customHeight > 0) {
          targetHeight = settings.customHeight;
          targetWidth = Math.round(targetHeight * item.aspectRatio);
        }
      }
    }

    // Draw on Canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: mimeType !== 'image/jpeg' });

    // Enable high quality bicubic/bilinear interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // If target is JPEG or has no alpha, paint background color first
    if (mimeType === 'image/jpeg') {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    // Load HTML image element
    const imgElement = await loadHtmlImage(item.dataUrl);
    ctx.drawImage(imgElement, 0, 0, targetWidth, targetHeight);

    // Convert Canvas to Blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, mimeType, quality);
    });

    const blobUrl = URL.createObjectURL(blob);
    const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const outputFileName = `${baseName}_converted.${extension}`;

    AppState.results.push({
      id: 'res_' + Math.random().toString(36).substr(2, 9),
      originalName: item.name,
      outputName: outputFileName,
      originalSize: item.size,
      outputSize: blob.size,
      blob: blob,
      blobUrl: blobUrl,
      type: mimeType,
      previewUrl: blobUrl,
      dimensions: `${targetWidth} × ${targetHeight}`
    });
  }

  progressCb(total, total);
}

function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to render canvas image'));
    img.src = src;
  });
}

// =============================================================================
// 10. RESULTS DISPLAY & BATCH DOWNLOAD
// =============================================================================

function renderResults() {
  const resultsSection = document.getElementById('resultsSection');
  const resultsGrid = document.getElementById('resultsGrid');
  const resultsSummaryText = document.getElementById('resultsSummaryText');
  const downloadZipBtn = document.getElementById('downloadZipBtn');

  resultsSection.classList.remove('hidden');
  resultsGrid.innerHTML = '';

  const totalResults = AppState.results.length;
  resultsSummaryText.textContent = `${totalResults} file${totalResults > 1 ? 's' : ''} successfully processed directly in browser.`;

  // Only show ZIP button if there are multiple files
  if (totalResults > 1) {
    downloadZipBtn.classList.remove('hidden');
  } else {
    downloadZipBtn.classList.add('hidden');
  }

  AppState.results.forEach((item, index) => {
    const sizeDiff = item.outputSize - item.originalSize;
    const isSmaller = sizeDiff < 0;
    const savingsPercent = Math.abs(Math.round((sizeDiff / item.originalSize) * 100));

    const card = document.createElement('div');
    card.className = 'pop-card p-5 border-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pop';

    card.innerHTML = `
      <div class="flex items-center gap-4 min-w-0">
        <div class="w-16 h-16 rounded-2xl overflow-hidden checkerboard-bg shrink-0 border-2 border-slate-100 flex items-center justify-center shadow-inner">
          ${item.type === 'application/pdf' ? `
            <i data-lucide="file-text" class="w-9 h-9 text-red-500"></i>
          ` : `
            <img src="${item.previewUrl}" alt="${escapeHtml(item.outputName)}" class="w-full h-full object-contain" />
          `}
        </div>

        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="status-circle-done !w-5 !h-5 text-[10px]">✓</span>
            <h4 class="text-sm font-black font-heading text-slate-900 truncate" title="${escapeHtml(item.outputName)}">
              ${escapeHtml(item.outputName)}
            </h4>
            ${isSmaller && savingsPercent > 0 ? `
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                ✨ -${savingsPercent}%
              </span>
            ` : ''}
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-400 font-bold mt-1">
            <span class="line-through text-slate-400">${formatBytes(item.originalSize)}</span>
            <span class="text-slate-600">→</span>
            <span class="font-black text-slate-900">${formatBytes(item.outputSize)}</span>
            ${item.dimensions ? `<span>• ${item.dimensions}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
        ${item.type !== 'application/pdf' ? `
          <button type="button" class="result-preview-btn pop-btn pop-btn-white !p-2.5 text-slate-600" data-index="${index}" title="Preview Image">
            <i data-lucide="eye" class="w-4 h-4"></i>
          </button>
        ` : ''}

        <button type="button" class="result-download-btn pop-btn pop-btn-mint text-xs px-4 py-2 font-black" data-index="${index}">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>Download</span>
        </button>
      </div>
    `;

    resultsGrid.appendChild(card);
  });

  // Attach download & preview listeners
  document.querySelectorAll('.result-download-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'), 10);
      const res = AppState.results[index];
      if (res) triggerBrowserDownload(res.blobUrl, res.outputName);
    });
  });

  document.querySelectorAll('.result-preview-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.getAttribute('data-index'), 10);
      const res = AppState.results[index];
      if (res) {
        openPreviewModal(res.blobUrl, res.outputName, `${formatBytes(res.outputSize)} • ${res.dimensions || ''}`, res.blobUrl);
      }
    });
  });

  renderIcons();
  resultsSection.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Batch Download using JSZip
 */
async function downloadAllAsZip() {
  const JSZip = window.JSZip;
  if (!JSZip) {
    showToast('JSZip library is missing. Please download files individually.', 'error');
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder('PixelFlow_Converted');

  AppState.results.forEach(item => {
    folder.file(item.outputName, item.blob);
  });

  showToast('Bundling ZIP archive...', 'info');

  try {
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    triggerBrowserDownload(zipUrl, 'PixelFlow_Converted_Files.zip');
    showToast('ZIP archive downloaded! 🎉', 'success');
  } catch (err) {
    console.error('ZIP generation error:', err);
    showToast('Failed to create ZIP: ' + err.message, 'error');
  }
}

function triggerBrowserDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// =============================================================================
// 11. PREVIEW MODAL
// =============================================================================

function initPreviewModal() {
  const modal = document.getElementById('previewModal');
  const closeBtn = document.getElementById('closePreviewBtn');

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
    }
  });
}

function openPreviewModal(imgSrc, title, meta, downloadUrl) {
  const modal = document.getElementById('previewModal');
  const modalImg = document.getElementById('previewModalImg');
  const modalTitle = document.getElementById('previewModalTitle');
  const modalMeta = document.getElementById('previewModalMeta');
  const downloadBtn = document.getElementById('previewModalDownloadBtn');

  modalImg.src = imgSrc;
  modalTitle.textContent = title;
  modalMeta.textContent = meta;

  downloadBtn.onclick = () => {
    triggerBrowserDownload(downloadUrl, title);
  };

  modal.classList.remove('hidden');
}

// =============================================================================
// 12. TOAST NOTIFICATION SYSTEM
// =============================================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');

  const icons = {
    info: 'sparkles',
    success: 'check-circle-2',
    warning: 'alert-triangle',
    error: 'alert-circle'
  };

  const badgeColors = {
    info: 'bg-indigo-100 text-ground',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-800',
    error: 'bg-red-100 text-red-600'
  };

  toast.className = 'toast-enter pointer-events-auto pop-card p-4 border-2 border-slate-100 flex items-center gap-3 shadow-2xl text-xs font-black text-slate-800';
  toast.innerHTML = `
    <span class="w-8 h-8 rounded-xl ${badgeColors[type] || badgeColors.info} flex items-center justify-center shrink-0">
      <i data-lucide="${icons[type] || 'sparkles'}" class="w-4 h-4"></i>
    </span>
    <span class="flex-1 font-bold text-slate-800">${escapeHtml(message)}</span>
    <button type="button" class="toast-close pop-btn pop-btn-white !p-1 text-slate-400 hover:text-slate-800">
      <i data-lucide="x" class="w-3.5 h-3.5"></i>
    </button>
  `;

  container.appendChild(toast);
  renderIcons();

  const removeToast = () => {
    toast.classList.remove('toast-enter');
    toast.classList.add('toast-leave');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 250);
  };

  toast.querySelector('.toast-close').addEventListener('click', removeToast);
  setTimeout(removeToast, 4000);
}

// =============================================================================
// 13. UTILITY FUNCTIONS
// =============================================================================

function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function truncateString(str, num) {
  if (str.length <= num) return str;
  return str.slice(0, num) + '...';
}

function escapeHtml(string) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  return String(string).replace(/[&<>"'/]/g, s => entityMap[s]);
}
