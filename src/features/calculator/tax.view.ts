import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderTaxCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('tax-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <!-- Header da Ferramenta -->
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="tax-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Calculadora de Impostos</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="tax-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Segmented Tabs (conforme mockup) -->
      <div class="segmented-tabs" id="tax-tabs">
        <button class="tab-btn active" data-tab="irpf">IRPF</button>
        <button class="tab-btn" data-tab="inss">INSS</button>
        <button class="tab-btn" data-tab="piscofins">PIS/COFINS</button>
        <button class="tab-btn" data-tab="simples">Simples Nacional</button>
      </div>

      <!-- Formulário -->
      <div id="tax-form-content">
        <div class="form-group">
          <label class="form-label" for="tax-gross-income">Renda mensal (bruta)</label>
          <div class="input-wrapper">
            <span class="input-prefix">R$</span>
            <input type="number" id="tax-gross-income" class="form-input has-prefix" value="10000" placeholder="0,00" step="100" />
          </div>
        </div>

        <div class="form-group" id="group-dependents">
          <label class="form-label" for="tax-dependents">Dependentes</label>
          <select id="tax-dependents" class="form-select">
            <option value="0" selected>0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4 ou mais</option>
          </select>
        </div>

        <button class="btn-primary" id="btn-run-tax">Calcular</button>
      </div>

      <!-- Card de Resultado (conforme mockup) -->
      <div class="result-card" id="tax-result-card">
        <div class="result-header">Resultado</div>
        <div class="result-row">
          <span class="result-label">Alíquota efetiva</span>
          <span class="result-value" id="res-effective-rate">11,0%</span>
        </div>
        <div class="result-row">
          <span class="result-label">Imposto a pagar (mês)</span>
          <span class="result-value" id="res-tax-amount">R$ 1.100,00</span>
        </div>
        <div class="result-row">
          <span class="result-label">Salário líquido (aprox.)</span>
          <span class="result-value highlight" id="res-net-amount">R$ 8.900,00</span>
        </div>
      </div>
    </div>
  `;

  // Elementos
  const btnBack = container.querySelector('#tax-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#tax-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');
  const inputIncome = container.querySelector('#tax-gross-income') as HTMLInputElement;
  const selectDependents = container.querySelector('#tax-dependents') as HTMLSelectElement;
  const btnCalc = container.querySelector('#btn-run-tax') as HTMLButtonElement;
  const resRate = container.querySelector('#res-effective-rate') as HTMLElement;
  const resTax = container.querySelector('#res-tax-amount') as HTMLElement;
  const resNet = container.querySelector('#res-net-amount') as HTMLElement;

  let currentTab = 'irpf';

  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  btnFav.addEventListener('click', () => {
    store.toggleFavorite('tax-calc');
    const updated = store.getState().favorites.includes('tax-calc');
    btnFav.classList.toggle('active', updated);
    btnFav.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${updated ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    `;
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentTab = tab.getAttribute('data-tab') || 'irpf';
      calculate();
    });
  });

  function calculate() {
    const income = parseFloat(inputIncome.value) || 0;
    const dependents = parseInt(selectDependents.value) || 0;

    let tax = 0;
    let effectiveRate = 0;
    let net = income;

    if (currentTab === 'irpf') {
      // Cálculo IRPF 2024/2026 com dedução de R$ 189,59 por dependente
      const baseCalc = Math.max(0, income - (dependents * 189.59));
      if (baseCalc <= 2259.20) {
        tax = 0;
      } else if (baseCalc <= 2826.65) {
        tax = baseCalc * 0.075 - 169.44;
      } else if (baseCalc <= 3751.05) {
        tax = baseCalc * 0.15 - 381.44;
      } else if (baseCalc <= 4664.68) {
        tax = baseCalc * 0.225 - 662.77;
      } else {
        tax = baseCalc * 0.275 - 896.00;
      }
    } else if (currentTab === 'inss') {
      // INSS Progressivo
      if (income <= 1412.00) {
        tax = income * 0.075;
      } else if (income <= 2666.68) {
        tax = 1412 * 0.075 + (income - 1412) * 0.09;
      } else if (income <= 4000.03) {
        tax = 1412 * 0.075 + (2666.68 - 1412) * 0.09 + (income - 2666.68) * 0.12;
      } else if (income <= 7786.02) {
        tax = 1412 * 0.075 + (2666.68 - 1412) * 0.09 + (4000.03 - 2666.68) * 0.12 + (income - 4000.03) * 0.14;
      } else {
        tax = 908.86; // Teto do INSS
      }
    } else if (currentTab === 'piscofins') {
      // Regime cumulativo padrão (PIS 0.65% + COFINS 3.00% = 3.65%)
      tax = income * 0.0365;
    } else if (currentTab === 'simples') {
      // Anexo III padrão (Serviços) aprox 6%
      tax = income * 0.06;
    }

    tax = Math.max(0, tax);
    effectiveRate = income > 0 ? (tax / income) * 100 : 0;
    net = Math.max(0, income - tax);

    resRate.textContent = `${effectiveRate.toFixed(1)}%`;
    resTax.textContent = `R$ ${tax.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    resNet.textContent = `R$ ${net.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Grava no histórico
    historyManager.record(
      'tax-calc',
      'Calculadoras',
      `Impostos (${currentTab.toUpperCase()})`,
      `R$ ${income.toLocaleString('pt-BR')} (Dep: ${dependents})`,
      `Imposto: R$ ${tax.toFixed(2)} (${effectiveRate.toFixed(1)}%)`,
      { income, tax, net, effectiveRate, tab: currentTab }
    );
  }

  btnCalc.addEventListener('click', calculate);
  inputIncome.addEventListener('input', calculate);
  selectDependents.addEventListener('change', calculate);

  // Executa o cálculo inicial
  calculate();
}
