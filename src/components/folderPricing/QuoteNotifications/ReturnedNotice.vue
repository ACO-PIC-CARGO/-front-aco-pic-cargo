<script setup lang="ts">
import { computed } from "vue";
import { noticeDetails } from "./quoteNoticeContent";
import type { QuoteNotice } from "./quoteNotificationApi";

const props = defineProps<{ notice: QuoteNotice }>();
const emit = defineEmits<{ view: []; close: [] }>();

const details = computed(() => noticeDetails(props.notice));
</script>

<template>
  <div class="returned-notice">
    <header class="returned-notice__header">
      <v-icon
        size="64"
        aria-hidden="true"
      >
        mdi-file-undo-outline
      </v-icon>
      <span class="returned-notice__header-divider" />
      <h2 class="returned-notice__title">
        Cotización<br>devuelta
      </h2>
    </header>

    <div class="returned-notice__body">
      <div class="returned-notice__banner">
        <v-icon
          size="40"
          aria-hidden="true"
        >
          mdi-laptop
        </v-icon>
        <p class="returned-notice__banner-text">
          Pricing ha devuelto la cotización para corrección.
        </p>
      </div>

      <dl class="returned-notice__details">
        <div
          v-for="row in details"
          :key="row.label"
          class="returned-notice__row"
        >
          <span
            class="returned-notice__tile"
            aria-hidden="true"
          ><v-icon>{{ row.icon }}</v-icon></span>
          <div>
            <dt class="returned-notice__label">
              {{ row.label }}
            </dt>
            <dd
              class="returned-notice__value"
              :class="{ 'returned-notice__value--chip': row.highlight }"
            >
              {{ row.value }}
            </dd>
          </div>
        </div>
      </dl>

      <section class="returned-notice__comment">
        <h3 class="returned-notice__comment-title">
          <v-icon
            size="20"
            aria-hidden="true"
          >
            mdi-message-text
          </v-icon>
          Comentario de Pricing
        </h3>
        <p class="returned-notice__comment-text">
          {{ notice.return_reason }}
        </p>
      </section>

      <p
        class="returned-notice__alert"
        role="alert"
      >
        <v-icon
          size="26"
          aria-hidden="true"
        >
          mdi-alert
        </v-icon>
        ¡Realizar correcciones urgentes!
      </p>

      <v-btn
        class="returned-notice__view"
        variant="flat"
        block
        height="auto"
        @click="emit('view')"
      >
        <v-icon
          size="30"
          class="mr-3"
        >
          mdi-eye
        </v-icon>
        Ver Cotización
        <v-icon
          size="26"
          class="ml-2"
        >
          mdi-arrow-right
        </v-icon>
      </v-btn>
      <v-btn
        class="returned-notice__close"
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
.returned-notice {
  --returned-red-top: #d4121a;
  --returned-red-bottom: #a00b12;
  --returned-red-soft: #fde4e4;
  --returned-red-ink: #b00d14;
  --returned-blue: #1a6fe0;
  --returned-navy: #0b2a8a;
  --returned-ink: #0d1836;
  --returned-muted: #3b4a6b;
  --returned-sky: #d5e8fb;
  --returned-tile: #dcebfb;
  --returned-line: #dfe6f0;

  overflow: hidden;
  border: 2px solid var(--returned-blue);
  border-radius: 30px;
  background: #fff;
  box-shadow: 0 18px 40px rgb(26 111 224 / 28%);
  color: var(--returned-ink);
  font-family: Montserrat, Roboto, sans-serif;
}

.returned-notice__header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  padding: 16px 20px;
  background: linear-gradient(180deg, var(--returned-red-top) 0%, var(--returned-red-bottom) 100%);
  color: #fff;
}

.returned-notice__header-divider {
  width: 2px;
  height: 58px;
  background: rgb(255 255 255 / 85%);
}

.returned-notice__title {
  margin: 0;
  font-size: 30px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.3px;
  text-transform: uppercase;
}

.returned-notice__body {
  padding: 8px 18px 20px;
}

.returned-notice__banner {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 24px;
  border-radius: 22px;
  background: var(--returned-red-soft);
  color: var(--returned-navy);
}

.returned-notice__banner-text {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.15;
}

.returned-notice__details {
  margin: 12px 0 0;
  padding: 0 10px;
}

.returned-notice__row {
  display: flex;
  align-items: center;
  gap: 22px;
  padding: 5px 10px;
  border-bottom: 1.5px solid var(--returned-line);
}

.returned-notice__row:last-child {
  border-bottom: 0;
}

.returned-notice__tile {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 40px;
  border-radius: 10px;
  background: var(--returned-tile);
  color: var(--returned-blue);
}

.returned-notice__label {
  color: var(--returned-muted);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.returned-notice__value {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.returned-notice__value--chip {
  display: inline-block;
  margin-top: 2px;
  padding: 2px 28px 2px 12px;
  border-radius: 8px;
  background: var(--returned-sky);
  color: var(--returned-navy);
}

.returned-notice__comment {
  margin-top: 10px;
  padding: 12px 14px;
  border: 1.5px solid var(--returned-line);
  border-radius: 16px;
}

.returned-notice__comment-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  color: var(--returned-navy);
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

.returned-notice__comment-text {
  margin: 0;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--returned-tile);
  font-size: 17px;
  font-weight: 500;
  line-height: 1.3;
  overflow-wrap: anywhere;
  white-space: pre-line;
}

.returned-notice__alert {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 0 0;
  padding: 10px 16px;
  border-radius: 14px;
  background: var(--returned-red-soft);
  color: var(--returned-red-ink);
  font-size: 19px;
  font-weight: 800;
}

.returned-notice__view {
  margin-top: 14px;
  padding: 13px 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, #1a6fe0 0%, #0b4fb0 100%);
  box-shadow: 0 4px 10px rgb(26 111 224 / 30%);
  color: #fff;
  font-family: inherit;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: none;
}

.returned-notice__close {
  margin-top: 6px;
  color: var(--returned-muted);
  font-family: inherit;
  font-weight: 700;
  text-transform: none;
}

@media (max-width: 480px) {
  .returned-notice__header {
    gap: 12px;
    padding: 14px 16px;
  }

  .returned-notice__title {
    font-size: 23px;
  }

  .returned-notice__body {
    padding: 8px 12px 16px;
  }

  .returned-notice__banner {
    gap: 12px;
    padding: 10px 14px;
  }

  .returned-notice__banner-text {
    font-size: 16px;
  }

  .returned-notice__details {
    padding: 0;
  }

  .returned-notice__row {
    gap: 14px;
    padding: 5px 4px;
  }

  .returned-notice__tile {
    width: 46px;
  }

  .returned-notice__value {
    font-size: 18px;
  }

  .returned-notice__view {
    font-size: 20px;
  }
}
</style>
