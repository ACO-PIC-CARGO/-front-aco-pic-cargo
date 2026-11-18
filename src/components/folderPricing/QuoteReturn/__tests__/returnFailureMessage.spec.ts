import { describe, expect, it } from "vitest";
import { returnFailureMessage } from "../returnFailureMessage";

describe("returnFailureMessage", () => {
  it("explains the missing permission on a 403", () => {
    expect(returnFailureMessage({ response: { status: 403 } })).toBe(
      "No tienes permiso para devolver esta cotización. Pide acceso a un administrador.",
    );
  });

  it.each([[{ response: { status: 500 } }], [new Error("Network Error")], [undefined]])(
    "falls back to the connection copy for %j",
    (error) => {
      expect(returnFailureMessage(error)).toBe("No pudimos devolver la cotización. Revisa tu conexión e inténtalo de nuevo.");
    },
  );
});
