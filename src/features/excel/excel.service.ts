export interface CellData {
  raw: string; // raw input (e.g. '=SOMA(A1:A3)' or '100' or 'Produto')
  value?: string | number; // evaluated result
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'percent';
}

export type SheetGrid = Record<string, CellData>; // key is e.g. 'A1', 'B3'

export class ExcelService {

  // Convert 0 -> A, 1 -> B, 25 -> Z, 26 -> AA
  static colIndexToLabel(index: number): string {
    let label = '';
    let num = index;
    while (num >= 0) {
      label = String.fromCharCode((num % 26) + 65) + label;
      num = Math.floor(num / 26) - 1;
    }
    return label;
  }

  // Convert A -> 0, B -> 1, AA -> 26
  static labelToColIndex(label: string): number {
    let index = 0;
    const upper = label.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      index = index * 26 + (upper.charCodeAt(i) - 64);
    }
    return index - 1;
  }

  // Parse 'B12' -> { col: 1, row: 11, colLabel: 'B', rowLabel: '12' }
  static parseCellId(cellId: string): { col: number; row: number; colLabel: string; rowLabel: number } | null {
    const match = cellId.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;
    const colLabel = match[1];
    const rowLabel = parseInt(match[2], 10);
    return {
      col: this.labelToColIndex(colLabel),
      row: rowLabel - 1, // 0-based
      colLabel,
      rowLabel
    };
  }

  // Expand 'A1:B3' into ['A1', 'A2', 'A3', 'B1', 'B2', 'B3']
  static expandRange(rangeStr: string): string[] {
    const parts = rangeStr.split(':').map(p => p.trim().toUpperCase());
    if (parts.length === 1) return [parts[0]];
    if (parts.length !== 2) return [];

    const start = this.parseCellId(parts[0]);
    const end = this.parseCellId(parts[1]);
    if (!start || !end) return [];

    const minCol = Math.min(start.col, end.col);
    const maxCol = Math.max(start.col, end.col);
    const minRow = Math.min(start.row, end.row);
    const maxRow = Math.max(start.row, end.row);

    const cells: string[] = [];
    for (let c = minCol; c <= maxCol; c++) {
      const colLabel = this.colIndexToLabel(c);
      for (let r = minRow; r <= maxRow; r++) {
        cells.push(`${colLabel}${r + 1}`);
      }
    }
    return cells;
  }

  // Safely evaluate cell value given current sheet grid
  static evaluateCell(
    cellId: string,
    grid: SheetGrid,
    visiting: Set<string> = new Set()
  ): string | number {
    const cell = grid[cellId];
    if (!cell || cell.raw === undefined || cell.raw === '') return '';

    const raw = cell.raw.trim();

    // Plain text or number (not a formula)
    if (!raw.startsWith('=')) {
      if (!isNaN(Number(raw)) && raw !== '') {
        return Number(raw);
      }
      return raw;
    }

    // Circular reference protection
    if (visiting.has(cellId)) {
      return '#CIRCULAR!';
    }
    visiting.add(cellId);

    try {
      const formula = raw.substring(1).trim();
      const result = this.evaluateFormula(formula, grid, visiting);
      visiting.delete(cellId);
      return result;
    } catch {
      visiting.delete(cellId);
      return '#ERRO!';
    }
  }

  // Formula interpreter: SUM, AVERAGE, MIN, MAX, COUNT, arithmetic
  static evaluateFormula(
    formula: string,
    grid: SheetGrid,
    visiting: Set<string>
  ): string | number {
    // Upper case formula for function names, but keep case-insensitive matching
    let expr = formula.trim();

    // 1. Handle Built-in Functions: FUNCTION(ARGS)
    // SOMA/SUM, MEDIA/AVERAGE, MIN/MINIMO, MAX/MAXIMO, CONT/COUNT
    const funcRegex = /(SOMA|SUM|MEDIA|AVERAGE|MIN|MINIMO|MAX|MAXIMO|CONT|COUNT)\s*\(([^)]+)\)/i;
    let match: RegExpExecArray | null;

    while ((match = funcRegex.exec(expr)) !== null) {
      const funcName = match[1].toUpperCase();
      const argsRaw = match[2];

      // Expand ranges inside arguments: e.g. "A1:A5, B1:B3, 10"
      const argTokens = argsRaw.split(',').map(t => t.trim());
      const numbers: number[] = [];

      for (const token of argTokens) {
        if (token.includes(':')) {
          const cells = this.expandRange(token);
          for (const c of cells) {
            const val = this.evaluateCell(c, grid, new Set(visiting));
            if (typeof val === 'number') numbers.push(val);
          }
        } else {
          // Single cell or literal number
          const parsedCell = this.parseCellId(token);
          if (parsedCell) {
            const val = this.evaluateCell(token.toUpperCase(), grid, new Set(visiting));
            if (typeof val === 'number') numbers.push(val);
          } else if (!isNaN(Number(token))) {
            numbers.push(Number(token));
          }
        }
      }

      let funcResult = 0;
      if (funcName === 'SOMA' || funcName === 'SUM') {
        funcResult = numbers.reduce((acc, n) => acc + n, 0);
      } else if (funcName === 'MEDIA' || funcName === 'AVERAGE') {
        funcResult = numbers.length > 0 ? numbers.reduce((acc, n) => acc + n, 0) / numbers.length : 0;
      } else if (funcName === 'MIN' || funcName === 'MINIMO') {
        funcResult = numbers.length > 0 ? Math.min(...numbers) : 0;
      } else if (funcName === 'MAX' || funcName === 'MAXIMO') {
        funcResult = numbers.length > 0 ? Math.max(...numbers) : 0;
      } else if (funcName === 'CONT' || funcName === 'COUNT') {
        funcResult = numbers.length;
      }

      expr = expr.substring(0, match.index) + funcResult + expr.substring(match.index + match[0].length);
    }

    // 2. Replace remaining single cell references with their numerical values: e.g. "A1 + B2 * 3"
    const cellRefRegex = /\b([A-Z]+[0-9]+)\b/gi;
    expr = expr.replace(cellRefRegex, (m) => {
      const val = this.evaluateCell(m.toUpperCase(), grid, new Set(visiting));
      if (typeof val === 'number') return val.toString();
      if (typeof val === 'string') {
        const num = Number(val);
        return isNaN(num) ? '0' : num.toString();
      }
      return '0';
    });

    // 3. Safe Arithmetic Evaluation
    // Verify only allowed characters remain: numbers, whitespace, +, -, *, /, (, ), ., %
    if (!/^[0-9\s+\-*/().%]+$/.test(expr)) {
      return '#VALOR!';
    }

    // Replace % with *0.01
    expr = expr.replace(/%/g, '*0.01');

    try {
      // Safe Function calculation restricted to arithmetic
      // eslint-disable-next-line no-new-func
      const calcResult = Function(`"use strict"; return (${expr})`)();
      if (typeof calcResult === 'number') {
        if (!isFinite(calcResult)) return '#DIV/0!';
        return Math.round(calcResult * 100000) / 100000;
      }
      return calcResult;
    } catch {
      return '#ERRO!';
    }
  }

  // Format cell output for display
  static formatValue(value: string | number | undefined, format?: 'text' | 'number' | 'currency' | 'percent'): string {
    if (value === undefined || value === '') return '';
    if (typeof value === 'string' && value.startsWith('#')) return value; // Error codes

    const num = typeof value === 'number' ? value : Number(value);
    const isNum = !isNaN(num) && typeof value !== 'string';

    if (format === 'currency' && isNum) {
      return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (format === 'percent' && isNum) {
      return `${(num * 100).toFixed(2)}%`;
    }
    if (format === 'number' && isNum) {
      return num.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
    }

    return String(value);
  }

  // Parse CSV content into Grid
  static parseCsv(csvText: string): { grid: SheetGrid; maxCols: number; maxRows: number } {
    const grid: SheetGrid = {};
    const lines: string[][] = [];

    // Detect delimiter: semicolon or comma
    const firstLine = csvText.split('\n')[0] || '';
    const delimiter = firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';

    // Simple RFC 4180 parser
    let row: string[] = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          field += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        row.push(field.trim());
        field = '';
        if (row.length > 0 && row.some(cell => cell !== '')) {
          lines.push(row);
        }
        row = [];
      } else {
        field += char;
      }
    }
    if (field.length > 0 || row.length > 0) {
      row.push(field.trim());
      if (row.some(cell => cell !== '')) lines.push(row);
    }

    let maxCols = 5;
    const maxRows = Math.max(10, lines.length);

    lines.forEach((r, rIdx) => {
      if (r.length > maxCols) maxCols = r.length;
      r.forEach((val, cIdx) => {
        const colLabel = this.colIndexToLabel(cIdx);
        const cellId = `${colLabel}${rIdx + 1}`;
        grid[cellId] = { raw: val };
      });
    });

    return { grid, maxCols: Math.max(maxCols, 6), maxRows: Math.max(maxRows, 15) };
  }

  // Export Grid to CSV string
  static exportToCsv(grid: SheetGrid, cols: number, rows: number): string {
    const lines: string[] = [];

    for (let r = 0; r < rows; r++) {
      const rowVals: string[] = [];
      for (let c = 0; c < cols; c++) {
        const cellId = `${this.colIndexToLabel(c)}${r + 1}`;
        const cell = grid[cellId];
        let val = '';
        if (cell) {
          const evaluated = cell.value !== undefined ? cell.value : cell.raw;
          val = String(evaluated ?? '');
        }

        // Escape CSV field
        if (val.includes(',') || val.includes(';') || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        rowVals.push(val);
      }
      lines.push(rowVals.join(';'));
    }

    return lines.join('\r\n');
  }

  // Pre-built Demo Templates
  static getTemplates(): Record<string, { name: string; cols: number; rows: number; data: SheetGrid }> {
    return {
      financial: {
        name: 'Controle de Orçamento Mensal',
        cols: 5,
        rows: 10,
        data: {
          'A1': { raw: 'Categoria', bold: true },
          'B1': { raw: 'Previsto (R$)', bold: true, align: 'right' },
          'C1': { raw: 'Realizado (R$)', bold: true, align: 'right' },
          'D1': { raw: 'Diferença (R$)', bold: true, align: 'right' },

          'A2': { raw: 'Moradia / Aluguel' },
          'B2': { raw: '1800', format: 'currency', align: 'right' },
          'C2': { raw: '1800', format: 'currency', align: 'right' },
          'D2': { raw: '=B2-C2', format: 'currency', align: 'right' },

          'A3': { raw: 'Alimentação' },
          'B3': { raw: '1200', format: 'currency', align: 'right' },
          'C3': { raw: '1050', format: 'currency', align: 'right' },
          'D3': { raw: '=B3-C3', format: 'currency', align: 'right' },

          'A4': { raw: 'Transporte & Combustível' },
          'B4': { raw: '500', format: 'currency', align: 'right' },
          'C4': { raw: '420', format: 'currency', align: 'right' },
          'D4': { raw: '=B4-C4', format: 'currency', align: 'right' },

          'A5': { raw: 'Lazer & Cultura' },
          'B5': { raw: '400', format: 'currency', align: 'right' },
          'C5': { raw: '460', format: 'currency', align: 'right' },
          'D5': { raw: '=B5-C5', format: 'currency', align: 'right' },

          'A7': { raw: 'TOTAL GERAL', bold: true },
          'B7': { raw: '=SOMA(B2:B5)', bold: true, format: 'currency', align: 'right' },
          'C7': { raw: '=SOMA(C2:C5)', bold: true, format: 'currency', align: 'right' },
          'D7': { raw: '=SOMA(D2:D5)', bold: true, format: 'currency', align: 'right' }
        }
      },
      sales: {
        name: 'Vendas & Comissões',
        cols: 6,
        rows: 9,
        data: {
          'A1': { raw: 'Vendedor', bold: true },
          'B1': { raw: 'Qtd Vendas', bold: true, align: 'right' },
          'C1': { raw: 'Ticket Médio', bold: true, align: 'right' },
          'D1': { raw: 'Faturamento', bold: true, align: 'right' },
          'E1': { raw: 'Comissão (5%)', bold: true, align: 'right' },

          'A2': { raw: 'Carlos Silva' },
          'B2': { raw: '14', align: 'right' },
          'C2': { raw: '350', format: 'currency', align: 'right' },
          'D2': { raw: '=B2*C2', format: 'currency', align: 'right' },
          'E2': { raw: '=D2*0.05', format: 'currency', align: 'right' },

          'A3': { raw: 'Mariana Costa' },
          'B3': { raw: '22', align: 'right' },
          'C3': { raw: '420', format: 'currency', align: 'right' },
          'D3': { raw: '=B3*C3', format: 'currency', align: 'right' },
          'E3': { raw: '=D3*0.05', format: 'currency', align: 'right' },

          'A4': { raw: 'Roberto Alves' },
          'B4': { raw: '18', align: 'right' },
          'C4': { raw: '290', format: 'currency', align: 'right' },
          'D4': { raw: '=B4*C4', format: 'currency', align: 'right' },
          'E4': { raw: '=D4*0.05', format: 'currency', align: 'right' },

          'A6': { raw: 'MÉDIA VENDAS', bold: true },
          'B6': { raw: '=MEDIA(B2:B4)', bold: true, align: 'right' },
          'D6': { raw: '=SOMA(D2:D4)', bold: true, format: 'currency', align: 'right' },
          'E6': { raw: '=SOMA(E2:E4)', bold: true, format: 'currency', align: 'right' }
        }
      }
    };
  }
}
