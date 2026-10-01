import { TOOLS_LIST, CATEGORIES_LIST } from '../../app/toolsRegistry';

export function renderCategoryView(container: HTMLElement, categoryId: string): void {
  const cat = CATEGORIES_LIST.find((c) => c.id === categoryId) || {
    id: categoryId,
    name: 'Ferramentas',
    desc: 'Lista de ferramentas disponíveis nesta categoria.',
  };

  const tools = TOOLS_LIST.filter((t) => t.category === categoryId);

  container.innerHTML = `
    <div class="dashboard-hero">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <button class="btn-back" id="cat-btn-back" title="Voltar ao início">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <h1 class="hero-title" style="margin-bottom: 0;">${cat.name}</h1>
      </div>
      <p class="hero-subtitle">${cat.desc}</p>
    </div>

    <div class="featured-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      ${tools.map((tool) => `
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
  `;

  const btnBack = container.querySelector('#cat-btn-back') as HTMLButtonElement;
  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });

  container.querySelectorAll('.tool-card').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.getAttribute('data-path');
      if (path) window.location.hash = path;
    });
  });
}
