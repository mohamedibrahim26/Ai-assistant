// Run once: node generate-icons.mjs
// Generates PWA icons at public/icon-192.png and public/icon-512.png
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#1d4ed8');
  grad.addColorStop(1, '#7c3aed');
  ctx.fillStyle = grad;
  ctx.roundRect(0, 0, size, size, size * 0.2);
  ctx.fill();

  // "V" letter
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.55}px Inter, sans-serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('V', size / 2, size / 2 + size * 0.04);

  return canvas.toBuffer('image/png');
}

try {
  writeFileSync('public/icon-192.png', makeIcon(192));
  writeFileSync('public/icon-512.png', makeIcon(512));
  console.log('Icons generated: public/icon-192.png + public/icon-512.png');
} catch (e) {
  console.error('canvas package not available. Install with: npm install canvas');
  console.error('Or just use any 192x192 and 512x512 PNG images named icon-192.png and icon-512.png');
}
