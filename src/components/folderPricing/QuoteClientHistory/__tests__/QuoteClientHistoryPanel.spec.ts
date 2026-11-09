import { beforeEach, expect, test, vi } from "vitest";
import { defineComponent, h } from "vue";
import type { PropType } from "vue";
import { mount } from "@vue/test-utils";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import QuoteClientHistoryPanel from "../QuoteClientHistoryPanel.vue";
import { httpMock, rejected } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("vue-router", () => ({ useRouter: () => ({ resolve: () => ({ href: "#" }) }) }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const vuetify = createVuetify({ components, directives });

function mountPanel(props: { clientId: number | null; visible: boolean }) {
  const Host = defineComponent({
    props: { clientId: { type: Number as PropType<number | null>, default: null }, visible: Boolean },
    setup: (hostProps) => () =>
      h(components.VLayout, null, () => h(QuoteClientHistoryPanel, { clientId: hostProps.clientId, visible: hostProps.visible })),
  });
  return mount(Host, { props, global: { plugins: [vuetify] } });
}

const isHidden = (wrapper: ReturnType<typeof mountPanel>) => wrapper.find("section").element.style.display === "none";

beforeEach(() => {
  httpMock.mockReset();
  httpMock.mockResolvedValue({ data: rejected() });
});

test("an open panel closes and hides when it leaves the tabs where it belongs", async () => {
  const wrapper = mountPanel({ clientId: 41, visible: true });
  const bar = () => wrapper.find("button[aria-controls='client-history-content']");
  await bar().trigger("click");
  expect(bar().attributes("aria-expanded")).toBe("true");

  await wrapper.setProps({ visible: false });
  expect(isHidden(wrapper)).toBe(true);

  await wrapper.setProps({ visible: true });
  expect(isHidden(wrapper)).toBe(false);
  expect(bar().attributes("aria-expanded")).toBe("false");
});

test("without a client the panel is not shown, so the keyboard cannot reach it", () => {
  const wrapper = mountPanel({ clientId: null, visible: true });

  expect(isHidden(wrapper)).toBe(true);
});
