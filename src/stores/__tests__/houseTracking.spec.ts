import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import type { HouseTrackingPhase } from "@/types/houseTracking";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

interface RequestConfig {
  method: string;
  url: string;
  data?: Record<string, unknown>;
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

const phase: HouseTrackingPhase = {
  id: 1,
  name: "Fábrica",
  icon: "mdi-factory",
  sort_order: 1,
  status: "in_progress",
  completed_at: null,
  steps: [],
};

describe("houseTracking store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    unexpected = [];
  });

  afterEach(() => {
    expect(unexpected).toEqual([]);
  });

  test("load keeps the phases, empties them when there are none and keeps them on network failure", async () => {
    const store = useHouseTrackingStore();
    respond({ "get house_tracking/2830": accepted([phase]) });
    expect(await store.load(2830)).toBeNull();
    expect(store.phases).toEqual([phase]);

    respond({ "get house_tracking/2830": new Error("network") });
    expect(await store.load(2830)).toBe("No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
    expect(store.phases).toEqual([phase]);

    respond({ "get house_tracking/2830": rejected("No se encontraron registros", "TMSGINF") });
    expect(await store.load(2830)).toBeNull();
    expect(store.phases).toEqual([]);
  });

  test("confirm sends the time, confirms it and reloads", async () => {
    respond({
      "put house_tracking/2830/steps/5/confirmation": accepted([{ id: 1 }], "Confirmamos «ETD»."),
      "get house_tracking/2830": accepted([phase]),
    });
    const store = useHouseTrackingStore();
    expect(await store.confirm(2830, 5, "2026-10-01T21:40:00.000Z")).toBeNull();
    expect(httpMock.mock.calls[0]![0].data).toEqual({ confirmed_at: "2026-10-01T21:40:00.000Z" });
    expect(sent()).toEqual(["put house_tracking/2830/steps/5/confirmation", "get house_tracking/2830"]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({ icon: "success", titleText: "Confirmamos «ETD»." });
  });

  test("confirm sends the weight check with the time when the step asks for it", async () => {
    respond({
      "put house_tracking/2830/steps/5/confirmation": accepted([{ id: 1 }], "Confirmamos «Ingreso»."),
      "get house_tracking/2830": accepted([phase]),
    });
    await useHouseTrackingStore().confirm(2830, 5, "2026-10-20T15:00:00.000Z", { weight: 320, volume: 2.1 });
    expect(httpMock.mock.calls[0]![0].data).toEqual({
      confirmed_at: "2026-10-20T15:00:00.000Z",
      validation: { weight: 320, volume: 2.1 },
    });
  });

  test("keepRate records the kept rate and reloads", async () => {
    respond({
      "put house_tracking/2830/steps/6/rate_keep": accepted([], "Mantuvimos la tarifa de flete de la cotización."),
      "get house_tracking/2830": accepted([phase]),
    });
    expect(await useHouseTrackingStore().keepRate(2830, 6)).toBeNull();
    expect(sent()).toEqual(["put house_tracking/2830/steps/6/rate_keep", "get house_tracking/2830"]);
  });

  test("a rejected comment returns the reason without reloading", async () => {
    respond({
      "post house_tracking/2830/steps/6/comments": rejected("Escribe el comentario (hasta 1000 caracteres)."),
    });
    expect(await useHouseTrackingStore().addComment(2830, 6, "")).toBe("Escribe el comentario (hasta 1000 caracteres).");
    expect(sent()).toEqual(["post house_tracking/2830/steps/6/comments"]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("a rejected confirmation returns the reason and reloads so the step shows what it now asks for", async () => {
    respond({
      "put house_tracking/2830/steps/5/confirmation": rejected("Confirma el peso y el volumen antes de confirmar este paso."),
      "get house_tracking/2830": accepted([phase]),
    });
    const store = useHouseTrackingStore();
    expect(await store.confirm(2830, 5, "2026-10-01T21:40:00.000Z")).toBe(
      "Confirma el peso y el volumen antes de confirmar este paso.",
    );
    expect(sent()).toEqual(["put house_tracking/2830/steps/5/confirmation", "get house_tracking/2830"]);
    expect(store.phases).toEqual([phase]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });

  test("addComment sends the written comment and reloads", async () => {
    respond({
      "post house_tracking/2830/steps/5/comments": accepted([{ id: 3 }], "Guardamos el comentario."),
      "get house_tracking/2830": accepted([phase]),
    });
    expect(await useHouseTrackingStore().addComment(2830, 5, "Documentos recibidos.")).toBeNull();
    expect(httpMock.mock.calls[0]![0].data).toStrictEqual({ comment: "Documentos recibidos." });
    expect(sent()).toEqual(["post house_tracking/2830/steps/5/comments", "get house_tracking/2830"]);
  });

  test("deleteComment deletes the comment of the house and reloads", async () => {
    respond({
      "delete house_tracking/2830/comments/9": accepted([], "Eliminamos el comentario."),
      "get house_tracking/2830": accepted([phase]),
    });
    expect(await useHouseTrackingStore().deleteComment(2830, 9)).toBeNull();
    expect(sent()).toEqual(["delete house_tracking/2830/comments/9", "get house_tracking/2830"]);
  });

  test("withdrawComment takes the comment out of the client tracking and reloads", async () => {
    respond({
      "delete house_tracking/2830/comments/9/send": accepted([], "Retiramos el comentario del tracking del cliente."),
      "get house_tracking/2830": accepted([phase]),
    });
    expect(await useHouseTrackingStore().withdrawComment(2830, 9)).toBeNull();
    expect(sent()).toEqual(["delete house_tracking/2830/comments/9/send", "get house_tracking/2830"]);
  });

  test("sendComment sends the comment of the house and reloads", async () => {
    respond({
      "put house_tracking/2830/comments/9/send": accepted([], "Enviamos el comentario al tracking del cliente."),
      "get house_tracking/2830": accepted([phase]),
    });
    expect(await useHouseTrackingStore().sendComment(2830, 9)).toBeNull();
    expect(sent()).toEqual(["put house_tracking/2830/comments/9/send", "get house_tracking/2830"]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "success",
      titleText: "Enviamos el comentario al tracking del cliente.",
    });
  });

  test("setStepDate saves the estimated date of the step and reloads", async () => {
    respond({
      "put house_tracking/2830/steps/5/date": accepted([], "Guardamos la fecha de «ETD»."),
      "get house_tracking/2830": accepted([phase]),
    });
    expect(await useHouseTrackingStore().setStepDate(2830, 5, "2026-11-03T15:00:00.000Z")).toBeNull();
    expect(httpMock.mock.calls[0]![0].data).toStrictEqual({ scheduled_at: "2026-11-03T15:00:00.000Z" });
    expect(sent()).toEqual(["put house_tracking/2830/steps/5/date", "get house_tracking/2830"]);
  });

  test("requestTrackingToken creates a token for the house and returns it", async () => {
    respond({ "put setTrackingToken": accepted([{ token: "tok-1" }]) });
    expect(await useHouseTrackingStore().requestTrackingToken(2830)).toBe("tok-1");
    const data = httpMock.mock.calls[0]![0].data!;
    expect(data.id_house).toBe(2830);
    expect(data.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test("requestTrackingToken warns and returns nothing when the token cannot be created", async () => {
    respond({ "put setTrackingToken": new Error("network") });
    expect(await useHouseTrackingStore().requestTrackingToken(2830)).toBeNull();
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "error",
      text: "No pudimos generar el enlace de tracking. Intenta de nuevo.",
    });
  });
});
