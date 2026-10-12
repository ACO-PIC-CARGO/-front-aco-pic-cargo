import pluginVue from "eslint-plugin-vue";
import vuetify from "eslint-plugin-vuetify";

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
];

const TYPOGRAPHY_GUARD = {
  selector:
    "VAttribute[directive=false][key.name='class'][value.value=/(^|\\s)(display-[1-4]|headline|title|subheading|subtitle-[12]|body-[12]|caption|overline)(\\s|$)/]",
  message: "Vuetify 2 typography class (recipe R17).",
};

// Their <style> extends the token as the app's own class, so recipe R17 keeps it beside the mapped class.
const OWN_TYPOGRAPHY_CLASS_FILES = [
  "src/components/FolderConfig/EstatusDefectoComponent.vue",
  "src/components/Membresia/OpcionesMembresia.vue",
  "src/components/Security/Accesos/LoginComponent.vue",
  "src/components/Security/Accesos/SucursalComponent.vue",
];

export default [
  { ignores: ["dist/**", "node_modules/**", "src/**/* copy.vue"] },
  ...pluginVue.configs["flat/base"],
  ...vuetify.configs["flat/base"],
  ...vuetify.configs["flat/recommended"],
  {
    files: ["src/**/*.{js,vue}"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    rules: {
      ...Object.fromEntries(VUE3_RULES.map((rule) => [`vue/${rule}`, "error"])),
      "vuetify/no-deprecated-typography": "off",
      "vuetify/no-elevation-overflow": "off",
      "vuetify/no-legacy-grid-props": "error",
      "vuetify/no-deprecated-snackbar": "error",
      "vue/no-restricted-syntax": ["error", ...TEMPLATE_GUARDS, TYPOGRAPHY_GUARD],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            ":not(AwaitExpression) > CallExpression[callee.property.name='validate'][callee.object.object.property.name='$refs']",
          message: "Vuetify 4 form validate() is async: use (await this.$refs.x.validate()).valid (recipe R1).",
        },
        {
          selector: "MemberExpression[object.property.name='currentRoute'][property.name!='value']",
          message: "router.currentRoute is a ref in vue-router 4+: use router.currentRoute.value (recipe R2).",
        },
        {
          selector: "Property[key.name='components'] > ObjectExpression > Property > ArrowFunctionExpression[body.type='ImportExpression']",
          message: "Wrap async components in defineAsyncComponent (recipe R15).",
        },
      ],
    },
  },
  {
    files: OWN_TYPOGRAPHY_CLASS_FILES,
    rules: { "vue/no-restricted-syntax": ["error", ...TEMPLATE_GUARDS] },
  },
];
