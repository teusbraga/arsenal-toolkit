import { OfficeService } from './office.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfToWord(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let currentDocxBlob: Blob | null = null;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdftoword" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">PDF para Word (.DOCX)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdftoword" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdftoword-setup-area">
      <div class="dropzone-box" id="pdftoword-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
          <path d="M8 13h2"/>
          <path d="M8 17h2"/>
          <path d="M14 13h2"/>
          <path d="M14 17h2"/>
        </svg>
        <div class="dropzone-text">Arraste seu PDF para converter em Word (.DOCX)</div>
        <div class="dropzone-hint">Reconstrói títulos, parágrafos, listas e formatação em um arquivo .DOCX editável</div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(37, 99, 235, 0.1); color: #2563eb; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
          100% Local & Sem OCR • Extração direta da estrutura do PDF
        </div>
        <input type="file" id="pdftoword-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdftoword-workspace-area" style="display: none;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Documento Convertido para Word</div>
            <div id="pdftoword-file-name" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 2px 0;">-</div>
            <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Páginas: <strong id="pdftoword-pages" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Parágrafos: <strong id="pdftoword-paras" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Palavras: <strong id="pdftoword-words" style="color: var(--text-primary);">0</strong>
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select id="pdftoword-font" class="form-input" style="height: 36px; width: auto; padding: 0 10px; font-size: 0.85rem;">
              <option value="Calibri" selected>Fonte: Calibri (Padrão Word)</option>
              <option value="Arial">Fonte: Arial</option>
              <option value="Times New Roman">Fonte: Times New Roman</option>
            </select>

            <select id="pdftoword-mode" class="form-input" style="height: 36px; width: auto; padding: 0 10px; font-size: 0.85rem; border-color: #2563eb; color: #2563eb;">
              <option value="absolute" selected>Alta Fidelidade Visual (IDÊNTICO 1:1 - Tabelas, Cores e Imagens)</option>
              <option value="flow">Texto Editável (Fluxo de Parágrafos)</option>
            </select>

            <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-secondary); background: var(--bg-page); border: 1px solid var(--border-color); height: 36px; padding: 0 10px; border-radius: 6px; cursor: pointer;">
              <input type="checkbox" id="pdftoword-pagebreaks" checked />
              <span>Quebras de Página</span>
            </label>

            <button class="btn-back" id="btn-pdftoword-reset" style="height: 36px; padding: 0 12px; font-size: 0.85rem;">
              Trocar Arquivo
            </button>

            <button class="btn-primary" id="btn-pdftoword-download" style="height: 36px; padding: 0 16px; font-size: 0.85rem; width: auto; background: #2563eb; border-color: #2563eb;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar Word (.DOCX)
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Paper -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 24px; max-height: 540px; overflow-y: auto;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; margin-bottom: 12px;">
          Pré-visualização da Estrutura Reconstruída (.DOCX)
        </div>
        <div id="pdftoword-preview" style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 24px; color: var(--text-primary); font-family: 'Calibri', 'Segoe UI', sans-serif; font-size: 0.95rem;">
          Processando...
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdftoword') as HTMLButtonElement;
  const setupArea = container.querySelector('#pdftoword-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdftoword-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#pdftoword-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdftoword-file-input') as HTMLInputElement;

  const fileNameEl = container.querySelector('#pdftoword-file-name') as HTMLDivElement;
  const pagesEl = container.querySelector('#pdftoword-pages') as HTMLElement;
  const parasEl = container.querySelector('#pdftoword-paras') as HTMLElement;
  const wordsEl = container.querySelector('#pdftoword-words') as HTMLElement;

  const fontSelect = container.querySelector('#pdftoword-font') as HTMLSelectElement;
  const pageBreaksCheck = container.querySelector('#pdftoword-pagebreaks') as HTMLInputElement;
  const btnReset = container.querySelector('#btn-pdftoword-reset') as HTMLButtonElement;
  const btnDownload = container.querySelector('#btn-pdftoword-download') as HTMLButtonElement;
  const previewEl = container.querySelector('#pdftoword-preview') as HTMLDivElement;
  const modeSelect = container.querySelector('#pdftoword-mode') as HTMLSelectElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });
  
  fontSelect.addEventListener('change', () => runConversion());
  pageBreaksCheck.addEventListener('change', () => runConversion());
  if (modeSelect) modeSelect.addEventListener('change', () => runConversion());

  btnReset.addEventListener('click', () => {
    selectedFile = null;
    fileBuffer = null;
    currentDocxBlob = null;
    fileInput.value = '';
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#2563eb'; });
  dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--border-color)'; });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer?.files?.length) handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files?.length) handleFile(fileInput.files[0]);
  });

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }
    selectedFile = file;
    fileNameEl.innerText = file.name;
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    fileBuffer = await file.arrayBuffer();
    await runConversion(true);
  }

  async function runConversion(recordHistory = false) {
    if (!fileBuffer || !selectedFile || isProcessing) return;
    isProcessing = true;
    previewEl.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-secondary);">Convertendo estrutura do PDF para Word (.docx)...</div>';
    btnDownload.disabled = true;

    try {
      const modeSelect = container.querySelector('#pdftoword-mode') as HTMLSelectElement;
      
      const res = await OfficeService.pdfToDocx(fileBuffer, {
        fontFamily: fontSelect.value,
        includePageBreaks: pageBreaksCheck.checked,
        mode: modeSelect ? (modeSelect.value as 'flow' | 'absolute') : 'absolute',
      });

      currentDocxBlob = res.docxBlob;
      pagesEl.innerText = res.pageCount.toString();
      parasEl.innerText = res.paragraphCount.toLocaleString();
      wordsEl.innerText = res.wordCount.toLocaleString();
      previewEl.innerHTML = res.previewHtml;

      if (recordHistory) {
        historyManager.record(
          'pdf-to-word',
          'pdf',
          'PDF para Word (.DOCX)',
          selectedFile.name,
          `${res.pageCount} páginas • ${res.wordCount.toLocaleString()} palavras`,
          {}
        );
      }
    } catch (err: any) {
      console.error(err);
      previewEl.innerHTML = `<div style="color:#ef4444;padding:16px;">Erro ao converter o PDF: ${err?.message || 'Arquivo protegido ou inválido.'}</div>`;
    } finally {
      isProcessing = false;
      btnDownload.disabled = false;
    }
  }

  fontSelect.addEventListener('change', () => runConversion(false));
  pageBreaksCheck.addEventListener('change', () => runConversion(false));

  btnDownload.addEventListener('click', () => {
    if (!currentDocxBlob || !selectedFile) return;
    const url = URL.createObjectURL(currentDocxBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
