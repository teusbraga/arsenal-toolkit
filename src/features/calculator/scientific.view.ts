import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderScientificCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('scientific-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper" style="max-width: 540px;">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="sci-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Calculadora Científica</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="sci-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Visor -->
      <div style="background: var(--bg-muted); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 16px; text-align: right; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <button id="deg-rad-toggle" style="font-size: 0.72rem; font-weight: 700; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 2px 8px; border-radius: var(--radius-xs); color: var(--text-secondary);">DEG</button>
          <div id="sci-expression" style="font-size: 0.85rem; color: var(--text-secondary); min-height: 20px; font-family: var(--font-mono);"></div>
        </div>
        <div id="sci-display" style="font-size: 1.8rem; font-weight: 700; color: var(--text-main); font-family: var(--font-mono); overflow-x: auto;">0</div>
      </div>

      <!-- Teclado Científico Sóbrio -->
      <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px;">
        <button class="sci-btn fn" data-val="sin">sin</button>
        <button class="sci-btn fn" data-val="cos">cos</button>
        <button class="sci-btn fn" data-val="tan">tan</button>
        <button class="sci-btn op" data-val="pi">π</button>
        <button class="sci-btn op" data-val="e">e</button>

        <button class="sci-btn fn" data-val="ln">ln</button>
        <button class="sci-btn fn" data-val="log">log</button>
        <button class="sci-btn fn" data-val="sqrt">√</button>
        <button class="sci-btn fn" data-val="^">xʸ</button>
        <button class="sci-btn fn" data-val="fact">n!</button>

        <button class="sci-btn op" data-val="(">(</button>
        <button class="sci-btn op" data-val=")">)</button>
        <button class="sci-btn op" data-val="DEL" style="color: #D97706;">⌫</button>
        <button class="sci-btn op" data-val="C" style="background: #FEE2E2; color: #DC2626;">C</button>
        <button class="sci-btn op" data-val="/">÷</button>

        <button class="sci-btn num" data-val="7">7</button>
        <button class="sci-btn num" data-val="8">8</button>
        <button class="sci-btn num" data-val="9">9</button>
        <button class="sci-btn op" data-val="*">×</button>
        <button class="sci-btn fn" data-val="1/x">1/x</button>

        <button class="sci-btn num" data-val="4">4</button>
        <button class="sci-btn num" data-val="5">5</button>
        <button class="sci-btn num" data-val="6">6</button>
        <button class="sci-btn op" data-val="-">-</button>
        <button class="sci-btn fn" data-val="abs">|x|</button>

        <button class="sci-btn num" data-val="1">1</button>
        <button class="sci-btn num" data-val="2">2</button>
        <button class="sci-btn num" data-val="3">3</button>
        <button class="sci-btn op" data-val="+">+</button>
        <button class="sci-btn op" data-val="=" style="grid-row: span 2; height: 100%; background: var(--btn-primary-bg); color: var(--btn-primary-text); font-weight: bold;">=</button>

        <button class="sci-btn num" data-val="0" style="grid-column: span 2;">0</button>
        <button class="sci-btn num" data-val=".">,</button>
        <button class="sci-btn fn" data-val="+/-">±</button>
      </div>
    </div>

    <style>
      .sci-btn {
        height: 46px;
        background: var(--bg-surface);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-main);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.1s ease;
      }
      .sci-btn:hover {
        background: var(--bg-muted);
      }
      .sci-btn.fn, .sci-btn.op {
        background: var(--bg-muted);
        font-size: 0.88rem;
      }
    </style>
  `;

  const btnBack = container.querySelector('#sci-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#sci-btn-fav') as HTMLButtonElement;
  const exprEl = container.querySelector('#sci-expression') as HTMLElement;
  const dispEl = container.querySelector('#sci-display') as HTMLElement;
  const degRadBtn = container.querySelector('#deg-rad-toggle') as HTMLButtonElement;

  let isDeg = true;
  let currentVal = '0';
  let expr = '';

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('scientific-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('scientific-calc'));
  });

  degRadBtn.addEventListener('click', () => {
    isDeg = !isDeg;
    degRadBtn.textContent = isDeg ? 'DEG' : 'RAD';
  });

  function factorial(n: number): number {
    if (n < 0 || Math.floor(n) !== n) return NaN;
    if (n === 0 || n === 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  container.querySelectorAll('.sci-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = btn.getAttribute('data-val');
      if (!val) return;

      if (val === 'C') {
        currentVal = '0';
        expr = '';
        exprEl.textContent = '';
        dispEl.textContent = '0';
      } else if (val === 'DEL') {
        if (currentVal.length > 1) {
          currentVal = currentVal.slice(0, -1);
        } else {
          currentVal = '0';
        }
        dispEl.textContent = currentVal;
      } else if (val === 'pi') {
        currentVal = String(Math.PI);
        dispEl.textContent = currentVal;
      } else if (val === 'e') {
        currentVal = String(Math.E);
        dispEl.textContent = currentVal;
      } else if (val === '+/-') {
        if (currentVal !== '0') {
          currentVal = currentVal.startsWith('-') ? currentVal.slice(1) : '-' + currentVal;
          dispEl.textContent = currentVal;
        }
      } else if (val === 'sin' || val === 'cos' || val === 'tan') {
        let num = parseFloat(currentVal) || 0;
        if (isDeg) num = (num * Math.PI) / 180;
        const res = val === 'sin' ? Math.sin(num) : val === 'cos' ? Math.cos(num) : Math.tan(num);
        exprEl.textContent = `${val}(${currentVal}) =`;
        currentVal = String(Number(res.toFixed(8)));
        dispEl.textContent = currentVal;
      } else if (val === 'ln') {
        const num = parseFloat(currentVal);
        const res = Math.log(num);
        exprEl.textContent = `ln(${currentVal}) =`;
        currentVal = String(Number(res.toFixed(8)));
        dispEl.textContent = currentVal;
      } else if (val === 'log') {
        const num = parseFloat(currentVal);
        const res = Math.log10(num);
        exprEl.textContent = `log(${currentVal}) =`;
        currentVal = String(Number(res.toFixed(8)));
        dispEl.textContent = currentVal;
      } else if (val === 'sqrt') {
        const num = parseFloat(currentVal);
        const res = Math.sqrt(num);
        exprEl.textContent = `√(${currentVal}) =`;
        currentVal = String(Number(res.toFixed(8)));
        dispEl.textContent = currentVal;
      } else if (val === '1/x') {
        const num = parseFloat(currentVal);
        const res = 1 / num;
        exprEl.textContent = `1/(${currentVal}) =`;
        currentVal = String(Number(res.toFixed(8)));
        dispEl.textContent = currentVal;
      } else if (val === 'abs') {
        const num = parseFloat(currentVal);
        currentVal = String(Math.abs(num));
        dispEl.textContent = currentVal;
      } else if (val === 'fact') {
        const num = parseInt(currentVal);
        const res = factorial(num);
        exprEl.textContent = `${currentVal}! =`;
        currentVal = String(res);
        dispEl.textContent = currentVal;
      } else if (val === '^') {
        expr += `${currentVal} ** `;
        currentVal = '0';
        exprEl.textContent = expr;
      } else if (['+', '-', '*', '/'].includes(val)) {
        expr += `${currentVal} ${val} `;
        currentVal = '0';
        exprEl.textContent = expr;
      } else if (val === '(' || val === ')') {
        expr += val;
        exprEl.textContent = expr;
      } else if (val === '=') {
        try {
          const toEval = (expr + currentVal).replace(/×/g, '*').replace(/÷/g, '/');
          // eslint-disable-next-line no-eval
          const result = Function(`"use strict"; return (${toEval})`)();
          exprEl.textContent = `${expr + currentVal} =`;
          dispEl.textContent = Number(result).toLocaleString('pt-BR', { maximumFractionDigits: 8 });

          historyManager.record(
            'scientific-calc',
            'Calculadoras',
            'Científica',
            toEval,
            String(result)
          );

          currentVal = String(result);
          expr = '';
        } catch {
          dispEl.textContent = 'Erro';
        }
      } else if (val === '.') {
        if (!currentVal.includes('.')) {
          currentVal += '.';
          dispEl.textContent = currentVal;
        }
      } else {
        if (currentVal === '0') {
          currentVal = val;
        } else {
          currentVal += val;
        }
        dispEl.textContent = currentVal;
      }
    });
  });
}
