import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  applyUpdate,
  hardReload,
  LLEGADA_MS,
  parsePrecacheManifest,
  precacheKey,
  registerServiceWorker,
  swUpdate,
} from "@/utils/swUpdate";

class FakeWorker extends EventTarget {
  state: ServiceWorkerState = "installing";
  scriptURL = "https://app.test/service-worker.js";
  postMessage = vi.fn();
  goTo(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event("statechange"));
  }
}

class FakeRegistration extends EventTarget {
  scope = "https://app.test/";
  installing: FakeWorker | null = null;
  waiting: FakeWorker | null = null;
  update = vi.fn().mockResolvedValue(undefined);
}

const MANIFEST =
  'precacheAndRoute([{url:"index.html",revision:"abc"},{url:"assets/a-1.js",revision:null},{url:"assets/b-2.js",revision:null},{url:"assets/c-3.css",revision:null}],{})';
let cached: string[] = [];
let registration: FakeRegistration;
let hasController = true;

const setUp = async (prepare?: (registration: FakeRegistration) => void) => {
  registration = new FakeRegistration();
  prepare?.(registration);
  vi.stubGlobal("navigator", {
    serviceWorker: {
      get controller() {
        return hasController ? {} : null;
      },
      register: vi.fn().mockResolvedValue(registration),
      addEventListener: vi.fn(),
    },
  });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ text: () => Promise.resolve(MANIFEST) }));
  vi.stubGlobal("caches", {
    keys: () => Promise.resolve(["workbox-precache-v2-https://app.test/"]),
    open: () => Promise.resolve({ keys: () => Promise.resolve(cached.map((url) => ({ url }))) }),
  });
  await registerServiceWorker("/service-worker.js");
};

const foundUpdate = () => {
  const worker = new FakeWorker();
  registration.installing = worker;
  registration.dispatchEvent(new Event("updatefound"));
  return worker;
};

beforeEach(() => {
  vi.useFakeTimers();
  cached = [];
  hasController = true;
  Object.assign(swUpdate, { fase: "idle", progreso: 0, archivosListos: 0, archivosTotales: 0, oculto: false });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("service worker update notice", () => {
  test("reads the precache manifest Workbox inlines in the service worker", () => {
    expect(parsePrecacheManifest(MANIFEST)).toEqual([
      { url: "index.html", revision: "abc" },
      { url: "assets/a-1.js", revision: null },
      { url: "assets/b-2.js", revision: null },
      { url: "assets/c-3.css", revision: null },
    ]);
    expect(precacheKey({ url: "index.html", revision: "abc" }, "https://app.test/")).toBe(
      "https://app.test/index.html?__WB_REVISION__=abc",
    );
  });

  test("shows the download as it happens and the ship reaches the end once installed", async () => {
    await setUp();
    const worker = foundUpdate();
    expect(swUpdate.fase).toBe("descargando");

    cached = ["https://app.test/index.html?__WB_REVISION__=abc", "https://app.test/assets/a-1.js"];
    await vi.advanceTimersByTimeAsync(400);
    expect(swUpdate.archivosTotales).toBe(4);
    expect(swUpdate.archivosListos).toBe(2);
    expect(swUpdate.progreso).toBeGreaterThan(0);
    expect(swUpdate.progreso).toBeLessThan(100);

    worker.goTo("installed");
    expect(swUpdate.progreso).toBe(100);
    expect(swUpdate.fase).toBe("descargando");
    await vi.advanceTimersByTimeAsync(LLEGADA_MS);
    expect(swUpdate.fase).toBe("lista");
  });

  test("progress never goes backwards", async () => {
    await setUp();
    foundUpdate();
    cached = ["https://app.test/assets/a-1.js", "https://app.test/assets/b-2.js"];
    await vi.advanceTimersByTimeAsync(400);
    const before = swUpdate.progreso;
    cached = [];
    await vi.advanceTimersByTimeAsync(400);
    expect(swUpdate.progreso).toBe(before);
  });

  test("the first install of the app is not announced as an update", async () => {
    hasController = false;
    await setUp();
    foundUpdate().goTo("installed");
    expect(swUpdate.fase).toBe("idle");
  });

  test("a version already waiting when the page opens is offered right away", async () => {
    await setUp((registration) => {
      registration.waiting = new FakeWorker();
      registration.waiting.state = "installed";
    });
    expect(swUpdate.fase).toBe("lista");
  });

  test("updating tells the waiting worker to skip waiting", async () => {
    await setUp();
    const worker = foundUpdate();
    worker.goTo("installed");
    registration.waiting = worker;

    expect(applyUpdate()).toBe(true);
    expect(worker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(swUpdate.fase).toBe("aplicando");
  });

  test("without a waiting worker the update falls back to the old reload", async () => {
    await setUp();
    expect(applyUpdate()).toBe(false);
  });

  test("the reload works like Ctrl+F5: clears every cache and enters with ?v=<time>", async () => {
    const deleted: string[] = [];
    const replace = vi.fn();
    vi.stubGlobal("caches", {
      keys: () => Promise.resolve(["workbox-precache-v2", "aco-assets"]),
      delete: (name: string) => Promise.resolve(deleted.push(name) > 0),
    });
    window.history.replaceState(null, "", "/home/main?tab=2&v=10#x");

    await hardReload(1981, replace);

    expect(deleted).toEqual(["workbox-precache-v2", "aco-assets"]);
    expect(replace).toHaveBeenCalledWith(`${window.location.origin}/home/main?tab=2&v=1981#x`);
    expect(localStorage.getItem("actualizando")).toBe("1");
  });
});
