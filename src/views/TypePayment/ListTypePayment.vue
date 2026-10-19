<template>
  <v-container fluid>
    <TypePayment />
    <v-navigation-drawer
      v-model="typepaymentStore.drawer"
      location="right"
      
      width="30%"
      temporary
    >
      <FilterTypePayment />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapStores } from "pinia";
import { useTypepaymentStore } from "@/stores/typepayment";
export default {
  components: {
    TypePayment: defineAsyncComponent(() =>
      import("../../components/TypePayment/listTypePaymentComponent.vue")),
    FilterTypePayment: defineAsyncComponent(() =>
      import("../../components/filtros/FilterTypePayment.vue")),
  },
  computed: {
    ...mapStores(useTypepaymentStore),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE TIPOS DE PAGO`;
  },
};
</script>

<style></style>
