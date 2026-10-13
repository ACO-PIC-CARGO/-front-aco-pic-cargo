<template>
  <div v-if="notice" class="plan-status mx-2">
    <v-chip
      v-if="notice.paidText"
      color="success"
      small
      :to="{ name: 'miPlan' }"
    >
      <v-icon left small>mdi-check-decagram</v-icon>
      {{ notice.paidText }}
    </v-chip>
    <template v-else-if="notice.ended || notice.days !== null">
      <v-icon>mdi-clock-outline</v-icon>
      <v-chip
        v-if="notice.ended"
        color="orange lighten-4"
        text-color="orange darken-4"
        small
        class="font-weight-bold"
      >
        Tu prueba terminó
      </v-chip>
      <template v-else>
        <span class="plan-status__label text-body-2 font-weight-medium"
          >Días de prueba restantes</span
        >
        <v-chip
          color="green lighten-4"
          text-color="green darken-4"
          small
          class="font-weight-bold"
        >
          {{ daysLabel(notice.days) }}
        </v-chip>
      </template>
    </template>
    <v-btn
      v-if="notice.canBuy"
      color="blue darken-2"
      dark
      depressed
      rounded
      class="text-none"
      :to="{ name: 'miPlan' }"
    >
      Adquiere tu plan
    </v-btn>
  </div>
</template>

<script>
import { mapActions, mapGetters } from "vuex";

const readBranchId = () => {
  try {
    return JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch;
  } catch (error) {
    return null;
  }
};

export default {
  name: "PlanStatusBadge",
  data: () => ({ loaded: false, branchId: readBranchId() }),
  computed: {
    ...mapGetters("subscriptions", ["trialNotice"]),
    notice() {
      return this.loaded ? this.trialNotice({ branchId: this.branchId }) : null;
    },
  },
  async mounted() {
    this.loaded = await this.loadPlanBadge();
  },
  methods: {
    ...mapActions("subscriptions", ["loadPlanBadge"]),
    daysLabel(days) {
      return days > 1 ? `${days} días` : "Último día";
    },
  },
};
</script>

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
