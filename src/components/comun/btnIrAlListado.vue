<template>
  <v-btn
    color="info"
    dark
    class="mx-1"
    v-if="routeVerEditarParaVolverListado.includes(getNameUrl())"
    @click="iraListado()"
  >
    <v-icon>mdi-format-list-bulleted</v-icon> IR AL LISTADO
  </v-btn>
</template>

<script>
export default {
  data() {
    return {
      routeVerEditarParaVolverListado: [
        "editControlGasto",
        "verControlGasto",
        "verQuote",
        "editQuote",
        "controlHouseEditar",
        "controlHouseVer",
        "controlMasterEditar",
        "controlMasterVer",
      ],
    };
  },
  methods: {
    iraListado() {
      const route = this.$route.name;

      let nombreRutaIr = "";
      if (!this.routeVerEditarParaVolverListado.includes(route)) {
        return;
      }
      const routes = {
        listControlGastos: ["editControlGasto", "verControlGasto"],
        lstQuote: ["verQuote", "editQuote"],
        listHouse: ["controlHouseEditar", "controlHouseVer"],
        listMaster: ["controlMasterEditar", "controlMasterVer"],
      };

      nombreRutaIr =
        Object.keys(routes).find((key) => routes[key].includes(route)) ||
        nombreRutaIr;
      if (nombreRutaIr) {
        this.$router.push({ name: nombreRutaIr });
      } else {
        console.warn("No se encontró una ruta de destino para:", route);
      }
    },
    getNameUrl() {
      let name = this.$route.name;

      return name;
    },
    // obtenerTipoAlert,
  },
};
</script>

<style></style>
