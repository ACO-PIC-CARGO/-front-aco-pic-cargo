import { afterEach, expect, test } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VSelect, VTextField } from "vuetify/components";
import HouseStepWeightCheckDialog from "@/components/HouseFile/HouseStepWeightCheckDialog.vue";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

let wrapper: VueWrapper | undefined;

afterEach(() => wrapper?.unmount());

async function openDialog(quotedWeight: number | null, quotedVolume: number | null) {
  wrapper = mount(HouseStepWeightCheckDialog, {
    props: { quotedWeight, quotedVolume, modelValue: false },
    global: { plugins: [createVuetify({ components, directives })] },
    attachTo: document.body,
  });
  await wrapper.setProps({ modelValue: true });
  await flushPromises();
  return wrapper;
}

async function clickButton(name: string) {
  [...document.body.querySelectorAll("button")].find((button) => button.textContent?.trim() === name)!.click();
  await flushPromises();
}

async function choose(label: string, value: boolean) {
  await wrapper!.findAllComponents(VSelect).find((select) => select.props("label") === label)!.setValue(value);
  await flushPromises();
}

async function typeInto(label: string, value: string) {
  await wrapper!.findAllComponents(VTextField).find((field) => field.props("label") === label)!.setValue(value);
  await flushPromises();
}

test("keeping both values confirms the house's quoted weight and volume", async () => {
  await openDialog(300, 2);
  expect(document.body.textContent).toContain("Se mantiene (300 kg)");
  await clickButton("Confirmar");
  expect(wrapper!.emitted("confirmed")).toEqual([[{ weight: 300, volume: 2 }]]);
});

test("another weight must be greater than 0 before confirming", async () => {
  await openDialog(300, 2);
  await choose("Peso", false);
  await typeInto("Peso recibido", "0");
  await clickButton("Confirmar");
  expect(wrapper!.emitted("confirmed")).toBeUndefined();
  expect(document.body.textContent).toContain("Escribe un peso mayor que 0.");

  await typeInto("Peso recibido", "320.5");
  await clickButton("Confirmar");
  expect(wrapper!.emitted("confirmed")).toEqual([[{ weight: 320.5, volume: 2 }]]);
});

test("a house without a quoted value asks for it directly and cancelling confirms nothing", async () => {
  await openDialog(null, 2);
  expect(document.body.textContent).toContain("Cotizado: sin registrar");
  await clickButton("Confirmar");
  expect(document.body.textContent).toContain("Escribe un peso mayor que 0.");
  await clickButton("Cancelar");
  expect(wrapper!.emitted("confirmed")).toBeUndefined();
  expect(wrapper!.emitted("update:modelValue")).toEqual([[false]]);
});
