import JSZip from 'jszip';
import { ImageService, ThumbnailOptions } from './image.service';
import { historyManager } from '../../core/history/history.manager';

interface PresetItem {
  id: string;
  name: string;
  category: string;
  width: number;
  height: number;
}

const PRESETS: PresetItem[] = [
  { id: 'yt-thumb', name: 'YouTube Thumbnail', category: 'YouTube', width: 1280, height: 720 },
  { id: 'insta-square', name: 'Instagram Feed (1:1)', category: 'Instagram', width: 1080, height: 1080 },
  { id: 'insta-portrait', name: 'Instagram Retrato (4:5)', category: 'Instagram', width: 1080, height: 1350 },
  { id: 'stories-reels', name: 'Stories / Reels / TikTok', category: 'Mobile', width: 1080, height: 1920 },
  { id: 'twitter-header', name: 'Twitter / X Banner', category: 'Twitter', width: 1500, height: 500 },
  { id: 'linkedin-banner', name: 'LinkedIn Banner', category: 'LinkedIn', width: 1584, height: 396 },
  { id: 'facebook-post', name: 'Facebook Post Paisagem', category: 'Facebook', width: 1200, height: 630 },
  { id: 'blog-thumb', name: 'Miniatura de Blog / Web', category: 'Web', width: 800, height: 600 },
  { id: 'favicon-512', name: 'Ícone App / Favicon HD', category: 'Ícones', width: 512, height: 512 },
  { id: 'favicon-64', name: 'Favicon Padrão (64x64)', category: 'Ícones', width: 64, height: 64 }
];

export function renderImageThumbnails(container: HTMLElement) {
  let selectedFile: File | null = null;
  let activePreset: PresetItem = PRESETS[0];
  let currentMode: 'cover' | 'contain' = 'cover';
  let activeBlob: Blob | null = null;
  let isGenerating = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-img-thumb" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Gerador de Miniaturas (Thumbnails)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-img-thumb" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="img-thumb-setup-area">
      <div class="dropzone-box" id="img-thumb-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="m9 8 6 4-6 4Z"/></svg>
        <div class="dropzone-text">Arraste uma foto ou arte para criar miniaturas</div>
        <div class="dropzone-hint">Presets para YouTube, Instagram, Stories, Twitter, LinkedIn e Favicons</div>
        <input type="file" id="img-thumb-file-input" accept="image/jpeg, image/png, image/webp" style="display: none;" />
      </div>
    </div>

    <div id="img-thumb-workspace-area" style="display: none;">
      
      <!-- Presets Selector -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <label class="form-label" style="margin-bottom: 12px; font-weight: 600;">Selecione o Formato / Rede Social:</label>
        
        <div id="img-thumb-preset-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-bottom: 16px;">
          <!-- Preset buttons injected here -->
        </div>

        <div style="display: flex; gap: 12px; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 12px; flex-wrap: wrap;">
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 0.85rem; color: var(--text-secondary);">Dimensões:</span>
            <input type="number" id="img-thumb-custom-w" class="form-input" style="width: 90px; height: 34px; padding: 4px 8px; font-size: 0.85rem;" value="1280" />
            <span style="font-size: 0.85rem; color: var(--text-secondary);">x</span>
            <input type="number" id="img-thumb-custom-h" class="form-input" style="width: 90px; height: 34px; padding: 4px 8px; font-size: 0.85rem;" value="720" />
            <span style="font-size: 0.8rem; color: var(--text-tertiary);">px</span>
          </div>

          <div style="display: flex; gap: 8px; align-items: center;">
            <label class="form-label" style="margin: 0; font-size: 0.85rem;">Ajuste:</label>
            <div class="segmented-tabs" style="height: 34px; padding: 2px;">
              <button class="tab-btn active" id="btn-mode-cover" title="Preencher todo o espaço cortando sobras">Preencher (Cover)</button>
              <button class="tab-btn" id="btn-mode-contain" title="Encaixar imagem completa com bordas">Conter (Contain)</button>
            </div>
          </div>
        </div>

        <div id="img-thumb-bg-options" style="display: none; margin-top: 12px; align-items: center; gap: 12px; flex-wrap: wrap;">
          <label class="form-label" style="margin: 0; font-size: 0.85rem;">Cor do Fundo:</label>
          <input type="color" id="img-thumb-bg-color" value="#ffffff" style="border: 1px solid var(--border-color); border-radius: 4px; height: 32px; width: 48px; padding: 2px; cursor: pointer; background: transparent;" />
          <button class="btn-back" id="btn-bg-black" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">Preto</button>
          <button class="btn-back" id="btn-bg-white" style="height: 30px; font-size: 0.75rem; padding: 0 10px;">Branco</button>
        </div>
      </div>

      <!-- Preview Area -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="font-size: 0.9rem; font-weight: 500;" id="img-thumb-target-info">Prévia: YouTube Thumbnail (1280x720)</span>
          <span style="font-size: 0.8rem; color: var(--text-tertiary);" id="img-thumb-status">Gerando...</span>
        </div>
        <div style="background: repeating-conic-gradient(#f0f0f0 0% 25%, #ffffff 0% 50%) 50% / 16px 16px; border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; display: inline-flex; justify-content: center; align-items: center; max-width: 100%;">
          <img id="img-thumb-preview" style="max-width: 100%; max-height: 360px; object-fit: contain; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 4px;" />
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn-primary" id="btn-img-thumb-download" style="flex: 2; min-width: 200px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar Esta Miniatura
          </button>
          
          <button class="btn-primary" id="btn-img-thumb-all-zip" style="flex: 1.5; min-width: 180px; background: #475569; border-color: #475569;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>
            Baixar Pacote com Todas (.ZIP)
          </button>
        </div>

        <button class="btn-back" id="btn-reset-img-thumb" style="width: 100%; justify-content: center; height: 42px;">
          Trocar Imagem
        </button>
      </div>

    </div>
  `;

  const btnBack = container.querySelector('#btn-back-img-thumb') as HTMLButtonElement;
  const dropzone = container.querySelector('#img-thumb-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#img-thumb-file-input') as HTMLInputElement;

  const setupArea = container.querySelector('#img-thumb-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#img-thumb-workspace-area') as HTMLDivElement;

  const presetGrid = container.querySelector('#img-thumb-preset-grid') as HTMLDivElement;
  const customW = container.querySelector('#img-thumb-custom-w') as HTMLInputElement;
  const customH = container.querySelector('#img-thumb-custom-h') as HTMLInputElement;
  const btnCover = container.querySelector('#btn-mode-cover') as HTMLButtonElement;
  const btnContain = container.querySelector('#btn-mode-contain') as HTMLButtonElement;

  const bgOptions = container.querySelector('#img-thumb-bg-options') as HTMLDivElement;
  const bgColorInput = container.querySelector('#img-thumb-bg-color') as HTMLInputElement;
  const btnBgBlack = container.querySelector('#btn-bg-black') as HTMLButtonElement;
  const btnBgWhite = container.querySelector('#btn-bg-white') as HTMLButtonElement;

  const previewImg = container.querySelector('#img-thumb-preview') as HTMLImageElement;
  const targetInfo = container.querySelector('#img-thumb-target-info') as HTMLSpanElement;
  const statusSpan = container.querySelector('#img-thumb-status') as HTMLSpanElement;

  const btnDownload = container.querySelector('#btn-img-thumb-download') as HTMLButtonElement;
  const btnDownloadAllZip = container.querySelector('#btn-img-thumb-all-zip') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-img-thumb') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  // Render presets
  PRESETS.forEach((preset, index) => {
    const btn = document.createElement('button');
    btn.className = `btn-back preset-card ${index === 0 ? 'active-preset' : ''}`;
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'flex-start';
    btn.style.padding = '10px 12px';
    btn.style.height = 'auto';
    btn.style.border = index === 0 ? '2px solid var(--btn-primary-bg)' : '1px solid var(--border-color)';
    btn.style.borderRadius = '6px';
    btn.style.background = index === 0 ? 'rgba(0, 102, 255, 0.05)' : 'var(--bg-page)';
    btn.style.textAlign = 'left';

    btn.innerHTML = `
      <span style="font-size: 0.7rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">${preset.category}</span>
      <strong style="font-size: 0.85rem; color: var(--text-primary); margin: 2px 0;">${preset.name}</strong>
      <span style="font-size: 0.75rem; color: var(--text-secondary);">${preset.width} x ${preset.height} px</span>
    `;

    btn.addEventListener('click', () => {
      container.querySelectorAll('.preset-card').forEach(c => {
        (c as HTMLElement).style.border = '1px solid var(--border-color)';
        (c as HTMLElement).style.background = 'var(--bg-page)';
      });
      btn.style.border = '2px solid var(--btn-primary-bg)';
      btn.style.background = 'rgba(0, 102, 255, 0.05)';

      activePreset = preset;
      customW.value = preset.width.toString();
      customH.value = preset.height.toString();
      updatePreview();
    });

    presetGrid.appendChild(btn);
  });

  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    activeBlob = null;
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

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }
    selectedFile = file;
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';
    updatePreview();
  }

  btnCover.addEventListener('click', () => {
    currentMode = 'cover';
    btnCover.classList.add('active');
    btnContain.classList.remove('active');
    bgOptions.style.display = 'none';
    updatePreview();
  });

  btnContain.addEventListener('click', () => {
    currentMode = 'contain';
    btnContain.classList.add('active');
    btnCover.classList.remove('active');
    bgOptions.style.display = 'flex';
    updatePreview();
  });

  bgColorInput.addEventListener('input', () => updatePreview());
  btnBgBlack.addEventListener('click', () => { bgColorInput.value = '#000000'; updatePreview(); });
  btnBgWhite.addEventListener('click', () => { bgColorInput.value = '#ffffff'; updatePreview(); });

  customW.addEventListener('change', () => updatePreview());
  customH.addEventListener('change', () => updatePreview());

  async function updatePreview() {
    if (!selectedFile || isGenerating) return;

    const w = parseInt(customW.value, 10) || activePreset.width;
    const h = parseInt(customH.value, 10) || activePreset.height;

    targetInfo.innerText = `Prévia: ${activePreset.name} (${w} x ${h} px) [${currentMode.toUpperCase()}]`;
    statusSpan.innerText = 'Processando...';
    statusSpan.style.color = 'var(--text-tertiary)';

    try {
      isGenerating = true;
      const options: ThumbnailOptions = {
        width: w,
        height: h,
        mode: currentMode,
        bgColor: bgColorInput.value,
        format: selectedFile.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
        quality: 0.95
      };

      activeBlob = await ImageService.createThumbnail(selectedFile, options);
      const url = URL.createObjectURL(activeBlob);
      previewImg.onload = () => URL.revokeObjectURL(url);
      previewImg.src = url;

      statusSpan.innerText = 'Pronto';
      statusSpan.style.color = '#22c55e';
    } catch (err) {
      console.error(err);
      statusSpan.innerText = 'Erro';
      statusSpan.style.color = '#ef4444';
    } finally {
      isGenerating = false;
    }
  }

  btnDownload.addEventListener('click', () => {
    if (!activeBlob || !selectedFile) return;

    const w = parseInt(customW.value, 10) || activePreset.width;
    const h = parseInt(customH.value, 10) || activePreset.height;
    const ext = selectedFile.type === 'image/jpeg' ? 'jpg' : 'png';

    const url = URL.createObjectURL(activeBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_thumb_${activePreset.id}_${w}x${h}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    historyManager.record(
      'image-thumbnails',
      'images',
      'Gerador de Thumbnails',
      selectedFile.name,
      `${activePreset.name} (${w}x${h}) gerada com sucesso`,
      {}
    );
  });

  btnDownloadAllZip.addEventListener('click', async () => {
    if (!selectedFile) return;

    const originalText = btnDownloadAllZip.innerHTML;
    btnDownloadAllZip.disabled = true;
    btnDownloadAllZip.innerHTML = 'Gerando todas as miniaturas...';

    try {
      const zip = new JSZip();
      const baseName = selectedFile.name.replace(/\.[^/.]+$/, "");
      const ext = selectedFile.type === 'image/jpeg' ? 'jpg' : 'png';

      for (const preset of PRESETS) {
        const options: ThumbnailOptions = {
          width: preset.width,
          height: preset.height,
          mode: currentMode,
          bgColor: bgColorInput.value,
          format: selectedFile.type === 'image/jpeg' ? 'image/jpeg' : 'image/png',
          quality: 0.95
        };
        const blob = await ImageService.createThumbnail(selectedFile, options);
        zip.file(`${baseName}_${preset.id}_${preset.width}x${preset.height}.${ext}`, blob);
      }

      btnDownloadAllZip.innerHTML = 'Compactando ZIP...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_pacote_miniaturas.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      historyManager.record(
        'image-thumbnails',
        'images',
        'Pacote de Miniaturas (ZIP)',
        selectedFile.name,
        `${PRESETS.length} formatos gerados e empacotados`,
        {}
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar o pacote ZIP com todas as miniaturas.');
    } finally {
      btnDownloadAllZip.disabled = false;
      btnDownloadAllZip.innerHTML = originalText;
    }
  });
}
