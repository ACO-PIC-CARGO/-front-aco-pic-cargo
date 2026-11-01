import { expect, test, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import VerUserComponent from "@/components/Users/VerUserComponent.vue";
import { URL_MAIN, accepted, httpMock } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("vue-router", () => ({ useRoute: () => ({ params: { id: "4" } }), useRouter: () => ({ push: vi.fn() }) }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) } }));

globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

test("viewing a user no longer asks for the old role list", async () => {
  sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7, id_user: 4 }]));
  httpMock.mockImplementation(async (config) => ({
    data: accepted(config.url.startsWith(URL_MAIN + "ver_usuario") ? [{ id: 4, positions: [], sucursales: [] }] : []),
  }));
  setActivePinia(createPinia());

  const wrapper = mount(VerUserComponent, {
    global: { plugins: [createVuetify({ components, directives })], stubs: { VOverlay: true } },
  });
  await flushPromises();

  expect(httpMock.mock.calls.map(([config]) => config.url).filter((url) => url.includes("posicion"))).toEqual([]);
  wrapper.unmount();
});
