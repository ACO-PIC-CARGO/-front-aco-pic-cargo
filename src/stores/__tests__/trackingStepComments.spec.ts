import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import Swal from "sweetalert2";
import http from "@/api/http";
import { useTrackingStepCommentsStore } from "@/stores/trackingStepComments";

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
const received = { id: 1, comment: "Documentos recibidos." };
const pending = { id: 2, comment: "Pago pendiente del cliente." };

describe("trackingStepComments store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    unexpected = [];
  });

  afterEach(() => {
    expect(unexpected).toEqual([]);
  });

  test("load keeps each step's comments apart, empties a step without records and keeps them on network failure", async () => {
    const store = useTrackingStepCommentsStore();
    respond({
      "get tracking_steps/5/comments": accepted([received, pending]),
      "get tracking_steps/6/comments": rejected("No se encontraron registros", "TMSGINF"),
    });
    expect(await store.load(5)).toBeNull();
    expect(await store.load(6)).toBeNull();
    expect(store.commentsOf(5)).toEqual([received, pending]);
    expect(store.commentsOf(6)).toEqual([]);

    respond({ "get tracking_steps/5/comments": new Error("network") });
    expect(await store.load(5)).toBe("No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
    expect(store.commentsOf(5)).toEqual([received, pending]);
  });

  test("create posts the text for the step, reloads that step and confirms", async () => {
    respond({
      "post tracking_steps/5/comments": accepted([{ id: 1 }], "Guardamos el comentario predefinido."),
      "get tracking_steps/5/comments": accepted([received]),
    });
    const store = useTrackingStepCommentsStore();
    expect(await store.create(5, "Documentos recibidos.")).toBeNull();
    expect(httpMock.mock.calls[0]![0].data).toEqual({ comment: "Documentos recibidos." });
    expect(sent()).toEqual(["post tracking_steps/5/comments", "get tracking_steps/5/comments"]);
    expect(store.commentsOf(5)).toEqual([received]);
    expect(vi.mocked(Swal.fire).mock.calls[0]![0]).toMatchObject({
      icon: "success",
      title: "Guardamos el comentario predefinido.",
    });
  });

  test("update and remove target the comment and reload its step", async () => {
    respond({
      "put tracking_step_comments/1": accepted([{ id: 1 }], "Guardamos el comentario predefinido."),
      "delete tracking_step_comments/2": accepted([], "Eliminamos el comentario predefinido."),
      "get tracking_steps/5/comments": accepted([received]),
    });
    const store = useTrackingStepCommentsStore();
    expect(await store.update(5, 1, "Documentos completos recibidos.")).toBeNull();
    expect(await store.remove(5, 2)).toBeNull();
    expect(httpMock.mock.calls[0]![0].data).toEqual({ comment: "Documentos completos recibidos." });
    expect(sent()).toEqual([
      "put tracking_step_comments/1",
      "get tracking_steps/5/comments",
      "delete tracking_step_comments/2",
      "get tracking_steps/5/comments",
    ]);
  });

  test("a rejected change returns the reason without reloading or confirming", async () => {
    respond({ "post tracking_steps/5/comments": rejected("Ese comentario ya existe en este paso. Escribe otro.") });
    expect(await useTrackingStepCommentsStore().create(5, "documentos recibidos.")).toBe(
      "Ese comentario ya existe en este paso. Escribe otro.",
    );
    expect(sent()).toEqual(["post tracking_steps/5/comments"]);
    expect(Swal.fire).not.toHaveBeenCalled();
  });
});
