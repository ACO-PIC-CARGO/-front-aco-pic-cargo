<template>
  <v-dialog
    :value="value"
    max-width="520"
    persistent
    :fullscreen="$vuetify.breakpoint.xsOnly"
    content-class="plans-theme plans-theme--app package-dialog"
  >
    <v-form
      v-if="pkg"
      class="module-select"
      aria-labelledby="module-select-title"
      @submit.prevent="confirm"
    >
      <header class="module-select__header">
        <div>
          <h2 id="module-select-title" class="module-select__title">
            Elige tus módulos
          </h2>
          <p class="module-select__subtitle">
            ACO {{ pkg.name }} incluye {{ limitLabel }} a elegir. Los usarás
            desde que se active tu plan.
          </p>
        </div>
        <v-btn icon class="icon-button" aria-label="Cerrar" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </header>

      <fieldset class="module-select__options">
        <legend class="module-select__legend">Módulos</legend>
        <v-checkbox
          v-for="module in pkg.modules"
          :key="module.id"
          v-model="selectedIds"
          class="module-select__option"
          :value="module.id"
          :label="module.name"
          :disabled="isLocked(module.id)"
          hide-details
          dense
        />
      </fieldset>
      <p class="module-select__count" aria-live="polite">{{ countLabel }}</p>

      <footer class="module-select__footer">
        <v-btn text class="plans-button plans-button--ghost" @click="close">
          Cancelar
        </v-btn>
        <v-btn
          text
          type="submit"
          class="plans-button plans-button--primary"
          :disabled="!isComplete"
        >
          {{ confirmLabel }}
        </v-btn>
      </footer>
    </v-form>
  </v-dialog>
</template>

<script>
export default {
  name: "ModuleSelectDialog",
  props: {
    value: { type: Boolean, default: false },
    pkg: { type: Object, default: null },
    confirmLabel: { type: String, default: "Continuar al pago" },
  },
  data: () => ({
    selectedIds: [],
  }),
  computed: {
    limit() {
      return this.pkg ? this.pkg.module_selection_limit : 0;
    },
    limitLabel() {
      return this.limit === 1 ? "1 módulo" : `${this.limit} módulos`;
    },
    isComplete() {
      return this.selectedIds.length === this.limit;
    },
    countLabel() {
      return `Elegiste ${this.selectedIds.length} de ${this.limit}.`;
    },
  },
  watch: {
    value(isOpen) {
      if (isOpen) this.selectedIds = [];
    },
  },
  methods: {
    isLocked(moduleId) {
      return this.isComplete && !this.selectedIds.includes(moduleId);
    },
    close() {
      this.$emit("input", false);
    },
    confirm() {
      if (!this.isComplete) return;
      this.$emit("confirm", [...this.selectedIds]);
      this.close();
    },
  },
};
</script>

<style scoped>
.module-select {
  display: flex;
  flex-direction: column;
  color: var(--planes-text);
  background: var(--planes-bg);
}

.module-select :where(h2, p, fieldset, legend) {
  margin: 0;
  padding: 0;
  border: 0;
}

.module-select__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--planes-divider);
}

.module-select__title {
  font-size: 22px;
  font-weight: 700;
}

.module-select__subtitle {
  margin-top: 4px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.module-select__options {
  display: grid;
  gap: 10px;
  padding: 20px 24px 8px;
}

.module-select__legend {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--planes-accent);
}

.plans-theme .module-select__option.v-input {
  align-items: center;
  min-height: 44px;
  margin: 0;
  padding: 0 14px;
  border: 1px solid var(--planes-border);
  border-radius: var(--planes-radius-control);
}

.plans-theme .module-select__option.v-input >>> .v-input__slot {
  margin: 0;
}

.plans-theme
  .module-select__option.v-input:not(.v-input--is-disabled)
  >>> .v-label {
  color: var(--planes-text);
}

.plans-theme .module-select__option.v-input--is-label-active >>> .v-icon {
  color: var(--planes-accent) !important;
}

.plans-theme .module-select__header .icon-button.v-btn {
  width: 44px;
  height: 44px;
  min-width: 0;
  border-radius: var(--planes-radius-control);
  font-size: 22px;
  color: var(--planes-text-muted);
}

.plans-theme .module-select__header .icon-button.v-btn >>> .v-icon {
  width: auto;
  height: auto;
  font-size: inherit;
}

.plans-theme .module-select__header .icon-button.v-btn::before,
.plans-theme .module-select__footer .v-btn.plans-button::before {
  display: none;
}

.plans-theme .module-select__header .icon-button.v-btn:hover {
  color: var(--planes-text);
  background: var(--planes-overlay-hover);
}

.plans-theme .module-select__footer .v-btn.plans-button {
  height: auto;
  min-width: 0;
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid transparent;
  border-radius: var(--planes-radius-control);
  font-size: 14px;
  font-weight: 600;
  text-indent: 0;
  transition: filter 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
}

.plans-theme .module-select__footer .v-btn.plans-button--primary {
  background: var(--planes-action);
  color: var(--planes-action-ink);
}

.plans-theme
  .module-select__footer
  .v-btn.plans-button--primary.v-btn--disabled {
  color: var(--planes-action-ink) !important;
}

.plans-theme .module-select__footer .v-btn.plans-button--ghost {
  border-color: var(--planes-border-strong);
  color: var(--planes-text-muted);
}

.plans-theme .module-select__footer .v-btn.plans-button--ghost:hover {
  border-color: var(--planes-accent);
  color: var(--planes-text);
}

.module-select__count {
  padding: 0 24px 16px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.module-select__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--planes-divider);
}

@media (max-width: 600px) {
  .module-select__header,
  .module-select__options,
  .module-select__count,
  .module-select__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .module-select__footer .plans-button {
    flex: 1;
  }
}
</style>
