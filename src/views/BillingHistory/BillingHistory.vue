<template>
  <div class="billing-history plans-theme plans-theme--app">
    <div class="billing-history__container">
      <header class="billing-history__header">
        <h1 class="billing-history__title">Historial de facturación</h1>
        <p class="billing-history__subtitle">
          Tus pagos de ACO, procesados por Paddle.
        </p>
      </header>

      <p
        v-if="loadState === 'loading'"
        class="billing-history__state"
        aria-busy="true"
      >
        <v-icon class="mdi-spin">mdi-loading</v-icon>
        Cargando tus pagos…
      </p>

      <div
        v-else-if="loadState === 'error'"
        class="billing-history__state"
        role="alert"
      >
        <p class="billing-history__state-title">
          No pudimos cargar tu historial de facturación.
        </p>
        <p>{{ errorMessage }}</p>
        <v-btn
          text
          class="plans-button plans-button--secondary"
          @click="loadHistory"
        >
          Reintentar
        </v-btn>
      </div>

      <template v-else>
        <section
          v-if="paymentCard || canUpdatePaymentMethod"
          class="payment-method"
          aria-labelledby="payment-method-title"
        >
          <div>
            <h2 id="payment-method-title" class="billing-history__section">
              Método de pago
            </h2>
            <p v-if="paymentCard" class="payment-method__card">
              <v-icon>mdi-credit-card-outline</v-icon>
              {{ paymentCard }}
            </p>
          </div>
          <v-btn
            v-if="canUpdatePaymentMethod"
            text
            class="plans-button plans-button--secondary"
            :disabled="isUpdatingPaymentMethod"
            @click="updatePaymentMethod"
          >
            <v-icon :class="{ 'mdi-spin': isUpdatingPaymentMethod }">
              {{
                isUpdatingPaymentMethod
                  ? "mdi-loading"
                  : "mdi-credit-card-refresh-outline"
              }}
            </v-icon>
            Cambiar método de pago
          </v-btn>
        </section>

        <div v-if="!rows.length" class="billing-history__state">
          <v-icon class="billing-history__state-icon">mdi-receipt</v-icon>
          <p class="billing-history__state-title">{{ emptyMessage }}</p>
        </div>

        <section v-else aria-labelledby="payments-title">
          <h2 id="payments-title" class="billing-history__section">Pagos</h2>
          <v-data-table
            :headers="headers"
            :items="rows"
            item-key="id"
            hide-default-footer
            disable-pagination
            class="payments"
          >
            <template #[`item.amount`]="{ item }">
              <span class="payments__amount">{{ item.amount }}</span>
            </template>
            <template #[`item.status`]="{ item }">
              <span
                class="status-badge"
                :class="`status-badge--${item.statusTone}`"
              >
                {{ item.statusLabel }}
              </span>
            </template>
            <template #[`item.invoice`]="{ item }">
              <v-btn
                v-if="item.hasInvoice"
                text
                class="plans-button plans-button--ghost"
                :disabled="downloadingId === item.id"
                :aria-label="`Descargar la factura del ${item.date}`"
                @click="downloadInvoice(item)"
              >
                <v-icon :class="{ 'mdi-spin': downloadingId === item.id }">
                  {{
                    downloadingId === item.id ? "mdi-loading" : "mdi-download"
                  }}
                </v-icon>
                Descargar
              </v-btn>
              <span v-else class="payments__muted">Sin factura</span>
            </template>
          </v-data-table>
        </section>
      </template>
    </div>
  </div>
</template>

<script>
import "@/styles/plans-theme.css";
import { mapActions, mapGetters, mapState } from "vuex";
import { notifySuccess } from "@/store/request";
import { stopCheckoutEvents } from "@/plugins/paddle";

const EMPTY_MESSAGE =
  "Todavía no tienes pagos. Cuando compres un plan, aquí verás tus facturas.";
const HEADERS = [
  { text: "Fecha", value: "date", sortable: false },
  { text: "Concepto", value: "concept", sortable: false },
  { text: "Monto", value: "amount", sortable: false },
  { text: "Estado", value: "status", sortable: false },
  { text: "Factura", value: "invoice", sortable: false },
];

export default {
  name: "BillingHistory",
  data: () => ({
    loadState: "loading",
    errorMessage: "",
    downloadingId: null,
    isUpdatingPaymentMethod: false,
    emptyMessage: EMPTY_MESSAGE,
    headers: HEADERS,
  }),
  computed: {
    ...mapState("subscriptions", {
      canUpdatePaymentMethod: (state) =>
        state.billingHistory.can_update_payment_method,
    }),
    ...mapGetters("subscriptions", {
      rows: "billingRows",
      paymentCard: "paymentCard",
    }),
  },
  mounted() {
    this.$store.state.mainTitle = "HISTORIAL DE FACTURACIÓN";
    this.loadHistory();
  },
  beforeDestroy() {
    stopCheckoutEvents();
  },
  methods: {
    ...mapActions("subscriptions", [
      "loadBillingHistory",
      "fetchInvoiceUrl",
      "startPaymentMethodUpdate",
    ]),
    async loadHistory() {
      this.loadState = "loading";
      const error = await this.loadBillingHistory();
      this.errorMessage = error || "";
      this.loadState = error ? "error" : "ready";
    },
    async downloadInvoice(row) {
      this.downloadingId = row.id;
      const url = await this.fetchInvoiceUrl(row.id);
      this.downloadingId = null;
      if (url) window.location.assign(url);
    },
    async updatePaymentMethod() {
      this.isUpdatingPaymentMethod = true;
      const opened = await this.startPaymentMethodUpdate(this.onCheckoutEvent);
      if (!opened) this.isUpdatingPaymentMethod = false;
    },
    onCheckoutEvent(event) {
      if (event.name === "checkout.completed") {
        notifySuccess("Actualizamos tu método de pago.");
        this.loadHistory();
      }
      if (event.name === "checkout.closed") {
        this.isUpdatingPaymentMethod = false;
      }
    },
  },
};
</script>

<style scoped>
.billing-history :where(h1, h2, p) {
  margin: 0;
  padding: 0;
}

.billing-history {
  min-height: calc(100vh - 64px);
}

.billing-history__container {
  max-width: 1040px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.billing-history__header {
  margin-bottom: 24px;
}

.billing-history__title {
  font-size: 40px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.billing-history__subtitle {
  margin-top: 6px;
  max-width: 70ch;
  font-size: 16px;
  color: var(--planes-text-muted);
}

.billing-history__section {
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
}

.billing-history__state {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 520px;
  margin: 40px auto 0;
  padding: 32px 24px;
  border-radius: var(--planes-radius-card);
  border: 1px dashed var(--planes-border-strong);
  text-align: center;
  color: var(--planes-text-muted);
}

.plans-theme .billing-history__state-icon.v-icon {
  font-size: 36px;
  color: var(--planes-accent);
}

.billing-history__state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--planes-text);
}

.payment-method {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  margin-bottom: 32px;
  padding: 20px 24px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  box-shadow: var(--planes-card-shadow);
}

.payment-method__card {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--planes-text-muted);
}

.plans-theme .payment-method__card .v-icon.v-icon {
  font-size: 20px;
  color: var(--planes-accent);
}

.plans-theme .payments.v-data-table {
  background: transparent;
  color: inherit;
  font-size: 15px;
}

.plans-theme
  .payments.v-data-table
  ::v-deep
  .v-data-table__wrapper
  > table
  > thead
  > tr
  > th {
  height: auto;
  padding: 10px 12px;
  border-bottom: 1px solid var(--planes-border-strong);
  font-size: 13px;
  font-weight: 600;
  color: var(--planes-text-muted);
}

.plans-theme
  .payments.v-data-table
  ::v-deep
  .v-data-table__wrapper
  > table
  > tbody
  > tr
  > td:not(.v-data-table__mobile-row) {
  height: auto;
  padding: 10px 12px;
  border-bottom: 1px solid var(--planes-divider);
  font-size: 15px;
  vertical-align: middle;
}

.plans-theme
  .payments.v-data-table
  ::v-deep
  .v-data-table__wrapper
  > table
  > tbody
  > tr:hover:not(.v-data-table__expanded__content):not(
    .v-data-table__empty-wrapper
  ) {
  background: transparent;
}

.payments__amount {
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.payments__muted {
  font-size: 14px;
  color: var(--planes-text-muted);
}

.status-badge {
  display: inline-block;
  padding: 2px 12px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge--ok {
  color: var(--planes-savings);
}

.status-badge--info {
  color: var(--planes-accent);
}

.status-badge--warning {
  color: var(--planes-text);
  border-color: var(--planes-star);
}

.status-badge--muted {
  color: var(--planes-text-muted);
}

@media (max-width: 600px) {
  .billing-history__container {
    padding: 20px 16px 32px;
  }

  .billing-history__title {
    font-size: 30px;
  }

  .payment-method {
    padding: 16px;
  }

  .plans-theme .payment-method .plans-button.v-btn {
    width: 100%;
  }

  .plans-theme .payments.v-data-table ::v-deep .v-data-table__wrapper {
    overflow: visible;
  }

  .plans-theme .payments.v-data-table ::v-deep .v-data-table-header-mobile {
    display: none;
  }

  .plans-theme
    .payments.v-data-table
    ::v-deep
    .v-data-table__wrapper
    > table
    > tbody
    > tr.v-data-table__mobile-table-row {
    margin-bottom: 12px;
    padding: 8px 16px;
    border-radius: var(--planes-radius-card);
    border: 1px solid var(--planes-border);
    box-shadow: var(--planes-card-shadow);
  }

  .plans-theme
    .payments.v-data-table
    ::v-deep
    .v-data-table__wrapper
    > table
    > tbody
    > tr
    > td.v-data-table__mobile-row {
    min-height: 0;
    height: auto;
    gap: 12px;
    padding: 8px 0;
    border-bottom: 1px solid var(--planes-divider);
    text-align: right;
  }

  .plans-theme
    .payments.v-data-table
    ::v-deep
    .v-data-table__wrapper
    > table
    > tbody
    > tr
    > td.v-data-table__mobile-row:last-child {
    border-bottom: 0;
  }

  .plans-theme
    .payments.v-data-table
    ::v-deep
    .v-data-table__mobile-row__header {
    font-size: 13px;
    font-weight: 600;
    text-align: left;
    color: var(--planes-text-muted);
  }
}
</style>
