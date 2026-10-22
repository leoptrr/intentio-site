// Capturas do app em src/assets/screens/, pelo nome do arquivo (sem extensão).
import type { ImageMetadata } from "astro";

const files = import.meta.glob<{ default: ImageMetadata }>("../assets/screens/*.{png,jpg,jpeg}", { eager: true });

export const findScreen = (name?: string) => {
  if (!name) return undefined;
  const hit = Object.entries(files).find(([path]) => path.replace(/^.*\/|\.\w+$/g, "") === name)?.[1].default;
  if (!hit) console.warn(`[landing] tela "${name}" não encontrada em src/assets/screens/`);
  return hit;
};
