<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="
          subingresoStore.drawer = !subingresoStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="subingresoStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Tipo de Ingreso"
          :items="ingresosStore.list"
          v-model="subingresoStore.filtros.id_ingreso"
          item-title="descripcion"
          item-value="id"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="subingresoStore.filtros.code"
          label="Código"
          :clearable="subingresoStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="subingresoStore.filtros.name"
          label="Nombre"
          :clearable="subingresoStore.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <div class="col-12 py-1">
        <v-text-field
          v-model="subingresoStore.filtros.description"
          label="Descripción"
          :clearable="subingresoStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Se calcula en reportes</span>
        <v-radio-group
          v-model="subingresoStore.filtros.calculoflag"
          inline
          density="compact"
        >
          <v-radio label="Si" color="green" :value="true"></v-radio>
          <v-radio label="No" color="red" :value="false"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
      <div class="col-12 py-1">
        <span> Se muestra en reportes</span>
        <v-radio-group
          v-model="subingresoStore.filtros.mostrarflag"
          inline
          density="compact"
        >
          <v-radio label="Si" color="green" :value="true"></v-radio>
          <v-radio label="No" color="red" :value="false"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="subingresoStore.filtros.status"
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
        <div class="col-12 py-1">
          <v-autocomplete
            label="Tipo de Ingreso (*)"
            :items="ingresosStore.list"
            v-model="subingresoStore.model.id_ingreso"
            item-title="descripcion"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :readonly="subingresoStore.tipo == 'ver'"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="subingresoStore.model.code"
            :readonly="subingresoStore.tipo != 'nuevo'"
            label="Código (*)"
            v-on:blur="validateCodigo()"
            :error-messages="err"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length) < 5 ||
                'El codigo no puede exceder los 5 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="subingresoStore.model.description"
            :readonly="subingresoStore.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="subingresoStore.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 255) ||
                'La descripción no puede exceder los 255 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-checkbox
            label="Se calcula en Reportes"
            v-model="subingresoStore.model.calculoflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <v-checkbox
            label="Se Muestra en Reportes"
            v-model="subingresoStore.model.mostrarflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="subingresoStore.tipo == 'ver'"
            :label="`Estado: ${
              !!subingresoStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="subingresoStore.model.status"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="subingresoStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="subingresoStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="subingresoStore.tipo != 'filter' && subingresoStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          subingresoStore.drawer = !subingresoStore.drawer
        "
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useIngresosStore } from "@/stores/ingresos";
import { useSubingresoStore } from "@/stores/subingreso";
export default {
  data() {
    return {
      loading: false,
      loadingEstado: false,
      loadingCity: false,
      model: "",
      err: "",
    };
  },
  methods: {
    ...mapPiniaActions(useSubingresoStore, ["GetListSubIngreso", "getValidateCodeSubIngreso", "setSubIngreso", "ActualizarSubIngreso"]),
    getName() {
      if (this.subingresoStore.tipo == "ver") {
        return `Tipo de Subingreso ${this.model.description} – Modo Vista`;
      }
      if (this.subingresoStore.tipo == "nuevo") {
        return "Nuevo Tipo de Subingreso";
      }
      if (this.subingresoStore.tipo == "editar") {
        return `Modificar Tipo de Subingreso: ${this.model.description}`;
      }
      if (this.subingresoStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListSubIngreso();
      this.loading = false;
      this.subingresoStore.drawer =
        !this.subingresoStore.drawer;
    },
    async Limpiar() {
      this.subingresoStore.filtros = {
        id: "",
        id_ingreso: "",
        code: "",
        description: "",
        status: true,
        id_branch: "",
        calculoflag: "null",
        mostrarflag: "null",
      };
      this.loading = true;
      await this.GetListSubIngreso();

      this.loading = false;
      this.subingresoStore.drawer =
        !this.subingresoStore.drawer;
    },
    async validateCodigo() {
      this.err = "";
      if (this.subingresoStore.tipo == "nuevo") {
        let val = await this.getValidateCodeSubIngreso();
        this.err = val.mensaje;
        if (val.estadoflag) {
          this.subingresoStore.model.code = "";
        }
      }
    },
    async Aceptar() {
      if (this.subingresoStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setSubIngreso();
          await this.GetListSubIngreso();
          this.loading = false;
        }
      }
      if (this.subingresoStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarSubIngreso();
          await this.GetListSubIngreso();
        }
        this.loading = false;
      }
      if (this.subingresoStore.tipo == "ver") {
        this.subingresoStore.drawer =
          !this.subingresoStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useSubingresoStore, useIngresosStore),
    drawer: {
      get() {
        return this.subingresoStore.drawer;
      },
      set(val) {
        return (this.subingresoStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.subingresoStore.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style scoped>

</style>
