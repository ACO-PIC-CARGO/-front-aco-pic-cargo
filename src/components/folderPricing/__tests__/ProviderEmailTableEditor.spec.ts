import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ProviderEmailTableEditor from "../ProviderEmailTableEditor.vue";
import type { EmailTableRow } from "@/types/providerQuoteEmailTemplate";

globalThis.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
const vuetify = createVuetify({ components, directives });

const rows: EmailTableRow[] = [
  { field: "incoterm", label: "Incoterm" },
  { field: "weight", label: "Peso" },
  { field: "volume", label: "Volumen" },
];

function mountEditor(readonly = false) {
  const wrapper = mount(ProviderEmailTableEditor, {
    props: { header: ["Concepto", "Detalle"], rows, readonly, "onUpdate:rows": (value: EmailTableRow[]) => wrapper.setProps({ rows: value }) },
    global: { plugins: [vuetify] },
  });
  return wrapper;
}
const savedRows = (wrapper: ReturnType<typeof mountEditor>) => wrapper.props("rows") as EmailTableRow[];
const button = (wrapper: ReturnType<typeof mountEditor>, name: string, index = 0) =>
  wrapper.findAll(`button[aria-label="${name}"]`)[index]!;

test("moving a row up and down changes the order that is saved", async () => {
  const wrapper = mountEditor();
  await button(wrapper, "Subir fila", 1).trigger("click");
  expect(savedRows(wrapper).map((row) => row.field)).toEqual(["weight", "incoterm", "volume"]);
  await button(wrapper, "Bajar fila", 0).trigger("click");
  expect(savedRows(wrapper).map((row) => row.field)).toEqual(["incoterm", "weight", "volume"]);
});

test("removing a row drops it and adding one appends an empty row to fill in", async () => {
  const wrapper = mountEditor();
  await button(wrapper, "Quitar fila", 0).trigger("click");
  expect(savedRows(wrapper).map((row) => row.field)).toEqual(["weight", "volume"]);
  await wrapper.find('button[aria-label="Agregar fila"]').trigger("click");
  expect(savedRows(wrapper).at(-1)).toEqual({ field: "incoterm", label: "" });
});

test("without permission to modify, rows cannot be moved, removed or added", () => {
  const wrapper = mountEditor(true);
  expect(wrapper.findAll('button[aria-label="Quitar fila"]')).toHaveLength(0);
  expect(wrapper.find('button[aria-label="Agregar fila"]').exists()).toBe(false);
});
