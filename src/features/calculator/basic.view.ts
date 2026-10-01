import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderBasicCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('basic-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper" style="max-width: 420px;">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="basic-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Calculadora Básica</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="basic-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Visor -->
      <div style="background: var(--bg-muted); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; text-align: right; margin-bottom: 16px;">
        <div id="calc-expression" style="font-size: 0.85rem; color: var(--text-secondary); min-height: 20px; font-family: var(--font-mono);"></div>
        <div id="calc-display" style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); font-family: var(--font-mono); overflow-x: auto;">0</div>
      </div>

      <!-- Teclado Numérico Sóbrio -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
        <button class="calc-btn op" data-val="C" style="background: #FEE2E2; color: #DC2626;">C</button>
        <button class="calc-btn op" data-val="(">(</button>
        <button class="calc-btn op" data-val=")">)</button>
        <button class="calc-btn op" data-val="/">÷</button>

        <button class="calc-btn" data-val="7">7</button>
        <button class="calc-btn" data-val="8">8</button>
        <button class="calc-btn" data-val="9">9</button>
        <button class="calc-btn op" data-val="*">×</button>

        <button class="calc-btn" data-val="4">4</button>
        <button class="calc-btn" data-val="5">5</button>
        <button class="calc-btn" data-val="6">6</button>
        <button class="calc-btn op" data-val="-">-</button>

        <button class="calc-btn" data-val="1">1</button>
        <button class="calc-btn" data-val="2">2</button>
        <button class="calc-btn" data-val="3">3</button>
        <button class="calc-btn op" data-val="+">+</button>

        <button class="calc-btn" data-val="0" style="grid-column: span 2;">0</button>
        <button class="calc-btn" data-val=".">,</button>
        <button class="calc-btn op" data-val="=" style="background: var(--btn-primary-bg); color: var(--btn-primary-text); font-weight: bold;">=</button>
      </div>
    </div>
    <style>
      .calc-btn {
        height: 52px;
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--text-main);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.1s ease;
      }
      .calc-btn:hover {
        background: var(--bg-muted);
      }
      .calc-btn.op {
        background: var(--bg-muted);
        font-weight: 700;
      }
    </style>
  `;

  const btnBack = container.querySelector('#basic-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#basic-btn-fav') as HTMLButtonElement;
  const exprEl = container.querySelector('#calc-expression') as HTMLElement;
  const dispEl = container.querySelector('#calc-display') as HTMLElement;

  let currentInput = '0';
  let expression = '';

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('basic-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('basic-calc'));
  });

  container.querySelectorAll('.calc-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      if (!val) return;

      if (val === 'C') {
        currentInput = '0';
        expression = '';
        exprEl.textContent = '';
        dispEl.textContent = '0';
      } else if (val === '=') {
        try {
          // Avaliação segura substituindo operadores visuais
          const sanitized = (expression + currentInput).replace(/×/g, '*').replace(/÷/g, '/');
          // eslint-disable-next-line no-eval
          const result = Function(`"use strict"; return (${sanitized})`)();
          exprEl.textContent = `${expression + currentInput} =`;
          dispEl.textContent = Number(result).toLocaleString('pt-BR', { maximumFractionDigits: 8 });

          historyManager.record(
            'basic-calc',
            'Calculadoras',
            'Cálculo Básico',
            sanitized,
            String(result)
          );

          currentInput = String(result);
          expression = '';
        } catch {
          dispEl.textContent = 'Erro';
        }
      } else if (['+', '-', '*', '/'].includes(val)) {
        expression += `${currentInput} ${val} `;
        currentInput = '0';
        exprEl.textContent = expression;
      } else if (val === '.') {
        if (!currentInput.includes('.')) {
          currentInput += '.';
          dispEl.textContent = currentInput;
        }
      } else {
        if (currentInput === '0') {
          currentInput = val;
        } else {
          currentInput += val;
        }
        dispEl.textContent = currentInput;
      }
    });
  });
}
