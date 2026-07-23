<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="
          $store.state.itemServices.drawer = !$store.state.itemServices.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.itemServices.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Servicio"
          :items="$store.state.groupservices.list"
          v-model="$store.state.itemServices.filtros.id_groupservices"
          item-text="name"
          item-value="id"
          :clearable="$store.state.itemServices.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.itemServices.filtros.code"
          label="Código"
          :clearable="$store.state.itemServices.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.itemServices.filtros.name"
          label="Nombre"
          :clearable="$store.state.itemServices.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.itemServices.filtros.description"
          label="Descripción"
          :clearable="$store.state.itemServices.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="$store.state.itemServices.filtros.status"
          row
          dense
        >
          <v-radio label="Activo" color="green" :value="1"></v-radio>
          <v-radio label="Inactivo" color="red" :value="0"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
    </v-card-text>
    <v-card-text v-else>
      <v-form ref="frmDML">
        <div class="col-12 py-1">
          <v-autocomplete
            label="Servicios (*)"
            :items="$store.state.groupservices.list"
            v-model="$store.state.itemServices.model.id_groupservices"
            :readonly="$store.state.itemServices.tipo == 'ver'"
            item-text="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato requerido']"
            :item-disabled="(item) => item.status != 1"
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.itemServices.model.code"
            :readonly="$store.state.itemServices.tipo == 'ver'"
            label="Código (*)"
            :rules="[
              (v) => !!v || 'Dato requerido',
              (v) => /^[0-9]+$/.test(v) || 'El dato debe contener solo números',
              (v) =>
                (!!v && v.length <= 3) ||
                'El dato debe contener una longitud máxima de 3',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.itemServices.model.name"
            :readonly="$store.state.itemServices.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length <= 50) ||
                'El nombre no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.itemServices.model.description"
            :readonly="$store.state.itemServices.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.itemServices.tipo != 'ver'"
            :rules="[
              (v) =>
                !v ||
                v.length <= 50 ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.itemServices.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.itemServices.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.itemServices.model.status"
          ></v-switch>
        </div>
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.itemServices.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.itemServices.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.itemServices.tipo != 'filter' && $store.state.itemServices.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          $store.state.itemServices.drawer = !$store.state.itemServices.drawer
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
    };
  },
  methods: {
    ...mapActions([
      "GetListItemServices",
      "setItemServices",
      "ActualizarItemServices",
    ]),
    getName() {
      if (this.$store.state.itemServices.tipo == "ver") {
        return `Detalle de Servicio ${this.model.name} – Modo Vista`;
      }
      if (this.$store.state.itemServices.tipo == "nuevo") {
        return "Nuevo Detalle de Servicio";
      }
      if (this.$store.state.itemServices.tipo == "editar") {
        return `Modificar Detalle de Servicio: ${this.model.name}`;
      }
      if (this.$store.state.itemServices.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListItemServices();
      this.loading = false;
      this.$store.state.itemServices.drawer =
        !this.$store.state.itemServices.drawer;
    },
    async Limpiar() {
      this.$store.state.itemServices.filtros = {
        id: "",
        id_groupservices: "",
        code: "",
        name: "",
        description: "",
        id_branch: "",
        status: 1,
      };
      this.loading = true;
      await this.GetListItemServices();

      this.loading = false;
      this.$store.state.itemServices.drawer =
        !this.$store.state.itemServices.drawer;
    },
    async Aceptar() {
      if (this.$store.state.itemServices.tipo == "nuevo") {
        if (this.$refs.frmDML.validate()) {
          this.loading = true;
          await this.setItemServices();
          await this.GetListItemServices();
          this.loading = false;
        }
      }
      if (this.$store.state.itemServices.tipo == "editar") {
        this.loading = true;
        if (this.$refs.frmDML.validate()) {
          await this.ActualizarItemServices();
          await this.GetListItemServices();
        }
        this.loading = false;
      }
      if (this.$store.state.itemServices.tipo == "ver") {
        this.$store.state.itemServices.drawer =
          !this.$store.state.itemServices.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.itemServices.drawer;
      },
      set(val) {
        return (this.$store.state.itemServices.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.itemServices.model };
     
      setTimeout(() => {
        this.$refs.frmDML.resetValidation();
      }, 10);
    },
  },
};
</script>

<style></style>
