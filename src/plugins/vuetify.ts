import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import "@/styles/vuetify-legacy.css";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { en, es } from "vuetify/locale";

export default createVuetify({
  icons: { defaultSet: "mdi", aliases, sets: { mdi } },
  locale: { locale: "en", fallback: "en", messages: { en, es } },
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        colors: {
          primary: "#03A9F4",
          secondary: "#0288D1",
          accent: "#B3E5FC",
          info: "#29B6F6",
          success: "#26A69A",
          warning: "#FFD54F",
          error: "#E57373",
        },
      },
    },
  },
});
