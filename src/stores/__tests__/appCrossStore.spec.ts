import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { watch } from "vue";
import { useAppStore } from "@/stores/app";
import { useBancosStore } from "@/stores/bancos";
import { useMastersStore } from "@/stores/masters";
import { useSecuritysStore } from "@/stores/securitys";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("app writes that land in other stores", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 21, id_branch: 7 }]));
  });
  afterEach(() => vi.restoreAllMocks());

  test("_setItemsMenu sets the app menu first and then flags the securitys menu as loaded", () => {
    const app = useAppStore();
    const securitys = useSecuritysStore();
    const flagWhenMenuChanged: unknown[] = [];
    watch(
      () => app.itemsMenu,
      () => flagWhenMenuChanged.push(securitys.dataMenu),
      { flush: "sync" }
    );
    const menu = [{ id: 1, name: "Inicio" }];

    app._setItemsMenu(menu);

    expect(app.itemsMenu).toEqual(menu);
    expect(flagWhenMenuChanged).toEqual([false]);
    expect(securitys.dataMenu).toBe(true);
  });

  test("_getnroHouse sets the app file number first and then the masters house number", async () => {
    const app = useAppStore();
    const masters = useMastersStore();
    const numberWhenFileChanged: unknown[] = [];
    watch(
      () => app.house_expediente,
      () => numberWhenFileChanged.push(masters.house_nro_expediente),
      { flush: "sync" }
    );
    respond({ getNroHouse: accepted([{ nro_house: 57 }]) });

    await app._getnroHouse();

    expect(httpMock.mock.lastCall![0]).toEqual({
      method: "post",
      url: URL_MAIN + "getNroHouse?id_branch=7",
      headers: JSON_HEADERS,
    });
    expect(app.house_expediente).toBe(new Date().getFullYear() + "HBL57");
    expect(numberWhenFileChanged).toEqual([""]);
    expect(masters.house_nro_expediente).toBe(57);
  });

  test("SET_CUENTAS hands the same accounts to the app first and then to bancos", () => {
    const app = useAppStore();
    const bancos = useBancosStore();
    const bancosWhenAppChanged: unknown[] = [];
    watch(
      () => app.cuentas_pic,
      () => bancosWhenAppChanged.push(bancos.cuentas.length),
      { flush: "sync" }
    );
    const cuentas = [{ id: 3, label: "BBVA", cuenta: "1", cci: "2", symbol: "S/" }];

    app.SET_CUENTAS(cuentas);

    expect(bancosWhenAppChanged).toEqual([0]);
    expect(bancos.cuentas).toBe(app.cuentas_pic);
    expect(bancos.cuentas).toEqual(cuentas);
  });

  test("getListBanksDetailsCargarPorSucursal fills the app and bancos accounts", async () => {
    const app = useAppStore();
    const cuentas = [{ id: 4, label: "BCP", cuenta: "1", cci: "2", symbol: "$" }];
    respond({ getListBanksDetailsCargarPorSucursal: accepted(cuentas) });

    await app.getListBanksDetailsCargarPorSucursal();

    expect(httpMock.mock.lastCall![0]).toEqual({
      method: "get",
      url: URL_MAIN + "getListBanksDetailsCargarPorSucursal",
      params: { id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect(app.cuentas_pic).toEqual(cuentas);
    expect(useBancosStore().cuentas).toBe(app.cuentas_pic);
  });
});
