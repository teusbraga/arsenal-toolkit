import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

// Funções auxiliares de cores
function hexToRgb(hex: string): [number, number, number] {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(hex, 16);
  if (isNaN(num)) return [0, 0, 0];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function renderColorsView(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('colors-tools');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="col-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Cores & CSS Design</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="col-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="col-tabs" style="overflow-x: auto;">
        <button class="tab-btn active" data-tab="picker">Conversor de Cores</button>
        <button class="tab-btn" data-tab="contrast">Contraste (WCAG)</button>
        <button class="tab-btn" data-tab="gradient">Gradientes CSS</button>
        <button class="tab-btn" data-tab="shadow">Sombras (Box Shadow)</button>
      </div>

      <!-- Tab 1: Conversor de Cores -->
      <div id="tab-col-picker" class="col-pane">
        <div style="display: flex; gap: 16px; align-items: center; margin-bottom: 20px;">
          <input type="color" id="native-color-picker" value="#2563EB" style="width: 64px; height: 64px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); cursor: pointer; padding: 0;" />
          <div style="flex: 1;">
            <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Seletor Visual de Cor</div>
            <div style="font-size: 0.78rem; color: var(--text-secondary);">Altere ou digite abaixo para converter entre HEX, RGB e HSL</div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">HEX</label>
          <input type="text" id="input-hex" class="form-input" value="#2563EB" style="font-family: var(--font-mono);" />
        </div>

        <div class="form-group">
          <label class="form-label">RGB</label>
          <input type="text" id="input-rgb" class="form-input" value="rgb(37, 99, 235)" style="font-family: var(--font-mono);" />
        </div>

        <div class="form-group">
          <label class="form-label">HSL</label>
          <input type="text" id="input-hsl" class="form-input" value="hsl(221, 83%, 53%)" style="font-family: var(--font-mono);" />
        </div>

        <!-- Paleta Harmônica Rápida -->
        <h3 style="font-size: 0.95rem; font-weight: 600; margin: 20px 0 8px 0;">Paleta Harmônica Gerada</h3>
        <div id="harmonics-palette" style="display: flex; gap: 8px; height: 48px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-color);"></div>
      </div>

      <!-- Tab 2: Contrast Checker WCAG -->
      <div id="tab-col-contrast" class="col-pane" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
          <div class="form-group">
            <label class="form-label">Cor do Texto (Foreground)</label>
            <div style="display: flex; gap: 6px;">
              <input type="color" id="contrast-fg-picker" value="#0F172A" style="width: 44px; height: 44px; padding: 0; border: 1px solid var(--border-color); border-radius: var(--radius-xs); cursor: pointer;" />
              <input type="text" id="contrast-fg-val" class="form-input" value="#0F172A" style="font-family: var(--font-mono);" />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Cor de Fundo (Background)</label>
            <div style="display: flex; gap: 6px;">
              <input type="color" id="contrast-bg-picker" value="#F8FAFC" style="width: 44px; height: 44px; padding: 0; border: 1px solid var(--border-color); border-radius: var(--radius-xs); cursor: pointer;" />
              <input type="text" id="contrast-bg-val" class="form-input" value="#F8FAFC" style="font-family: var(--font-mono);" />
            </div>
          </div>
        </div>

        <!-- Prévia do Contraste -->
        <div id="contrast-preview-box" style="padding: 24px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 16px; text-align: center;">
          <div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 4px;">Exemplo de Texto em Destaque</div>
          <div style="font-size: 0.9rem;">Este é um parágrafo demonstrativo avaliando a legibilidade da combinação escolhida.</div>
        </div>

        <div class="result-card">
          <div class="result-header">Taxa de Contraste e Conformidade WCAG 2.1</div>
          <div class="result-row">
            <span class="result-label">Razão de Contraste</span>
            <span class="result-value highlight" id="contrast-ratio-val">15,4 : 1</span>
          </div>
          <div class="result-row">
            <span class="result-label">Texto Normal (AA ≥ 4.5:1 / AAA ≥ 7:1)</span>
            <span class="result-value" id="wcag-normal-tag" style="color: var(--status-success); font-weight: 700;">Aprovado (AAA)</span>
          </div>
          <div class="result-row">
            <span class="result-label">Texto Grande (AA ≥ 3:1 / AAA ≥ 4.5:1)</span>
            <span class="result-value" id="wcag-large-tag" style="color: var(--status-success); font-weight: 700;">Aprovado (AAA)</span>
          </div>
        </div>
      </div>

      <!-- Tab 3: Gradientes CSS -->
      <div id="tab-col-gradient" class="col-pane" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px;">
          <div>
            <label class="form-label">Cor Inicial</label>
            <input type="color" id="grad-c1" value="#0F172A" style="width: 100%; height: 40px; padding: 0; border: 1px solid var(--border-color); border-radius: var(--radius-xs); cursor: pointer;" />
          </div>
          <div>
            <label class="form-label">Cor Final</label>
            <input type="color" id="grad-c2" value="#3B82F6" style="width: 100%; height: 40px; padding: 0; border: 1px solid var(--border-color); border-radius: var(--radius-xs); cursor: pointer;" />
          </div>
        </div>

        <div class="form-group">
          <div style="display: flex; justify-content: space-between;">
            <label class="form-label">Ângulo do Gradiente: <strong id="grad-angle-val">135°</strong></label>
          </div>
          <input type="range" id="grad-angle" min="0" max="360" value="135" style="width: 100%; cursor: pointer;" />
        </div>

        <!-- Preview do Gradiente -->
        <div id="grad-preview" style="height: 110px; border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 14px;"></div>

        <div class="form-group">
          <label class="form-label">Código CSS</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="grad-css-code" class="form-input" readonly style="font-family: var(--font-mono); font-size: 0.8rem; background: var(--bg-muted);" />
            <button class="tab-btn" id="btn-copy-grad" style="background: var(--btn-primary-bg); color: var(--btn-primary-text); padding: 0 16px;">Copiar</button>
          </div>
        </div>
      </div>

      <!-- Tab 4: Box Shadow -->
      <div id="tab-col-shadow" class="col-pane" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <div>
            <label class="form-label">Offset X: <span id="sh-x-val">0px</span></label>
            <input type="range" id="sh-x" min="-50" max="50" value="0" style="width: 100%;" />
          </div>
          <div>
            <label class="form-label">Offset Y: <span id="sh-y-val">10px</span></label>
            <input type="range" id="sh-y" min="-50" max="50" value="10" style="width: 100%;" />
          </div>
          <div>
            <label class="form-label">Blur Radius: <span id="sh-b-val">20px</span></label>
            <input type="range" id="sh-b" min="0" max="80" value="20" style="width: 100%;" />
          </div>
          <div>
            <label class="form-label">Spread: <span id="sh-s-val">0px</span></label>
            <input type="range" id="sh-s" min="-20" max="40" value="0" style="width: 100%;" />
          </div>
        </div>

        <!-- Prévia do Box Shadow -->
        <div style="height: 140px; background: var(--bg-muted); display: flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); margin: 16px 0;">
          <div id="shadow-preview-box" style="width: 110px; height: 60px; background: white; border-radius: var(--radius-sm); transition: box-shadow 0.1s ease;"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Código CSS Box-Shadow</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="shadow-css-code" class="form-input" readonly style="font-family: var(--font-mono); font-size: 0.8rem; background: var(--bg-muted);" />
            <button class="tab-btn" id="btn-copy-shadow" style="background: var(--btn-primary-bg); color: var(--btn-primary-text); padding: 0 16px;">Copiar</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#col-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#col-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('colors-tools');
    btnFav.classList.toggle('active', store.getState().favorites.includes('colors-tools'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      container.querySelectorAll('.col-pane').forEach((p) => {
        (p as HTMLElement).style.display = p.id === `tab-col-${target}` ? 'block' : 'none';
      });
    });
  });

  // Conversor de Cores
  const picker = container.querySelector('#native-color-picker') as HTMLInputElement;
  const inHex = container.querySelector('#input-hex') as HTMLInputElement;
  const inRgb = container.querySelector('#input-rgb') as HTMLInputElement;
  const inHsl = container.querySelector('#input-hsl') as HTMLInputElement;
  const harmonicsBox = container.querySelector('#harmonics-palette') as HTMLElement;

  function updateColorValues(hex: string) {
    const [r, g, b] = hexToRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);

    picker.value = hex;
    inHex.value = hex;
    inRgb.value = `rgb(${r}, ${g}, ${b})`;
    inHsl.value = `hsl(${h}, ${s}%, ${l}%)`;

    // Paleta harmônica
    const hComp = (h + 180) % 360;
    const hAna1 = (h + 30) % 360;
    const hAna2 = (h + 330) % 360;
    const colors = [
      `hsl(${h}, ${s}%, ${l}%)`,
      `hsl(${hAna1}, ${s}%, ${l}%)`,
      `hsl(${hAna2}, ${s}%, ${l}%)`,
      `hsl(${hComp}, ${s}%, ${l}%)`,
    ];

    harmonicsBox.innerHTML = colors.map((c) => `<div style="flex: 1; background: ${c};" title="${c}"></div>`).join('');

    historyManager.record('colors-tools', 'Cores', 'Conversão de Cor', hex, `rgb(${r},${g},${b})`);
  }

  picker.addEventListener('input', () => updateColorValues(picker.value));
  inHex.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(inHex.value)) {
      updateColorValues(inHex.value);
    }
  });
  inRgb.addEventListener('input', () => {
    const match = inRgb.value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      const r = Math.min(255, parseInt(match[1]));
      const g = Math.min(255, parseInt(match[2]));
      const b = Math.min(255, parseInt(match[3]));
      updateColorValues(rgbToHex(r, g, b));
    }
  });

  // Contrast Checker
  const cfgPicker = container.querySelector('#contrast-fg-picker') as HTMLInputElement;
  const cfgVal = container.querySelector('#contrast-fg-val') as HTMLInputElement;
  const cbgPicker = container.querySelector('#contrast-bg-picker') as HTMLInputElement;
  const cbgVal = container.querySelector('#contrast-bg-val') as HTMLInputElement;
  const previewBox = container.querySelector('#contrast-preview-box') as HTMLElement;
  const ratioValEl = container.querySelector('#contrast-ratio-val') as HTMLElement;
  const normalTag = container.querySelector('#wcag-normal-tag') as HTMLElement;
  const largeTag = container.querySelector('#wcag-large-tag') as HTMLElement;

  function updateContrast() {
    const fg = cfgPicker.value;
    const bg = cbgPicker.value;
    cfgVal.value = fg;
    cbgVal.value = bg;

    previewBox.style.color = fg;
    previewBox.style.backgroundColor = bg;

    const [r1, g1, b1] = hexToRgb(fg);
    const [r2, g2, b2] = hexToRgb(bg);

    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);

    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    ratioValEl.textContent = `${ratio.toFixed(2)} : 1`;

    if (ratio >= 7.0) {
      normalTag.textContent = 'Aprovado (AAA)';
      normalTag.style.color = 'var(--status-success)';
      largeTag.textContent = 'Aprovado (AAA)';
      largeTag.style.color = 'var(--status-success)';
    } else if (ratio >= 4.5) {
      normalTag.textContent = 'Aprovado (AA)';
      normalTag.style.color = 'var(--status-success)';
      largeTag.textContent = 'Aprovado (AAA)';
      largeTag.style.color = 'var(--status-success)';
    } else if (ratio >= 3.0) {
      normalTag.textContent = 'Reprovado (Falha)';
      normalTag.style.color = 'var(--status-danger)';
      largeTag.textContent = 'Aprovado (AA)';
      largeTag.style.color = 'var(--status-success)';
    } else {
      normalTag.textContent = 'Reprovado (Falha)';
      normalTag.style.color = 'var(--status-danger)';
      largeTag.textContent = 'Reprovado (Falha)';
      largeTag.style.color = 'var(--status-danger)';
    }
  }

  cfgPicker.addEventListener('input', updateContrast);
  cbgPicker.addEventListener('input', updateContrast);
  cfgVal.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(cfgVal.value)) {
      cfgPicker.value = cfgVal.value;
      updateContrast();
    }
  });
  cbgVal.addEventListener('input', () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(cbgVal.value)) {
      cbgPicker.value = cbgVal.value;
      updateContrast();
    }
  });

  // Gradiente
  const gC1 = container.querySelector('#grad-c1') as HTMLInputElement;
  const gC2 = container.querySelector('#grad-c2') as HTMLInputElement;
  const gAng = container.querySelector('#grad-angle') as HTMLInputElement;
  const gAngVal = container.querySelector('#grad-angle-val') as HTMLElement;
  const gPrev = container.querySelector('#grad-preview') as HTMLElement;
  const gCode = container.querySelector('#grad-css-code') as HTMLInputElement;
  const btnCopyGrad = container.querySelector('#btn-copy-grad') as HTMLButtonElement;

  function updateGradient() {
    const deg = gAng.value;
    gAngVal.textContent = `${deg}°`;
    const css = `linear-gradient(${deg}deg, ${gC1.value}, ${gC2.value})`;
    gPrev.style.background = css;
    gCode.value = `background: ${css};`;
  }
  gC1.addEventListener('input', updateGradient);
  gC2.addEventListener('input', updateGradient);
  gAng.addEventListener('input', updateGradient);
  btnCopyGrad.addEventListener('click', () => {
    navigator.clipboard.writeText(gCode.value);
    btnCopyGrad.textContent = 'Copiado!';
    setTimeout(() => { btnCopyGrad.textContent = 'Copiar'; }, 1500);
  });

  // Box Shadow
  const shX = container.querySelector('#sh-x') as HTMLInputElement;
  const shY = container.querySelector('#sh-y') as HTMLInputElement;
  const shB = container.querySelector('#sh-b') as HTMLInputElement;
  const shS = container.querySelector('#sh-s') as HTMLInputElement;
  const shBox = container.querySelector('#shadow-preview-box') as HTMLElement;
  const shCode = container.querySelector('#shadow-css-code') as HTMLInputElement;
  const btnCopyShadow = container.querySelector('#btn-copy-shadow') as HTMLButtonElement;

  function updateShadow() {
    (container.querySelector('#sh-x-val') as HTMLElement).textContent = `${shX.value}px`;
    (container.querySelector('#sh-y-val') as HTMLElement).textContent = `${shY.value}px`;
    (container.querySelector('#sh-b-val') as HTMLElement).textContent = `${shB.value}px`;
    (container.querySelector('#sh-s-val') as HTMLElement).textContent = `${shS.value}px`;

    const cssVal = `${shX.value}px ${shY.value}px ${shB.value}px ${shS.value}px rgba(0, 0, 0, 0.18)`;
    shBox.style.boxShadow = cssVal;
    shCode.value = `box-shadow: ${cssVal};`;
  }
  [shX, shY, shB, shS].forEach((el) => el.addEventListener('input', updateShadow));
  btnCopyShadow.addEventListener('click', () => {
    navigator.clipboard.writeText(shCode.value);
    btnCopyShadow.textContent = 'Copiado!';
    setTimeout(() => { btnCopyShadow.textContent = 'Copiar'; }, 1500);
  });

  updateColorValues('#2563EB');
  updateContrast();
  updateGradient();
  updateShadow();
}
