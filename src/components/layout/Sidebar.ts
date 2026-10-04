import { store } from '../../app/store';

export function renderSidebar(container: HTMLElement): void {
  const currentRoute = store.getState().currentRoute;

  container.innerHTML = `
    <aside class="app-sidebar" id="main-sidebar">
      <!-- Header / Logo (conforme mockup) -->
      <div class="sidebar-header">
        <a href="#/" class="logo-badge">
          <!-- Ícone do Arsenal PDF (logo gerada) -->
          <img src="/logo.jpg" alt="Arsenal PDF Logo" class="logo-icon-img" style="width: 24px; height: 24px; border-radius: 0; object-fit: cover;" />
          <span style="font-weight: 700;">Arsenal PDF</span>
        </a>
      </div>

      <!-- Links de Navegação -->
      <nav class="sidebar-nav">
        <a href="#/" class="nav-item ${currentRoute === '#/' || currentRoute === '' || currentRoute.includes('categoria/pdf') ? 'active' : ''}" data-route="#/">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>Arsenal PDF</span>
        </a>

        <a href="#/utilitarios" class="nav-item ${currentRoute.includes('utilitarios') || (currentRoute.includes('categoria') && !currentRoute.includes('pdf')) ? 'active' : ''}" data-route="#/utilitarios">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Utilitários do Arsenal</span>
        </a>

        <a href="#/favoritos" class="nav-item ${currentRoute === '#/favoritos' ? 'active' : ''}" data-route="#/favoritos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span>Favoritos</span>
        </a>
      </nav>

      <!-- Rodapé do Usuário -->
      <div class="sidebar-footer">
        <div class="user-mini">
          <div class="user-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="user-info">
            <span class="user-name">Minha Conta</span>
            <span class="user-role">Modo Local</span>
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
