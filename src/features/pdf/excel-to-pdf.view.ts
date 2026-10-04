import { OfficeService } from './office.service';
import { historyManager } from '../../core/history/history.manager';

export function renderExcelToPdf(container: HTMLElement) {
  let selectedFile: File | null = null;
  let fileBuffer: ArrayBuffer | null = null;
  let parsedWorkbook: { sheetNames: string[]; sheets: Record<string, string[][]> } | null = null;
  let isProcessing = false;

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-exceltopdf" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Excel para PDF (.XLSX / .CSV)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-exceltopdf" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="exceltopdf-setup-area">
      <div class="dropzone-box" id="exceltopdf-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
        </svg>
        <div class="dropzone-text">Arraste sua planilha Excel (.XLSX, .XLS ou .CSV)</div>
        <div class="dropzone-hint">Gera um documento PDF tabular executivo com cabeçalho repetido e paginação</div>
        <input type="file" id="exceltopdf-file-input" accept=".xlsx,.xls,.csv,.ods" style="display: none;" />
      </div>
    </div>

    <div id="exceltopdf-workspace-area" style="display: none;">
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-tertiary); font-weight: 600;">Planilha Carregada</div>
            <div id="exceltopdf-file-name" style="font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 2px 0;">-</div>
            <div style="display: flex; gap: 10px; margin-top: 8px; flex-wrap: wrap;">
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Abas: <strong id="exceltopdf-sheets-count" style="color: var(--text-primary);">0</strong>
              </span>
              <span style="background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 4px; font-size: 0.8rem; color: var(--text-secondary);">
                Linhas na aba: <strong id="exceltopdf-rows-count" style="color: var(--text-primary);">0</strong>
              </span>
            </div>
          </div>

          <div style="display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;">
            <div>
              <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 2px;">Aba para Exportar:</label>
              <select id="exceltopdf-sheet-select" class="form-input" style="height: 36px; padding: 2px 10px; font-size: 0.85rem;"></select>
            </div>

            <div>
              <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 2px;">Orientação:</label>
              <select id="exceltopdf-orientation" class="form-input" style="height: 36px; padding: 2px 10px; font-size: 0.85rem;">
                <option value="landscape" selected>Paisagem (Horizontal A4)</option>
                <option value="portrait">Retrato (Vertical A4)</option>
              </select>
            </div>

            <div>
              <label style="font-size: 0.75rem; color: var(--text-tertiary); display: block; margin-bottom: 2px;">Estilo Visual:</label>
              <select id="exceltopdf-theme" class="form-input" style="height: 36px; padding: 2px 10px; font-size: 0.85rem;">
                <option value="executive" selected>Executivo Zebrado</option>
                <option value="grid">Grade Completa</option>
                <option value="minimal">Minimalista</option>
              </select>
            </div>

            <button class="btn-back" id="btn-exceltopdf-reset" style="height: 36px; padding: 0 12px; font-size: 0.85rem;">
              Trocar Planilha
            </button>

            <button class="btn-primary" id="btn-exceltopdf-download" style="height: 36px; padding: 0 16px; font-size: 0.85rem; width: auto; background: #16a34a; border-color: #16a34a;">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Gerar & Baixar PDF
            </button>
          </div>
        </div>
      </div>

      <!-- Table Preview -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 10px; padding: 14px;">
        <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 10px;">
          Pré-visualização dos Dados da Planilha (Primeiras 80 linhas)
        </div>
        <div style="overflow: auto; max-height: 460px; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-page);">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.82rem;">
            <tbody id="exceltopdf-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-exceltopdf') as HTMLButtonElement;
  const setupArea = container.querySelector('#exceltopdf-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#exceltopdf-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#exceltopdf-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#exceltopdf-file-input') as HTMLInputElement;

  const fileNameEl = container.querySelector('#exceltopdf-file-name') as HTMLDivElement;
  const sheetsCountEl = container.querySelector('#exceltopdf-sheets-count') as HTMLElement;
  const rowsCountEl = container.querySelector('#exceltopdf-rows-count') as HTMLElement;

  const sheetSelect = container.querySelector('#exceltopdf-sheet-select') as HTMLSelectElement;
  const orientSelect = container.querySelector('#exceltopdf-orientation') as HTMLSelectElement;
  const themeSelect = container.querySelector('#exceltopdf-theme') as HTMLSelectElement;

  const btnReset = container.querySelector('#btn-exceltopdf-reset') as HTMLButtonElement;
  const btnDownload = container.querySelector('#btn-exceltopdf-download') as HTMLButtonElement;
  const tbody = container.querySelector('#exceltopdf-tbody') as HTMLTableSectionElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  btnReset.addEventListener('click', () => {
    selectedFile = null;
    fileBuffer = null;
    parsedWorkbook = null;
    fileInput.value = '';
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
  });

  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#16a34a'; });
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
    selectedFile = file;
    fileNameEl.innerText = file.name;
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'block';

    try {
      fileBuffer = await file.arrayBuffer();
      parsedWorkbook = OfficeService.parseExcelWorkbook(fileBuffer);
      sheetsCountEl.innerText = parsedWorkbook.sheetNames.length.toString();

      sheetSelect.innerHTML = '';
      if (parsedWorkbook.sheetNames.length > 1) {
        const allOpt = document.createElement('option');
        allOpt.value = '__ALL__';
        allOpt.innerText = `Todas as Abas (${parsedWorkbook.sheetNames.length})`;
        sheetSelect.appendChild(allOpt);
      }

      for (const sName of parsedWorkbook.sheetNames) {
        const opt = document.createElement('option');
        opt.value = sName;
        opt.innerText = sName;
        sheetSelect.appendChild(opt);
      }

      renderSheetPreview();
    } catch (err: any) {
      console.error(err);
      alert('Não foi possível ler a planilha: ' + (err?.message || 'Formato inválido.'));
    }
  }

  function renderSheetPreview() {
    if (!parsedWorkbook) return;
    const chosen = sheetSelect.value;
    const previewSheetName = chosen === '__ALL__' ? parsedWorkbook.sheetNames[0] : chosen;
    const rows = parsedWorkbook.sheets[previewSheetName] || [];
    rowsCountEl.innerText = rows.length.toLocaleString();

    tbody.innerHTML = '';
    if (rows.length === 0) {
      tbody.innerHTML = '<tr><td style="padding:16px;text-align:center;color:var(--text-secondary);">Aba vazia.</td></tr>';
      return;
    }

    rows.slice(0, 80).forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      if (idx === 0) {
        tr.style.background = 'var(--bg-surface)';
        tr.style.fontWeight = '700';
      }
      row.forEach((cell) => {
        const td = document.createElement('td');
        td.style.padding = '6px 10px';
        td.style.borderRight = '1px solid var(--border-color)';
        td.style.whiteSpace = 'nowrap';
        td.innerText = cell || '';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  sheetSelect.addEventListener('change', renderSheetPreview);

  btnDownload.addEventListener('click', async () => {
    if (!fileBuffer || !selectedFile || isProcessing) return;
    isProcessing = true;
    const origHtml = btnDownload.innerHTML;
    btnDownload.innerText = 'Gerando PDF...';
    btnDownload.disabled = true;

    try {
      const { pdfBytes, pageCount, rowCount } = await OfficeService.excelToPdf(fileBuffer, {
        sheetName: sheetSelect.value,
        orientation: orientSelect.value as 'landscape' | 'portrait',
        theme: themeSelect.value as 'executive' | 'grid' | 'minimal',
        title: selectedFile.name.replace(/\.[^/.]+$/, ''),
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      historyManager.record(
        'excel-to-pdf',
        'pdf',
        'Excel para PDF',
        selectedFile.name,
        `${pageCount} páginas • ${rowCount} linhas exportadas`,
        {}
      );
    } catch (err: any) {
      console.error(err);
      alert('Erro ao converter planilha para PDF: ' + (err?.message || 'Erro inesperado.'));
    } finally {
      isProcessing = false;
      btnDownload.innerHTML = origHtml;
      btnDownload.disabled = false;
    }
  });
}
