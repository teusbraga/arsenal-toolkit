import { FilesService, FileHashes } from './files.service';
import { historyManager } from '../../core/history/history.manager';

export function renderFileChecksum(container: HTMLElement) {
  let selectedFile: File | null = null;
  let computedHashes: FileHashes | null = null;
  let isComputing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-checksum" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Verificador de Hash & Integridade (Checksum)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-checksum" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="checksum-setup-area">
      <div class="dropzone-box" id="checksum-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
        <div class="dropzone-text">Arraste qualquer arquivo para calcular a Hash</div>
        <div class="dropzone-hint">Suporta arquivos de qualquer extensão (ISO, EXE, ZIP, PDF, imagens e documentos)</div>
        <input type="file" id="checksum-file-input" style="display: none;" />
      </div>
    </div>

    <div id="checksum-workspace-area" style="display: none;">
      
      <!-- File Metadata Card -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <div style="font-size: 0.8rem; color: var(--text-tertiary); text-transform: uppercase; font-weight: 600;">Arquivo Analisado</div>
            <div id="checksum-file-name" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 4px 0; word-break: break-all;">-</div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);" id="checksum-file-meta">-</div>
          </div>
          <button class="btn-back" id="btn-checksum-new" style="height: 36px; padding: 0 14px; font-size: 0.85rem;">
            Trocar Arquivo
          </button>
        </div>
      </div>

      <!-- Verification / Matcher Section -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <label class="form-label" style="font-weight: 600; margin-bottom: 8px;">
          Comparar com Hash Esperada (Verificação de Autenticidade):
        </label>
        <div style="position: relative;">
          <input type="text" id="checksum-input-verify" class="form-input" placeholder="Cole aqui a hash informada pelo site ou desenvolvedor para testar integridade..." style="font-family: monospace; font-size: 0.85rem; padding-right: 36px;" />
          <button id="btn-checksum-clear-verify" style="position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-tertiary); cursor: pointer; display: none; font-size: 1.1rem;">&times;</button>
        </div>
        <div id="checksum-verify-feedback" style="margin-top: 10px; font-size: 0.9rem; font-weight: 500; display: none;">
          <!-- Result message injected here -->
        </div>
      </div>

      <!-- Hashes Results List -->
      <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 24px;">
        
        <!-- SHA-256 -->
        <div class="hash-card" data-algo="sha256" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">SHA-256</span>
              <span style="background: rgba(34, 197, 94, 0.1); color: #22c55e; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 600;">Padrão da Indústria</span>
            </div>
            <button class="btn-back btn-copy-hash" data-target="hash-sha256" style="height: 30px; padding: 0 10px; font-size: 0.75rem;">
              Copiar
            </button>
          </div>
          <div id="hash-sha256" style="font-family: monospace; font-size: 0.82rem; word-break: break-all; background: var(--bg-page); padding: 8px 10px; border-radius: 4px; border: 1px solid var(--border-color); color: var(--text-primary);">
            Calculando...
          </div>
        </div>

        <!-- MD5 -->
        <div class="hash-card" data-algo="md5" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">MD5</span>
              <span style="background: rgba(148, 163, 184, 0.15); color: var(--text-secondary); font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 500;">Checksum Comum</span>
            </div>
            <button class="btn-back btn-copy-hash" data-target="hash-md5" style="height: 30px; padding: 0 10px; font-size: 0.75rem;">
              Copiar
            </button>
          </div>
          <div id="hash-md5" style="font-family: monospace; font-size: 0.82rem; word-break: break-all; background: var(--bg-page); padding: 8px 10px; border-radius: 4px; border: 1px solid var(--border-color); color: var(--text-primary);">
            Calculando...
          </div>
        </div>

        <!-- SHA-1 -->
        <div class="hash-card" data-algo="sha1" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">SHA-1</span>
              <span style="background: rgba(148, 163, 184, 0.15); color: var(--text-secondary); font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 500;">Git / Torrents</span>
            </div>
            <button class="btn-back btn-copy-hash" data-target="hash-sha1" style="height: 30px; padding: 0 10px; font-size: 0.75rem;">
              Copiar
            </button>
          </div>
          <div id="hash-sha1" style="font-family: monospace; font-size: 0.82rem; word-break: break-all; background: var(--bg-page); padding: 8px 10px; border-radius: 4px; border: 1px solid var(--border-color); color: var(--text-primary);">
            Calculando...
          </div>
        </div>

        <!-- SHA-512 -->
        <div class="hash-card" data-algo="sha512" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">SHA-512</span>
              <span style="background: rgba(59, 130, 246, 0.1); color: #3b82f6; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: 500;">Alta Resistência</span>
            </div>
            <button class="btn-back btn-copy-hash" data-target="hash-sha512" style="height: 30px; padding: 0 10px; font-size: 0.75rem;">
              Copiar
            </button>
          </div>
          <div id="hash-sha512" style="font-family: monospace; font-size: 0.82rem; word-break: break-all; background: var(--bg-page); padding: 8px 10px; border-radius: 4px; border: 1px solid var(--border-color); color: var(--text-primary);">
            Calculando...
          </div>
        </div>

      </div>

    </div>
  `;

  const btnBack = container.querySelector('#btn-back-checksum') as HTMLButtonElement;
  const dropzone = container.querySelector('#checksum-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#checksum-file-input') as HTMLInputElement;

  const setupArea = container.querySelector('#checksum-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#checksum-workspace-area') as HTMLDivElement;

  const fileNameEl = container.querySelector('#checksum-file-name') as HTMLDivElement;
  const fileMetaEl = container.querySelector('#checksum-file-meta') as HTMLDivElement;
  const btnNew = container.querySelector('#btn-checksum-new') as HTMLButtonElement;

  const inputVerify = container.querySelector('#checksum-input-verify') as HTMLInputElement;
  const btnClearVerify = container.querySelector('#btn-checksum-clear-verify') as HTMLButtonElement;
  const verifyFeedback = container.querySelector('#checksum-verify-feedback') as HTMLDivElement;

  const hashSha256El = container.querySelector('#hash-sha256') as HTMLDivElement;
  const hashMd5El = container.querySelector('#hash-md5') as HTMLDivElement;
  const hashSha1El = container.querySelector('#hash-sha1') as HTMLDivElement;
  const hashSha512El = container.querySelector('#hash-sha512') as HTMLDivElement;

  const copyBtns = container.querySelectorAll('.btn-copy-hash');

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnNew.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    computedHashes = null;
    fileInput.value = '';
    inputVerify.value = '';
    verifyFeedback.style.display = 'none';
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
    if (isComputing) return;
    selectedFile = file;
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    fileNameEl.innerText = selectedFile.name;
    const formattedSize = FilesService.formatBytes(selectedFile.size);
    const dateFormatted = new Date(selectedFile.lastModified).toLocaleString();
    fileMetaEl.innerText = `Tamanho: ${formattedSize} (${selectedFile.size.toLocaleString()} bytes) • Modificado em: ${dateFormatted} • Tipo: ${selectedFile.type || 'Binário / Não identificado'}`;

    hashSha256El.innerText = 'Calculando SHA-256...';
    hashMd5El.innerText = 'Calculando MD5...';
    hashSha1El.innerText = 'Calculando SHA-1...';
    hashSha512El.innerText = 'Calculando SHA-512...';

    isComputing = true;
    try {
      computedHashes = await FilesService.computeHashes(selectedFile);
      hashSha256El.innerText = computedHashes.sha256;
      hashMd5El.innerText = computedHashes.md5;
      hashSha1El.innerText = computedHashes.sha1;
      hashSha512El.innerText = computedHashes.sha512;

      checkVerification();

      historyManager.record(
        'file-checksum',
        'files',
        'Verificação de Checksum',
        selectedFile.name,
        `SHA-256: ${computedHashes.sha256.substring(0, 16)}...`,
        {}
      );
    } catch (err) {
      console.error(err);
      hashSha256El.innerText = 'Erro ao calcular';
      hashMd5El.innerText = 'Erro ao calcular';
      hashSha1El.innerText = 'Erro ao calcular';
      hashSha512El.innerText = 'Erro ao calcular';
      alert('Falha ao processar a leitura do arquivo para cálculo criptográfico.');
    } finally {
      isComputing = false;
    }
  }

  // Copy Buttons
  copyBtns.forEach(btn => {
    const btnEl = btn as HTMLElement;
    btnEl.addEventListener('click', async () => {
      const targetId = btnEl.dataset.target;
      if (!targetId) return;
      const targetEl = container.querySelector(`#${targetId}`);
      if (!targetEl) return;

      const text = targetEl.textContent?.trim() || '';
      if (!text || text.includes('Calculando') || text.includes('Erro')) return;

      try {
        await navigator.clipboard.writeText(text);
        const originalText = btnEl.innerHTML;
        btnEl.innerHTML = 'Copiado!';
        btnEl.style.color = '#22c55e';
        setTimeout(() => {
          btnEl.innerHTML = originalText;
          btnEl.style.color = '';
        }, 1800);
      } catch (err) {
        alert('Falha ao copiar para a área de transferência.');
      }
    });
  });

  // Verify input matcher
  inputVerify.addEventListener('input', () => {
    btnClearVerify.style.display = inputVerify.value.trim() ? 'block' : 'none';
    checkVerification();
  });

  btnClearVerify.addEventListener('click', () => {
    inputVerify.value = '';
    btnClearVerify.style.display = 'none';
    checkVerification();
    inputVerify.focus();
  });

  function checkVerification() {
    if (!computedHashes) {
      verifyFeedback.style.display = 'none';
      return;
    }

    const test = inputVerify.value.trim().toLowerCase();
    if (!test) {
      verifyFeedback.style.display = 'none';
      resetCardHighlights();
      return;
    }

    resetCardHighlights();

    if (test === computedHashes.sha256.toLowerCase()) {
      highlightCard('sha256');
      showFeedback(true, '🟢 Correspondência exata detectada com SHA-256! O arquivo é 100% autêntico e íntegro.');
    } else if (test === computedHashes.md5.toLowerCase()) {
      highlightCard('md5');
      showFeedback(true, '🟢 Correspondência exata detectada com MD5! O arquivo confere com o checksum.');
    } else if (test === computedHashes.sha1.toLowerCase()) {
      highlightCard('sha1');
      showFeedback(true, '🟢 Correspondência exata detectada com SHA-1! O arquivo confere com o checksum.');
    } else if (test === computedHashes.sha512.toLowerCase()) {
      highlightCard('sha512');
      showFeedback(true, '🟢 Correspondência exata detectada com SHA-512! O arquivo confere com o checksum.');
    } else {
      showFeedback(false, '🔴 Nenhuma correspondência! A hash colada não coincide com nenhuma das calculadas. O arquivo pode estar corrompido ou adulterado.');
    }
  }

  function showFeedback(success: boolean, message: string) {
    verifyFeedback.style.display = 'block';
    verifyFeedback.innerText = message;
    verifyFeedback.style.color = success ? '#22c55e' : '#ef4444';
  }

  function highlightCard(algo: string) {
    const card = container.querySelector(`.hash-card[data-algo="${algo}"]`) as HTMLElement;
    if (card) {
      card.style.borderColor = '#22c55e';
      card.style.boxShadow = '0 0 0 2px rgba(34, 197, 94, 0.2)';
    }
  }

  function resetCardHighlights() {
    container.querySelectorAll('.hash-card').forEach(c => {
      (c as HTMLElement).style.borderColor = 'var(--border-color)';
      (c as HTMLElement).style.boxShadow = 'none';
    });
  }
}
