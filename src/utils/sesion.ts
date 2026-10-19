import type { UsuarioSesion } from "@/types/sesion";

export const sessionBranchId = (): number =>
  (JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[])[0]!.id_branch;

export const sessionBranchIdOrEmpty = (): number | "" => {
  const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[] | null;
  return users ? users[0]!.id_branch : "";
};
