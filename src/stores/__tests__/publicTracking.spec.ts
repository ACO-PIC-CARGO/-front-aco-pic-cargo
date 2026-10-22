import { beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import http from "@/api/http";
import { usePublicTrackingStore } from "@/stores/publicTracking";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));

const httpMock = http as unknown as Mock<(config: { method: string; url: string }) => Promise<{ data: unknown }>>;
const NOT_FOUND = "No encontramos este seguimiento. Revisa el enlace o pide uno nuevo a tu agente de carga.";

beforeEach(() => {
  setActivePinia(createPinia());
  httpMock.mockReset();
});

test("a found tracking is kept and asked for by its token", async () => {
  const row = { house_code: "H1", phases: [] };
  httpMock.mockResolvedValue({ data: { estadoflag: true, mensaje: null, tipomensaje: null, data: [row] } });
  const store = usePublicTrackingStore();
  expect(await store.load("a b")).toBeNull();
  expect(store.tracking).toEqual(row);
  expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "get", url: "house_tracking/public/a%20b" });
});

test("a missing tracking shows the server message with no retry", async () => {
  httpMock.mockResolvedValue({ data: { estadoflag: false, mensaje: NOT_FOUND, tipomensaje: "TMSGADV", data: [] } });
  expect(await usePublicTrackingStore().load("x")).toEqual({ message: NOT_FOUND, canRetry: false });
});

test("a failed request offers a retry with friendly copy", async () => {
  httpMock.mockRejectedValue(new Error("Network Error"));
  expect(await usePublicTrackingStore().load("x")).toEqual({
    message: "No pudimos cargar el seguimiento. Revisa tu conexión e inténtalo de nuevo.",
    canRetry: true,
  });
});
