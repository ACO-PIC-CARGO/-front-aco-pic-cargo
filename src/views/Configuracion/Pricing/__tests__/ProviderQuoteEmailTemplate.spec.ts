import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import ProviderQuoteEmailTemplate from "../ProviderQuoteEmailTemplate.vue";
import { useProviderQuoteEmailTemplateStore } from "@/stores/providerQuoteEmailTemplate";
import type { EmailLanguage } from "@/types/providerQuoteEmailTemplate";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("@/composables/usePermissions", () => ({ usePermissions: () => ({ can: () => true }) }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const RichTextEditor = { props: ["modelValue", "label"], template: "<div class='editor'>{{ modelValue }}</div>" };
const ProviderEmailTableEditor = { template: "<div />" };

const template = (id_shipment: number, shipment_name: string, language: EmailLanguage) => ({
  id_shipment,
  shipment_name,
  language,
  intro_html: `<p>${shipment_name} ${language}</p>`,
  closing_html: "",
  table_header: ["Concepto", "Detalle"] as [string, string],
  table_rows: [{ field: "incoterm" as const, label: "Incoterm" }],
});

test("each shipment type tab shows and saves its own template", async () => {
  setActivePinia(createPinia());
  const store = useProviderQuoteEmailTemplateStore();
  vi.spyOn(store, "load").mockImplementation(async () => {
    store.templates = [template(1, "Aéreo", "en"), template(1, "Aéreo", "es"), template(2, "FCL", "en"), template(2, "FCL", "es")];
    return null;
  });
  const save = vi.spyOn(store, "save").mockResolvedValue(null);
  const wrapper = mount(ProviderQuoteEmailTemplate, {
    global: { plugins: [createVuetify({ components, directives })], stubs: { RichTextEditor, ProviderEmailTableEditor } },
  });
  await flushPromises();

  await wrapper.findAll("button").find((button) => button.text() === "FCL")!.trigger("click");
  await flushPromises();
  expect(wrapper.find(".editor").text()).toBe("<p>FCL es</p>");

  await wrapper.findAll("button").find((button) => button.text() === "Guardar")!.trigger("click");

  expect(save).toHaveBeenCalledWith(expect.objectContaining({ id_shipment: 2, language: "es", intro_html: "<p>FCL es</p>" }));
});
