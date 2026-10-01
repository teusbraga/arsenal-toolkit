import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderBillSplit(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('bill-split');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="bill-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Divisão de Conta & Gorjeta</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="bill-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Valor Total da Conta</label>
        <div class="input-wrapper">
          <span class="input-prefix">R$</span>
          <input type="number" id="bill-amount" class="form-input has-prefix" value="280" step="5" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Taxa de Serviço / Gorjeta</label>
        <div style="display: flex; gap: 6px; margin-bottom: 8px;">
          <button class="tab-btn tip-btn" data-tip="0">0%</button>
          <button class="tab-btn tip-btn active" data-tip="10">10%</button>
          <button class="tab-btn tip-btn" data-tip="12">12%</button>
          <button class="tab-btn tip-btn" data-tip="15">15%</button>
        </div>
        <div class="input-wrapper">
          <input type="number" id="bill-custom-tip" class="form-input" value="10" placeholder="Outro percentual (%)" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Número de Pessoas Pagantes</label>
        <input type="number" id="bill-people" class="form-input" value="4" min="1" max="100" />
      </div>

      <div class="result-card">
        <div class="result-header">Valor Final por Pessoa</div>
        <div class="result-row">
          <span class="result-label">Cada um Paga</span>
          <span class="result-value highlight" id="res-bill-each" style="font-size: 1.35rem;">R$ 77,00</span>
        </div>
        <div class="result-row">
          <span class="result-label">Gorjeta Total</span>
          <span class="result-value" id="res-bill-tip-total">R$ 28,00</span>
        </div>
        <div class="result-row">
          <span class="result-label">Total Geral com Serviço</span>
          <span class="result-value" id="res-bill-total">R$ 308,00</span>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#bill-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#bill-btn-fav') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('bill-split');
    btnFav.classList.toggle('active', store.getState().favorites.includes('bill-split'));
  });

  const inAmount = container.querySelector('#bill-amount') as HTMLInputElement;
  const inTip = container.querySelector('#bill-custom-tip') as HTMLInputElement;
  const inPeople = container.querySelector('#bill-people') as HTMLInputElement;
  const tipButtons = container.querySelectorAll('.tip-btn');

  tipButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tipButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      inTip.value = btn.getAttribute('data-tip') || '10';
      calculate();
    });
  });

  function calculate() {
    const amount = parseFloat(inAmount.value) || 0;
    const tipPerc = parseFloat(inTip.value) || 0;
    const people = parseInt(inPeople.value) || 1;

    const tipTotal = amount * (tipPerc / 100);
    const grandTotal = amount + tipTotal;
    const each = people > 0 ? grandTotal / people : 0;

    (container.querySelector('#res-bill-each') as HTMLElement).textContent = `R$ ${each.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#res-bill-tip-total') as HTMLElement).textContent = `R$ ${tipTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    (container.querySelector('#res-bill-total') as HTMLElement).textContent = `R$ ${grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    historyManager.record(
      'bill-split',
      'Financeiro',
      'Divisão de Conta',
      `R$ ${amount} (${tipPerc}% gorjeta, ${people} pessoas)`,
      `R$ ${each.toFixed(2)} por pessoa`
    );
  }

  inAmount.addEventListener('input', calculate);
  inTip.addEventListener('input', () => {
    tipButtons.forEach((b) => b.classList.remove('active'));
    calculate();
  });
  inPeople.addEventListener('input', calculate);

  calculate();
}
