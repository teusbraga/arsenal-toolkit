import { store } from '../../app/store';

export function renderBottomNav(container: HTMLElement): void {
  const currentRoute = store.getState().currentRoute;

  container.innerHTML = `
    <nav class="app-bottom-nav">
      <a href="#/" class="bottom-nav-item ${currentRoute === '#/' || currentRoute === '' ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span>Início</span>
      </a>

      <a href="#/categoria/calculators" class="bottom-nav-item ${currentRoute.includes('categoria') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
        <span>Ferramentas</span>
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
