<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="$store.state.motonave.drawer = !$store.state.motonave.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.motonave.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.motonave.MotonaveFilter.name"
          label="Nombre"
          :clearable="$store.state.motonave.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.motonave.MotonaveFilter.description"
          label="Descripción"
          :clearable="$store.state.motonave.tipo != 'ver'"
        ></v-text-field>
      </div>
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="$store.state.motonave.MotonaveFilter.status"
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
            v-model="$store.state.motonave.MotonaveModel.name"
            :readonly="$store.state.motonave.tipo == 'ver'"
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
            v-model="$store.state.motonave.MotonaveModel.description"
            :readonly="$store.state.motonave.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.motonave.tipo != 'ver'"
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
            :readonly="$store.state.motonave.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.motonave.MotonaveModel.status
                ? 'Activo'
                : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.motonave.MotonaveModel.status"
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
        v-if="$store.state.motonave.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.motonave.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.motonave.tipo != 'filter' && $store.state.motonave.tipo != 'ver'"
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.motonave.drawer = !$store.state.motonave.drawer"
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
    return { errIATA: "", errICAO: "", loading: false, motonave: "" };
  },
  methods: {
    ...mapActions(["GetListMotonave", "setMotonave", "ActualizarMotonave"]),
    getName() {
      if (this.$store.state.motonave.tipo == "ver") {
        return `Motonave ${this.MotonaveModel.name} – Modo Vista`;
      }
      if (this.$store.state.motonave.tipo == "nuevo") {
        return "Nuevo Motonave";
      }
      if (this.$store.state.motonave.tipo == "editar") {
        return `Modificar Motonave: ${this.MotonaveModel.name}`;
      }
      if (this.$store.state.motonave.tipo == "filter") {
        return "Filtrar Regitros";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListMotonave();
      this.loading = false;
      this.$store.state.motonave.drawer = !this.$store.state.motonave.drawer;
    },
    async Limpiar() {
      this.$store.state.motonave.MotonaveFilter = {
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
      this.$store.state.motonave.drawer = !this.$store.state.motonave.drawer;
    },
    async Aceptar() {
      if (this.$store.state.motonave.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setMotonave();
          await this.GetListMotonave();
          this.loading = false;
        }
      }
      if (this.$store.state.motonave.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarMotonave();
          await this.GetListMotonave();
        }
        this.loading = false;
      }
      if (this.$store.state.motonave.tipo == "ver") {
        this.$store.state.motonave.drawer = !this.$store.state.motonave.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.motonave.drawer;
      },
      set(val) {
        return (this.$store.state.motonave.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.MotonaveModel = { ...this.$store.state.motonave.MotonaveModel };
    },
  },
};
</script>

<style></style>
