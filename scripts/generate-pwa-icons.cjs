const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public');
  const logoJpg = path.join(publicDir, 'app-logo.jpg');
  const sourceAsset = path.join(__dirname, '..', 'src', 'assets', 'images', 'game_app_icon_1786707249717.jpg');

  const inputPath = fs.existsSync(sourceAsset) ? sourceAsset : fs.existsSync(logoJpg) ? logoJpg : null;

  if (!inputPath) {
    console.error('No source logo image found!');
    return;
  }

  // Ensure public/app-logo.jpg exists as JPG
  if (!fs.existsSync(logoJpg) || fs.statSync(inputPath).mtime > fs.statSync(logoJpg).mtime) {
    fs.copyFileSync(inputPath, logoJpg);
  }

  const targets = [
    { file: 'pwa-192.png', size: 192 },
    { file: 'pwa-512.png', size: 512 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: 'favicon.png', size: 64 },
  ];

  for (const t of targets) {
    const outPath = path.join(publicDir, t.file);
    await sharp(inputPath)
      .resize(t.size, t.size, { fit: 'cover' })
      .png({ compressionLevel: 8 })
      .toFile(outPath + '.tmp');
    fs.renameSync(outPath + '.tmp', outPath);
    console.log(`Successfully generated real PNG: ${t.file} (${t.size}x${t.size})`);
  }
}

generateIcons().catch(err => {
  console.error('Failed to generate PNG icons:', err);
});

