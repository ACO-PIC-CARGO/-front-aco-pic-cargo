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
      aco: {
        dark: false,
        colors: {
          background: "#F4F7FB",
          surface: "#FFFFFF",
          "on-background": "#1B2540",
          "on-surface": "#1B2540",
          primary: "#1967D2",
          "primary-soft": "#E8F0FE",
          success: "#34A853",
          "success-ink": "#137333",
          "success-soft": "#E6F4EA",
          neutral: "#646C7C",
          "neutral-soft": "#EEF1F5",
          "neutral-ink": "#3C4350",
          "text-muted": "#5B6475",
          border: "#DCE3EC",
          error: "#C5221F",
          warning: "#A35200",
          "warning-strong": "#E8710A",
          info: "#1967D2",
        },
        variables: {
          "border-color": "#DCE3EC",
          "border-opacity": 1,
        },
      },
    },
  },
});
