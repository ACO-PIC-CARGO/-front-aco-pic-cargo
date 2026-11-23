<script setup lang="ts">
import { ref } from "vue";
import type { SaveChoice } from "./requestAfterSave";

const TITLE = "Guardar cotización";

const open = ref(false);
let answer: ((choice: SaveChoice | null) => void) | null = null;

function ask(): Promise<SaveChoice | null> {
  open.value = true;
  return new Promise((resolve) => {
    answer = resolve;
  });
}

function choose(choice: SaveChoice | null) {
  open.value = false;
  answer?.(choice);
  answer = null;
}

defineExpose({ ask });
</script>

<template>
  <v-dialog
    :model-value="open"
    max-width="705"
    :aria-label="TITLE"
    @update:model-value="choose(null)"
  >
    <v-card
      class="save-choice"
      rounded="lg"
    >
      <span class="save-choice__icon bg-blue-lighten-5">
        <v-icon
          icon="mdi-file-document-edit-outline"
          color="blue-accent-4"
          size="68"
        />
      </span>
      <h2 class="save-choice__title text-indigo-darken-4">
        Guardar COTIZACIÓN
      </h2>
      <p class="save-choice__question bg-blue-lighten-5">
        ¿Quieres solicitar la cotización a <span class="save-choice__pricing text-blue-accent-4">PRICING</span> al guardarla?
      </p>

      <div class="save-choice__actions">
        <v-btn
          class="save-choice__cancel"
          variant="flat"
          color="grey-lighten-3"
          height="56"
          rounded="lg"
          prepend-icon="mdi-close"
          @click="choose(null)"
        >
          CANCELAR
        </v-btn>
        <v-btn
          class="save-choice__save"
          variant="tonal"
          color="blue-accent-4"
          height="56"
          rounded="lg"
          prepend-icon="mdi-content-save-outline"
          @click="choose('save_only')"
        >
          SOLO GUARDAR
        </v-btn>
        <v-btn
          class="save-choice__request"
          variant="flat"
          color="blue-accent-4"
          height="63"
          rounded="lg"
          @click="choose('save_and_request')"
        >
          <template #prepend>
            <v-icon
              icon="mdi-send-outline"
              size="32"
            />
          </template>
          GUARDAR Y SOLICITAR
          <br>
          A PRICING
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.save-choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 29px 11px 36px;
}

.save-choice__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 118px;
  height: 118px;
  border-radius: 50%;
}

.save-choice__title {
  margin: 16px 0 0;
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.02em;
  text-align: center;
}

.save-choice__question {
  width: 100%;
  max-width: 641px;
  margin: 27px 0 0;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 1.4375rem;
  line-height: 1.35;
  text-align: center;
}

.save-choice__pricing {
  font-size: 1.5625rem;
  font-weight: 700;
}

.save-choice__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 40px;
}

.save-choice__actions .v-btn {
  font-size: 1.1875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1.22;
}

.save-choice__cancel {
  width: 160px;
}

.save-choice__save {
  width: 208px;
}

.save-choice__request {
  width: 294px;
}

@media (max-width: 599px) {
  .save-choice__title {
    font-size: 2rem;
  }

  .save-choice__question {
    font-size: 1.125rem;
  }

  .save-choice__pricing {
    font-size: 1.25rem;
  }

  .save-choice__actions .v-btn {
    flex: 1 1 100%;
  }
}
</style>
