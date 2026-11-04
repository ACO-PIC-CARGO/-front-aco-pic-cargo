import { beforeAll, expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import { VAutocomplete, VSelect } from "vuetify/components";
import { showEmptyStringAsNoSelection } from "@/plugins/emptySelectValue";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => showEmptyStringAsNoSelection());

const hasSelection = (component: typeof VSelect, modelValue: unknown, items: unknown[]) =>
  mount(component, {
    props: { label: "País", modelValue, items, itemTitle: "name", itemValue: "id" },
    global: { plugins: [createVuetify({ components })] },
  }).find(".v-field--dirty").exists();

test.each([
  ["select", VSelect],
  ["autocomplete", VAutocomplete],
])("an empty-string %s shows no selection, as in Vuetify 2", (_, component) => {
  expect(hasSelection(component as typeof VSelect, "", [{ id: 1, name: "Perú" }])).toBe(false);
});

test("a real choice still shows as selected", () => {
  expect(hasSelection(VSelect, 1, [{ id: 1, name: "Perú" }])).toBe(true);
});

test("an empty string that is one of the options still shows as that option", () => {
  expect(hasSelection(VSelect, "", [{ id: "", name: "Todos" }])).toBe(true);
});
