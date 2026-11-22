import { beforeEach, expect, test, vi } from "vitest";
import Swal from "sweetalert2";
import { avisarOrigenSolicitud } from "@/utils/solicitudOrigen";

vi.mock("sweetalert2", () => ({ default: { fire: vi.fn() } }));

beforeEach(() => vi.mocked(Swal.fire).mockClear());

test("a request made from the report cannot be deleted from Control de Gastos", () => {
  expect(avisarOrigenSolicitud({ multiexpedienteflag: true }, "cg", "eliminar", "pago")).toBe(true);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
    title: "No se puede eliminar",
    text: expect.stringContaining("Comuníquese con el área administrativa"),
  }));
});

test("a request made from Control de Gastos cannot be edited from the report", () => {
  expect(avisarOrigenSolicitud({ multiexpedienteflag: false }, "adm", "editar", "cobro")).toBe(true);
  expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({
    title: "No se puede editar",
    text: expect.stringContaining("Revise Solicitudes de Cobro Pendiente"),
  }));
});

test("where it was created it goes on without a warning", () => {
  expect(avisarOrigenSolicitud({ multiexpedienteflag: false }, "cg", "eliminar", "pago")).toBe(false);
  expect(avisarOrigenSolicitud({ multiexpedienteflag: true }, "adm", "editar", "pago")).toBe(false);
  expect(Swal.fire).not.toHaveBeenCalled();
});
