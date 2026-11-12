<script setup lang="ts">
import { computed } from "vue";
import { pricingRequestDetails } from "./quoteNoticeContent";
import type { QuoteNotice } from "./quoteNotificationApi";

const props = defineProps<{ notice: QuoteNotice }>();
const emit = defineEmits<{ view: []; close: [] }>();

const details = computed(() => pricingRequestDetails(props.notice));
</script>

<template>
  <div class="request-notice">
    <header class="request-notice__header">
      <span
        class="request-notice__document"
        aria-hidden="true"
      >
        <v-icon size="66">mdi-file-document-outline</v-icon>
        <v-icon
          class="request-notice__document-plus"
          size="30"
        >mdi-plus-circle</v-icon>
      </span>
      <span class="request-notice__header-divider" />
      <h2 class="request-notice__title">
        <span class="request-notice__title-lead">
          Te solicitaron una
          <svg
            class="request-notice__sparkle"
            viewBox="0 0 22 30"
            aria-hidden="true"
          ><path d="M4 12l3-9M10 17l8-5M11 24h9" /></svg>
        </span>
        <span class="request-notice__title-main">Cotización</span>
      </h2>
      <p class="request-notice__urgency">
        <span>Solicita:</span>
        <strong>Urgente</strong>
      </p>
    </header>

    <div class="request-notice__body">
      <dl class="request-notice__details">
        <div
          v-for="row in details"
          :key="row.label"
          class="request-notice__row"
        >
          <span
            class="request-notice__tile"
            aria-hidden="true"
          ><v-icon size="32">{{ row.icon }}</v-icon></span>
          <div :class="{ 'request-notice__inline': row.highlight }">
            <dt class="request-notice__label">
              {{ row.label }}
            </dt>
            <dd
              class="request-notice__value"
              :class="{ 'request-notice__value--chip': row.highlight }"
            >
              {{ row.value }}
            </dd>
          </div>
        </div>
      </dl>

      <div class="request-notice__actions">
        <v-btn
          class="request-notice__cancel"
          variant="outlined"
          height="auto"
          @click="emit('close')"
        >
          Cancelar
        </v-btn>
        <v-btn
          class="request-notice__view"
          variant="flat"
          height="auto"
          @click="emit('view')"
        >
          <v-icon
            size="36"
            class="mr-3"
          >
            mdi-eye
          </v-icon>
          Ver Cotización
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.request-notice {
  --request-blue: #1a6fe0;
  --request-chip: #0b3a9a;
  --request-ink: #0d1836;
  --request-muted: #3b4a6b;
  --request-tile: #dcebfb;
  --request-line: #d3dff0;
  --request-header-top: #0b4fb0;
  --request-header-bottom: #083a8c;
  --request-urgent-top: #ee2a24;
  --request-urgent-bottom: #c00d0d;
  --request-plus: #1fb31c;
  --request-cancel: #3b4558;
  --request-cta-top: #17a318;
  --request-cta-bottom: #0c8212;

  overflow: hidden;
  border-radius: 26px;
  background: #fff;
  box-shadow: 0 20px 50px rgb(0 0 0 / 35%);
  color: var(--request-ink);
  font-family: Montserrat, Roboto, sans-serif;
}

.request-notice__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 16px 16px 16px 44px;
  background: linear-gradient(180deg, var(--request-header-top) 0%, var(--request-header-bottom) 100%);
  color: #fff;
}

.request-notice__document {
  position: relative;
  display: inline-flex;
  flex: none;
}

.request-notice__document-plus {
  position: absolute;
  right: -10px;
  bottom: -4px;
  border-radius: 50%;
  background: #fff;
  color: var(--request-plus);
}

.request-notice__header-divider {
  flex: none;
  width: 2px;
  height: 58px;
  background: rgb(255 255 255 / 85%);
}

.request-notice__title {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 200px;
  margin: 0;
  font-weight: 800;
  line-height: 1.05;
}

.request-notice__title-lead {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 23px;
}

.request-notice__title-main {
  font-size: 36px;
  letter-spacing: -0.3px;
}

.request-notice__sparkle {
  flex: none;
  width: 18px;
  height: 24px;
  margin-top: -4px;
  fill: none;
  stroke: #fff;
  stroke-linecap: round;
  stroke-width: 2.8;
}

.request-notice__urgency {
  display: flex;
  flex: none;
  flex-direction: column;
  margin: 0;
  padding: 6px 22px;
  border: 2px solid #fff;
  border-radius: 12px;
  background: linear-gradient(180deg, var(--request-urgent-top) 0%, var(--request-urgent-bottom) 100%);
  box-shadow: 0 3px 8px rgb(0 0 0 / 25%);
  font-size: 17px;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
}

.request-notice__urgency strong {
  font-size: 23px;
}

.request-notice__body {
  padding: 6px 24px 26px;
}

.request-notice__details {
  margin: 0;
}

.request-notice__row {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 8px 10px;
  border-bottom: 1.5px solid var(--request-line);
}

.request-notice__tile {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 50px;
  border-radius: 12px;
  background: var(--request-tile);
  color: var(--request-blue);
}

.request-notice__inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 18px;
}

.request-notice__label {
  color: var(--request-muted);
  font-size: 17px;
  font-weight: 600;
}

.request-notice__value {
  margin: 0;
  font-size: 21px;
  font-weight: 800;
  line-height: 1.2;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.request-notice__value--chip {
  padding: 4px 16px;
  border-radius: 10px;
  background: var(--request-tile);
  color: var(--request-chip);
}

.request-notice__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 26px;
}

.request-notice__cancel,
.request-notice__view {
  padding: 14px 16px;
  border-radius: 12px;
  font-family: inherit;
  letter-spacing: 0;
  text-transform: none;
}

.request-notice__cancel {
  flex: 2 1 180px;
  border: 2px solid var(--request-cancel);
  color: var(--request-cancel);
  font-size: 24px;
  font-weight: 700;
}

.request-notice__view {
  flex: 3 1 260px;
  background: linear-gradient(180deg, var(--request-cta-top) 0%, var(--request-cta-bottom) 100%);
  box-shadow: 0 3px 8px rgb(12 130 18 / 35%);
  color: #fff;
  font-size: 25px;
  font-weight: 800;
}

@media (max-width: 480px) {
  .request-notice__header {
    gap: 12px;
    padding: 14px 16px;
  }

  .request-notice__title {
    min-width: 0;
  }

  .request-notice__title-lead {
    font-size: 18px;
  }

  .request-notice__title-main {
    font-size: 28px;
  }

  .request-notice__urgency {
    flex: 1 0 100%;
    flex-direction: row;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
  }

  .request-notice__body {
    padding: 6px 14px 20px;
  }

  .request-notice__row {
    gap: 14px;
    padding: 8px 4px;
  }

  .request-notice__tile {
    width: 54px;
    height: 44px;
  }

  .request-notice__value {
    font-size: 19px;
  }

  .request-notice__cancel {
    font-size: 21px;
  }

  .request-notice__view {
    font-size: 22px;
  }
}
</style>
