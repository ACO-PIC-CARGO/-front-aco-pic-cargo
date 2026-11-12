import { afterEach, expect, test } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import MasterSelectDialog from "@/components/comun/MasterSelectDialog.vue";

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const quote = { idsentido: 1, idtipocarga: 2, idincoterms: 3, idorigen: 4, iddestino: 5 };
const onRoute = { id: 7, code_master: "2026MBL00007", id_modality: 1, id_shipment: 2, id_incoterms: 3, id_port_begin: 4, id_port_end: 5 };
const otherDestination = { ...onRoute, id: 8, code_master: "2026MBL00008", id_port_end: 99 };
let wrapper: VueWrapper | undefined;

afterEach(() => wrapper?.unmount());

async function openDialog() {
  wrapper = mount(MasterSelectDialog, {
    props: { modelValue: true, masters: [onRoute, otherDestination], quote },
    global: { plugins: [createVuetify({ components, directives })] },
    attachTo: document.body,
  });
  await flushPromises();
  return wrapper;
}

const button = (text: string) => [...document.body.querySelectorAll("button")].find((b) => b.textContent?.trim() === text)!;
const choose = async (dialog: VueWrapper, id: number) => {
  dialog.findComponent(components.VAutocomplete).vm.$emit("update:modelValue", id);
  await flushPromises();
};

test("SELECCIONAR without an expediente selects nothing", async () => {
  const dialog = await openDialog();

  button("SELECCIONAR").click();
  await flushPromises();

  expect(dialog.emitted("select")).toBeUndefined();
});

test("a master off the quote's route is flagged before it is selected, and SELECCIONAR hands that master back", async () => {
  const dialog = await openDialog();

  await choose(dialog, 8);
  expect(document.body.textContent).toContain("El Master seleccionado no coincide con Puerto de Destino");
  button("SELECCIONAR").click();
  await flushPromises();

  expect(dialog.emitted("select")).toEqual([[otherDestination]]);
});

test("a master on the quote's route is selected without a warning", async () => {
  const dialog = await openDialog();

  await choose(dialog, 7);
  expect(document.body.textContent).not.toContain("no coincide");
  button("SELECCIONAR").click();
  await flushPromises();

  expect(dialog.emitted("select")).toEqual([[onRoute]]);
});
