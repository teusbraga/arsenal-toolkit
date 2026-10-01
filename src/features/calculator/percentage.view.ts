import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderPercentageCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('percentage-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="perc-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Calculadora de Porcentagem</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="perc-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Cálculo 1: Quanto é X% de Y? -->
      <div class="form-group" style="padding: 16px; background: var(--bg-muted); border-radius: var(--radius-sm); margin-bottom: 16px;">
        <label class="form-label" style="font-weight: 600;">1. Quanto é X% de Y?</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="p1-x" class="form-input" value="15" style="width: 90px;" />
          <span>% de</span>
          <input type="number" id="p1-y" class="form-input" value="200" style="flex: 1;" />
          <span>=</span>
          <span id="p1-res" style="font-weight: 700; font-family: var(--font-mono); font-size: 1.1rem; min-width: 70px;">30</span>
        </div>
      </div>

      <!-- Cálculo 2: X é quantos % de Y? -->
      <div class="form-group" style="padding: 16px; background: var(--bg-muted); border-radius: var(--radius-sm); margin-bottom: 16px;">
        <label class="form-label" style="font-weight: 600;">2. O valor X é quantos % do total Y?</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="p2-x" class="form-input" value="50" style="flex: 1;" />
          <span>do total</span>
          <input type="number" id="p2-y" class="form-input" value="250" style="flex: 1;" />
          <span>=</span>
          <span id="p2-res" style="font-weight: 700; font-family: var(--font-mono); font-size: 1.1rem; min-width: 70px;">20%</span>
        </div>
      </div>

      <!-- Cálculo 3: Variação Percentual (Aumento ou Queda) -->
      <div class="form-group" style="padding: 16px; background: var(--bg-muted); border-radius: var(--radius-sm);">
        <label class="form-label" style="font-weight: 600;">3. Variação percentual de X para Y</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="p3-x" class="form-input" value="100" style="flex: 1;" />
          <span>para</span>
          <input type="number" id="p3-y" class="form-input" value="130" style="flex: 1;" />
          <span>=</span>
          <span id="p3-res" style="font-weight: 700; font-family: var(--font-mono); font-size: 1.1rem; min-width: 70px; color: var(--status-success);">+30%</span>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#perc-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#perc-btn-fav') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('percentage-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('percentage-calc'));
  });

  // Cálculo 1
  const p1x = container.querySelector('#p1-x') as HTMLInputElement;
  const p1y = container.querySelector('#p1-y') as HTMLInputElement;
  const p1res = container.querySelector('#p1-res') as HTMLElement;
  function calc1() {
    const x = parseFloat(p1x.value) || 0;
    const y = parseFloat(p1y.value) || 0;
    const r = (x / 100) * y;
    p1res.textContent = r.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
  p1x.addEventListener('input', calc1);
  p1y.addEventListener('input', calc1);

  // Cálculo 2
  const p2x = container.querySelector('#p2-x') as HTMLInputElement;
  const p2y = container.querySelector('#p2-y') as HTMLInputElement;
  const p2res = container.querySelector('#p2-res') as HTMLElement;
  function calc2() {
    const x = parseFloat(p2x.value) || 0;
    const y = parseFloat(p2y.value) || 0;
    const r = y > 0 ? (x / y) * 100 : 0;
    p2res.textContent = `${r.toFixed(1)}%`;
  }
  p2x.addEventListener('input', calc2);
  p2y.addEventListener('input', calc2);

  // Cálculo 3
  const p3x = container.querySelector('#p3-x') as HTMLInputElement;
  const p3y = container.querySelector('#p3-y') as HTMLInputElement;
  const p3res = container.querySelector('#p3-res') as HTMLElement;
  function calc3() {
    const x = parseFloat(p3x.value) || 0;
    const y = parseFloat(p3y.value) || 0;
    if (x === 0) {
      p3res.textContent = '0%';
      return;
    }
    const varPerc = ((y - x) / x) * 100;
    p3res.textContent = `${varPerc > 0 ? '+' : ''}${varPerc.toFixed(1)}%`;
    p3res.style.color = varPerc >= 0 ? 'var(--status-success)' : 'var(--status-danger)';

    historyManager.record(
      'percentage-calc',
      'Calculadoras',
      'Variação %',
      `De ${x} para ${y}`,
      `${varPerc.toFixed(1)}%`
    );
  }
  p3x.addEventListener('input', calc3);
  p3y.addEventListener('input', calc3);

  calc1();
  calc2();
  calc3();
}
