import { beforeEach, describe, expect, test } from "vitest";
import { AxiosError } from "axios";
import type { AxiosResponse } from "axios";
import {
  SessionEndedError,
  chooseSessionBranch,
  clearSession,
  isSessionEndedError,
  markSessionBranchConfigured,
  sessionBranchId,
  sessionIsoPais,
  sessionSucursal,
  sessionUser,
  sessionUserIdOrEmpty,
} from "@/utils/sesion";
import type { SucursalSesion } from "@/types/sesion";

describe("session readers", () => {
  beforeEach(() => sessionStorage.clear());

  test("read the signed-in user, the branch and the country", () => {
    sessionStorage.setItem("dataUser", JSON.stringify([{ id: 4, id_branch: 1, nombrecompleto: "ANA" }, { id: 9 }]));
    sessionStorage.setItem("dataBranch", JSON.stringify([{ id: 1, trade_name: "PIC LOGISTICA SAC" }, { id: 2 }]));
    sessionStorage.setItem("iso_pais", "9589");

    expect(sessionUser()).toEqual({ id: 4, id_branch: 1, nombrecompleto: "ANA" });
    expect(sessionUserIdOrEmpty()).toBe(4);
    expect(sessionSucursal()).toEqual({ id: 1, trade_name: "PIC LOGISTICA SAC" });
    expect(sessionIsoPais()).toBe(9589);
  });

  test("without a session the user and branch readers say the session ended, the user id is empty and the country is null", () => {
    expect(() => sessionUser()).toThrow(SessionEndedError);
    expect(() => sessionBranchId()).toThrow(SessionEndedError);
    expect(() => sessionSucursal()).toThrow(SessionEndedError);
    expect(sessionUserIdOrEmpty()).toBe("");
    expect(sessionIsoPais()).toBeNull();
  });
});

describe("errors that only mean the session ended", () => {
  const rejectedWith = (status: number) => new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, { status } as AxiosResponse);

  test("are a session reader finding no session and a request refused for an expired token", () => {
    expect(isSessionEndedError(new SessionEndedError())).toBe(true);
    expect(isSessionEndedError(rejectedWith(401))).toBe(true);
  });

  test("do not include other failures", () => {
    expect(isSessionEndedError(rejectedWith(400))).toBe(false);
    expect(isSessionEndedError(rejectedWith(500))).toBe(false);
    expect(isSessionEndedError(new TypeError("Cannot read properties of null (reading '0')"))).toBe(false);
    expect(isSessionEndedError(undefined)).toBe(false);
  });
});

describe("choosing the sucursal at login", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test("a new tab, which copies the session from localStorage, works on the chosen sucursal", () => {
    const signedIn = JSON.stringify([{ id: 4, id_branch: 1, nombrecompleto: "ANA" }]);
    sessionStorage.setItem("dataUser", signedIn);
    localStorage.setItem("dataUser", signedIn);
    const chosen = { id: 18, trade_name: "INTERCONTINENTAL KARGO SA", iso_pais: "9589" } as SucursalSesion;

    chooseSessionBranch(chosen);

    for (const storage of [sessionStorage, localStorage]) {
      expect(JSON.parse(storage.getItem("dataUser")!)).toEqual([{ id: 4, id_branch: 18, nombrecompleto: "ANA" }]);
      expect(JSON.parse(storage.getItem("dataBranch")!)).toEqual([chosen]);
      expect(storage.getItem("iso_pais")).toBe("9589");
    }
  });
});

describe("signing out", () => {
  const sessionKeys = ["security", "auth-token", "dataUser", "dataBranch", "iso_pais", "menu", "permissions", "ConfigEmpresa"];

  test("leaves no session data in either storage, so a new tab cannot restore it", () => {
    for (const storage of [sessionStorage, localStorage]) {
      for (const key of sessionKeys) storage.setItem(key, "x");
      storage.setItem("version", "2.64");
    }

    clearSession();

    for (const storage of [sessionStorage, localStorage]) {
      for (const key of sessionKeys) expect(storage.getItem(key)).toBeNull();
      expect(storage.getItem("version")).toBe("2.64");
    }
  });
});

describe("finishing the initial configuration of a new company", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  test("a new tab, which copies the session from localStorage, no longer sees the branch as new", () => {
    const newBranch = JSON.stringify([{ id: 74, trade_name: "SUPP", esnuevoflag: true }]);
    sessionStorage.setItem("dataBranch", newBranch);
    localStorage.setItem("dataBranch", newBranch);

    markSessionBranchConfigured();

    for (const storage of [sessionStorage, localStorage]) {
      expect(JSON.parse(storage.getItem("dataBranch")!)).toEqual([{ id: 74, trade_name: "SUPP", esnuevoflag: false }]);
    }
  });
});
