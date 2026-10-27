<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import router from "@/router";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { sessionUser } from "@/utils/sesion";
import { authorizationLabel } from "./stepValidation";
import type { HouseTrackingStep } from "@/types/houseTracking";

type Choice = "skip" | "keep" | "update";

const OPTIONS: { value: Choice; icon: string; title: string; description: string; note?: string }[] = [
  { value: "skip", icon: "mdi-clock-outline", title: "Omitir por ahora", description: "Continuar y revisar después." },
  {
    value: "keep",
    icon: "mdi-calendar-check-outline",
    title: "Mantener tarifa de flete",
    description: "La tarifa se mantiene a la fecha de salida.",
    note: "Se registrará el asesor y la fecha de confirmación.",
  },
  {
    value: "update",
    icon: "mdi-file-document-edit-outline",
    title: "Actualizar cotización",
    description: "Ir a la cotización para actualizar la tarifa.",
  },
];

const props = defineProps<{ houseId: number; step: HouseTrackingStep | null }>();
const open = defineModel<boolean>({ default: false });
const emit = defineEmits<{ skip: []; kept: [] }>();

const store = useHouseTrackingStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const screen = ref<"choose" | "keep">("choose");
const choice = ref<Choice>("skip");
const advisor = ref("");
const authorizedAt = ref("");
const keeping = ref(false);
const keepError = ref("");

watch(open, (isOpen) => {
  if (!isOpen) return;
  screen.value = "choose";
  choice.value = "skip";
});

function continueChoice() {
  if (choice.value === "skip") {
    open.value = false;
    emit("skip");
    return;
  }
  if (choice.value === "update") {
    const quoteUrl = router.resolve(`/home/folderPricing/verQuote/${props.step!.quote_validity!.quote_id}`).href;
    window.open(quoteUrl, "_blank", "noopener");
    open.value = false;
    return;
  }
  advisor.value = sessionUser().nombrecompleto;
  authorizedAt.value = authorizationLabel(new Date(), timeZone.value);
  keepError.value = "";
  screen.value = "keep";
}

async function keepRate() {
  keeping.value = true;
  keepError.value = (await store.keepRate(props.houseId, props.step!.id)) ?? "";
  keeping.value = false;
  if (keepError.value) return;
  open.value = false;
  emit("kept");
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="640"
    content-class="aco-ui"
  >
    <v-card class="aco-card">
      <div class="d-flex align-center px-4 pt-4">
        <v-btn
          v-if="screen === 'keep'"
          variant="text"
          prepend-icon="mdi-chevron-left"
          class="text-none"
          @click="screen = 'choose'"
        >
          Volver
        </v-btn>
        <v-spacer />
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="open = false"
        />
      </div>

      <template v-if="screen === 'choose'">
        <div class="text-center px-6">
          <v-avatar
            size="64"
            variant="tonal"
          >
            <v-icon
              icon="mdi-file-minus-outline"
              size="32"
            />
          </v-avatar>
          <h2 class="text-headline-small font-weight-bold mt-3">
            Cotización vencida
          </h2>
          <p class="text-body-large text-medium-emphasis mt-1">
            La fecha de salida supera la vigencia de la cotización.
          </p>
        </div>
        <v-card-text class="px-6">
          <v-radio-group
            v-model="choice"
            hide-details
          >
            <div
              v-for="option in OPTIONS"
              :key="option.value"
              class="quote-option mb-3"
              :class="{ 'quote-option--selected': choice === option.value }"
              @click="choice = option.value"
            >
              <v-radio
                :value="option.value"
                color="primary"
              >
                <template #label>
                  <div class="d-flex align-start ga-3 py-1 w-100">
                    <v-avatar
                      size="44"
                      variant="tonal"
                      :color="choice === option.value ? 'primary' : undefined"
                    >
                      <v-icon :icon="option.icon" />
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-title-medium font-weight-bold text-high-emphasis">
                        {{ option.title }}
                      </div>
                      <div class="text-body-medium text-medium-emphasis">
                        {{ option.description }}
                      </div>
                      <div
                        v-if="option.note"
                        class="quote-option__note d-flex align-center ga-2 mt-2 pa-2 text-body-small"
                      >
                        <v-icon
                          icon="mdi-account-outline"
                          size="18"
                        />
                        {{ option.note }}
                      </div>
                    </div>
                  </div>
                </template>
              </v-radio>
            </div>
          </v-radio-group>
        </v-card-text>
      </template>

      <template v-else>
        <div class="text-center px-6">
          <v-avatar
            size="64"
            variant="tonal"
          >
            <v-icon
              icon="mdi-calendar-check-outline"
              size="32"
            />
          </v-avatar>
          <h2 class="text-headline-small font-weight-bold mt-3">
            Confirmar tarifa de flete
          </h2>
          <p class="text-body-large text-medium-emphasis mt-1">
            Se mantendrá la tarifa de la cotización a la fecha de salida.
          </p>
        </div>
        <v-card-text class="px-6">
          <div class="quote-summary pa-4">
            <div class="d-flex align-center ga-4">
              <v-avatar
                size="44"
                variant="tonal"
              >
                <v-icon icon="mdi-account-outline" />
              </v-avatar>
              <div>
                <div class="text-body-medium text-medium-emphasis">
                  Asesor que autoriza
                </div>
                <div class="text-title-medium font-weight-bold">
                  {{ advisor }}
                </div>
              </div>
            </div>
            <div class="border-t my-3" />
            <div class="d-flex align-center ga-4">
              <v-avatar
                size="44"
                variant="tonal"
              >
                <v-icon icon="mdi-clock-outline" />
              </v-avatar>
              <div>
                <div class="text-body-medium text-medium-emphasis">
                  Fecha y hora de autorización
                </div>
                <div class="text-title-medium font-weight-bold">
                  {{ authorizedAt }}
                </div>
              </div>
            </div>
          </div>
          <v-alert
            type="info"
            variant="tonal"
            class="mt-4"
            text="Al continuar, se mantendrá la tarifa de flete de esta cotización a la fecha de salida."
          />
          <v-alert
            v-if="keepError"
            type="warning"
            variant="tonal"
            class="mt-3"
            :text="keepError"
          />
        </v-card-text>
      </template>

      <v-card-actions class="px-6 py-4 border-t">
        <v-spacer />
        <v-btn
          variant="outlined"
          @click="open = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="keeping"
          @click="screen === 'choose' ? continueChoice() : keepRate()"
        >
          Continuar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.quote-option {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  padding: 8px 12px;
  cursor: pointer;
}

.quote-option--selected {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.06);
}

.quote-option__note,
.quote-summary {
  border-radius: 8px;
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.quote-summary {
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
