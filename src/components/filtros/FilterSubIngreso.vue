<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="
          $store.state.subingreso.drawer = !$store.state.subingreso.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.subingreso.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Tipo de Ingreso"
          :items="$store.state.ingresos.list"
          v-model="$store.state.subingreso.filtros.id_ingreso"
          item-title="descripcion"
          item-value="id"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.subingreso.filtros.code"
          label="Código"
          :clearable="$store.state.subingreso.tipo != 'ver'"
        ></v-text-field>
      </div>
      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.subingreso.filtros.name"
          label="Nombre"
          :clearable="$store.state.subingreso.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.subingreso.filtros.description"
          label="Descripción"
          :clearable="$store.state.subingreso.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Se calcula en reportes</span>
        <v-radio-group
          v-model="$store.state.subingreso.filtros.calculoflag"
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
          v-model="$store.state.subingreso.filtros.mostrarflag"
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
          v-model="$store.state.subingreso.filtros.status"
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
            :items="$store.state.ingresos.list"
            v-model="$store.state.subingreso.model.id_ingreso"
            item-title="descripcion"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :readonly="$store.state.subingreso.tipo == 'ver'"
            :item-disabled="(item) => item.status != 1"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.subingreso.model.code"
            :readonly="$store.state.subingreso.tipo != 'nuevo'"
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
            v-model="$store.state.subingreso.model.description"
            :readonly="$store.state.subingreso.tipo == 'ver'"
            label="Descripción (*)"
            :clearable="$store.state.subingreso.tipo != 'ver'"
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
            v-model="$store.state.subingreso.model.calculoflag"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <v-checkbox
            label="Se Muestra en Reportes"
            v-model="$store.state.subingreso.model.mostrarflag"
          ></v-checkbox>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.subingreso.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.subingreso.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.subingreso.model.status"
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.subingreso.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.subingreso.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.subingreso.tipo != 'filter' && $store.state.subingreso.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          $store.state.subingreso.drawer = !$store.state.subingreso.drawer
        "
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
      "GetListSubIngreso",
      "getValidateCodeSubIngreso",
      "setSubIngreso",
      "ActualizarSubIngreso",
    ]),
    getName() {
      if (this.$store.state.subingreso.tipo == "ver") {
        return `Tipo de Subingreso ${this.model.description} – Modo Vista`;
      }
      if (this.$store.state.subingreso.tipo == "nuevo") {
        return "Nuevo Tipo de Subingreso";
      }
      if (this.$store.state.subingreso.tipo == "editar") {
        return `Modificar Tipo de Subingreso: ${this.model.description}`;
      }
      if (this.$store.state.subingreso.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListSubIngreso();
      this.loading = false;
      this.$store.state.subingreso.drawer =
        !this.$store.state.subingreso.drawer;
    },
    async Limpiar() {
      this.$store.state.subingreso.filtros = {
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
      this.$store.state.subingreso.drawer =
        !this.$store.state.subingreso.drawer;
    },
    async validateCodigo() {
      this.err = "";
      if (this.$store.state.subingreso.tipo == "nuevo") {
        let val = await this.getValidateCodeSubIngreso();
        this.err = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.subingreso.model.code = "";
        }
      }
    },
    async Aceptar() {
      if (this.$store.state.subingreso.tipo == "nuevo") {
        if (this.$refs.frmDML.validate()) {
          this.loading = true;
          await this.setSubIngreso();
          await this.GetListSubIngreso();
          this.loading = false;
        }
      }
      if (this.$store.state.subingreso.tipo == "editar") {
        this.loading = true;
        if (this.$refs.frmDML.validate()) {
          await this.ActualizarSubIngreso();
          await this.GetListSubIngreso();
        }
        this.loading = false;
      }
      if (this.$store.state.subingreso.tipo == "ver") {
        this.$store.state.subingreso.drawer =
          !this.$store.state.subingreso.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.subingreso.drawer;
      },
      set(val) {
        return (this.$store.state.subingreso.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.subingreso.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style scoped>

</style>
