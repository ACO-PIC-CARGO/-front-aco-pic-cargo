const RELOADED_AT_KEY = "staleBuildReloadedAt";
const RELOAD_AGAIN_AFTER_MS = 60_000;

let reloading = false;

export const isReloadingIntoNewBuild = (): boolean => reloading;

export function reloadIntoNewBuild(failedChunkLoad: Event, now = Date.now()): void {
  const lastReload = Number(sessionStorage.getItem(RELOADED_AT_KEY));
  if (now - lastReload < RELOAD_AGAIN_AFTER_MS) return;

  failedChunkLoad.preventDefault();
  sessionStorage.setItem(RELOADED_AT_KEY, String(now));
  reloading = true;
  window.location.reload();
}
