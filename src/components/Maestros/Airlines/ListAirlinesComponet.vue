<template>
  <v-card fluid class="px-5">
    <v-row>
      <v-col cols="4">
        <v-text-field
          label="Buscar"
          placeholder="Buscar"
          v-model="search"
          clearable
          append-inner-icon="mdi-magnify"
        ></v-text-field>
      </v-col>
      <v-col cols="4" offset="4" class="text-right my-auto">
        <v-btn size="small" color="success" @click="nuevo()">NUEVO</v-btn>
        <v-btn
          size="small"
          class="mx-1"
          color="#2962FF"
          @click="
            (airlinesStore.drawer = !airlinesStore.drawer) &&
              (airlinesStore.tipo = 'filter')
          "
          >FILTRAR</v-btn
        >
        <v-btn size="small" class="mx-1" color="#004D40">EXPORTAR</v-btn>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="airlinesStore.lstAirline"
          class="elevation-1"
          item-value="id"
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
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useAirlinesStore } from "@/stores/airlines";
export default {
  data() {
    return {
      search: "",
      loading: false,
      headers: [
        { key: "pais_name", title: "País" },
        { key: "code", title: "Código" },
        { key: "code_iata", title: "Código IATA" },
        { key: "code_icao", title: "Código ICAO" },
        { key: "name", title: "Nombre" },
        { title: "Estado", key: "estado" },
        { title: "Creación", key: "created_at" },
        { title: "Última Actualización", key: "updated_at" },
        { key: "action", title: "Acciones" },
      ],
    };
  },
  async mounted() {
    this.loading = true;
    await this._getPais();
    await this.GetListAirline();
    this.loading = false;
  },

  computed: {
    ...mapStores(useAirlinesStore),
  },
  methods: {
    ...mapActions(["_getPais"]),
    ...mapPiniaActions(useAirlinesStore, ["GetListAirline", "actualizarAirline"]),
    ver(item) {
      let datos = { ...item };
      this.airlinesStore.tipo = "ver";
      this.airlinesStore.AirlineModel = datos;
      this.airlinesStore.drawer = !this.airlinesStore.drawer;
    },
    editar(item) {
      let datos = { ...item };
      this.airlinesStore.tipo = "editar";
      this.airlinesStore.AirlineModel = datos;
      this.airlinesStore.drawer = !this.airlinesStore.drawer;
    },
    nuevo() {
      this.airlinesStore.tipo = "nuevo";
      this.airlinesStore.AirlineModel = {
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
      this.airlinesStore.drawer = !this.airlinesStore.drawer;
    },
    filter() {
      this.airlinesStore.tipo = "filter";
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
          this.airlinesStore.AirlineModel = item;
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
