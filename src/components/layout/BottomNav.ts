import { store } from '../../app/store';

export function renderBottomNav(container: HTMLElement): void {
  const currentRoute = store.getState().currentRoute;

  container.innerHTML = `
    <nav class="app-bottom-nav">
      <a href="#/" class="bottom-nav-item ${currentRoute === '#/' || currentRoute === '' || currentRoute.includes('pdf') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span>Arsenal PDF</span>
      </a>

      <a href="#/utilitarios" class="bottom-nav-item ${currentRoute.includes('utilitarios') || (currentRoute.includes('categoria') && !currentRoute.includes('pdf')) ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Utilitários</span>
      </a>

      <a href="#/favoritos" class="bottom-nav-item ${currentRoute === '#/favoritos' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <span>Favoritos</span>
      </a>
    </nav>
  `;
}
