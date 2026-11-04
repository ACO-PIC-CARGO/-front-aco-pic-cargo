import { expect, test } from "vitest";
import { defineComponent, nextTick, ref } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import vuetify from "@/plugins/vuetify";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const required = [(v: unknown) => !!v || "Dato requerido"];

const mountForm = () => {
  const value = ref<string | undefined>(undefined);
  const wrapper = mount(
    defineComponent({
      components: { ...components },
      setup: () => ({ value, required }),
      template: `<v-form ref="form"><v-text-field v-model="value" label="Nombre" :rules="required" /></v-form>`,
    }),
    { global: { plugins: [vuetify], directives } },
  );
  return { wrapper, value };
};

test("a value loaded by code into a required field shows no error, as in Vuetify 2", async () => {
  const { wrapper, value } = mountForm();
  await flushPromises();

  value.value = "";
  await nextTick();
  await flushPromises();

  expect(wrapper.find(".v-input--error").exists()).toBe(false);
});

test("saving still marks the missing field, and the mark clears as soon as it is filled", async () => {
  const { wrapper, value } = mountForm();
  await flushPromises();

  await (wrapper.vm.$refs.form as { validate: () => Promise<unknown> }).validate();
  await flushPromises();
  expect(wrapper.find(".v-input--error").exists()).toBe(true);

  value.value = "ACO";
  await nextTick();
  await flushPromises();
  expect(wrapper.find(".v-input--error").exists()).toBe(false);
});
