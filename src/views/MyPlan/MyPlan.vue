<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import "@/styles/plans-theme.css";
import PackageCard from "@/components/SubscriptionPackages/PackageCard.vue";
import ModuleSelectDialog from "@/components/SubscriptionPackages/ModuleSelectDialog.vue";
import { stopCheckoutEvents } from "@/plugins/paddle";
import type { PaddleCheckoutEvent } from "@/plugins/paddle";
import { useSubscriptionsStore } from "@/stores/subscriptions";
import type {
  Billing,
  CardAction,
  PlanCheckoutPayload,
  PlanChoice,
  SubscriptionPackage,
} from "@/types/suscripciones";

const BILLING_OPTIONS = [
  { value: false, label: "Mensual" },
  { value: true, label: "Anual" },
];
const CONFIRM_ATTEMPTS = 20;
const CONFIRM_INTERVAL_MS = 3000;
const CARD_LABELS: Partial<Record<CardAction, string>> = {
  buy: "Comprar",
  change: "Cambiar a este plan",
  "change-module": "Cambiar módulo",
  current: "Tu plan actual",
  lower: "Plan inferior",
  "annual-only": "Ya tienes el plan anual",
};

const readCompanyName = (): string => {
  try {
    return JSON.parse(sessionStorage.getItem("dataBranch") as string)[0].trade_name;
  } catch {
    return "tu empresa";
  }
};

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const subscriptionsStore = useSubscriptionsStore();
const {
  plan,
  publicPackages: packages,
  hasLivePlan,
  planStatus: status,
  planDateLine,
  canChangePlan: canChange,
  hasUpgrade: canUpgrade,
  planDetails: details,
  paymentUpdateNeeded,
} = storeToRefs(subscriptionsStore);
const { cardAction: cardActionFor, purchaseAction, isUnavailableAction, toPlanView, formatDate } =
  subscriptionsStore;

let isLeaving = false;

const loadState = ref("loading");
const errorMessage = ref("");
const confirmState = ref<"waiting" | "slow" | null>(null);
const confirmTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const pendingTransactionId = ref<string | null>(null);
const pendingStart = ref<{ transactionId: string | undefined; choice: PlanChoice | null } | null>(null);
const isAnnual = ref(false);
const isChangingPlan = ref(false);
const expandedId = ref<number | null>(null);
const chosenPackageId = ref<number | null>(null);
const busy = ref(false);
const buyingId = ref<number | null>(null);
const isModuleDialogOpen = ref(false);
const modulePackage = ref<SubscriptionPackage | null>(null);
const companyName = readCompanyName();
const billingOptions = BILLING_OPTIONS;

const billing = computed<Billing>(() => (isAnnual.value ? "annual" : "monthly"));

watch(plan, () => {
  subscriptionsStore.reloadPlanAccess();
});

onMounted(async () => {
  rootStore.state.mainTitle = "MI PLAN";
  const { query } = route;
  const transactionId = query.transaccion as string | undefined;
  if (transactionId || query.paquete) router.replace({ name: "miPlan" });
  const choice = await subscriptionsStore.readPlanChoice(query);
  if (choice) isAnnual.value = choice.billing === "annual";
  pendingStart.value = { transactionId, choice };
  await loadAndStart();
});

onBeforeUnmount(() => {
  isLeaving = true;
  clearTimeout(confirmTimer.value as ReturnType<typeof setTimeout>);
  stopCheckoutEvents();
});

function billingLabel(value: Billing) {
  return value === "annual" ? "Pago anual" : "Pago mensual";
}
async function loadAndStart() {
  if (!(await loadPage()) || !pendingStart.value) return;
  const { transactionId, choice } = pendingStart.value;
  pendingStart.value = null;
  subscriptionsStore.clearPlanChoice();
  if (transactionId) {
    confirmRightAway(transactionId);
    return;
  }
  if (choice) startPendingChoice(choice);
}
function startPendingChoice(choice: PlanChoice) {
  const pkg = packages.value.find((item) => item.id === choice.packageId);
  if (!pkg) return;
  chosenPackageId.value = pkg.id;
  const action = purchaseAction(pkg, billing.value);
  if (action === "buy") {
    choosePackage(pkg);
    return;
  }
  if (action === "change" || action === "change-module") {
    isChangingPlan.value = true;
    choosePackage(pkg);
  }
}
async function loadPage() {
  loadState.value = "loading";
  const errors = await Promise.all([
    subscriptionsStore.loadCompanyPlan(),
    subscriptionsStore.loadPublicPackages(),
  ]);
  const error = errors.find(Boolean);
  if (error) {
    errorMessage.value = error;
    loadState.value = "error";
    return false;
  }
  loadState.value = "ready";
  return true;
}
function toggleDetails(pkg: SubscriptionPackage) {
  expandedId.value = expandedId.value === pkg.id ? null : pkg.id;
}
function choosePackage(pkg: SubscriptionPackage) {
  if (pkg.module_selection_limit) {
    modulePackage.value = pkg;
    isModuleDialogOpen.value = true;
    return;
  }
  submitChoice(pkg, []);
}
function onModulesChosen(moduleIds: number[]) {
  submitChoice(modulePackage.value!, moduleIds);
}
function submitChoice(pkg: SubscriptionPackage, moduleIds: number[]) {
  const payload: PlanCheckoutPayload = {
    package_id: pkg.id,
    billing: billing.value,
    module_ids: moduleIds,
  };
  return isChangingPlan.value ? changePlan(pkg, payload) : buy(pkg, payload);
}
function cardActionOf(pkg: SubscriptionPackage): CardAction {
  return isChangingPlan.value ? cardActionFor(pkg, billing.value) : "buy";
}
function cardLabel(pkg: SubscriptionPackage) {
  if (buyingId.value === pkg.id) {
    return isChangingPlan.value ? "Calculando el cambio" : "Abriendo el pago";
  }
  return CARD_LABELS[cardActionOf(pkg)];
}
function startChangingPlan() {
  isAnnual.value = plan.value!.billing === "annual";
  expandedId.value = null;
  isChangingPlan.value = true;
}
async function changePlan(pkg: SubscriptionPackage, payload: PlanCheckoutPayload) {
  busy.value = true;
  buyingId.value = pkg.id;
  const changed = await subscriptionsStore.confirmPlanChange({
    packageName: pkg.name,
    payload,
  });
  resetBuying();
  if (changed) isChangingPlan.value = false;
}
async function keepPlan() {
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: `¿Mantener ACO ${plan.value!.package_name}?`,
    text: `Quitaremos la cancelación y tu plan seguirá renovándose el ${formatDate(
      plan.value!.scheduled_change_at,
    )}.`,
    showCancelButton: true,
    confirmButtonText: "Sí, mantener plan",
    cancelButtonText: "Volver",
    reverseButtons: true,
  });
  if (!isConfirmed) return;
  busy.value = true;
  await subscriptionsStore.keepCompanyPlan();
  busy.value = false;
}
async function buy(pkg: SubscriptionPackage, payload: PlanCheckoutPayload) {
  busy.value = true;
  buyingId.value = pkg.id;
  const opened = await subscriptionsStore.openPlanCheckout({
    payload,
    onEvent: onCheckoutEvent,
  });
  if (!opened) resetBuying();
}
function resetBuying() {
  busy.value = false;
  buyingId.value = null;
}
function onCheckoutEvent(event: PaddleCheckoutEvent) {
  if (event.name === "checkout.completed") {
    confirmRightAway(event.data && event.data.transaction_id);
  }
  if (event.name === "checkout.closed" && !confirmState.value) {
    resetBuying();
  }
}
async function confirmRightAway(transactionId: string | null | undefined) {
  resetBuying();
  pendingTransactionId.value = transactionId || null;
  confirmState.value = "waiting";
  const isActive = await subscriptionsStore.confirmCompanyPlan(pendingTransactionId.value);
  if (isLeaving) return;
  if (isActive) {
    confirmState.value = null;
    return;
  }
  confirmPayment(0);
}
function confirmPayment(attempt: number) {
  if (isLeaving) return;
  confirmState.value = "waiting";
  clearTimeout(confirmTimer.value as ReturnType<typeof setTimeout>);
  confirmTimer.value = setTimeout(async () => {
    const isActive = await subscriptionsStore.confirmCompanyPlan(pendingTransactionId.value);
    if (isLeaving) return;
    if (isActive) {
      confirmState.value = null;
      return;
    }
    if (attempt + 1 >= CONFIRM_ATTEMPTS) {
      confirmState.value = "slow";
      return;
    }
    confirmPayment(attempt + 1);
  }, CONFIRM_INTERVAL_MS);
}
async function cancelPlan() {
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: `¿Cancelar ACO ${plan.value!.package_name}?`,
    text: "Mantendrás el acceso hasta el final del periodo que ya pagaste. Después no se harán más cobros.",
    showCancelButton: true,
    confirmButtonText: "Sí, cancelar plan",
    cancelButtonText: "Mantener plan",
    confirmButtonColor: "#c62828",
    reverseButtons: true,
  });
  if (!isConfirmed) return;
  busy.value = true;
  const canceled = await subscriptionsStore.cancelCompanyPlan();
  busy.value = false;
  if (canceled) await loadPage();
}
</script>

<template>
  <div class="my-plan plans-theme plans-theme--app">
    <div class="my-plan__container">
      <header class="my-plan__header">
        <h1 class="my-plan__title">
          Mi plan
        </h1>
        <p class="my-plan__subtitle">
          El plan es de {{ companyName }}. Cualquier usuario de la empresa puede
          verlo y gestionarlo.
        </p>
      </header>

      <p
        v-if="loadState === 'loading'"
        class="my-plan__state"
        aria-busy="true"
      >
        <v-icon class="mdi-spin">
          mdi-loading
        </v-icon>
        Cargando tu plan…
      </p>

      <div
        v-else-if="loadState === 'error'"
        class="my-plan__state"
        role="alert"
      >
        <p class="my-plan__state-title">
          No pudimos cargar tu plan.
        </p>
        <p>{{ errorMessage }}</p>
        <v-btn
          variant="text"
          class="plans-button plans-button--secondary"
          @click="loadAndStart"
        >
          Reintentar
        </v-btn>
      </div>

      <section
        v-else-if="confirmState"
        class="my-plan__state"
        role="status"
        aria-live="polite"
      >
        <template v-if="confirmState === 'waiting'">
          <v-icon class="mdi-spin my-plan__state-icon">
            mdi-loading
          </v-icon>
          <p class="my-plan__state-title">
            Estamos confirmando tu pago…
          </p>
          <p>Tarda unos segundos. No cierres esta página.</p>
        </template>
        <template v-else>
          <p class="my-plan__state-title">
            Tu pago se está procesando.
          </p>
          <p>
            Paddle aún no nos confirma la compra. Revisa de nuevo en unos
            minutos.
          </p>
          <v-btn
            variant="text"
            class="plans-button plans-button--secondary"
            @click="confirmPayment(0)"
          >
            Revisar de nuevo
          </v-btn>
        </template>
      </section>

      <section
        v-else-if="hasLivePlan && !isChangingPlan"
        class="plan-summary"
        aria-labelledby="plan-summary-title"
      >
        <div class="plan-summary__head">
          <h2
            id="plan-summary-title"
            class="plan-summary__name"
          >
            ACO
            <span class="plan-summary__accent">{{ plan!.package_name }}</span>
          </h2>
          <span
            class="plan-summary__chip"
            :class="`plan-summary__chip--${status.tone}`"
          >
            {{ status.label }}
          </span>
        </div>
        <p class="plan-summary__billing">
          {{ billingLabel(plan!.billing) }}
        </p>
        <p class="plan-summary__dates">
          {{ planDateLine }}
          <template v-if="paymentUpdateNeeded">
            Actualiza tu método de pago en
            <!-- eslint-disable vue/multiline-html-element-content-newline -- a line break would add a space before the period -->
            <router-link
              :to="{ name: 'billingHistory' }"
              class="plan-summary__link"
            >Historial de facturación</router-link>.
            <!-- eslint-enable vue/multiline-html-element-content-newline -->
          </template>
        </p>
        <p
          v-if="details.users"
          class="plan-summary__users"
        >
          <v-icon>mdi-account-multiple-outline</v-icon>
          Usuarios: {{ details.users }}
        </p>
        <div
          v-if="details.modules.length"
          class="plan-summary__modules"
        >
          <p class="plan-summary__label">
            Módulos de tu plan
          </p>
          <ul class="plan-summary__module-list">
            <li
              v-for="module in details.modules"
              :key="module.id"
            >
              <span class="plan-summary__module-name">{{ module.name }}</span>
              <ul
                v-if="module.details.length"
                class="plan-summary__details"
              >
                <li
                  v-for="detail in module.details"
                  :key="detail"
                >
                  {{ detail }}
                </li>
              </ul>
            </li>
          </ul>
        </div>
        <div
          v-if="details.extras.length"
          class="plan-summary__extras"
        >
          <p class="plan-summary__label">
            También incluye
          </p>
          <ul class="plan-summary__details">
            <li
              v-for="extra in details.extras"
              :key="extra"
            >
              {{ extra }}
            </li>
          </ul>
        </div>
        <div class="plan-summary__actions">
          <v-btn
            v-if="canChange && canUpgrade"
            variant="text"
            class="plans-button plans-button--primary"
            :disabled="busy"
            @click="startChangingPlan"
          >
            <v-icon>mdi-arrow-up-circle-outline</v-icon>
            Mejorar plan
          </v-btn>
          <v-btn
            v-if="plan!.scheduled_change_action === 'cancel'"
            variant="text"
            class="plans-button plans-button--secondary"
            :disabled="busy"
            @click="keepPlan"
          >
            Mantener mi plan
          </v-btn>
          <v-btn
            v-if="plan!.scheduled_change_action !== 'cancel'"
            variant="text"
            class="plans-button plans-button--ghost"
            :disabled="busy"
            @click="cancelPlan"
          >
            Cancelar plan
          </v-btn>
        </div>
      </section>

      <template v-else>
        <p
          v-if="!hasLivePlan"
          class="my-plan__notice"
          role="status"
        >
          <v-icon>mdi-information-outline</v-icon>
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
              Hoy tienes ACO {{ plan!.package_name }}. Elige tu nuevo plan; antes
              de cambiar verás cuánto se cobrará.
            </template>
            <template v-else>
              Elige el plan para tu empresa.
            </template>
          </p>
          <v-btn-toggle
            v-model="isAnnual"
            mandatory
            rounded
            density="compact"
            class="segmented"
            role="group"
            aria-label="Precio mostrado"
          >
            <v-btn
              v-for="option in billingOptions"
              :key="String(option.value)"
              :value="option.value"
              variant="text"
            >
              {{ option.label }}
            </v-btn>
          </v-btn-toggle>
        </div>
        <v-btn
          v-if="isChangingPlan"
          variant="text"
          class="plans-button plans-button--ghost my-plan__back"
          :disabled="busy"
          @click="isChangingPlan = false"
        >
          <v-icon>mdi-arrow-left</v-icon>
          Volver a mi plan
        </v-btn>
        <div
          v-if="!packages.length"
          class="my-plan__state"
        >
          <p class="my-plan__state-title">
            Aún no hay planes disponibles.
          </p>
          <p>Vuelve en unos días o escríbenos para ayudarte.</p>
        </div>
        <section
          v-else
          class="my-plan__grid"
          aria-label="Planes disponibles"
        >
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
            <v-btn
              variant="text"
              class="plans-button plans-button--primary my-plan__buy"
              :disabled="busy || isUnavailableAction(cardActionOf(pkg))"
              :aria-label="`${cardLabel(pkg)}: ACO ${pkg.name}`"
              @click="choosePackage(pkg)"
            >
              <v-icon
                v-if="buyingId === pkg.id"
                class="mdi-spin"
              >
                mdi-loading
              </v-icon>
              {{ cardLabel(pkg) }}
            </v-btn>
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

.plans-theme .my-plan__notice .v-icon.v-icon {
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

.plans-theme .my-plan__buy.v-btn {
  width: 100%;
}

.plans-theme .my-plan__back.v-btn {
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

.plans-theme .my-plan__state-icon.v-icon {
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

.plan-summary__link {
  font-weight: 600;
  color: var(--planes-accent);
}

.plan-summary__link:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 2px;
}

.plan-summary__users {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.plan-summary__module-list {
  display: grid;
  gap: 12px;
  margin-top: 6px;
  list-style: none;
}

.plan-summary__module-name {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--planes-accent-tint);
  color: var(--planes-accent);
  font-size: 13px;
  font-weight: 600;
}

.plan-summary__details {
  display: grid;
  gap: 2px;
  margin: 6px 0 0 20px;
  list-style: disc;
  font-size: 14px;
  color: var(--planes-text-muted);
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
