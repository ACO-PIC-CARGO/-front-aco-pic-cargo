<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="
          $store.state.typepayment.drawer = !$store.state.typepayment.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.typepayment.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.typepayment.filtros.code"
          label="Código"
          :clearable="$store.state.typepayment.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.typepayment.filtros.name"
          label="Nombre"
          :clearable="$store.state.typepayment.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.typepayment.filtros.description"
          label="Descripción"
          :clearable="$store.state.typepayment.tipo != 'ver'"
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="$store.state.typepayment.filtros.status"
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
          <v-text-field
            v-model="$store.state.typepayment.model.code"
            readonly
            v-if="$store.state.typepayment.tipo != 'nuevo'"
            label="Código"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.typepayment.model.name"
            :readonly="$store.state.typepayment.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) =>
                v.length < 50 ||
                'El nombre no puede exceder los 50 caracteres.',
              (v) => !!v || 'Dato Requerido',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.typepayment.model.description"
            :readonly="$store.state.typepayment.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.typepayment.tipo != 'ver'"
            :rules="[
              (v) =>
                (!!v ? v.length < 50 : true) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>

        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.typepayment.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.typepayment.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.typepayment.model.status"
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
        v-if="$store.state.typepayment.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.typepayment.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.typepayment.tipo != 'filter' && $store.state.typepayment.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          $store.state.typepayment.drawer = !$store.state.typepayment.drawer
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
      errPosition: "",
    };
  },
  methods: {
    ...mapActions([
      "GetListTypePayment",
      "setTypePayment",
      "ActualizarTypePayment",
    ]),
    getName() {
      if (this.$store.state.typepayment.tipo == "ver") {
        return `Tipos de Pago ${this.model.name} – Modo Vista`;
      }
      if (this.$store.state.typepayment.tipo == "nuevo") {
        return "Nuevo Tipos de Pago";
      }
      if (this.$store.state.typepayment.tipo == "editar") {
        return `Modificar Tipo de Pago: ${this.model.name}`;
      }
      if (this.$store.state.typepayment.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListTypePayment();
      this.loading = false;
      this.$store.state.typepayment.drawer =
        !this.$store.state.typepayment.drawer;
    },
    async Limpiar() {
      this.$store.state.typepayment.filtros = {
        id: "",
        id_pais: "",
        code: "",
        name: "",
        description: "",
        status: true,
        id_state: "",
      };
      this.loading = true;
      await this.GetListTypePayment();

      this.loading = false;
      this.$store.state.typepayment.drawer =
        !this.$store.state.typepayment.drawer;
    },
    async Aceptar() {
      if (this.$store.state.typepayment.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setTypePayment();
          await this.GetListTypePayment();
          this.loading = false;
        }
      }
      if (this.$store.state.typepayment.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarTypePayment();
          await this.GetListTypePayment();
        }
        this.loading = false;
      }
      if (this.$store.state.typepayment.tipo == "ver") {
        this.$store.state.typepayment.drawer =
          !this.$store.state.typepayment.drawer;
      }
    },
    async validate() {
      // getValidatePosition
      this.errPosition = "";
      if (this.$store.state.typepayment.tipo == "nuevo") {
        let val = await this.getValidatePositionTypePayment();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.typepayment.model.position = "";
        }
      }
      if (this.$store.state.typepayment.tipo == "editar") {
        let val = await this.getValidatePositionActualizarTypePayment();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.$store.state.typepayment.model.position = "";
        }
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.typepayment.drawer;
      },
      set(val) {
        return (this.$store.state.typepayment.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.typepayment.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
