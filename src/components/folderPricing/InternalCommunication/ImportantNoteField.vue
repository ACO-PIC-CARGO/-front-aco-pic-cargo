<script setup lang="ts">
import { ref, watch } from "vue";
import { usePricingStore } from "@/stores/pricing";
import { getInternalMessages } from "./internalCommunicationApi";

const props = defineProps<{ quoteId: number | null }>();

const NO_MESSAGES = "TMSGINF";
const LOAD_FAILED = "No pudimos cargar la nota importante. Recarga la página para verla.";

const pricingStore = usePricingStore();
const creationNote = ref<string | null>(null);
const loadError = ref("");

async function loadCreationNote(quoteId: number) {
  try {
    const response = await getInternalMessages(quoteId);
    if (quoteId !== props.quoteId) return;
    creationNote.value = response.estadoflag ? (response.data.find((message) => message.is_creation_note)?.body ?? null) : null;
    loadError.value = response.estadoflag || response.tipomensaje === NO_MESSAGES ? "" : LOAD_FAILED;
  } catch {
    if (quoteId === props.quoteId) loadError.value = LOAD_FAILED;
  }
}

watch(
  () => props.quoteId,
  (quoteId) => {
    creationNote.value = null;
    loadError.value = "";
    if (quoteId !== null) loadCreationNote(quoteId);
  },
  { immediate: true },
);
</script>

<template>
  <section
    class="important-note"
    aria-labelledby="important-note-title"
  >
    <div class="important-note__banner">
      <v-icon
        icon="mdi-alert"
        class="important-note__icon"
      />
      <span
        class="important-note__divider"
        aria-hidden="true"
      />
      <h2
        id="important-note-title"
        class="important-note__title"
      >
        NOTA IMPORTANTE
      </h2>
    </div>
    <div
      v-if="quoteId === null"
      class="important-note__body"
    >
      <label
        for="important-note-input"
        class="d-sr-only"
      >Nota importante</label>
      <v-textarea
        id="important-note-input"
        v-model="pricingStore.datosPrincipales.pricing_notes"
        placeholder="Escribe lo que Pricing debe saber de esta cotización. Al guardarla queda fija y ya no se puede editar."
        variant="outlined"
        rows="3"
        auto-grow
        hide-details
      />
    </div>
    <template v-else>
      <p
        v-if="creationNote"
        class="important-note__body important-note__saved"
      >
        {{ creationNote }}
      </p>
      <p
        v-if="loadError"
        class="important-note__body text-error"
      >
        {{ loadError }}
      </p>
      <p class="important-note__help">
        <v-icon
          icon="mdi-information-outline"
          size="18"
        />
        Para notas importantes usa el historial de comunicación
        <v-icon
          icon="mdi-arrow-bottom-right"
          size="20"
          aria-hidden="true"
        />
        <span
          class="important-note__fab"
          aria-hidden="true"
        >H</span>
      </p>
    </template>
  </section>
</template>

<style scoped>
.important-note {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.important-note__banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgb(var(--v-theme-warning));
  border-radius: 8px;
  background: rgba(var(--v-theme-warning), 0.12);
}

.important-note__icon {
  color: rgb(var(--v-theme-warning));
  font-size: 48px;
}

.important-note__divider {
  align-self: stretch;
  width: 2px;
  margin: 4px 0;
  background: rgba(var(--v-theme-on-surface), 0.35);
}

.important-note__title {
  margin: 0;
  color: rgb(var(--v-theme-error));
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.2;
}

.important-note__body {
  width: 100%;
  max-width: 760px;
  margin: 0;
}

.important-note__saved {
  padding: 12px 16px;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.important-note__help {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 0;
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.important-note__fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  font-weight: 800;
}

@media (max-width: 599px) {
  .important-note__banner {
    gap: 12px;
  }

  .important-note__icon {
    font-size: 32px;
  }

  .important-note__title {
    font-size: 1.5rem;
  }
}
</style>
