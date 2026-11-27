import Swal from "sweetalert2";
import type { AdminCredentials } from "@/types/seguridad";
import { request } from "@/utils/request";

const USER_INPUT = "swal-admin-user";
const PASSWORD_INPUT = "swal-admin-password";

export const ADMIN_CREDENTIAL_INPUTS =
  `<input id="${USER_INPUT}" class="swal2-input" placeholder="Usuario o correo" aria-label="Usuario que autoriza" autocomplete="off">` +
  `<input id="${PASSWORD_INPUT}" type="password" class="swal2-input" placeholder="Contraseña" aria-label="Contraseña de quien autoriza" autocomplete="new-password">`;

/** Módulo (ruta del menú) y acción que debe tener quien autoriza; basta con uno de la lista. */
export type PermisoModulo = readonly (readonly [
  route: string,
  action: "NUEVO" | "MODIFICAR" | "ELIMINAR"
])[];

const AUTORIZA_NOTA = `<p style="font-size:0.85em;color:#6b7280;margin-top:12px">Puede autorizar el Super administrador o un usuario con permiso en este módulo.</p>`;

// Mismos permisos que exige cada endpoint en el backend (requirePermissionOrAdmin)
export const PERMISOS_AUTORIZA = {
  controlGastosEliminar: [["listControlGastos", "ELIMINAR"]],
  facturaAnular: [
    ["listControlGastos", "ELIMINAR"],
    ["lstFacturacion", "ELIMINAR"],
  ],
  solicitudPagoEditar: [
    ["listControlGastos", "NUEVO"],
    ["solicitudesPagoBancos", "MODIFICAR"],
  ],
  solicitudPagoEliminar: [
    ["listControlGastos", "ELIMINAR"],
    ["solicitudesPagoBancos", "MODIFICAR"],
  ],
  solicitudPagoReporteEditar: [
    ["debstopay", "MODIFICAR"],
    ["listControlGastos", "NUEVO"],
  ],
  solicitudCobroEditar: [
    ["listControlGastos", "NUEVO"],
    ["ingresosPendientesConfirmar", "MODIFICAR"],
  ],
  solicitudCobroEliminar: [
    ["listControlGastos", "ELIMINAR"],
    ["ingresosPendientesConfirmar", "MODIFICAR"],
  ],
  solicitudCobroReporteEditar: [
    ["accountsreceivable", "MODIFICAR"],
    ["listControlGastos", "NUEVO"],
  ],
  bancoIngresoEditar: [["listBankCxC", "MODIFICAR"]],
  bancoIngresoEliminar: [["listBankCxC", "ELIMINAR"]],
  bancoEgresoEditar: [["listBankCxP", "MODIFICAR"]],
  bancoEgresoEliminar: [["listBankCxP", "ELIMINAR"]],
  registroCobroEditar: [["registroPayForCliente", "MODIFICAR"]],
  registroPagoEditar: [["registroPayForProveedor", "MODIFICAR"]],
  cuentasPagarEditar: [["controlAccountPays", "MODIFICAR"]],
  cuentasPagarEliminar: [["controlAccountPays", "ELIMINAR"]],
  cuentasCobrarEditar: [["moduleAccountReceivable", "MODIFICAR"]],
  cuentasCobrarEliminar: [["moduleAccountReceivable", "ELIMINAR"]],
  masterReactivar: [["listMaster", "MODIFICAR"]],
  trafficRetirar: [["lstTraffic", "MODIFICAR"]],
  aduanaEditar: [["lstQuoteAduanaAduana", "MODIFICAR"]],
  pricingEditar: [["lstQuote", "MODIFICAR"]],
  empresaEliminar: [["lstEnterpriseRegister", "ELIMINAR"]],
  houseEditar: [
    ["listHouse", "MODIFICAR"],
    ["lstTraffic", "MODIFICAR"],
  ],
  clienteEditar: [
    ["listClientes", "MODIFICAR"],
    ["listHouse", "NUEVO"],
    ["listHouse", "MODIFICAR"],
  ],
} as const satisfies Record<string, PermisoModulo>;

export async function verifiedAdminCredentials(
  permiso: PermisoModulo
): Promise<AdminCredentials | false> {
  const admin = {
    usuario: (
      document.getElementById(USER_INPUT) as HTMLInputElement
    ).value.trim(),
    clave: (document.getElementById(PASSWORD_INPUT) as HTMLInputElement).value,
  };
  if (!admin.usuario || !admin.clave) {
    Swal.showValidationMessage(
      "Escribe el usuario y la clave de quien autoriza."
    );
    return false;
  }
  const answer = await request({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "validar_usuario_admin",
    data: {
      ...admin,
      route: permiso.map(([route]) => route),
      action: permiso.map(([, action]) => action),
    },
  });
  if (!answer.estadoflag) {
    Swal.showValidationMessage(answer.mensaje);
    return false;
  }
  return admin;
}

export async function askAdminCredentials(
  reason: string,
  permiso: PermisoModulo
): Promise<AdminCredentials | undefined> {
  const { value } = await Swal.fire<AdminCredentials>({
    icon: "warning",
    title: "Se necesita un administrador",
    html: `<p>${reason}</p>` + ADMIN_CREDENTIAL_INPUTS + AUTORIZA_NOTA,
    showCancelButton: true,
    confirmButtonText: "Autorizar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
    focusConfirm: false,
    showLoaderOnConfirm: true,
    preConfirm: () => verifiedAdminCredentials(permiso),
  });
  return value;
}

export const withAuthorization = (admin: AdminCredentials | null | undefined) =>
  admin ? { autorizacion: admin } : {};

const MOTIVO_INPUT = "swal-admin-motivo";
export type EdicionBancos = { admin: AdminCredentials; motivo: string };

// Bancos > Nueva Salida / Nuevo Ingreso desde una solicitud: "Editar" pide la clave de un administrador
// y el motivo del error (se guarda con el movimiento y se muestra como "Editado en Bancos")
export async function askAdminEdicionBancos(
  reason: string,
  permiso: PermisoModulo
): Promise<EdicionBancos | undefined> {
  const { value } = await Swal.fire<EdicionBancos>({
    icon: "warning",
    title: "Se necesita un administrador",
    html:
      `<p>${reason}</p>` +
      ADMIN_CREDENTIAL_INPUTS +
      AUTORIZA_NOTA +
      `<label for="${MOTIVO_INPUT}" style="display:block;text-align:left;font-weight:600;margin:16px 0 4px">Indique el motivo del Error</label>` +
      `<textarea id="${MOTIVO_INPUT}" class="swal2-textarea" maxlength="500" rows="3" style="margin:0;width:100%" ` +
      `placeholder="Indique el motivo del Error" aria-label="Indique el motivo del Error"></textarea>`,
    showCancelButton: true,
    confirmButtonText: "Autorizar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
    focusConfirm: false,
    showLoaderOnConfirm: true,
    preConfirm: async () => {
      const motivo = (
        document.getElementById(MOTIVO_INPUT) as HTMLTextAreaElement
      ).value.trim();
      if (!motivo) {
        Swal.showValidationMessage("Indique el motivo del Error.");
        return false;
      }
      const admin = await verifiedAdminCredentials(permiso);
      return admin ? { admin, motivo } : false;
    },
  });
  return value;
}
