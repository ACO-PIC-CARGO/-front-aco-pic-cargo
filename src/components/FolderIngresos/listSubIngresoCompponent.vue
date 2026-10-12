<template>
  <div class="">
    <v-card fluid class="px-5">
      <v-row>
        <v-col cols="4">
          <v-text-field
            label="Buscar"
            placeholder="Buscar"
            v-model="search"
            append-icon="mdi-magnify"
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
            dark
            >FILTRAR</v-btn
          >
          <v-btn size="small" class="mx-1" color="#004D40" dark>EXPORTAR</v-btn>
        </v-col>
        <v-col cols="12">
          <v-data-table
            :headers="headers"
            :items="$store.state.subingreso.lstSubIngreso"
            class="elevation-1"
            item-key="port_beginend_id"
            :loading="loading"
            :search="search"
          >
            <template v-slot:[`item.estado`]="{ item }">
              {{ !!item.status == 1 ? "Activo" : "Inactivo" }}
            </template>
            <template v-slot:[`item.colors`]="{ item }">
              <v-chip :color="item.color" v-if="item.color">
                {{ item.color }}
              </v-chip>
            </template>
            <template v-slot:[`item.calculo`]="{ item }">
              <v-chip color="green" v-if="item.calculoflag" dark>Si</v-chip>
              <v-chip color="red" v-else dark>No</v-chip>
            </template>
            <template v-slot:[`item.monstra`]="{ item }">
              <v-chip color="green" v-if="item.mostrarflag" dark>Si</v-chip>
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
      loadingNuevo: false,
      loadingFiltrar: false,
      headers: [
        { text: "Tipo de Ingreso", value: "description_ingreso" },
        { text: "Código", value: "code" },
        { text: "Descripción", value: "description" },
        { text: "Calculado en Reportes", value: "calculo" },
        { text: "Se Muestra en Reportes", value: "monstra" },
        { text: "Estado", value: "estado" },
        { text: "Creación", value: "created_at" },
        { text: "Última Actualización", value: "updated_at" },
        { text: "Acciones", value: "action" },
      ],
    };
  },
  methods: {
    ...mapActions([
      "GetListSubIngreso",
      "ActualizarSubIngreso",
      "cargarIngreso",
    ]),
    async filtrar() {
      this.$store.state.subingreso.tipo = "filter";

      this.$store.state.subingreso.drawer =
        !this.$store.state.subingreso.drawer;
    },
    async ver(item) {
      let datos = { ...item };
      this.$store.state.subingreso.tipo = "ver";
      this.$store.state.subingreso.model = datos;

      this.$store.state.subingreso.drawer =
        !this.$store.state.subingreso.drawer;
    },
    async editar(item) {
      let datos = { ...item };
      this.$store.state.subingreso.tipo = "editar";
      this.$store.state.subingreso.model = datos;

      this.$store.state.subingreso.drawer =
        !this.$store.state.subingreso.drawer;
    },
    async nuevo() {
      this.$store.state.subingreso.tipo = "nuevo";
      this.$store.state.subingreso.model = {
        id_ingreso: "",
        code: "",
        description: "",
        status: true,
        id_branch: "",
        calculoflag: true,
        mostrarflag: true,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };

      this.$store.state.subingreso.drawer =
        !this.$store.state.subingreso.drawer;
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
          this.$store.state.subingreso.model = item;
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
