import { store } from '../../app/store';

export function renderSidebar(container: HTMLElement): void {
  const currentRoute = store.getState().currentRoute;

  container.innerHTML = `
    <aside class="app-sidebar" id="main-sidebar">
      <!-- Header / Logo (conforme mockup) -->
      <div class="sidebar-header">
        <a href="#/" class="logo-badge">
          <svg class="logo-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <!-- Ícone estilizado geométrico do Backpack Tools -->
            <path d="M4 8l4-4h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8z"/>
            <path d="M9 4v4h6V4"/>
            <line x1="8" y1="14" x2="16" y2="14"/>
          </svg>
          <span>Backpack Tools</span>
        </a>
      </div>

      <!-- Links de Navegação -->
      <nav class="sidebar-nav">
        <a href="#/" class="nav-item ${currentRoute === '#/' || currentRoute === '' ? 'active' : ''}" data-route="#/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Início</span>
        </a>

        <a href="#/categoria/calculators" class="nav-item ${currentRoute.includes('calculat') ? 'active' : ''}" data-route="#/categoria/calculators">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <line x1="8" y1="6" x2="16" y2="6"/>
            <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>
          </svg>
          <span>Calculadoras</span>
        </a>

        <a href="#/categoria/converters" class="nav-item ${currentRoute.includes('convert') ? 'active' : ''}" data-route="#/categoria/converters">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 10l5-5 5 5M7 14l5 5 5-5"/>
          </svg>
          <span>Conversores</span>
        </a>

        <a href="#/categoria/pdf" class="nav-item ${currentRoute.includes('pdf') ? 'active' : ''}" data-route="#/categoria/pdf">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>PDF</span>
        </a>

        <a href="#/categoria/documents" class="nav-item ${currentRoute.includes('document') ? 'active' : ''}" data-route="#/categoria/documents">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <span>Documentos</span>
        </a>

        <a href="#/categoria/fitness" class="nav-item ${currentRoute.includes('fitness') ? 'active' : ''}" data-route="#/categoria/fitness">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4v16M18 4v16M2 8h4M2 16h4M18 8h4M18 16h4M6 12h12"/>
          </svg>
          <span>Fitness</span>
        </a>

        <a href="#/categoria/financial" class="nav-item ${currentRoute.includes('finan') || currentRoute.includes('juros') ? 'active' : ''}" data-route="#/categoria/financial">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Financeiro</span>
        </a>

        <a href="#/categoria/text" class="nav-item ${currentRoute.includes('text') || currentRoute.includes('texto') ? 'active' : ''}" data-route="#/categoria/text">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
          </svg>
          <span>Texto</span>
        </a>

        <a href="#/categoria/devtools" class="nav-item ${currentRoute.includes('dev') ? 'active' : ''}" data-route="#/categoria/devtools">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          <span>Dev Tools</span>
        </a>

        <a href="#/favoritos" class="nav-item ${currentRoute === '#/favoritos' ? 'active' : ''}" data-route="#/favoritos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Favoritos</span>
        </a>
      </nav>

      <!-- Rodapé do Usuário (conforme mockup) -->
      <div class="sidebar-footer">
        <div class="user-mini">
          <div class="user-avatar">MS</div>
          <div class="user-info">
            <span class="user-name">Mariana Silva</span>
            <span class="user-role">Pro • Modo Local</span>
          </div>
        </div>
      </div>
    </aside>
  `;

  // Listener para atualização da rota ativa
  container.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const route = item.getAttribute('data-route');
      if (route) {
        window.location.hash = route;
      }
    });
  });
}
