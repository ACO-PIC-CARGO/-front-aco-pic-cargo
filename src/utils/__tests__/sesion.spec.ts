import { beforeEach, describe, expect, test } from "vitest";
import {
  chooseSessionBranch,
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

  test("without a session the user and branch readers throw, the user id is empty and the country is null", () => {
    expect(() => sessionUser()).toThrow(TypeError);
    expect(() => sessionSucursal()).toThrow(TypeError);
    expect(sessionUserIdOrEmpty()).toBe("");
    expect(sessionIsoPais()).toBeNull();
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
