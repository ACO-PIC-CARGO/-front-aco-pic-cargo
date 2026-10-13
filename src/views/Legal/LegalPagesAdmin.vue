<template>
  <div class="legal-admin plans-theme plans-theme--app">
    <div class="legal-admin__container">
      <header class="legal-admin__header">
        <h1 class="legal-admin__title">Páginas legales</h1>
        <p class="legal-admin__subtitle">
          Edita los textos de Términos, Privacidad y Reembolsos. Tus clientes
          ven los cambios en cuanto los guardas.
        </p>
      </header>

      <p
        v-if="loadState === 'loading'"
        class="legal-admin__state"
        aria-busy="true"
      >
        <v-icon class="mdi-spin">mdi-loading</v-icon>
        Cargando las páginas…
      </p>

      <div
        v-else-if="loadState === 'error'"
        class="legal-admin__state"
        role="alert"
      >
        <p class="legal-admin__state-title">
          No pudimos cargar las páginas legales.
        </p>
        <p>{{ errorMessage }}</p>
        <v-btn text class="plans-button plans-button--secondary" @click="load">
          Reintentar
        </v-btn>
      </div>

      <div v-else-if="!pages.length" class="legal-admin__state">
        <p class="legal-admin__state-title">
          Todavía no hay páginas legales para editar. Avísale a soporte.
        </p>
      </div>

      <template v-else>
        <v-tabs
          v-model="activeSlug"
          class="legal-admin__tabs"
          fixed-tabs
          aria-label="Páginas legales"
        >
          <v-tab
            v-for="page in pages"
            :id="`tab-${page.slug}`"
            :key="page.slug"
            :tab-value="page.slug"
            class="legal-admin__tab"
            :aria-controls="`panel-${page.slug}`"
          >
            <span class="legal-admin__tab-long">
              {{ pageView(page.slug).label }}
            </span>
            <span class="legal-admin__tab-short">
              {{ pageView(page.slug).shortLabel }}
            </span>
            <template v-if="dirtySlugs.includes(page.slug)">
              <span class="legal-admin__dot" aria-hidden="true"></span>
              <span class="d-sr-only">(cambios sin guardar)</span>
            </template>
          </v-tab>
        </v-tabs>

        <v-form
          :id="`panel-${activeSlug}`"
          ref="panel"
          class="legal-admin__panel"
          role="tabpanel"
          :aria-labelledby="`tab-${activeSlug}`"
          @submit.prevent="save"
        >
          <div class="legal-admin__meta">
            <span>
              Última actualización: {{ formatUpdatedAt(activePage.updated_at) }}
            </span>
            <router-link
              :to="{ name: pageView(activeSlug).route }"
              target="_blank"
              rel="noopener"
              class="legal-admin__link"
              aria-label="Ver página publicada (se abre en una pestaña nueva)"
            >
              <v-icon>mdi-open-in-new</v-icon> Ver página publicada
            </router-link>
          </div>

          <p
            v-if="activePlaceholders.length"
            class="legal-admin__notice"
            role="note"
          >
            <v-icon>mdi-alert-circle-outline</v-icon>
            <span>
              Reemplaza estos datos entre corchetes por los reales:
              <strong>{{ activePlaceholders.join(", ") }}</strong
              >.
            </span>
          </p>

          <fieldset class="legal-admin__fields" :disabled="saving">
            <v-text-field
              id="legal-page-title"
              v-model="draftTitle"
              label="Título de la página"
              autocomplete="off"
              :maxlength="limits.title"
              :counter="limits.title"
              :error-messages="errors.title"
              :aria-invalid="String(Boolean(errors.title))"
              outlined
              dense
            />

            <p
              v-if="errors.size || errors.sections"
              ref="pageError"
              class="legal-admin__error"
              role="alert"
              tabindex="-1"
            >
              {{ errors.size || errors.sections }}
            </p>

            <ol class="legal-admin__sections">
              <LegalSectionEditor
                v-for="(section, index) in draft.sections"
                :key="section.key"
                :value="section"
                :index="index"
                :count="draft.sections.length"
                :errors="errors.items[index]"
                @input="updateSection(index, $event)"
                @move="onMoveSection(index, $event)"
                @remove="removeSection(index)"
              />
            </ol>

            <v-btn
              text
              class="plans-button plans-button--secondary legal-admin__add"
              :disabled="isAtSectionLimit"
              :aria-describedby="
                isAtSectionLimit ? 'legal-section-limit' : null
              "
              @click="addSection"
            >
              <v-icon>mdi-plus</v-icon> Agregar sección
            </v-btn>
            <p
              v-if="isAtSectionLimit"
              id="legal-section-limit"
              class="legal-admin__hint"
            >
              Llegaste al máximo de {{ limits.sections }} secciones.
            </p>
          </fieldset>

          <div class="legal-admin__bar">
            <p class="legal-admin__status" role="status">
              {{
                isActiveDirty
                  ? "Tienes cambios sin guardar."
                  : "Todo está guardado."
              }}
            </p>
            <div class="legal-admin__bar-actions">
              <v-btn
                text
                class="plans-button plans-button--ghost"
                :disabled="!isActiveDirty || saving"
                @click="discardChanges"
              >
                Descartar cambios
              </v-btn>
              <v-btn
                text
                type="submit"
                class="plans-button plans-button--primary"
                :disabled="!isActiveDirty || saving"
              >
                <v-icon v-if="saving" class="mdi-spin">mdi-loading</v-icon>
                {{ saving ? "Guardando…" : "Guardar cambios" }}
              </v-btn>
            </div>
          </div>
        </v-form>
      </template>
    </div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "@/styles/plans-theme.css";
import { mapActions, mapGetters, mapState } from "vuex";
import LegalSectionEditor from "./LegalSectionEditor.vue";

const PAGE_VIEWS = {
  terminos: {
    label: "Términos y condiciones",
    shortLabel: "Términos",
    route: "LegalTerms",
  },
  privacidad: {
    label: "Política de privacidad",
    shortLabel: "Privacidad",
    route: "LegalPrivacy",
  },
  reembolsos: {
    label: "Política de reembolsos",
    shortLabel: "Reembolsos",
    route: "LegalRefunds",
  },
};

const NO_ERRORS = { size: "", title: "", sections: "", items: [] };

const focusById = (id) => {
  const element = document.getElementById(id);
  if (element) element.focus();
};

export default {
  name: "LegalPagesAdmin",
  components: { LegalSectionEditor },
  beforeRouteLeave(to, from, next) {
    if (this.saving) {
      next(false);
      return;
    }
    if (!this.dirtySlugs.length) {
      next();
      return;
    }
    Swal.fire({
      icon: "warning",
      title: "Tienes cambios sin guardar",
      text: "Si sales ahora, se perderán.",
      showCancelButton: true,
      confirmButtonText: "Salir sin guardar",
      cancelButtonText: "Seguir editando",
      reverseButtons: true,
    }).then(({ isConfirmed }) => next(isConfirmed));
  },
  data: () => ({
    showErrors: {},
    activeSlug: "",
    loadState: "loading",
    errorMessage: "",
    saving: false,
  }),
  computed: {
    ...mapState("legalPages", ["pages", "drafts"]),
    ...mapGetters("legalPages", [
      "limits",
      "formatUpdatedAt",
      "draftErrors",
      "hasDraftErrors",
      "dirtySlugs",
      "placeholders",
    ]),
    activePage() {
      return this.pages.find((page) => page.slug === this.activeSlug);
    },
    draft() {
      return this.drafts[this.activeSlug];
    },
    draftTitle: {
      get() {
        return this.draft.title;
      },
      set(title) {
        this.$store.commit("legalPages/SET_DRAFT_TITLE", {
          slug: this.activeSlug,
          title,
        });
      },
    },
    errors() {
      return this.showErrors[this.activeSlug]
        ? this.draftErrors(this.activeSlug)
        : NO_ERRORS;
    },
    isAtSectionLimit() {
      return this.draft.sections.length >= this.limits.sections;
    },
    isActiveDirty() {
      return this.dirtySlugs.includes(this.activeSlug);
    },
    activePlaceholders() {
      return this.placeholders(this.activeSlug);
    },
  },
  mounted() {
    this.$store.state.mainTitle = "PÁGINAS LEGALES";
    window.addEventListener("beforeunload", this.warnBeforeUnload);
    this.load();
  },
  beforeDestroy() {
    window.removeEventListener("beforeunload", this.warnBeforeUnload);
  },
  methods: {
    ...mapActions("legalPages", ["loadPages", "savePage"]),
    pageView(slug) {
      return PAGE_VIEWS[slug];
    },
    async load() {
      this.loadState = "loading";
      const error = await this.loadPages();
      if (error) {
        this.errorMessage = error;
        this.loadState = "error";
        return;
      }
      this.showErrors = {};
      if (!this.activeSlug && this.pages.length) {
        this.activeSlug = this.pages[0].slug;
      }
      this.loadState = "ready";
    },
    updateSection(index, section) {
      this.$store.commit("legalPages/SET_SECTION", {
        slug: this.activeSlug,
        index,
        section,
      });
    },
    addSection() {
      this.$store.commit("legalPages/ADD_SECTION", this.activeSlug);
      const section = this.draft.sections[this.draft.sections.length - 1];
      this.$nextTick(() => focusById(`${section.key}-heading`));
    },
    onMoveSection(index, offset) {
      const { key } = this.draft.sections[index];
      this.$store.commit("legalPages/MOVE_SECTION", {
        slug: this.activeSlug,
        index,
        offset,
      });
      const [preferred, other] = offset < 0 ? ["up", "down"] : ["down", "up"];
      this.$nextTick(() => {
        const button = document.getElementById(`${key}-${preferred}`);
        focusById(button.disabled ? `${key}-${other}` : button.id);
      });
    },
    async removeSection(index) {
      const { heading, text } = this.draft.sections[index];
      if (heading.trim() || text.trim()) {
        const { isConfirmed } = await Swal.fire({
          icon: "warning",
          title: "¿Eliminar esta sección?",
          text: "Si cambias de idea, usa Descartar cambios antes de guardar.",
          showCancelButton: true,
          confirmButtonText: "Eliminar",
          cancelButtonText: "Cancelar",
          reverseButtons: true,
        });
        if (!isConfirmed) return;
      }
      this.$store.commit("legalPages/REMOVE_SECTION", {
        slug: this.activeSlug,
        index,
      });
      const { sections } = this.draft;
      const neighbor = sections[Math.min(index, sections.length - 1)];
      this.$nextTick(() => focusById(`${neighbor.key}-heading`));
    },
    discardChanges() {
      this.$store.commit("legalPages/RESET_DRAFT", this.activeSlug);
      this.$set(this.showErrors, this.activeSlug, false);
    },
    focusFirstInvalid() {
      const field =
        this.$refs.panel.$el.querySelector('[aria-invalid="true"]') ||
        this.$refs.pageError;
      if (field) field.focus();
    },
    async save() {
      const slug = this.activeSlug;
      this.$set(this.showErrors, slug, true);
      if (this.hasDraftErrors(slug)) {
        this.$nextTick(this.focusFirstInvalid);
        return;
      }
      this.saving = true;
      const saved = await this.savePage(slug);
      this.saving = false;
      if (saved) this.$set(this.showErrors, slug, false);
    },
    warnBeforeUnload(event) {
      if (!this.dirtySlugs.length) return;
      event.preventDefault();
      event.returnValue = "";
    },
  },
};
</script>

<style scoped>
.legal-admin :where(h1, p, ol) {
  margin: 0;
  padding: 0;
}

.legal-admin {
  min-height: calc(100vh - 64px);
}

.legal-admin__container {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px;
}

.legal-admin__header {
  margin-bottom: 24px;
}

.legal-admin__title {
  font-size: 40px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.legal-admin__subtitle {
  margin-top: 6px;
  max-width: 70ch;
  font-size: 16px;
  color: var(--planes-text-muted);
}

.legal-admin__state {
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

.legal-admin__state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--planes-text);
}

.plans-theme .legal-admin__tabs.v-tabs ::v-deep .v-tabs-bar {
  height: auto;
  background: transparent;
  border-bottom: 1px solid var(--planes-divider);
}

.plans-theme .legal-admin__tabs.v-tabs ::v-deep .v-tabs-slider {
  background-color: var(--planes-accent);
}

.plans-theme .legal-admin__tabs .legal-admin__tab.v-tab {
  flex: 1 1 0;
  gap: 8px;
  min-width: 0;
  max-width: none;
  min-height: 48px;
  padding: 0 12px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: normal;
  text-transform: none;
  color: var(--planes-text-muted);
  transition: color 0.2s, background-color 0.2s;
}

.plans-theme .legal-admin__tabs .legal-admin__tab.v-tab::before {
  display: none;
}

.plans-theme .legal-admin__tabs .legal-admin__tab.v-tab:hover {
  color: var(--planes-text);
  background: var(--planes-overlay-hover);
}

.plans-theme .legal-admin__tabs .legal-admin__tab.v-tab.v-tab--active {
  color: var(--planes-accent);
  background: var(--planes-accent-tint);
}

.legal-admin__tab-short {
  display: none;
}

.legal-admin__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--planes-accent);
}

.legal-admin__panel {
  display: grid;
  gap: 20px;
  padding-top: 20px;
}

.legal-admin__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 16px;
  font-size: 14px;
  color: var(--planes-text-muted);
}

.legal-admin__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  font-weight: 600;
  color: var(--planes-accent);
  text-decoration: none;
}

.legal-admin__link:hover {
  text-decoration: underline;
}

.legal-admin__notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-left: 4px solid var(--planes-star);
  border-radius: var(--planes-radius-control);
  background: var(--planes-overlay-faint);
  font-size: 14px;
  color: var(--planes-text);
}

.plans-theme .legal-admin__notice .v-icon.v-icon {
  font-size: 20px;
  line-height: 1;
  color: var(--planes-text-muted);
}

.legal-admin__error {
  font-size: 14px;
  color: var(--planes-danger);
}

.legal-admin__sections {
  display: grid;
  gap: 16px;
  list-style: none;
}

.legal-admin__fields {
  display: contents;
}

.plans-theme .legal-admin__add.v-btn {
  width: 100%;
}

.legal-admin__hint {
  margin: -12px 0 0;
  font-size: 13px;
  color: var(--planes-text-subtle);
}

.legal-admin__bar {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--planes-divider);
  background: var(--planes-bg);
}

.legal-admin__status {
  font-size: 14px;
  color: var(--planes-text-muted);
}

.legal-admin__bar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.plans-theme .legal-admin__tabs .legal-admin__tab.v-tab:focus-visible,
.legal-admin__link:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .plans-theme .legal-admin__tabs .legal-admin__tab.v-tab {
    transition: none;
  }
}

@media (max-width: 600px) {
  .legal-admin__container {
    padding: 16px;
  }

  .legal-admin__title {
    font-size: 30px;
  }

  .legal-admin__tab-long {
    display: none;
  }

  .legal-admin__tab-short {
    display: inline;
  }

  .legal-admin__bar-actions {
    width: 100%;
  }

  .legal-admin__bar-actions .plans-button {
    flex: 1;
  }
}
</style>
