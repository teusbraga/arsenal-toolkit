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
