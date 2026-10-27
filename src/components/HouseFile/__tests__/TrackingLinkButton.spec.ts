import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import http from "@/api/http";
import TrackingLinkButton from "@/components/HouseFile/TrackingLinkButton.vue";
import { useHousesStore } from "@/stores/houses";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const httpMock = http as unknown as Mock<(config: { method: string; url: string }) => Promise<{ data: unknown }>>;
const writeText = vi.fn(async () => {});
Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
let wrapper: VueWrapper;

beforeEach(() => vi.clearAllMocks());
afterEach(() => wrapper.unmount());

async function clickCopy(token: string | undefined) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useHousesStore().house.token_rastreo = token;
  wrapper = mount(TrackingLinkButton, {
    props: { houseId: 2892 },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
    attachTo: document.body,
  });
  await wrapper.find("button").trigger("click");
  await flushPromises();
}

test("copying the link puts the client tracking link on the clipboard without opening a dialog", async () => {
  await clickCopy("tok-1");
  expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/tracking/tok-1`);
  expect(document.body.querySelector(".v-overlay--active")).toBeNull();
});

test("a house without a link gets one before it is copied", async () => {
  httpMock.mockResolvedValueOnce({ data: { estadoflag: true, mensaje: null, tipomensaje: null, data: [{ token: "tok-2" }] } });
  await clickCopy(undefined);
  expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({ method: "put", url: "setTrackingToken" }));
  expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/tracking/tok-2`);
});
