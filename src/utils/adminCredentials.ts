import Swal from "sweetalert2";
import type { AdminCredentials } from "@/types/seguridad";
import { request } from "@/utils/request";

const USER_INPUT = "swal-admin-user";
const PASSWORD_INPUT = "swal-admin-password";

export const ADMIN_CREDENTIAL_INPUTS =
  `<input id="${USER_INPUT}" class="swal2-input" placeholder="Usuario o correo del administrador" aria-label="Usuario del administrador" autocomplete="off">` +
  `<input id="${PASSWORD_INPUT}" type="password" class="swal2-input" placeholder="Contraseña" aria-label="Contraseña del administrador" autocomplete="new-password">`;

export async function verifiedAdminCredentials(): Promise<AdminCredentials | false> {
  const admin = {
    usuario: (document.getElementById(USER_INPUT) as HTMLInputElement).value.trim(),
    clave: (document.getElementById(PASSWORD_INPUT) as HTMLInputElement).value,
  };
  if (!admin.usuario || !admin.clave) {
    Swal.showValidationMessage("Escribe el usuario y la clave del administrador.");
    return false;
  }
  const answer = await request({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "validar_usuario_admin",
    data: admin,
  });
  if (!answer.estadoflag) {
    Swal.showValidationMessage(answer.mensaje);
    return false;
  }
  return admin;
}

export async function askAdminCredentials(reason: string): Promise<AdminCredentials | undefined> {
  const { value } = await Swal.fire<AdminCredentials>({
    icon: "warning",
    title: "Se necesita un administrador",
    html: `<p>${reason}</p>` + ADMIN_CREDENTIAL_INPUTS,
    showCancelButton: true,
    confirmButtonText: "Autorizar",
    cancelButtonText: "Cancelar",
    allowOutsideClick: false,
    focusConfirm: false,
    showLoaderOnConfirm: true,
    preConfirm: verifiedAdminCredentials,
  });
  return value;
}

export const withAuthorization = (admin: AdminCredentials | null | undefined) => (admin ? { autorizacion: admin } : {});
