<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="
          itemServicesStore.drawer = !itemServicesStore.drawer
        "
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="itemServicesStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Servicio"
          :items="groupservicesStore.list"
          v-model="itemServicesStore.filtros.id_groupservices"
          item-title="name"
          item-value="id"
          :clearable="itemServicesStore.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>

      <div class="col-12 py-1">
        <v-text-field
          v-model="itemServicesStore.filtros.code"
          label="Código"
          :clearable="itemServicesStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="itemServicesStore.filtros.name"
          label="Nombre"
          :clearable="itemServicesStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="itemServicesStore.filtros.description"
          label="Descripción"
          :clearable="itemServicesStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="itemServicesStore.filtros.status"
          inline
          density="compact"
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
            :items="groupservicesStore.list"
            v-model="itemServicesStore.model.id_groupservices"
            :readonly="itemServicesStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>

        <div class="col-12 py-1">
          <v-text-field
            v-model="itemServicesStore.model.code"
            :readonly="itemServicesStore.tipo == 'ver'"
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
            v-model="itemServicesStore.model.name"
            :readonly="itemServicesStore.tipo == 'ver'"
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
            v-model="itemServicesStore.model.description"
            :readonly="itemServicesStore.tipo == 'ver'"
            label="Descripción"
            :clearable="itemServicesStore.tipo != 'ver'"
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
            :readonly="itemServicesStore.tipo == 'ver'"
            :label="`Estado: ${
              !!itemServicesStore.model.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="itemServicesStore.model.status"
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
        v-if="itemServicesStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="itemServicesStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="itemServicesStore.tipo != 'filter' && itemServicesStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="
          itemServicesStore.drawer = !itemServicesStore.drawer
        "
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useGroupservicesStore } from "@/stores/groupservices";
import { useItemServicesStore } from "@/stores/itemServices";
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
    ...mapPiniaActions(useItemServicesStore, ["GetListItemServices", "setItemServices", "ActualizarItemServices"]),
    getName() {
      if (this.itemServicesStore.tipo == "ver") {
        return `Detalle de Servicio ${this.model.name} – Modo Vista`;
      }
      if (this.itemServicesStore.tipo == "nuevo") {
        return "Nuevo Detalle de Servicio";
      }
      if (this.itemServicesStore.tipo == "editar") {
        return `Modificar Detalle de Servicio: ${this.model.name}`;
      }
      if (this.itemServicesStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListItemServices();
      this.loading = false;
      this.itemServicesStore.drawer =
        !this.itemServicesStore.drawer;
    },
    async Limpiar() {
      this.itemServicesStore.filtros = {
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
      this.itemServicesStore.drawer =
        !this.itemServicesStore.drawer;
    },
    async Aceptar() {
      if (this.itemServicesStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setItemServices();
          await this.GetListItemServices();
          this.loading = false;
        }
      }
      if (this.itemServicesStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarItemServices();
          await this.GetListItemServices();
        }
        this.loading = false;
      }
      if (this.itemServicesStore.tipo == "ver") {
        this.itemServicesStore.drawer =
          !this.itemServicesStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useItemServicesStore, useGroupservicesStore),
    drawer: {
      get() {
        return this.itemServicesStore.drawer;
      },
      set(val) {
        return (this.itemServicesStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.itemServicesStore.model };
     
      setTimeout(() => {
        this.$refs.frmDML.resetValidation();
      }, 10);
    },
  },
};
</script>

<style></style>
