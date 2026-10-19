<template>
  <v-container fluid>
    <v-text-field
      v-model="search"
      append-inner-icon="mdi-magnify"
      label="Buscar"
      single-line
      hide-details
      variant="outlined"
      style="max-width: 30%"
      density="compact"
    />
    <br />

    <v-data-table
      :headers="headers"
      :items="calculadorasStore.lstFlete"
      :search="search"
      item-value="id"
    >
      <template v-slot:item.action="{ item }">
        <v-btn variant="text" color="warning" @click="editFlete(item)" size="small" icon>
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <v-dialog v-model="dialog" max-width="35%">
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          {{ flete.puerto_origin }} <v-icon>mdi-arrow-right-thin</v-icon>
          {{ flete.puerto_destino }} <v-spacer></v-spacer>
          <v-icon @click="dialog = false">mdi-close</v-icon>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="flete.flete_0_5"
            label="De 0.1 - 5"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            v-model="flete.flete_5_10"
            label="De 5 - 10"
            variant="outlined"
            density="compact"
          />
          <v-text-field
            v-model="flete.flete_10_15"
            label="De 10 - 15"
            variant="outlined"
            density="compact"
          />
          <FormatFecha v-model="flete.vigencia" label="Vigencia" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardarFlete">Guardar</v-btn>
          <v-btn color="red" @click="dialog = false" variant="text">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCalculadorasStore } from "@/stores/calculadoras";
export default {
  emits: ["flete-actualizado"],
  components: {
    FormatFecha,
  },
  data() {
    return {
      search: "",
      dialog: false,
      headers: [
        { key: "action", title: "" },
        { key: "pais_origen", title: "Pais Origen" },
        { key: "puerto_origin", title: "Puerto Origin" },
        { key: "pais_destino", title: "Pais Destino" },
        { key: "puerto_destino", title: "Puerto Destino" },
        { key: "flete_0_5", title: "De 0.1 - 5" },
        { key: "flete_5_10", title: "De 5 - 10" },
        { key: "flete_10_15", title: "De 10 - 15" },
        { key: "moneda", title: "Moneda" },
        { key: "vigencia", title: "Vigencia" },
        { key: "created_user", title: "Usuario" },
        { key: "created_at", title: "Fecha Reg." },
      ],
      flete: {},
    };
  },
  computed: {
    ...mapStores(useCalculadorasStore),
  },
  methods: {
    ...mapPiniaActions(useCalculadorasStore, ['actualizarFlete']),
    editFlete(item) {
      this.flete = { ...item };
      this.dialog = true;
    },
    async guardarFlete() {
      await this.actualizarFlete(this.flete);
      this.$emit('flete-actualizado');
      this.dialog = false;
    },
  },
};
</script>

<style></style>
