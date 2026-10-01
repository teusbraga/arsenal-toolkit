import { ExcelService, SheetGrid, CellData } from './excel.service';
import { historyManager } from '../../core/history/history.manager';

export function renderMiniExcel(container: HTMLElement) {
  let numCols = 6;
  let numRows = 12;
  let grid: SheetGrid = {};
  let selectedCellId: string = 'A1';
  let isEditing = false;

  // Load default template
  const templates = ExcelService.getTemplates();
  const defaultTpl = templates.financial;
  numCols = defaultTpl.cols;
  numRows = defaultTpl.rows;
  grid = JSON.parse(JSON.stringify(defaultTpl.data));

  container.innerHTML = `
    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-excel" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Mini Excel (Planilha Rápida)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-excel" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <!-- Main Toolbar -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; margin-bottom: 12px; display: flex; flex-direction: column; gap: 10px;">
      
      <!-- Row 1: File Actions & Templates -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <select id="excel-template-select" class="form-input" style="height: 34px; padding: 2px 10px; font-size: 0.85rem; width: auto;">
            <option value="financial">Modelo: Orçamento Mensal</option>
            <option value="sales">Modelo: Vendas & Comissões</option>
            <option value="blank">Planilha em Branco</option>
          </select>
          
          <button class="btn-back" id="btn-excel-import" style="height: 34px; padding: 0 10px; font-size: 0.85rem;" title="Importar arquivo CSV">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Importar CSV
          </button>
          <input type="file" id="excel-file-csv" accept=".csv,text/csv" style="display: none;" />

          <button class="btn-back" id="btn-excel-export" style="height: 34px; padding: 0 10px; font-size: 0.85rem;" title="Baixar como arquivo CSV">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Exportar CSV
          </button>
        </div>

        <div style="display: flex; gap: 6px; align-items: center;">
          <button class="btn-back" id="btn-excel-add-row" style="height: 34px; padding: 0 8px; font-size: 0.8rem;" title="Adicionar Linha">+ Linha</button>
          <button class="btn-back" id="btn-excel-del-row" style="height: 34px; padding: 0 8px; font-size: 0.8rem;" title="Remover Linha">- Linha</button>
          <button class="btn-back" id="btn-excel-add-col" style="height: 34px; padding: 0 8px; font-size: 0.8rem;" title="Adicionar Coluna">+ Coluna</button>
          <button class="btn-back" id="btn-excel-del-col" style="height: 34px; padding: 0 8px; font-size: 0.8rem;" title="Remover Coluna">- Coluna</button>
          <button class="btn-back" id="btn-excel-clear" style="height: 34px; padding: 0 8px; font-size: 0.8rem; color: #ef4444;" title="Limpar células">Limpar</button>
        </div>
      </div>

      <!-- Row 2: Formatting Toolbar -->
      <div style="display: flex; gap: 8px; align-items: center; border-top: 1px solid var(--border-color); padding-top: 8px; flex-wrap: wrap;">
        <!-- Bold & Italic -->
        <button class="btn-back" id="btn-fmt-bold" style="width: 32px; height: 32px; padding: 0; font-weight: bold; font-family: serif;" title="Negrito">B</button>
        <button class="btn-back" id="btn-fmt-italic" style="width: 32px; height: 32px; padding: 0; font-style: italic; font-family: serif;" title="Itálico">I</button>

        <div style="width: 1px; height: 20px; background: var(--border-color); margin: 0 4px;"></div>

        <!-- Alignment -->
        <button class="btn-back" id="btn-align-left" style="width: 32px; height: 32px; padding: 0;" title="Alinhar à Esquerda">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
        </button>
        <button class="btn-back" id="btn-align-center" style="width: 32px; height: 32px; padding: 0;" title="Centralizar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
        </button>
        <button class="btn-back" id="btn-align-right" style="width: 32px; height: 32px; padding: 0;" title="Alinhar à Direita">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
        </button>

        <div style="width: 1px; height: 20px; background: var(--border-color); margin: 0 4px;"></div>

        <!-- Format Types -->
        <button class="btn-back" id="btn-fmt-currency" style="height: 32px; padding: 0 8px; font-size: 0.8rem;" title="Formato Moeda (R$)">R$</button>
        <button class="btn-back" id="btn-fmt-percent" style="height: 32px; padding: 0 8px; font-size: 0.8rem;" title="Formato Porcentagem (%)">%</button>
        <button class="btn-back" id="btn-fmt-number" style="height: 32px; padding: 0 8px; font-size: 0.8rem;" title="Formato Numérico Padrão">123</button>
        <button class="btn-back" id="btn-fmt-text" style="height: 32px; padding: 0 8px; font-size: 0.8rem;" title="Texto Sem Formatação">ABC</button>

        <div style="margin-left: auto; font-size: 0.8rem; color: var(--text-tertiary);">
          Fórmulas suportadas: <code>=SOMA(A1:A5)</code>, <code>=MEDIA(B1:B5)</code>, <code>=A1*B1</code>
        </div>
      </div>

    </div>

    <!-- Formula Bar (fx) -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 6px 12px; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
      <div id="excel-active-cell-box" style="font-weight: 700; font-family: monospace; font-size: 0.9rem; min-width: 48px; text-align: center; background: var(--bg-page); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 6px;">
        A1
      </div>
      <span style="font-weight: 700; font-style: italic; color: var(--text-tertiary); font-size: 1rem;">fx</span>
      <input type="text" id="excel-formula-input" class="form-input" placeholder="Digite um valor ou fórmula (ex: =SOMA(A1:A4) ou =B2*0.1)" style="flex: 1; height: 32px; font-family: monospace; font-size: 0.85rem;" />
    </div>

    <!-- Spreadsheet Grid Container -->
    <div id="excel-grid-wrapper" style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; overflow: auto; max-height: 520px; position: relative;">
      <table id="excel-table" style="border-collapse: collapse; width: max-content; min-width: 100%; font-size: 0.85rem; user-select: none;">
        <thead id="excel-thead"></thead>
        <tbody id="excel-tbody"></tbody>
      </table>
    </div>

    <!-- Status Bar -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; font-size: 0.8rem; color: var(--text-secondary); margin-top: 8px;">
      <span id="excel-status-info">Pronto</span>
      <div id="excel-calc-summary" style="display: flex; gap: 16px;"></div>
    </div>
  `;

  const btnBack = container.querySelector('#btn-back-excel') as HTMLButtonElement;
  const tplSelect = container.querySelector('#excel-template-select') as HTMLSelectElement;
  const btnImport = container.querySelector('#btn-excel-import') as HTMLButtonElement;
  const fileCsv = container.querySelector('#excel-file-csv') as HTMLInputElement;
  const btnExport = container.querySelector('#btn-excel-export') as HTMLButtonElement;

  const btnAddRow = container.querySelector('#btn-excel-add-row') as HTMLButtonElement;
  const btnDelRow = container.querySelector('#btn-excel-del-row') as HTMLButtonElement;
  const btnAddCol = container.querySelector('#btn-excel-add-col') as HTMLButtonElement;
  const btnDelCol = container.querySelector('#btn-excel-del-col') as HTMLButtonElement;
  const btnClear = container.querySelector('#btn-excel-clear') as HTMLButtonElement;

  const btnBold = container.querySelector('#btn-fmt-bold') as HTMLButtonElement;
  const btnItalic = container.querySelector('#btn-fmt-italic') as HTMLButtonElement;
  const btnAlignLeft = container.querySelector('#btn-align-left') as HTMLButtonElement;
  const btnAlignCenter = container.querySelector('#btn-align-center') as HTMLButtonElement;
  const btnAlignRight = container.querySelector('#btn-align-right') as HTMLButtonElement;
  const btnFmtCurrency = container.querySelector('#btn-fmt-currency') as HTMLButtonElement;
  const btnFmtPercent = container.querySelector('#btn-fmt-percent') as HTMLButtonElement;
  const btnFmtNumber = container.querySelector('#btn-fmt-number') as HTMLButtonElement;
  const btnFmtText = container.querySelector('#btn-fmt-text') as HTMLButtonElement;

  const activeCellBox = container.querySelector('#excel-active-cell-box') as HTMLDivElement;
  const formulaInput = container.querySelector('#excel-formula-input') as HTMLInputElement;

  const thead = container.querySelector('#excel-thead') as HTMLTableSectionElement;
  const tbody = container.querySelector('#excel-tbody') as HTMLTableSectionElement;
  const calcSummary = container.querySelector('#excel-calc-summary') as HTMLDivElement;

  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  // Recalculate whole grid
  function recalculateGrid() {
    for (const cellId in grid) {
      grid[cellId].value = ExcelService.evaluateCell(cellId, grid);
    }
  }

  // Render Table DOM
  function renderTable() {
    recalculateGrid();

    // Render Headers (Thead)
    let theadHtml = '<tr><th style="width: 44px; min-width: 44px; position: sticky; left: 0; top: 0; z-index: 3; background: var(--bg-page); border: 1px solid var(--border-color); padding: 4px; text-align: center; color: var(--text-tertiary); font-weight: 600;"></th>';
    for (let c = 0; c < numCols; c++) {
      const label = ExcelService.colIndexToLabel(c);
      theadHtml += `<th style="min-width: 120px; position: sticky; top: 0; z-index: 2; background: var(--bg-page); border: 1px solid var(--border-color); padding: 6px 8px; text-align: center; font-weight: 600; color: var(--text-secondary);">${label}</th>`;
    }
    theadHtml += '</tr>';
    thead.innerHTML = theadHtml;

    // Render Rows (Tbody)
    tbody.innerHTML = '';
    for (let r = 0; r < numRows; r++) {
      const tr = document.createElement('tr');

      // Sticky Row Number Column
      const thRow = document.createElement('th');
      thRow.style.cssText = 'width: 44px; min-width: 44px; position: sticky; left: 0; z-index: 1; background: var(--bg-page); border: 1px solid var(--border-color); text-align: center; color: var(--text-tertiary); font-size: 0.75rem; font-weight: 600;';
      thRow.innerText = (r + 1).toString();
      tr.appendChild(thRow);

      // Data Cells
      for (let c = 0; c < numCols; c++) {
        const cellId = `${ExcelService.colIndexToLabel(c)}${r + 1}`;
        const td = document.createElement('td');
        td.id = `cell-${cellId}`;
        td.dataset.cellId = cellId;
        td.style.cssText = `
          border: 1px solid var(--border-color);
          padding: 6px 8px;
          min-width: 120px;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: cell;
          background: var(--bg-surface);
        `;

        updateCellElement(td, cellId);

        // Cell Click Handler
        td.addEventListener('click', () => {
          selectCell(cellId);
        });

        // Double Click to Edit in Cell
        td.addEventListener('dblclick', () => {
          startInlineEdit(td, cellId);
        });

        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    selectCell(selectedCellId);
    updateSummary();
  }

  function updateCellElement(td: HTMLTableCellElement, cellId: string) {
    const data = grid[cellId] || { raw: '' };
    const displayVal = ExcelService.formatValue(data.value !== undefined ? data.value : data.raw, data.format);

    td.innerText = displayVal;
    td.style.fontWeight = data.bold ? 'bold' : 'normal';
    td.style.fontStyle = data.italic ? 'italic' : 'normal';
    td.style.textAlign = data.align || (typeof data.value === 'number' ? 'right' : 'left');

    if (data.value === '#ERRO!' || data.value === '#CIRCULAR!' || data.value === '#VALOR!' || data.value === '#DIV/0!') {
      td.style.color = '#ef4444';
    } else {
      td.style.color = 'var(--text-primary)';
    }
  }

  function selectCell(cellId: string) {
    // Unhighlight previous
    const prevEl = container.querySelector(`#cell-${selectedCellId}`) as HTMLElement;
    if (prevEl) {
      prevEl.style.outline = 'none';
      prevEl.style.zIndex = '0';
    }

    selectedCellId = cellId;
    activeCellBox.innerText = cellId;

    const data = grid[cellId] || { raw: '' };
    formulaInput.value = data.raw;

    // Highlight active
    const newEl = container.querySelector(`#cell-${cellId}`) as HTMLElement;
    if (newEl) {
      newEl.style.outline = '2px solid var(--btn-primary-bg)';
      newEl.style.outlineOffset = '-1px';
      newEl.style.zIndex = '1';
    }

    // Update formatting button active states
    btnBold.style.color = data.bold ? 'var(--btn-primary-bg)' : '';
    btnItalic.style.color = data.italic ? 'var(--btn-primary-bg)' : '';
  }

  function startInlineEdit(td: HTMLTableCellElement, cellId: string) {
    if (isEditing) return;
    isEditing = true;

    const data = grid[cellId] || { raw: '' };
    const input = document.createElement('input');
    input.type = 'text';
    input.value = data.raw;
    input.style.cssText = 'width: 100%; height: 100%; border: none; outline: none; background: transparent; font-size: inherit; font-family: inherit; color: inherit; padding: 0;';

    td.innerText = '';
    td.appendChild(input);
    input.focus();

    const finishEdit = () => {
      if (!isEditing) return;
      isEditing = false;
      commitCellValue(cellId, input.value);
      renderTable();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur();
      } else if (e.key === 'Escape') {
        isEditing = false;
        renderTable();
      }
    });
  }

  function commitCellValue(cellId: string, rawVal: string) {
    if (!grid[cellId]) grid[cellId] = { raw: '' };
    grid[cellId].raw = rawVal;
    recalculateGrid();
  }

  // Formula input listener
  formulaInput.addEventListener('input', () => {
    commitCellValue(selectedCellId, formulaInput.value);
    const td = container.querySelector(`#cell-${selectedCellId}`) as HTMLTableCellElement;
    if (td) updateCellElement(td, selectedCellId);
    recalculateGrid();
    // Update all cells display
    for (const cId in grid) {
      const el = container.querySelector(`#cell-${cId}`) as HTMLTableCellElement;
      if (el) updateCellElement(el, cId);
    }
    updateSummary();
  });

  formulaInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // Move to cell below
      const parsed = ExcelService.parseCellId(selectedCellId);
      if (parsed && parsed.row + 1 < numRows) {
        selectCell(`${parsed.colLabel}${parsed.rowLabel + 1}`);
      }
    }
  });

  // Formatting actions
  function updateCellFormat(updater: (data: CellData) => void) {
    if (!grid[selectedCellId]) grid[selectedCellId] = { raw: '' };
    updater(grid[selectedCellId]);
    renderTable();
  }

  btnBold.addEventListener('click', () => updateCellFormat(d => { d.bold = !d.bold; }));
  btnItalic.addEventListener('click', () => updateCellFormat(d => { d.italic = !d.italic; }));
  btnAlignLeft.addEventListener('click', () => updateCellFormat(d => { d.align = 'left'; }));
  btnAlignCenter.addEventListener('click', () => updateCellFormat(d => { d.align = 'center'; }));
  btnAlignRight.addEventListener('click', () => updateCellFormat(d => { d.align = 'right'; }));
  btnFmtCurrency.addEventListener('click', () => updateCellFormat(d => { d.format = 'currency'; d.align = 'right'; }));
  btnFmtPercent.addEventListener('click', () => updateCellFormat(d => { d.format = 'percent'; d.align = 'right'; }));
  btnFmtNumber.addEventListener('click', () => updateCellFormat(d => { d.format = 'number'; d.align = 'right'; }));
  btnFmtText.addEventListener('click', () => updateCellFormat(d => { d.format = 'text'; d.align = 'left'; }));

  // Grid Structure (Add/Remove Rows & Columns)
  btnAddRow.addEventListener('click', () => {
    numRows++;
    renderTable();
  });

  btnDelRow.addEventListener('click', () => {
    if (numRows > 2) {
      numRows--;
      renderTable();
    }
  });

  btnAddCol.addEventListener('click', () => {
    numCols++;
    renderTable();
  });

  btnDelCol.addEventListener('click', () => {
    if (numCols > 2) {
      numCols--;
      renderTable();
    }
  });

  btnClear.addEventListener('click', () => {
    if (confirm('Tem certeza que deseja limpar todos os dados da planilha?')) {
      grid = {};
      renderTable();
    }
  });

  // Templates
  tplSelect.addEventListener('change', () => {
    const val = tplSelect.value;
    if (val === 'blank') {
      numCols = 6;
      numRows = 12;
      grid = {};
    } else if (templates[val]) {
      const t = templates[val];
      numCols = t.cols;
      numRows = t.rows;
      grid = JSON.parse(JSON.stringify(t.data));
    }
    selectedCellId = 'A1';
    renderTable();
  });

  // CSV Import
  btnImport.addEventListener('click', () => fileCsv.click());
  fileCsv.addEventListener('change', () => {
    if (fileCsv.files && fileCsv.files.length > 0) {
      const file = fileCsv.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const parsed = ExcelService.parseCsv(text);
          grid = parsed.grid;
          numCols = parsed.maxCols;
          numRows = parsed.maxRows;
          selectedCellId = 'A1';
          renderTable();
          historyManager.record('mini-excel', 'excel', 'Importação CSV', file.name, `${numRows} linhas carregadas`, {});
        }
      };
      reader.readAsText(file);
    }
    fileCsv.value = '';
  });

  // CSV Export
  btnExport.addEventListener('click', () => {
    const csvContent = ExcelService.exportToCsv(grid, numCols, numRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilha_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    historyManager.record('mini-excel', 'excel', 'Exportação CSV', `planilha.csv`, `${numRows} linhas exportadas`, {});
  });

  // Summary bar (Count, Sum, Average)
  function updateSummary() {
    let count = 0;
    let sum = 0;
    let numCount = 0;

    for (const cellId in grid) {
      const cell = grid[cellId];
      if (cell && cell.raw !== '') {
        count++;
        if (typeof cell.value === 'number') {
          sum += cell.value;
          numCount++;
        }
      }
    }

    if (numCount > 0) {
      const avg = sum / numCount;
      calcSummary.innerHTML = `
        <span>Células preenchidas: <strong>${count}</strong></span>
        <span>Soma dos números: <strong>${sum.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong></span>
        <span>Média: <strong>${avg.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}</strong></span>
      `;
    } else {
      calcSummary.innerHTML = `<span>Células preenchidas: <strong>${count}</strong></span>`;
    }
  }

  // Keyboard navigation on grid
  container.addEventListener('keydown', (e) => {
    if (isEditing || document.activeElement === formulaInput) return;

    const parsed = ExcelService.parseCellId(selectedCellId);
    if (!parsed) return;

    let targetCol = parsed.col;
    let targetRow = parsed.row;

    if (e.key === 'ArrowRight' || e.key === 'Tab') {
      if (targetCol + 1 < numCols) targetCol++;
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      if (targetCol > 0) targetCol--;
      e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      if (targetRow + 1 < numRows) targetRow++;
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (targetRow > 0) targetRow--;
      e.preventDefault();
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      commitCellValue(selectedCellId, '');
      renderTable();
      return;
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Start typing directly
      const td = container.querySelector(`#cell-${selectedCellId}`) as HTMLTableCellElement;
      if (td) startInlineEdit(td, selectedCellId);
      return;
    }

    const newCellId = `${ExcelService.colIndexToLabel(targetCol)}${targetRow + 1}`;
    if (newCellId !== selectedCellId) {
      selectCell(newCellId);
    }
  });

  // Initial render
  renderTable();
}
