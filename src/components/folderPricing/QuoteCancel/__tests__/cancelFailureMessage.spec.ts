import { describe, expect, it } from "vitest";
import { cancelFailureMessage } from "../cancelFailureMessage";

describe("cancelFailureMessage", () => {
  it("explains the missing permission on a 403", () => {
    expect(cancelFailureMessage({ response: { status: 403 } })).toBe(
      "No tienes permiso para anular esta solicitud. Pide acceso a un administrador.",
    );
  });

  it.each([[{ response: { status: 500 } }], [new Error("Network Error")], [undefined]])(
    "falls back to the connection copy for %j",
    (error) => {
      expect(cancelFailureMessage(error)).toBe("No pudimos anular la solicitud. Revisa tu conexión e inténtalo de nuevo.");
    },
  );
});
