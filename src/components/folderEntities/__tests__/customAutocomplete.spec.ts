import { expect, test } from "vitest";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import CustomAutocomplete from "@/components/folderEntities/CustomAutocomplete.vue";

const mountWith = (props: Record<string, unknown>) =>
  mount(CustomAutocomplete, {
    props: { label: "Nombre Completo", value: "", ...props },
    global: { plugins: [createVuetify({ components, directives })] },
  });

test.each([
  ["there are no matches", { items: [] }],
  ["matches are still loading", { items: [{ id: 1, nombrecompleto: "Ana" }], loading: true }],
])("the suggestion panel is not drawn when %s", (_, props) => {
  expect(mountWith(props).find(".customAutocomplete").exists()).toBe(false);
});

test("the suggestion panel lists the matches", () => {
  const wrapper = mountWith({ items: [{ id: 1, nombrecompleto: "Ana", telefono: "999" }] });

  expect(wrapper.find(".customAutocomplete").text()).toBe("Ana - 999");
});
