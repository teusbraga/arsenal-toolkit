import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfExtract(container: HTMLElement) {
  let loadedBuffer: ArrayBuffer | null = null;
  let allThumbnails: { pageNumber: number, url: string }[] = [];
  let selectedPages = new Set<number>();
  let isExtracting = false;
  let filename = '';
  let exportMode: 'merge' | 'zip' = 'merge';

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-extract" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Dividir / Extrair (PDF)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-extract" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="extract-setup-area">
      <div class="dropzone-box" id="extract-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        <div class="dropzone-text">Arraste seu PDF para cá</div>
        <div class="dropzone-hint">Ou clique para selecionar um arquivo</div>
        <input type="file" id="extract-file-input" accept="application/pdf" style="display: none;" />
      </div>
      <div id="extract-progress" class="pdf-progress-text" style="display: none;">
        Carregando páginas... <span id="extract-progress-count">0%</span>
      </div>
    </div>

    <div id="extract-workspace-area" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
        <span class="form-label" style="margin-bottom: 0;">Selecione as páginas que deseja exportar:</span>
        <button class="btn-back" id="btn-reset-extract" style="width: auto; padding: 0 12px; font-size: 0.8rem;">Trocar Arquivo</button>
      </div>

      <div class="pdf-grid" id="extract-grid-container" style="margin-bottom: 24px;"></div>
      
      <div class="form-group" style="margin-bottom: 24px;">
        <label class="form-label">Modo de Exportação</label>
        <div class="segmented-tabs" id="extract-mode-tabs">
          <button class="tab-btn active" data-mode="merge">Unir em 1 PDF</button>
          <button class="tab-btn" data-mode="zip">Separar em vários PDFs (ZIP)</button>
        </div>
      </div>

      <button class="btn-primary" id="btn-extract-execute" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Exportar 0 páginas
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdf-extract') as HTMLButtonElement;
  const dropzone = container.querySelector('#extract-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#extract-file-input') as HTMLInputElement;
  const progressText = container.querySelector('#extract-progress') as HTMLDivElement;
  const progressCount = container.querySelector('#extract-progress-count') as HTMLSpanElement;
  
  const setupArea = container.querySelector('#extract-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#extract-workspace-area') as HTMLDivElement;
  
  const gridContainer = container.querySelector('#extract-grid-container') as HTMLDivElement;
  const btnReset = container.querySelector('#btn-reset-extract') as HTMLButtonElement;
  const btnExecute = container.querySelector('#btn-extract-execute') as HTMLButtonElement;
  
  const modeTabs = container.querySelectorAll('#extract-mode-tabs .tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    loadedBuffer = null;
    allThumbnails = [];
    selectedPages.clear();
    gridContainer.innerHTML = '';
    progressText.style.display = 'none';
  });
  
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      exportMode = (tab as HTMLElement).dataset.mode as 'merge' | 'zip';
    });
  });

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--btn-primary-bg)';
  });

  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
  });

  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files && fileInput.files.length > 0) {
      await handleFile(fileInput.files[0]);
    }
    fileInput.value = '';
  });

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF válido.');
      return;
    }
    filename = file.name.replace(/\.[^/.]+$/, "");
    dropzone.style.display = 'none';
    progressText.style.display = 'block';
    
    try {
      const result = await PdfService.loadAllPagesThumbnails(file, (rendered, total) => {
        progressCount.innerText = `${Math.round((rendered / total) * 100)}%`;
      });
      loadedBuffer = result.buffer;
      allThumbnails = result.thumbnails;
      selectedPages.clear();
      renderGrid();
      
      setupArea.style.display = 'none';
      dropzone.style.display = 'flex';
      progressText.style.display = 'none';
      workspaceArea.style.display = 'block';
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar o PDF.');
      dropzone.style.display = 'flex';
      progressText.style.display = 'none';
    }
  }

  function renderGrid() {
    gridContainer.innerHTML = '';
    allThumbnails.forEach(thumb => {
      const card = document.createElement('div');
      card.className = 'pdf-thumb-card';
      card.style.cursor = 'pointer';
      
      if (selectedPages.has(thumb.pageNumber)) card.classList.add('selected');

      card.innerHTML = `
        <div class="pdf-thumb-check">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div class="pdf-thumb-canvas-wrapper">
          <img src="${thumb.url}" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div class="pdf-thumb-info" style="justify-content: center;">
          <span class="pdf-thumb-title">Página ${thumb.pageNumber}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (selectedPages.has(thumb.pageNumber)) {
          selectedPages.delete(thumb.pageNumber);
          card.classList.remove('selected');
        } else {
          selectedPages.add(thumb.pageNumber);
          card.classList.add('selected');
        }
        updateExecuteButton();
      });
      gridContainer.appendChild(card);
    });
    updateExecuteButton();
  }

  function updateExecuteButton() {
    if (selectedPages.size > 0) {
      btnExecute.disabled = false;
      btnExecute.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Exportar ${selectedPages.size} página${selectedPages.size > 1 ? 's' : ''}
      `;
    } else {
      btnExecute.disabled = true;
      btnExecute.innerHTML = 'Selecione ao menos 1 página';
    }
  }

  btnExecute.addEventListener('click', async () => {
    if (!loadedBuffer || selectedPages.size === 0 || isExtracting) return;
    
    isExtracting = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    
    try {
      const indicesToExtract = Array.from(selectedPages).sort((a,b) => a - b).map(p => p - 1);
      let blob: Blob;
      let downloadName = '';
      
      if (exportMode === 'merge') {
        const newPdfBytes = await PdfService.extractPages(loadedBuffer, indicesToExtract);
        blob = new Blob([newPdfBytes.buffer as any], { type: 'application/pdf' });
        downloadName = `${filename}_extraido.pdf`;
      } else {
        blob = await PdfService.splitPagesToZip(loadedBuffer, indicesToExtract, filename);
        downloadName = `${filename}_separados.zip`;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record(
        'pdf-extract',
        'pdf',
        exportMode === 'merge' ? 'Extraiu Páginas (1 PDF)' : 'Separou Páginas (ZIP)',
        `De ${allThumbnails.length} páginas`,
        `Exportou ${selectedPages.size} páginas`,
        { mode: exportMode }
      );
      
    } catch (err) {
      console.error(err);
      alert('Erro ao exportar páginas.');
    } finally {
      isExtracting = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
    }
  });
}
