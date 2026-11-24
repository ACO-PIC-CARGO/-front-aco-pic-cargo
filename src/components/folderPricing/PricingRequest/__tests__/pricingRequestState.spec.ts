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

test("without a server reason, the tooltip names when pricing was last requested", () => {
  expect(alreadyRequestedTooltip(null, "24/11/2026 10:15")).toBe(
    "Ya fue solicitado a Pricing el 24/11/2026 10:15. Edita la cotización para volver a solicitarla.",
  );
  expect(alreadyRequestedTooltip("Ya fue solicitada el 18/11/2026 10:00.", "24/11/2026 10:15")).toBe("Ya fue solicitada el 18/11/2026 10:00.");
  expect(alreadyRequestedTooltip(null, null)).toBe(ALREADY_REQUESTED_TOOLTIP);
});
