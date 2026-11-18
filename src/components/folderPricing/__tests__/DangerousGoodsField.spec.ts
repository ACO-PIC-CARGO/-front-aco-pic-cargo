import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import DangerousGoodsField from "../DangerousGoodsField.vue";

const render = (modelValue: boolean | null) =>
  mount(DangerousGoodsField, { props: { modelValue }, global: { plugins: [createVuetify()] } });

test("answering yes asks for MSDS and CNASS and warns that quoting is not possible without them", () => {
  const text = render(true).text();
  expect(text).toContain("Debes solicitar al cliente los siguientes documentos:");
  expect(text).toContain("MSDS");
  expect(text).toContain("CNASS");
  expect(text).toContain("Sin estos documentos no podrás cotizar.");
});

test.each([null, false])("answer %s shows no documents note", (answer) => {
  const text = render(answer).text();
  expect(text).not.toContain("MSDS");
  expect(text).not.toContain("Sin estos documentos");
});
