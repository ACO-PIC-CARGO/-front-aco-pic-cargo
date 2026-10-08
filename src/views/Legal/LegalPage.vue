<template>
  <div class="legal plans-theme">
    <main class="legal__container">
      <header class="legal__header">
        <img
          class="legal__logo"
          src="/img/login/logo-aco.png"
          alt="ACO, Agencia de Carga Online"
        />
        <h1 class="legal__title">{{ content.title }}</h1>
      </header>

      <section
        v-for="section in content.sections"
        :key="section.heading"
        class="legal__section"
      >
        <h2 class="legal__heading">{{ section.heading }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph">
          {{ paragraph }}
        </p>
      </section>

      <router-link :to="{ name: 'Planes' }" class="legal__back">
        Ver planes
      </router-link>
      <LegalLinks class="legal__links" />
    </main>
  </div>
</template>

<script>
import "@/styles/plans-theme.css";
import LegalLinks from "@/components/Legal/LegalLinks.vue";
import { LEGAL_PAGES } from "./legalContent";

export default {
  name: "LegalPage",
  components: { LegalLinks },
  props: {
    page: { type: String, required: true },
  },
  computed: {
    content() {
      return LEGAL_PAGES[this.page];
    },
  },
};
</script>

<style scoped>
.legal {
  min-height: 100vh;
  min-height: 100dvh;
}

.legal__container {
  max-width: 70ch;
  margin: 0 auto;
  padding: 24px 24px 48px;
}

.legal__logo {
  display: block;
  width: 180px;
  height: auto;
  margin-left: -34px;
  filter: brightness(0) invert(1);
}

.legal__title {
  margin: 8px 0 32px;
  font-size: 36px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.legal__section {
  margin-bottom: 28px;
}

.legal__heading {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
  color: var(--planes-accent-soft);
}

.legal__section p {
  margin: 0 0 12px;
  font-size: 16px;
  line-height: 1.65;
  color: var(--planes-text-muted);
}

.legal__back {
  display: inline-block;
  margin: 8px 0 32px;
  color: var(--planes-accent);
  font-weight: 500;
}

.legal__links {
  padding-top: 20px;
  border-top: 1px solid var(--planes-divider);
}

@media (max-width: 600px) {
  .legal__container {
    padding: 12px 16px 32px;
  }

  .legal__logo {
    width: 130px;
    margin-left: -25px;
  }

  .legal__title {
    font-size: 28px;
  }
}
</style>
