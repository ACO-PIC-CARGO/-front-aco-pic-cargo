<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useClientQuoteHistory } from "./useClientQuoteHistory";
import { useClientHistoryFilterOptions } from "./useClientHistoryFilterOptions";
import { useHistoryFilterForm } from "./quoteHistoryFilters";
import { cargoDetail, modalityColor, modalityLabel, money, transportIcon } from "./quoteHistoryLabels";

const props = withDefaults(defineProps<{ clientId: number | string | null | undefined; visible?: boolean }>(), {
  visible: true,
});

const BAR_HEIGHT = 56;
const router = useRouter();
const open = ref(false);
const active = computed(() => props.visible && !!props.clientId);
watch(active, (isActive) => {
  if (!isActive) open.value = false;
});
const clientId = toRef(props, "clientId");
const { form, applied, weightError, volumeError, active: filtering, clear } = useHistoryFilterForm(clientId);
const { options } = useClientHistoryFilterOptions(clientId);
const { items, totalCount, hasMore, loaded, loading, errorMessage, loadMore, retry } = useClientQuoteHistory(
  clientId,
  applied,
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
    :model-value="active"
    class="client-history"
  >
    <section
      v-show="active"
      class="client-history__sheet bg-surface"
      :class="{ 'client-history__sheet--open': open }"
      :style="{ '--client-history-bar': `${BAR_HEIGHT}px` }"
      aria-label="Historial del cliente"
    >
      <header class="client-history__bar">
        <button
          type="button"
          class="client-history__toggle"
          :aria-expanded="open"
          aria-controls="client-history-content"
          @click="open = !open"
        >
          <v-icon
            icon="mdi-account-group"
            color="blue-darken-4"
            size="x-large"
          />
          <span class="client-history__title">Historial del Cliente ({{ options.total_count }})</span>
          <v-icon :icon="open ? 'mdi-chevron-down' : 'mdi-chevron-up'" />
        </button>

        <v-menu
          v-if="open && options.total_count"
          :close-on-content-click="false"
          location="bottom end"
        >
          <template #activator="{ props: menuProps }">
            <button
              type="button"
              class="client-history__filter-button"
              v-bind="menuProps"
            >
              <v-icon
                icon="mdi-filter-variant"
                color="blue-darken-3"
                size="small"
              />
              <span class="flex-grow-1 text-start">{{ filtering ? "Filtros aplicados" : "Filtrar cotizaciones" }}</span>
              <v-icon
                icon="mdi-chevron-down"
                color="blue-darken-4"
                size="small"
              />
            </button>
          </template>
          <v-card class="client-history__filters">
            <v-select
              v-model="form.transport_id"
              :items="options.transports"
              item-title="name"
              item-value="id"
              label="Tipo"
              density="compact"
              clearable
              hide-details
            />
            <v-select
              v-model="form.modality"
              :items="options.modalities"
              item-title="label"
              return-object
              label="Modalidad"
              density="compact"
              clearable
              hide-details
            />
            <v-text-field
              v-model="form.weight_from"
              type="number"
              min="0"
              label="Peso desde (kg)"
              density="compact"
              :error="!!weightError"
              hide-details
            />
            <v-text-field
              v-model="form.weight_to"
              type="number"
              min="0"
              label="Peso hasta (kg)"
              density="compact"
              :error-messages="weightError ?? undefined"
              hide-details="auto"
            />
            <v-text-field
              v-model="form.volume_from"
              type="number"
              min="0"
              label="Volumen desde (m³)"
              density="compact"
              :error="!!volumeError"
              hide-details
            />
            <v-text-field
              v-model="form.volume_to"
              type="number"
              min="0"
              label="Volumen hasta (m³)"
              density="compact"
              :error-messages="volumeError ?? undefined"
              hide-details="auto"
            />
            <v-select
              v-model="form.port_begin_id"
              :items="options.origins"
              item-title="name"
              item-value="id"
              label="Origen"
              density="compact"
              clearable
              hide-details
            />
            <v-select
              v-model="form.port_end_id"
              :items="options.destinations"
              item-title="name"
              item-value="id"
              label="Destino"
              density="compact"
              clearable
              hide-details
            />
            <v-select
              v-model="form.status_id"
              :items="options.statuses"
              item-title="name"
              item-value="id"
              label="Estado"
              density="compact"
              clearable
              hide-details
            />
            <v-btn
              variant="text"
              prepend-icon="mdi-filter-remove-outline"
              :disabled="!filtering"
              @click="clear"
            >
              Limpiar filtros
            </v-btn>
          </v-card>
        </v-menu>
      </header>

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
          v-else-if="loaded && !items.length && filtering"
          class="text-medium-emphasis"
        >
          Ninguna cotización de este cliente coincide con los filtros. Cambia o limpia los filtros.
        </p>
        <p
          v-else-if="loaded && !items.length"
          class="text-medium-emphasis"
        >
          Este cliente todavía no tiene cotizaciones. Cuando guardes esta, aparecerá aquí.
        </p>

        <template v-if="items.length">
          <div class="client-history__table-scroll">
            <table class="client-history__table">
              <thead>
                <tr class="bg-blue-grey-lighten-5">
                  <th>N.º Cotización</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Modalidad</th>
                  <th>Detalle de Carga</th>
                  <th>Ruta (Origen – Destino)</th>
                  <th>Costos (US$)</th>
                  <th>Venta (US$)</th>
                  <th>Profit (US$)</th>
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
                      class="client-history__quote-link text-blue-darken-3"
                    >{{ item.quote_code }}</a>
                  </td>
                  <td>{{ item.created_date }}</td>
                  <td class="text-start">
                    <span class="d-inline-flex align-center ga-2">
                      <v-icon
                        :icon="transportIcon(item.transport_name)"
                        size="small"
                        color="blue-darken-3"
                      />
                      {{ item.transport_name }}
                    </span>
                  </td>
                  <td>
                    <v-chip
                      size="small"
                      variant="flat"
                      :color="modalityColor(item)"
                    >
                      {{ modalityLabel(item) }}
                    </v-chip>
                  </td>
                  <td>{{ cargoDetail(item) }}</td>
                  <td>
                    <v-chip
                      size="small"
                      variant="flat"
                      color="blue-grey-lighten-5"
                    >
                      <v-icon
                        icon="mdi-map-marker"
                        size="small"
                        color="blue-darken-3"
                        start
                      />
                      {{ item.origin }} – {{ item.destination }}
                    </v-chip>
                  </td>
                  <td>{{ money(item.cost) }}</td>
                  <td>{{ money(item.sale) }}</td>
                  <td
                    class="client-history__profit"
                    :class="item.profit < 0 ? 'text-error' : 'text-green-darken-2'"
                  >
                    {{ money(item.profit) }}
                  </td>
                  <td class="text-start">
                    <v-chip
                      size="small"
                      variant="flat"
                      :color="item.approved_flag ? 'light-green-lighten-2' : 'blue-grey-lighten-5'"
                      :prepend-icon="item.approved_flag ? 'mdi-check-circle-outline' : undefined"
                    >
                      {{ item.status_name }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="client-history__footer">
            <span class="font-weight-medium">Mostrando {{ items.length }} de {{ totalCount }} cotizaciones</span>
            <v-btn
              v-if="hasMore"
              color="blue-darken-1"
              rounded="pill"
              min-width="300"
              prepend-icon="mdi-chevron-down"
              append-icon="mdi-refresh"
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
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
  min-height: var(--client-history-bar);
  padding: 0 32px;
}

.client-history__toggle {
  grid-column: 2;
  display: flex;
  align-items: center;
  gap: 12px;
  height: var(--client-history-bar);
}

.client-history__bar > :not(.client-history__toggle) {
  grid-column: 3;
  justify-self: end;
}

.client-history__title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.2px;
}

.client-history__filter-button {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 272px;
  height: 34px;
  padding: 0 12px;
  border: 1.5px solid rgb(var(--v-theme-primary));
  border-radius: 6px;
  font-weight: 500;
}

.client-history__filter-button:hover {
  background: rgba(var(--v-theme-primary), 0.06);
}

.client-history__filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 8px;
  align-items: start;
  width: min(640px, 90vw);
  padding: 12px;
}

.client-history__content {
  flex: 1;
  overflow-y: auto;
  padding: 4px 32px 20px;
}

.client-history__table-scroll {
  overflow-x: auto;
}

.client-history__table {
  width: 100%;
  min-width: 1160px;
  border: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  border-spacing: 0;
  font-size: 0.875rem;
}

.client-history__table th {
  height: 32px;
  padding: 0 8px;
  font-size: 0.84rem;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
}

.client-history__table td {
  height: 32px;
  padding: 0 8px;
  border-top: thin solid rgba(var(--v-border-color), var(--v-border-opacity));
  text-align: center;
  white-space: nowrap;
}

.client-history__table tbody tr:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.client-history__quote-link,
.client-history__profit {
  font-size: 0.94rem;
  font-weight: 700;
}

.client-history__footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

@media (prefers-reduced-motion: reduce) {
  .client-history__sheet {
    transition: none;
  }
}
</style>
