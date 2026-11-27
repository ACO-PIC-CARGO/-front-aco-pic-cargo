<script setup lang="ts">
import AcoStatusChip from "@/components/aco/AcoStatusChip.vue";
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useHousesStore } from "@/stores/houses";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { calendarDateLabel, todayIn } from "@/components/HouseFile/houseTrackingFormat";
import type { NotificacionHouse } from "@/types/operaciones";

const housesStore = useHousesStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
defineProps<{ houseId: number }>();
const emit = defineEmits<{
  "request-send": [notification: NotificacionHouse];
  send: [payload: { notification: NotificacionHouse; fecha: string }];
}>();

// A pending notice always goes out today; the server records the exact date and time when it is sent.
const today = computed(() => todayIn(timeZone.value));

function requestSend(item: NotificacionHouse): void {
  emit("send", { notification: item, fecha: today.value });
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
            <span
              v-else
              class="text-no-wrap text-medium-emphasis"
            >
              {{ calendarDateLabel(today) }}
            </span>
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
</template>