import { CATEGORIES_LIST, TOOLS_LIST } from '../../app/toolsRegistry';
import { renderAdSlot } from '../../components/AdSlot';

export function renderDashboard(container: HTMLElement): void {
  const featuredTools = TOOLS_LIST.filter((t) => t.featured);

  container.innerHTML = `
    <div class="dashboard-hero">
      <h1 class="hero-title">Olá!</h1>
      <p class="hero-subtitle">Ferramentas essenciais para o seu dia a dia profissional.</p>
    </div>

    <!-- Mobile Search Box (conforme mockup mobile) -->
    <div class="mobile-search-box search-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" id="mobile-search-input" placeholder="Buscar ferramentas..." />
    </div>

    <!-- Grid de Categorias -->
    <div class="categories-grid">
      ${CATEGORIES_LIST.map((cat) => `
        <div class="category-card" data-path="${cat.path}">
          <div class="category-main">
            <div class="category-icon-box">
              ${cat.icon}
            </div>
            <div>
              <div class="category-name">${cat.name}</div>
              <div class="category-desc">${cat.desc}</div>
            </div>
          </div>
          <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      `).join('')}
    </div>

    <!-- Seção de Ferramentas em Destaque -->
    <h2 class="section-title">Ferramentas em destaque</h2>
    <div class="featured-grid">
      ${featuredTools.map((tool) => `
        <div class="tool-card" data-path="${tool.path}">
          <div class="tool-card-content">
            <div class="tool-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="16" y1="14" x2="16" y2="18"/>
                <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01"/>
              </svg>
            </div>
            <div class="tool-card-info">
              <span class="tool-card-name">${tool.name}</span>
              <span class="tool-card-desc">${tool.description}</span>
            </div>
          </div>
          <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      `).join('')}
    </div>

    <!-- Espaço reservado para AdSense -->
    <div id="dashboard-ad-container"></div>
  `;

  // Adiciona o container de anúncio sem poluição
  const adContainer = container.querySelector('#dashboard-ad-container');
  if (adContainer) {
    adContainer.appendChild(renderAdSlot('ad-dashboard-bottom'));
  }

  // Interatividade dos cards
  container.querySelectorAll('.category-card, .tool-card').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.getAttribute('data-path');
      if (path) {
        window.location.hash = path;
      }
    });
  });

  // Busca rápida no mobile
  const mobileInput = container.querySelector('#mobile-search-input') as HTMLInputElement | null;
  if (mobileInput) {
    mobileInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && mobileInput.value.trim()) {
        const query = mobileInput.value.toLowerCase().trim();
        const found = TOOLS_LIST.find((t) => t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
        if (found) {
          window.location.hash = found.path;
        }
      }
    });
  }
}
