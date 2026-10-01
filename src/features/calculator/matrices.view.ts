import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderMatricesCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('matrices-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="mat-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Matrizes & Determinantes</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="mat-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="mat-tabs">
        <button class="tab-btn active" data-dim="2">Matriz 2 × 2</button>
        <button class="tab-btn" data-dim="3">Matriz 3 × 3</button>
      </div>

      <!-- Container Matriz 2x2 -->
      <div id="mat-2x2-box" style="display: flex; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: repeat(2, 60px); gap: 8px; padding: 14px; background: var(--bg-muted); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <input type="number" id="m2-00" class="form-input" value="4" style="text-align: center; font-weight: bold;" />
          <input type="number" id="m2-01" class="form-input" value="2" style="text-align: center; font-weight: bold;" />
          <input type="number" id="m2-10" class="form-input" value="1" style="text-align: center; font-weight: bold;" />
          <input type="number" id="m2-11" class="form-input" value="3" style="text-align: center; font-weight: bold;" />
        </div>
      </div>

      <!-- Container Matriz 3x3 -->
      <div id="mat-3x3-box" style="display: none; flex-direction: column; align-items: center; gap: 14px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: repeat(3, 56px); gap: 6px; padding: 14px; background: var(--bg-muted); border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          <input type="number" id="m3-00" class="form-input" value="1" style="text-align: center;" />
          <input type="number" id="m3-01" class="form-input" value="2" style="text-align: center;" />
          <input type="number" id="m3-02" class="form-input" value="3" style="text-align: center;" />
          
          <input type="number" id="m3-10" class="form-input" value="0" style="text-align: center;" />
          <input type="number" id="m3-11" class="form-input" value="1" style="text-align: center;" />
          <input type="number" id="m3-12" class="form-input" value="4" style="text-align: center;" />
          
          <input type="number" id="m3-20" class="form-input" value="5" style="text-align: center;" />
          <input type="number" id="m3-21" class="form-input" value="6" style="text-align: center;" />
          <input type="number" id="m3-22" class="form-input" value="0" style="text-align: center;" />
        </div>
      </div>

      <div class="result-card">
        <div class="result-header">Propriedades da Matriz</div>
        <div class="result-row">
          <span class="result-label">Determinante (det A)</span>
          <span class="result-value highlight" id="mat-det">10</span>
        </div>
        <div class="result-row">
          <span class="result-label">Traço (Tr A = soma da diagonal)</span>
          <span class="result-value" id="mat-trace">7</span>
        </div>
        <div class="result-row">
          <span class="result-label">Inversibilidade</span>
          <span class="result-value" id="mat-invertible">Invertível (det ≠ 0)</span>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#mat-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#mat-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');
  const box2 = container.querySelector('#mat-2x2-box') as HTMLElement;
  const box3 = container.querySelector('#mat-3x3-box') as HTMLElement;
  const detEl = container.querySelector('#mat-det') as HTMLElement;
  const traceEl = container.querySelector('#mat-trace') as HTMLElement;
  const invertEl = container.querySelector('#mat-invertible') as HTMLElement;

  let currentDim = 2;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('matrices-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('matrices-calc'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentDim = parseInt(tab.getAttribute('data-dim') || '2');
      box2.style.display = currentDim === 2 ? 'flex' : 'none';
      box3.style.display = currentDim === 3 ? 'flex' : 'none';
      calc();
    });
  });

  function calc() {
    if (currentDim === 2) {
      const a = parseFloat((container.querySelector('#m2-00') as HTMLInputElement).value) || 0;
      const b = parseFloat((container.querySelector('#m2-01') as HTMLInputElement).value) || 0;
      const c = parseFloat((container.querySelector('#m2-10') as HTMLInputElement).value) || 0;
      const d = parseFloat((container.querySelector('#m2-11') as HTMLInputElement).value) || 0;

      const det = a * d - b * c;
      const trace = a + d;

      detEl.textContent = String(det);
      traceEl.textContent = String(trace);
      invertEl.textContent = det !== 0 ? 'Invertível (det ≠ 0)' : 'Singular (não invertível)';

      historyManager.record(
        'matrices-calc',
        'Calculadoras',
        'Matriz 2x2',
        `[${a}, ${b} ; ${c}, ${d}]`,
        `det = ${det}`
      );
    } else {
      const m00 = parseFloat((container.querySelector('#m3-00') as HTMLInputElement).value) || 0;
      const m01 = parseFloat((container.querySelector('#m3-01') as HTMLInputElement).value) || 0;
      const m02 = parseFloat((container.querySelector('#m3-02') as HTMLInputElement).value) || 0;

      const m10 = parseFloat((container.querySelector('#m3-10') as HTMLInputElement).value) || 0;
      const m11 = parseFloat((container.querySelector('#m3-11') as HTMLInputElement).value) || 0;
      const m12 = parseFloat((container.querySelector('#m3-12') as HTMLInputElement).value) || 0;

      const m20 = parseFloat((container.querySelector('#m3-20') as HTMLInputElement).value) || 0;
      const m21 = parseFloat((container.querySelector('#m3-21') as HTMLInputElement).value) || 0;
      const m22 = parseFloat((container.querySelector('#m3-22') as HTMLInputElement).value) || 0;

      // Regra de Sarrus para 3x3
      const det =
        m00 * m11 * m22 +
        m01 * m12 * m20 +
        m02 * m10 * m21 -
        m02 * m11 * m20 -
        m00 * m12 * m21 -
        m01 * m10 * m22;

      const trace = m00 + m11 + m22;

      detEl.textContent = String(det);
      traceEl.textContent = String(trace);
      invertEl.textContent = det !== 0 ? 'Invertível (det ≠ 0)' : 'Singular (não invertível)';
    }
  }

  container.querySelectorAll('input').forEach((inp) => inp.addEventListener('input', calc));
  calc();
}
