import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ImportantNoteField from "../ImportantNoteField.vue";
import { getInternalMessages } from "../internalCommunicationApi";
import { usePricingStore } from "@/stores/pricing";

vi.mock("../internalCommunicationApi", () => ({ getInternalMessages: vi.fn(), sendInternalMessage: vi.fn() }));
vi.mock("@/api/http", () => ({ default: Object.assign(vi.fn(), { post: vi.fn(), get: vi.fn() }) }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));

const HELP = "Para notas importantes usa el historial de comunicación";
const message = (id: number, body: string, isCreationNote: boolean) => ({
  id,
  direction: "sales_to_pricing",
  body,
  author_name: "Ana",
  recipient_name: "Pricing",
  created_at: "2026-11-23T10:00:00Z",
  is_creation_note: isCreationNote,
});

function mountField(quoteId: number | null) {
  const pinia = createPinia();
  setActivePinia(pinia);
  const Host = defineComponent({
    props: { quoteId: { type: Number as PropType<number | null>, default: null } },
    setup: (props) => () => h(components.VApp, null, () => h(ImportantNoteField, { quoteId: props.quoteId })),
  });
  return mount(Host, { props: { quoteId }, attachTo: document.body, global: { plugins: [createVuetify({ components, directives }), pinia] } });
}

beforeEach(() => {
  vi.mocked(getInternalMessages).mockReset();
});
afterEach(() => {
  document.body.innerHTML = "";
});

test("a new quote writes its important note into the quote being saved", async () => {
  mountField(null);
  await flushPromises();

  const field = document.querySelector<HTMLTextAreaElement>("textarea")!;
  field.value = "Cliente pide tarifa con seguro";
  field.dispatchEvent(new Event("input"));
  await flushPromises();

  expect(usePricingStore().datosPrincipales.pricing_notes).toBe("Cliente pide tarifa con seguro");
  expect(getInternalMessages).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain(HELP);
});

test("editing shows the note saved at creation, fixed, and sends later notes to the history", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue({
    estadoflag: true,
    mensaje: "",
    tipomensaje: "",
    data: [message(3, "Respuesta de Pricing", false), message(1, "Cliente pide tarifa con seguro", true)],
  } as never);

  mountField(77);
  await flushPromises();

  expect(getInternalMessages).toHaveBeenCalledWith(77);
  expect(document.body.textContent).toContain("Cliente pide tarifa con seguro");
  expect(document.body.textContent).not.toContain("Respuesta de Pricing");
  expect(document.querySelector("textarea, input")).toBeNull();
  expect(document.body.textContent).toContain(HELP);
});

test("editing a quote created without a note shows only where to write notes", async () => {
  vi.mocked(getInternalMessages).mockResolvedValue({
    estadoflag: true,
    mensaje: "",
    tipomensaje: "",
    data: [message(2, "Nota posterior", false)],
  } as never);

  mountField(77);
  await flushPromises();

  expect(document.body.textContent).not.toContain("Nota posterior");
  expect(document.querySelector("textarea, input")).toBeNull();
  expect(document.body.textContent).toContain(HELP);
});

test("a note that cannot be loaded says so in plain words", async () => {
  vi.mocked(getInternalMessages).mockRejectedValue(new Error("Network Error"));

  mountField(77);
  await flushPromises();

  expect(document.body.textContent).toContain("No pudimos cargar la nota importante. Recarga la página para verla.");
  expect(document.body.textContent).not.toContain("Network Error");
});
