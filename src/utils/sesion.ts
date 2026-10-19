import type { UsuarioSesion } from "@/types/sesion";

export const sessionBranchId = (): number =>
  (JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[])[0]!.id_branch;
