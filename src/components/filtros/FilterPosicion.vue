<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="positionStore.drawer = !positionStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="positionStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="positionStore.filtros.code"
          label="Código"
          :clearable="positionStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="positionStore.filtros.name"
          label="Nombre"
          :clearable="positionStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="positionStore.filtros.description"
          label="Descripción"
          :clearable="positionStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="positionStore.filtros.estado" inline density="compact">
          <v-radio label="Activo" color="green" :value="true"></v-radio>
          <v-radio label="Inactivo" color="red" :value="false"></v-radio>
          <v-radio label="Todos" color="blue" value="null"></v-radio>
        </v-radio-group>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="positionStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="positionStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="positionStore.tipo != 'filter' && positionStore.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="positionStore.drawer = !positionStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { usePositionStore } from "@/stores/position";
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
    ...mapPiniaActions(usePositionStore, ["GetListPosition"]),
    getName() {
      if (this.positionStore.tipo == "ver") {
        return `Distrito ${this.model.name} – Modo Vista`;
      }
      if (this.positionStore.tipo == "nuevo") {
        return "Nuevo distrito";
      }
      if (this.positionStore.tipo == "editar") {
        return `Modificar Distrito: ${this.model.name}`;
      }
      if (this.positionStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListPosition();
      this.loading = false;
      this.positionStore.drawer = !this.positionStore.drawer;
    },
    async Limpiar() {
      this.positionStore.filtros = {
        code: "",
        name: "",
        description: "",
        estado: true,
        id_state: "",
      };
      this.loading = true;
      await this.GetListPosition();

      this.loading = false;
      this.positionStore.drawer = !this.positionStore.drawer;
    },
    async Aceptar() {
      if (this.positionStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setTown();
          await this.GetListPosition();
          this.loading = false;
        }
      }
      if (this.positionStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarTown();
          await this.GetListPosition();
        }
        this.loading = false;
      }
      if (this.positionStore.tipo == "ver") {
        this.positionStore.drawer = !this.positionStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(usePositionStore),
    drawer: {
      get() {
        return this.positionStore.drawer;
      },
      set(val) {
        return (this.positionStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.positionStore.model };
    },
  },
};
</script>

<style></style>
