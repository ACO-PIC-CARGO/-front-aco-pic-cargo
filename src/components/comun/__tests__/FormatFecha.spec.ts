import { describe, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { VDatePicker, VTextField } from "vuetify/components";
import FormatFecha from "@/components/comun/FormatFecha.vue";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

Object.defineProperty(window, "visualViewport", {
  value: { width: 1024, height: 768, addEventListener() {}, removeEventListener() {} },
  configurable: true,
});

function mountFormatFecha(props: Record<string, unknown> = {}) {
  return mount(FormatFecha, {
    props,
    attachTo: document.body,
    global: { plugins: [createVuetify({ components, directives })] },
  });
}

describe("FormatFecha", () => {
  test("emits the picked date as YYYY-MM-DD", async () => {
    const wrapper = mountFormatFecha();
    await wrapper.find("input").trigger("click");
    const picker = wrapper.findComponent(VDatePicker);
    picker.vm.$emit("update:modelValue", new Date(2026, 9, 5));
    expect(wrapper.emitted("update:modelValue")).toEqual([["2026-10-05"]]);
    wrapper.unmount();
  });

  test("emits null when the field is cleared", async () => {
    const wrapper = mountFormatFecha({ modelValue: "2026-10-05", clearable: true });
    wrapper.findComponent(VTextField).vm.$emit("click:clear");
    expect(wrapper.emitted("update:modelValue")).toEqual([[null]]);
    wrapper.unmount();
  });

  test("shows the date as DD/MMM/YYYY in Spanish", () => {
    const wrapper = mountFormatFecha({ modelValue: "2026-10-05" });
    expect(wrapper.find("input").element.value).toBe("05/OCT/2026");
    wrapper.unmount();
  });
});
