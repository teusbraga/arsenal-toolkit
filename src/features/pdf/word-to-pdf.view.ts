import { OfficeService } from './office.service';
import { historyManager } from '../../core/history/history.manager';

export function renderWordToPdf(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let currentPdfBytes: Uint8Array | null = null;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-wordtopdf" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Word para PDF (.DOCX)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-wordtopdf" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="wordtopdf-setup-area">
      <div class="dropzone-box" id="wordtopdf-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <div class="dropzone-text">Arraste seu documento Word (.DOCX) para converter em PDF</div>
        <div class="dropzone-hint">Lê títulos, parágrafos, listas e tabelas nativamente e gera um PDF A4 vetorial</div>
        <input type="file" id="wordtopdf-file-input" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display: none;" />
      </div>
    </div>

    <div id="wordtopdf-workspace-area" style="display: none;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Documento Word Carregado</div>
            <div id="wordtopdf-file-name" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 2px 0;">-</div>
            <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Páginas PDF: <strong id="wordtopdf-pages" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Blocos: <strong id="wordtopdf-paras" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Palavras: <strong id="wordtopdf-words" style="color: var(--text-primary);">0</strong>
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <select id="wordtopdf-font" class="form-input" style="height: 36px; width: auto; padding: 0 10px; font-size: 0.85rem;">
              <option value="sans" selected>Tipografia: Moderna (Helvetica)</option>
              <option value="serif">Tipografia: Clássica (Times)</option>
            </select>

            <select id="wordtopdf-size" class="form-input" style="height: 36px; width: auto; padding: 0 10px; font-size: 0.85rem;">
              <option value="10">Fonte: 10pt</option>
              <option value="11" selected>Fonte: 11pt (Padrão)</option>
              <option value="12">Fonte: 12pt</option>
            </select>

            <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.82rem; color: var(--text-secondary); background: var(--bg-page); border: 1px solid var(--border-color); height: 36px; padding: 0 10px; border-radius: 6px; cursor: pointer;">
              <input type="checkbox" id="wordtopdf-pagenums" checked />
              <span>Numerar Páginas</span>
            </label>

            <button class="btn-back" id="btn-wordtopdf-reset" style="height: 36px; padding: 0 12px; font-size: 0.85rem;">
              Trocar Arquivo
            </button>

            <button class="btn-primary" id="btn-wordtopdf-download" style="height: 36px; padding: 0 16px; font-size: 0.85rem; width: auto;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar PDF (.PDF)
            </button>
          </div>
        </div>
      </div>

      <!-- Document Preview -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 24px; max-height: 540px; overflow-y: auto;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; margin-bottom: 12px;">
          Pré-visualização do Conteúdo do Documento
        </div>
        <div id="wordtopdf-preview" style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 24px; color: var(--text-primary); font-size: 0.95rem;">
          Processando...
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-wordtopdf') as HTMLButtonElement;
  const setupArea = container.querySelector('#wordtopdf-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#wordtopdf-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#wordtopdf-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#wordtopdf-file-input') as HTMLInputElement;

  const fileNameEl = container.querySelector('#wordtopdf-file-name') as HTMLDivElement;
  const pagesEl = container.querySelector('#wordtopdf-pages') as HTMLElement;
  const parasEl = container.querySelector('#wordtopdf-paras') as HTMLElement;
  const wordsEl = container.querySelector('#wordtopdf-words') as HTMLElement;

  const fontSelect = container.querySelector('#wordtopdf-font') as HTMLSelectElement;
  const sizeSelect = container.querySelector('#wordtopdf-size') as HTMLSelectElement;
  const pageNumsCheck = container.querySelector('#wordtopdf-pagenums') as HTMLInputElement;

  const btnReset = container.querySelector('#btn-wordtopdf-reset') as HTMLButtonElement;
  const btnDownload = container.querySelector('#btn-wordtopdf-download') as HTMLButtonElement;
  const previewEl = container.querySelector('#wordtopdf-preview') as HTMLDivElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnReset.addEventListener('click', () => {
    selectedFile = null;
    fileBuffer = null;
    currentPdfBytes = null;
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
    if (!file.name.toLowerCase().endsWith('.docx')) {
      alert('Por favor, selecione um arquivo no formato .DOCX (Microsoft Word).');
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
    btnDownload.disabled = true;

    try {
      const res = await OfficeService.wordToPdf(fileBuffer, {
        fontStyle: fontSelect.value as 'sans' | 'serif',
        fontSize: parseInt(sizeSelect.value, 10) || 11,
        includePageNumbers: pageNumsCheck.checked,
      });

      currentPdfBytes = res.pdfBytes;
      pagesEl.innerText = res.pageCount.toString();
      parasEl.innerText = res.paragraphCount.toLocaleString();
      wordsEl.innerText = res.wordCount.toLocaleString();
      previewEl.innerHTML = res.previewHtml;

      if (recordHistory) {
        historyManager.record(
          'word-to-pdf',
          'pdf',
          'Word para PDF (.DOCX)',
          selectedFile.name,
          `${res.pageCount} páginas • ${res.wordCount.toLocaleString()} palavras`,
          {}
        );
      }
    } catch (err: any) {
      console.error(err);
      previewEl.innerHTML = `<div style="color:#ef4444;padding:16px;">Erro ao processar arquivo .DOCX: ${err?.message || 'Formato incompatível.'}</div>`;
    } finally {
      isProcessing = false;
      btnDownload.disabled = false;
    }
  }

  fontSelect.addEventListener('change', () => runConversion(false));
  sizeSelect.addEventListener('change', () => runConversion(false));
  pageNumsCheck.addEventListener('change', () => runConversion(false));

  btnDownload.addEventListener('click', () => {
    if (!currentPdfBytes || !selectedFile) return;
    const blob = new Blob([currentPdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
