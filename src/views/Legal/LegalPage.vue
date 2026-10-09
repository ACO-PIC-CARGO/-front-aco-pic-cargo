<template>
  <div class="legal plans-theme">
    <main class="legal__container">
      <header class="legal__header">
        <img
          class="legal__logo"
          src="/img/login/logo-aco.png"
          alt="ACO, Agencia de Carga Online"
        />
        <template v-if="loadState === 'ready'">
          <h1 class="legal__title">{{ content.title }}</h1>
          <p class="legal__updated">
            Última actualización: {{ formatUpdatedAt(content.updated_at) }}
          </p>
        </template>
      </header>

      <p v-if="loadState === 'loading'" class="legal__state" aria-busy="true">
        <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i> Cargando…
      </p>

      <div v-else-if="loadState === 'error'" class="legal__state" role="alert">
        <p class="legal__state-title">No pudimos cargar esta página.</p>
        <p>Revisa tu conexión e intenta de nuevo.</p>
        <button
          type="button"
          class="plans-button plans-button--secondary"
          @click="load"
        >
          Reintentar
        </button>
      </div>

      <template v-else>
        <section
          v-for="(section, index) in content.sections"
          :key="index"
          class="legal__section"
        >
          <h2 class="legal__heading">{{ section.heading }}</h2>
          <p
            v-for="(paragraph, position) in section.paragraphs"
            :key="position"
          >
            {{ paragraph }}
          </p>
        </section>
      </template>

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
import { fetchLegalPage } from "@/api/legalPages";
import { formatUpdatedAt } from "./legalPageEditor";

export default {
  name: "LegalPage",
  components: { LegalLinks },
  props: {
    page: { type: String, required: true },
  },
  data: () => ({ content: null, loadState: "loading" }),
  watch: {
    page: {
      handler() {
        window.scrollTo(0, 0);
        this.load();
      },
      immediate: true,
    },
  },
  methods: {
    formatUpdatedAt,
    async load() {
      const slug = this.page;
      this.loadState = "loading";
      const response = await fetchLegalPage(slug);
      if (slug !== this.page) return;
      if (!response.estadoflag) {
        this.loadState = "error";
        return;
      }
      this.content = response.data[0];
      this.loadState = "ready";
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
  margin: 8px 0 8px;
  font-size: 36px;
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.legal__updated {
  margin: 0 0 32px;
  font-size: 14px;
  color: var(--planes-text-subtle);
}

.legal__state {
  display: grid;
  gap: 12px;
  justify-items: start;
  margin: 24px 0 40px;
  color: var(--planes-text-muted);
}

.legal__state p {
  margin: 0;
}

.legal__state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--planes-text);
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
  white-space: pre-line;
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
