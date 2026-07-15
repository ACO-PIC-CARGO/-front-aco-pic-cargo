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
          <v-btn small color="success" @click="nuevo()">NUEVO</v-btn>
          <v-btn small class="mx-1" color="#2962FF" @click="filtrar()" dark
            >FILTRAR</v-btn
          >
          <v-btn small class="mx-1" color="#004D40" dark>EXPORTAR</v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headersPorEmpresa"
            :items="$store.state.masterusuarios.lstNotasQuote"
            class="elevation-1"
            item-key="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.individualflag`]="{ item }">
              <v-chip :color="item.individualflag ? 'success' : 'warning'">
                {{ item.individualflag ? "SI" : "NO" }}
              </v-chip>
            </template>
            <template v-slot:[`item.grupalflag`]="{ item }">
              <v-chip :color="item.grupalflag ? 'success' : 'warning'">
                {{ item.grupalflag ? "SI" : "NO" }}
              </v-chip>
            </template>
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
            </template>

            <template v-slot:[`item.action`]="{ item }">
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="primary"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="ver(item)"
                  >
                    mdi-eye
                  </v-icon>
                </template>
                <span>Ver</span>
              </v-tooltip>
              <v-tooltip bottom>
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="warning"
                    dark
                    v-bind="attrs"
                    v-on="on"
                    @click="editar(item)"
                  >
                    mdi-pencil
                  </v-icon>
                </template>
                <span>Editar</span>
              </v-tooltip>
              <v-tooltip bottom v-if="item.status == 1">
                <template v-slot:activator="{ on, attrs }">
                  <v-icon
                    color="error"
                    dark
                    v-bind="attrs"
                    v-on="on"
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
        { width: "5%", mostrarflag: true, text: "Orden", value: "orden" },
        {
          width: "5%",
          mostrarflag: true,
          text: "Código",
          value: "valorcodigo",
        },
        {
          width: "50%",
          mostrarflag: true,
          text: "Nombre",
          value: "description",
        },
        {
          width: "10%",
          mostrarflag: false,
          text: "Invidual",
          value: "individualflag",
        },
        {
          width: "10%",
          mostrarflag: false,
          text: "Grupal",
          value: "grupalflag",
        },
        { width: "10%", mostrarflag: true, text: "Estado", value: "estado" },
        // { mostrarflag: true, text: "Creación", value: "created_at" },
        // {
        //   mostrarflag: true,
        //   text: "Última Actualización",
        //   value: "updated_at",
        // },
        { width: "10%", mostrarflag: true, text: "Acciones", value: "action" },
      ],
    };
  },
  methods: {
    ...mapActions(["GetListNotasCotizacion", "ActualizarMasterDetalle"]),
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
      const lista = this.$store.state.masterusuarios.lstNotasQuote;
      const maxOrden =
        lista.length > 0
          ? Math.max(...lista.map((item) => Number(item.orden) || 0))
          : 0;
      const nuevoOrden = maxOrden + 1;

      this.$store.state.masterusuarios.model = {
        id: "",
        id_master: "",
        valorcodigo: "",
        codigo01: "",
        codigo02: "",
        description: "",
        status: true,
        escomunflag: "",
        individualflag: true,
        grupalflag: true,
        orden: nuevoOrden,
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
          await this.GetListNotasCotizacion();
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
    await this.GetListNotasCotizacion();
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

    headersPorEmpresa() {
      let valEmpresaPic = [1, 2];
      let empresa = JSON.parse(localStorage.getItem("dataBranch"))[0];
      if (valEmpresaPic.includes(empresa.id)) {
        return this.headers;
      } else {
        return this.headers.filter((v) => v.mostrarflag);
      }
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
