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
  display: { thresholds: { md: 960, lg: 1264, xl: 1904, xxl: 2560 } },
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
    VTabs: { color: "primary", VTab: { baseColor: "rgba(0, 0, 0, 0.54)" } },
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
    },
  },
});
