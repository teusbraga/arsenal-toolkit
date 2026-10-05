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


/**
 * Normaliza font-family: remove aspas, pega a primeira família, lowercase.
 * Ex: '"Calibri", sans-serif' → 'calibri'
 *     "'Times New Roman', serif" → 'times new roman'
 */
function normalizeFontFamily(fontFamily: string): string {
  if (!fontFamily) return '';
  // Pega apenas a primeira família (antes da vírgula)
  const first = fontFamily.split(',')[0];
  // Remove aspas simples e duplas
  return first.replace(/['"]/g, '').trim().toLowerCase();
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
   *
   * Precisão de estilos:
   * - Tamanho: getComputedStyle().fontSize sempre em px → conversão exata para pt
   * - Negrito: getComputedStyle().fontWeight → '700' ou '400' (numérico)
   * - Itálico: getComputedStyle().fontStyle → 'italic' / 'normal'
   * - Cor: getComputedStyle().color → sempre 'rgb(r, g, b)'
   * - Fonte: normalizada e mapeada para família mais próxima disponível em PDF
   */
  static async convertDocxToPdf(
    arrayBuffer: ArrayBuffer,
    options?: { onProgress?: (current: number, total: number) => void }
  ): Promise<DocxConversionResult> {

    // ─── PASSO 1: Renderiza DOCX no DOM oculto ─────────────────────────────
    const safeBuffer = arrayBuffer.slice(0);

    // Cria elemento <style> separado no <head> para que o CSS do docx-preview
    // seja processado com prioridade máxima de cascata (CSS em <head> > CSS em <div>)
    const styleEl = document.createElement('style');
    document.head.appendChild(styleEl);

    // Container oculto fora do viewport com posição ABSOLUTA para que o browser
    // calcule o layout completo (getBoundingClientRect funciona em elementos fixos)
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: -99999px;
      left: 0px;
      width: 794px;
      min-height: 1px;
      background: white;
      overflow: visible;
      pointer-events: none;
      z-index: -9999;
    `;
    document.body.appendChild(container);

    try {
      // renderAsync aceita Blob | ArrayBuffer (não Uint8Array diretamente)
      const docxBlob = new Blob([safeBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      // Passa styleEl como styleContainer separado para que o CSS vá para o <head>
      // e se aplique com cascata global corretamente
      await docxPreview.renderAsync(docxBlob, container, styleEl, {
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
      await new Promise((r) => setTimeout(r, 600));

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
        console.error('[WordToPdf] HTML gerado pelo docx-preview:', container.innerHTML.substring(0, 500));
        throw new Error('docx-preview não gerou nenhuma página.');
      }

      // ─── PASSO 3: Inicializa PDF ──────────────────────────────────────────
      const pdfDoc = await PDFDocument.create();

      // Fontes vetoriais embutidas (as únicas disponíveis sem embed externo)
      const fonts = {
        regular:        await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold:           await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        italic:         await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        boldItalic:     await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
        times:          await pdfDoc.embedFont(StandardFonts.TimesRoman),
        timesBold:      await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
        timesItalic:    await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
        timesBoldItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
        courier:        await pdfDoc.embedFont(StandardFonts.Courier),
        courierBold:    await pdfDoc.embedFont(StandardFonts.CourierBold),
        courierItalic:  await pdfDoc.embedFont(StandardFonts.CourierOblique),
        courierBoldItalic: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
      };

      /**
       * Mapeia font-family normalizada para a fonte PDF mais próxima.
       * Lógica: mono → Courier | serif → Times | cursive/script → TimesItalic | default → Helvetica
       */
      const getFont = (fontFamily: string, bold: boolean, italic: boolean) => {
        const fn = normalizeFontFamily(fontFamily);

        // Monoespaçadas
        if (fn.includes('courier') || fn.includes('mono') || fn.includes('consolas') ||
            fn.includes('lucida console') || fn.includes('menlo') || fn.includes('inconsolata') ||
            fn.includes('fira') || fn.includes('source code')) {
          if (bold && italic) return fonts.courierBoldItalic;
          if (bold) return fonts.courierBold;
          if (italic) return fonts.courierItalic;
          return fonts.courier;
        }

        // Serifadas: Times New Roman, Georgia, Garamond, Palatino, Cambria, Baskerville, etc.
        if (fn.includes('times') || fn.includes('roman') || fn.includes('georgia') ||
            fn.includes('garamond') || fn.includes('palatino') || fn.includes('antiqua') ||
            fn.includes('cambria') || fn.includes('baskerville') || fn.includes('didot') ||
            fn.includes('bodoni') || fn.includes('constantia') || fn.includes('book antiqua')) {
          if (bold && italic) return fonts.timesBoldItalic;
          if (bold) return fonts.timesBold;
          if (italic) return fonts.timesItalic;
          return fonts.times;
        }

        // Cursivas / Caligráficas / Manuscritas → TimesItalic (o mais próximo disponível)
        if (fn.includes('script') || fn.includes('forte') || fn.includes('calisto') ||
            fn.includes('hand') || fn.includes('brush') || fn.includes('cursive') ||
            fn.includes('edwardian') || fn.includes('freestyle') || fn.includes('kristen') ||
            fn.includes('comic') || fn.includes('papyrus') || fn.includes('segoe script')) {
          return bold ? fonts.timesBoldItalic : fonts.timesItalic;
        }

        // Sans-Serif padrão: Arial, Calibri, Aptos, Helvetica, Segoe UI, Tahoma, Verdana, etc.
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
        pdfPage.drawRectangle({ x: 0, y: 0, width: pagePt.w, height: pagePt.h, color: rgb(1, 1, 1) });

        /**
         * Converte coordenada Y do DOM (px, origem no topo da página)
         * para coordenada Y do PDF (pt, origem na base da página)
         */
        const toPdfY = (domYFromPageTop: number, elementHeightPx: number) =>
          pagePt.h - (domYFromPageTop + elementHeightPx) * PX_TO_PT;

        // ── PASSO 5: Mapeamento cartesiano de TODOS os elementos ────────────
        interface MappedElement {
          type: 'rect' | 'text' | 'image';
          x: number; y: number; w: number; h: number; // em pontos
          fillColor?: [number, number, number];
          borderColor?: [number, number, number];
          borderWidth?: number;
          text?: string;
          fontSize?: number;
          fontFamily?: string;
          bold?: boolean;
          italic?: boolean;
          textColor?: [number, number, number];
          imgData?: Uint8Array;
          imgExt?: string;
        }

        const elements: MappedElement[] = [];

        // Função recursiva para visitar todos os nós do DOM da página
        const walkNode = (el: HTMLElement) => {
          if (!el || !el.getBoundingClientRect) return;

          const rect = el.getBoundingClientRect();
          const relX = rect.left - pageRect.left;
          const relY = rect.top  - pageRect.top;
          const elW  = rect.width;
          const elH  = rect.height;

          // Ignora elementos completamente fora da página
          if (relX + elW < -5 || relY + elH < -5 || relX > pagePx.w + 5 || relY > pagePx.h + 5) return;

          // getComputedStyle resolve TODA a cascata CSS:
          // classes docx-preview + inline styles + herança — resultado final garantido
          const cs = window.getComputedStyle(el);
          const tag = el.tagName?.toLowerCase() || '';

          // ── IMAGENS ──────────────────────────────────────────────────────
          if (tag === 'img') {
            const src = (el as HTMLImageElement).src;
            if (src && elW > 2 && elH > 2) {
              try {
                const canvas = document.createElement('canvas');
                canvas.width  = Math.round(elW * 2); // 2x resolução
                canvas.height = Math.round(elH * 2);
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(el as HTMLImageElement, 0, 0, canvas.width, canvas.height);
                  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
                  const b64 = dataUrl.split(',')[1];
                  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
                  elements.push({
                    type: 'image',
                    x: relX * PX_TO_PT, y: toPdfY(relY, elH),
                    w: elW * PX_TO_PT,  h: elH * PX_TO_PT,
                    imgData: bytes, imgExt: 'jpg',
                  });
                }
              } catch (e) {
                console.warn('[WordToPdf] Erro ao capturar imagem:', e);
              }
            }
            return;
          }

          // ── FUNDOS / BORDAS (células de tabela, divs coloridos) ──────────
          const bgColor = cs.backgroundColor;
          const hasBackground = bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent';
          const borderTopW = parseFloat(cs.borderTopWidth) || 0;
          const borderLeftW = parseFloat(cs.borderLeftWidth) || 0;
          const hasBorder = borderTopW > 0.1 || borderLeftW > 0.1;

          if ((hasBackground || hasBorder) && elW > 1 && elH > 1) {
            const mapped: MappedElement = {
              type: 'rect',
              x: relX * PX_TO_PT, y: toPdfY(relY, elH),
              w: elW * PX_TO_PT,  h: elH * PX_TO_PT,
            };

            if (hasBackground) {
              const [r, g, b] = parseCssColor(bgColor);
              if (!(r > 0.98 && g > 0.98 && b > 0.98)) {
                mapped.fillColor = [r, g, b];
              }
            }

            if (hasBorder) {
              mapped.borderColor = parseCssColor(cs.borderTopColor || 'rgb(0,0,0)');
              mapped.borderWidth = borderTopW * PX_TO_PT;
            }

            if (mapped.fillColor || mapped.borderColor) {
              elements.push(mapped);
            }
          }

          // ── TEXTO ─────────────────────────────────────────────────────────
          // Percorremos apenas text nodes filhos diretos deste elemento
          for (const child of Array.from(el.childNodes)) {
            if (child.nodeType !== Node.TEXT_NODE) continue;
            const text = cleanWinAnsi(child.textContent || '');
            if (!text.trim()) continue;

            // ── TAMANHO ──────────────────────────────────────────────────────
            // getComputedStyle().fontSize retorna SEMPRE em 'px' (ex: "14.67px")
            // Isso é a conversão que o browser faz de 11pt → 14.67px a 96dpi
            // Nós revertemos: 14.67px * (72/96) = 11pt  → PERFEITO
            const fontSizePx = parseFloat(cs.fontSize) || 12;
            const fontSizePt = Math.max(6, fontSizePx * PX_TO_PT);

            // ── NEGRITO ───────────────────────────────────────────────────────
            // getComputedStyle().fontWeight sempre retorna um número (ex: "700" ou "400")
            // 100–599 = normal, 600–900 = bold (700 = bold padrão)
            const fontWeightNum = parseInt(cs.fontWeight, 10) || 400;
            const isBold = fontWeightNum >= 600;

            // ── ITÁLICO ───────────────────────────────────────────────────────
            // getComputedStyle().fontStyle retorna 'italic', 'oblique' ou 'normal'
            const isItalic = cs.fontStyle === 'italic' || cs.fontStyle === 'oblique';

            // ── COR ───────────────────────────────────────────────────────────
            // getComputedStyle().color retorna SEMPRE 'rgb(r, g, b)' ou 'rgba(r, g, b, a)'
            // Nunca retorna 'transparent' para texto (padrão: rgb(0, 0, 0) = preto)
            const colorStr = cs.color || 'rgb(0, 0, 0)';

            // ── FONTE ─────────────────────────────────────────────────────────
            // getComputedStyle().fontFamily retorna ex: '"Calibri", sans-serif'
            // normalizeFontFamily() extrai e limpa o primeiro nome
            const fontFamily = cs.fontFamily || 'Helvetica';

            elements.push({
              type: 'text',
              x: relX * PX_TO_PT,
              y: toPdfY(relY, elH),
              w: elW * PX_TO_PT,
              h: elH * PX_TO_PT,
              text,
              fontSize: fontSizePt,
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

        // 1. Fundos e bordas (base)
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

        // 2. Imagens
        for (const el of images) {
          if (!el.imgData) continue;
          try {
            const embedded = await pdfDoc.embedJpg(el.imgData);
            pdfPage.drawImage(embedded, { x: el.x, y: el.y, width: el.w, height: el.h });
          } catch (e) {
            console.warn('[WordToPdf] Embed imagem falhou:', e);
          }
        }

        // 3. Textos (topo)
        for (const el of texts) {
          if (!el.text?.trim()) continue;
          try {
            const font = getFont(el.fontFamily || '', el.bold || false, el.italic || false);
            const [r, g, b] = el.textColor || [0, 0, 0];
            const sz = el.fontSize || 11;

            // Baseline offset: em PDF o Y é a baseline da fonte, não o topo do elemento
            // A altura da caixa em px convertida para pt dá a referência do topo
            // Descemos um pouco do topo (ascent ≈ 80% da altura da linha)
            const yBaseline = el.y + el.h * 0.15;

            pdfPage.drawText(el.text, {
              x: el.x,
              y: yBaseline,
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
      // Limpa sempre: container do body + style do head
      if (container.parentNode) document.body.removeChild(container);
      if (styleEl.parentNode) document.head.removeChild(styleEl);
    }
  }
}
