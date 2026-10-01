import { store } from '../../app/store';
import { TOOLS_LIST } from '../../app/toolsRegistry';

export function renderHeader(container: HTMLElement): void {
  container.innerHTML = `
    <header class="app-header">
      <div class="header-left">
        <button class="mobile-menu-btn" id="mobile-toggle-menu" title="Menu" style="display: none; padding: 6px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="header-right">
        <!-- Barra de Busca Global Desktop (conforme mockup) -->
        <div class="search-box" id="global-search-container" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="global-search-input" placeholder="Buscar ferramentas..." autocomplete="off" />
          <span class="search-shortcut">⌘K</span>

          <!-- Dropdown de Resultados da Busca -->
          <div id="search-results-dropdown" style="display: none; position: absolute; top: calc(100% + 6px); right: 0; width: 340px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-md); max-height: 380px; overflow-y: auto; z-index: 100;">
          </div>
        </div>

        <!-- Alternador de Tema -->
        <button id="btn-theme-toggle" style="width: 38px; height: 38px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; color: var(--text-secondary); border: 1px solid var(--border-color); background: var(--bg-surface);" title="Alternar Tema Claro/Escuro">
          <svg id="theme-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>
      </div>
    </header>
  `;

  const searchInput = container.querySelector('#global-search-input') as HTMLInputElement;
  const searchResults = container.querySelector('#search-results-dropdown') as HTMLElement;
  const themeBtn = container.querySelector('#btn-theme-toggle') as HTMLButtonElement;

  themeBtn.addEventListener('click', () => {
    store.toggleTheme();
  });

  // Atalho global Ctrl+K / Cmd+K
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchInput?.focus();
    }
  });

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      searchResults.style.display = 'none';
      return;
    }

    const matches = TOOLS_LIST.filter((t) =>
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.categoryName.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div style="padding: 16px; font-size: 0.85rem; color: var(--text-secondary); text-align: center;">
          Nenhuma ferramenta encontrada para "${query}".
        </div>
      `;
    } else {
      searchResults.innerHTML = matches.map((t) => `
        <div class="search-item" data-path="${t.path}" style="padding: 10px 14px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; flex-direction: column; gap: 2px;">
          <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-main);">${t.name}</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary);">${t.description}</div>
        </div>
      `).join('');

      searchResults.querySelectorAll('.search-item').forEach((item) => {
        item.addEventListener('click', () => {
          const path = item.getAttribute('data-path');
          if (path) {
            window.location.hash = path;
            searchResults.style.display = 'none';
            searchInput.value = '';
          }
        });
      });
    }

    searchResults.style.display = 'block';
  }

  searchInput.addEventListener('input', performSearch);
  searchInput.addEventListener('focus', performSearch);

  document.addEventListener('click', (e) => {
    if (!container.querySelector('#global-search-container')?.contains(e.target as Node)) {
      searchResults.style.display = 'none';
    }
  });
}
