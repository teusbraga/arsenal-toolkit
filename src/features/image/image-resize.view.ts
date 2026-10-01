import { ImageService } from './image.service';
import { historyManager } from '../../core/history/history.manager';

export function renderImageResize(container: HTMLElement) {
  let selectedFile: File | null = null;
  let originalWidth = 0;
  let originalHeight = 0;
  let aspectRatio = 1;
  let keepAspectRatio = true;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-img-res" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Redimensionar Imagem</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-img-res" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="img-res-setup-area">
      <div class="dropzone-box" id="img-res-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
        <div class="dropzone-text">Arraste sua imagem para cá</div>
        <div class="dropzone-hint">Ou clique para selecionar (JPG, PNG, WebP)</div>
        <input type="file" id="img-res-file-input" accept="image/jpeg, image/png, image/webp" style="display: none;" />
      </div>
    </div>

    <div id="img-res-workspace-area" style="display: none;">
      
      <div style="background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); text-align: center; margin-bottom: 24px;">
        <img id="img-res-preview" style="max-width: 100%; max-height: 250px; border-radius: 4px; object-fit: contain; background: #eee; margin-bottom: 12px;" />
        <div style="color: var(--text-secondary); font-size: 0.9rem;">
          Original: <strong id="img-res-orig-dim">0 x 0 px</strong>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 24px; background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap;">
          
          <div style="flex: 1; min-width: 120px;">
            <label class="form-label">Largura (px)</label>
            <input type="number" id="img-res-input-w" class="form-input" min="1" step="1" />
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 8px;">
            <button id="btn-img-res-lock" title="Manter Proporção" style="background: none; border: none; color: var(--btn-primary-bg); cursor: pointer; padding: 4px;">
              <svg id="icon-lock-closed" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <svg id="icon-lock-open" style="display: none;" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
            </button>
          </div>
          
          <div style="flex: 1; min-width: 120px;">
            <label class="form-label">Altura (px)</label>
            <input type="number" id="img-res-input-h" class="form-input" min="1" step="1" />
          </div>
          
        </div>
        
        <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
          <button class="btn-back btn-percent" data-val="0.25" style="flex: 1; padding: 8px;">25%</button>
          <button class="btn-back btn-percent" data-val="0.5" style="flex: 1; padding: 8px;">50%</button>
          <button class="btn-back btn-percent" data-val="0.75" style="flex: 1; padding: 8px;">75%</button>
          <button class="btn-back btn-percent" data-val="2" style="flex: 1; padding: 8px;">200%</button>
        </div>

      </div>

      <button class="btn-primary" id="btn-img-res-execute">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Baixar Imagem
      </button>

      <button class="btn-back" id="btn-reset-img-res" style="width: 100%; justify-content: center; margin-top: 12px; height: 44px;">
        Trocar Imagem
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-img-res') as HTMLButtonElement;
  const dropzone = container.querySelector('#img-res-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#img-res-file-input') as HTMLInputElement;
  
  const setupArea = container.querySelector('#img-res-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#img-res-workspace-area') as HTMLDivElement;
  
  const previewImg = container.querySelector('#img-res-preview') as HTMLImageElement;
  const origDimSpan = container.querySelector('#img-res-orig-dim') as HTMLSpanElement;
  
  const inputW = container.querySelector('#img-res-input-w') as HTMLInputElement;
  const inputH = container.querySelector('#img-res-input-h') as HTMLInputElement;
  const btnLock = container.querySelector('#btn-img-res-lock') as HTMLButtonElement;
  const iconLockClosed = container.querySelector('#icon-lock-closed') as SVGElement;
  const iconLockOpen = container.querySelector('#icon-lock-open') as SVGElement;
  
  const btnPercents = container.querySelectorAll('.btn-percent');
  const btnExecute = container.querySelector('#btn-img-res-execute') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-img-res') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    fileInput.value = '';
    previewImg.src = '';
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
    
    try {
      const img = await ImageService.fileToImage(file);
      originalWidth = img.width;
      originalHeight = img.height;
      aspectRatio = originalWidth / originalHeight;
      
      origDimSpan.innerText = `${originalWidth} x ${originalHeight} px`;
      inputW.value = originalWidth.toString();
      inputH.value = originalHeight.toString();
      
      const url = URL.createObjectURL(file);
      previewImg.src = url;
      previewImg.onload = () => URL.revokeObjectURL(url);
      
      setupArea.style.display = 'none';
      workspaceArea.style.display = 'block';
    } catch (e) {
      alert('Não foi possível ler as dimensões da imagem.');
    }
  }

  btnLock.addEventListener('click', () => {
    keepAspectRatio = !keepAspectRatio;
    if (keepAspectRatio) {
      iconLockClosed.style.display = 'block';
      iconLockOpen.style.display = 'none';
      btnLock.style.color = 'var(--btn-primary-bg)';
      // re-sync to current W
      inputH.value = Math.round(parseInt(inputW.value, 10) / aspectRatio).toString();
    } else {
      iconLockClosed.style.display = 'none';
      iconLockOpen.style.display = 'block';
      btnLock.style.color = 'var(--text-tertiary)';
    }
  });

  inputW.addEventListener('input', () => {
    if (keepAspectRatio) {
      const w = parseInt(inputW.value, 10);
      if (!isNaN(w) && w > 0) {
        inputH.value = Math.round(w / aspectRatio).toString();
      }
    }
  });

  inputH.addEventListener('input', () => {
    if (keepAspectRatio) {
      const h = parseInt(inputH.value, 10);
      if (!isNaN(h) && h > 0) {
        inputW.value = Math.round(h * aspectRatio).toString();
      }
    }
  });

  btnPercents.forEach(btn => {
    btn.addEventListener('click', () => {
      const scale = parseFloat((btn as HTMLElement).dataset.val || '1');
      inputW.value = Math.round(originalWidth * scale).toString();
      inputH.value = Math.round(originalHeight * scale).toString();
    });
  });

  btnExecute.addEventListener('click', async () => {
    if (!selectedFile || isProcessing) return;
    
    const w = parseInt(inputW.value, 10);
    const h = parseInt(inputH.value, 10);
    
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      return alert('Dimensões inválidas.');
    }

    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    
    try {
      // Default to PNG if PNG, otherwise JPG, preserving quality.
      const blob = await ImageService.processImage(selectedFile, { 
        width: w, 
        height: h, 
        quality: 0.9, 
        format: selectedFile.type === 'image/png' ? 'image/png' : 'image/jpeg' 
      });
      
      const ext = selectedFile.type === 'image/png' ? 'png' : 'jpg';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_${w}x${h}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record(
        'image-resize',
        'image',
        'Redimensionamento de Imagem',
        `${originalWidth}x${originalHeight} px`,
        `Novo tamanho: ${w}x${h} px`,
        {}
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao redimensionar a imagem.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
    }
  });
}
