<template>
  <v-dialog
    :value="value"
    max-width="520"
    persistent
    :fullscreen="$vuetify.breakpoint.xsOnly"
    content-class="plans-theme plans-theme--app package-dialog"
  >
    <form
      v-if="pkg"
      class="module-select"
      novalidate
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
        <button
          type="button"
          class="icon-button"
          aria-label="Cerrar"
          @click="close"
        >
          <i class="mdi mdi-close" aria-hidden="true"></i>
        </button>
      </header>

      <fieldset class="module-select__options">
        <legend class="module-select__legend">Módulos</legend>
        <label
          v-for="module in pkg.modules"
          :key="module.id"
          class="module-select__option"
        >
          <input
            v-model="selectedIds"
            type="checkbox"
            :value="module.id"
            :disabled="isLocked(module.id)"
          />
          {{ module.name }}
        </label>
      </fieldset>
      <p class="module-select__count" aria-live="polite">{{ countLabel }}</p>

      <footer class="module-select__footer">
        <button
          type="button"
          class="plans-button plans-button--ghost"
          @click="close"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="plans-button plans-button--primary"
          :disabled="!isComplete"
        >
          {{ confirmLabel }}
        </button>
      </footer>
    </form>
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

.module-select__option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--planes-border);
  border-radius: var(--planes-radius-control);
  cursor: pointer;
}

.module-select__option input {
  width: 18px;
  height: 18px;
  accent-color: var(--planes-accent);
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
