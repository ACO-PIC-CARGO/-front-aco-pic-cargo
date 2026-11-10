import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { Component } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import Swal from "sweetalert2";
import { readSheet } from "read-excel-file/browser";
import FleteComponent from "@/components/Calculadora/FleteComponent.vue";
import TransporteCalculadora from "@/components/Calculadora/TransporteCalculadora.vue";
import { accepted, httpMock } from "@/stores/__tests__/catalogHttp";
import { UNREADABLE_SHEET_MESSAGE } from "@/utils/readSheetOrWarn";

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ name: "ServiciosCostosFijosLCL", query: {}, params: {} }),
}));
vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), currentRoute: { value: { params: {} } } } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: false }), isVisible: vi.fn() } }));
vi.mock("read-excel-file/browser", () => ({ readSheet: vi.fn() }));

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
const errorHandler = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, users: "ana" }]));
  sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, id_pais: 1, iso_pais: "PE" }]));
  httpMock.mockResolvedValue({ data: accepted([]) });
  vi.mocked(readSheet).mockRejectedValue(new DOMException("The file could not be read.", "NotReadableError"));
});
afterEach(() => {
  wrapper?.unmount();
  document.body.innerHTML = "";
});

const mountScreen = async (view: Component, type: string) => {
  wrapper = mount(defineComponent({ render: () => h(components.VApp, () => h(view, { type })) }), {
    global: { plugins: [createVuetify({ components, directives }), createPinia()], config: { errorHandler } },
    attachTo: document.body,
  });
  await flushPromises();
};
const click = async (element: HTMLElement) => {
  element.click();
  await flushPromises();
};
const byText = (selector: string, text: string) =>
  [...document.body.querySelectorAll<HTMLElement>(selector)].find((element) => element.textContent?.trim() === text)!;
const pickFileAndProcess = async () => {
  const input = document.getElementById("excel") as HTMLInputElement;
  Object.defineProperty(input, "files", { value: [new File(["x"], "tarifas.xlsx")], configurable: true });
  input.dispatchEvent(new Event("change"));
  await flushPromises();
  await click(byText("button", "Procesar"));
};

describe("an Excel file the browser cannot read", () => {
  test.each(["LCL", "FCL"])("on the %s freight bulk load warns the user what to do instead of failing", async (type) => {
    await mountScreen(FleteComponent, type);

    await pickFileAndProcess();

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning", text: UNREADABLE_SHEET_MESSAGE }));
    expect(errorHandler).not.toHaveBeenCalled();
  });

  test("on the transport bulk load warns the user what to do instead of failing", async () => {
    await mountScreen(TransporteCalculadora, "LCL");
    await click(byText(".v-tab", "Carga Masiva"));

    await pickFileAndProcess();

    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: "warning", text: UNREADABLE_SHEET_MESSAGE }));
    expect(errorHandler).not.toHaveBeenCalled();
  });
});
