import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import store from "@/store";
import { useBancosStore } from "@/stores/bancos";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));

describe("root SET_CUENTAS keeps writing the bancos accounts it wrote while bancos was a Vuex module", () => {
  beforeEach(() => setActivePinia(createPinia()));

  test("a root commit fills the root cuentas_pic and the bancos cuentas", () => {
    store.commit("SET_CUENTAS", [{ id: 3, label: "BBVA" }]);

    expect(store.state.cuentas_pic).toEqual([{ id: 3, label: "BBVA" }]);
    expect(useBancosStore().cuentas).toEqual([{ id: 3, label: "BBVA" }]);
  });
});
