import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const UNAVAILABLE_MESSAGE = "El pago no está disponible en este momento. Intenta más tarde.";

type EventCallback = (event: unknown) => void;

const paddleMock = () => {
  const paddle = {
    Environment: { set: vi.fn() },
    Initialize: vi.fn(),
    Checkout: { open: vi.fn() },
    emit: (event: unknown) => {
      const [{ eventCallback }] = paddle.Initialize.mock.lastCall as [{ eventCallback: EventCallback }];
      eventCallback(event);
    },
  };
  return paddle;
};

let paddle: ReturnType<typeof paddleMock>;
let scriptLoads: "ok" | "fail";
let appended: HTMLScriptElement[];

const loadPlugin = () => import("@/plugins/paddle");

describe("paddle plugin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_PADDLE_CLIENT_TOKEN", "test_token");
    vi.stubEnv("VITE_PADDLE_ENV", "sandbox");
    paddle = paddleMock();
    scriptLoads = "ok";
    appended = [];
    vi.spyOn(document.head, "appendChild").mockImplementation(<T extends Node>(node: T): T => {
      const script = node as unknown as HTMLScriptElement;
      appended.push(script);
      queueMicrotask(() => {
        if (scriptLoads === "ok") {
          (window as unknown as { Paddle: unknown }).Paddle = paddle;
          script.onload!(new Event("load"));
        } else {
          script.onerror!(new Event("error"));
        }
      });
      return node;
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    delete (window as unknown as { Paddle?: unknown }).Paddle;
  });

  test("loads the Paddle script once, in sandbox, and opens the overlay checkout", async () => {
    const { openPaddleCheckout } = await loadPlugin();
    expect(await openPaddleCheckout("txn_1", vi.fn())).toBeNull();
    expect(await openPaddleCheckout("txn_2", vi.fn())).toBeNull();

    expect(appended).toHaveLength(1);
    expect(appended[0]!.src).toBe("https://cdn.paddle.com/paddle/v2/paddle.js");
    expect(appended[0]!.async).toBe(true);
    expect(paddle.Environment.set).toHaveBeenCalledWith("sandbox");
    expect(paddle.Initialize).toHaveBeenCalledTimes(1);
    expect(paddle.Initialize).toHaveBeenCalledWith({ token: "test_token", eventCallback: expect.any(Function) });
    expect(paddle.Checkout.open).toHaveBeenLastCalledWith({
      transactionId: "txn_2",
      settings: { displayMode: "overlay", variant: "one-page", locale: "es", theme: "light", allowLogout: false },
    });
  });

  test("skips the sandbox environment in production", async () => {
    vi.stubEnv("VITE_PADDLE_ENV", "production");
    const { openPaddleCheckout } = await loadPlugin();
    await openPaddleCheckout("txn_1", vi.fn());
    expect(paddle.Environment.set).not.toHaveBeenCalled();
  });

  test("forwards checkout events to the latest listener until events are stopped", async () => {
    const { openPaddleCheckout, stopCheckoutEvents } = await loadPlugin();
    const first = vi.fn();
    const second = vi.fn();
    await openPaddleCheckout("txn_1", first);
    await openPaddleCheckout("txn_2", second);
    paddle.emit({ name: "checkout.completed" });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({ name: "checkout.completed" });

    stopCheckoutEvents();
    paddle.emit({ name: "checkout.closed" });
    expect(second).toHaveBeenCalledTimes(1);
  });

  test("answers the unavailable message without a client token and never loads the script", async () => {
    vi.stubEnv("VITE_PADDLE_CLIENT_TOKEN", "");
    const { openPaddleCheckout } = await loadPlugin();
    expect(await openPaddleCheckout("txn_1", vi.fn())).toBe(UNAVAILABLE_MESSAGE);
    expect(appended).toHaveLength(0);
  });

  test("retries the script after a failed load", async () => {
    const { openPaddleCheckout, preparePaddle } = await loadPlugin();
    scriptLoads = "fail";
    expect(await preparePaddle()).toBeNull();
    expect(await openPaddleCheckout("txn_1", vi.fn())).toBe(UNAVAILABLE_MESSAGE);

    scriptLoads = "ok";
    expect(await preparePaddle()).toBe(paddle);
    expect(appended).toHaveLength(3);
    expect(paddle.Checkout.open).not.toHaveBeenCalled();
  });
});
