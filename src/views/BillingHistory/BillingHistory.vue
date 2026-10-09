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
        <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
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
        <button
          type="button"
          class="plans-button plans-button--secondary"
          @click="loadHistory"
        >
          Reintentar
        </button>
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
              <i class="mdi mdi-credit-card-outline" aria-hidden="true"></i>
              {{ paymentCard }}
            </p>
          </div>
          <button
            v-if="canUpdatePaymentMethod"
            type="button"
            class="plans-button plans-button--secondary"
            :disabled="isUpdatingPaymentMethod"
            @click="updatePaymentMethod"
          >
            <i
              class="mdi"
              :class="
                isUpdatingPaymentMethod
                  ? 'mdi-loading mdi-spin'
                  : 'mdi-credit-card-refresh-outline'
              "
              aria-hidden="true"
            ></i>
            Cambiar método de pago
          </button>
        </section>

        <div v-if="!rows.length" class="billing-history__state">
          <i
            class="mdi mdi-receipt billing-history__state-icon"
            aria-hidden="true"
          ></i>
          <p class="billing-history__state-title">{{ emptyMessage }}</p>
        </div>

        <section v-else aria-labelledby="payments-title">
          <h2 id="payments-title" class="billing-history__section">Pagos</h2>
          <table class="payments">
            <thead>
              <tr>
                <th scope="col">Fecha</th>
                <th scope="col">Concepto</th>
                <th scope="col">Monto</th>
                <th scope="col">Estado</th>
                <th scope="col">Factura</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row.id">
                <td data-label="Fecha">{{ row.date }}</td>
                <td data-label="Concepto">{{ row.concept }}</td>
                <td data-label="Monto" class="payments__amount">
                  {{ row.amount }}
                </td>
                <td data-label="Estado">
                  <span
                    class="status-badge"
                    :class="`status-badge--${row.statusTone}`"
                  >
                    {{ row.statusLabel }}
                  </span>
                </td>
                <td data-label="Factura">
                  <button
                    v-if="row.hasInvoice"
                    type="button"
                    class="plans-button plans-button--ghost"
                    :disabled="downloadingId === row.id"
                    :aria-label="`Descargar la factura del ${row.date}`"
                    @click="downloadInvoice(row)"
                  >
                    <i
                      class="mdi"
                      :class="
                        downloadingId === row.id
                          ? 'mdi-loading mdi-spin'
                          : 'mdi-download'
                      "
                      aria-hidden="true"
                    ></i>
                    Descargar
                  </button>
                  <span v-else class="payments__muted">Sin factura</span>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>
    </div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "@/styles/plans-theme.css";
import {
  fetchBillingHistory,
  fetchInvoiceUrl,
  startPaymentMethodUpdate,
} from "@/api/branchSubscription";
import { openPaddleCheckout, stopCheckoutEvents } from "@/api/paddleCheckout";
import { isEmptyResult } from "@/api/subscriptionPackages";
import { notifySuccess } from "@/views/MyPlan/planPurchase";
import { billingRows, cardLabel } from "./billingHistoryView";

const EMPTY_MESSAGE =
  "Todavía no tienes pagos. Cuando compres un plan, aquí verás tus facturas.";
const INVOICE_FAILED_MESSAGE =
  "No pudimos descargar la factura. Intenta de nuevo en unos minutos.";
const PAYMENT_METHOD_FAILED_MESSAGE =
  "No pudimos abrir el cambio de método de pago. Intenta de nuevo en unos minutos.";
const NO_HISTORY = {
  transactions: [],
  payment_method: null,
  can_update_payment_method: false,
};
const ICON_BY_MESSAGE_TYPE = { TMSGINF: "info", TMSGADV: "warning" };

const notifyProblem = (response, fallback) =>
  Swal.fire({
    icon: ICON_BY_MESSAGE_TYPE[response.tipomensaje] || "error",
    text: response.mensaje || fallback,
  });

const firstValue = (response, key) =>
  response.estadoflag && response.data[0] && response.data[0][key];

export default {
  name: "BillingHistory",
  data: () => ({
    history: NO_HISTORY,
    loadState: "loading",
    errorMessage: "",
    downloadingId: null,
    isUpdatingPaymentMethod: false,
    emptyMessage: EMPTY_MESSAGE,
  }),
  computed: {
    rows() {
      return billingRows(this.history.transactions);
    },
    paymentCard() {
      return cardLabel(this.history.payment_method);
    },
    canUpdatePaymentMethod() {
      return this.history.can_update_payment_method;
    },
  },
  mounted() {
    this.$store.state.mainTitle = "HISTORIAL DE FACTURACIÓN";
    this.loadHistory();
  },
  beforeDestroy() {
    stopCheckoutEvents();
  },
  methods: {
    async loadHistory() {
      this.loadState = "loading";
      const response = await fetchBillingHistory();
      if (!response.estadoflag && !isEmptyResult(response)) {
        this.errorMessage = response.mensaje;
        this.loadState = "error";
        return;
      }
      this.history = response.estadoflag ? response.data[0] : NO_HISTORY;
      this.loadState = "ready";
    },
    async downloadInvoice(row) {
      this.downloadingId = row.id;
      const response = await fetchInvoiceUrl(row.id);
      this.downloadingId = null;
      const url = firstValue(response, "url");
      if (!url) {
        notifyProblem(response, INVOICE_FAILED_MESSAGE);
        return;
      }
      window.location.assign(url);
    },
    async updatePaymentMethod() {
      this.isUpdatingPaymentMethod = true;
      const response = await startPaymentMethodUpdate();
      const transactionId = firstValue(response, "transaction_id");
      if (!transactionId) {
        this.isUpdatingPaymentMethod = false;
        notifyProblem(response, PAYMENT_METHOD_FAILED_MESSAGE);
        return;
      }
      const error = await openPaddleCheckout(
        transactionId,
        this.onCheckoutEvent
      );
      if (error) {
        this.isUpdatingPaymentMethod = false;
        Swal.fire({ icon: "error", text: error });
      }
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

.billing-history__state-icon {
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

.payment-method__card .mdi {
  font-size: 20px;
  color: var(--planes-accent);
}

.payments {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
}

.payments th {
  padding: 10px 12px;
  border-bottom: 1px solid var(--planes-border-strong);
  text-align: left;
  font-size: 13px;
  font-weight: 600;
  color: var(--planes-text-muted);
}

.payments td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--planes-divider);
  vertical-align: middle;
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

  .payment-method .plans-button {
    width: 100%;
  }

  .payments thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }

  .payments,
  .payments tbody,
  .payments tr,
  .payments td {
    display: block;
  }

  .payments tr {
    margin-bottom: 12px;
    padding: 8px 16px;
    border-radius: var(--planes-radius-card);
    border: 1px solid var(--planes-border);
    box-shadow: var(--planes-card-shadow);
  }

  .payments td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 0;
    text-align: right;
  }

  .payments td:last-child {
    border-bottom: 0;
  }

  .payments td::before {
    content: attr(data-label);
    font-size: 13px;
    font-weight: 600;
    text-align: left;
    color: var(--planes-text-muted);
  }
}
</style>
