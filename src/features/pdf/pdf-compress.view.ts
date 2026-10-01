import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function renderPdfCompress(container: HTMLElement) {
  let isProcessing = false;
  let selectedFile: File | null = null;
  // Presets: quality and scale
  let compressPreset: 'max' | 'balanced' | 'high' = 'balanced';

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-comp" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Comprimir PDF</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-comp" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdf-comp-setup-area">
      <div class="dropzone-box" id="pdf-comp-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        <div class="dropzone-text">Arraste seu PDF para cá</div>
        <div class="dropzone-hint">Ou clique para selecionar um arquivo</div>
        <input type="file" id="pdf-comp-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdf-comp-workspace-area" style="display: none;">
      
      <div class="result-card" style="margin-bottom: 24px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="result-label" style="margin-bottom: 0;">Arquivo Original:</span>
          <span class="result-value" id="pdf-comp-filename" style="max-width: 60%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">-</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span class="result-label" style="margin-bottom: 0;">Tamanho:</span>
          <span class="result-value" id="pdf-comp-filesize">-</span>
        </div>
      </div>
      
      <div class="form-group" style="margin-bottom: 24px;">
        <label class="form-label">Nível de Compressão</label>
        <div class="segmented-tabs" id="pdf-comp-tabs" style="display: flex; flex-direction: column; gap: 8px;">
          
          <button class="tab-btn" data-preset="max" style="text-align: left; padding: 12px; height: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
            <div style="font-weight: 500;">Extrema Compressão</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: 400; text-transform: none;">Menor arquivo possível, qualidade de imagem reduzida.</div>
          </button>
          
          <button class="tab-btn active" data-preset="balanced" style="text-align: left; padding: 12px; height: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
            <div style="font-weight: 500;">Compressão Equilibrada (Recomendado)</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: 400; text-transform: none;">Boa redução de tamanho mantendo boa legibilidade.</div>
          </button>
          
          <button class="tab-btn" data-preset="high" style="text-align: left; padding: 12px; height: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
            <div style="font-weight: 500;">Alta Qualidade</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: 400; text-transform: none;">Redução leve, focada em manter a máxima qualidade visual.</div>
          </button>
          
        </div>
      </div>
      
      <div style="background-color: rgba(255,165,0,0.1); border-left: 3px solid orange; padding: 12px; border-radius: 4px; margin-bottom: 24px; font-size: 0.85rem; color: var(--text-secondary);">
        <strong>Nota:</strong> Este processo rasteriza o documento. Isso reduz radicalmente o tamanho de PDFs escaneados ou cheios de imagens, mas os textos deixarão de ser selecionáveis.
      </div>

      <div id="pdf-comp-progress" class="pdf-progress-text" style="display: none; margin: 16px 0;">
        Comprimindo páginas... <span id="pdf-comp-progress-count">0%</span>
      </div>
      
      <div id="pdf-comp-success" style="display: none; background-color: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
        <div style="color: #22c55e; font-weight: bold; margin-bottom: 8px;">Concluído com Sucesso! 🎉</div>
        <div id="pdf-comp-success-stats" style="color: var(--text-secondary); font-size: 0.9rem;">Reduzido de X para Y</div>
      </div>

      <button class="btn-primary" id="btn-pdf-comp-execute">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m8 17 4 4 4-4"/></svg>
        Comprimir PDF
      </button>

      <button class="btn-back" id="btn-reset-pdf-comp" style="width: 100%; justify-content: center; margin-top: 12px; height: 44px;">
        Trocar de Arquivo
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdf-comp') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdf-comp-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdf-comp-file-input') as HTMLInputElement;
  
  const setupArea = container.querySelector('#pdf-comp-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdf-comp-workspace-area') as HTMLDivElement;
  const filenameSpan = container.querySelector('#pdf-comp-filename') as HTMLSpanElement;
  const filesizeSpan = container.querySelector('#pdf-comp-filesize') as HTMLSpanElement;
  
  const presetTabs = container.querySelectorAll('#pdf-comp-tabs .tab-btn');
  const progressContainer = container.querySelector('#pdf-comp-progress') as HTMLDivElement;
  const progressCount = container.querySelector('#pdf-comp-progress-count') as HTMLSpanElement;
  const successContainer = container.querySelector('#pdf-comp-success') as HTMLDivElement;
  const successStats = container.querySelector('#pdf-comp-success-stats') as HTMLDivElement;
  
  const btnExecute = container.querySelector('#btn-pdf-comp-execute') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-pdf-comp') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    fileInput.value = '';
    progressContainer.style.display = 'none';
    successContainer.style.display = 'none';
    btnExecute.style.display = 'flex';
  });

  presetTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      presetTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      compressPreset = (tab as HTMLElement).dataset.preset as 'max' | 'balanced' | 'high';
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
    filesizeSpan.innerText = formatBytes(file.size);
    
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';
    successContainer.style.display = 'none';
    btnExecute.style.display = 'flex';
  }

  btnExecute.addEventListener('click', async () => {
    if (!selectedFile || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnReset.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    progressContainer.style.display = 'block';
    successContainer.style.display = 'none';
    
    let quality = 0.7;
    let scale = 1.5;
    
    if (compressPreset === 'max') {
      quality = 0.5;
      scale = 1.0;
    } else if (compressPreset === 'high') {
      quality = 0.85;
      scale = 2.0;
    }
    
    try {
      const newPdfBytes = await PdfService.compressPdfViaCanvas(selectedFile, quality, scale, (rendered, total) => {
        progressCount.innerText = `${Math.round((rendered / total) * 100)}%`;
      });
      
      const blob = new Blob([newPdfBytes.buffer as any], { type: 'application/pdf' });
      const newSize = blob.size;
      const oldSize = selectedFile.size;
      
      // Update UI with success stats
      successContainer.style.display = 'block';
      const percentage = Math.round((1 - (newSize / oldSize)) * 100);
      
      if (newSize < oldSize) {
        successStats.innerHTML = `Reduzido de <strong>${formatBytes(oldSize)}</strong> para <strong>${formatBytes(newSize)}</strong> (-${percentage}%)`;
      } else {
        successStats.innerHTML = `Arquivo processado. Novo tamanho: ${formatBytes(newSize)} (O original já estava otimizado).`;
      }
      
      btnExecute.style.display = 'none'; // hide it, force them to use "Trocar de Arquivo" or re-download
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_comprimido.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record(
        'pdf-compress',
        'pdf',
        'Compressão de PDF',
        `${formatBytes(oldSize)} (Qualidade: ${compressPreset})`,
        `Comprimido para ${formatBytes(newSize)}`,
        {}
      );
      
    } catch (err) {
      console.error(err);
      alert('Erro ao comprimir o PDF.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnReset.disabled = false;
      btnExecute.innerHTML = originalText;
      progressContainer.style.display = 'none';
    }
  });
}
