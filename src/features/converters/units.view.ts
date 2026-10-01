import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

type UnitCategory =
  | 'length'
  | 'weight'
  | 'area'
  | 'volume'
  | 'temp'
  | 'speed'
  | 'time'
  | 'pressure'
  | 'energy'
  | 'power'
  | 'frequency'
  | 'angles'
  | 'storage';

interface UnitDefinition {
  id: string;
  name: string;
  toBase: (val: number) => number;
  fromBase: (val: number) => number;
}

const UNIT_DATA: Record<UnitCategory, { label: string; units: UnitDefinition[] }> = {
  length: {
    label: 'Comprimento',
    units: [
      { id: 'm', name: 'Metro (m)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', name: 'Quilômetro (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', name: 'Centímetro (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'mm', name: 'Milímetro (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'in', name: 'Polegada (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { id: 'ft', name: 'Pé (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { id: 'yd', name: 'Jarda (yd)', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
      { id: 'mi', name: 'Milha terrestre (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ]
  },
  weight: {
    label: 'Massa / Peso',
    units: [
      { id: 'kg', name: 'Quilograma (kg)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', name: 'Grama (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'mg', name: 'Miligrama (mg)', toBase: (v) => v / 1000000, fromBase: (v) => v * 1000000 },
      { id: 't', name: 'Tonelada (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'lb', name: 'Libra (lb)', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', name: 'Onça (oz)', toBase: (v) => v * 0.02834952, fromBase: (v) => v / 0.02834952 },
    ]
  },
  area: {
    label: 'Área',
    units: [
      { id: 'm2', name: 'Metro quadrado (m²)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km2', name: 'Quilômetro quadrado (km²)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      { id: 'ha', name: 'Hectare (ha)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { id: 'cm2', name: 'Centímetro quadrado (cm²)', toBase: (v) => v / 10000, fromBase: (v) => v * 10000 },
      { id: 'ft2', name: 'Pé quadrado (sq ft)', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { id: 'ac', name: 'Acre (ac)', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
    ]
  },
  volume: {
    label: 'Volume',
    units: [
      { id: 'l', name: 'Litro (L)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ml', name: 'Mililitro (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'm3', name: 'Metro cúbico (m³)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'gal', name: 'Galão americano (gal)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { id: 'ft3', name: 'Pé cúbico (ft³)', toBase: (v) => v * 28.3168, fromBase: (v) => v / 28.3168 },
    ]
  },
  temp: {
    label: 'Temperatura',
    units: [
      { id: 'c', name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', name: 'Fahrenheit (°F)', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { id: 'k', name: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ]
  },
  speed: {
    label: 'Velocidade',
    units: [
      { id: 'kmh', name: 'Quilômetros por hora (km/h)', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
      { id: 'ms', name: 'Metros por segundo (m/s)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'mph', name: 'Milhas por hora (mph)', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
      { id: 'knot', name: 'Nós (kt)', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
    ]
  },
  time: {
    label: 'Tempo',
    units: [
      { id: 's', name: 'Segundos (s)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'min', name: 'Minutos (min)', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'h', name: 'Horas (h)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'd', name: 'Dias (d)', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'wk', name: 'Semanas (sem)', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
      { id: 'mo', name: 'Meses médios (30d)', toBase: (v) => v * 2592000, fromBase: (v) => v / 2592000 },
      { id: 'yr', name: 'Anos (365d)', toBase: (v) => v * 31536000, fromBase: (v) => v / 31536000 },
    ]
  },
  pressure: {
    label: 'Pressão',
    units: [
      { id: 'bar', name: 'Bar (bar)', toBase: (v) => v * 100000, fromBase: (v) => v / 100000 },
      { id: 'pa', name: 'Pascal (Pa)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kpa', name: 'Quilopascal (kPa)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'psi', name: 'Libras por pol² (psi)', toBase: (v) => v * 6894.76, fromBase: (v) => v / 6894.76 },
      { id: 'atm', name: 'Atmosfera padrão (atm)', toBase: (v) => v * 101325, fromBase: (v) => v / 101325 },
      { id: 'mmhg', name: 'Milímetros de mercúrio (mmHg)', toBase: (v) => v * 133.322, fromBase: (v) => v / 133.322 },
    ]
  },
  energy: {
    label: 'Energia',
    units: [
      { id: 'j', name: 'Joule (J)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kj', name: 'Quilojoule (kJ)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cal', name: 'Caloria (cal)', toBase: (v) => v * 4.184, fromBase: (v) => v / 4.184 },
      { id: 'kcal', name: 'Quilocaloria / Caloria alimentar (kcal)', toBase: (v) => v * 4184, fromBase: (v) => v / 4184 },
      { id: 'kwh', name: 'Quilowatt-hora (kWh)', toBase: (v) => v * 3600000, fromBase: (v) => v / 3600000 },
      { id: 'btu', name: 'BTU', toBase: (v) => v * 1055.06, fromBase: (v) => v / 1055.06 },
    ]
  },
  power: {
    label: 'Potência',
    units: [
      { id: 'w', name: 'Watt (W)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kw', name: 'Quilowatt (kW)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cv', name: 'Cavalo-vapor (cv)', toBase: (v) => v * 735.499, fromBase: (v) => v / 735.499 },
      { id: 'hp', name: 'Horsepower (hp)', toBase: (v) => v * 745.7, fromBase: (v) => v / 745.7 },
    ]
  },
  frequency: {
    label: 'Frequência',
    units: [
      { id: 'hz', name: 'Hertz (Hz)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'khz', name: 'Quilohertz (kHz)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'mhz', name: 'Megahertz (MHz)', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
      { id: 'ghz', name: 'Gigahertz (GHz)', toBase: (v) => v * 1000000000, fromBase: (v) => v / 1000000000 },
      { id: 'rpm', name: 'Rotações por minuto (RPM)', toBase: (v) => v / 60, fromBase: (v) => v * 60 },
    ]
  },
  angles: {
    label: 'Ângulos',
    units: [
      { id: 'deg', name: 'Graus (°)', toBase: (v) => (v * Math.PI) / 180, fromBase: (v) => (v * 180) / Math.PI },
      { id: 'rad', name: 'Radianos (rad)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'grad', name: 'Grados (gon)', toBase: (v) => (v * Math.PI) / 200, fromBase: (v) => (v * 200) / Math.PI },
    ]
  },
  storage: {
    label: 'Armazenamento Digital',
    units: [
      { id: 'b', name: 'Bytes (B)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'kb', name: 'Kilobytes (KB)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { id: 'mb', name: 'Megabytes (MB)', toBase: (v) => v * 1024 * 1024, fromBase: (v) => v / (1024 * 1024) },
      { id: 'gb', name: 'Gigabytes (GB)', toBase: (v) => v * Math.pow(1024, 3), fromBase: (v) => v / Math.pow(1024, 3) },
      { id: 'tb', name: 'Terabytes (TB)', toBase: (v) => v * Math.pow(1024, 4), fromBase: (v) => v / Math.pow(1024, 4) },
    ]
  }
};

export function renderUnitsConverter(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('units-converter');
  let currentCategory: UnitCategory = 'length';

  const categories = Object.keys(UNIT_DATA) as UnitCategory[];

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
          <h2 class="tool-header-title">Conversor de Unidades Físicas</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="units-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <!-- Segmented Tabs com Scroll Horizontal Suave -->
      <div class="segmented-tabs" id="units-tabs" style="overflow-x: auto; scrollbar-width: none;">
        ${categories.map((c) => `
          <button class="tab-btn ${c === 'length' ? 'active' : ''}" data-tab="${c}">
            ${UNIT_DATA[c].label}
          </button>
        `).join('')}
      </div>

      <!-- Formulário de Conversão -->
      <div class="form-group">
        <label class="form-label">De</label>
        <div style="display: grid; grid-template-columns: 210px 1fr; gap: 8px;">
          <select id="unit-from-select" class="form-select"></select>
          <input type="number" id="unit-from-input" class="form-input" value="1" step="any" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Para</label>
        <div style="display: grid; grid-template-columns: 210px 1fr; gap: 8px;">
          <select id="unit-to-select" class="form-select"></select>
          <input type="text" id="unit-to-input" class="form-input" readonly style="background-color: var(--bg-muted); font-weight: 600; font-family: var(--font-mono);" />
        </div>
      </div>

      <div class="result-card" style="margin-top: 20px;">
        <div class="result-header">Equivalência Rápida</div>
        <div class="result-row">
          <span class="result-label">Proporção</span>
          <span class="result-value" id="unit-ratio-label">1 m = 0,001 km</span>
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
  const ratioLabel = container.querySelector('#unit-ratio-label') as HTMLElement;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('units-converter');
    btnFav.classList.toggle('active', store.getState().favorites.includes('units-converter'));
  });

  function populateSelects() {
    const list = UNIT_DATA[currentCategory].units;
    selectFrom.innerHTML = list.map((u, i) => `<option value="${u.id}" ${i === 0 ? 'selected' : ''}>${u.name}</option>`).join('');
    selectTo.innerHTML = list.map((u, i) => `<option value="${u.id}" ${i === 1 ? 'selected' : ''}>${u.name}</option>`).join('');
    convert();
  }

  function convert() {
    const list = UNIT_DATA[currentCategory].units;
    const unitFrom = list.find((u) => u.id === selectFrom.value);
    const unitTo = list.find((u) => u.id === selectTo.value);
    const val = parseFloat(inputFrom.value) || 0;

    if (!unitFrom || !unitTo) return;

    const baseVal = unitFrom.toBase(val);
    const result = unitTo.fromBase(baseVal);

    inputTo.value = result.toLocaleString('pt-BR', { maximumFractionDigits: 6 });

    const baseOne = unitFrom.toBase(1);
    const singleResult = unitTo.fromBase(baseOne);
    ratioLabel.textContent = `1 ${unitFrom.id} = ${singleResult.toLocaleString('pt-BR', { maximumFractionDigits: 6 })} ${unitTo.id}`;

    historyManager.record(
      'units-converter',
      'Conversores',
      `Unidades (${UNIT_DATA[currentCategory].label})`,
      `${val} ${unitFrom.id}`,
      `${result} ${unitTo.id}`
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
