/* eslint-disable no-console */
import { register } from "register-service-worker";

let registrationWorker = null;

export function getRegistration() {
  return registrationWorker;
}

if (process.env.NODE_ENV === "production") {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log("App is being served from cache by a service worker.");
    },
    registered(registration) {
      registrationWorker = registration;
      console.log("Service worker has been registered.");
    },
    cached() {
      console.log("Content has been cached for offline use.");
    },
    updatefound() {
      console.log("New content is downloading.");
    },
    updated(registration) {
      console.log("New content is available; please refresh.");
      registrationWorker = registration;

      // Lanzamos un evento global para que App.vue muestre el diálogo
      window.dispatchEvent(
        new CustomEvent("sw-updated", { detail: registration }),
      );
    },
    offline() {
      console.log(
        "No internet connection found. App is running in offline mode.",
      );
    },
    error(error) {
      console.error("Error during service worker registration:", error);
    },
  });
}
