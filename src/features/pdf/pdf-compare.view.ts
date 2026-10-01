import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { historyManager } from '../../core/history/history.manager';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function renderPdfCompare(container: HTMLElement) {
  let fileA: File | null = null;
  let fileB: File | null = null;
  let pdfDocA: any = null;
  let pdfDocB: any = null;

  let currentPage = 1;
  let totalPages = 1;
  let sliderPercent = 50;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdfcompare" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Comparar PDFs (Diff Visual & Texto)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdfcompare" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <!-- Upload Dual Dropzone Area -->
    <div id="pdfcompare-setup-area" style="max-width: 900px; margin: 0 auto;">
      <p style="text-align: center; color: var(--text-secondary); margin-bottom: 24px; font-size: 0.95rem;">
        Selecione dois documentos PDF para analisar alterações, cláusulas alteradas, assinaturas e diferenças visuais.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-bottom: 24px;">
        
        <!-- Dropzone File A (Original) -->
        <div class="dropzone-box" id="dropzone-doc-a" style="border: 2px dashed var(--border-color); border-radius: 12px; padding: 28px 16px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); color: #3b82f6; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
          </div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;" id="label-name-a">Documento 1 (Original)</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;" id="label-info-a">Clique ou arraste o arquivo original / Versão A</div>
          <input type="file" id="input-file-a" accept="application/pdf" style="display: none;" />
        </div>

        <!-- Dropzone File B (Modified) -->
        <div class="dropzone-box" id="dropzone-doc-b" style="border: 2px dashed var(--border-color); border-radius: 12px; padding: 28px 16px; text-align: center; cursor: pointer; transition: all 0.2s ease;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(168, 85, 247, 0.1); color: #a855f7; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 13 14 17 20 11"/></svg>
          </div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 1.05rem;" id="label-name-b">Documento 2 (Alterado)</div>
          <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;" id="label-info-b">Clique ou arraste a nova versão / Versão B</div>
          <input type="file" id="input-file-b" accept="application/pdf" style="display: none;" />
        </div>

      </div>

      <div style="text-align: center;">
        <button class="btn-primary" id="btn-start-compare" style="width: auto; min-width: 240px; height: 44px; font-size: 0.95rem; font-weight: 600; opacity: 0.5; pointer-events: none; margin: 0 auto; display: inline-flex; align-items: center; justify-content: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8"/><path d="m9 17 3 3 3-3"/><path d="m3 14 6-6 4 4 8-8"/></svg>
          Comparar Documentos
        </button>
      </div>

    </div>

    <!-- Workspace Comparison Area -->
    <div id="pdfcompare-workspace-area" style="display: none;">
      
      <!-- Top Control Bar -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 14px 18px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;">
        
        <!-- Left: Document Badges & Page Navigation -->
        <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
          <!-- Page Nav -->
          <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 4px 8px;">
            <button class="btn-back" id="btn-page-prev" style="height: 28px; width: 28px; padding: 0; display: flex; align-items: center; justify-content: center;" title="Página Anterior">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); padding: 0 4px;" id="compare-page-indicator">
              Página 1 de 1
            </span>
            <button class="btn-back" id="btn-page-next" style="height: 28px; width: 28px; padding: 0; display: flex; align-items: center; justify-content: center;" title="Próxima Página">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>

          <!-- Diff Metric Badge -->
          <div id="compare-diff-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: var(--bg-page); border: 1px solid var(--border-color); color: var(--text-secondary);">
            <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
            <span id="compare-diff-text">Calculando diferenças...</span>
          </div>
        </div>

        <!-- Center: Comparison Mode Tabs -->
        <div class="segmented-tabs" style="height: 36px; padding: 2px;">
          <button class="tab-btn active" id="tab-mode-side">Lado a Lado</button>
          <button class="tab-btn" id="tab-mode-diff">Sobreposição (Diff)</button>
          <button class="tab-btn" id="tab-mode-slider">Cortina / Slider</button>
          <button class="tab-btn" id="tab-mode-text">Diff de Texto</button>
        </div>

        <!-- Right: Actions -->
        <div>
          <button class="btn-back" id="btn-compare-reset" style="height: 36px; padding: 0 12px; font-size: 0.85rem;">
            Trocar Arquivos
          </button>
        </div>

      </div>

      <!-- Comparison Viewports Container -->
      <div id="compare-viewport-container" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; min-height: 520px; display: flex; justify-content: center; align-items: flex-start; overflow-x: auto;">
        
        <!-- 1. Side by Side View -->
        <div id="view-side-by-side" style="display: flex; gap: 24px; justify-content: center; width: 100%; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px; max-width: 520px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #3b82f6; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;" id="badge-title-a">Original (V1)</div>
            <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); display: inline-block; max-width: 100%;">
              <canvas id="canvas-doc-a" style="max-width: 100%; height: auto; display: block;"></canvas>
            </div>
          </div>

          <div style="flex: 1; min-width: 300px; max-width: 520px; text-align: center;">
            <div style="font-size: 0.8rem; font-weight: 700; color: #a855f7; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;" id="badge-title-b">Alterado (V2)</div>
            <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); display: inline-block; max-width: 100%;">
              <canvas id="canvas-doc-b" style="max-width: 100%; height: auto; display: block;"></canvas>
            </div>
          </div>
        </div>

        <!-- 2. Diff Overlay View -->
        <div id="view-diff-overlay" style="display: none; text-align: center; width: 100%;">
          <div style="margin-bottom: 12px; display: inline-flex; align-items: center; gap: 14px; background: var(--bg-page); border: 1px solid var(--border-color); padding: 6px 14px; border-radius: 8px; font-size: 0.8rem; color: var(--text-secondary);">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 12px; height: 12px; background: #ef4444; border-radius: 2px;"></span>
              <span>Elementos Diferentes / Alterados</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 12px; height: 12px; background: #94a3b8; border-radius: 2px;"></span>
              <span>Conteúdo Inalterado</span>
            </div>
          </div>

          <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); display: inline-block; max-width: 100%;">
            <canvas id="canvas-diff" style="max-width: 100%; height: auto; display: block;"></canvas>
          </div>
        </div>

        <!-- 3. Curtain Slider View -->
        <div id="view-curtain-slider" style="display: none; text-align: center; width: 100%;">
          <div style="margin-bottom: 12px; display: flex; align-items: center; justify-content: center; gap: 12px;">
            <span style="font-size: 0.8rem; font-weight: 600; color: #3b82f6;">Doc 1 (Original)</span>
            <input type="range" id="compare-slider-control" min="0" max="100" value="50" style="width: 220px; cursor: pointer;" />
            <span style="font-size: 0.8rem; font-weight: 600; color: #a855f7;">Doc 2 (Alterado)</span>
          </div>

          <div style="position: relative; display: inline-block; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.06); max-width: 100%;">
            <canvas id="canvas-slider-a" style="max-width: 100%; height: auto; display: block;"></canvas>
            <div id="slider-curtain-wrap" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none; clip-path: polygon(0 0, 50% 0, 50% 100%, 0 100%);">
              <canvas id="canvas-slider-b" style="max-width: 100%; height: auto; display: block;"></canvas>
            </div>
            <!-- Slider divider line -->
            <div id="slider-divider-line" style="position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; background: #a855f7; pointer-events: none; transform: translateX(-50%); box-shadow: 0 0 8px rgba(168,85,247,0.6);"></div>
          </div>
        </div>

        <!-- 4. Text Diff View -->
        <div id="view-text-diff" style="display: none; width: 100%; max-width: 900px;">
          <div style="margin-bottom: 14px; display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
            <span style="background: rgba(34, 197, 94, 0.15); color: #16a34a; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
              + Texto Inserido (Doc 2)
            </span>
            <span style="background: rgba(239, 68, 68, 0.15); color: #ef4444; padding: 4px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
              - Texto Removido (Doc 1)
            </span>
          </div>

          <div id="text-diff-content" style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 18px; font-family: 'Consolas', 'Courier New', monospace; font-size: 0.85rem; line-height: 1.8; white-space: pre-wrap; word-break: break-word; min-height: 300px;">
            Carregando comparação de texto da página...
          </div>
        </div>

      </div>

    </div>
  `;

  // Selectors
  const btnBack = container.querySelector('#btn-back-pdfcompare') as HTMLButtonElement;
  const setupArea = container.querySelector('#pdfcompare-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdfcompare-workspace-area') as HTMLDivElement;

  const dropzoneA = container.querySelector('#dropzone-doc-a') as HTMLDivElement;
  const dropzoneB = container.querySelector('#dropzone-doc-b') as HTMLDivElement;
  const inputFileA = container.querySelector('#input-file-a') as HTMLInputElement;
  const inputFileB = container.querySelector('#input-file-b') as HTMLInputElement;

  const labelNameA = container.querySelector('#label-name-a') as HTMLDivElement;
  const labelInfoA = container.querySelector('#label-info-a') as HTMLDivElement;
  const labelNameB = container.querySelector('#label-name-b') as HTMLDivElement;
  const labelInfoB = container.querySelector('#label-info-b') as HTMLDivElement;

  const badgeTitleA = container.querySelector('#badge-title-a') as HTMLDivElement;
  const badgeTitleB = container.querySelector('#badge-title-b') as HTMLDivElement;

  const btnStart = container.querySelector('#btn-start-compare') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-compare-reset') as HTMLButtonElement;

  const btnPrev = container.querySelector('#btn-page-prev') as HTMLButtonElement;
  const btnNext = container.querySelector('#btn-page-next') as HTMLButtonElement;
  const pageIndicator = container.querySelector('#compare-page-indicator') as HTMLSpanElement;

  const diffBadge = container.querySelector('#compare-diff-badge') as HTMLDivElement;
  const diffText = container.querySelector('#compare-diff-text') as HTMLSpanElement;

  const tabSide = container.querySelector('#tab-mode-side') as HTMLButtonElement;
  const tabDiff = container.querySelector('#tab-mode-diff') as HTMLButtonElement;
  const tabSlider = container.querySelector('#tab-mode-slider') as HTMLButtonElement;
  const tabText = container.querySelector('#tab-mode-text') as HTMLButtonElement;

  const viewSide = container.querySelector('#view-side-by-side') as HTMLDivElement;
  const viewDiff = container.querySelector('#view-diff-overlay') as HTMLDivElement;
  const viewSlider = container.querySelector('#view-curtain-slider') as HTMLDivElement;
  const viewText = container.querySelector('#view-text-diff') as HTMLDivElement;

  const canvasA = container.querySelector('#canvas-doc-a') as HTMLCanvasElement;
  const canvasB = container.querySelector('#canvas-doc-b') as HTMLCanvasElement;
  const canvasDiff = container.querySelector('#canvas-diff') as HTMLCanvasElement;
  const canvasSliderA = container.querySelector('#canvas-slider-a') as HTMLCanvasElement;
  const canvasSliderB = container.querySelector('#canvas-slider-b') as HTMLCanvasElement;
  const curtainWrap = container.querySelector('#slider-curtain-wrap') as HTMLDivElement;
  const sliderDivider = container.querySelector('#slider-divider-line') as HTMLDivElement;
  const sliderControl = container.querySelector('#compare-slider-control') as HTMLInputElement;

  const textDiffContent = container.querySelector('#text-diff-content') as HTMLDivElement;

  // Back button
  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  // Reset
  function resetAll() {
    fileA = null;
    fileB = null;
    pdfDocA = null;
    pdfDocB = null;
    inputFileA.value = '';
    inputFileB.value = '';

    labelNameA.innerText = 'Documento 1 (Original)';
    labelInfoA.innerText = 'Clique ou arraste o arquivo original / Versão A';
    dropzoneA.style.borderColor = 'var(--border-color)';

    labelNameB.innerText = 'Documento 2 (Alterado)';
    labelInfoB.innerText = 'Clique ou arraste a nova versão / Versão B';
    dropzoneB.style.borderColor = 'var(--border-color)';

    btnStart.style.opacity = '0.5';
    btnStart.style.pointerEvents = 'none';

    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
  }

  btnReset.addEventListener('click', resetAll);

  // File Upload Handlers A
  dropzoneA.addEventListener('click', () => inputFileA.click());
  dropzoneA.addEventListener('dragover', (e) => { e.preventDefault(); dropzoneA.style.borderColor = '#3b82f6'; });
  dropzoneA.addEventListener('dragleave', (e) => { e.preventDefault(); dropzoneA.style.borderColor = fileA ? '#3b82f6' : 'var(--border-color)'; });
  dropzoneA.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectA(e.dataTransfer.files[0]);
    }
  });
  inputFileA.addEventListener('change', () => {
    if (inputFileA.files && inputFileA.files.length > 0) handleSelectA(inputFileA.files[0]);
  });

  // File Upload Handlers B
  dropzoneB.addEventListener('click', () => inputFileB.click());
  dropzoneB.addEventListener('dragover', (e) => { e.preventDefault(); dropzoneB.style.borderColor = '#a855f7'; });
  dropzoneB.addEventListener('dragleave', (e) => { e.preventDefault(); dropzoneB.style.borderColor = fileB ? '#a855f7' : 'var(--border-color)'; });
  dropzoneB.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectB(e.dataTransfer.files[0]);
    }
  });
  inputFileB.addEventListener('change', () => {
    if (inputFileB.files && inputFileB.files.length > 0) handleSelectB(inputFileB.files[0]);
  });

  function handleSelectA(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }
    fileA = file;
    labelNameA.innerText = file.name;
    labelInfoA.innerText = `${(file.size / 1024).toFixed(1)} KB`;
    dropzoneA.style.borderColor = '#3b82f6';
    checkReady();
  }

  function handleSelectB(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }
    fileB = file;
    labelNameB.innerText = file.name;
    labelInfoB.innerText = `${(file.size / 1024).toFixed(1)} KB`;
    dropzoneB.style.borderColor = '#a855f7';
    checkReady();
  }

  function checkReady() {
    if (fileA && fileB) {
      btnStart.style.opacity = '1';
      btnStart.style.pointerEvents = 'auto';
    }
  }

  // Start Compare
  btnStart.addEventListener('click', async () => {
    if (!fileA || !fileB) return;

    btnStart.innerText = 'Carregando documentos...';
    btnStart.disabled = true;

    try {
      const bufA = await fileA.arrayBuffer();
      const bufB = await fileB.arrayBuffer();

      const taskA = pdfjsLib.getDocument({ data: new Uint8Array(bufA.slice(0)) });
      const taskB = pdfjsLib.getDocument({ data: new Uint8Array(bufB.slice(0)) });

      pdfDocA = await taskA.promise;
      pdfDocB = await taskB.promise;

      totalPages = Math.max(pdfDocA.numPages, pdfDocB.numPages);
      currentPage = 1;

      badgeTitleA.innerText = `Original: ${fileA.name} (${pdfDocA.numPages} pág)`;
      badgeTitleB.innerText = `Alterado: ${fileB.name} (${pdfDocB.numPages} pág)`;

      setupArea.style.display = 'none';
      workspaceArea.style.display = 'block';

      await renderCurrentPage();

      historyManager.record(
        'pdf-compare',
        'pdf',
        'Comparar PDFs',
        `${fileA.name} vs ${fileB.name}`,
        `${totalPages} páginas comparadas`,
        {}
      );

    } catch (err: any) {
      console.error(err);
      alert('Não foi possível carregar os documentos para comparação. Verifique se algum deles está protegido por senha.');
    } finally {
      btnStart.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8"/><path d="m9 17 3 3 3-3"/><path d="m3 14 6-6 4 4 8-8"/></svg>
        Comparar Documentos
      `;
      btnStart.disabled = false;
    }
  });

  // Page Navigation
  btnPrev.addEventListener('click', async () => {
    if (currentPage > 1) {
      currentPage--;
      await renderCurrentPage();
    }
  });

  btnNext.addEventListener('click', async () => {
    if (currentPage < totalPages) {
      currentPage++;
      await renderCurrentPage();
    }
  });

  // Mode switching
  function switchMode(mode: 'side-by-side' | 'diff' | 'slider' | 'text') {
    [tabSide, tabDiff, tabSlider, tabText].forEach(t => t.classList.remove('active'));
    [viewSide, viewDiff, viewSlider, viewText].forEach(v => v.style.display = 'none');

    if (mode === 'side-by-side') {
      tabSide.classList.add('active');
      viewSide.style.display = 'flex';
    } else if (mode === 'diff') {
      tabDiff.classList.add('active');
      viewDiff.style.display = 'block';
    } else if (mode === 'slider') {
      tabSlider.classList.add('active');
      viewSlider.style.display = 'block';
      updateCurtainSlider(sliderPercent);
    } else {
      tabText.classList.add('active');
      viewText.style.display = 'block';
    }
  }

  tabSide.addEventListener('click', () => switchMode('side-by-side'));
  tabDiff.addEventListener('click', () => switchMode('diff'));
  tabSlider.addEventListener('click', () => switchMode('slider'));
  tabText.addEventListener('click', () => switchMode('text'));

  // Slider control
  sliderControl.addEventListener('input', () => {
    sliderPercent = parseInt(sliderControl.value, 10);
    updateCurtainSlider(sliderPercent);
  });

  function updateCurtainSlider(pct: number) {
    curtainWrap.style.clipPath = `polygon(0 0, ${pct}% 0, ${pct}% 100%, 0 100%)`;
    sliderDivider.style.left = `${pct}%`;
  }

  // Core Render Method
  async function renderCurrentPage() {
    pageIndicator.innerText = `Página ${currentPage} de ${totalPages}`;
    btnPrev.disabled = currentPage <= 1;
    btnNext.disabled = currentPage >= totalPages;

    diffText.innerText = 'Analisando página...';

    // 1. Render Page A to Canvas
    let cA = document.createElement('canvas');
    let textA = '';
    if (currentPage <= pdfDocA.numPages) {
      const pageA = await pdfDocA.getPage(currentPage);
      const vpA = pageA.getViewport({ scale: 1.5 });
      cA.width = vpA.width;
      cA.height = vpA.height;
      const ctxA = cA.getContext('2d')!;
      ctxA.fillStyle = '#ffffff';
      ctxA.fillRect(0, 0, cA.width, cA.height);
      await pageA.render({ canvasContext: ctxA, viewport: vpA } as any).promise;

      const tcA = await pageA.getTextContent();
      textA = tcA.items.map((it: any) => it.str).join(' ');
    } else {
      cA.width = 600;
      cA.height = 800;
      const ctxA = cA.getContext('2d')!;
      ctxA.fillStyle = '#f8fafc';
      ctxA.fillRect(0, 0, cA.width, cA.height);
      ctxA.fillStyle = '#94a3b8';
      ctxA.font = '16px sans-serif';
      ctxA.fillText('(Página não existe no Documento 1)', 160, 400);
    }

    // 2. Render Page B to Canvas
    let cB = document.createElement('canvas');
    let textB = '';
    if (currentPage <= pdfDocB.numPages) {
      const pageB = await pdfDocB.getPage(currentPage);
      const vpB = pageB.getViewport({ scale: 1.5 });
      cB.width = vpB.width;
      cB.height = vpB.height;
      const ctxB = cB.getContext('2d')!;
      ctxB.fillStyle = '#ffffff';
      ctxB.fillRect(0, 0, cB.width, cB.height);
      await pageB.render({ canvasContext: ctxB, viewport: vpB } as any).promise;

      const tcB = await pageB.getTextContent();
      textB = tcB.items.map((it: any) => it.str).join(' ');
    } else {
      cB.width = 600;
      cB.height = 800;
      const ctxB = cB.getContext('2d')!;
      ctxB.fillStyle = '#f8fafc';
      ctxB.fillRect(0, 0, cB.width, cB.height);
      ctxB.fillStyle = '#94a3b8';
      ctxB.font = '16px sans-serif';
      ctxB.fillText('(Página não existe no Documento 2)', 160, 400);
    }

    // Copy to visible canvases
    copyToCanvas(cA, canvasA);
    copyToCanvas(cB, canvasB);
    copyToCanvas(cA, canvasSliderA);
    copyToCanvas(cB, canvasSliderB);

    // 3. Compute Visual Pixel Diff
    computeVisualDiff(cA, cB);

    // 4. Compute Text Diff
    computeTextDiff(textA, textB);
  }

  function copyToCanvas(src: HTMLCanvasElement, dest: HTMLCanvasElement) {
    dest.width = src.width;
    dest.height = src.height;
    const ctx = dest.getContext('2d');
    if (ctx) {
      ctx.drawImage(src, 0, 0);
    }
  }

  function computeVisualDiff(cA: HTMLCanvasElement, cB: HTMLCanvasElement) {
    const width = Math.max(cA.width, cB.width);
    const height = Math.max(cA.height, cB.height);

    canvasDiff.width = width;
    canvasDiff.height = height;

    const ctxDiff = canvasDiff.getContext('2d');
    if (!ctxDiff) return;

    // Draw A to temp
    const tempA = document.createElement('canvas');
    tempA.width = width;
    tempA.height = height;
    const ctxTempA = tempA.getContext('2d')!;
    ctxTempA.fillStyle = '#ffffff';
    ctxTempA.fillRect(0, 0, width, height);
    ctxTempA.drawImage(cA, 0, 0);

    // Draw B to temp
    const tempB = document.createElement('canvas');
    tempB.width = width;
    tempB.height = height;
    const ctxTempB = tempB.getContext('2d')!;
    ctxTempB.fillStyle = '#ffffff';
    ctxTempB.fillRect(0, 0, width, height);
    ctxTempB.drawImage(cB, 0, 0);

    const imgDataA = ctxTempA.getImageData(0, 0, width, height);
    const imgDataB = ctxTempB.getImageData(0, 0, width, height);
    const diffData = ctxDiff.createImageData(width, height);

    const dataA = imgDataA.data;
    const dataB = imgDataB.data;
    const out = diffData.data;

    let diffPixels = 0;
    const totalPixels = width * height;

    for (let i = 0; i < dataA.length; i += 4) {
      const rA = dataA[i], gA = dataA[i + 1], bA = dataA[i + 2];
      const rB = dataB[i], gB = dataB[i + 1], bB = dataB[i + 2];

      const diff = Math.abs(rA - rB) + Math.abs(gA - gB) + Math.abs(bA - bB);

      if (diff > 35) {
        diffPixels++;
        // Distinct red highlight for changed pixels
        out[i] = 239;     // R
        out[i + 1] = 68;  // G
        out[i + 2] = 68;  // B
        out[i + 3] = 255; // Alpha
      } else {
        // Muted gray for identical content
        const gray = (rA * 0.299 + gA * 0.587 + bA * 0.114) * 0.4 + 140;
        out[i] = gray;
        out[i + 1] = gray;
        out[i + 2] = gray;
        out[i + 3] = 255;
      }
    }

    ctxDiff.putImageData(diffData, 0, 0);

    const diffPct = (diffPixels / totalPixels) * 100;

    if (diffPct < 0.05) {
      diffBadge.style.color = '#16a34a';
      diffBadge.style.background = 'rgba(34, 197, 94, 0.1)';
      diffBadge.style.borderColor = 'rgba(34, 197, 94, 0.3)';
      diffText.innerText = '100% Idêntico (Sem alterações)';
    } else {
      diffBadge.style.color = '#ef4444';
      diffBadge.style.background = 'rgba(239, 68, 68, 0.1)';
      diffBadge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      diffText.innerText = `${(100 - diffPct).toFixed(1)}% similaridade • Diferenças detectadas`;
    }
  }

  function computeTextDiff(textA: string, textB: string) {
    if (!textA.trim() && !textB.trim()) {
      textDiffContent.innerHTML = '<span style="color: var(--text-tertiary);">Nenhum texto detectável nesta página (documento escaneado ou apenas gráficos). Use o modo Sobreposição (Diff) para analisar visualmente.</span>';
      return;
    }

    const wordsA = textA.split(/\s+/).filter(Boolean);
    const wordsB = textB.split(/\s+/).filter(Boolean);

    // LCS-based word diff
    const lcsMatrix = computeLCS(wordsA, wordsB);
    const diffTokens = buildDiffTokens(lcsMatrix, wordsA, wordsB, wordsA.length, wordsB.length);

    let html = '';
    let hasChanges = false;

    for (const token of diffTokens) {
      if (token.type === 'common') {
        html += `<span>${escapeHtml(token.text)} </span>`;
      } else if (token.type === 'removed') {
        hasChanges = true;
        html += `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; text-decoration: line-through; padding: 1px 4px; border-radius: 3px;">${escapeHtml(token.text)}</span> `;
      } else if (token.type === 'added') {
        hasChanges = true;
        html += `<span style="background: rgba(34, 197, 94, 0.2); color: #16a34a; font-weight: 600; padding: 1px 4px; border-radius: 3px;">${escapeHtml(token.text)}</span> `;
      }
    }

    if (!hasChanges) {
      textDiffContent.innerHTML = '<div style="color: #16a34a; font-weight: 600; margin-bottom: 8px;">✓ O texto desta página é exatamente idêntico nas duas versões.</div>' + html;
    } else {
      textDiffContent.innerHTML = html;
    }
  }

  function computeLCS(a: string[], b: string[]): number[][] {
    // Cap size for extreme pages
    const maxLen = 600;
    const sliceA = a.slice(0, maxLen);
    const sliceB = b.slice(0, maxLen);

    const dp: number[][] = Array.from({ length: sliceA.length + 1 }, () => new Array(sliceB.length + 1).fill(0));

    for (let i = 1; i <= sliceA.length; i++) {
      for (let j = 1; j <= sliceB.length; j++) {
        if (sliceA[i - 1] === sliceB[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp;
  }

  function buildDiffTokens(
    dp: number[][],
    a: string[],
    b: string[],
    i: number,
    j: number
  ): Array<{ type: 'common' | 'added' | 'removed'; text: string }> {
    const tokens: Array<{ type: 'common' | 'added' | 'removed'; text: string }> = [];
    const maxLen = 600;
    let currI = Math.min(i, maxLen);
    let currJ = Math.min(j, maxLen);

    while (currI > 0 || currJ > 0) {
      if (currI > 0 && currJ > 0 && a[currI - 1] === b[currJ - 1]) {
        tokens.unshift({ type: 'common', text: a[currI - 1] });
        currI--;
        currJ--;
      } else if (currJ > 0 && (currI === 0 || dp[currI][currJ - 1] >= dp[currI - 1][currJ])) {
        tokens.unshift({ type: 'added', text: b[currJ - 1] });
        currJ--;
      } else if (currI > 0 && (currJ === 0 || dp[currI][currJ - 1] < dp[currI - 1][currJ])) {
        tokens.unshift({ type: 'removed', text: a[currI - 1] });
        currI--;
      }
    }
    return tokens;
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
