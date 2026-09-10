<template>
  <v-card>
    <listUser />
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      mostrar: false,
    };
  },
  components: {
    listUser: () =>
      import("../../components/Calculadora/listUserCalcComponent.vue"),
  },
  mounted() {
    this.$store.state.mainTitle = "Usuarios Calculadora";
  },
  methods: {},
};
</script>

<style></style>
