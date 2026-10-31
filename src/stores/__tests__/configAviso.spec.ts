import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import { useConfigAvisoStore } from "@/stores/configAviso";
import { CONNECTION_ERROR_MESSAGE } from "@/utils/request";
import { URL_MAIN, accepted, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

describe("configAviso store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });
  afterEach(() => vi.restoreAllMocks());

  test("loads the session branch's template", async () => {
    respond({ get_ver_configaviso: accepted([{ aviso_llegada: "<p>a</p>", aviso_llegada_original: "<p>o</p>" }]) });
    const configAviso = useConfigAvisoStore();

    await configAviso.obtenerConfigAviso();

    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: URL_MAIN + "get_ver_configaviso" });
    expect(configAviso.configAviso).toEqual({ aviso_llegada: "<p>a</p>", aviso_llegada_original: "<p>o</p>" });
    expect([configAviso.loading, configAviso.loadError]).toEqual([false, ""]);
  });

  test("keeps the current template and explains why when loading fails", async () => {
    const configAviso = useConfigAvisoStore();
    configAviso.configAviso = { aviso_llegada: "<p>x</p>" };
    respond({ get_ver_configaviso: new Error("network") });

    await configAviso.obtenerConfigAviso();

    expect(configAviso.configAviso).toEqual({ aviso_llegada: "<p>x</p>" });
    expect(configAviso.loadError).toBe(CONNECTION_ERROR_MESSAGE);
  });

  test("saves only the template and reloads what the server kept", async () => {
    const configAviso = useConfigAvisoStore();
    respond({
      actualizarConfigAviso: { ...accepted([]), mensaje: "Guardamos el aviso de llegada." },
      get_ver_configaviso: accepted([{ aviso_llegada: "<p>limpio</p>" }]),
    });

    await configAviso.actualizarConfigAviso({ aviso_llegada: "<p>n</p>", aviso_llegada_original: "<p>o</p>" });

    expect(httpMock).toHaveBeenCalledWith({ method: "put", url: URL_MAIN + "actualizarConfigAviso", data: { aviso_llegada: "<p>n</p>" } });
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success", text: "Guardamos el aviso de llegada." });
    expect(configAviso.configAviso).toEqual({ aviso_llegada: "<p>limpio</p>" });
  });

  test("shows the server's reason when it refuses the template", async () => {
    const configAviso = useConfigAvisoStore();
    respond({ actualizarConfigAviso: { ...rejected("Escribe el contenido del aviso antes de guardarlo."), tipomensaje: "TMSGADV" } });

    await configAviso.actualizarConfigAviso({ aviso_llegada: " " });

    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "warning",
      text: "Escribe el contenido del aviso antes de guardarlo.",
    });
    expect(configAviso.saving).toBe(false);
  });

  test("a second save while one is in progress sends nothing", async () => {
    let finish: (value: { data: unknown }) => void = () => {};
    httpMock.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)));
    const configAviso = useConfigAvisoStore();

    const first = configAviso.actualizarConfigAviso({ aviso_llegada: "<p>a</p>" });
    await configAviso.actualizarConfigAviso({ aviso_llegada: "<p>b</p>" });
    finish({ data: rejected("x") });
    await first;

    expect(httpMock).toHaveBeenCalledTimes(1);
  });
});
