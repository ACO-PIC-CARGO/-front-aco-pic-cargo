import { expect, test } from "vitest";
import { ALREADY_REQUESTED_TOOLTIP, alreadyRequestedTooltip, isAlreadyRequested } from "../pricingRequestState";

const info = (already_requested: boolean | null) => ({ already_requested });

test("only an explicit already_requested true is recognised", () => {
  expect(isAlreadyRequested(info(true))).toBe(true);
});

test("false, null or a missing info is not already requested", () => {
  expect(isAlreadyRequested(info(false))).toBe(false);
  expect(isAlreadyRequested(info(null))).toBe(false);
  expect(isAlreadyRequested(null)).toBe(false);
});

test("the tooltip shows the server reason and falls back to the default copy", () => {
  expect(alreadyRequestedTooltip("Ya fue solicitada el 18/11/2026 10:00. Edita la cotización para volver a solicitarla.")).toContain("18/11/2026");
  expect(alreadyRequestedTooltip(null)).toBe(ALREADY_REQUESTED_TOOLTIP);
});
