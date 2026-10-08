<template>
  <v-chip
    v-if="badge"
    color="success"
    small
    class="mx-2"
    :to="{ name: 'miPlan' }"
  >
    <v-icon left small>{{ icon }}</v-icon>
    {{ badge.text }}
  </v-chip>
</template>

<script>
import { fetchCompanyPlan } from "@/api/branchSubscription";
import { PLAN_CHANGED_EVENT, planBadge } from "@/views/MyPlan/myPlanView";

export default {
  name: "PlanStatusBadge",
  data: () => ({ plan: null }),
  computed: {
    badge() {
      return planBadge(this.plan);
    },
    icon() {
      return this.badge.tone === "trial"
        ? "mdi-timer-sand"
        : "mdi-check-decagram";
    },
  },
  async mounted() {
    this.$root.$on(PLAN_CHANGED_EVENT, this.showPlan);
    const response = await fetchCompanyPlan();
    if (response.estadoflag) this.showPlan(response.data[0]);
  },
  beforeDestroy() {
    this.$root.$off(PLAN_CHANGED_EVENT, this.showPlan);
  },
  methods: {
    showPlan(plan) {
      this.plan = plan || null;
    },
  },
};
</script>
