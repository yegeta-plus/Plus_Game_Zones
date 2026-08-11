const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const logoJpg = path.join(publicDir, 'app-logo.jpg');
const sourceAsset = path.join(__dirname, '..', 'src', 'assets', 'images', 'app_logo_preview_1786451598969.jpg');

// Ensure source logo exists in public/
if (fs.existsSync(sourceAsset) && (!fs.existsSync(logoJpg) || fs.statSync(sourceAsset).mtime > fs.statSync(logoJpg).mtime)) {
  fs.copyFileSync(sourceAsset, logoJpg);
}

if (fs.existsSync(logoJpg)) {
  ['pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png', 'favicon.png'].forEach(file => {
    fs.copyFileSync(logoJpg, path.join(publicDir, file));
    console.log(`Synced official logo to ${file}`);
  });
} else {
  console.log('Official app logo image ready');
}

