import { TOOLS_LIST, CATEGORIES_LIST } from '../../app/toolsRegistry';
import { renderAdSlot } from '../../components/AdSlot';

interface PdfFeatureDef {
  id: string;
  name: string;
  desc: string;
  path: string;
  tag: string;
  icon: string;
}

interface PdfThemeSection {
  id: string;
  title: string;
  subtitle: string;
  colorClass: 'theme-blue' | 'theme-orange' | 'theme-green' | 'theme-purple';
  icon: string;
  badge: string;
  features: PdfFeatureDef[];
}

const PDF_THEMES: PdfThemeSection[] = [
  {
    id: 'tema-organizar',
    title: 'Organizar, Editar & Otimizar',
    subtitle: 'Manipule páginas, reordene visualmente, reduza o peso dos arquivos e faça edições no documento.',
    colorClass: 'theme-blue',
    badge: '6 Ferramentas',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 10h6"/>
      <path d="M9 14h6"/>
      <path d="M9 18h2"/>
      <circle cx="16" cy="18" r="1"/>
    </svg>`,
    features: [
      {
        id: 'pdf-merge',
        name: 'Juntar PDFs',
        desc: 'Una vários arquivos PDF em um único documento, reordenando páginas visualmente.',
        path: '#/pdf/juntar',
        tag: 'Popular',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="8" y="2" width="13" height="16" rx="2"/>
          <path d="M4 6v14a2 2 0 0 0 2 2h11"/>
          <path d="M11 10h6"/>
          <path d="M14 7v6"/>
        </svg>`
      },
      {
        id: 'pdf-extract',
        name: 'Extrair Páginas',
        desc: 'Selecione e extraia páginas específicas de um documento PDF para novos arquivos.',
        path: '#/pdf/extrair',
        tag: 'Páginas',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M12 18v-6"/>
          <path d="m9 15 3-3 3 3"/>
        </svg>`
      },
      {
        id: 'pdf-organize',
        name: 'Organizar & Girar',
        desc: 'Reordene páginas via drag & drop, gire orientações incorretas ou exclua páginas.',
        path: '#/pdf/organizar',
        tag: 'Visual',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
          <rect x="8" y="9" width="11" height="12" rx="2"/>
        </svg>`
      },
      {
        id: 'pdf-compress',
        name: 'Comprimir PDF',
        desc: 'Reduza drasticamente o tamanho do seu arquivo PDF mantendo clareza e legibilidade.',
        path: '#/pdf/comprimir',
        tag: 'Otimizar',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="m14 12-2 2-2-2"/>
          <path d="m14 18-2-2-2 2"/>
        </svg>`
      },
      {
        id: 'pdf-edit',
        name: 'Editor Visual (Apagar & Escrever)',
        desc: 'Use tarjas para apagar dados confidenciais e escreva novos textos sobre o documento.',
        path: '#/pdf/editor',
        tag: 'Edição',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          <path d="m15 5 3 3"/>
        </svg>`
      },
      {
        id: 'pdf-metadata',
        name: 'Metadados & Marca-d\'água',
        desc: 'Edite autor, título, adicione paginação contínua ou carimbos de marca-d\'água.',
        path: '#/pdf/metadados',
        tag: 'Customizar',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
          <circle cx="7" cy="7" r="1.5"/>
          <circle cx="13" cy="13" r="2"/>
        </svg>`
      }
    ]
  },
  {
    id: 'tema-converter-de',
    title: 'Converter de PDF (Exportar)',
    subtitle: 'Exporte seus documentos PDF para formatos editáveis do Microsoft Office, imagens e texto.',
    colorClass: 'theme-orange',
    badge: '5 Ferramentas',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M16 13l-4 4-4-4"/>
      <line x1="12" y1="9" x2="12" y2="17"/>
    </svg>`,
    features: [
      {
        id: 'pdf-to-word',
        name: 'PDF para Word (.DOCX)',
        desc: 'Converta PDFs em documentos Word editáveis preservando títulos, parágrafos e alinhamentos.',
        path: '#/pdf/para-word',
        tag: 'Word',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M9 13l1.5 5 1.5-5 1.5 5 1.5-5"/>
        </svg>`
      },
      {
        id: 'pdf-to-excel',
        name: 'PDF para Excel (.XLSX & .CSV)',
        desc: 'Extraia tabelas financeiras e cadastrais em planilhas nativas .XLSX com múltiplas abas.',
        path: '#/pdf/para-excel',
        tag: 'Multi-Aba',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M3 15h18"/>
          <path d="M9 3v18"/>
          <path d="M15 3v18"/>
        </svg>`
      },
      {
        id: 'pdf-to-pptx',
        name: 'PDF para PowerPoint (.PPTX)',
        desc: 'Transforme páginas em apresentações de slides 16:9 Widescreen no Microsoft PowerPoint.',
        path: '#/pdf/para-pptx',
        tag: 'Slides',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="14" rx="2"/>
          <path d="M8 21h8"/>
          <path d="M12 17v4"/>
          <path d="M7 8h3a2 2 0 0 1 0 4H7z"/>
        </svg>`
      },
      {
        id: 'pdf-to-image',
        name: 'PDF para Imagem (JPG & PNG)',
        desc: 'Extraia as páginas do documento em arquivos JPG ou PNG de alta resolução.',
        path: '#/pdf/para-imagem',
        tag: 'HD',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="m21 15-5-5L5 21"/>
        </svg>`
      },
      {
        id: 'pdf-to-text',
        name: 'PDF para Markdown & Texto',
        desc: 'Extraia textos limpos ou formatados em Markdown para análise, anotações ou prompts para IA.',
        path: '#/pdf/para-texto',
        tag: 'IA & LLM',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="8" y1="13" x2="16" y2="13"/>
          <line x1="8" y1="17" x2="13" y2="17"/>
        </svg>`
      }
    ]
  },
  {
    id: 'tema-converter-para',
    title: 'Converter para PDF (Criar)',
    subtitle: 'Gere documentos PDF padronizados a partir de arquivos Word, planilhas Excel e fotos.',
    colorClass: 'theme-green',
    badge: '3 Ferramentas',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M12 11v6"/>
      <path d="m9 14 3-3 3 3"/>
    </svg>`,
    features: [
      {
        id: 'word-to-pdf',
        name: 'Word para PDF (.DOCX)',
        desc: 'Converta arquivos do Microsoft Word (.DOCX) diretamente para páginas PDF formatadas em A4.',
        path: '#/pdf/word-para-pdf',
        tag: 'Docx -> PDF',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
          <polyline points="14 4 14 10 20 10"/>
          <path d="M8 17v-4l2 2.5 2-2.5v4"/>
        </svg>`
      },
      {
        id: 'excel-to-pdf',
        name: 'Excel para PDF (.XLSX)',
        desc: 'Transforme planilhas Excel (.XLSX, .XLS, .CSV) em relatórios executivos em tabelas PDF.',
        path: '#/pdf/excel-para-pdf',
        tag: 'Planilha -> PDF',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M9 3v18"/>
          <path d="m14 14 4 4"/>
          <path d="m18 14-4 4"/>
        </svg>`
      },
      {
        id: 'image-to-pdf',
        name: 'Imagem para PDF',
        desc: 'Junte fotos, recibos e imagens (JPG, PNG, WebP) em um documento PDF único e compacto.',
        path: '#/pdf/imagem-para-pdf',
        tag: 'Fotos -> PDF',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="7" width="14" height="14" rx="2"/>
          <circle cx="8" cy="12" r="1.5"/>
          <path d="m17 17-3-3-6 7"/>
          <path d="M7 3h12a2 2 0 0 1 2 2v12"/>
        </svg>`
      }
    ]
  },
  {
    id: 'tema-seguranca',
    title: 'Segurança & Análise Comparativa',
    subtitle: 'Proteja documentos sensíveis com criptografia avançada e audite diferenças visuais entre versões.',
    colorClass: 'theme-purple',
    badge: '3 Ferramentas',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>`,
    features: [
      {
        id: 'pdf-lock',
        name: 'Bloquear PDF (Proteger com Senha)',
        desc: 'Proteja documentos confidenciais com criptografia AES-256 e restrinja impressão e cópia.',
        path: '#/pdf/bloquear',
        tag: 'AES-256',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          <circle cx="12" cy="16" r="1.5"/>
        </svg>`
      },
      {
        id: 'pdf-unlock',
        name: 'Desbloquear PDF',
        desc: 'Remova senhas e restrições de impressão, seleção e edição de arquivos PDF protegidos.',
        path: '#/pdf/desbloquear',
        tag: 'Desbloqueio',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
          <circle cx="12" cy="16" r="1.5"/>
        </svg>`
      },
      {
        id: 'pdf-compare',
        name: 'Comparar PDFs',
        desc: 'Compare dois PDFs lado a lado com sobreposição visual de diferenças e análise de texto.',
        path: '#/pdf/comparar',
        tag: 'Auditoria Diff',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 3H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5"/>
          <path d="M15 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>
          <line x1="12" y1="3" x2="12" y2="21"/>
          <path d="m7 10-2 2 2 2"/>
          <path d="m17 10 2 2-2 2"/>
        </svg>`
      }
    ]
  }
];

export function renderCategoryView(container: HTMLElement, categoryId: string): void {
  if (categoryId === 'pdf') {
    renderPdfCategoryHub(container, false);
    return;
  }

  // Fallback para outras categorias genéricas
  renderGenericCategory(container, categoryId);
}

export function renderPdfCategoryHub(container: HTMLElement, isHome: boolean = false): void {
  const totalFeatures = PDF_THEMES.reduce((acc, t) => acc + t.features.length, 0);

  container.innerHTML = `
    <div class="pdf-hub-container">
      <!-- Hero Principal da Categoria PDF -->
      <section class="pdf-hub-hero">
        <div class="pdf-hub-hero-top">
          <div style="display: flex; align-items: center; gap: 12px;">
            ${!isHome ? `
              <button class="btn-back" id="cat-btn-back" title="Voltar ao início">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
            ` : ''}
            <div class="pdf-hub-badge-group">
              <span class="pdf-hub-badge highlight">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                </svg>
                Arsenal PDF
              </span>
              <span class="pdf-hub-badge">${totalFeatures} Ferramentas</span>
              <span class="pdf-hub-badge">100% Client-Side & Privado</span>
            </div>
          </div>
        </div>

        <h1 class="pdf-hub-title">
          Seu PDF rápido, leve, privado e ilimitado
        </h1>
        <p class="pdf-hub-subtitle">
          Edite, converta, combine, proteja e organize seus documentos com processamento 100% no seu navegador. Rápido, sem limites e seguro.
        </p>

        <!-- Barra de Busca Rápida -->
        <div class="pdf-hub-search-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" id="pdf-search-input" placeholder="Buscar entre as ${totalFeatures} ferramentas de PDF..." autocomplete="off" />
        </div>
      </section>

      <!-- Chips de Atalho para os Temas -->
      <nav class="pdf-theme-nav" aria-label="Navegação rápida por tema">
        <button class="pdf-nav-chip blue" data-target="#tema-organizar">
          <span class="chip-dot"></span>
          <span>Organizar & Editar</span>
          <span class="chip-count">6</span>
        </button>
        <button class="pdf-nav-chip orange" data-target="#tema-converter-de">
          <span class="chip-dot"></span>
          <span>PDF para Outros</span>
          <span class="chip-count">5</span>
        </button>
        <button class="pdf-nav-chip green" data-target="#tema-converter-para">
          <span class="chip-dot"></span>
          <span>Criar PDF</span>
          <span class="chip-count">3</span>
        </button>
        <button class="pdf-nav-chip purple" data-target="#tema-seguranca">
          <span class="chip-dot"></span>
          <span>Segurança & Diff</span>
          <span class="chip-count">3</span>
        </button>
      </nav>

      <!-- Container de Seções Temáticas -->
      <div id="pdf-themes-wrapper" style="display: flex; flex-direction: column; gap: 36px;">
        ${PDF_THEMES.map((theme) => `
          <section class="pdf-theme-section" id="${theme.id}" data-theme-id="${theme.id}">
            <!-- Faixa Colorida Dividindo o Tema -->
            <header class="pdf-theme-banner ${theme.colorClass}">
              <div class="pdf-banner-left">
                <div class="pdf-banner-icon">
                  ${theme.icon}
                </div>
                <div class="pdf-banner-info">
                  <h2 class="pdf-banner-title">${theme.title}</h2>
                  <p class="pdf-banner-desc">${theme.subtitle}</p>
                </div>
              </div>
              <span class="pdf-banner-badge">${theme.badge}</span>
            </header>

            <!-- Grid de Cards do Tema -->
            <div class="pdf-tools-grid">
              ${theme.features.map((feat) => `
                <div class="pdf-feature-card ${theme.colorClass}" data-path="${feat.path}" data-search="${feat.name.toLowerCase()} ${feat.desc.toLowerCase()} ${feat.tag.toLowerCase()}">
                  <div class="pdf-feature-card-main">
                    <div class="pdf-feature-icon">
                      ${feat.icon}
                    </div>
                    <div class="pdf-feature-content">
                      <div class="pdf-feature-title-row">
                        <span class="pdf-feature-title">${feat.name}</span>
                        <span class="pdf-feature-tag">${feat.tag}</span>
                      </div>
                      <p class="pdf-feature-desc">${feat.desc}</p>
                    </div>
                  </div>
                  <svg class="pdf-feature-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              `).join('')}
            </div>
          </section>
        `).join('')}
      </div>

      <!-- Estado de busca vazia -->
      <div id="pdf-search-empty-state" class="pdf-search-empty" style="display: none;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 12px; color: var(--text-tertiary);">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">Nenhuma ferramenta encontrada</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0;">Tente outro termo de busca ou limpe o campo para ver todas as ferramentas.</p>
      </div>

      ${isHome ? `
        <!-- Seção de Utilitários Adicionais na Home -->
        <div style="margin-top: 12px;">
          <h2 class="section-title" style="margin-bottom: 14px;">Mais Ferramentas do Arsenal</h2>
          <div class="categories-grid" style="grid-template-columns: 1fr;">
            <div class="category-card" data-path="#/utilitarios" style="padding: 20px;">
              <div class="category-main" style="flex-direction: row; align-items: center; gap: 16px;">
                <div class="category-icon-box" style="width: 44px; height: 44px;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                </div>
                <div>
                  <div class="category-name" style="font-size: 1.05rem; font-weight: 700;">Utilitários Gerais & DevTools</div>
                  <div class="category-desc">Acesse calculadoras financeiras, geradores de senha, conversores de unidades e ferramentas para desenvolvedores.</div>
                </div>
              </div>
              <svg class="chevron-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Espaço reservado para AdSense -->
        <div id="dashboard-ad-container"></div>
      ` : ''}
    </div>
  `;

  // Voltar ao início (se não estiver na Home)
  const btnBack = container.querySelector('#cat-btn-back') as HTMLButtonElement | null;
  btnBack?.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  if (isHome) {
    const adContainer = container.querySelector('#dashboard-ad-container');
    if (adContainer) {
      adContainer.appendChild(renderAdSlot('ad-dashboard-bottom'));
    }

    const utilCard = container.querySelector('.category-card[data-path="#/utilitarios"]');
    utilCard?.addEventListener('click', () => {
      window.location.hash = '#/utilitarios';
    });
  }

  // Navegação direta nos cards
  container.querySelectorAll('.pdf-feature-card').forEach((card) => {
    card.addEventListener('click', () => {
      const path = card.getAttribute('data-path');
      if (path) {
        window.location.hash = path;
      }
    });
  });

  // Rolagem suave nos chips de atalho
  container.querySelectorAll('.pdf-nav-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const targetId = chip.getAttribute('data-target');
      if (targetId) {
        const el = container.querySelector(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // Busca instantânea em tempo real
  const searchInput = container.querySelector('#pdf-search-input') as HTMLInputElement | null;
  const emptyState = container.querySelector('#pdf-search-empty-state') as HTMLElement | null;
  const sections = container.querySelectorAll('.pdf-theme-section') as NodeListOf<HTMLElement>;

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      let visibleTotal = 0;

      sections.forEach((section) => {
        const cards = section.querySelectorAll('.pdf-feature-card') as NodeListOf<HTMLElement>;
        let sectionVisibleCards = 0;

        cards.forEach((card) => {
          const searchData = card.getAttribute('data-search') || '';
          if (!query || searchData.includes(query)) {
            card.style.display = 'flex';
            sectionVisibleCards++;
            visibleTotal++;
          } else {
            card.style.display = 'none';
          }
        });

        // Oculta a seção inteira e a faixa colorida se nenhum card dela der match
        if (sectionVisibleCards === 0) {
          section.style.display = 'none';
        } else {
          section.style.display = 'flex';
        }
      });

      if (emptyState) {
        emptyState.style.display = visibleTotal === 0 ? 'block' : 'none';
      }
    });
  }
}

function renderGenericCategory(container: HTMLElement, categoryId: string): void {
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
  btnBack?.addEventListener('click', () => { window.location.hash = '#/'; });

  container.querySelectorAll('.tool-card').forEach((el) => {
    el.addEventListener('click', () => {
      const path = el.getAttribute('data-path');
      if (path) window.location.hash = path;
    });
  });
}
