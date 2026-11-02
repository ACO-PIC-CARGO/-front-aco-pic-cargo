import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";
import "@/styles/vuetify-legacy.css";
import { createVuetify } from "vuetify";
import { aliases, mdi } from "vuetify/iconsets/mdi";
import { en, es } from "vuetify/locale";

const primaryColor = { color: "primary" };
const fieldDefaults = { variant: "underlined", ...primaryColor };

export default createVuetify({
  icons: { defaultSet: "mdi", aliases, sets: { mdi } },
  locale: { locale: "en", fallback: "en", messages: { en, es } },
  defaults: {
    VTextField: fieldDefaults,
    VTextarea: fieldDefaults,
    VSelect: fieldDefaults,
    VAutocomplete: fieldDefaults,
    VCombobox: fieldDefaults,
    VFileInput: fieldDefaults,
    VCheckbox: primaryColor,
    VCheckboxBtn: primaryColor,
    VRadio: primaryColor,
    VRadioGroup: primaryColor,
    VSwitch: primaryColor,
    VStepper: primaryColor,
    VTabs: { ...primaryColor, VTab: { baseColor: "rgba(0, 0, 0, 0.54)" } },
    VChip: { variant: "flat" },
    VCardActions: { VBtn: { variant: "elevated" } },
  },
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
          "on-primary": "#FFFFFF",
          "on-secondary": "#FFFFFF",
          "on-accent": "#FFFFFF",
          "on-info": "#FFFFFF",
          "on-success": "#FFFFFF",
          "on-warning": "#FFFFFF",
          "on-error": "#FFFFFF",
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
