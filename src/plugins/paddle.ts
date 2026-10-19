const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";
const UNAVAILABLE_MESSAGE =
  "El pago no está disponible en este momento. Intenta más tarde.";

export interface PaddleCheckoutEvent {
  name?: string;
  data?: { transaction_id?: string } | null;
}

export type PaddleCheckoutListener = (event: PaddleCheckoutEvent) => void;

interface PaddleCheckoutOptions {
  transactionId: string;
  settings: {
    displayMode: "overlay";
    variant: "one-page";
    locale: string;
    theme: "light";
    allowLogout: boolean;
  };
}

interface Paddle {
  Environment: { set: (environment: "sandbox") => void };
  Initialize: (options: {
    token: string;
    eventCallback: PaddleCheckoutListener;
  }) => void;
  Checkout: { open: (options: PaddleCheckoutOptions) => void };
}

declare global {
  interface Window {
    Paddle: Paddle;
  }
}

let paddleReady: Promise<Paddle> | null = null;
let checkoutListener: PaddleCheckoutListener | null = null;

const loadScript = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PADDLE_SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

const initializePaddle = async (): Promise<Paddle> => {
  const token = import.meta.env.VITE_PADDLE_CLIENT_TOKEN;
  if (!token) throw new Error("VITE_PADDLE_CLIENT_TOKEN is not set");
  await loadScript();
  if (import.meta.env.VITE_PADDLE_ENV !== "production") {
    window.Paddle.Environment.set("sandbox");
  }
  window.Paddle.Initialize({
    token,
    eventCallback: (event) => checkoutListener && checkoutListener(event),
  });
  return window.Paddle;
};

const getPaddle = (): Promise<Paddle> => {
  if (!paddleReady) {
    paddleReady = initializePaddle().catch((error) => {
      paddleReady = null;
      throw error;
    });
  }
  return paddleReady;
};

export const stopCheckoutEvents = (): void => {
  checkoutListener = null;
};

export const preparePaddle = (): Promise<Paddle | null> =>
  getPaddle().catch(() => null);

export const openPaddleCheckout = async (
  transactionId: string,
  onEvent: PaddleCheckoutListener,
): Promise<string | null> => {
  try {
    const paddle = await getPaddle();
    checkoutListener = onEvent;
    paddle.Checkout.open({
      transactionId,
      settings: {
        displayMode: "overlay",
        variant: "one-page",
        locale: "es",
        theme: "light",
        allowLogout: false,
      },
    });
    return null;
  } catch {
    return UNAVAILABLE_MESSAGE;
  }
};
