import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { toRaw } from "vue";
import { createStore } from "vuex";
import aduana from "@/store/modules/aduana";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));
vi.mock("@/store", () => ({ default: { state: {}, commit: vi.fn() } }));

describe.each([["aduana", aduana]])("configEmpresa shared mutations committed by the %s Vuex module", (key, module) => {
  beforeEach(() => setActivePinia(createPinia()));

  test("SET_MULTPLICADOR hands the same rows to configEmpresa and still fills its own list", () => {
    const vuex = createStore({ modules: { [key]: module } });
    const rows = [{ id: 1, value: 1, text: "Contenedor", valor: 5 }];

    vuex.commit("SET_MULTPLICADOR", rows);

    expect(toRaw(useConfigEmpresaStore().lstMultiplicador)).toBe(rows);
    expect(toRaw(vuex.state[key].listMultiplicador)).toBe(rows);
  });

  test("SET_TIPO_COSTOS hands the same rows to configEmpresa and still fills its own lists", () => {
    const vuex = createStore({ modules: { [key]: module } });
    const rows = [{ name: "ORIGEN", codigo: "OR" }];

    vuex.commit("SET_TIPO_COSTOS", rows);

    expect(toRaw(useConfigEmpresaStore().listTipoCostos)).toBe(rows);
    expect(toRaw(vuex.state[key].listTipoCostos)).toBe(rows);
    expect(toRaw(vuex.state[key].namesection)).toBe(rows);
  });
});
