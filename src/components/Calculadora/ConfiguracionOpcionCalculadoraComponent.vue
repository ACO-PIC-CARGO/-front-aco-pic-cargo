<template>
  <v-container fluid>
    <v-data-table :headers="headers" :items="lstOpciones">
      <template v-slot:[`item.nombre`]="{ item }">
        <v-textarea
          v-model="item.nombre"
          :disabled="!item.editarflag"
          hide-details
          dense
          outlined
          auto-grow
          rows="1"
        ></v-textarea>
      </template>
      <template v-slot:[`item.frecuencia`]="{ item }">
        <v-textarea
          v-model="item.frecuencia"
          :disabled="!item.editarflag"
          hide-details
          dense
          outlined
          auto-grow
          rows="1"
        ></v-textarea>
      </template>
      <template v-slot:[`item.volumenmax`]="{ item }">
        <v-text-field
          v-model="item.volumenmax"
          :disabled="!item.editarflag"
          :hide-details="!item.editarflag"
          dense
          outlined
          style="max-width: 100px"
          messages=" "
          type="number"
        >
          <template v-slot:message>
            <span
              v-if="item.editarflag"
              style="color: orange; font-style: italic; font-size: 0.7rem"
            >
              Si el monto es 0, se considerará la opción sin restricción
            </span>
          </template>
        </v-text-field>
      </template>
      <template v-slot:[`item.toneladamax`]="{ item }">
        <v-text-field
          v-model="item.toneladamax"
          :disabled="!item.editarflag"
          :hide-details="!item.editarflag"
          dense
          outlined
          style="max-width: 100px"
          messages=" "
          type="number"
        >
          <template v-slot:message>
            <span
              v-if="item.editarflag"
              style="color: orange; font-style: italic; font-size: 0.7rem"
            >
              Si el monto es 0, se considerará la opción sin restricción
            </span>
          </template>
        </v-text-field>
      </template>

      <template v-slot:[`item.estado`]="{ item }">
        <v-chip
          class="ma-2"
          color="green"
          text-color="white"
          v-if="item.estado"
        >
          Activo
        </v-chip>

        <v-chip class="ma-2" color="orange" text-color="white" v-else>
          Inactivo
        </v-chip>
      </template>

      <template v-slot:[`item.esgrupalflag`]="{ item }">
        <v-chip
          style="
            min-width: 130px;
            text-align: center;
            align-items: center;
            align-content: center;
          "
          v-if="item.esgrupalflag"
          color="success"
          outlined
        >
          <v-icon class="ma-2"> mdi-account-group </v-icon>
          Grupal
        </v-chip>

        <v-chip
          style="
            min-width: 130px;
            text-align: center;
            align-items: center;
            align-content: center;
          "
          v-else
          color="primary"
          outlined
        >
          <v-icon class="ma-2"> mdi-account </v-icon>
          Individual
        </v-chip>
      </template>
      <template v-slot:[`item.action`]="{ item }">
        <v-btn
          v-if="!item.editarflag"
          color="warning"
          small
          @click="item.editarflag = true"
          >Editar</v-btn
        >
        <v-btn
          v-if="item.editarflag"
          color="success"
          small
          @click="actualizarOpcion(item)"
          >Guardar</v-btn
        >
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";

export default {
  data() {
    return {
      headers: [
        { width: "25%", text: "Nombre", value: "nombre" },
        { width: "25%", text: "Descripción", value: "frecuencia" },
        { width: "5%", text: "Estado", value: "estado", align: "center" },
        {
          width: "5%",
          text: "Orden Presentación",
          value: "orden",
          align: "center",
        },
        { width: "12%", text: "Tipo", value: "esgrupalflag", align: "center" },
        {
          width: "10%",
          text: "Volumen Máximo",
          value: "volumenmax",
          align: "center",
        },
        {
          width: "10%",
          text: "Tonelada Máxima",
          value: "toneladamax",
          align: "center",
        },
        { text: "", value: "action", align: "center" },
      ],
    };
  },
  computed: {
    lstOpciones: {
      get() {
        return this.$store.state.calculadoras.lstOpciones;
      },
      set(value) {
        // Si necesitas actualizarlo, lo ideal es llamar a una mutación de Vuex:
        // this.$store.commit("nombreDeTuMutacion", value);
      },
    },
  },
  methods: {
    ...mapActions(["opcionActualizar"]),
    async actualizarOpcion(item) {
      await this.opcionActualizar(item);
    },
  },
};
</script>

<style></style>
