import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
} from 'docx';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface DocxBlock {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'bullet' | 'table';
  text?: string;
  align?: 'left' | 'center' | 'right' | 'both';
  runs?: Array<{ text: string; bold?: boolean; italic?: boolean; sizePt?: number }>;
  rows?: string[][];
}

export class OfficeService {
  /**
   * Sanitizes characters for WinAnsi standard PDF fonts (Helvetica / TimesRoman).
   */
  private static sanitizeWinAnsi(str: string): string {
    if (!str) return '';
    return str
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
      .replace(/[\u2013\u2014]/g, '-')
      .replace(/\u2026/g, '...')
      .replace(/\u2022/g, '-')
      .replace(/\u00A0/g, ' ')
      // Remove characters outside Latin-1 / WinAnsi safe range
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
  }

  /**
   * Escapes XML special characters for OOXML generation.
   */
  private static escapeXml(str: string): string {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // ============================================================================
  // PASSO 1: PDF -> WORD (.DOCX EDITÁVEL)
  // ============================================================================

  /**
   * Converts a PDF ArrayBuffer into a native editable Microsoft Word (.docx) Blob
   * without OCR, using direct structural & geometric parsing.
   */
  static async pdfToDocx(
    arrayBuffer: ArrayBuffer,
    options?: {
      includePageBreaks?: boolean;
      fontFamily?: string;
      onProgress?: (current: number, total: number) => void;
    }
  ): Promise<{
    docxBlob: Blob;
    pageCount: number;
    wordCount: number;
    paragraphCount: number;
    previewHtml: string;
  }> {
    const safeBuffer = arrayBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeBuffer) });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const fontFamily = options?.fontFamily || 'Calibri';
    const includePageBreaks = options?.includePageBreaks ?? true;

    const docChildren: Paragraph[] = [];
    const previewParts: string[] = [];
    let totalWords = 0;
    let totalParagraphs = 0;

    for (let p = 1; p <= pageCount; p++) {
      if (options?.onProgress) options.onProgress(p, pageCount);

      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();

      interface RawItem {
        str: string;
        x: number;
        y: number;
        width: number;
        fontSize: number;
        bold: boolean;
        italic: boolean;
      }

      const items: RawItem[] = [];
      for (const raw of textContent.items as any[]) {
        if (!raw.str || raw.str.trim() === '') continue;
        const fontSize = Math.round(
          Math.hypot(raw.transform[0], raw.transform[1]) || raw.height || 11
        );
        const fontName = (raw.fontName || '').toLowerCase();
        items.push({
          str: raw.str,
          x: raw.transform[4],
          y: raw.transform[5],
          width: raw.width || raw.str.length * (fontSize * 0.5),
          fontSize,
          bold: fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy'),
          italic: fontName.includes('italic') || fontName.includes('oblique'),
        });
      }

      if (items.length === 0) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[Página ${p} sem camada de texto selecionável]`,
                italics: true,
                color: '888888',
                font: fontFamily,
                size: 20,
              }),
            ],
          })
        );
        previewParts.push(`<p style="color:#888;font-style:italic;">[Página ${p} sem camada de texto selecionável]</p>`);
        if (includePageBreaks && p < pageCount) {
          docChildren.push(new Paragraph({ children: [new PageBreak()] }));
        }
        continue;
      }

      // Sort top-to-bottom (Y descending), then left-to-right (X ascending)
      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) <= 4) return a.x - b.x;
        return b.y - a.y;
      });

      // Median font size on page
      const sortedSizes = [...items].map((i) => i.fontSize).sort((a, b) => a - b);
      const medianSize = sortedSizes[Math.floor(sortedSizes.length / 2)] || 11;

      // Group items into visual lines
      interface VisualLine {
        y: number;
        fontSize: number;
        items: RawItem[];
      }

      const lines: VisualLine[] = [];
      for (const item of items) {
        const lastLine = lines[lines.length - 1];
        if (lastLine && Math.abs(item.y - lastLine.y) <= 4) {
          lastLine.items.push(item);
          if (item.fontSize > lastLine.fontSize) lastLine.fontSize = item.fontSize;
        } else {
          lines.push({
            y: item.y,
            fontSize: item.fontSize,
            items: [item],
          });
        }
      }

      // Group visual lines into logical paragraphs
      previewParts.push(`<div style="border-bottom:1px dashed var(--border-color);padding-bottom:12px;margin-bottom:12px;"><div style="font-size:0.75rem;color:var(--text-tertiary);margin-bottom:6px;">Página ${p}</div>`);

      let prevLineY: number | null = null;
      let currentParaRuns: RawItem[] = [];
      let currentParaMaxFont = medianSize;

      const flushParagraph = () => {
        if (currentParaRuns.length === 0) return;

        const fullLineText = currentParaRuns
          .map((r) => r.str)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (!fullLineText) {
          currentParaRuns = [];
          return;
        }

        const words = fullLineText.split(/\s+/).filter(Boolean).length;
        totalWords += words;
        totalParagraphs++;

        const isH1 = currentParaMaxFont >= medianSize * 1.45 && fullLineText.length < 140;
        const isH2 = !isH1 && currentParaMaxFont >= medianSize * 1.2 && fullLineText.length < 160;
        const isBullet = /^[•\-*▪▸]\s*/.test(fullLineText);

        const cleanText = isBullet ? fullLineText.replace(/^[•\-*▪▸]\s*/, '') : fullLineText;

        const hasBold = currentParaRuns.some((r) => r.bold) || isH1 || isH2;
        const hasItalic = currentParaRuns.some((r) => r.italic);

        if (isH1) {
          docChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 240, after: 120 },
              children: [
                new TextRun({
                  text: cleanText,
                  bold: true,
                  font: fontFamily,
                  size: Math.max(28, Math.round(currentParaMaxFont * 2)),
                }),
              ],
            })
          );
          previewParts.push(`<h2 style="font-size:1.25rem;font-weight:700;margin:10px 0 6px;">${this.escapeXml(cleanText)}</h2>`);
        } else if (isH2) {
          docChildren.push(
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
              children: [
                new TextRun({
                  text: cleanText,
                  bold: true,
                  font: fontFamily,
                  size: Math.max(24, Math.round(currentParaMaxFont * 2)),
                }),
              ],
            })
          );
          previewParts.push(`<h3 style="font-size:1.05rem;font-weight:700;margin:8px 0 4px;">${this.escapeXml(cleanText)}</h3>`);
        } else if (isBullet) {
          docChildren.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { after: 80 },
              children: [
                new TextRun({
                  text: cleanText,
                  bold: hasBold,
                  italics: hasItalic,
                  font: fontFamily,
                  size: 22,
                }),
              ],
            })
          );
          previewParts.push(`<li style="margin-left:20px;margin-bottom:4px;">${this.escapeXml(cleanText)}</li>`);
        } else {
          docChildren.push(
            new Paragraph({
              alignment: AlignmentType.LEFT,
              spacing: { after: 140, line: 276 },
              children: [
                new TextRun({
                  text: cleanText,
                  bold: hasBold,
                  italics: hasItalic,
                  font: fontFamily,
                  size: 22, // 11pt in half-points
                }),
              ],
            })
          );
          previewParts.push(`<p style="margin:0 0 8px;line-height:1.5;">${this.escapeXml(cleanText)}</p>`);
        }

        currentParaRuns = [];
        currentParaMaxFont = medianSize;
      };

      for (const line of lines) {
        line.items.sort((a, b) => a.x - b.x);
        const lineStr = line.items.map((i) => i.str).join(' ').trim();
        const isHeadingLine = line.fontSize >= medianSize * 1.2;
        const isBulletLine = /^[•\-*▪▸]/.test(lineStr);

        const verticalGap = prevLineY !== null ? Math.abs(prevLineY - line.y) : 0;
        const shouldBreakParagraph =
          prevLineY === null ||
          isHeadingLine ||
          isBulletLine ||
          verticalGap > line.fontSize * 1.75 ||
          Math.abs(line.fontSize - currentParaMaxFont) >= 2;

        if (shouldBreakParagraph && currentParaRuns.length > 0) {
          flushParagraph();
        }

        currentParaRuns.push(...line.items);
        if (line.fontSize > currentParaMaxFont) {
          currentParaMaxFont = line.fontSize;
        }
        prevLineY = line.y;

        if (isHeadingLine || isBulletLine) {
          flushParagraph();
          prevLineY = null;
        }
      }

      flushParagraph();
      previewParts.push(`</div>`);

      if (includePageBreaks && p < pageCount) {
        docChildren.push(new Paragraph({ children: [new PageBreak()] }));
      }

      await new Promise((r) => setTimeout(r, 0));
    }

    const doc = new Document({
      creator: 'Arsenal Toolkit',
      title: 'Documento Convertido de PDF',
      sections: [
        {
          properties: {},
          children: docChildren,
        },
      ],
    });

    const docxBlob = await Packer.toBlob(doc);

    return {
      docxBlob,
      pageCount,
      wordCount: totalWords,
      paragraphCount: totalParagraphs,
      previewHtml: previewParts.join('\n'),
    };
  }

  // ============================================================================
  // PASSO 2: PDF -> EXCEL (.XLSX NATIVO MULTI-ABAS)
  // ============================================================================

  /**
   * Extracts tabular data from PDF pages into a native Microsoft Excel (.xlsx) Blob.
   */
  static async pdfToXlsx(
    arrayBuffer: ArrayBuffer,
    options?: { mode?: 'consolidated' | 'per-page' }
  ): Promise<{
    xlsxBlob: Blob;
    sheetCount: number;
    totalRows: number;
  }> {
    const safeBuffer = arrayBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeBuffer) });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const mode = options?.mode || 'consolidated';

    const wb = XLSX.utils.book_new();
    const consolidatedRows: (string | number)[][] = [];
    let totalRows = 0;

    for (let p = 1; p <= pageCount; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();

      interface CellItem {
        str: string;
        x: number;
        y: number;
        width: number;
      }

      const items: CellItem[] = [];
      for (const item of textContent.items as any[]) {
        if (!item.str || item.str.trim() === '') continue;
        items.push({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || item.str.length * 6,
        });
      }

      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) <= 4) return a.x - b.x;
        return b.y - a.y;
      });

      const rows: CellItem[][] = [];
      let currentRow: CellItem[] = [];
      let currentY: number | null = null;

      for (const it of items) {
        if (currentY === null || Math.abs(it.y - currentY) <= 4) {
          currentRow.push(it);
          currentY = it.y;
        } else {
          if (currentRow.length > 0) rows.push(currentRow);
          currentRow = [it];
          currentY = it.y;
        }
      }
      if (currentRow.length > 0) rows.push(currentRow);

      const pageGrid: (string | number)[][] = [];
      for (const rowItems of rows) {
        rowItems.sort((a, b) => a.x - b.x);
        const cells: (string | number)[] = [];
        let currentCell = '';
        let lastEnd = -1;

        for (const it of rowItems) {
          const gap = lastEnd === -1 ? 0 : it.x - lastEnd;
          if (lastEnd !== -1 && gap > 18) {
            cells.push(this.parseSmartCellValue(currentCell.trim()));
            currentCell = it.str;
          } else {
            currentCell = currentCell ? currentCell + ' ' + it.str : it.str;
          }
          lastEnd = it.x + it.width;
        }
        if (currentCell) {
          cells.push(this.parseSmartCellValue(currentCell.trim()));
        }

        if (cells.length > 0 && cells.some((c) => c !== '')) {
          pageGrid.push(cells);
          consolidatedRows.push(cells);
          totalRows++;
        }
      }

      if (mode === 'per-page') {
        const ws = XLSX.utils.aoa_to_sheet(pageGrid.length > 0 ? pageGrid : [['(Página vazia)']]);
        this.applyAutoColumnWidths(ws, pageGrid);
        XLSX.utils.book_append_sheet(wb, ws, `Página ${p}`);
      }
    }

    if (mode === 'consolidated' || wb.SheetNames.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet(
        consolidatedRows.length > 0 ? consolidatedRows : [['Nenhum dado tabular encontrado']]
      );
      this.applyAutoColumnWidths(ws, consolidatedRows);
      XLSX.utils.book_append_sheet(wb, ws, 'Dados Extraídos');
    }

    const xlsxArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const xlsxBlob = new Blob([xlsxArray], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    return {
      xlsxBlob,
      sheetCount: wb.SheetNames.length,
      totalRows,
    };
  }

  private static parseSmartCellValue(val: string): string | number {
    // Check if it's a clean number or BRL currency like "1.250,45" or "-45,90"
    const cleaned = val.replace(/^R\$\s?/, '').trim();
    if (/^-?\d{1,3}(\.\d{3})+,\d{2}$/.test(cleaned)) {
      const num = parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
      if (!isNaN(num)) return num;
    }
    if (/^-?\d+,\d{1,4}$/.test(cleaned)) {
      const num = parseFloat(cleaned.replace(',', '.'));
      if (!isNaN(num)) return num;
    }
    if (/^-?\d+(\.\d+)?$/.test(cleaned) && !/^0\d+/.test(cleaned)) {
      const num = parseFloat(cleaned);
      if (!isNaN(num)) return num;
    }
    return val;
  }

  private static applyAutoColumnWidths(ws: XLSX.WorkSheet, rows: (string | number)[][]) {
    const colWidths: number[] = [];
    for (const row of rows) {
      row.forEach((cell, idx) => {
        const len = String(cell ?? '').length;
        if (!colWidths[idx] || len > colWidths[idx]) {
          colWidths[idx] = len;
        }
      });
    }
    ws['!cols'] = colWidths.map((w) => ({ wch: Math.min(Math.max(w + 3, 10), 48) }));
  }

  // ============================================================================
  // PASSO 3: PDF -> POWERPOINT (.PPTX NATIVO)
  // ============================================================================

  /**
   * Converts a PDF into a native Microsoft PowerPoint (.pptx) presentation.
   * Supports 'visual' (high-res slide images) and 'editable' (native editable text boxes + layout).
   */
  static async pdfToPptx(
    arrayBuffer: ArrayBuffer,
    options?: {
      mode?: 'visual' | 'editable';
      onProgress?: (current: number, total: number) => void;
    }
  ): Promise<{
    pptxBlob: Blob;
    slideCount: number;
  }> {
    const safeBuffer = arrayBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeBuffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const mode = options?.mode || 'visual';

    const zip = new JSZip();

    // Standard Widescreen 16:9 in EMUs (12192000 x 6858000)
    const slideWidthEmu = 12192000;
    const slideHeightEmu = 6858000;

    // 1. [Content_Types].xml
    let slideOverrides = '';
    for (let i = 1; i <= numPages; i++) {
      slideOverrides += `<Override PartName="/ppt/slides/slide${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`;
    }

    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideOverrides}
</Types>`
    );

    // 2. _rels/.rels
    zip.file(
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
    );

    // 3. ppt/_rels/presentation.xml.rels
    let presRels = '';
    let slideIdList = '';
    for (let i = 1; i <= numPages; i++) {
      presRels += `<Relationship Id="rIdSlide${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`;
      slideIdList += `<p:sldId id="${255 + i}" r:id="rIdSlide${i}"/>`;
    }

    zip.file(
      'ppt/_rels/presentation.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rIdTheme1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
  ${presRels}
</Relationships>`
    );

    // 4. ppt/presentation.xml
    zip.file(
      'ppt/presentation.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rIdMaster1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${slideIdList}
  </p:sldIdLst>
  <p:sldSz cx="${slideWidthEmu}" cy="${slideHeightEmu}" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`
    );

    // 5. Minimal SlideMaster, SlideLayout & Theme
    zip.file(
      'ppt/slideMasters/slideMaster1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rIdLayout1"/></p:sldLayoutIdLst>
</p:sldMaster>`
    );

    zip.file(
      'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rIdTheme1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>`
    );

    zip.file(
      'ppt/slideLayouts/slideLayout1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld>
</p:sldLayout>`
    );

    zip.file(
      'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdMaster1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>`
    );

    zip.file(
      'ppt/theme/theme1.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Office Theme">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="1F497D"/></a:dk2>
      <a:lt2><a:srgbClr val="EEECE1"/></a:lt2>
      <a:accent1><a:srgbClr val="4F81BD"/></a:accent1>
      <a:accent2><a:srgbClr val="C0504D"/></a:accent2>
      <a:accent3><a:srgbClr val="9BBB59"/></a:accent3>
      <a:accent4><a:srgbClr val="8064A2"/></a:accent4>
      <a:accent5><a:srgbClr val="4BACC6"/></a:accent5>
      <a:accent6><a:srgbClr val="F79646"/></a:accent6>
      <a:hlink><a:srgbClr val="0000FF"/></a:hlink>
      <a:folHlink><a:srgbClr val="800080"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
      <a:lnStyleLst><a:ln w="9525"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="25400"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="38100"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
      <a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
      <a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>`
    );

    // 6. Generate each slide
    for (let p = 1; p <= numPages; p++) {
      if (options?.onProgress) options.onProgress(p, numPages);
      const page = await pdf.getPage(p);
      const vp1 = page.getViewport({ scale: 1.0 });

      if (mode === 'visual') {
        // Render 2x High-Definition Slide Image
        const vp2 = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = vp2.width;
        canvas.height = vp2.height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport: vp2 } as any).promise;

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64Data = dataUrl.split(',')[1];
        zip.file(`ppt/media/slide_img_${p}.jpg`, base64Data, { base64: true });

        // Fit image centered on 16:9 slide preserving aspect ratio
        const pageRatio = vp1.width / vp1.height;
        const slideRatio = slideWidthEmu / slideHeightEmu;
        let drawW = slideWidthEmu;
        let drawH = slideHeightEmu;
        let offsetX = 0;
        let offsetY = 0;

        if (pageRatio > slideRatio) {
          drawH = Math.round(slideWidthEmu / pageRatio);
          offsetY = Math.round((slideHeightEmu - drawH) / 2);
        } else {
          drawW = Math.round(slideHeightEmu * pageRatio);
          offsetX = Math.round((slideWidthEmu - drawW) / 2);
        }

        zip.file(
          `ppt/slides/_rels/slide${p}.xml.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rIdImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/slide_img_${p}.jpg"/>
</Relationships>`
        );

        zip.file(
          `ppt/slides/slide${p}.xml`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:pic>
        <p:nvPicPr>
          <p:cNvPr id="2" name="SlideImage${p}"/>
          <p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr>
          <p:nvPr/>
        </p:nvPicPr>
        <p:blipFill>
          <a:blip r:embed="rIdImg1"/>
          <a:stretch><a:fillRect/></a:stretch>
        </p:blipFill>
        <p:spPr>
          <a:xfrm>
            <a:off x="${offsetX}" y="${offsetY}"/>
            <a:ext cx="${drawW}" cy="${drawH}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
        </p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>`
        );
      } else {
        // Editable Text Boxes Mode
        const textContent = await page.getTextContent();
        interface LineBox {
          x: number;
          y: number;
          w: number;
          h: number;
          text: string;
          fontSize: number;
          bold: boolean;
        }

        const rawItems: LineBox[] = [];
        for (const it of textContent.items as any[]) {
          if (!it.str || !it.str.trim()) continue;
          const fs = Math.round(Math.hypot(it.transform[0], it.transform[1]) || it.height || 12);
          const fn = (it.fontName || '').toLowerCase();
          rawItems.push({
            x: it.transform[4],
            y: it.transform[5],
            w: it.width || it.str.length * fs * 0.55,
            h: fs * 1.3,
            text: it.str,
            fontSize: fs,
            bold: fn.includes('bold') || fn.includes('black'),
          });
        }

        // Merge items on the same horizontal line
        rawItems.sort((a, b) => {
          if (Math.abs(a.y - b.y) <= 4) return a.x - b.x;
          return b.y - a.y;
        });

        const mergedLines: LineBox[] = [];
        for (const item of rawItems) {
          const prev = mergedLines[mergedLines.length - 1];
          if (prev && Math.abs(prev.y - item.y) <= 4 && item.x - (prev.x + prev.w) < 25) {
            prev.text += ' ' + item.text;
            prev.w = Math.max(prev.w, item.x + item.w - prev.x);
            prev.fontSize = Math.max(prev.fontSize, item.fontSize);
            prev.bold = prev.bold || item.bold;
          } else {
            mergedLines.push({ ...item });
          }
        }

        let shapesXml = '';
        let shapeId = 2;

        for (const box of mergedLines) {
          // Convert PDF coordinates (bottom-left origin) to Slide EMUs (top-left origin)
          const relX = Math.max(0, Math.min(1, box.x / vp1.width));
          const relY = Math.max(0, Math.min(1, (vp1.height - box.y - box.fontSize) / vp1.height));
          const relW = Math.max(0.1, Math.min(1 - relX, (box.w + 20) / vp1.width));
          const relH = Math.max(0.04, Math.min(1 - relY, (box.h + 8) / vp1.height));

          const emuX = Math.round(relX * slideWidthEmu);
          const emuY = Math.round(relY * slideHeightEmu);
          const emuW = Math.round(relW * slideWidthEmu);
          const emuH = Math.round(relH * slideHeightEmu);
          const ptSizeHundredths = Math.min(4400, Math.max(900, Math.round(box.fontSize * 100)));

          shapesXml += `
      <p:sp>
        <p:nvSpPr>
          <p:cNvPr id="${shapeId++}" name="TextBox${shapeId}"/>
          <p:cNvSpPr txBox="1"/>
          <p:nvPr/>
        </p:nvSpPr>
        <p:spPr>
          <a:xfrm>
            <a:off x="${emuX}" y="${emuY}"/>
            <a:ext cx="${emuW}" cy="${emuH}"/>
          </a:xfrm>
          <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
          <a:noFill/>
        </p:spPr>
        <p:txBody>
          <a:bodyPr wrap="square" rtlCol="0"/>
          <a:lstStyle/>
          <a:p>
            <a:r>
              <a:rPr lang="pt-BR" sz="${ptSizeHundredths}" b="${box.bold ? '1' : '0'}" dirty="0"/>
              <a:t>${this.escapeXml(box.text)}</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>`;
        }

        zip.file(
          `ppt/slides/_rels/slide${p}.xml.rels`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdLayout1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
</Relationships>`
        );

        zip.file(
          `ppt/slides/slide${p}.xml`,
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      ${shapesXml}
    </p:spTree>
  </p:cSld>
</p:sld>`
        );
      }

      await new Promise((r) => setTimeout(r, 0));
    }

    const pptxBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    return {
      pptxBlob,
      slideCount: numPages,
    };
  }

  // ============================================================================
  // PASSO 4: EXCEL (.XLSX / .XLS / .CSV) -> PDF EXECUTIVO
  // ============================================================================

  /**
   * Parses an Excel/CSV file and returns sheet names and 2D rows per sheet.
   */
  static parseExcelWorkbook(arrayBuffer: ArrayBuffer): {
    sheetNames: string[];
    sheets: Record<string, string[][]>;
  } {
    const safeBuffer = arrayBuffer.slice(0);
    const wb = XLSX.read(new Uint8Array(safeBuffer), { type: 'array' });
    const sheets: Record<string, string[][]> = {};

    for (const name of wb.SheetNames) {
      const ws = wb.Sheets[name];
      const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
      // Filter out completely empty trailing rows
      const cleaned = rawRows
        .map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? '').trim()) : []))
        .filter((r) => r.some((cell) => cell !== ''));
      sheets[name] = cleaned;
    }

    return {
      sheetNames: wb.SheetNames,
      sheets,
    };
  }

  /**
   * Generates a formatted vector PDF from Excel sheet data.
   */
  static async excelToPdf(
    arrayBuffer: ArrayBuffer,
    options?: {
      sheetName?: string; // If omitted or '__ALL__', exports all non-empty sheets
      orientation?: 'landscape' | 'portrait';
      theme?: 'executive' | 'grid' | 'minimal';
      title?: string;
    }
  ): Promise<{ pdfBytes: Uint8Array; pageCount: number; rowCount: number }> {
    const { sheetNames, sheets } = this.parseExcelWorkbook(arrayBuffer);
    const targetSheets =
      options?.sheetName && options.sheetName !== '__ALL__'
        ? [options.sheetName]
        : sheetNames;

    const pdfDoc = await PDFDocument.create();
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const isLandscape = (options?.orientation || 'landscape') === 'landscape';
    const pageWidth = isLandscape ? 841.89 : 595.28;
    const pageHeight = isLandscape ? 595.28 : 841.89;
    const margin = 36;
    const usableWidth = pageWidth - margin * 2;
    const theme = options?.theme || 'executive';

    let totalRowsRendered = 0;

    for (const sName of targetSheets) {
      const rows = sheets[sName] || [];
      if (rows.length === 0) continue;

      // Determine max columns
      let colCount = 0;
      for (const r of rows) {
        if (r.length > colCount) colCount = r.length;
      }
      if (colCount === 0) continue;

      // Calculate proportional column widths based on character length
      const colWeights = new Array(colCount).fill(8);
      for (let rIdx = 0; rIdx < Math.min(rows.length, 100); rIdx++) {
        const r = rows[rIdx];
        for (let cIdx = 0; cIdx < colCount; cIdx++) {
          const len = Math.min(40, (r[cIdx] || '').length + 2);
          if (len > colWeights[cIdx]) colWeights[cIdx] = len;
        }
      }
      const totalWeight = colWeights.reduce((acc, w) => acc + w, 0) || 1;
      const colWidths = colWeights.map((w) => (w / totalWeight) * usableWidth);

      const fontSize = colCount > 8 ? 8 : colCount > 5 ? 9 : 10;
      const rowHeight = fontSize + 11;

      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      let cursorY = pageHeight - margin;

      // Sheet Header Title
      const docTitle = this.sanitizeWinAnsi(options?.title ? `${options.title} - ${sName}` : sName);
      page.drawText(docTitle, {
        x: margin,
        y: cursorY - 14,
        size: 13,
        font: fontBold,
        color: rgb(0.12, 0.16, 0.23),
      });
      cursorY -= 28;

      const drawHeaderRow = (targetPage: any, yPos: number) => {
        const headerRow = rows[0];
        if (theme === 'executive') {
          targetPage.drawRectangle({
            x: margin,
            y: yPos - rowHeight,
            width: usableWidth,
            height: rowHeight,
            color: rgb(0.15, 0.22, 0.34),
          });
        } else {
          targetPage.drawRectangle({
            x: margin,
            y: yPos - rowHeight,
            width: usableWidth,
            height: rowHeight,
            color: rgb(0.93, 0.94, 0.96),
          });
        }

        let curX = margin;
        for (let c = 0; c < colCount; c++) {
          const cellText = this.truncateTextToWidth(
            this.sanitizeWinAnsi(headerRow[c] || ''),
            colWidths[c] - 8,
            fontBold,
            fontSize
          );
          targetPage.drawText(cellText, {
            x: curX + 4,
            y: yPos - rowHeight + 6,
            size: fontSize,
            font: fontBold,
            color: theme === 'executive' ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1),
          });
          curX += colWidths[c];
        }
      };

      // Draw initial header
      drawHeaderRow(page, cursorY);
      cursorY -= rowHeight;
      totalRowsRendered++;

      // Draw body rows
      for (let rIdx = 1; rIdx < rows.length; rIdx++) {
        if (cursorY - rowHeight < margin + 20) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          cursorY = pageHeight - margin;
          drawHeaderRow(page, cursorY);
          cursorY -= rowHeight;
        }

        const row = rows[rIdx];
        const isEven = rIdx % 2 === 0;

        if (theme === 'executive' && isEven) {
          page.drawRectangle({
            x: margin,
            y: cursorY - rowHeight,
            width: usableWidth,
            height: rowHeight,
            color: rgb(0.96, 0.97, 0.99),
          });
        }

        if (theme === 'grid') {
          page.drawRectangle({
            x: margin,
            y: cursorY - rowHeight,
            width: usableWidth,
            height: rowHeight,
            borderColor: rgb(0.82, 0.85, 0.89),
            borderWidth: 0.5,
          });
        } else {
          page.drawLine({
            start: { x: margin, y: cursorY - rowHeight },
            end: { x: margin + usableWidth, y: cursorY - rowHeight },
            thickness: 0.4,
            color: rgb(0.88, 0.9, 0.93),
          });
        }

        let curX = margin;
        for (let c = 0; c < colCount; c++) {
          const rawVal = this.sanitizeWinAnsi(row[c] || '');
          const clipped = this.truncateTextToWidth(rawVal, colWidths[c] - 8, fontRegular, fontSize);
          page.drawText(clipped, {
            x: curX + 4,
            y: cursorY - rowHeight + 6,
            size: fontSize,
            font: fontRegular,
            color: rgb(0.18, 0.2, 0.24),
          });

          if (theme === 'grid' && c > 0) {
            page.drawLine({
              start: { x: curX, y: cursorY },
              end: { x: curX, y: cursorY - rowHeight },
              thickness: 0.4,
              color: rgb(0.82, 0.85, 0.89),
            });
          }
          curX += colWidths[c];
        }

        cursorY -= rowHeight;
        totalRowsRendered++;
      }
    }

    // Add page numbers to all pages
    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    pages.forEach((p, idx) => {
      const { width } = p.getSize();
      const footerText = `Pagina ${idx + 1} de ${totalPages}`;
      p.drawText(footerText, {
        x: width - margin - 75,
        y: 18,
        size: 8,
        font: fontRegular,
        color: rgb(0.5, 0.53, 0.58),
      });
    });

    const pdfBytes = await pdfDoc.save();
    return {
      pdfBytes,
      pageCount: totalPages,
      rowCount: totalRowsRendered,
    };
  }

  private static truncateTextToWidth(
    text: string,
    maxWidth: number,
    font: any,
    fontSize: number
  ): string {
    if (!text) return '';
    if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
    let truncated = text;
    while (truncated.length > 1 && font.widthOfTextAtSize(truncated + '...', fontSize) > maxWidth) {
      truncated = truncated.slice(0, -1);
    }
    return truncated + '...';
  }

  // ============================================================================
  // PASSO 5: WORD (.DOCX) -> PDF
  // ============================================================================

  /**
   * Parses a Microsoft Word (.docx) ArrayBuffer directly via JSZip + DOMParser
   * and converts it to a clean multi-page vector PDF and rich HTML preview.
   */
  static async wordToPdf(
    arrayBuffer: ArrayBuffer,
    options?: {
      fontSize?: number;
      fontStyle?: 'sans' | 'serif';
      includePageNumbers?: boolean;
    }
  ): Promise<{
    pdfBytes: Uint8Array;
    pageCount: number;
    wordCount: number;
    paragraphCount: number;
    previewHtml: string;
  }> {
    const safeBuffer = arrayBuffer.slice(0);
    const zip = await JSZip.loadAsync(safeBuffer);
    const docXmlFile = zip.file('word/document.xml');

    if (!docXmlFile) {
      throw new Error('Arquivo .docx inválido ou estrutura XML não encontrada.');
    }

    const xmlText = await docXmlFile.async('text');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');

    const blocks: DocxBlock[] = [];
    const previewHtmlParts: string[] = [];
    let wordCount = 0;

    const body = xmlDoc.getElementsByTagName('w:body')[0] || xmlDoc.documentElement;
    const children = Array.from(body.childNodes);

    for (const node of children) {
      const nodeName = node.nodeName;

      if (nodeName === 'w:p') {
        const pEl = node as Element;
        const pStyleEl = pEl.getElementsByTagName('w:pStyle')[0];
        const styleVal = (pStyleEl?.getAttribute('w:val') || '').toLowerCase();

        const numPrEl = pEl.getElementsByTagName('w:numPr')[0];
        const jcEl = pEl.getElementsByTagName('w:jc')[0];
        const jcVal = (jcEl?.getAttribute('w:val') || 'left') as 'left' | 'center' | 'right' | 'both';

        const runs: Array<{ text: string; bold?: boolean; italic?: boolean; sizePt?: number }> = [];
        const rElements = Array.from(pEl.getElementsByTagName('w:r'));

        for (const rEl of rElements) {
          const rPr = rEl.getElementsByTagName('w:rPr')[0];
          const isBold = !!(rPr && rPr.getElementsByTagName('w:b').length > 0);
          const isItalic = !!(rPr && rPr.getElementsByTagName('w:i').length > 0);
          const szEl = rPr ? rPr.getElementsByTagName('w:sz')[0] : null;
          const szVal = szEl?.getAttribute('w:val');
          const sizePt = szVal ? Math.round(parseInt(szVal, 10) / 2) : undefined;

          const tNodes = Array.from(rEl.getElementsByTagName('w:t'));
          const tabNodes = Array.from(rEl.getElementsByTagName('w:tab'));
          let runText = tNodes.map((t) => t.textContent || '').join('');
          if (tabNodes.length > 0) runText += '    ';

          if (runText) {
            runs.push({ text: runText, bold: isBold, italic: isItalic, sizePt });
          }
        }

        const fullParagraphText = runs.map((r) => r.text).join('').trim();
        if (!fullParagraphText) continue;

        wordCount += fullParagraphText.split(/\s+/).filter(Boolean).length;

        const maxRunSize = runs.reduce((max, r) => (r.sizePt && r.sizePt > max ? r.sizePt : max), 0);

        let blockType: DocxBlock['type'] = 'paragraph';
        if (styleVal.includes('heading1') || styleVal.includes('titulo1') || styleVal === 'title' || maxRunSize >= 18) {
          blockType = 'heading1';
        } else if (styleVal.includes('heading2') || styleVal.includes('titulo2') || maxRunSize >= 15) {
          blockType = 'heading2';
        } else if (styleVal.includes('heading3') || styleVal.includes('titulo3') || maxRunSize >= 13) {
          blockType = 'heading3';
        } else if (numPrEl || styleVal.includes('list')) {
          blockType = 'bullet';
        }

        blocks.push({
          type: blockType,
          text: fullParagraphText,
          align: jcVal,
          runs,
        });

        // Build HTML preview
        const innerHtml = runs
          .map((r) => {
            let h = this.escapeXml(r.text);
            if (r.bold) h = `<strong>${h}</strong>`;
            if (r.italic) h = `<em>${h}</em>`;
            return h;
          })
          .join('');

        if (blockType === 'heading1') {
          previewHtmlParts.push(`<h2 style="font-size:1.35rem;font-weight:700;margin:14px 0 6px;">${innerHtml}</h2>`);
        } else if (blockType === 'heading2') {
          previewHtmlParts.push(`<h3 style="font-size:1.15rem;font-weight:700;margin:12px 0 5px;">${innerHtml}</h3>`);
        } else if (blockType === 'heading3') {
          previewHtmlParts.push(`<h4 style="font-size:1.02rem;font-weight:700;margin:10px 0 4px;">${innerHtml}</h4>`);
        } else if (blockType === 'bullet') {
          previewHtmlParts.push(`<li style="margin-left:20px;margin-bottom:4px;">${innerHtml}</li>`);
        } else {
          previewHtmlParts.push(`<p style="margin:0 0 8px;line-height:1.6;">${innerHtml}</p>`);
        }
      } else if (nodeName === 'w:tbl') {
        const tblEl = node as Element;
        const trElements = Array.from(tblEl.getElementsByTagName('w:tr'));
        const tableRows: string[][] = [];

        for (const trEl of trElements) {
          const tcElements = Array.from(trEl.getElementsByTagName('w:tc'));
          const rowCells: string[] = [];
          for (const tcEl of tcElements) {
            const tNodes = Array.from(tcEl.getElementsByTagName('w:t'));
            const cellStr = tNodes.map((t) => t.textContent || '').join(' ').trim();
            rowCells.push(cellStr);
            if (cellStr) {
              wordCount += cellStr.split(/\s+/).filter(Boolean).length;
            }
          }
          if (rowCells.some((c) => c !== '')) {
            tableRows.push(rowCells);
          }
        }

        if (tableRows.length > 0) {
          blocks.push({ type: 'table', rows: tableRows });
          let tblHtml = `<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:0.85rem;">`;
          tableRows.forEach((r, idx) => {
            tblHtml += `<tr>` + r.map((c) => `<td style="border:1px solid var(--border-color);padding:6px 8px;${idx === 0 ? 'font-weight:700;background:var(--bg-page);' : ''}">${this.escapeXml(c)}</td>`).join('') + `</tr>`;
          });
          tblHtml += `</table>`;
          previewHtmlParts.push(tblHtml);
        }
      }
    }

    // Generate Vector PDF via pdf-lib
    const pdfDoc = await PDFDocument.create();
    const isSerif = options?.fontStyle === 'serif';
    const fontRegular = await pdfDoc.embedFont(
      isSerif ? StandardFonts.TimesRoman : StandardFonts.Helvetica
    );
    const fontBold = await pdfDoc.embedFont(
      isSerif ? StandardFonts.TimesRomanBold : StandardFonts.HelveticaBold
    );
    const fontItalic = await pdfDoc.embedFont(
      isSerif ? StandardFonts.TimesRomanItalic : StandardFonts.HelveticaOblique
    );

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 52;
    const usableWidth = pageWidth - margin * 2;
    const baseSize = options?.fontSize || 11;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let cursorY = pageHeight - margin;

    const ensureSpace = (needed: number) => {
      if (cursorY - needed < margin + 25) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        cursorY = pageHeight - margin;
      }
    };

    for (const block of blocks) {
      if (block.type === 'table' && block.rows && block.rows.length > 0) {
        const colCount = Math.max(...block.rows.map((r) => r.length));
        if (colCount === 0) continue;
        const colWidth = usableWidth / colCount;
        const rowH = baseSize + 10;

        cursorY -= 6;
        for (let rIdx = 0; rIdx < block.rows.length; rIdx++) {
          ensureSpace(rowH + 4);
          const row = block.rows[rIdx];
          if (rIdx === 0) {
            page.drawRectangle({
              x: margin,
              y: cursorY - rowH,
              width: usableWidth,
              height: rowH,
              color: rgb(0.93, 0.94, 0.96),
            });
          }
          page.drawRectangle({
            x: margin,
            y: cursorY - rowH,
            width: usableWidth,
            height: rowH,
            borderColor: rgb(0.78, 0.8, 0.84),
            borderWidth: 0.6,
          });

          for (let cIdx = 0; cIdx < colCount; cIdx++) {
            const rawCell = this.sanitizeWinAnsi(row[cIdx] || '');
            const fnt = rIdx === 0 ? fontBold : fontRegular;
            const clipped = this.truncateTextToWidth(rawCell, colWidth - 10, fnt, baseSize - 1);
            page.drawText(clipped, {
              x: margin + cIdx * colWidth + 5,
              y: cursorY - rowH + 6,
              size: baseSize - 1,
              font: fnt,
              color: rgb(0.12, 0.14, 0.18),
            });
          }
          cursorY -= rowH;
        }
        cursorY -= 10;
        continue;
      }

      const rawText = this.sanitizeWinAnsi(block.text || '');
      if (!rawText) continue;

      let fontSize = baseSize;
      let fontToUse = fontRegular;
      let spaceBefore = 0;
      let spaceAfter = 8;
      let indentX = 0;

      if (block.type === 'heading1') {
        fontSize = baseSize + 6;
        fontToUse = fontBold;
        spaceBefore = 12;
        spaceAfter = 8;
      } else if (block.type === 'heading2') {
        fontSize = baseSize + 3;
        fontToUse = fontBold;
        spaceBefore = 10;
        spaceAfter = 6;
      } else if (block.type === 'heading3') {
        fontSize = baseSize + 1;
        fontToUse = fontBold;
        spaceBefore = 8;
        spaceAfter = 5;
      } else if (block.type === 'bullet') {
        indentX = 14;
        spaceAfter = 5;
      } else {
        const allBold = block.runs?.every((r) => r.bold);
        const allItalic = block.runs?.every((r) => r.italic);
        if (allBold) fontToUse = fontBold;
        else if (allItalic) fontToUse = fontItalic;
      }

      cursorY -= spaceBefore;
      const lineHeight = fontSize * 1.42;
      const maxLineW = usableWidth - indentX;

      const wrappedLines = this.wrapText(
        block.type === 'bullet' ? `- ${rawText}` : rawText,
        maxLineW,
        fontToUse,
        fontSize
      );

      for (const line of wrappedLines) {
        ensureSpace(lineHeight);
        let drawX = margin + indentX;
        if (block.align === 'center') {
          const lw = fontToUse.widthOfTextAtSize(line, fontSize);
          drawX = margin + Math.max(0, (usableWidth - lw) / 2);
        } else if (block.align === 'right') {
          const lw = fontToUse.widthOfTextAtSize(line, fontSize);
          drawX = margin + Math.max(0, usableWidth - lw);
        }

        page.drawText(line, {
          x: drawX,
          y: cursorY - fontSize,
          size: fontSize,
          font: fontToUse,
          color: rgb(0.1, 0.12, 0.15),
        });
        cursorY -= lineHeight;
      }

      cursorY -= spaceAfter;
    }

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;

    if (options?.includePageNumbers !== false) {
      pages.forEach((p, idx) => {
        const { width } = p.getSize();
        p.drawText(`${idx + 1} / ${totalPages}`, {
          x: width / 2 - 14,
          y: 24,
          size: 9,
          font: fontRegular,
          color: rgb(0.5, 0.53, 0.58),
        });
      });
    }

    const pdfBytes = await pdfDoc.save();

    return {
      pdfBytes,
      pageCount: totalPages,
      wordCount,
      paragraphCount: blocks.length,
      previewHtml:
        previewHtmlParts.length > 0
          ? previewHtmlParts.join('\n')
          : '<p style="color:#888;">Nenhum texto encontrado no documento.</p>',
    };
  }

  private static wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(testLine, fontSize) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  }
}
