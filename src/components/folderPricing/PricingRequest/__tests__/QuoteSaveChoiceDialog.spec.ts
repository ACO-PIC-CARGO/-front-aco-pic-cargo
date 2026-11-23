import { afterEach, expect, test } from "vitest";
import { defineComponent, h, nextTick, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import QuoteSaveChoiceDialog from "../QuoteSaveChoiceDialog.vue";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const vuetify = createVuetify({ components, directives });

const saveDialog = () => document.querySelector<HTMLElement>("[role='dialog'][aria-label='Guardar cotización'] .v-overlay__content");
const isShown = (element: HTMLElement | null) => !!element && !element.closest("[style*='display: none']");
const button = (text: string) =>
  [...saveDialog()!.querySelectorAll<HTMLButtonElement>("button")].find((b) => b.textContent!.replace(/\s+/g, " ").trim() === text)!;

async function askChoice() {
  const dialog = ref<{ ask(): Promise<unknown> } | null>(null);
  const Host = defineComponent({ setup: () => () => h(components.VApp, null, () => h(QuoteSaveChoiceDialog, { ref: dialog })) });
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
  ["CANCELAR", null],
  ["SOLO GUARDAR", "save_only"],
  ["GUARDAR Y SOLICITAR A PRICING", "save_and_request"],
])("%s answers %s and closes the dialog", async (label, choice) => {
  const { answer } = await askChoice();
  expect(isShown(saveDialog())).toBe(true);

  button(label).click();

  expect(await answer).toBe(choice);
  await flushPromises();
  expect(isShown(saveDialog())).toBe(false);
});

test("closing with Escape answers like cancel", async () => {
  const { answer } = await askChoice();

  window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

  expect(await answer).toBeNull();
});
