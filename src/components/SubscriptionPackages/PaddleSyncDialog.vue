<template>
  <v-dialog
    :value="value"
    max-width="640"
    persistent
    :fullscreen="$vuetify.breakpoint.xsOnly"
    content-class="plans-theme plans-theme--app package-dialog"
  >
    <section class="paddle-sync" aria-labelledby="paddle-sync-title">
      <header class="paddle-sync__header">
        <div>
          <h2 id="paddle-sync-title" class="paddle-sync__title">
            Sincronización con Paddle
          </h2>
          <p class="paddle-sync__subtitle">
            Compara tus paquetes con el catálogo de Paddle antes de cambiar
            algo.
          </p>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Cerrar"
          :disabled="applying"
          @click="close"
        >
          <i class="mdi mdi-close" aria-hidden="true"></i>
        </button>
      </header>

      <div
        class="paddle-sync__body"
        :aria-busy="String(loadState === 'loading' || applying)"
      >
        <p v-if="loadState === 'loading'" class="paddle-sync__state">
          <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
          Revisando tus paquetes en Paddle…
        </p>

        <div
          v-else-if="loadState === 'error'"
          class="paddle-sync__state"
          role="alert"
        >
          <p>{{ message }}</p>
          <button
            type="button"
            class="plans-button plans-button--secondary"
            @click="load"
          >
            Reintentar
          </button>
        </div>

        <template v-else>
          <p class="paddle-sync__summary" role="status">{{ message }}</p>
          <ul v-if="report.length" class="paddle-sync__list">
            <li
              v-for="item in report"
              :key="item.package_id"
              class="paddle-sync__item"
            >
              <div class="paddle-sync__item-head">
                <span class="paddle-sync__name">
                  ACO {{ item.name }}
                  <span v-if="!item.is_active" class="paddle-sync__muted"
                    >· inactivo</span
                  >
                </span>
                <span
                  class="paddle-sync__chip"
                  :class="`paddle-sync__chip--${statusOf(item).tone}`"
                >
                  {{ statusOf(item).label }}
                </span>
              </div>
              <p v-if="item.error" class="paddle-sync__error">
                {{ item.error }}
              </p>
              <ul v-if="item.actions.length" class="paddle-sync__actions">
                <li v-for="(action, index) in item.actions" :key="index">
                  {{ action.label }}
                </li>
              </ul>
            </li>
          </ul>
        </template>
      </div>

      <footer class="paddle-sync__footer">
        <button
          type="button"
          class="plans-button plans-button--ghost"
          :disabled="applying"
          @click="close"
        >
          Cerrar
        </button>
        <button
          v-if="loadState === 'ready' && pendingCount"
          type="button"
          class="plans-button plans-button--primary"
          :disabled="applying"
          @click="apply"
        >
          <i
            v-if="applying"
            class="mdi mdi-loading mdi-spin"
            aria-hidden="true"
          ></i>
          {{
            applying ? "Aplicando cambios" : `Aplicar cambios (${pendingCount})`
          }}
        </button>
      </footer>
    </section>
  </v-dialog>
</template>

<script>
import {
  applyPaddleSync,
  fetchPaddleSync,
  isEmptyResult,
} from "@/api/subscriptionPackages";

const EMPTY_MESSAGE =
  "Aún no hay paquetes para sincronizar. Crea el primero y vuelve a verificar.";

const STATUSES = {
  error: { label: "Error", tone: "error" },
  pending: { label: "Requiere cambios", tone: "pending" },
  synced: { label: "Sincronizado", tone: "ok" },
};

export default {
  name: "PaddleSyncDialog",
  props: {
    value: { type: Boolean, default: false },
  },
  data: () => ({
    loadState: "loading",
    report: [],
    message: "",
    applying: false,
  }),
  computed: {
    pendingCount() {
      return this.report.reduce(
        (total, item) => total + item.actions.length,
        0
      );
    },
  },
  watch: {
    value(isOpen) {
      if (isOpen) this.load();
    },
  },
  methods: {
    statusOf(item) {
      if (item.error) return STATUSES.error;
      return item.actions.length ? STATUSES.pending : STATUSES.synced;
    },
    async load() {
      this.loadState = "loading";
      const response = await fetchPaddleSync();

      if (response.estadoflag || isEmptyResult(response)) {
        this.report = response.data;
        this.message = response.estadoflag ? response.mensaje : EMPTY_MESSAGE;
        this.loadState = "ready";
        return;
      }

      this.message = response.mensaje;
      this.loadState = "error";
    },
    async apply() {
      this.applying = true;
      const response = await applyPaddleSync();
      this.applying = false;

      if (!response.data.length) {
        this.message = response.mensaje;
        this.loadState = "error";
        return;
      }

      this.report = response.data;
      this.message = response.mensaje;
      if (response.estadoflag) this.$emit("synced", response.mensaje);
    },
    close() {
      this.$emit("input", false);
    },
  },
};
</script>

<style scoped>
.paddle-sync {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  color: var(--planes-text);
  background: var(--planes-bg);
}

.paddle-sync :where(h2, p, ul) {
  margin: 0;
  padding: 0;
}

.paddle-sync :where(ul) {
  list-style: none;
}

.paddle-sync__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--planes-divider);
}

.paddle-sync__title {
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
}

.paddle-sync__subtitle {
  margin-top: 2px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.paddle-sync__body {
  display: grid;
  gap: 16px;
  padding: 20px 24px;
}

.paddle-sync__state {
  display: grid;
  justify-items: center;
  gap: 12px;
  padding: 24px 0;
  text-align: center;
  color: var(--planes-text-muted);
}

.paddle-sync__summary {
  font-weight: 600;
}

.paddle-sync__list {
  display: grid;
  gap: 12px;
}

.paddle-sync__item {
  display: grid;
  gap: 8px;
  padding: 14px 16px;
  border: 1px solid var(--planes-border);
  border-radius: var(--planes-radius-control);
}

.paddle-sync__item-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.paddle-sync__name {
  font-weight: 600;
}

.paddle-sync__muted {
  font-weight: 400;
  color: var(--planes-text-muted);
}

.paddle-sync__chip {
  padding: 2px 10px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.paddle-sync__chip--ok {
  color: var(--planes-savings);
}

.paddle-sync__chip--pending {
  color: var(--planes-text);
  border-color: var(--planes-star);
}

.paddle-sync__chip--error {
  color: var(--planes-danger);
}

.paddle-sync__actions {
  display: grid;
  gap: 4px;
  padding-left: 18px;
  list-style: disc;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.paddle-sync__error {
  font-size: 14px;
  color: var(--planes-danger);
}

.paddle-sync__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--planes-divider);
}

@media (max-width: 600px) {
  .paddle-sync__header,
  .paddle-sync__body,
  .paddle-sync__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .paddle-sync__footer .plans-button {
    flex: 1;
  }
}
</style>
