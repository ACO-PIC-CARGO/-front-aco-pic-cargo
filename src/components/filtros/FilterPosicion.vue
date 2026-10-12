<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="$store.state.position.drawer = !$store.state.position.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.position.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.position.filtros.code"
          label="Código"
          :clearable="$store.state.position.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.position.filtros.name"
          label="Nombre"
          :clearable="$store.state.position.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.position.filtros.description"
          label="Descripción"
          :clearable="$store.state.position.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group v-model="$store.state.position.filtros.estado" inline density="compact">
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
        v-if="$store.state.position.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.position.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.position.tipo != 'filter' && $store.state.position.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.position.drawer = !$store.state.position.drawer"
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
    ...mapActions(["GetListPosition"]),
    getName() {
      if (this.$store.state.position.tipo == "ver") {
        return `Distrito ${this.model.name} – Modo Vista`;
      }
      if (this.$store.state.position.tipo == "nuevo") {
        return "Nuevo distrito";
      }
      if (this.$store.state.position.tipo == "editar") {
        return `Modificar Distrito: ${this.model.name}`;
      }
      if (this.$store.state.position.tipo == "filter") {
        return "Filtrar Registros";
      }
    },

    async Filtrar() {
      this.loading = true;
      await this.GetListPosition();
      this.loading = false;
      this.$store.state.position.drawer = !this.$store.state.position.drawer;
    },
    async Limpiar() {
      this.$store.state.position.filtros = {
        code: "",
        name: "",
        description: "",
        estado: true,
        id_state: "",
      };
      this.loading = true;
      await this.GetListPosition();

      this.loading = false;
      this.$store.state.position.drawer = !this.$store.state.position.drawer;
    },
    async Aceptar() {
      if (this.$store.state.position.tipo == "nuevo") {
        if (this.$refs.frmDML.validate()) {
          this.loading = true;
          await this.setTown();
          await this.GetListPosition();
          this.loading = false;
        }
      }
      if (this.$store.state.position.tipo == "editar") {
        this.loading = true;
        if (this.$refs.frmDML.validate()) {
          await this.ActualizarTown();
          await this.GetListPosition();
        }
        this.loading = false;
      }
      if (this.$store.state.position.tipo == "ver") {
        this.$store.state.position.drawer = !this.$store.state.position.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.position.drawer;
      },
      set(val) {
        return (this.$store.state.position.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.model = { ...this.$store.state.position.model };
    },
  },
};
</script>

<style></style>
