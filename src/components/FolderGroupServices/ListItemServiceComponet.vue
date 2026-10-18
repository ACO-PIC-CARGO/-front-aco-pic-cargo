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
          <v-btn size="small" color="success" :loading="loadingNuevo" @click="nuevo()"
            >NUEVO</v-btn
          >
          <v-btn
            size="small"
            class="mx-1"
            :loading="loadingFiltrar"
            color="#2962FF"
            @click="filtrar()"
            >FILTRAR</v-btn
          >
          <v-btn size="small" class="mx-1" color="#004D40">EXPORTAR</v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="$store.state.itemServices.lstItemServices"
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
export default {
  data() {
    return {
      search: "",
      loading: false,
      loadingNuevo: false,
      loadingFiltrar: false,
      headers: [
        { title: "Servicio", key: "name_groupservices" },
        { title: "Código", key: "code" },
        { title: "Nombre", key: "name" },
        { title: "Descripción", key: "description" },
                { title: "Estado", key: "estado" },{ title: "Creación", key: "created_at" },

        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
    };
  },
  methods: {
    ...mapActions([
      "GetListItemServices",
      "CargarGroupServices",
      "ActualizarItemServices",
    ]),
    async filtrar() {
      this.$store.state.itemServices.tipo = "filter";
      this.$store.state.itemServices.drawer =
        !this.$store.state.itemServices.drawer;
    },
    async ver(item) {
      this.loading = !this.loading;
      let datos = { ...item };
      this.$store.state.itemServices.tipo = "ver";
      this.$store.state.itemServices.model = datos;

      this.loading = !this.loading;
      this.$store.state.itemServices.drawer =
        !this.$store.state.itemServices.drawer;
    },
    async editar(item) {
      this.loading = !this.loading;
      let datos = { ...item };
      this.$store.state.itemServices.tipo = "editar";
      this.$store.state.itemServices.model = datos;

      this.loading = !this.loading;
      this.$store.state.itemServices.drawer =
        !this.$store.state.itemServices.drawer;
    },
    async nuevo() {
      this.loadingNuevo = !this.loadingNuevo;
      this.$store.state.itemServices.tipo = "nuevo";
      this.$store.state.itemServices.model = {
        id: "",
        id_groupservices: "",
        code: "",
        name: "",
        description: "",
        status: "1",
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };

      this.$store.state.itemServices.drawer =
        !this.$store.state.itemServices.drawer;
      this.loadingNuevo = !this.loadingNuevo;
    },
    async eliminar(item) {
      Swal.fire({
        icon: "question",
        title: "¿Estás seguro?",
        text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
        allowOutsideClick: false,
        confirmButtonText: "Si, inactivar",
        cancelButtonColor: "orange",
        confirmButtonColor: "red",
        cancelButtonText: "Cancelar",
        cancelButtonColor: "orange",
        showCancelButton: true,
      }).then(async (res) => {
        if (res.isConfirmed) {
          item.status = 0;
          this.$store.state.itemServices.model = item;
          this.loading = true;
          await this.ActualizarItemServices();
          await this.GetListItemServices();
          this.loading = false;
        }
      });
    },
  },
  async mounted() {
    this.loading = !this.loading;
    await this.GetListItemServices();

    this.loading = !this.loading;
    await this.CargarGroupServices();
  },
};
</script>

<style></style>
