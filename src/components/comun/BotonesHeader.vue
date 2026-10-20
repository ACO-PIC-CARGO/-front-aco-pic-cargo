<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Swal from "sweetalert2";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePricingStore } from "@/stores/pricing";

const route = useRoute();
const pricingStore = usePricingStore();
const calculadorasStore = useCalculadorasStore();

const getNameUrl = computed(() => route.name);

function enviarCotizacionAPricing() {
  const item = pricingStore.datosPrincipales;
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
        continuarEnviarCotizacionAPricing();
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
        continuarEnviarCotizacionAPricing();
      }
    });
  }
}
function continuarEnviarCotizacionAPricing() {
  enviarCotizacion({
    id: route.query.id,
    individualflag: route.query.individualflag == "1" ? true : false,
    grupalflag: route.query.esgrupalflag == "1" ? true : false,
  });
}
async function enviarCotizacion({
  id = null,
  individualflag = false,
  grupalflag = false,
}: {
  id?: unknown;
  individualflag?: boolean;
  grupalflag?: boolean;
}) {
  await calculadorasStore.EnviarCotizacionCalculadoraAPrincing({
    id: id,
    individualflag: individualflag,
    grupalflag: grupalflag,
  });
}
</script>

<template>
  <div>
    <v-btn
      variant="elevated"
      color="#01579B"
      class="ma-1 btnCalc"
      @click="enviarCotizacionAPricing"
      v-if="getNameUrl == 'VerCotizacionCalculadora'"
    >
      <v-icon class="mx-1">
        mdi-invoice-text-send-outline
      </v-icon> Enviar Pricing
    </v-btn>
  </div>
</template>
