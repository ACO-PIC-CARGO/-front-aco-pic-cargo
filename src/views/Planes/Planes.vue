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
          <SegmentedControl
            v-model="isAnnual"
            :options="billingOptions"
            label="Periodo de facturación"
          />
          <span v-if="monthsSaved" class="billing-badge">
            <i class="mdi mdi-tag-outline" aria-hidden="true"></i>
            Ahorra hasta {{ monthsSaved }} {{ monthsSaved === 1 ? "mes" : "meses" }}
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
        <button type="button" class="planes__retry" @click="loadPlans">
          Reintentar
        </button>
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
          <button
            type="button"
            class="plan__cta"
            @click="showPurchaseNotice(plan)"
          >
            Adquirir plan <i class="mdi mdi-arrow-right" aria-hidden="true"></i>
          </button>
          <p class="plan__note">Solo con tu email · Sin tarjeta</p>
        </PackageCard>
      </section>
    </div>

    <dialog
      ref="purchaseNotice"
      class="purchase-notice"
      aria-labelledby="purchase-notice-title"
    >
      <i class="mdi mdi-progress-wrench purchase-notice__icon" aria-hidden="true"></i>
      <h2 id="purchase-notice-title" class="purchase-notice__title">
        Aún en desarrollo
      </h2>
      <p class="purchase-notice__text">
        Estamos terminando la compra en línea de ACO {{ selectedPlanName }}.
        Muy pronto podrás adquirir tu plan desde aquí.
      </p>
      <form method="dialog">
        <button type="submit" class="plan__cta">Entendido</button>
      </form>
    </dialog>
  </div>
</template>

<script>
import "@/styles/plans-theme.css";
import PackageCard from "@/components/SubscriptionPackages/PackageCard.vue";
import SegmentedControl from "@/components/SubscriptionPackages/SegmentedControl.vue";
import {
  maxMonthsSaved,
  moduleNames,
  toPlanView,
} from "@/components/SubscriptionPackages/packageView";
import {
  fetchPublicPackages,
  isEmptyResult,
} from "@/api/subscriptionPackages";

const BILLING_OPTIONS = [
  { value: false, label: "Mensual" },
  { value: true, label: "Anual" },
];

export default {
  name: "Planes",
  components: { PackageCard, SegmentedControl },
  data: () => ({
    packages: [],
    loadState: "loading",
    errorMessage: "",
    isAnnual: true,
    expandedPlanId: null,
    selectedPlanName: "",
    billingOptions: BILLING_OPTIONS,
  }),
  computed: {
    plans() {
      return this.packages.map(toPlanView);
    },
    moduleLine() {
      return moduleNames(this.packages).join(" · ");
    },
    monthsSaved() {
      return maxMonthsSaved(this.packages);
    },
  },
  created() {
    this.loadPlans();
  },
  methods: {
    async loadPlans() {
      this.loadState = "loading";
      const response = await fetchPublicPackages();

      if (response.estadoflag || isEmptyResult(response)) {
        this.packages = response.data;
        this.loadState = "ready";
        return;
      }

      this.errorMessage = response.mensaje;
      this.loadState = "error";
    },
    toggleDetails(plan) {
      this.expandedPlanId = this.expandedPlanId === plan.id ? null : plan.id;
    },
    showPurchaseNotice(plan) {
      this.selectedPlanName = plan.name;
      this.$refs.purchaseNotice.showModal();
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

.billing-badge .mdi {
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

.planes__retry {
  margin-top: 8px;
  min-height: 44px;
  padding: 0 24px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-accent);
  font-weight: 600;
  color: var(--planes-accent);
  cursor: pointer;
}

.plan__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  min-height: 46px;
  border-radius: var(--planes-radius-control);
  background: linear-gradient(
    180deg,
    var(--planes-accent-soft),
    var(--planes-accent)
  );
  font-size: 15px;
  font-weight: 600;
  color: var(--planes-accent-ink);
  cursor: pointer;
}

.plan__cta .mdi {
  font-size: 18px;
}

.plan__cta:hover {
  filter: brightness(1.06);
  box-shadow: 0 10px 28px -12px rgba(47, 230, 212, 0.7);
}

.plan__cta:active {
  transform: scale(0.98);
}

.plan__cta:focus-visible,
.planes__retry:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 3px;
}

.plan__note {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--planes-text-subtle);
}

.purchase-notice {
  margin: auto;
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

.purchase-notice::backdrop {
  background: rgba(2, 10, 13, 0.72);
}

.purchase-notice__icon {
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

@media (prefers-reduced-motion: no-preference) {
  .plan__cta {
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

  .plan__cta {
    min-height: 40px;
    font-size: 14.5px;
  }
}
</style>
