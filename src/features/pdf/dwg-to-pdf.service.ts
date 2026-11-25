import {
  readDwg,
  readDxf,
  isBinaryDxf,
  writePdf,
  writeSvg,
  Drawing,
  Entity,
  Color,
  PdfOptions
} from 'nasjidwg';

export type PaperPreset =
  | 'auto'
  | 'a4-landscape'
  | 'a4-portrait'
  | 'a3-landscape'
  | 'a3-portrait'
  | 'a1-landscape'
  | 'a0-landscape';

export type PlotStyle = 'color-light' | 'monochrome' | 'blueprint';

export interface DwgToPdfOptions {
  paper?: PaperPreset;
  plotStyle?: PlotStyle;
  lineWidth?: number;
  margin?: number;
  respectLayerVisibility?: boolean;
}

export interface DwgInspectInfo {
  format: 'DWG' | 'DXF';
  version: string;
  layerCount: number;
  visibleLayerCount: number;
  entityCount: number;
  blockCount: number;
  warningsCount: number;
}

export interface DwgToPdfResult {
  pdfBlob: Blob;
  previewSvg: string;
  info: DwgInspectInfo;
  plottedEntities: number;
  skippedCount: number;
}

const PAPER_DIMENSIONS: Record<PaperPreset, { width: number; height?: number }> = {
  auto: { width: 842 },
  'a4-landscape': { width: 842, height: 595 },
  'a4-portrait': { width: 595, height: 842 },
  'a3-landscape': { width: 1191, height: 842 },
  'a3-portrait': { width: 842, height: 1191 },
  'a1-landscape': { width: 2384, height: 1684 },
  'a0-landscape': { width: 3370, height: 2384 }
};

function isDwgMagic(bytes: Uint8Array): boolean {
  if (bytes.length < 6) return false;
  const sig = String.fromCharCode(
    bytes[0],
    bytes[1],
    bytes[2],
    bytes[3],
    bytes[4],
    bytes[5]
  );
  return sig.startsWith('AC10') || sig.startsWith('MC0.');
}

function parseCadDrawing(buffer: ArrayBuffer, fileName: string): { drawing: Drawing; format: 'DWG' | 'DXF' } {
  const bytes = new Uint8Array(buffer.slice(0));
  const lower = fileName.toLowerCase();

  if (isDwgMagic(bytes) || (lower.endsWith('.dwg') && !isBinaryDxf(bytes))) {
    const drawing = readDwg(bytes);
    return { drawing, format: 'DWG' };
  }

  const drawing = readDxf(bytes);
  return { drawing, format: 'DXF' };
}

function isWhiteOrAdaptiveColor(color: Color): boolean {
  if (color.kind === 'aci') {
    return color.index === 7 || color.index === 255;
  }
  if (color.kind === 'rgb') {
    const r = (color.rgb >> 16) & 0xff;
    const g = (color.rgb >> 8) & 0xff;
    const b = color.rgb & 0xff;
    return r >= 245 && g >= 245 && b >= 245;
  }
  return false;
}

function remapColorForLightPaper(color: Color): Color {
  if (isWhiteOrAdaptiveColor(color)) {
    return { kind: 'rgb', rgb: 0x111111 };
  }
  return color;
}

function cloneEntityForPlot(
  entity: Entity,
  plotStyle: PlotStyle
): Entity {
  if (plotStyle === 'monochrome') {
    return { ...entity, color: { kind: 'rgb', rgb: 0x000000 } };
  }
  if (plotStyle === 'color-light') {
    return { ...entity, color: remapColorForLightPaper(entity.color) };
  }
  return entity;
}

function prepareDrawingForPlot(
  source: Drawing,
  plotStyle: PlotStyle,
  respectLayerVisibility: boolean
): Drawing {
  const hiddenLayers = new Set<string>();
  if (respectLayerVisibility) {
    for (const layer of source.layers) {
      if (!layer.on || layer.frozen) {
        hiddenLayers.add(layer.name.toLowerCase());
      }
    }
  }

  const mappedLayers = source.layers.map((layer) => {
    if (plotStyle === 'monochrome') {
      return { ...layer, color: { kind: 'rgb' as const, rgb: 0x000000 } };
    }
    if (plotStyle === 'color-light') {
      return { ...layer, color: remapColorForLightPaper(layer.color) };
    }
    return layer;
  });

  const filterAndMap = (ent: Entity): Entity | null => {
    if (ent.invisible) return null;
    if (respectLayerVisibility && hiddenLayers.has((ent.layer || '0').toLowerCase())) {
      return null;
    }
    return cloneEntityForPlot(ent, plotStyle);
  };

  const entities: Entity[] = [];
  for (const ent of source.entities) {
    const mapped = filterAndMap(ent);
    if (mapped) entities.push(mapped);
  }

  const blocks: Drawing['blocks'] = {};
  for (const [name, blk] of Object.entries(source.blocks || {})) {
    const blkEntities: Entity[] = [];
    for (const ent of blk.entities) {
      const mapped = filterAndMap(ent);
      if (mapped) blkEntities.push(mapped);
    }
    blocks[name] = { ...blk, entities: blkEntities };
  }

  return {
    ...source,
    layers: mappedLayers,
    entities,
    blocks
  };
}

export class DwgToPdfService {
  static inspectFile(buffer: ArrayBuffer, fileName: string): DwgInspectInfo {
    const { drawing, format } = parseCadDrawing(buffer, fileName);
    const visibleLayerCount = drawing.layers.filter((l) => l.on && !l.frozen).length;

    return {
      format,
      version: drawing.header.version || format,
      layerCount: drawing.layers.length,
      visibleLayerCount,
      entityCount: drawing.entities.length,
      blockCount: Object.keys(drawing.blocks || {}).length,
      warningsCount: drawing.warnings.length
    };
  }

  static convertDwgToPdf(
    buffer: ArrayBuffer,
    fileName: string,
    options?: DwgToPdfOptions
  ): DwgToPdfResult {
    const paper: PaperPreset = options?.paper || 'a4-landscape';
    const plotStyle: PlotStyle = options?.plotStyle || 'color-light';
    const lineWidth = options?.lineWidth ?? 0.65;
    const margin = options?.margin ?? 24;
    const respectLayerVisibility = options?.respectLayerVisibility ?? true;

    const { drawing, format } = parseCadDrawing(buffer, fileName);
    const visibleLayerCount = drawing.layers.filter((l) => l.on && !l.frozen).length;

    const plotDrawing = prepareDrawingForPlot(drawing, plotStyle, respectLayerVisibility);
    const dims = PAPER_DIMENSIONS[paper] || PAPER_DIMENSIONS['a4-landscape'];

    const isBlueprint = plotStyle === 'blueprint';
    const pdfOpts: PdfOptions = {
      width: dims.width,
      height: dims.height,
      margin,
      lineWidth,
      monochrome: plotStyle === 'monochrome',
      background: isBlueprint ? 0x0f172a : 0xffffff,
      stroke: isBlueprint ? 0xf8fafc : 0x111111,
      center: dims.height != null
    };

    const pdfRes = writePdf(plotDrawing, pdfOpts);
    const copy = new Uint8Array(pdfRes.data.byteLength);
    copy.set(pdfRes.data);
    const pdfBlob = new Blob([copy.buffer], { type: 'application/pdf' });

    const previewSvg = writeSvg(plotDrawing, {
      width: 900,
      background: isBlueprint ? '#0f172a' : '#ffffff',
      stroke: isBlueprint ? '#f8fafc' : '#111111',
      strokeWidth: 1
    });

    return {
      pdfBlob,
      previewSvg,
      info: {
        format,
        version: drawing.header.version || format,
        layerCount: drawing.layers.length,
        visibleLayerCount,
        entityCount: drawing.entities.length,
        blockCount: Object.keys(drawing.blocks || {}).length,
        warningsCount: drawing.warnings.length
      },
      plottedEntities: plotDrawing.entities.length,
      skippedCount: pdfRes.skipped.length
    };
  }
}
