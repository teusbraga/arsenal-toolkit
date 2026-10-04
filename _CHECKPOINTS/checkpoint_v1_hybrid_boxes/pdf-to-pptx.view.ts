import { OfficeService } from './office.service';
import { HybridOfficeService } from './hybrid-office.service';
import { historyManager } from '../../core/history/history.manager';
import * as pdfjsLib from 'pdfjs-dist';

export function renderPdfToPptx(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let pageCount = 0;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdftopptx" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">PDF para PowerPoint (.PPTX)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdftopptx" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdftopptx-setup-area">
      <div class="dropzone-box" id="pdftopptx-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="14" x="3" y="3" rx="2"/>
          <path d="M8 21h8"/>
          <path d="M12 17v4"/>
        </svg>
        <div class="dropzone-text">Arraste seu PDF para transformar em Slides (.PPTX)</div>
        <div class="dropzone-hint">Converte cada página do PDF em um slide Widescreen 16:9 do Microsoft PowerPoint</div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(234, 88, 12, 0.1); color: #ea580c; border-radius: 999px; font-size: 0.75rem; font-weight: 600;">
          100% no Navegador • Suporta modo de Fidelidade Visual HD ou Caixas de Texto Editáveis
        </div>
        <input type="file" id="pdftopptx-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdftopptx-workspace-area" style="display: none; max-width: 680px; margin: 0 auto;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 12px; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Apresentação Selecionada</div>
            <div id="pdftopptx-file-name" style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-top: 2px;">-</div>
            <div id="pdftopptx-slides-count" style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">-</div>
          </div>
          <button class="btn-back" id="btn-pdftopptx-reset" style="height: 34px; padding: 0 12px; font-size: 0.8rem;">
            Trocar Arquivo
          </button>
        </div>

        <hr style="border: none; border-top: 1px solid var(--border-color); margin: 16px 0;" />

        <div style="margin-bottom: 18px;">
          <label style="display: block; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">Modo de Conversão dos Slides</label>
          <select id="pdftopptx-mode" class="form-input" style="font-size: 0.9rem;">
            <option value="hybrid" selected>Reconstrução Híbrida Inteligente (Tabelas e Gráficos Visuais + Texto 100% Editável)</option>
            <option value="editable">Caixas de Texto Editáveis (Apenas texto nativo puro)</option>
            <option value="visual">Alta Fidelidade Visual HD (Apenas imagem da folha inteira)</option>
          </select>
        </div>

        <div id="pdftopptx-progress-box" style="display: none; margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 6px;">
            <span id="pdftopptx-progress-text">Gerando slides...</span>
            <span id="pdftopptx-progress-pct">0%</span>
          </div>
          <div style="width: 100%; height: 8px; background: var(--bg-page); border-radius: 4px; overflow: hidden; border: 1px solid var(--border-color);">
            <div id="pdftopptx-progress-bar" style="width: 0%; height: 100%; background: #ea580c; transition: width 0.15s ease;"></div>
          </div>
        </div>

        <button class="btn-primary" id="btn-pdftopptx-convert" style="width: 100%; height: 44px; font-size: 0.95rem; font-weight: 600; background: #ea580c; border-color: #ea580c; display: flex; align-items: center; justify-content: center; gap: 8px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Converter & Baixar PowerPoint (.PPTX)
        </button>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdftopptx') as HTMLButtonElement;
  const setupArea = container.querySelector('#pdftopptx-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdftopptx-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#pdftopptx-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdftopptx-file-input') as HTMLInputElement;

  const fileNameEl = container.querySelector('#pdftopptx-file-name') as HTMLDivElement;
  const slidesCountEl = container.querySelector('#pdftopptx-slides-count') as HTMLDivElement;
  const modeSelect = container.querySelector('#pdftopptx-mode') as HTMLSelectElement;
  const btnReset = container.querySelector('#btn-pdftopptx-reset') as HTMLButtonElement;
  const btnConvert = container.querySelector('#btn-pdftopptx-convert') as HTMLButtonElement;

  const progressBox = container.querySelector('#pdftopptx-progress-box') as HTMLDivElement;
  const progressText = container.querySelector('#pdftopptx-progress-text') as HTMLSpanElement;
  const progressPct = container.querySelector('#pdftopptx-progress-pct') as HTMLSpanElement;
  const progressBar = container.querySelector('#pdftopptx-progress-bar') as HTMLDivElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnReset.addEventListener('click', () => {
    selectedFile = null;
    fileBuffer = null;
    fileInput.value = '';
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    progressBox.style.display = 'none';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#ea580c'; });
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
    slidesCountEl.innerText = 'Contando páginas...';
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    try {
      fileBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer.slice(0)) }).promise;
      pageCount = pdf.numPages;
      slidesCountEl.innerText = `${pageCount} ${pageCount === 1 ? 'slide será gerado' : 'slides serão gerados'} (Widescreen 16:9)`;
    } catch {
      slidesCountEl.innerText = 'Documento PDF carregado';
    }
  }

  btnConvert.addEventListener('click', async () => {
    if (!fileBuffer || !selectedFile || isProcessing) return;
    isProcessing = true;
    btnConvert.disabled = true;
    progressBox.style.display = 'block';

    try {
      const mode = modeSelect.value as 'hybrid' | 'visual' | 'editable';
      let pptxBlob: Blob;
      let slideCount: number;

      const onProgress = (curr: number, total: number) => {
        const pct = Math.round((curr / total) * 100);
        progressText.innerText = `Montando slide ${curr} de ${total}...`;
        progressPct.innerText = `${pct}%`;
        progressBar.style.width = `${pct}%`;
      };

      if (mode === 'hybrid') {
        const res = await HybridOfficeService.pdfToPptxHybrid(fileBuffer, { onProgress });
        pptxBlob = res.pptxBlob;
        slideCount = res.slideCount;
      } else {
        const res = await OfficeService.pdfToPptx(fileBuffer, { mode, onProgress });
        pptxBlob = res.pptxBlob;
        slideCount = res.slideCount;
      }

      const url = URL.createObjectURL(pptxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      historyManager.record(
        'pdf-to-pptx',
        'pdf',
        'PDF para PowerPoint (.PPTX)',
        selectedFile.name,
        `${slideCount} slides (${mode === 'visual' ? 'Visual HD' : 'Texto Editável'})`,
        {}
      );
    } catch (err: any) {
      console.error(err);
      alert('Erro ao gerar PowerPoint: ' + (err?.message || 'Arquivo protegido ou incompatível.'));
    } finally {
      isProcessing = false;
      btnConvert.disabled = false;
      setTimeout(() => {
        progressBox.style.display = 'none';
      }, 800);
    }
  });
}
