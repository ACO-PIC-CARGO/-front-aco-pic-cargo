const PADDLE_SCRIPT_URL = "https://cdn.paddle.com/paddle/v2/paddle.js";
const UNAVAILABLE_MESSAGE =
  "El pago no está disponible en este momento. Intenta más tarde.";

let paddleReady = null;
let checkoutListener = null;

const loadScript = () =>
  new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PADDLE_SCRIPT_URL;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

const initializePaddle = async () => {
  const token = process.env.VUE_APP_PADDLE_CLIENT_TOKEN;
  if (!token) throw new Error("VUE_APP_PADDLE_CLIENT_TOKEN is not set");
  await loadScript();
  if (process.env.VUE_APP_PADDLE_ENV !== "production") {
    window.Paddle.Environment.set("sandbox");
  }
  window.Paddle.Initialize({
    token,
    eventCallback: (event) => checkoutListener && checkoutListener(event),
  });
  return window.Paddle;
};

const getPaddle = () => {
  if (!paddleReady) {
    paddleReady = initializePaddle().catch((error) => {
      paddleReady = null;
      throw error;
    });
  }
  return paddleReady;
};

export const stopCheckoutEvents = () => {
  checkoutListener = null;
};

export const openPaddleCheckout =async (transactionId, onEvent) => {
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
  } catch (error) {
    return UNAVAILABLE_MESSAGE;
  }
};
