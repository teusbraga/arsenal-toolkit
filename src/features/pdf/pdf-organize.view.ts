import Sortable from 'sortablejs';
import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

interface PageState {
  id: string;
  originalIndex: number;
  rotationDelta: number;
  url: string;
}

export function renderPdfOrganize(container: HTMLElement) {
  let loadedBuffer: ArrayBuffer | null = null;
  let pagesState: PageState[] = [];
  let sortableInstance: Sortable | null = null;
  let isProcessing = false;
  let filename = '';

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-org" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Organizar & Girar (PDF)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-org" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="org-setup-area">
      <div class="dropzone-box" id="org-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        <div class="dropzone-text">Arraste seu PDF para cá</div>
        <div class="dropzone-hint">Ou clique para selecionar um arquivo</div>
        <input type="file" id="org-file-input" accept="application/pdf" style="display: none;" />
      </div>
      <div id="org-progress" class="pdf-progress-text" style="display: none;">
        Carregando páginas... <span id="org-progress-count">0%</span>
      </div>
    </div>

    <div id="org-workspace-area" style="display: none;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
        <span class="form-label" style="margin-bottom: 0;">Arraste para reordenar, use os ícones para girar ou excluir:</span>
        <button class="btn-back" id="btn-reset-org" style="width: auto; padding: 0 12px; font-size: 0.8rem;">Trocar Arquivo</button>
      </div>

      <div class="pdf-grid" id="org-grid-container" style="margin-bottom: 24px;"></div>
      
      <button class="btn-primary" id="btn-org-execute">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Salvar PDF Organizado
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdf-org') as HTMLButtonElement;
  const dropzone = container.querySelector('#org-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#org-file-input') as HTMLInputElement;
  const progressText = container.querySelector('#org-progress') as HTMLDivElement;
  const progressCount = container.querySelector('#org-progress-count') as HTMLSpanElement;
  
  const setupArea = container.querySelector('#org-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#org-workspace-area') as HTMLDivElement;
  const gridContainer = container.querySelector('#org-grid-container') as HTMLDivElement;
  const btnReset = container.querySelector('#btn-reset-org') as HTMLButtonElement;
  const btnExecute = container.querySelector('#btn-org-execute') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    loadedBuffer = null;
    pagesState = [];
    gridContainer.innerHTML = '';
    progressText.style.display = 'none';
    if (sortableInstance) sortableInstance.destroy();
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
      
      pagesState = result.thumbnails.map(t => ({
        id: crypto.randomUUID(),
        originalIndex: t.pageNumber - 1, // 0-indexed for pdf-lib
        rotationDelta: 0,
        url: t.url
      }));
      
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
    
    pagesState.forEach(state => {
      const card = document.createElement('div');
      card.className = 'pdf-thumb-card';
      card.dataset.id = state.id;

      card.innerHTML = `
        <!-- Rotate Button -->
        <button class="pdf-btn-rotate" data-id="${state.id}" title="Girar 90º">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
        </button>
        <!-- Remove Button -->
        <button class="pdf-btn-remove" data-id="${state.id}" title="Remover Página">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>

        <div class="pdf-thumb-canvas-wrapper">
          <img src="${state.url}" style="width: 100%; height: 100%; object-fit: contain; transform: rotate(${state.rotationDelta}deg); transition: transform 0.2s ease;" />
        </div>
        <div class="pdf-thumb-info" style="justify-content: center;">
          <span class="pdf-thumb-title">Página ${state.originalIndex + 1}</span>
        </div>
      `;

      gridContainer.appendChild(card);
    });

    // Add listeners
    gridContainer.querySelectorAll('.pdf-btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLButtonElement).dataset.id;
        pagesState = pagesState.filter(p => p.id !== id);
        renderGrid(); // Re-render everything
      });
    });

    gridContainer.querySelectorAll('.pdf-btn-rotate').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLButtonElement).dataset.id;
        const page = pagesState.find(p => p.id === id);
        if (page) {
          page.rotationDelta = (page.rotationDelta + 90) % 360;
          // Update visual immediately without full re-render
          const card = gridContainer.querySelector(`.pdf-thumb-card[data-id="${id}"]`);
          if (card) {
            const img = card.querySelector('img');
            if (img) {
              img.style.transform = `rotate(${page.rotationDelta}deg)`;
            }
          }
        }
      });
    });

    // Setup Sortable
    if (sortableInstance) sortableInstance.destroy();
    
    if (pagesState.length > 0) {
      sortableInstance = new Sortable(gridContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          const oldIndex = evt.oldIndex;
          const newIndex = evt.newIndex;
          if (oldIndex !== undefined && newIndex !== undefined) {
            const movedItem = pagesState.splice(oldIndex, 1)[0];
            pagesState.splice(newIndex, 0, movedItem);
          }
        }
      });
      btnExecute.disabled = false;
      btnExecute.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Salvar PDF (${pagesState.length} páginas)
      `;
    } else {
      btnExecute.disabled = true;
      btnExecute.innerHTML = 'Nenhuma página restante';
    }
  }

  btnExecute.addEventListener('click', async () => {
    if (!loadedBuffer || pagesState.length === 0 || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    
    try {
      const operations = pagesState.map(p => ({
        originalIndex: p.originalIndex,
        rotationDelta: p.rotationDelta
      }));
      
      const newPdfBytes = await PdfService.organizePdf(loadedBuffer, operations);
      
      const blob = new Blob([newPdfBytes.buffer as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_organizado.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record(
        'pdf-organize',
        'pdf',
        'Organizou / Girou PDF',
        `${operations.length} páginas no PDF final`,
        'PDF exportado',
        {}
      );
      
    } catch (err) {
      console.error(err);
      alert('Erro ao organizar PDF.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
    }
  });
}
