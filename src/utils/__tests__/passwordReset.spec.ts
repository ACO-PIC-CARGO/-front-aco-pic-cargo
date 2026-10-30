import { describe, expect, test } from "vitest";
import { passwordResetProblem } from "@/utils/passwordReset";

const valid = { email: "ana@aco.pe", clave: "Clave-Nueva-1", confirmaclave: "Clave-Nueva-1" };

describe("password reset form", () => {
  test("is ready to send with an e-mail and two matching passwords of 8 or more characters", () => {
    expect(passwordResetProblem(valid)).toBeNull();
  });

  test("needs the account's e-mail", () => {
    expect(passwordResetProblem({ ...valid, email: "  " })).not.toBeNull();
  });

  test("refuses a password shorter than 8 characters", () => {
    expect(passwordResetProblem({ ...valid, clave: "Corta-7", confirmaclave: "Corta-7" })).not.toBeNull();
  });

  test("refuses passwords that do not match", () => {
    expect(passwordResetProblem({ ...valid, confirmaclave: "Clave-Nueva-2" })).not.toBeNull();
  });
});
