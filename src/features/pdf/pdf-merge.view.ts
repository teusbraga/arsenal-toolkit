import Sortable from 'sortablejs';
import { PdfFileRecord, PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfMerge(container: HTMLElement) {
  let pdfRecords: PdfFileRecord[] = [];
  let sortableInstance: Sortable | null = null;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-merge" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Juntar PDFs</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-merge" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div class="dropzone-box" id="pdf-dropzone">
      <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      <div class="dropzone-text">Arraste seus PDFs para cá</div>
      <div class="dropzone-hint">Ou clique para selecionar arquivos</div>
      <input type="file" id="pdf-file-input" multiple accept="application/pdf" style="display: none;" />
    </div>

    <!-- Container for Sortable Grid -->
    <div class="pdf-grid" id="pdf-grid-container"></div>

    <button class="btn-primary" id="btn-merge-pdfs" style="display: none; margin-top: 24px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
      Juntar PDFs
    </button>
  `;

  const btnBack = container.querySelector('#btn-back-pdf-merge') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdf-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdf-file-input') as HTMLInputElement;
  const gridContainer = container.querySelector('#pdf-grid-container') as HTMLDivElement;
  const btnMerge = container.querySelector('#btn-merge-pdfs') as HTMLButtonElement;

  btnBack.addEventListener('click', () => {
    window.location.hash = '';
  });

  // Setup Dropzone
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
    if (e.dataTransfer && e.dataTransfer.files) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener('change', async () => {
    if (fileInput.files) {
      await handleFiles(Array.from(fileInput.files));
    }
    // reset input so same file can be selected again if needed
    fileInput.value = '';
  });

  async function handleFiles(files: File[]) {
    const pdfFiles = files.filter(f => f.type === 'application/pdf');
    if (pdfFiles.length === 0) return;

    btnMerge.disabled = true;
    btnMerge.innerHTML = 'Carregando arquivos...';
    btnMerge.style.display = 'flex';
    
    try {
      // Load all files
      const newRecords = await Promise.all(pdfFiles.map(f => PdfService.loadPdfRecord(f)));
      pdfRecords = [...pdfRecords, ...newRecords];
      renderGrid();
    } catch (err) {
      console.error('Erro ao carregar PDF:', err);
      alert('Erro ao carregar um dos arquivos PDF.');
    } finally {
      updateMergeButton();
    }
  }

  function renderGrid() {
    gridContainer.innerHTML = '';
    
    pdfRecords.forEach(record => {
      const card = document.createElement('div');
      card.className = 'pdf-thumb-card';
      card.dataset.id = record.id;

      let thumbHtml = '';
      if (record.thumbnailUrl) {
        thumbHtml = `<img src="${record.thumbnailUrl}" style="width: 100%; height: 100%; object-fit: contain;" />`;
      } else {
        thumbHtml = `<div class="pdf-loading-overlay">Carregando</div>`;
      }

      card.innerHTML = `
        <button class="pdf-btn-remove" data-id="${record.id}" title="Remover">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
        <div class="pdf-thumb-canvas-wrapper">
          ${thumbHtml}
        </div>
        <div class="pdf-thumb-info">
          <span class="pdf-thumb-title" title="${record.title}">${record.title}</span>
          <span style="font-size: 0.7rem; font-weight: 600;">${record.numPages}p</span>
        </div>
      `;

      gridContainer.appendChild(card);
    });

    // Add remove listeners
    gridContainer.querySelectorAll('.pdf-btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLButtonElement).dataset.id;
        pdfRecords = pdfRecords.filter(r => r.id !== id);
        renderGrid();
        updateMergeButton();
      });
    });

    // Initialize or update Sortable
    if (sortableInstance) {
      sortableInstance.destroy();
    }
    
    if (pdfRecords.length > 0) {
      sortableInstance = new Sortable(gridContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          // Sync pdfRecords array with new DOM order
          const oldIndex = evt.oldIndex;
          const newIndex = evt.newIndex;
          
          if (oldIndex !== undefined && newIndex !== undefined) {
            const movedItem = pdfRecords.splice(oldIndex, 1)[0];
            pdfRecords.splice(newIndex, 0, movedItem);
          }
        }
      });
    }
  }

  function updateMergeButton() {
    if (pdfRecords.length > 1) {
      btnMerge.disabled = false;
      btnMerge.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
        Juntar ${pdfRecords.length} PDFs
      `;
      btnMerge.style.display = 'flex';
    } else if (pdfRecords.length === 1) {
      btnMerge.disabled = true;
      btnMerge.innerHTML = 'Adicione mais um PDF para juntar';
      btnMerge.style.display = 'flex';
    } else {
      btnMerge.style.display = 'none';
    }
  }

  btnMerge.addEventListener('click', async () => {
    if (pdfRecords.length < 2) return;
    
    const originalText = btnMerge.innerHTML;
    btnMerge.disabled = true;
    btnMerge.innerHTML = 'Processando...';
    
    try {
      const mergedPdfBytes = await PdfService.mergePdfs(pdfRecords);
      
      // Download
      const blob = new Blob([mergedPdfBytes.buffer as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `juntados_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record(
        'pdf-merge',
        'pdf',
        'Juntou PDFs',
        `${pdfRecords.length} arquivos`,
        'PDF final gerado',
        {}
      );
      
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao juntar os PDFs.');
    } finally {
      btnMerge.disabled = false;
      btnMerge.innerHTML = originalText;
    }
  });
}
