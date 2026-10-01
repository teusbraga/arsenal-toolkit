import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

interface CurrencyRates {
  [key: string]: number;
}

// Taxas base offline de segurança
const DEFAULT_RATES_TO_BRL: CurrencyRates = {
  USD: 5.42,
  BRL: 1.0,
  EUR: 5.87,
  GBP: 6.78,
  JPY: 0.034,
  BTC: 345220.12,
};

export function renderCurrencyConverter(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('currency-converter');
  let rates: CurrencyRates = { ...DEFAULT_RATES_TO_BRL };
  let lastUpdated = 'Hoje, modo offline';

  // Tenta carregar taxas salvas no localStorage
  const savedRates = localStorage.getItem('bp_cached_currency_rates');
  if (savedRates) {
    try {
      const parsed = JSON.parse(savedRates);
      rates = { ...rates, ...parsed.rates };
      lastUpdated = parsed.updatedAt;
    } catch {
      // Ignora erro de parse
    }
  }

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <!-- Subheader -->
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="curr-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Conversor de Moedas</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="curr-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Formulário de Conversão -->
      <div class="form-group">
        <label class="form-label">De</label>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 8px;">
          <select id="curr-from-select" class="form-select">
            <option value="USD" selected>🇺🇸 USD</option>
            <option value="BRL">🇧🇷 BRL</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="JPY">🇯🇵 JPY</option>
            <option value="BTC">₿ BTC</option>
          </select>
          <input type="number" id="curr-from-input" class="form-input" value="1000" step="any" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Para</label>
        <div style="display: grid; grid-template-columns: 110px 1fr; gap: 8px;">
          <select id="curr-to-select" class="form-select">
            <option value="BRL" selected>🇧🇷 BRL</option>
            <option value="USD">🇺🇸 USD</option>
            <option value="EUR">🇪🇺 EUR</option>
            <option value="GBP">🇬🇧 GBP</option>
            <option value="JPY">🇯🇵 JPY</option>
            <option value="BTC">₿ BTC</option>
          </select>
          <input type="text" id="curr-to-input" class="form-input" readonly style="background-color: var(--bg-muted);" />
        </div>
      </div>

      <div style="font-size: 0.78rem; color: var(--text-secondary); margin: 6px 0 24px 0;" id="curr-rate-label">
        1 USD = 5,42 BRL • Atualizado
      </div>

      <!-- Outras Moedas Populares (conforme mockup) -->
      <h3 style="font-size: 0.95rem; font-weight: 600; color: var(--text-main); margin-bottom: 12px;">Outras moedas populares</h3>
      <div class="quick-actions-list" id="popular-currencies-list">
        <!-- Renderizado dinamicamente -->
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#curr-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#curr-btn-fav') as HTMLButtonElement;
  const selectFrom = container.querySelector('#curr-from-select') as HTMLSelectElement;
  const selectTo = container.querySelector('#curr-to-select') as HTMLSelectElement;
  const inputFrom = container.querySelector('#curr-from-input') as HTMLInputElement;
  const inputTo = container.querySelector('#curr-to-input') as HTMLInputElement;
  const rateLabel = container.querySelector('#curr-rate-label') as HTMLElement;
  const popularList = container.querySelector('#popular-currencies-list') as HTMLElement;

  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  btnFav.addEventListener('click', () => {
    store.toggleFavorite('currency-converter');
    const updated = store.getState().favorites.includes('currency-converter');
    btnFav.classList.toggle('active', updated);
  });

  function renderPopularList() {
    const populars = [
      { code: 'EUR', name: 'Euro', flag: '🇪🇺', rateBrl: rates.EUR },
      { code: 'GBP', name: 'Libra Esterlina', flag: '🇬🇧', rateBrl: rates.GBP },
      { code: 'JPY', name: 'Iene Japonês', flag: '🇯🇵', rateBrl: rates.JPY },
      { code: 'BTC', name: 'Bitcoin', flag: '₿', rateBrl: rates.BTC },
    ];

    popularList.innerHTML = populars.map((item) => `
      <div class="quick-action-item" data-code="${item.code}">
        <div class="quick-action-left">
          <span style="font-size: 1.1rem;">${item.flag}</span>
          <div>
            <div class="quick-action-title">${item.code} <span style="font-weight: 400; color: var(--text-secondary);">${item.name}</span></div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 600; font-family: var(--font-mono); font-size: 0.9rem;">
            ${item.rateBrl.toLocaleString('pt-BR', { minimumFractionDigits: item.rateBrl < 1 ? 3 : 2, maximumFractionDigits: 4 })}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>
    `).join('');

    popularList.querySelectorAll('.quick-action-item').forEach((el) => {
      el.addEventListener('click', () => {
        const code = el.getAttribute('data-code');
        if (code) {
          selectFrom.value = code;
          convert();
        }
      });
    });
  }

  function convert() {
    const from = selectFrom.value;
    const to = selectTo.value;
    const amount = parseFloat(inputFrom.value) || 0;

    const rateFromInBrl = rates[from] || 1;
    const rateToInBrl = rates[to] || 1;

    // Converte via pivô BRL
    const amountInBrl = amount * rateFromInBrl;
    const result = amountInBrl / rateToInBrl;

    const singleRate = rateFromInBrl / rateToInBrl;

    inputTo.value = result.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: result < 1 ? 4 : 2,
    });

    rateLabel.textContent = `1 ${from} = ${singleRate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${to} • ${lastUpdated}`;

    // Grava no histórico
    historyManager.record(
      'currency-converter',
      'Conversores',
      `Câmbio ${from} → ${to}`,
      `${amount} ${from}`,
      `${result.toFixed(2)} ${to}`,
      { from, to, amount, result }
    );
  }

  // Tenta sincronizar com API AwesomeAPI em background quando online
  async function fetchLiveRates() {
    if (!navigator.onLine) return;
    try {
      const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,EUR-BRL,GBP-BRL,JPY-BRL,BTC-BRL');
      if (res.ok) {
        const data = await res.json();
        rates.USD = parseFloat(data.USDBRL.bid);
        rates.EUR = parseFloat(data.EURBRL.bid);
        rates.GBP = parseFloat(data.GBPBRL.bid);
        rates.JPY = parseFloat(data.JPYBRL.bid);
        rates.BTC = parseFloat(data.BTCBRL.bid);
        lastUpdated = `Atualizado às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

        localStorage.setItem(
          'bp_cached_currency_rates',
          JSON.stringify({ rates, updatedAt: lastUpdated })
        );

        convert();
        renderPopularList();
      }
    } catch {
      // Falha silenciosa com fallback para cache
    }
  }

  selectFrom.addEventListener('change', convert);
  selectTo.addEventListener('change', convert);
  inputFrom.addEventListener('input', convert);

  renderPopularList();
  convert();
  fetchLiveRates();
}
