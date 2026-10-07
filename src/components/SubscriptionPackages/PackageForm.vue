<template>
  <v-dialog
    :value="value"
    max-width="1180"
    persistent
    :fullscreen="$vuetify.breakpoint.smAndDown"
    content-class="plans-theme plans-theme--app package-dialog"
  >
    <form
      ref="form"
      class="package-form"
      novalidate
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
        <button
          type="button"
          class="icon-button"
          aria-label="Cerrar sin guardar"
          @click="close"
        >
          <i class="mdi mdi-close" aria-hidden="true"></i>
        </button>
      </header>

      <div class="package-form__body">
        <div class="package-form__fields">
          <section class="form-section" aria-labelledby="section-identity">
            <h3 id="section-identity" class="form-section__title">Identidad</h3>
            <FormField
              label="Nombre"
              input-id="package-name"
              :error="visibleErrors.name"
              :hint="`Se muestra como ACO ${previewName}.`"
            >
              <template #default="field">
                <input
                  id="package-name"
                  v-model="draft.name"
                  class="input"
                  type="text"
                  autocomplete="off"
                  placeholder="Ej. START"
                  :maxlength="limits.name"
                  :aria-describedby="field.describedby"
                  :aria-invalid="String(field.invalid)"
                  @blur="touch('name')"
                />
              </template>
            </FormField>
            <FormField
              label="Descripción corta (opcional)"
              input-id="package-tagline"
              :error="visibleErrors.tagline"
              hint="Una línea bajo el nombre, por ejemplo: Para empezar."
            >
              <template #default="field">
                <input
                  id="package-tagline"
                  v-model="draft.tagline"
                  class="input"
                  type="text"
                  autocomplete="off"
                  :maxlength="limits.tagline"
                  :aria-describedby="field.describedby"
                  :aria-invalid="String(field.invalid)"
                  @blur="touch('tagline')"
                />
              </template>
            </FormField>
            <label class="switch">
              <input
                v-model="draft.isFeatured"
                class="switch__input"
                type="checkbox"
                role="switch"
              />
              <span class="switch__track" aria-hidden="true"></span>
              Marcar como "Más elegido"
            </label>
          </section>

          <section class="form-section" aria-labelledby="section-pricing">
            <h3 id="section-pricing" class="form-section__title">
              Precio y usuarios
            </h3>
            <div class="form-grid">
              <FormField
                label="Precio mensual"
                input-id="package-monthly-price"
                :error="visibleErrors.monthlyPrice"
              >
                <template #default="field">
                  <div class="input-prefix">
                    <span aria-hidden="true">US$</span>
                    <input
                      id="package-monthly-price"
                      v-model="draft.monthlyPrice"
                      class="input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputmode="decimal"
                      :aria-describedby="field.describedby"
                      :aria-invalid="String(field.invalid)"
                      @blur="touch('monthlyPrice')"
                    />
                  </div>
                </template>
              </FormField>
              <FormField
                label="Precio anual"
                input-id="package-annual-price"
                :error="visibleErrors.annualPrice"
              >
                <template #default="field">
                  <div class="input-prefix">
                    <span aria-hidden="true">US$</span>
                    <input
                      id="package-annual-price"
                      v-model="draft.annualPrice"
                      class="input"
                      type="number"
                      min="0"
                      step="0.01"
                      inputmode="decimal"
                      :aria-describedby="field.describedby"
                      :aria-invalid="String(field.invalid)"
                      @blur="touch('annualPrice')"
                    />
                  </div>
                </template>
              </FormField>
            </div>
            <p
              v-if="savingsHint"
              class="savings-hint"
              :class="{ 'savings-hint--positive': savingsHint.positive }"
              aria-live="polite"
            >
              <i
                class="mdi"
                :class="savingsHint.positive ? 'mdi-tag-outline' : 'mdi-information-outline'"
                aria-hidden="true"
              ></i>
              {{ savingsHint.text }}
            </p>

            <FormField
              label="Usuarios incluidos"
              input-id="package-users"
              :error="visibleErrors.userLimit"
            >
              <template #default="field">
                <div class="stepper">
                  <button
                    type="button"
                    class="stepper__button"
                    aria-label="Quitar un usuario"
                    :disabled="draft.userLimit <= 1"
                    @click="changeUsers(-1)"
                  >
                    <i class="mdi mdi-minus" aria-hidden="true"></i>
                  </button>
                  <input
                    id="package-users"
                    v-model.number="draft.userLimit"
                    class="input stepper__value"
                    type="number"
                    min="1"
                    step="1"
                    inputmode="numeric"
                    :aria-describedby="field.describedby"
                    :aria-invalid="String(field.invalid)"
                    @blur="touch('userLimit')"
                  />
                  <button
                    type="button"
                    class="stepper__button"
                    aria-label="Agregar un usuario"
                    @click="changeUsers(1)"
                  >
                    <i class="mdi mdi-plus" aria-hidden="true"></i>
                  </button>
                </div>
              </template>
            </FormField>
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
              <button
                v-for="(module, position) in modules"
                :id="position === 0 ? 'package-modules' : null"
                :key="module.id"
                type="button"
                class="chip"
                :class="{ 'chip--selected': isModuleSelected(module.id) }"
                :aria-pressed="String(isModuleSelected(module.id))"
                :aria-invalid="String(position === 0 && Boolean(visibleErrors.moduleIds))"
                @click="onToggleModule(module.id)"
              >
                <i
                  class="mdi"
                  :class="isModuleSelected(module.id) ? 'mdi-check' : 'mdi-plus'"
                  aria-hidden="true"
                ></i>
                {{ module.name }}
              </button>
            </div>
            <p v-else class="form-message form-message--error">
              No pudimos cargar los módulos. Cierra el formulario, actualiza la
              página e intenta de nuevo.
            </p>
            <p v-if="visibleErrors.moduleIds" class="form-message form-message--error">
              {{ visibleErrors.moduleIds }}
            </p>

            <div class="access">
              <span class="access__label">Acceso del cliente</span>
              <SegmentedControl
                :value="accessMode"
                :options="accessOptions"
                label="Acceso del cliente a los módulos"
                :disabled="draft.moduleIds.length < 2"
                @input="setAccessMode"
              />
              <div v-if="accessMode === 'choose'" class="access__choose">
                <span id="selection-label">El cliente elige</span>
                <div class="stepper stepper--compact" role="group" aria-labelledby="selection-label">
                  <button
                    type="button"
                    class="stepper__button"
                    aria-label="Elegir un módulo menos"
                    :disabled="draft.selectionLimit <= 1"
                    @click="changeSelection(-1)"
                  >
                    <i class="mdi mdi-minus" aria-hidden="true"></i>
                  </button>
                  <output
                    id="package-selection"
                    class="stepper__output"
                    tabindex="-1"
                    :aria-invalid="String(Boolean(visibleErrors.selectionLimit))"
                  >
                    {{ draft.selectionLimit }}
                  </output>
                  <button
                    type="button"
                    class="stepper__button"
                    aria-label="Elegir un módulo más"
                    :disabled="draft.selectionLimit >= draft.moduleIds.length - 1"
                    @click="changeSelection(1)"
                  >
                    <i class="mdi mdi-plus" aria-hidden="true"></i>
                  </button>
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

            <label for="new-feature" class="access__label">Nueva característica</label>
            <div class="feature-add">
              <input
                id="new-feature"
                v-model="newFeatureText"
                class="input"
                type="text"
                autocomplete="off"
                placeholder="Ej. Soporte prioritario"
                :maxlength="limits.feature"
                :aria-invalid="String(Boolean(visibleErrors.features))"
                @keydown.enter.prevent="addFeature"
              />
              <select
                v-model="newFeatureModuleId"
                class="input feature-add__select"
                aria-label="Dónde se muestra la característica"
              >
                <option :value="null">General</option>
                <option
                  v-for="module in selectedModules"
                  :key="module.id"
                  :value="module.id"
                >
                  En {{ module.name }}
                </option>
              </select>
              <button
                type="button"
                class="plans-button plans-button--secondary"
                :disabled="!newFeatureText.trim()"
                @click="addFeature"
              >
                <i class="mdi mdi-plus" aria-hidden="true"></i> Agregar
              </button>
            </div>
            <p v-if="visibleErrors.features" class="form-message form-message--error">
              {{ visibleErrors.features }}
            </p>

            <ul v-if="draft.features.length" class="feature-rows">
              <li
                v-for="feature in draft.features"
                :key="feature.key"
                class="feature-row"
                :class="{ 'feature-row--excluded': !feature.isIncluded }"
              >
                <button
                  type="button"
                  class="icon-button icon-button--small"
                  :class="feature.isIncluded ? 'icon-button--included' : 'icon-button--excluded'"
                  :disabled="Boolean(feature.moduleId)"
                  :aria-pressed="String(feature.isIncluded)"
                  :aria-label="feature.isIncluded ? 'Incluida. Cambiar a no incluida' : 'No incluida. Cambiar a incluida'"
                  @click="toggleIncluded(feature)"
                >
                  <i
                    class="mdi"
                    :class="feature.isIncluded ? 'mdi-check-circle' : 'mdi-close-circle'"
                    aria-hidden="true"
                  ></i>
                </button>
                <input
                  v-model="feature.description"
                  class="input input--inline"
                  type="text"
                  :maxlength="limits.feature"
                  aria-label="Texto de la característica"
                />
                <span v-if="feature.moduleId" class="feature-row__module">
                  {{ moduleName(feature.moduleId) }}
                </span>
                <button
                  v-else
                  type="button"
                  class="icon-button icon-button--small"
                  :class="{ 'icon-button--starred': feature.isHighlighted && feature.isIncluded }"
                  :disabled="!canHighlight(feature)"
                  :aria-pressed="String(feature.isHighlighted && feature.isIncluded)"
                  aria-label="Destacar en el resumen"
                  @click="feature.isHighlighted = !feature.isHighlighted"
                >
                  <i
                    class="mdi"
                    :class="feature.isHighlighted && feature.isIncluded ? 'mdi-star' : 'mdi-star-outline'"
                    aria-hidden="true"
                  ></i>
                </button>
                <button
                  type="button"
                  class="icon-button icon-button--small"
                  aria-label="Quitar característica"
                  @click="removeFeature(feature)"
                >
                  <i class="mdi mdi-trash-can-outline" aria-hidden="true"></i>
                </button>
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

        <aside class="package-form__preview" aria-label="Vista previa de la tarjeta">
          <div class="preview-bar">
            <span class="access__label">Vista previa</span>
            <SegmentedControl
              v-model="previewAnnual"
              :options="billingOptions"
              label="Precio en la vista previa"
            />
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
          <i class="mdi mdi-alert-circle-outline" aria-hidden="true"></i>
          {{ serverMessage }}
        </p>
        <p v-else-if="submitted && hasErrors" class="form-alert" role="alert">
          <i class="mdi mdi-alert-circle-outline" aria-hidden="true"></i>
          Revisa los campos marcados para poder guardar.
        </p>
        <div class="package-form__actions">
          <button type="button" class="plans-button plans-button--ghost" @click="close">
            Cancelar
          </button>
          <button
            type="submit"
            class="plans-button plans-button--primary"
            :disabled="saving"
          >
            <i
              v-if="saving"
              class="mdi mdi-loading mdi-spin"
              aria-hidden="true"
            ></i>
            {{ submitLabel }}
          </button>
        </div>
      </footer>
    </form>
  </v-dialog>
</template>

<script>
import FormField from "./FormField.vue";
import PackageCard from "./PackageCard.vue";
import SegmentedControl from "./SegmentedControl.vue";
import {
  FEATURE_MAX_LENGTH,
  MAX_HIGHLIGHTS,
  NAME_MAX_LENGTH,
  TAGLINE_MAX_LENGTH,
  canBeHighlighted,
  draftFromPackage,
  draftToPackage,
  emptyDraft,
  highlightedCount,
  newFeature,
  toPayload,
  toggleModule,
  validateDraft,
} from "./packageForm";
import { formatPrice, toPlanView } from "./packageView";
import { createPackage, updatePackage } from "@/api/subscriptionPackages";

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
  ["moduleIds", "package-modules"],
  ["selectionLimit", "package-selection"],
  ["features", "new-feature"],
];

export default {
  name: "PackageForm",
  components: { FormField, PackageCard, SegmentedControl },
  props: {
    value: { type: Boolean, default: false },
    pkg: { type: Object, default: null },
    modules: { type: Array, default: () => [] },
  },
  data: () => ({
    draft: emptyDraft(),
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
    limits: {
      name: NAME_MAX_LENGTH,
      tagline: TAGLINE_MAX_LENGTH,
      feature: FEATURE_MAX_LENGTH,
      highlights: MAX_HIGHLIGHTS,
    },
  }),
  computed: {
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
    errors() {
      return validateDraft(this.draft);
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
    previewName() {
      return this.draft.name.trim() || "NUEVO";
    },
    previewPlan() {
      return toPlanView({
        ...draftToPackage(this.draft, this.modules),
        name: this.previewName,
      });
    },
    selectedModules() {
      return this.modules.filter((module) => this.isModuleSelected(module.id));
    },
    accessMode() {
      return this.draft.selectionLimit === null ? "all" : "choose";
    },
    accessHint() {
      const count = this.draft.moduleIds.length;
      if (count < 2) return "Con un solo módulo, el cliente lo recibe incluido.";
      if (this.accessMode === "all") return `El cliente recibe los ${count} módulos.`;
      return "Así funciona START: el cliente escoge al contratar.";
    },
    savingsHint() {
      const monthly = Number(this.draft.monthlyPrice);
      const annual = Number(this.draft.annualPrice);
      if (!this.draft.monthlyPrice || !this.draft.annualPrice || monthly <= 0) {
        return null;
      }
      const savings = Math.round((monthly * 12 - annual) * 100) / 100;
      if (savings > 0) {
        const months = Math.round(savings / monthly);
        return {
          positive: true,
          text: `El cliente ahorra ${formatPrice(savings)} al año (${months} ${months === 1 ? "mes" : "meses"}).`,
        };
      }
      return {
        positive: false,
        text: "Sin ahorro anual: el precio anual es igual o mayor a 12 mensualidades.",
      };
    },
  },
  watch: {
    value(isOpen) {
      if (isOpen) this.reset();
    },
  },
  methods: {
    reset() {
      this.draft = this.pkg ? draftFromPackage(this.pkg) : emptyDraft();
      this.touched = {};
      this.submitted = false;
      this.serverMessage = "";
      this.newFeatureText = "";
      this.newFeatureModuleId = null;
      this.previewExpanded = true;
      this.$nextTick(this.startAtTop);
    },
    startAtTop() {
      const form = this.$refs.form;
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
      this.draft = toggleModule(this.draft, moduleId);
      if (!this.isModuleSelected(this.newFeatureModuleId)) {
        this.newFeatureModuleId = null;
      }
      this.touch("moduleIds");
    },
    setAccessMode(mode) {
      this.draft.selectionLimit = mode === "all" ? null : 1;
    },
    changeSelection(delta) {
      this.draft.selectionLimit += delta;
    },
    changeUsers(delta) {
      this.draft.userLimit = Math.max(1, (Number(this.draft.userLimit) || 1) + delta);
    },
    canHighlight(feature) {
      if (!canBeHighlighted(feature)) return false;
      return feature.isHighlighted || highlightedCount(this.draft.features) < MAX_HIGHLIGHTS;
    },
    toggleIncluded(feature) {
      feature.isIncluded = !feature.isIncluded;
    },
    addFeature() {
      const description = this.newFeatureText.trim();
      if (!description) return;
      this.draft.features.push(newFeature(description, this.newFeatureModuleId));
      this.newFeatureText = "";
    },
    removeFeature(feature) {
      this.draft.features = this.draft.features.filter(
        (item) => item.key !== feature.key
      );
    },
    focusFirstError() {
      const firstInvalid = FIELD_ORDER.find(([field]) => this.errors[field]);
      if (!firstInvalid) return;
      const element = this.$refs.form.querySelector(`#${firstInvalid[1]}`);
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
      const payload = toPayload(this.draft);
      const response = this.isEditing
        ? await updatePackage(this.pkg.id, payload)
        : await createPackage(payload);
      this.saving = false;

      if (!response.estadoflag) {
        this.serverMessage = response.mensaje;
        return;
      }
      this.$emit("saved", response.mensaje);
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
  gap: 16px;
}

.input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-border-strong);
  background: var(--planes-field);
  font-size: 15px;
  color: var(--planes-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input::placeholder {
  color: var(--planes-text-subtle);
}

.input:focus {
  outline: none;
  border-color: var(--planes-accent);
  box-shadow: 0 0 0 3px var(--planes-accent-ring);
}

.input[aria-invalid="true"] {
  border-color: var(--planes-danger);
}

.input-prefix {
  position: relative;
}

.input-prefix span {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--planes-text-subtle);
  pointer-events: none;
}

.input-prefix .input {
  padding-left: 46px;
}

.feature-add__select option {
  background: var(--planes-surface-solid);
  color: var(--planes-text);
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  min-height: 44px;
  font-size: 14px;
  cursor: pointer;
}

.switch__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.switch__track {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid var(--planes-border-strong);
  background: var(--planes-field);
  transition: background-color 0.2s, border-color 0.2s;
}

.switch__track::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--planes-text-muted);
  transition: transform 0.2s var(--planes-ease), background-color 0.2s;
}

.switch__input:checked + .switch__track {
  border-color: var(--planes-accent);
  background: var(--planes-accent-tint);
}

.switch__input:checked + .switch__track::after {
  transform: translateX(18px);
  background: var(--planes-accent);
}

.switch__input:focus-visible + .switch__track {
  outline: 2px solid var(--planes-accent);
  outline-offset: 3px;
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
  align-items: center;
  gap: 6px;
  width: fit-content;
}

.stepper__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-border-strong);
  font-size: 18px;
  color: var(--planes-text);
  cursor: pointer;
}

.stepper__button:hover:not(:disabled) {
  border-color: var(--planes-accent);
}

.stepper__button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.stepper__value {
  width: 76px;
  text-align: center;
}

.stepper__output {
  min-width: 28px;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.stepper--compact .stepper__button {
  width: 36px;
  height: 36px;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--planes-border-strong);
  font-size: 14px;
  font-weight: 500;
  color: var(--planes-text-muted);
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}

.chip:hover {
  color: var(--planes-text);
  border-color: var(--planes-accent-border);
}

.chip--selected {
  border-color: var(--planes-accent);
  background: var(--planes-accent-tint);
  color: var(--planes-text);
}

.chip--selected .mdi {
  color: var(--planes-accent);
}

.chip[aria-invalid="true"] {
  border-color: var(--planes-danger);
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
  gap: 8px;
  margin-top: -6px;
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

.feature-row--excluded .input--inline {
  color: var(--planes-text-subtle);
}

.input--inline {
  min-height: 36px;
  border-color: transparent;
  background: transparent;
  font-size: 14px;
}

.input--inline:hover {
  border-color: var(--planes-border-strong);
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

.icon-button--small {
  width: 36px;
  height: 36px;
  font-size: 19px;
}

.icon-button--included {
  color: var(--planes-accent);
}

.icon-button--excluded {
  color: var(--planes-excluded);
}

.icon-button--starred {
  color: var(--planes-star);
}

.chip:focus-visible,
.stepper__button:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 2px;
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

.form-alert .mdi {
  font-size: 18px;
}

.package-form__actions {
  display: flex;
  gap: 10px;
}

@media (prefers-reduced-motion: reduce) {
  .input,
  .chip,
  .switch__track,
  .switch__track::after {
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
