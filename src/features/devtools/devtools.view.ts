import { store } from '../../app/store';
import { historyManager } from '../../core/history/history.manager';

export function renderDevTools(container: HTMLElement): void {
  const isFav = store.getState().favorites.includes('dev-tools');

  container.innerHTML = `
    <div class="tool-view-wrapper">
      <div class="tool-view-header">
        <div class="tool-header-left">
          <button class="btn-back" id="dev-btn-back" title="Voltar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </button>
          <h2 class="tool-header-title">Developer Tools</h2>
        </div>
        <button class="btn-favorite ${isFav ? 'active' : ''}" id="dev-btn-fav" title="Favoritar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      </div>

      <div class="segmented-tabs" id="dev-tabs" style="overflow-x: auto;">
        <button class="tab-btn active" data-tab="json">JSON Formatter</button>
        <button class="tab-btn" data-tab="encode">Base64 & URL</button>
        <button class="tab-btn" data-tab="hash">Hashes & UUID</button>
        <button class="tab-btn" data-tab="jwt">JWT Decoder</button>
        <button class="tab-btn" data-tab="regex">Regex Tester</button>
      </div>

      <!-- Tab 1: JSON Formatter -->
      <div id="tab-dev-json" class="dev-pane">
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <label class="form-label">Cole seu JSON:</label>
            <span id="json-status-tag" style="font-size: 0.75rem; font-weight: 600; color: var(--status-success);">JSON Válido</span>
          </div>
          <textarea id="json-input" class="form-input" style="height: 180px; font-family: var(--font-mono); font-size: 0.82rem; white-space: pre;">{"name":"Backpack Tools","version":1,"features":["offline","pwa","ts"],"active":true}</textarea>
        </div>

        <div style="display: flex; gap: 8px;">
          <button class="tab-btn" id="btn-json-pretty" style="background: var(--bg-surface); border: 1px solid var(--border-color);">Formatar (2 espaços)</button>
          <button class="tab-btn" id="btn-json-minify" style="background: var(--bg-surface); border: 1px solid var(--border-color);">Minificar</button>
          <button class="tab-btn" id="btn-json-copy" style="background: var(--btn-primary-bg); color: var(--btn-primary-text); margin-left: auto;">Copiar</button>
        </div>
      </div>

      <!-- Tab 2: Base64 & Encoders -->
      <div id="tab-dev-encode" class="dev-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Entrada (Texto)</label>
          <textarea id="enc-input" class="form-input" style="height: 80px; font-family: var(--font-mono); font-size: 0.85rem;">Desenvolvimento de software profissional</textarea>
        </div>

        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px;">
          <button class="tab-btn enc-act-btn" data-act="b64-enc">Base64 Encode</button>
          <button class="tab-btn enc-act-btn" data-act="b64-dec">Base64 Decode</button>
          <button class="tab-btn enc-act-btn" data-act="url-enc">URL Encode</button>
          <button class="tab-btn enc-act-btn" data-act="url-dec">URL Decode</button>
          <button class="tab-btn enc-act-btn" data-act="html-enc">HTML Entities</button>
        </div>

        <div class="form-group">
          <label class="form-label">Saída</label>
          <textarea id="enc-output" class="form-input" readonly style="height: 80px; font-family: var(--font-mono); font-size: 0.85rem; background: var(--bg-muted);"></textarea>
        </div>
      </div>

      <!-- Tab 3: Hashes & UUID -->
      <div id="tab-dev-hash" class="dev-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Texto para Gerar Hash</label>
          <input type="text" id="hash-input" class="form-input" value="BackpackTools2026" style="font-family: var(--font-mono);" />
        </div>

        <div class="result-card" style="margin-bottom: 24px;">
          <div class="result-header">Hashes Criptográficos (Web Crypto)</div>
          <div class="result-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
            <span class="result-label" style="font-weight: 600;">SHA-256</span>
            <span class="result-value" id="hash-sha256" style="font-size: 0.78rem; word-break: break-all;">calculando...</span>
          </div>
          <div class="result-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
            <span class="result-label" style="font-weight: 600;">SHA-512</span>
            <span class="result-value" id="hash-sha512" style="font-size: 0.72rem; word-break: break-all;">calculando...</span>
          </div>
          <div class="result-row" style="flex-direction: column; align-items: flex-start; gap: 4px;">
            <span class="result-label" style="font-weight: 600;">SHA-1</span>
            <span class="result-value" id="hash-sha1" style="font-size: 0.78rem; word-break: break-all;">calculando...</span>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <label class="form-label" style="font-weight: 600; margin-bottom: 0;">Gerador de UUID v4</label>
            <button class="btn-primary" id="btn-gen-uuid" style="margin-top: 0; width: auto; padding: 0 16px; height: 36px; font-size: 0.82rem;">Gerar Novo UUID</button>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="text" id="uuid-output" class="form-input" readonly style="font-family: var(--font-mono); background: var(--bg-muted); font-size: 0.88rem;" />
            <button id="btn-copy-uuid" class="tab-btn" style="background: var(--bg-surface); border: 1px solid var(--border-color); height: 44px; padding: 0 16px;">Copiar</button>
          </div>
        </div>
      </div>

      <!-- Tab 4: JWT Decoder -->
      <div id="tab-dev-jwt" class="dev-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Cole o JWT (JSON Web Token)</label>
          <textarea id="jwt-input" class="form-input" style="height: 90px; font-family: var(--font-mono); font-size: 0.8rem;" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ik1hcmlhbmEgU2lsdmEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MDQxNDQwMDAsImV4cCI6MTgwMDAwMDAwMH0.signature</textarea>
        </div>

        <div style="display: flex; gap: 8px; margin-bottom: 14px;">
          <span id="jwt-status" style="font-size: 0.82rem; font-weight: 600; padding: 4px 10px; border-radius: var(--radius-xs); background: #DCFCE7; color: #166534;">Token Válido / Decodificado</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label class="form-label" style="font-size: 0.78rem; font-weight: 600;">Header (Cabeçalho)</label>
            <pre id="jwt-header-box" style="background: var(--bg-muted); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px; font-size: 0.78rem; font-family: var(--font-mono); min-height: 100px; overflow-x: auto;"></pre>
          </div>
          <div>
            <label class="form-label" style="font-size: 0.78rem; font-weight: 600;">Payload (Dados)</label>
            <pre id="jwt-payload-box" style="background: var(--bg-muted); border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px; font-size: 0.78rem; font-family: var(--font-mono); min-height: 100px; overflow-x: auto;"></pre>
          </div>
        </div>
      </div>

      <!-- Tab 5: Regex Tester -->
      <div id="tab-dev-regex" class="dev-pane" style="display: none;">
        <div class="form-group">
          <label class="form-label">Expressão Regular (Pattern)</label>
          <div style="display: flex; gap: 6px; align-items: center;">
            <span style="font-family: var(--font-mono); font-size: 1.1rem; color: var(--text-secondary);">/</span>
            <input type="text" id="regex-pattern" class="form-input" value="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" style="font-family: var(--font-mono);" />
            <span style="font-family: var(--font-mono); font-size: 1.1rem; color: var(--text-secondary);">/</span>
            <input type="text" id="regex-flags" class="form-input" value="g" style="width: 50px; text-align: center; font-family: var(--font-mono);" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Texto de Teste</label>
          <textarea id="regex-text" class="form-input" style="height: 90px; font-family: var(--font-mono); font-size: 0.85rem;">Contate-nos em contato@worktools.app ou suporte@backpack.io para mais detalhes.</textarea>
        </div>

        <div class="result-card">
          <div class="result-header">Correspondências (Matches Encontrados: <span id="regex-match-count">2</span>)</div>
          <div id="regex-matches-list" style="font-family: var(--font-mono); font-size: 0.85rem; display: flex; flex-direction: column; gap: 6px;"></div>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#dev-btn-back') as HTMLButtonElement;
  const btnFav = container.querySelector('#dev-btn-fav') as HTMLButtonElement;
  const tabs = container.querySelectorAll('.tab-btn');

  btnBack.addEventListener('click', () => { window.location.hash = '#/'; });
  btnFav.addEventListener('click', () => {
    store.toggleFavorite('dev-tools');
    btnFav.classList.toggle('active', store.getState().favorites.includes('dev-tools'));
  });

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');

      container.querySelectorAll('.dev-pane').forEach((p) => {
        (p as HTMLElement).style.display = p.id === `tab-dev-${target}` ? 'block' : 'none';
      });
    });
  });

  // JSON Formatter
  const jsonIn = container.querySelector('#json-input') as HTMLTextAreaElement;
  const jsonStatus = container.querySelector('#json-status-tag') as HTMLElement;
  const btnPretty = container.querySelector('#btn-json-pretty') as HTMLButtonElement;
  const btnMinify = container.querySelector('#btn-json-minify') as HTMLButtonElement;
  const btnCopy = container.querySelector('#btn-json-copy') as HTMLButtonElement;

  function validateJson() {
    try {
      const parsed = JSON.parse(jsonIn.value);
      jsonStatus.textContent = 'JSON Válido';
      jsonStatus.style.color = 'var(--status-success)';
      historyManager.record(
        'dev-tools',
        'Dev Tools',
        'Validação JSON',
        `${jsonIn.value.length} chars`,
        'JSON Válido'
      );
      return parsed;
    } catch (err: unknown) {
      jsonStatus.textContent = `Erro de sintaxe`;
      jsonStatus.style.color = 'var(--status-danger)';
      return null;
    }
  }

  btnPretty.addEventListener('click', () => {
    const parsed = validateJson();
    if (parsed) jsonIn.value = JSON.stringify(parsed, null, 2);
  });

  btnMinify.addEventListener('click', () => {
    const parsed = validateJson();
    if (parsed) jsonIn.value = JSON.stringify(parsed);
  });

  btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(jsonIn.value);
    btnCopy.textContent = 'Copiado!';
    setTimeout(() => { btnCopy.textContent = 'Copiar'; }, 1500);
  });

  jsonIn.addEventListener('input', validateJson);

  // Encoders
  const encIn = container.querySelector('#enc-input') as HTMLTextAreaElement;
  const encOut = container.querySelector('#enc-output') as HTMLTextAreaElement;

  container.querySelectorAll('.enc-act-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-act');
      const text = encIn.value;

      try {
        if (act === 'b64-enc') {
          encOut.value = btoa(unescape(encodeURIComponent(text)));
        } else if (act === 'b64-dec') {
          encOut.value = decodeURIComponent(escape(atob(text)));
        } else if (act === 'url-enc') {
          encOut.value = encodeURIComponent(text);
        } else if (act === 'url-dec') {
          encOut.value = decodeURIComponent(text);
        } else if (act === 'html-enc') {
          encOut.value = text.replace(/[\u00A0-\u9999<>&]/g, (i) => '&#' + i.charCodeAt(0) + ';');
        }
      } catch {
        encOut.value = 'Erro ao processar conversão.';
      }
    });
  });

  // Hashes & UUID
  const hashIn = container.querySelector('#hash-input') as HTMLInputElement;
  const sha256El = container.querySelector('#hash-sha256') as HTMLElement;
  const sha512El = container.querySelector('#hash-sha512') as HTMLElement;
  const sha1El = container.querySelector('#hash-sha1') as HTMLElement;

  async function generateHashes() {
    const text = hashIn.value;
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    async function hash(algo: string) {
      const buf = await crypto.subtle.digest(algo, data);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    try {
      sha256El.textContent = await hash('SHA-256');
      sha512El.textContent = await hash('SHA-512');
      sha1El.textContent = await hash('SHA-1');
    } catch {
      sha256El.textContent = 'Indisponível';
    }
  }
  hashIn.addEventListener('input', generateHashes);

  const uuidOut = container.querySelector('#uuid-output') as HTMLInputElement;
  const btnGenUuid = container.querySelector('#btn-gen-uuid') as HTMLButtonElement;
  const btnCopyUuid = container.querySelector('#btn-copy-uuid') as HTMLButtonElement;

  function genUuid() {
    uuidOut.value = crypto.randomUUID();
  }
  btnGenUuid.addEventListener('click', genUuid);
  btnCopyUuid.addEventListener('click', () => {
    navigator.clipboard.writeText(uuidOut.value);
    btnCopyUuid.textContent = 'Copiado!';
    setTimeout(() => { btnCopyUuid.textContent = 'Copiar'; }, 1500);
  });

  // JWT Decoder
  const jwtIn = container.querySelector('#jwt-input') as HTMLTextAreaElement;
  const jwtHeader = container.querySelector('#jwt-header-box') as HTMLElement;
  const jwtPayload = container.querySelector('#jwt-payload-box') as HTMLElement;
  const jwtStatus = container.querySelector('#jwt-status') as HTMLElement;

  function decodeJwt() {
    const token = jwtIn.value.trim();
    const parts = token.split('.');

    if (parts.length < 2) {
      jwtStatus.textContent = 'Token Inválido (requer formato xxx.yyy.zzz)';
      jwtStatus.style.background = '#FEE2E2';
      jwtStatus.style.color = '#991B1B';
      jwtHeader.textContent = '';
      jwtPayload.textContent = '';
      return;
    }

    try {
      const hJson = JSON.parse(decodeURIComponent(escape(atob(parts[0]))));
      const pJson = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));

      jwtHeader.textContent = JSON.stringify(hJson, null, 2);
      jwtPayload.textContent = JSON.stringify(pJson, null, 2);

      let statusMsg = 'Token Válido';
      if (pJson.exp) {
        const expDate = new Date(pJson.exp * 1000);
        const isExpired = Date.now() > expDate.getTime();
        statusMsg = isExpired ? `Expirado em ${expDate.toLocaleDateString()} às ${expDate.toLocaleTimeString()}` : `Válido até ${expDate.toLocaleDateString()}`;
      }

      jwtStatus.textContent = statusMsg;
      jwtStatus.style.background = '#DCFCE7';
      jwtStatus.style.color = '#166534';
    } catch {
      jwtStatus.textContent = 'Erro ao decodificar partes base64.';
      jwtStatus.style.background = '#FEE2E2';
      jwtStatus.style.color = '#991B1B';
    }
  }
  jwtIn.addEventListener('input', decodeJwt);

  // Regex Tester
  const regPattern = container.querySelector('#regex-pattern') as HTMLInputElement;
  const regFlags = container.querySelector('#regex-flags') as HTMLInputElement;
  const regText = container.querySelector('#regex-text') as HTMLTextAreaElement;
  const regCount = container.querySelector('#regex-match-count') as HTMLElement;
  const regList = container.querySelector('#regex-matches-list') as HTMLElement;

  function testRegex() {
    try {
      const regex = new RegExp(regPattern.value, regFlags.value);
      const text = regText.value;
      const matches = Array.from(text.matchAll(regex));

      regCount.textContent = String(matches.length);

      if (matches.length === 0) {
        regList.innerHTML = `<span style="color: var(--text-tertiary);">Nenhuma correspondência encontrada.</span>`;
      } else {
        regList.innerHTML = matches.map((m, idx) => `
          <div style="background: var(--bg-muted); padding: 4px 8px; border-radius: var(--radius-xs);">
            <strong style="color: var(--text-secondary); font-size: 0.75rem;">#${idx + 1}</strong>: 
            <span style="color: var(--status-success); font-weight: 600;">"${m[0]}"</span> (índice ${m.index})
          </div>
        `).join('');
      }
    } catch {
      regCount.textContent = 'Erro de Sintaxe';
      regList.innerHTML = `<span style="color: var(--status-danger);">Expressão regular inválida.</span>`;
    }
  }

  regPattern.addEventListener('input', testRegex);
  regFlags.addEventListener('input', testRegex);
  regText.addEventListener('input', testRegex);

  validateJson();
  generateHashes();
  genUuid();
  decodeJwt();
  testRegex();
}
