<template>
  <v-container fluid>
    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      label="Buscar"
      single-line
      hide-details
      outlined
      style="max-width: 30%"
      dense
    />
    <br />

    <v-data-table
      :headers="headers"
      :items="$store.state.calculadoras.lstFlete"
      :search="search"
      item-key="id"
    >
      <template v-slot:item.action="{ item }">
        <v-btn color="warning" @click="editFlete(item)" small icon>
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </template>
    </v-data-table>
    <v-dialog v-model="dialog" max-width="35%">
      <v-card>
        <v-card-title>
          {{ flete.puerto_origin }} <v-icon>mdi-arrow-right-thin</v-icon>
          {{ flete.puerto_destino }} <v-spacer></v-spacer>
          <v-icon @click="dialog = false">mdi-close</v-icon>
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="flete.flete_0_5"
            label="De 0.1 - 5"
            outlined
            dense
          />
          <v-text-field
            v-model="flete.flete_5_10"
            label="De 5 - 10"
            outlined
            dense
          />
          <v-text-field
            v-model="flete.flete_10_15"
            label="De 10 - 15"
            outlined
            dense
          />
          <FormatFecha v-model="flete.vigencia" label="Vigencia" outlined dense />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="guardarFlete">Guardar</v-btn>
          <v-btn color="red" @click="dialog = false" text>Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import FormatFecha from "@/components/comun/FormatFecha.vue";
import { mapActions } from 'vuex';
export default {
  components: {
    FormatFecha,
  },
  data() {
    return {
      search: "",
      dialog: false,
      headers: [
        { value: "action", text: "" },
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
      flete: {},
    };
  },
  methods: {
    ...mapActions(['actualizarFlete']),
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
