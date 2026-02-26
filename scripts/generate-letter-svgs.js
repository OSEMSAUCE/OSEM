import fs from 'fs';
import path from 'path';

// Letter paths (same as in GrassFont component)
const letterPaths = {
  D: "M20 20 L20 100 L50 100 Q80 100 80 60 L80 40 Q80 20 50 20 Z",
  E: "M20 20 L20 100 L80 100 M20 60 L70 60 M20 20 L80 20",
  F: "M20 20 L20 100 M20 60 L70 60 M20 20 L80 20",
  G: "M80 30 Q70 20 50 20 Q30 20 20 40 L20 80 Q20 100 40 100 L60 100 L60 70 L50 70",
  H: "M20 20 L20 100 M80 20 L80 100 M20 60 L80 60",
  I: "M30 20 L70 20 M50 20 L50 100 M30 100 L70 100",
  J: "M30 20 L70 20 M60 20 L60 80 Q60 100 40 100 Q20 100 20 80",
  K: "M20 20 L20 100 M80 20 L20 60 L80 100",
  L: "M20 20 L20 100 L80 100",
  M: "M20 100 L20 20 L50 60 L80 20 L80 100",
  N: "M20 100 L20 20 L80 100 L80 20",
  O: "M50 20 Q30 20 20 40 L20 80 Q20 100 50 100 Q80 100 80 80 L80 40 Q80 20 50 20 Z",
  P: "M20 20 L20 100 M20 20 L60 20 Q80 20 80 40 Q80 60 60 60 L20 60",
  Q: "M50 20 Q30 20 20 40 L20 80 Q20 100 50 100 Q80 100 80 80 L80 40 Q80 20 50 20 M70 80 L85 95",
  R: "M20 20 L20 100 M20 20 L60 20 Q80 20 80 40 Q80 60 60 60 L20 60 M60 60 L80 100",
  S: "M80 30 Q70 20 50 20 Q30 20 20 30 Q20 40 30 50 L70 60 Q80 70 80 80 Q80 100 60 100 Q40 100 30 90",
  T: "M20 20 L80 20 M50 20 L50 100",
  U: "M20 20 L20 80 Q20 100 50 100 Q80 100 80 80 L80 20",
  V: "M20 20 L50 100 L80 20",
  W: "M20 20 L30 100 L50 60 L70 100 L80 20",
  X: "M20 20 L80 100 M80 20 L20 100",
  Y: "M20 20 L50 60 L80 20 M50 60 L50 100",
  Z: "M20 20 L80 20 L20 100 L80 100"
};

const svgTemplate = (letter, pathData) => `<svg width="100" height="120" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grassPattern" patternUnits="userSpaceOnUse" width="8" height="6">
      <rect width="8" height="6" fill="#ff9500"/>
      <path d="M1 6 Q1 4 1.5 2 M3 6 Q3 3 3.5 1 M5 6 Q5 4 5.5 2 M7 6 Q7 3 7.5 1" 
            stroke="#4a7c59" stroke-width="0.3" fill="none"/>
    </pattern>
    <linearGradient id="letterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffb84d"/>
      <stop offset="70%" style="stop-color:#ff9500"/>
      <stop offset="100%" style="stop-color:url(#grassPattern)"/>
    </linearGradient>
  </defs>
  
  <path d="${pathData}" 
        fill="url(#letterGrad)" 
        stroke="#2c1810" 
        stroke-width="3" 
        stroke-linejoin="round" 
        stroke-linecap="round"/>
</svg>`;

const lettersDir = '/Users/chrisharris/DEV/fetch/ReTreever/OSEM/static/letters';

// Create directory if it doesn't exist
if (!fs.existsSync(lettersDir)) {
  fs.mkdirSync(lettersDir, { recursive: true });
}

// Generate all letter SVGs
Object.entries(letterPaths).forEach(([letter, pathData]) => {
  const svgContent = svgTemplate(letter, pathData);
  const filePath = path.join(lettersDir, `${letter}.svg`);
  fs.writeFileSync(filePath, svgContent);
  console.log(`Created ${letter}.svg`);
});

console.log('All letter SVGs generated!');
