import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import pptxgen from 'pptxgenjs';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType
} from 'docx';
import { detectVisualBoundingBoxes, BoundingBox } from './box-detector';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface CroppedGraphicBox {
  dataUrl: string;
  xInches: number;
  yInches: number;
  wInches: number;
  hInches: number;
  xPt: number;
  yPt: number;
  wPt: number;
  hPt: number;
}

/**
 * HybridOfficeService - Motor de Fatiamento em Caixas Móveis (Bounding Boxes)
 * 
 * Em vez de uma folha sólida de fundo, detecta e recorta APENAS as regiões não-texto
 * (tabelas, contornos, molduras e imagens) em caixas móveis transparentes e independentes!
 */
export class HybridOfficeService {
  /**
   * Localiza e recorta cada elemento visual não-texto como uma caixa móvel independente.
   */
  static async extractNonTextGraphicBoxes(
    page: any,
    vp: any,
    scale: number = 2.0
  ): Promise<CroppedGraphicBox[]> {
    try {
      const vpHd = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = vpHd.width;
      canvas.height = vpHd.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      // 1. Renderiza o PDF no canvas HD com fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vpHd } as any).promise;

      // 2. Apaga cirurgicamente os textos do canvas
      const textContent = await page.getTextContent();
      ctx.fillStyle = '#ffffff';

      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;

        const fs = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12;
        const x = item.transform[4] * scale;
        const y = (vp.height - item.transform[5] - fs) * scale;
        const w = (item.width || item.str.length * fs * 0.5) * scale;
        const h = fs * 1.35 * scale;

        // Limpa a área do texto com pequena margem de 1.5px
        ctx.fillRect(Math.max(0, x - 2), Math.max(0, y - 2), w + 4, h + 4);
      }

      // 3. Detecta os Bounding Boxes das regiões que contêm desenhos/fotos/tabelas
      const boxes: BoundingBox[] = detectVisualBoundingBoxes(ctx, canvas.width, canvas.height, 28);
      const result: CroppedGraphicBox[] = [];

      for (const box of boxes) {
        // Cria canvas de recorte para este elemento
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = box.w;
        cropCanvas.height = box.h;
        const cropCtx = cropCanvas.getContext('2d');
        if (!cropCtx) continue;

        cropCtx.drawImage(
          canvas,
          box.x,
          box.y,
          box.w,
          box.h,
          0,
          0,
          box.w,
          box.h
        );

        const dataUrl = cropCanvas.toDataURL('image/png');
        const xPt = box.x / scale;
        const yPt = box.y / scale;
        const wPt = box.w / scale;
        const hPt = box.h / scale;

        result.push({
          dataUrl,
          xInches: xPt / 72,
          yInches: yPt / 72,
          wInches: wPt / 72,
          hInches: hPt / 72,
          xPt,
          yPt,
          wPt,
          hPt
        });
      }

      return result;
    } catch (e) {
      console.warn('Erro ao fatiar caixas móveis:', e);
      return [];
    }
  }

  /**
   * Converte PDF em PowerPoint (.pptx) com Caixas Móveis Recortadas
   */
  static async pdfToPptxHybrid(
    arrayBuffer: ArrayBuffer,
    options?: {
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

    const pres = new pptxgen();
    let isLayoutSet = false;

    for (let p = 1; p <= numPages; p++) {
      if (options?.onProgress) options.onProgress(p, numPages);
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1.0 });

      if (!isLayoutSet) {
        const widthInches = vp.width / 72;
        const heightInches = vp.height / 72;
        pres.defineLayout({ name: 'custom_boxes_layout', width: widthInches, height: heightInches });
        pres.layout = 'custom_boxes_layout';
        isLayoutSet = true;
      }

      const slide = pres.addSlide();

      // 1. Fatiar e inserir cada elemento não-texto como uma CAIXA MÓVEL solta
      const graphicBoxes = await this.extractNonTextGraphicBoxes(page, vp, 2.0);
      for (const gBox of graphicBoxes) {
        slide.addImage({
          data: gBox.dataUrl,
          x: gBox.xInches,
          y: gBox.yInches,
          w: gBox.wInches,
          h: gBox.hInches
        });
      }

      // 2. Extrair os textos editáveis com precisão milimétrica e padding zerado
      const textContent = await page.getTextContent();
      interface LineBox {
        xPt: number;
        yPt: number;
        wPt: number;
        hPt: number;
        text: string;
        fontSize: number;
        fontName: string;
        bold: boolean;
        italic: boolean;
        colorHex: string;
      }

      const rawItems: LineBox[] = [];
      for (const raw of textContent.items as any[]) {
        if (!raw.str || !raw.str.trim()) continue;

        const fs = Math.round(Math.hypot(raw.transform[0], raw.transform[1]) || raw.height || 12);
        const fn = (raw.fontName || '').toLowerCase();

        let cHex = '000000';
        if (raw.color && Array.isArray(raw.color) && raw.color.length === 3) {
          const r = raw.color[0].toString(16).padStart(2, '0');
          const g = raw.color[1].toString(16).padStart(2, '0');
          const b = raw.color[2].toString(16).padStart(2, '0');
          cHex = `${r}${g}${b}`.toUpperCase();
        }

        rawItems.push({
          xPt: raw.transform[4],
          yPt: raw.transform[5],
          wPt: raw.width || (raw.str.length * fs * 0.5),
          hPt: fs,
          text: raw.str,
          fontSize: fs,
          fontName: fn,
          bold: fn.includes('bold') || fn.includes('black') || fn.includes('heavy'),
          italic: fn.includes('italic') || fn.includes('oblique'),
          colorHex: cHex
        });
      }

      rawItems.sort((a, b) => {
        if (Math.abs(a.yPt - b.yPt) <= 4) return a.xPt - b.xPt;
        return b.yPt - a.yPt;
      });

      const mergedLines: LineBox[] = [];
      for (const item of rawItems) {
        const prev = mergedLines[mergedLines.length - 1];
        if (
          prev &&
          Math.abs(prev.yPt - item.yPt) <= 4 &&
          item.xPt - (prev.xPt + prev.wPt) < 25 &&
          prev.fontSize === item.fontSize &&
          prev.colorHex === item.colorHex
        ) {
          prev.text += ' ' + item.text;
          prev.wPt = Math.max(prev.wPt, item.xPt + item.wPt - prev.xPt);
          prev.bold = prev.bold || item.bold;
          prev.italic = prev.italic || item.italic;
        } else {
          mergedLines.push({ ...item });
        }
      }

      for (const box of mergedLines) {
        const xInches = box.xPt / 72;
        const yInches = (vp.height - box.yPt - box.fontSize) / 72;
        const wInches = (box.wPt + 10) / 72; // Pequena folga para não quebrar linha
        const hInches = (box.fontSize * 1.4) / 72;

        let fontFace = 'Calibri';
        if (box.fontName) {
          const cleanMatch = box.fontName.match(/(?:[A-Z]{6}\+)?([a-zA-Z0-9\-]+)/);
          if (cleanMatch) {
            fontFace = cleanMatch[1].replace(/-/g, ' ').replace(/Bold|Italic|Oblique|MT|Regular/g, '').trim() || 'Calibri';
          }
        }

        slide.addText(box.text, {
          x: xInches,
          y: Math.max(0, yInches),
          w: wInches,
          h: hInches,
          fontSize: box.fontSize,
          fontFace: fontFace,
          bold: box.bold,
          italic: box.italic,
          color: box.colorHex,
          valign: 'top',
          margin: 0, // Zera margens internas para alinhamento estrito
          wrap: false // Evita quebra antecipada de linha
        });
      }

      await new Promise((r) => setTimeout(r, 0));
    }

    const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;

    return {
      pptxBlob,
      slideCount: numPages
    };
  }

  /**
   * Converte PDF em Word (.docx) com Caixas Móveis Recortadas
   */
  static async pdfToDocxHybrid(
    arrayBuffer: ArrayBuffer,
    options?: {
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

    const sections: any[] = [];
    const previewParts: string[] = [];
    let totalWords = 0;
    let totalParagraphs = 0;

    for (let p = 1; p <= pageCount; p++) {
      if (options?.onProgress) options.onProgress(p, pageCount);
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1.0 });

      // Caixas visuais móveis (tabelas, contornos, molduras, fotos)
      const graphicBoxes = await this.extractNonTextGraphicBoxes(page, vp, 2.0);

      const pageTwipWidth = Math.round(vp.width * 20);
      const pageTwipHeight = Math.round(vp.height * 20);

      const children: Paragraph[] = [];

      // 1. Adicionar cada caixa móvel recortada flutuando na sua posição exata
      if (graphicBoxes.length > 0) {
        const imageRuns: ImageRun[] = [];
        for (const gBox of graphicBoxes) {
          const imgBytes = Uint8Array.from(atob(gBox.dataUrl.split(',')[1]), (c) => c.charCodeAt(0));
          imageRuns.push(
            new ImageRun({
              data: imgBytes,
              type: 'png',
              transformation: {
                width: Math.round(gBox.wPt * (96 / 72)),
                height: Math.round(gBox.hPt * (96 / 72))
              },
              floating: {
                horizontalPosition: {
                  relative: HorizontalPositionRelativeFrom.PAGE,
                  offset: Math.round(gBox.xPt * 12700)
                },
                verticalPosition: {
                  relative: VerticalPositionRelativeFrom.PAGE,
                  offset: Math.round(gBox.yPt * 12700)
                },
                wrap: { type: TextWrappingType.NONE },
                allowOverlap: true,
                behindDocument: true
              }
            })
          );
        }

        children.push(
          new Paragraph({
            spacing: { before: 0, after: 0, line: 0 },
            children: imageRuns
          })
        );
      }

      // 2. Textos editáveis com posições e parágrafos
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
      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;
        const fs = Math.round(Math.hypot(item.transform[0], item.transform[1]) || item.height || 11);
        const fn = (item.fontName || '').toLowerCase();
        items.push({
          str: item.str,
          x: item.transform[4],
          y: vp.height - item.transform[5] - fs,
          width: item.width || item.str.length * (fs * 0.5),
          fontSize: fs,
          bold: fn.includes('bold') || fn.includes('black') || fn.includes('heavy'),
          italic: fn.includes('italic') || fn.includes('oblique')
        });
      }

      items.sort((a, b) => (Math.abs(a.y - b.y) <= 4 ? a.x - b.x : a.y - b.y));

      const sizes = items.map((i) => i.fontSize).sort((a, b) => a - b);
      const medianSize = sizes[Math.floor(sizes.length / 2)] || 12;

      let currentRuns: RawItem[] = [];
      let currentMaxFont = medianSize;
      let prevY: number | null = null;

      const flushPara = () => {
        if (currentRuns.length === 0) return;
        const text = currentRuns.map((r) => r.str).join(' ').trim();
        if (!text) { currentRuns = []; return; }
        totalWords += text.split(/\s+/).filter(Boolean).length;
        totalParagraphs++;

        const isH1 = currentMaxFont >= medianSize * 1.45 && text.length < 140;
        const isH2 = !isH1 && currentMaxFont >= medianSize * 1.2 && text.length < 160;

        const runs = currentRuns.map(
          (r) =>
            new TextRun({
              text: r.str + ' ',
              bold: isH1 || isH2 ? true : r.bold,
              italics: r.italic,
              font: fontFamily,
              size: Math.max(16, Math.round(r.fontSize * 2)) || 22
            })
        );

        children.push(
          new Paragraph({
            heading: isH1 ? HeadingLevel.HEADING_1 : isH2 ? HeadingLevel.HEADING_2 : undefined,
            alignment: AlignmentType.LEFT,
            spacing: { after: 120, line: 240 },
            children: runs
          })
        );

        currentRuns = [];
        currentMaxFont = medianSize;
      };

      for (const it of items) {
        if (prevY !== null && Math.abs(it.y - prevY) > it.fontSize * 1.5) {
          flushPara();
        }
        currentRuns.push(it);
        if (it.fontSize > currentMaxFont) currentMaxFont = it.fontSize;
        prevY = it.y;
      }
      flushPara();

      sections.push({
        properties: {
          page: {
            size: {
              width: pageTwipWidth,
              height: pageTwipHeight
            },
            margin: { top: 720, right: 720, bottom: 720, left: 720 }
          }
        },
        children
      });

      previewParts.push(`
        <div style="margin-bottom: 20px; text-align: center; background: var(--bg-surface); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
          <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-bottom: 8px; font-weight: 600;">Página ${p} (${graphicBoxes.length} caixas visuais recortadas)</div>
          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            ${graphicBoxes.map((b, idx) => `<img src="${b.dataUrl}" style="max-height: 120px; border: 1px solid var(--border-color); border-radius: 4px; background: white;" title="Caixa ${idx + 1}" />`).join('')}
          </div>
        </div>
      `);
    }

    const doc = new Document({ sections });
    const docxBlob = await Packer.toBlob(doc);

    return {
      docxBlob,
      pageCount,
      wordCount: totalWords || 1,
      paragraphCount: totalParagraphs || pageCount,
      previewHtml: previewParts.join('')
    };
  }
}
