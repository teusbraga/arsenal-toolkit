import pptxgen from 'pptxgenjs';

/**
 * CÓPIA EXATA DO MOTOR AGRESSIVO DE PDF -> PPTX
 * Recuperado do transcript histórico (Passos 1087, 1113, 1133, 1137).
 * Utiliza pptxgenjs + OperatorList + CTM + addText + addShape + addImage.
 */
export class AggressiveEnginePptx {
  static async pdfToPptx(
    arrayBuffer: ArrayBuffer,
    pdfjsLib: any,
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

    const pres = new pptxgen();
    let isLayoutSet = false;

    for (let p = 1; p <= numPages; p++) {
      if (options?.onProgress) options.onProgress(p, numPages);
      const page = await pdf.getPage(p);
      const vp = page.getViewport({ scale: 1.0 });

      if (!isLayoutSet) {
        const widthInches = vp.width / 72;
        const heightInches = vp.height / 72;
        pres.defineLayout({ name: 'custom_layout', width: widthInches, height: heightInches });
        pres.layout = 'custom_layout';
        isLayoutSet = true;
      }

      const slide = pres.addSlide();

      if (mode === 'visual') {
        const vp2 = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = vp2.width;
        canvas.height = vp2.height;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({ canvasContext: ctx, viewport: vp2 } as any).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        slide.addImage({ data: dataUrl, x: 0, y: 0, w: vp.width / 72, h: vp.height / 72 });
      } else {
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
           if (raw.color && raw.color.length === 3) {
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
        
        // 1. Textos Nativos
        for (const box of mergedLines) {
           const xInches = box.xPt / 72;
           const yInches = (vp.height - box.yPt - box.fontSize) / 72;
           const wInches = box.wPt / 72;
           const hInches = (box.fontSize * 1.5) / 72;
           
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
               w: wInches + 0.1, 
               h: hInches,
               fontSize: box.fontSize,
               fontFace: fontFace,
               bold: box.bold,
               italic: box.italic,
               color: box.colorHex,
               valign: 'top',
               margin: 0,
               wrap: true
           });
        }

        // 2. Extração Agressiva de Formas Vetoriais e Imagens via OperatorList
        try {
          const opList = await page.getOperatorList();
          let ctm = [1, 0, 0, 1, 0, 0];
          let strokeColor = '000000';
          let fillColor = 'FFFFFF';
          let currentPath: any[] = [];
          const stateStack: number[][] = [];

          for (let i = 0; i < opList.fnArray.length; i++) {
            const fn = opList.fnArray[i];
            const args = opList.argsArray[i];

            if (fn === pdfjsLib.OPS.save) {
              stateStack.push([...ctm]);
            } else if (fn === pdfjsLib.OPS.restore) {
              ctm = stateStack.pop() || ctm;
            } else if (fn === pdfjsLib.OPS.transform) {
              const m1 = ctm;
              const m2 = args;
              ctm = [
                m1[0] * m2[0] + m1[2] * m2[1],
                m1[1] * m2[0] + m1[3] * m2[1],
                m1[0] * m2[2] + m1[2] * m2[3],
                m1[1] * m2[2] + m1[3] * m2[3],
                m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
                m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
              ];
            } else if (fn === pdfjsLib.OPS.setStrokeRGBColor) {
              strokeColor = args.map((c: number) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
            } else if (fn === pdfjsLib.OPS.setFillRGBColor) {
              fillColor = args.map((c: number) => Math.round(c * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
            } else if (fn === pdfjsLib.OPS.constructPath) {
              const pathOps = args[0];
              const pathArgs = args[1];
              let argsIdx = 0;
              for (let j = 0; j < pathOps.length; j++) {
                const op = pathOps[j];
                if (op === 1 || op === 2) argsIdx += 2;
                else if (op === 3) argsIdx += 6;
                else if (op === 4 || op === 5) argsIdx += 4;
                else if (op === 7) {
                  currentPath.push({ type: 'rect', x: pathArgs[argsIdx], y: pathArgs[argsIdx+1], w: pathArgs[argsIdx+2], h: pathArgs[argsIdx+3] });
                  argsIdx += 4;
                }
              }
            } else if (fn === pdfjsLib.OPS.stroke || fn === pdfjsLib.OPS.fill || fn === pdfjsLib.OPS.eoFill || fn === pdfjsLib.OPS.fillStroke || fn === pdfjsLib.OPS.eoFillStroke) {
              if (currentPath.length > 0) {
                for (const shape of currentPath) {
                  if (shape.type === 'rect') {
                    const ptX = shape.x * ctm[0] + shape.y * ctm[2] + ctm[4];
                    const ptY = shape.x * ctm[1] + shape.y * ctm[3] + ctm[5];
                    const ptW = shape.w * ctm[0];
                    const ptH = shape.h * ctm[3];
                    const xInches = ptX / 72;
                    const yInches = (vp.height - (ptY + ptH)) / 72;
                    const wInches = Math.abs(ptW) / 72;
                    const hInches = Math.abs(ptH) / 72;
                    if (wInches > 0.05 && hInches > 0.05) {
                      slide.addShape(pres.ShapeType.rect, {
                        x: xInches, y: Math.max(0, yInches), w: wInches, h: hInches,
                        fill: fn !== pdfjsLib.OPS.stroke ? { color: fillColor } : undefined,
                        line: fn !== pdfjsLib.OPS.fill && fn !== pdfjsLib.OPS.eoFill ? { color: strokeColor, width: 1 } : undefined
                      });
                    }
                  }
                }
                currentPath = [];
              }
            } else if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
              const imgArg = args[0];
              let img: any = null;

              if (typeof imgArg === 'string') {
                try {
                  if (page.objs.has(imgArg)) {
                    img = page.objs.get(imgArg);
                  } else {
                    img = await new Promise((resolve) => page.objs.get(imgArg, resolve));
                  }
                } catch {}

                if (!img && (page as any).commonObjs) {
                  try {
                    if ((page as any).commonObjs.has(imgArg)) {
                      img = (page as any).commonObjs.get(imgArg);
                    } else {
                      img = await new Promise((resolve) => (page as any).commonObjs.get(imgArg, resolve));
                    }
                  } catch {}
                }
              } else if (imgArg && typeof imgArg === 'object') {
                img = imgArg;
              }
              
              if (img) {
                const base64 = await AggressiveEnginePptx.extractImageBase64(img);
                if (base64) {
                  const wPt = Math.abs(ctm[0]);
                  const hPt = Math.abs(ctm[3]);
                  const xPt = ctm[4];
                  const yPt = vp.height - ctm[5] - hPt;
                  
                  const xInches = xPt / 72;
                  const yInches = yPt / 72;
                  const wInches = wPt / 72;
                  const hInches = hPt / 72;

                  if (wInches > 0.05 && hInches > 0.05) {
                     slide.addImage({
                        data: `image/png;base64,${base64}`,
                        x: Math.max(0, xInches),
                        y: Math.max(0, yInches),
                        w: wInches,
                        h: hInches
                     });
                  }
                }
              }
            }
          }
        } catch (err) {
           console.warn('Erro ao extrair imagem do slide', err);
        }
      }

      await new Promise((r) => setTimeout(r, 0));
    }

    const pptxBlob = (await pres.write({ outputType: 'blob' })) as Blob;

    return {
      pptxBlob,
      slideCount: numPages,
    };
  }

  static async extractImageBase64(img: any): Promise<string | null> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      if (img.bitmap) {
        canvas.width = img.bitmap.width;
        canvas.height = img.bitmap.height;
        ctx.drawImage(img.bitmap, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      } else if (img.data && img.width && img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
        
        let imageData: ImageData;
        if (img.data.length === img.width * img.height * 4) {
            imageData = new ImageData(new Uint8ClampedArray(img.data), img.width, img.height);
        } else if (img.data.length === img.width * img.height * 3) {
            const rgba = new Uint8ClampedArray(img.width * img.height * 4);
            for (let i = 0, j = 0; i < img.data.length; i += 3, j += 4) {
                rgba[j] = img.data[i];
                rgba[j+1] = img.data[i+1];
                rgba[j+2] = img.data[i+2];
                rgba[j+3] = 255;
            }
            imageData = new ImageData(rgba, img.width, img.height);
        } else {
            return null;
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/png').split(',')[1];
      }
    } catch (e) {
      console.warn('Erro canvas image:', e);
    }
    return null;
  }
}
