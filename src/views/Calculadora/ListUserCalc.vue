<template>
  <v-card>
    <listUser />
  </v-card>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapActions as mapPiniaActions } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";

export default {
  data() {
    return {
      mostrar: false,
    };
  },
  components: {
    listUser: defineAsyncComponent(() =>
      import("../../components/Calculadora/listUserCalcComponent.vue")),
  },
  mounted() {
    this.$store.state.mainTitle = "Usuarios Calculadora";
    console.log("mounted");
    this.cargarEstatus();
  },
  methods: {
    ...mapPiniaActions(useCalculadorasStore, ["cargarEstatus"]),
  },
};
</script>

<style></style>
