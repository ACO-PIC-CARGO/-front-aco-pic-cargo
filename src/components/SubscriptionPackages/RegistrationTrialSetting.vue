<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
import { useSubscriptionsStore } from "@/stores/subscriptions";

const subscriptionsStore = useSubscriptionsStore();
const { registrationTrialDays: days, registrationTrialDaysError } = storeToRefs(subscriptionsStore);

const loadState = ref("loading");
const errorMessage = ref("");
const submitted = ref(false);
const saving = ref(false);
const input = useTemplateRef("input");

const error = computed(() => (submitted.value && registrationTrialDaysError.value) || "");

onMounted(() => {
  load();
});

async function load() {
  loadState.value = "loading";
  const message = await subscriptionsStore.loadRegistrationTrialSetting();
  errorMessage.value = message || "";
  loadState.value = message ? "error" : "ready";
}
async function save() {
  submitted.value = true;
  if (error.value) {
    input.value!.focus();
    return;
  }
  saving.value = true;
  const saved = await subscriptionsStore.saveRegistrationTrialSetting();
  saving.value = false;
  if (saved) submitted.value = false;
}
</script>

<template>
  <div class="trial-setting">
    <p
      v-if="loadState === 'loading'"
      class="trial-setting__state"
      aria-busy="true"
    >
      <v-icon class="mdi-spin">
        mdi-loading
      </v-icon>
      Cargando los días de prueba…
    </p>

    <div
      v-else-if="loadState === 'error'"
      class="trial-setting__state"
      role="alert"
    >
      <p>No pudimos cargar los días de prueba. {{ errorMessage }}</p>
      <v-btn
        variant="text"
        class="plans-button plans-button--secondary"
        @click="load"
      >
        Reintentar
      </v-btn>
    </div>

    <v-form
      v-else
      @submit.prevent="save"
    >
      <div class="trial-setting__days">
        <v-text-field
          id="registration-trial-days"
          ref="input"
          v-model="days"
          class="trial-setting__input"
          type="number"
          min="1"
          max="365"
          step="1"
          inputmode="numeric"
          label="Prueba gratis al registrarse"
          suffix="días"
          hint="Aplica a las empresas que se registren desde ahora."
          persistent-hint
          :error-messages="error"
          :disabled="saving"
          variant="outlined"
          density="compact"
        />
        <v-btn
          variant="text"
          type="submit"
          class="plans-button plans-button--primary"
          :disabled="saving"
        >
          <v-icon
            v-if="saving"
            class="mdi-spin"
          >
            mdi-loading
          </v-icon>
          {{ saving ? "Guardando…" : "Guardar" }}
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<style scoped>
.trial-setting {
  margin-bottom: 28px;
  padding: 20px 24px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
  box-shadow: var(--planes-card-shadow);
}

.trial-setting :where(p) {
  margin: 0;
}

.trial-setting__days {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
  color: var(--planes-text-muted);
}

.trial-setting__days .plans-button {
  margin-left: 8px;
}

.trial-setting__input.v-text-field {
  flex: 0 1 360px;
  min-width: 0;
  margin: 0;
  padding: 0;
}

.trial-setting__state {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  color: var(--planes-text-muted);
}

@media (max-width: 600px) {
  .trial-setting {
    padding: 16px;
  }

  .trial-setting__days .plans-button {
    width: 100%;
    margin-left: 0;
  }
}
</style>
