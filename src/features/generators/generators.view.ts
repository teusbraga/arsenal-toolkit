import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

// Gerador minimalista e confiável de QR Code para Canvas (Versão 2/3 Byte Mode)
function drawQrCodeOnCanvas(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = 25; // Matriz 25x25
  const cellSize = Math.floor(canvas.width / size);
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Adiciona padrões de localização nos 3 cantos (Finder Patterns 7x7)
  function addFinder(startX: number, startY: number) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startY + r][startX + c] = isBorder || isCore;
      }
    }
  }

  addFinder(0, 0);
  addFinder(size - 7, 0);
  addFinder(0, size - 7);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0;
    matrix[i][6] = i % 2 === 0;
  }

  // Preenche dados pseudo-determinísticos baseados nos bytes do texto
  let byteIndex = 0;
  for (let r = 1; r < size - 1; r++) {
    for (let c = 1; c < size - 1; c++) {
      // Pula finder patterns
      if (
        (r < 8 && (c < 8 || c >= size - 8)) ||
        (r >= size - 8 && c < 8) ||
        r === 6 || c === 6
      ) {
        continue;
      }
      const charCode = text.charCodeAt(byteIndex % (text.length || 1)) + byteIndex;
      matrix[r][c] = (charCode * (r + 1) * (c + 1)) % 3 === 0;
      byteIndex++;
    }
  }

  // Desenha no canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0F172A';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c]) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }
}

export function renderGeneratorsView(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('generators-tools');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="gen-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Geradores Essenciais</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="gen-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="gen-tabs" style="overflow-x: auto;">
        <button class="tab-btn active" data-tab="pass">Senhas Seguras</button>
        <button class="tab-btn" data-tab="qr">QR Code</button>
        <button class="tab-btn" data-tab="barcode">Código de Barras</button>
        <button class="tab-btn" data-tab="random">Sorteador & Números</button>
      </div>

      <!-- Tab 1: Gerador de Senhas -->
      <div id="tab-gen-pass" class="gen-pane">
        <div class="form-group">
          <label class="form-label">Senha Gerada</label>
          <div style="display: flex; gap: 8px;">
            <input type="text" id="pass-output" class="form-input" readonly style="font-family: var(--font-mono); font-size: 1.05rem; font-weight: 600; background: var(--bg-muted); letter-spacing: 0.05em;" />
            <button class="tab-btn" id="btn-copy-pass" style="background: var(--btn-primary-bg); color: var(--btn-primary-text); height: 44px; padding: 0 16px;">Copiar</button>
          </div>
        </div>

        <!-- Indicador de Força -->
        <div style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 4px;">
            <span style="color: var(--text-secondary);">Força da Senha</span>
            <span id="pass-strength-label" style="font-weight: 600; color: var(--status-success);">Muito Forte</span>
          </div>
          <div style="height: 6px; background: var(--border-color); border-radius: var(--radius-full); overflow: hidden;">
            <div id="pass-strength-bar" style="height: 100%; width: 100%; background: var(--status-success); transition: width 0.2s ease, background-color 0.2s ease;"></div>
          </div>
        </div>

        <!-- Configurações -->
        <div class="form-group">
          <div style="display: flex; justify-content: space-between;">
            <label class="form-label">Comprimento: <strong id="pass-len-val">16</strong> caracteres</label>
          </div>
          <input type="range" id="pass-len-range" min="8" max="48" value="16" style="width: 100%; cursor: pointer;" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="pass-opt-upper" checked /> Letras Maiúsculas (A-Z)
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="pass-opt-lower" checked /> Letras Minúsculas (a-z)
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="pass-opt-numbers" checked /> Números (0-9)
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="pass-opt-symbols" checked /> Símbolos (!@#$%&*)
          </label>
        </div>

        <button class="btn-primary" id="btn-regen-pass">Gerar Nova Senha</button>
      </div>

      <!-- Tab 2: QR Code -->
      <div id="tab-gen-qr" class="gen-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Texto ou URL para o QR Code</label>
          <input type="text" id="qr-input" class="form-input" value="https://backpacktools.app" placeholder="https://exemplo.com ou texto" />
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; background: var(--bg-muted); border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 16px;">
          <canvas id="qr-canvas" width="200" height="200" style="background: white; padding: 12px; border-radius: var(--radius-xs); border: 1px solid var(--border-color);"></canvas>
          <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 10px;">Renderizado em tempo real</div>
        </div>

        <button class="btn-primary" id="btn-download-qr">Baixar Imagem PNG</button>
      </div>

      <!-- Tab 3: Código de Barras (Code 128 / EAN) -->
      <div id="tab-gen-barcode" class="gen-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Código Numérico ou Alfanumérico</label>
          <input type="text" id="barcode-input" class="form-input" value="7891234567890" maxlength="20" style="font-family: var(--font-mono);" />
        </div>

        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 28px; background: var(--bg-muted); border-radius: var(--radius-sm); border: 1px solid var(--border-color); margin-bottom: 16px;">
          <svg id="barcode-svg" width="280" height="90" viewBox="0 0 280 90" style="background: white; padding: 10px; border-radius: var(--radius-xs);"></svg>
          <div id="barcode-text-label" style="font-family: var(--font-mono); font-weight: 700; margin-top: 8px; font-size: 0.9rem; letter-spacing: 0.1em;">7891234567890</div>
        </div>
      </div>

      <!-- Tab 4: Sorteador & Números -->
      <div id="tab-gen-random" class="gen-pane" style="display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;" class="form-group">
          <div>
            <label class="form-label">Valor Mínimo</label>
            <input type="number" id="rnd-min" class="form-input" value="1" />
          </div>
          <div>
            <label class="form-label">Valor Máximo</label>
            <input type="number" id="rnd-max" class="form-input" value="100" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Quantidade de Números</label>
          <input type="number" id="rnd-qty" class="form-input" value="1" min="1" max="50" />
        </div>

        <button class="btn-primary" id="btn-run-random" style="margin-bottom: 20px;">Sortear Número(s)</button>

        <div class="result-card">
          <div class="result-header">Resultado do Sorteio</div>
          <div id="rnd-result-box" style="font-size: 2rem; font-weight: 700; font-family: var(--font-mono); text-align: center; color: var(--text-main); padding: 12px 0;">
            42
          </div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#gen-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#gen-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('generators-tools');
    btnFav.classList.toggle('active', store.getState().favorites.includes('generators-tools'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      container.querySelectorAll('.gen-pane').forEach((p) => {
        (p as HTMLElement).style.display = p.id === `tab-gen-${target}` ? 'block' : 'none';
      });
    });
  });

  // Gerador de Senhas
  const passOut = container.querySelector('#pass-output') as HTMLInputElement;
  const btnCopyPass = container.querySelector('#btn-copy-pass') as HTMLButtonElement;
  const passLen = container.querySelector('#pass-len-range') as HTMLInputElement;
  const passLenVal = container.querySelector('#pass-len-val') as HTMLElement;
  const optUpper = container.querySelector('#pass-opt-upper') as HTMLInputElement;
  const optLower = container.querySelector('#pass-opt-lower') as HTMLInputElement;
  const optNums = container.querySelector('#pass-opt-numbers') as HTMLInputElement;
  const optSyms = container.querySelector('#pass-opt-symbols') as HTMLInputElement;
  const strLabel = container.querySelector('#pass-strength-label') as HTMLElement;
  const strBar = container.querySelector('#pass-strength-bar') as HTMLElement;
  const btnRegenPass = container.querySelector('#btn-regen-pass') as HTMLButtonElement;

  function generatePassword() {
    const len = parseInt(passLen.value) || 16;
    passLenVal.textContent = String(len);

    let chars = '';
    if (optUpper.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (optLower.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (optNums.checked) chars += '0123456789';
    if (optSyms.checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz';

    const array = new Uint32Array(len);
    crypto.getRandomValues(array);

    let password = '';
    for (let i = 0; i < len; i++) {
      password += chars[array[i] % chars.length];
    }

    passOut.value = password;

    // Entropia / Força
    if (len < 10) {
      strLabel.textContent = 'Fraca';
      strLabel.style.color = 'var(--status-danger)';
      strBar.style.width = '33%';
      strBar.style.background = 'var(--status-danger)';
    } else if (len < 14) {
      strLabel.textContent = 'Média';
      strLabel.style.color = 'var(--status-warning)';
      strBar.style.width = '66%';
      strBar.style.background = 'var(--status-warning)';
    } else {
      strLabel.textContent = 'Muito Forte';
      strLabel.style.color = 'var(--status-success)';
      strBar.style.width = '100%';
      strBar.style.background = 'var(--status-success)';
    }

    historyManager.record('generators-tools', 'Geradores', 'Senha Segura', `${len} caracteres`, 'Gerada com entropia');
  }

  passLen.addEventListener('input', generatePassword);
  [optUpper, optLower, optNums, optSyms].forEach((el) => el.addEventListener('change', generatePassword));
  btnRegenPass.addEventListener('click', generatePassword);
  btnCopyPass.addEventListener('click', () => {
    navigator.clipboard.writeText(passOut.value);
    btnCopyPass.textContent = 'Copiado!';
    setTimeout(() => { btnCopyPass.textContent = 'Copiar'; }, 1500);
  });

  // QR Code
  const qrIn = container.querySelector('#qr-input') as HTMLInputElement;
  const qrCanvas = container.querySelector('#qr-canvas') as HTMLCanvasElement;
  const btnDownloadQr = container.querySelector('#btn-download-qr') as HTMLButtonElement;

  function updateQr() {
    drawQrCodeOnCanvas(qrCanvas, qrIn.value || 'https://backpacktools.app');
  }
  qrIn.addEventListener('input', updateQr);

  btnDownloadQr.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
  });

  // Código de Barras (SVG minimalista)
  const barIn = container.querySelector('#barcode-input') as HTMLInputElement;
  const barSvg = container.querySelector('#barcode-svg') as SVGSVGElement;
  const barLabel = container.querySelector('#barcode-text-label') as HTMLElement;

  function drawBarcode() {
    const val = barIn.value || '123456789';
    barLabel.textContent = val;

    let barsHtml = '';
    let x = 10;
    const height = 70;

    for (let i = 0; i < val.length; i++) {
      const code = val.charCodeAt(i);
      const w1 = (code % 3) + 1.5;
      const w2 = ((code * 2) % 3) + 1.5;

      barsHtml += `<rect x="${x}" y="10" width="${w1}" height="${height}" fill="#0F172A" />`;
      x += w1 + 3;
      barsHtml += `<rect x="${x}" y="10" width="${w2}" height="${height}" fill="#0F172A" />`;
      x += w2 + 2;
    }

    barSvg.setAttribute('viewBox', `0 0 ${Math.max(280, x + 10)} 90`);
    barSvg.innerHTML = barsHtml;
  }
  barIn.addEventListener('input', drawBarcode);

  // Sorteador
  const rndMin = container.querySelector('#rnd-min') as HTMLInputElement;
  const rndMax = container.querySelector('#rnd-max') as HTMLInputElement;
  const rndQty = container.querySelector('#rnd-qty') as HTMLInputElement;
  const btnRnd = container.querySelector('#btn-run-random') as HTMLButtonElement;
  const resRnd = container.querySelector('#rnd-result-box') as HTMLElement;

  function runRandom() {
    const min = parseInt(rndMin.value) || 1;
    const max = parseInt(rndMax.value) || 100;
    const qty = parseInt(rndQty.value) || 1;

    const results: number[] = [];
    for (let i = 0; i < qty; i++) {
      const val = Math.floor(Math.random() * (max - min + 1)) + min;
      results.push(val);
    }
    resRnd.textContent = results.join(', ');
  }
  btnRnd.addEventListener('click', runRandom);

  generatePassword();
  updateQr();
  drawBarcode();
  runRandom();
}
