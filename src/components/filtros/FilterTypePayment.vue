<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="
          typepaymentStore.drawer = !typepaymentStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="typepaymentStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="typepaymentStore.filtros.code"
          label="Código"
          :clearable="typepaymentStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="typepaymentStore.filtros.name"
          label="Nombre"
          :clearable="typepaymentStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="typepaymentStore.filtros.description"
          label="Descripción"
          :clearable="typepaymentStore.tipo != 'ver'"
        ></v-text-field>
      </div>

      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="typepaymentStore.filtros.status"
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
            v-model="typepaymentStore.model.code"
            readonly
            v-if="typepaymentStore.tipo != 'nuevo'"
            label="Código"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="typepaymentStore.model.name"
            :readonly="typepaymentStore.tipo == 'ver'"
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
            v-model="typepaymentStore.model.description"
            :readonly="typepaymentStore.tipo == 'ver'"
            label="Descripción"
            :clearable="typepaymentStore.tipo != 'ver'"
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
            :readonly="typepaymentStore.tipo == 'ver'"
            :label="`Estado: ${
              !!typepaymentStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="typepaymentStore.model.status"
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
        v-if="typepaymentStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="typepaymentStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="typepaymentStore.tipo != 'filter' && typepaymentStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          typepaymentStore.drawer = !typepaymentStore.drawer
        "
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useTypepaymentStore } from "@/stores/typepayment";
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
    ...mapPiniaActions(useTypepaymentStore, ["GetListTypePayment", "setTypePayment", "ActualizarTypePayment"]),
    getName() {
      if (this.typepaymentStore.tipo == "ver") {
        return `Tipos de Pago ${this.model.name} – Modo Vista`;
      }
      if (this.typepaymentStore.tipo == "nuevo") {
        return "Nuevo Tipos de Pago";
      }
      if (this.typepaymentStore.tipo == "editar") {
        return `Modificar Tipo de Pago: ${this.model.name}`;
      }
      if (this.typepaymentStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListTypePayment();
      this.loading = false;
      this.typepaymentStore.drawer =
        !this.typepaymentStore.drawer;
    },
    async Limpiar() {
      this.typepaymentStore.filtros = {
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
      this.typepaymentStore.drawer =
        !this.typepaymentStore.drawer;
    },
    async Aceptar() {
      if (this.typepaymentStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setTypePayment();
          await this.GetListTypePayment();
          this.loading = false;
        }
      }
      if (this.typepaymentStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarTypePayment();
          await this.GetListTypePayment();
        }
        this.loading = false;
      }
      if (this.typepaymentStore.tipo == "ver") {
        this.typepaymentStore.drawer =
          !this.typepaymentStore.drawer;
      }
    },
    async validate() {
      // getValidatePosition
      this.errPosition = "";
      if (this.typepaymentStore.tipo == "nuevo") {
        let val = await this.getValidatePositionTypePayment();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.typepaymentStore.model.position = "";
        }
      }
      if (this.typepaymentStore.tipo == "editar") {
        let val = await this.getValidatePositionActualizarTypePayment();
        this.errPosition = val.mensaje;
        if (val.estadoflag) {
          this.typepaymentStore.model.position = "";
        }
      }
    },
  },
  computed: {
    ...mapStores(useTypepaymentStore),
    drawer: {
      get() {
        return this.typepaymentStore.drawer;
      },
      set(val) {
        return (this.typepaymentStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.typepaymentStore.model };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
