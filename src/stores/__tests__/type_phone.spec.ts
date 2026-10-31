import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useTypePhoneStore } from "@/stores/type_phone";
import { JSON_HEADERS, URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const mobile = { id: 3, code: "MOV", name: "Móvil", status: 1 };
const reload = vi.fn();

describe("type_phone store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
    vi.stubGlobal("location", { reload });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("fetchDataTypePhone lists with the encoded filters and keeps the answer's rows as the list", async () => {
    respond({ getListTypePhone: accepted([mobile]) });
    const typePhone = useTypePhoneStore();

    await typePhone.fetchDataTypePhone({ code: "M V", name: "Mó & vil", status: 1 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "getListTypePhone?id_branch=7&code=M%20V&name=M%C3%B3%20%26%20vil&status=1",
      headers: JSON_HEADERS,
    });
    expect(typePhone.list).toEqual([mobile]);
    expect(sessionStorage.getItem("auth-token")).toBe("tok");
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("fetchDataTypePhone empties the list and shows an error without leaving the screen when the backend rejects", async () => {
    respond({ getListTypePhone: rejected("Sin datos") });
    const typePhone = useTypePhoneStore();
    typePhone.list = [mobile as never];

    await typePhone.fetchDataTypePhone({ code: "", name: "", status: 1 });
    await flushPromises();

    expect(typePhone.list).toEqual([]);
    expect(Swal.fire).toHaveBeenCalledWith({
      icon: "error",
      text: "Sin datos",
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
    });
    expect(router.push).not.toHaveBeenCalled();
  });

  test("fetchDataTypePhone sends the user to Login and reloads when the session expired", async () => {
    vi.useFakeTimers();
    respond({ getListTypePhone: rejected("Token vencido", "401") });

    await useTypePhoneStore().fetchDataTypePhone({ code: "", name: "", status: 1 });
    await flushPromises();
    vi.advanceTimersByTime(10);

    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
    expect(reload).toHaveBeenCalledOnce();
  });

  test("fetchDataTypePhone keeps the list when the request fails", async () => {
    respond({ getListTypePhone: new Error("network") });
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const typePhone = useTypePhoneStore();
    typePhone.list = [mobile as never];

    await typePhone.fetchDataTypePhone({ code: "", name: "", status: 1 });

    expect(typePhone.list).toEqual([mobile]);
    expect(error).toHaveBeenCalledWith("Error al obtener los datos:", expect.any(Error));
  });

  const listReloads = () => httpMock.mock.calls.filter(([config]) => config.url.includes("getListTypePhone"));
  const unfilteredList = URL_MAIN + "getListTypePhone?id_branch=7&code=&name=&status=1";

  test("insertTypePhone posts the record and reloads the unfiltered list, not the page, once the user closes the message", async () => {
    respond({ insertTypePhone: accepted([]), getListTypePhone: accepted([mobile]) });
    const typePhone = useTypePhoneStore();

    const confirmed = await typePhone.insertTypePhone({ code: "MOV", name: "Móvil", status: 1 });

    expect(httpMock).toHaveBeenCalledWith({
      method: "post",
      url: URL_MAIN + "insertTypePhone",
      headers: JSON_HEADERS,
      data: { code: "MOV", name: "Móvil", status: 1 },
    });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", text: "ok", showCancelButton: false, confirmButtonText: "Ok" });
    expect(confirmed).toBe(true);
    expect(listReloads().map(([config]) => config.url)).toEqual([unfilteredList]);
    expect(reload).not.toHaveBeenCalled();
  });

  test("insertTypePhone does not reload when the user dismisses the message", async () => {
    respond({ insertTypePhone: rejected("Duplicado") });
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: false } as never);

    const confirmed = await useTypePhoneStore().insertTypePhone({ code: "MOV" });

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Duplicado" });
    expect(confirmed).toBe(false);
    expect(listReloads()).toEqual([]);
  });

  test("updateTypePhone puts the record and only tells the user when the backend accepts", async () => {
    respond({ updateTypePhone: accepted([]), getListTypePhone: accepted([mobile]) });
    const typePhone = useTypePhoneStore();

    expect(await typePhone.updateTypePhone({ id: 3, name: "Móvil", status: 1 })).toBe(true);

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "updateTypePhone",
      headers: JSON_HEADERS,
      data: { id: 3, name: "Móvil", status: 1 },
    });
    expect(listReloads().map(([config]) => config.url)).toEqual([unfilteredList]);

    vi.mocked(Swal.fire).mockClear();
    httpMock.mockClear();
    respond({ updateTypePhone: rejected("Duplicado") });
    expect(await typePhone.updateTypePhone({ id: 3 })).toBe(false);
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(listReloads()).toEqual([]);
    expect(reload).not.toHaveBeenCalled();
  });

  test("inactiveTypePhone puts the id to deleteTypePhone and reloads the list, not the page, after the message", async () => {
    respond({ deleteTypePhone: accepted([]), getListTypePhone: accepted([mobile]) });

    expect(await useTypePhoneStore().inactiveTypePhone({ id: 3 })).toBe(true);

    expect(httpMock).toHaveBeenCalledWith({
      method: "put",
      url: URL_MAIN + "deleteTypePhone",
      headers: JSON_HEADERS,
      data: { id: 3 },
    });
    expect(listReloads().map(([config]) => config.url)).toEqual([unfilteredList]);
    expect(reload).not.toHaveBeenCalled();
  });

  test("readTypePhone keeps the answer's row as the record, or shows the backend message", async () => {
    respond({ readTypePhone: accepted([mobile]) });
    const typePhone = useTypePhoneStore();

    await typePhone.readTypePhone(3);

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "readTypePhone?id=3", headers: JSON_HEADERS });
    expect(typePhone.record).toEqual(mobile);

    respond({ readTypePhone: rejected("No existe") });
    await typePhone.readTypePhone(9);
    expect(typePhone.record).toEqual(mobile);
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });
});
