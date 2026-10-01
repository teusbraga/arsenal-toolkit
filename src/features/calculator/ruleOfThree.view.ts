import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderRuleOfThree(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('rule-of-three');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="r3-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Regra de Três Simples</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="r3-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="r3-tabs">
        <button class="tab-btn active" data-type="direct">Diretamente Proporcional</button>
        <button class="tab-btn" data-type="inverse">Inversamente Proporcional</button>
      </div>

      <div style="background: var(--bg-muted); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 24px; margin-bottom: 20px;">
        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; margin-bottom: 16px;">
          <input type="number" id="r3-a" class="form-input" value="10" placeholder="Valor A" />
          <span style="font-weight: bold; color: var(--text-secondary);">está para</span>
          <input type="number" id="r3-b" class="form-input" value="50" placeholder="Valor B" />
        </div>

        <div style="text-align: center; color: var(--text-tertiary); font-size: 0.82rem; margin: 8px 0;">assim como</div>

        <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center;">
          <input type="number" id="r3-c" class="form-input" value="20" placeholder="Valor C" />
          <span style="font-weight: bold; color: var(--text-secondary);">está para</span>
          <div style="height: 44px; background: var(--bg-surface); border: 2px solid var(--border-focus); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: var(--font-mono); font-size: 1.15rem; color: var(--text-main);" id="r3-x">
            100
          </div>
        </div>
      </div>

      <div class="result-card">
        <div class="result-header">Fórmula Explicada</div>
        <div class="result-row">
          <span class="result-label">Expressão</span>
          <span class="result-value" id="r3-formula">X = (B × C) / A</span>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#r3-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#r3-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');
  const inputA = container.querySelector('#r3-a') as HTMLInputElement;
  const inputB = container.querySelector('#r3-b') as HTMLInputElement;
  const inputC = container.querySelector('#r3-c') as HTMLInputElement;
  const outX = container.querySelector('#r3-x') as HTMLElement;
  const outFormula = container.querySelector('#r3-formula') as HTMLElement;

  let isInverse = false;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('rule-of-three');
    btnFav.classList.toggle('active', store.getState().favorites.includes('rule-of-three'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      isInverse = tab.getAttribute('data-type') === 'inverse';
      calculate();
    });
  });

  function calculate() {
    const a = parseFloat(inputA.value) || 0;
    const b = parseFloat(inputB.value) || 0;
    const c = parseFloat(inputC.value) || 0;

    let x = 0;
    if (a !== 0) {
      if (!isInverse) {
        // Direta: X = (B * C) / A
        x = (b * c) / a;
        outFormula.textContent = `X = (${b} × ${c}) / ${a}`;
      } else {
        // Inversa: X = (A * B) / C
        x = c !== 0 ? (a * b) / c : 0;
        outFormula.textContent = `X = (${a} × ${b}) / ${c}`;
      }
    }

    outX.textContent = x.toLocaleString('pt-BR', { maximumFractionDigits: 4 });

    historyManager.record(
      'rule-of-three',
      'Calculadoras',
      `Regra de 3 (${isInverse ? 'Inversa' : 'Direta'})`,
      `${a} : ${b} = ${c} : X`,
      `X = ${x}`
    );
  }

  inputA.addEventListener('input', calculate);
  inputB.addEventListener('input', calculate);
  inputC.addEventListener('input', calculate);
  calculate();
}
