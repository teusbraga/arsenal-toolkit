import './styles/reset.css';
import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/responsive.css';

import { renderSidebar } from './components/layout/Sidebar';
import { renderHeader } from './components/layout/Header';
import { renderBottomNav } from './components/layout/BottomNav';
import { initRouter } from './app/router';
import { store } from './app/store';

// Vercel Web Analytics
import { inject } from '@vercel/analytics';
inject();

// PWA Service Worker Registration
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nova versão do Backpack Tools disponível.');
  },
  onOfflineReady() {
    console.log('Backpack Tools está pronto para uso 100% offline.');
  },
});

function bootstrapApp() {
  const root = document.getElementById('app');
  if (!root) return;

  // Aplica o tema salvo (dark ou light)
  const currentTheme = store.getState().theme;
  document.documentElement.setAttribute('data-theme', currentTheme);

  root.innerHTML = `
    <div class="app-layout">
      <!-- Sidebar Desktop -->
      <div id="sidebar-slot"></div>

      <!-- Main Shell Area -->
      <main class="app-main">
        <!-- Header Sticky -->
        <div id="header-slot"></div>

        <!-- Dynamic View Container -->
        <div class="view-container" id="router-view-container"></div>
      </main>

      <!-- Bottom Nav Mobile -->
      <div id="bottom-nav-slot"></div>
    </div>
  `;

  const sidebarSlot = document.getElementById('sidebar-slot')!;
  const headerSlot = document.getElementById('header-slot')!;
  const bottomNavSlot = document.getElementById('bottom-nav-slot')!;
  const viewContainer = document.getElementById('router-view-container')!;

  renderSidebar(sidebarSlot);
  renderHeader(headerSlot);
  renderBottomNav(bottomNavSlot);

  // Inicializa o roteador
  initRouter(viewContainer);

  // Sincroniza componentes quando o estado de rota ou favoritos mudar
  store.subscribe(() => {
    renderSidebar(sidebarSlot);
    renderBottomNav(bottomNavSlot);
  });
}

document.addEventListener('DOMContentLoaded', bootstrapApp);
