<template>
  <v-card>
    <listUser />
  </v-card>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { mapActions } from "vuex";

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
    ...mapActions(["cargarEstatus"]),
  },
};
</script>

<style></style>
