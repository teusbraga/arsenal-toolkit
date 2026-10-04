import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as docxPreview from 'docx-preview';

export interface DocxConversionResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  wordCount: number;
  paragraphCount: number;
}

function cleanWinAnsi(str: string): string {
  return (str || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

function hexToRgb(hex: string): [number, number, number] {
  const h = (hex || '000000').replace('#', '').padEnd(6, '0');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/** Extrai cor CSS rgb(r,g,b) ou #hex em [0,1] */
function parseCssColor(color: string): [number, number, number] {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') return [0, 0, 0];
  const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) return [parseInt(rgb[1]) / 255, parseInt(rgb[2]) / 255, parseInt(rgb[3]) / 255];
  if (color.startsWith('#')) return hexToRgb(color.slice(1));
  return [0, 0, 0];
}

/** Converte px do DOM para pontos PDF (96 DPI → 72 DPI) */
const PX_TO_PT = 72 / 96;

export class WordToPdfService {
  /**
   * Abordagem CARTESIANA (igual ao PDF→PPT com 99% de fidelidade):
   * 1. Renderiza o DOCX no DOM via docx-preview (escala 1:1)
   * 2. Varre TODOS os elementos com getBoundingClientRect() → coordenadas absolutas
   * 3. Mapeia cada elemento (texto, imagem, tabela-célula, fundo)
   * 4. Reproduz cada elemento no PDF nas coordenadas EXATAS de pixel → ponto
   */
  static async convertDocxToPdf(
    arrayBuffer: ArrayBuffer,
    options?: { onProgress?: (current: number, total: number) => void }
  ): Promise<DocxConversionResult> {

    // ─── PASSO 1: Renderiza DOCX no DOM oculto ─────────────────────────────
    const safeBuffer = arrayBuffer.slice(0);

    // Container oculto fora do viewport (posição absoluta para não deslocar layout)
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -99999px;
      left: -99999px;
      width: 794px;
      background: white;
      visibility: hidden;
      pointer-events: none;
      z-index: -1;
    `;
    document.body.appendChild(container);

    try {
      // renderAsync aceita Blob | ArrayBuffer (não Uint8Array diretamente)
      const docxBlob = new Blob([safeBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      await docxPreview.renderAsync(docxBlob, container, undefined, {
        className: 'docx',
        inWrapper: true,
        ignoreWidth: false,
        ignoreHeight: false,
        ignoreFonts: false,
        breakPages: true,
        useBase64URL: true,
        renderChanges: false,
        renderHeaders: true,
        renderFooters: true,
        renderFootnotes: true,
        renderEndnotes: true,
      });

      // Aguarda renderização completa (imagens, fontes, layout)
      await new Promise((r) => setTimeout(r, 500));

      // ─── PASSO 2: Detecta páginas — tenta múltiplos seletores ─────────────
      // docx-preview gera: <section class="docx"> por página dentro de .docx-wrapper
      let pageEls = Array.from(container.querySelectorAll('section.docx')) as HTMLElement[];

      // Fallback 1: qualquer <section> dentro do container
      if (pageEls.length === 0) {
        pageEls = Array.from(container.querySelectorAll('section')) as HTMLElement[];
      }

      // Fallback 2: .docx-wrapper direto se não houver sections
      if (pageEls.length === 0) {
        const wrapper = container.querySelector('.docx-wrapper') as HTMLElement;
        if (wrapper) pageEls = [wrapper];
      }

      // Fallback 3: o próprio container como página única
      if (pageEls.length === 0 && container.children.length > 0) {
        pageEls = [container];
      }

      if (pageEls.length === 0) {
        // Debug: mostra o HTML gerado para diagnóstico
        console.error('[WordToPdf] HTML gerado pelo docx-preview:', container.innerHTML.substring(0, 500));
        throw new Error('docx-preview não gerou nenhuma página.');
      }

      // ─── PASSO 3: Inicializa PDF ──────────────────────────────────────────
      const pdfDoc = await PDFDocument.create();

      // Fontes vetoriais padrão
      const fonts = {
        regular:    await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold:       await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        italic:     await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
        times:      await pdfDoc.embedFont(StandardFonts.TimesRoman),
        timesBold:  await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        timesItalic:      await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
        timesBoldItalic:  await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
        courier:    await pdfDoc.embedFont(StandardFonts.Courier),
        courierBold: await pdfDoc.embedFont(StandardFonts.CourierBold),
      };

      const getFont = (fontFamily: string, bold: boolean, italic: boolean) => {
        const fn = fontFamily.toLowerCase();
        if (fn.includes('courier') || fn.includes('mono') || fn.includes('consolas')) {
          return bold ? fonts.courierBold : fonts.courier;
        }
        if (fn.includes('times') || fn.includes('roman') || fn.includes('georgia') ||
            fn.includes('garamond') || fn.includes('palatino') || fn.includes('antiqua')) {
          if (bold && italic) return fonts.timesBoldItalic;
          if (bold) return fonts.timesBold;
          if (italic) return fonts.timesItalic;
          return fonts.times;
        }
        if (bold && italic) return fonts.boldItalic;
        if (bold) return fonts.bold;
        if (italic) return fonts.italic;
        return fonts.regular;
      };

      let totalWordCount = 0;
      let totalParagraphCount = 0;

      // ─── PASSO 4: Itera cada página do DOM → gera página PDF ─────────────
      for (let pgIdx = 0; pgIdx < pageEls.length; pgIdx++) {
        if (options?.onProgress) options.onProgress(pgIdx + 1, pageEls.length);

        const pageEl = pageEls[pgIdx];
        const pageRect = pageEl.getBoundingClientRect();

        // Dimensões da página em pontos PDF
        const pagePx = { w: pageRect.width, h: pageRect.height };
        const pagePt = { w: pagePx.w * PX_TO_PT, h: pagePx.h * PX_TO_PT };

        const pdfPage = pdfDoc.addPage([pagePt.w, pagePt.h]);

        // Fundo branco
        pdfPage.drawRectangle({
          x: 0, y: 0,
          width: pagePt.w, height: pagePt.h,
          color: rgb(1, 1, 1)
        });

        /**
         * Converte coordenada Y do DOM (px, origem no topo da página)
         * para coordenada Y do PDF (pt, origem na base da página)
         */
        const toPdfY = (domYFromPageTop: number, elementHeightPx: number) =>
          pagePt.h - (domYFromPageTop + elementHeightPx) * PX_TO_PT;

        // ── PASSO 5: Mapeamento cartesiano de TODOS os elementos ────────────
        // Coletamos e ordenamos por z-order (fundos antes, textos depois)

        interface MappedElement {
          type: 'rect' | 'text' | 'image';
          x: number; y: number; w: number; h: number; // em pontos
          // rect
          fillColor?: [number, number, number];
          borderColor?: [number, number, number];
          borderWidth?: number;
          // text
          text?: string;
          fontSize?: number;
          fontFamily?: string;
          bold?: boolean;
          italic?: boolean;
          textColor?: [number, number, number];
          // image
          imgData?: Uint8Array;
          imgExt?: string;
        }

        const elements: MappedElement[] = [];

        // Função recursiva para visitar todos os nós do DOM da página
        const walkNode = (el: HTMLElement) => {
          if (!el || !el.getBoundingClientRect) return;

          const rect = el.getBoundingClientRect();
          // Posição relativa ao topo-esquerdo da página
          const relX = rect.left - pageRect.left;
          const relY = rect.top  - pageRect.top;
          const elW  = rect.width;
          const elH  = rect.height;

          // Ignora elementos completamente fora da página
          if (relX + elW < 0 || relY + elH < 0 || relX > pagePx.w || relY > pagePx.h) return;

          const style = window.getComputedStyle(el);
          const tag = el.tagName?.toLowerCase() || '';

          // ── IMAGENS ──────────────────────────────────────────────────────
          if (tag === 'img') {
            const src = (el as HTMLImageElement).src;
            if (src && elW > 2 && elH > 2) {
              // Converte via canvas para obter bytes
              try {
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(elW * 2);  // 2x para qualidade
                canvas.height = Math.round(elH * 2);
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(el as HTMLImageElement, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                  const b64 = dataUrl.split(',')[1];
                  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
                  elements.push({
                    type: 'image',
                    x: relX * PX_TO_PT,
                    y: toPdfY(relY, elH),
                    w: elW * PX_TO_PT,
                    h: elH * PX_TO_PT,
                    imgData: bytes,
                    imgExt: 'jpg',
                  });
                }
              } catch (e) {
                console.warn('[WordToPdf] Erro ao capturar imagem:', e);
              }
            }
            return; // não desce filhos de <img>
          }

          // ── FUNDOS / BORDAS (células de tabela, divs coloridos) ──────────
          const bgColor = style.backgroundColor;
          const hasBackground = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
          const borderTop = parseFloat(style.borderTopWidth) || 0;
          const hasBorder = borderTop > 0 || parseFloat(style.borderLeftWidth) > 0;

          if ((hasBackground || hasBorder) && elW > 1 && elH > 1) {
            const xPt = relX * PX_TO_PT;
            const yPt = toPdfY(relY, elH);
            const wPt = elW * PX_TO_PT;
            const hPt = elH * PX_TO_PT;

            const mapped: MappedElement = {
              type: 'rect',
              x: xPt, y: yPt, w: wPt, h: hPt
            };

            if (hasBackground) {
              const [r, g, b] = parseCssColor(bgColor);
              // Ignora branco puro (economiza operações)
              if (!(r > 0.98 && g > 0.98 && b > 0.98)) {
                mapped.fillColor = [r, g, b];
              }
            }

            if (hasBorder) {
              const bc = style.borderTopColor || 'rgb(0,0,0)';
              mapped.borderColor = parseCssColor(bc);
              mapped.borderWidth = borderTop * PX_TO_PT;
            }

            if (mapped.fillColor || mapped.borderColor) {
              elements.push(mapped);
            }
          }

          // ── TEXTO ─────────────────────────────────────────────────────────
          // Só lemos text nodes diretos (não containers)
          for (const child of Array.from(el.childNodes)) {
            if (child.nodeType !== Node.TEXT_NODE) continue;
            const text = cleanWinAnsi(child.textContent || '');
            if (!text.trim()) continue;

            // Usa a posição do elemento pai como posição do texto
            const fontSize = parseFloat(style.fontSize) || 11;
            const fontFamily = style.fontFamily || 'Helvetica';
            const fontWeight = style.fontWeight;
            const fontStyle = style.fontStyle;
            const isBold = parseInt(fontWeight) >= 600 || fontWeight === 'bold';
            const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';
            const colorStr = style.color || 'rgb(0,0,0)';

            elements.push({
              type: 'text',
              x: relX * PX_TO_PT,
              y: toPdfY(relY, elH),
              w: elW * PX_TO_PT,
              h: elH * PX_TO_PT,
              text,
              fontSize: Math.max(6, fontSize * PX_TO_PT),
              fontFamily,
              bold: isBold,
              italic: isItalic,
              textColor: parseCssColor(colorStr),
            });

            totalWordCount += text.split(/\s+/).filter(Boolean).length;
          }

          // ── DESCE NA ÁRVORE ───────────────────────────────────────────────
          for (const child of Array.from(el.children)) {
            walkNode(child as HTMLElement);
          }
        };

        walkNode(pageEl);
        totalParagraphCount += pageEl.querySelectorAll('p, li, td').length;

        // ── PASSO 6: Renderiza elementos no PDF (ordem: rects → images → text)
        const rects  = elements.filter((e) => e.type === 'rect');
        const images = elements.filter((e) => e.type === 'image');
        const texts  = elements.filter((e) => e.type === 'text');

        // Fundos e bordas primeiro
        for (const el of rects) {
          try {
            pdfPage.drawRectangle({
              x: el.x, y: el.y, width: el.w, height: el.h,
              color: el.fillColor ? rgb(...el.fillColor) : undefined,
              borderColor: el.borderColor ? rgb(...el.borderColor) : undefined,
              borderWidth: el.borderWidth,
            });
          } catch (_) {}
        }

        // Imagens depois dos fundos
        for (const el of images) {
          if (!el.imgData) continue;
          try {
            const embedded = await pdfDoc.embedJpg(el.imgData);
            pdfPage.drawImage(embedded, {
              x: el.x, y: el.y, width: el.w, height: el.h
            });
          } catch (e) {
            console.warn('[WordToPdf] Embed imagem falhou:', e);
          }
        }

        // Textos por último (ficam sobre tudo)
        for (const el of texts) {
          if (!el.text?.trim()) continue;
          try {
            const font = getFont(el.fontFamily || '', el.bold || false, el.italic || false);
            const [r, g, b] = el.textColor || [0, 0, 0];

            // Ajusta tamanho se o texto transbordar a caixa
            let sz = el.fontSize || 11;
            const textW = font.widthOfTextAtSize(el.text, sz);
            if (el.w > 0 && textW > el.w * 1.15) {
              sz = Math.max(6, sz * (el.w / textW));
            }

            pdfPage.drawText(el.text, {
              x: el.x,
              y: el.y + 1, // pequeno offset para baseline
              size: sz,
              font,
              color: rgb(r, g, b),
            });
          } catch (_) {}
        }
      }

      const pdfBytes = await pdfDoc.save();

      return {
        pdfBytes,
        pageCount: pdfDoc.getPageCount(),
        wordCount: totalWordCount || 1,
        paragraphCount: totalParagraphCount || 1,
      };

    } finally {
      // Limpa o container oculto sempre
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    }
  }
}
