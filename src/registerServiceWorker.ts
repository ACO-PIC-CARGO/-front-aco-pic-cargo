import { getRegistration, registerServiceWorker, simulateUpdate } from "@/utils/swUpdate";

export { getRegistration };

if (import.meta.env.MODE === "production") {
  window.addEventListener("load", () => registerServiceWorker(`${import.meta.env.BASE_URL}service-worker.js`));
} else if (import.meta.env.DEV) {
  // Para revisar el aviso de actualización en desarrollo: window.__acoSimularActualizacion()
  (window as unknown as { __acoSimularActualizacion: typeof simulateUpdate }).__acoSimularActualizacion = simulateUpdate;
}
