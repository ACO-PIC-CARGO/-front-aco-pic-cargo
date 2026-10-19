<template>
  <div class="">
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
          <v-btn size="small" class="mx-1" color="#2962FF" @click="filtrar()"
            >FILTRAR</v-btn
          >
          <v-btn size="small" class="mx-1" color="#004D40">EXPORTAR</v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="cityStore.lstCity"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
            </template>
            <template v-slot:[`item.statuscalls`]="{ item }">
              <v-chip color="green" v-if="item.status_calls == 1"
                >Si</v-chip
              >
              <v-chip color="red" v-else>No</v-chip>
            </template>
            <template v-slot:[`item.statuscalls_all`]="{ item }">
              <v-chip color="green" v-if="item.status_calls_all == 1"
                >Si</v-chip
              >
              <v-chip color="red" v-else>No</v-chip>
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
              <v-tooltip location="bottom" v-if="item.status == 1">
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
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useCityStore } from "@/stores/city";
export default {
  data() {
    return {
      search: "",
      loading: false,
      headers: [
        { title: "Páis", key: "name_pais" },
        { title: "Estado (Región)", key: "name_state" },
        { title: "Código", key: "code" },
        { title: "Nombre", key: "name" },
        { title: "Descripción", key: "description" },
        { title: "Estado", key: "estado" },
        { title: "Creación", key: "created_at" },

        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
    };
  },
  computed: {
    ...mapStores(useCityStore),
  },
  methods: {
    ...mapActions(["_getPais", "_getState"]),
    ...mapPiniaActions(useCityStore, ["GetListCity", "ActualizarCity"]),
    async filtrar() {
      this.loading = !this.loading;
      this.cityStore.tipo = "filter";
      // await this._getState(this.cityStore.filtros.id_pais);
      this.loading = !this.loading;
      this.cityStore.drawer = !this.cityStore.drawer;
    },
    async ver(item) {
      this.loading = !this.loading;
      let datos = { ...item };
      this.cityStore.tipo = "ver";
      this.cityStore.model = datos;
      await this._getState(datos.id_pais);
      this.loading = !this.loading;
      this.cityStore.drawer = !this.cityStore.drawer;
    },
    async editar(item) {
      this.loading = !this.loading;
      let datos = { ...item };
      this.cityStore.tipo = "editar";
      this.cityStore.model = datos;
      await this._getState(datos.id_pais);
      this.loading = !this.loading;
      this.cityStore.drawer = !this.cityStore.drawer;
    },
    async nuevo() {
      this.loading = !this.loading;
      this.cityStore.tipo = "nuevo";
      this.cityStore.model = {
        id: "",
        id_pais: "",
        id_state: "",
        code: "",
        name: "",
        description: "",
        status: 1,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      // await this._getState(this.cityStore.model.id_state);
      this.cityStore.drawer = !this.cityStore.drawer;
      this.loading = !this.loading;
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
          this.cityStore.model = item;
          this.loading = true;
          await this.ActualizarCity();
          await this.GetListCity();
          this.loading = false;
        }
      });
    },
  },
  async mounted() {
    this.loading = !this.loading;
    await this.GetListCity();
    this.loading = !this.loading;
    await this._getPais();
  },
};
</script>

<style></style>
