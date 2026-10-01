import { historyManager } from '../../core/history/history.manager';
import { store } from '../../app/store';

export function renderStatisticsCalculator(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('statistics-calc');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="stat-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Estatística Descritiva</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="stat-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label">Conjunto de Dados (separe por vírgula, espaço ou quebra de linha)</label>
        <textarea id="stat-input" class="form-input" style="height: 100px; padding: 10px; font-family: var(--font-mono); resize: vertical;">12, 15, 12, 19, 22, 15, 28, 31, 14, 18</textarea>
      </div>

      <div class="result-card">
        <div class="result-header">Métricas Centrais & Dispersão</div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
          <div class="result-row">
            <span class="result-label">Média</span>
            <span class="result-value highlight" id="st-mean">18,60</span>
          </div>
          <div class="result-row">
            <span class="result-label">Mediana</span>
            <span class="result-value highlight" id="st-median">16,50</span>
          </div>
          <div class="result-row">
            <span class="result-label">Moda</span>
            <span class="result-value" id="st-mode">12, 15</span>
          </div>
          <div class="result-row">
            <span class="result-label">Desvio Padrão (s)</span>
            <span class="result-value" id="st-std">6,24</span>
          </div>
          <div class="result-row">
            <span class="result-label">Variância (s²)</span>
            <span class="result-value" id="st-var">38,93</span>
          </div>
          <div class="result-row">
            <span class="result-label">Mínimo / Máximo</span>
            <span class="result-value" id="st-minmax">12 / 31</span>
          </div>
          <div class="result-row">
            <span class="result-label">Amplitude</span>
            <span class="result-value" id="st-range">19</span>
          </div>
          <div class="result-row">
            <span class="result-label">Total (N) / Soma</span>
            <span class="result-value" id="st-count">10 elem. (Σ 186)</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#stat-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#stat-btn-fav') as HTMLButtonElement;
  const statInput = container.querySelector('#stat-input') as HTMLTextAreaElement;

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('statistics-calc');
    btnFav.classList.toggle('active', store.getState().favorites.includes('statistics-calc'));
  });

  const meanEl = container.querySelector('#st-mean') as HTMLElement;
  const medianEl = container.querySelector('#st-median') as HTMLElement;
  const modeEl = container.querySelector('#st-mode') as HTMLElement;
  const stdEl = container.querySelector('#st-std') as HTMLElement;
  const varEl = container.querySelector('#st-var') as HTMLElement;
  const minMaxEl = container.querySelector('#st-minmax') as HTMLElement;
  const rangeEl = container.querySelector('#st-range') as HTMLElement;
  const countEl = container.querySelector('#st-count') as HTMLElement;

  function calculate() {
    const raw = statInput.value;
    const nums = raw
      .split(/[\s,;]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));

    if (nums.length === 0) {
      meanEl.textContent = '-';
      medianEl.textContent = '-';
      modeEl.textContent = '-';
      stdEl.textContent = '-';
      varEl.textContent = '-';
      minMaxEl.textContent = '-';
      rangeEl.textContent = '-';
      countEl.textContent = '0 elem.';
      return;
    }

    const n = nums.length;
    const sorted = [...nums].sort((a, b) => a - b);
    const sum = nums.reduce((acc, v) => acc + v, 0);
    const mean = sum / n;

    // Mediana
    let median = 0;
    const mid = Math.floor(n / 2);
    if (n % 2 !== 0) {
      median = sorted[mid];
    } else {
      median = (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Moda
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    nums.forEach((v) => {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) maxFreq = freq[v];
    });

    let modes: number[] = [];
    if (maxFreq > 1) {
      modes = Object.keys(freq)
        .map(Number)
        .filter((k) => freq[k] === maxFreq);
    }

    // Variância e Desvio Padrão (Amostral)
    const sqDiffs = nums.map((v) => Math.pow(v - mean, 2));
    const variance = n > 1 ? sqDiffs.reduce((acc, v) => acc + v, 0) / (n - 1) : 0;
    const stdDev = Math.sqrt(variance);

    const min = sorted[0];
    const max = sorted[n - 1];
    const range = max - min;

    meanEl.textContent = mean.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    medianEl.textContent = median.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    modeEl.textContent = modes.length > 0 ? modes.join(', ') : 'Amodal';
    stdEl.textContent = stdDev.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    varEl.textContent = variance.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
    minMaxEl.textContent = `${min} / ${max}`;
    rangeEl.textContent = String(range);
    countEl.textContent = `${n} elem. (Σ ${sum.toLocaleString('pt-BR', { maximumFractionDigits: 2 })})`;

    historyManager.record(
      'statistics-calc',
      'Calculadoras',
      'Estatística Descritiva',
      `${n} elementos`,
      `Média: ${mean.toFixed(2)}, Mediana: ${median.toFixed(2)}`
    );
  }

  statInput.addEventListener('input', calculate);
  calculate();
}
