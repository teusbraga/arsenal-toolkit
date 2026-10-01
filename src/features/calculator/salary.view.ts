import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderSalaryCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('salary-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="salary-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Calculadora de Salário (CLT vs PJ)</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="salary-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Salário Bruto CLT Proposto</label>
        <div class="input-wrapper">
          <span class="input-prefix">R$</span>
          <input type="number" id="clt-salary" class="form-input has-prefix" value="8000" step="100" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Benefícios Mensais CLT (VR, VT, Plano de Saúde)</label>
        <div class="input-wrapper">
          <span class="input-prefix">R$</span>
          <input type="number" id="clt-benefits" class="form-input has-prefix" value="1200" step="50" />
        </div>
      </div>

      <div class="result-card">
        <div class="result-header">Comparativo Anual & Equivalência PJ</div>
        <div class="result-row">
          <span class="result-label">Líquido CLT Mensal (com benefícios)</span>
          <span class="result-value" id="res-clt-net">R$ 7.250,00</span>
        </div>
        <div class="result-row">
          <span class="result-label">Pacote Anual CLT (13º + Férias + FGTS)</span>
          <span class="result-value" id="res-clt-annual">R$ 115.000,00</span>
        </div>
        <div class="result-row">
          <span class="result-label">Valor PJ Mensal Mínimo Equivalente</span>
          <span class="result-value highlight" id="res-pj-equiv">R$ 10.800,00</span>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#salary-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#salary-btn-fav') as HTMLButtonElement;
  const inputSalary = container.querySelector('#clt-salary') as HTMLInputElement;
  const inputBenefits = container.querySelector('#clt-benefits') as HTMLInputElement;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('salary-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('salary-calc'));
  });

  function calculate() {
    const gross = parseFloat(inputSalary.value) || 0;
    const benefits = parseFloat(inputBenefits.value) || 0;

    // Estimativa de descontos médios CLT (INSS + IR) ~20-25%
    const discounts = gross * 0.22;
    const netMonthly = (gross - discounts) + benefits;

    // Pacote anual CLT: 12 salários + 13º + 1/3 férias + 8% FGTS + benefícios anuais
    const annualGross = (gross * 13.33) + (gross * 0.08 * 12) + (benefits * 12);
    const annualNet = (netMonthly * 12) + (gross * 1.33) + (gross * 0.08 * 12);

    // PJ equivalente mensal (considerando imposto Simples ~6% e custos contabilidade ~R$ 200)
    // Para ter o mesmo retorno anual líquido:
    const pjMonthlyEquiv = (annualNet / 12) / 0.94 + 200;

    (container.querySelector('#res-clt-net') as HTMLElement).textContent = `R$ ${netMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#res-clt-annual') as HTMLElement).textContent = `R$ ${annualGross.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#res-pj-equiv') as HTMLElement).textContent = `R$ ${pjMonthlyEquiv.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    historyManager.record(
      'salary-calc',
      'Calculadoras',
      'Comparativo CLT vs PJ',
      `CLT R$ ${gross} + R$ ${benefits}`,
      `PJ Equivalente: R$ ${pjMonthlyEquiv.toFixed(2)}`,
      { gross, benefits, pjMonthlyEquiv }
    );
  }

  inputSalary.addEventListener('input', calculate);
  inputBenefits.addEventListener('input', calculate);
  calculate();
}
