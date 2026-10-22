// Prepara uma foto de mão segurando o iPhone com a tela em verde chapado (chroma):
// deixa a tela transparente, tira o reflexo verde da borda e mede a caixa da tela.
// Uso: node scripts/key-photo.mjs <foto.png> <nome>
// Grava src/assets/photos/<nome>.png e a caixa em src/assets/photos/photos.json (em % da foto).
import sharp from "sharp";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const [, , input, name] = process.argv;
if (!input || !name) {
  console.error("Uso: node scripts/key-photo.mjs <foto.png> <nome>");
  process.exit(1);
}

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;
let minX = W, minY = H, maxX = 0, maxY = 0;

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    // Quanto o verde passa do maior entre vermelho e azul.
    const k = g - Math.max(r, b);
    if (k <= 40) continue;
    const alpha = Math.max(0, Math.min(255, 255 - (k - 40) * 4));
    data[i + 3] = alpha;
    data[i + 1] = Math.max(r, b);
    if (alpha < 128) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
}

if (maxX <= minX) {
  console.error("Não achei a tela verde na foto.");
  process.exit(1);
}

await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toFile(`src/assets/photos/${name}.png`);

const pct = (v, total) => +((v / total) * 100).toFixed(2);
const box = {
  width: W,
  height: H,
  screen: { left: pct(minX, W), top: pct(minY, H), width: pct(maxX - minX + 1, W), height: pct(maxY - minY + 1, H) },
};
const file = "src/assets/photos/photos.json";
const all = existsSync(file) ? JSON.parse(readFileSync(file, "utf8")) : {};
all[name] = box;
writeFileSync(file, JSON.stringify(all, null, 2) + "\n");
console.log(name, JSON.stringify(box));
