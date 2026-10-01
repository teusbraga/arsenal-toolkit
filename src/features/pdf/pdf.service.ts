import * as pdfjsLib from 'pdfjs-dist';
// Vite syntax for loading worker as a URL
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface PdfFileRecord {
  id: string;
  file: File;
  title: string;
  numPages: number;
  thumbnailUrl?: string;
  originalBuffer: ArrayBuffer;
}

export class PdfService {
  /**
   * Reads a File as an ArrayBuffer.
   */
  static async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Loads a PDF file, gets its page count, and renders the first page to a thumbnail data URL.
   */
  static async loadPdfRecord(file: File): Promise<PdfFileRecord> {
    const buffer = await this.readFileAsArrayBuffer(file);
    
    // Load with PDF.js to get info and render thumbnail
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    
    const numPages = pdf.numPages;
    let thumbnailUrl: string | undefined;

    if (numPages > 0) {
      // Get first page
      const page = await pdf.getPage(1);
      
      // Calculate scale for thumbnail (approx 200px wide max)
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = 200 / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      if (context) {
        const renderContext: any = {
          canvasContext: context,
          viewport: scaledViewport,
        };
        await page.render(renderContext).promise;
        thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
      }
    }

    return {
      id: crypto.randomUUID(),
      file,
      title: file.name,
      numPages,
      thumbnailUrl,
      originalBuffer: buffer
    };
  }

  /**
   * Merges multiple PDF files into a single PDF buffer.
   */
  static async mergePdfs(pdfRecords: PdfFileRecord[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const record of pdfRecords) {
      const pdfToMerge = await PDFDocument.load(record.originalBuffer);
      const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
      
      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    return await mergedPdf.save();
  }

  /**
   * Loads all pages of a PDF and renders thumbnails for each.
   */
  static async loadAllPagesThumbnails(file: File, onProgress?: (rendered: number, total: number) => void): Promise<{ buffer: ArrayBuffer, thumbnails: { pageNumber: number, url: string }[], numPages: number }> {
    const buffer = await this.readFileAsArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const thumbnails: { pageNumber: number, url: string }[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.0 });
      const scale = 200 / viewport.width;
      const scaledViewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = scaledViewport.width;
      canvas.height = scaledViewport.height;

      if (context) {
        const renderContext: any = { canvasContext: context, viewport: scaledViewport };
        await page.render(renderContext).promise;
        thumbnails.push({ pageNumber: i, url: canvas.toDataURL('image/jpeg', 0.8) });
      }
      
      if (onProgress) onProgress(i, numPages);
      
      // Yield to event loop so UI doesn't freeze on huge PDFs
      await new Promise(r => setTimeout(r, 0));
    }

    return { buffer, thumbnails, numPages };
  }

  /**
   * Extracts specific pages from a PDF buffer and creates a new PDF.
   * pageIndicesToKeep are 0-indexed.
   */
  static async extractPages(buffer: ArrayBuffer, pageIndicesToKeep: number[]): Promise<Uint8Array> {
    const originalPdf = await PDFDocument.load(buffer);
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(originalPdf, pageIndicesToKeep);
    
    for (const page of copiedPages) {
      newPdf.addPage(page);
    }
    
    return await newPdf.save();
  }

  /**
   * Extracts each specified page into its own single-page PDF and bundles them into a ZIP file.
   * pageIndicesToKeep are 0-indexed.
   */
  static async splitPagesToZip(buffer: ArrayBuffer, pageIndicesToKeep: number[], baseFilename: string): Promise<Blob> {
    const originalPdf = await PDFDocument.load(buffer);
    const zip = new JSZip();

    for (const index of pageIndicesToKeep) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(originalPdf, [index]);
      newPdf.addPage(copiedPage);
      const pdfBytes = await newPdf.save();
      // Padrão de nome: arquivo_pagina_1.pdf, etc (index é 0-based)
      zip.file(`${baseFilename}_pagina_${index + 1}.pdf`, pdfBytes);
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Creates a new PDF with reordered, rotated, or removed pages.
   * operations specifies the original 0-indexed page index and the relative rotation to add.
   */
  static async organizePdf(buffer: ArrayBuffer, operations: { originalIndex: number, rotationDelta: number }[]): Promise<Uint8Array> {
    const originalPdf = await PDFDocument.load(buffer);
    const newPdf = await PDFDocument.create();
    
    // Copy all requested pages in the new order
    const indicesToCopy = operations.map(op => op.originalIndex);
    const copiedPages = await newPdf.copyPages(originalPdf, indicesToCopy);
    
    // Apply rotation and add to document
    for (let i = 0; i < copiedPages.length; i++) {
      const page = copiedPages[i];
      const op = operations[i];
      
      if (op.rotationDelta !== 0) {
        const currentRotation = page.getRotation().angle;
        // pdf-lib rotation is clockwise
        page.setRotation(degrees(currentRotation + op.rotationDelta));
      }
      
      newPdf.addPage(page);
    }
    
    return await newPdf.save();
  }

  /**
   * Converts all pages of a PDF to high-quality images and returns them as a ZIP.
   */
  static async pdfToImagesZip(file: File, format: 'image/jpeg' | 'image/png' = 'image/jpeg', onProgress?: (rendered: number, total: number) => void): Promise<Blob> {
    const buffer = await this.readFileAsArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const zip = new JSZip();
    const baseFilename = file.name.replace(/\.[^/.]+$/, "");
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      // High scale for good quality output
      const viewport = page.getViewport({ scale: 2.5 }); 
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        // white background for JPEGs
        if (format === 'image/jpeg') {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        const renderContext: any = { canvasContext: context, viewport: viewport };
        await page.render(renderContext).promise;
        
        const dataUrl = canvas.toDataURL(format, 0.9);
        // Remove the data:image/jpeg;base64, prefix
        const base64Data = dataUrl.split(',')[1];
        zip.file(`${baseFilename}_pagina_${i}.${ext}`, base64Data, { base64: true });
      }
      
      if (onProgress) onProgress(i, numPages);
      await new Promise(r => setTimeout(r, 0));
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Converts multiple Image files into a single PDF document.
   */
  static async imagesToPdf(imageFiles: File[]): Promise<Uint8Array> {
    const pdf = await PDFDocument.create();

    for (const file of imageFiles) {
      const buffer = await this.readFileAsArrayBuffer(file);
      const uint8Array = new Uint8Array(buffer);
      
      let image;
      if (file.type === 'image/png') {
        image = await pdf.embedPng(uint8Array);
      } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
        image = await pdf.embedJpg(uint8Array);
      } else {
        continue; // Unsupported format in this basic implementation
      }

      const { width, height } = image.scale(1);
      
      // Create a page matching the image dimensions
      const page = pdf.addPage([width, height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: width,
        height: height,
      });
    }

    return await pdf.save();
  }

  /**
   * Applies metadata, pagination, and/or watermarks to a PDF document.
   */
  static async editPdf(buffer: ArrayBuffer, options: PdfEditOptions): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(buffer);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    
    // 1. Metadata
    if (options.metadata) {
      if (options.metadata.title) pdf.setTitle(options.metadata.title);
      if (options.metadata.author) pdf.setAuthor(options.metadata.author);
      if (options.metadata.subject) pdf.setSubject(options.metadata.subject);
      if (options.metadata.keywords) {
        // split by comma and trim
        const kws = options.metadata.keywords.split(',').map(k => k.trim()).filter(k => k);
        pdf.setKeywords(kws);
      }
    }

    // 2. Pagination & Watermark (requires iterating over pages)
    const pages = pdf.getPages();
    const totalPages = pages.length;

    for (let i = 0; i < totalPages; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Watermark
      if (options.watermark?.enabled && options.watermark.text) {
        const text = options.watermark.text;
        const textSize = 50;
        const textWidth = fontBold.widthOfTextAtSize(text, textSize);
        
        page.drawText(text, {
          x: (width / 2) - (textWidth / 2) + 20, // rough centering logic with rotation
          y: (height / 2) - 20,
          size: textSize,
          font: fontBold,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.3,
          rotate: degrees(45),
        });
      }

      // Pagination
      if (options.pagination?.enabled) {
        const pageNum = i + 1;
        const text = options.pagination.format === 'pageOfTotal' 
          ? `${pageNum} / ${totalPages}`
          : `${pageNum}`;
        
        const textSize = 12;
        const textWidth = font.widthOfTextAtSize(text, textSize);
        
        page.drawText(text, {
          x: (width / 2) - (textWidth / 2),
          y: 20, // 20 units from bottom
          size: textSize,
          font: font,
          color: rgb(0, 0, 0),
        });
      }
    }

    return await pdf.save();
  }

  /**
   * Compresses a PDF by rasterizing each page via HTML Canvas and rebuilding the document with compressed JPEGs.
   * Note: This flattens the PDF (text becomes unselectable).
   */
  static async compressPdfViaCanvas(
    file: File, 
    quality: number = 0.7, 
    resolutionScale: number = 1.5, 
    onProgress?: (rendered: number, total: number) => void
  ): Promise<Uint8Array> {
    const buffer = await this.readFileAsArrayBuffer(file);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
    const originalPdf = await loadingTask.promise;
    const numPages = originalPdf.numPages;
    
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
      const page = await originalPdf.getPage(i);
      const viewport = page.getViewport({ scale: resolutionScale }); 
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (context) {
        // Draw white background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        const renderContext: any = { canvasContext: context, viewport: viewport };
        await page.render(renderContext).promise;
        
        // Export to JPEG with specified quality
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const base64Data = dataUrl.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const jpgImage = await newPdf.embedJpg(imageBytes);
        
        // Use original viewport dimensions for the page so it matches original size
        const originalViewport = page.getViewport({ scale: 1.0 });
        const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
        
        newPage.drawImage(jpgImage, {
          x: 0,
          y: 0,
          width: originalViewport.width,
          height: originalViewport.height,
        });
      }
      
      if (onProgress) onProgress(i, numPages);
      await new Promise(r => setTimeout(r, 0));
    }

    return await newPdf.save();
  }

  /**
   * Applies visual edits (whiteouts, text) to specific pages of a PDF.
   * Coordinates must be in PDF points (0,0 at bottom-left).
   */
  static async applyEdits(buffer: ArrayBuffer, pagesEdits: Record<number, PdfEditItem[]>): Promise<Uint8Array> {
    const pdf = await PDFDocument.load(buffer);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdf.getPages();

    for (const [pageIndexStr, items] of Object.entries(pagesEdits)) {
      const pageIndex = parseInt(pageIndexStr, 10);
      if (pageIndex < 0 || pageIndex >= pages.length) continue;
      
      const page = pages[pageIndex];

      for (const item of items) {
        if (item.type === 'rect') {
          page.drawRectangle({
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            color: item.color === 'black' ? rgb(0, 0, 0) : rgb(1, 1, 1),
          });
        } else if (item.type === 'text') {
          const selectedFont = item.weight === 'bold' ? fontBold : font;
          let safeText = item.text || '';
          try {
            selectedFont.encodeText(safeText);
          } catch {
            let sanitized = '';
            for (const ch of safeText) {
              try {
                selectedFont.encodeText(ch);
                sanitized += ch;
              } catch {
                sanitized += '?';
              }
            }
            safeText = sanitized;
          }

          page.drawText(safeText, {
            x: item.x,
            y: item.y,
            size: item.size || 12,
            font: selectedFont,
            color: item.color === 'white' ? rgb(1,1,1) : rgb(0,0,0),
          });
        } else if (item.type === 'image') {
          try {
            const base64Data = item.dataUrl.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            let embeddedImage;
            if (item.dataUrl.startsWith('data:image/png')) {
              embeddedImage = await pdf.embedPng(imageBytes);
            } else if (item.dataUrl.startsWith('data:image/jpeg') || item.dataUrl.startsWith('data:image/jpg')) {
              embeddedImage = await pdf.embedJpg(imageBytes);
            }
            
            if (embeddedImage) {
              page.drawImage(embeddedImage, {
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
              });
            }
          } catch(e) {
            console.error('Erro ao embutir imagem', e);
          }
        }
      }
    }

    return await pdf.save();
  }

  /**
   * Extracts clean structured text and formatted Markdown from a PDF document.
   */
  static async extractTextAndMarkdown(arrayBuffer: ArrayBuffer): Promise<{
    text: string;
    markdown: string;
    pageCount: number;
    charCount: number;
    wordCount: number;
  }> {
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const allPagesText: string[] = [];
    const allPagesMd: string[] = [];
    const allFontSizes: number[] = [];

    interface TextItemWithPos {
      str: string;
      x: number;
      y: number;
      fontSize: number;
      width: number;
      height: number;
    }

    const pagesData: TextItemWithPos[][] = [];

    for (let p = 1; p <= pageCount; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();
      const items: TextItemWithPos[] = [];

      for (const item of textContent.items as any[]) {
        if (!item.str || item.str.trim() === '') continue;
        const tx = item.transform[4];
        const ty = item.transform[5];
        const fontSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
        items.push({
          str: item.str,
          x: tx,
          y: ty,
          fontSize,
          width: item.width || 0,
          height: item.height || 0
        });
        allFontSizes.push(fontSize);
      }

      // Sort top-to-bottom (Y descending), then left-to-right (X ascending)
      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) <= 3) {
          return a.x - b.x;
        }
        return b.y - a.y;
      });

      pagesData.push(items);
    }

    // Determine baseline body font size (median)
    allFontSizes.sort((a, b) => a - b);
    const bodyFontSize = allFontSizes.length > 0 ? allFontSizes[Math.floor(allFontSizes.length / 2)] : 12;

    for (let p = 0; p < pagesData.length; p++) {
      const items = pagesData[p];
      const pageLines: Array<{ lineStr: string; fontSize: number }> = [];

      let currentLineItems: TextItemWithPos[] = [];
      let currentY: number | null = null;

      for (const item of items) {
        if (currentY === null || Math.abs(item.y - currentY) <= 3) {
          currentLineItems.push(item);
          currentY = item.y;
        } else {
          if (currentLineItems.length > 0) {
            const lineStr = currentLineItems.map(i => i.str).join(' ');
            const avgSize = currentLineItems.reduce((acc, i) => acc + i.fontSize, 0) / currentLineItems.length;
            pageLines.push({ lineStr: lineStr.trim(), fontSize: avgSize });
          }
          currentLineItems = [item];
          currentY = item.y;
        }
      }
      if (currentLineItems.length > 0) {
        const lineStr = currentLineItems.map(i => i.str).join(' ');
        const avgSize = currentLineItems.reduce((acc, i) => acc + i.fontSize, 0) / currentLineItems.length;
        pageLines.push({ lineStr: lineStr.trim(), fontSize: avgSize });
      }

      // Format page as Plain Text
      const rawText = pageLines.map(l => l.lineStr).join('\n');
      allPagesText.push(rawText);

      // Format page as Markdown
      const mdLines: string[] = [];
      for (const l of pageLines) {
        const text = l.lineStr;
        if (!text) continue;

        if (l.fontSize >= bodyFontSize * 1.5) {
          mdLines.push(`\n# ${text}\n`);
        } else if (l.fontSize >= bodyFontSize * 1.25) {
          mdLines.push(`\n## ${text}\n`);
        } else if (l.fontSize >= bodyFontSize * 1.1) {
          mdLines.push(`\n### ${text}\n`);
        } else {
          mdLines.push(text);
        }
      }

      allPagesMd.push(`<!-- Página ${p + 1} -->\n` + mdLines.join('\n'));
    }

    const fullText = allPagesText.join('\n\n--- Página ---\n\n');
    const fullMd = allPagesMd.join('\n\n---\n\n');

    const charCount = fullText.length;
    const wordCount = fullText.trim() ? fullText.trim().split(/\s+/).length : 0;

    return {
      text: fullText,
      markdown: fullMd,
      pageCount,
      charCount,
      wordCount
    };
  }

  /**
   * Extracts tabular data from PDF pages and returns CSV and 2D table array.
   */
  static async extractTablesToCsv(
    arrayBuffer: ArrayBuffer,
    options?: { delimiter?: string; pageNum?: number }
  ): Promise<{
    csv: string;
    tableData: string[][];
    pageCount: number;
    rowCount: number;
    colCount: number;
  }> {
    const delimiter = options?.delimiter || ';';
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    const startPage = options?.pageNum ? options.pageNum : 1;
    const endPage = options?.pageNum ? options.pageNum : pageCount;

    const allRows: string[][] = [];

    for (let p = startPage; p <= endPage; p++) {
      const page = await pdf.getPage(p);
      const textContent = await page.getTextContent();

      interface TextItem {
        str: string;
        x: number;
        y: number;
        width: number;
        height: number;
      }

      const items: TextItem[] = [];
      for (const item of textContent.items as any[]) {
        if (!item.str || item.str.trim() === '') continue;
        items.push({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
          width: item.width || (item.str.length * 6),
          height: item.height || 12
        });
      }

      // Sort by Y descending (top to bottom), then X ascending (left to right)
      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) <= 4) {
          return a.x - b.x;
        }
        return b.y - a.y;
      });

      // Group into rows
      const rows: TextItem[][] = [];
      let currentRow: TextItem[] = [];
      let currentY: number | null = null;

      for (const item of items) {
        if (currentY === null || Math.abs(item.y - currentY) <= 4) {
          currentRow.push(item);
          currentY = item.y;
        } else {
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }
          currentRow = [item];
          currentY = item.y;
        }
      }
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      // Group consecutive items into cells if gap is small, or separate cells if gap is large
      for (const rowItems of rows) {
        rowItems.sort((a, b) => a.x - b.x);
        const cells: string[] = [];
        let currentCell = '';
        let lastEnd = -1;

        for (const it of rowItems) {
          const gap = lastEnd === -1 ? 0 : it.x - lastEnd;
          if (lastEnd !== -1 && gap > 18) {
            cells.push(currentCell.trim());
            currentCell = it.str;
          } else {
            currentCell = currentCell ? currentCell + ' ' + it.str : it.str;
          }
          lastEnd = it.x + it.width;
        }
        if (currentCell) {
          cells.push(currentCell.trim());
        }

        if (cells.length > 0 && cells.some(c => c !== '')) {
          allRows.push(cells);
        }
      }
    }

    // Determine max columns
    let colCount = 0;
    for (const r of allRows) {
      if (r.length > colCount) colCount = r.length;
    }

    // Normalize rows to have colCount length
    for (const r of allRows) {
      while (r.length < colCount) {
        r.push('');
      }
    }

    // Generate CSV string
    const csvLines = allRows.map(row => {
      return row.map(cell => {
        let val = cell || '';
        if (val.includes(delimiter) || val.includes('"') || val.includes('\n')) {
          val = `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(delimiter);
    });

    const csv = csvLines.join('\r\n');

    return {
      csv,
      tableData: allRows,
      pageCount,
      rowCount: allRows.length,
      colCount
    };
  }
}

export type PdfEditItem = 
  | { type: 'rect', x: number, y: number, width: number, height: number, color: 'white' | 'black' }
  | { type: 'text', text: string, x: number, y: number, size: number, color: 'black' | 'white', weight: 'normal' | 'bold' }
  | { type: 'image', dataUrl: string, x: number, y: number, width: number, height: number };

export interface PdfEditOptions {
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string; // comma separated
  };
  pagination?: {
    enabled: boolean;
    format: 'page' | 'pageOfTotal';
  };
  watermark?: {
    enabled: boolean;
    text: string;
  };
}
