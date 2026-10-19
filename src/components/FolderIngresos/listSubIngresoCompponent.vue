<template>
  <div class="">
    <v-card fluid class="px-5">
      <v-row>
        <v-col cols="4">
          <v-text-field
            label="Buscar"
            placeholder="Buscar"
            v-model="search"
            append-inner-icon="mdi-magnify"
            clearable
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
            :items="subingresoStore.lstSubIngreso"
            class="elevation-1"
            item-value="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
            </template>
            <template v-slot:[`item.colors`]="{ item }">
              <v-chip :color="item.color" variant="flat" v-if="item.color">
                {{ item.color }}
              </v-chip>
            </template>
            <template v-slot:[`item.calculo`]="{ item }">
              <v-chip color="green" v-if="item.calculoflag">Si</v-chip>
              <v-chip color="red" v-else>No</v-chip>
            </template>
            <template v-slot:[`item.monstra`]="{ item }">
              <v-chip color="green" v-if="item.mostrarflag">Si</v-chip>
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
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useIngresosStore } from "@/stores/ingresos";
import { useSubingresoStore } from "@/stores/subingreso";
export default {
  data() {
    return {
      search: "",
      loading: false,
      loadingNuevo: false,
      loadingFiltrar: false,
      headers: [
        { title: "Tipo de Ingreso", key: "description_ingreso" },
        { title: "Código", key: "code" },
        { title: "Descripción", key: "description" },
        { title: "Calculado en Reportes", key: "calculo" },
        { title: "Se Muestra en Reportes", key: "monstra" },
        { title: "Estado", key: "estado" },
        { title: "Creación", key: "created_at" },
        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
      ],
    };
  },
  computed: {
    ...mapStores(useSubingresoStore),
  },
  methods: {
    ...mapPiniaActions(useSubingresoStore, ["GetListSubIngreso", "ActualizarSubIngreso"]),
    ...mapPiniaActions(useIngresosStore, ["cargarIngreso"]),
    async filtrar() {
      this.subingresoStore.tipo = "filter";

      this.subingresoStore.drawer =
        !this.subingresoStore.drawer;
    },
    async ver(item) {
      let datos = { ...item };
      this.subingresoStore.tipo = "ver";
      this.subingresoStore.model = datos;

      this.subingresoStore.drawer =
        !this.subingresoStore.drawer;
    },
    async editar(item) {
      let datos = { ...item };
      this.subingresoStore.tipo = "editar";
      this.subingresoStore.model = datos;

      this.subingresoStore.drawer =
        !this.subingresoStore.drawer;
    },
    async nuevo() {
      this.subingresoStore.tipo = "nuevo";
      this.subingresoStore.model = {
        id_ingreso: "",
        code: "",
        description: "",
        status: true,
        id_branch: "",
        calculoflag: true,
        mostrarflag: true,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };

      this.subingresoStore.drawer =
        !this.subingresoStore.drawer;
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
          this.subingresoStore.model = item;
          this.loading = true;
          await this.ActualizarSubIngreso();
          await this.GetListSubIngreso();
          this.loading = false;
        }
      });
    },
  },
  async mounted() {
    this.loading = !this.loading;
    await this.cargarIngreso();
    await this.GetListSubIngreso();
    this.loading = !this.loading;
  },
};
</script>

<style></style>
