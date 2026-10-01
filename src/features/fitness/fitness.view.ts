import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderFitnessCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('fitness-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="fit-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Calculadoras de Saúde & Fitness</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="fit-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Segmented Tabs -->
      <div class="segmented-tabs" id="fit-tabs" style="overflow-x: auto;">
        <button class="tab-btn active" data-tab="bmi">IMC</button>
        <button class="tab-btn" data-tab="bmr">Calorias (TDEE/BMR)</button>
        <button class="tab-btn" data-tab="macros">Macronutrientes</button>
        <button class="tab-btn" data-tab="pace">Pace Corrida</button>
        <button class="tab-btn" data-tab="1rm">Carga Máxima (1RM)</button>
        <button class="tab-btn" data-tab="water">Água Diária</button>
      </div>

      <!-- Tab 1: IMC -->
      <div id="tab-fit-bmi" class="fit-pane">
        <div class="form-group">
          <label class="form-label">Peso Corporal (kg)</label>
          <input type="number" id="bmi-weight" class="form-input" value="75" step="0.5" />
        </div>
        <div class="form-group">
          <label class="form-label">Altura (cm)</label>
          <input type="number" id="bmi-height" class="form-input" value="175" />
        </div>
        <div class="result-card">
          <div class="result-header">Classificação Corporal</div>
          <div class="result-row">
            <span class="result-label">Seu IMC</span>
            <span class="result-value highlight" id="res-bmi-val">24,49 kg/m²</span>
          </div>
          <div class="result-row">
            <span class="result-label">Classificação</span>
            <span class="result-value" id="res-bmi-status" style="color: var(--status-success);">Peso Normal</span>
          </div>
          <div class="result-row">
            <span class="result-label">Faixa de Peso Ideal (18.5 - 24.9)</span>
            <span class="result-value" id="res-bmi-range">56.7 kg - 76.3 kg</span>
          </div>
        </div>
      </div>

      <!-- Tab 2: BMR & TDEE -->
      <div id="tab-fit-bmr" class="fit-pane" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Sexo Biológico</label>
            <select id="bmr-gender" class="form-select">
              <option value="m">Masculino</option>
              <option value="f">Feminino</option>
            </select>
          </div>
          <div>
            <label class="form-label">Idade (anos)</label>
            <input type="number" id="bmr-age" class="form-input" value="28" />
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Peso (kg)</label>
            <input type="number" id="bmr-weight" class="form-input" value="75" />
          </div>
          <div>
            <label class="form-label">Altura (cm)</label>
            <input type="number" id="bmr-height" class="form-input" value="175" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Nível de Atividade Física</label>
          <select id="bmr-activity" class="form-select">
            <option value="1.2">Sedentário (pouco ou nenhum exercício)</option>
            <option value="1.375" selected>Leve (exercício 1 a 3 dias/semana)</option>
            <option value="1.55">Moderado (exercício 3 a 5 dias/semana)</option>
            <option value="1.725">Intenso (exercício 6 a 7 dias/semana)</option>
            <option value="1.9">Atleta profissional / trabalho braçal pesado</option>
          </select>
        </div>
        <div class="result-card">
          <div class="result-header">Metabolismo & Gasto Calórico Diário</div>
          <div class="result-row">
            <span class="result-label">Taxa Metabólica Basal (BMR)</span>
            <span class="result-value" id="res-bmr-val">1.720 kcal</span>
          </div>
          <div class="result-row">
            <span class="result-label">Manutenção Diária (TDEE)</span>
            <span class="result-value highlight" id="res-tdee-val">2.365 kcal</span>
          </div>
          <div class="result-row">
            <span class="result-label">Para Perda de Peso (-500 kcal)</span>
            <span class="result-value" id="res-tdee-cut" style="color: var(--status-info);">1.865 kcal</span>
          </div>
          <div class="result-row">
            <span class="result-label">Para Ganho de Massa (+300 kcal)</span>
            <span class="result-value" id="res-tdee-bulk">2.665 kcal</span>
          </div>
        </div>
      </div>

      <!-- Tab 3: Macros -->
      <div id="tab-fit-macros" class="fit-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Meta Calórica Diária (kcal)</label>
          <input type="number" id="macros-calories" class="form-input" value="2000" />
        </div>
        <div class="form-group">
          <label class="form-label">Objetivo de Dieta</label>
          <select id="macros-goal" class="form-select">
            <option value="balanced" selected>Equilibrada (50% Carb / 20% Prot / 30% Gord)</option>
            <option value="high-protein">Hiperproteica (40% Carb / 35% Prot / 25% Gord)</option>
            <option value="low-carb">Low Carb (20% Carb / 40% Prot / 40% Gord)</option>
          </select>
        </div>
        <div class="result-card">
          <div class="result-header">Divisão Diária de Macronutrientes</div>
          <div class="result-row">
            <span class="result-label">Proteínas (4 kcal/g)</span>
            <span class="result-value highlight" id="res-macro-prot">100g (400 kcal)</span>
          </div>
          <div class="result-row">
            <span class="result-label">Carboidratos (4 kcal/g)</span>
            <span class="result-value highlight" id="res-macro-carb">250g (1.000 kcal)</span>
          </div>
          <div class="result-row">
            <span class="result-label">Gorduras Totais (9 kcal/g)</span>
            <span class="result-value highlight" id="res-macro-fat">67g (600 kcal)</span>
          </div>
        </div>
      </div>

      <!-- Tab 4: Pace de Corrida -->
      <div id="tab-fit-pace" class="fit-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Distância Percorrida (km)</label>
          <input type="number" id="pace-dist" class="form-input" value="5" step="0.1" />
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Horas</label>
            <input type="number" id="pace-h" class="form-input" value="0" min="0" />
          </div>
          <div>
            <label class="form-label">Minutos</label>
            <input type="number" id="pace-m" class="form-input" value="27" min="0" max="59" />
          </div>
          <div>
            <label class="form-label">Segundos</label>
            <input type="number" id="pace-s" class="form-input" value="30" min="0" max="59" />
          </div>
        </div>
        <div class="result-card">
          <div class="result-header">Ritmo de Corrida</div>
          <div class="result-row">
            <span class="result-label">Pace Médio</span>
            <span class="result-value highlight" id="res-pace-val">5:30 min/km</span>
          </div>
          <div class="result-row">
            <span class="result-label">Velocidade Média</span>
            <span class="result-value" id="res-speed-val">10,91 km/h</span>
          </div>
        </div>
      </div>

      <!-- Tab 5: 1RM -->
      <div id="tab-fit-1rm" class="fit-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Carga Utilizada (kg)</label>
          <input type="number" id="1rm-weight" class="form-input" value="80" />
        </div>
        <div class="form-group">
          <label class="form-label">Repetições Executadas (1 a 12)</label>
          <input type="number" id="1rm-reps" class="form-input" value="6" min="1" max="15" />
        </div>
        <div class="result-card">
          <div class="result-header">Estimativa de 1RM (Força Máxima)</div>
          <div class="result-row">
            <span class="result-label">Carga Máxima Teórica (Brzycki)</span>
            <span class="result-value highlight" id="res-1rm-val">93,0 kg</span>
          </div>
          <div class="result-row">
            <span class="result-label">85% de 1RM (Faixa de Força)</span>
            <span class="result-value" id="res-1rm-85">79,1 kg</span>
          </div>
          <div class="result-row">
            <span class="result-label">70% de 1RM (Hipertrofia 10-12 reps)</span>
            <span class="result-value" id="res-1rm-70">65,1 kg</span>
          </div>
        </div>
      </div>

      <!-- Tab 6: Água Diária -->
      <div id="tab-fit-water" class="fit-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Seu Peso (kg)</label>
          <input type="number" id="water-weight" class="form-input" value="75" />
        </div>
        <div class="form-group">
          <label class="form-label">Prática de Exercício Físico Diário?</label>
          <select id="water-activity" class="form-select">
            <option value="0">Não (Rotina sedentária - 35ml/kg)</option>
            <option value="500" selected>Sim (30 a 60 min de treino +500ml)</option>
            <option value="1000">Treino Intenso / Clima muito quente (+1000ml)</option>
          </select>
        </div>
        <div class="result-card">
          <div class="result-header">Recomendação de Hidratação</div>
          <div class="result-row">
            <span class="result-label">Total Recomendado</span>
            <span class="result-value highlight" id="res-water-total">3.125 mL / dia</span>
          </div>
          <div class="result-row">
            <span class="result-label">Equivalente em Copos (250 ml)</span>
            <span class="result-value" id="res-water-cups">~ 12,5 copos</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#fit-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#fit-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('fitness-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('fitness-calc'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      container.querySelectorAll('.fit-pane').forEach((p) => {
        (p as HTMLElement).style.display = p.id === `tab-fit-${target}` ? 'block' : 'none';
      });
    });
  });

  // Cálculo IMC
  const bmiW = container.querySelector('#bmi-weight') as HTMLInputElement;
  const bmiH = container.querySelector('#bmi-height') as HTMLInputElement;
  const resBmiVal = container.querySelector('#res-bmi-val') as HTMLElement;
  const resBmiStatus = container.querySelector('#res-bmi-status') as HTMLElement;
  const resBmiRange = container.querySelector('#res-bmi-range') as HTMLElement;

  function calcBmi() {
    const w = parseFloat(bmiW.value) || 0;
    const h = (parseFloat(bmiH.value) || 0) / 100;

    if (h <= 0) return;
    const bmi = w / (h * h);

    resBmiVal.textContent = `${bmi.toFixed(2)} kg/m²`;

    let status = 'Peso Normal';
    let color = 'var(--status-success)';

    if (bmi < 18.5) {
      status = 'Abaixo do Peso';
      color = 'var(--status-warning)';
    } else if (bmi <= 24.9) {
      status = 'Peso Normal';
      color = 'var(--status-success)';
    } else if (bmi <= 29.9) {
      status = 'Sobrepeso';
      color = 'var(--status-warning)';
    } else if (bmi <= 34.9) {
      status = 'Obesidade Grau I';
      color = 'var(--status-danger)';
    } else {
      status = 'Obesidade Grau II / III';
      color = 'var(--status-danger)';
    }

    resBmiStatus.textContent = status;
    resBmiStatus.style.color = color;

    const minIdeal = 18.5 * (h * h);
    const maxIdeal = 24.9 * (h * h);
    resBmiRange.textContent = `${minIdeal.toFixed(1)} kg - ${maxIdeal.toFixed(1)} kg`;

    historyManager.record('fitness-calc', 'Fitness', 'IMC', `${w}kg / ${(h*100).toFixed(0)}cm`, `IMC: ${bmi.toFixed(1)} (${status})`);
  }

  bmiW.addEventListener('input', calcBmi);
  bmiH.addEventListener('input', calcBmi);

  // Cálculo BMR / TDEE
  const bmrG = container.querySelector('#bmr-gender') as HTMLSelectElement;
  const bmrAge = container.querySelector('#bmr-age') as HTMLInputElement;
  const bmrW = container.querySelector('#bmr-weight') as HTMLInputElement;
  const bmrH = container.querySelector('#bmr-height') as HTMLInputElement;
  const bmrAct = container.querySelector('#bmr-activity') as HTMLSelectElement;

  function calcBmr() {
    const isMale = bmrG.value === 'm';
    const age = parseFloat(bmrAge.value) || 25;
    const w = parseFloat(bmrW.value) || 70;
    const h = parseFloat(bmrH.value) || 170;
    const act = parseFloat(bmrAct.value) || 1.2;

    // Fórmula Mifflin-St Jeor
    let bmr = 10 * w + 6.25 * h - 5 * age + (isMale ? 5 : -161);
    const tdee = bmr * act;

    (container.querySelector('#res-bmr-val') as HTMLElement).textContent = `${Math.round(bmr).toLocaleString('pt-BR')} kcal`;
    (container.querySelector('#res-tdee-val') as HTMLElement).textContent = `${Math.round(tdee).toLocaleString('pt-BR')} kcal`;
    (container.querySelector('#res-tdee-cut') as HTMLElement).textContent = `${Math.round(tdee - 500).toLocaleString('pt-BR')} kcal`;
    (container.querySelector('#res-tdee-bulk') as HTMLElement).textContent = `${Math.round(tdee + 300).toLocaleString('pt-BR')} kcal`;
  }

  [bmrG, bmrAge, bmrW, bmrH, bmrAct].forEach((el) => {
    el.addEventListener('input', calcBmr);
    el.addEventListener('change', calcBmr);
  });

  // Cálculo Macros
  const mCal = container.querySelector('#macros-calories') as HTMLInputElement;
  const mGoal = container.querySelector('#macros-goal') as HTMLSelectElement;

  function calcMacros() {
    const cal = parseFloat(mCal.value) || 2000;
    const goal = mGoal.value;

    let pRatio = 0.2;
    let cRatio = 0.5;
    let fRatio = 0.3;

    if (goal === 'high-protein') {
      pRatio = 0.35;
      cRatio = 0.40;
      fRatio = 0.25;
    } else if (goal === 'low-carb') {
      pRatio = 0.40;
      cRatio = 0.20;
      fRatio = 0.40;
    }

    const pG = Math.round((cal * pRatio) / 4);
    const cG = Math.round((cal * cRatio) / 4);
    const fG = Math.round((cal * fRatio) / 9);

    (container.querySelector('#res-macro-prot') as HTMLElement).textContent = `${pG}g (${Math.round(cal * pRatio)} kcal)`;
    (container.querySelector('#res-macro-carb') as HTMLElement).textContent = `${cG}g (${Math.round(cal * cRatio)} kcal)`;
    (container.querySelector('#res-macro-fat') as HTMLElement).textContent = `${fG}g (${Math.round(cal * fRatio)} kcal)`;
  }
  mCal.addEventListener('input', calcMacros);
  mGoal.addEventListener('change', calcMacros);

  // Pace
  const paceD = container.querySelector('#pace-dist') as HTMLInputElement;
  const paceH = container.querySelector('#pace-h') as HTMLInputElement;
  const paceM = container.querySelector('#pace-m') as HTMLInputElement;
  const paceS = container.querySelector('#pace-s') as HTMLInputElement;

  function calcPace() {
    const dist = parseFloat(paceD.value) || 1;
    const totalSec = (parseFloat(paceH.value) || 0) * 3600 + (parseFloat(paceM.value) || 0) * 60 + (parseFloat(paceS.value) || 0);

    if (dist <= 0 || totalSec <= 0) return;

    const secPerKm = totalSec / dist;
    const paceMin = Math.floor(secPerKm / 60);
    const paceSec = Math.round(secPerKm % 60);

    const speedKmh = dist / (totalSec / 3600);

    (container.querySelector('#res-pace-val') as HTMLElement).textContent = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec} min/km`;
    (container.querySelector('#res-speed-val') as HTMLElement).textContent = `${speedKmh.toFixed(2)} km/h`;
  }
  [paceD, paceH, paceM, paceS].forEach((el) => el.addEventListener('input', calcPace));

  // 1RM
  const r1W = container.querySelector('#1rm-weight') as HTMLInputElement;
  const r1R = container.querySelector('#1rm-reps') as HTMLInputElement;

  function calc1rm() {
    const w = parseFloat(r1W.value) || 0;
    const r = parseFloat(r1R.value) || 1;

    // Fórmula Brzycki: w / (1.0278 - 0.0278 * r)
    const max1rm = r === 1 ? w : w / (1.0278 - 0.0278 * r);

    (container.querySelector('#res-1rm-val') as HTMLElement).textContent = `${max1rm.toFixed(1)} kg`;
    (container.querySelector('#res-1rm-85') as HTMLElement).textContent = `${(max1rm * 0.85).toFixed(1)} kg`;
    (container.querySelector('#res-1rm-70') as HTMLElement).textContent = `${(max1rm * 0.70).toFixed(1)} kg`;
  }
  r1W.addEventListener('input', calc1rm);
  r1R.addEventListener('input', calc1rm);

  // Água
  const watW = container.querySelector('#water-weight') as HTMLInputElement;
  const watAct = container.querySelector('#water-activity') as HTMLSelectElement;

  function calcWater() {
    const w = parseFloat(watW.value) || 0;
    const extra = parseFloat(watAct.value) || 0;
    const totalMl = w * 35 + extra;

    (container.querySelector('#res-water-total') as HTMLElement).textContent = `${Math.round(totalMl).toLocaleString('pt-BR')} mL / dia`;
    (container.querySelector('#res-water-cups') as HTMLElement).textContent = `~ ${(totalMl / 250).toFixed(1)} copos`;
  }
  watW.addEventListener('input', calcWater);
  watAct.addEventListener('change', calcWater);

  calcBmi();
  calcBmr();
  calcMacros();
  calcPace();
  calc1rm();
  calcWater();
}
