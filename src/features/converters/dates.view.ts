import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderDatesCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('dates-calc');

  const today = new Date().toISOString().split('T')[0];
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="date-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Calculadora de Datas & Dias Úteis</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="date-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="date-tabs">
        <button class="tab-btn active" data-tab="diff">Diferença entre Datas</button>
        <button class="tab-btn" data-tab="add">Somar / Subtrair Dias</button>
      </div>

      <!-- Diferença entre datas -->
      <div id="tab-date-diff">
        <div class="form-group">
          <label class="form-label">Data Inicial</label>
          <input type="date" id="date-start" class="form-input" value="${today}" />
        </div>

        <div class="form-group">
          <label class="form-label">Data Final</label>
          <input type="date" id="date-end" class="form-input" value="${nextMonth}" />
        </div>

        <div class="result-card">
          <div class="result-header">Intervalo Calculado</div>
          <div class="result-row">
            <span class="result-label">Dias Corridos Totais</span>
            <span class="result-value highlight" id="res-total-days">30 dias</span>
          </div>
          <div class="result-row">
            <span class="result-label">Dias Úteis (Seg a Sex)</span>
            <span class="result-value highlight" id="res-business-days">22 dias úteis</span>
          </div>
          <div class="result-row">
            <span class="result-label">Semanas Completas</span>
            <span class="result-value" id="res-weeks">4 semanas e 2 dias</span>
          </div>
        </div>
      </div>

      <!-- Adicionar / Subtrair dias -->
      <div id="tab-date-add" style="display: none;">
        <div class="form-group">
          <label class="form-label">Data Base</label>
          <input type="date" id="add-base-date" class="form-input" value="${today}" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Quantidade</label>
            <input type="number" id="add-days-qty" class="form-input" value="15" />
          </div>
          <div>
            <label class="form-label">Tipo de Dias</label>
            <select id="add-days-type" class="form-select">
              <option value="calendar">Corridos</option>
              <option value="business">Úteis</option>
            </select>
          </div>
        </div>

        <div class="result-card">
          <div class="result-header">Data Resultante</div>
          <div class="result-row">
            <span class="result-label">Data Final</span>
            <span class="result-value highlight" id="res-calculated-date">--/--/----</span>
          </div>
          <div class="result-row">
            <span class="result-label">Dia da Semana</span>
            <span class="result-value" id="res-weekday-name">---</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#date-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#date-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('dates-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('dates-calc'));
  });

  const tabDiff = container.querySelector('#tab-date-diff') as HTMLElement;
  const tabAdd = container.querySelector('#tab-date-add') as HTMLElement;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isDiff = tab.getAttribute('data-tab') === 'diff';
      tabDiff.style.display = isDiff ? 'block' : 'none';
      tabAdd.style.display = isDiff ? 'none' : 'block';
    });
  });

  // Cálculo de Diferença
  const startInput = container.querySelector('#date-start') as HTMLInputElement;
  const endInput = container.querySelector('#date-end') as HTMLInputElement;
  const totalDaysEl = container.querySelector('#res-total-days') as HTMLElement;
  const businessDaysEl = container.querySelector('#res-business-days') as HTMLElement;
  const weeksEl = container.querySelector('#res-weeks') as HTMLElement;

  function calcDiff() {
    const d1 = new Date(startInput.value + 'T00:00:00');
    const d2 = new Date(endInput.value + 'T00:00:00');

    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return;

    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const totalDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Contagem de dias úteis
    let businessDays = 0;
    const cur = new Date(Math.min(d1.getTime(), d2.getTime()));
    const max = new Date(Math.max(d1.getTime(), d2.getTime()));

    while (cur < max) {
      cur.setDate(cur.getDate() + 1);
      const dayOfWeek = cur.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }

    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;

    totalDaysEl.textContent = `${totalDays} dias`;
    businessDaysEl.textContent = `${businessDays} dias úteis`;
    weeksEl.textContent = `${weeks} semanas ${remDays > 0 ? `e ${remDays} dias` : ''}`;

    historyManager.record(
      'dates-calc',
      'Conversores',
      'Intervalo de Datas',
      `${startInput.value} até ${endInput.value}`,
      `${totalDays} dias (${businessDays} úteis)`
    );
  }

  startInput.addEventListener('change', calcDiff);
  endInput.addEventListener('change', calcDiff);

  // Cálculo de Adicionar Dias
  const addBaseInput = container.querySelector('#add-base-date') as HTMLInputElement;
  const addQtyInput = container.querySelector('#add-days-qty') as HTMLInputElement;
  const addTypeSelect = container.querySelector('#add-days-type') as HTMLSelectElement;
  const resDateEl = container.querySelector('#res-calculated-date') as HTMLElement;
  const resWeekdayEl = container.querySelector('#res-weekday-name') as HTMLElement;

  const weekdays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

  function calcAdd() {
    const base = new Date(addBaseInput.value + 'T00:00:00');
    const qty = parseInt(addQtyInput.value) || 0;
    const type = addTypeSelect.value;

    if (isNaN(base.getTime())) return;

    const target = new Date(base);

    if (type === 'calendar') {
      target.setDate(target.getDate() + qty);
    } else {
      let added = 0;
      const step = qty >= 0 ? 1 : -1;
      while (added < Math.abs(qty)) {
        target.setDate(target.getDate() + step);
        const day = target.getDay();
        if (day !== 0 && day !== 6) {
          added++;
        }
      }
    }

    resDateEl.textContent = target.toLocaleDateString('pt-BR');
    resWeekdayEl.textContent = weekdays[target.getDay()];
  }

  addBaseInput.addEventListener('change', calcAdd);
  addQtyInput.addEventListener('input', calcAdd);
  addTypeSelect.addEventListener('change', calcAdd);

  calcDiff();
  calcAdd();
}
