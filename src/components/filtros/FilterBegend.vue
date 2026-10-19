<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="begendStore.drawer = !begendStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="begendStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="begendStore.filtros.code"
          label="Código"
          :clearable="begendStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="begendStore.filtros.name"
          label="Nombre"
          :clearable="begendStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="begendStore.filtros.description"
          label="Descripción"
          :clearable="begendStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="begendStore.filtros.position"
          label="Posición (Orden)"
          type="number"
          step="1"
          :clearable="begendStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="begendStore.filtros.color"
          label="Color"
          :clearable="begendStore.tipo != 'ver'"
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="begendStore.filtros.status" inline density="compact">
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
            v-model="begendStore.model.code"
            :readonly="begendStore.tipo != 'nuevo'"
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
            v-model="begendStore.model.name"
            :readonly="begendStore.tipo == 'ver'"
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
            v-model="begendStore.model.description"
            :readonly="begendStore.tipo == 'ver'"
            label="Descripción"
            :clearable="begendStore.tipo != 'ver'"
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
            v-model="begendStore.model.position"
            type="number"
            step="1"
            :readonly="begendStore.tipo == 'ver'"
            label="Posición (Orden)  (*)"
            :clearable="begendStore.tipo != 'ver'"
            :rules="[(v) => !!v || 'Dato Requerido']"
            v-on:blur="validate()"
            :error-messages="errPosition"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="begendStore.model.color"
            :readonly="begendStore.tipo == 'ver'"
            label="Color"
            :clearable="begendStore.tipo != 'ver'"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="begendStore.tipo == 'ver'"
            :label="`Estado: ${
              !!begendStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="begendStore.model.status"
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
        v-if="begendStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="begendStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          begendStore.tipo != 'filter' &&
          begendStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="begendStore.drawer = !begendStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useBegendStore } from "@/stores/begend";
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
      "_getPais",
      "_getState",
      "_getCity",
    ]),
    ...mapPiniaActions(useBegendStore, ["GetListBegend", "setBegend", "ActualizarBegend", "getValidatePositionBegend", "getValidatePositionActualizarBegend"]),
    getName() {
      if (this.begendStore.tipo == "ver") {
        return `Categoria ${this.model.name} – Modo Vista`;
      }
      if (this.begendStore.tipo == "nuevo") {
        return "Nueva Categoría";
      }
      if (this.begendStore.tipo == "editar") {
        return `Modificar Categoría: ${this.model.name}`;
      }
      if (this.begendStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListBegend();
      this.loading = false;
      this.begendStore.drawer = !this.begendStore.drawer;
    },
    async Limpiar() {
      this.begendStore.filtros = {
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
      this.begendStore.drawer = !this.begendStore.drawer;
    },
    async Aceptar() {
      if (this.begendStore.tipo == "nuevo") {
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
      if (this.begendStore.tipo == "editar") {
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
      if (this.begendStore.tipo == "ver") {
        this.begendStore.drawer = !this.begendStore.drawer;
      }
    },
    async validate() {
      // getValidatePosition
      // this.loading = true;
      this.errPosition = "";
      if (this.begendStore.tipo == "nuevo") {
        let val = await this.getValidatePositionBegend();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.begendStore.model.position = "";
        }
      }
      if (this.begendStore.tipo == "editar") {
        let val = await this.getValidatePositionActualizarBegend();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.begendStore.model.position = "";
        }
      }
      // this.loading = false;
    },
  },

  computed: {
    ...mapStores(useBegendStore),
    drawer: {
      get() {
        return this.begendStore.drawer;
      },
      set(val) {
        return (this.begendStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.begendStore.model };
      this.$refs.frmDML.resetValidation();
      this.errPosition = "";
    },
  },
};
</script>

<style></style>
