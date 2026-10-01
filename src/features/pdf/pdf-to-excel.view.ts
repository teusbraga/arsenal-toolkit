import { PdfService } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

export function renderPdfToExcel(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let extractedResult: {
    csv: string;
    tableData: string[][];
    pageCount: number;
    rowCount: number;
    colCount: number;
  } | null = null;

  let currentDelimiter = ';';
  let selectedPage = 0; // 0 = all pages
  let isExtracting = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdftoexcel" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">PDF para Tabela / Excel (CSV)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdftoexcel" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdftoexcel-setup-area">
      <div class="dropzone-box" id="pdftoexcel-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
        <div class="dropzone-text">Arraste seu PDF com tabelas ou relatórios</div>
        <div class="dropzone-hint">Ideal para faturas, extratos bancários, listas de produtos e tabelas financeiras</div>
        <input type="file" id="pdftoexcel-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdftoexcel-workspace-area" style="display: none;">
      
      <!-- Metrics & Controls Header -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Relatório Extraído</div>
            <div id="pdftoexcel-file-name" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 2px 0;">-</div>
            
            <div style="display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Linhas: <strong id="pdftoexcel-rows-count" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Colunas detectadas: <strong id="pdftoexcel-cols-count" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Páginas: <strong id="pdftoexcel-pages-count" style="color: var(--text-primary);">0</strong>
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
            <div>
              <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 2px;">Separador CSV:</label>
              <select id="pdftoexcel-delim-select" class="form-input" style="height: 34px; padding: 2px 8px; font-size: 0.8rem;">
                <option value=";" selected>; (Ponto e Vírgula - Excel Brasil)</option>
                <option value=",">, (Vírgula - Internacional)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 2px;">Páginas:</label>
              <select id="pdftoexcel-page-select" class="form-input" style="height: 34px; padding: 2px 8px; font-size: 0.8rem;">
                <option value="0" selected>Todas as páginas</option>
              </select>
            </div>

            <button class="btn-back" id="btn-pdftoexcel-reset" style="height: 34px; padding: 0 12px; font-size: 0.85rem; align-self: flex-end;">
              Trocar Arquivo
            </button>
          </div>
        </div>
      </div>

      <!-- Action Buttons Bar -->
      <div style="display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
        <button class="btn-back" id="btn-pdftoexcel-copy" style="height: 36px; padding: 0 12px; font-size: 0.85rem;">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          Copiar CSV
        </button>

        <button class="btn-primary" id="btn-pdftoexcel-download" style="height: 36px; padding: 0 14px; font-size: 0.85rem; width: auto;">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Baixar Arquivo .CSV
        </button>

        <button class="btn-primary" id="btn-pdftoexcel-open-mini" style="height: 36px; padding: 0 16px; font-size: 0.85rem; width: auto; background: #059669; border-color: #059669;">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
          Abrir no Mini Excel
        </button>
      </div>

      <!-- Table Visual Preview Container -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-size: 0.85rem; font-weight: 600;">Pré-visualização da Tabela Extraída</span>
          <span style="font-size: 0.75rem; color: var(--text-tertiary);">Mostrando até 100 primeiras linhas</span>
        </div>

        <div style="overflow: auto; max-height: 480px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-page);">
          <table id="pdftoexcel-table" style="width: 100%; border-collapse: collapse; font-size: 0.82rem; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            <tbody id="pdftoexcel-tbody">
              <!-- Table preview lines injected here -->
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  const btnBack = container.querySelector('#btn-back-pdftoexcel') as HTMLButtonElement;
  const dropzone = container.querySelector('#pdftoexcel-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdftoexcel-file-input') as HTMLInputElement;

  const setupArea = container.querySelector('#pdftoexcel-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdftoexcel-workspace-area') as HTMLDivElement;

  const fileNameEl = container.querySelector('#pdftoexcel-file-name') as HTMLDivElement;
  const rowsCountEl = container.querySelector('#pdftoexcel-rows-count') as HTMLElement;
  const colsCountEl = container.querySelector('#pdftoexcel-cols-count') as HTMLElement;
  const pagesCountEl = container.querySelector('#pdftoexcel-pages-count') as HTMLElement;

  const delimSelect = container.querySelector('#pdftoexcel-delim-select') as HTMLSelectElement;
  const pageSelect = container.querySelector('#pdftoexcel-page-select') as HTMLSelectElement;

  const btnCopy = container.querySelector('#btn-pdftoexcel-copy') as HTMLButtonElement;
  const btnDownload = container.querySelector('#btn-pdftoexcel-download') as HTMLButtonElement;
  const btnOpenMiniExcel = container.querySelector('#btn-pdftoexcel-open-mini') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-pdftoexcel-reset') as HTMLButtonElement;

  const tableBody = container.querySelector('#pdftoexcel-tbody') as HTMLTableSectionElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    fileBuffer = null;
    extractedResult = null;
    fileInput.value = '';
    tableBody.innerHTML = '';
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
    tableBody.innerHTML = '<tr><td style="padding: 16px; text-align: center; color: var(--text-secondary);">Analisando layout e agrupando linhas da tabela... Aguarde.</td></tr>';

    try {
      fileBuffer = await file.arrayBuffer();
      await runExtraction();

      // Populate page selector
      pageSelect.innerHTML = '<option value="0" selected>Todas as páginas</option>';
      if (extractedResult) {
        for (let p = 1; p <= extractedResult.pageCount; p++) {
          const opt = document.createElement('option');
          opt.value = p.toString();
          opt.innerText = `Página ${p}`;
          pageSelect.appendChild(opt);
        }
      }

      historyManager.record(
        'pdf-to-excel',
        'pdf',
        'PDF para Tabela / Excel',
        file.name,
        `${extractedResult?.rowCount || 0} linhas • ${extractedResult?.colCount || 0} colunas`,
        {}
      );
    } catch (err) {
      console.error(err);
      tableBody.innerHTML = '<tr><td style="padding: 16px; text-align: center; color: #ef4444;">Erro ao extrair tabelas deste PDF. O documento pode ser uma imagem escaneada sem texto vetorial.</td></tr>';
    } finally {
      isExtracting = false;
    }
  }

  async function runExtraction() {
    if (!fileBuffer) return;

    extractedResult = await PdfService.extractTablesToCsv(fileBuffer, {
      delimiter: currentDelimiter,
      pageNum: selectedPage > 0 ? selectedPage : undefined
    });

    rowsCountEl.innerText = extractedResult.rowCount.toLocaleString();
    colsCountEl.innerText = extractedResult.colCount.toString();
    pagesCountEl.innerText = extractedResult.pageCount.toString();

    renderTablePreview(extractedResult.tableData);
  }

  function renderTablePreview(data: string[][]) {
    tableBody.innerHTML = '';
    if (!data || data.length === 0) {
      tableBody.innerHTML = '<tr><td style="padding: 16px; text-align: center; color: var(--text-secondary);">Nenhuma tabela tabular detectada nesta página.</td></tr>';
      return;
    }

    const previewRows = data.slice(0, 100); // first 100 rows
    previewRows.forEach((row, rIdx) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      if (rIdx === 0) {
        tr.style.background = 'var(--bg-surface)';
        tr.style.fontWeight = '600';
      }

      row.forEach(cell => {
        const td = document.createElement('td');
        td.style.padding = '6px 10px';
        td.style.borderRight = '1px solid var(--border-color)';
        td.style.maxWidth = '260px';
        td.style.overflow = 'hidden';
        td.style.textOverflow = 'ellipsis';
        td.style.whiteSpace = 'nowrap';
        td.innerText = cell || '';
        tr.appendChild(td);
      });

      tableBody.appendChild(tr);
    });
  }

  delimSelect.addEventListener('change', () => {
    currentDelimiter = delimSelect.value;
    runExtraction();
  });

  pageSelect.addEventListener('change', () => {
    selectedPage = parseInt(pageSelect.value, 10) || 0;
    runExtraction();
  });

  // Copy CSV
  btnCopy.addEventListener('click', async () => {
    if (!extractedResult || !extractedResult.csv) return;
    try {
      await navigator.clipboard.writeText(extractedResult.csv);
      const originalText = btnCopy.innerHTML;
      btnCopy.innerHTML = 'Copiado!';
      btnCopy.style.color = '#22c55e';
      setTimeout(() => {
        btnCopy.innerHTML = originalText;
        btnCopy.style.color = '';
      }, 1800);
    } catch {
      alert('Falha ao copiar CSV para a área de transferência.');
    }
  });

  // Download CSV
  btnDownload.addEventListener('click', () => {
    if (!extractedResult || !selectedFile) return;

    const blob = new Blob([extractedResult.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_tabela.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Open in Mini Excel
  btnOpenMiniExcel.addEventListener('click', () => {
    if (!extractedResult || !extractedResult.csv) return;

    // Save CSV to sessionStorage for seamless pickup by Mini Excel
    sessionStorage.setItem('mini_excel_import_csv', extractedResult.csv);
    window.location.hash = '#/excel/mini-planilha';
  });
}
