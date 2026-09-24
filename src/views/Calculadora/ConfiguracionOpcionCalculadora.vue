<template>
  <v-card>
    <ConfiguracionOpcionCalculadoraComponent />
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import ConfiguracionOpcionCalculadoraComponent from "../../components/Calculadora/ConfiguracionOpcionCalculadoraComponent.vue";

export default {
  components: {
    ConfiguracionOpcionCalculadoraComponent,
  },
  methods: {
    ...mapActions(["opcionListado"]),
  },
  async mounted() {
    await this.opcionListado();
  },
};
</script>

<style></style>
