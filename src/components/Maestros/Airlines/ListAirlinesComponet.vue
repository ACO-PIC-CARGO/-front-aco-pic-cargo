<template>
  <v-card fluid class="px-5">
    <v-row>
      <v-col cols="4">
        <v-text-field
          label="Buscar"
          placeholder="Buscar"
          v-model="search"
          clearable
          append-icon="mdi-magnify"
        ></v-text-field>
      </v-col>
      <v-col cols="4" offset="4" class="text-right my-auto">
        <v-btn size="small" color="success" @click="nuevo()">NUEVO</v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          dark
          @click="
            ($store.state.airlines.drawer = !$store.state.airlines.drawer) &&
              ($store.state.airlines.tipo = 'filter')
          "
          >FILTRAR</v-btn
        >
        <v-btn size="small" class="mx-1" color="#004D40" dark>EXPORTAR</v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="$store.state.airlines.lstAirline"
          class="elevation-1"
          item-key="id"
          :loading="loading"
          :search="search"
        >
          <template v-slot:[`item.estado`]="{ item }">
            {{ !!item.status ? "Activo" : "Inactivo" }}
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props }">
                <v-icon
                  color="primary"
                  dark
                 
                  v-bind="props"
                  @click="ver(item)"
                >
                  mdi-eye
                </v-icon>
              </template>
              <span>Ver</span>
            </v-tooltip>
            <v-tooltip location="bottom">
              <template v-slot:activator="{ props }">
                <v-icon
                  color="warning"
                  dark
                 
                  v-bind="props"
                  @click="editar(item)"
                >
                  mdi-pencil
                </v-icon>
              </template>
              <span>Editar</span>
            </v-tooltip>
            <v-tooltip location="bottom" v-if="!!item.status">
              <template v-slot:activator="{ props }">
                <v-icon
                  color="error"
                  dark
                 
                  v-bind="props"
                  @click="eliminar(item)"
                >
                  mdi-delete
                </v-icon>
              </template>
              <span>Eliminar</span>
            </v-tooltip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      search: "",
      loading: false,
      headers: [
        { value: "pais_name", text: "País" },
        { value: "code", text: "Código" },
        { value: "code_iata", text: "Código IATA" },
        { value: "code_icao", text: "Código ICAO" },
        { value: "name", text: "Nombre" },
        { text: "Estado", value: "estado" },
        { text: "Creación", value: "created_at" },
        { text: "Última Actualización", value: "updated_at" },
        { value: "action", text: "Acciones" },
      ],
    };
  },
  async mounted() {
    this.loading = true;
    await this._getPais();
    await this.GetListAirline();
    this.loading = false;
  },

  methods: {
    ...mapActions(["GetListAirline", "_getPais", "actualizarAirline"]),
    ver(item) {
      let datos = { ...item };
      this.$store.state.airlines.tipo = "ver";
      this.$store.state.airlines.AirlineModel = datos;
      this.$store.state.airlines.drawer = !this.$store.state.airlines.drawer;
    },
    editar(item) {
      let datos = { ...item };
      this.$store.state.airlines.tipo = "editar";
      this.$store.state.airlines.AirlineModel = datos;
      this.$store.state.airlines.drawer = !this.$store.state.airlines.drawer;
    },
    nuevo() {
      this.$store.state.airlines.tipo = "nuevo";
      this.$store.state.airlines.AirlineModel = {
        code_iata: "",
        name: "",
        code_icao: "",
        code_three: "",
        id_pais: "",
        created_at: "",
        updated_at: "",
        code: "",
        status: true,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      this.$store.state.airlines.drawer = !this.$store.state.airlines.drawer;
    },
    filter() {
      this.$store.state.airlines.tipo = "filter";
    },
    async eliminar(item) {
      Swal.fire({
        icon: "question",
        title: "¿Estás seguro?",
        text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
        allowOutsideClick: false,
        confirmButtonText: "Si, inactivar",
        confirmButtonColor: "red",
        cancelButtonText: "Cancelar",
        cancelButtonColor: "orange",
        showCancelButton: true,
      }).then(async (res) => {
        if (res.isConfirmed) {
          item.status = false;
          this.$store.state.airlines.AirlineModel = item;
          this.loading = true;
          await this.actualizarAirline();
          await this.GetListAirline();
          this.loading = false;
        }
      });
    },
  },
};
</script>

<style></style>
