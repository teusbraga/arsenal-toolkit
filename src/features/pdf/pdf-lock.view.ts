import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';
import * as pdfjsLib from 'pdfjs-dist';

export function renderPdfLock(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let lockedPdfBytes: Uint8Array | null = null;
  let pageCount = 0;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdflock" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Bloquear PDF com Senha</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdflock" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <!-- Dropzone Area -->
    <div id="pdflock-setup-area">
      <div class="dropzone-box" id="pdflock-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <div class="dropzone-text">Arraste seu PDF para proteger com senha</div>
        <div class="dropzone-hint">Criptografia militar AES-256 e controle de permissões de cópia e impressão</div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(34, 197, 94, 0.1); color: #16a34a; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          100% Local & Seguro • Nenhuma senha ou arquivo é enviado para servidores
        </div>
        <input type="file" id="pdflock-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <!-- Workspace Area -->
    <div id="pdflock-workspace-area" style="display: none; max-width: 680px; margin: 0 auto;">
      
      <!-- File Summary Card -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 18px; margin-bottom: 18px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: var(--bg-page); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-primary);">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div id="pdflock-file-name" style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); word-break: break-all;">-</div>
              <div style="display: flex; gap: 8px; font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">
                <span id="pdflock-file-size">-</span>
                <span>•</span>
                <span id="pdflock-file-pages">-</span>
              </div>
            </div>
          </div>
          <button class="btn-back" id="btn-pdflock-reset" style="height: 34px; padding: 0 12px; font-size: 0.8rem;">
            Trocar Arquivo
          </button>
        </div>
      </div>

      <!-- Password Configuration Card -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 22px; margin-bottom: 18px;">
        <h3 style="font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Definir Senha de Abertura
        </h3>

        <!-- Main Password -->
        <div style="margin-bottom: 14px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Senha do Documento</label>
          <div style="position: relative;">
            <input type="password" id="input-pdflock-pwd" class="form-input" placeholder="Digite a senha que protegerá o PDF..." style="padding-right: 42px; font-size: 0.9rem;" autocomplete="new-password" />
            <button type="button" id="btn-toggle-pdflock-pwd" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; align-items: center;" title="Mostrar/ocultar senha">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <!-- Strength Bar -->
          <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
            <div style="flex: 1; height: 4px; background: var(--bg-page); border-radius: 2px; overflow: hidden; display: flex; gap: 3px;">
              <div id="pwd-bar-1" style="flex: 1; height: 100%; background: var(--border-color); border-radius: 2px; transition: background 0.2s;"></div>
              <div id="pwd-bar-2" style="flex: 1; height: 100%; background: var(--border-color); border-radius: 2px; transition: background 0.2s;"></div>
              <div id="pwd-bar-3" style="flex: 1; height: 100%; background: var(--border-color); border-radius: 2px; transition: background 0.2s;"></div>
              <div id="pwd-bar-4" style="flex: 1; height: 100%; background: var(--border-color); border-radius: 2px; transition: background 0.2s;"></div>
            </div>
            <span id="pwd-strength-label" style="font-size: 0.75rem; color: var(--text-secondary); min-width: 60px; text-align: right;">-</span>
          </div>
        </div>

        <!-- Confirm Password -->
        <div style="margin-bottom: 16px;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Confirme a Senha</label>
          <div style="position: relative;">
            <input type="password" id="input-pdflock-confirm" class="form-input" placeholder="Repita a mesma senha..." style="padding-right: 42px; font-size: 0.9rem;" autocomplete="new-password" />
            <button type="button" id="btn-toggle-pdflock-confirm" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; align-items: center;" title="Mostrar/ocultar senha">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div id="pdflock-match-msg" style="font-size: 0.75rem; margin-top: 5px; color: var(--text-secondary); display: none;"></div>
        </div>

        <!-- Advanced Options Toggle -->
        <details style="margin-top: 18px; border-top: 1px solid var(--border-color); padding-top: 14px;">
          <summary style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); cursor: pointer; user-select: none;">
            Opções Avançadas de Criptografia & Permissões
          </summary>

          <div style="margin-top: 14px; padding: 12px; background: var(--bg-page); border-radius: 8px; border: 1px solid var(--border-color);">
            
            <!-- Algorithm -->
            <div style="margin-bottom: 14px;">
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Algoritmo de Segurança</label>
              <select id="select-pdflock-algo" class="form-input" style="font-size: 0.85rem;">
                <option value="AES-256" selected>AES-256 bits (Padrão da Indústria - Mais Seguro)</option>
                <option value="RC4">RC4 128 bits (Compatibilidade com Leitores Legados)</option>
              </select>
            </div>

            <!-- Permissions Checkboxes -->
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Permissões Permitidas ao Leitor</label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 14px;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="check-allow-print" checked />
                <span>Permitir Impressão</span>
              </label>

              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="check-allow-copy" checked />
                <span>Permitir Copiar Texto</span>
              </label>

              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="check-allow-annot" checked />
                <span>Permitir Comentários</span>
              </label>

              <label style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-secondary); cursor: pointer;">
                <input type="checkbox" id="check-allow-modify" />
                <span>Permitir Modificar Páginas</span>
              </label>
            </div>

            <!-- Owner Password (Optional) -->
            <div>
              <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-primary); margin-bottom: 4px;">Senha de Proprietário / Mestre (Opcional)</label>
              <input type="password" id="input-pdflock-owner" class="form-input" placeholder="Para alterar permissões posteriormente..." style="font-size: 0.85rem;" autocomplete="off" />
              <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 3px;">Se não preenchida, o documento usará uma chave mestre aleatória.</div>
            </div>

          </div>
        </details>

        <!-- Lock Button -->
        <div style="margin-top: 22px;">
          <button class="btn-primary" id="btn-pdflock-action" style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Bloquear PDF com Senha
          </button>
        </div>

      </div>

      <!-- Success Result Box -->
      <div id="pdflock-result-box" style="display: none; background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; text-align: center; margin-top: 16px;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); color: #22c55e; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">PDF Protegido com Sucesso!</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px; max-width: 480px; margin-left: auto; margin-right: auto;" id="pdflock-success-desc">
          O arquivo foi criptografado com o algoritmo selecionado. A partir de agora, o leitor precisará informar a senha cadastrada para visualizar seu conteúdo.
        </p>

        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="btn-primary" id="btn-pdflock-download" style="width: auto; height: 42px; padding: 0 24px; font-size: 0.95rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar PDF Protegido
          </button>
          
          <button class="btn-back" id="btn-pdflock-another" style="height: 42px; padding: 0 18px; font-size: 0.9rem;">
            Bloquear Outro
          </button>
        </div>

        <div style="margin-top: 18px; padding-top: 14px; border-top: 1px dashed rgba(34, 197, 94, 0.3);">
          <a href="#/pdf/desbloquear" style="font-size: 0.85rem; color: #22c55e; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 4px;">
            <span>Quer testar a senha? Ir para o Desbloqueador de PDF</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </a>
        </div>
      </div>

    </div>
  `;

  // Selectors
  const btnBack = container.querySelector('#btn-back-pdflock') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdflock-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdflock-file-input') as HTMLInputElement;

  const setupArea = container.querySelector('#pdflock-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdflock-workspace-area') as HTMLDivElement;

  const fileNameEl = container.querySelector('#pdflock-file-name') as HTMLDivElement;
  const fileSizeEl = container.querySelector('#pdflock-file-size') as HTMLSpanElement;
  const filePagesEl = container.querySelector('#pdflock-file-pages') as HTMLSpanElement;
  const btnReset = container.querySelector('#btn-pdflock-reset') as HTMLButtonElement;

  const pwdInput = container.querySelector('#input-pdflock-pwd') as HTMLInputElement;
  const pwdConfirmInput = container.querySelector('#input-pdflock-confirm') as HTMLInputElement;
  const btnTogglePwd = container.querySelector('#btn-toggle-pdflock-pwd') as HTMLButtonElement;
  const btnToggleConfirm = container.querySelector('#btn-toggle-pdflock-confirm') as HTMLButtonElement;
  const matchMsg = container.querySelector('#pdflock-match-msg') as HTMLDivElement;

  const bar1 = container.querySelector('#pwd-bar-1') as HTMLDivElement;
  const bar2 = container.querySelector('#pwd-bar-2') as HTMLDivElement;
  const bar3 = container.querySelector('#pwd-bar-3') as HTMLDivElement;
  const bar4 = container.querySelector('#pwd-bar-4') as HTMLDivElement;
  const strengthLabel = container.querySelector('#pwd-strength-label') as HTMLSpanElement;

  const selectAlgo = container.querySelector('#select-pdflock-algo') as HTMLSelectElement;
  const checkPrint = container.querySelector('#check-allow-print') as HTMLInputElement;
  const checkCopy = container.querySelector('#check-allow-copy') as HTMLInputElement;
  const checkAnnot = container.querySelector('#check-allow-annot') as HTMLInputElement;
  const checkModify = container.querySelector('#check-allow-modify') as HTMLInputElement;
  const ownerInput = container.querySelector('#input-pdflock-owner') as HTMLInputElement;

  const btnAction = container.querySelector('#btn-pdflock-action') as HTMLButtonElement;
  const resultBox = container.querySelector('#pdflock-result-box') as HTMLDivElement;
  const btnDownload = container.querySelector('#btn-pdflock-download') as HTMLButtonElement;
  const btnAnother = container.querySelector('#btn-pdflock-another') as HTMLButtonElement;

  // Back button
  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  function resetState() {
    selectedFile = null;
    fileBuffer = null;
    lockedPdfBytes = null;
    pageCount = 0;
    isProcessing = false;
    fileInput.value = '';
    pwdInput.value = '';
    pwdConfirmInput.value = '';
    ownerInput.value = '';
    matchMsg.style.display = 'none';
    updateStrength('');

    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    resultBox.style.display = 'none';
  }

  btnReset.addEventListener('click', resetState);
  btnAnother.addEventListener('click', resetState);

  // Drag & drop
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--btn-primary-bg)';
  });
  dropzone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
    }
  });

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo no formato PDF.');
      return;
    }

    selectedFile = file;
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';
    resultBox.style.display = 'none';

    fileNameEl.innerText = file.name;
    fileSizeEl.innerText = formatBytes(file.size);
    filePagesEl.innerText = 'Contando páginas...';

    try {
      fileBuffer = await file.arrayBuffer();
      // Count pages
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
      const pdf = await loadingTask.promise;
      pageCount = pdf.numPages;
      filePagesEl.innerText = `${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}`;
    } catch {
      filePagesEl.innerText = 'Documento PDF';
    }

    pwdInput.focus();
  }

  // Toggle password visibility
  function toggleInputType(input: HTMLInputElement, btn: HTMLButtonElement) {
    if (input.type === 'password') {
      input.type = 'text';
      btn.style.color = 'var(--text-primary)';
    } else {
      input.type = 'password';
      btn.style.color = 'var(--text-secondary)';
    }
  }

  btnTogglePwd.addEventListener('click', () => toggleInputType(pwdInput, btnTogglePwd));
  btnToggleConfirm.addEventListener('click', () => toggleInputType(pwdConfirmInput, btnToggleConfirm));

  // Password strength calculation
  function calculateStrength(pwd: string): { score: number; label: string; color: string } {
    if (!pwd) return { score: 0, label: '-', color: 'var(--border-color)' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Fraca', color: '#ef4444' };
    if (score === 2) return { score: 2, label: 'Média', color: '#f59e0b' };
    if (score === 3) return { score: 3, label: 'Boa', color: '#3b82f6' };
    return { score: 4, label: 'Forte', color: '#22c55e' };
  }

  function updateStrength(pwd: string) {
    const { score, label, color } = calculateStrength(pwd);
    strengthLabel.innerText = label;
    strengthLabel.style.color = color;

    const bars = [bar1, bar2, bar3, bar4];
    bars.forEach((b, idx) => {
      b.style.background = idx < score ? color : 'var(--border-color)';
    });
  }

  function checkPasswordMatch() {
    const p1 = pwdInput.value;
    const p2 = pwdConfirmInput.value;

    if (!p2) {
      matchMsg.style.display = 'none';
      return;
    }

    matchMsg.style.display = 'block';
    if (p1 === p2) {
      matchMsg.style.color = '#22c55e';
      matchMsg.innerText = '✓ As senhas coincidem';
    } else {
      matchMsg.style.color = '#ef4444';
      matchMsg.innerText = '✕ As senhas não são iguais';
    }
  }

  pwdInput.addEventListener('input', () => {
    updateStrength(pwdInput.value);
    checkPasswordMatch();
  });

  pwdConfirmInput.addEventListener('input', checkPasswordMatch);

  // Action: Lock PDF
  btnAction.addEventListener('click', async () => {
    if (!selectedFile || !fileBuffer || isProcessing) return;

    const pwd = pwdInput.value;
    const confirm = pwdConfirmInput.value;

    if (!pwd) {
      alert('Por favor, informe uma senha para proteger o documento.');
      pwdInput.focus();
      return;
    }

    if (pwd !== confirm) {
      alert('A confirmação da senha não coincide. Por favor, verifique.');
      pwdConfirmInput.focus();
      return;
    }

    isProcessing = true;
    const originalText = btnAction.innerHTML;
    btnAction.innerHTML = `
      <div style="display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite; margin-right: 8px;"></div>
      Criptografando documento...
    `;
    btnAction.disabled = true;

    try {
      const algorithm = selectAlgo.value as 'AES-256' | 'RC4';
      const allowPrinting = checkPrint.checked;
      const allowCopying = checkCopy.checked;
      const allowAnnotating = checkAnnot.checked;
      const allowModifying = checkModify.checked;
      const ownerPassword = ownerInput.value || undefined;

      lockedPdfBytes = await PdfService.lockPdf(fileBuffer, pwd, {
        algorithm,
        ownerPassword,
        allowPrinting,
        allowCopying,
        allowAnnotating,
        allowModifying,
      });

      resultBox.style.display = 'block';
      resultBox.scrollIntoView({ behavior: 'smooth' });

      historyManager.record(
        'pdf-lock',
        'pdf',
        'Bloquear PDF com Senha',
        selectedFile.name,
        `${pageCount || 1} pág • Criptografado (${algorithm})`,
        {}
      );

    } catch (err: any) {
      console.error(err);
      alert('Erro ao criptografar o PDF: ' + (err?.message || 'Arquivo protegido ou incompatível.'));
    } finally {
      isProcessing = false;
      btnAction.innerHTML = originalText;
      btnAction.disabled = false;
    }
  });

  // Download
  btnDownload.addEventListener('click', () => {
    if (!lockedPdfBytes || !selectedFile) return;

    const blob = new Blob([lockedPdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_protegido.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
