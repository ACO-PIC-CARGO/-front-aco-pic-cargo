<template>
  <v-container fluid>
    <TypePayment />
    <v-navigation-drawer
      v-model="$store.state.typepayment.drawer"
      location="right bottom"
      absolute
      
      persistent
      width="30%"
      temporary
    >
      <FilterTypePayment />
    </v-navigation-drawer>
  </v-container>
</template>

<script>
export default {
  components: {
    TypePayment: () =>
      import("../../components/TypePayment/listTypePaymentComponent.vue"),
    FilterTypePayment: () =>
      import("../../components/filtros/FilterTypePayment.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = `LISTADO DE TIPOS DE PAGO`;
  },
};
</script>

<style></style>
