import { store } from '../../app/store';

export function renderPdfEditor(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('pdf-editor');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <!-- Subheader -->
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="pdf-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Editor de PDF</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="pdf-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Dropzone (conforme mockup) -->
      <div class="dropzone-box" id="pdf-dropzone">
        <svg class="dropzone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <div>
          <div class="dropzone-text">Selecione um arquivo PDF</div>
          <div class="dropzone-hint">ou arraste e solte aqui</div>
        </div>
        <input type="file" id="pdf-file-input" accept="application/pdf" style="display: none;" />
        <button class="btn-primary" id="btn-select-pdf" style="width: auto; padding: 0 24px; margin-top: 6px;">
          Selecionar arquivo
        </button>
      </div>

      <!-- Feedback de arquivo carregado -->
      <div id="pdf-file-status" style="display: none; margin-top: 14px; padding: 12px; background: var(--bg-muted); border-radius: var(--radius-sm); font-size: 0.85rem; display: flex; align-items: center; justify-content: space-between;">
        <span id="pdf-filename" style="font-weight: 500;"></span>
        <button id="pdf-remove-file" style="color: var(--text-secondary); font-size: 0.75rem; text-decoration: underline;">Remover</button>
      </div>

      <!-- Ações Rápidas (conforme mockup) -->
      <div class="quick-actions-list" style="margin-top: 24px;">
        <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 4px;">Ações rápidas</h3>
        
        <div class="quick-action-item" data-action="edit">
          <div class="quick-action-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <div>
              <div class="quick-action-title">Editar PDF</div>
              <div class="quick-action-sub">Altere textos, imagens e páginas.</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div class="quick-action-item" data-action="convert">
          <div class="quick-action-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/><polyline points="16 16 12 12 8 16"/>
            </svg>
            <div>
              <div class="quick-action-title">Converter PDF</div>
              <div class="quick-action-sub">Para Word, Excel, JPG e mais.</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div class="quick-action-item" data-action="merge-split">
          <div class="quick-action-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            </svg>
            <div>
              <div class="quick-action-title">Unir e dividir</div>
              <div class="quick-action-sub">Combine ou separe seus arquivos.</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div class="quick-action-item" data-action="sign">
          <div class="quick-action-left">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/>
            </svg>
            <div>
              <div class="quick-action-title">Assinar PDF</div>
              <div class="quick-action-sub">Adicione sua assinatura digital.</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#pdf-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#pdf-btn-fav') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdf-dropzone') as HTMLElement;
  const fileInput = container.querySelector('#pdf-file-input') as HTMLInputElement;
  const btnSelect = container.querySelector('#btn-select-pdf') as HTMLButtonElement;
  const fileStatus = container.querySelector('#pdf-file-status') as HTMLElement;
  const fileNameSpan = container.querySelector('#pdf-filename') as HTMLElement;
  const btnRemove = container.querySelector('#pdf-remove-file') as HTMLButtonElement;

  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  btnFav.addEventListener('click', () => {
    store.toggleFavorite('pdf-editor');
    const updated = store.getState().favorites.includes('pdf-editor');
    btnFav.classList.toggle('active', updated);
  });

  btnSelect.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target !== btnSelect) fileInput.click();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) {
      const file = fileInput.files[0];
      fileNameSpan.textContent = `📄 ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
      fileStatus.style.display = 'flex';
    }
  });

  btnRemove.addEventListener('click', () => {
    fileInput.value = '';
    fileStatus.style.display = 'none';
  });

  container.querySelectorAll('.quick-action-item').forEach((el) => {
    el.addEventListener('click', () => {
      const action = el.getAttribute('data-action');
      alert(`Ação de PDF: ${action?.toUpperCase()} - Selecione ou arraste um PDF para processar no navegador de forma privada e 100% offline.`);
    });
  });
}
