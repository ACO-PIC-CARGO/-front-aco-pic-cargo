import { expect, test } from "vitest";
import { latestRequestTracker } from "@/utils/latestRequest";

test("only the most recent request is still the latest once a newer one starts", () => {
  const startRequest = latestRequestTracker();

  const older = startRequest();
  const newer = startRequest();

  expect(older()).toBe(false);
  expect(newer()).toBe(true);
});

test("each tracker follows its own requests", () => {
  const origin = latestRequestTracker();
  const destination = latestRequestTracker();

  const originSearch = origin();
  destination();

  expect(originSearch()).toBe(true);
});
