import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import VueSweetalert2 from "vue-sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import * as Sentry from "@sentry/vue";

Sentry.init({
  Vue,
  dsn: "https://f882606bd1c8140835ba8bbd919fdf0f@o4512212057456640.ingest.us.sentry.io/4512212072595456",
  environment: process.env.NODE_ENV,
  release: process.env.VUE_APP_VERSION,
});

Vue.use(VueSweetalert2);
Vue.config.productionTip = false;

// -------------
let deferredPrompt;

// Detectar si el navegador soporta `beforeinstallprompt`
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevenir el comportamiento predeterminado
  e.preventDefault();
  deferredPrompt = e;

  // Mostrar el botón de "Agregar a la pantalla de inicio"
  const addButton = document.getElementById("add-to-home");
  if (addButton) {
    addButton.style.display = "block";

    // Agregar evento al botón
    addButton.addEventListener("click", () => {
      // Mostrar el cuadro de diálogo de instalación
      deferredPrompt.prompt();

      deferredPrompt.userChoice.then((choiceResult) => {
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
    sessionStorage.setItem(event.key, event.newValue);
  }
});

new Vue({
  router,
  store,
  vuetify,
  render: (h) => h(App),
}).$mount("#app");
