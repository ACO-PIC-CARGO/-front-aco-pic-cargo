import { expect, test } from "vitest";
import { taxPercent } from "@/components/FolderEnterprise/taxPercentRule";

test.each(["", null, 0, "0", 18, "18.5", 100])("accepts %p as a tax percentage", (value) => {
  expect(taxPercent(value)).toBe(true);
});

test.each([-18, "-0.5", 500, "100.1", "abc"])("rejects %p with a message", (value) => {
  expect(taxPercent(value)).toEqual(expect.any(String));
});
