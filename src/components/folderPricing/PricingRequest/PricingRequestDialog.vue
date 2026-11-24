<script setup lang="ts">
import { computed } from "vue";
import InternalCommunicationThread from "../InternalCommunication/InternalCommunicationThread.vue";
import type { PricingRequestInfo } from "./pricingRequestApi";

const props = defineProps<{
  quoteId: number;
  info: PricingRequestInfo | null;
  loading: boolean;
  sending: boolean;
  notice: string | null;
  error: string | null;
}>();
const open = defineModel<boolean>("open", { required: true });
const note = defineModel<string>("note", { required: true });
const emit = defineEmits<{ send: [] }>();

const NOT_REGISTERED = "Sin registrar";
// The quote list renders this dialog inside a row's v-btn-toggle; its buttons must not join that group.
const OUTSIDE_BUTTON_GROUPS = { VBtn: { symbol: Symbol("pricing-request-dialog") } };

const quoteFields = computed(() => [
  { id: "pricing-request-quote", label: "QUOTE", icon: "mdi-file-document-edit-outline", value: props.info?.quote_code ?? "" },
  { id: "pricing-request-client", label: "CLIENTE", icon: "mdi-account-outline", value: props.info?.client_name ?? NOT_REGISTERED },
  { id: "pricing-request-transport", label: "TIPO", icon: "mdi-layers-outline", value: props.info?.transport_name ?? NOT_REGISTERED },
  { id: "pricing-request-shipment", label: "SUB TIPO", icon: "mdi-tag-outline", value: props.info?.shipment_label ?? NOT_REGISTERED },
]);
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="680"
    scrollable
  >
    <v-defaults-provider :defaults="OUTSIDE_BUTTON_GROUPS">
      <v-card
        class="pricing-request"
        rounded="lg"
      >
        <header class="pricing-request__header">
          <span class="pricing-request__badge bg-blue-accent-4">
            <v-icon
              icon="mdi-account-group"
              size="30"
            />
          </span>
          <span
            class="pricing-request__rule bg-blue-accent-4"
            aria-hidden="true"
          />
          <h2 class="pricing-request__title text-indigo-darken-4">
            <span>Solicitar a</span>
            <span class="pricing-request__chip bg-blue-accent-3">PRICING</span>
          </h2>
          <v-btn
            icon="mdi-close"
            variant="text"
            aria-label="Cerrar"
            @click="open = false"
          />
        </header>

        <v-card-text class="pricing-request__body">
          <p v-if="loading">
            Cargando los datos de la solicitud…
          </p>
          <template v-else-if="info">
            <div class="pricing-request__question bg-blue-lighten-5">
              <v-icon
                icon="mdi-send-outline"
                color="blue-accent-4"
                size="38"
              />
              <p>
                ¿Deseas solicitar a <span class="text-blue-accent-4">{{ info.pricing_name ?? "PRICING" }}</span> esta cotización?
              </p>
            </div>

            <div class="pricing-request__fields">
              <template
                v-for="(field, index) in quoteFields"
                :key="field.id"
              >
                <label
                  :for="field.id"
                  class="pricing-request__label"
                >
                  <v-icon
                    :icon="field.icon"
                    size="22"
                  />
                  {{ field.label }}
                </label>
                <v-text-field
                  :id="field.id"
                  :model-value="field.value"
                  :class="{ 'pricing-request__quote': index === 0 }"
                  class="pricing-request__value"
                  variant="outlined"
                  density="compact"
                  readonly
                  hide-details
                />
              </template>
              <template v-if="info.can_request">
                <label
                  for="pricing-request-note"
                  class="pricing-request__label pricing-request__label--top"
                >
                  <v-icon
                    icon="mdi-note-text-outline"
                    size="22"
                  />
                  NUEVA NOTA
                </label>
                <v-textarea
                  id="pricing-request-note"
                  v-model="note"
                  placeholder="Escribe lo que Pricing debe saber sobre esta cotización. Se envía junto con la solicitud."
                  variant="outlined"
                  rows="3"
                  auto-grow
                  hide-details
                />
              </template>
            </div>

            <InternalCommunicationThread
              class="mt-4"
              :quote-id="quoteId"
              readonly
            />
          </template>
          <v-alert
            v-if="notice"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ notice }}
          </v-alert>
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ error }}
          </v-alert>
        </v-card-text>

        <v-divider class="mx-5" />
        <v-card-actions class="pricing-request__actions">
          <v-btn
            class="pricing-request__cancel"
            variant="flat"
            color="grey-lighten-3"
            size="large"
            @click="open = false"
          >
            CANCELAR
          </v-btn>
          <v-btn
            class="pricing-request__send"
            variant="flat"
            color="blue-accent-4"
            size="large"
            prepend-icon="mdi-send-outline"
            :disabled="loading || !info?.can_request"
            :loading="sending"
            @click="emit('send')"
          >
            SOLICITAR A PRICING
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-defaults-provider>
  </v-dialog>
</template>

<style scoped>
.pricing-request__header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 12px 0 22px;
}

.pricing-request__badge {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 49px;
  height: 43px;
  border-radius: 8px;
}

.pricing-request__rule {
  flex: none;
  width: 3px;
  height: 37px;
  border-radius: 2px;
}

.pricing-request__title {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin: 0;
  font-size: 1.75rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.pricing-request__chip {
  padding: 0 10px;
  border-radius: 9px;
  letter-spacing: 0;
}

.pricing-request__body {
  padding: 18px 20px 4px;
}

.pricing-request__question {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 11px 20px;
  border-radius: 8px;
}

.pricing-request__question p {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.02em;
}

.pricing-request__fields {
  display: grid;
  grid-template-columns: minmax(110px, 150px) minmax(0, 1fr);
  align-items: center;
  gap: 11px 8px;
  margin-top: 14px;
  padding-left: 8px;
}

.pricing-request__label {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.pricing-request__label--top {
  align-self: start;
  margin-top: 10px;
}

.pricing-request__value :deep(input) {
  font-size: 1.0625rem;
  font-weight: 600;
}

.pricing-request__quote :deep(.v-field) {
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.pricing-request__quote :deep(input) {
  font-weight: 700;
  letter-spacing: 0.03em;
}

.pricing-request__actions {
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 9px;
  padding: 18px 20px;
}

.pricing-request__cancel {
  min-width: 161px;
}

.pricing-request__send {
  min-width: 260px;
}

@media (max-width: 599px) {
  .pricing-request__fields {
    grid-template-columns: minmax(0, 1fr);
    gap: 4px;
    padding-left: 0;
  }

  .pricing-request__label--top {
    margin-top: 0;
  }

  .pricing-request__actions > .v-btn {
    flex: 1 1 100%;
    min-width: 0;
  }
}
</style>
