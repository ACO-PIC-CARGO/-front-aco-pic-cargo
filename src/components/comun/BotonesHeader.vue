<template>
  <div>
    <v-btn
      color="#01579B"
      dark
      class="ma-1 btnCalc"
      @click="enviarCotizacionAPricing"
      v-if="getNameUrl == 'VerCotizacionCalculadora'"
    >
      <v-icon class="mx-1">mdi-invoice-text-send-outline</v-icon> Enviar Pricing
    </v-btn>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  methods: {
    ...mapActions(["EnviarCotizacionCalculadoraAPrincing"]),
    enviarCotizacionAPricing() {
      let item = this.$store.state.pricing.datosPrincipales;
      if (item.estadocotizacion == 1) {
        Swal.fire({
          icon: "warning",
          title: "Enviar a Pricing",
          text: "¿Desea enviar a Princing, Esta Cotización?",
          confirmButtonText: "Si, envíar.",
          showCancelButton: true,
          cancelButtonText: "Cancelar",
        }).then((respuesta) => {
          if (respuesta.isConfirmed) {
            this.continuarEnviarCotizacionAPricing(item);
          }
        });
      }
      if (item.estadocotizacion == 2) {
        Swal.fire({
          icon: "warning",
          title: "Cotización ya envíada",
          text: "¿La cotización ya fue envíada a Princing, desea crear una nueva cotización con los mismos datos?",
          confirmButtonText: "Si, envíar.",
          showCancelButton: true,
          cancelButtonText: "Cancelar",
        }).then((respuesta) => {
          if (respuesta.isConfirmed) {
            this.continuarEnviarCotizacionAPricing(item);
          }
        });
      }
    },
    continuarEnviarCotizacionAPricing(item) {
      this.enviarCotizacion({
        id: this.$route.query.id,
        individualflag: this.$route.query.individualflag == "1" ? true : false,
        grupalflag: this.$route.query.esgrupalflag == "1" ? true : false,
      });
    },
    async enviarCotizacion({
      id = null,
      individualflag = false,
      grupalflag = false,
    }) {
      await this.EnviarCotizacionCalculadoraAPrincing({
        id: id,
        individualflag: individualflag,
        grupalflag: grupalflag,
      });
    },
  },
  computed: {
    getNameUrl() {
      let name = this.$route.name;
      return name;
    },
  },
};
</script>

<style></style>
