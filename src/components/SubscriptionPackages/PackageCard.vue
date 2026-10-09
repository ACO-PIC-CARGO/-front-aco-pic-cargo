<template>
  <article
    class="plan"
    :class="{
      'plan--featured': plan.featured,
      'plan--expanded': expanded,
      'plan--inactive': !plan.isActive,
    }"
    :style="{ '--plan-index': index }"
  >
    <span v-if="plan.featured" class="plan__ribbon">
      <i class="mdi mdi-crown" aria-hidden="true"></i> Más elegido
    </span>

    <div class="plan__heading">
      <h2 class="plan__name">
        ACO <span class="plan__accent">{{ plan.name }}</span>
      </h2>
      <span v-if="!plan.isActive" class="plan__status">Inactivo</span>
      <button
        type="button"
        class="plan__chevron"
        :aria-label="`Ver detalles de ACO ${plan.name}`"
        :aria-expanded="String(expanded)"
        :aria-controls="detailsId"
        @click="$emit('toggle-details')"
      >
        <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
      </button>
    </div>
    <p v-if="plan.tagline" class="plan__tagline">{{ plan.tagline }}</p>

    <div class="plan__pricing">
      <p class="plan__price" aria-live="polite">
        <strong>{{ annual ? plan.annualPrice : plan.monthlyPrice }}</strong
        ><span>{{ annual ? "/año" : "/mes" }}</span>
      </p>
      <span v-if="annual && plan.savings" class="plan__savings">
        Ahorras {{ plan.savings }} al año
      </span>
    </div>
    <p v-if="plan.trial" class="plan__trial">
      <i class="mdi mdi-gift-outline" aria-hidden="true"></i> {{ plan.trial }}
    </p>

    <p class="plan__users">
      <i class="mdi mdi-account" aria-hidden="true"></i> {{ plan.users }}
    </p>

    <ul class="plan__highlights">
      <li v-for="item in plan.highlights" :key="item" class="feature">
        <i class="feature__icon mdi mdi-check-circle" aria-hidden="true"></i>
        <div>{{ item }}</div>
      </li>
    </ul>

    <div :id="detailsId" class="plan__details">
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
              feature.conditional
                ? 'mdi-help-circle feature__icon--option'
                : 'mdi-check-circle'
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

      <template v-if="plan.excludes.length">
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
      </template>
    </div>

    <footer class="plan__footer">
      <slot />
      <button
        type="button"
        class="plan__details-toggle"
        :aria-expanded="String(expanded)"
        :aria-controls="detailsId"
        @click="$emit('toggle-details')"
      >
        {{ expanded ? "Ocultar detalles" : "Ver detalles" }}
        <i class="mdi mdi-chevron-down" aria-hidden="true"></i>
      </button>
    </footer>
  </article>
</template>

<script>
export default {
  name: "PackageCard",
  props: {
    plan: { type: Object, required: true },
    annual: { type: Boolean, default: true },
    expanded: { type: Boolean, default: false },
    index: { type: Number, default: 0 },
  },
  computed: {
    detailsId() {
      return `plan-details-${this._uid}`;
    },
  },
};
</script>

<style scoped>
.plan :where(h2, h3, p, ul) {
  margin: 0;
  padding: 0;
}

.plan :where(ul) {
  list-style: none;
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
  box-shadow: var(--planes-card-shadow);
  color: var(--planes-text);
}

.plan--featured {
  border-color: var(--planes-accent-glow);
  box-shadow: var(--planes-featured-shadow);
}

.plan--inactive {
  border-style: dashed;
  box-shadow: none;
}

.plan--inactive > :not(.plan__footer) {
  opacity: 0.62;
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
  border: 1px solid var(--planes-accent-glow);
  background: var(--planes-surface-solid);
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
  gap: 12px;
}

.plan__name {
  margin-right: auto;
  font-size: 26px;
  line-height: 1.2;
  font-weight: 700;
  overflow-wrap: anywhere;
}

.plan__accent {
  color: var(--planes-accent);
}

.plan__status {
  flex-shrink: 0;
  margin-top: 4px;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid var(--planes-border-strong);
  font-size: 12px;
  font-weight: 600;
  color: var(--planes-text-muted);
}

.plan__chevron,
.plan__highlights,
.plan__details-toggle {
  display: none;
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

.plan__trial {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 6px;
  margin-top: 8px;
  padding: 3px 10px;
  border: 1px solid var(--planes-accent-border);
  border-radius: 6px;
  background: var(--planes-accent-tint);
  font-size: 12px;
  font-weight: 700;
  color: var(--planes-accent);
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

.feature__icon--option {
  color: var(--planes-text-subtle);
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
  border: 1px solid var(--planes-border-strong);
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
  border-color: var(--planes-accent-border);
}

.plan--expanded .plan__chevron .mdi,
.plan--expanded .plan__details-toggle .mdi {
  display: inline-block;
  transform: rotate(180deg);
}

.plan__chevron:focus-visible,
.plan__details-toggle:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 3px;
}

@media (prefers-reduced-motion: no-preference) {
  .plan {
    animation: plan-enter 0.6s var(--planes-ease) both;
    animation-delay: calc(var(--plan-index) * 90ms);
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
  .plan__chevron,
  .plan__details-toggle {
    display: inline-flex;
  }

  .plan__highlights {
    display: grid;
    gap: 7px;
    padding-top: 12px;
  }

  .plan__details {
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

  .plan__details-toggle {
    min-height: 36px;
    margin-top: 6px;
    font-size: 13px;
  }
}
</style>
