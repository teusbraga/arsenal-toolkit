import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderEquationsCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('equations-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="eq-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Resolução de Equações</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="eq-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="eq-tabs">
        <button class="tab-btn active" data-tab="second">2º Grau (ax² + bx + c = 0)</button>
        <button class="tab-btn" data-tab="first">1º Grau (ax + b = c)</button>
      </div>

      <!-- Equação de 2º Grau -->
      <div id="tab-second-degree">
        <div style="background: var(--bg-muted); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 18px; margin-bottom: 20px;">
          <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 12px; font-weight: 500;">Defina os coeficientes numéricos:</div>
          <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
            <input type="number" id="eq2-a" class="form-input" value="1" style="width: 70px; text-align: center;" />
            <span style="font-weight: 600;">x² +</span>
            <input type="number" id="eq2-b" class="form-input" value="-5" style="width: 70px; text-align: center;" />
            <span style="font-weight: 600;">x +</span>
            <input type="number" id="eq2-c" class="form-input" value="6" style="width: 70px; text-align: center;" />
            <span style="font-weight: 600;">= 0</span>
          </div>
        </div>

        <div class="result-card">
          <div class="result-header">Passo a Passo e Raízes</div>
          <div class="result-row">
            <span class="result-label">Discriminante (Δ = b² - 4ac)</span>
            <span class="result-value" id="res-eq2-delta">Δ = 1</span>
          </div>
          <div class="result-row">
            <span class="result-label">Raiz x₁</span>
            <span class="result-value highlight" id="res-eq2-x1">x₁ = 3</span>
          </div>
          <div class="result-row">
            <span class="result-label">Raiz x₂</span>
            <span class="result-value highlight" id="res-eq2-x2">x₂ = 2</span>
          </div>
          <div class="result-row">
            <span class="result-label">Vértice da Parábola (Xv, Yv)</span>
            <span class="result-value" id="res-eq2-vertex">(2.5, -0.25)</span>
          </div>
        </div>
      </div>

      <!-- Equação de 1º Grau -->
      <div id="tab-first-degree" style="display: none;">
        <div style="background: var(--bg-muted); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 18px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="number" id="eq1-a" class="form-input" value="3" style="width: 70px; text-align: center;" />
            <span style="font-weight: 600;">x +</span>
            <input type="number" id="eq1-b" class="form-input" value="5" style="width: 70px; text-align: center;" />
            <span style="font-weight: 600;">=</span>
            <input type="number" id="eq1-c" class="form-input" value="20" style="width: 70px; text-align: center;" />
          </div>
        </div>

        <div class="result-card">
          <div class="result-header">Solução</div>
          <div class="result-row">
            <span class="result-label">Valor de x</span>
            <span class="result-value highlight" id="res-eq1-x">x = 5</span>
          </div>
          <div class="result-row">
            <span class="result-label">Passo a passo</span>
            <span class="result-value" id="res-eq1-steps">x = (20 - 5) / 3</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#eq-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#eq-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('equations-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('equations-calc'));
  });

  const tabSecond = container.querySelector('#tab-second-degree') as HTMLElement;
  const tabFirst = container.querySelector('#tab-first-degree') as HTMLElement;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isSec = tab.getAttribute('data-tab') === 'second';
      tabSecond.style.display = isSec ? 'block' : 'none';
      tabFirst.style.display = isSec ? 'none' : 'block';
    });
  });

  // 2º Grau
  const inA = container.querySelector('#eq2-a') as HTMLInputElement;
  const inB = container.querySelector('#eq2-b') as HTMLInputElement;
  const inC = container.querySelector('#eq2-c') as HTMLInputElement;
  const resDelta = container.querySelector('#res-eq2-delta') as HTMLElement;
  const resX1 = container.querySelector('#res-eq2-x1') as HTMLElement;
  const resX2 = container.querySelector('#res-eq2-x2') as HTMLElement;
  const resVertex = container.querySelector('#res-eq2-vertex') as HTMLElement;

  function calc2nd() {
    const a = parseFloat(inA.value) || 0;
    const b = parseFloat(inB.value) || 0;
    const c = parseFloat(inC.value) || 0;

    if (a === 0) {
      resDelta.textContent = 'Não é equação de 2º grau (a = 0)';
      resX1.textContent = '-';
      resX2.textContent = '-';
      resVertex.textContent = '-';
      return;
    }

    const delta = b * b - 4 * a * c;
    resDelta.textContent = `Δ = ${delta.toFixed(2)}`;

    const xv = -b / (2 * a);
    const yv = -delta / (4 * a);
    resVertex.textContent = `(${xv.toFixed(2)}, ${yv.toFixed(2)})`;

    if (delta > 0) {
      const x1 = (-b + Math.sqrt(delta)) / (2 * a);
      const x2 = (-b - Math.sqrt(delta)) / (2 * a);
      resX1.textContent = `x₁ = ${x1.toFixed(3)}`;
      resX2.textContent = `x₂ = ${x2.toFixed(3)}`;
    } else if (delta === 0) {
      const x = -b / (2 * a);
      resX1.textContent = `x = ${x.toFixed(3)} (raiz dupla)`;
      resX2.textContent = `x = ${x.toFixed(3)}`;
    } else {
      const real = (-b / (2 * a)).toFixed(2);
      const imag = (Math.sqrt(-delta) / (2 * a)).toFixed(2);
      resX1.textContent = `${real} + ${imag}i`;
      resX2.textContent = `${real} - ${imag}i (complexas)`;
    }

    historyManager.record(
      'equations-calc',
      'Calculadoras',
      'Equação 2º Grau',
      `${a}x² + ${b}x + ${c} = 0`,
      `Δ=${delta.toFixed(1)}`
    );
  }

  inA.addEventListener('input', calc2nd);
  inB.addEventListener('input', calc2nd);
  inC.addEventListener('input', calc2nd);

  // 1º Grau
  const in1A = container.querySelector('#eq1-a') as HTMLInputElement;
  const in1B = container.querySelector('#eq1-b') as HTMLInputElement;
  const in1C = container.querySelector('#eq1-c') as HTMLInputElement;
  const res1X = container.querySelector('#res-eq1-x') as HTMLElement;
  const res1Steps = container.querySelector('#res-eq1-steps') as HTMLElement;

  function calc1st() {
    const a = parseFloat(in1A.value) || 0;
    const b = parseFloat(in1B.value) || 0;
    const c = parseFloat(in1C.value) || 0;

    if (a === 0) {
      res1X.textContent = b === c ? 'Infinitas soluções' : 'Sem solução';
      res1Steps.textContent = 'Indeterminado';
      return;
    }

    const x = (c - b) / a;
    res1X.textContent = `x = ${x.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}`;
    res1Steps.textContent = `x = (${c} - ${b}) / ${a} = ${(c - b)} / ${a}`;
  }

  in1A.addEventListener('input', calc1st);
  in1B.addEventListener('input', calc1st);
  in1C.addEventListener('input', calc1st);

  calc2nd();
  calc1st();
}
