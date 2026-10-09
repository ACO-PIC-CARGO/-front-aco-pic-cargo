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
        <i class="mdi mdi-loading mdi-spin" aria-hidden="true"></i>
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
        <button
          type="button"
          class="plans-button plans-button--secondary"
          @click="loadPages"
        >
          Reintentar
        </button>
      </div>

      <div v-else-if="!pages.length" class="legal-admin__state">
        <p class="legal-admin__state-title">
          Todavía no hay páginas legales para editar. Avísale a soporte.
        </p>
      </div>

      <template v-else>
        <div
          class="legal-admin__tabs"
          role="tablist"
          aria-label="Páginas legales"
          @keydown="onTabKeydown"
        >
          <button
            v-for="page in pages"
            :id="`tab-${page.slug}`"
            :key="page.slug"
            type="button"
            role="tab"
            class="legal-admin__tab"
            :aria-selected="String(page.slug === activeSlug)"
            :aria-controls="`panel-${page.slug}`"
            :tabindex="page.slug === activeSlug ? 0 : -1"
            @click="activeSlug = page.slug"
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
          </button>
        </div>

        <form
          :id="`panel-${activeSlug}`"
          ref="panel"
          class="legal-admin__panel"
          role="tabpanel"
          :aria-labelledby="`tab-${activeSlug}`"
          novalidate
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
              <i class="mdi mdi-open-in-new" aria-hidden="true"></i> Ver página
              publicada
            </router-link>
          </div>

          <p v-if="placeholders.length" class="legal-admin__notice" role="note">
            <i class="mdi mdi-alert-circle-outline" aria-hidden="true"></i>
            <span>
              Reemplaza estos datos entre corchetes por los reales:
              <strong>{{ placeholders.join(", ") }}</strong
              >.
            </span>
          </p>

          <fieldset class="legal-admin__fields" :disabled="saving">
            <FormField
              label="Título de la página"
              input-id="legal-page-title"
              :error="errors.title"
            >
              <template #default="field">
                <input
                  id="legal-page-title"
                  v-model="draft.title"
                  class="legal-admin__input"
                  type="text"
                  autocomplete="off"
                  :maxlength="limits.title"
                  :aria-describedby="field.describedby"
                  :aria-invalid="String(field.invalid)"
                />
              </template>
            </FormField>

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
                v-model="draft.sections[index]"
                :index="index"
                :count="draft.sections.length"
                :errors="errors.items[index]"
                @move="onMoveSection(index, $event)"
                @remove="removeSection(index)"
              />
            </ol>

            <button
              type="button"
              class="plans-button plans-button--secondary legal-admin__add"
              :disabled="isAtSectionLimit"
              :aria-describedby="
                isAtSectionLimit ? 'legal-section-limit' : null
              "
              @click="addSection"
            >
              <i class="mdi mdi-plus" aria-hidden="true"></i> Agregar sección
            </button>
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
              <button
                type="button"
                class="plans-button plans-button--ghost"
                :disabled="!isActiveDirty || saving"
                @click="discardChanges"
              >
                Descartar cambios
              </button>
              <button
                type="submit"
                class="plans-button plans-button--primary"
                :disabled="!isActiveDirty || saving"
              >
                <i
                  v-if="saving"
                  class="mdi mdi-loading mdi-spin"
                  aria-hidden="true"
                ></i>
                {{ saving ? "Guardando…" : "Guardar cambios" }}
              </button>
            </div>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<script>
import Swal from "sweetalert2";
import "@/styles/plans-theme.css";
import FormField from "@/components/SubscriptionPackages/FormField.vue";
import { isEmptyResult } from "@/api/subscriptionPackages";
import { fetchLegalPages, saveLegalPage } from "@/api/legalPages";
import { notifySuccess } from "@/views/MyPlan/planPurchase";
import LegalSectionEditor from "./LegalSectionEditor.vue";
import {
  LEGAL_LIMITS,
  emptySection,
  findPlaceholders,
  formatUpdatedAt,
  hasErrors,
  isDirty,
  moveSection,
  toDraft,
  toPayload,
  validateDraft,
} from "./legalPageEditor";

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
  components: { FormField, LegalSectionEditor },
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
    pages: [],
    drafts: {},
    showErrors: {},
    activeSlug: "",
    loadState: "loading",
    errorMessage: "",
    saving: false,
    limits: LEGAL_LIMITS,
  }),
  computed: {
    activePage() {
      return this.pages.find((page) => page.slug === this.activeSlug);
    },
    draft() {
      return this.drafts[this.activeSlug];
    },
    errors() {
      return this.showErrors[this.activeSlug]
        ? validateDraft(this.draft)
        : NO_ERRORS;
    },
    dirtySlugs() {
      return this.pages
        .filter((page) => isDirty(this.drafts[page.slug], page))
        .map((page) => page.slug);
    },
    isAtSectionLimit() {
      return this.draft.sections.length >= this.limits.sections;
    },
    isActiveDirty() {
      return this.dirtySlugs.includes(this.activeSlug);
    },
    placeholders() {
      return findPlaceholders(this.draft);
    },
  },
  mounted() {
    this.$store.state.mainTitle = "PÁGINAS LEGALES";
    window.addEventListener("beforeunload", this.warnBeforeUnload);
    this.loadPages();
  },
  beforeDestroy() {
    window.removeEventListener("beforeunload", this.warnBeforeUnload);
  },
  methods: {
    formatUpdatedAt,
    pageView(slug) {
      return PAGE_VIEWS[slug];
    },
    async loadPages() {
      this.loadState = "loading";
      const response = await fetchLegalPages();
      if (!response.estadoflag && !isEmptyResult(response)) {
        this.errorMessage = response.mensaje;
        this.loadState = "error";
        return;
      }
      this.pages = response.data;
      this.drafts = Object.fromEntries(
        this.pages.map((page) => [page.slug, toDraft(page)])
      );
      this.showErrors = {};
      if (!this.activeSlug && this.pages.length) {
        this.activeSlug = this.pages[0].slug;
      }
      this.loadState = "ready";
    },
    onTabKeydown(event) {
      const count = this.pages.length;
      const index = this.pages.findIndex(
        (page) => page.slug === this.activeSlug
      );
      const target = {
        ArrowLeft: (index - 1 + count) % count,
        ArrowRight: (index + 1) % count,
        Home: 0,
        End: count - 1,
      }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      this.activeSlug = this.pages[target].slug;
      focusById(`tab-${this.activeSlug}`);
    },
    addSection() {
      const section = emptySection();
      this.draft.sections.push(section);
      this.$nextTick(() => focusById(`${section.key}-heading`));
    },
    onMoveSection(index, offset) {
      const { key } = this.draft.sections[index];
      this.draft.sections = moveSection(this.draft.sections, index, offset);
      const [preferred, other] = offset < 0 ? ["up", "down"] : ["down", "up"];
      this.$nextTick(() => {
        const button = document.getElementById(`${key}-${preferred}`);
        focusById(button.disabled ? `${key}-${other}` : button.id);
      });
    },
    async removeSection(index) {
      const { sections } = this.draft;
      const { heading, text } = sections[index];
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
      sections.splice(index, 1);
      const neighbor = sections[Math.min(index, sections.length - 1)];
      this.$nextTick(() => focusById(`${neighbor.key}-heading`));
    },
    discardChanges() {
      this.drafts[this.activeSlug] = toDraft(this.activePage);
      this.$set(this.showErrors, this.activeSlug, false);
    },
    focusFirstInvalid() {
      const field =
        this.$refs.panel.querySelector('[aria-invalid="true"]') ||
        this.$refs.pageError;
      if (field) field.focus();
    },
    async save() {
      const slug = this.activeSlug;
      const draft = this.drafts[slug];
      this.$set(this.showErrors, slug, true);
      if (hasErrors(validateDraft(draft))) {
        this.$nextTick(this.focusFirstInvalid);
        return;
      }

      this.saving = true;
      const response = await saveLegalPage(slug, toPayload(draft));
      this.saving = false;

      if (!response.estadoflag) {
        Swal.fire({
          icon: response.tipomensaje === "TMSGADV" ? "warning" : "error",
          text: response.mensaje,
        });
        return;
      }
      const saved = response.data[0];
      this.pages = this.pages.map((page) =>
        page.slug === slug ? saved : page
      );
      this.drafts[slug] = toDraft(saved);
      this.$set(this.showErrors, slug, false);
      notifySuccess(response.mensaje);
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

.legal-admin__tabs {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  border-bottom: 1px solid var(--planes-divider);
}

.legal-admin__tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 12px;
  border-bottom: 2px solid transparent;
  font-size: 15px;
  font-weight: 600;
  color: var(--planes-text-muted);
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s;
}

.legal-admin__tab:hover {
  color: var(--planes-text);
  background: var(--planes-overlay-hover);
}

.legal-admin__tab[aria-selected="true"] {
  color: var(--planes-accent);
  border-bottom-color: var(--planes-accent);
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

.legal-admin__notice .mdi {
  font-size: 20px;
  line-height: 1;
  color: var(--planes-text-muted);
}

.legal-admin__panel ::v-deep .legal-admin__input {
  width: 100%;
  min-height: 44px;
  padding: 0 12px;
  border-radius: var(--planes-radius-control);
  border: 1px solid var(--planes-border-strong);
  background: var(--planes-field);
  font-size: 15px;
  color: var(--planes-text);
  transition: border-color 0.2s;
}

.legal-admin__panel ::v-deep .legal-admin__textarea {
  min-height: 140px;
  padding: 10px 12px;
  line-height: 1.5;
  resize: vertical;
  field-sizing: content;
}

.legal-admin__panel ::v-deep .legal-admin__input:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: 1px;
}

.legal-admin__panel ::v-deep .legal-admin__input[aria-invalid="true"] {
  border-color: var(--planes-danger);
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

.legal-admin__add {
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

.legal-admin__tab:focus-visible,
.legal-admin__link:focus-visible {
  outline: 2px solid var(--planes-accent);
  outline-offset: -2px;
}

@media (prefers-reduced-motion: reduce) {
  .legal-admin__tab,
  .legal-admin__panel ::v-deep .legal-admin__input {
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
