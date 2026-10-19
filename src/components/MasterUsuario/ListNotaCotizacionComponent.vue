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
            :headers="headersPorEmpresa"
            :items="masterusuariosStore.lstNotasQuote"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.individualflag`]="{ item }">
              <v-chip :color="item.individualflag ? 'success' : 'warning'" variant="flat">
                {{ item.individualflag ? "SI" : "NO" }}
              </v-chip>
            </template>
            <template v-slot:[`item.grupalflag`]="{ item }">
              <v-chip :color="item.grupalflag ? 'success' : 'warning'" variant="flat">
                {{ item.grupalflag ? "SI" : "NO" }}
              </v-chip>
            </template>
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
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
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
export default {
  data() {
    return {
      search: "",
      mostrarflag: true,
      loading: false,
      headers: [
        { width: "5%", mostrarflag: true, title: "Orden", key: "orden" },
        {
          width: "5%",
          mostrarflag: true,
          title: "Código",
          key: "valorcodigo",
        },
        {
          width: "50%",
          mostrarflag: true,
          title: "Nombre",
          key: "description",
        },
        {
          width: "10%",
          mostrarflag: false,
          title: "Invidual",
          key: "individualflag",
        },
        {
          width: "10%",
          mostrarflag: false,
          title: "Grupal",
          key: "grupalflag",
        },
        { width: "10%", mostrarflag: true, title: "Estado", key: "estado" },
        // { mostrarflag: true, text: "Creación", value: "created_at" },
        // {
        //   mostrarflag: true,
        //   text: "Última Actualización",
        //   value: "updated_at",
        // },
        { width: "10%", mostrarflag: true, title: "Acciones", key: "action" },
      ],
    };
  },
  methods: {
    ...mapPiniaActions(useMasterusuariosStore, ["GetListNotasCotizacion", "ActualizarMasterDetalle"]),
    async filtrar() {
      this.masterusuariosStore.tipo = "filter";
      this.masterusuariosStore.drawer =
        !this.masterusuariosStore.drawer;
    },
    async ver(item) {
      let datos = { ...item };
      this.masterusuariosStore.tipo = "ver";
      this.masterusuariosStore.model = datos;
      this.masterusuariosStore.drawer =
        !this.masterusuariosStore.drawer;
    },
    async editar(item) {
      let datos = { ...item };
      this.masterusuariosStore.tipo = "editar";
      this.masterusuariosStore.model = datos;

      this.masterusuariosStore.drawer =
        !this.masterusuariosStore.drawer;
    },
    async nuevo() {
      this.masterusuariosStore.tipo = "nuevo";
      const lista = this.masterusuariosStore.lstNotasQuote;
      const maxOrden =
        lista.length > 0
          ? Math.max(...lista.map((item) => Number(item.orden) || 0))
          : 0;
      const nuevoOrden = maxOrden + 1;

      this.masterusuariosStore.model = {
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
      this.masterusuariosStore.drawer =
        !this.masterusuariosStore.drawer;
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
          this.masterusuariosStore.model = item;
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
    ...mapStores(useMasterusuariosStore),
    drawer: {
      get() {
        return this.masterusuariosStore.drawer;
      },
      set(val) {
        return (this.masterusuariosStore.drawer = drawer);
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
        if (caseRecargar.includes(this.masterusuariosStore.tipo)) {
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
