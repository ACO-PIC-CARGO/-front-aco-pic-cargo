<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useStore } from "vuex";
import "@/styles/plans-theme.css";
import LegalSectionEditor from "./LegalSectionEditor.vue";
import { useLegalPagesStore } from "@/stores/legalPages";
import type { LegalDraftErrors, LegalSectionDraft } from "@/types/legal";

interface PageView {
  label: string;
  shortLabel: string;
  route: string;
}

const PAGE_VIEWS: Record<string, PageView> = {
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

const NO_ERRORS: LegalDraftErrors = { size: "", title: "", sections: "", items: [] };

const focusById = (id: string) => {
  const element = document.getElementById(id);
  if (element) element.focus();
};

const rootStore = useStore();
const legalPagesStore = useLegalPagesStore();
const { pages, drafts, limits, dirtySlugs } = storeToRefs(legalPagesStore);
const { formatUpdatedAt, draftErrors, hasDraftErrors, placeholders } = legalPagesStore;

const showErrors = ref<Record<string, boolean>>({});
const activeSlug = ref("");
const loadState = ref("loading");
const errorMessage = ref("");
const saving = ref(false);
const panel = useTemplateRef("panel");
const pageError = useTemplateRef("pageError");

const activePage = computed(() => pages.value.find((page) => page.slug === activeSlug.value)!);
const draft = computed(() => drafts.value[activeSlug.value]!);
const draftTitle = computed({
  get: () => draft.value.title,
  set: (title: string) => {
    legalPagesStore.drafts[activeSlug.value]!.title = title;
  },
});
const errors = computed(() =>
  showErrors.value[activeSlug.value] ? draftErrors(activeSlug.value) : NO_ERRORS,
);
const isAtSectionLimit = computed(() => draft.value.sections.length >= limits.value.sections);
const isActiveDirty = computed(() => dirtySlugs.value.includes(activeSlug.value));
const activePlaceholders = computed(() => placeholders(activeSlug.value));

onBeforeRouteLeave(async () => {
  if (saving.value) return false;
  if (!dirtySlugs.value.length) return;
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    title: "Tienes cambios sin guardar",
    text: "Si sales ahora, se perderán.",
    showCancelButton: true,
    confirmButtonText: "Salir sin guardar",
    cancelButtonText: "Seguir editando",
    reverseButtons: true,
  });
  return isConfirmed;
});

onMounted(() => {
  rootStore.state.mainTitle = "PÁGINAS LEGALES";
  window.addEventListener("beforeunload", warnBeforeUnload);
  load();
});

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", warnBeforeUnload);
});

function pageView(slug: string) {
  return PAGE_VIEWS[slug]!;
}
async function load() {
  loadState.value = "loading";
  const error = await legalPagesStore.loadPages();
  if (error) {
    errorMessage.value = error;
    loadState.value = "error";
    return;
  }
  showErrors.value = {};
  if (!activeSlug.value && pages.value.length) {
    activeSlug.value = pages.value[0]!.slug;
  }
  loadState.value = "ready";
}
function updateSection(index: number, section: LegalSectionDraft) {
  legalPagesStore.drafts[activeSlug.value]!.sections.splice(index, 1, section);
}
function addSection() {
  legalPagesStore.addSection(activeSlug.value);
  const section = draft.value.sections[draft.value.sections.length - 1]!;
  nextTick(() => focusById(`${section.key}-heading`));
}
function onMoveSection(index: number, offset: number) {
  const { key } = draft.value.sections[index]!;
  legalPagesStore.moveSection({
    slug: activeSlug.value,
    index,
    offset,
  });
  const [preferred, other] = offset < 0 ? ["up", "down"] : ["down", "up"];
  nextTick(() => {
    const button = document.getElementById(`${key}-${preferred}`) as HTMLButtonElement;
    focusById(button.disabled ? `${key}-${other}` : button.id);
  });
}
async function removeSection(index: number) {
  const { heading, text } = draft.value.sections[index]!;
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
  legalPagesStore.drafts[activeSlug.value]!.sections.splice(index, 1);
  const { sections } = draft.value;
  const neighbor = sections[Math.min(index, sections.length - 1)]!;
  nextTick(() => focusById(`${neighbor.key}-heading`));
}
function discardChanges() {
  legalPagesStore.resetDraft(activeSlug.value);
  showErrors.value[activeSlug.value] = false;
}
function focusFirstInvalid() {
  const field =
    (panel.value!.$el as HTMLElement).querySelector<HTMLElement>('[aria-invalid="true"]') ||
    pageError.value;
  if (field) field.focus();
}
async function save() {
  const slug = activeSlug.value;
  showErrors.value[slug] = true;
  if (hasDraftErrors(slug)) {
    nextTick(focusFirstInvalid);
    return;
  }
  saving.value = true;
  const saved = await legalPagesStore.savePage(slug);
  saving.value = false;
  if (saved) showErrors.value[slug] = false;
}
function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirtySlugs.value.length) return;
  event.preventDefault();
  event.returnValue = "";
}
</script>

<template>
  <div class="legal-admin plans-theme plans-theme--app">
    <div class="legal-admin__container">
      <header class="legal-admin__header">
        <h1 class="legal-admin__title">
          Páginas legales
        </h1>
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
        <v-icon class="mdi-spin">
          mdi-loading
        </v-icon>
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
        <v-btn
          variant="text"
          class="plans-button plans-button--secondary"
          @click="load"
        >
          Reintentar
        </v-btn>
      </div>

      <div
        v-else-if="!pages.length"
        class="legal-admin__state"
      >
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
            :value="page.slug"
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
              <span
                class="legal-admin__dot"
                aria-hidden="true"
              />
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
              <strong>{{ activePlaceholders.join(", ") }}</strong>.
            </span>
          </p>

          <fieldset
            class="legal-admin__fields"
            :disabled="saving"
          >
            <v-text-field
              id="legal-page-title"
              v-model="draftTitle"
              label="Título de la página"
              autocomplete="off"
              :maxlength="limits.title"
              :counter="limits.title"
              :error-messages="errors.title"
              :aria-invalid="String(Boolean(errors.title))"
              variant="outlined"
              density="compact"
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
                :model-value="section"
                :index="index"
                :count="draft.sections.length"
                :errors="errors.items[index]"
                @update:model-value="updateSection(index, $event)"
                @move="onMoveSection(index, $event)"
                @remove="removeSection(index)"
              />
            </ol>

            <v-btn
              variant="text"
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
            <p
              class="legal-admin__status"
              role="status"
            >
              {{
                isActiveDirty
                  ? "Tienes cambios sin guardar."
                  : "Todo está guardado."
              }}
            </p>
            <div class="legal-admin__bar-actions">
              <v-btn
                variant="text"
                class="plans-button plans-button--ghost"
                :disabled="!isActiveDirty || saving"
                @click="discardChanges"
              >
                Descartar cambios
              </v-btn>
              <v-btn
                variant="text"
                type="submit"
                class="plans-button plans-button--primary"
                :disabled="!isActiveDirty || saving"
              >
                <v-icon
                  v-if="saving"
                  class="mdi-spin"
                >
                  mdi-loading
                </v-icon>
                {{ saving ? "Guardando…" : "Guardar cambios" }}
              </v-btn>
            </div>
          </div>
        </v-form>
      </template>
    </div>
  </div>
</template>

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

.plans-theme .legal-admin__tabs.v-tabs {
  height: auto;
  background: transparent;
  border-bottom: 1px solid var(--planes-divider);
}

.plans-theme .legal-admin__tabs.v-tabs :deep(.v-tab__slider) {
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

.plans-theme .legal-admin__tabs .legal-admin__tab.v-tab.v-tab--selected {
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
