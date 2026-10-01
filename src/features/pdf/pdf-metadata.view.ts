import { PdfService, PdfEditOptions } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfMetadata(container: HTMLElement) {
  let isProcessing = false;
  let selectedFile: File | null = null;
  let loadedBuffer: ArrayBuffer | null = null;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-meta" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Metadados & Marca-d'água</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-meta" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdf-meta-setup-area">
      <div class="dropzone-box" id="pdf-meta-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8"/></svg>
        <div class="dropzone-text">Arraste seu PDF para cá</div>
        <div class="dropzone-hint">Ou clique para selecionar um arquivo</div>
        <input type="file" id="pdf-meta-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdf-meta-workspace-area" style="display: none;">
      
      <!-- Metadata Section -->
      <div class="result-card" style="margin-bottom: 24px;">
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Metadados do Arquivo
        </h3>
        
        <div class="form-group">
          <label class="form-label">Título</label>
          <input type="text" class="form-input" id="meta-title" placeholder="Ex: Relatório Financeiro 2024" />
        </div>
        <div class="form-group">
          <label class="form-label">Autor</label>
          <input type="text" class="form-input" id="meta-author" placeholder="Ex: João da Silva" />
        </div>
        <div class="form-group">
          <label class="form-label">Assunto</label>
          <input type="text" class="form-input" id="meta-subject" placeholder="Ex: Balanço Anual" />
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Palavras-chave (separadas por vírgula)</label>
          <input type="text" class="form-input" id="meta-keywords" placeholder="Ex: finanças, relatório, 2024" />
        </div>
      </div>

      <!-- Pagination Section -->
      <div class="result-card" style="margin-bottom: 24px;">
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Paginação (Rodapé)
        </h3>
        
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 16px;">
          <input type="checkbox" id="chk-pagination" style="width: 18px; height: 18px;" />
          <span class="form-label" style="margin-bottom: 0; cursor: pointer;">Inserir número de páginas no rodapé central</span>
        </label>

        <div class="form-group" id="group-pagination-format" style="display: none; margin-bottom: 0;">
          <label class="form-label">Formato</label>
          <div class="segmented-tabs" id="meta-pagination-tabs">
            <button class="tab-btn active" data-format="pageOfTotal">1 / 5 (Página / Total)</button>
            <button class="tab-btn" data-format="page">1 (Apenas a página)</button>
          </div>
        </div>
      </div>

      <!-- Watermark Section -->
      <div class="result-card" style="margin-bottom: 24px;">
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1rem; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
          Marca-d'água Transversal
        </h3>
        
        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; margin-bottom: 16px;">
          <input type="checkbox" id="chk-watermark" style="width: 18px; height: 18px;" />
          <span class="form-label" style="margin-bottom: 0; cursor: pointer;">Adicionar marca-d'água em todas as páginas</span>
        </label>

        <div class="form-group" id="group-watermark-text" style="display: none; margin-bottom: 0;">
          <label class="form-label">Texto da Marca-d'água</label>
          <input type="text" class="form-input" id="meta-watermark-text" placeholder="Ex: CONFIDENCIAL" />
        </div>
      </div>

      <button class="btn-primary" id="btn-pdf-meta-execute">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        Aplicar e Baixar PDF
      </button>

      <button class="btn-back" id="btn-reset-pdf-meta" style="width: 100%; justify-content: center; margin-top: 12px; height: 44px;">
        Trocar de Arquivo
      </button>
    </div>
  `;

  // UI Elements
  const btnBack = container.querySelector('#btn-back-pdf-meta') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdf-meta-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdf-meta-file-input') as HTMLInputElement;
  const setupArea = container.querySelector('#pdf-meta-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdf-meta-workspace-area') as HTMLDivElement;
  const btnExecute = container.querySelector('#btn-pdf-meta-execute') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-pdf-meta') as HTMLButtonElement;

  // Metadata Inputs
  const iTitle = container.querySelector('#meta-title') as HTMLInputElement;
  const iAuthor = container.querySelector('#meta-author') as HTMLInputElement;
  const iSubject = container.querySelector('#meta-subject') as HTMLInputElement;
  const iKeywords = container.querySelector('#meta-keywords') as HTMLInputElement;

  // Pagination Elements
  const chkPagination = container.querySelector('#chk-pagination') as HTMLInputElement;
  const groupPaginationFormat = container.querySelector('#group-pagination-format') as HTMLDivElement;
  const paginationTabs = container.querySelectorAll('#meta-pagination-tabs .tab-btn');
  let paginationFormat: 'pageOfTotal' | 'page' = 'pageOfTotal';

  // Watermark Elements
  const chkWatermark = container.querySelector('#chk-watermark') as HTMLInputElement;
  const groupWatermarkText = container.querySelector('#group-watermark-text') as HTMLDivElement;
  const iWatermarkText = container.querySelector('#meta-watermark-text') as HTMLInputElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    loadedBuffer = null;
    fileInput.value = '';
    
    // Reset inputs
    iTitle.value = '';
    iAuthor.value = '';
    iSubject.value = '';
    iKeywords.value = '';
    chkPagination.checked = false;
    chkWatermark.checked = false;
    groupPaginationFormat.style.display = 'none';
    groupWatermarkText.style.display = 'none';
    iWatermarkText.value = '';
  });

  // Toggles
  chkPagination.addEventListener('change', () => {
    groupPaginationFormat.style.display = chkPagination.checked ? 'block' : 'none';
  });

  chkWatermark.addEventListener('change', () => {
    groupWatermarkText.style.display = chkWatermark.checked ? 'block' : 'none';
    if (chkWatermark.checked) iWatermarkText.focus();
  });

  paginationTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      paginationTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      paginationFormat = (tab as HTMLElement).dataset.format as 'pageOfTotal' | 'page';
    });
  });

  // File loading
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--btn-primary-bg)'; });
  dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--border-color)'; });
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
    selectedFile = file;
    loadedBuffer = await PdfService.readFileAsArrayBuffer(file);
    
    // Attempt to load existing metadata if possible? (Optional future enhancement)
    // We start blank for now.

    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';
  }

  btnExecute.addEventListener('click', async () => {
    if (!loadedBuffer || !selectedFile || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    
    try {
      const options: PdfEditOptions = {
        metadata: {
          title: iTitle.value.trim() || undefined,
          author: iAuthor.value.trim() || undefined,
          subject: iSubject.value.trim() || undefined,
          keywords: iKeywords.value.trim() || undefined,
        },
        pagination: {
          enabled: chkPagination.checked,
          format: paginationFormat
        },
        watermark: {
          enabled: chkWatermark.checked,
          text: iWatermarkText.value.trim()
        }
      };
      
      const newPdfBytes = await PdfService.editPdf(loadedBuffer, options);
      
      const blob = new Blob([newPdfBytes.buffer as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_editado.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      let actions = [];
      if (options.metadata?.title || options.metadata?.author) actions.push('Metadados');
      if (options.pagination?.enabled) actions.push('Paginação');
      if (options.watermark?.enabled) actions.push('Marca-d\'água');

      historyManager.record(
        'pdf-metadata',
        'pdf',
        'Metadados & Marca-d\'água',
        `Original: ${selectedFile.name}`,
        `Aplicado: ${actions.length > 0 ? actions.join(', ') : 'Sem alterações visuais'}`,
        {}
      );
      
    } catch (err) {
      console.error(err);
      alert('Erro ao processar o PDF.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
    }
  });
}
