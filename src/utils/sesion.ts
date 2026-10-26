import type { SucursalSesion, UsuarioSesion } from "@/types/sesion";

export const sessionBranchId = (): number =>
  (JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[])[0]!.id_branch;

export const sessionBranchIdOrEmpty = (): number | "" => {
  const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[] | null;
  return users ? users[0]!.id_branch : "";
};

export const sessionUser = (): UsuarioSesion =>
  (JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[])[0]!;

export const sessionUserIdOrEmpty = (): number | "" => {
  const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[] | null;
  return users ? users[0]!.id! : "";
};

export const sessionSucursal = (): SucursalSesion =>
  (JSON.parse(sessionStorage.getItem("dataBranch") as string) as SucursalSesion[])[0]!;

export const chooseSessionBranch = (branch: SucursalSesion): void => {
  const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[];
  users[0]!.id_branch = branch.id;
  for (const storage of [sessionStorage, localStorage]) {
    storage.setItem("dataUser", JSON.stringify(users));
    storage.setItem("dataBranch", JSON.stringify([branch]));
    storage.setItem("iso_pais", branch.iso_pais);
  }
};

export const sessionIsoPais = (): number | null =>
  JSON.parse(sessionStorage.getItem("iso_pais") as string) as number | null;
