import { afterEach, expect, test } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import NewQuoteActionDialog from "../NewQuoteActionDialog.vue";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const vuetify = createVuetify({ components, directives });

const actionDialog = () => document.querySelector<HTMLElement>("[role='dialog'][aria-label='Cotizar'] .v-overlay__content");
const isShown = (element: HTMLElement | null) => !!element && !element.closest("[style*='display: none']");
const labels = () => [...actionDialog()!.querySelectorAll<HTMLButtonElement>("button")].map((b) => b.textContent!.replace(/\s+/g, " ").trim());
const button = (text: string) =>
  [...actionDialog()!.querySelectorAll<HTMLButtonElement>("button")].find((b) => (b.getAttribute("aria-label") ?? b.textContent!.replace(/\s+/g, " ").trim()) === text)!;

async function askAction({ canSave = true, canRequest = true } = {}) {
  const dialog = ref<{ ask(): Promise<unknown> } | null>(null);
  const Host = defineComponent({
    setup: () => () => h(components.VApp, null, () => h(NewQuoteActionDialog, { ref: dialog, canSave, canRequest, warning: null })),
  });
  mount(Host, { attachTo: document.body, global: { plugins: [vuetify] } });
  await flushPromises();
  const answer = dialog.value!.ask();
  await nextTick();
  await flushPromises();
  return { answer };
}

afterEach(() => {
  document.body.innerHTML = "";
});

test.each([
  ["Guardar", "save_only"],
  ["Pasar a Cotizar", "quote"],
  ["Solicitar a Pricing", "save_and_request"],
  ["Cerrar", null],
])("%s answers %s and closes the dialog", async (label, action) => {
  const { answer } = await askAction();
  expect(isShown(actionDialog())).toBe(true);

  button(label).click();

  expect(await answer).toBe(action);
  await flushPromises();
  expect(isShown(actionDialog())).toBe(false);
});

test("without permission to save a draft only moving to costing is offered", async () => {
  await askAction({ canSave: false, canRequest: false });

  expect(labels()).not.toContain("Guardar");
  expect(labels()).not.toContain("Solicitar a Pricing");
  expect(labels()).toContain("Pasar a Cotizar");
});
