import { historyManager } from '../../core/history/history.manager';

export function renderImageBase64(container: HTMLElement) {
  let selectedFile: File | null = null;
  let base64String = '';

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-img-b64" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Gerador de Base64</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-img-b64" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="img-b64-setup-area">
      <div class="dropzone-box" id="img-b64-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/></svg>
        <div class="dropzone-text">Arraste uma imagem para cá</div>
        <div class="dropzone-hint">Ideal para ícones pequenos e SVGs/PNGs que você deseja embutir no código</div>
        <input type="file" id="img-b64-file-input" accept="image/*" style="display: none;" />
      </div>
    </div>

    <div id="img-b64-workspace-area" style="display: none;">
      
      <div style="background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); text-align: center; margin-bottom: 24px;">
        <img id="img-b64-preview" style="max-width: 100%; max-height: 150px; border-radius: 4px; object-fit: contain; background: #eee;" />
      </div>

      <div class="form-group" style="margin-bottom: 24px;">
        <label class="form-label">Resultado Base64</label>
        <textarea id="img-b64-textarea" class="form-input" style="height: 150px; font-family: monospace; font-size: 0.8rem; resize: vertical;" readonly></textarea>
        
        <div style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
          <button class="btn-back btn-copy" data-type="raw" style="flex: 1; justify-content: center; padding: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copiar Texto
          </button>
          <button class="btn-back btn-copy" data-type="html" style="flex: 1; justify-content: center; padding: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
            Copiar como &lt;img&gt;
          </button>
          <button class="btn-back btn-copy" data-type="css" style="flex: 1; justify-content: center; padding: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>
            Copiar para CSS
          </button>
        </div>
      </div>

      <button class="btn-back" id="btn-reset-img-b64" style="width: 100%; justify-content: center; margin-top: 12px; height: 44px;">
        Trocar Imagem
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-img-b64') as HTMLButtonElement;
  const dropzone = container.querySelector('#img-b64-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#img-b64-file-input') as HTMLInputElement;
  
  const setupArea = container.querySelector('#img-b64-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#img-b64-workspace-area') as HTMLDivElement;
  
  const previewImg = container.querySelector('#img-b64-preview') as HTMLImageElement;
  const textarea = container.querySelector('#img-b64-textarea') as HTMLTextAreaElement;
  
  const copyBtns = container.querySelectorAll('.btn-copy');
  const btnReset = container.querySelector('#btn-reset-img-b64') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    base64String = '';
    fileInput.value = '';
    previewImg.src = '';
    textarea.value = '';
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

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return alert('Selecione uma imagem válida.');
    
    selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        base64String = e.target.result;
        previewImg.src = base64String;
        textarea.value = base64String;
        
        setupArea.style.display = 'none';
        workspaceArea.style.display = 'block';
        
        historyManager.record(
          'image-base64',
          'image',
          'Gerador de Base64',
          file.name,
          'Base64 gerado com sucesso',
          {}
        );
      }
    };
    reader.readAsDataURL(file);
  }

  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!base64String) return;
      
      const type = (btn as HTMLElement).dataset.type;
      let textToCopy = base64String;
      
      if (type === 'html') {
        textToCopy = `<img src="${base64String}" alt="${selectedFile?.name || 'imagem'}" />`;
      } else if (type === 'css') {
        textToCopy = `background-image: url('${base64String}');`;
      }
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Copiado!';
        setTimeout(() => { btn.innerHTML = originalText; }, 2000);
      } catch (err) {
        alert('Falha ao copiar.');
      }
    });
  });
}
