import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderGraphPlotter(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('graph-plotter');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="plot-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Gráficos de Funções 2D</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="plot-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Entrada de Função -->
      <div class="form-group">
        <label class="form-label">Expressão f(x)</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="fn-expression" class="form-input" value="x^2 - 4" placeholder="Ex: x^2 - 4, sin(x), 2*x + 1" style="font-family: var(--font-mono);" />
          <button class="btn-primary" id="btn-draw-fn" style="width: 100px; margin-top: 0;">Plotar</button>
        </div>
      </div>

      <!-- Presets Rápidos -->
      <div style="display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;">
        <button class="tab-btn fn-preset" data-fn="x^2 - 4">x² - 4</button>
        <button class="tab-btn fn-preset" data-fn="sin(x)">sin(x)</button>
        <button class="tab-btn fn-preset" data-fn="cos(x)">cos(x)</button>
        <button class="tab-btn fn-preset" data-fn="2*x + 1">2x + 1</button>
        <button class="tab-btn fn-preset" data-fn="x^3 - 3*x">x³ - 3x</button>
      </div>

      <!-- Canvas de Plotagem Sóbrio -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-sm); overflow: hidden; display: flex; justify-content: center; position: relative;">
        <canvas id="plot-canvas" width="600" height="340" style="max-width: 100%; height: auto; display: block;"></canvas>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.78rem; color: var(--text-secondary);">
        <span>Intervalo: X [-10 a 10], Y [-10 a 10]</span>
        <span id="plot-status" style="font-family: var(--font-mono); color: var(--status-success);">Pronto</span>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#plot-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#plot-btn-fav') as HTMLButtonElement;
  const fnInput = container.querySelector('#fn-expression') as HTMLInputElement;
  const btnDraw = container.querySelector('#btn-draw-fn') as HTMLButtonElement;
  const canvas = container.querySelector('#plot-canvas') as HTMLCanvasElement;
  const statusEl = container.querySelector('#plot-status') as HTMLElement;
  const ctx = canvas.getContext('2d');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('graph-plotter');
    btnFav.classList.toggle('active', store.getState().favorites.includes('graph-plotter'));
  });

  container.querySelectorAll('.fn-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      const fn = btn.getAttribute('data-fn');
      if (fn) {
        fnInput.value = fn;
        drawGraph();
      }
    });
  });

  function parseExpression(expr: string): (x: number) => number {
    let sanitized = expr
      .replace(/\^/g, '**')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(');

    // Permitir 2x virar 2*x
    sanitized = sanitized.replace(/(\d)x/g, '$1*x');

    // eslint-disable-next-line no-new-func
    return new Function('x', `"use strict"; return (${sanitized});`) as (x: number) => number;
  }

  function drawGraph() {
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;

    // Fundo limpo
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Sistema de coordenadas: [-10, 10] em X e [-10, 10] em Y
    const minX = -10;
    const maxX = 10;
    const minY = -10;
    const maxY = 10;

    const toCanvasX = (x: number) => ((x - minX) / (maxX - minX)) * width;
    const toCanvasY = (y: number) => height - ((y - minY) / (maxY - minY)) * height;

    // Grade sutil cinza claro (#F1F5F9)
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;

    for (let x = -10; x <= 10; x += 2) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();
    }

    for (let y = -10; y <= 10; y += 2) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
    }

    // Eixos Principais X e Y (#CBD5E1)
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;

    // Eixo X
    const centerY = toCanvasY(0);
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Eixo Y
    const centerX = toCanvasX(0);
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Plotagem da Curva Matemática (#0F172A)
    try {
      const fn = parseExpression(fnInput.value);

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let started = false;
      const step = (maxX - minX) / (width * 2);

      for (let x = minX; x <= maxX; x += step) {
        const y = fn(x);
        if (isNaN(y) || !isFinite(y)) {
          started = false;
          continue;
        }

        const cx = toCanvasX(x);
        const cy = toCanvasY(y);

        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.stroke();
      statusEl.textContent = 'f(x) plotada';
      statusEl.style.color = 'var(--status-success)';

      historyManager.record(
        'graph-plotter',
        'Calculadoras',
        'Gráfico 2D',
        fnInput.value,
        'Curva renderizada'
      );
    } catch {
      statusEl.textContent = 'Erro de sintaxe';
      statusEl.style.color = 'var(--status-danger)';
    }
  }

  btnDraw.addEventListener('click', drawGraph);
  fnInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') drawGraph();
  });

  drawGraph();
}
