import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export function renderFractionsCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('fractions-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="frac-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Frações, MDC e MMC</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="frac-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Segmented Tabs -->
      <div class="segmented-tabs" id="frac-tabs">
        <button class="tab-btn active" data-tab="operations">Operações</button>
        <button class="tab-btn" data-tab="simplify">Simplificar</button>
        <button class="tab-btn" data-tab="mdc-mmc">MDC & MMC</button>
      </div>

      <!-- Tab 1: Operações -->
      <div id="tab-operations" class="tab-pane">
        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; background: var(--bg-muted); padding: 20px; border-radius: var(--radius-sm); margin-bottom: 20px;">
          <!-- Fração 1 -->
          <div style="display: flex; flex-direction: column; width: 70px; gap: 4px;">
            <input type="number" id="f1-num" class="form-input" value="3" style="text-align: center;" />
            <div style="height: 2px; background: var(--border-focus);"></div>
            <input type="number" id="f1-den" class="form-input" value="4" style="text-align: center;" />
          </div>

          <!-- Operador -->
          <select id="frac-op" class="form-select" style="width: 60px; text-align: center; font-weight: bold; font-size: 1.1rem;">
            <option value="+">+</option>
            <option value="-">−</option>
            <option value="*">×</option>
            <option value="/">÷</option>
          </select>

          <!-- Fração 2 -->
          <div style="display: flex; flex-direction: column; width: 70px; gap: 4px;">
            <input type="number" id="f2-num" class="form-input" value="2" style="text-align: center;" />
            <div style="height: 2px; background: var(--border-focus);"></div>
            <input type="number" id="f2-den" class="form-input" value="5" style="text-align: center;" />
          </div>

          <span style="font-size: 1.4rem; font-weight: bold;">=</span>

          <!-- Resultado -->
          <div style="display: flex; flex-direction: column; width: 70px; gap: 4px; align-items: center;">
            <div id="res-f-num" style="font-weight: 700; font-size: 1.2rem; font-family: var(--font-mono);">23</div>
            <div style="height: 2px; width: 100%; background: var(--border-focus);"></div>
            <div id="res-f-den" style="font-weight: 700; font-size: 1.2rem; font-family: var(--font-mono);">20</div>
          </div>
        </div>

        <div class="result-card">
          <div class="result-header">Detalhes do Resultado</div>
          <div class="result-row">
            <span class="result-label">Formato Decimal</span>
            <span class="result-value" id="res-f-decimal">1,15</span>
          </div>
          <div class="result-row">
            <span class="result-label">Fração Mista</span>
            <span class="result-value" id="res-f-mixed">1 e 3/20</span>
          </div>
        </div>
      </div>

      <!-- Tab 2: Simplificar -->
      <div id="tab-simplify" class="tab-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Numerador</label>
          <input type="number" id="sim-num" class="form-input" value="48" />
        </div>
        <div class="form-group">
          <label class="form-label">Denominador</label>
          <input type="number" id="sim-den" class="form-input" value="64" />
        </div>
        <div class="result-card">
          <div class="result-header">Fração Irredutível</div>
          <div class="result-row">
            <span class="result-label">Forma Simplificada</span>
            <span class="result-value highlight" id="sim-res">3 / 4</span>
          </div>
          <div class="result-row">
            <span class="result-label">MDC Usado para Simplificar</span>
            <span class="result-value" id="sim-mdc">16</span>
          </div>
        </div>
      </div>

      <!-- Tab 3: MDC & MMC -->
      <div id="tab-mdc-mmc" class="tab-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Números (separados por vírgula ou espaço)</label>
          <input type="text" id="mmc-input" class="form-input" value="12, 18, 24" placeholder="Ex: 12, 18, 24" />
        </div>
        <div class="result-card">
          <div class="result-header">Resultados</div>
          <div class="result-row">
            <span class="result-label">MDC (Maior Divisor Comum)</span>
            <span class="result-value highlight" id="mdc-res">6</span>
          </div>
          <div class="result-row">
            <span class="result-label">MMC (Mínimo Múltiplo Comum)</span>
            <span class="result-value highlight" id="mmc-res">72</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#frac-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#frac-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('fractions-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('fractions-calc'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      container.querySelectorAll('.tab-pane').forEach((p) => {
        (p as HTMLElement).style.display = p.id === `tab-${target}` ? 'block' : 'none';
      });
    });
  });

  // Operações
  const f1Num = container.querySelector('#f1-num') as HTMLInputElement;
  const f1Den = container.querySelector('#f1-den') as HTMLInputElement;
  const f2Num = container.querySelector('#f2-num') as HTMLInputElement;
  const f2Den = container.querySelector('#f2-den') as HTMLInputElement;
  const fOp = container.querySelector('#frac-op') as HTMLSelectElement;

  const resNum = container.querySelector('#res-f-num') as HTMLElement;
  const resDen = container.querySelector('#res-f-den') as HTMLElement;
  const resDec = container.querySelector('#res-f-decimal') as HTMLElement;
  const resMixed = container.querySelector('#res-f-mixed') as HTMLElement;

  function calcOperations() {
    const n1 = parseInt(f1Num.value) || 0;
    const d1 = parseInt(f1Den.value) || 1;
    const n2 = parseInt(f2Num.value) || 0;
    const d2 = parseInt(f2Den.value) || 1;
    const op = fOp.value;

    let rNum = 0;
    let rDen = 1;

    if (op === '+') {
      rNum = n1 * d2 + n2 * d1;
      rDen = d1 * d2;
    } else if (op === '-') {
      rNum = n1 * d2 - n2 * d1;
      rDen = d1 * d2;
    } else if (op === '*') {
      rNum = n1 * n2;
      rDen = d1 * d2;
    } else if (op === '/') {
      rNum = n1 * d2;
      rDen = d1 * n2;
    }

    if (rDen < 0) {
      rNum = -rNum;
      rDen = -rDen;
    }

    const divisor = gcd(rNum, rDen);
    const simpNum = rNum / divisor;
    const simpDen = rDen / divisor;

    resNum.textContent = String(simpNum);
    resDen.textContent = String(simpDen);

    const decimal = simpNum / simpDen;
    resDec.textContent = decimal.toLocaleString('pt-BR', { maximumFractionDigits: 4 });

    const whole = Math.floor(Math.abs(simpNum) / simpDen);
    const rem = Math.abs(simpNum) % simpDen;
    if (whole > 0 && rem > 0) {
      resMixed.textContent = `${simpNum < 0 ? '-' : ''}${whole} e ${rem}/${simpDen}`;
    } else {
      resMixed.textContent = 'Inteiro ou impróprio exato';
    }

    historyManager.record(
      'fractions-calc',
      'Calculadoras',
      'Operação com Frações',
      `${n1}/${d1} ${op} ${n2}/${d2}`,
      `${simpNum}/${simpDen} (${decimal.toFixed(2)})`
    );
  }

  [f1Num, f1Den, f2Num, f2Den, fOp].forEach((el) => {
    el.addEventListener('input', calcOperations);
    el.addEventListener('change', calcOperations);
  });

  // Simplificação
  const simNumInput = container.querySelector('#sim-num') as HTMLInputElement;
  const simDenInput = container.querySelector('#sim-den') as HTMLInputElement;
  const simRes = container.querySelector('#sim-res') as HTMLElement;
  const simMdc = container.querySelector('#sim-mdc') as HTMLElement;

  function calcSimplify() {
    const num = parseInt(simNumInput.value) || 0;
    const den = parseInt(simDenInput.value) || 1;
    const divisor = gcd(num, den);
    simRes.textContent = `${num / divisor} / ${den / divisor}`;
    simMdc.textContent = String(divisor);
  }
  simNumInput.addEventListener('input', calcSimplify);
  simDenInput.addEventListener('input', calcSimplify);

  // MDC e MMC
  const mmcInput = container.querySelector('#mmc-input') as HTMLInputElement;
  const mdcRes = container.querySelector('#mdc-res') as HTMLElement;
  const mmcRes = container.querySelector('#mmc-res') as HTMLElement;

  function calcMdcMmc() {
    const nums = mmcInput.value
      .split(/[,;\s]+/)
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (nums.length < 2) {
      mdcRes.textContent = '-';
      mmcRes.textContent = '-';
      return;
    }

    let currentMdc = nums[0];
    let currentMmc = nums[0];

    for (let i = 1; i < nums.length; i++) {
      currentMdc = gcd(currentMdc, nums[i]);
      currentMmc = lcm(currentMmc, nums[i]);
    }

    mdcRes.textContent = String(currentMdc);
    mmcRes.textContent = String(currentMmc);
  }
  mmcInput.addEventListener('input', calcMdcMmc);

  calcOperations();
  calcSimplify();
  calcMdcMmc();
}
