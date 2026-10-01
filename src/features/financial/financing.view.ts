import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderFinancingCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('financing-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="fin-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Simulador de Financiamento (SAC vs PRICE)</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="fin-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Valor Total do Bem (Imóvel ou Veículo)</label>
        <div class="input-wrapper">
          <span class="input-prefix">R$</span>
          <input type="number" id="fin-total-val" class="form-input has-prefix" value="350000" step="5000" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Valor da Entrada</label>
        <div class="input-wrapper">
          <span class="input-prefix">R$</span>
          <input type="number" id="fin-down-payment" class="form-input has-prefix" value="70000" step="5000" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" class="form-group">
        <div>
          <label class="form-label">Taxa de Juros Anual (% a.a.)</label>
          <input type="number" id="fin-interest-rate" class="form-input" value="10.5" step="0.1" />
        </div>
        <div>
          <label class="form-label">Prazo (Meses)</label>
          <input type="number" id="fin-term-months" class="form-input" value="360" step="12" />
        </div>
      </div>

      <!-- Comparativo Lado a Lado SAC vs Price -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 24px;">
        <!-- Tabela SAC -->
        <div class="result-card" style="margin-top: 0; border-top: 3px solid var(--text-main);">
          <div class="result-header">Tabela SAC (Decrescente)</div>
          <div class="result-row">
            <span class="result-label">1ª Parcela</span>
            <span class="result-value highlight" id="sac-p1">R$ 3.120,00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Última Parcela</span>
            <span class="result-value" id="sac-plast">R$ 785,00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Total Pago</span>
            <span class="result-value" id="sac-total">R$ 702.000,00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Juros Totais</span>
            <span class="result-value" id="sac-interest" style="color: var(--status-warning);">R$ 422.000,00</span>
          </div>
        </div>

        <!-- Tabela PRICE -->
        <div class="result-card" style="margin-top: 0; border-top: 3px solid var(--text-secondary);">
          <div class="result-header">Tabela PRICE (Fixa)</div>
          <div class="result-row">
            <span class="result-label">Parcela Fixa</span>
            <span class="result-value highlight" id="price-p">R$ 2.560,00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Última Parcela</span>
            <span class="result-value" id="price-plast">R$ 2.560,00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Total Pago</span>
            <span class="result-value" id="price-total">R$ 921.600,00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Juros Totais</span>
            <span class="result-value" id="price-interest" style="color: var(--status-danger);">R$ 641.600,00</span>
          </div>
        </div>
      </div>

      <div class="result-card" style="margin-top: 16px; background: #F0FDF4; border-color: #BBF7D0;">
        <div class="result-row">
          <span class="result-label" style="color: #166534; font-weight: 600;">Economia da Tabela SAC sobre a PRICE:</span>
          <span class="result-value highlight" id="fin-savings" style="color: #166534;">R$ 219.600,00</span>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#fin-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#fin-btn-fav') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('financing-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('financing-calc'));
  });

  const inTotal = container.querySelector('#fin-total-val') as HTMLInputElement;
  const inDown = container.querySelector('#fin-down-payment') as HTMLInputElement;
  const inRate = container.querySelector('#fin-interest-rate') as HTMLInputElement;
  const inMonths = container.querySelector('#fin-term-months') as HTMLInputElement;

  function calculate() {
    const totalVal = parseFloat(inTotal.value) || 0;
    const downPayment = parseFloat(inDown.value) || 0;
    const loanAmount = Math.max(0, totalVal - downPayment);
    const annualRate = parseFloat(inRate.value) || 0;
    const n = parseInt(inMonths.value) || 1;

    // Taxa mensal
    const i = Math.pow(1 + annualRate / 100, 1 / 12) - 1;

    // SAC: Amortização constante = loan / n
    const A = loanAmount / n;
    const sacP1 = A + loanAmount * i;
    const sacPlast = A + A * i;
    const sacInterestTotal = ((loanAmount * i + A * i) / 2) * n;
    const sacTotalPaid = loanAmount + sacInterestTotal;

    // PRICE: Parcela fixa = P = loan * (i * (1+i)^n) / ((1+i)^n - 1)
    const factor = Math.pow(1 + i, n);
    const pricePayment = loanAmount * ((i * factor) / (factor - 1));
    const priceTotalPaid = pricePayment * n;
    const priceInterestTotal = priceTotalPaid - loanAmount;

    const savings = Math.max(0, priceTotalPaid - sacTotalPaid);

    (container.querySelector('#sac-p1') as HTMLElement).textContent = `R$ ${sacP1.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#sac-plast') as HTMLElement).textContent = `R$ ${sacPlast.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#sac-total') as HTMLElement).textContent = `R$ ${sacTotalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#sac-interest') as HTMLElement).textContent = `R$ ${sacInterestTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    (container.querySelector('#price-p') as HTMLElement).textContent = `R$ ${pricePayment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#price-plast') as HTMLElement).textContent = `R$ ${pricePayment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#price-total') as HTMLElement).textContent = `R$ ${priceTotalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#price-interest') as HTMLElement).textContent = `R$ ${priceInterestTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    (container.querySelector('#fin-savings') as HTMLElement).textContent = `R$ ${savings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    historyManager.record(
      'financing-calc',
      'Financeiro',
      'Financiamento SAC vs Price',
      `Bem: R$ ${totalVal} (Financiado R$ ${loanAmount}) em ${n}m`,
      `Economia SAC: R$ ${Math.round(savings).toLocaleString('pt-BR')}`
    );
  }

  [inTotal, inDown, inRate, inMonths].forEach((el) => {
    el.addEventListener('input', calculate);
  });

  calculate();
}
