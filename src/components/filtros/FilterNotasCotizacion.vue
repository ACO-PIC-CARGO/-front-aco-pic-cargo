<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="
          masterusuariosStore.drawer =
            !masterusuariosStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="masterusuariosStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="masterusuariosStore.filtros.valorcodigo"
          label="Código"
          :clearable="masterusuariosStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <!-- <div class="col-12 py-1">
        <v-switch
          label="Individual"
          v-model="masterusuariosStore.filtros.individualflag"
        />
      </div>
      <div class="col-12 py-1">
        <v-switch
          label="Grupal"
          v-model="masterusuariosStore.filtros.grupalflag"
        />
      </div> -->
      <div class="col-12 py-1">
        <v-text-field
          v-model="masterusuariosStore.filtros.description"
          label="Nombre"
          :clearable="masterusuariosStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="masterusuariosStore.filtros.status"
          inline
          density="compact"
        >
          <v-radio label="Activo" color="green" :value="true"></v-radio>
          <v-radio label="Inactivo" color="red" :value="false"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <v-row>
          <!-- <div class="col-12 py-1">
          <v-text-field
            v-model="masterusuariosStore.model.valorcodigo"
            :readonly="masterusuariosStore.tipo != 'nuevo'"
            label="Código"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                v.length <= 3 || 'El código no puede tener más de  carácteres',
            ]"
          ></v-text-field>
        </div> -->

          <div class="col-12 py-1">
            <v-textarea
              v-model="masterusuariosStore.model.description"
              :readonly="masterusuariosStore.tipo == 'ver'"
              label="Nombre (*)"
              :clearable="masterusuariosStore.tipo != 'ver'"
              :rules="[
                (v) => !!v || 'Dato Requerido',
                (v) =>
                  (!!v && v.length <= 500) ||
                  'El nombre no puede tener más 500 de  carácteres',
              ]"
              variant="outlined"
              density="compact"
              auto-grow
              rows="1"
            ></v-textarea>
          </div>
          <div class="col-12 py-1">
            <v-text-field
              name="name"
              label="Orden"
              id="id"
              variant="outlined"
              density="compact"
              v-model="masterusuariosStore.model.orden"
              :readonly="masterusuariosStore.tipo == 'ver'"
              :clearable="masterusuariosStore.tipo != 'ver'"
              type="number"
              style="max-width: 240px;"
            ></v-text-field>
          </div>
          <div class="col-12 py-1">Tipo de Cotización</div>
          <div class="col-6 py-1">
            <v-switch
              label="Individual"
              v-model="masterusuariosStore.model.individualflag"
            />
          </div>
          <div class="col-6 py-1">
            <v-switch
              label="Grupal"
              v-model="masterusuariosStore.model.grupalflag"
            />
          </div>
          <div class="col-12 py-1">
            <span> Estado</span>
            <v-switch
              :readonly="masterusuariosStore.tipo == 'ver'"
              :label="`Estado: ${
                !!masterusuariosStore.model.status
                  ? 'Activo'
                  : 'Inactivo'
              }`"
              color="success"
              v-model="masterusuariosStore.model.status"
            ></v-switch>
          </div>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="masterusuariosStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="masterusuariosStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          masterusuariosStore.tipo != 'filter' &&
          masterusuariosStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          masterusuariosStore.drawer =
            !masterusuariosStore.drawer
        "
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
export default {
  data() {
    return {
      loading: false,
      loadingEstado: false,
      model: "",
    };
  },
  methods: {
    ...mapPiniaActions(useMasterusuariosStore, ["GetListNotasCotizacion", "ActualizarMasterDetalle", "RegistrarMasterDetalleNotasCotizacion"]),
    mostrarIndividualGrupalPorEmpresa() {
      let valEmpresaPic = [1, 2];
      let empresa = JSON.parse(localStorage.getItem("dataBranch"))[0];
      if (valEmpresaPic.includes(empresa.id)) {
        return true;
      }
      return false;
    },
    getName() {
      if (this.masterusuariosStore.tipo == "ver") {
        return `Nota  – Modo Vista`;
      }
      if (this.masterusuariosStore.tipo == "nuevo") {
        return "Nueva Nota Cotización";
      }
      if (this.masterusuariosStore.tipo == "editar") {
        return `Modificar Nota`;
      }
      if (this.masterusuariosStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListNotasCotizacion();
      this.loading = false;
      this.masterusuariosStore.drawer =
        !this.masterusuariosStore.drawer;
    },
    async Limpiar() {
      this.masterusuariosStore.filtros = {
        id: "",
        id_master: "",
        valorcodigo: "",
        codigo01: "",
        codigo02: "",
        description: "",
        status: true,
        escomunflag: false,
      };
      this.loading = true;
      await this.GetListNotasCotizacion();

      this.loading = false;
      this.masterusuariosStore.drawer =
        !this.masterusuariosStore.drawer;
    },
    async Aceptar() {
      if (this.masterusuariosStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.RegistrarMasterDetalleNotasCotizacion();
          await this.GetListNotasCotizacion();
          this.loading = false;
        }
      }
      if (this.masterusuariosStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarMasterDetalle();
          await this.GetListNotasCotizacion();
        }
        this.loading = false;
      }
      if (this.masterusuariosStore.tipo == "ver") {
        this.masterusuariosStore.drawer =
          !this.masterusuariosStore.drawer;
      }
    },
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
  },
  watch: {
    drawer() {
      this.model = { ...this.masterusuariosStore.model };
    },
  },
};
</script>
