import { beforeEach, expect, test, vi } from "vitest";
import type { SweetAlertOptions } from "sweetalert2";
import Swal from "sweetalert2";
import { askAdminCredentials, PERMISOS_AUTORIZA } from "@/utils/adminCredentials";
import { accepted, httpMock, rejected, respond } from "@/stores/__tests__/catalogHttp";

vi.mock("@/api/http", () => ({ default: vi.fn() }));
vi.mock("sweetalert2", () => ({ default: { fire: vi.fn(), showValidationMessage: vi.fn() } }));

const typeInDialog = (usuario: string, clave: string) =>
  vi.mocked(Swal.fire).mockImplementation((async (options: SweetAlertOptions) => {
    document.body.innerHTML = String(options.html);
    (document.getElementById("swal-admin-user") as HTMLInputElement).value = usuario;
    (document.getElementById("swal-admin-password") as HTMLInputElement).value = clave;
    const value = await options.preConfirm!(undefined);
    return { isConfirmed: Boolean(value), value: value || undefined };
  }) as never);

beforeEach(() => vi.clearAllMocks());

const MODULO = PERMISOS_AUTORIZA.solicitudPagoEliminar;

test("returns the authorizer's credentials once the server accepts them, keeping the password as typed", async () => {
  respond({ validar_usuario_admin: accepted([]) });
  typeInDialog("  jefa@empresa.com ", " clave con espacios ");

  const admin = await askAdminCredentials("Para editarla, escribe el usuario y la clave de un administrador.", MODULO);

  expect(admin).toEqual({ usuario: "jefa@empresa.com", clave: " clave con espacios " });
});

test("sends the module and action where the authorization is asked, so a user with that permission can authorize", async () => {
  respond({ validar_usuario_admin: accepted([]) });
  typeInDialog("jefa@empresa.com", "clave");

  await askAdminCredentials("motivo", MODULO);

  expect(httpMock.mock.calls[0]![0].data).toEqual({
    usuario: "jefa@empresa.com",
    clave: "clave",
    route: ["listControlGastos", "solicitudesPagoBancos"],
    action: ["ELIMINAR", "MODIFICAR"],
  });
});

test("keeps asking with the server's reason when the credentials are refused", async () => {
  respond({ validar_usuario_admin: rejected("Datos Incorrectos.") });
  typeInDialog("jefa@empresa.com", "mala");

  expect(await askAdminCredentials("motivo", MODULO)).toBeUndefined();
  expect(Swal.showValidationMessage).toHaveBeenCalledWith("Datos Incorrectos.");
});

test("asks for both fields before checking anything", async () => {
  typeInDialog("jefa@empresa.com", "");

  expect(await askAdminCredentials("motivo", MODULO)).toBeUndefined();
  expect(Swal.showValidationMessage).toHaveBeenCalledWith("Escribe el usuario y la clave de quien autoriza.");
  expect(httpMock).not.toHaveBeenCalled();
});
