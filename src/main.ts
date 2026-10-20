import { createApp } from "vue";
import * as Sentry from "@sentry/vue";
import moment from "moment";
import "moment/dist/locale/es";
import { createPinia } from "pinia";
import VueSweetalert2 from "vue-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
// Imported here so it captures the session and the date at app start, before the session sync below.
import "./utils/appLoad";
import vuetify from "./plugins/vuetify";

// Importing a moment locale also activates it; the webpack build started in "en" until a screen chose "es".
moment.locale("en");

const app = createApp(App);
if (import.meta.env.DEV) app.config.errorHandler = (error) => console.error(error);

Sentry.init({
  app,
  dsn: "https://f882606bd1c8140835ba8bbd919fdf0f@o4512212057456640.ingest.us.sentry.io/4512212072595456",
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_VERSION,
  enabled: import.meta.env.PROD,
});

// -------------
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

// Detectar si el navegador soporta `beforeinstallprompt`
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevenir el comportamiento predeterminado
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;

  // Mostrar el botón de "Agregar a la pantalla de inicio"
  const addButton = document.getElementById("add-to-home");
  if (addButton) {
    addButton.style.display = "block";

    // Agregar evento al botón
    addButton.addEventListener("click", () => {
      // Mostrar el cuadro de diálogo de instalación
      deferredPrompt!.prompt();

      deferredPrompt!.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("El usuario añadió la app a la pantalla de inicio");
        } else {
          console.log(
            "El usuario rechazó la opción de agregar a la pantalla de inicio"
          );
        }
        deferredPrompt = null;
      });
    });
  }
});

// -------------
function syncSessionFromLocalStorage() {
  const keysToSync = [
    "security",
    "auth-token",
    "dataUser",
    "dataBranch",
    "iso_pais",
    "menu",
    "ConfigEmpresa",
    "version",
  ];

  keysToSync.forEach((key) => {
    const value = localStorage.getItem(key);
    if (value !== null && sessionStorage.getItem(key) === null) {
      sessionStorage.setItem(key, value);
    }
  });
}
syncSessionFromLocalStorage();
window.addEventListener("storage", (event) => {
  if (!event.key) return;
  const keysToSync = [
    "security",
    "auth-token",
    "dataUser",
    "dataBranch",
    "iso_pais",
    "menu",
    "ConfigEmpresa",
    "version",
  ];
  if (keysToSync.includes(event.key)) {
    sessionStorage.setItem(event.key, event.newValue!);
  }
});

app.use(createPinia()).use(router).use(store).use(vuetify).use(VueSweetalert2);
app.mount("#app");
