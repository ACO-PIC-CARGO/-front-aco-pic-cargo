import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useConfigAvisoStore } from "@/stores/configAviso";
import { JSON_HEADERS, URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("configAviso store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id_branch: 7 }]));
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  test("obtenerConfigAviso asks for the session branch and keeps the first row when the backend accepts", async () => {
    respond({ get_ver_configaviso: accepted([{ aviso_llegada: "<p>a</p>" }, { aviso_llegada: "<p>b</p>" }]) });
    const configAviso = useConfigAvisoStore();

    await configAviso.obtenerConfigAviso();

    expect(httpMock).toHaveBeenCalledWith({
      method: "get",
      url: URL_MAIN + "get_ver_configaviso",
      params: { id_branch: 7 },
      headers: JSON_HEADERS,
    });
    expect(configAviso.configAviso).toEqual({ aviso_llegada: "<p>a</p>" });
  });

  test("obtenerConfigAviso keeps the current config when the backend rejects or the request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const configAviso = useConfigAvisoStore();
    configAviso.configAviso = { aviso_llegada: "<p>x</p>" };

    respond({ get_ver_configaviso: rejected() });
    await configAviso.obtenerConfigAviso();
    respond({ get_ver_configaviso: new Error("network") });
    await configAviso.obtenerConfigAviso();

    expect(configAviso.configAviso).toEqual({ aviso_llegada: "<p>x</p>" });
  });

  test("actualizarConfigAviso sends the config with a PUT and thanks the user only when the backend accepts", async () => {
    const configAviso = useConfigAvisoStore();
    respond({ actualizarConfigAviso: { ...accepted([]), mensaje: "Guardado" } });
    await configAviso.actualizarConfigAviso({ aviso_llegada: "<p>n</p>" });
    expect(httpMock).toHaveBeenCalledWith({
      method: "PUT",
      url: URL_MAIN + "actualizarConfigAviso",
      data: { aviso_llegada: "<p>n</p>" },
      headers: JSON_HEADERS,
    });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toEqual({ icon: "success", text: "Guardado" });

    vi.mocked(Swal.fire).mockClear();
    respond({ actualizarConfigAviso: rejected() });
    await configAviso.actualizarConfigAviso({});
    expect(Swal.fire).not.toHaveBeenCalled();
  });
});
