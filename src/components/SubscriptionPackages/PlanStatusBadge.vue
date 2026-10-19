<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useSubscriptionsStore } from "@/stores/subscriptions";

const readBranchId = (): unknown => {
  try {
    return JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id_branch;
  } catch {
    return null;
  }
};

const subscriptionsStore = useSubscriptionsStore();

const loaded = ref(false);
const branchId = readBranchId();

const notice = computed(() => (loaded.value ? subscriptionsStore.trialNotice({ branchId }) : null));

onMounted(async () => {
  loaded.value = await subscriptionsStore.loadPlanBadge();
});

function daysLabel(days: number | null) {
  return days! > 1 ? `${days} días` : "Último día";
}
</script>

<template>
  <div
    v-if="notice"
    class="plan-status mx-2"
  >
    <v-chip
      v-if="notice.paidText"
      color="success"
      size="small"
      :to="{ name: 'miPlan' }"
    >
      <v-icon
        start
        size="small"
      >
        mdi-check-decagram
      </v-icon>
      {{ notice.paidText }}
    </v-chip>
    <template v-else-if="notice.ended || notice.days !== null">
      <v-icon>mdi-clock-outline</v-icon>
      <v-chip
        v-if="notice.ended"
        color="orange-lighten-4"
        variant="flat"
        size="small"
        class="font-weight-bold text-orange-darken-4"
      >
        Tu prueba terminó
      </v-chip>
      <template v-else>
        <span class="plan-status__label text-body-medium font-weight-medium">Días de prueba restantes</span>
        <v-chip
          color="green-lighten-4"
          variant="flat"
          size="small"
          class="font-weight-bold text-green-darken-4"
        >
          {{ daysLabel(notice.days) }}
        </v-chip>
      </template>
    </template>
    <v-btn
      v-if="notice.canBuy"
      color="blue-darken-2"
      variant="flat"
      rounded
      class="text-none"
      :to="{ name: 'miPlan' }"
    >
      Adquiere tu plan
    </v-btn>
  </div>
</template>

<style scoped>
.plan-status {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

@media (max-width: 599px) {
  .plan-status__label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
}
</style>
