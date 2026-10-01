import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderTextView(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('text-tools');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="txt-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Manipulação de Texto</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="txt-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="txt-tabs" style="overflow-x: auto;">
        <button class="tab-btn active" data-tab="counter">Contador & Transformador</button>
        <button class="tab-btn" data-tab="lines">Linhas & Limpeza</button>
        <button class="tab-btn" data-tab="slug-lorem">Slug & Lorem Ipsum</button>
        <button class="tab-btn" data-tab="diff">Comparador (Diff)</button>
      </div>

      <!-- Tab 1: Contador & Transformador de Case -->
      <div id="tab-txt-counter" class="txt-pane">
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label">Digite ou cole seu texto:</label>
            <button id="txt-clear-btn" style="font-size: 0.75rem; color: var(--text-secondary); text-decoration: underline;">Limpar</button>
          </div>
          <textarea id="txt-input" class="form-input" style="height: 140px; padding: 12px; font-family: var(--font-sans); resize: vertical;">Backpack Tools é uma suíte completa de ferramentas essenciais para produtividade profissional diária.</textarea>
        </div>

        <!-- Botões de Ação de Case -->
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
          <button class="tab-btn case-btn" data-case="upper">MAIÚSCULAS</button>
          <button class="tab-btn case-btn" data-case="lower">minúsculas</button>
          <button class="tab-btn case-btn" data-case="title">Primeira Letra</button>
          <button class="tab-btn case-btn" data-case="camel">camelCase</button>
          <button class="tab-btn case-btn" data-case="snake">snake_case</button>
          <button class="tab-btn case-btn" data-case="kebab">kebab-case</button>
        </div>

        <div class="result-card">
          <div class="result-header">Métricas do Texto</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
            <div class="result-row">
              <span class="result-label">Caracteres (com espaços)</span>
              <span class="result-value highlight" id="cnt-chars-total">100</span>
            </div>
            <div class="result-row">
              <span class="result-label">Caracteres (sem espaços)</span>
              <span class="result-value" id="cnt-chars-no-space">86</span>
            </div>
            <div class="result-row">
              <span class="result-label">Palavras</span>
              <span class="result-value highlight" id="cnt-words">13</span>
            </div>
            <div class="result-row">
              <span class="result-label">Linhas / Parágrafos</span>
              <span class="result-value" id="cnt-lines">1</span>
            </div>
            <div class="result-row">
              <span class="result-label">Tempo de Leitura</span>
              <span class="result-value" id="cnt-reading">~ 4 seg</span>
            </div>
            <div class="result-row">
              <span class="result-label">Tempo de Fala</span>
              <span class="result-value" id="cnt-speaking">~ 6 seg</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: Linhas e Limpeza -->
      <div id="tab-txt-lines" class="txt-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Texto com múltiplas linhas</label>
          <textarea id="lines-input" class="form-input" style="height: 120px; font-family: var(--font-mono); font-size: 0.85rem;">Banana
Maçã
Abacaxi
Banana
Laranja
Maçã</textarea>
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px;">
          <button class="tab-btn line-action-btn" data-action="dedup">Remover Duplicadas</button>
          <button class="tab-btn line-action-btn" data-action="sort-asc">Ordenar A → Z</button>
          <button class="tab-btn line-action-btn" data-action="sort-desc">Ordenar Z → A</button>
          <button class="tab-btn line-action-btn" data-action="shuffle">Embaralhar</button>
          <button class="tab-btn line-action-btn" data-action="trim">Remover Linhas Vazias</button>
        </div>

        <div class="form-group">
          <label class="form-label">Resultado das Linhas</label>
          <textarea id="lines-output" class="form-input" readonly style="height: 120px; font-family: var(--font-mono); font-size: 0.85rem; background: var(--bg-muted);"></textarea>
        </div>
      </div>

      <!-- Tab 3: Slug & Lorem Ipsum -->
      <div id="tab-txt-slug-lorem" class="txt-pane" style="display: none;">
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
          <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">Gerador de Slug para URLs</h3>
          <div class="form-group">
            <label class="form-label">Título ou Texto</label>
            <input type="text" id="slug-input" class="form-input" value="Como Criar Aplicações Web Rápidas & Offline com PWA em 2026!" />
          </div>
          <div class="result-row" style="background: var(--bg-muted); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <span class="result-label" style="font-weight: 600;">Slug:</span>
            <span class="result-value" id="slug-output" style="font-family: var(--font-mono); word-break: break-all;">como-criar-aplicacoes-web-rapidas-offline-com-pwa-em-2026</span>
          </div>
        </div>

        <div>
          <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 10px;">Gerador de Lorem Ipsum</h3>
          <div style="display: flex; gap: 8px; margin-bottom: 10px;">
            <input type="number" id="lorem-qty" class="form-input" value="2" min="1" max="10" style="width: 80px;" />
            <select id="lorem-type" class="form-select">
              <option value="paragraphs">Parágrafos</option>
              <option value="sentences">Frases</option>
              <option value="words">Palavras</option>
            </select>
            <button class="btn-primary" id="btn-gen-lorem" style="margin-top: 0; width: auto; padding: 0 18px;">Gerar</button>
          </div>
          <textarea id="lorem-output" class="form-input" readonly style="height: 110px; font-size: 0.85rem; background: var(--bg-muted);"></textarea>
        </div>
      </div>

      <!-- Tab 4: Text Diff -->
      <div id="tab-txt-diff" class="txt-pane" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Texto Original</label>
            <textarea id="diff-original" class="form-input" style="height: 100px; font-family: var(--font-mono); font-size: 0.8rem;">O Backpack Tools é uma suíte de ferramentas simples.</textarea>
          </div>
          <div>
            <label class="form-label">Texto Modificado</label>
            <textarea id="diff-modified" class="form-input" style="height: 100px; font-family: var(--font-mono); font-size: 0.8rem;">O Backpack Tools é uma suíte completa de ferramentas essenciais.</textarea>
          </div>
        </div>
        <div class="result-card">
          <div class="result-header">Diferenças Detectadas</div>
          <div id="diff-output-box" style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap;"></div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#txt-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#txt-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('text-tools');
    btnFav.classList.toggle('active', store.getState().favorites.includes('text-tools'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      container.querySelectorAll('.txt-pane').forEach((p) => {
        (p as HTMLElement).style.display = p.id === `tab-txt-${target}` ? 'block' : 'none';
      });
    });
  });

  // Contador de Texto
  const txtInput = container.querySelector('#txt-input') as HTMLTextAreaElement;
  const charsTotal = container.querySelector('#cnt-chars-total') as HTMLElement;
  const charsNoSpace = container.querySelector('#cnt-chars-no-space') as HTMLElement;
  const wordsEl = container.querySelector('#cnt-words') as HTMLElement;
  const linesEl = container.querySelector('#cnt-lines') as HTMLElement;
  const readingEl = container.querySelector('#cnt-reading') as HTMLElement;
  const speakingEl = container.querySelector('#cnt-speaking') as HTMLElement;

  function countText() {
    const text = txtInput.value;
    const totalChars = text.length;
    const noSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split('\n').length : 0;

    // Leitura média: 200 palavras/minuto (3.3 palavras/segundo)
    const readSec = Math.ceil(words / 3.3);
    const speakSec = Math.ceil(words / 2.2);

    charsTotal.textContent = String(totalChars);
    charsNoSpace.textContent = String(noSpaces);
    wordsEl.textContent = String(words);
    linesEl.textContent = String(lines);
    readingEl.textContent = readSec < 60 ? `~ ${readSec} seg` : `~ ${Math.ceil(readSec / 60)} min`;
    speakingEl.textContent = speakSec < 60 ? `~ ${speakSec} seg` : `~ ${Math.ceil(speakSec / 60)} min`;

    historyManager.record(
      'text-tools',
      'Texto',
      'Contador de Texto',
      `${words} palavras`,
      `${totalChars} caracteres`
    );
  }

  txtInput.addEventListener('input', countText);
  container.querySelector('#txt-clear-btn')?.addEventListener('click', () => {
    txtInput.value = '';
    countText();
  });

  // Transformadores de Case
  container.querySelectorAll('.case-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const type = btn.getAttribute('data-case');
      const text = txtInput.value;
      if (!text) return;

      if (type === 'upper') txtInput.value = text.toUpperCase();
      if (type === 'lower') txtInput.value = text.toLowerCase();
      if (type === 'title') {
        txtInput.value = text.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
      }
      if (type === 'camel') {
        txtInput.value = text.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
      }
      if (type === 'snake') {
        txtInput.value = text.trim().toLowerCase().replace(/[\s\W-]+/g, '_');
      }
      if (type === 'kebab') {
        txtInput.value = text.trim().toLowerCase().replace(/[\s\W-]+/g, '-');
      }
      countText();
    });
  });

  // Linhas e Limpeza
  const linesIn = container.querySelector('#lines-input') as HTMLTextAreaElement;
  const linesOut = container.querySelector('#lines-output') as HTMLTextAreaElement;

  function runLines(action: string) {
    const raw = linesIn.value;
    const lines = raw.split('\n');
    let res: string[] = [];

    if (action === 'dedup') {
      res = Array.from(new Set(lines));
    } else if (action === 'sort-asc') {
      res = [...lines].sort((a, b) => a.localeCompare(b, 'pt-BR'));
    } else if (action === 'sort-desc') {
      res = [...lines].sort((a, b) => b.localeCompare(a, 'pt-BR'));
    } else if (action === 'shuffle') {
      res = [...lines].sort(() => Math.random() - 0.5);
    } else if (action === 'trim') {
      res = lines.filter((l) => l.trim().length > 0);
    }

    linesOut.value = res.join('\n');
  }

  container.querySelectorAll('.line-action-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const act = b.getAttribute('data-action') || '';
      runLines(act);
    });
  });

  // Slug Generator
  const slugIn = container.querySelector('#slug-input') as HTMLInputElement;
  const slugOut = container.querySelector('#slug-output') as HTMLElement;

  function makeSlug() {
    const text = slugIn.value;
    const slug = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    slugOut.textContent = slug;
  }
  slugIn.addEventListener('input', makeSlug);

  // Lorem Ipsum
  const loremQty = container.querySelector('#lorem-qty') as HTMLInputElement;
  const loremType = container.querySelector('#lorem-type') as HTMLSelectElement;
  const loremOut = container.querySelector('#lorem-output') as HTMLTextAreaElement;
  const btnLorem = container.querySelector('#btn-gen-lorem') as HTMLButtonElement;

  const LOREM_WORDS = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');

  function generateLorem() {
    const qty = parseInt(loremQty.value) || 1;
    const type = loremType.value;

    if (type === 'words') {
      const words = [];
      for (let i = 0; i < qty; i++) {
        words.push(LOREM_WORDS[i % LOREM_WORDS.length]);
      }
      loremOut.value = words.join(' ');
    } else if (type === 'sentences') {
      const sentences = [];
      for (let i = 0; i < qty; i++) {
        const sentence = LOREM_WORDS.slice(0, 10).join(' ') + '.';
        sentences.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
      }
      loremOut.value = sentences.join(' ');
    } else {
      const paragraphs = [];
      for (let i = 0; i < qty; i++) {
        paragraphs.push(
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
        );
      }
      loremOut.value = paragraphs.join('\n\n');
    }
  }
  btnLorem.addEventListener('click', generateLorem);

  // Text Diff
  const diffOrig = container.querySelector('#diff-original') as HTMLTextAreaElement;
  const diffMod = container.querySelector('#diff-modified') as HTMLTextAreaElement;
  const diffOut = container.querySelector('#diff-output-box') as HTMLElement;

  function runDiff() {
    const origWords = diffOrig.value.split(/\s+/);
    const modWords = diffMod.value.split(/\s+/);

    let html = '';
    const maxLen = Math.max(origWords.length, modWords.length);

    for (let i = 0; i < maxLen; i++) {
      const w1 = origWords[i] || '';
      const w2 = modWords[i] || '';

      if (w1 === w2) {
        html += `${w1} `;
      } else {
        if (w1) html += `<span style="background: #FEE2E2; color: #DC2626; text-decoration: line-through; padding: 1px 4px; border-radius: 2px;">${w1}</span> `;
        if (w2) html += `<span style="background: #DCFCE7; color: #16A34A; font-weight: bold; padding: 1px 4px; border-radius: 2px;">${w2}</span> `;
      }
    }
    diffOut.innerHTML = html;
  }

  diffOrig.addEventListener('input', runDiff);
  diffMod.addEventListener('input', runDiff);

  countText();
  runLines('dedup');
  makeSlug();
  generateLorem();
  runDiff();
}
