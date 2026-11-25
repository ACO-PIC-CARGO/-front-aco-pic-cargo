<script setup lang="ts">
import { shallowRef } from "vue";
import moment from "moment-timezone";
import { useMastersStore } from "@/stores/masters";
import { shortDate } from "@/utils/dates";
import { hasFailed } from "@/utils/request";
import type { CampoFechaMaster, HistorialFechaMaster } from "@/types/operaciones";

const props = defineProps<{
  masterId: number | string | null | undefined;
  campo: CampoFechaMaster;
  title: string;
  column: string;
}>();

const mastersStore = useMastersStore();
const open = shallowRef(false);
const loading = shallowRef(false);
const rows = shallowRef<HistorialFechaMaster[]>([]);
const notice = shallowRef("");
const failed = shallowRef(false);

const dateLabel = (day: string | null) => (day ? shortDate(moment(day, "YYYY-MM-DD")) : "Sin fecha");
const changedAtLabel = (iso: string) => {
  const date = moment(iso);
  return `${shortDate(date)} – ${date.format("HH:mm")}`;
};

async function show() {
  if (!props.masterId) return;
  open.value = true;
  loading.value = true;
  rows.value = [];
  notice.value = "";
  const answer = await mastersStore.historialFechasMaster(props.masterId, props.campo);
  loading.value = false;
  rows.value = answer.estadoflag ? answer.data ?? [] : [];
  failed.value = hasFailed(answer);
  notice.value = answer.estadoflag ? "" : answer.mensaje || "";
}
</script>

<template>
  <div>
    <v-btn
      v-if="masterId"
      variant="text"
      size="x-small"
      color="primary"
      prepend-icon="mdi-history"
      class="date-history-link px-1"
      @click="show"
    >
      Ver historial
    </v-btn>

    <v-dialog
      v-model="open"
      max-width="560"
    >
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center ga-3 pt-4">
          <v-avatar
            color="primary"
            variant="tonal"
            rounded="lg"
          >
            <v-icon>mdi-history</v-icon>
          </v-avatar>
          <span class="text-title-large font-weight-bold">Historial de {{ title }}</span>
          <v-spacer />
          <v-btn
            variant="text"
            icon="mdi-close"
            size="small"
            aria-label="Cerrar"
            @click="open = false"
          />
        </v-card-title>
        <v-card-text>
          <v-progress-linear
            v-if="loading"
            indeterminate
            color="primary"
          />
          <v-alert
            v-else-if="!rows.length"
            :type="failed ? 'warning' : 'info'"
            variant="tonal"
            density="compact"
            :text="notice || 'Aún no hay cambios registrados para esta fecha.'"
          />
          <v-table
            v-else
            density="compact"
            class="history-table"
          >
            <thead>
              <tr>
                <th class="text-center">
                  {{ column }}
                </th>
                <th class="text-center">
                  Fecha de Modificación
                </th>
                <th class="text-center">
                  Responsable
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, index) in rows"
                :key="row.id"
                :class="{ 'history-table__current': index === 0 }"
              >
                <td class="text-center">
                  {{ dateLabel(row.fecha) }}
                </td>
                <td class="text-center">
                  {{ changedAtLabel(row.fecha_modificacion) }}
                </td>
                <td class="text-center">
                  {{ row.responsable || "—" }}
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer />
          <v-btn
            color="primary"
            variant="flat"
            @click="open = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.date-history-link {
  margin-top: -14px;
  text-transform: none;
  letter-spacing: normal;
}
.history-table {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
}
.history-table thead th {
  background: rgba(var(--v-theme-on-surface), 0.04);
  font-weight: 700 !important;
}
.history-table__current td {
  background: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
