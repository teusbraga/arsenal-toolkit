/**
 * Algoritmo de Detecção de Bounding Boxes de Regiões Visuais Não-Texto
 */
export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function detectVisualBoundingBoxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gapTolerance: number = 24
): BoundingBox[] {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // 1. Grid de blocos (downsampled) para velocidade máxima (amostragem a cada 4px)
  const step = 4;
  const gridW = Math.ceil(width / step);
  const gridH = Math.ceil(height / step);
  const activeGrid = new Uint8Array(gridW * gridH);

  for (let gy = 0; gy < gridH; gy++) {
    const y = Math.min(height - 1, gy * step);
    for (let gx = 0; gx < gridW; gx++) {
      const x = Math.min(width - 1, gx * step);
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Se não for branco/transparente
      if (a > 30 && (r < 248 || g < 248 || b < 248)) {
        activeGrid[gy * gridW + gx] = 1;
      }
    }
  }

  // 2. Agrupamento de componentes conectados (Connected Components)
  const visited = new Uint8Array(gridW * gridH);
  const boxes: BoundingBox[] = [];
  const tolGrid = Math.ceil(gapTolerance / step);

  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const gIdx = gy * gridW + gx;
      if (activeGrid[gIdx] === 0 || visited[gIdx] === 1) continue;

      // Inicia busca em largura (BFS) para encontrar a região conectada
      let minX = gx;
      let maxX = gx;
      let minY = gy;
      let maxY = gy;

      const queue: [number, number][] = [[gx, gy]];
      visited[gIdx] = 1;

      while (queue.length > 0) {
        const [cx, cy] = queue.pop()!;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // Vizinhos dentro da tolerância de proximidade (para unir linhas de tabela)
        for (let dy = -tolGrid; dy <= tolGrid; dy++) {
          const ny = cy + dy;
          if (ny < 0 || ny >= gridH) continue;
          for (let dx = -tolGrid; dx <= tolGrid; dx++) {
            const nx = cx + dx;
            if (nx < 0 || nx >= gridW) continue;
            const nIdx = ny * gridW + nx;
            if (activeGrid[nIdx] === 1 && visited[nIdx] === 0) {
              visited[nIdx] = 1;
              queue.push([nx, ny]);
            }
          }
        }
      }

      // Converte de volta para coordenadas em pixels originais
      const boxPxX = Math.max(0, minX * step - 4);
      const boxPxY = Math.max(0, minY * step - 4);
      const boxPxW = Math.min(width - boxPxX, (maxX - minX + 1) * step + 8);
      const boxPxH = Math.min(height - boxPxY, (maxY - minY + 1) * step + 8);

      // Descarta ruídos micro (menos de 8px)
      if (boxPxW >= 12 && boxPxH >= 12) {
        boxes.push({ x: boxPxX, y: boxPxY, w: boxPxW, h: boxPxH });
      }
    }
  }

  // 3. Mescla caixas que se sobrepõem após a expansão
  const merged: BoundingBox[] = [];
  for (const b of boxes) {
    let overlap = false;
    for (const m of merged) {
      if (
        b.x < m.x + m.w + 10 &&
        b.x + b.w + 10 > m.x &&
        b.y < m.y + m.h + 10 &&
        b.y + b.h + 10 > m.y
      ) {
        const newX = Math.min(m.x, b.x);
        const newY = Math.min(m.y, b.y);
        m.w = Math.max(m.x + m.w, b.x + b.w) - newX;
        m.h = Math.max(m.y + m.h, b.y + b.h) - newY;
        m.x = newX;
        m.y = newY;
        overlap = true;
        break;
      }
    }
    if (!overlap) {
      merged.push({ ...b });
    }
  }

  return merged;
}
