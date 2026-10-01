import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfToText(container: HTMLElement) {
  let selectedFile: File | null = null;
  let extractedResult: {
    text: string;
    markdown: string;
    pageCount: number;
    charCount: number;
    wordCount: number;
  } | null = null;
  let activeTab: 'markdown' | 'text' = 'markdown';
  let isExtracting = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdftotext" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">PDF para Markdown & Texto</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdftotext" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdftotext-setup-area">
      <div class="dropzone-box" id="pdftotext-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
        <div class="dropzone-text">Arraste seu PDF para extrair o texto</div>
        <div class="dropzone-hint">Converte contratos, livros e artigos em Markdown estruturado ou Texto puro</div>
        <input type="file" id="pdftotext-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdftotext-workspace-area" style="display: none;">
      
      <!-- Metrics Header -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Documento Processado</div>
            <div id="pdftotext-file-name" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 2px 0;">-</div>
            
            <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Páginas: <strong id="pdftotext-pages-count" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Palavras: <strong id="pdftotext-words-count" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Caracteres: <strong id="pdftotext-chars-count" style="color: var(--text-primary);">0</strong>
              </span>
            </div>
          </div>

          <button class="btn-back" id="btn-pdftotext-reset" style="height: 36px; padding: 0 12px; font-size: 0.85rem;">
            Trocar Arquivo
          </button>
        </div>
      </div>

      <!-- Format Tabs & Actions Bar -->
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
        
        <!-- Tabs -->
        <div class="segmented-tabs" style="height: 36px; padding: 2px;">
          <button class="tab-btn active" id="tab-pdftotext-md">Markdown (.md)</button>
          <button class="tab-btn" id="tab-pdftotext-txt">Texto Puro (.txt)</button>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button class="btn-back" id="btn-pdftotext-copy" style="height: 36px; padding: 0 12px; font-size: 0.85rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            Copiar Conteúdo
          </button>

          <button class="btn-back" id="btn-pdftotext-ai" style="height: 36px; padding: 0 12px; font-size: 0.85rem; border-color: #8b5cf6; color: #8b5cf6;" title="Copia o texto pré-formatado com prompt para colar no ChatGPT, Claude ou Gemini">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 22v-4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M22 12h-4"/><path d="m19.07 4.93-2.83 2.83"/></svg>
            Copiar p/ IA (Prompt)
          </button>

          <button class="btn-primary" id="btn-pdftotext-download" style="height: 36px; padding: 0 14px; font-size: 0.85rem; width: auto;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Baixar Arquivo
          </button>
        </div>

      </div>

      <!-- Preview Textarea -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
        <textarea id="pdftotext-textarea" class="form-input" style="height: 480px; width: 100%; font-family: 'Consolas', 'Courier New', monospace; font-size: 0.85rem; line-height: 1.6; resize: vertical; white-space: pre-wrap;" placeholder="O texto extraído aparecerá aqui..."></textarea>
      </div>

    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdftotext') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdftotext-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdftotext-file-input') as HTMLInputElement;

  const setupArea = container.querySelector('#pdftotext-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdftotext-workspace-area') as HTMLDivElement;

  const fileNameEl = container.querySelector('#pdftotext-file-name') as HTMLDivElement;
  const pagesCountEl = container.querySelector('#pdftotext-pages-count') as HTMLElement;
  const wordsCountEl = container.querySelector('#pdftotext-words-count') as HTMLElement;
  const charsCountEl = container.querySelector('#pdftotext-chars-count') as HTMLElement;

  const tabMd = container.querySelector('#tab-pdftotext-md') as HTMLButtonElement;
  const tabTxt = container.querySelector('#tab-pdftotext-txt') as HTMLButtonElement;

  const btnCopy = container.querySelector('#btn-pdftotext-copy') as HTMLButtonElement;
  const btnAi = container.querySelector('#btn-pdftotext-ai') as HTMLButtonElement;
  const btnDownload = container.querySelector('#btn-pdftotext-download') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-pdftotext-reset') as HTMLButtonElement;

  const textarea = container.querySelector('#pdftotext-textarea') as HTMLTextAreaElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    extractedResult = null;
    fileInput.value = '';
    textarea.value = '';
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
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecione um arquivo no formato PDF.');
      return;
    }

    if (isExtracting) return;
    isExtracting = true;
    selectedFile = file;

    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    fileNameEl.innerText = file.name;
    textarea.value = 'Extraindo texto e estruturando cabeçalhos... Aguarde.';

    try {
      const arrayBuffer = await file.arrayBuffer();
      extractedResult = await PdfService.extractTextAndMarkdown(arrayBuffer);

      pagesCountEl.innerText = extractedResult.pageCount.toString();
      wordsCountEl.innerText = extractedResult.wordCount.toLocaleString();
      charsCountEl.innerText = extractedResult.charCount.toLocaleString();

      updateTextarea();

      historyManager.record(
        'pdf-to-text',
        'pdf',
        'PDF para Texto & Markdown',
        file.name,
        `${extractedResult.pageCount} páginas • ${extractedResult.wordCount.toLocaleString()} palavras`,
        {}
      );
    } catch (err) {
      console.error(err);
      textarea.value = 'Erro ao processar o PDF. O arquivo pode estar protegido por senha ou conter apenas imagens escaneadas sem camada de texto.';
    } finally {
      isExtracting = false;
    }
  }

  function updateTextarea() {
    if (!extractedResult) return;
    if (activeTab === 'markdown') {
      textarea.value = extractedResult.markdown;
      btnDownload.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Baixar .MD
      `;
    } else {
      textarea.value = extractedResult.text;
      btnDownload.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Baixar .TXT
      `;
    }
  }

  tabMd.addEventListener('click', () => {
    activeTab = 'markdown';
    tabMd.classList.add('active');
    tabTxt.classList.remove('active');
    updateTextarea();
  });

  tabTxt.addEventListener('click', () => {
    activeTab = 'text';
    tabTxt.classList.add('active');
    tabMd.classList.remove('active');
    updateTextarea();
  });

  // Copy standard
  btnCopy.addEventListener('click', async () => {
    const content = textarea.value;
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      const originalText = btnCopy.innerHTML;
      btnCopy.innerHTML = 'Copiado!';
      btnCopy.style.color = '#22c55e';
      setTimeout(() => {
        btnCopy.innerHTML = originalText;
        btnCopy.style.color = '';
      }, 1800);
    } catch {
      alert('Falha ao copiar para a área de transferência.');
    }
  });

  // Copy with AI Prompt template
  btnAi.addEventListener('click', async () => {
    const content = textarea.value;
    if (!content) return;

    const aiPrompt = `Abaixo está o conteúdo extraído de um documento PDF (${selectedFile?.name || 'documento'}):\n\n---\n${content}\n---\n\nCom base nas informações acima, por favor elabore um resumo conciso, liste os pontos e obrigações principais e responda a dúvidas sobre o texto.`;

    try {
      await navigator.clipboard.writeText(aiPrompt);
      const originalText = btnAi.innerHTML;
      btnAi.innerHTML = 'Copiado c/ Prompt!';
      btnAi.style.color = '#22c55e';
      setTimeout(() => {
        btnAi.innerHTML = originalText;
        btnAi.style.color = '#8b5cf6';
      }, 2000);
    } catch {
      alert('Falha ao copiar para a área de transferência.');
    }
  });

  // Download file
  btnDownload.addEventListener('click', () => {
    if (!extractedResult || !selectedFile) return;

    const isMd = activeTab === 'markdown';
    const content = isMd ? extractedResult.markdown : extractedResult.text;
    const ext = isMd ? 'md' : 'txt';
    const mimeType = isMd ? 'text/markdown;charset=utf-8;' : 'text/plain;charset=utf-8;';

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_extraido.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}
