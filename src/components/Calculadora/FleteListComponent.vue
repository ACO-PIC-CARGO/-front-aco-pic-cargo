<template>
  <v-container fluid>
    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Buscar"
      single-line
      hide-details
      outlined
      style="max-width: 30%; "
      dense
    />
    <br/>

    <v-data-table
      :headers="headers"
      :items="$store.state.calculadoras.lstFlete"
      :search="search"
      item-key="id"
    >
    </v-data-table>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      search: "",
      headers: [
        { value: "pais_origen", text: "Pais Origen" },
        { value: "puerto_origin", text: "Puerto Origin" },
        { value: "pais_destino", text: "Pais Destino" },
        { value: "puerto_destino", text: "Puerto Destino" },
        { value: "flete_0_5", text: "De 0.1 - 5" },
        { value: "flete_5_10", text: "De 5 - 10" },
        { value: "flete_10_15", text: "De 10 - 15" },
        { value: "moneda", text: "Moneda" },
        { value: "vigencia", text: "Vigencia" },
        { value: "created_user", text: "Usuario" },
        { value: "created_at", text: "Fecha Reg." },
      ],
    };
  },
};
</script>

<style></style>
