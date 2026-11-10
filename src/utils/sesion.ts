import { isAxiosError } from "axios";
import type { SucursalSesion, UsuarioSesion } from "@/types/sesion";

export class SessionEndedError extends Error {
  constructor() {
    super("The session ended");
    this.name = "SessionEndedError";
  }
}

export const isSessionEndedError = (error: unknown): boolean =>
  error instanceof SessionEndedError || (isAxiosError(error) && error.response?.status === 401);

const firstSessionRow = <Row>(key: string): Row => {
  const rows = JSON.parse(sessionStorage.getItem(key) as string) as Row[] | null;
  if (!rows?.[0]) throw new SessionEndedError();
  return rows[0];
};

export const sessionBranchId = (): number => firstSessionRow<UsuarioSesion>("dataUser").id_branch;

export const sessionBranchIdOrEmpty = (): number | "" => {
  const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[] | null;
  return users ? users[0]!.id_branch : "";
};

export const sessionUser = (): UsuarioSesion => firstSessionRow<UsuarioSesion>("dataUser");

export const sessionUserIdOrEmpty = (): number | "" => {
  const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[] | null;
  return users ? users[0]!.id! : "";
};

export const sessionSucursal = (): SucursalSesion => firstSessionRow<SucursalSesion>("dataBranch");

export const chooseSessionBranch = (branch: SucursalSesion): void => {
  const users = JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[];
  users[0]!.id_branch = branch.id;
  for (const storage of [sessionStorage, localStorage]) {
    storage.setItem("dataUser", JSON.stringify(users));
    storage.setItem("dataBranch", JSON.stringify([branch]));
    storage.setItem("iso_pais", branch.iso_pais);
  }
};

export const markSessionBranchConfigured = (): void => {
  const branches = JSON.parse(sessionStorage.getItem("dataBranch") as string) as SucursalSesion[];
  branches[0]!.esnuevoflag = false;
  for (const storage of [sessionStorage, localStorage]) storage.setItem("dataBranch", JSON.stringify(branches));
};

export const sessionIsoPais = (): number | null =>
  JSON.parse(sessionStorage.getItem("iso_pais") as string) as number | null;

const SESSION_KEYS = ["security", "auth-token", "dataUser", "dataBranch", "iso_pais", "menu", "permissions", "ConfigEmpresa"];

export const clearSession = (): void => {
  for (const storage of [sessionStorage, localStorage]) {
    for (const key of SESSION_KEYS) storage.removeItem(key);
  }
};
