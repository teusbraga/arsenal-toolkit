import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderCashVsInstallment(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('cash-vs-installment');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="cvi-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">À Vista vs Parcelado & Margem</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="cvi-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="cvi-tabs">
        <button class="tab-btn active" data-tab="cash-inst">À Vista vs Parcelado</button>
        <button class="tab-btn" data-tab="markup">Markup & Margem Comercial</button>
      </div>

      <!-- Tab 1: À Vista vs Parcelado -->
      <div id="tab-cvi-inst">
        <div class="form-group">
          <label class="form-label">Valor Total da Compra (a prazo)</label>
          <div class="input-wrapper">
            <span class="input-prefix">R$</span>
            <input type="number" id="cvi-total" class="form-input has-prefix" value="3000" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Desconto À Vista (%)</label>
            <input type="number" id="cvi-discount" class="form-input" value="10" step="0.5" />
          </div>
          <div>
            <label class="form-label">Número de Parcelas</label>
            <input type="number" id="cvi-installments" class="form-input" value="10" min="2" max="36" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Rendimento do seu dinheiro (% ao mês no CDI)</label>
          <input type="number" id="cvi-cdi" class="form-input" value="0.85" step="0.05" />
        </div>

        <div class="result-card">
          <div class="result-header">Veredito Financeiro</div>
          <div class="result-row">
            <span class="result-label">Recomendação</span>
            <span class="result-value highlight" id="cvi-verdict" style="color: var(--status-success);">Pague À Vista</span>
          </div>
          <div class="result-row">
            <span class="result-label">Valor Final À Vista</span>
            <span class="result-value" id="cvi-cash-val">R$ 2.700,00</span>
          </div>
          <div class="result-row">
            <span class="result-label">Custo Efetivo Parcelando (descontando rendimento)</span>
            <span class="result-value" id="cvi-inst-val">R$ 2.868,00</span>
          </div>
        </div>
      </div>

      <!-- Tab 2: Markup e Margem -->
      <div id="tab-cvi-markup" style="display: none;">
        <div class="form-group">
          <label class="form-label">Custo de Aquisição / Produção do Produto</label>
          <div class="input-wrapper">
            <span class="input-prefix">R$</span>
            <input type="number" id="mk-cost" class="form-input has-prefix" value="100" />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Despesas Variáveis + Impostos (%)</label>
            <input type="number" id="mk-expenses" class="form-input" value="15" step="0.5" />
          </div>
          <div>
            <label class="form-label">Margem de Lucro Líquida Desejada (%)</label>
            <input type="number" id="mk-margin" class="form-input" value="25" step="0.5" />
          </div>
        </div>

        <div class="result-card">
          <div class="result-header">Formação do Preço de Venda</div>
          <div class="result-row">
            <span class="result-label">Preço de Venda Ideal</span>
            <span class="result-value highlight" id="res-mk-price" style="font-size: 1.25rem;">R$ 166,67</span>
          </div>
          <div class="result-row">
            <span class="result-label">Multiplicador Markup</span>
            <span class="result-value" id="res-mk-factor">1,67x</span>
          </div>
          <div class="result-row">
            <span class="result-label">Lucro Líquido Real em Reais</span>
            <span class="result-value" id="res-mk-profit" style="color: var(--status-success);">R$ 41,67 / unidade</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#cvi-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#cvi-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('cash-vs-installment');
    btnFav.classList.toggle('active', store.getState().favorites.includes('cash-vs-installment'));
  });

  const tabInst = container.querySelector('#tab-cvi-inst') as HTMLElement;
  const tabMarkup = container.querySelector('#tab-cvi-markup') as HTMLElement;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isInst = tab.getAttribute('data-tab') === 'cash-inst';
      tabInst.style.display = isInst ? 'block' : 'none';
      tabMarkup.style.display = isInst ? 'none' : 'block';
    });
  });

  // Cálculo À Vista vs Parcelado
  const inTotal = container.querySelector('#cvi-total') as HTMLInputElement;
  const inDisc = container.querySelector('#cvi-discount') as HTMLInputElement;
  const inInst = container.querySelector('#cvi-installments') as HTMLInputElement;
  const inCdi = container.querySelector('#cvi-cdi') as HTMLInputElement;

  function calcCashVsInst() {
    const total = parseFloat(inTotal.value) || 0;
    const discPerc = parseFloat(inDisc.value) || 0;
    const numInst = parseInt(inInst.value) || 1;
    const cdiMonthly = (parseFloat(inCdi.value) || 0) / 100;

    const cashPrice = total * (1 - discPerc / 100);
    const instValue = total / numInst;

    // Se parcelar, deixa o valor total rendendo e saca a parcela todo mês
    let fund = total;
    for (let m = 1; m <= numInst; m++) {
      fund = fund * (1 + cdiMonthly) - instValue;
    }

    // Ganho líquido de deixar rendendo
    const finalBalanceAfterPaying = fund;
    const effectiveCostInst = total - finalBalanceAfterPaying;

    const verdictEl = container.querySelector('#cvi-verdict') as HTMLElement;
    if (cashPrice < effectiveCostInst) {
      verdictEl.textContent = 'Pague À VISTA (Maior economia)';
      verdictEl.style.color = 'var(--status-success)';
    } else {
      verdictEl.textContent = 'PARCELE (Rendimento no CDI supera o desconto)';
      verdictEl.style.color = 'var(--status-info)';
    }

    (container.querySelector('#cvi-cash-val') as HTMLElement).textContent = `R$ ${cashPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#cvi-inst-val') as HTMLElement).textContent = `R$ ${effectiveCostInst.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    historyManager.record(
      'cash-vs-installment',
      'Financeiro',
      'À Vista vs Parcelado',
      `R$ ${total} (${discPerc}% desc à vista ou ${numInst}x)`,
      `À Vista R$ ${cashPrice.toFixed(2)} vs R$ ${effectiveCostInst.toFixed(2)}`
    );
  }

  [inTotal, inDisc, inInst, inCdi].forEach((el) => el.addEventListener('input', calcCashVsInst));

  // Cálculo Markup
  const mkCost = container.querySelector('#mk-cost') as HTMLInputElement;
  const mkExp = container.querySelector('#mk-expenses') as HTMLInputElement;
  const mkMarg = container.querySelector('#mk-margin') as HTMLInputElement;

  function calcMarkup() {
    const cost = parseFloat(mkCost.value) || 0;
    const expenses = (parseFloat(mkExp.value) || 0) / 100;
    const margin = (parseFloat(mkMarg.value) || 0) / 100;

    const denominator = 1 - (expenses + margin);
    if (denominator <= 0) {
      (container.querySelector('#res-mk-price') as HTMLElement).textContent = 'Inválido (>100%)';
      return;
    }

    const price = cost / denominator;
    const factor = price / (cost || 1);
    const profit = price * margin;

    (container.querySelector('#res-mk-price') as HTMLElement).textContent = `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#res-mk-factor') as HTMLElement).textContent = `${factor.toFixed(2)}x`;
    (container.querySelector('#res-mk-profit') as HTMLElement).textContent = `R$ ${profit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / unidade`;
  }

  [mkCost, mkExp, mkMarg].forEach((el) => el.addEventListener('input', calcMarkup));

  calcCashVsInst();
  calcMarkup();
}
