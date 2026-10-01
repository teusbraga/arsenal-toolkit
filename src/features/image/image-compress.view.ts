import { ImageService } from './image.service';
import { historyManager } from '../../core/history/history.manager';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function renderImageCompress(container: HTMLElement) {
  let selectedFile: File | null = null;
  let compressedBlob: Blob | null = null;
  let compressTimeout: any = null;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-img-comp" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Comprimir Imagem</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-img-comp" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="img-comp-setup-area">
      <div class="dropzone-box" id="img-comp-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        <div class="dropzone-text">Arraste sua imagem para cá</div>
        <div class="dropzone-hint">Suporta JPG, PNG e WebP</div>
        <input type="file" id="img-comp-file-input" accept="image/jpeg, image/png, image/webp" style="display: none;" />
      </div>
    </div>

    <div id="img-comp-workspace-area" style="display: none;">
      
      <!-- Preview Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <!-- Original -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center;">
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">Original</div>
          <div id="img-comp-orig-size" style="font-size: 1.2rem; font-weight: bold; margin-bottom: 12px;">-</div>
          <img id="img-comp-orig-preview" style="max-width: 100%; max-height: 200px; border-radius: 4px; object-fit: contain; background: #eee;" />
        </div>
        
        <!-- Comprimida -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; text-align: center; position: relative;">
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">Comprimida</div>
          <div id="img-comp-new-size" style="font-size: 1.2rem; font-weight: bold; color: #22c55e; margin-bottom: 12px;">-</div>
          <div id="img-comp-saving-badge" style="position: absolute; top: 16px; right: 16px; background: rgba(34,197,94,0.1); color: #22c55e; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 500; display: none;">-0%</div>
          <img id="img-comp-new-preview" style="max-width: 100%; max-height: 200px; border-radius: 4px; object-fit: contain; background: #eee;" />
        </div>
      </div>
      
      <!-- Controls -->
      <div class="form-group" style="margin-bottom: 24px; background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <label class="form-label" style="margin: 0;">Qualidade (<span id="img-comp-quality-val">80</span>%)</label>
          <span style="font-size: 0.8rem; color: var(--text-tertiary);" id="img-comp-status">Pronto</span>
        </div>
        <input type="range" id="img-comp-quality-slider" min="1" max="100" value="80" style="width: 100%;" />
        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-tertiary); margin-top: 4px;">
          <span>Menor arquivo (Pior Qualidade)</span>
          <span>Maior arquivo (Melhor Qualidade)</span>
        </div>
        
        <div style="margin-top: 16px;">
          <label class="form-label">Formato de Saída</label>
          <select id="img-comp-format-select" class="form-input">
            <option value="image/jpeg">JPG / JPEG (Excelente compressão)</option>
            <option value="image/webp">WebP (Formato moderno, muito leve)</option>
            <option value="image/png">PNG (Preserva transparência, arquivo maior)</option>
          </select>
        </div>
      </div>
      
      <button class="btn-primary" id="btn-img-comp-download">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Baixar Imagem Comprimida
      </button>

      <button class="btn-back" id="btn-reset-img-comp" style="width: 100%; justify-content: center; margin-top: 12px; height: 44px;">
        Escolher Outra Imagem
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-img-comp') as HTMLButtonElement;
  const dropzone = container.querySelector('#img-comp-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#img-comp-file-input') as HTMLInputElement;
  
  const setupArea = container.querySelector('#img-comp-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#img-comp-workspace-area') as HTMLDivElement;
  
  const origPreview = container.querySelector('#img-comp-orig-preview') as HTMLImageElement;
  const newPreview = container.querySelector('#img-comp-new-preview') as HTMLImageElement;
  const origSize = container.querySelector('#img-comp-orig-size') as HTMLSpanElement;
  const newSize = container.querySelector('#img-comp-new-size') as HTMLSpanElement;
  const savingBadge = container.querySelector('#img-comp-saving-badge') as HTMLDivElement;
  const statusSpan = container.querySelector('#img-comp-status') as HTMLSpanElement;
  
  const slider = container.querySelector('#img-comp-quality-slider') as HTMLInputElement;
  const sliderVal = container.querySelector('#img-comp-quality-val') as HTMLSpanElement;
  const formatSelect = container.querySelector('#img-comp-format-select') as HTMLSelectElement;
  
  const btnDownload = container.querySelector('#btn-img-comp-download') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-img-comp') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    compressedBlob = null;
    fileInput.value = '';
    origPreview.src = '';
    newPreview.src = '';
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
    if (fileInput.files && fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return alert('Selecione uma imagem válida.');
    
    selectedFile = file;
    origSize.innerText = formatBytes(file.size);
    
    // Auto select format
    if (file.type === 'image/png') formatSelect.value = 'image/png';
    else if (file.type === 'image/webp') formatSelect.value = 'image/webp';
    else formatSelect.value = 'image/jpeg';
    
    const url = URL.createObjectURL(file);
    origPreview.src = url;
    
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';
    
    // Initial compression
    triggerCompression();
  }

  slider.addEventListener('input', () => {
    sliderVal.innerText = slider.value;
    triggerCompression();
  });
  
  formatSelect.addEventListener('change', () => {
    triggerCompression();
  });

  function triggerCompression() {
    if (!selectedFile) return;
    
    statusSpan.innerText = 'Calculando...';
    statusSpan.style.color = 'var(--text-tertiary)';
    newSize.innerText = '...';
    savingBadge.style.display = 'none';
    
    if (compressTimeout) clearTimeout(compressTimeout);
    
    compressTimeout = setTimeout(async () => {
      if (!selectedFile) return;
      const quality = parseInt(slider.value, 10) / 100;
      const format = formatSelect.value;
      
      try {
        compressedBlob = await ImageService.processImage(selectedFile, { quality, format });
        
        newSize.innerText = formatBytes(compressedBlob.size);
        
        // Show saving badge
        const percentage = Math.round((1 - (compressedBlob.size / selectedFile.size)) * 100);
        savingBadge.style.display = 'block';
        
        if (compressedBlob.size < selectedFile.size) {
          savingBadge.innerText = `-${percentage}%`;
          savingBadge.style.color = '#22c55e';
          savingBadge.style.backgroundColor = 'rgba(34,197,94,0.1)';
        } else {
          savingBadge.innerText = `+${Math.abs(percentage)}%`;
          savingBadge.style.color = '#ef4444'; // red if bigger
          savingBadge.style.backgroundColor = 'rgba(239,68,68,0.1)';
        }
        
        // Update preview image
        const url = URL.createObjectURL(compressedBlob);
        newPreview.onload = () => URL.revokeObjectURL(url);
        newPreview.src = url;
        
        statusSpan.innerText = 'Pronto';
        statusSpan.style.color = '#22c55e';
      } catch (err) {
        console.error(err);
        statusSpan.innerText = 'Erro';
        statusSpan.style.color = '#ef4444';
      }
    }, 300); // 300ms debounce
  }

  btnDownload.addEventListener('click', () => {
    if (!compressedBlob || !selectedFile) return;
    
    let ext = 'jpg';
    if (formatSelect.value === 'image/png') ext = 'png';
    else if (formatSelect.value === 'image/webp') ext = 'webp';
    
    const url = URL.createObjectURL(compressedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_comprimido.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    historyManager.record(
      'image-compress',
      'image',
      'Compressão de Imagem',
      `${formatBytes(selectedFile.size)} (${ext.toUpperCase()})`,
      `Reduzido para ${formatBytes(compressedBlob.size)}`,
      {}
    );
  });
}
