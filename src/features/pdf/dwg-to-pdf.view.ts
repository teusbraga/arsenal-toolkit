import { DwgToPdfService, PaperPreset, PlotStyle, DwgToPdfResult } from './dwg-to-pdf.service';
import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderDwgToPdf(container: HTMLElement): void {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let isProcessing = false;
  let lastResult: DwgToPdfResult | null = null;

  const isFav = store.getState().favorites.includes('dwg-to-pdf');

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-dwgtopdf" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">DWG para PDF (AutoCAD & DXF)</h2>
      </div>
      <button class="btn-favorite ${isFav ? 'active' : ''}" id="btn-fav-dwgtopdf" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="dwgtopdf-setup-area">
      <div class="dropzone-box" id="dwgtopdf-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M9 15l3-3 3 3"/>
          <path d="M12 12v6"/>
        </svg>
        <div class="dropzone-text">Arraste seu arquivo .DWG ou .DXF para gerar PDF vetorial</div>
        <div class="dropzone-hint">Compatível com AutoCAD (R12 até R2018+) e DXF ASCII/Binário com plotagem vetorial nítida</div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(22, 163, 74, 0.1); color: #16a34a; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
          100% no Navegador • PDF Vetorial Puro (A4, A3, A1, A0, Colorido, P&B ou Blueprint)
        </div>
        <input type="file" id="dwgtopdf-file-input" accept=".dwg,.dxf,application/acad,application/dxf" style="display: none;" />
      </div>
    </div>

    <div id="dwgtopdf-workspace-area" style="display: none; max-width: 780px; margin: 0 auto;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Desenho CAD Carregado</div>
            <div id="dwgtopdf-file-name" style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">-</div>
            <div id="dwgtopdf-file-info" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">-</div>
          </div>
          <button id="btn-dwgtopdf-reset" style="width: auto; white-space: nowrap; height: 34px; padding: 0 12px; font-size: 0.82rem; border-radius: var(--radius-sm); border: 1px solid var(--border-color); background: var(--bg-page); color: var(--text-secondary); font-weight: 500;">
            Trocar Arquivo
          </button>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;" />

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 14px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Folha / Formato do PDF</label>
            <select id="dwgtopdf-paper" class="form-input" style="font-size: 0.9rem;">
              <option value="a4-landscape" selected>A4 Paisagem (297 × 210 mm)</option>
              <option value="a4-portrait">A4 Retrato (210 × 297 mm)</option>
              <option value="a3-landscape">A3 Paisagem (420 × 297 mm)</option>
              <option value="a3-portrait">A3 Retrato (297 × 420 mm)</option>
              <option value="a1-landscape">A1 Paisagem (841 × 594 mm)</option>
              <option value="a0-landscape">A0 Paisagem (1189 × 841 mm)</option>
              <option value="auto">Ajustar à Proporção do Desenho</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Estilo de Plotagem (CTB)</label>
            <select id="dwgtopdf-plotstyle" class="form-input" style="font-size: 0.9rem;">
              <option value="color-light" selected>Colorido em Papel Branco (acad.ctb)</option>
              <option value="monochrome">Monocromático Preto & Branco (monochrome.ctb)</option>
              <option value="blueprint">Blueprint Escuro (Tela AutoCAD)</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Espessura de Linha</label>
            <select id="dwgtopdf-linewidth" class="form-input" style="font-size: 0.9rem;">
              <option value="0.35">Fina (0.35 pt — Plantas densas)</option>
              <option value="0.65" selected>Padrão (0.65 pt)</option>
              <option value="1.0">Média (1.0 pt)</option>
              <option value="1.5">Grossa (1.5 pt)</option>
            </select>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 14px; margin-bottom: 18px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.85rem; color: var(--text-secondary);">
            <input type="checkbox" id="dwgtopdf-opt-layers" checked style="width: 16px; height: 16px; accent-color: #16a34a;" />
            Ocultar layers desligados ou congelados (OFF / FROZEN)
          </label>
        </div>

        <button class="btn-primary" id="btn-dwgtopdf-convert" style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; background: #16a34a; border-color: #16a34a; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Converter & Baixar .PDF
        </button>

        <!-- Resultado & Preview Vetorial -->
        <div id="dwgtopdf-result-box" style="display: none; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
            <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary);">Preview da Prancha & Resumo</div>
            <button id="btn-dwgtopdf-redownload" style="width: auto; white-space: nowrap; height: 34px; padding: 0 12px; font-size: 0.82rem; border-radius: var(--radius-sm); border: 1px solid #16a34a; color: #16a34a; background: rgba(22, 163, 74, 0.08); font-weight: 600;">
              Baixar PDF Novamente
            </button>
          </div>

          <div id="dwgtopdf-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; margin-bottom: 14px;"></div>

          <div id="dwgtopdf-preview-svg" style="border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; overflow: hidden; display: flex; justify-content: center; align-items: center;"></div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-dwgtopdf') as HTMLButtonElement;
  const btnFav = container.querySelector('#btn-fav-dwgtopdf') as HTMLButtonElement;
  const setupArea = container.querySelector('#dwgtopdf-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#dwgtopdf-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#dwgtopdf-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#dwgtopdf-file-input') as HTMLInputElement;

  const fileNameEl = container.querySelector('#dwgtopdf-file-name') as HTMLDivElement;
  const fileInfoEl = container.querySelector('#dwgtopdf-file-info') as HTMLDivElement;
  const btnReset = container.querySelector('#btn-dwgtopdf-reset') as HTMLButtonElement;

  const paperSelect = container.querySelector('#dwgtopdf-paper') as HTMLSelectElement;
  const plotStyleSelect = container.querySelector('#dwgtopdf-plotstyle') as HTMLSelectElement;
  const lineWidthSelect = container.querySelector('#dwgtopdf-linewidth') as HTMLSelectElement;
  const optLayers = container.querySelector('#dwgtopdf-opt-layers') as HTMLInputElement;
  const btnConvert = container.querySelector('#btn-dwgtopdf-convert') as HTMLButtonElement;

  const resultBox = container.querySelector('#dwgtopdf-result-box') as HTMLDivElement;
  const statsGrid = container.querySelector('#dwgtopdf-stats-grid') as HTMLDivElement;
  const previewSvgBox = container.querySelector('#dwgtopdf-preview-svg') as HTMLDivElement;
  const btnRedownload = container.querySelector('#btn-dwgtopdf-redownload') as HTMLButtonElement;

  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  btnFav.addEventListener('click', () => {
    store.toggleFavorite('dwg-to-pdf');
    const updated = store.getState().favorites.includes('dwg-to-pdf');
    btnFav.classList.toggle('active', updated);
    const svg = btnFav.querySelector('svg');
    if (svg) svg.setAttribute('fill', updated ? 'currentColor' : 'none');
  });

  btnReset.addEventListener('click', () => {
    selectedFile = null;
    fileBuffer = null;
    lastResult = null;
    fileInput.value = '';
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    resultBox.style.display = 'none';
    previewSvgBox.innerHTML = '';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = '#16a34a';
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

  function triggerPdfDownload(blob: Blob, filename: string): void {
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
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.dwg') && !lower.endsWith('.dxf')) {
      alert('Por favor, selecione um arquivo .DWG ou .DXF.');
      return;
    }

    selectedFile = file;
    lastResult = null;
    resultBox.style.display = 'none';
    fileNameEl.innerText = file.name;
    fileInfoEl.innerText = 'Lendo geometria e camadas CAD...';
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    try {
      fileBuffer = await file.arrayBuffer();
      const info = DwgToPdfService.inspectFile(fileBuffer, file.name);
      fileInfoEl.innerText = `${info.format} (${info.version}) • ${info.entityCount.toLocaleString()} entidades • ${info.layerCount} layers (${info.visibleLayerCount} visíveis) • ${(file.size / 1024).toFixed(1)} KB`;
    } catch (err: any) {
      console.error(err);
      fileInfoEl.innerText = 'Erro ao ler o arquivo CAD: ' + (err?.message || 'formato não suportado ou corrompido.');
    }
  }

  btnConvert.addEventListener('click', () => {
    if (!fileBuffer || !selectedFile || isProcessing) return;

    isProcessing = true;
    btnConvert.disabled = true;
    const originalHtml = btnConvert.innerHTML;
    btnConvert.innerText = 'Plotando PDF vetorial...';

    try {
      const paper = paperSelect.value as PaperPreset;
      const plotStyle = plotStyleSelect.value as PlotStyle;
      const lineWidth = parseFloat(lineWidthSelect.value) || 0.65;
      const respectLayerVisibility = optLayers.checked;

      const result = DwgToPdfService.convertDwgToPdf(fileBuffer, selectedFile.name, {
        paper,
        plotStyle,
        lineWidth,
        margin: 24,
        respectLayerVisibility
      });

      lastResult = result;
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
      triggerPdfDownload(result.pdfBlob, `${baseName}.pdf`);

      const pdfKb = (result.pdfBlob.size / 1024).toFixed(1);
      statsGrid.innerHTML = `
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Versão CAD</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${result.info.format} ${result.info.version}</div>
        </div>
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Entidades Plotadas</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${result.plottedEntities.toLocaleString()}</div>
        </div>
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Layers / Blocos</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${result.info.layerCount} / ${result.info.blockCount}</div>
        </div>
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 10px;">
          <div style="font-size: 0.72rem; color: var(--text-tertiary);">Tamanho do PDF</div>
          <div style="font-size: 1rem; font-weight: 700; color: var(--text-primary);">${pdfKb} KB</div>
        </div>
      `;

      previewSvgBox.style.background = plotStyle === 'blueprint' ? '#0f172a' : '#ffffff';
      previewSvgBox.innerHTML = result.previewSvg;
      const svgEl = previewSvgBox.querySelector('svg');
      if (svgEl) {
        svgEl.style.maxWidth = '100%';
        svgEl.style.maxHeight = '400px';
        svgEl.style.height = 'auto';
        svgEl.style.display = 'block';
      }
      resultBox.style.display = 'block';

      historyManager.record(
        'dwg-to-pdf',
        'pdf',
        'DWG para PDF',
        selectedFile.name,
        `${result.plottedEntities} entidades • ${paper.toUpperCase()} (${pdfKb} KB)`,
        {}
      );
    } catch (err: any) {
      console.error(err);
      alert('Erro ao converter DWG/DXF para PDF: ' + (err?.message || 'Arquivo inválido ou protegido.'));
    } finally {
      isProcessing = false;
      btnConvert.disabled = false;
      btnConvert.innerHTML = originalHtml;
    }
  });

  btnRedownload.addEventListener('click', () => {
    if (!lastResult || !selectedFile) return;
    const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
    triggerPdfDownload(lastResult.pdfBlob, `${baseName}.pdf`);
  });
}
