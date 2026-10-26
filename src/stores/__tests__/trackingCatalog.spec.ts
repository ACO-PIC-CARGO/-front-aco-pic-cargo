import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import { stepRangeLabel, useTrackingCatalogStore } from "@/stores/trackingCatalog";
import type { TrackingPhase, TrackingStep } from "@/types/trackingCatalog";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface RequestConfig {
  method: string;
  url: string;
  data?: unknown;
}

const httpMock = http as unknown as Mock<(config: RequestConfig) => Promise<{ data: unknown }>>;
let unexpected: string[] = [];

function respond(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async (config) => {
    const key = `${config.method} ${config.url}`;
    if (!(key in bodies)) {
      unexpected.push(key);
      throw new Error(`unexpected request ${key}`);
    }
    const body = bodies[key];
    if (body instanceof Error) throw body;
    return { data: body };
  });
}

const sent = () => httpMock.mock.calls.map(([config]) => `${config.method} ${config.url}`);
const accepted = (data: unknown[] = [], mensaje = "ok") => ({ estadoflag: true, mensaje, tipomensaje: "TMSGINF", data });
const rejected = (mensaje: string, tipomensaje = "TMSGADV") => ({ estadoflag: false, mensaje, tipomensaje, data: [] });

const step = (over: Partial<TrackingStep> = {}): TrackingStep => ({
  id: 5,
  name: "Pago al proveedor",
  icon: "mdi-currency-usd",
  sort_order: 1,
  number: 1,
  visible_to_client: true,
  active: true,
  ...over,
});

const phase = (over: Partial<TrackingPhase> = {}): TrackingPhase => ({
  id: 7,
  name: "Fábrica",
  icon: "mdi-factory",
  sort_order: 1,
  active: true,
  first_step_number: 1,
  last_step_number: 1,
  steps: [step()],
  ...over,
});

describe("trackingCatalog store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    unexpected = [];
  });

  afterEach(() => {
    expect(unexpected).toEqual([]);
  });

  test("loadCatalog keeps the phases the API returns", async () => {
    respond({ "get tracking_catalog": accepted([phase()]) });
    const store = useTrackingCatalogStore();
    expect(await store.loadCatalog()).toBeNull();
    expect(store.phases).toEqual([phase()]);
    expect(store.loading).toBe(false);
  });

  test("loadCatalog shows an empty catalog when the company has no phases", async () => {
    respond({ "get tracking_catalog": rejected("No se encontraron registros", "TMSGINF") });
    const store = useTrackingCatalogStore();
    store.phases = [phase()];
    expect(await store.loadCatalog()).toBeNull();
    expect(store.phases).toEqual([]);
  });

  test("loadCatalog keeps the current phases and returns the reason when the request fails", async () => {
    respond({ "get tracking_catalog": new Error("network") });
    const store = useTrackingCatalogStore();
    store.phases = [phase()];
    expect(await store.loadCatalog()).toBe(
      "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.",
    );
    expect(store.phases).toEqual([phase()]);
  });

  test("savePhase creates a phase, confirms it and reloads the catalog", async () => {
    respond({
      "post tracking_phases": accepted([{ id: 9 }], "Guardamos la fase."),
      "get tracking_catalog": accepted([phase()]),
    });
    const store = useTrackingCatalogStore();
    expect(await store.savePhase({ id: null, name: "Fábrica", icon: "mdi-factory", active: true })).toBeNull();
    expect(httpMock.mock.calls[0]![0]).toEqual({
      method: "post",
      url: "tracking_phases",
      data: { name: "Fábrica", icon: "mdi-factory", active: true },
    });
    expect(sent()).toEqual(["post tracking_phases", "get tracking_catalog"]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success", titleText: "Guardamos la fase." });
    expect(store.phases).toEqual([phase()]);
  });

  test("savePhase and saveStep update an existing item by its id", async () => {
    respond({
      "put tracking_phases/7": accepted(),
      "put tracking_steps/5": accepted(),
      "get tracking_catalog": accepted([phase()]),
    });
    const store = useTrackingCatalogStore();
    await store.savePhase({ id: 7, name: "Origen", icon: "mdi-factory", active: false });
    await store.saveStep({
      id: 5,
      phase_id: 8,
      name: "Pago",
      icon: "mdi-cash",
      visible_to_client: false,
      active: true,
    });
    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url, config.data])).toEqual([
      ["put", "tracking_phases/7", { name: "Origen", icon: "mdi-factory", active: false }],
      ["get", "tracking_catalog", undefined],
      ["put", "tracking_steps/5", { phase_id: 8, name: "Pago", icon: "mdi-cash", visible_to_client: false, active: true }],
      ["get", "tracking_catalog", undefined],
    ]);
  });

  test("a rejected save returns the reason and leaves the catalog as it was", async () => {
    respond({ "post tracking_steps": rejected("Ya existe un paso con ese nombre. Usa otro nombre.") });
    const store = useTrackingCatalogStore();
    store.phases = [phase()];
    const draft = {
      id: null,
      phase_id: 7,
      name: "Pago al proveedor",
      icon: "mdi-currency-usd",
      visible_to_client: true,
      active: true,
    };
    expect(await store.saveStep(draft)).toBe("Ya existe un paso con ese nombre. Usa otro nombre.");
    expect(sent()).toEqual(["post tracking_steps"]);
    expect(Swal.fire).not.toHaveBeenCalled();
    expect(store.phases).toEqual([phase()]);
  });

  test("movePhase and moveStep send the direction and reload", async () => {
    respond({
      "put tracking_phases/7/move": accepted(),
      "put tracking_steps/5/move": accepted(),
      "get tracking_catalog": accepted([phase()]),
    });
    const store = useTrackingCatalogStore();
    await store.movePhase(7, "up");
    await store.moveStep(5, "down");
    expect(httpMock.mock.calls.map(([config]) => [config.method, config.url, config.data])).toEqual([
      ["put", "tracking_phases/7/move", { direction: "up" }],
      ["get", "tracking_catalog", undefined],
      ["put", "tracking_steps/5/move", { direction: "down" }],
      ["get", "tracking_catalog", undefined],
    ]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("a rejected move warns with the reason and does not reload", async () => {
    respond({ "put tracking_phases/7/move": rejected("Esa fase ya está al inicio.") });
    await useTrackingCatalogStore().movePhase(7, "up");
    expect(sent()).toEqual(["put tracking_phases/7/move"]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "warning",
      text: "Esa fase ya está al inicio.",
    });
  });

  test("setStepVisibility saves the whole step with the new visibility", async () => {
    respond({ "put tracking_steps/5": accepted(), "get tracking_catalog": accepted([phase()]) });
    await useTrackingCatalogStore().setStepVisibility(7, step(), false);
    expect(httpMock.mock.calls[0]![0]).toEqual({
      method: "put",
      url: "tracking_steps/5",
      data: { phase_id: 7, name: "Pago al proveedor", icon: "mdi-currency-usd", visible_to_client: false, active: true },
    });
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("busy stays on until the change and the reload finish", async () => {
    let release!: () => void;
    httpMock.mockImplementation(async (config) => {
      if (config.url === "tracking_steps/5/move") await new Promise<void>((resolve) => (release = resolve));
      return { data: accepted([phase()]) };
    });
    const store = useTrackingCatalogStore();
    const moving = store.moveStep(5, "up");
    expect(store.busy).toBe(true);
    release();
    await moving;
    expect(store.busy).toBe(false);
  });

  test("a move or visibility change requested while another change runs is ignored", async () => {
    let release!: () => void;
    httpMock.mockImplementation(async (config) => {
      if (config.url === "tracking_steps/5/move") await new Promise<void>((resolve) => (release = resolve));
      return { data: accepted([phase()]) };
    });
    const store = useTrackingCatalogStore();
    const first = store.moveStep(5, "up");
    await store.moveStep(5, "up");
    await store.movePhase(7, "down");
    await store.setStepVisibility(7, step(), false);
    release();
    await first;
    expect(sent()).toEqual(["put tracking_steps/5/move", "get tracking_catalog"]);
  });

  test("stepRangeLabel names the step numbers a phase covers", () => {
    expect(stepRangeLabel(phase({ first_step_number: 3, last_step_number: 6 }))).toBe("Pasos 3–6");
    expect(stepRangeLabel(phase({ first_step_number: 12, last_step_number: 12 }))).toBe("Paso 12");
    expect(stepRangeLabel(phase({ first_step_number: null, last_step_number: null }))).toBe("Sin pasos activos");
  });
});
