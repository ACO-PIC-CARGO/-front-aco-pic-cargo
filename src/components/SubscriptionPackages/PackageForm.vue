<template>
  <v-dialog
    :value="value"
    max-width="1180"
    persistent
    :fullscreen="$vuetify.breakpoint.smAndDown"
    content-class="plans-theme plans-theme--app package-dialog"
  >
    <v-form
      ref="form"
      class="package-form"
      aria-labelledby="package-form-title"
      @submit.prevent="save"
    >
      <header class="package-form__header">
        <div>
          <h2 id="package-form-title" class="package-form__title">
            {{ title }}
          </h2>
          <p class="package-form__subtitle">
            Revisa la vista previa antes de guardar.
          </p>
        </div>
        <v-btn
          icon
          class="icon-button"
          aria-label="Cerrar sin guardar"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </header>

      <div class="package-form__body">
        <div class="package-form__fields">
          <section class="form-section" aria-labelledby="section-identity">
            <h3 id="section-identity" class="form-section__title">Identidad</h3>
            <v-text-field
              id="package-name"
              v-model="name"
              label="Nombre"
              placeholder="Ej. START"
              autocomplete="off"
              :maxlength="limits.name"
              :counter="limits.name"
              :hint="`Se muestra como ACO ${previewPlan.name}.`"
              persistent-hint
              :error-messages="visibleErrors.name"
              :aria-invalid="String(Boolean(visibleErrors.name))"
              outlined
              dense
              @blur="touch('name')"
            />
            <v-text-field
              id="package-tagline"
              v-model="tagline"
              label="Descripción corta (opcional)"
              autocomplete="off"
              :maxlength="limits.tagline"
              :counter="limits.tagline"
              hint="Una línea bajo el nombre, por ejemplo: Para empezar."
              persistent-hint
              :error-messages="visibleErrors.tagline"
              :aria-invalid="String(Boolean(visibleErrors.tagline))"
              outlined
              dense
              @blur="touch('tagline')"
            />
            <v-switch
              v-model="isFeatured"
              class="package-switch"
              label='Marcar como "Más elegido"'
              color="var(--planes-accent)"
              hide-details
              dense
            />
          </section>

          <section class="form-section" aria-labelledby="section-pricing">
            <h3 id="section-pricing" class="form-section__title">
              Precio y usuarios
            </h3>
            <div class="form-grid">
              <v-text-field
                id="package-monthly-price"
                v-model="monthlyPrice"
                label="Precio mensual"
                prefix="US$"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                :error-messages="visibleErrors.monthlyPrice"
                :aria-invalid="String(Boolean(visibleErrors.monthlyPrice))"
                outlined
                dense
                @blur="touch('monthlyPrice')"
              />
              <v-text-field
                id="package-annual-price"
                v-model="annualPrice"
                label="Precio anual"
                prefix="US$"
                type="number"
                min="0"
                step="0.01"
                inputmode="decimal"
                :error-messages="visibleErrors.annualPrice"
                :aria-invalid="String(Boolean(visibleErrors.annualPrice))"
                outlined
                dense
                @blur="touch('annualPrice')"
              />
            </div>
            <p
              v-if="savingsHint"
              class="savings-hint"
              :class="{ 'savings-hint--positive': savingsHint.positive }"
              aria-live="polite"
            >
              <v-icon>
                {{
                  savingsHint.positive
                    ? "mdi-tag-outline"
                    : "mdi-information-outline"
                }}
              </v-icon>
              {{ savingsHint.text }}
            </p>

            <div class="stepper">
              <v-btn
                text
                class="stepper__button"
                aria-label="Quitar un usuario"
                :disabled="draft.userLimit <= 1"
                @click="changeUsers(-1)"
              >
                <v-icon>mdi-minus</v-icon>
              </v-btn>
              <v-text-field
                id="package-users"
                v-model.number="userLimit"
                class="stepper__value"
                label="Usuarios incluidos"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                :error-messages="visibleErrors.userLimit"
                :aria-invalid="String(Boolean(visibleErrors.userLimit))"
                outlined
                dense
                @blur="touch('userLimit')"
              />
              <v-btn
                text
                class="stepper__button"
                aria-label="Agregar un usuario"
                @click="changeUsers(1)"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>
          </section>

          <section class="form-section" aria-labelledby="section-trial">
            <h3 id="section-trial" class="form-section__title">
              Periodo de prueba
            </h3>
            <v-switch
              v-model="trialEnabled"
              class="package-switch"
              label="Ofrecer periodo de prueba"
              color="var(--planes-accent)"
              hide-details
              dense
            />
            <div v-if="trialEnabled" class="form-grid">
              <v-text-field
                id="package-trial-length"
                v-model="trialFrequency"
                label="Duración"
                type="number"
                min="1"
                step="1"
                inputmode="numeric"
                hint="El cliente deja su tarjeta y se le cobra cuando termina la prueba."
                persistent-hint
                :error-messages="visibleErrors.trialFrequency"
                :aria-invalid="String(Boolean(visibleErrors.trialFrequency))"
                outlined
                dense
                @blur="touch('trialFrequency')"
              />
              <v-select
                v-model="trialInterval"
                :items="trialUnits"
                item-text="label"
                item-value="value"
                aria-label="Unidad de la duración"
                outlined
                dense
                @change="touch('trialFrequency')"
              />
            </div>
          </section>

          <section class="form-section" aria-labelledby="section-modules">
            <h3 id="section-modules" class="form-section__title">Módulos</h3>
            <p class="form-section__help">
              Elige los módulos que ofrece este paquete.
            </p>
            <div
              v-if="modules.length"
              class="chips"
              role="group"
              aria-labelledby="section-modules"
            >
              <v-btn
                v-for="(module, position) in modules"
                :id="position === 0 ? 'package-modules' : null"
                :key="module.id"
                text
                class="chip"
                :class="{ 'chip--selected': isModuleSelected(module.id) }"
                :aria-pressed="String(isModuleSelected(module.id))"
                :aria-invalid="
                  String(position === 0 && Boolean(visibleErrors.moduleIds))
                "
                @click="onToggleModule(module.id)"
              >
                <v-icon>
                  {{ isModuleSelected(module.id) ? "mdi-check" : "mdi-plus" }}
                </v-icon>
                {{ module.name }}
              </v-btn>
            </div>
            <p v-else class="form-message form-message--error">
              No pudimos cargar los módulos. Cierra el formulario, actualiza la
              página e intenta de nuevo.
            </p>
            <p
              v-if="visibleErrors.moduleIds"
              class="form-message form-message--error"
            >
              {{ visibleErrors.moduleIds }}
            </p>

            <div class="access">
              <span class="access__label">Acceso del cliente</span>
              <v-btn-toggle
                :value="accessMode"
                mandatory
                rounded
                dense
                class="segmented"
                role="group"
                aria-label="Acceso del cliente a los módulos"
                @change="setAccessMode"
              >
                <v-btn
                  v-for="option in accessOptions"
                  :key="option.value"
                  :value="option.value"
                  :disabled="draft.moduleIds.length < 2"
                  text
                >
                  {{ option.label }}
                </v-btn>
              </v-btn-toggle>
              <div v-if="accessMode === 'choose'" class="access__choose">
                <span id="selection-label">El cliente elige</span>
                <div
                  class="stepper stepper--compact"
                  role="group"
                  aria-labelledby="selection-label"
                >
                  <v-btn
                    text
                    class="stepper__button"
                    aria-label="Elegir un módulo menos"
                    :disabled="draft.selectionLimit <= 1"
                    @click="changeSelection(-1)"
                  >
                    <v-icon>mdi-minus</v-icon>
                  </v-btn>
                  <output
                    id="package-selection"
                    class="stepper__output"
                    tabindex="-1"
                    :aria-invalid="
                      String(Boolean(visibleErrors.selectionLimit))
                    "
                  >
                    {{ draft.selectionLimit }}
                  </output>
                  <v-btn
                    text
                    class="stepper__button"
                    aria-label="Elegir un módulo más"
                    :disabled="
                      draft.selectionLimit >= draft.moduleIds.length - 1
                    "
                    @click="changeSelection(1)"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </div>
                <span>de {{ draft.moduleIds.length }} módulos</span>
              </div>
              <p class="form-message">{{ accessHint }}</p>
              <p
                v-if="visibleErrors.selectionLimit"
                class="form-message form-message--error"
              >
                {{ visibleErrors.selectionLimit }}
              </p>
            </div>
          </section>

          <section class="form-section" aria-labelledby="section-features">
            <h3 id="section-features" class="form-section__title">
              Características
            </h3>
            <p class="form-section__help">
              Lo que incluye y lo que no. Liga una característica a un módulo
              para mostrarla dentro de él.
            </p>

            <div class="feature-add">
              <v-text-field
                id="new-feature"
                v-model="newFeatureText"
                label="Nueva característica"
                placeholder="Ej. Soporte prioritario"
                autocomplete="off"
                :maxlength="limits.feature"
                :error="Boolean(visibleErrors.features)"
                :aria-invalid="String(Boolean(visibleErrors.features))"
                hide-details
                outlined
                dense
                @keydown.enter.prevent="addFeature"
              />
              <v-select
                v-model="newFeatureModuleId"
                :items="featureTargets"
                item-text="label"
                item-value="value"
                aria-label="Dónde se muestra la característica"
                hide-details
                outlined
                dense
              />
              <v-btn
                text
                class="plans-button plans-button--secondary"
                :disabled="!newFeatureText.trim()"
                @click="addFeature"
              >
                <v-icon>mdi-plus</v-icon> Agregar
              </v-btn>
            </div>
            <p
              v-if="visibleErrors.features"
              class="form-message form-message--error"
            >
              {{ visibleErrors.features }}
            </p>

            <ul v-if="draft.features.length" class="feature-rows">
              <li
                v-for="feature in draft.features"
                :key="feature.key"
                class="feature-row"
                :class="{ 'feature-row--excluded': !feature.isIncluded }"
              >
                <v-btn
                  icon
                  class="icon-button icon-button--small"
                  :class="
                    feature.isIncluded
                      ? 'icon-button--included'
                      : 'icon-button--excluded'
                  "
                  :disabled="Boolean(feature.moduleId)"
                  :aria-pressed="String(feature.isIncluded)"
                  :aria-label="
                    feature.isIncluded
                      ? 'Incluida. Cambiar a no incluida'
                      : 'No incluida. Cambiar a incluida'
                  "
                  @click="toggleIncluded(feature)"
                >
                  <v-icon>
                    {{
                      feature.isIncluded
                        ? "mdi-check-circle"
                        : "mdi-close-circle"
                    }}
                  </v-icon>
                </v-btn>
                <v-text-field
                  class="input--inline"
                  :value="feature.description"
                  :maxlength="limits.feature"
                  aria-label="Texto de la característica"
                  hide-details
                  outlined
                  dense
                  @input="updateFeature(feature, { description: $event })"
                />
                <span v-if="feature.moduleId" class="feature-row__module">
                  {{ moduleName(feature.moduleId) }}
                </span>
                <v-btn
                  v-else
                  icon
                  class="icon-button icon-button--small"
                  :class="{
                    'icon-button--starred':
                      feature.isHighlighted && feature.isIncluded,
                  }"
                  :disabled="!canHighlight(feature)"
                  :aria-pressed="
                    String(feature.isHighlighted && feature.isIncluded)
                  "
                  aria-label="Destacar en el resumen"
                  @click="
                    updateFeature(feature, {
                      isHighlighted: !feature.isHighlighted,
                    })
                  "
                >
                  <v-icon>
                    {{
                      feature.isHighlighted && feature.isIncluded
                        ? "mdi-star"
                        : "mdi-star-outline"
                    }}
                  </v-icon>
                </v-btn>
                <v-btn
                  icon
                  class="icon-button icon-button--small"
                  aria-label="Quitar característica"
                  @click="removeFeature(feature)"
                >
                  <v-icon>mdi-trash-can-outline</v-icon>
                </v-btn>
              </li>
            </ul>
            <p v-else class="feature-empty">
              Aún no hay características. Escribe una arriba y presiona Enter.
            </p>
            <p class="form-message">
              La estrella muestra la característica en el resumen de la tarjeta
              en celular. Máximo {{ limits.highlights }}.
            </p>
          </section>
        </div>

        <aside
          class="package-form__preview"
          aria-label="Vista previa de la tarjeta"
        >
          <div class="preview-bar">
            <span class="access__label">Vista previa</span>
            <v-btn-toggle
              v-model="previewAnnual"
              mandatory
              rounded
              dense
              class="segmented"
              role="group"
              aria-label="Precio en la vista previa"
            >
              <v-btn
                v-for="option in billingOptions"
                :key="String(option.value)"
                :value="option.value"
                text
              >
                {{ option.label }}
              </v-btn>
            </v-btn-toggle>
          </div>
          <PackageCard
            :plan="previewPlan"
            :annual="previewAnnual"
            :expanded="previewExpanded"
            @toggle-details="previewExpanded = !previewExpanded"
          />
        </aside>
      </div>

      <footer class="package-form__footer">
        <p v-if="serverMessage" class="form-alert" role="alert">
          <v-icon>mdi-alert-circle-outline</v-icon>
          {{ serverMessage }}
        </p>
        <p v-else-if="submitted && hasErrors" class="form-alert" role="alert">
          <v-icon>mdi-alert-circle-outline</v-icon>
          Revisa los campos marcados para poder guardar.
        </p>
        <div class="package-form__actions">
          <v-btn text class="plans-button plans-button--ghost" @click="close">
            Cancelar
          </v-btn>
          <v-btn
            text
            type="submit"
            class="plans-button plans-button--primary"
            :disabled="saving"
          >
            <v-icon v-if="saving" class="mdi-spin">mdi-loading</v-icon>
            {{ submitLabel }}
          </v-btn>
        </div>
      </footer>
    </v-form>
  </v-dialog>
</template>

<script>
import { mapActions, mapGetters, mapState } from "vuex";
import PackageCard from "./PackageCard.vue";

const ACCESS_OPTIONS = [
  { value: "all", label: "Todos incluidos" },
  { value: "choose", label: "El cliente elige" },
];

const BILLING_OPTIONS = [
  { value: false, label: "Mensual" },
  { value: true, label: "Anual" },
];

const FIELD_ORDER = [
  ["name", "package-name"],
  ["tagline", "package-tagline"],
  ["monthlyPrice", "package-monthly-price"],
  ["annualPrice", "package-annual-price"],
  ["userLimit", "package-users"],
  ["trialFrequency", "package-trial-length"],
  ["moduleIds", "package-modules"],
  ["selectionLimit", "package-selection"],
  ["features", "new-feature"],
];

const draftField = (field) => ({
  get() {
    return this.$store.state.subscriptions.packageDraft[field];
  },
  set(value) {
    this.$store.commit("subscriptions/SET_DRAFT_FIELD", { field, value });
  },
});

export default {
  name: "PackageForm",
  components: { PackageCard },
  props: {
    value: { type: Boolean, default: false },
    pkg: { type: Object, default: null },
  },
  data: () => ({
    touched: {},
    submitted: false,
    saving: false,
    serverMessage: "",
    newFeatureText: "",
    newFeatureModuleId: null,
    previewAnnual: true,
    previewExpanded: true,
    accessOptions: ACCESS_OPTIONS,
    billingOptions: BILLING_OPTIONS,
  }),
  computed: {
    ...mapState("subscriptions", {
      draft: "packageDraft",
      modules: "packageModules",
    }),
    ...mapGetters("subscriptions", {
      errors: "packageDraftErrors",
      previewPlan: "packageDraftPreview",
      savingsHint: "packageDraftSavings",
      canHighlight: "canHighlightFeature",
      limits: "limits",
      trialUnits: "trialUnits",
    }),
    name: draftField("name"),
    tagline: draftField("tagline"),
    monthlyPrice: draftField("monthlyPrice"),
    annualPrice: draftField("annualPrice"),
    userLimit: draftField("userLimit"),
    isFeatured: draftField("isFeatured"),
    trialEnabled: draftField("trialEnabled"),
    trialInterval: draftField("trialInterval"),
    trialFrequency: draftField("trialFrequency"),
    isEditing() {
      return Boolean(this.pkg);
    },
    title() {
      return this.isEditing ? `Editar ACO ${this.pkg.name}` : "Nuevo paquete";
    },
    submitLabel() {
      if (this.saving) return "Guardando";
      return this.isEditing ? "Guardar cambios" : "Crear paquete";
    },
    hasErrors() {
      return Object.keys(this.errors).length > 0;
    },
    visibleErrors() {
      if (this.submitted) return this.errors;
      return Object.fromEntries(
        Object.entries(this.errors).filter(([field]) => this.touched[field])
      );
    },
    selectedModules() {
      return this.modules.filter((module) => this.isModuleSelected(module.id));
    },
    featureTargets() {
      return [
        { value: null, label: "General" },
        ...this.selectedModules.map((module) => ({
          value: module.id,
          label: `En ${module.name}`,
        })),
      ];
    },
    accessMode() {
      return this.draft.selectionLimit === null ? "all" : "choose";
    },
    accessHint() {
      const count = this.draft.moduleIds.length;
      if (count < 2)
        return "Con un solo módulo, el cliente lo recibe incluido.";
      if (this.accessMode === "all")
        return `El cliente recibe los ${count} módulos.`;
      return "Así funciona START: el cliente escoge al contratar.";
    },
  },
  watch: {
    value(isOpen) {
      if (isOpen) this.reset();
    },
  },
  methods: {
    ...mapActions("subscriptions", ["openPackageDraft", "savePackageDraft"]),
    setDraft(field, value) {
      this.$store.commit("subscriptions/SET_DRAFT_FIELD", { field, value });
    },
    reset() {
      this.openPackageDraft(this.pkg);
      this.touched = {};
      this.submitted = false;
      this.serverMessage = "";
      this.newFeatureText = "";
      this.newFeatureModuleId = null;
      this.previewExpanded = true;
      this.$nextTick(this.startAtTop);
    },
    startAtTop() {
      const form = this.$refs.form && this.$refs.form.$el;
      if (!form) return;
      form.closest(".v-dialog").scrollTop = 0;
      form.querySelector("#package-name").focus();
    },
    touch(field) {
      this.touched = { ...this.touched, [field]: true };
    },
    isModuleSelected(moduleId) {
      return this.draft.moduleIds.includes(moduleId);
    },
    moduleName(moduleId) {
      const module = this.modules.find((item) => item.id === moduleId);
      return module ? module.name : "Módulo";
    },
    onToggleModule(moduleId) {
      this.$store.commit("subscriptions/TOGGLE_DRAFT_MODULE", moduleId);
      if (!this.isModuleSelected(this.newFeatureModuleId)) {
        this.newFeatureModuleId = null;
      }
      this.touch("moduleIds");
    },
    setAccessMode(mode) {
      this.setDraft("selectionLimit", mode === "all" ? null : 1);
    },
    changeSelection(delta) {
      this.setDraft("selectionLimit", this.draft.selectionLimit + delta);
    },
    changeUsers(delta) {
      this.setDraft(
        "userLimit",
        Math.max(1, (Number(this.draft.userLimit) || 1) + delta)
      );
    },
    updateFeature(feature, changes) {
      this.$store.commit("subscriptions/UPDATE_DRAFT_FEATURE", {
        key: feature.key,
        changes,
      });
    },
    toggleIncluded(feature) {
      this.updateFeature(feature, { isIncluded: !feature.isIncluded });
    },
    addFeature() {
      const description = this.newFeatureText.trim();
      if (!description) return;
      this.$store.commit("subscriptions/ADD_DRAFT_FEATURE", {
        description,
        moduleId: this.newFeatureModuleId,
      });
      this.newFeatureText = "";
    },
    removeFeature(feature) {
      this.$store.commit("subscriptions/REMOVE_DRAFT_FEATURE", feature.key);
    },
    focusFirstError() {
      const firstInvalid = FIELD_ORDER.find(([field]) => this.errors[field]);
      if (!firstInvalid) return;
      const element = this.$refs.form.$el.querySelector(`#${firstInvalid[1]}`);
      if (element) element.focus();
    },
    close() {
      this.$emit("input", false);
    },
    async save() {
      this.submitted = true;
      this.serverMessage = "";
      if (this.hasErrors) {
        this.$nextTick(this.focusFirstError);
        return;
      }
      this.saving = true;
      const response = await this.savePackageDraft();
      this.saving = false;
      if (!response.estadoflag) {
        this.serverMessage = response.mensaje;
        return;
      }
      this.$emit("saved");
      this.close();
    },
  },
};
</script>

<style scoped>
.package-form {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  color-scheme: var(--planes-color-scheme);
  color: var(--planes-text);
}

.package-form__header :where(h2, p),
.package-form__fields :where(h3, p, ul),
.package-form__footer :where(p) {
  margin: 0;
  padding: 0;
}

.package-form__fields :where(ul) {
  list-style: none;
}

.package-form__header,
.package-form__footer {
  position: sticky;
  z-index: 1;
  background: var(--planes-bg);
}

.package-form__header {
  top: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--planes-divider);
}

.package-form__title {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.package-form__subtitle {
  margin-top: 2px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.package-form__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 32px;
  padding: 24px;
}

.package-form__fields {
  display: grid;
  gap: 28px;
  min-width: 0;
}

.form-section {
  display: grid;
  gap: 14px;
}

.form-section + .form-section {
  padding-top: 24px;
  border-top: 1px solid var(--planes-divider);
}

.form-section__title {
  font-size: 16px;
  font-weight: 600;
  color: var(--planes-accent);
}

.form-section__help {
  margin-top: -8px;
  font-size: 13.5px;
  color: var(--planes-text-muted);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;
}

.plans-theme .package-switch.v-input {
  align-items: center;
  width: fit-content;
  min-height: 44px;
  margin: 0;
  padding: 0;
}

.plans-theme .package-switch.v-input >>> .v-label {
  color: var(--planes-text);
}

.savings-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -4px;
  font-size: 13px;
  color: var(--planes-text-muted);
}

.savings-hint--positive {
  color: var(--planes-savings);
}

.stepper {
  display: inline-flex;
  align-items: flex-start;
  gap: 6px;
  width: fit-content;
}

.plans-theme .stepper__button.v-btn {
  width: 40px;
  height: 40px;
  min-width: 0;
  padding: 0;
  border: 1px solid var(--planes-border-strong);
  border-radius: var(--planes-radius-control);
  font-size: 18px;
  text-indent: 0;
  color: var(--planes-text);
}

.plans-theme .stepper__button.v-btn::before {
  display: none;
}

.plans-theme .stepper__button.v-btn:hover:not(.v-btn--disabled) {
  border-color: var(--planes-accent);
}

.plans-theme .stepper__button.v-btn.v-btn--disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: auto;
  color: var(--planes-text) !important;
}

.plans-theme .stepper__button.v-btn:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 2px;
}

.plans-theme .stepper__value.v-text-field {
  width: 190px;
  flex: none;
  margin: 0;
  padding: 0;
}

.stepper__value >>> input {
  text-align: center;
}

.stepper__output {
  align-self: center;
  min-width: 28px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.stepper--compact {
  align-items: center;
}

.plans-theme .stepper--compact .stepper__button.v-btn {
  width: 36px;
  height: 36px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.plans-theme .chip.v-btn {
  height: auto;
  min-width: 0;
  min-height: 40px;
  padding: 0 14px;
  border: 1px solid var(--planes-border-strong);
  border-radius: 999px;
  font-size: 14px;
  font-weight: 500;
  text-indent: 0;
  color: var(--planes-text-muted);
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}

.plans-theme .chip.v-btn >>> .v-btn__content {
  gap: 6px;
}

.plans-theme .chip.v-btn::before {
  display: none;
}

.plans-theme .chip.v-btn:hover {
  color: var(--planes-text);
  border-color: var(--planes-accent-border);
}

.plans-theme .chip.v-btn.chip--selected {
  border-color: var(--planes-accent);
  background: var(--planes-accent-tint);
  color: var(--planes-text);
}

.plans-theme .chip.v-btn.chip--selected .v-icon.v-icon {
  color: var(--planes-accent);
}

.plans-theme .chip.v-btn[aria-invalid="true"] {
  border-color: var(--planes-danger);
}

.plans-theme .chip.v-btn:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 2px;
}

.access {
  display: grid;
  justify-items: start;
  gap: 10px;
  padding: 14px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-divider);
  background: var(--planes-overlay-faint);
}

.access__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--planes-text);
}

.access__choose {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.form-message {
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--planes-text-subtle);
}

.form-message--error {
  color: var(--planes-danger);
}

.feature-add {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 170px auto;
  align-items: center;
  gap: 8px;
}

.feature-add .plans-button {
  min-height: 40px;
}

.feature-rows {
  display: grid;
  gap: 6px;
}

.feature-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 6px;
  padding: 4px;
  border-radius: var(--planes-radius-control);
  background: var(--planes-overlay-faint);
}

.feature-row--excluded .input--inline >>> input {
  color: var(--planes-text-subtle);
}

.plans-theme .input--inline.v-text-field {
  margin: 0;
  padding: 0;
}

.feature-row__module {
  max-width: 120px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--planes-accent-tint);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--planes-accent);
}

.feature-empty {
  padding: 16px;
  border-radius: var(--planes-radius-control);
  border: 1px dashed var(--planes-border-strong);
  font-size: 13.5px;
  text-align: center;
  color: var(--planes-text-muted);
}

.plans-theme .icon-button--small.v-btn {
  width: 36px;
  height: 36px;
  font-size: 19px;
}

.plans-theme .icon-button--included.v-btn {
  color: var(--planes-accent);
}

.plans-theme .icon-button--excluded.v-btn {
  color: var(--planes-excluded);
}

.plans-theme .icon-button--starred.v-btn {
  color: var(--planes-star);
}

.plans-theme .icon-button--included.v-btn.v-btn--disabled {
  color: var(--planes-accent) !important;
}

.plans-theme .icon-button--excluded.v-btn.v-btn--disabled {
  color: var(--planes-excluded) !important;
}

.package-form__preview {
  position: sticky;
  top: 104px;
  align-self: start;
  display: grid;
  gap: 12px;
}

.preview-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.package-form__footer {
  bottom: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: auto;
  padding: 14px 24px;
  border-top: 1px solid var(--planes-divider);
}

.form-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: auto;
  font-size: 14px;
  color: var(--planes-danger);
}

.plans-theme .form-alert .v-icon.v-icon {
  font-size: 18px;
}

.package-form__actions {
  display: flex;
  gap: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .plans-theme .chip.v-btn {
    transition: none;
  }
}

@media (max-width: 960px) {
  .package-form__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .package-form__preview {
    position: static;
  }
}

@media (max-width: 600px) {
  .package-form__header,
  .package-form__body,
  .package-form__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .form-grid,
  .feature-add {
    grid-template-columns: minmax(0, 1fr);
  }

  .package-form__actions {
    width: 100%;
  }

  .package-form__actions .plans-button {
    flex: 1;
  }
}
</style>
