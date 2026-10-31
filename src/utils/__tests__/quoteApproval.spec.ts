import { expect, test } from "vitest";
import { isApprovedQuote } from "@/utils/quoteApproval";

test.each([true, 1, "1", "true", " SI ", "sí"])("a quote flagged %j as approved is approved", (aprobadoflag) => {
  expect(isApprovedQuote({ aprobadoflag })).toBe(true);
});

test.each([false, 0, "0", "false", null, undefined, ""])("a quote flagged %j is not approved", (aprobadoflag) => {
  expect(isApprovedQuote({ aprobadoflag })).toBe(false);
});
