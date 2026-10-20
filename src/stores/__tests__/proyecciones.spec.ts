import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import router from "@/router";
import { useProyeccionesStore } from "@/stores/proyecciones";
import { URL_MAIN, accepted, flushPromises, httpMock, rejected, respond } from "./catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn(), go: vi.fn() } }));
vi.mock("@/store", () => ({ default: { state: {}, commit: vi.fn(), dispatch: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const filtro = { id_month: 3, id_year: 2026, correlativo: "C1", total_proyectado_ext: 10, estado: 1, aprobadoflag: 0 };

describe("proyecciones store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 7 }]));
    vi.mocked(Swal.fire).mockResolvedValue({ isConfirmed: true } as never);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("getProyeccion builds the filter URL and keeps the rows", async () => {
    respond({ list_proyeccion: accepted([{ id: 1 }]) });
    const proyecciones = useProyeccionesStore();

    await proyecciones.getProyeccion(filtro);

    expect(httpMock.mock.calls[0]![0].url).toBe(
      URL_MAIN +
        "list_proyeccion?id_branch=7&id_month=3&id_year=2026&correlativo=C1&total_proyectado_ext=10&estado=1&aprobadoflag=0",
    );
    expect(httpMock.mock.calls[0]![0].data).toEqual(filtro);
    expect(proyecciones.listProyeccion).toEqual([{ id: 1 }]);
  });

  test("getProyeccion empties the list, shows the error and goes to Login on a 401", async () => {
    vi.useFakeTimers();
    respond({ list_proyeccion: rejected("Token vencido", "401") });
    const proyecciones = useProyeccionesStore();
    proyecciones.listProyeccion = [{ id: 9 }];

    await proyecciones.getProyeccion(filtro);
    await flushPromises();

    expect(proyecciones.listProyeccion).toEqual([]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "error", text: "Token vencido" });
    expect(router.push).toHaveBeenCalledWith({ name: "Login" });
  });

  test("verProyeccion keeps the first row and the token, and warns when rejected", async () => {
    respond({ ver_proyeccion: { ...accepted([{ id: 2, id_month: 5 }]), token: "tok-v" } });
    const proyecciones = useProyeccionesStore();

    await proyecciones.verProyeccion(2);

    expect(proyecciones.proyeccion).toEqual({ id: 2, id_month: 5 });
    expect(sessionStorage.getItem("auth-token")).toBe("tok-v");

    respond({ ver_proyeccion: rejected("No existe") });
    await proyecciones.verProyeccion(3);
    expect(proyecciones.proyeccion).toEqual({ id: 2, id_month: 5 });
    expect(Swal.fire).toHaveBeenCalledWith({ icon: "error", text: "No existe" });
  });

  test.each([
    ["setProyeccion", "insertar_proyeccion"],
    ["updateProyeccion", "update_proyeccion"],
  ] as const)("%s goes back one page only when the backend accepts", async (name, path) => {
    const proyecciones = useProyeccionesStore();

    respond({ [path]: rejected("Datos incompletos") });
    await proyecciones[name]({ a: 1 });
    expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "Datos incompletos" });
    expect(router.go).not.toHaveBeenCalled();

    respond({ [path]: accepted([]) });
    await proyecciones[name]({ a: 1 });
    expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "success", text: "ok" });
    expect(router.go).toHaveBeenCalledWith(-1);
  });

  test("validateProyeccionAprobacion sends the branch in the URL and returns the answer or null", async () => {
    respond({ validate_proyeccion_aprobacion: accepted([]) });
    const proyecciones = useProyeccionesStore();

    expect(await proyecciones.validateProyeccionAprobacion({ id: 1 })).toEqual(accepted([]));
    expect(httpMock.mock.calls[0]![0].url).toBe(URL_MAIN + "validate_proyeccion_aprobacion?id_branch=7");

    respond({ validate_proyeccion_aprobacion: new Error("network") });
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await proyecciones.validateProyeccionAprobacion({ id: 1 })).toBeNull();
  });

  test("copiarProyeccion shows the message as html", async () => {
    respond({ copiar_proyeccion: { ...accepted([]), mensaje: "<b>Copiada</b>" } });

    await useProyeccionesStore().copiarProyeccion({ id: 1 });

    expect(Swal.fire).toHaveBeenCalledWith({ icon: "success", html: "<b>Copiada</b>" });
  });

  test("primeraProyeccion opens the editor of the generated projection when accepted", async () => {
    respond({ generar_primerar_proyeccion: accepted([{ id: 12 }]) });

    await useProyeccionesStore().primeraProyeccion({});

    expect(router.push).toHaveBeenCalledWith({ name: "editarProyeccion", params: { id: 12 } });
  });

  test("getProyeccionAprobada keeps the month and year label and warns when rejected", async () => {
    respond({ proyeccion_aprobada: accepted([{ proyeccion_mes_anio: "03-2026" }]) });
    const proyecciones = useProyeccionesStore();

    await proyecciones.getProyeccionAprobada();
    expect(proyecciones.proyeccionaprobada).toBe("03-2026");

    respond({ proyeccion_aprobada: rejected("Sin proyección") });
    await proyecciones.getProyeccionAprobada();
    expect(proyecciones.proyeccionaprobada).toBe("03-2026");
    expect(Swal.fire).toHaveBeenLastCalledWith({ icon: "error", text: "Sin proyección" });
  });
});
