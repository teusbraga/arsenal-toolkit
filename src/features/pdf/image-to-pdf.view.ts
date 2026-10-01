import Sortable from 'sortablejs';
import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

interface ImageRecord {
  id: string;
  file: File;
  url: string;
}

export function renderImageToPdf(container: HTMLElement) {
  let imageRecords: ImageRecord[] = [];
  let sortableInstance: Sortable | null = null;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-img-pdf" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Imagem para PDF</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-img-pdf" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div class="dropzone-box" id="img-pdf-dropzone">
      <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
      <div class="dropzone-text">Arraste suas Imagens para cá</div>
      <div class="dropzone-hint">Suporta JPG e PNG. Você pode arrastar mais arquivos depois.</div>
      <input type="file" id="img-pdf-file-input" multiple accept="image/jpeg, image/png, image/jpg" style="display: none;" />
    </div>

    <div class="pdf-grid" id="img-pdf-grid-container" style="margin-top: 24px;"></div>

    <button class="btn-primary" id="btn-img-pdf-execute" style="display: none; margin-top: 24px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      Gerar PDF (0 imagens)
    </button>
  `;

  const btnBack = container.querySelector('#btn-back-img-pdf') as HTMLButtonElement;
  const dropzone = container.querySelector('#img-pdf-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#img-pdf-file-input') as HTMLInputElement;
  const gridContainer = container.querySelector('#img-pdf-grid-container') as HTMLDivElement;
  const btnExecute = container.querySelector('#btn-img-pdf-execute') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

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

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files) {
      handleFiles(Array.from(fileInput.files));
    }
    fileInput.value = '';
  });

  function handleFiles(files: File[]) {
    const validImages = files.filter(f => f.type === 'image/jpeg' || f.type === 'image/png' || f.type === 'image/jpg');
    if (validImages.length === 0) return;

    const newRecords = validImages.map(file => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file)
    }));

    imageRecords = [...imageRecords, ...newRecords];
    renderGrid();
  }

  function renderGrid() {
    gridContainer.innerHTML = '';
    
    imageRecords.forEach(record => {
      const card = document.createElement('div');
      card.className = 'pdf-thumb-card';
      card.dataset.id = record.id;

      card.innerHTML = `
        <button class="pdf-btn-remove" data-id="${record.id}" title="Remover Imagem">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
        <div class="pdf-thumb-canvas-wrapper" style="background-color: transparent;">
          <img src="${record.url}" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
        <div class="pdf-thumb-info" style="justify-content: center;">
          <span class="pdf-thumb-title" title="${record.file.name}">${record.file.name}</span>
        </div>
      `;

      gridContainer.appendChild(card);
    });

    // Remove listeners
    gridContainer.querySelectorAll('.pdf-btn-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = (btn as HTMLButtonElement).dataset.id;
        // Revoke URL to prevent memory leak
        const record = imageRecords.find(r => r.id === id);
        if (record) URL.revokeObjectURL(record.url);
        
        imageRecords = imageRecords.filter(r => r.id !== id);
        renderGrid();
      });
    });

    if (sortableInstance) sortableInstance.destroy();
    
    if (imageRecords.length > 0) {
      sortableInstance = new Sortable(gridContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          const oldIndex = evt.oldIndex;
          const newIndex = evt.newIndex;
          if (oldIndex !== undefined && newIndex !== undefined) {
            const movedItem = imageRecords.splice(oldIndex, 1)[0];
            imageRecords.splice(newIndex, 0, movedItem);
          }
        }
      });
    }

    updateExecuteButton();
  }

  function updateExecuteButton() {
    if (imageRecords.length > 0) {
      btnExecute.style.display = 'flex';
      btnExecute.disabled = false;
      btnExecute.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Gerar PDF (${imageRecords.length} imagem${imageRecords.length > 1 ? 'ns' : ''})
      `;
    } else {
      btnExecute.style.display = 'none';
    }
  }

  btnExecute.addEventListener('click', async () => {
    if (imageRecords.length === 0 || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    
    try {
      const filesToProcess = imageRecords.map(r => r.file);
      const newPdfBytes = await PdfService.imagesToPdf(filesToProcess);
      
      const blob = new Blob([newPdfBytes.buffer as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagens_convertidas_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record(
        'image-to-pdf',
        'pdf',
        'Imagem para PDF',
        `${filesToProcess.length} imagens convertidas`,
        'PDF gerado',
        {}
      );
      
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar o PDF. Verifique os formatos de imagem.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
    }
  });
}
