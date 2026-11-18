import { expect, test } from "vitest";
import { ALREADY_REQUESTED_TOOLTIP, alreadyRequestedTooltip, isAlreadyRequested } from "../pricingRequestState";

const info = (fields = {}) => ({ can_request: false, blocked_reason: "Ya fue solicitada el 18/11/2026 10:00. Edita la cotización para volver a solicitarla.", ...fields });

test("a refusal because it was already requested is recognised", () => {
  expect(isAlreadyRequested(info())).toBe(true);
});

test("other refusals are not treated as already requested", () => {
  expect(isAlreadyRequested(info({ blocked_reason: "Ya hay una solicitud pendiente." }))).toBe(false);
  expect(isAlreadyRequested(info({ blocked_reason: "La cotización no tiene pricing asignado." }))).toBe(false);
  expect(isAlreadyRequested(info({ blocked_reason: null }))).toBe(false);
});

test("an allowed request or a missing info is not already requested", () => {
  expect(isAlreadyRequested(info({ can_request: true }))).toBe(false);
  expect(isAlreadyRequested(null)).toBe(false);
});

test("the tooltip shows the server reason and falls back to the default copy", () => {
  expect(alreadyRequestedTooltip("Ya fue solicitada el 18/11/2026 10:00. Edita la cotización para volver a solicitarla.")).toContain("18/11/2026");
  expect(alreadyRequestedTooltip(null)).toBe(ALREADY_REQUESTED_TOOLTIP);
});
