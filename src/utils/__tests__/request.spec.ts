import { beforeEach, describe, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import http from "@/api/http";
import { hasFailed, notifySuccess, request } from "@/utils/request";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

const httpMock = vi.mocked(http as unknown as (config: unknown) => Promise<{ data: unknown }>);
const CONNECTION_ERROR_MESSAGE = "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.";

describe("request helper", () => {
  beforeEach(() => vi.clearAllMocks());

  test("passes the config through and answers the response body", async () => {
    const body = { estadoflag: true, mensaje: "ok", tipomensaje: "TMSGSUC", data: [{ id: 1 }] };
    httpMock.mockResolvedValue({ data: body });
    expect(await request({ method: "get", url: "legal_pages" })).toBe(body);
    expect(httpMock).toHaveBeenCalledWith({ method: "get", url: "legal_pages" });
  });

  test("answers the backend message of a failed request as an error response", async () => {
    httpMock.mockRejectedValue({ response: { data: { mensaje: "Sin permiso" } } });
    expect(await request({ method: "get", url: "x" })).toEqual({
      estadoflag: false,
      mensaje: "Sin permiso",
      tipomensaje: "TMSGERR",
      data: [],
    });
  });

  test("answers the connection message when the request has no backend body", async () => {
    httpMock.mockRejectedValue(new Error("Network Error"));
    expect((await request({ method: "get", url: "x" })).mensaje).toBe(CONNECTION_ERROR_MESSAGE);
    httpMock.mockRejectedValue({ response: { data: {} } });
    expect((await request({ method: "get", url: "x" })).mensaje).toBe(CONNECTION_ERROR_MESSAGE);
  });

  test("treats only a rejection that is not informative as a failure", () => {
    expect(hasFailed({ estadoflag: true, mensaje: "", tipomensaje: "TMSGSUC", data: [] })).toBe(false);
    expect(hasFailed({ estadoflag: false, mensaje: "", tipomensaje: "TMSGINF", data: [] })).toBe(false);
    expect(hasFailed({ estadoflag: false, mensaje: "", tipomensaje: "TMSGERR", data: [] })).toBe(true);
  });

  test("shows a success toast whose message is plain text, never HTML", () => {
    notifySuccess("Guardado");
    expect(Swal.fire).toHaveBeenCalledWith({
      toast: true,
      position: "top-end",
      icon: "success",
      titleText: "Guardado",
      showConfirmButton: false,
      timer: 3000,
    });
  });
});
