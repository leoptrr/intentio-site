import { test } from "node:test";
import assert from "node:assert/strict";
import { rich, resetNotes } from "../src/lib/rich.mjs";

const NBSP = " ";

test("valor em reais: espaço não separável e sem quebra", () => {
  assert.equal(rich("R$ 69 por dia"), `<span class="nowrap">R$${NBSP}69</span> por dia`);
  assert.equal(rich("R$ 6.200,00"), `<span class="nowrap">R$${NBSP}6.200,00</span>`);
});

test("sinal: hífen vira menos (U+2212) e fica colado ao R$", () => {
  assert.equal(rich("- R$ 480,00"), `<span class="nowrap">−${NBSP}R$${NBSP}480,00</span>`);
  assert.equal(rich("− R$ 4.469,00"), `<span class="nowrap">−${NBSP}R$${NBSP}4.469,00</span>`);
  assert.equal(rich("+ R$ 6.200,00"), `<span class="nowrap">+${NBSP}R$${NBSP}6.200,00</span>`);
});

test("hífen dentro de frase não é tratado como sinal", () => {
  assert.equal(rich("dia a dia - R$ 5"), `dia a dia - <span class="nowrap">R$${NBSP}5</span>`);
});

test("nota de rodapé: link para a nota; só a primeira ocorrência ganha âncora de volta", () => {
  resetNotes();
  assert.equal(rich("salário.¹"), 'salário.<sup><a href="#nota-1" id="ref-1" aria-label="Nota 1">1</a></sup>');
  assert.equal(rich("reserva.¹"), 'reserva.<sup><a href="#nota-1" aria-label="Nota 1">1</a></sup>');
  assert.equal(rich("iCloud.²"), 'iCloud.<sup><a href="#nota-2" id="ref-2" aria-label="Nota 2">2</a></sup>');
});

test("escapa HTML da copy", () => {
  assert.equal(rich("a < b & c"), "a &lt; b &amp; c");
});
