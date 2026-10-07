<template>
  <div class="my-plan plans-theme plans-theme--app">
    <div class="my-plan__container">
      <header class="my-plan__header">
        <h1 class="my-plan__title">Mi plan</h1>
        <p class="my-plan__subtitle">
          El plan es de {{ companyName }}. Cualquier usuario de la empresa puede
          verlo y gestionarlo.
        </p>
      </header>

      <p v-if="loadState === 'loading'" class="my-plan__state" aria-busy="true">
        <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
        Cargando tu plan…
      </p>

      <div
        v-else-if="loadState === 'error'"
        class="my-plan__state"
        role="alert"
      >
        <p class="my-plan__state-title">No pudimos cargar tu plan.</p>
        <p>{{ errorMessage }}</p>
        <button
          type="button"
          class="plans-button plans-button--secondary"
          @click="loadPage"
        >
          Reintentar
        </button>
      </div>

      <section
        v-else-if="confirmState"
        class="my-plan__state"
        role="status"
        aria-live="polite"
      >
        <template v-if="confirmState === 'waiting'">
          <i
            class="mdi mdi-loading mdi-spin my-plan__state-icon"
            aria-hidden="true"
          ></i>
          <p class="my-plan__state-title">Estamos confirmando tu pago…</p>
          <p>Tarda unos segundos. No cierres esta página.</p>
        </template>
        <template v-else>
          <p class="my-plan__state-title">Tu pago se está procesando.</p>
          <p>
            Paddle aún no nos confirma la compra. Revisa de nuevo en unos
            minutos.
          </p>
          <button
            type="button"
            class="plans-button plans-button--secondary"
            @click="confirmPayment(0)"
          >
            Revisar de nuevo
          </button>
        </template>
      </section>

      <section
        v-else-if="hasLivePlan && !isChangingPlan"
        class="plan-summary"
        aria-labelledby="plan-summary-title"
      >
        <div class="plan-summary__head">
          <h2 id="plan-summary-title" class="plan-summary__name">
            ACO
            <span class="plan-summary__accent">{{ plan.package_name }}</span>
          </h2>
          <span
            class="plan-summary__chip"
            :class="`plan-summary__chip--${status.tone}`"
          >
            {{ status.label }}
          </span>
        </div>
        <p class="plan-summary__billing">{{ billingLabel(plan.billing) }}</p>
        <p class="plan-summary__dates">{{ planDateLine(plan) }}</p>
        <div v-if="(plan.modules || []).length" class="plan-summary__modules">
          <p class="plan-summary__label">Módulos de tu plan</p>
          <ul>
            <li v-for="module in plan.modules || []" :key="module.id">
              {{ module.name }}
            </li>
          </ul>
        </div>
        <div class="plan-summary__actions">
          <button
            v-if="canChange"
            type="button"
            class="plans-button plans-button--primary"
            :disabled="busy"
            @click="startChangingPlan"
          >
            <i class="mdi mdi-swap-horizontal" aria-hidden="true"></i>
            Cambiar plan
          </button>
          <button
            v-if="plan.scheduled_change_action === 'cancel'"
            type="button"
            class="plans-button plans-button--secondary"
            :disabled="busy"
            @click="keepPlan"
          >
            Mantener mi plan
          </button>
          <button
            type="button"
            class="plans-button plans-button--secondary"
            :disabled="busy"
            @click="manageBilling"
          >
            <i class="mdi mdi-credit-card-outline" aria-hidden="true"></i>
            Gestionar pago y facturas
          </button>
          <button
            v-if="plan.scheduled_change_action !== 'cancel'"
            type="button"
            class="plans-button plans-button--ghost"
            :disabled="busy"
            @click="cancelPlan"
          >
            Cancelar plan
          </button>
        </div>
      </section>

      <template v-else>
        <p v-if="!hasLivePlan" class="my-plan__notice" role="status">
          <i class="mdi mdi-information-outline" aria-hidden="true"></i>
          <span v-if="plan">
            Tu plan anterior, ACO {{ plan.package_name }}, se canceló el
            {{ formatDate(plan.canceled_at) }}. Elige un plan para volver a
            activarlo.
          </span>
          <span v-else>
            Tu empresa aún no tiene un plan activo. Elige uno para empezar.
          </span>
        </p>
        <div class="my-plan__toolbar">
          <p class="my-plan__lead">
            <template v-if="isChangingPlan">
              Hoy tienes ACO {{ plan.package_name }}. Elige tu nuevo plan; antes
              de cambiar verás cuánto se cobrará.
            </template>
            <template v-else>Elige el plan para tu empresa.</template>
          </p>
          <SegmentedControl
            v-model="isAnnual"
            :options="billingOptions"
            label="Precio mostrado"
          />
        </div>
        <button
          v-if="isChangingPlan"
          type="button"
          class="plans-button plans-button--ghost my-plan__back"
          :disabled="busy"
          @click="isChangingPlan = false"
        >
          <i class="mdi mdi-arrow-left" aria-hidden="true"></i>
          Volver a mi plan
        </button>
        <div v-if="!packages.length" class="my-plan__state">
          <p class="my-plan__state-title">Aún no hay planes disponibles.</p>
          <p>Vuelve en unos días o escríbenos para ayudarte.</p>
        </div>
        <section v-else class="my-plan__grid" aria-label="Planes disponibles">
          <PackageCard
            v-for="(pkg, index) in packages"
            :key="pkg.id"
            :plan="toPlanView(pkg)"
            :annual="isAnnual"
            :expanded="expandedId === pkg.id"
            :index="index"
            :class="{ 'my-plan__card--chosen': chosenPackageId === pkg.id }"
            @toggle-details="toggleDetails(pkg)"
          >
            <button
              type="button"
              class="plans-button plans-button--primary my-plan__buy"
              :disabled="busy || cardActionOf(pkg) === 'current'"
              :aria-label="`${cardLabel(pkg)}: ACO ${pkg.name}`"
              @click="choosePackage(pkg)"
            >
              <i
                v-if="buyingId === pkg.id"
                class="mdi mdi-loading mdi-spin"
                aria-hidden="true"
              ></i>
              {{ cardLabel(pkg) }}
            </button>
          </PackageCard>
        </section>
      </template>
    </div>

    <ModuleSelectDialog
      v-model="isModuleDialogOpen"
      :pkg="modulePackage"
      :confirm-label="isChangingPlan ? 'Ver el cambio' : undefined"
      @confirm="onModulesChosen"
    />
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "@/styles/plans-theme.css";
import PackageCard from "@/components/SubscriptionPackages/PackageCard.vue";
import SegmentedControl from "@/components/SubscriptionPackages/SegmentedControl.vue";
import ModuleSelectDialog from "@/components/SubscriptionPackages/ModuleSelectDialog.vue";
import { toPlanView } from "@/components/SubscriptionPackages/packageView";
import { fetchPublicPackages, isEmptyResult } from "@/api/subscriptionPackages";
import {
  cancelCompanyPlan,
  changeCompanyPlan,
  confirmCompanyPlan,
  fetchCompanyPlan,
  keepCompanyPlan,
  openBillingPortal,
  previewPlanChange,
  startCheckout,
} from "@/api/branchSubscription";
import { openPaddleCheckout, stopCheckoutEvents } from "@/api/paddleCheckout";
import {
  billingLabel,
  canChangePlan,
  cardAction,
  changeSummary,
  clearPendingChoice,
  formatDate,
  isLivePlan,
  planDateLine,
  readPendingChoice,
  statusView,
} from "./myPlanView";

const BILLING_OPTIONS = [
  { value: false, label: "Mensual" },
  { value: true, label: "Anual" },
];
const CONFIRM_ATTEMPTS = 20;
const CONFIRM_INTERVAL_MS = 3000;
const OPEN_FAILED_MESSAGE =
  "No pudimos abrir el pago. Intenta de nuevo en unos minutos.";
const PORTAL_FAILED_MESSAGE =
  "No pudimos abrir la gestión de pagos. Intenta de nuevo en unos minutos.";
const CHANGE_FAILED_MESSAGE =
  "No pudimos cambiar tu plan. Intenta de nuevo en unos minutos.";
const KEEP_FAILED_MESSAGE =
  "No pudimos mantener tu plan. Intenta de nuevo en unos minutos.";
const CARD_LABELS = {
  buy: "Comprar",
  change: "Cambiar a este plan",
  "change-module": "Cambiar módulo",
  current: "Tu plan actual",
};

const notifySuccess = (message) =>
  Swal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    title: message,
    showConfirmButton: false,
    timer: 3000,
  });

const notifyError = (message) => Swal.fire({ icon: "error", text: message });

const readCompanyName = () => {
  try {
    return JSON.parse(sessionStorage.getItem("dataBranch"))[0].trade_name;
  } catch (error) {
    return "tu empresa";
  }
};

export default {
  name: "MyPlan",
  components: { ModuleSelectDialog, PackageCard, SegmentedControl },
  data: () => ({
    plan: null,
    packages: [],
    loadState: "loading",
    errorMessage: "",
    confirmState: null,
    confirmTimer: null,
    pendingTransactionId: null,
    isAnnual: true,
    isChangingPlan: false,
    expandedId: null,
    chosenPackageId: null,
    busy: false,
    buyingId: null,
    isModuleDialogOpen: false,
    modulePackage: null,
    companyName: readCompanyName(),
    billingOptions: BILLING_OPTIONS,
  }),
  computed: {
    hasLivePlan() {
      return isLivePlan(this.plan);
    },
    status() {
      return statusView(this.plan);
    },
    canChange() {
      return canChangePlan(this.plan);
    },
    billing() {
      return this.isAnnual ? "annual" : "monthly";
    },
  },
  async mounted() {
    this.$store.state.mainTitle = "MI PLAN";
    this.applyPendingChoice();
    if (await this.loadPage()) clearPendingChoice();
  },
  beforeDestroy() {
    this.isLeaving = true;
    clearTimeout(this.confirmTimer);
    stopCheckoutEvents();
  },
  methods: {
    toPlanView,
    formatDate,
    billingLabel,
    planDateLine,
    applyPendingChoice() {
      const choice = readPendingChoice(this.$route.query);
      if (!choice) return;
      this.chosenPackageId = choice.packageId;
      this.isAnnual = choice.billing === "annual";
      if (this.$route.query.paquete) this.$router.replace({ name: "miPlan" });
    },
    async loadPage() {
      this.loadState = "loading";
      const [planResponse, packagesResponse] = await Promise.all([
        fetchCompanyPlan(),
        fetchPublicPackages(),
      ]);
      const failed = [planResponse, packagesResponse].find(
        (response) => !response.estadoflag && !isEmptyResult(response)
      );
      if (failed) {
        this.errorMessage = failed.mensaje;
        this.loadState = "error";
        return false;
      }
      this.plan = planResponse.estadoflag ? planResponse.data[0] : null;
      this.packages = packagesResponse.data;
      this.loadState = "ready";
      return true;
    },
    toggleDetails(pkg) {
      this.expandedId = this.expandedId === pkg.id ? null : pkg.id;
    },
    choosePackage(pkg) {
      if (pkg.module_selection_limit) {
        this.modulePackage = pkg;
        this.isModuleDialogOpen = true;
        return;
      }
      this.submitChoice(pkg, []);
    },
    onModulesChosen(moduleIds) {
      this.submitChoice(this.modulePackage, moduleIds);
    },
    submitChoice(pkg, moduleIds) {
      if (this.isChangingPlan) return this.changePlan(pkg, moduleIds);
      return this.buy(pkg, moduleIds);
    },
    cardActionOf(pkg) {
      return this.isChangingPlan
        ? cardAction(pkg, this.plan, this.billing)
        : "buy";
    },
    cardLabel(pkg) {
      if (this.buyingId === pkg.id) {
        return this.isChangingPlan
          ? "Calculando el cambio"
          : "Abriendo el pago";
      }
      return CARD_LABELS[this.cardActionOf(pkg)];
    },
    startChangingPlan() {
      this.isAnnual = this.plan.billing === "annual";
      this.expandedId = null;
      this.isChangingPlan = true;
    },
    async changePlan(pkg, moduleIds) {
      const payload = {
        package_id: pkg.id,
        billing: this.billing,
        module_ids: moduleIds,
      };
      this.busy = true;
      this.buyingId = pkg.id;
      const preview = await previewPlanChange(payload);
      this.resetBuying();
      if (!preview.estadoflag) {
        notifyError(preview.mensaje || CHANGE_FAILED_MESSAGE);
        return;
      }

      const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: `¿Cambiar a ACO ${pkg.name}?`,
        text: changeSummary(preview.data[0]),
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar plan",
        cancelButtonText: "Volver",
        reverseButtons: true,
      });
      if (!isConfirmed) return;

      this.busy = true;
      this.buyingId = pkg.id;
      const response = await changeCompanyPlan(payload);
      this.resetBuying();
      if (!response.estadoflag) {
        notifyError(response.mensaje || CHANGE_FAILED_MESSAGE);
        return;
      }
      this.plan = response.data[0];
      this.isChangingPlan = false;
      notifySuccess(response.mensaje);
    },
    async keepPlan() {
      const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: `¿Mantener ACO ${this.plan.package_name}?`,
        text: `Quitaremos la cancelación y tu plan seguirá renovándose el ${formatDate(
          this.plan.scheduled_change_at
        )}.`,
        showCancelButton: true,
        confirmButtonText: "Sí, mantener plan",
        cancelButtonText: "Volver",
        reverseButtons: true,
      });
      if (!isConfirmed) return;

      this.busy = true;
      const response = await keepCompanyPlan();
      this.busy = false;
      if (!response.estadoflag) {
        notifyError(response.mensaje || KEEP_FAILED_MESSAGE);
        return;
      }
      this.plan = response.data[0];
      notifySuccess(response.mensaje);
    },
    async buy(pkg, moduleIds) {
      this.busy = true;
      this.buyingId = pkg.id;
      const response = await startCheckout({
        package_id: pkg.id,
        billing: this.billing,
        module_ids: moduleIds,
      });
      const transactionId =
        response.estadoflag &&
        response.data &&
        response.data[0] &&
        response.data[0].transaction_id;
      if (!transactionId) {
        this.resetBuying();
        notifyError(response.mensaje || OPEN_FAILED_MESSAGE);
        return;
      }
      const error = await openPaddleCheckout(
        transactionId,
        this.onCheckoutEvent
      );
      if (error) {
        this.resetBuying();
        notifyError(error);
      }
    },
    resetBuying() {
      this.busy = false;
      this.buyingId = null;
    },
    onCheckoutEvent(event) {
      if (event.name === "checkout.completed") {
        this.confirmRightAway(event.data && event.data.transaction_id);
      }
      if (event.name === "checkout.closed" && !this.confirmState) {
        this.resetBuying();
      }
    },
    async confirmRightAway(transactionId) {
      this.resetBuying();
      this.pendingTransactionId = transactionId || null;
      this.confirmState = "waiting";
      const response = await confirmCompanyPlan(transactionId);
      if (this.isLeaving) return;
      if (response.estadoflag && isLivePlan(response.data[0])) {
        this.plan = response.data[0];
        this.confirmState = null;
        notifySuccess(`Tu plan ACO ${this.plan.package_name} ya está activo.`);
        return;
      }
      this.confirmPayment(0);
    },
    confirmPayment(attempt) {
      if (this.isLeaving) return;
      this.confirmState = "waiting";
      clearTimeout(this.confirmTimer);
      this.confirmTimer = setTimeout(async () => {
        const response = this.pendingTransactionId
          ? await confirmCompanyPlan(this.pendingTransactionId)
          : await fetchCompanyPlan();
        if (this.isLeaving) return;
        if (response.estadoflag && isLivePlan(response.data[0])) {
          this.plan = response.data[0];
          this.confirmState = null;
          notifySuccess(
            `Tu plan ACO ${this.plan.package_name} ya está activo.`
          );
          return;
        }
        if (attempt + 1 >= CONFIRM_ATTEMPTS) {
          this.confirmState = "slow";
          return;
        }
        this.confirmPayment(attempt + 1);
      }, CONFIRM_INTERVAL_MS);
    },
    async manageBilling() {
      this.busy = true;
      const response = await openBillingPortal();
      this.busy = false;
      const url =
        response.estadoflag &&
        response.data &&
        response.data[0] &&
        response.data[0].url;
      if (!url) {
        notifyError(response.mensaje || PORTAL_FAILED_MESSAGE);
        return;
      }
      window.location.href = url;
    },
    async cancelPlan() {
      const { isConfirmed } = await Swal.fire({
        icon: "question",
        title: `¿Cancelar ACO ${this.plan.package_name}?`,
        text: "Mantendrás el acceso hasta el final del periodo que ya pagaste. Después no se harán más cobros.",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar plan",
        cancelButtonText: "Mantener plan",
        confirmButtonColor: "#c62828",
        reverseButtons: true,
      });
      if (!isConfirmed) return;

      this.busy = true;
      const response = await cancelCompanyPlan();
      this.busy = false;
      if (!response.estadoflag) {
        notifyError(response.mensaje);
        return;
      }
      notifySuccess(response.mensaje);
      await this.loadPage();
    },
  },
};
</script>

<style scoped>
.my-plan :where(h1, h2, p, ul) {
  margin: 0;
  padding: 0;
}

.my-plan {
  min-height: calc(100vh - 64px);
}

.my-plan__container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.my-plan__header {
  margin-bottom: 24px;
}

.my-plan__title {
  font-size: 40px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.my-plan__subtitle,
.my-plan__lead {
  margin-top: 6px;
  max-width: 70ch;
  font-size: 16px;
  color: var(--planes-text-muted);
}

.my-plan__notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 70ch;
  margin-top: 4px;
  padding: 12px 16px;
  border: 1px solid var(--planes-accent-border);
  border-radius: var(--planes-radius-control);
  background: var(--planes-accent-tint);
  font-size: 15px;
  color: var(--planes-text);
}

.my-plan__notice .mdi {
  font-size: 20px;
  color: var(--planes-accent);
}

.my-plan__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 16px 0 28px;
}

.my-plan__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px 20px;
  align-items: stretch;
  padding-top: 8px;
}

.my-plan__card--chosen {
  box-shadow: var(--planes-featured-shadow);
}

.my-plan__buy {
  width: 100%;
}

.my-plan__back {
  margin-bottom: 16px;
}

.my-plan__state {
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

.my-plan__state-icon {
  font-size: 36px;
  color: var(--planes-accent);
}

.my-plan__state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--planes-text);
}

.plan-summary {
  display: grid;
  gap: 12px;
  max-width: 640px;
  padding: 24px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  box-shadow: var(--planes-card-shadow);
}

.plan-summary__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.plan-summary__name {
  font-size: 28px;
  font-weight: 700;
}

.plan-summary__accent {
  color: var(--planes-accent);
}

.plan-summary__chip {
  padding: 2px 12px;
  border: 1px solid currentColor;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.plan-summary__chip--ok {
  color: var(--planes-savings);
}

.plan-summary__chip--warning {
  color: var(--planes-text);
  border-color: var(--planes-star);
}

.plan-summary__chip--muted {
  color: var(--planes-text-muted);
}

.plan-summary__billing,
.plan-summary__label {
  font-weight: 600;
}

.plan-summary__dates {
  color: var(--planes-text-muted);
}

.plan-summary__modules ul {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  list-style: none;
}

.plan-summary__modules li {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--planes-accent-tint);
  color: var(--planes-accent);
  font-size: 13px;
  font-weight: 600;
}

.plan-summary__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 8px;
}

@media (max-width: 600px) {
  .my-plan__container {
    padding: 20px 16px 32px;
  }

  .my-plan__title {
    font-size: 30px;
  }

  .plan-summary__actions .plans-button {
    width: 100%;
  }
}
</style>
