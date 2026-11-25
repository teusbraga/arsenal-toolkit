import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import {
  emptyDrawing,
  writeDwg2018,
  writeDwg2004,
  writeDwg2000,
  writeDwgR12,
  writeDxf,
  writeSvg,
  nearestAci,
  drawingBounds,
  Drawing,
  Entity,
  Color,
  Point2,
  PolylineVertex
} from 'nasjidwg';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export type CadVersion = '2018' | '2004' | '2000' | 'r12' | 'dxf';
export type CadUnit = 'mm' | 'cm' | 'm' | 'in' | 'pt';

export interface PdfToDwgOptions {
  version?: CadVersion;
  unit?: CadUnit;
  pagesMode?: 'all' | 'single';
  pageNumber?: number;
  includeText?: boolean;
  includeFills?: boolean;
  includePageFrames?: boolean;
  onProgress?: (current: number, total: number) => void;
}

export interface PdfToDwgStats {
  lines: number;
  polylines: number;
  hatches: number;
  texts: number;
  totalEntities: number;
  skipped: number;
  rasterImagesDetected: number;
}

export interface PdfToDwgResult {
  blob: Blob;
  dxfBlob: Blob;
  fileExtension: 'dwg' | 'dxf';
  previewSvg: string;
  pageCount: number;
  processedPages: number;
  stats: PdfToDwgStats;
}

interface GraphicsState {
  ctm: [number, number, number, number, number, number];
  strokeRgb: number;
  fillRgb: number;
  strokeTransparent: boolean;
  fillTransparent: boolean;
  lineWidth: number;
}

interface Subpath {
  points: Point2[];
  closed: boolean;
  hasCurves: boolean;
}

const DrawOPS = {
  moveTo: 0,
  lineTo: 1,
  curveTo: 2,
  quadraticCurveTo: 3,
  closePath: 4
} as const;

const UNIT_CONFIG: Record<CadUnit, { scale: number; insUnits: number }> = {
  mm: { scale: 25.4 / 72, insUnits: 4 },
  cm: { scale: 2.54 / 72, insUnits: 5 },
  m: { scale: 0.0254 / 72, insUnits: 6 },
  in: { scale: 1 / 72, insUnits: 1 },
  pt: { scale: 1, insUnits: 0 }
};

function multiplyMatrices(
  m1: readonly number[],
  m2: readonly number[]
): [number, number, number, number, number, number] {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5]
  ];
}

function applyMatrix(m: readonly number[], x: number, y: number): Point2 {
  return {
    x: m[0] * x + m[2] * y + m[4],
    y: m[1] * x + m[3] * y + m[5]
  };
}

function parseColorValue(arg: unknown): number | null {
  if (typeof arg === 'string') {
    const hex = arg.trim();
    if (hex.startsWith('#')) {
      if (hex.length === 7) {
        const parsed = parseInt(hex.slice(1), 16);
        return Number.isFinite(parsed) ? parsed : null;
      }
      if (hex.length === 4) {
        const r = parseInt(hex[1] + hex[1], 16);
        const g = parseInt(hex[2] + hex[2], 16);
        const b = parseInt(hex[3] + hex[3], 16);
        return (r << 16) | (g << 8) | b;
      }
    }
  }
  return null;
}

function rgbComponentsToInt(r: number, g: number, b: number): number {
  const norm = r <= 1 && g <= 1 && b <= 1 ? 255 : 1;
  const rc = Math.max(0, Math.min(255, Math.round(r * norm)));
  const gc = Math.max(0, Math.min(255, Math.round(g * norm)));
  const bc = Math.max(0, Math.min(255, Math.round(b * norm)));
  return (rc << 16) | (gc << 8) | bc;
}

function resolveCadColor(rgbInt: number): Color {
  const r = (rgbInt >> 16) & 0xff;
  const g = (rgbInt >> 8) & 0xff;
  const b = rgbInt & 0xff;
  // Preto/cinza muito escuro no papel vira ACI 7 (adaptativo no fundo escuro do AutoCAD)
  if (r < 32 && g < 32 && b < 32) {
    return { kind: 'aci', index: 7 };
  }
  return { kind: 'aci', index: nearestAci(rgbInt) };
}

function distSq(a: Point2, b: Point2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function appendUniquePoint(pts: Point2[], pt: Point2): void {
  if (pts.length === 0 || distSq(pts[pts.length - 1], pt) > 1e-8) {
    pts.push(pt);
  }
}

function sampleCubicBezier(
  p0: Point2,
  p1: Point2,
  p2: Point2,
  p3: Point2,
  unitScale: number
): Point2[] {
  const chordLen =
    Math.hypot(p1.x - p0.x, p1.y - p0.y) +
    Math.hypot(p2.x - p1.x, p2.y - p1.y) +
    Math.hypot(p3.x - p2.x, p3.y - p2.y);
  const steps = Math.max(6, Math.min(24, Math.ceil(chordLen / Math.max(0.5, 2 * unitScale))));
  const out: Point2[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    out.push({
      x: mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
      y: mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
    });
  }
  return out;
}

function sampleQuadraticBezier(p0: Point2, p1: Point2, p2: Point2, unitScale: number): Point2[] {
  const chordLen =
    Math.hypot(p1.x - p0.x, p1.y - p0.y) + Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const steps = Math.max(4, Math.min(18, Math.ceil(chordLen / Math.max(0.5, 2 * unitScale))));
  const out: Point2[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    out.push({
      x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
      y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
    });
  }
  return out;
}

function encodeDrawing(drawing: Drawing, version: CadVersion): { blob: Blob; skipped: number } {
  if (version === 'dxf') {
    const dxfText = writeDxf(drawing);
    return { blob: new Blob([dxfText], { type: 'application/dxf' }), skipped: 0 };
  }

  let res;
  switch (version) {
    case '2004':
      res = writeDwg2004(drawing);
      break;
    case '2000':
      res = writeDwg2000(drawing);
      break;
    case 'r12':
      res = writeDwgR12(drawing);
      break;
    case '2018':
    default:
      res = writeDwg2018(drawing);
      break;
  }

  const copy = new Uint8Array(res.data.byteLength);
  copy.set(res.data);
  return {
    blob: new Blob([copy.buffer], { type: 'application/acad' }),
    skipped: res.skipped.length
  };
}

export class PdfToDwgService {
  static async getPageCount(arrayBuffer: ArrayBuffer): Promise<number> {
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
    return pdf.numPages;
  }

  static async convertPdfToDwg(
    arrayBuffer: ArrayBuffer,
    options?: PdfToDwgOptions
  ): Promise<PdfToDwgResult> {
    const version: CadVersion = options?.version || '2018';
    const unit: CadUnit = options?.unit || 'mm';
    const pagesMode = options?.pagesMode || 'all';
    const includeText = options?.includeText ?? true;
    const includeFills = options?.includeFills ?? true;
    const includePageFrames = options?.includePageFrames ?? true;

    const { scale: unitScale, insUnits } = UNIT_CONFIG[unit];

    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise;
    const totalPages = pdf.numPages;

    const targetPages: number[] =
      pagesMode === 'single'
        ? [Math.max(1, Math.min(totalPages, options?.pageNumber || 1))]
        : Array.from({ length: totalPages }, (_, idx) => idx + 1);

    const drawing = emptyDrawing();
    drawing.header.insUnits = insUnits;

    drawing.layers.push(
      { name: 'PDF_MOLDURA', color: { kind: 'aci', index: 8 }, on: true, frozen: false, locked: false },
      { name: 'PDF_GEOMETRIA', color: { kind: 'aci', index: 7 }, on: true, frozen: false, locked: false },
      { name: 'PDF_CURVAS', color: { kind: 'aci', index: 4 }, on: true, frozen: false, locked: false },
      { name: 'PDF_PREENCHIMENTOS', color: { kind: 'aci', index: 9 }, on: true, frozen: false, locked: false },
      { name: 'PDF_TEXTOS', color: { kind: 'aci', index: 3 }, on: true, frozen: false, locked: false }
    );

    const stats: PdfToDwgStats = {
      lines: 0,
      polylines: 0,
      hatches: 0,
      texts: 0,
      totalEntities: 0,
      skipped: 0,
      rasterImagesDetected: 0
    };

    const OPS = pdfjsLib.OPS;
    let runningOffsetX = 0;

    for (let idx = 0; idx < targetPages.length; idx++) {
      const pageNum = targetPages[idx];
      options?.onProgress?.(idx + 1, targetPages.length);

      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidthCad = viewport.width * unitScale;
      const pageHeightCad = viewport.height * unitScale;
      const pageOffsetX = runningOffsetX;

      const toCadPoint = (pdfX: number, pdfY: number): Point2 => {
        const vpPt = applyMatrix(viewport.transform, pdfX, pdfY);
        return {
          x: pageOffsetX + vpPt.x * unitScale,
          y: (viewport.height - vpPt.y) * unitScale
        };
      };

      if (includePageFrames) {
        drawing.entities.push({
          type: 'polyline',
          layer: 'PDF_MOLDURA',
          color: { kind: 'byLayer' },
          closed: true,
          vertices: [
            { x: pageOffsetX, y: 0 },
            { x: pageOffsetX + pageWidthCad, y: 0 },
            { x: pageOffsetX + pageWidthCad, y: pageHeightCad },
            { x: pageOffsetX, y: pageHeightCad }
          ]
        });
        stats.polylines++;
      }

      const opList = await page.getOperatorList();
      const stateStack: GraphicsState[] = [];
      let state: GraphicsState = {
        ctm: [1, 0, 0, 1, 0, 0],
        strokeRgb: 0x000000,
        fillRgb: 0x000000,
        strokeTransparent: false,
        fillTransparent: false,
        lineWidth: 1
      };

      let pendingSubpaths: Subpath[] = [];
      let currentSubpath: Subpath | null = null;
      let currentPt: Point2 = { x: 0, y: 0 };

      const createSubpath = (startPt: Point2): Subpath => {
        const sp: Subpath = { points: [startPt], closed: false, hasCurves: false };
        pendingSubpaths.push(sp);
        currentPt = startPt;
        return sp;
      };

      const emitPathEntities = (subpaths: Subpath[], paintOp: number) => {
        const hasStroke =
          paintOp === OPS.stroke ||
          paintOp === OPS.closeStroke ||
          paintOp === OPS.fillStroke ||
          paintOp === OPS.eoFillStroke ||
          paintOp === OPS.closeFillStroke ||
          paintOp === OPS.closeEOFillStroke;

        const hasFill =
          paintOp === OPS.fill ||
          paintOp === OPS.eoFill ||
          paintOp === OPS.fillStroke ||
          paintOp === OPS.eoFillStroke ||
          paintOp === OPS.closeFillStroke ||
          paintOp === OPS.closeEOFillStroke;

        const forceClose =
          paintOp === OPS.closeStroke ||
          paintOp === OPS.closeFillStroke ||
          paintOp === OPS.closeEOFillStroke;

        for (const sp of subpaths) {
          if (sp.points.length < 2) continue;

          // Remove ponto final duplicado se igual ao inicial e fechado
          const pts = sp.points.slice();
          const isClosed = sp.closed || forceClose;
          if (isClosed && pts.length > 2 && distSq(pts[0], pts[pts.length - 1]) < 1e-8) {
            pts.pop();
          }
          if (pts.length < 2) continue;

          if (hasFill && !state.fillTransparent && pts.length >= 3) {
            // Ignora retangulo de fundo branco cobrindo a folha inteira
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;
            for (const p of pts) {
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            }
            const fillArea = (maxX - minX) * (maxY - minY);
            const pageArea = pageWidthCad * pageHeightCad;
            const isNearWhite =
              ((state.fillRgb >> 16) & 0xff) > 245 &&
              ((state.fillRgb >> 8) & 0xff) > 245 &&
              (state.fillRgb & 0xff) > 245;

            if (!(isNearWhite && pageArea > 0 && fillArea > pageArea * 0.85)) {
              const vertices: PolylineVertex[] = pts.map((p) => ({ x: p.x, y: p.y }));
              if (includeFills && version !== 'r12') {
                drawing.entities.push({
                  type: 'hatch',
                  layer: 'PDF_PREENCHIMENTOS',
                  color: resolveCadColor(state.fillRgb),
                  patternName: 'SOLID',
                  solid: true,
                  angle: 0,
                  scale: 1,
                  loops: [
                    {
                      kind: 'polyline',
                      closed: true,
                      external: true,
                      vertices
                    }
                  ]
                });
                stats.hatches++;
              } else if (!hasStroke) {
                drawing.entities.push({
                  type: 'polyline',
                  layer: 'PDF_PREENCHIMENTOS',
                  color: resolveCadColor(state.fillRgb),
                  closed: true,
                  vertices
                });
                stats.polylines++;
              }
            }
          }

          if (hasStroke && !state.strokeTransparent) {
            const color = resolveCadColor(state.strokeRgb);
            const layer = sp.hasCurves ? 'PDF_CURVAS' : 'PDF_GEOMETRIA';

            if (!isClosed && pts.length === 2) {
              if (distSq(pts[0], pts[1]) > 1e-8) {
                drawing.entities.push({
                  type: 'line',
                  layer,
                  color,
                  start: { x: pts[0].x, y: pts[0].y, z: 0 },
                  end: { x: pts[1].x, y: pts[1].y, z: 0 }
                });
                stats.lines++;
              }
            } else {
              drawing.entities.push({
                type: 'polyline',
                layer,
                color,
                closed: isClosed,
                vertices: pts.map((p) => ({ x: p.x, y: p.y }))
              });
              stats.polylines++;
            }
          }
        }
      };

      const transformAndToCad = (x: number, y: number): Point2 => {
        const pdfPt = applyMatrix(state.ctm, x, y);
        return toCadPoint(pdfPt.x, pdfPt.y);
      };

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i] || [];

        switch (fn) {
          case OPS.save: {
            stateStack.push({
              ...state,
              ctm: [...state.ctm] as [number, number, number, number, number, number]
            });
            break;
          }
          case OPS.restore: {
            const prev = stateStack.pop();
            if (prev) state = prev;
            break;
          }
          case OPS.transform: {
            if (args.length >= 6) {
              state.ctm = multiplyMatrices(state.ctm, args as number[]);
            }
            break;
          }
          case OPS.paintFormXObjectBegin: {
            stateStack.push({
              ...state,
              ctm: [...state.ctm] as [number, number, number, number, number, number]
            });
            if (Array.isArray(args[0]) && args[0].length >= 6) {
              state.ctm = multiplyMatrices(state.ctm, args[0] as number[]);
            }
            break;
          }
          case OPS.paintFormXObjectEnd: {
            const prev = stateStack.pop();
            if (prev) state = prev;
            break;
          }
          case OPS.setLineWidth: {
            if (typeof args[0] === 'number') state.lineWidth = args[0];
            break;
          }
          case OPS.setStrokeRGBColor: {
            const parsed = parseColorValue(args[0]);
            if (parsed !== null) {
              state.strokeRgb = parsed;
              state.strokeTransparent = false;
            } else if (args.length >= 3) {
              state.strokeRgb = rgbComponentsToInt(Number(args[0]), Number(args[1]), Number(args[2]));
              state.strokeTransparent = false;
            }
            break;
          }
          case OPS.setFillRGBColor: {
            const parsed = parseColorValue(args[0]);
            if (parsed !== null) {
              state.fillRgb = parsed;
              state.fillTransparent = false;
            } else if (args.length >= 3) {
              state.fillRgb = rgbComponentsToInt(Number(args[0]), Number(args[1]), Number(args[2]));
              state.fillTransparent = false;
            }
            break;
          }
          case OPS.setStrokeGray: {
            const g = Number(args[0] ?? 0);
            state.strokeRgb = rgbComponentsToInt(g, g, g);
            state.strokeTransparent = false;
            break;
          }
          case OPS.setFillGray: {
            const g = Number(args[0] ?? 0);
            state.fillRgb = rgbComponentsToInt(g, g, g);
            state.fillTransparent = false;
            break;
          }
          case OPS.setStrokeCMYKColor: {
            if (args.length >= 4) {
              const [c, m, y, k] = args.map(Number);
              state.strokeRgb = rgbComponentsToInt(
                (1 - c) * (1 - k),
                (1 - m) * (1 - k),
                (1 - y) * (1 - k)
              );
              state.strokeTransparent = false;
            }
            break;
          }
          case OPS.setFillCMYKColor: {
            if (args.length >= 4) {
              const [c, m, y, k] = args.map(Number);
              state.fillRgb = rgbComponentsToInt(
                (1 - c) * (1 - k),
                (1 - m) * (1 - k),
                (1 - y) * (1 - k)
              );
              state.fillTransparent = false;
            }
            break;
          }
          case OPS.setStrokeTransparent: {
            state.strokeTransparent = true;
            break;
          }
          case OPS.setFillTransparent: {
            state.fillTransparent = true;
            break;
          }
          case OPS.constructPath: {
            const paintOp = args[0] as number;
            const pathDataArr = args[1] as Array<ArrayLike<number>> | undefined;
            const rawData = pathDataArr?.[0];
            if (!rawData || typeof rawData.length !== 'number') break;

            const subpaths: Subpath[] = [];
            let sp: Subpath | null = null;
            let cursor: Point2 = { x: 0, y: 0 };

            let k = 0;
            while (k < rawData.length) {
              const subOp = rawData[k++];
              switch (subOp) {
                case DrawOPS.moveTo: {
                  const pt = transformAndToCad(rawData[k++], rawData[k++]);
                  sp = { points: [pt], closed: false, hasCurves: false };
                  subpaths.push(sp);
                  cursor = pt;
                  break;
                }
                case DrawOPS.lineTo: {
                  const pt = transformAndToCad(rawData[k++], rawData[k++]);
                  if (!sp) {
                    sp = { points: [cursor], closed: false, hasCurves: false };
                    subpaths.push(sp);
                  }
                  appendUniquePoint(sp.points, pt);
                  cursor = pt;
                  break;
                }
                case DrawOPS.curveTo: {
                  const p1 = transformAndToCad(rawData[k++], rawData[k++]);
                  const p2 = transformAndToCad(rawData[k++], rawData[k++]);
                  const p3 = transformAndToCad(rawData[k++], rawData[k++]);
                  if (!sp) {
                    sp = { points: [cursor], closed: false, hasCurves: true };
                    subpaths.push(sp);
                  }
                  sp.hasCurves = true;
                  for (const sample of sampleCubicBezier(cursor, p1, p2, p3, unitScale)) {
                    appendUniquePoint(sp.points, sample);
                  }
                  cursor = p3;
                  break;
                }
                case DrawOPS.quadraticCurveTo: {
                  const p1 = transformAndToCad(rawData[k++], rawData[k++]);
                  const p2 = transformAndToCad(rawData[k++], rawData[k++]);
                  if (!sp) {
                    sp = { points: [cursor], closed: false, hasCurves: true };
                    subpaths.push(sp);
                  }
                  sp.hasCurves = true;
                  for (const sample of sampleQuadraticBezier(cursor, p1, p2, unitScale)) {
                    appendUniquePoint(sp.points, sample);
                  }
                  cursor = p2;
                  break;
                }
                case DrawOPS.closePath: {
                  if (sp) {
                    sp.closed = true;
                    if (sp.points.length > 0) cursor = sp.points[0];
                  }
                  break;
                }
              }
            }

            emitPathEntities(subpaths, paintOp);
            break;
          }
          case OPS.moveTo: {
            currentSubpath = createSubpath(transformAndToCad(args[0], args[1]));
            break;
          }
          case OPS.lineTo: {
            const pt = transformAndToCad(args[0], args[1]);
            if (!currentSubpath) currentSubpath = createSubpath(currentPt);
            appendUniquePoint(currentSubpath.points, pt);
            currentPt = pt;
            break;
          }
          case OPS.curveTo: {
            const p1 = transformAndToCad(args[0], args[1]);
            const p2 = transformAndToCad(args[2], args[3]);
            const p3 = transformAndToCad(args[4], args[5]);
            if (!currentSubpath) currentSubpath = createSubpath(currentPt);
            currentSubpath.hasCurves = true;
            for (const sample of sampleCubicBezier(currentPt, p1, p2, p3, unitScale)) {
              appendUniquePoint(currentSubpath.points, sample);
            }
            currentPt = p3;
            break;
          }
          case OPS.curveTo2: {
            const p2 = transformAndToCad(args[0], args[1]);
            const p3 = transformAndToCad(args[2], args[3]);
            if (!currentSubpath) currentSubpath = createSubpath(currentPt);
            currentSubpath.hasCurves = true;
            for (const sample of sampleCubicBezier(currentPt, currentPt, p2, p3, unitScale)) {
              appendUniquePoint(currentSubpath.points, sample);
            }
            currentPt = p3;
            break;
          }
          case OPS.curveTo3: {
            const p1 = transformAndToCad(args[0], args[1]);
            const p3 = transformAndToCad(args[2], args[3]);
            if (!currentSubpath) currentSubpath = createSubpath(currentPt);
            currentSubpath.hasCurves = true;
            for (const sample of sampleCubicBezier(currentPt, p1, p3, p3, unitScale)) {
              appendUniquePoint(currentSubpath.points, sample);
            }
            currentPt = p3;
            break;
          }
          case OPS.rectangle: {
            const x = Number(args[0]);
            const y = Number(args[1]);
            const w = Number(args[2]);
            const h = Number(args[3]);
            pendingSubpaths.push({
              points: [
                transformAndToCad(x, y),
                transformAndToCad(x + w, y),
                transformAndToCad(x + w, y + h),
                transformAndToCad(x, y + h)
              ],
              closed: true,
              hasCurves: false
            });
            currentSubpath = null;
            break;
          }
          case OPS.closePath: {
            if (currentSubpath) {
              currentSubpath.closed = true;
            }
            break;
          }
          case OPS.stroke:
          case OPS.closeStroke:
          case OPS.fill:
          case OPS.eoFill:
          case OPS.fillStroke:
          case OPS.eoFillStroke:
          case OPS.closeFillStroke:
          case OPS.closeEOFillStroke: {
            emitPathEntities(pendingSubpaths, fn);
            pendingSubpaths = [];
            currentSubpath = null;
            break;
          }
          case OPS.endPath: {
            pendingSubpaths = [];
            currentSubpath = null;
            break;
          }
          case OPS.paintImageXObject:
          case OPS.paintInlineImageXObject:
          case OPS.paintImageMaskXObject: {
            stats.rasterImagesDetected++;
            break;
          }
        }
      }

      if (includeText) {
        const textContent = await page.getTextContent();
        for (const rawItem of textContent.items as any[]) {
          const str = typeof rawItem.str === 'string' ? rawItem.str : '';
          if (!str.trim()) continue;

          const tm = rawItem.transform as number[] | undefined;
          if (!tm || tm.length < 6) continue;

          const p0 = toCadPoint(tm[4], tm[5]);
          const pX = toCadPoint(tm[4] + tm[0], tm[5] + tm[1]);
          const pY = toCadPoint(tm[4] + tm[2], tm[5] + tm[3]);

          const rawHeight = Math.hypot(pY.x - p0.x, pY.y - p0.y) || Math.hypot(pX.x - p0.x, pX.y - p0.y);
          const textHeight = Math.max(0.5 * unitScale, rawHeight * 0.85);
          const rotation = Math.atan2(pX.y - p0.y, pX.x - p0.x);

          const textEntity: Entity = {
            type: 'text',
            layer: 'PDF_TEXTOS',
            color: { kind: 'aci', index: 7 },
            position: { x: p0.x, y: p0.y, z: 0 },
            text: str,
            height: textHeight,
            rotation
          };
          drawing.entities.push(textEntity);
          stats.texts++;
        }
      }

      runningOffsetX += (viewport.width + 40) * unitScale;
    }

    const bounds = drawingBounds(drawing);
    if (bounds) {
      drawing.header.extMin = { x: bounds.min.x, y: bounds.min.y, z: 0 };
      drawing.header.extMax = { x: bounds.max.x, y: bounds.max.y, z: 0 };
      drawing.header.limMin = { x: bounds.min.x, y: bounds.min.y };
      drawing.header.limMax = { x: bounds.max.x, y: bounds.max.y };
    }

    const encoded = encodeDrawing(drawing, version);
    const dxfEncoded = version === 'dxf' ? encoded : encodeDrawing(drawing, 'dxf');
    stats.totalEntities = drawing.entities.length;
    stats.skipped = encoded.skipped;

    const previewSvg = writeSvg(drawing, {
      width: 900,
      background: '#0f172a',
      stroke: '#e2e8f0',
      strokeWidth: 1
    });

    return {
      blob: encoded.blob,
      dxfBlob: dxfEncoded.blob,
      fileExtension: version === 'dxf' ? 'dxf' : 'dwg',
      previewSvg,
      pageCount: totalPages,
      processedPages: targetPages.length,
      stats
    };
  }
}
