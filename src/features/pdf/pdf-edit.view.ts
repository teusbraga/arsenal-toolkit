import * as pdfjsLib from 'pdfjs-dist';
import { PdfService, PdfEditItem } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

type ToolType = 'move' | 'rect_white' | 'rect_black' | 'text' | 'image' | 'signature';

interface UIEditItem {
  id: string;
  type: 'rect' | 'text' | 'image';
  xRatio: number;
  yRatio: number;
  wRatio?: number;
  hRatio?: number;
  color: 'white' | 'black';
  text?: string;
  fontSizeRatio?: number;
  weight?: 'normal' | 'bold';
  dataUrl?: string; // For images/signatures
}

export function renderPdfEdit(container: HTMLElement) {
  let isProcessing = false;
  let selectedFile: File | null = null;
  let loadedBuffer: ArrayBuffer | null = null;
  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  
  let currentPage = 1;
  let totalPages = 1;
  let currentTool: ToolType = 'move';
  const pagesEdits: Record<number, UIEditItem[]> = {};

  // Drawing Rect
  let isDrawing = false;
  let currentDrawingId: string | null = null;
  let startX = 0, startY = 0;

  // Dragging Items
  let isDraggingItem = false;
  let dragItemId: string | null = null;
  let dragOffsetX = 0, dragOffsetY = 0;
  
  // Resizing Items
  let isResizingItem = false;
  let resizeItemId: string | null = null;

  // Signature Pad
  let sigIsDrawing = false;
  let sigLastX = 0, sigLastY = 0;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-edit" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Editor Visual (PDF)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-edit" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdf-edit-setup-area">
      <div class="dropzone-box" id="pdf-edit-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <div class="dropzone-text">Arraste seu PDF para cá</div>
        <div class="dropzone-hint">Ou clique para selecionar um arquivo</div>
        <input type="file" id="pdf-edit-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdf-edit-workspace-area" style="display: none; flex-direction: column; gap: 16px;">
      
      <!-- Toolbar -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); flex-wrap: wrap; gap: 8px;">
        
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-back" id="btn-edit-prev" style="width: 36px; height: 36px; padding: 0;">&lt;</button>
          <span style="font-size: 0.9rem; white-space: nowrap;">Pág <span id="pdf-edit-page-num">1</span> de <span id="pdf-edit-page-total">1</span></span>
          <button class="btn-back" id="btn-edit-next" style="width: 36px; height: 36px; padding: 0;">&gt;</button>
        </div>

        <div class="segmented-tabs" id="pdf-edit-tools" style="background: var(--bg-page); border: 1px solid var(--border-color); flex-wrap: wrap;">
          <button class="tab-btn active" data-tool="move" title="Mover / Selecionar">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
          </button>
          <button class="tab-btn" data-tool="rect_white" title="Corretivo Branco">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
          </button>
          <button class="tab-btn" data-tool="rect_black" title="Tarja Preta (Censura)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="black" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
          </button>
          <button class="tab-btn" data-tool="text" title="Adicionar Texto">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          </button>
          <button class="tab-btn" data-tool="image" title="Inserir Imagem" id="btn-insert-image">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </button>
          <button class="tab-btn" data-tool="signature" title="Assinatura Livre" id="btn-insert-signature">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
          </button>
        </div>

        <button class="btn-primary" id="btn-pdf-edit-execute" style="width: auto; padding: 0 16px;">
          Salvar Edições
        </button>
      </div>
      <input type="file" id="pdf-edit-img-input" accept="image/png, image/jpeg" style="display: none;" />

      <!-- PDF Canvas Container -->
      <div style="display: flex; justify-content: center; overflow: auto; background: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: 8px;">
        <div id="pdf-edit-wrapper" style="position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.1); user-select: none;">
          <canvas id="pdf-edit-canvas" style="display: block;"></canvas>
          <div id="pdf-edit-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden;"></div>
        </div>
      </div>
      
      <button class="btn-back" id="btn-reset-pdf-edit" style="justify-content: center; height: 44px;">
        Descartar e Trocar Arquivo
      </button>

    </div>

    <!-- Signature Modal -->
    <div id="pdf-sig-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
      <div style="background:var(--bg-surface); padding:24px; border-radius:8px; width:90%; max-width:500px;">
        <h3 style="margin-top:0;">Assinar Documento</h3>
        <canvas id="pdf-sig-canvas" width="400" height="200" style="border:1px solid var(--border-color); background:#fff; width:100%; touch-action:none; border-radius:4px; cursor:crosshair;"></canvas>
        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:16px;">
          <button class="btn-back" id="btn-sig-clear">Limpar</button>
          <button class="btn-back" id="btn-sig-cancel">Cancelar</button>
          <button class="btn-primary" id="btn-sig-save">Inserir Assinatura</button>
        </div>
      </div>
    </div>
  `;

  // --- UI Elements ---
  const setupArea = container.querySelector('#pdf-edit-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdf-edit-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#pdf-edit-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdf-edit-file-input') as HTMLInputElement;
  const imgInput = container.querySelector('#pdf-edit-img-input') as HTMLInputElement;
  
  const canvas = container.querySelector('#pdf-edit-canvas') as HTMLCanvasElement;
  const overlay = container.querySelector('#pdf-edit-overlay') as HTMLDivElement;
  const wrapper = container.querySelector('#pdf-edit-wrapper') as HTMLDivElement;
  
  const sigModal = container.querySelector('#pdf-sig-modal') as HTMLDivElement;
  const sigCanvas = container.querySelector('#pdf-sig-canvas') as HTMLCanvasElement;
  const sigCtx = sigCanvas.getContext('2d');
  const btnSigClear = container.querySelector('#btn-sig-clear') as HTMLButtonElement;
  const btnSigCancel = container.querySelector('#btn-sig-cancel') as HTMLButtonElement;
  const btnSigSave = container.querySelector('#btn-sig-save') as HTMLButtonElement;

  const spanPageNum = container.querySelector('#pdf-edit-page-num') as HTMLSpanElement;
  const spanPageTotal = container.querySelector('#pdf-edit-page-total') as HTMLSpanElement;
  const btnPrev = container.querySelector('#btn-edit-prev') as HTMLButtonElement;
  const btnNext = container.querySelector('#btn-edit-next') as HTMLButtonElement;
  const toolBtns = container.querySelectorAll('#pdf-edit-tools .tab-btn');
  const btnExecute = container.querySelector('#btn-pdf-edit-execute') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-pdf-edit') as HTMLButtonElement;
  const btnBack = container.querySelector('#btn-back-pdf-edit') as HTMLButtonElement;

  workspaceArea.style.display = 'none';
  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    loadedBuffer = null;
    pdfDoc = null;
    for(const key in pagesEdits) delete pagesEdits[key];
    fileInput.value = '';
  });

  // --- Tools Selection ---
  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = (btn as HTMLElement).dataset.tool as ToolType;
      
      if (tool === 'image') {
        imgInput.click();
        return; // Don't change active tool
      }
      if (tool === 'signature') {
        openSignatureModal();
        return; // Don't change active tool
      }

      toolBtns.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      currentTool = tool;
      
      if (currentTool === 'move') {
        overlay.style.cursor = 'default';
      } else if (currentTool === 'text') {
        overlay.style.cursor = 'text';
      } else {
        overlay.style.cursor = 'crosshair';
      }
      renderOverlayItems(currentPage);
    });
  });

  // --- File Loading ---
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files.length > 0) {
      await handleFile(fileInput.files[0]);
    }
  });

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') return alert('Selecione um arquivo PDF válido.');
    selectedFile = file;
    loadedBuffer = await PdfService.readFileAsArrayBuffer(file);
    
    // Passar uma cópia (.slice(0)) para evitar que o worker do PDF.js desacople o ArrayBuffer original
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(loadedBuffer.slice(0)) });
    pdfDoc = await loadingTask.promise;
    
    currentPage = 1;
    totalPages = pdfDoc.numPages;
    spanPageTotal.innerText = totalPages.toString();
    
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'flex';
    
    await renderPage(currentPage);
  }

  async function renderPage(pageNum: number) {
    if (!pdfDoc) return;
    spanPageNum.innerText = pageNum.toString();
    
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const renderContext: any = { canvasContext: context, viewport };
      await page.render(renderContext).promise;
    }
    
    renderOverlayItems(pageNum);
  }

  btnPrev.addEventListener('click', async () => { if (currentPage > 1) await renderPage(--currentPage); });
  btnNext.addEventListener('click', async () => { if (currentPage < totalPages) await renderPage(++currentPage); });

  // --- Image Upload ---
  imgInput.addEventListener('change', () => {
    if (imgInput.files && imgInput.files.length > 0) {
      const file = imgInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        // Generate an image to get natural dimensions
        const img = new Image();
        img.onload = () => {
          // Default size: max 30% of page width
          const maxWidthRatio = 0.3;
          let wRatio = img.width / canvas.width;
          let hRatio = img.height / canvas.height;
          
          if (wRatio > maxWidthRatio) {
            const scale = maxWidthRatio / wRatio;
            wRatio = wRatio * scale;
            hRatio = hRatio * scale;
          }

          if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
          pagesEdits[currentPage].push({
            id: crypto.randomUUID(),
            type: 'image',
            dataUrl: dataUrl,
            xRatio: 0.1, // drop near top-left
            yRatio: 0.1,
            wRatio: wRatio,
            hRatio: hRatio,
            color: 'white' // ignored
          });
          currentTool = 'move';
          toolBtns.forEach(t => t.classList.remove('active'));
          container.querySelector('[data-tool="move"]')?.classList.add('active');
          overlay.style.cursor = 'default';
          renderOverlayItems(currentPage);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
    imgInput.value = '';
  });

  // --- Signature Pad Logic ---
  function openSignatureModal() {
    sigModal.style.display = 'flex';
    if(sigCtx) {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      sigCtx.lineWidth = 3;
      sigCtx.lineCap = 'round';
      sigCtx.strokeStyle = '#000000';
    }
  }

  function getSigPos(e: MouseEvent | TouchEvent) {
    const rect = sigCanvas.getBoundingClientRect();
    const evt = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : (e as MouseEvent);
    return {
      x: (evt.clientX - rect.left) * (sigCanvas.width / rect.width),
      y: (evt.clientY - rect.top) * (sigCanvas.height / rect.height)
    };
  }

  sigCanvas.addEventListener('mousedown', (e) => { sigIsDrawing = true; const pos = getSigPos(e); sigLastX = pos.x; sigLastY = pos.y; });
  sigCanvas.addEventListener('mousemove', (e) => {
    if (!sigIsDrawing || !sigCtx) return;
    const pos = getSigPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(sigLastX, sigLastY);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
    sigLastX = pos.x;
    sigLastY = pos.y;
  });
  sigCanvas.addEventListener('mouseup', () => sigIsDrawing = false);
  sigCanvas.addEventListener('mouseout', () => sigIsDrawing = false);

  // touch support
  sigCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); sigIsDrawing = true; const pos = getSigPos(e); sigLastX = pos.x; sigLastY = pos.y; });
  sigCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!sigIsDrawing || !sigCtx) return;
    const pos = getSigPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(sigLastX, sigLastY);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
    sigLastX = pos.x;
    sigLastY = pos.y;
  });
  sigCanvas.addEventListener('touchend', () => sigIsDrawing = false);

  btnSigClear.addEventListener('click', () => sigCtx?.clearRect(0, 0, sigCanvas.width, sigCanvas.height));
  btnSigCancel.addEventListener('click', () => sigModal.style.display = 'none');
  btnSigSave.addEventListener('click', () => {
    const dataUrl = sigCanvas.toDataURL('image/png');
    
    // Check if empty (heuristic: getImageData)
    const px = sigCtx?.getImageData(0,0,sigCanvas.width, sigCanvas.height).data;
    let isEmpty = true;
    if (px) {
      for(let i=3; i<px.length; i+=4) { if(px[i] !== 0) { isEmpty = false; break; } }
    }
    if (isEmpty) {
      alert('Assinatura vazia.');
      return;
    }

    if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
    pagesEdits[currentPage].push({
      id: crypto.randomUUID(),
      type: 'image',
      dataUrl: dataUrl,
      xRatio: 0.1,
      yRatio: 0.1,
      wRatio: 0.2, // standard width 20%
      hRatio: 0.1, // standard height 10%
      color: 'white'
    });
    
    currentTool = 'move';
    toolBtns.forEach(t => t.classList.remove('active'));
    container.querySelector('[data-tool="move"]')?.classList.add('active');
    overlay.style.cursor = 'default';
    
    sigModal.style.display = 'none';
    renderOverlayItems(currentPage);
  });

  // --- Editor Overlay Interaction (Drawing & Dragging) ---
  overlay.addEventListener('mousedown', (e) => {
    // If we clicked on an item or a resize handle, let that handle it.
    if ((e.target as HTMLElement).closest('.pdf-edit-item')) return;
    
    if (currentTool === 'rect_white' || currentTool === 'rect_black') {
      isDrawing = true;
      const rect = overlay.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      
      currentDrawingId = crypto.randomUUID();
      
      if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
      pagesEdits[currentPage].push({
        id: currentDrawingId,
        type: 'rect',
        xRatio: startX / rect.width,
        yRatio: startY / rect.height,
        wRatio: 0,
        hRatio: 0,
        color: currentTool === 'rect_white' ? 'white' : 'black'
      });
      renderOverlayItems(currentPage);
    }
  });

  overlay.addEventListener('mousemove', (e) => {
    const rect = overlay.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    // Draw Rectangle
    if (isDrawing && currentDrawingId) {
      const item = pagesEdits[currentPage]?.find(i => i.id === currentDrawingId);
      if (item && item.type === 'rect') {
        const w = currentX - startX;
        const h = currentY - startY;
        const originX = w < 0 ? currentX : startX;
        const originY = h < 0 ? currentY : startY;
        
        item.xRatio = originX / rect.width;
        item.yRatio = originY / rect.height;
        item.wRatio = Math.abs(w) / rect.width;
        item.hRatio = Math.abs(h) / rect.height;
        
        renderOverlayItems(currentPage);
      }
      return;
    }

    // Drag Item
    if (isDraggingItem && dragItemId) {
      const item = pagesEdits[currentPage]?.find(i => i.id === dragItemId);
      if (item) {
        item.xRatio = (currentX - dragOffsetX) / rect.width;
        item.yRatio = (currentY - dragOffsetY) / rect.height;
        renderOverlayItems(currentPage);
      }
      return;
    }

    // Resize Item (Images/Rects)
    if (isResizingItem && resizeItemId) {
      const item = pagesEdits[currentPage]?.find(i => i.id === resizeItemId);
      if (item) {
        const newW = currentX - (item.xRatio * rect.width);
        const newH = currentY - (item.yRatio * rect.height);
        
        if (newW > 10) item.wRatio = newW / rect.width;
        if (newH > 10) item.hRatio = newH / rect.height;
        renderOverlayItems(currentPage);
      }
      return;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDrawing) { isDrawing = false; currentDrawingId = null; return; }
    if (isDraggingItem) { isDraggingItem = false; dragItemId = null; return; }
    if (isResizingItem) { isResizingItem = false; resizeItemId = null; return; }
  });

  overlay.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.pdf-edit-item')) return;
    
    if (currentTool === 'text') {
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
      pagesEdits[currentPage].push({
        id: crypto.randomUUID(),
        type: 'text',
        xRatio: x / rect.width,
        yRatio: y / rect.height,
        color: 'black',
        text: 'Novo texto',
        fontSizeRatio: 16 / rect.height
      });
      
      currentTool = 'move';
      toolBtns.forEach(t => t.classList.remove('active'));
      container.querySelector('[data-tool="move"]')?.classList.add('active');
      overlay.style.cursor = 'default';
      renderOverlayItems(currentPage);
    }
  });

  // --- Render Items ---
  function renderOverlayItems(pageNum: number) {
    overlay.innerHTML = '';
    const items = pagesEdits[pageNum] || [];
    
    items.forEach(item => {
      const el = document.createElement('div');
      el.classList.add('pdf-edit-item');
      el.style.position = 'absolute';
      el.style.left = `${item.xRatio * 100}%`;
      el.style.top = `${item.yRatio * 100}%`;
      
      if (currentTool === 'move') {
        el.style.cursor = 'move';
        el.addEventListener('mousedown', (e) => {
          if ((e.target as HTMLElement).classList.contains('resize-handle') || (e.target as HTMLElement).classList.contains('del-btn')) return;
          isDraggingItem = true;
          dragItemId = item.id;
          const rect = overlay.getBoundingClientRect();
          dragOffsetX = (e.clientX - rect.left) - (item.xRatio * rect.width);
          dragOffsetY = (e.clientY - rect.top) - (item.yRatio * rect.height);
          e.stopPropagation();
        });
      }

      if (item.type === 'rect') {
        el.style.width = `${(item.wRatio || 0) * 100}%`;
        el.style.height = `${(item.hRatio || 0) * 100}%`;
        el.style.backgroundColor = item.color;
        if (currentTool === 'move') {
          el.style.border = '1px solid #0066ff';
        }
      } else if (item.type === 'image') {
        el.style.width = `${(item.wRatio || 0) * 100}%`;
        el.style.height = `${(item.hRatio || 0) * 100}%`;
        el.style.backgroundImage = `url(${item.dataUrl})`;
        el.style.backgroundSize = '100% 100%';
        if (currentTool === 'move') {
          el.style.border = '1px dashed #0066ff';
        }
      } else if (item.type === 'text') {
        el.style.color = item.color;
        el.style.fontSize = `${(item.fontSizeRatio || 0) * overlay.clientHeight}px`;
        el.style.whiteSpace = 'nowrap';
        el.style.fontFamily = 'Helvetica, Arial, sans-serif';
        if (item.weight === 'bold') el.style.fontWeight = 'bold';
        
        const input = document.createElement('span');
        input.contentEditable = currentTool === 'move' ? 'true' : 'false';
        input.innerText = item.text || '';
        input.style.outline = 'none';
        
        input.addEventListener('input', () => { item.text = input.innerText; });
        el.appendChild(input);
        
        if (currentTool === 'move') {
          el.style.border = '1px dashed #0066ff';
          el.style.padding = '2px';
        }
      }

      // Controls for 'move' mode
      if (currentTool === 'move') {
        // Delete button
        const delBtn = document.createElement('button');
        delBtn.classList.add('del-btn');
        delBtn.innerHTML = '&times;';
        delBtn.style.position = 'absolute';
        delBtn.style.right = '-10px';
        delBtn.style.top = '-10px';
        delBtn.style.background = 'red';
        delBtn.style.color = 'white';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '50%';
        delBtn.style.width = '20px';
        delBtn.style.height = '20px';
        delBtn.style.cursor = 'pointer';
        delBtn.style.display = 'flex';
        delBtn.style.alignItems = 'center';
        delBtn.style.justifyContent = 'center';
        delBtn.style.zIndex = '100';
        
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          pagesEdits[pageNum] = pagesEdits[pageNum].filter(i => i.id !== item.id);
          renderOverlayItems(pageNum);
        });
        el.appendChild(delBtn);

        // Resize handle for Rect and Image
        if (item.type === 'rect' || item.type === 'image') {
          const resizer = document.createElement('div');
          resizer.classList.add('resize-handle');
          resizer.style.position = 'absolute';
          resizer.style.right = '-5px';
          resizer.style.bottom = '-5px';
          resizer.style.width = '10px';
          resizer.style.height = '10px';
          resizer.style.background = '#0066ff';
          resizer.style.cursor = 'se-resize';
          resizer.style.borderRadius = '50%';
          
          resizer.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizingItem = true;
            resizeItemId = item.id;
          });
          el.appendChild(resizer);
        }
      }
      
      overlay.appendChild(el);
    });
  }

  // --- Execution ---
  btnExecute.addEventListener('click', async () => {
    if (!selectedFile || !pdfDoc || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    
    try {
      const editsForService: Record<number, PdfEditItem[]> = {};
      
      for (const pageIdxStr in pagesEdits) {
        const pIdx = parseInt(pageIdxStr, 10);
        const page = await pdfDoc.getPage(pIdx);
        const vp = page.getViewport({ scale: 1.0 });
        const pdfW = vp.width;
        const pdfH = vp.height;
        
        const uiItems = pagesEdits[pIdx];
        if (!uiItems || uiItems.length === 0) continue;
        
        editsForService[pIdx - 1] = uiItems.map(ui => {
          if (ui.type === 'rect') {
            const wPts = (ui.wRatio || 0) * pdfW;
            const hPts = (ui.hRatio || 0) * pdfH;
            return {
              type: 'rect',
              x: ui.xRatio * pdfW,
              y: pdfH - (ui.yRatio * pdfH) - hPts,
              width: wPts,
              height: hPts,
              color: ui.color
            } as PdfEditItem;
          } else if (ui.type === 'image') {
            const wPts = (ui.wRatio || 0) * pdfW;
            const hPts = (ui.hRatio || 0) * pdfH;
            return {
              type: 'image',
              dataUrl: ui.dataUrl || '',
              x: ui.xRatio * pdfW,
              y: pdfH - (ui.yRatio * pdfH) - hPts,
              width: wPts,
              height: hPts,
            } as PdfEditItem;
          } else {
            const sizePts = (ui.fontSizeRatio || 0.02) * pdfH;
            return {
              type: 'text',
              text: ui.text || '',
              x: ui.xRatio * pdfW,
              y: pdfH - (ui.yRatio * pdfH) - (sizePts * 0.8), // Baseline approx
              size: sizePts,
              color: ui.color,
              weight: ui.weight || 'normal'
            } as PdfEditItem;
          }
        });
      }
      
      const fileBuffer = await selectedFile.arrayBuffer();
      const newPdfBytes = await PdfService.applyEdits(fileBuffer, editsForService);
      
      const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_editado.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record('pdf-edit', 'pdf', 'Editor Visual', selectedFile.name, 'PDF editado salvo com sucesso', {});
      
    } catch(err) {
      console.error(err);
      alert('Erro ao aplicar edições no PDF.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
    }
  });
}
