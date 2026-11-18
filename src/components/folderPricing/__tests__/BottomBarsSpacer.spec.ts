import { expect, test } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import BottomBarsSpacer from "../BottomBarsSpacer.vue";
import QuoteBottomBar from "../QuoteBottomBar.vue";
import { BOTTOM_SHEET_HEIGHT } from "../bottomBar";

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const vuetify = createVuetify({ components, directives });

function mountPage() {
  const Host = defineComponent({
    props: { showBar: { type: Boolean, default: true } },
    setup: (props) => () =>
      h(components.VLayout, null, () => [
        props.showBar ? h(QuoteBottomBar, { icon: "mdi-account", title: "Historial del Cliente", label: "Historial", contentId: "history-content" }) : null,
        h(BottomBarsSpacer),
      ]),
  });
  const wrapper = mount(Host, { global: { plugins: [vuetify] } });
  return {
    wrapper,
    toggle: () => wrapper.find("button[aria-controls='history-content']").trigger("click"),
    spacerHeight: () => (wrapper.findComponent(BottomBarsSpacer).element as HTMLElement).style.height,
  };
}

test("an open bottom panel makes room so the actions it would cover can be scrolled into view", async () => {
  const { toggle, spacerHeight } = mountPage();
  expect(spacerHeight()).not.toContain(BOTTOM_SHEET_HEIGHT);

  await toggle();
  expect(spacerHeight()).toContain(BOTTOM_SHEET_HEIGHT);

  await toggle();
  expect(spacerHeight()).not.toContain(BOTTOM_SHEET_HEIGHT);
});

test("a panel that leaves the page while open gives the room back", async () => {
  const { wrapper, toggle, spacerHeight } = mountPage();
  await toggle();

  await wrapper.setProps({ showBar: false });

  expect(spacerHeight()).not.toContain(BOTTOM_SHEET_HEIGHT);
});
