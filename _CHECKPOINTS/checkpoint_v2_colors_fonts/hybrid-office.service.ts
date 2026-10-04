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

export interface RichTextItem {
  str: string;
  xPt: number;
  yPt: number;      // Posição Y da baseline (sistema PDF, de baixo para cima)
  topPt: number;    // Posição Y do topo (sistema de cima para baixo)
  wPt: number;
  hPt: number;
  fontSize: number;
  fontName: string;
  fontFace: string;
  bold: boolean;
  italic: boolean;
  colorHex: string; // Ex: '1A73E8', 'E53935', '000000'
}

/**
 * Normaliza nomes brutos de fontes do PDF para famílias reconhecidas pelo Office/Windows/Mac.
 */
export function normalizeFontName(
  rawName: string,
  fallbackStyleFamily?: string
): {
  fontFace: string;
  isBold: boolean;
  isItalic: boolean;
} {
  let name = (rawName || '').trim();

  // Remove prefixo de subset do PDF (ex: "ABCDEF+Arial" -> "Arial")
  name = name.replace(/^[A-Z]{6}\+/, '');

  const lower = name.toLowerCase();

  // Detecta variantes de estilo diretamente no identificador da fonte
  const isBold =
    lower.includes('bold') ||
    lower.includes('black') ||
    lower.includes('heavy') ||
    lower.includes('semibold') ||
    lower.includes('demi');

  const isItalic =
    lower.includes('italic') ||
    lower.includes('oblique') ||
    lower.includes('slanted');

  // Limpa sufixos de estilo para isolar o nome da família
  let clean = name
    .replace(/[-_,](Bold|Italic|Oblique|Regular|Light|Medium|SemiBold|Black|Heavy|Demibold|BoldItalic|BoldOblique|PSMT|PS|MT)$/i, '')
    .replace(/(PSMT|PS|MT)$/, '')
    .replace(/(Bold|Italic|Oblique|Regular|Light|SemiBold|Black)$/, '');

  // Separa CamelCase (ex: "LucidaHandwriting" -> "Lucida Handwriting")
  clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
  clean = clean.replace(/[_-]/g, ' ').replace(/\s+/g, ' ').trim();

  const lowerClean = clean.toLowerCase();
  let fontFace = 'Calibri';

  // 1. Mapeamento de fontes cursivas / caligráficas / artísticas
  if (lowerClean.includes('brush')) {
    fontFace = 'Brush Script MT';
  } else if (lowerClean.includes('lucida hand') || lowerClean.includes('handwriting')) {
    fontFace = 'Lucida Handwriting';
  } else if (lowerClean.includes('segoe script')) {
    fontFace = 'Segoe Script';
  } else if (lowerClean.includes('segoe print')) {
    fontFace = 'Segoe Print';
  } else if (lowerClean.includes('comic sans') || lowerClean.includes('comic')) {
    fontFace = 'Comic Sans MS';
  } else if (lowerClean.includes('freestyle')) {
    fontFace = 'Freestyle Script';
  } else if (lowerClean.includes('mistral')) {
    fontFace = 'Mistral';
  } else if (lowerClean.includes('papyrus')) {
    fontFace = 'Papyrus';
  } else if (lowerClean.includes('bradley')) {
    fontFace = 'Bradley Hand ITC';
  } else if (lowerClean.includes('french script')) {
    fontFace = 'French Script MT';
  } else if (lowerClean.includes('edwardian')) {
    fontFace = 'Edwardian Script ITC';
  } else if (lowerClean.includes('corsiva') || lowerClean.includes('chancery')) {
    fontFace = 'Monotype Corsiva';
  } else if (lowerClean.includes('pacifico')) {
    fontFace = 'Pacifico';
  } else if (lowerClean.includes('caveat')) {
    fontFace = 'Caveat';
  } else if (lowerClean.includes('dancing')) {
    fontFace = 'Dancing Script';
  } else if (lowerClean.includes('lobster')) {
    fontFace = 'Lobster';
  } else if (lowerClean.includes('script') || lowerClean.includes('calligraph') || lowerClean.includes('hand')) {
    fontFace = clean || 'Segoe Script';
  }
  // 2. Mapeamento de fontes padrão de mercado
  else if (lowerClean.includes('times') || lowerClean.includes('roman')) {
    fontFace = 'Times New Roman';
  } else if (lowerClean.includes('arial')) {
    fontFace = 'Arial';
  } else if (lowerClean.includes('helvetica')) {
    fontFace = 'Arial';
  } else if (lowerClean.includes('calibri')) {
    fontFace = 'Calibri';
  } else if (lowerClean.includes('courier')) {
    fontFace = 'Courier New';
  } else if (lowerClean.includes('georgia')) {
    fontFace = 'Georgia';
  } else if (lowerClean.includes('verdana')) {
    fontFace = 'Verdana';
  } else if (lowerClean.includes('trebuchet')) {
    fontFace = 'Trebuchet MS';
  } else if (lowerClean.includes('tahoma')) {
    fontFace = 'Tahoma';
  } else if (lowerClean.includes('segoe ui') || lowerClean === 'segoe') {
    fontFace = 'Segoe UI';
  } else if (lowerClean.includes('impact')) {
    fontFace = 'Impact';
  } else if (lowerClean.includes('garamond')) {
    fontFace = 'Garamond';
  } else if (lowerClean.includes('cambria')) {
    fontFace = 'Cambria';
  } else if (lowerClean.includes('consolas')) {
    fontFace = 'Consolas';
  } else if (lowerClean.includes('palatino') || lowerClean.includes('antiqua')) {
    fontFace = 'Palatino Linotype';
  } else if (lowerClean.includes('century gothic')) {
    fontFace = 'Century Gothic';
  } else if (clean.length > 2 && !clean.startsWith('g_d')) {
    // Mantém nome limpo de fonte instalada
    fontFace = clean;
  } else if (fallbackStyleFamily) {
    const fb = fallbackStyleFamily.toLowerCase();
    if (fb.includes('serif') && !fb.includes('sans')) {
      fontFace = 'Times New Roman';
    } else if (fb.includes('monospace') || fb.includes('mono')) {
      fontFace = 'Courier New';
    } else {
      fontFace = 'Arial';
    }
  }

  return { fontFace, isBold, isItalic };
}

/**
 * Algoritmo de Amostragem Cromática: Extrai a cor exata renderizada dos glifos diretamente do Canvas.
 */
export function sampleTextColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  canvasWidth: number,
  canvasHeight: number
): string {
  const rx = Math.max(0, Math.min(canvasWidth - 1, Math.floor(x)));
  const ry = Math.max(0, Math.min(canvasHeight - 1, Math.floor(y)));
  const rw = Math.max(1, Math.min(canvasWidth - rx, Math.ceil(w)));
  const rh = Math.max(1, Math.min(canvasHeight - ry, Math.ceil(h)));

  if (rw <= 0 || rh <= 0) return '000000';

  const imgData = ctx.getImageData(rx, ry, rw, rh).data;
  const totalPixels = rw * rh;
  const stride = totalPixels > 2500 ? 2 : 1;

  // 1. Amostrar os 4 cantos da caixa para determinar a cor do fundo local
  let cornerCount = 0;
  let sumBgR = 0, sumBgG = 0, sumBgB = 0;
  const testIndices = [
    0,
    (rw - 1) * 4,
    ((rh - 1) * rw) * 4,
    ((rh - 1) * rw + (rw - 1)) * 4
  ];

  for (const idx of testIndices) {
    if (idx >= 0 && idx + 3 < imgData.length && imgData[idx + 3] > 128) {
      sumBgR += imgData[idx];
      sumBgG += imgData[idx + 1];
      sumBgB += imgData[idx + 2];
      cornerCount++;
    }
  }

  const bgR = cornerCount > 0 ? Math.round(sumBgR / cornerCount) : 255;
  const bgG = cornerCount > 0 ? Math.round(sumBgG / cornerCount) : 255;
  const bgB = cornerCount > 0 ? Math.round(sumBgB / cornerCount) : 255;

  // 2. Coletar os pixels que contrastam com o fundo (traços do texto)
  interface CandidatePixel {
    r: number;
    g: number;
    b: number;
    dist: number;
  }
  const candidates: CandidatePixel[] = [];

  for (let py = 0; py < rh; py += stride) {
    for (let px = 0; px < rw; px += stride) {
      const idx = (py * rw + px) * 4;
      if (imgData[idx + 3] < 128) continue; // ignora transparente

      const r = imgData[idx];
      const g = imgData[idx + 1];
      const b = imgData[idx + 2];

      const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
      if (dist > 30) {
        candidates.push({ r, g, b, dist });
      }
    }
  }

  // Se nenhum pixel contrastante for encontrado, assume preto padrão
  if (candidates.length === 0) {
    return '000000';
  }

  // Ordena por maior distância do fundo (o núcleo nítido do glifo, sem o antialiasing borrado)
  candidates.sort((a, b) => b.dist - a.dist);

  // Amostra os 20% pixels com maior contraste
  const topCount = Math.max(1, Math.min(candidates.length, Math.ceil(candidates.length * 0.20)));
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < topCount; i++) {
    sumR += candidates[i].r;
    sumG += candidates[i].g;
    sumB += candidates[i].b;
  }

  const finalR = Math.round(sumR / topCount);
  const finalG = Math.round(sumG / topCount);
  const finalB = Math.round(sumB / topCount);

  // Normalização para preto puro se muito escuro
  if (finalR < 35 && finalG < 35 && finalB < 35) {
    return '000000';
  }

  // Normalização para branco puro se muito claro
  if (finalR > 245 && finalG > 245 && finalB > 245) {
    return 'FFFFFF';
  }

  return [finalR, finalG, finalB]
    .map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * Verifica se duas cores Hex são perceptualmentes muito próximas (evita fragmentar texto por antialiasing sutil).
 */
export function areColorsClose(hex1: string, hex2: string, threshold: number = 20): boolean {
  if (hex1 === hex2) return true;
  const r1 = parseInt(hex1.substring(0, 2), 16) || 0;
  const g1 = parseInt(hex1.substring(2, 4), 16) || 0;
  const b1 = parseInt(hex1.substring(4, 6), 16) || 0;
  const r2 = parseInt(hex2.substring(0, 2), 16) || 0;
  const g2 = parseInt(hex2.substring(2, 4), 16) || 0;
  const b2 = parseInt(hex2.substring(4, 6), 16) || 0;
  return Math.hypot(r1 - r2, g1 - g2, b1 - b2) < threshold;
}

/**
 * HybridOfficeService - Motor de Fatiamento em Caixas Móveis com Amostragem Cromática e de Fontes
 */
export class HybridOfficeService {
  /**
   * Extrai simultaneamente:
   * 1. Caixas gráficas não-texto recortadas (tabelas, molduras, assinaturas, fotos)
   * 2. Textos enriquecidos com cores reais e fontes identificadas
   */
  static async extractPageElements(
    page: any,
    vp: any,
    scale: number = 2.0
  ): Promise<{
    graphicBoxes: CroppedGraphicBox[];
    richTexts: RichTextItem[];
  }> {
    try {
      const vpHd = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = vpHd.width;
      canvas.height = vpHd.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { graphicBoxes: [], richTexts: [] };

      // 1. Renderiza o PDF com precisão no canvas HD
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport: vpHd } as any).promise;

      // 2. Extrai itens de texto brutos
      const textContent = await page.getTextContent();

      // 3. Força a resolução da lista de operadores e fontes do PDF
      try {
        await page.getOperatorList();
      } catch (e) {
        console.warn('[HybridEngine] Falha ao carregar operatorList:', e);
      }

      // 4. Resolve assincronamente todos os objetos de fonte da página via commonObjs
      const fontMap = new Map<string, any>();
      const uniqueFontNames = Array.from(
        new Set((textContent.items as any[]).map((i) => i.fontName).filter(Boolean))
      );

      await Promise.all(
        uniqueFontNames.map(
          (fName) =>
            new Promise<void>((resolve) => {
              const timer = setTimeout(() => resolve(), 350);
              try {
                if (page.commonObjs && typeof page.commonObjs.get === 'function') {
                  page.commonObjs.get(fName, (fontObj: any) => {
                    clearTimeout(timer);
                    if (fontObj) fontMap.set(fName, fontObj);
                    resolve();
                  });
                } else {
                  clearTimeout(timer);
                  resolve();
                }
              } catch {
                clearTimeout(timer);
                resolve();
              }
            })
        )
      );

      const richTexts: RichTextItem[] = [];

      // 5. AMOSTRAGEM CROMÁTICA & DE FONTES (Antes de apagar os textos do canvas!)
      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;

        const fs = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12;
        const cx = item.transform[4] * scale;
        const cy = (vp.height - item.transform[5] - fs) * scale;
        const cw = (item.width || item.str.length * fs * 0.5) * scale;
        const ch = fs * 1.35 * scale;

        // Amostra a cor visual exata na área do glifo no Canvas HD
        const sampledColor = sampleTextColor(ctx, cx, cy, cw, ch, canvas.width, canvas.height);

        // Identifica e resolve o nome real da fonte via fontMap
        const fontObj = fontMap.get(item.fontName);
        let rawFontName = '';
        let isObjBold = false;
        let isObjItalic = false;

        if (fontObj) {
          rawFontName = fontObj.name || fontObj.loadedName || fontObj.fallbackName || '';
          if (fontObj.bold) isObjBold = true;
          if (fontObj.italic) isObjItalic = true;
        }

        if (!rawFontName) {
          rawFontName = item.fontName || '';
        }

        const fallbackStyle = textContent.styles?.[item.fontName]?.fontFamily;
        const fontNormalized = normalizeFontName(rawFontName, fallbackStyle);

        richTexts.push({
          str: item.str,
          xPt: item.transform[4],
          yPt: item.transform[5],
          topPt: vp.height - item.transform[5] - fs,
          wPt: item.width || (item.str.length * fs * 0.5),
          hPt: fs,
          fontSize: Math.round(fs),
          fontName: rawFontName,
          fontFace: fontNormalized.fontFace,
          bold: fontNormalized.isBold || isObjBold,
          italic: fontNormalized.isItalic || isObjItalic,
          colorHex: sampledColor
        });
      }

      console.log(`[HybridEngine] Página processada: ${richTexts.length} textos | Fontes identificadas:`, 
        Array.from(fontMap.entries()).map(([k, f]) => `${k} -> ${f?.name || f?.loadedName}`)
      );

      // 6. Apaga cirurgicamente os textos do canvas para deixar APENAS os elementos visuais
      ctx.fillStyle = '#ffffff';
      for (const item of textContent.items as any[]) {
        if (!item.str || !item.str.trim()) continue;
        const fs = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12;
        const cx = item.transform[4] * scale;
        const cy = (vp.height - item.transform[5] - fs) * scale;
        const cw = (item.width || item.str.length * fs * 0.5) * scale;
        const ch = fs * 1.35 * scale;
        ctx.fillRect(Math.max(0, cx - 2), Math.max(0, cy - 2), cw + 4, ch + 4);
      }

      // 7. Detecta os Bounding Boxes das regiões com desenhos, tabelas e molduras
      const boxes: BoundingBox[] = detectVisualBoundingBoxes(ctx, canvas.width, canvas.height, 28);
      const graphicBoxes: CroppedGraphicBox[] = [];

      for (const box of boxes) {
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

        graphicBoxes.push({
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

      return { graphicBoxes, richTexts };
    } catch (e) {
      console.warn('[HybridEngine] Erro ao extrair elementos da página:', e);
      return { graphicBoxes: [], richTexts: [] };
    }
  }

  /**
   * Mantido para compatibilidade retroativa
   */
  static async extractNonTextGraphicBoxes(
    page: any,
    vp: any,
    scale: number = 2.0
  ): Promise<CroppedGraphicBox[]> {
    const { graphicBoxes } = await this.extractPageElements(page, vp, scale);
    return graphicBoxes;
  }

  /**
   * Converte PDF em PowerPoint (.pptx) com Caixas Móveis Recortadas, Cores Exatas e Fontes Nativas
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
    // REGRA MANDATÓRIA (GEMINI.md): Clona o buffer antes de enviar ao pdfjsLib
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

      // 1. Extração unificada de caixas gráficas recortadas + textos enriquecidos
      const { graphicBoxes, richTexts } = await this.extractPageElements(page, vp, 2.0);

      // 2. Insere cada elemento não-texto como uma CAIXA MÓVEL solta e reposicionável
      for (const gBox of graphicBoxes) {
        slide.addImage({
          data: gBox.dataUrl,
          x: gBox.xInches,
          y: gBox.yInches,
          w: gBox.wInches,
          h: gBox.hInches
        });
      }

      // 3. Ordenação e agrupamento de linhas preservando cores e fontes idênticas
      richTexts.sort((a, b) => {
        if (Math.abs(a.yPt - b.yPt) <= 4) return a.xPt - b.xPt;
        return b.yPt - a.yPt;
      });

      const mergedLines: RichTextItem[] = [];
      for (const item of richTexts) {
        const prev = mergedLines[mergedLines.length - 1];
        if (
          prev &&
          Math.abs(prev.yPt - item.yPt) <= 4 &&
          item.xPt - (prev.xPt + prev.wPt) < 25 &&
          prev.fontSize === item.fontSize &&
          prev.fontFace === item.fontFace &&
          areColorsClose(prev.colorHex, item.colorHex)
        ) {
          prev.str += ' ' + item.str;
          prev.wPt = Math.max(prev.wPt, item.xPt + item.wPt - prev.xPt);
          prev.bold = prev.bold || item.bold;
          prev.italic = prev.italic || item.italic;
        } else {
          mergedLines.push({ ...item });
        }
      }

      // 4. Injeta cada caixa de texto no slide com cor Hexagonal nativa e fonte real
      for (const box of mergedLines) {
        const xInches = box.xPt / 72;
        const yInches = (vp.height - box.yPt - box.fontSize) / 72;
        const wInches = (box.wPt + 10) / 72;
        const hInches = (box.fontSize * 1.4) / 72;

        slide.addText(box.str, {
          x: xInches,
          y: Math.max(0, yInches),
          w: wInches,
          h: hInches,
          fontSize: box.fontSize,
          fontFace: box.fontFace,
          bold: box.bold,
          italic: box.italic,
          color: box.colorHex,
          valign: 'top',
          margin: 0,
          wrap: false
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
   * Converte PDF em Word (.docx) com Caixas Móveis Recortadas, Cores e Fontes Nativas
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
    // REGRA MANDATÓRIA (GEMINI.md): Clona o buffer antes de enviar ao pdfjsLib
    const safeBuffer = arrayBuffer.slice(0);
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(safeBuffer) });
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const defaultFontFamily = options?.fontFamily || 'Calibri';

    const sections: any[] = [];
    const previewParts: string[] = [];
    let totalWords = 0;
    let totalParagraphs = 0;

    for (let p = 1; p <= pageCount; p++) {
      if (options?.onProgress) options.onProgress(p, pageCount);
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1.0 });

      // Extração simultânea das caixas móveis e dos textos com cor e fonte
      const { graphicBoxes, richTexts } = await this.extractPageElements(page, vp, 2.0);

      const pageTwipWidth = Math.round(vp.width * 20);
      const pageTwipHeight = Math.round(vp.height * 20);

      const children: Paragraph[] = [];

      // 1. Inserir caixas gráficas recortadas flutuando sob a camada do texto
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

      // 2. Textos editáveis com cores e fontes organizados em parágrafos
      richTexts.sort((a, b) => (Math.abs(a.topPt - b.topPt) <= 4 ? a.xPt - b.xPt : a.topPt - b.topPt));

      const sizes = richTexts.map((i) => i.fontSize).sort((a, b) => a - b);
      const medianSize = sizes[Math.floor(sizes.length / 2)] || 12;

      let currentRuns: RichTextItem[] = [];
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
              font: r.fontFace || defaultFontFamily,
              color: r.colorHex,
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

      for (const it of richTexts) {
        if (prevY !== null && Math.abs(it.topPt - prevY) > it.fontSize * 1.5) {
          flushPara();
        }
        currentRuns.push(it);
        if (it.fontSize > currentMaxFont) currentMaxFont = it.fontSize;
        prevY = it.topPt;
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
