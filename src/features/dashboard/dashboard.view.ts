import { TOOLS_LIST } from '../../app/toolsRegistry';
import { renderAdSlot } from '../../components/AdSlot';

export function renderDashboard(container: HTMLElement): void {
  const pdfTools = TOOLS_LIST.filter((t) => t.category === 'pdf');

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

    <!-- Ferramentas PDF -->
    <div class="featured-grid">
      ${pdfTools.map((tool) => `
        <div class="tool-card" data-path="${tool.path}">
          <div class="tool-card-content">
            <div class="tool-icon-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
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

    <!-- Seção de Utilitários Adicionais -->
    <h2 class="section-title" style="margin-top: 32px;">Mais Ferramentas</h2>
    <div class="categories-grid">
      <div class="category-card" data-path="#/utilitarios">
        <div class="category-main">
          <div class="category-icon-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
          </div>
          <div>
            <div class="category-name">Utilitários do Arsenal</div>
            <div class="category-desc">Acesse calculadoras, conversores, geradores e outras utilidades.</div>
          </div>
        </div>
        <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
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
