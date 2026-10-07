import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

/**
 * Sanitiza o HTML colado da web:
 * - Remove tags destrutivas (script, iframe, form, button, nav, etc.)
 * - Remove atributos de risco e classes com seletores que quebram layout
 * - Mantém tabelas, imagens, negritos, cabeçalhos, listas, cores e formatações semânticas
 * - Ajusta imagens para responsividade e quebra fluida
 */
function sanitizeWebHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Remover lixo destrutivo
  doc.querySelectorAll('script, style, iframe, object, embed, form, button, input, textarea, select, nav, footer, noscript').forEach((el) => el.remove());

  // 2. Limpar atributos e classes conflitantes preservando dados semânticos
  doc.querySelectorAll('*').forEach((el) => {
    const element = el as HTMLElement;

    // Remover handlers de evento inline e classes externas que trazem CSS quebrado
    Array.from(element.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name === 'class' || name === 'id' || name === 'contenteditable') {
        element.removeAttribute(attr.name);
      }
    });

    // Limpar estilos inline que quebram o fluxo de página mantendo os visuais (font-weight, color, etc.)
    if (element.style) {
      element.style.position = '';
      element.style.top = '';
      element.style.bottom = '';
      element.style.left = '';
      element.style.right = '';
      element.style.zIndex = '';
      element.style.float = '';
      element.style.clear = '';
      element.style.transform = '';
      element.style.animation = '';
      element.style.transition = '';

      if (element.style.display === 'none') {
        element.style.display = '';
      }
    }

    // Tratamento de Imagens
    if (element.tagName === 'IMG') {
      const img = element as HTMLImageElement;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '12px auto';
      img.setAttribute('loading', 'lazy');
    }

    // Tratamento de Tabelas
    if (element.tagName === 'TABLE') {
      element.style.width = '100%';
      element.style.borderCollapse = 'collapse';
      element.style.margin = '16px 0';
    }
  });

  return doc.body.innerHTML;
}

export function renderTextToPdf(container: HTMLElement): void {
  const state = store.getState();
  const isFav = state.favorites.includes('text-to-pdf');

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-texttopdf" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h2 class="tool-header-title">Compilador de Texto para PDF</h2>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Cole artigos, tabelas ou notas da web e gere seu PDF instantâneo</span>
        </div>
      </div>
      <button class="btn-favorite ${isFav ? 'active' : ''}" id="btn-fav-texttopdf" title="${isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div class="compiler-container">
      <!-- Toolbar de Ajuste Rápido -->
      <div class="compiler-toolbar">
        <div class="compiler-toolbar-group">
          <!-- Desfazer / Refazer -->
          <button class="compiler-btn" id="btn-undo" title="Desfazer (Ctrl+Z)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
          </button>
          <button class="compiler-btn" id="btn-redo" title="Refazer (Ctrl+Y)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
          </button>

          <div class="compiler-toolbar-divider"></div>

          <!-- Estilos Básicos -->
          <button class="compiler-btn" id="btn-bold" title="Negrito (Ctrl+B)">
            <strong>B</strong>
          </button>
          <button class="compiler-btn" id="btn-italic" title="Itálico (Ctrl+I)">
            <em>I</em>
          </button>
          <button class="compiler-btn" id="btn-underline" title="Sublinhado (Ctrl+U)">
            <u>U</u>
          </button>

          <div class="compiler-toolbar-divider"></div>

          <!-- Títulos / Parágrafo -->
          <button class="compiler-btn" id="btn-h1" title="Título Principal">H1</button>
          <button class="compiler-btn" id="btn-h2" title="Subtítulo">H2</button>
          <button class="compiler-btn" id="btn-para" title="Parágrafo Normal">¶</button>

          <div class="compiler-toolbar-divider"></div>

          <!-- Listas -->
          <button class="compiler-btn" id="btn-ul" title="Lista com Marcadores">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          </button>
          <button class="compiler-btn" id="btn-ol" title="Lista Numerada">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
          </button>

          <div class="compiler-toolbar-divider"></div>

          <!-- Limpar Formatação da Seleção -->
          <button class="compiler-btn" id="btn-clear-format" title="Limpar Formatação do Texto Selecionado">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/></svg>
            <span style="font-size: 0.78rem;">Limpar</span>
          </button>

          <!-- Limpar Tudo -->
          <button class="compiler-btn" id="btn-clear-all" title="Limpar Todo o Documento" style="color: #ef4444;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>

        <!-- Botão Principal de Exportação -->
        <div class="compiler-toolbar-group">
          <button class="compiler-btn compiler-btn-export" id="btn-export-pdf" title="Exportar Documento Completo em PDF">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Gerar PDF</span>
          </button>
        </div>
      </div>

      <!-- Canvas Infinito (Área do Papel) -->
      <div class="compiler-sheet-wrapper">
        <div 
          id="compiler-editor" 
          class="compiler-editor-area" 
          contenteditable="true" 
          spellcheck="true"
          data-placeholder="Pressione Ctrl+V aqui para colar qualquer conteúdo copiado da web (textos, tabelas, artigos, imagens)..."
          data-empty="true"
        ></div>
      </div>

      <!-- Status Bar -->
      <div class="compiler-status-bar">
        <span id="compiler-stats">0 palavras · 0 caracteres</span>
        <span>✨ Dica: Imagens, listas e tabelas coladas são preservadas no PDF</span>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-texttopdf') as HTMLButtonElement;
  const btnFav = container.querySelector('#btn-fav-texttopdf') as HTMLButtonElement;
  const editor = container.querySelector('#compiler-editor') as HTMLDivElement;
  const statsEl = container.querySelector('#compiler-stats') as HTMLElement;
  const btnExport = container.querySelector('#btn-export-pdf') as HTMLButtonElement;

  // Botões de toolbar
  const btnUndo = container.querySelector('#btn-undo') as HTMLButtonElement;
  const btnRedo = container.querySelector('#btn-redo') as HTMLButtonElement;
  const btnBold = container.querySelector('#btn-bold') as HTMLButtonElement;
  const btnItalic = container.querySelector('#btn-italic') as HTMLButtonElement;
  const btnUnderline = container.querySelector('#btn-underline') as HTMLButtonElement;
  const btnH1 = container.querySelector('#btn-h1') as HTMLButtonElement;
  const btnH2 = container.querySelector('#btn-h2') as HTMLButtonElement;
  const btnPara = container.querySelector('#btn-para') as HTMLButtonElement;
  const btnUl = container.querySelector('#btn-ul') as HTMLButtonElement;
  const btnOl = container.querySelector('#btn-ol') as HTMLButtonElement;
  const btnClearFormat = container.querySelector('#btn-clear-format') as HTMLButtonElement;
  const btnClearAll = container.querySelector('#btn-clear-all') as HTMLButtonElement;

  // Navegação
  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  // Favoritar
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('text-to-pdf');
    const updated = store.getState().favorites.includes('text-to-pdf');
    btnFav.classList.toggle('active', updated);
    btnFav.title = updated ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos';
    const svg = btnFav.querySelector('svg');
    if (svg) svg.setAttribute('fill', updated ? 'currentColor' : 'none');
  });

  // Atualiza placeholder e contagem de palavras
  function updateStats() {
    const text = editor.innerText.trim();
    const isEmpty = text === '' && editor.querySelectorAll('img, table').length === 0;
    editor.setAttribute('data-empty', isEmpty ? 'true' : 'false');

    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;
    statsEl.innerText = `${words} palavras · ${chars} caracteres`;
  }

  // Smart Paste Engine (Coração do recurso)
  editor.addEventListener('paste', (e: ClipboardEvent) => {
    e.preventDefault();
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;

    const html = clipboardData.getData('text/html');
    const text = clipboardData.getData('text/plain');

    if (html) {
      const cleanHtml = sanitizeWebHtml(html);
      document.execCommand('insertHTML', false, cleanHtml);
    } else if (text) {
      document.execCommand('insertText', false, text);
    }

    updateStats();
  });

  editor.addEventListener('input', updateStats);
  editor.addEventListener('keyup', updateStats);

  // Ações de formatação rápida da toolbar
  btnUndo.addEventListener('click', () => { document.execCommand('undo'); editor.focus(); });
  btnRedo.addEventListener('click', () => { document.execCommand('redo'); editor.focus(); });
  btnBold.addEventListener('click', () => { document.execCommand('bold'); editor.focus(); });
  btnItalic.addEventListener('click', () => { document.execCommand('italic'); editor.focus(); });
  btnUnderline.addEventListener('click', () => { document.execCommand('underline'); editor.focus(); });

  btnH1.addEventListener('click', () => { document.execCommand('formatBlock', false, '<h1>'); editor.focus(); });
  btnH2.addEventListener('click', () => { document.execCommand('formatBlock', false, '<h2>'); editor.focus(); });
  btnPara.addEventListener('click', () => { document.execCommand('formatBlock', false, '<p>'); editor.focus(); });

  btnUl.addEventListener('click', () => { document.execCommand('insertUnorderedList'); editor.focus(); });
  btnOl.addEventListener('click', () => { document.execCommand('insertOrderedList'); editor.focus(); });

  btnClearFormat.addEventListener('click', () => {
    document.execCommand('removeFormat');
    editor.focus();
  });

  btnClearAll.addEventListener('click', () => {
    if (editor.innerText.trim() === '' && editor.querySelectorAll('img, table').length === 0) return;
    if (confirm('Deseja limpar todo o conteúdo da folha?')) {
      editor.innerHTML = '';
      updateStats();
      editor.focus();
    }
  });

  // Exportação para PDF nativo
  btnExport.addEventListener('click', () => {
    const text = editor.innerText.trim();
    if (!text && editor.querySelectorAll('img, table').length === 0) {
      alert('Por favor, cole ou digite algum conteúdo antes de gerar o PDF.');
      editor.focus();
      return;
    }

    // Define nome amigável para o arquivo salvo a partir da 1ª linha
    const originalTitle = document.title;
    const firstLine = text.split('\n')[0]?.trim();
    const docName = firstLine ? firstLine.substring(0, 45).replace(/[^\w\s-]/gi, '') : 'Documento_Compilado';
    document.title = `${docName} - Arsenal PDF`;

    // Dispara a impressão nativa que gera o PDF com fidelidade 100% de tabelas e fotos
    window.print();

    // Restaura o título após a janela de impressão fechar
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);

    // Registra histórico
    historyManager.record(
      'text-to-pdf',
      'pdf',
      'Compilador de Texto para PDF',
      docName,
      `${text.split(/\s+/).filter(Boolean).length} palavras compiladas`,
      {}
    );
  });
}
