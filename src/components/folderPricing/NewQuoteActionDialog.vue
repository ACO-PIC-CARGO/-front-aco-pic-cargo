<script setup lang="ts">
import { ref } from "vue";
import colors from "vuetify/util/colors";
import type { SaveChoice } from "./PricingRequest/requestAfterSave";

defineProps<{ canSave: boolean; canRequest: boolean; warning: string | null }>();

type NewQuoteAction = SaveChoice | "quote";

const TITLE = "Cotizar";

const open = ref(false);
let answer: ((action: NewQuoteAction | null) => void) | null = null;

function ask(): Promise<NewQuoteAction | null> {
  open.value = true;
  return new Promise((resolve) => {
    answer = resolve;
  });
}

function choose(action: NewQuoteAction | null) {
  open.value = false;
  answer?.(action);
  answer = null;
}

defineExpose({ ask });
</script>

<template>
  <v-dialog
    :model-value="open"
    max-width="920"
    persistent
    :aria-label="TITLE"
  >
    <v-card
      class="quote-action"
      rounded="xl"
    >
      <v-btn
        class="quote-action__close"
        icon="mdi-close"
        variant="text"
        aria-label="Cerrar"
        @click="choose(null)"
      />
      <div class="quote-action__header">
        <span
          class="quote-action__icon bg-blue-lighten-5"
          :style="{ borderColor: colors.blue.lighten2 }"
        >
          <v-icon
            icon="mdi-file-question-outline"
            color="blue-darken-3"
            size="60"
          />
        </span>
        <span
          class="quote-action__divider"
          aria-hidden="true"
        />
        <div class="quote-action__text">
          <h2 class="quote-action__title text-indigo-darken-4">
            {{ TITLE }}
          </h2>
          <p class="quote-action__question text-medium-emphasis">
            ¿Qué deseas hacer con esta cotización?
          </p>
        </div>
      </div>
      <v-alert
        v-if="warning"
        class="quote-action__warning"
        type="warning"
        variant="tonal"
        density="compact"
        :text="warning"
      />
      <div class="quote-action__actions">
        <v-btn
          v-if="canSave"
          class="text-none"
          variant="outlined"
          height="56"
          rounded="lg"
          prepend-icon="mdi-content-save-outline"
          @click="choose('save_only')"
        >
          Guardar
        </v-btn>
        <v-btn
          class="text-none"
          variant="flat"
          color="green-darken-1"
          height="56"
          rounded="lg"
          prepend-icon="mdi-play-outline"
          @click="choose('quote')"
        >
          Pasar a Cotizar
        </v-btn>
        <v-btn
          v-if="canRequest"
          class="text-none"
          variant="flat"
          color="blue-darken-3"
          height="56"
          rounded="lg"
          prepend-icon="mdi-send-outline"
          @click="choose('save_and_request')"
        >
          Solicitar a Pricing
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.quote-action {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 40px 36px;
}

.quote-action__close {
  position: absolute;
  top: 12px;
  right: 12px;
}

.quote-action__header {
  display: flex;
  align-items: center;
  gap: 28px;
  padding-right: 32px;
}

.quote-action__icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 112px;
  height: 112px;
  border: 3px solid;
  border-radius: 50%;
}

.quote-action__divider {
  align-self: stretch;
  width: 2px;
  background: rgba(var(--v-theme-on-surface), 0.12);
}

.quote-action__title {
  margin: 0;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.1;
}

.quote-action__question {
  margin: 4px 0 0;
  font-size: 1.5rem;
  line-height: 1.3;
}

.quote-action__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 16px;
}

.quote-action__actions .v-btn {
  min-width: 200px;
  font-size: 1.25rem;
  font-weight: 700;
}

@media (max-width: 599px) {
  .quote-action {
    padding: 24px 16px;
  }

  .quote-action__header {
    flex-direction: column;
    gap: 12px;
    padding-right: 0;
    text-align: center;
  }

  .quote-action__divider {
    display: none;
  }

  .quote-action__icon {
    width: 88px;
    height: 88px;
  }

  .quote-action__title {
    font-size: 2rem;
  }

  .quote-action__question {
    font-size: 1.125rem;
  }

  .quote-action__actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
