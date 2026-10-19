<template>
  <v-card>
    <ConfiguracionOpcionCalculadoraComponent />
  </v-card>
</template>

<script>
import ConfiguracionOpcionCalculadoraComponent from "../../components/Calculadora/ConfiguracionOpcionCalculadoraComponent.vue";
import { mapActions as mapPiniaActions } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";

export default {
  components: {
    ConfiguracionOpcionCalculadoraComponent,
  },
  methods: {
    ...mapPiniaActions(useCalculadorasStore, ["opcionListado"]),
  },
  async mounted() {
    await this.opcionListado();
  },
};
</script>

<style></style>
