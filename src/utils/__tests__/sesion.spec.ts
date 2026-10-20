import { beforeEach, describe, expect, test } from "vitest";
import { sessionIsoPais, sessionSucursal, sessionUser, sessionUserIdOrEmpty } from "@/utils/sesion";

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
