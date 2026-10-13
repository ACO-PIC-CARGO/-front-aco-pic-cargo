<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="$store.state.subgasto.drawer = !$store.state.subgasto.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.subgasto.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Tipo de Gasto"
          :items="$store.state.gastos.list"
          v-model="$store.state.subgasto.filtros.id_gasto"
          item-title="description"
          item-value="id"
          clearable
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.subgasto.filtros.code"
          label="Código"
          :clearable="$store.state.subgasto.tipo != 'ver'"
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.subgasto.filtros.description"
          label="Descripción"
          :clearable="$store.state.subgasto.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Se calcula en Reportes</span>
        <v-radio-group
          v-model="$store.state.subgasto.filtros.calculoflag"
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
          v-model="$store.state.subgasto.filtros.mostrarflag"
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
        <v-radio-group v-model="$store.state.subgasto.filtros.status" inline density="compact">
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
            :items="$store.state.gastos.list"
            v-model="$store.state.subgasto.model.id_gasto"
            item-title="description"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :readonly="$store.state.subgasto.tipo == 'ver'"
            :item-props="(item) => ({ disabled: !item.status })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.subgasto.model.code"
            :readonly="$store.state.subgasto.tipo != 'nuevo'"
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
            v-model="$store.state.subgasto.model.description"
            :readonly="$store.state.subgasto.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="$store.state.subgasto.tipo != 'ver'"
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
            v-model="$store.state.subgasto.model.calculoflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <v-checkbox
            label="Se Muestra en Reportes"
            v-model="$store.state.subgasto.model.mostrarflag"
            :value-comparator="(value, checked) => Boolean(value) === checked"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.subgasto.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.subgasto.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.subgasto.model.status"
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
        v-if="$store.state.subgasto.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.subgasto.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.subgasto.tipo != 'filter'&& $store.state.subgasto.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.subgasto.drawer = !$store.state.subgasto.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
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
    ...mapActions([
      "GetListSubGasto",
      "getValidateCodeSubGasto",
      "setSubGasto",
      "ActualizarSubGasto",
    ]),
    getName() {
      if (this.$store.state.subgasto.tipo == "ver") {
        return `Tipo de Subgasto ${this.model.description} – Modo Vista`;
      }
      if (this.$store.state.subgasto.tipo == "nuevo") {
        return "Nuevo Tipo de Subgasto";
      }
      if (this.$store.state.subgasto.tipo == "editar") {
        return `Modificar Tipo Subgasto: ${this.model.description}`;
      }
      if (this.$store.state.subgasto.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListSubGasto();
      this.loading = false;
      this.$store.state.subgasto.drawer = !this.$store.state.subgasto.drawer;
    },
    async Limpiar() {
      this.$store.state.subgasto.filtros = {
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
      this.$store.state.subgasto.drawer = !this.$store.state.subgasto.drawer;
    },
    async validateCodigo() {
      this.err = "";
      if (this.$store.state.subgasto.tipo == "nuevo") {
        let val = await this.getValidateCodeSubGasto();
        this.err = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.subgasto.model.code = "";
        }
      }
    },
    async Aceptar() {
      if (this.$store.state.subgasto.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setSubGasto();
          await this.GetListSubGasto();
          this.loading = false;
        }
      }
      if (this.$store.state.subgasto.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarSubGasto();
          await this.GetListSubGasto();
        }
        this.loading = false;
      }
      if (this.$store.state.subgasto.tipo == "ver") {
        this.$store.state.subgasto.drawer = !this.$store.state.subgasto.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.subgasto.drawer;
      },
      set(val) {
        return (this.$store.state.subgasto.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.subgasto.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
