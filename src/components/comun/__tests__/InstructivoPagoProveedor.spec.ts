import { describe, expect, test, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import InstructivoStep from "@/components/comun/InstructivoStep.vue";
import ArrastraYSolarComponentFile from "@/components/comun/ArrastraYSolarComponentFile.vue";

const swalFire = vi.hoisted(() => vi.fn(() => Promise.resolve({ isConfirmed: false })));
vi.mock("sweetalert2", () => ({ default: { fire: swalFire } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const vuetify = () => createVuetify({ components, directives });

describe("InstructivoStep", () => {
  test("a dotted number (7.2) renders as a sub-step with the pill and separator", () => {
    const wrapper = mount(InstructivoStep, {
      props: { number: "7.2", title: "Método de Pago al Proveedor" },
      global: { plugins: [vuetify()] },
    });
    expect(wrapper.classes()).toContain("is-sub");
    expect(wrapper.find(".ins-step__sep").exists()).toBe(true);
    expect(wrapper.find(".ins-step__num").text()).toBe("7.2");
  });

  test("a main step keeps the round number and shows the subtitle and aside slot", () => {
    const wrapper = mount(InstructivoStep, {
      props: { number: 7, title: "Pago", subtitle: "(Tarjeta de Débito / Crédito)" },
      slots: { aside: "<span class='brand'>Alibaba</span>" },
      global: { plugins: [vuetify()] },
    });
    expect(wrapper.classes()).not.toContain("is-sub");
    expect(wrapper.find(".ins-step__subtitle").text()).toBe("(Tarjeta de Débito / Crédito)");
    expect(wrapper.find(".brand").exists()).toBe(true);
  });
});

describe("ArrastraYSolarComponentFile (zona)", () => {
  function mountZona() {
    const pinia = createPinia();
    setActivePinia(pinia);
    return mount(ArrastraYSolarComponentFile, {
      props: { zona: true, accept: ".pdf", titulo: "Subir contrato (PDF)" },
      global: { plugins: [vuetify(), pinia] },
    });
  }

  test("shows the dashed drop area with its title", () => {
    const wrapper = mountZona();
    expect(wrapper.find(".adj-file__zona").exists()).toBe(true);
    expect(wrapper.text()).toContain("Subir contrato (PDF)");
  });

  test("rejects a dropped file that is not a PDF without uploading it", async () => {
    swalFire.mockClear();
    const wrapper = mountZona();
    const archivo = new File(["x"], "foto.png", { type: "image/png" });
    await wrapper.find(".adj-file__zona").trigger("drop", { dataTransfer: { files: [archivo] } });
    expect(swalFire).toHaveBeenCalledWith(expect.objectContaining({ title: "Archivo no permitido" }));
    expect(wrapper.emitted("archivo-cargado")).toBeUndefined();
    expect(wrapper.find(".adj-file__zona").exists()).toBe(true);
  });
});
