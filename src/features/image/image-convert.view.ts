import JSZip from 'jszip';
import { ImageService } from './image.service';
import { historyManager } from '../../core/history/history.manager';

export function renderImageConvert(container: HTMLElement) {
  let selectedFiles: File[] = [];
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-img-conv" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Conversor de Imagens</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-img-conv" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="img-conv-setup-area">
      <div class="dropzone-box" id="img-conv-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 16-5.16-5.16a2 2 0 0 0-2.83 0l-5.17 5.17"/><path d="m16 21-4.82-4.82a2 2 0 0 0-2.83 0l-5.17 5.17"/><circle cx="8" cy="9" r="2"/><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
        <div class="dropzone-text">Arraste imagens para cá</div>
        <div class="dropzone-hint">Você pode enviar vários arquivos de uma vez</div>
        <input type="file" id="img-conv-file-input" accept="image/*" multiple style="display: none;" />
      </div>
    </div>

    <div id="img-conv-workspace-area" style="display: none;">
      
      <div class="form-group" style="margin-bottom: 24px; background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 1rem;">Arquivos Selecionados (<span id="img-conv-count">0</span>)</h3>
          <button class="btn-back" id="btn-add-more-img" style="height: 32px; padding: 0 12px; font-size: 0.8rem;">Adicionar mais</button>
        </div>
        
        <div id="img-conv-list" style="max-height: 200px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 4px; padding: 8px;">
          <!-- Items here -->
        </div>

        <label class="form-label">Converter todas para:</label>
        <select id="img-conv-format-select" class="form-input">
          <option value="image/jpeg">JPG / JPEG</option>
          <option value="image/png">PNG</option>
          <option value="image/webp">WebP</option>
        </select>
        <div class="dropzone-hint" style="margin-top: 8px; text-align: left;">
          O formato WebP costuma ser até 30% mais leve que o JPG sem perda de qualidade visual.
        </div>
      </div>

      <div id="img-conv-progress" class="pdf-progress-text" style="display: none; margin: 16px 0;">
        Convertendo imagens... <span id="img-conv-progress-count">0/0</span>
      </div>

      <button class="btn-primary" id="btn-img-conv-execute">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Converter e Baixar
      </button>

      <button class="btn-back" id="btn-reset-img-conv" style="width: 100%; justify-content: center; margin-top: 12px; height: 44px;">
        Limpar Tudo
      </button>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-img-conv') as HTMLButtonElement;
  const dropzone = container.querySelector('#img-conv-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#img-conv-file-input') as HTMLInputElement;
  
  const setupArea = container.querySelector('#img-conv-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#img-conv-workspace-area') as HTMLDivElement;
  
  const listContainer = container.querySelector('#img-conv-list') as HTMLDivElement;
  const countSpan = container.querySelector('#img-conv-count') as HTMLSpanElement;
  const btnAddMore = container.querySelector('#btn-add-more-img') as HTMLButtonElement;
  const formatSelect = container.querySelector('#img-conv-format-select') as HTMLSelectElement;
  
  const progressContainer = container.querySelector('#img-conv-progress') as HTMLDivElement;
  const progressCount = container.querySelector('#img-conv-progress-count') as HTMLSpanElement;
  
  const btnExecute = container.querySelector('#btn-img-conv-execute') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-img-conv') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  btnReset.addEventListener('click', () => {
    selectedFiles = [];
    renderList();
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  btnAddMore.addEventListener('click', () => fileInput.click());
  
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--btn-primary-bg)'; });
  dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--border-color)'; });
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer && e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  dropzone.addEventListener('drop', handleDrop);
  workspaceArea.addEventListener('dragover', (e) => e.preventDefault());
  workspaceArea.addEventListener('drop', handleDrop); // Allow dropping on the workspace too

  fileInput.addEventListener('change', () => {
    if (fileInput.files) addFiles(Array.from(fileInput.files));
    fileInput.value = ''; // reset so same file can be selected again
  });

  function addFiles(files: File[]) {
    const imgFiles = files.filter(f => f.type.startsWith('image/'));
    if (imgFiles.length === 0) {
      alert('Nenhuma imagem válida encontrada.');
      return;
    }
    
    selectedFiles.push(...imgFiles);
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';
    renderList();
  }

  function renderList() {
    countSpan.innerText = selectedFiles.length.toString();
    listContainer.innerHTML = '';
    
    if (selectedFiles.length === 0) {
      setupArea.style.display = 'block';
      workspaceArea.style.display = 'none';
      return;
    }
    
    selectedFiles.forEach((file, index) => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.background = 'var(--bg-surface)';
      item.style.padding = '8px 12px';
      item.style.borderRadius = '4px';
      item.style.fontSize = '0.9rem';
      
      const name = document.createElement('span');
      name.style.whiteSpace = 'nowrap';
      name.style.overflow = 'hidden';
      name.style.textOverflow = 'ellipsis';
      name.style.maxWidth = '80%';
      name.innerText = file.name;
      
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '&times;';
      delBtn.style.background = 'none';
      delBtn.style.border = 'none';
      delBtn.style.color = 'var(--text-tertiary)';
      delBtn.style.cursor = 'pointer';
      delBtn.style.fontSize = '1.2rem';
      delBtn.style.lineHeight = '1';
      
      delBtn.addEventListener('click', () => {
        selectedFiles.splice(index, 1);
        renderList();
      });
      
      item.appendChild(name);
      item.appendChild(delBtn);
      listContainer.appendChild(item);
    });
  }

  btnExecute.addEventListener('click', async () => {
    if (selectedFiles.length === 0 || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Processando...';
    progressContainer.style.display = 'block';
    
    const targetFormat = formatSelect.value;
    let ext = 'jpg';
    if (targetFormat === 'image/png') ext = 'png';
    else if (targetFormat === 'image/webp') ext = 'webp';
    
    try {
      if (selectedFiles.length === 1) {
        // Single file download
        progressCount.innerText = '1/1';
        const file = selectedFiles[0];
        const blob = await ImageService.processImage(file, { format: targetFormat, quality: 0.9 });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.name.replace(/\.[^/.]+$/, "")}_convertido.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
      } else {
        // Multiple files ZIP
        const zip = new JSZip();
        
        for (let i = 0; i < selectedFiles.length; i++) {
          progressCount.innerText = `${i + 1}/${selectedFiles.length}`;
          const file = selectedFiles[i];
          const blob = await ImageService.processImage(file, { format: targetFormat, quality: 0.9 });
          
          const filename = `${file.name.replace(/\.[^/.]+$/, "")}.${ext}`;
          zip.file(filename, blob);
        }
        
        progressCount.innerText = 'Gerando ZIP...';
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imagens_convertidas.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      historyManager.record(
        'image-convert',
        'image',
        'Conversão de Imagem',
        `${selectedFiles.length} arquivo(s)`,
        `Convertido para ${ext.toUpperCase()}`,
        {}
      );
      
    } catch (err) {
      console.error(err);
      alert('Erro ao converter as imagens.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
      progressContainer.style.display = 'none';
    }
  });
}
