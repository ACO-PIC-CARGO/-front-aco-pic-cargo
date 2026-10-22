import { beforeEach, expect, test, vi } from "vitest";
import type { Mock } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import http from "@/api/http";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("@/router", () => ({ default: { push: vi.fn() } }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const httpMock = http as unknown as Mock<(config: { method: string; url: string }) => Promise<{ data: unknown }>>;

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

test("the company zone is loaded once per session", async () => {
  httpMock.mockResolvedValue({
    data: { estadoflag: true, mensaje: null, tipomensaje: null, data: [{ time_zone: "America/Mexico_City" }] },
  });
  const store = useBranchTimeZoneStore();
  expect(store.timeZone).toBe("America/Lima");
  await store.load();
  await store.load();
  expect(store.timeZone).toBe("America/Mexico_City");
  expect(httpMock).toHaveBeenCalledTimes(1);
  expect(httpMock.mock.calls[0]![0]).toMatchObject({ method: "get", url: "branch_time_zone" });
});

test("the default zone stays when the request fails, and a later load retries", async () => {
  httpMock.mockRejectedValueOnce(new Error("network"));
  const store = useBranchTimeZoneStore();
  await store.load();
  expect(store.timeZone).toBe("America/Lima");
  httpMock.mockResolvedValueOnce({
    data: { estadoflag: true, mensaje: null, tipomensaje: null, data: [{ time_zone: "America/Bogota" }] },
  });
  await store.load();
  expect(store.timeZone).toBe("America/Bogota");
});
