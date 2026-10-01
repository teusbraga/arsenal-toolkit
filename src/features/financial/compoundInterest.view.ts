import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderCompoundInterest(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('compound-interest');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="ci-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Simulador de Juros Compostos</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="ci-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Aporte Inicial</label>
        <div class="input-wrapper">
          <span class="input-prefix">R$</span>
          <input type="number" id="ci-initial" class="form-input has-prefix" value="5000" step="500" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Aporte Mensal Recorrente</label>
        <div class="input-wrapper">
          <span class="input-prefix">R$</span>
          <input type="number" id="ci-monthly" class="form-input has-prefix" value="500" step="50" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;" class="form-group">
        <div>
          <label class="form-label">Taxa de Juros</label>
          <input type="number" id="ci-rate" class="form-input" value="10" step="0.1" />
        </div>
        <div>
          <label class="form-label">Periodicidade</label>
          <select id="ci-rate-type" class="form-select">
            <option value="year" selected>% ao ano</option>
            <option value="month">% ao mês</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 140px; gap: 8px;" class="form-group">
        <div>
          <label class="form-label">Período de Investimento</label>
          <input type="number" id="ci-period" class="form-input" value="10" min="1" />
        </div>
        <div>
          <label class="form-label">Unidade</label>
          <select id="ci-period-type" class="form-select">
            <option value="years" selected>Anos</option>
            <option value="months">Meses</option>
          </select>
        </div>
      </div>

      <div class="result-card">
        <div class="result-header">Resultado da Simulação</div>
        <div class="result-row">
          <span class="result-label">Patrimônio Total Acumulado</span>
          <span class="result-value highlight" id="res-ci-total" style="font-size: 1.25rem;">R$ 112.580,00</span>
        </div>
        <div class="result-row">
          <span class="result-label">Total Aportado do Próprio Bolso</span>
          <span class="result-value" id="res-ci-invested">R$ 65.000,00</span>
        </div>
        <div class="result-row">
          <span class="result-label">Total Ganho Apenas em Juros</span>
          <span class="result-value highlight" id="res-ci-interest" style="color: var(--status-success);">+ R$ 47.580,00</span>
        </div>
      </div>

      <!-- Tabela Anual -->
      <div style="margin-top: 24px;">
        <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 10px;">Evolução Anual do Patrimônio</h3>
        <div style="max-height: 220px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem; text-align: right;">
            <thead style="background: var(--bg-muted); position: sticky; top: 0;">
              <tr>
                <th style="padding: 8px 10px; text-align: left;">Ano</th>
                <th style="padding: 8px 10px;">Total Investido</th>
                <th style="padding: 8px 10px;">Juros no Ano</th>
                <th style="padding: 8px 10px;">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody id="ci-evolution-body"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#ci-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#ci-btn-fav') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('compound-interest');
    btnFav.classList.toggle('active', store.getState().favorites.includes('compound-interest'));
  });

  const inInitial = container.querySelector('#ci-initial') as HTMLInputElement;
  const inMonthly = container.querySelector('#ci-monthly') as HTMLInputElement;
  const inRate = container.querySelector('#ci-rate') as HTMLInputElement;
  const inRateType = container.querySelector('#ci-rate-type') as HTMLSelectElement;
  const inPeriod = container.querySelector('#ci-period') as HTMLInputElement;
  const inPeriodType = container.querySelector('#ci-period-type') as HTMLSelectElement;

  const resTotal = container.querySelector('#res-ci-total') as HTMLElement;
  const resInvested = container.querySelector('#res-ci-invested') as HTMLElement;
  const resInterest = container.querySelector('#res-ci-interest') as HTMLElement;
  const tableBody = container.querySelector('#ci-evolution-body') as HTMLElement;

  function calculate() {
    const initial = parseFloat(inInitial.value) || 0;
    const monthly = parseFloat(inMonthly.value) || 0;
    const rawRate = parseFloat(inRate.value) || 0;
    const isYearRate = inRateType.value === 'year';
    const period = parseInt(inPeriod.value) || 1;
    const isYears = inPeriodType.value === 'years';

    // Taxa mensal equivalente
    const monthlyRate = isYearRate ? Math.pow(1 + rawRate / 100, 1 / 12) - 1 : rawRate / 100;
    const totalMonths = isYears ? period * 12 : period;

    let balance = initial;
    let invested = initial;
    const annualRows: Array<{ year: number; invested: number; interestInYear: number; balance: number }> = [];

    let prevYearBalance = initial;

    for (let m = 1; m <= totalMonths; m++) {
      balance = balance * (1 + monthlyRate) + monthly;
      invested += monthly;

      if (m % 12 === 0 || m === totalMonths) {
        const yearNum = Math.ceil(m / 12);
        const interestInYear = balance - prevYearBalance - (m % 12 === 0 ? monthly * 12 : monthly * (m % 12));
        annualRows.push({
          year: yearNum,
          invested,
          interestInYear: Math.max(0, interestInYear),
          balance
        });
        prevYearBalance = balance;
      }
    }

    const totalInterest = Math.max(0, balance - invested);

    resTotal.textContent = `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    resInvested.textContent = `R$ ${invested.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    resInterest.textContent = `+ R$ ${totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    tableBody.innerHTML = annualRows.map((r) => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 8px 10px; text-align: left; font-weight: 600;">Ano ${r.year}</td>
        <td style="padding: 8px 10px; color: var(--text-secondary);">R$ ${Math.round(r.invested).toLocaleString('pt-BR')}</td>
        <td style="padding: 8px 10px; color: var(--status-success);">R$ ${Math.round(r.interestInYear).toLocaleString('pt-BR')}</td>
        <td style="padding: 8px 10px; font-weight: 700; font-family: var(--font-mono);">R$ ${Math.round(r.balance).toLocaleString('pt-BR')}</td>
      </tr>
    `).join('');

    historyManager.record(
      'compound-interest',
      'Financeiro',
      'Juros Compostos',
      `R$ ${initial} inicial + R$ ${monthly}/mês (${period} ${isYears ? 'anos' : 'meses'})`,
      `Final: R$ ${Math.round(balance).toLocaleString('pt-BR')} (+R$ ${Math.round(totalInterest).toLocaleString('pt-BR')})`
    );
  }

  [inInitial, inMonthly, inRate, inRateType, inPeriod, inPeriodType].forEach((el) => {
    el.addEventListener('input', calculate);
    el.addEventListener('change', calculate);
  });

  calculate();
}
