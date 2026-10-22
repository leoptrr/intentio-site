import { defineCollection } from "astro:content";
import { file } from "astro/loaders";

// Copy da página: cada chave de topo do YAML é uma seção.
const landing = defineCollection({ loader: file("src/data/landing.yaml") });

export const collections = { landing };
