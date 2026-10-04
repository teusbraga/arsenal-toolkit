import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { WordToPdfService } from './word-to-pdf.service';
import { historyManager } from '../../core/history/history.manager';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export function renderWordToPdf(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let currentPdfBytes: Uint8Array | null = null;
  let pageCount = 0;

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
        <div class="dropzone-hint">Gera PDF Vetorial nativo com texto selecionável, cores reais e imagens posicionadas</div>
        <input type="file" id="wordtopdf-file-input" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="display: none;" />
      </div>
    </div>

    <div id="wordtopdf-workspace-area" style="display: none;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Documento Word Carregado</div>
            <div id="wordtopdf-file-name" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 2px 0;">-</div>
            <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Páginas: <strong id="wordtopdf-pages" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Blocos: <strong id="wordtopdf-paras" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Palavras: <strong id="wordtopdf-words" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: rgba(37,99,235,0.08); border: 1px solid rgba(37,99,235,0.25); color: #2563eb; padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: 600;">
                ✨ Texto 100% Selecionável (Vetorial)
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <button class="btn-back" id="btn-wordtopdf-reset" style="height: 38px; padding: 0 14px; font-size: 0.85rem;">
              Trocar Arquivo
            </button>

            <button class="btn-primary" id="btn-wordtopdf-download" style="height: 38px; padding: 0 18px; font-size: 0.85rem; width: auto; font-weight: 600;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar PDF (.PDF)
            </button>
          </div>
        </div>

        <!-- Progress Box -->
        <div id="wordtopdf-progress-box" style="display: none; margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 6px; color: var(--text-secondary);">
            <span id="wordtopdf-progress-text">Gerando documento PDF vetorial...</span>
            <span id="wordtopdf-progress-pct" style="font-weight: 700; color: #2563eb;">100%</span>
          </div>
          <div style="width: 100%; height: 6px; background: var(--bg-page); border-radius: 99px; overflow: hidden;">
            <div id="wordtopdf-progress-bar" style="width: 100%; height: 100%; background: #2563eb;"></div>
          </div>
        </div>
      </div>

      <!-- Document Preview -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 20px; max-height: 650px; overflow-y: auto;">
        <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 700; margin-bottom: 14px;">
          Pré-visualização do PDF Gerado (Texto Selecionável e Imagens)
        </div>
        <div id="wordtopdf-preview" style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; min-height: 250px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">Carregando visualização...</div>
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

  const btnReset = container.querySelector('#btn-wordtopdf-reset') as HTMLButtonElement;
  const btnDownload = container.querySelector('#btn-wordtopdf-download') as HTMLButtonElement;
  const previewEl = container.querySelector('#wordtopdf-preview') as HTMLDivElement;

  const progressBox = container.querySelector('#wordtopdf-progress-box') as HTMLDivElement;
  const progressText = container.querySelector('#wordtopdf-progress-text') as HTMLSpanElement;
  const progressPct = container.querySelector('#wordtopdf-progress-pct') as HTMLSpanElement;
  const progressBar = container.querySelector('#wordtopdf-progress-bar') as HTMLDivElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnReset.addEventListener('click', () => {
    selectedFile = null;
    fileBuffer = null;
    currentPdfBytes = null;
    fileInput.value = '';
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    progressBox.style.display = 'none';
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
    progressBox.style.display = 'block';
    btnDownload.disabled = true;

    try {
      fileBuffer = await file.arrayBuffer();
      progressText.innerText = 'Processando documento Word e compilando PDF vetorial...';
      progressPct.innerText = '50%';
      progressBar.style.width = '50%';

      const res = await WordToPdfService.convertDocxToPdf(fileBuffer);
      currentPdfBytes = res.pdfBytes;
      pageCount = res.pageCount;
      pagesEl.innerText = res.pageCount.toString();
      parasEl.innerText = res.paragraphCount.toLocaleString();
      wordsEl.innerText = res.wordCount.toLocaleString();

      progressText.innerText = 'Renderizando pré-visualização vetorial...';
      progressPct.innerText = '85%';
      progressBar.style.width = '85%';

      // Renderiza as páginas do PDF gerado no canvas de pré-visualização usando PDF.js
      // REGRA MANDATÓRIA (GEMINI.md): Clona o buffer com .slice(0) antes de enviar ao pdfjsLib
      const safeBuffer = res.pdfBytes.buffer.slice(
        res.pdfBytes.byteOffset,
        res.pdfBytes.byteOffset + res.pdfBytes.byteLength
      );
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeBuffer) });
      const pdf = await loadingTask.promise;

      previewEl.innerHTML = '';
      for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const vp = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        canvas.style.maxWidth = '100%';
        canvas.style.boxShadow = '0 4px 18px rgba(0, 0, 0, 0.12)';
        canvas.style.borderRadius = '4px';
        canvas.style.background = '#ffffff';

        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport: vp } as any).promise;
        }
        previewEl.appendChild(canvas);
      }

      progressText.innerText = 'PDF gerado com sucesso!';
      progressPct.innerText = '100%';
      progressBar.style.width = '100%';
      setTimeout(() => { progressBox.style.display = 'none'; }, 600);

      btnDownload.disabled = false;
    } catch (err: any) {
      console.error(err);
      previewEl.innerHTML = `<div style="color:#ef4444;padding:16px;">Erro ao processar o arquivo .DOCX: ${err?.message || 'Arquivo corrompido ou formato incompatível.'}</div>`;
      progressBox.style.display = 'none';
      btnDownload.disabled = true;
    }
  }

  btnDownload.addEventListener('click', () => {
    if (!selectedFile || !currentPdfBytes) return;

    const blob = new Blob([currentPdfBytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    historyManager.record(
      'word-to-pdf',
      'pdf',
      'Word para PDF (.DOCX)',
      selectedFile.name,
      `${pageCount} páginas (Texto 100% Selecionável)`,
      {}
    );
  });
}
