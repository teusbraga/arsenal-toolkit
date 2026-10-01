import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

type UnitCategory = 'length' | 'weight' | 'volume' | 'temp';

interface UnitDefinition {
  id: string;
  name: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

const UNIT_DATA: Record<UnitCategory, UnitDefinition[]> = {
  length: [
    { id: 'm', name: 'Metro (m)', toBase: (v) => v, fromBase: (v) => v },
    { id: 'km', name: 'Quilômetro (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'cm', name: 'Centímetro (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
    { id: 'mm', name: 'Milímetro (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: 'in', name: 'Polegada (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
    { id: 'ft', name: 'Pé (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  ],
  weight: [
    { id: 'kg', name: 'Quilograma (kg)', toBase: (v) => v, fromBase: (v) => v },
    { id: 'g', name: 'Grama (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: 'mg', name: 'Miligrama (mg)', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
    { id: 'lb', name: 'Libra (lb)', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
    { id: 'oz', name: 'Onça (oz)', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  ],
  volume: [
    { id: 'l', name: 'Litro (L)', toBase: (v) => v, fromBase: (v) => v },
    { id: 'ml', name: 'Mililitro (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    { id: 'm3', name: 'Metro cúbico (m³)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    { id: 'gal', name: 'Galão americano (gal)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
  ],
  temp: [
    { id: 'c', name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
    { id: 'f', name: 'Fahrenheit (°F)', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
    { id: 'k', name: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
  ],
};

export function renderUnitsConverter(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('units-converter');
  let currentCategory: UnitCategory = 'length';

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <!-- Subheader -->
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="units-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Conversor de Unidades</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="units-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Segmented Tabs (conforme mockup) -->
      <div class="segmented-tabs" id="units-tabs">
        <button class="tab-btn active" data-tab="length">Comprimento</button>
        <button class="tab-btn" data-tab="weight">Peso</button>
        <button class="tab-btn" data-tab="volume">Volume</button>
        <button class="tab-btn" data-tab="temp">Temperatura</button>
      </div>

      <!-- Formulário de Conversão -->
      <div class="form-group">
        <label class="form-label">De</label>
        <div style="display: grid; grid-template-columns: 180px 1fr; gap: 8px;">
          <select id="unit-from-select" class="form-select"></select>
          <input type="number" id="unit-from-input" class="form-input" value="1" step="any" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Para</label>
        <div style="display: grid; grid-template-columns: 180px 1fr; gap: 8px;">
          <select id="unit-to-select" class="form-select"></select>
          <input type="text" id="unit-to-input" class="form-input" readonly style="background-color: var(--bg-muted);" />
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#units-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#units-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');
  const selectFrom = container.querySelector('#unit-from-select') as HTMLSelectElement;
  const selectTo = container.querySelector('#unit-to-select') as HTMLSelectElement;
  const inputFrom = container.querySelector('#unit-from-input') as HTMLInputElement;
  const inputTo = container.querySelector('#unit-to-input') as HTMLInputElement;

  btnBack.addEventListener('click', () => {
    window.location.hash = '#/';
  });

  btnFav.addEventListener('click', () => {
    store.toggleFavorite('units-converter');
    const updated = store.getState().favorites.includes('units-converter');
    btnFav.classList.toggle('active', updated);
  });

  function populateSelects() {
    const list = UNIT_DATA[currentCategory];
    selectFrom.innerHTML = list.map((u, i) => `<option value="${u.id}" ${i === 0 ? 'selected' : ''}>${u.name}</option>`).join('');
    selectTo.innerHTML = list.map((u, i) => `<option value="${u.id}" ${i === 1 ? 'selected' : ''}>${u.name}</option>`).join('');
    convert();
  }

  function convert() {
    const list = UNIT_DATA[currentCategory];
    const unitFrom = list.find((u) => u.id === selectFrom.value);
    const unitTo = list.find((u) => u.id === selectTo.value);
    const val = parseFloat(inputFrom.value) || 0;

    if (!unitFrom || !unitTo) return;

    const baseVal = unitFrom.toBase(val);
    const result = unitTo.fromBase(baseVal);

    inputTo.value = result.toLocaleString('pt-BR', {
      maximumFractionDigits: 6,
    });

    historyManager.record(
      'units-converter',
      'Conversores',
      `Unidades (${currentCategory})`,
      `${val} ${unitFrom.id}`,
      `${result} ${unitTo.id}`,
      { from: unitFrom.id, to: unitTo.id, val, result }
    );
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = (tab.getAttribute('data-tab') as UnitCategory) || 'length';
      populateSelects();
    });
  });

  selectFrom.addEventListener('change', convert);
  selectTo.addEventListener('change', convert);
  inputFrom.addEventListener('input', convert);

  populateSelects();
}
