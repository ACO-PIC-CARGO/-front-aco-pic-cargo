import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import type { VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import http from "@/api/http";
import ClientTrackingPreview from "@/components/HouseFile/ClientTrackingPreview.vue";
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
let wrapper: VueWrapper;
let open: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  open = vi.spyOn(window, "open").mockReturnValue(null);
});
afterEach(() => {
  wrapper.unmount();
  open.mockRestore();
});

async function clickView(token: string | undefined) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useHousesStore().house.token_rastreo = token;
  wrapper = mount(ClientTrackingPreview, {
    props: { houseId: 2892 },
    global: { plugins: [createVuetify({ components, directives }), pinia] },
  });
  await wrapper.findAll("button").find((button) => button.text() === "Ver")!.trigger("click");
  await flushPromises();
}

test("«Ver» opens the client tracking of the house in a new window", async () => {
  await clickView("tok-1");
  expect(open).toHaveBeenCalledWith(`${window.location.origin}/tracking/tok-1`, "_blank", "noopener");
});

test("a house without a tracking link gets one before it is opened", async () => {
  httpMock.mockResolvedValueOnce({ data: { estadoflag: true, mensaje: null, tipomensaje: null, data: [{ token: "tok-2" }] } });
  await clickView(undefined);
  expect(httpMock).toHaveBeenCalledWith(expect.objectContaining({ method: "put", url: "setTrackingToken" }));
  expect(open).toHaveBeenCalledWith(`${window.location.origin}/tracking/tok-2`, "_blank", "noopener");
});
