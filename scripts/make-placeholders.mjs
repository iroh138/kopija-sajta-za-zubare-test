// Generates soft, clearly-marked placeholder photos. Replace files in public/images with real photography.
import sharp from 'sharp';

const shots = [
  { name: 'hero', w: 1600, h: 1200, label: 'Hero photo: patient and orthodontist' },
  { name: 'intro', w: 900, h: 1100, label: 'Portrait: smiling patient' },
  { name: 'doctor', w: 900, h: 1200, label: 'Portrait: lead orthodontist' },
  { name: 'tech-scanner', w: 900, h: 900, label: '' },
  { name: 'tech-imaging', w: 900, h: 900, label: '' },
];

for (const [i, s] of shots.entries()) {
  const hue = [262, 270, 255, 280, 248][i];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s.w}" height="${s.h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue},60%,96%)"/><stop offset="1" stop-color="hsl(${hue},45%,84%)"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="${Math.round(s.w / 18)}"/></filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <g filter="url(#blur)" opacity="0.85">
    <circle cx="${s.w * 0.28}" cy="${s.h * 0.3}" r="${s.w * 0.22}" fill="hsl(${hue},70%,98%)"/>
    <circle cx="${s.w * 0.72}" cy="${s.h * 0.62}" r="${s.w * 0.26}" fill="hsl(${hue + 20},40%,76%)"/>
    <rect x="${s.w * 0.08}" y="${s.h * 0.72}" width="${s.w * 0.5}" height="${s.h * 0.12}" rx="40" fill="hsl(${hue},30%,90%)"/>
  </g>
  ${s.label ? `<g transform="translate(${s.w / 2 - 36} ${s.h / 2 - 100})" fill="none" stroke="hsl(${hue},25%,45%)" stroke-width="4" opacity="0.55">
    <rect x="0" y="12" width="72" height="52" rx="10"/><circle cx="36" cy="38" r="14"/><path d="M22 12l6-10h16l6 10"/>
  </g>` : ''}
  ${s.label ? `<text x="50%" y="${s.h / 2 + 40}" text-anchor="middle" font-family="sans-serif" font-size="${Math.max(22, s.w / 34)}" fill="hsl(${hue},25%,35%)" opacity="0.7">${s.label}</text>` : ''}
</svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 72 }).toFile(`public/images/${s.name}.webp`);
}
console.log('placeholders written to public/images');
