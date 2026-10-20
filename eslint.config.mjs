import pluginVue from "eslint-plugin-vue";
import vuetify from "eslint-plugin-vuetify";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";

const VUE3_RULES = [
  "no-deprecated-data-object-declaration",
  "no-deprecated-delete-set",
  "no-deprecated-destroyed-lifecycle",
  "no-deprecated-dollar-listeners-api",
  "no-deprecated-dollar-scopedslots-api",
  "no-deprecated-events-api",
  "no-deprecated-filter",
  "no-deprecated-functional-template",
  "no-deprecated-html-element-is",
  "no-deprecated-inline-template",
  "no-deprecated-model-definition",
  "no-deprecated-props-default-this",
  "no-deprecated-router-link-tag-prop",
  "no-deprecated-scope-attribute",
  "no-deprecated-slot-attribute",
  "no-deprecated-slot-scope-attribute",
  "no-deprecated-v-bind-sync",
  "no-deprecated-v-is",
  "no-deprecated-v-on-native-modifier",
  "no-deprecated-v-on-number-modifiers",
  "no-deprecated-vue-config-keycodes",
  "no-v-for-template-key-on-child",
  "no-use-v-if-with-v-for",
  "no-lone-template",
  "require-explicit-emits",
];

const TEMPLATE_GUARDS = [
  {
    selector: "VAttribute[directive=true][key.name.name='model'][key.argument.name='return-value']",
    message: "Vuetify 4 has no return-value: drop it and replace menu.save(v) with an assignment (recipe R7).",
  },
  {
    selector: "VAttribute[directive=false][key.name='size'][value.value='medium']",
    message: "Vuetify 4 has no 'medium' size (recipe R9).",
  },
  {
    selector: "VAttribute[directive=true][key.argument.name=/search-input/]",
    message: "Use v-model:search / @update:search (recipe R6).",
  },
  {
    selector: "VAttribute[directive=true][key.name.name='on'][key.argument=null]",
    message: 'Object v-on (e.g. v-on="on") - Vuetify 4 activators/slots pass props: use v-bind="props" (recipe R4).',
  },
  {
    selector: "VElement[name=/^(v-stepper-(step|content|items)|vstepper(step|content|items))$/]",
    message: "Vuetify 4 steppers: v-stepper-item / v-stepper-window(-item) or v-stepper-vertical(-item) (recipe R8).",
  },
  {
    selector:
      "VElement[name=/^(v-navigation-drawer|vnavigationdrawer)$/i] > VStartTag > VAttribute[directive=false][key.name='location'][value.value=/\\s/]",
    message: "v-navigation-drawer takes one location (recipe R19).",
  },
  {
    selector:
      "VElement[name=/^(v-navigation-drawer|vnavigationdrawer)$/i] > VStartTag > VAttribute[directive=false][key.name='persistent']",
    message: "Vuetify 4 honors persistent on drawers (blocks outside-click close); Vuetify 2 ignored it (recipe R22).",
  },
  {
    selector:
      "VElement[name=/^(v-data-table|vdatatable)$/i] > VStartTag > VAttribute[directive=false][key.name='mobile']",
    message: "Vuetify 4 forces the mobile layout with mobile; Vuetify 2 ignored it (recipe R22).",
  },
  {
    selector:
      "VElement[name=/^(v-autocomplete|vautocomplete|v-combobox|vcombobox)$/i] > VStartTag > VAttribute[directive=false][key.name='search']",
    message: "A bare search attribute pins the search to an empty string in Vuetify 4 (recipe R22).",
  },
  {
    selector:
      "VElement[name=/^(v-card-title|vcardtitle)$/]:not(:has(> VStartTag:has(VAttribute[directive=false][key.name='class'][value.value=/(^|\\s)d-flex(\\s|$)/]))) > VElement[name=/^(v-spacer|vspacer)$/]",
    message: 'Vuetify 4 v-card-title is not a flex row: add class="d-flex align-center flex-wrap" so v-spacer works (recipe R35).',
  },
  {
    selector: "VElement[name=/^(v-list-subheader|vlistsubheader)$/] > VElement[name=/^(v-spacer|vspacer)$/]",
    message: "Vuetify 4 wraps v-list-subheader content in a text block, so v-spacer does nothing: lay the row out in a d-flex wrapper (recipe R35).",
  },
];

const TYPOGRAPHY_GUARD = {
  selector:
    "VAttribute[directive=false][key.name='class'][value.value=/(^|\\s)(display-[1-4]|headline|title|subheading|subtitle-[12]|body-[12]|caption|overline)(\\s|$)/]",
  message: "Vuetify 2 typography class (recipe R17).",
};

const MD2_TYPOGRAPHY_GUARD = {
  selector:
    "VAttribute[directive=false][key.name='class'][value.value=/(^|\\s)text-(h[1-6]|subtitle-[12]|body-[12]|caption|button|overline)(\\s|$)/]",
  message: "Material Design 2 typography class: use its Material Design 3 token (recipe R5).",
};

// Their <style> extends the token as the app's own class, so recipe R17 keeps it beside the mapped class.
const OWN_TYPOGRAPHY_CLASS_FILES = [
  "src/components/FolderConfig/EstatusDefectoComponent.vue",
  "src/components/Membresia/OpcionesMembresia.vue",
  "src/components/Security/Accesos/LoginComponent.vue",
  "src/components/Security/Accesos/SucursalComponent.vue",
];

export default defineConfigWithVueTs(
  { ignores: ["dist/**", "node_modules/**"] },
  ...pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  ...vuetify.configs["flat/recommended"],
  {
    files: ["src/**/*.{js,ts,vue}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      "vue/block-order": ["error", { order: ["script", "template", "style"] }],
      "vue/component-api-style": ["error", ["script-setup"]],
      ...Object.fromEntries(VUE3_RULES.map((rule) => [`vue/${rule}`, "error"])),
      "vuetify/no-deprecated-typography": "off",
      "vuetify/no-elevation-overflow": "error",
      "vuetify/no-legacy-grid-props": "error",
      "vuetify/no-deprecated-snackbar": "error",
      "vue/no-restricted-syntax": ["error", ...TEMPLATE_GUARDS, TYPOGRAPHY_GUARD, MD2_TYPOGRAPHY_GUARD],
      // A listener written before v-model runs before the model updates (recipe R3).
      "vue/attributes-order": ["error", { order: ["TWO_WAY_BINDING", "EVENTS"] }],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.property.name='currentRoute'][property.name!='value']",
          message: "router.currentRoute is a ref in vue-router 4+: use router.currentRoute.value (recipe R2).",
        },
      ],
    },
  },
  {
    files: OWN_TYPOGRAPHY_CLASS_FILES,
    rules: { "vue/no-restricted-syntax": ["error", ...TEMPLATE_GUARDS, MD2_TYPOGRAPHY_GUARD] },
  },
);
