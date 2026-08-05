const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createIcon(size, filename) {
  const png = new PNG({ width: size, height: size });

  const bgColor = { r: 10, g: 14, b: 26, a: 255 };      // #0A0E1A
  const accentColor = { r: 0, g: 212, b: 170, a: 255 }; // #00D4AA (teal)
  const secondaryColor = { r: 124, g: 58, b: 237, a: 255 }; // #7C3AED (purple)
  const whiteColor = { r: 255, g: 255, b: 255, a: 255 };

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.42;
  const innerRadius = size * 0.38;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let color = bgColor;

      // Outer ring gradient (Teal to Purple)
      if (dist <= radius && dist >= innerRadius - (size * 0.02)) {
        const factor = (x + y) / (size * 2);
        color = {
          r: Math.round(accentColor.r * (1 - factor) + secondaryColor.r * factor),
          g: Math.round(accentColor.g * (1 - factor) + secondaryColor.g * factor),
          b: Math.round(accentColor.b * (1 - factor) + secondaryColor.b * factor),
          a: 255
        };
      } else if (dist < innerRadius) {
        // Inner circle dark background
        color = { r: 19, g: 25, b: 38, a: 255 }; // #131926

        // Draw 'PZ' styled emblem using simple geometric shapes
        // 'P' vertical stem
        const pLeft = cx - size * 0.22;
        const pRight = cx - size * 0.06;
        const pTop = cy - size * 0.22;
        const pBottom = cy + size * 0.22;
        const stemWidth = size * 0.07;

        if (x >= pLeft && x <= pLeft + stemWidth && y >= pTop && y <= pBottom) {
          color = accentColor;
        }
        // 'P' loop
        const pLoopRadius = size * 0.12;
        const pLoopCx = pLeft + stemWidth;
        const pLoopCy = pTop + pLoopRadius;
        const pLoopDx = x - pLoopCx;
        const pLoopDy = y - pLoopCy;
        const pLoopDist = Math.sqrt(pLoopDx * pLoopDx + pLoopDy * pLoopDy);
        if (pLoopDist <= pLoopRadius && pLoopDist >= pLoopRadius - stemWidth && x >= pLoopCx) {
          color = accentColor;
        }

        // 'Z' top bar, diagonal, bottom bar
        const zLeft = cx + size * 0.04;
        const zRight = cx + size * 0.22;
        const zTop = cy - size * 0.20;
        const zBottom = cy + size * 0.20;
        const zThickness = size * 0.06;

        // Top bar
        if (x >= zLeft && x <= zRight && y >= zTop && y <= zTop + zThickness) {
          color = whiteColor;
        }
        // Bottom bar
        if (x >= zLeft && x <= zRight && y >= zBottom - zThickness && y <= zBottom) {
          color = whiteColor;
        }
        // Diagonal
        const slope = (zBottom - zTop) / (zLeft - zRight);
        const expectedY = zTop + slope * (x - zRight);
        if (x >= zLeft && x <= zRight && Math.abs(y - expectedY) <= zThickness * 0.7) {
          color = whiteColor;
        }
      }

      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = color.a;
    }
  }

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const outPath = path.join(publicDir, filename);
  png.pack().pipe(fs.createWriteStream(outPath)).on('finish', () => {
    console.log(`Generated ${outPath} (${size}x${size})`);
  });
}

createIcon(192, 'pwa-192.png');
createIcon(512, 'pwa-512.png');
createIcon(180, 'apple-touch-icon.png');
createIcon(64, 'favicon.png');
