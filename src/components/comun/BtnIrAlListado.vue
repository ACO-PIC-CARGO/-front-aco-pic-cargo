<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

const routeVerEditarParaVolverListado = [
  "editControlGasto",
  "verControlGasto",
  "verQuote",
  "editQuote",
  "controlHouseEditar",
  "controlHouseVer",
  "controlMasterEditar",
  "controlMasterVer",
];

function iraListado() {
  const name = route.name as string;

  let nombreRutaIr = "";
  if (!routeVerEditarParaVolverListado.includes(name)) {
    return;
  }
  const routes: Record<string, string[]> = {
    listControlGastos: ["editControlGasto", "verControlGasto"],
    lstQuote: ["verQuote", "editQuote"],
    listHouse: ["controlHouseEditar", "controlHouseVer"],
    listMaster: ["controlMasterEditar", "controlMasterVer"],
  };

  nombreRutaIr = Object.keys(routes).find((key) => routes[key]!.includes(name)) || nombreRutaIr;
  if (nombreRutaIr) {
    router.push({ name: nombreRutaIr });
  } else {
    console.warn("No se encontró una ruta de destino para:", name);
  }
}
function getNameUrl() {
  return route.name as string;
}
// obtenerTipoAlert,
</script>

<template>
  <v-btn
    variant="elevated"
    color="info"
    class="mx-1"
    v-if="routeVerEditarParaVolverListado.includes(getNameUrl())"
    @click="iraListado()"
  >
    <v-icon>mdi-format-list-bulleted</v-icon> IR AL LISTADO
  </v-btn>
</template>
