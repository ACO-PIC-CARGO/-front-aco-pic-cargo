import { expect, test } from "vitest";
import { matchesPassword, passwordRules } from "@/components/Users/passwordRules";

const firstProblem = (value: string) => passwordRules.map((rule) => rule(value)).find((result) => result !== true) ?? true;

test("a password needs at least 8 characters", () => {
  expect(firstProblem("")).toEqual(expect.any(String));
  expect(firstProblem("1234567")).toEqual(expect.stringContaining("8 caracteres"));
  expect(firstProblem("12345678")).toBe(true);
});

test("the confirmation must repeat the password exactly", () => {
  const confirms = matchesPassword(() => "Clave-Larga-1");

  expect(confirms("Clave-Larga-1")).toBe(true);
  expect(confirms("clave-larga-1")).toEqual(expect.stringContaining("no coinciden"));
});
