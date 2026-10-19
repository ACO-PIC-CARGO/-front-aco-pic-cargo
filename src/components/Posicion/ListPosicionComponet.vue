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
          <!-- <v-btn small color="success" :loading="loadingNuevo" @click="nuevo()"
            >NUEVO</v-btn
          > -->
          <!-- <v-btn
            small
            class="mx-1"
            :loading="loadingFiltrar"
            color="#2962FF"
            @click="filtrar()"
            dark
            >FILTRAR</v-btn
          >
          <v-btn small class="mx-1" color="#004D40" dark>EXPORTAR</v-btn> -->
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="positionStore.lstPosition"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.status`]="{ item }">
              {{ !!item.estado ? "Activo" : "Inactivo" }}
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
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.estado ? "Activo" : "Inactivo" }}
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
                <!-- <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="warning"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="editar(item)"
                  >
                    mdi-pencil
                  </v-icon>
                </template> -->
                <span>Editar</span>
              </v-tooltip>
              <!-- <v-tooltip bottom v-if="item.estado">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="error"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="eliminar(item)"
                  >
                    mdi-delete
                  </v-icon>
                </template>
                <span>Eliminar</span>
              </v-tooltip> -->
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
import { usePositionStore } from "@/stores/position";
export default {
  data() {
    return {
      search: "",
      loading: false,
      loadingNuevo: false,
      loadingFiltrar: false,
      headers: [
        { title: "Código", key: "code" },
        { title: "Nombre", key: "name" },
        // { text: "Descripción", value: "description" },
        { title: "Estado", key: "estado" },
        { title: "Creación", key: "created_at" },

        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
    };
  },
  computed: {
    ...mapStores(usePositionStore),
  },
  methods: {
    ...mapActions([
      "_getPais",
      "_getState",
      "_getCity",
    ]),
    ...mapPiniaActions(usePositionStore, ["GetListPosition", "ActualizarEstadoPosition"]),
    async filtrar() {
      this.loadingFiltrar = !this.loadingFiltrar;

      this.loadingFiltrar = !this.loadingFiltrar;
      this.positionStore.drawer = !this.positionStore.drawer;
    },
    async ver(item) {
      this.$router.push({
        name: "verPosicion",
        params: {
          id: item.id,
        },
      });
    },
    async editar(item) {
      this.$router.push({
        name: "editarPosicion",
        params: {
          id: item.id,
        },
      });
    },
    async nuevo() {
      this.loadingNuevo = !this.loadingNuevo;
      this.positionStore.tipo = "nuevo";
      this.positionStore.model = {
        id: "",
        id_pais: "",
        id_state: "",
        code: "",
        name: "",
        description: "",
        status: 1,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      await this._getState(this.positionStore.model.id_state);
      await this._getCity(this.positionStore.model.id_state);
      this.positionStore.drawer = !this.positionStore.drawer;
      this.loadingNuevo = !this.loadingNuevo;
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
          this.positionStore.model = item;
          this.loading = true;
          await this.ActualizarEstadoPosition();
          await this.GetListPosition();
          this.loading = false;
        }
      });
    },
  },
  async mounted() {
    this.loading = !this.loading;
    await this.GetListPosition();
    this.loading = !this.loading;
    await this._getPais();
  },
};
</script>

<style></style>
