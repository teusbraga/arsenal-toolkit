import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfUnlock(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let unlockedPdfBytes: Uint8Array | null = null;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdfunlock" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Desbloquear PDF</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdfunlock" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <!-- Dropzone Area -->
    <div id="pdfunlock-setup-area">
      <div class="dropzone-box" id="pdfunlock-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
        </svg>
        <div class="dropzone-text">Arraste seu PDF protegido aqui</div>
        <div class="dropzone-hint">Remove senhas e permissões de impressão, cópia e edição</div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(34, 197, 94, 0.1); color: #16a34a; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
          100% Seguro & Local • Seus dados nunca saem da sua máquina
        </div>
        <input type="file" id="pdfunlock-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <!-- Workspace Area -->
    <div id="pdfunlock-workspace-area" style="display: none; max-width: 680px; margin: 0 auto;">
      
      <!-- File Summary Card -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <div style="width: 44px; height: 44px; border-radius: 10px; background: var(--bg-page); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--text-primary);">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div>
              <div id="pdfunlock-file-name" style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); word-break: break-all;">-</div>
              <div id="pdfunlock-file-size" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 2px;">-</div>
            </div>
          </div>
          <button class="btn-back" id="btn-pdfunlock-reset" style="height: 34px; padding: 0 12px; font-size: 0.8rem;">
            Trocar Arquivo
          </button>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;" />

        <!-- Status Container -->
        <div id="pdfunlock-status-container">
          <!-- Will be dynamically populated with status and actions -->
        </div>

        <!-- Progress Indicator -->
        <div id="pdfunlock-progress-box" style="display: none; margin-top: 18px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px;">
            <span id="pdfunlock-progress-text">Desbloqueando documento...</span>
            <span id="pdfunlock-progress-percent">0%</span>
          </div>
          <div style="width: 100%; height: 8px; background: var(--bg-page); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color);">
            <div id="pdfunlock-progress-bar" style="width: 0%; height: 100%; background: #22c55e; transition: width 0.15s ease;"></div>
          </div>
        </div>

      </div>

      <!-- Success Result Card -->
      <div id="pdfunlock-result-box" style="display: none; background: rgba(34, 197, 94, 0.05); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; text-align: center;">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(34, 197, 94, 0.15); color: #22c55e; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">PDF Desbloqueado com Sucesso!</h3>
        <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 20px; max-width: 480px; margin-left: auto; margin-right: auto;" id="pdfunlock-success-desc">
          Todas as restrições e senhas foram eliminadas permanentemente. O novo arquivo pode ser aberto, impresso e editado livremente.
        </p>

        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <button class="btn-primary" id="btn-pdfunlock-download" style="width: auto; height: 42px; padding: 0 24px; font-size: 0.95rem; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar PDF Desbloqueado
          </button>
          
          <button class="btn-back" id="btn-pdfunlock-another" style="height: 42px; padding: 0 18px; font-size: 0.9rem;">
            Desbloquear Outro
          </button>
        </div>
      </div>

    </div>
  `;

  // Element Selectors
  const btnBack = container.querySelector('#btn-back-pdfunlock') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdfunlock-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdfunlock-file-input') as HTMLInputElement;

  const setupArea = container.querySelector('#pdfunlock-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdfunlock-workspace-area') as HTMLDivElement;

  const fileNameEl = container.querySelector('#pdfunlock-file-name') as HTMLDivElement;
  const fileSizeEl = container.querySelector('#pdfunlock-file-size') as HTMLDivElement;
  const btnReset = container.querySelector('#btn-pdfunlock-reset') as HTMLButtonElement;

  const statusContainer = container.querySelector('#pdfunlock-status-container') as HTMLDivElement;
  const progressBox = container.querySelector('#pdfunlock-progress-box') as HTMLDivElement;
  const progressText = container.querySelector('#pdfunlock-progress-text') as HTMLSpanElement;
  const progressPercent = container.querySelector('#pdfunlock-progress-percent') as HTMLSpanElement;
  const progressBar = container.querySelector('#pdfunlock-progress-bar') as HTMLDivElement;

  const resultBox = container.querySelector('#pdfunlock-result-box') as HTMLDivElement;
  const successDescEl = container.querySelector('#pdfunlock-success-desc') as HTMLParagraphElement;
  const btnDownload = container.querySelector('#btn-pdfunlock-download') as HTMLButtonElement;
  const btnAnother = container.querySelector('#btn-pdfunlock-another') as HTMLButtonElement;

  // Navigation & Reset
  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  function resetState() {
    selectedFile = null;
    fileBuffer = null;
    unlockedPdfBytes = null;
    isProcessing = false;
    fileInput.value = '';
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    resultBox.style.display = 'none';
    progressBox.style.display = 'none';
    statusContainer.innerHTML = '';
  }

  btnReset.addEventListener('click', resetState);
  btnAnother.addEventListener('click', resetState);

  // File Upload Handlers
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
    progressBox.style.display = 'none';

    fileNameEl.innerText = file.name;
    fileSizeEl.innerText = formatBytes(file.size);

    statusContainer.innerHTML = `
      <div style="text-align: center; padding: 24px 0; color: var(--text-secondary); font-size: 0.9rem;">
        <div style="display: inline-block; width: 22px; height: 22px; border: 2px solid var(--border-color); border-top-color: var(--text-primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 8px;"></div>
        <div>Analisando criptografia e permissões do PDF...</div>
      </div>
      <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    `;

    try {
      fileBuffer = await file.arrayBuffer();
      const encryptionInfo = await PdfService.checkPdfEncryption(fileBuffer);
      renderStatusActions(encryptionInfo);
    } catch (err: any) {
      console.error(err);
      statusContainer.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 14px; color: #ef4444; font-size: 0.85rem;">
          Não foi possível ler este arquivo PDF. Ele pode estar corrompido.
        </div>
      `;
    }
  }

  function renderStatusActions(info: { isEncrypted: boolean; needsPassword: boolean }) {
    if (!info.isEncrypted) {
      // Not encrypted
      statusContainer.innerHTML = `
        <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #3b82f6;"></span>
            <strong style="color: var(--text-primary); font-size: 0.9rem;">Documento sem senha de leitura</strong>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin: 0 0 16px 0;">
            Este PDF não exige senha para abertura. Caso ele contenha restrições de permissão ou assinatura que deseje limpar, você pode gerar uma cópia destravada.
          </p>
          <button class="btn-primary" id="btn-unlock-clean" style="width: auto; height: 38px; padding: 0 18px; font-size: 0.85rem;">
            Gerar Cópia Limpa Sem Restrições
          </button>
        </div>
      `;

      const btnClean = statusContainer.querySelector('#btn-unlock-clean') as HTMLButtonElement;
      btnClean.addEventListener('click', () => processUnlock());
    } else if (info.isEncrypted && !info.needsPassword) {
      // Owner/Permission locked only (no user password required)
      statusContainer.innerHTML = `
        <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <strong style="color: var(--text-primary); font-size: 0.9rem;">Restrições de Proprietário Detectadas</strong>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin: 0 0 16px 0;">
            Este PDF possui travas de permissão (como bloqueio de impressão, cópia de texto ou modificação), mas <strong>não precisa de senha para abrir</strong>. O Arsenal Toolkit pode remover essas travas instantaneamente em 1 clique mantendo 100% da nitidez vetorial!
          </p>
          <button class="btn-primary" id="btn-unlock-owner" style="width: auto; height: 40px; padding: 0 20px; font-size: 0.9rem; font-weight: 600;">
            Desbloquear Agora (1-Clique)
          </button>
        </div>
      `;

      const btnOwner = statusContainer.querySelector('#btn-unlock-owner') as HTMLButtonElement;
      btnOwner.addEventListener('click', () => processUnlock());
    } else {
      // User open password required
      statusContainer.innerHTML = `
        <div style="background: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 8px; padding: 18px; margin-bottom: 16px;">
          <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <strong style="color: var(--text-primary); font-size: 0.95rem;">PDF Protegido por Senha</strong>
          </div>
          <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin: 0 0 16px 0;">
            Este arquivo exige uma senha para ser visualizado. Digite a senha uma única vez abaixo para decifrá-lo e gerar uma nova versão sem senha para sempre.
          </p>

          <div style="margin-bottom: 14px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px;">Senha do PDF</label>
            <div style="position: relative;">
              <input type="password" id="input-pdf-password" class="form-input" placeholder="Digite a senha deste PDF..." style="padding-right: 42px; font-size: 0.9rem;" autocomplete="off" />
              <button type="button" id="btn-toggle-pwd" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: transparent; border: none; cursor: pointer; color: var(--text-secondary); padding: 4px; display: flex; align-items: center;" title="Mostrar/ocultar senha">
                <svg id="icon-pwd-eye" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
            </div>
          </div>

          <div id="pwd-error-alert" style="display: none; color: #ef4444; font-size: 0.8rem; margin-bottom: 12px; font-weight: 500;">
            Senha incorreta. Verifique maiúsculas/minúsculas e tente novamente.
          </div>

          <button class="btn-primary" id="btn-unlock-password" style="width: auto; height: 40px; padding: 0 20px; font-size: 0.9rem; font-weight: 600;">
            Descriptografar & Salvar Sem Senha
          </button>
        </div>
      `;

      const pwdInput = statusContainer.querySelector('#input-pdf-password') as HTMLInputElement;
      const btnTogglePwd = statusContainer.querySelector('#btn-toggle-pwd') as HTMLButtonElement;
      const pwdErrorAlert = statusContainer.querySelector('#pwd-error-alert') as HTMLDivElement;
      const btnUnlockPwd = statusContainer.querySelector('#btn-unlock-password') as HTMLButtonElement;

      btnTogglePwd.addEventListener('click', () => {
        if (pwdInput.type === 'password') {
          pwdInput.type = 'text';
          btnTogglePwd.style.color = 'var(--text-primary)';
        } else {
          pwdInput.type = 'password';
          btnTogglePwd.style.color = 'var(--text-secondary)';
        }
      });

      pwdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          btnUnlockPwd.click();
        }
      });

      btnUnlockPwd.addEventListener('click', () => {
        const val = pwdInput.value;
        if (!val) {
          pwdErrorAlert.innerText = 'Por favor, digite a senha do documento.';
          pwdErrorAlert.style.display = 'block';
          pwdInput.focus();
          return;
        }
        pwdErrorAlert.style.display = 'none';
        processUnlock(val);
      });
    }
  }

  async function processUnlock(password?: string) {
    if (!fileBuffer || !selectedFile || isProcessing) return;
    isProcessing = true;

    progressBox.style.display = 'block';
    progressText.innerText = 'Descriptografando documento...';
    progressBar.style.width = '10%';
    progressPercent.innerText = '10%';

    try {
      const result = await PdfService.unlockPdf(
        fileBuffer,
        password,
        (current, total) => {
          const pct = Math.round((current / total) * 100);
          progressText.innerText = `Processando e renderizando página ${current} de ${total}...`;
          progressBar.style.width = `${pct}%`;
          progressPercent.innerText = `${pct}%`;
        }
      );

      unlockedPdfBytes = result.unlockedBuffer;
      progressBar.style.width = '100%';
      progressPercent.innerText = '100%';

      // Show result
      setTimeout(() => {
        statusContainer.style.display = 'none';
        progressBox.style.display = 'none';
        resultBox.style.display = 'block';

        if (result.method === 'direct') {
          successDescEl.innerText = `Restrições removidas com sucesso! O documento com ${result.numPages} páginas preservou 100% de sua nitidez vetorial original e não possui mais travas.`;
        } else {
          successDescEl.innerText = `O documento foi descriptografado com sucesso em alta definição (${result.numPages} páginas). A proteção por senha foi removida de forma permanente.`;
        }

        historyManager.record(
          'pdf-unlock',
          'pdf',
          'Desbloquear PDF',
          selectedFile?.name || 'Documento PDF',
          `${result.numPages} páginas • Desbloqueado (${result.method === 'direct' ? 'Vetor Direto' : 'Descriptografado'})`,
          {}
        );
      }, 300);

    } catch (err: any) {
      console.error(err);
      progressBox.style.display = 'none';

      // Check if it's incorrect password
      const errStr = (err?.message || err?.name || '').toLowerCase();
      if (errStr.includes('password') || errStr.includes('incorrect') || err?.code === 1 || err?.code === 2) {
        const pwdErrorAlert = statusContainer.querySelector('#pwd-error-alert') as HTMLDivElement;
        if (pwdErrorAlert) {
          pwdErrorAlert.innerText = 'Senha incorreta. Verifique maiúsculas e minúsculas e tente novamente.';
          pwdErrorAlert.style.display = 'block';
        } else {
          alert('Senha incorreta fornecida. Verifique e tente novamente.');
        }
      } else {
        alert('Ocorreu um erro ao desbloquear o PDF: ' + (err?.message || 'Arquivo corrompido ou formato incompatível.'));
      }
    } finally {
      isProcessing = false;
    }
  }

  // Download Action
  btnDownload.addEventListener('click', () => {
    if (!unlockedPdfBytes || !selectedFile) return;

    const blob = new Blob([unlockedPdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_desbloqueado.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
