<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="subgastoStore.drawer = !subgastoStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="subgastoStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Tipo de Gasto"
          :items="gastosStore.list"
          v-model="subgastoStore.filtros.id_gasto"
          item-title="description"
          item-value="id"
          clearable
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="subgastoStore.filtros.code"
          label="Código"
          :clearable="subgastoStore.tipo != 'ver'"
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="subgastoStore.filtros.description"
          label="Descripción"
          :clearable="subgastoStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Se calcula en Reportes</span>
        <v-radio-group
          v-model="subgastoStore.filtros.calculoflag"
          inline
          density="compact"
        >
          <v-radio label="Si" color="green" :value="true"></v-radio>
          <v-radio label="No" color="red" :value="false"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
      <div class="col-12 py-1">
        <span> Se muestra en Reportes</span>
        <v-radio-group
          v-model="subgastoStore.filtros.mostrarflag"
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
        <v-radio-group v-model="subgastoStore.filtros.status" inline density="compact">
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
            label="Tipo de Gasto (*)"
            :items="gastosStore.list"
            v-model="subgastoStore.model.id_gasto"
            item-title="description"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :readonly="subgastoStore.tipo == 'ver'"
            :item-props="(item) => ({ disabled: !item.status })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="subgastoStore.model.code"
            :readonly="subgastoStore.tipo != 'nuevo'"
            label="Código (*)"
            v-on:blur="validateCodigo()"
            :error-messages="err"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 5) ||
                'El codigo no puede exceder los 5 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="subgastoStore.model.description"
            :readonly="subgastoStore.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="subgastoStore.tipo != 'ver'"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 50) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-checkbox
            label="Se calcula en Reportes"
            v-model="subgastoStore.model.calculoflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <v-checkbox
            label="Se Muestra en Reportes"
            v-model="subgastoStore.model.mostrarflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="subgastoStore.tipo == 'ver'"
            :label="`Estado: ${
              !!subgastoStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="subgastoStore.model.status"
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
        v-if="subgastoStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="subgastoStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="subgastoStore.tipo != 'filter'&& subgastoStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="subgastoStore.drawer = !subgastoStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useGastosStore } from "@/stores/gastos";
import { useSubgastoStore } from "@/stores/subgasto";
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
    ...mapPiniaActions(useSubgastoStore, ["GetListSubGasto", "getValidateCodeSubGasto", "setSubGasto", "ActualizarSubGasto"]),
    getName() {
      if (this.subgastoStore.tipo == "ver") {
        return `Tipo de Subgasto ${this.model.description} – Modo Vista`;
      }
      if (this.subgastoStore.tipo == "nuevo") {
        return "Nuevo Tipo de Subgasto";
      }
      if (this.subgastoStore.tipo == "editar") {
        return `Modificar Tipo Subgasto: ${this.model.description}`;
      }
      if (this.subgastoStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListSubGasto();
      this.loading = false;
      this.subgastoStore.drawer = !this.subgastoStore.drawer;
    },
    async Limpiar() {
      this.subgastoStore.filtros = {
        id: "",
        id_gasto: "",
        code: "",
        description: "",
        status: true,
        id_branch: "",
        calculoflag: "null",
        mostrarflag: "null",
      };
      this.loading = true;
      await this.GetListSubGasto();

      this.loading = false;
      this.subgastoStore.drawer = !this.subgastoStore.drawer;
    },
    async validateCodigo() {
      this.err = "";
      if (this.subgastoStore.tipo == "nuevo") {
        let val = await this.getValidateCodeSubGasto();
        this.err = val.mensaje;
        if (val.estadoflag) {
          this.subgastoStore.model.code = "";
        }
      }
    },
    async Aceptar() {
      if (this.subgastoStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setSubGasto();
          await this.GetListSubGasto();
          this.loading = false;
        }
      }
      if (this.subgastoStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarSubGasto();
          await this.GetListSubGasto();
        }
        this.loading = false;
      }
      if (this.subgastoStore.tipo == "ver") {
        this.subgastoStore.drawer = !this.subgastoStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useSubgastoStore, useGastosStore),
    drawer: {
      get() {
        return this.subgastoStore.drawer;
      },
      set(val) {
        return (this.subgastoStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.subgastoStore.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
