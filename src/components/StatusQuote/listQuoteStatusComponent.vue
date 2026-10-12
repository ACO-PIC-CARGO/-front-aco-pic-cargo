<template>
  <!-- <div class="">{{ $store.state.QuoteStatus.statusQuoteList }}</div> -->
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
          @click="
            ($store.state.QuoteStatus.drawer =
              !$store.state.QuoteStatus.drawer) &&
              ($store.state.QuoteStatus.tipo = 'filter')
          "
          dark
          >FILTRAR</v-btn
        >
        <v-btn size="small" class="mx-1" color="#004D40" dark>EXPORTAR</v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="$store.state.QuoteStatus.statusQuoteList"
          class="elevation-1"
          item-key="id"
          :loading="loading"
          :search="search"
        >
          <template v-slot:[`item.estado`]="{ item }">
            {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
          </template>
          <template v-slot:[`item.statuscalls`]="{ item }">
            <v-chip color="green" v-if="item.status_calls == 1" dark>Si</v-chip>
            <v-chip color="red" v-else dark>No</v-chip>
          </template>
          <template v-slot:[`item.statuscalls_all`]="{ item }">
            <v-chip color="green" v-if="item.status_calls_all == 1" dark
              >Si</v-chip
            >
            <v-chip color="red" v-else dark>No</v-chip>
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
            <v-tooltip location="bottom" v-if="item.status == 1">
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
        { title: "Código", key: "code" },
        { title: "Nombre", key: "name" },
        // { text: "Descripción", value: "description" },
        { title: "Temperatura del lead ", key: "temperatura" },
        { title: "Posición ", key: "position" },
        // temperatura
        // temperaturadescripcion
        // backgroundtemperatura
        // { text: "Posición Listado Llamadas", value: "position_calls" },
        // { text: "Posición Reportes", value: "position_report" },
        // { text: "Posición Registro", value: "position_select" },
        // { text: "Uso Llamadas", value: "statuscalls" },
        // { text: "Uso Todas Llamadas", value: "statuscalls_all" },
        { title: "Estado", key: "estado" },
        { title: "Creación", key: "created_at" },
        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
    };
  },
  async mounted() {
    this.loading = true;
    await this.GetListQuoteStatus();
    this.loading = false;
    this.cargarTemperaturaLeds()
  },
  methods: {
    ...mapActions(["GetListQuoteStatus", "actualizarQuoteStatus","cargarTemperaturaLeds"]),
    ver(item) {
      let datos = { ...item };
      this.$store.state.QuoteStatus.tipo = "ver";
      this.$store.state.QuoteStatus.StatusModel = datos;
      this.$store.state.QuoteStatus.drawer =
        !this.$store.state.QuoteStatus.drawer;
    },
    editar(item) {
      let datos = { ...item };
      this.$store.state.QuoteStatus.tipo = "editar";
      this.$store.state.QuoteStatus.StatusModel = datos;
      this.$store.state.QuoteStatus.drawer =
        !this.$store.state.QuoteStatus.drawer;
    },
    nuevo() {
      this.$store.state.QuoteStatus.tipo = "nuevo";
      this.$store.state.QuoteStatus.StatusModel = {
        id: "",
        name: "",
        code: "",
        position: this.$store.state.QuoteStatus.max_position,
        position_calls: this.$store.state.QuoteStatus.max_position_calls,
        position_report: this.$store.state.QuoteStatus.max_position_report,
        position_select: this.$store.state.QuoteStatus.max_position_select,
        status_calls: "",
        status_calls_all: "",
        description: "",
        status: 1,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      this.$store.state.QuoteStatus.drawer =
        !this.$store.state.QuoteStatus.drawer;
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
          item.status = 0;
          this.$store.state.QuoteStatus.StatusModel = item;
          this.loading = true;
          await this.actualizarQuoteStatus();
          await this.GetListQuoteStatus();
          this.loading = false;
        }
      });
    },
  },
};
</script>

<style></style>
