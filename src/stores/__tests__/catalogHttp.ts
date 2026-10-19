import type { Mock } from "vitest";
import http from "@/api/http";

export interface HttpConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
}

export const URL_MAIN = String(import.meta.env.VITE_URL_MAIN);
export const JSON_HEADERS = { "Content-Type": "application/json" };
export const httpMock = http as unknown as Mock<(config: HttpConfig) => Promise<{ data: unknown }>>;

export function respond(bodies: Record<string, unknown>) {
  httpMock.mockImplementation(async (config) => {
    const path = config.url.slice(URL_MAIN.length).split("?")[0]!;
    if (!(path in bodies)) throw new Error(`unexpected request ${path}`);
    const body = bodies[path];
    if (body instanceof Error) throw body;
    return { data: body };
  });
}

export const accepted = (data: unknown) => ({ estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", token: "tok", data });
export const rejected = (mensaje = "No se encontraron registros", status?: string) => ({
  estadoflag: false,
  mensaje,
  tipomensaje: "TMSGINF",
  token: "tok",
  data: [],
  status,
});

export async function flushPromises() {
  for (let tick = 0; tick < 20; tick++) await Promise.resolve();
}
