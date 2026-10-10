<template>
  <div class="planes plans-theme">
    <div class="planes__container">
      <header class="planes__header">
        <img
          class="planes__logo"
          src="/img/login/logo-aco.png"
          alt="ACO, Agencia de Carga Online"
        />
        <h1 class="planes__title">
          Precios <span class="planes__accent">ACO</span>
        </h1>
        <p class="planes__subtitle">Elige el plan ideal para tu agencia</p>
        <p v-if="moduleLine" class="planes__modules">{{ moduleLine }}</p>

        <div v-if="plans.length" class="planes__billing">
          <v-btn-toggle
            v-model="isAnnual"
            mandatory
            rounded
            dense
            class="segmented"
            aria-label="Periodo de facturación"
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
          <span v-if="monthsSaved" class="billing-badge">
            <v-icon>mdi-tag-outline</v-icon>
            Ahorra hasta {{ monthsSaved }}
            {{ monthsSaved === 1 ? "mes" : "meses" }}
          </span>
        </div>
      </header>

      <section
        v-if="loadState === 'loading'"
        class="planes__grid"
        aria-busy="true"
        aria-label="Cargando planes"
      >
        <div v-for="n in 3" :key="n" class="plan-skeleton"></div>
      </section>

      <div v-else-if="loadState === 'error'" class="planes__state" role="alert">
        <p class="planes__state-title">No pudimos cargar los planes.</p>
        <p>{{ errorMessage }}</p>
        <v-btn text class="planes__retry" @click="loadPlans">
          Reintentar
        </v-btn>
      </div>

      <div v-else-if="!plans.length" class="planes__state">
        <p class="planes__state-title">Pronto publicaremos nuestros planes.</p>
        <p>Vuelve en unos días para conocerlos.</p>
      </div>

      <section
        v-else
        class="planes__grid"
        :style="{ '--plan-count': plans.length }"
        aria-label="Planes disponibles"
      >
        <PackageCard
          v-for="(plan, index) in plans"
          :key="plan.id"
          :plan="plan"
          :annual="isAnnual"
          :expanded="expandedPlanId === plan.id"
          :index="index"
          @toggle-details="toggleDetails(plan)"
        >
          <v-btn
            text
            class="plan__cta"
            :loading="buyingId === plan.id"
            :disabled="busy || isUnavailableAction(actionOf(plan))"
            @click="buyPlan(plan)"
          >
            {{ ctaLabel(plan) }}
            <v-icon v-if="buyingId !== plan.id">mdi-arrow-right</v-icon>
          </v-btn>
          <p class="plan__note">Pago seguro procesado por Paddle</p>
        </PackageCard>
      </section>

      <LegalLinks class="planes__legal" />
    </div>

    <v-dialog
      v-model="isPurchaseNoticeOpen"
      max-width="440"
      content-class="purchase-notice plans-theme"
      overlay-color="#020a0d"
      overlay-opacity="0.72"
    >
      <v-icon class="purchase-notice__icon">mdi-account-key-outline</v-icon>
      <h2 class="purchase-notice__title">
        Entra para comprar ACO {{ selectedPlanName }}
      </h2>
      <p class="purchase-notice__text">
        El plan se asigna a tu empresa. Inicia sesión o crea tu cuenta; después
        entra a Configuración → Mi plan y tu elección te estará esperando.
      </p>
      <div class="purchase-notice__actions">
        <v-btn text :to="{ name: 'Login' }" class="plan__cta">
          Iniciar sesión
        </v-btn>
        <router-link
          :to="{ name: 'RegistroEmpresa' }"
          class="purchase-notice__link"
        >
          Crear cuenta
        </router-link>
      </div>
      <v-btn
        text
        class="purchase-notice__close"
        @click="isPurchaseNoticeOpen = false"
      >
        Ahora no
      </v-btn>
    </v-dialog>

    <ModuleSelectDialog
      v-model="isModuleDialogOpen"
      :pkg="modulePackage"
      :confirm-label="livePlan ? 'Ver el cambio' : undefined"
      @confirm="onModulesChosen"
    />
  </div>
</template>

<script>
import "@/styles/plans-theme.css";
import { mapActions, mapGetters, mapState } from "vuex";
import ModuleSelectDialog from "@/components/SubscriptionPackages/ModuleSelectDialog.vue";
import LegalLinks from "@/components/Legal/LegalLinks.vue";
import PackageCard from "@/components/SubscriptionPackages/PackageCard.vue";
import { preparePaddle, stopCheckoutEvents } from "@/plugins/paddle";

const BILLING_OPTIONS = [
  { value: false, label: "Mensual" },
  { value: true, label: "Anual" },
];

const CTA_LABELS = {
  buy: "Adquirir plan",
  change: "Cambiar a este plan",
  "change-module": "Cambiar módulo",
  current: "Tu plan actual",
  lower: "Plan inferior",
  "annual-only": "Ya tienes el plan anual",
  manage: "Ver Mi plan",
};

const hasSession = () => {
  try {
    return Boolean(sessionStorage.getItem("auth-token"));
  } catch (error) {
    return false;
  }
};

export default {
  name: "Planes",
  components: { LegalLinks, PackageCard, ModuleSelectDialog },
  data: () => ({
    loadState: "loading",
    errorMessage: "",
    isAnnual: false,
    expandedPlanId: null,
    selectedPlanName: "",
    isPurchaseNoticeOpen: false,
    billingOptions: BILLING_OPTIONS,
    busy: false,
    buyingId: null,
    isModuleDialogOpen: false,
    modulePackage: null,
  }),
  computed: {
    ...mapState("subscriptions", ["publicPackages"]),
    ...mapGetters("subscriptions", {
      plans: "planViews",
      moduleLine: "moduleLine",
      monthsSaved: "maxMonthsSaved",
      livePlan: "livePlan",
      purchaseAction: "purchaseAction",
      isUnavailableAction: "isUnavailableAction",
    }),
    billing() {
      return this.isAnnual ? "annual" : "monthly";
    },
  },
  created() {
    if (this.$route.query._ptxn) preparePaddle();
    this.loadPlans();
    if (hasSession()) this.loadCompanyPlan();
  },
  beforeDestroy() {
    stopCheckoutEvents();
  },
  methods: {
    ...mapActions("subscriptions", [
      "loadPublicPackages",
      "loadCompanyPlan",
      "savePlanChoice",
      "clearPlanChoice",
      "openPlanCheckout",
      "confirmPlanChange",
    ]),
    packageOf(plan) {
      return this.publicPackages.find((pkg) => pkg.id === plan.id);
    },
    actionOf(plan) {
      return hasSession()
        ? this.purchaseAction(this.packageOf(plan), this.billing)
        : "buy";
    },
    ctaLabel(plan) {
      if (this.buyingId === plan.id) {
        return this.livePlan ? "Calculando el cambio" : "Abriendo el pago";
      }
      return CTA_LABELS[this.actionOf(plan)];
    },
    async loadPlans() {
      this.loadState = "loading";
      const error = await this.loadPublicPackages();
      this.errorMessage = error || "";
      this.loadState = error ? "error" : "ready";
    },
    toggleDetails(plan) {
      this.expandedPlanId = this.expandedPlanId === plan.id ? null : plan.id;
    },
    buyPlan(plan) {
      if (!hasSession()) {
        this.savePlanChoice({ packageId: plan.id, billing: this.billing });
        this.selectedPlanName = plan.name;
        this.isPurchaseNoticeOpen = true;
        return;
      }
      this.clearPlanChoice();
      const action = this.actionOf(plan);
      if (action === "manage") {
        this.$router.push({ name: "miPlan" });
        return;
      }
      if (this.isUnavailableAction(action)) return;
      const pkg = this.packageOf(plan);
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
      const payload = {
        package_id: pkg.id,
        billing: this.billing,
        module_ids: moduleIds,
      };
      return this.livePlan
        ? this.changePlan(pkg, payload)
        : this.buy(pkg, payload);
    },
    async buy(pkg, payload) {
      this.busy = true;
      this.buyingId = pkg.id;
      const opened = await this.openPlanCheckout({
        payload,
        onEvent: this.onCheckoutEvent,
      });
      if (!opened) this.resetBuying();
    },
    onCheckoutEvent(event) {
      if (event.name === "checkout.completed") {
        const transactionId = event.data && event.data.transaction_id;
        this.$router.push({
          name: "miPlan",
          query: transactionId ? { transaccion: transactionId } : {},
        });
      }
      if (event.name === "checkout.closed") this.resetBuying();
    },
    async changePlan(pkg, payload) {
      this.busy = true;
      this.buyingId = pkg.id;
      const changed = await this.confirmPlanChange({
        packageName: pkg.name,
        payload,
      });
      this.resetBuying();
      if (changed) this.$router.push({ name: "miPlan" });
    },
    resetBuying() {
      this.busy = false;
      this.buyingId = null;
    },
  },
};
</script>

<style scoped>
.planes__header :where(h1, p),
.planes__state :where(p),
.purchase-notice :where(h2, p) {
  margin: 0;
  padding: 0;
}

.planes {
  min-height: 100vh;
  min-height: 100dvh;
}

.planes__container {
  max-width: 1240px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.planes__legal {
  margin-top: 48px;
}

.planes__accent {
  color: var(--planes-accent);
}

.planes__header {
  position: relative;
  text-align: center;
  margin-bottom: 36px;
}

.planes__header::before {
  content: "";
  position: absolute;
  top: 84px;
  left: 0;
  width: 96px;
  height: 112px;
  background: radial-gradient(rgba(255, 255, 255, 0.22) 1px, transparent 1.6px)
    0 0 / 14px 14px;
  pointer-events: none;
}

.planes__logo {
  position: absolute;
  top: 0;
  /* offsets the transparent padding baked into logo-aco.png */
  left: -50px;
  width: 260px;
  height: auto;
  filter: brightness(0) invert(1);
}

.planes__title {
  font-size: 56px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.planes__subtitle {
  margin-top: 6px;
  font-size: 20px;
  color: var(--planes-text-muted);
}

.planes__modules {
  margin-top: 8px;
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--planes-text-subtle);
}

.planes__billing {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 18px;
}

.billing-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--planes-accent);
  font-size: 13px;
  font-weight: 500;
  color: var(--planes-accent);
}

.plans-theme .billing-badge .v-icon {
  font-size: 16px;
}

.planes__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  align-items: stretch;
  max-width: calc(var(--plan-count, 3) * 420px);
  margin: 0 auto;
}

.plan-skeleton {
  min-height: 520px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0.03) 30%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 70%
  );
  background-size: 300% 100%;
}

.planes__state {
  display: grid;
  justify-items: center;
  gap: 8px;
  max-width: 440px;
  margin: 48px auto 0;
  padding: 32px 24px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  text-align: center;
  color: var(--planes-text-muted);
}

.planes__state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--planes-text);
}

.plans-theme .planes__retry.v-btn {
  height: auto;
  min-width: 0;
  min-height: 44px;
  margin-top: 8px;
  padding: 0 24px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-accent);
  font-weight: 600;
  text-indent: 0;
  color: var(--planes-accent);
}

.plans-theme .plan__cta.v-btn {
  gap: 8px;
  width: 100%;
  height: auto;
  min-width: 0;
  min-height: 46px;
  padding: 0;
  border-radius: var(--planes-radius-control);
  background: linear-gradient(
    180deg,
    var(--planes-accent-soft),
    var(--planes-accent)
  );
  font-size: 15px;
  font-weight: 600;
  text-indent: 0;
  color: var(--planes-accent-ink);
}

.plans-theme .plan__cta.v-btn >>> .v-btn__content {
  gap: 8px;
}

.plans-theme .plan__cta .v-icon {
  font-size: 18px;
}

.plans-theme .plan__cta.v-btn:hover {
  filter: brightness(1.06);
  box-shadow: 0 10px 28px -12px rgba(47, 230, 212, 0.7);
}

.plans-theme .plan__cta.v-btn.v-btn--disabled {
  opacity: 0.6;
  color: var(--planes-accent-ink) !important;
  pointer-events: auto;
  cursor: not-allowed;
}

.plans-theme .plan__cta.v-btn:active {
  transform: scale(0.98);
}

.plans-theme .plan__cta.v-btn:focus-visible,
.plans-theme .planes__retry.v-btn:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 3px;
}

.plans-theme .plan__cta.v-btn::before,
.plans-theme .planes__retry.v-btn::before,
.plans-theme .purchase-notice__close.v-btn::before {
  display: none;
}

.plan__note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--planes-text-subtle);
}

.plans-theme .purchase-notice__icon.v-icon {
  font-size: 40px;
  color: var(--planes-accent);
}

.purchase-notice__title {
  margin-top: 4px;
  font-size: 24px;
  font-weight: 700;
}

.purchase-notice__text {
  margin: 8px 0 20px;
  font-size: 15px;
  line-height: 1.5;
  color: var(--planes-text-muted);
}

.purchase-notice__actions {
  display: grid;
  gap: 10px;
  width: 100%;
}

.purchase-notice__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-accent-border);
  color: var(--planes-accent);
  font-weight: 600;
  text-decoration: none;
}

.plans-theme .purchase-notice__close.v-btn {
  height: auto;
  min-width: 0;
  min-height: 44px;
  font-weight: 600;
  text-indent: 0;
  color: var(--planes-text-muted);
}

@media (prefers-reduced-motion: no-preference) {
  .plans-theme .plan__cta.v-btn {
    transition: transform 0.2s var(--planes-ease), filter 0.2s,
      box-shadow 0.2s var(--planes-ease);
  }

  .plan-skeleton {
    animation: skeleton-shimmer 1.6s ease-in-out infinite;
  }
}

@keyframes skeleton-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: 0 0;
  }
}

@media (max-width: 960px) {
  .planes__header::before {
    display: none;
  }

  .planes__logo {
    position: static;
    display: block;
    margin: -6px 0 12px -34px;
    width: 180px;
  }

  .planes__title {
    font-size: 42px;
  }

  .planes__subtitle {
    font-size: 17px;
  }

  .planes__grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    max-width: 480px;
  }

  .plan__note {
    display: none;
  }

  .plan-skeleton {
    min-height: 260px;
  }
}

@media (max-width: 600px) {
  .planes__container {
    padding: 12px 16px 32px;
  }

  .planes__header {
    margin-bottom: 18px;
  }

  .planes__logo {
    margin: -4px 0 2px -25px;
    width: 130px;
  }

  .planes__title {
    font-size: 28px;
  }

  .planes__subtitle {
    margin-top: 2px;
    font-size: 14px;
  }

  .planes__modules,
  .billing-badge {
    display: none;
  }

  .planes__billing {
    margin-top: 10px;
  }

  .planes__grid {
    gap: 18px;
  }

  .plans-theme .plan__cta.v-btn {
    min-height: 40px;
    font-size: 14.5px;
  }
}
</style>

<style>
.v-dialog.plans-theme.purchase-notice {
  width: min(400px, calc(100vw - 32px));
  padding: 28px 24px 24px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-accent-glow);
  background: var(--planes-surface-solid);
  box-shadow: 0 0 56px -10px rgba(47, 230, 212, 0.38),
    0 28px 56px -28px rgba(0, 0, 0, 0.7);
  text-align: center;
  color: var(--planes-text);
}
</style>
