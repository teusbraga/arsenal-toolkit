import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import { PdfService, PdfEditItem } from './pdf.service';
import { historyManager } from '../../core/history/history.manager';

// Inicializa o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

type ToolType = 'move' | 'eyedropper' | 'rect_white' | 'rect_black' | 'text' | 'image' | 'signature';

interface UIEditItem {
  id: string;
  type: 'rect' | 'text' | 'image';
  xRatio: number;
  yRatio: number;
  wRatio?: number;
  hRatio?: number;
  color: string;
  text?: string;
  fontSizeRatio?: number;
  weight?: 'normal' | 'bold';
  fontFamily?: string;
  maskRectId?: string;
  dataUrl?: string; // Para imagens/assinaturas
}

interface NativeTextLine {
  id: string;
  str: string;
  xRatio: number;
  yRatio: number;
  wRatio: number;
  hRatio: number;
  fontSizeRatio: number;
  fontSize: number;
  fontFace: string;
  isBold: boolean;
  isItalic: boolean;
  colorHex: string;
  bgHex: string;
  isEdited: boolean;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toH = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`.toUpperCase();
}

function normalizeFontName(fontName: string): { fontFace: string; isBold: boolean; isItalic: boolean } {
  const fn = (fontName || '').toLowerCase();
  const isBold = fn.includes('bold') || fn.includes('black') || fn.includes('heavy') || fn.includes('bolder');
  const isItalic = fn.includes('italic') || fn.includes('oblique');

  let fontFace = 'Helvetica, Arial, sans-serif';
  if (fn.includes('times') || fn.includes('roman') || fn.includes('serif')) {
    fontFace = '"Times New Roman", Times, Georgia, serif';
  } else if (fn.includes('courier') || fn.includes('mono') || fn.includes('code')) {
    fontFace = '"Courier New", Courier, monospace';
  } else if (fn.includes('calibri')) {
    fontFace = 'Calibri, Arial, sans-serif';
  } else if (fn.includes('arial')) {
    fontFace = 'Arial, sans-serif';
  }

  return { fontFace, isBold, isItalic };
}

function sampleLocalBgColor(
  ctx: CanvasRenderingContext2D,
  pixelX: number,
  pixelY: number,
  pixelW: number,
  pixelH: number,
  canvasW: number,
  canvasH: number
): string {
  try {
    const rx = Math.max(0, Math.min(canvasW - 1, Math.floor(pixelX)));
    const ry = Math.max(0, Math.min(canvasH - 1, Math.floor(pixelY)));
    const rw = Math.max(1, Math.min(canvasW - rx, Math.ceil(pixelW)));
    const rh = Math.max(1, Math.min(canvasH - ry, Math.ceil(pixelH)));

    const imgData = ctx.getImageData(rx, ry, rw, rh).data;
    const corners = [
      0,
      (rw - 1) * 4,
      ((rh - 1) * rw) * 4,
      ((rh - 1) * rw + (rw - 1)) * 4
    ];

    let sumR = 0, sumG = 0, sumB = 0, count = 0;
    for (const offset of corners) {
      if (offset >= 0 && offset + 3 < imgData.length && imgData[offset + 3] > 64) {
        sumR += imgData[offset];
        sumG += imgData[offset + 1];
        sumB += imgData[offset + 2];
        count++;
      }
    }

    if (count > 0) {
      return rgbToHex(sumR / count, sumG / count, sumB / count);
    }
  } catch (e) {
    console.warn('Erro ao amostrar fundo local:', e);
  }
  return '#FFFFFF';
}

function sampleTextColor(
  ctx: CanvasRenderingContext2D,
  pixelX: number,
  pixelY: number,
  pixelW: number,
  pixelH: number,
  canvasW: number,
  canvasH: number,
  bgHex: string
): string {
  try {
    const rx = Math.max(0, Math.min(canvasW - 1, Math.floor(pixelX)));
    const ry = Math.max(0, Math.min(canvasH - 1, Math.floor(pixelY)));
    const rw = Math.max(1, Math.min(canvasW - rx, Math.ceil(pixelW)));
    const rh = Math.max(1, Math.min(canvasH - ry, Math.ceil(pixelH)));

    const imgData = ctx.getImageData(rx, ry, rw, rh).data;
    const bgR = parseInt(bgHex.slice(1, 3), 16) || 255;
    const bgG = parseInt(bgHex.slice(3, 5), 16) || 255;
    const bgB = parseInt(bgHex.slice(5, 7), 16) || 255;

    let bestDist = 0;
    let textR = 0, textG = 0, textB = 0;
    const step = 2;

    for (let y = 0; y < rh; y += step) {
      for (let x = 0; x < rw; x += step) {
        const idx = (y * rw + x) * 4;
        if (imgData[idx + 3] < 128) continue;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
        if (dist > bestDist && dist > 35) {
          bestDist = dist;
          textR = r;
          textG = g;
          textB = b;
        }
      }
    }

    if (bestDist > 35) {
      return rgbToHex(textR, textG, textB);
    }
  } catch {}
  return '#000000';
}

export function renderPdfEdit(container: HTMLElement) {
  let isProcessing = false;
  let selectedFile: File | null = null;
  let loadedBuffer: ArrayBuffer | null = null;
  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  
  let currentPage = 1;
  let totalPages = 1;
  let currentTool: ToolType = 'move';
  const pagesEdits: Record<number, UIEditItem[]> = {};
  const pageNativeTexts: Record<number, NativeTextLine[]> = {};

  // Cor ativa do corretivo e texto
  let activeCorretivoColor = '#FFFFFF';
  let activeTextColor = '#000000';
  let eyedropperTarget: 'corretivo' | 'text' = 'corretivo';
  let selectedItemId: string | null = null;
  let textLayerEnabled = true;

  // Drawing Rect
  let isDrawing = false;
  let currentDrawingId: string | null = null;
  let startX = 0, startY = 0;

  // Dragging Items
  let isDraggingItem = false;
  let dragItemId: string | null = null;
  let dragOffsetX = 0, dragOffsetY = 0;
  
  // Resizing Items
  let isResizingItem = false;
  let resizeItemId: string | null = null;

  // Signature Pad
  let sigIsDrawing = false;
  let sigLastX = 0, sigLastY = 0;

  container.innerHTML = `
    <style>
      #pdf-edit-wrapper ::selection {
        background: rgba(37, 99, 235, 0.35);
        color: inherit;
      }
      .pdf-native-text-item {
        position: absolute;
        color: transparent;
        user-select: text;
        cursor: text;
        white-space: pre;
        transform-origin: 0 0;
        transition: background 0.15s ease, outline 0.15s ease;
      }
      .pdf-native-text-item:hover {
        background: rgba(37, 99, 235, 0.12);
        outline: 1px dashed #2563eb;
        border-radius: 2px;
      }
      .pdf-native-text-item .edit-hint {
        display: none;
        position: absolute;
        top: -22px;
        left: 0;
        background: #2563eb;
        color: #ffffff;
        font-size: 10px;
        font-family: sans-serif;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        z-index: 60;
      }
      .pdf-native-text-item:hover .edit-hint {
        display: block;
      }
      .corretivo-color-chip {
        width: 22px;
        height: 22px;
        border-radius: 4px;
        border: 1px solid var(--border-color);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        cursor: pointer;
        padding: 0;
        display: inline-block;
        transition: transform 0.1s ease;
      }
      .corretivo-color-chip:hover {
        transform: scale(1.1);
      }
    </style>

    <div class="tool-view-header">
      <div class="tool-header-left">
        <button class="btn-back" id="btn-back-pdf-edit" title="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 class="tool-header-title">Editor Visual & Fiel (PDF)</h2>
      </div>
      <button class="btn-favorite" id="btn-fav-pdf-edit" title="Adicionar aos Favoritos">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    </div>

    <div id="pdf-edit-setup-area">
      <div class="dropzone-box" id="pdf-edit-dropzone">
        <svg class="dropzone-icon" xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        <div class="dropzone-text">Arraste seu PDF para editar</div>
        <div class="dropzone-hint">Abre com camada de texto fiel selecionável, conta-gotas de cor exata para corretivo e edição direta</div>
        <input type="file" id="pdf-edit-file-input" accept="application/pdf" style="display: none;" />
      </div>
    </div>

    <div id="pdf-edit-workspace-area" style="display: none; flex-direction: column; gap: 14px;">
      
      <!-- Toolbar Principal -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface); padding: 10px 14px; border-radius: 8px; border: 1px solid var(--border-color); flex-wrap: wrap; gap: 10px;">
        
        <!-- Navegação de Páginas -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-back" id="btn-edit-prev" style="width: 34px; height: 34px; padding: 0;">&lt;</button>
          <span style="font-size: 0.85rem; white-space: nowrap; font-weight: 500;">Pág <span id="pdf-edit-page-num">1</span> de <span id="pdf-edit-page-total">1</span></span>
          <button class="btn-back" id="btn-edit-next" style="width: 34px; height: 34px; padding: 0;">&gt;</button>
        </div>

        <!-- Seletor de Ferramentas -->
        <div class="segmented-tabs" id="pdf-edit-tools" style="background: var(--bg-page); border: 1px solid var(--border-color); flex-wrap: wrap; padding: 2px;">
          
          <button class="tab-btn active" data-tool="move" title="Mover / Selecionar & Editar Texto Fiel">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
            <span style="margin-left: 4px; font-size: 0.8rem;">Mover / Editar</span>
          </button>

          <!-- CONTA-GOTAS (EYEDROPPER) -->
          <button class="tab-btn" data-tool="eyedropper" id="btn-tool-eyedropper" title="Conta-gotas: Clique em qualquer ponto do documento para capturar a cor exata">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1 3 3l-3.8 3.8a2 2 0 0 1-1.4.6H13l-4 4-2-2 4-4v-3.2a2 2 0 0 1 .6-1.4L11 6.8z"/></svg>
            <span style="margin-left: 4px; font-size: 0.8rem;">Conta-gotas</span>
          </button>

          <!-- CORRETIVO COM COR ATIVA -->
          <button class="tab-btn" data-tool="rect_white" id="btn-tool-corretivo" title="Corretivo: Aplica tarja com a cor exata selecionada">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
            <span style="margin-left: 4px; font-size: 0.8rem;">Corretivo</span>
          </button>

          <!-- TARJA PRETA -->
          <button class="tab-btn" data-tool="rect_black" title="Tarja Preta (Censura 100% opaca)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
            <span style="margin-left: 4px; font-size: 0.8rem;">Tarja Preta</span>
          </button>

          <button class="tab-btn" data-tool="text" title="Adicionar Novo Texto">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            <span style="margin-left: 4px; font-size: 0.8rem;">Texto</span>
          </button>

          <button class="tab-btn" data-tool="image" title="Inserir Imagem PNG/JPG">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </button>

          <button class="tab-btn" data-tool="signature" title="Assinatura Livre">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
          </button>
        </div>

        <!-- Cor do Corretivo & Pipeta Rápida -->
        <div style="display: flex; align-items: center; gap: 6px; background: var(--bg-page); border: 1px solid var(--border-color); padding: 3px 8px; border-radius: 6px;" title="Cor ativa do Corretivo">
          <span style="font-size: 0.75rem; color: var(--text-secondary); font-weight: 500;">Fundo:</span>
          <button id="btn-corretivo-swatch" class="corretivo-color-chip" style="background: #ffffff;"></button>
          <input type="color" id="input-corretivo-color" value="#ffffff" style="display: none;" />
          <span id="label-corretivo-hex" style="font-size: 0.75rem; font-family: monospace; font-weight: 600; color: var(--text-primary);">#FFFFFF</span>
          <button id="btn-quick-pipette" title="Capturar cor com conta-gotas agora" style="background: none; border: none; cursor: pointer; padding: 2px; display: flex; align-items: center; color: #2563eb;">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1 3 3l-3.8 3.8a2 2 0 0 1-1.4.6H13l-4 4-2-2 4-4v-3.2a2 2 0 0 1 .6-1.4L11 6.8z"/></svg>
          </button>
        </div>

        <!-- Ações Direitas -->
        <div style="display: flex; gap: 8px; align-items: center;">
          <button class="btn-back" id="btn-convert-all-texts" style="height: 36px; padding: 0 12px; font-size: 0.8rem; border-color: #2563eb; color: #2563eb;" title="Transforma todos os textos desta página em caixas editáveis com fundo correspondente">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><path d="m18 2 4 4-12 12H6v-4L18 2z"/><path d="m14 6 4 4"/></svg>
            Tornar Textos Editáveis
          </button>

          <button class="btn-primary" id="btn-pdf-edit-execute" style="width: auto; padding: 0 16px; height: 36px; font-size: 0.85rem;">
            Salvar Edições
          </button>
        </div>

      </div>
      <input type="file" id="pdf-edit-img-input" accept="image/png, image/jpeg" style="display: none;" />

      <!-- Barra de Formatação de Texto Selecionado -->
      <div id="pdf-edit-format-bar" style="display: none; align-items: center; gap: 10px; background: var(--bg-surface); padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border-color); flex-wrap: wrap;">
        <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
          Texto Selecionado:
        </span>

        <!-- Tamanho da Fonte -->
        <div style="display: flex; align-items: center; gap: 3px;">
          <button class="btn-back" id="btn-font-dec" style="width: 26px; height: 26px; padding: 0; font-weight: bold;" title="Diminuir tamanho">-</button>
          <span id="label-font-size" style="font-size: 0.8rem; font-weight: 600; min-width: 36px; text-align: center;">14pt</span>
          <button class="btn-back" id="btn-font-inc" style="width: 26px; height: 26px; padding: 0; font-weight: bold;" title="Aumentar tamanho">+</button>
        </div>

        <!-- Negrito -->
        <button class="btn-back" id="btn-font-bold" style="width: 26px; height: 26px; padding: 0; font-weight: 800; font-family: serif;" title="Negrito">B</button>

        <!-- Família da Fonte -->
        <select id="select-font-family" class="form-input" style="height: 28px; width: auto; font-size: 0.8rem; padding: 0 6px;">
          <option value="Helvetica, Arial, sans-serif">Helvetica / Arial (Padrão)</option>
          <option value="'Times New Roman', Times, Georgia, serif">Times New Roman (Serif)</option>
          <option value="'Courier New', Courier, monospace">Courier (Mono)</option>
        </select>

        <!-- Cor do Texto -->
        <div style="display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 0.75rem; color: var(--text-secondary);">Cor:</span>
          <input type="color" id="input-text-color" value="#000000" style="width: 24px; height: 24px; padding: 0; border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer; background: none;" title="Mudar cor do texto" />
          <button class="btn-back" id="btn-text-pipette" style="width: 26px; height: 26px; padding: 0;" title="Conta-gotas para cor deste texto">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 1-1h3l9-9"/><path d="M3 21v-3l9-9"/><path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1 3 3l-3.8 3.8a2 2 0 0 1-1.4.6H13l-4 4-2-2 4-4v-3.2a2 2 0 0 1 .6-1.4L11 6.8z"/></svg>
          </button>
        </div>

        <button class="btn-back" id="btn-delete-selected" style="height: 28px; padding: 0 8px; font-size: 0.75rem; color: #ef4444; border-color: #ef4444; margin-left: auto;">
          Excluir
        </button>
      </div>

      <!-- PDF Canvas Container com Camada Fiel e Lupa -->
      <div style="display: flex; justify-content: center; overflow: auto; background: var(--bg-surface); padding: 16px; border: 1px solid var(--border-color); border-radius: 8px;">
        <div id="pdf-edit-wrapper" style="position: relative; box-shadow: 0 4px 14px rgba(0,0,0,0.12); user-select: none;">
          <!-- Canvas Base (Renderização HD do PDF) -->
          <canvas id="pdf-edit-canvas" style="display: block;"></canvas>
          
          <!-- Camada de Texto Fiel (Selecionável e Clicável para Edição Direta) -->
          <div id="pdf-edit-text-layer" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; pointer-events: auto; z-index: 10;"></div>
          
          <!-- Camada de Elementos Editáveis (Tarjas, Corretivos, Textos Novos, Imagens) -->
          <div id="pdf-edit-overlay" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; overflow: hidden; z-index: 20;"></div>

          <!-- LUPA DE AMPLIAÇÃO DO CONTA-GOTAS (Loupe) -->
          <div id="pdf-edit-loupe" style="display: none; position: absolute; width: 110px; height: 110px; border-radius: 50%; box-shadow: 0 6px 20px rgba(0,0,0,0.4); border: 3px solid #ffffff; overflow: hidden; pointer-events: none; z-index: 999; transform: translate(14px, 14px); background: #000;">
            <canvas id="pdf-edit-loupe-canvas" width="110" height="110" style="width: 100%; height: 100%; display: block;"></canvas>
            <!-- Mira Central -->
            <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.85); box-shadow: 0 0 1px #000;"></div>
            <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.85); box-shadow: 0 0 1px #000;"></div>
            <div style="position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; transform: translate(-50%, -50%); border: 1px solid rgba(255,255,255,0.95); box-shadow: 0 0 2px #000;"></div>
            <div id="pdf-edit-loupe-badge" style="position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.85); color: #fff; font-size: 10px; font-family: monospace; font-weight: bold; padding: 2px 6px; border-radius: 4px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">#FFFFFF</div>
          </div>

        </div>
      </div>
      
      <button class="btn-back" id="btn-reset-pdf-edit" style="justify-content: center; height: 40px; font-size: 0.85rem;">
        Descartar e Trocar Arquivo
      </button>

    </div>

    <!-- Toast de Notificação -->
    <div id="pdf-edit-toast" style="display: none; position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: #1e293b; color: #ffffff; padding: 8px 18px; border-radius: 999px; font-size: 0.85rem; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,0.3); z-index: 10000; transition: opacity 0.25s ease; opacity: 0; pointer-events: none;"></div>

    <!-- Signature Modal -->
    <div id="pdf-sig-modal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
      <div style="background:var(--bg-surface); padding:24px; border-radius:8px; width:90%; max-width:500px;">
        <h3 style="margin-top:0;">Assinar Documento</h3>
        <canvas id="pdf-sig-canvas" width="400" height="200" style="border:1px solid var(--border-color); background:#fff; width:100%; touch-action:none; border-radius:4px; cursor:crosshair;"></canvas>
        <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:16px;">
          <button class="btn-back" id="btn-sig-clear">Limpar</button>
          <button class="btn-back" id="btn-sig-cancel">Cancelar</button>
          <button class="btn-primary" id="btn-sig-save">Inserir Assinatura</button>
        </div>
      </div>
    </div>
  `;

  // --- Elementos de UI ---
  const setupArea = container.querySelector('#pdf-edit-setup-area') as HTMLDivElement;
  const workspaceArea = container.querySelector('#pdf-edit-workspace-area') as HTMLDivElement;
  const dropzone = container.querySelector('#pdf-edit-dropzone') as HTMLDivElement;
  const fileInput = container.querySelector('#pdf-edit-file-input') as HTMLInputElement;
  const imgInput = container.querySelector('#pdf-edit-img-input') as HTMLInputElement;
  
  const canvas = container.querySelector('#pdf-edit-canvas') as HTMLCanvasElement;
  const textLayer = container.querySelector('#pdf-edit-text-layer') as HTMLDivElement;
  const overlay = container.querySelector('#pdf-edit-overlay') as HTMLDivElement;
  const wrapper = container.querySelector('#pdf-edit-wrapper') as HTMLDivElement;
  
  // Loupe
  const loupeEl = container.querySelector('#pdf-edit-loupe') as HTMLDivElement;
  const loupeCanvas = container.querySelector('#pdf-edit-loupe-canvas') as HTMLCanvasElement;
  const loupeBadge = container.querySelector('#pdf-edit-loupe-badge') as HTMLDivElement;
  const toastEl = container.querySelector('#pdf-edit-toast') as HTMLDivElement;

  // Corretivo Color Swatches
  const btnCorretivoSwatch = container.querySelector('#btn-corretivo-swatch') as HTMLButtonElement;
  const inputCorretivoColor = container.querySelector('#input-corretivo-color') as HTMLInputElement;
  const labelCorretivoHex = container.querySelector('#label-corretivo-hex') as HTMLSpanElement;
  const btnQuickPipette = container.querySelector('#btn-quick-pipette') as HTMLButtonElement;

  // Barra de Formatação de Texto
  const formatBar = container.querySelector('#pdf-edit-format-bar') as HTMLDivElement;
  const btnFontDec = container.querySelector('#btn-font-dec') as HTMLButtonElement;
  const btnFontInc = container.querySelector('#btn-font-inc') as HTMLButtonElement;
  const labelFontSize = container.querySelector('#label-font-size') as HTMLSpanElement;
  const btnFontBold = container.querySelector('#btn-font-bold') as HTMLButtonElement;
  const selectFontFamily = container.querySelector('#select-font-family') as HTMLSelectElement;
  const inputTextColor = container.querySelector('#input-text-color') as HTMLInputElement;
  const btnTextPipette = container.querySelector('#btn-text-pipette') as HTMLButtonElement;
  const btnDeleteSelected = container.querySelector('#btn-delete-selected') as HTMLButtonElement;
  const btnConvertAllTexts = container.querySelector('#btn-convert-all-texts') as HTMLButtonElement;

  // Modais e Controles
  const sigModal = container.querySelector('#pdf-sig-modal') as HTMLDivElement;
  const sigCanvas = container.querySelector('#pdf-sig-canvas') as HTMLCanvasElement;
  const sigCtx = sigCanvas.getContext('2d');
  const btnSigClear = container.querySelector('#btn-sig-clear') as HTMLButtonElement;
  const btnSigCancel = container.querySelector('#btn-sig-cancel') as HTMLButtonElement;
  const btnSigSave = container.querySelector('#btn-sig-save') as HTMLButtonElement;

  const spanPageNum = container.querySelector('#pdf-edit-page-num') as HTMLSpanElement;
  const spanPageTotal = container.querySelector('#pdf-edit-page-total') as HTMLSpanElement;
  const btnPrev = container.querySelector('#btn-edit-prev') as HTMLButtonElement;
  const btnNext = container.querySelector('#btn-edit-next') as HTMLButtonElement;
  const toolBtns = container.querySelectorAll('#pdf-edit-tools .tab-btn');
  const btnExecute = container.querySelector('#btn-pdf-edit-execute') as HTMLButtonElement;
  const btnReset = container.querySelector('#btn-reset-pdf-edit') as HTMLButtonElement;
  const btnBack = container.querySelector('#btn-back-pdf-edit') as HTMLButtonElement;

  workspaceArea.style.display = 'none';
  btnBack.addEventListener('click', () => { window.location.hash = ''; });

  function showToast(msg: string) {
    toastEl.innerText = msg;
    toastEl.style.display = 'block';
    toastEl.style.opacity = '1';
    setTimeout(() => {
      toastEl.style.opacity = '0';
      setTimeout(() => { toastEl.style.display = 'none'; }, 250);
    }, 2400);
  }

  function setCorretivoColor(hex: string) {
    activeCorretivoColor = hex.toUpperCase();
    btnCorretivoSwatch.style.background = activeCorretivoColor;
    inputCorretivoColor.value = activeCorretivoColor;
    labelCorretivoHex.innerText = activeCorretivoColor;
  }

  btnCorretivoSwatch.addEventListener('click', () => inputCorretivoColor.click());
  inputCorretivoColor.addEventListener('input', () => setCorretivoColor(inputCorretivoColor.value));

  btnQuickPipette.addEventListener('click', () => {
    selectTool('eyedropper');
    eyedropperTarget = 'corretivo';
    showToast('Conta-gotas ativo: Clique no arquivo para capturar a cor exata');
  });

  btnReset.addEventListener('click', () => {
    setupArea.style.display = 'block';
    workspaceArea.style.display = 'none';
    selectedFile = null;
    loadedBuffer = null;
    pdfDoc = null;
    for (const key in pagesEdits) delete pagesEdits[key];
    for (const key in pageNativeTexts) delete pageNativeTexts[key];
    fileInput.value = '';
    selectedItemId = null;
    formatBar.style.display = 'none';
  });

  // --- Seleção de Ferramentas ---
  function selectTool(tool: ToolType) {
    currentTool = tool;
    toolBtns.forEach(b => {
      const tb = (b as HTMLElement).dataset.tool;
      b.classList.toggle('active', tb === tool);
    });

    if (currentTool === 'eyedropper') {
      overlay.style.pointerEvents = 'none';
      textLayer.style.pointerEvents = 'none';
      wrapper.style.cursor = 'crosshair';
      loupeEl.style.display = 'none';
    } else if (currentTool === 'move') {
      overlay.style.pointerEvents = 'auto';
      textLayer.style.pointerEvents = 'auto';
      overlay.style.cursor = 'default';
      wrapper.style.cursor = 'default';
      loupeEl.style.display = 'none';
    } else if (currentTool === 'text') {
      overlay.style.pointerEvents = 'auto';
      textLayer.style.pointerEvents = 'none';
      overlay.style.cursor = 'text';
      wrapper.style.cursor = 'text';
      loupeEl.style.display = 'none';
    } else {
      // Retângulos e tarjas
      overlay.style.pointerEvents = 'auto';
      textLayer.style.pointerEvents = 'none';
      overlay.style.cursor = 'crosshair';
      wrapper.style.cursor = 'crosshair';
      loupeEl.style.display = 'none';
    }

    renderOverlayItems(currentPage);
  }

  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tool = (btn as HTMLElement).dataset.tool as ToolType;
      if (tool === 'image') {
        imgInput.click();
        return;
      }
      if (tool === 'signature') {
        openSignatureModal();
        return;
      }
      selectTool(tool);
    });
  });

  // --- Carregamento de Arquivos ---
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = '#2563eb'; });
  dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--border-color)'; });
  dropzone.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border-color)';
    if (e.dataTransfer?.files?.length) {
      await handleFile(e.dataTransfer.files[0]);
    }
  });
  fileInput.addEventListener('change', async () => {
    if (fileInput.files?.length) {
      await handleFile(fileInput.files[0]);
    }
  });

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return alert('Selecione um arquivo PDF válido.');
    }
    selectedFile = file;
    loadedBuffer = await PdfService.readFileAsArrayBuffer(file);
    
    // REGRA MANDATÓRIA (GEMINI.md): Sempre usar .slice(0) para evitar Detached ArrayBuffer
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(loadedBuffer.slice(0)) });
    pdfDoc = await loadingTask.promise;
    
    currentPage = 1;
    totalPages = pdfDoc.numPages;
    spanPageTotal.innerText = totalPages.toString();
    
    setupArea.style.display = 'none';
    workspaceArea.style.display = 'flex';
    
    await renderPage(currentPage);
  }

  async function renderPage(pageNum: number) {
    if (!pdfDoc) return;
    spanPageNum.innerText = pageNum.toString();
    
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const vp1 = page.getViewport({ scale: 1.0 });
    const pdfW = vp1.width;
    const pdfH = vp1.height;
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const renderContext: any = { canvasContext: context, viewport };
      await page.render(renderContext).promise;
    }
    
    // Extrai o conteúdo de texto nativo com coordenadas e estilos para camada fiel
    try {
      const textContent = await page.getTextContent();
      processNativeText(pageNum, textContent, pdfW, pdfH, context);
    } catch (e) {
      console.warn('Falha ao extrair texto da página:', e);
    }

    renderTextLayer(pageNum);
    renderOverlayItems(pageNum);
  }

  function processNativeText(
    pageNum: number,
    textContent: any,
    pdfW: number,
    pdfH: number,
    ctx: CanvasRenderingContext2D | null
  ) {
    if (pageNativeTexts[pageNum]) return;

    interface RawItem {
      str: string;
      xPt: number;
      yPt: number;
      wPt: number;
      hPt: number;
      fontSize: number;
      fontName: string;
    }

    const rawList: RawItem[] = [];
    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const fs = Math.round(Math.hypot(item.transform[0], item.transform[1]) || item.height || 12);
      rawList.push({
        str: item.str,
        xPt: item.transform[4],
        yPt: item.transform[5],
        wPt: item.width || (item.str.length * fs * 0.5),
        hPt: fs,
        fontSize: fs,
        fontName: item.fontName || ''
      });
    }

    // Ordenação cartesiana visual: de cima para baixo, da esquerda para a direita
    rawList.sort((a, b) => {
      if (Math.abs(a.yPt - b.yPt) <= 3) return a.xPt - b.xPt;
      return b.yPt - a.yPt;
    });

    // Mescla itens na mesma linha para permitir seleção fluida de frases inteiras
    const merged: RawItem[] = [];
    for (const it of rawList) {
      const prev = merged[merged.length - 1];
      if (
        prev &&
        Math.abs(prev.yPt - it.yPt) <= 3 &&
        it.xPt - (prev.xPt + prev.wPt) < prev.fontSize * 1.6 &&
        Math.abs(prev.fontSize - it.fontSize) <= 2
      ) {
        prev.str += ' ' + it.str;
        prev.wPt = (it.xPt + it.wPt) - prev.xPt;
      } else {
        merged.push({ ...it });
      }
    }

    const lines: NativeTextLine[] = [];
    for (const line of merged) {
      const norm = normalizeFontName(line.fontName);
      const xRatio = line.xPt / pdfW;
      const yRatio = (pdfH - line.yPt - line.fontSize) / pdfH;
      const wRatio = line.wPt / pdfW;
      const hRatio = (line.fontSize * 1.3) / pdfH;
      const fontSizeRatio = line.fontSize / pdfH;

      let bgHex = '#FFFFFF';
      let colorHex = '#000000';
      if (ctx) {
        bgHex = sampleLocalBgColor(
          ctx,
          xRatio * canvas.width,
          yRatio * canvas.height,
          wRatio * canvas.width,
          hRatio * canvas.height,
          canvas.width,
          canvas.height
        );
        colorHex = sampleTextColor(
          ctx,
          xRatio * canvas.width,
          yRatio * canvas.height,
          wRatio * canvas.width,
          hRatio * canvas.height,
          canvas.width,
          canvas.height,
          bgHex
        );
      }

      lines.push({
        id: crypto.randomUUID(),
        str: line.str,
        xRatio,
        yRatio,
        wRatio,
        hRatio,
        fontSizeRatio,
        fontSize: line.fontSize,
        fontFace: norm.fontFace,
        isBold: norm.isBold,
        isItalic: norm.isItalic,
        colorHex,
        bgHex,
        isEdited: false
      });
    }

    pageNativeTexts[pageNum] = lines;
  }

  function renderTextLayer(pageNum: number) {
    textLayer.innerHTML = '';
    if (!textLayerEnabled) return;

    const lines = pageNativeTexts[pageNum] || [];

    for (const line of lines) {
      if (line.isEdited) continue;

      const el = document.createElement('div');
      el.classList.add('pdf-native-text-item');
      el.style.left = `${line.xRatio * 100}%`;
      el.style.top = `${line.yRatio * 100}%`;
      el.style.width = `${line.wRatio * 100}%`;
      el.style.height = `${line.hRatio * 100}%`;
      el.style.fontSize = `${line.fontSizeRatio * canvas.height}px`;
      el.style.fontFamily = line.fontFace;
      if (line.isBold) el.style.fontWeight = 'bold';
      if (line.isItalic) el.style.fontStyle = 'italic';
      el.innerText = line.str;

      const hint = document.createElement('div');
      hint.classList.add('edit-hint');
      hint.innerHTML = '✏️ Clique para editar';
      el.appendChild(hint);

      el.addEventListener('click', (e) => {
        if (currentTool !== 'move') return;
        e.stopPropagation();
        convertTextToEditable(line, pageNum, true);
      });

      textLayer.appendChild(el);
    }
  }

  function convertTextToEditable(line: NativeTextLine, pageNum: number, autoFocus = true) {
    if (!pagesEdits[pageNum]) pagesEdits[pageNum] = [];

    // 1. Cria a máscara corretiva correspondente com a cor exata do fundo sob o texto
    const maskId = crypto.randomUUID();
    pagesEdits[pageNum].push({
      id: maskId,
      type: 'rect',
      xRatio: Math.max(0, line.xRatio - 0.002),
      yRatio: Math.max(0, line.yRatio - 0.002),
      wRatio: line.wRatio + 0.004,
      hRatio: line.hRatio + 0.004,
      color: line.bgHex || activeCorretivoColor
    });

    // 2. Cria o item de texto editável com os atributos fiéis originais
    const textId = crypto.randomUUID();
    const newTextItem: UIEditItem = {
      id: textId,
      type: 'text',
      xRatio: line.xRatio,
      yRatio: line.yRatio,
      color: line.colorHex || '#000000',
      text: line.str,
      fontSizeRatio: line.fontSizeRatio,
      fontFamily: line.fontFace,
      weight: line.isBold ? 'bold' : 'normal',
      maskRectId: maskId
    };
    pagesEdits[pageNum].push(newTextItem);

    line.isEdited = true;
    renderTextLayer(pageNum);
    renderOverlayItems(pageNum);

    if (autoFocus) {
      selectedItemId = textId;
      updateFormatBar(newTextItem);
      setTimeout(() => {
        const textEl = overlay.querySelector(`[data-id="${textId}"] span[contenteditable]`) as HTMLElement;
        if (textEl) {
          textEl.focus();
          const range = document.createRange();
          range.selectNodeContents(textEl);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 50);
    }
  }

  btnConvertAllTexts.addEventListener('click', () => {
    const lines = pageNativeTexts[currentPage] || [];
    let count = 0;
    for (const line of lines) {
      if (line.isEdited) continue;
      convertTextToEditable(line, currentPage, false);
      count++;
    }
    renderTextLayer(currentPage);
    renderOverlayItems(currentPage);
    showToast(`${count} blocos de texto tornados editáveis nesta página!`);
  });

  btnPrev.addEventListener('click', async () => { if (currentPage > 1) await renderPage(--currentPage); });
  btnNext.addEventListener('click', async () => { if (currentPage < totalPages) await renderPage(++currentPage); });

  // --- LÓGICA DO CONTA-GOTAS (EYEDROPPER & LOUPE) ---
  wrapper.addEventListener('mousemove', (e) => {
    if (currentTool !== 'eyedropper') {
      loupeEl.style.display = 'none';
      return;
    }

    const rect = wrapper.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) {
      loupeEl.style.display = 'none';
      return;
    }

    loupeEl.style.display = 'block';

    let posX = mouseX + 14;
    let posY = mouseY + 14;
    if (posX + 120 > rect.width) posX = mouseX - 126;
    if (posY + 120 > rect.height) posY = mouseY - 126;
    loupeEl.style.left = `${posX}px`;
    loupeEl.style.top = `${posY}px`;

    const canvasX = Math.floor(mouseX * (canvas.width / rect.width));
    const canvasY = Math.floor(mouseY * (canvas.height / rect.height));

    const cropSize = 16;
    const half = cropSize / 2;
    const sx = Math.max(0, Math.min(canvas.width - cropSize, canvasX - half));
    const sy = Math.max(0, Math.min(canvas.height - cropSize, canvasY - half));

    const loupeCtx = loupeCanvas.getContext('2d');
    if (loupeCtx) {
      loupeCtx.imageSmoothingEnabled = false;
      loupeCtx.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);
      loupeCtx.drawImage(canvas, sx, sy, cropSize, cropSize, 0, 0, loupeCanvas.width, loupeCanvas.height);
    }

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const p = ctx.getImageData(canvasX, canvasY, 1, 1).data;
      const hex = rgbToHex(p[0], p[1], p[2]);
      loupeBadge.innerText = hex;
      loupeEl.style.borderColor = hex;
    }
  });

  wrapper.addEventListener('mouseleave', () => {
    if (currentTool === 'eyedropper') loupeEl.style.display = 'none';
  });

  wrapper.addEventListener('click', (e) => {
    if (currentTool !== 'eyedropper') return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (mouseX < 0 || mouseX > rect.width || mouseY < 0 || mouseY > rect.height) return;

    const canvasX = Math.floor(mouseX * (canvas.width / rect.width));
    const canvasY = Math.floor(mouseY * (canvas.height / rect.height));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const p = ctx.getImageData(canvasX, canvasY, 1, 1).data;
    const hex = rgbToHex(p[0], p[1], p[2]);

    if (eyedropperTarget === 'corretivo') {
      setCorretivoColor(hex);
      showToast(`Cor capturada: ${hex} (definida no Corretivo)`);
      selectTool('rect_white');
    } else if (eyedropperTarget === 'text') {
      if (selectedItemId) {
        const item = pagesEdits[currentPage]?.find(i => i.id === selectedItemId);
        if (item && item.type === 'text') {
          item.color = hex;
          inputTextColor.value = hex;
          renderOverlayItems(currentPage);
          showToast(`Cor capturada: ${hex} (aplicada ao Texto)`);
        }
      }
      selectTool('move');
    }
  });

  // --- Barra de Formatação de Texto Selecionado ---
  function updateFormatBar(item: UIEditItem) {
    if (item.type !== 'text') {
      formatBar.style.display = 'none';
      return;
    }

    formatBar.style.display = 'flex';
    const ptSize = Math.round((item.fontSizeRatio || 0.02) * (canvas.height / 1.5));
    labelFontSize.innerText = `${ptSize}pt`;
    btnFontBold.style.color = item.weight === 'bold' ? '#2563eb' : 'inherit';
    inputTextColor.value = item.color.startsWith('#') ? item.color : '#000000';
    if (item.fontFamily) selectFontFamily.value = item.fontFamily;
  }

  btnFontDec.addEventListener('click', () => {
    if (!selectedItemId) return;
    const item = pagesEdits[currentPage]?.find(i => i.id === selectedItemId);
    if (item && item.type === 'text') {
      const currentPts = (item.fontSizeRatio || 0.02) * (canvas.height / 1.5);
      const newPts = Math.max(8, currentPts - 2);
      item.fontSizeRatio = newPts / (canvas.height / 1.5);
      updateFormatBar(item);
      renderOverlayItems(currentPage);
    }
  });

  btnFontInc.addEventListener('click', () => {
    if (!selectedItemId) return;
    const item = pagesEdits[currentPage]?.find(i => i.id === selectedItemId);
    if (item && item.type === 'text') {
      const currentPts = (item.fontSizeRatio || 0.02) * (canvas.height / 1.5);
      const newPts = Math.min(72, currentPts + 2);
      item.fontSizeRatio = newPts / (canvas.height / 1.5);
      updateFormatBar(item);
      renderOverlayItems(currentPage);
    }
  });

  btnFontBold.addEventListener('click', () => {
    if (!selectedItemId) return;
    const item = pagesEdits[currentPage]?.find(i => i.id === selectedItemId);
    if (item && item.type === 'text') {
      item.weight = item.weight === 'bold' ? 'normal' : 'bold';
      updateFormatBar(item);
      renderOverlayItems(currentPage);
    }
  });

  selectFontFamily.addEventListener('change', () => {
    if (!selectedItemId) return;
    const item = pagesEdits[currentPage]?.find(i => i.id === selectedItemId);
    if (item && item.type === 'text') {
      item.fontFamily = selectFontFamily.value;
      renderOverlayItems(currentPage);
    }
  });

  inputTextColor.addEventListener('input', () => {
    if (!selectedItemId) return;
    const item = pagesEdits[currentPage]?.find(i => i.id === selectedItemId);
    if (item && item.type === 'text') {
      item.color = inputTextColor.value;
      renderOverlayItems(currentPage);
    }
  });

  btnTextPipette.addEventListener('click', () => {
    selectTool('eyedropper');
    eyedropperTarget = 'text';
    showToast('Conta-gotas ativo: Clique no arquivo para capturar a cor para o texto');
  });

  btnDeleteSelected.addEventListener('click', () => {
    if (!selectedItemId) return;
    const item = pagesEdits[currentPage]?.find(i => i.id === selectedItemId);
    if (item) {
      if (item.maskRectId) {
        pagesEdits[currentPage] = pagesEdits[currentPage].filter(i => i.id !== item.maskRectId);
      }
      pagesEdits[currentPage] = pagesEdits[currentPage].filter(i => i.id !== item.id);
      selectedItemId = null;
      formatBar.style.display = 'none';
      renderOverlayItems(currentPage);
    }
  });

  // --- Image Upload ---
  imgInput.addEventListener('change', () => {
    if (imgInput.files && imgInput.files.length > 0) {
      const file = imgInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxWidthRatio = 0.35;
          let wRatio = img.width / canvas.width;
          let hRatio = img.height / canvas.height;
          
          if (wRatio > maxWidthRatio) {
            const scale = maxWidthRatio / wRatio;
            wRatio = wRatio * scale;
            hRatio = hRatio * scale;
          }

          if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
          pagesEdits[currentPage].push({
            id: crypto.randomUUID(),
            type: 'image',
            dataUrl: dataUrl,
            xRatio: 0.1,
            yRatio: 0.1,
            wRatio: wRatio,
            hRatio: hRatio,
            color: '#FFFFFF'
          });
          selectTool('move');
          renderOverlayItems(currentPage);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
    imgInput.value = '';
  });

  // --- Signature Pad Logic ---
  function openSignatureModal() {
    sigModal.style.display = 'flex';
    if (sigCtx) {
      sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
      sigCtx.lineWidth = 3;
      sigCtx.lineCap = 'round';
      sigCtx.strokeStyle = '#000000';
    }
  }

  function getSigPos(e: MouseEvent | TouchEvent) {
    const rect = sigCanvas.getBoundingClientRect();
    const evt = (e as TouchEvent).touches ? (e as TouchEvent).touches[0] : (e as MouseEvent);
    return {
      x: (evt.clientX - rect.left) * (sigCanvas.width / rect.width),
      y: (evt.clientY - rect.top) * (sigCanvas.height / rect.height)
    };
  }

  sigCanvas.addEventListener('mousedown', (e) => { sigIsDrawing = true; const pos = getSigPos(e); sigLastX = pos.x; sigLastY = pos.y; });
  sigCanvas.addEventListener('mousemove', (e) => {
    if (!sigIsDrawing || !sigCtx) return;
    const pos = getSigPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(sigLastX, sigLastY);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
    sigLastX = pos.x;
    sigLastY = pos.y;
  });
  sigCanvas.addEventListener('mouseup', () => sigIsDrawing = false);
  sigCanvas.addEventListener('mouseout', () => sigIsDrawing = false);

  sigCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); sigIsDrawing = true; const pos = getSigPos(e); sigLastX = pos.x; sigLastY = pos.y; });
  sigCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!sigIsDrawing || !sigCtx) return;
    const pos = getSigPos(e);
    sigCtx.beginPath();
    sigCtx.moveTo(sigLastX, sigLastY);
    sigCtx.lineTo(pos.x, pos.y);
    sigCtx.stroke();
    sigLastX = pos.x;
    sigLastY = pos.y;
  });
  sigCanvas.addEventListener('touchend', () => sigIsDrawing = false);

  btnSigClear.addEventListener('click', () => sigCtx?.clearRect(0, 0, sigCanvas.width, sigCanvas.height));
  btnSigCancel.addEventListener('click', () => sigModal.style.display = 'none');
  btnSigSave.addEventListener('click', () => {
    const dataUrl = sigCanvas.toDataURL('image/png');
    const px = sigCtx?.getImageData(0, 0, sigCanvas.width, sigCanvas.height).data;
    let isEmpty = true;
    if (px) {
      for (let i = 3; i < px.length; i += 4) { if (px[i] !== 0) { isEmpty = false; break; } }
    }
    if (isEmpty) return alert('Assinatura vazia.');

    if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
    pagesEdits[currentPage].push({
      id: crypto.randomUUID(),
      type: 'image',
      dataUrl: dataUrl,
      xRatio: 0.1,
      yRatio: 0.1,
      wRatio: 0.22,
      hRatio: 0.11,
      color: '#FFFFFF'
    });
    
    selectTool('move');
    sigModal.style.display = 'none';
    renderOverlayItems(currentPage);
  });

  // --- Desenho e Edição de Itens no Overlay ---
  overlay.addEventListener('mousedown', (e) => {
    if ((e.target as HTMLElement).closest('.pdf-edit-item')) return;
    
    if (currentTool === 'rect_white' || currentTool === 'rect_black') {
      isDrawing = true;
      const rect = overlay.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      
      currentDrawingId = crypto.randomUUID();
      
      if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
      pagesEdits[currentPage].push({
        id: currentDrawingId,
        type: 'rect',
        xRatio: startX / rect.width,
        yRatio: startY / rect.height,
        wRatio: 0,
        hRatio: 0,
        color: currentTool === 'rect_white' ? activeCorretivoColor : '#000000'
      });
      renderOverlayItems(currentPage);
    }
  });

  overlay.addEventListener('mousemove', (e) => {
    const rect = overlay.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    if (isDrawing && currentDrawingId) {
      const item = pagesEdits[currentPage]?.find(i => i.id === currentDrawingId);
      if (item && item.type === 'rect') {
        const w = currentX - startX;
        const h = currentY - startY;
        const originX = w < 0 ? currentX : startX;
        const originY = h < 0 ? currentY : startY;
        
        item.xRatio = originX / rect.width;
        item.yRatio = originY / rect.height;
        item.wRatio = Math.abs(w) / rect.width;
        item.hRatio = Math.abs(h) / rect.height;
        
        renderOverlayItems(currentPage);
      }
      return;
    }

    if (isDraggingItem && dragItemId) {
      const item = pagesEdits[currentPage]?.find(i => i.id === dragItemId);
      if (item) {
        item.xRatio = (currentX - dragOffsetX) / rect.width;
        item.yRatio = (currentY - dragOffsetY) / rect.height;
        renderOverlayItems(currentPage);
      }
      return;
    }

    if (isResizingItem && resizeItemId) {
      const item = pagesEdits[currentPage]?.find(i => i.id === resizeItemId);
      if (item) {
        const newW = currentX - (item.xRatio * rect.width);
        const newH = currentY - (item.yRatio * rect.height);
        
        if (newW > 10) item.wRatio = newW / rect.width;
        if (newH > 10) item.hRatio = newH / rect.height;
        renderOverlayItems(currentPage);
      }
      return;
    }
  });

  window.addEventListener('mouseup', () => {
    if (isDrawing) { isDrawing = false; currentDrawingId = null; return; }
    if (isDraggingItem) { isDraggingItem = false; dragItemId = null; return; }
    if (isResizingItem) { isResizingItem = false; resizeItemId = null; return; }
  });

  overlay.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.pdf-edit-item')) return;
    
    if (currentTool === 'text') {
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newId = crypto.randomUUID();
      if (!pagesEdits[currentPage]) pagesEdits[currentPage] = [];
      const newItem: UIEditItem = {
        id: newId,
        type: 'text',
        xRatio: x / rect.width,
        yRatio: y / rect.height,
        color: activeTextColor || '#000000',
        text: 'Novo texto',
        fontSizeRatio: 16 / (canvas.height / 1.5)
      };
      pagesEdits[currentPage].push(newItem);
      
      selectTool('move');
      selectedItemId = newId;
      updateFormatBar(newItem);
      renderOverlayItems(currentPage);

      setTimeout(() => {
        const textEl = overlay.querySelector(`[data-id="${newId}"] span[contenteditable]`) as HTMLElement;
        if (textEl) {
          textEl.focus();
          const range = document.createRange();
          range.selectNodeContents(textEl);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      }, 50);
    }
  });

  // --- Renderização de Itens no Overlay ---
  function renderOverlayItems(pageNum: number) {
    overlay.innerHTML = '';
    const items = pagesEdits[pageNum] || [];
    
    items.forEach(item => {
      const el = document.createElement('div');
      el.classList.add('pdf-edit-item');
      el.dataset.id = item.id;
      el.style.position = 'absolute';
      el.style.left = `${item.xRatio * 100}%`;
      el.style.top = `${item.yRatio * 100}%`;
      
      const isSelected = selectedItemId === item.id;

      if (currentTool === 'move') {
        el.style.cursor = 'move';
        el.addEventListener('mousedown', (e) => {
          if ((e.target as HTMLElement).classList.contains('resize-handle') || (e.target as HTMLElement).classList.contains('del-btn')) return;
          isDraggingItem = true;
          dragItemId = item.id;
          selectedItemId = item.id;
          updateFormatBar(item);
          const rect = overlay.getBoundingClientRect();
          dragOffsetX = (e.clientX - rect.left) - (item.xRatio * rect.width);
          dragOffsetY = (e.clientY - rect.top) - (item.yRatio * rect.height);
          e.stopPropagation();
        });
      }

      if (item.type === 'rect') {
        el.style.width = `${(item.wRatio || 0) * 100}%`;
        el.style.height = `${(item.hRatio || 0) * 100}%`;
        el.style.backgroundColor = item.color;
        if (currentTool === 'move') {
          el.style.border = isSelected ? '2px solid #2563eb' : '1px solid rgba(37, 99, 235, 0.4)';
        }
      } else if (item.type === 'image') {
        el.style.width = `${(item.wRatio || 0) * 100}%`;
        el.style.height = `${(item.hRatio || 0) * 100}%`;
        el.style.backgroundImage = `url(${item.dataUrl})`;
        el.style.backgroundSize = '100% 100%';
        if (currentTool === 'move') {
          el.style.border = isSelected ? '2px dashed #2563eb' : '1px dashed #2563eb';
        }
      } else if (item.type === 'text') {
        el.style.color = item.color;
        el.style.fontSize = `${(item.fontSizeRatio || 0.02) * (canvas.height / 1.5) * 1.5}px`;
        el.style.whiteSpace = 'nowrap';
        el.style.fontFamily = item.fontFamily || 'Helvetica, Arial, sans-serif';
        if (item.weight === 'bold') el.style.fontWeight = 'bold';
        
        const input = document.createElement('span');
        input.contentEditable = currentTool === 'move' ? 'true' : 'false';
        input.innerText = item.text || '';
        input.style.outline = 'none';
        input.style.minWidth = '20px';
        input.style.display = 'inline-block';
        
        input.addEventListener('input', () => { item.text = input.innerText; });
        input.addEventListener('focus', () => {
          selectedItemId = item.id;
          updateFormatBar(item);
        });
        el.appendChild(input);
        
        if (currentTool === 'move') {
          el.style.border = isSelected ? '1.5px dashed #2563eb' : '1px dashed rgba(37, 99, 235, 0.5)';
          el.style.background = isSelected ? 'rgba(37, 99, 235, 0.06)' : 'transparent';
          el.style.padding = '1px 3px';
        }
      }

      if (currentTool === 'move') {
        const delBtn = document.createElement('button');
        delBtn.classList.add('del-btn');
        delBtn.innerHTML = '&times;';
        delBtn.title = 'Remover este elemento';
        delBtn.style.position = 'absolute';
        delBtn.style.right = '-10px';
        delBtn.style.top = '-10px';
        delBtn.style.background = '#ef4444';
        delBtn.style.color = 'white';
        delBtn.style.border = 'none';
        delBtn.style.borderRadius = '50%';
        delBtn.style.width = '20px';
        delBtn.style.height = '20px';
        delBtn.style.cursor = 'pointer';
        delBtn.style.display = 'flex';
        delBtn.style.alignItems = 'center';
        delBtn.style.justifyContent = 'center';
        delBtn.style.zIndex = '100';
        delBtn.style.fontSize = '14px';
        delBtn.style.lineHeight = '1';
        
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (item.maskRectId) {
            pagesEdits[pageNum] = pagesEdits[pageNum].filter(i => i.id !== item.maskRectId);
          }
          pagesEdits[pageNum] = pagesEdits[pageNum].filter(i => i.id !== item.id);
          if (selectedItemId === item.id) {
            selectedItemId = null;
            formatBar.style.display = 'none';
          }
          renderOverlayItems(pageNum);
        });
        el.appendChild(delBtn);

        if (item.type === 'rect' || item.type === 'image') {
          const resizer = document.createElement('div');
          resizer.classList.add('resize-handle');
          resizer.style.position = 'absolute';
          resizer.style.right = '-5px';
          resizer.style.bottom = '-5px';
          resizer.style.width = '10px';
          resizer.style.height = '10px';
          resizer.style.background = '#2563eb';
          resizer.style.cursor = 'se-resize';
          resizer.style.borderRadius = '50%';
          
          resizer.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizingItem = true;
            resizeItemId = item.id;
          });
          el.appendChild(resizer);
        }
      }
      
      overlay.appendChild(el);
    });
  }

  // --- Execução e Download do PDF Editado ---
  btnExecute.addEventListener('click', async () => {
    if (!selectedFile || !pdfDoc || isProcessing) return;
    
    isProcessing = true;
    const originalText = btnExecute.innerHTML;
    btnExecute.disabled = true;
    btnExecute.innerHTML = 'Salvando PDF...';
    
    try {
      const editsForService: Record<number, PdfEditItem[]> = {};
      
      for (const pageIdxStr in pagesEdits) {
        const pIdx = parseInt(pageIdxStr, 10);
        const page = await pdfDoc.getPage(pIdx);
        const vp = page.getViewport({ scale: 1.0 });
        const pdfW = vp.width;
        const pdfH = vp.height;
        
        const uiItems = pagesEdits[pIdx];
        if (!uiItems || uiItems.length === 0) continue;
        
        editsForService[pIdx - 1] = uiItems.map(ui => {
          if (ui.type === 'rect') {
            const wPts = (ui.wRatio || 0) * pdfW;
            const hPts = (ui.hRatio || 0) * pdfH;
            return {
              type: 'rect',
              x: ui.xRatio * pdfW,
              y: pdfH - (ui.yRatio * pdfH) - hPts,
              width: wPts,
              height: hPts,
              color: ui.color
            } as PdfEditItem;
          } else if (ui.type === 'image') {
            const wPts = (ui.wRatio || 0) * pdfW;
            const hPts = (ui.hRatio || 0) * pdfH;
            return {
              type: 'image',
              dataUrl: ui.dataUrl || '',
              x: ui.xRatio * pdfW,
              y: pdfH - (ui.yRatio * pdfH) - hPts,
              width: wPts,
              height: hPts,
            } as PdfEditItem;
          } else {
            const sizePts = (ui.fontSizeRatio || 0.02) * pdfH;
            return {
              type: 'text',
              text: ui.text || '',
              x: ui.xRatio * pdfW,
              y: pdfH - (ui.yRatio * pdfH) - (sizePts * 0.82),
              size: sizePts,
              color: ui.color,
              weight: ui.weight || 'normal',
              font: ui.fontFamily || 'Helvetica'
            } as PdfEditItem;
          }
        });
      }
      
      // REGRA MANDATÓRIA (GEMINI.md): Sempre usar cópia clonada com .slice(0)
      const fileBuffer = (await selectedFile.arrayBuffer()).slice(0);
      const newPdfBytes = await PdfService.applyEdits(fileBuffer, editsForService);
      
      const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedFile.name.replace(/\.[^/.]+$/, "")}_editado.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      historyManager.record('pdf-edit', 'pdf', 'Editor Visual & Fiel', selectedFile.name, 'PDF editado salvo com sucesso', {});
      showToast('PDF editado com sucesso e baixado!');
      
    } catch (err) {
      console.error(err);
      alert('Erro ao aplicar edições no PDF.');
    } finally {
      isProcessing = false;
      btnExecute.disabled = false;
      btnExecute.innerHTML = originalText;
    }
  });
}
