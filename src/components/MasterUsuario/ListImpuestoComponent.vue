<template>
  <div class="" v-if="mostrarflag">
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
          <!-- <v-btn small color="success" @click="nuevo()">NUEVO</v-btn> -->
          <v-btn size="small" class="mx-1" color="#2962FF" @click="filtrar()" dark
            >FILTRAR</v-btn
          >
          <v-btn size="small" class="mx-1" color="#004D40" dark>EXPORTAR</v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="$store.state.masterusuarios.lstImpuesto"
            class="elevation-1"
            item-key="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
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
              <v-tooltip location="bottom">
                <template v-slot:activator="{ props }">
                  <v-icon
                    color="error"
                    dark
                   
                    v-bind="props"
                    v-if="item.status == true"
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
      mostrarflag: true,
      loading: false,
      headers: [
        { title: "Código", key: "valorcodigo" },
        { title: "Descripción", key: "description" },
        { title: "Porcentaje", key: "codigo01" },
        // { text: "Fórmula", value: "codigo02" },
                { title: "Estado", key: "estado" },{ title: "Creación", key: "created_at" },

        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
    };
  },
  methods: {
    ...mapActions(["GetListImpuestos", "ActualizarMasterDetalle"]),
    async filtrar() {
      this.$store.state.masterusuarios.tipo = "filter";
      this.$store.state.masterusuarios.drawer =
        !this.$store.state.masterusuarios.drawer;
    },
    async ver(item) {
      let datos = { ...item };
      this.$store.state.masterusuarios.tipo = "ver";
      this.$store.state.masterusuarios.model = datos;
      this.$store.state.masterusuarios.drawer =
        !this.$store.state.masterusuarios.drawer;
    },
    async editar(item) {
      let datos = { ...item };
      this.$store.state.masterusuarios.tipo = "editar";
      this.$store.state.masterusuarios.model = datos;

      this.$store.state.masterusuarios.drawer =
        !this.$store.state.masterusuarios.drawer;
    },
    async nuevo() {
      this.$store.state.masterusuarios.tipo = "nuevo";
      this.$store.state.masterusuarios.model = {
        id: "",
        id_master: "",
        valorcodigo: "",
        codigo01: "",
        codigo02: "",
        description: "",
        status: true,
        escomunflag: "",
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      this.$store.state.masterusuarios.drawer =
        !this.$store.state.masterusuarios.drawer;
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
          this.$store.state.masterusuarios.model = item;
          this.loading = true;
          await this.ActualizarMasterDetalle();
          await this.GetListImpuestos();
          this.loading = false;
          this.mostrarflag = !this.mostrarflag;
          setTimeout(() => {
            this.mostrarflag = !this.mostrarflag;
          }, 5);
        }
      });
    },
  },
  async mounted() {
    this.loading = !this.loading;
    await this.GetListImpuestos();
    this.loading = !this.loading;
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.masterusuarios.drawer;
      },
      set(val) {
        return (this.$store.state.masterusuarios.drawer = drawer);
      },
    },
  },
  watch: {
    async drawer() {
      let caseRecargar = ["nuevo", "editar", "filter"];
      if (!this.drawer) {
        if (caseRecargar.includes(this.$store.state.masterusuarios.tipo)) {
          // setTimeout(() => {

          // }, 10);
          this.mostrarflag = !this.mostrarflag;
          setTimeout(() => {
            this.mostrarflag = !this.mostrarflag;
          }, 5);
        }
      }
    },
  },
};
</script>

<style></style>
