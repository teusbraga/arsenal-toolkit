import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfToImage(container: HTMLElement) {
  let isProcessing = false;
  let selectedFile: File | null = null;
  let imageFormat: 'image/jpeg' | 'image/png' = 'image/jpeg';

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-img" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">PDF para Imagem</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-img" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdf-img-setup-area">
      <div class="dropzone-box" id="pdf-img-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="m16 17-3-3-3 3"/></svg>
        <div class="dropzone-text">Arraste seu PDF para cá</div>
        <div class="dropzone-hint">Ou clique para selecionar um arquivo</div>
        <input type="file" id="pdf-img-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdf-img-workspace-area" style="display: none;">
      <div class="result-card">
        <div class="result-row">
          <span class="result-label">Arquivo Selecionado:</span>
          <span class="result-value" id="pdf-img-filename" style="max-width: 70%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</span>
        </div>
      </div>
      
      <div class="form-group" style="margin-top: 24px;">
        <label class="form-label">Formato da Imagem</label>
        <div class="segmented-tabs" id="pdf-img-format-tabs">
          <button class="tab-btn active" data-format="image/jpeg">JPG (Recomendado)</button>
          <button class="tab-btn" data-format="image/png">PNG (Transparente)</button>
        </div>
      </div>

      <div id="pdf-img-progress" class="pdf-progress-text" style="display: none; margin: 16px 0;">
        Convertendo... <span id="pdf-img-progress-count">0%</span>
      </div>

      <button class="btn-primary" id="btn-pdf-img-execute" style="margin-top: 24px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Converter e Baixar ZIP
      </button>

      <button class="btn-back" id="btn-reset-pdf-img" style="width: 100%; justify-content: center; margin-top: 12px; height: 44px;">
        Trocar de Arquivo
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdf-img') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdf-img-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdf-img-file-input') as HTMLInputElement;
  
  const setupArea = container.querySelector('#pdf-img-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdf-img-workspace-area') as HTMLDivElement;
  const filenameSpan = container.querySelector('#pdf-img-filename') as HTMLSpanElement;
  const formatTabs = container.querySelectorAll('#pdf-img-format-tabs .tab-btn');
  
  const progressContainer = container.querySelector('#pdf-img-progress') as HTMLDivElement;
  const progressCount = container.querySelector('#pdf-img-progress-count') as HTMLSpanElement;
  
  const btnExecute = container.querySelector('#btn-pdf-img-execute') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-pdf-img') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    fileInput.value = '';
    progressContainer.style.display = 'none';
  });

  formatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      formatTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      imageFormat = (tab as HTMLElement).dataset.format as 'image/jpeg' | 'image/png';
    });
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--btn-primary-bg)'; });
  dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--border-color)'; });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF válido.');
      return;
    }
    selectedFile = file;
    filenameSpan.innerText = file.name;
    
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';
  }

  btnExecute.addEventListener('click', async () => {
    if (!selectedFile || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnReset.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    progressContainer.style.display = 'block';
    
    try {
      const zipBlob = await PdfService.pdfToImagesZip(selectedFile, imageFormat, (rendered, total) => {
        progressCount.innerText = `${Math.round((rendered / total) * 100)}%`;
      });
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_imagens.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record(
        'pdf-to-image',
        'pdf',
        'PDF para Imagem',
        `Original: ${selectedFile.name}`,
        `Exportado em ZIP (${imageFormat.includes('jpeg') ? 'JPG' : 'PNG'})`,
        {}
      );
      
    } catch (err) {
      console.error(err);
      alert('Erro ao converter o PDF em imagens.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnReset.disabled = false;
      btnExecute.innerHTML = originalText;
      progressContainer.style.display = 'none';
    }
  });
}
