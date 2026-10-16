<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="$store.state.begend.drawer = !$store.state.begend.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.begend.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.begend.filtros.code"
          label="Código"
          :clearable="$store.state.begend.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.begend.filtros.name"
          label="Nombre"
          :clearable="$store.state.begend.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.begend.filtros.description"
          label="Descripción"
          :clearable="$store.state.begend.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.begend.filtros.position"
          label="Posición (Orden)"
          type="number"
          step="1"
          :clearable="$store.state.begend.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.begend.filtros.color"
          label="Color"
          :clearable="$store.state.begend.tipo != 'ver'"
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="$store.state.begend.filtros.status" inline density="compact">
          <v-radio label="Activo" color="green" value="1"></v-radio>
          <v-radio label="Inactivo" color="red" value="0"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.begend.model.code"
            :readonly="$store.state.begend.tipo != 'nuevo'"
            label="Código (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (v && v.length < 4) ||
                'El código no puede exceder los 3 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.begend.model.name"
            :readonly="$store.state.begend.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (v && v.length < 50) ||
                'El nombre no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.begend.model.description"
            :readonly="$store.state.begend.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.begend.tipo != 'ver'"
            :rules="[
              (v) =>
                !v ||
                v.length < 50 ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.begend.model.position"
            type="number"
            step="1"
            :readonly="$store.state.begend.tipo == 'ver'"
            label="Posición (Orden)  (*)"
            :clearable="$store.state.begend.tipo != 'ver'"
            :rules="[(v) => !!v || 'Dato Requerido']"
            v-on:blur="validate()"
            :error-messages="errPosition"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.begend.model.color"
            :readonly="$store.state.begend.tipo == 'ver'"
            label="Color"
            :clearable="$store.state.begend.tipo != 'ver'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.begend.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.begend.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.begend.model.status"
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
        v-if="$store.state.begend.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.begend.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          $store.state.begend.tipo != 'filter' &&
          $store.state.begend.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.begend.drawer = !$store.state.begend.drawer"
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
      errPosition: "",
    };
  },
  methods: {
    ...mapActions([
      "GetListBegend",
      "_getPais",
      "_getState",
      "_getCity",
      "setBegend",
      "ActualizarBegend",
      "getValidatePositionBegend",
      "getValidatePositionActualizarBegend",
    ]),
    getName() {
      if (this.$store.state.begend.tipo == "ver") {
        return `Categoria ${this.model.name} – Modo Vista`;
      }
      if (this.$store.state.begend.tipo == "nuevo") {
        return "Nueva Categoría";
      }
      if (this.$store.state.begend.tipo == "editar") {
        return `Modificar Categoría: ${this.model.name}`;
      }
      if (this.$store.state.begend.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListBegend();
      this.loading = false;
      this.$store.state.begend.drawer = !this.$store.state.begend.drawer;
    },
    async Limpiar() {
      this.$store.state.begend.filtros = {
        id: "",
        id_pais: "",
        code: "",
        name: "",
        description: "",
        status: "1",
        id_state: "",
      };
      this.loading = true;
      await this.GetListBegend();

      this.loading = false;
      this.$store.state.begend.drawer = !this.$store.state.begend.drawer;
    },
    async Aceptar() {
      if (this.$store.state.begend.tipo == "nuevo") {
        this.loading = true;
        setTimeout(async () => {
          if ((await this.$refs.frmDML.validate()).valid) {
            this.loading = true;
            await this.setBegend();
            await this.GetListBegend();
            this.loading = false;
          } else {
            this.loading = false;
          }
        }, 1000);
      }
      if (this.$store.state.begend.tipo == "editar") {
        this.loading = true;
        setTimeout(async () => {
          if ((await this.$refs.frmDML.validate()).valid && !this.errPosition) {
            await this.ActualizarBegend();
            await this.GetListBegend();
            this.loading = false;
          } else {
            this.loading = false;
          }
        }, 1000);
      }
      if (this.$store.state.begend.tipo == "ver") {
        this.$store.state.begend.drawer = !this.$store.state.begend.drawer;
      }
    },
    async validate() {
      // getValidatePosition
      // this.loading = true;
      this.errPosition = "";
      if (this.$store.state.begend.tipo == "nuevo") {
        let val = await this.getValidatePositionBegend();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.begend.model.position = "";
        }
      }
      if (this.$store.state.begend.tipo == "editar") {
        let val = await this.getValidatePositionActualizarBegend();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.begend.model.position = "";
        }
      }
      // this.loading = false;
    },
  },

  computed: {
    drawer: {
      get() {
        return this.$store.state.begend.drawer;
      },
      set(val) {
        return (this.$store.state.begend.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.begend.model };
      this.$refs.frmDML.resetValidation();
      this.errPosition = "";
    },
  },
};
</script>

<style></style>
