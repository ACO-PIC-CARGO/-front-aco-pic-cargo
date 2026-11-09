<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, toRef } from "vue";
import { useRouter } from "vue-router";
import { useClientQuoteHistory } from "./useClientQuoteHistory";
import { cargoDetail, modalityColor, modalityLabel, money, transportIcon } from "./quoteHistoryLabels";

const props = withDefaults(defineProps<{ clientId: number | string | null | undefined; visible?: boolean }>(), {
  visible: true,
});

const BAR_HEIGHT = 48;
const router = useRouter();
const open = ref(false);
const { items, totalCount, hasMore, loaded, loading, errorMessage, loadMore, retry } = useClientQuoteHistory(
  toRef(props, "clientId"),
);

const quoteHref = (id: number) => router.resolve({ name: "verQuote", params: { id } }).href;

function closeOnEscape(event: KeyboardEvent) {
  if (event.key === "Escape") open.value = false;
}

onMounted(() => window.addEventListener("keydown", closeOnEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", closeOnEscape));
</script>

<template>
  <v-layout-item
    position="bottom"
    :size="BAR_HEIGHT"
    :model-value="visible && !!clientId"
    class="client-history"
  >
    <section
      class="client-history__sheet bg-surface"
      :class="{ 'client-history__sheet--open': open }"
      :style="{ '--client-history-bar': `${BAR_HEIGHT}px` }"
      aria-label="Historial del cliente"
    >
      <button
        type="button"
        class="client-history__bar"
        :aria-expanded="open"
        aria-controls="client-history-content"
        @click="open = !open"
      >
        <v-icon
          icon="mdi-account-group"
          color="primary"
        />
        <span class="text-title-medium font-weight-bold">Historial del cliente ({{ totalCount }})</span>
        <v-icon
          class="ms-auto"
          :icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'"
        />
      </button>

      <div
        id="client-history-content"
        class="client-history__content"
        :inert="!open"
      >
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-2"
        >
          {{ errorMessage }}
          <template #append>
            <v-btn
              variant="text"
              @click="retry"
            >
              Reintentar
            </v-btn>
          </template>
        </v-alert>
        <p
          v-else-if="loading && !items.length"
          class="text-medium-emphasis"
        >
          Cargando el historial del cliente…
        </p>
        <p
          v-else-if="loaded && !items.length"
          class="text-medium-emphasis"
        >
          Este cliente todavía no tiene cotizaciones. Cuando guardes esta, aparecerá aquí.
        </p>

        <template v-if="items.length">
          <v-table
            density="compact"
            class="client-history__table"
          >
            <thead>
              <tr>
                <th>N.º Cotización</th>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Modalidad</th>
                <th>Detalle de Carga</th>
                <th>Ruta (Origen – Destino)</th>
                <th class="text-end">
                  Costos (US$)
                </th>
                <th class="text-end">
                  Venta (US$)
                </th>
                <th class="text-end">
                  Profit (US$)
                </th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in items"
                :key="item.id"
              >
                <td>
                  <a
                    :href="quoteHref(item.id)"
                    target="_blank"
                    rel="noopener"
                    class="font-weight-bold"
                  >{{ item.quote_code }}</a>
                </td>
                <td>{{ item.created_date }}</td>
                <td class="text-no-wrap">
                  <v-icon
                    :icon="transportIcon(item.transport_name)"
                    size="small"
                    color="primary"
                  />
                  {{ item.transport_name }}
                </td>
                <td>
                  <v-chip
                    size="small"
                    variant="tonal"
                    :color="modalityColor(item)"
                  >
                    {{ modalityLabel(item) }}
                  </v-chip>
                </td>
                <td>{{ cargoDetail(item) }}</td>
                <td class="text-no-wrap">
                  <v-icon
                    icon="mdi-map-marker"
                    size="small"
                    color="primary"
                  />
                  {{ item.origin }} – {{ item.destination }}
                </td>
                <td class="text-end">
                  {{ money(item.cost) }}
                </td>
                <td class="text-end">
                  {{ money(item.sale) }}
                </td>
                <td
                  class="text-end font-weight-bold"
                  :class="item.profit < 0 ? 'text-error' : 'text-success'"
                >
                  {{ money(item.profit) }}
                </td>
                <td>
                  <v-chip
                    size="small"
                    variant="tonal"
                    :color="item.approved_flag ? 'success' : undefined"
                    :prepend-icon="item.approved_flag ? 'mdi-check-circle-outline' : undefined"
                  >
                    {{ item.status_name }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-table>

          <div class="client-history__footer">
            <span class="text-medium-emphasis">Mostrando {{ items.length }} de {{ totalCount }} cotizaciones</span>
            <v-btn
              v-if="hasMore"
              color="primary"
              rounded
              prepend-icon="mdi-chevron-down"
              :loading="loading"
              @click="loadMore"
            >
              Ver más (cargar 5 más)
            </v-btn>
          </div>
        </template>
      </div>
    </section>
  </v-layout-item>
</template>

<style scoped>
.client-history {
  overflow: visible;
  z-index: 5;
}

.client-history__sheet {
  position: absolute;
  inset: auto 0 0 0;
  height: 50vh;
  display: flex;
  flex-direction: column;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 -2px 8px rgba(var(--v-theme-on-surface), 0.12);
  transform: translateY(calc(100% - var(--client-history-bar)));
  transition: transform 0.25s ease;
}

.client-history__sheet--open {
  transform: translateY(0);
}

.client-history__bar {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: var(--client-history-bar);
  padding: 0 16px;
  text-align: start;
}

.client-history__content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.client-history__table th {
  white-space: nowrap;
}

.client-history__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 12px;
}

@media (prefers-reduced-motion: reduce) {
  .client-history__sheet {
    transition: none;
  }
}
</style>
