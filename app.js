/**
 * OmniConvert — 100% Client-Side Engine for GitHub Pages & Offline Browsers
 * Converts PDF, DOCX, XLSX, CSV, JSON, Images, Audio, and more right in the browser!
 */

// Configure PDF.js Worker
if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// Application State
const state = {
  queue: [],    // Array of { id, file, ext, targetFormat, availableTargets, status }
  results: [],  // Array of { id, filename, blob, url, size }
  theme: localStorage.getItem('omni_theme') || 'dark'
};

// Format Catalog & Target Definitions
const FORMATS = {
  pdf:  { name: 'PDF Document', targets: ['docx', 'txt', 'html', 'png', 'jpg'] },
  docx: { name: 'Word Document', targets: ['pdf', 'html', 'md', 'txt'] },
  doc:  { name: 'Word Document', targets: ['html', 'md', 'txt'] },
  xlsx: { name: 'Excel Spreadsheet', targets: ['csv', 'json', 'html', 'pdf', 'xml', 'yaml', 'txt'] },
  xls:  { name: 'Excel 97-2003', targets: ['csv', 'json', 'html', 'pdf', 'xml', 'yaml', 'txt'] },
  csv:  { name: 'CSV File', targets: ['xlsx', 'json', 'html', 'pdf', 'xml', 'yaml', 'txt'] },
  tsv:  { name: 'TSV File', targets: ['xlsx', 'json', 'html', 'pdf', 'xml', 'yaml', 'csv'] },
  json: { name: 'JSON Data', targets: ['csv', 'xlsx', 'xml', 'yaml', 'html'] },
  xml:  { name: 'XML Data', targets: ['json', 'yaml', 'csv', 'xlsx'] },
  yaml: { name: 'YAML Data', targets: ['json', 'xml', 'csv', 'xlsx'] },
  yml:  { name: 'YAML Data', targets: ['json', 'xml', 'csv', 'xlsx'] },
  md:   { name: 'Markdown', targets: ['html', 'docx', 'pdf', 'txt'] },
  markdown: { name: 'Markdown', targets: ['html', 'docx', 'pdf', 'txt'] },
  html: { name: 'HTML Web Page', targets: ['pdf', 'docx', 'md', 'txt'] },
  htm:  { name: 'HTML Document', targets: ['pdf', 'docx', 'md', 'txt'] },
  txt:  { name: 'Plain Text', targets: ['pdf', 'docx', 'html'] },
  // Images
  png:  { name: 'PNG Image', targets: ['jpg', 'webp', 'pdf', 'ico', 'bmp'] },
  jpg:  { name: 'JPEG Image', targets: ['png', 'webp', 'pdf', 'ico', 'bmp'] },
  jpeg: { name: 'JPEG Image', targets: ['png', 'webp', 'pdf', 'ico', 'bmp'] },
  webp: { name: 'WebP Image', targets: ['png', 'jpg', 'pdf', 'ico', 'bmp'] },
  gif:  { name: 'GIF Image', targets: ['png', 'jpg', 'webp', 'pdf'] },
  bmp:  { name: 'Bitmap Image', targets: ['png', 'jpg', 'webp', 'pdf'] },
  svg:  { name: 'SVG Image', targets: ['png', 'jpg', 'webp', 'pdf'] }
};

// DOM Elements
const elements = {
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  universalDropZone: document.getElementById('universalDropZone'),
  universalFileInput: document.getElementById('universalFileInput'),
  browseFilesBtn: document.getElementById('browseFilesBtn'),
  queueSection: document.getElementById('queueSection'),
  queueCount: document.getElementById('queueCount'),
  queueList: document.getElementById('queueList'),
  clearQueueBtn: document.getElementById('clearQueueBtn'),
  convertAllBtn: document.getElementById('convertAllBtn'),
  imageOptionsCard: document.getElementById('imageOptionsCard'),
  optQuality: document.getElementById('optQuality'),
  qualityVal: document.getElementById('qualityVal'),
  optWidth: document.getElementById('optWidth'),
  optGrayscale: document.getElementById('optGrayscale'),
  resultsSection: document.getElementById('resultsSection'),
  resultsList: document.getElementById('resultsList'),
  downloadAllZipBtn: document.getElementById('downloadAllZipBtn'),
  toastContainer: document.getElementById('toastContainer'),
  // Audio elements
  audioDropZone: document.getElementById('audioDropZone'),
  audioFileInput: document.getElementById('audioFileInput'),
  browseAudioBtn: document.getElementById('browseAudioBtn'),
  audioPlayerSection: document.getElementById('audioPlayerSection'),
  audioFileName: document.getElementById('audioFileName'),
  audioFileMeta: document.getElementById('audioFileMeta'),
  audioPreview: document.getElementById('audioPreview'),
  convertAudioBtn: document.getElementById('convertAudioBtn'),
  audioResult: document.getElementById('audioResult'),
  downloadAudioBtn: document.getElementById('downloadAudioBtn'),
  // Dev Tools
  base64FileInput: document.getElementById('base64FileInput'),
  base64Output: document.getElementById('base64Output'),
  copyBase64Btn: document.getElementById('copyBase64Btn'),
  downloadBase64FileBtn: document.getElementById('downloadBase64FileBtn'),
  qrTextInput: document.getElementById('qrTextInput'),
  generateQrBtn: document.getElementById('generateQrBtn'),
  qrCanvasWrapper: document.getElementById('qrCanvasWrapper'),
  qrCanvas: document.getElementById('qrCanvas'),
  downloadQrBtn: document.getElementById('downloadQrBtn')
};

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(state.theme);
  setupEventListeners();
});

function setupEventListeners() {
  // Theme Toggle
  elements.themeToggleBtn.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(state.theme);
  });

  // Tab Navigation
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.tabButtons.forEach(b => b.classList.remove('active'));
      elements.tabPanes.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const targetPane = document.getElementById(`tab-${btn.dataset.tab}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Preset Card Handlers
  document.querySelectorAll('.quick-card').forEach(card => {
    card.addEventListener('click', () => {
      handlePresetClick(card.dataset.preset);
    });
  });

  // Drag and Drop (Universal)
  const dropZone = elements.universalDropZone;
  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFilesSelected(files);
  });

  elements.browseFilesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    elements.universalFileInput.click();
  });

  elements.universalFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      e.target.value = '';
    }
  });

  // Queue actions
  elements.clearQueueBtn.addEventListener('click', clearQueue);
  elements.convertAllBtn.addEventListener('click', convertAllFiles);
  elements.downloadAllZipBtn.addEventListener('click', downloadAllAsZip);

  // Quality range slider
  if (elements.optQuality) {
    elements.optQuality.addEventListener('input', (e) => {
      elements.qualityVal.textContent = `${e.target.value}%`;
    });
  }

  // Audio Drop Zone
  setupAudioListeners();

  // Dev Tools Listeners
  setupDevToolsListeners();
}

function handlePresetClick(preset) {
  const smartTabBtn = document.querySelector('.tab-btn[data-tab="smart"]');
  if (smartTabBtn) smartTabBtn.click();

  if (elements.universalFileInput) {
    if (preset.startsWith('pdf-')) elements.universalFileInput.accept = '.pdf';
    else if (preset.startsWith('docx-')) elements.universalFileInput.accept = '.docx';
    else if (preset.startsWith('xlsx-')) elements.universalFileInput.accept = '.xlsx,.xls';
    else if (preset.startsWith('csv-')) elements.universalFileInput.accept = '.csv';
    else if (preset.startsWith('images-') || preset.startsWith('to-')) elements.universalFileInput.accept = 'image/*';
    else elements.universalFileInput.accept = '*/*';

    elements.universalFileInput.click();
  }
}

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  } else {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }
  localStorage.setItem('omni_theme', theme);
}

// ================= FILE QUEUE HANDLING =================
function handleFilesSelected(files) {
  let hasImage = false;

  Array.from(files).forEach(file => {
    const ext = getFileExtension(file.name);
    const availableTargets = getTargetsForExtension(ext);
    const defaultTarget = availableTargets.length > 0 ? availableTargets[0] : 'txt';

    if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) {
      hasImage = true;
    }

    state.queue.push({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: file,
      ext: ext,
      targetFormat: defaultTarget,
      availableTargets: availableTargets,
      status: 'idle'
    });
  });

  if (hasImage && elements.imageOptionsCard) {
    elements.imageOptionsCard.classList.remove('hidden');
  }

  renderQueue();
  showToast(`Added ${files.length} file(s) to queue`, 'info');
}

function getFileExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

function getTargetsForExtension(ext) {
  const meta = FORMATS[ext];
  if (meta && meta.targets) return meta.targets;

  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(ext)) {
    return ['png', 'jpg', 'webp', 'pdf', 'ico'];
  }
  if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
    return ['csv', 'xlsx', 'json', 'html', 'pdf', 'xml', 'yaml'];
  }
  if (['json', 'xml', 'yaml', 'yml'].includes(ext)) {
    return ['csv', 'xlsx', 'json', 'xml', 'yaml'];
  }
  if (['pdf', 'docx', 'doc', 'md', 'html', 'txt'].includes(ext)) {
    return ext === 'pdf' ? ['docx', 'txt', 'html', 'png', 'jpg'] :
           ext === 'docx' ? ['pdf', 'html', 'md', 'txt'] : ['pdf', 'docx', 'html', 'txt'];
  }
  return ['txt', 'pdf'];
}

function renderQueue() {
  if (state.queue.length === 0) {
    elements.queueSection.classList.add('hidden');
    return;
  }

  elements.queueSection.classList.remove('hidden');
  elements.queueCount.textContent = state.queue.length;
  elements.queueList.innerHTML = '';

  state.queue.forEach(item => {
    const itemEl = document.createElement('div');
    itemEl.className = 'queue-item';
    itemEl.id = item.id;

    const badgeClass = `badge-${item.ext}`;
    const formattedSize = formatFileSize(item.file.size);

    const optionsHtml = item.availableTargets.map(tgt => 
      `<option value="${tgt}" ${tgt === item.targetFormat ? 'selected' : ''}>${tgt.toUpperCase()}</option>`
    ).join('');

    itemEl.innerHTML = `
      <div class="file-type-badge ${badgeClass}">${item.ext.slice(0, 4)}</div>
      <div class="file-info">
        <div class="file-name" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</div>
        <div class="file-size">${formattedSize}</div>
      </div>
      <div class="target-select-wrapper">
        <span class="target-label">Convert to:</span>
        <select class="select-input target-select" data-id="${item.id}">
          ${optionsHtml}
        </select>
      </div>
      <div class="queue-item-actions">
        <button class="btn btn-primary btn-sm btn-convert-single" data-id="${item.id}">Convert</button>
        <button class="btn-remove" data-id="${item.id}" title="Remove file">✕</button>
      </div>
    `;

    itemEl.querySelector('.target-select').addEventListener('change', (e) => {
      item.targetFormat = e.target.value;
    });

    itemEl.querySelector('.btn-convert-single').addEventListener('click', () => {
      convertSingleFile(item.id);
    });

    itemEl.querySelector('.btn-remove').addEventListener('click', () => {
      removeItemFromQueue(item.id);
    });

    elements.queueList.appendChild(itemEl);
  });
}

function removeItemFromQueue(id) {
  state.queue = state.queue.filter(i => i.id !== id);
  renderQueue();
}

function clearQueue() {
  state.queue = [];
  renderQueue();
}

// ================= PURE CLIENT-SIDE CONVERSION DISPATCHER =================
async function convertSingleFile(id) {
  const item = state.queue.find(i => i.id === id);
  if (!item) return;

  const btn = document.querySelector(`.btn-convert-single[data-id="${id}"]`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Converting...';
  }

  try {
    const converted = await processFileConversion(item.file, item.ext, item.targetFormat);

    if (Array.isArray(converted)) {
      // Multiple files returned (e.g. PDF to multiple images)
      converted.forEach(c => addResult(c));
      showToast(`Extracted ${converted.length} pages/images!`, 'success');
    } else {
      addResult(converted);
      showToast(`Converted: ${converted.filename}`, 'success');
    }

    removeItemFromQueue(item.id);
  } catch (err) {
    console.error(err);
    showToast(`Conversion failed: ${err.message}`, 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Retry';
    }
  }
}

async function convertAllFiles() {
  if (state.queue.length === 0) return;

  const btn = elements.convertAllBtn;
  btn.disabled = true;
  btn.textContent = `Converting ${state.queue.length} files...`;

  let count = 0;
  const queueCopy = [...state.queue];

  for (const item of queueCopy) {
    try {
      const converted = await processFileConversion(item.file, item.ext, item.targetFormat);
      if (Array.isArray(converted)) {
        converted.forEach(c => addResult(c));
      } else {
        addResult(converted);
      }
      removeItemFromQueue(item.id);
      count++;
    } catch (err) {
      console.error(`Error converting ${item.file.name}:`, err);
    }
  }

  btn.disabled = false;
  btn.textContent = 'Convert All Files';
  showToast(`Successfully converted ${count} files!`, 'success');
}

// Master File Processor — Executes entirely in the browser
async function processFileConversion(file, src, tgt) {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const arrayBuffer = await file.arrayBuffer();

  // 1. PDF CONVERSIONS
  if (src === 'pdf') {
    if (tgt === 'docx') {
      const { text } = await extractPdfText(arrayBuffer);
      const docxBlob = await buildDocxBlob(text, baseName);
      return {
        filename: `${baseName}.docx`,
        blob: docxBlob,
        url: URL.createObjectURL(docxBlob),
        size: docxBlob.size
      };
    }

    if (tgt === 'txt') {
      const { text } = await extractPdfText(arrayBuffer);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      return { filename: `${baseName}.txt`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'html') {
      const { text } = await extractPdfText(arrayBuffer);
      const safe = escapeHtml(text).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;}</style></head><body><h1>${baseName}</h1><p>${safe}</p></body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { filename: `${baseName}.html`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'png' || tgt === 'jpg') {
      return await convertPdfToImages(arrayBuffer, tgt, baseName);
    }
  }

  // 2. WORD (DOCX) CONVERSIONS
  if (src === 'docx') {
    if (tgt === 'html') {
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:8px;}</style></head><body>${result.value}</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { filename: `${baseName}.html`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'md' || tgt === 'markdown') {
      const htmlRes = await mammoth.convertToHtml({ arrayBuffer });
      const turndown = new TurndownService({ headingStyle: 'atx' });
      const md = turndown.turndown(htmlRes.value);
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      return { filename: `${baseName}.md`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'txt') {
      const textRes = await mammoth.extractRawText({ arrayBuffer });
      const blob = new Blob([textRes.value], { type: 'text/plain;charset=utf-8' });
      return { filename: `${baseName}.txt`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'pdf') {
      const textRes = await mammoth.extractRawText({ arrayBuffer });
      const pdfBlob = createPdfFromTextBrowser(textRes.value, baseName);
      return { filename: `${baseName}.pdf`, blob: pdfBlob, url: URL.createObjectURL(pdfBlob), size: pdfBlob.size };
    }
  }

  // 3. MARKDOWN CONVERSIONS
  if (src === 'md' || src === 'markdown') {
    const text = new TextDecoder().decode(arrayBuffer);
    if (tgt === 'html') {
      const bodyHtml = marked.parse(text);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:sans-serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;}code{background:#f1f5f9;padding:2px 6px;border-radius:4px;}</style></head><body>${bodyHtml}</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { filename: `${baseName}.html`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'docx') {
      const blob = await buildDocxBlob(text, baseName);
      return { filename: `${baseName}.docx`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'pdf') {
      const blob = createPdfFromTextBrowser(text, baseName);
      return { filename: `${baseName}.pdf`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'txt') {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      return { filename: `${baseName}.txt`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
  }

  // 4. HTML CONVERSIONS
  if (src === 'html' || src === 'htm') {
    const htmlText = new TextDecoder().decode(arrayBuffer);
    if (tgt === 'md') {
      const turndown = new TurndownService();
      const md = turndown.turndown(htmlText);
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      return { filename: `${baseName}.md`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'txt') {
      const div = document.createElement('div');
      div.innerHTML = htmlText;
      const plain = div.innerText || div.textContent || '';
      const blob = new Blob([plain], { type: 'text/plain;charset=utf-8' });
      return { filename: `${baseName}.txt`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'pdf') {
      const div = document.createElement('div');
      div.innerHTML = htmlText;
      const plain = div.innerText || div.textContent || '';
      const blob = createPdfFromTextBrowser(plain, baseName);
      return { filename: `${baseName}.pdf`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'docx') {
      const div = document.createElement('div');
      div.innerHTML = htmlText;
      const plain = div.innerText || div.textContent || '';
      const blob = await buildDocxBlob(plain, baseName);
      return { filename: `${baseName}.docx`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
  }

  // 5. PLAIN TEXT CONVERSIONS
  if (src === 'txt' || src === 'text') {
    const text = new TextDecoder().decode(arrayBuffer);
    if (tgt === 'pdf') {
      const blob = createPdfFromTextBrowser(text, baseName);
      return { filename: `${baseName}.pdf`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'docx') {
      const blob = await buildDocxBlob(text, baseName);
      return { filename: `${baseName}.docx`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
    if (tgt === 'html') {
      const safe = escapeHtml(text).replace(/\n/g, '<br/>');
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:monospace;white-space:pre-wrap;padding:30px;}</style></head><body>${safe}</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { filename: `${baseName}.html`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
  }

  // 6. EXCEL (XLSX, XLS) CONVERSIONS
  if (src === 'xlsx' || src === 'xls') {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

    if (tgt === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(firstSheet);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      return { filename: `${baseName}.csv`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'json') {
      const json = XLSX.utils.sheet_to_json(firstSheet);
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      return { filename: `${baseName}.json`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'html') {
      const table = XLSX.utils.sheet_to_html(firstSheet);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:sans-serif;padding:30px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;}th{background:#3b82f6;color:white;}</style></head><body><h2>${baseName}</h2>${table}</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { filename: `${baseName}.html`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'yaml') {
      const json = XLSX.utils.sheet_to_json(firstSheet);
      const yamlStr = jsyaml.dump(json);
      const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8' });
      return { filename: `${baseName}.yaml`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'xml') {
      const json = XLSX.utils.sheet_to_json(firstSheet);
      const xml = jsonToXml(json, 'dataset', 'record');
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      return { filename: `${baseName}.xml`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'pdf' || tgt === 'txt') {
      const csv = XLSX.utils.sheet_to_csv(firstSheet);
      if (tgt === 'txt') {
        const blob = new Blob([csv], { type: 'text/plain;charset=utf-8' });
        return { filename: `${baseName}.txt`, blob, url: URL.createObjectURL(blob), size: blob.size };
      }
      const blob = createPdfFromTextBrowser(csv, baseName);
      return { filename: `${baseName}.pdf`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
  }

  // 7. CSV / TSV CONVERSIONS
  if (src === 'csv' || src === 'tsv') {
    const csvText = new TextDecoder().decode(arrayBuffer);
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    const jsonData = parsed.data;

    if (tgt === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(jsonData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      return { filename: `${baseName}.xlsx`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'json') {
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      return { filename: `${baseName}.json`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'html') {
      const ws = XLSX.utils.json_to_sheet(jsonData);
      const table = XLSX.utils.sheet_to_html(ws);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:sans-serif;padding:30px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left;}th{background:#3b82f6;color:white;}</style></head><body><h2>${baseName}</h2>${table}</body></html>`;
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      return { filename: `${baseName}.html`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'yaml') {
      const yamlStr = jsyaml.dump(jsonData);
      const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8' });
      return { filename: `${baseName}.yaml`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'xml') {
      const xml = jsonToXml(jsonData, 'dataset', 'record');
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      return { filename: `${baseName}.xml`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'pdf' || tgt === 'txt') {
      if (tgt === 'txt') {
        const blob = new Blob([csvText], { type: 'text/plain;charset=utf-8' });
        return { filename: `${baseName}.txt`, blob, url: URL.createObjectURL(blob), size: blob.size };
      }
      const blob = createPdfFromTextBrowser(csvText, baseName);
      return { filename: `${baseName}.pdf`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
  }

  // 8. JSON CONVERSIONS
  if (src === 'json') {
    const jsonText = new TextDecoder().decode(arrayBuffer);
    const parsedData = JSON.parse(jsonText);
    const arrayData = Array.isArray(parsedData) ? parsedData : [parsedData];

    if (tgt === 'csv') {
      const csv = Papa.unparse(arrayData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      return { filename: `${baseName}.csv`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(arrayData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      return { filename: `${baseName}.xlsx`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'yaml') {
      const yamlStr = jsyaml.dump(parsedData);
      const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8' });
      return { filename: `${baseName}.yaml`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'xml') {
      const xml = jsonToXml(parsedData, 'root', 'item');
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      return { filename: `${baseName}.xml`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
  }

  // 9. YAML CONVERSIONS
  if (src === 'yaml' || src === 'yml') {
    const yamlText = new TextDecoder().decode(arrayBuffer);
    const parsed = jsyaml.load(yamlText);

    if (tgt === 'json') {
      const blob = new Blob([JSON.stringify(parsed, null, 2)], { type: 'application/json' });
      return { filename: `${baseName}.json`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'csv') {
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const csv = Papa.unparse(arr);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      return { filename: `${baseName}.csv`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    if (tgt === 'xml') {
      const xml = jsonToXml(parsed, 'root', 'item');
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      return { filename: `${baseName}.xml`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }
  }

  // 10. IMAGE CONVERSIONS (PNG, JPG, WEBP, GIF, BMP, SVG, ICO)
  if (['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(src)) {
    if (tgt === 'pdf') {
      const blob = await convertImageToPdfBrowser(file, baseName);
      return { filename: `${baseName}.pdf`, blob, url: URL.createObjectURL(blob), size: blob.size };
    }

    const convertedBlob = await convertImageBrowser(file, tgt);
    return {
      filename: `${baseName}.${tgt}`,
      blob: convertedBlob,
      url: URL.createObjectURL(convertedBlob),
      size: convertedBlob.size
    };
  }

  throw new Error(`Conversion from ${src.toUpperCase()} to ${tgt.toUpperCase()} is not supported.`);
}

// ================= BROWSER CONVERSION HELPERS =================

// Extract text from PDF using PDF.js
async function extractPdfText(arrayBuffer) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pagesText = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageString = content.items.map(item => item.str).join(' ');
    pagesText.push(pageString);
  }

  return { text: pagesText.join('\n\n'), numPages: pdf.numPages, pages: pagesText };
}

// Render PDF pages as crisp images
async function convertPdfToImages(arrayBuffer, targetFormat, baseName) {
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const results = [];
  const mime = targetFormat === 'jpg' ? 'image/jpeg' : 'image/png';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for high resolution
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');

    // Fill white background for JPEG
    if (targetFormat === 'jpg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await page.render({ canvasContext: ctx, viewport: viewport }).promise;

    const blob = await new Promise(res => canvas.toBlob(res, mime, 0.95));
    const filename = `${baseName}_page_${i}.${targetFormat}`;

    results.push({
      id: `${baseName}_p${i}_${Date.now()}`,
      filename: filename,
      blob: blob,
      url: URL.createObjectURL(blob),
      size: blob.size
    });
  }

  return results;
}

// Generate real, fully compliant Microsoft Word (.docx) directly using JSZip in browser!
async function buildDocxBlob(text, title = 'Document') {
  const zip = new JSZip();

  // Split lines and build Word paragraphs XML
  const lines = (text || '').split(/\r?\n/);
  let paragraphsXml = '';

  if (title) {
    paragraphsXml += `
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r><w:rPr><w:b/><w:sz w:val="36"/></w:rPr><w:t>${escapeXml(title)}</w:t></w:r>
      </w:p>
      <w:p/>
    `;
  }

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphsXml += '<w:p/>';
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,6}\s+/, '');
      paragraphsXml += `
        <w:p>
          <w:r><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="2B579A"/></w:rPr><w:t>${escapeXml(heading)}</w:t></w:r>
        </w:p>
      `;
    } else if (/^[\*\-•]\s+/.test(trimmed)) {
      const bullet = trimmed.replace(/^[\*\-•]\s+/, '');
      paragraphsXml += `
        <w:p>
          <w:pPr><w:ind w:left="720"/></w:pPr>
          <w:r><w:t>• ${escapeXml(bullet)}</w:t></w:r>
        </w:p>
      `;
    } else {
      paragraphsXml += `
        <w:p>
          <w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t>${escapeXml(trimmed)}</w:t></w:r>
        </w:p>
      `;
    }
  }

  // 1. [Content_Types].xml
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  // 2. _rels/.rels
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  // 3. word/document.xml
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`);

  const docxArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  return new Blob([docxArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

// Generate PDF from text in browser using jsPDF
function createPdfFromTextBrowser(text, title = 'Document') {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const margin = 40;
  const maxLineWidth = 515;
  let y = margin;

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(title, margin, y);
    y += 24;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, margin + maxLineWidth, y);
    y += 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lineHeight = 14;

  const lines = doc.splitTextToSize(text || '', maxLineWidth);

  for (let i = 0; i < lines.length; i++) {
    if (y > 800) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  return doc.output('blob');
}

// Convert image format via HTML5 Canvas
async function convertImageBrowser(file, targetFormat) {
  const img = await createImageElement(file);
  const canvas = document.createElement('canvas');
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  // Custom resize if specified
  const maxWidth = elements.optWidth && elements.optWidth.value ? parseInt(elements.optWidth.value, 10) : null;
  if (maxWidth && width > maxWidth) {
    height = Math.round(height * (maxWidth / width));
    width = maxWidth;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Fill white for JPEG
  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.drawImage(img, 0, 0, width, height);

  // Apply Grayscale filter if checked
  if (elements.optGrayscale && elements.optGrayscale.checked) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const avg = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
      d[i] = avg;
      d[i + 1] = avg;
      d[i + 2] = avg;
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const quality = elements.optQuality ? parseInt(elements.optQuality.value, 10) / 100 : 0.85;

  let mime = 'image/png';
  if (targetFormat === 'jpg' || targetFormat === 'jpeg') mime = 'image/jpeg';
  else if (targetFormat === 'webp') mime = 'image/webp';
  else if (targetFormat === 'ico') mime = 'image/x-icon';

  return new Promise(res => canvas.toBlob(res, mime, quality));
}

// Convert single or multiple images into a clean PDF using jsPDF
async function convertImageToPdfBrowser(file, baseName) {
  const img = await createImageElement(file);
  const { jsPDF } = window.jspdf;

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const orientation = width > height ? 'l' : 'p';

  const doc = new jsPDF({
    orientation: orientation,
    unit: 'pt',
    format: [width, height]
  });

  doc.addImage(img, 'PNG', 0, 0, width, height);
  return doc.output('blob');
}

function createImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// Convert JSON object/array to clean XML string
function jsonToXml(obj, rootName = 'root', itemName = 'item') {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n`;

  function build(data, indent = '  ') {
    if (Array.isArray(data)) {
      data.forEach(item => {
        xml += `${indent}<${itemName}>\n`;
        build(item, indent + '  ');
        xml += `${indent}</${itemName}>\n`;
      });
    } else if (typeof data === 'object' && data !== null) {
      for (const key in data) {
        const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (typeof data[key] === 'object') {
          xml += `${indent}<${safeKey}>\n`;
          build(data[key], indent + '  ');
          xml += `${indent}</${safeKey}>\n`;
        } else {
          xml += `${indent}<${safeKey}>${escapeXml(String(data[key]))}</${safeKey}>\n`;
        }
      }
    } else {
      xml += `${indent}${escapeXml(String(data))}\n`;
    }
  }

  build(obj);
  xml += `</${rootName}>`;
  return xml;
}

// ================= RESULTS & ZIP HANDLING =================
function addResult(resultObj) {
  state.results.unshift(resultObj);
  renderResults();
}

function renderResults() {
  if (state.results.length === 0) {
    elements.resultsSection.classList.add('hidden');
    return;
  }

  elements.resultsSection.classList.remove('hidden');
  elements.resultsList.innerHTML = '';

  state.results.forEach(res => {
    const itemEl = document.createElement('div');
    itemEl.className = 'result-item';

    itemEl.innerHTML = `
      <div class="result-info">
        <span class="result-icon">📄</span>
        <div>
          <div class="result-name">${escapeHtml(res.filename)}</div>
          <div class="result-meta">Ready • ${formatFileSize(res.size)}</div>
        </div>
      </div>
      <div class="result-actions">
        <a href="${res.url}" download="${escapeHtml(res.filename)}" class="btn btn-success btn-sm">
          ⬇️ Download
        </a>
      </div>
    `;

    elements.resultsList.appendChild(itemEl);
  });
}

// Bundle all converted files into a ZIP archive entirely in the browser!
async function downloadAllAsZip() {
  if (state.results.length === 0) return;

  showToast('Packaging ZIP archive in browser...', 'info');
  const zip = new JSZip();

  state.results.forEach(r => {
    zip.file(r.filename, r.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `converted_files_${Date.now()}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Downloaded ZIP bundle!', 'success');
}

// ================= AUDIO CONVERTER (CLIENT-SIDE WEB AUDIO) =================
let currentAudioFile = null;

function setupAudioListeners() {
  const dropZone = elements.audioDropZone;
  if (!dropZone) return;

  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files && files[0]) loadAudioFile(files[0]);
  });

  elements.browseAudioBtn.addEventListener('click', () => {
    elements.audioFileInput.click();
  });

  elements.audioFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      loadAudioFile(e.target.files[0]);
    }
  });

  elements.convertAudioBtn.addEventListener('click', transcodeAudio);
}

function loadAudioFile(file) {
  currentAudioFile = file;
  elements.audioFileName.textContent = file.name;
  elements.audioFileMeta.textContent = `Size: ${formatFileSize(file.size)}`;

  const fileUrl = URL.createObjectURL(file);
  elements.audioPreview.src = fileUrl;
  elements.audioPlayerSection.classList.remove('hidden');
  elements.audioResult.classList.add('hidden');

  showToast(`Loaded audio file: ${file.name}`, 'info');
}

async function transcodeAudio() {
  if (!currentAudioFile) return;

  const btn = elements.convertAudioBtn;
  btn.disabled = true;
  btn.textContent = 'Transcoding to WAV in browser...';

  try {
    const arrayBuffer = await currentAudioFile.arrayBuffer();
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const wavBlob = audioBufferToWav(decodedBuffer);
    const outName = `${currentAudioFile.name.replace(/\.[^/.]+$/, '')}.wav`;
    const wavUrl = URL.createObjectURL(wavBlob);

    elements.downloadAudioBtn.href = wavUrl;
    elements.downloadAudioBtn.download = outName;
    elements.audioResult.classList.remove('hidden');

    showToast(`Audio transcoded to WAV: ${outName}`, 'success');
  } catch (err) {
    console.error(err);
    showToast(`Audio transcoding error: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Transcode Audio';
  }
}

function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let channels = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
  function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);          // PCM
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out], { type: 'audio/wav' });
}

// ================= DEV TOOLS (BASE64 & QR CODE) =================
function setupDevToolsListeners() {
  if (elements.base64FileInput) {
    elements.base64FileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        elements.base64Output.value = reader.result;
        showToast('File encoded to Base64!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  if (elements.copyBase64Btn) {
    elements.copyBase64Btn.addEventListener('click', () => {
      if (!elements.base64Output.value) return;
      navigator.clipboard.writeText(elements.base64Output.value);
      showToast('Copied to clipboard!', 'info');
    });
  }

  if (elements.downloadBase64FileBtn) {
    elements.downloadBase64FileBtn.addEventListener('click', () => {
      const raw = elements.base64Output.value.trim();
      if (!raw) return;

      try {
        let mime = 'application/octet-stream';
        let b64 = raw;
        if (raw.startsWith('data:')) {
          const parts = raw.split(';base64,');
          mime = parts[0].replace('data:', '');
          b64 = parts[1];
        }

        const byteCharacters = atob(b64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `decoded_file_${Date.now()}`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Decoded file downloaded!', 'success');
      } catch (err) {
        showToast('Invalid Base64 string', 'error');
      }
    });
  }

  if (elements.generateQrBtn) {
    elements.generateQrBtn.addEventListener('click', generateQrCode);
  }
}

function generateQrCode() {
  const text = elements.qrTextInput.value.trim();
  if (!text) {
    showToast('Please enter text or URL', 'error');
    return;
  }

  const canvas = elements.qrCanvas;
  const ctx = canvas.getContext('2d');
  const size = 260;
  canvas.width = size;
  canvas.height = size;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.drawImage(img, 10, 10, size - 20, size - 20);
    elements.qrCanvasWrapper.classList.remove('hidden');
    elements.downloadQrBtn.href = canvas.toDataURL('image/png');
    showToast('QR Code generated!', 'success');
  };
  img.onerror = () => {
    ctx.fillStyle = '#000000';
    ctx.font = '14px sans-serif';
    ctx.fillText(text.slice(0, 25), 20, size / 2);
    elements.qrCanvasWrapper.classList.remove('hidden');
  };
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(text)}`;
}

// ================= UTILITIES =================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${escapeHtml(message)}</span>`;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
