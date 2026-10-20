import { beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useAppStore } from "@/stores/app";
import { useBancosStore } from "@/stores/bancos";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));

describe("bancos store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    useAppStore().cuentas_pic = [] as never;
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
  });

  test("getListBanksDetailsCargar asks for the branch accounts and hands the rows to bancos and to the root cuentas_pic", async () => {
    respond({ getListBanksDetailsCargar: accepted([{ id: 1, label: "BCP" }]) });
    const bancos = useBancosStore();

    await bancos.getListBanksDetailsCargar();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "getListBanksDetailsCargar",
      params: { id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect(bancos.cuentas).toEqual([{ id: 1, label: "BCP" }]);
    expect(useAppStore().cuentas_pic).toEqual([{ id: 1, label: "BCP" }]);
  });

  test("getListBanksDetailsCargar keeps both lists when the request fails", async () => {
    respond({ getListBanksDetailsCargar: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const bancos = useBancosStore();
    bancos.cuentas = [{ id: 5 }] as never;
    useAppStore().cuentas_pic = [{ id: 6 }] as never;

    await bancos.getListBanksDetailsCargar();

    expect(bancos.cuentas).toEqual([{ id: 5 }]);
    expect(useAppStore().cuentas_pic).toEqual([{ id: 6 }]);
  });

  test("getValidaNroOp keeps the validation, returns the answer and null when the request fails", async () => {
    respond({ validar_nro_operacion: accepted([]) });
    const bancos = useBancosStore();

    const res = await bancos.getValidaNroOp("A-1");

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "validar_nro_operacion?nro_operacion=A-1",
      headers: JSON_HEADERS,
    });
    expect(res).toEqual(accepted([]));
    expect(bancos.validacionBanco).toEqual(accepted([]));

    respond({ validar_nro_operacion: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await bancos.getValidaNroOp("A-2")).toBeNull();
    expect(bancos.validacionBanco).toEqual(accepted([]));
  });
});
