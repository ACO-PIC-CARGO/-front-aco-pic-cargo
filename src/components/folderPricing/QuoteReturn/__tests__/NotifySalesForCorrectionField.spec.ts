import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import NotifySalesForCorrectionField from "../NotifySalesForCorrectionField.vue";

const vuetify = createVuetify({ components, directives });

function mountField(props: { modelValue: boolean; readonly?: boolean }) {
  const wrapper = mount(NotifySalesForCorrectionField, { props, global: { plugins: [vuetify] } });
  const option = (text: string) => wrapper.findAll("button").find((button) => button.text() === text)!;
  const highlighted = () => wrapper.findAll("button").filter((button) => button.classes("bg-primary")).map((button) => button.text());
  return { wrapper, option, highlighted };
}

test.each([
  [true, "Sí"],
  [false, "No"],
])("the saved answer %s is the one highlighted", (modelValue, shown) => {
  expect(mountField({ modelValue }).highlighted()).toEqual([shown]);
});

test("choosing an answer updates the status", async () => {
  const { wrapper, option } = mountField({ modelValue: true });

  await option("No").trigger("click");

  expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
});

test("in read-only mode the answer is shown but cannot be changed", async () => {
  const { wrapper, option, highlighted } = mountField({ modelValue: false, readonly: true });

  await option("Sí").trigger("click");

  expect(option("Sí").attributes("disabled")).toBeDefined();
  expect(highlighted()).toEqual(["No"]);
  expect(wrapper.emitted("update:modelValue")).toBeUndefined();
});
