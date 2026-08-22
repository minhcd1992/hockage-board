export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorStr: string,
  width: number,
  height: number
): { imageData: ImageData, bounds: { x: number, y: number, w: number, h: number } } | null {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  const startPos = (startY * width + startX) * 4;
  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  // Parse fillColorStr (e.g. '#ff0000')
  let fillR = 0, fillG = 0, fillB = 0, fillA = 255;
  if (fillColorStr.startsWith('#')) {
    const hex = fillColorStr.replace('#', '');
    if (hex.length === 6) {
      fillR = parseInt(hex.substring(0, 2), 16);
      fillG = parseInt(hex.substring(2, 4), 16);
      fillB = parseInt(hex.substring(4, 6), 16);
    }
  }

  // If clicking on same color, do nothing
  if (startR === fillR && startG === fillG && startB === fillB && startA === fillA) {
    return null;
  }

  // Tolerance for anti-aliasing
  const tolerance = 50;
  const matchColor = (pos: number) => {
    const r = data[pos];
    const g = data[pos + 1];
    const b = data[pos + 2];
    const a = data[pos + 3];
    
    // Check if alpha is similar
    if (Math.abs(a - startA) > tolerance) return false;
    
    // If both are fully transparent, color doesn't matter
    if (a < 10 && startA < 10) return true;
    
    return Math.abs(r - startR) <= tolerance &&
           Math.abs(g - startG) <= tolerance &&
           Math.abs(b - startB) <= tolerance;
  };

  const queue: [number, number][] = [[startX, startY]];
  const visited = new Uint8Array(width * height);
  visited[startY * width + startX] = 1;

  // We only want to output the FILLED pixels. The rest should be transparent.
  const resultImageData = new ImageData(width, height);
  const resultData = resultImageData.data;

  // bounding box of the filled region
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let filledPixels = 0;

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const pos = (y * width + x) * 4;

    // Output to result
    resultData[pos] = fillR;
    resultData[pos + 1] = fillG;
    resultData[pos + 2] = fillB;
    resultData[pos + 3] = fillA;
    
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    filledPixels++;

    // Check neighbors
    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIndex = ny * width + nx;
        if (!visited[nIndex]) {
          const nPos = nIndex * 4;
          if (matchColor(nPos)) {
            visited[nIndex] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }
  }

  if (filledPixels === 0) return null;

  return {
    imageData: resultImageData,
    bounds: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
  };
}
