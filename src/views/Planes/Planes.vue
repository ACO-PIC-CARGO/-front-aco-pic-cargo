<template>
  <div class="planes">
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
        <p class="planes__modules">Pricing · Operaciones · Administración</p>

        <div class="planes__billing">
          <div
            class="billing-toggle"
            role="group"
            aria-label="Periodo de facturación"
          >
            <button
              type="button"
              class="billing-toggle__option"
              :class="{ 'billing-toggle__option--active': !isAnnual }"
              :aria-pressed="String(!isAnnual)"
              @click="isAnnual = false"
            >
              Mensual
            </button>
            <button
              type="button"
              class="billing-toggle__option"
              :class="{ 'billing-toggle__option--active': isAnnual }"
              :aria-pressed="String(isAnnual)"
              @click="isAnnual = true"
            >
              Anual
            </button>
          </div>
          <span class="billing-badge">
            <i class="mdi mdi-tag-outline" aria-hidden="true"></i>
            Ahorra 2 meses
          </span>
        </div>
      </header>

      <section class="planes__grid" aria-label="Planes disponibles">
        <article
          v-for="(plan, index) in plans"
          :key="plan.name"
          class="plan"
          :class="{
            'plan--featured': plan.featured,
            'plan--expanded': isExpanded(plan),
          }"
          :style="{ '--plan-index': index }"
        >
          <span v-if="plan.featured" class="plan__ribbon">
            <i class="mdi mdi-crown" aria-hidden="true"></i>
            Más elegido
          </span>

          <div class="plan__heading">
            <h2 class="plan__name">
              ACO <span class="planes__accent">{{ plan.name }}</span>
            </h2>
            <button
              type="button"
              class="plan__chevron"
              :aria-label="`Ver detalles de ACO ${plan.name}`"
              :aria-expanded="String(isExpanded(plan))"
              :aria-controls="`plan-details-${plan.name}`"
              @click="toggleDetails(plan)"
            >
              <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
            </button>
          </div>
          <p class="plan__tagline">{{ plan.tagline }}</p>

          <div class="plan__pricing">
            <p class="plan__price" aria-live="polite">
              <strong>{{
                isAnnual ? plan.annualPrice : plan.monthlyPrice
              }}</strong
              ><span>{{ isAnnual ? "/año" : "/mes" }}</span>
            </p>
            <span v-if="isAnnual" class="plan__savings">
              Ahorras {{ plan.savings }} al año
            </span>
          </div>

          <p class="plan__users">
            <i class="mdi mdi-account" aria-hidden="true"></i>
            {{ plan.users }}
          </p>

          <ul class="plan__highlights">
            <li v-for="item in plan.highlights" :key="item" class="feature">
              <i
                class="feature__icon mdi mdi-check-circle"
                aria-hidden="true"
              ></i>
              <div>{{ item }}</div>
            </li>
          </ul>

          <div :id="`plan-details-${plan.name}`" class="plan__details">
            <h3 class="plan__section-title">Incluye</h3>
            <ul class="feature-list">
              <li
                v-for="feature in plan.includes"
                :key="feature.text"
                class="feature"
              >
                <i
                  class="feature__icon mdi"
                  :class="
                    feature.conditional ? 'mdi-help-circle' : 'mdi-check-circle'
                  "
                  aria-hidden="true"
                ></i>
                <div>
                  {{ feature.text }}
                  <ul v-if="feature.details" class="feature__details">
                    <li v-for="detail in feature.details" :key="detail">
                      {{ detail }}
                    </li>
                  </ul>
                </div>
              </li>
            </ul>

            <h3 class="plan__section-title">No incluye</h3>
            <ul class="feature-list">
              <li
                v-for="item in plan.excludes"
                :key="item"
                class="feature feature--excluded"
              >
                <i
                  class="feature__icon mdi mdi-close-circle"
                  aria-hidden="true"
                ></i>
                <div>{{ item }}</div>
              </li>
            </ul>
          </div>

          <footer class="plan__footer">
            <button type="button" class="plan__cta">
              Adquirir plan
              <i class="mdi mdi-arrow-right" aria-hidden="true"></i>
            </button>
            <button
              type="button"
              class="plan__details-toggle"
              :aria-expanded="String(isExpanded(plan))"
              :aria-controls="`plan-details-${plan.name}`"
              @click="toggleDetails(plan)"
            >
              {{ isExpanded(plan) ? "Ocultar detalles" : "Ver detalles" }}
              <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
            </button>
            <p class="plan__note">Solo con tu email · Sin tarjeta</p>
          </footer>
        </article>
      </section>
    </div>
  </div>
</template>

<script>
const PRICING_DETAILS = [
  "Reporte de vendedores por status y mercado",
  "Acceso a ingreso y seguimiento de llamadas",
  "Reporte por últimas llamadas en Pricing y Cotizaciones",
];
const OPERATIONS_DETAILS = [
  "Reporte de embarques por fecha de llegada o salida",
  "Reporte de ganancia operativa por rango",
  "Cierre de expediente administrativo operativo",
];
const ADMINISTRATION_DETAILS = [
  "Reporte de cuentas por cobrar",
  "Reporte de cuentas por pagar",
  "Próximamente: estado de ganancias mensuales",
];

const ALL_MODULES = [
  { text: "Todos los módulos incluidos" },
  { text: "Pricing y Cotizaciones", details: PRICING_DETAILS },
  { text: "Operaciones", details: OPERATIONS_DETAILS },
  { text: "Administración", details: ADMINISTRATION_DETAILS },
  { text: "Flujo conectado entre módulos" },
];

const PLANS = Object.freeze([
  {
    name: "START",
    tagline: "Para empezar",
    annualPrice: "US$290",
    monthlyPrice: "US$29",
    savings: "US$58",
    users: "1 usuario",
    highlights: ["1 módulo a elegir", "Sistema 100% online", "Soporte básico"],
    includes: [
      { text: "1 módulo a elegir" },
      { text: "Puedes elegir: Pricing o Operaciones o Administración" },
      {
        text: "Si eliges Pricing:",
        details: PRICING_DETAILS,
        conditional: true,
      },
      {
        text: "Si eliges Operaciones:",
        details: OPERATIONS_DETAILS,
        conditional: true,
      },
      {
        text: "Si eliges Administración:",
        details: ADMINISTRATION_DETAILS,
        conditional: true,
      },
      { text: "Sistema 100% online" },
      { text: "Soporte básico" },
    ],
    excludes: [
      "Los 3 módulos al mismo tiempo",
      "Flujo conectado entre módulos",
      "Más de 1 usuario",
      "Soporte prioritario",
      "Soporte premium",
    ],
  },
  {
    name: "PRO",
    tagline: "Para agencias en crecimiento",
    annualPrice: "US$790",
    monthlyPrice: "US$79",
    savings: "US$158",
    users: "3 usuarios",
    highlights: [
      "3 módulos incluidos",
      "Flujo conectado entre módulos",
      "Soporte prioritario",
    ],
    featured: true,
    includes: [
      ...ALL_MODULES,
      { text: "Sistema 100% online" },
      { text: "Soporte prioritario" },
    ],
    excludes: ["Más de 3 usuarios", "Soporte premium"],
  },
  {
    name: "BUSINESS",
    tagline: "Para equipos más grandes",
    annualPrice: "US$1,290",
    monthlyPrice: "US$129",
    savings: "US$258",
    users: "5 usuarios",
    highlights: [
      "3 módulos incluidos",
      "Reportes y control total",
      "Soporte premium",
    ],
    includes: [
      ...ALL_MODULES,
      { text: "Reportes y control total" },
      { text: "Mayor capacidad para tu equipo" },
      { text: "Sistema 100% online" },
      { text: "Soporte premium" },
    ],
    excludes: ["Sin restricciones principales"],
  },
]);

export default {
  name: "Planes",
  data: () => ({ plans: PLANS, isAnnual: true, expandedPlan: null }),
  methods: {
    isExpanded(plan) {
      return this.expandedPlan === plan.name;
    },
    toggleDetails(plan) {
      this.expandedPlan = this.isExpanded(plan) ? null : plan.name;
    },
  },
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap");

.planes {
  --planes-bg: #051419;
  --planes-surface-top: rgba(18, 50, 58, 0.72);
  --planes-surface-bottom: rgba(9, 30, 36, 0.78);
  --planes-border: rgba(150, 226, 220, 0.14);
  --planes-divider: rgba(255, 255, 255, 0.08);
  --planes-accent: #2fe6d4;
  --planes-accent-soft: #74f7ec;
  --planes-accent-ink: #03241f;
  --planes-savings: #46df88;
  --planes-savings-ink: #04301a;
  --planes-text: #eef7f7;
  --planes-text-muted: #b5c7c9;
  --planes-text-subtle: #8ea4a7;
  --planes-excluded: #62797d;
  --planes-radius-card: 16px;
  --planes-radius-control: 10px;
  --planes-ease: cubic-bezier(0.16, 1, 0.3, 1);

  min-height: 100vh;
  min-height: 100dvh;
  color: var(--planes-text);
  background: radial-gradient(
      55% 45% at 100% 100%,
      rgba(36, 204, 189, 0.22),
      transparent 70%
    ),
    radial-gradient(
      40% 40% at 0% 100%,
      rgba(36, 204, 189, 0.12),
      transparent 70%
    ),
    radial-gradient(70% 55% at 50% 0%, #0c2a32 0%, transparent 75%),
    var(--planes-bg);
}

.planes,
.planes * {
  font-family: "Outfit", "Roboto", sans-serif;
}

.planes h1,
.planes h2,
.planes h3,
.planes p,
.planes ul {
  margin: 0;
  padding: 0;
}

.planes ul {
  list-style: none;
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

.billing-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.billing-toggle__option {
  min-width: 76px;
  padding: 7px 22px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--planes-text-muted);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.billing-toggle__option:not(.billing-toggle__option--active):hover {
  color: var(--planes-text);
}

.billing-toggle__option--active {
  background: var(--planes-accent);
  color: var(--planes-accent-ink);
  font-weight: 600;
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  align-items: stretch;
}

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 24px 20px 18px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  background: linear-gradient(
    180deg,
    var(--planes-surface-top),
    var(--planes-surface-bottom)
  );
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04),
    0 28px 56px -28px rgba(0, 0, 0, 0.7);
}

.plan--featured {
  border-color: rgba(47, 230, 212, 0.75);
  box-shadow: 0 0 0 1px rgba(47, 230, 212, 0.2),
    0 0 56px -10px rgba(47, 230, 212, 0.38),
    0 28px 56px -28px rgba(0, 0, 0, 0.7);
}

.plan__ribbon {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 12px;
  border-radius: 6px;
  border: 1px solid rgba(47, 230, 212, 0.75);
  background: #0a2a2f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--planes-accent);
  white-space: nowrap;
}

.plan__ribbon .mdi {
  font-size: 13px;
}

.plan__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.plan__chevron,
.plan__highlights,
.plan__details-toggle {
  display: none;
}

.plan__name {
  font-size: 26px;
  line-height: 1.2;
  font-weight: 700;
}

.plan__tagline {
  margin-top: 2px;
  font-size: 15px;
  color: var(--planes-text-muted);
}

.plan__pricing {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-top: 10px;
}

.plan__price {
  line-height: 1.1;
}

.plan__price strong {
  font-size: 38px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.plan__price span {
  font-size: 18px;
  color: var(--planes-text-muted);
}

.plan__savings {
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--planes-savings);
  font-size: 12px;
  font-weight: 700;
  color: var(--planes-savings-ink);
}

.plan__users {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 10px;
  border-bottom: 1px solid var(--planes-divider);
  font-size: 15px;
}

.plan__users .mdi {
  font-size: 20px;
  color: var(--planes-text-muted);
}

.plan__section-title {
  margin: 14px 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.feature-list {
  display: grid;
  gap: 7px;
}

.feature-list + .plan__section-title {
  margin-top: 18px;
}

.feature {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 8px;
  font-size: 13.5px;
  line-height: 1.4;
  color: var(--planes-text);
}

.feature__icon {
  font-size: 18px;
  line-height: 1;
  color: var(--planes-accent);
}

.feature__details {
  display: grid;
  gap: 3px;
  margin-top: 4px;
}

.feature__details li {
  position: relative;
  padding-left: 14px;
  font-size: 12.5px;
  color: var(--planes-text-subtle);
}

.feature__details li::before {
  content: "";
  position: absolute;
  top: 0.6em;
  left: 2px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
}

.feature--excluded {
  color: var(--planes-text-subtle);
}

.feature--excluded .feature__icon {
  color: var(--planes-excluded);
}

.plan__footer {
  margin-top: auto;
  padding-top: 20px;
  text-align: center;
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

.plan__chevron {
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  margin: -8px -10px 0 0;
  border-radius: 8px;
  font-size: 22px;
  color: var(--planes-text-muted);
  cursor: pointer;
}

.plan__details-toggle {
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 42px;
  margin-top: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: var(--planes-radius-control);
  font-size: 14px;
  font-weight: 500;
  color: var(--planes-text-muted);
  cursor: pointer;
}

.plan__details-toggle .mdi {
  font-size: 18px;
}

.plan__details-toggle:hover,
.plan__chevron:hover {
  color: var(--planes-text);
  border-color: rgba(47, 230, 212, 0.5);
}

.plan--expanded .plan__chevron .mdi,
.plan--expanded .plan__details-toggle .mdi {
  display: inline-block;
  transform: rotate(180deg);
}

.plan__cta:focus-visible,
.plan__chevron:focus-visible,
.plan__details-toggle:focus-visible,
.billing-toggle__option:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 3px;
}

.plan__note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--planes-text-subtle);
}

@media (prefers-reduced-motion: no-preference) {
  .plan {
    animation: plan-enter 0.6s var(--planes-ease) both;
    animation-delay: calc(var(--plan-index) * 90ms);
  }

  .plan__cta {
    transition: transform 0.2s var(--planes-ease), filter 0.2s,
      box-shadow 0.2s var(--planes-ease);
  }

  .plan__chevron .mdi,
  .plan__details-toggle .mdi {
    transition: transform 0.25s var(--planes-ease);
  }
}

@keyframes plan-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
    margin: 0 auto;
  }

  .plan__chevron,
  .plan__details-toggle {
    display: inline-flex;
  }

  .plan__highlights {
    display: grid;
    gap: 7px;
    padding-top: 12px;
  }

  .plan__details,
  .plan__note {
    display: none;
  }

  .plan--expanded .plan__details {
    display: block;
  }

  .plan--expanded .plan__highlights {
    display: none;
  }

  .plan__footer {
    padding-top: 16px;
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

  .billing-toggle__option {
    padding: 5px 18px;
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

  .plan {
    padding: 12px 14px 10px;
  }

  .plan__name {
    font-size: 20px;
  }

  .plan__chevron {
    width: 36px;
    height: 36px;
    margin: -7px -8px 0 0;
    font-size: 20px;
  }

  .plan__tagline {
    margin-top: 0;
    font-size: 13px;
  }

  .plan__pricing {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px 10px;
    margin-top: 6px;
  }

  .plan__price strong {
    font-size: 28px;
  }

  .plan__price span {
    font-size: 14px;
  }

  .plan__savings {
    margin-top: 0;
    font-size: 11px;
  }

  .plan__users {
    padding: 4px 0 6px;
    font-size: 13.5px;
  }

  .plan__users .mdi {
    font-size: 18px;
  }

  .plan__highlights {
    gap: 3px;
    padding-top: 6px;
  }

  .feature {
    font-size: 13px;
    line-height: 1.3;
  }

  .plan__footer {
    padding-top: 10px;
  }

  .plan__cta {
    min-height: 40px;
    font-size: 14.5px;
  }

  .plan__details-toggle {
    min-height: 36px;
    margin-top: 6px;
    font-size: 13px;
  }
}
</style>
