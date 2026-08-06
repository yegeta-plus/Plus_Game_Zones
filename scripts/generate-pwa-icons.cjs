const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

function createIcon(size, filename) {
  const png = new PNG({ width: size, height: size });

  const bgColor = { r: 10, g: 14, b: 26, a: 255 };        // #0A0E1A
  const accentColor = { r: 0, g: 212, b: 170, a: 255 };   // #00D4AA (cyan/teal)
  const secondaryColor = { r: 147, g: 51, b: 234, a: 255 }; // #9333EA (purple/playstation)
  const whiteColor = { r: 255, g: 255, b: 255, a: 255 };
  const psBlue = { r: 59, g: 130, b: 246, a: 255 };      // PlayStation Blue

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.44;
  const innerRadius = size * 0.40;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      let color = bgColor;

      // Outer ring gradient (Teal to PlayStation Purple-Blue)
      if (dist <= radius && dist >= innerRadius - (size * 0.02)) {
        const factor = (x + y) / (size * 2);
        color = {
          r: Math.round(accentColor.r * (1 - factor) + secondaryColor.r * factor),
          g: Math.round(accentColor.g * (1 - factor) + secondaryColor.g * factor),
          b: Math.round(accentColor.b * (1 - factor) + secondaryColor.b * factor),
          a: 255
        };
      } else if (dist < innerRadius) {
        // Inner dark canvas
        color = { r: 15, g: 21, b: 37, a: 255 };

        // Draw PlayStation Gamepad silhouette
        // Gamepad Body: Rounded horizontal capsule with left and right grip wings
        const padWidth = size * 0.52;
        const padHeight = size * 0.28;
        const padY = cy + size * 0.02;

        // Grip wing distance
        const leftWingDx = x - (cx - padWidth * 0.35);
        const rightWingDx = x - (cx + padWidth * 0.35);
        const wingDy = y - (padY + size * 0.08);
        const wingDistLeft = Math.sqrt(leftWingDx * leftWingDx + wingDy * wingDy);
        const wingDistRight = Math.sqrt(rightWingDx * rightWingDx + wingDy * wingDy);

        const isMainBody = Math.abs(x - cx) <= padWidth * 0.45 && Math.abs(y - padY) <= padHeight * 0.45;
        const isLeftWing = wingDistLeft <= size * 0.14;
        const isRightWing = wingDistRight <= size * 0.14;

        if (isMainBody || isLeftWing || isRightWing) {
          color = { r: 26, g: 35, b: 58, a: 255 };

          // D-Pad on Left Wing (plus shape)
          const dpadCx = cx - padWidth * 0.28;
          const dpadCy = padY;
          const isDpadH = Math.abs(x - dpadCx) <= size * 0.06 && Math.abs(y - dpadCy) <= size * 0.02;
          const isDpadV = Math.abs(x - dpadCx) <= size * 0.02 && Math.abs(y - dpadCy) <= size * 0.06;
          if (isDpadH || isDpadV) {
            color = accentColor;
          }

          // PlayStation Action Buttons on Right Wing (Triangle, Circle, Cross, Square)
          const btnCx = cx + padWidth * 0.28;
          const btnCy = padY;
          const btnDist = Math.sqrt((x - btnCx) * (x - btnCx) + (y - btnCy) * (y - btnCy));
          if (btnDist <= size * 0.075 && btnDist >= size * 0.04) {
            color = secondaryColor;
          }

          // Center Football / FC Emblem (Glowing Circle with soccer pentagon accent)
          const fbDist = Math.sqrt((x - cx) * (x - cx) + (y - (cy - size * 0.15)) * (y - (cy - size * 0.15)));
          if (fbDist <= size * 0.10) {
            color = psBlue;
            if (fbDist <= size * 0.08 && fbDist >= size * 0.06) {
              color = whiteColor;
            } else if (fbDist <= size * 0.03) {
              color = accentColor;
            }
          }
        } else {
          // Top Football arc
          const fbTopDist = Math.sqrt((x - cx) * (x - cx) + (y - (cy - size * 0.18)) * (y - (cy - size * 0.18)));
          if (fbTopDist <= size * 0.12 && fbTopDist >= size * 0.09) {
            color = accentColor;
          }
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
