import { PdfToDwgService, CadVersion, CadUnit, PdfToDwgResult } from './pdf-to-dwg.service';
import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderPdfToDwg(container: HTMLElement): void {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let totalPages = 0;
  let isProcessing = false;
  let lastResult: PdfToDwgResult | null = null;

  const isFav = store.getState().favorites.includes('pdf-to-dwg');

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdftodwg" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">PDF para DWG (AutoCAD)</h2>
      </div>
      <button class="btn-favorite ${isFav ? 'active' : ''}" id="btn-fav-pdftodwg" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdftodwg-setup-area">
      <div class="dropzone-box" id="pdftodwg-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M8 16l4-4 4 4"/>
          <path d="M8 12h8"/>
        </svg>
        <div class="dropzone-text">Arraste seu PDF técnico ou planta para converter em .DWG</div>
        <div class="dropzone-hint">Extrai linhas, polilinhas, curvas, hachuras e textos em camadas editáveis para AutoCAD</div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(234, 88, 12, 0.1); color: #ea580c; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
          100% no Navegador • Gera .DWG Nativo (AutoCAD) e .DXF com Preview Vetorial
        </div>
        <input type="file" id="pdftodwg-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdftodwg-workspace-area" style="display: none; max-width: 760px; margin: 0 auto;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Projeto PDF Carregado</div>
            <div id="pdftodwg-file-name" style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">-</div>
            <div id="pdftodwg-page-info" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">-</div>
          </div>
          <button class="btn-back" id="btn-pdftodwg-reset" style="width: auto; white-space: nowrap; height: 34px; padding: 0 12px; font-size: 0.82rem; border: 1px solid var(--border-color); background: var(--bg-page); font-weight: 500;">
            Trocar Arquivo
          </button>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;" />

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Versão / Formato CAD</label>
            <select id="pdftodwg-version" class="form-input" style="font-size: 0.9rem;">
              <option value="2018" selected>DWG AutoCAD 2018+ (.dwg)</option>
              <option value="2004">DWG AutoCAD 2004 (.dwg)</option>
              <option value="2000">DWG AutoCAD 2000 (.dwg)</option>
              <option value="r12">DWG R12 Legado (.dwg)</option>
              <option value="dxf">DXF ASCII Universal (.dxf)</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Unidade do Desenho</label>
            <select id="pdftodwg-unit" class="form-input" style="font-size: 0.9rem;">
              <option value="mm" selected>Milímetros (mm) — Padrão</option>
              <option value="cm">Centímetros (cm)</option>
              <option value="m">Metros (m)</option>
              <option value="in">Polegadas (in)</option>
              <option value="pt">Pontos PDF (1:1 pt)</option>
            </select>
          </div>
        </div>

        <div id="pdftodwg-pages-row" style="display: none; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Páginas a Exportar</label>
            <select id="pdftodwg-pages-mode" class="form-input" style="font-size: 0.9rem;">
              <option value="all" selected>Todas as páginas (lado a lado)</option>
              <option value="single">Apenas uma página específica</option>
            </select>
          </div>

          <div id="pdftodwg-page-num-wrap" style="display: none;">
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Número da Página</label>
            <input type="number" id="pdftodwg-page-num" class="form-input" min="1" value="1" style="font-size: 0.9rem;" />
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 18px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary);">
            <input type="checkbox" id="pdftodwg-opt-text" checked style="width: 16px; height: 16px; accent-color: #ea580c;" />
            Extrair textos editáveis (camada PDF_TEXTOS)
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary);">
            <input type="checkbox" id="pdftodwg-opt-fills" checked style="width: 16px; height: 16px; accent-color: #ea580c;" />
            Incluir hachuras sólidas (HATCH)
          </label>
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary);">
            <input type="checkbox" id="pdftodwg-opt-frames" checked style="width: 16px; height: 16px; accent-color: #ea580c;" />
            Moldura das folhas (PDF_MOLDURA)
          </label>
        </div>

        <div id="pdftodwg-progress-box" style="display: none; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 6px;">
            <span id="pdftodwg-progress-text">Extraindo geometria vetorial...</span>
            <span id="pdftodwg-progress-pct">0%</span>
          </div>
          <div style="width: 100%; height: 8px; background: var(--bg-page); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color);">
            <div id="pdftodwg-progress-bar" style="width: 0%; height: 100%; background: #ea580c; transition: width 0.15s ease;"></div>
          </div>
        </div>

        <button class="btn-primary" id="btn-pdftodwg-convert" style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; background: #ea580c; border-color: #ea580c; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Converter & Baixar .DWG
        </button>

        <!-- Resultado & Preview CAD -->
        <div id="pdftodwg-result-box" style="display: none; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">Preview Vetorial CAD & Resumo</div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button class="btn-back" id="btn-pdftodwg-redownload" style="width: auto; white-space: nowrap; height: 34px; padding: 0 12px; font-size: 0.82rem; border: 1px solid var(--border-color); background: var(--bg-page); font-weight: 500;">
                Baixar Novamente
              </button>
              <button class="btn-back" id="btn-pdftodwg-dxf" style="width: auto; white-space: nowrap; height: 34px; padding: 0 12px; font-size: 0.82rem; border: 1px solid #ea580c; color: #ea580c; background: rgba(234, 88, 12, 0.08); font-weight: 600;">
                Baixar também em .DXF
              </button>
            </div>
          </div>

          <div id="pdftodwg-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-bottom: 14px;"></div>

          <div id="pdftodwg-raster-warning" style="display: none; margin-bottom: 12px; padding: 10px 12px; border-radius: 8px; background: rgba(234, 88, 12, 0.1); border: 1px solid rgba(234, 88, 12, 0.35); color: var(--text-primary); font-size: 0.82rem; line-height: 1.45;">
            <strong>Aviso:</strong> Este PDF parece conter imagens rasterizadas/escaneadas com poucos ou nenhum vetor nativo. Para obter linhas e textos editáveis no AutoCAD, utilize PDFs exportados vetorialmente (AutoCAD, Revit, Illustrator, CorelDRAW ou impressão vetorial).
          </div>

          <div id="pdftodwg-preview-svg" style="background: #0f172a; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; overflow: hidden; display: flex; justify-content: center; align-items: center;"></div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdftodwg') as HTMLButtonElement;
  const btnFav = container.querySelector('#btn-fav-pdftodwg') as HTMLButtonElement;
  const setupArea = container.querySelector('#pdftodwg-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdftodwg-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#pdftodwg-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdftodwg-file-input') as HTMLInputElement;

  const fileNameEl = container.querySelector('#pdftodwg-file-name') as HTMLDivElement;
  const pageInfoEl = container.querySelector('#pdftodwg-page-info') as HTMLDivElement;
  const btnReset = container.querySelector('#btn-pdftodwg-reset') as HTMLButtonElement;

  const versionSelect = container.querySelector('#pdftodwg-version') as HTMLSelectElement;
  const unitSelect = container.querySelector('#pdftodwg-unit') as HTMLSelectElement;
  const pagesRow = container.querySelector('#pdftodwg-pages-row') as HTMLDivElement;
  const pagesModeSelect = container.querySelector('#pdftodwg-pages-mode') as HTMLSelectElement;
  const pageNumWrap = container.querySelector('#pdftodwg-page-num-wrap') as HTMLDivElement;
  const pageNumInput = container.querySelector('#pdftodwg-page-num') as HTMLInputElement;

  const optText = container.querySelector('#pdftodwg-opt-text') as HTMLInputElement;
  const optFills = container.querySelector('#pdftodwg-opt-fills') as HTMLInputElement;
  const optFrames = container.querySelector('#pdftodwg-opt-frames') as HTMLInputElement;

  const progressBox = container.querySelector('#pdftodwg-progress-box') as HTMLDivElement;
  const progressText = container.querySelector('#pdftodwg-progress-text') as HTMLSpanElement;
  const progressPct = container.querySelector('#pdftodwg-progress-pct') as HTMLSpanElement;
  const progressBar = container.querySelector('#pdftodwg-progress-bar') as HTMLDivElement;
  const btnConvert = container.querySelector('#btn-pdftodwg-convert') as HTMLButtonElement;

  const resultBox = container.querySelector('#pdftodwg-result-box') as HTMLDivElement;
  const statsGrid = container.querySelector('#pdftodwg-stats-grid') as HTMLDivElement;
  const rasterWarning = container.querySelector('#pdftodwg-raster-warning') as HTMLDivElement;
  const previewSvgBox = container.querySelector('#pdftodwg-preview-svg') as HTMLDivElement;
  const btnRedownload = container.querySelector('#btn-pdftodwg-redownload') as HTMLButtonElement;
  const btnDownloadDxf = container.querySelector('#btn-pdftodwg-dxf') as HTMLButtonElement;

  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  btnFav.addEventListener('click', () => {
    store.toggleFavorite('pdf-to-dwg');
    const updated = store.getState().favorites.includes('pdf-to-dwg');
    btnFav.classList.toggle('active', updated);
    const svg = btnFav.querySelector('svg');
    if (svg) svg.setAttribute('fill', updated ? 'currentColor' : 'none');
  });

  versionSelect.addEventListener('change', () => {
    const ext = versionSelect.value === 'dxf' ? '.DXF' : '.DWG';
    btnConvert.lastChild!.textContent = ` Converter & Baixar ${ext}`;
  });

  pagesModeSelect.addEventListener('change', () => {
    pageNumWrap.style.display = pagesModeSelect.value === 'single' ? 'block' : 'none';
  });

  btnReset.addEventListener('click', () => {
    selectedFile = null;
    fileBuffer = null;
    lastResult = null;
    totalPages = 0;
    fileInput.value = '';
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    progressBox.style.display = 'none';
    resultBox.style.display = 'none';
    previewSvgBox.innerHTML = '';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#ea580c';
  });
  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) handleFile(fileInput.files[0]);
  });

  function triggerBlobDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File): Promise<void> {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo no formato PDF.');
      return;
    }

    selectedFile = file;
    lastResult = null;
    resultBox.style.display = 'none';
    fileNameEl.innerText = file.name;
    pageInfoEl.innerText = 'Analisando estrutura do PDF...';
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    try {
      fileBuffer = await file.arrayBuffer();
      totalPages = await PdfToDwgService.getPageCount(fileBuffer);
      pageInfoEl.innerText = `${totalPages} ${totalPages === 1 ? 'página detectada' : 'páginas detectadas'} (${(file.size / 1024).toFixed(1)} KB)`;

      if (totalPages > 1) {
        pagesRow.style.display = 'grid';
        pageNumInput.max = String(totalPages);
        pageNumInput.value = '1';
      } else {
        pagesRow.style.display = 'none';
        pagesModeSelect.value = 'all';
        pageNumWrap.style.display = 'none';
      }
    } catch (err) {
      console.error(err);
      pageInfoEl.innerText = 'Erro ao ler o PDF. Verifique se o arquivo não está protegido por senha.';
    }
  }

  btnConvert.addEventListener('click', async () => {
    if (!fileBuffer || !selectedFile || isProcessing) return;

    isProcessing = true;
    btnConvert.disabled = true;
    progressBox.style.display = 'block';
    progressText.innerText = 'Extraindo geometria vetorial...';
    progressPct.innerText = '0%';
    progressBar.style.width = '0%';

    try {
      const version = versionSelect.value as CadVersion;
      const unit = unitSelect.value as CadUnit;
      const pagesMode = pagesModeSelect.value as 'all' | 'single';
      const pageNumber = Math.max(1, Math.min(totalPages || 1, parseInt(pageNumInput.value, 10) || 1));

      const result = await PdfToDwgService.convertPdfToDwg(fileBuffer, {
        version,
        unit,
        pagesMode,
        pageNumber,
        includeText: optText.checked,
        includeFills: optFills.checked,
        includePageFrames: optFrames.checked,
        onProgress: (curr, total) => {
          const pct = Math.round((curr / total) * 100);
          progressText.innerText = `Convertendo página ${curr} de ${total}...`;
          progressPct.innerText = `${pct}%`;
          progressBar.style.width = `${pct}%`;
        }
      });

      lastResult = result;
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      triggerBlobDownload(result.blob, `${baseName}.${result.fileExtension}`);

      // Exibe estatísticas e preview SVG
      statsGrid.innerHTML = `
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Linhas (LINE)</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${result.stats.lines.toLocaleString()}</div>
        </div>
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Polilinhas / Curvas</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${result.stats.polylines.toLocaleString()}</div>
        </div>
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Hachuras (HATCH)</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${result.stats.hatches.toLocaleString()}</div>
        </div>
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Textos (TEXT)</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${result.stats.texts.toLocaleString()}</div>
        </div>
      `;

      const frameCount = optFrames.checked ? result.processedPages : 0;
      const nonFrameEntities = result.stats.totalEntities - frameCount;
      rasterWarning.style.display =
        result.stats.rasterImagesDetected > 0 && nonFrameEntities < 5 ? 'block' : 'none';

      btnDownloadDxf.style.display = result.fileExtension === 'dxf' ? 'none' : 'inline-flex';
      previewSvgBox.innerHTML = result.previewSvg;
      const svgEl = previewSvgBox.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.maxHeight = '380px';
        svgEl.style.height = 'auto';
        svgEl.style.display = 'block';
      }
      resultBox.style.display = 'block';

      historyManager.record(
        'pdf-to-dwg',
        'pdf',
        'PDF para DWG (AutoCAD)',
        selectedFile.name,
        `${result.stats.totalEntities} entidades CAD • .${result.fileExtension.toUpperCase()} (${unit})`,
        {}
      );
    } catch (err: any) {
      console.error(err);
      alert('Erro ao converter PDF para DWG: ' + (err?.message || 'Arquivo protegido ou incompatível.'));
    } finally {
      isProcessing = false;
      btnConvert.disabled = false;
      setTimeout(() => {
        progressBox.style.display = 'none';
      }, 600);
    }
  });

  btnRedownload.addEventListener('click', () => {
    if (!lastResult || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    triggerBlobDownload(lastResult.blob, `${baseName}.${lastResult.fileExtension}`);
  });

  btnDownloadDxf.addEventListener('click', () => {
    if (!lastResult || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    triggerBlobDownload(lastResult.dxfBlob, `${baseName}.dxf`);
  });
}
