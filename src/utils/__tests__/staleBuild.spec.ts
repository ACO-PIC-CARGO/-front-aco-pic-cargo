import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { isReloadingIntoNewBuild, reloadIntoNewBuild } from "@/utils/staleBuild";

const realLocation = window.location;
const reload = vi.fn();
Object.defineProperty(window, "location", { value: { reload }, configurable: true });
afterAll(() => Object.defineProperty(window, "location", { value: realLocation, configurable: true }));

const failedChunkLoad = () => new Event("vite:preloadError", { cancelable: true });
const NOW = Date.parse("2026-11-10T14:00:00Z");

describe("a screen whose files belong to a build replaced by a deploy", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reload.mockClear();
  });

  test("reloads the page so the new build loads, and keeps the error from surfacing", () => {
    const event = failedChunkLoad();

    reloadIntoNewBuild(event, NOW);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });

  test("marks the page as reloading, so what fails before it unloads is not reported", () => {
    reloadIntoNewBuild(failedChunkLoad(), NOW);

    expect(isReloadingIntoNewBuild()).toBe(true);
  });

  test("lets the error surface when the page already reloaded within the last minute, so a file missing from the new build is not a reload loop", () => {
    reloadIntoNewBuild(failedChunkLoad(), NOW);
    const event = failedChunkLoad();

    reloadIntoNewBuild(event, NOW + 30_000);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(false);
  });

  test("reloads again for a later deploy", () => {
    reloadIntoNewBuild(failedChunkLoad(), NOW);

    reloadIntoNewBuild(failedChunkLoad(), NOW + 61_000);

    expect(reload).toHaveBeenCalledTimes(2);
  });
});
