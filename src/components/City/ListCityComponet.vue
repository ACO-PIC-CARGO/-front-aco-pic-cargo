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
            append-icon="mdi-magnify"
          ></v-text-field>
        </v-col>
        <v-col cols="4" offset="4" class="text-right my-auto">
          <v-btn size="small" color="success" @click="nuevo()">NUEVO</v-btn>
          <v-btn size="small" class="mx-1" color="#2962FF" @click="filtrar()" dark
            >FILTRAR</v-btn
          >
          <v-btn size="small" class="mx-1" color="#004D40" dark>EXPORTAR</v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="$store.state.city.lstCity"
            class="elevation-1"
            item-key="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
            </template>
            <template v-slot:[`item.statuscalls`]="{ item }">
              <v-chip color="green" v-if="item.status_calls == 1" dark
                >Si</v-chip
              >
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
      headers: [
        { text: "Páis", value: "name_pais" },
        { text: "Estado (Región)", value: "name_state" },
        { text: "Código", value: "code" },
        { text: "Nombre", value: "name" },
        { text: "Descripción", value: "description" },
        { text: "Estado", value: "estado" },
        { text: "Creación", value: "created_at" },

        { text: "Última Actualización", value: "updated_at" },
        { text: "Acciones", value: "action" },
      ],
    };
  },
  methods: {
    ...mapActions(["GetListCity", "_getPais", "ActualizarCity", "_getState"]),
    async filtrar() {
      this.loading = !this.loading;
      this.$store.state.city.tipo = "filter";
      // await this._getState(this.$store.state.city.filtros.id_pais);
      this.loading = !this.loading;
      this.$store.state.city.drawer = !this.$store.state.city.drawer;
    },
    async ver(item) {
      this.loading = !this.loading;
      let datos = { ...item };
      this.$store.state.city.tipo = "ver";
      this.$store.state.city.model = datos;
      await this._getState(datos.id_pais);
      this.loading = !this.loading;
      this.$store.state.city.drawer = !this.$store.state.city.drawer;
    },
    async editar(item) {
      this.loading = !this.loading;
      let datos = { ...item };
      this.$store.state.city.tipo = "editar";
      this.$store.state.city.model = datos;
      await this._getState(datos.id_pais);
      this.loading = !this.loading;
      this.$store.state.city.drawer = !this.$store.state.city.drawer;
    },
    async nuevo() {
      this.loading = !this.loading;
      this.$store.state.city.tipo = "nuevo";
      this.$store.state.city.model = {
        id: "",
        id_pais: "",
        id_state: "",
        code: "",
        name: "",
        description: "",
        status: 1,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      // await this._getState(this.$store.state.city.model.id_state);
      this.$store.state.city.drawer = !this.$store.state.city.drawer;
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
          this.$store.state.city.model = item;
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
