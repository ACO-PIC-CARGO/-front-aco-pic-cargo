import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { claimUpdatePrompt } from "@/utils/versionPrompt";

const signIn = () => sessionStorage.setItem("auth-token", "token");

describe("asking to update when the server publishes another version", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubEnv("VITE_VERSION", "3.00");
  });
  afterEach(() => vi.unstubAllEnvs());

  test("never asks while the app already runs the server version", () => {
    expect(claimUpdatePrompt("3.00")).toBe(false);
    signIn();
    expect(claimUpdatePrompt("3.00")).toBe(false);
  });

  test("before signing in it asks on every check", () => {
    expect(claimUpdatePrompt("3.01")).toBe(true);
    expect(claimUpdatePrompt("3.01")).toBe(true);
  });

  test("with a session it asks only once for the same version", () => {
    signIn();

    expect(claimUpdatePrompt("3.01")).toBe(true);
    expect(claimUpdatePrompt("3.01")).toBe(false);
  });

  test("with a session a newer version asks once more", () => {
    signIn();
    claimUpdatePrompt("3.01");

    expect(claimUpdatePrompt("3.02")).toBe(true);
    expect(claimUpdatePrompt("3.02")).toBe(false);
  });
});
