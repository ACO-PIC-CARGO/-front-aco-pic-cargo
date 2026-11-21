import { expect, test } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VAutocomplete } from "vuetify/components";

// el combo de cuentas del proveedor busca por sigla (BG) y por el nombre completo del banco
test("searching BANCO GENERAL finds the BG account", async () => {
  const items = [
    { title: "BG · Dólares · 0372010386028", value: 1, buscar: "BG Banco General Dólares 0372010386028" },
    { title: "BCP · Dólares · 191000", value: 2, buscar: "BCP Banco de Crédito del Perú Dólares 191000" },
  ];
  const w = mount(VAutocomplete, {
    props: { items, filterKeys: ["title", "raw.buscar"] },
    global: { plugins: [createVuetify({ components, directives })] },
    attachTo: document.body,
  });
  await flushPromises();
  // escribir en el campo (un search inicial no filtra)
  await w.find("input").trigger("focus");
  await w.find("input").setValue("banco general");
  await flushPromises();
  const texto = document.body.textContent ?? "";
  expect(texto).toContain("BG · Dólares");
  expect(texto).not.toContain("BCP · Dólares");
  w.unmount();
});
