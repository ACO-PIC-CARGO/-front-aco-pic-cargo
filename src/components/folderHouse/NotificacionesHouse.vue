<script setup lang="ts">
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import { reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { useHousesStore } from "@/stores/houses";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { calendarDateLabel, fromDateAndTime, toDateAndTime } from "@/components/HouseFile/houseTrackingFormat";
import type { NotificacionHouse } from "@/types/operaciones";

const housesStore = useHousesStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
defineProps<{ houseId: number }>();
const emit = defineEmits<{
  "request-send": [notification: NotificacionHouse];
  send: [payload: { notification: NotificacionHouse; fecha: string }];
}>();
const fechas = reactive<Record<string, string>>({});
const horas = reactive<Record<string, string>>({});
const erroresFecha = reactive<Record<string, string>>({});
const dateDialogOpen = ref(false);
const selectedNotification = ref<NotificacionHouse | null>(null);
const dateDraft = ref<string | null>(null);
const timeDraft = ref("");
const dateDialogError = ref("");
const pendingSend = ref(false);
const MONTHS = {
  jan: 1, ene: 1,
  feb: 2,
  mar: 3,
  apr: 4, abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8, ago: 8,
  sep: 9, sept: 9, set: 9,
  oct: 10,
  nov: 11,
  dec: 12, dic: 12,
} as const;

function idKey(item: NotificacionHouse): string {
  return String(item.id);
}

function dateTimeInputValue(value: string | null): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const dbTimestamp = value.match(/^(\d{4})-([A-Za-zÀ-ÿ.]+)-(\d{1,2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (dbTimestamp) {
    const [, yearText, monthText, dayText, hour, minute] = dbTimestamp;
    const monthKey = monthText!.normalize("NFD").replace(/[\u0300-\u036f.]/g, "").toLowerCase();
    const month = MONTHS[monthKey as keyof typeof MONTHS];
    const year = Number(yearText);
    const day = Number(dayText);
    if (month) {
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
        return {
          date: `${yearText}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          time: `${hour}:${minute}`,
        };
      }
    }
  }
  const parsed = toDateAndTime(value, timeZone.value);
  const hasTime = /[T ]\d{2}:\d{2}/.test(value);
  return { date: parsed.date, time: hasTime ? parsed.time : "" };
}

function normalizeTime(value: string): string | null {
  const match = value.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

watch(
  () => [housesStore.ListadoNotificacionesHouse, timeZone.value] as const,
  ([notifications]) => {
    notifications.forEach((item) => {
      const { date, time } = dateTimeInputValue(item.fecha);
      fechas[idKey(item)] = date;
      horas[idKey(item)] = time;
      delete erroresFecha[idKey(item)];
    });
  },
  { immediate: true },
);

watch(dateDialogOpen, (isOpen) => {
  if (!isOpen) pendingSend.value = false;
});

function sendNotification(item: NotificacionHouse): void {
  const id = idKey(item);
  const fecha = fechas[id];
  const hora = horas[id];
  if (!fecha || !hora) {
    erroresFecha[id] = "La fecha y la hora son obligatorias para enviar la notificación.";
    openDateDialog(item, true);
    return;
  }
  delete erroresFecha[id];
  emit("send", { notification: item, fecha: fromDateAndTime(fecha, hora, timeZone.value) });
}

function openDateDialog(item: NotificacionHouse, sendAfterSave = false): void {
  selectedNotification.value = item;
  const id = idKey(item);
  dateDraft.value = fechas[id] || null;
  timeDraft.value = horas[id] || "";
  dateDialogError.value = "";
  pendingSend.value = sendAfterSave;
  dateDialogOpen.value = true;
}

function saveDate(): void {
  if (!selectedNotification.value || !dateDraft.value) {
    dateDialogError.value = "La fecha y la hora son obligatorias.";
    return;
  }
  const time = normalizeTime(timeDraft.value);
  if (!time) {
    dateDialogError.value = "Ingresa una hora válida, por ejemplo 10 o 10:30.";
    return;
  }
  const item = selectedNotification.value;
  const id = idKey(item);
  const fecha = fromDateAndTime(dateDraft.value, time, timeZone.value);
  const shouldSend = pendingSend.value;
  fechas[id] = dateDraft.value;
  horas[id] = time;
  delete erroresFecha[id];
  pendingSend.value = false;
  dateDialogOpen.value = false;
  if (shouldSend) emit("send", { notification: item, fecha });
}

function cancelDate(): void {
  pendingSend.value = false;
  dateDialogOpen.value = false;
}

function requestSend(item: NotificacionHouse): void {
  sendNotification(item);
}

defineExpose({ requestSend });
</script>

<template>
  <v-card
    tag="section"
    variant="flat"
    border
    rounded="lg"
    class="pa-3 mt-3"
    aria-labelledby="house-notifications-title"
  >
    <h2
      id="house-notifications-title"
      class="text-title-medium font-weight-bold ma-0 mb-2"
    >
      Notificaciones del House
    </h2>
    <p
      v-if="!housesStore.ListadoNotificacionesHouse.length"
      class="text-body-medium text-medium-emphasis ma-0"
    >
      No hay notificaciones registradas para este House.
    </p>
    <v-table
      v-else
      density="compact"
    >
      <thead>
        <tr>
          <th class="px-1">
            #
          </th>
          <th class="px-1">
            Código
          </th>
          <th class="px-1">
            Notificación
          </th>
          <th class="px-1">
            Fecha
          </th>
          <th class="px-1">
            Estado
          </th>
          <th class="px-1 text-center">
            Enviar notificación
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, index) in housesStore.ListadoNotificacionesHouse"
          :key="item.id"
        >
          <td class="px-1">
            <v-avatar
              size="24"
              color="neutral"
              class="text-label-small font-weight-bold"
            >
              {{ index + 1 }}
            </v-avatar>
          </td>
          <td class="px-1 text-no-wrap">
            {{ item.codigo || "—" }}
          </td>
          <td class="px-1">
            {{ item.descripcion || "—" }}
          </td>
          <td class="px-1">
            <span
              v-if="item.enviadoflag"
              class="text-no-wrap"
            >
              {{ item.fecha || "—" }}
            </span>
            <div
              v-else
              class="d-flex flex-column align-start"
            >
              <v-btn
                variant="text"
                size="small"
                :color="fechas[idKey(item)] ? undefined : 'primary'"
                :class="['text-none px-1', { 'text-medium-emphasis': fechas[idKey(item)] }]"
                :prepend-icon="fechas[idKey(item)] ? undefined : 'mdi-calendar-plus'"
                :aria-label="fechas[idKey(item)] ? `Cambiar fecha de ${item.descripcion || item.codigo}` : `Poner fecha a ${item.descripcion || item.codigo}`"
                @click="openDateDialog(item)"
              >
                {{ fechas[idKey(item)] && horas[idKey(item)] ? `${calendarDateLabel(fechas[idKey(item)])} ${horas[idKey(item)]}` : "Poner fecha" }}
              </v-btn>
              <span
                v-if="erroresFecha[idKey(item)]"
                class="text-error text-body-small"
              >
                {{ erroresFecha[idKey(item)] }}
              </span>
            </div>
          </td>
          <td class="px-1">
            <AcoStatusChip
              :tone="item.enviadoflag ? 'success' : 'neutral'"
              :label="item.enviadoflag ? 'Enviado' : 'Pendiente'"
            />
          </td>
          <td class="px-1 text-center">
            <v-btn
              v-if="!item.enviadoflag"
              icon
              variant="text"
              size="small"
              aria-label="Enviar notificación"
              color="primary"
              @click="emit('request-send', item)"
            >
              <v-icon icon="mdi-send" />
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
  <v-dialog
    v-model="dateDialogOpen"
    max-width="460"
  >
    <v-card>
      <v-card-title>
        Fecha de «{{ selectedNotification?.descripcion || selectedNotification?.codigo }}»
      </v-card-title>
      <v-card-text>
        <FormatFecha
          v-model="dateDraft"
          label="Fecha"
        />
        <v-text-field
          v-model="timeDraft"
          type="time"
          step="60"
          label="Hora"
          prepend-icon="mdi-clock-outline"
          :hint="`Zona horaria: ${timeZone}`"
          persistent-hint
          variant="outlined"
          :readonly="false"
        />
        <v-alert
          v-if="dateDialogError"
          type="error"
          variant="tonal"
          class="mt-2"
          :text="dateDialogError"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="cancelDate"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="saveDate"
        >
          Guardar fecha
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>