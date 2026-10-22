// Prepara um texto da copy para o HTML (diretriz 2.3 e 2.6):
// - valores em reais com espaço não separável e sem quebra de linha;
// - sinal de menos como U+2212, colado ao "R$" (sinal só no início do texto ou depois de "(");
// - números sobrescritos (¹ ² ³ ⁴) viram links para as notas; a primeira ocorrência
//   de cada nota recebe o id para o link de volta.

const NBSP = " ";
const SUPERSCRIPT = { "¹": 1, "²": 2, "³": 3, "⁴": 4 };
const MONEY = /(^|\()(?:([+−-])\s?)?R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)|R\$\s?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;

let seen = new Set();

// Chame uma vez por página, antes de renderizar.
export function resetNotes() {
  seen = new Set();
}

const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function rich(text) {
  return escape(text)
    .replace(MONEY, (_, lead, sign, value, bare) => {
      if (bare !== undefined) return `<span class="nowrap">R$${NBSP}${bare}</span>`;
      const s = sign ? `${sign === "+" ? "+" : "−"}${NBSP}` : "";
      return `${lead}<span class="nowrap">${s}R$${NBSP}${value}</span>`;
    })
    .replace(/[¹²³⁴]/g, (ch) => {
      const n = SUPERSCRIPT[ch];
      const id = seen.has(n) ? "" : ` id="ref-${n}"`;
      seen.add(n);
      return `<sup><a href="#nota-${n}"${id} aria-label="Nota ${n}">${n}</a></sup>`;
    });
}
