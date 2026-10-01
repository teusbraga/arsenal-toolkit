import { FilesService } from './files.service';
import { historyManager } from '../../core/history/history.manager';

export function renderFileAnalyzer(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let maxHexBytes = 512;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-analyzer" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Analisador & Inspetor de Arquivos</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-analyzer" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="analyzer-setup-area">
      <div class="dropzone-box" id="analyzer-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="11" cy="14" r="3"/><path d="m13.5 16.5 3 3"/></svg>
        <div class="dropzone-text">Arraste qualquer arquivo para inspeção forense</div>
        <div class="dropzone-hint">Descubra o formato real (Magic Bytes), detecte extensões falsas e examine o Hex Dump</div>
        <input type="file" id="analyzer-file-input" style="display: none;" />
      </div>
    </div>

    <div id="analyzer-workspace-area" style="display: none;">
      
      <!-- Mismatch / Integrity Alert Banner -->
      <div id="analyzer-alert-banner" style="display: none; padding: 14px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 0.9rem; font-weight: 500;">
        <!-- Alert text injected here -->
      </div>

      <!-- File Metadata Cards Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 14px; margin-bottom: 24px;">
        
        <!-- Format Card -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; margin-bottom: 4px;">Formato Binário Real</div>
          <div id="ana-real-format" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">-</div>
          <div id="ana-real-desc" style="font-size: 0.8rem; color: var(--text-secondary);">-</div>
          <div style="margin-top: 10px; font-size: 0.8rem;">
            <span style="color: var(--text-tertiary);">MIME Detectado:</span> <code id="ana-real-mime" style="font-size: 0.8rem; background: var(--bg-page); padding: 2px 6px; border-radius: 4px;">-</code>
          </div>
        </div>

        <!-- Size & Metrics Card -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600; margin-bottom: 4px;">Tamanho & Peso</div>
          <div id="ana-size-formatted" style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">-</div>
          <div id="ana-size-bytes" style="font-size: 0.8rem; color: var(--text-secondary);">-</div>
          <div style="margin-top: 10px; font-size: 0.8rem;">
            <span style="color: var(--text-tertiary);">Modificado em:</span> <span id="ana-modified" style="color: var(--text-primary);">-</span>
          </div>
        </div>

        <!-- Entropy Card -->
        <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Entropia de Shannon</span>
            <span id="ana-entropy-val" style="font-weight: 700; font-size: 1rem; color: var(--btn-primary-bg);">-</span>
          </div>
          <div style="background: var(--bg-page); height: 8px; border-radius: 4px; overflow: hidden; margin: 8px 0; border: 1px solid var(--border-color);">
            <div id="ana-entropy-bar" style="height: 100%; width: 0%; background: var(--btn-primary-bg); transition: width 0.4s ease;"></div>
          </div>
          <div id="ana-entropy-hint" style="font-size: 0.75rem; color: var(--text-secondary); line-height: 1.3;">-</div>
        </div>

      </div>

      <!-- Hex Dump Inspector -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 700;">Inspeção Binária (Hex Dump)</h3>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">Visualização dos primeiros bytes e cabeçalhos brutos do arquivo</span>
          </div>
          
          <div style="display: flex; gap: 8px; align-items: center;">
            <select id="ana-hex-limit" class="form-input" style="height: 32px; padding: 2px 8px; font-size: 0.8rem; width: auto;">
              <option value="256">256 bytes</option>
              <option value="512" selected>512 bytes</option>
              <option value="1024">1024 bytes</option>
            </select>
            <button class="btn-back" id="btn-ana-copy-hex" style="height: 32px; padding: 0 10px; font-size: 0.8rem;">
              Copiar Hex
            </button>
          </div>
        </div>

        <!-- Hex Table View -->
        <div style="overflow-x: auto; background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px;">
          <table style="width: 100%; border-collapse: collapse; font-family: 'Consolas', 'Courier New', monospace; font-size: 0.8rem; line-height: 1.5;">
            <thead>
              <tr style="color: var(--text-tertiary); border-bottom: 1px solid var(--border-color); text-align: left;">
                <th style="padding: 4px 8px; width: 90px;">Offset</th>
                <th style="padding: 4px 8px;">Bytes Hexadecimais</th>
                <th style="padding: 4px 8px; width: 140px;">ASCII</th>
              </tr>
            </thead>
            <tbody id="ana-hex-tbody">
              <!-- Hex rows injected here -->
            </tbody>
          </table>
        </div>
      </div>

      <button class="btn-back" id="btn-ana-reset" style="width: 100%; justify-content: center; height: 42px;">
        Analisar Outro Arquivo
      </button>

    </div>
  `;

  const btnBack = container.querySelector('#btn-back-analyzer') as HTMLButtonElement;
  const dropzone = container.querySelector('#analyzer-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#analyzer-file-input') as HTMLInputElement;

  const setupArea = container.querySelector('#analyzer-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#analyzer-workspace-area') as HTMLDivElement;
  const alertBanner = container.querySelector('#analyzer-alert-banner') as HTMLDivElement;

  const realFormatEl = container.querySelector('#ana-real-format') as HTMLDivElement;
  const realDescEl = container.querySelector('#ana-real-desc') as HTMLDivElement;
  const realMimeEl = container.querySelector('#ana-real-mime') as HTMLElement;

  const sizeFormattedEl = container.querySelector('#ana-size-formatted') as HTMLDivElement;
  const sizeBytesEl = container.querySelector('#ana-size-bytes') as HTMLDivElement;
  const modifiedEl = container.querySelector('#ana-modified') as HTMLSpanElement;

  const entropyValEl = container.querySelector('#ana-entropy-val') as HTMLSpanElement;
  const entropyBarEl = container.querySelector('#ana-entropy-bar') as HTMLDivElement;
  const entropyHintEl = container.querySelector('#ana-entropy-hint') as HTMLDivElement;

  const hexLimitSelect = container.querySelector('#ana-hex-limit') as HTMLSelectElement;
  const btnCopyHex = container.querySelector('#btn-ana-copy-hex') as HTMLButtonElement;
  const hexTbody = container.querySelector('#ana-hex-tbody') as HTMLTableSectionElement;
  const btnReset = container.querySelector('#btn-ana-reset') as HTMLButtonElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    fileBuffer = null;
    fileInput.value = '';
    alertBanner.style.display = 'none';
    hexTbody.innerHTML = '';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--btn-primary-bg)'; });
  dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--border-color)'; });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) handleFile(fileInput.files[0]);
  });

  async function handleFile(file: File) {
    selectedFile = file;
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    // Read first slice of the file (up to 64KB for analysis & entropy sample)
    const sampleSize = Math.min(file.size, 65536);
    const slice = file.slice(0, sampleSize);
    fileBuffer = await slice.arrayBuffer();
    const uint8 = new Uint8Array(fileBuffer);

    // 1. Signature & Mismatch Detection
    const sig = FilesService.detectSignature(uint8, file.name);
    realFormatEl.innerText = `${sig.detectedExt.toUpperCase()} (${sig.category})`;
    realDescEl.innerText = sig.description;
    realMimeEl.innerText = sig.detectedMime;

    if (sig.isMismatch) {
      alertBanner.style.display = 'block';
      alertBanner.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      alertBanner.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      alertBanner.style.color = '#ef4444';
      alertBanner.innerHTML = `⚠️ <strong>Incompatibilidade de Extensão Detectada!</strong> O arquivo foi salvo com uma extensão divergente do seu conteúdo binário real (detectado: <code>.${sig.detectedExt}</code>). Pode ser um arquivo renomeado propositalmente ou com formato corrompido.`;
    } else {
      alertBanner.style.display = 'block';
      alertBanner.style.backgroundColor = 'rgba(34, 197, 94, 0.08)';
      alertBanner.style.border = '1px solid rgba(34, 197, 94, 0.25)';
      alertBanner.style.color = '#22c55e';
      alertBanner.innerHTML = `✅ <strong>Assinatura Consistente:</strong> O cabeçalho binário (Magic Bytes) confere com a extensão e formato declarados.`;
    }

    // 2. Metrics & Size
    sizeFormattedEl.innerText = FilesService.formatBytes(file.size);
    sizeBytesEl.innerText = `${file.size.toLocaleString()} bytes (${(file.size * 8).toLocaleString()} bits)`;
    modifiedEl.innerText = new Date(file.lastModified).toLocaleString();

    // 3. Shannon Entropy
    const entropy = FilesService.calculateEntropy(uint8);
    entropyValEl.innerText = `${entropy} / 8.00`;
    const percentage = Math.min(100, Math.round((entropy / 8.0) * 100));
    entropyBarEl.style.width = `${percentage}%`;

    if (entropy >= 7.5) {
      entropyBarEl.style.backgroundColor = '#8b5cf6';
      entropyHintEl.innerText = 'Alta entropia: Típico de dados compactados (ZIP/PNG/MP4) ou criptografia forte.';
    } else if (entropy >= 5.0) {
      entropyBarEl.style.backgroundColor = 'var(--btn-primary-bg)';
      entropyHintEl.innerText = 'Entropia moderada: Comum em código binário compilado ou documentos mistos.';
    } else {
      entropyBarEl.style.backgroundColor = '#22c55e';
      entropyHintEl.innerText = 'Baixa entropia: Típico de texto puro, CSV, logs ou dados com repetições e espaços.';
    }

    // 4. Render Hex Dump
    renderHexDump();

    historyManager.record(
      'file-analyzer',
      'files',
      'Inspeção Forense de Arquivo',
      selectedFile.name,
      `Formato: ${sig.detectedExt.toUpperCase()} • Entropia: ${entropy}`,
      {}
    );
  }

  hexLimitSelect.addEventListener('change', () => {
    maxHexBytes = parseInt(hexLimitSelect.value, 10) || 512;
    renderHexDump();
  });

  function renderHexDump() {
    if (!fileBuffer) return;
    const uint8 = new Uint8Array(fileBuffer);
    const rows = FilesService.generateHexDump(uint8, maxHexBytes);

    hexTbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.03)';
      tr.innerHTML = `
        <td style="padding: 2px 8px; color: var(--text-tertiary);">${r.offset}</td>
        <td style="padding: 2px 8px; color: var(--text-primary); letter-spacing: 0.5px;">${r.hex}</td>
        <td style="padding: 2px 8px; color: #3b82f6;">${escapeHtml(r.ascii)}</td>
      `;
      hexTbody.appendChild(tr);
    });
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  btnCopyHex.addEventListener('click', async () => {
    if (!fileBuffer) return;
    const uint8 = new Uint8Array(fileBuffer);
    const rows = FilesService.generateHexDump(uint8, maxHexBytes);
    const dumpText = rows.map(r => `${r.offset}  ${r.hex}  |${r.ascii}|`).join('\n');

    try {
      await navigator.clipboard.writeText(dumpText);
      const originalText = btnCopyHex.innerHTML;
      btnCopyHex.innerHTML = 'Copiado!';
      btnCopyHex.style.color = '#22c55e';
      setTimeout(() => {
        btnCopyHex.innerHTML = originalText;
        btnCopyHex.style.color = '';
      }, 1800);
    } catch (err) {
      alert('Falha ao copiar Hex Dump.');
    }
  });
}
