<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="motonaveStore.drawer = !motonaveStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="motonaveStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="motonaveStore.MotonaveFilter.name"
          label="Nombre"
          :clearable="motonaveStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="motonaveStore.MotonaveFilter.description"
          label="Descripción"
          :clearable="motonaveStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="motonaveStore.MotonaveFilter.status"
          inline
          density="compact"
        >
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
            v-model="motonaveStore.MotonaveModel.name"
            :readonly="motonaveStore.tipo == 'ver'"
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
            v-model="motonaveStore.MotonaveModel.description"
            :readonly="motonaveStore.tipo == 'ver'"
            label="Descripción"
            :clearable="motonaveStore.tipo != 'ver'"
            :rules="[
              (v) =>
                !v ||
                v.length < 50 ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="motonaveStore.tipo == 'ver'"
            :label="`Estado: ${
              !!motonaveStore.MotonaveModel.status
                ? 'Activo'
                : 'Inactivo'
            }`"
            color="success"
            v-model="motonaveStore.MotonaveModel.status"
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
        v-if="motonaveStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="motonaveStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="motonaveStore.tipo != 'filter' && motonaveStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="motonaveStore.drawer = !motonaveStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMotonaveStore } from "@/stores/motonave";
export default {
  data() {
    return { errIATA: "", errICAO: "", loading: false, motonave: "" };
  },
  methods: {
    ...mapPiniaActions(useMotonaveStore, ["GetListMotonave", "setMotonave", "ActualizarMotonave"]),
    getName() {
      if (this.motonaveStore.tipo == "ver") {
        return `Motonave ${this.MotonaveModel.name} – Modo Vista`;
      }
      if (this.motonaveStore.tipo == "nuevo") {
        return "Nuevo Motonave";
      }
      if (this.motonaveStore.tipo == "editar") {
        return `Modificar Motonave: ${this.MotonaveModel.name}`;
      }
      if (this.motonaveStore.tipo == "filter") {
        return "Filtrar Regitros";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListMotonave();
      this.loading = false;
      this.motonaveStore.drawer = !this.motonaveStore.drawer;
    },
    async Limpiar() {
      this.motonaveStore.MotonaveFilter = {
        id: "",
        id_pais: "",
        code: "",
        name: "",
        description: "",
        id_transporte: "",
        status: "1",
      };
      this.loading = true;
      await this.GetListMotonave();
      this.loading = false;
      this.motonaveStore.drawer = !this.motonaveStore.drawer;
    },
    async Aceptar() {
      if (this.motonaveStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setMotonave();
          await this.GetListMotonave();
          this.loading = false;
        }
      }
      if (this.motonaveStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarMotonave();
          await this.GetListMotonave();
        }
        this.loading = false;
      }
      if (this.motonaveStore.tipo == "ver") {
        this.motonaveStore.drawer = !this.motonaveStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(useMotonaveStore),
    drawer: {
      get() {
        return this.motonaveStore.drawer;
      },
      set(val) {
        return (this.motonaveStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.MotonaveModel = { ...this.motonaveStore.MotonaveModel };
    },
  },
};
</script>

<style></style>
