<script setup lang="ts">
import { computed } from "vue";
import { noticeDetails, noticeMeasures, sentToClientMessage } from "./quoteNoticeContent";
import type { QuoteNotice } from "./quoteNotificationApi";

const props = defineProps<{ notice: QuoteNotice }>();
const emit = defineEmits<{ view: []; close: [] }>();

const message = computed(() => sentToClientMessage(props.notice));
const details = computed(() => noticeDetails(props.notice));
const measures = computed(() => noticeMeasures(props.notice));
</script>

<template>
  <div class="quote-notice">
    <header class="quote-notice__header">
      <span
        class="quote-notice__agent"
        aria-hidden="true"
      >
        <v-icon size="60">mdi-face-agent</v-icon>
        <v-icon
          class="quote-notice__agent-check"
          size="26"
        >mdi-check-circle</v-icon>
      </span>
      <span class="quote-notice__header-divider" />
      <h2 class="quote-notice__title">
        Cotización<br>formal lista
      </h2>
      <svg
        class="quote-notice__sparkle"
        viewBox="0 0 22 30"
        aria-hidden="true"
      ><path d="M4 12l3-9M10 17l8-5M11 24h9" /></svg>
    </header>

    <div class="quote-notice__body">
      <div class="quote-notice__banner">
        <v-icon
          size="46"
          aria-hidden="true"
        >
          mdi-laptop
        </v-icon>
        <span class="quote-notice__banner-divider" />
        <p class="quote-notice__banner-text">
          {{ message }}
        </p>
      </div>

      <dl class="quote-notice__details">
        <div
          v-for="row in details"
          :key="row.label"
          class="quote-notice__row"
        >
          <span
            class="quote-notice__tile"
            aria-hidden="true"
          ><v-icon>{{ row.icon }}</v-icon></span>
          <div>
            <dt class="quote-notice__label">
              {{ row.label }}
            </dt>
            <dd
              class="quote-notice__value"
              :class="{ 'quote-notice__value--highlight': row.highlight }"
            >
              {{ row.value }}
            </dd>
          </div>
        </div>
        <div
          v-if="measures.length"
          class="quote-notice__row quote-notice__measures"
        >
          <template
            v-for="(row, index) in measures"
            :key="row.label"
          >
            <span
              v-if="index > 0"
              class="quote-notice__measure-divider"
            />
            <div class="quote-notice__measure">
              <span
                class="quote-notice__tile"
                aria-hidden="true"
              ><v-icon>{{ row.icon }}</v-icon></span>
              <div>
                <dt class="quote-notice__label">
                  {{ row.label }}
                </dt>
                <dd class="quote-notice__value">
                  {{ row.value }}
                </dd>
              </div>
            </div>
          </template>
        </div>
      </dl>

      <v-btn
        class="quote-notice__view"
        variant="flat"
        block
        height="auto"
        @click="emit('view')"
      >
        <v-icon
          size="30"
          class="mr-3"
        >
          mdi-file-document-outline
        </v-icon>
        Ver cotización
        <svg
          class="quote-notice__view-sparkle"
          viewBox="0 0 22 30"
          aria-hidden="true"
        ><path d="M4 12l3-9M10 17l8-5M11 24h9" /></svg>
      </v-btn>
      <v-btn
        class="quote-notice__close"
        variant="text"
        block
        @click="emit('close')"
      >
        Cerrar
      </v-btn>
    </div>
  </div>
</template>

<style scoped>
.quote-notice {
  --notice-blue: #1a6fe0;
  --notice-navy: #0b2a8a;
  --notice-ink: #0d1836;
  --notice-muted: #3b4a6b;
  --notice-sky: #d5e8fb;
  --notice-tile: #dcebfb;
  --notice-line: #dfe6f0;
  --notice-green-top: #22a61f;
  --notice-green-bottom: #0d7a14;
  --notice-cta-top: #3fc61f;
  --notice-cta-bottom: #128a17;

  overflow: hidden;
  border: 2px solid var(--notice-blue);
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 18px 40px rgb(26 111 224 / 28%);
  color: var(--notice-ink);
  font-family: Montserrat, Roboto, sans-serif;
}

.quote-notice__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 16px 20px;
  background: linear-gradient(180deg, var(--notice-green-top) 0%, var(--notice-green-bottom) 100%);
  color: #fff;
}

.quote-notice__agent {
  position: relative;
  display: inline-flex;
}

.quote-notice__agent-check {
  position: absolute;
  right: -10px;
  bottom: -4px;
  border-radius: 50%;
  background: var(--notice-green-top);
}

.quote-notice__header-divider {
  width: 2px;
  height: 58px;
  background: rgb(255 255 255 / 85%);
}

.quote-notice__title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.3px;
  text-transform: uppercase;
}

.quote-notice__sparkle,
.quote-notice__view-sparkle {
  fill: none;
  stroke: #fff;
  stroke-linecap: round;
  stroke-width: 2.5;
}

.quote-notice__sparkle {
  width: 22px;
  height: 30px;
  align-self: flex-start;
  margin-left: -8px;
}

.quote-notice__body {
  padding: 8px 18px 20px;
}

.quote-notice__banner {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 28px;
  border-radius: 22px;
  background: var(--notice-sky);
  color: var(--notice-navy);
}

.quote-notice__banner-divider {
  flex: 0 0 2px;
  height: 48px;
  background: var(--notice-ink);
}

.quote-notice__banner-text {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  line-height: 1.15;
}

.quote-notice__details {
  margin: 12px 0 0;
  padding: 0 10px;
}

.quote-notice__row {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 5px 10px;
  border-bottom: 1.5px solid var(--notice-line);
}

.quote-notice__row:last-child {
  border-bottom: 0;
}

.quote-notice__tile {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 40px;
  border-radius: 10px;
  background: var(--notice-tile);
  color: var(--notice-blue);
}

.quote-notice__label {
  color: var(--notice-muted);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.quote-notice__value {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.quote-notice__value--highlight {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 28px 2px 12px;
  border-radius: 8px;
  background: var(--notice-sky);
  color: var(--notice-navy);
}

.quote-notice__measures {
  gap: 0;
}

.quote-notice__measure {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.quote-notice__measure-divider {
  flex: 0 0 1.5px;
  height: 40px;
  margin: 0 14px;
  background: var(--notice-muted);
}

.quote-notice__view {
  margin-top: 14px;
  padding: 13px 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, var(--notice-cta-top) 0%, var(--notice-cta-bottom) 100%);
  box-shadow: 0 4px 10px rgb(18 138 23 / 30%);
  color: #fff;
  font-family: inherit;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
}

.quote-notice__view-sparkle {
  width: 20px;
  height: 26px;
  margin-top: -12px;
  margin-left: 12px;
}

.quote-notice__close {
  margin-top: 6px;
  color: var(--notice-muted);
  font-family: inherit;
  font-weight: 700;
  text-transform: none;
}

@media (max-width: 480px) {
  .quote-notice__header {
    gap: 12px;
    padding: 14px 16px;
  }

  .quote-notice__title {
    font-size: 23px;
  }

  .quote-notice__body {
    padding: 8px 12px 16px;
  }

  .quote-notice__banner {
    gap: 12px;
    padding: 10px 14px;
  }

  .quote-notice__banner-text {
    font-size: 17px;
  }

  .quote-notice__details {
    padding: 0;
  }

  .quote-notice__row {
    gap: 14px;
    padding: 5px 4px;
  }

  .quote-notice__tile {
    width: 46px;
  }

  .quote-notice__value {
    font-size: 18px;
  }

  .quote-notice__measures {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .quote-notice__measure-divider {
    display: none;
  }

  .quote-notice__view {
    font-size: 22px;
  }
}
</style>
