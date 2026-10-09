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
import {
  fetchCompanyPlan,
  fetchRegistrationTrial,
} from "@/api/branchSubscription";
import { isEmptyResult } from "@/api/subscriptionPackages";
import {
  daysLabel,
  PLAN_CHANGED_EVENT,
  trialNotice,
} from "@/views/MyPlan/myPlanView";

const hasFailed = (response) =>
  !response.estadoflag && !isEmptyResult(response);
const firstRow = (response) => (response.estadoflag ? response.data[0] : null);

export default {
  name: "PlanStatusBadge",
  data: () => ({ loaded: false, plan: null, registrationTrial: null }),
  computed: {
    notice() {
      return this.loaded
        ? trialNotice({
            plan: this.plan,
            registrationTrial: this.registrationTrial,
          })
        : null;
    },
  },
  mounted() {
    this.$root.$on(PLAN_CHANGED_EVENT, this.load);
    this.load();
  },
  beforeDestroy() {
    this.$root.$off(PLAN_CHANGED_EVENT, this.load);
  },
  methods: {
    daysLabel,
    async load() {
      const responses = await Promise.all([
        fetchCompanyPlan(),
        fetchRegistrationTrial(),
      ]);
      this.loaded = !responses.some(hasFailed);
      [this.plan, this.registrationTrial] = responses.map(firstRow);
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
