import { afterEach, describe, expect, test, vi } from "vitest";
import { generateIdempotencyKey } from "@/utils/idempotencia";

const uuidV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateIdempotencyKey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  test("returns a different UUID v4 on every call", () => {
    const first = generateIdempotencyKey();
    const second = generateIdempotencyKey();
    expect(first).toMatch(uuidV4);
    expect(second).toMatch(uuidV4);
    expect(first).not.toBe(second);
  });

  test("uses crypto.randomUUID when available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "fixed-uuid" });
    expect(generateIdempotencyKey()).toBe("fixed-uuid");
  });

  test.each([
    ["crypto is undefined", undefined],
    ["crypto has no randomUUID", {}],
  ])("builds a UUID v4 from Math.random when %s", (_label, stub) => {
    vi.stubGlobal("crypto", stub);
    expect(generateIdempotencyKey()).toMatch(uuidV4);
  });

  test("fallback maps Math.random bounds onto the template", () => {
    vi.stubGlobal("crypto", undefined);
    const random = vi.spyOn(Math, "random");
    random.mockReturnValue(0);
    expect(generateIdempotencyKey()).toBe(
      "00000000-0000-4000-8000-000000000000",
    );
    random.mockReturnValue(0.999);
    expect(generateIdempotencyKey()).toBe(
      "ffffffff-ffff-4fff-bfff-ffffffffffff",
    );
  });
});
