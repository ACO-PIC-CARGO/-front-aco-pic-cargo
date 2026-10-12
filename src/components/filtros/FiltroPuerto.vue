<template>
  <v-card>
    <v-card-title primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn
        icon
        color="default"
        @click="$store.state.puerto.drawer = !$store.state.puerto.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="$store.state.puerto.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Tipo Transporte"
          :items="$store.state.transport.list"
          v-model="$store.state.puerto.PortFilter.id_transporte"
          item-title="name"
          item-value="id"
          :clearable="$store.state.puerto.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="$store.state.puerto.PortFilter.id_pais"
          item-title="name"
          item-value="id"
          :clearable="$store.state.puerto.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>

      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.puerto.PortFilter.code"
          label="Código"
          :clearable="$store.state.puerto.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.puerto.PortFilter.name"
          label="Nombre"
          :clearable="$store.state.puerto.tipo != 'ver'"
        ></v-text-field>
      </div>
      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="$store.state.puerto.PortFilter.description"
          label="Descripción"
          :clearable="$store.state.puerto.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="$store.state.puerto.PortFilter.status"
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
          <v-autocomplete
            label="Tipo Transporte (*)"
            :items="$store.state.transport.list"
            v-model="$store.state.puerto.PortModel.id_transporte"
            :readonly="$store.state.puerto.tipo != 'nuevo'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>
        <div class="col-12 py-1">
          <v-autocomplete
            label="Pais (*)"
            :items="$store.state.itemsPais"
            v-model="$store.state.puerto.PortModel.id_pais"
            :readonly="$store.state.puerto.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>

        <!-- <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.puerto.PortModel.code"
            :readonly="$store.state.puerto.tipo != 'nuevo'"
            label="Código (*)"
            :rules="[
              (v) =>
                v.length < 50 ||
                'El código no puede exceder los 50 caracteres.',
              (v) => !!v || 'Dato Requerido',
            ]"
          ></v-text-field>
        </div> -->
        <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.puerto.PortModel.name"
            :readonly="$store.state.puerto.tipo == 'ver'"
            label="Nombre (*)"
            :rules="[
              (v) => !!v || 'Dato Requerido',
              (v) =>
                (!!v && v.length < 50) ||
                'El nombre no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div>
        <!-- <div class="col-12 py-1">
          <v-text-field
            v-model="$store.state.puerto.PortModel.description"
            :readonly="$store.state.puerto.tipo == 'ver'"
            label="Descripción"
            :clearable="$store.state.puerto.tipo != 'ver'"
            :rules="[
              (v) =>
                (!!v ? v.length < 50 : true) ||
                'La descripción no puede exceder los 50 caracteres.',
            ]"
          ></v-text-field>
        </div> -->
        <!-- <div class="col-12 py-1">
          <span> Estado</span>
          <v-switch
            :readonly="$store.state.puerto.tipo == 'ver'"
            :label="`Estado: ${
              !!$store.state.puerto.PortModel.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="$store.state.puerto.PortModel.status"
          ></v-switch>
        </div> -->
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="$store.state.puerto.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="$store.state.puerto.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          $store.state.puerto.tipo != 'filter' &&
          $store.state.puerto.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="$store.state.puerto.drawer = !$store.state.puerto.drawer"
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
    return { errIATA: "", errICAO: "", loading: false, puerto: "" };
  },
  methods: {
    ...mapActions([
      "GetListPort",
      "_getPais",
      "cargarTransport",
      "setPuerto",
      "ActualizarPuerto",
    ]),
    getName() {
      if (this.$store.state.puerto.tipo == "ver") {
        return `Puerto ${this.PortModel.name} – Modo Vista`;
      }
      if (this.$store.state.puerto.tipo == "nuevo") {
        return "Nuevo Puerto";
      }
      if (this.$store.state.puerto.tipo == "editar") {
        return `Modificar Puerto: ${this.PortModel.name}`;
      }
      if (this.$store.state.puerto.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListPort();
      this.loading = false;
      this.$store.state.puerto.drawer = !this.$store.state.puerto.drawer;
    },
    async Limpiar() {
      this.$store.state.puerto.PortFilter = {
        id: "",
        id_pais: "",
        code: "",
        name: "",
        description: "",
        id_transporte: "",
        status: "1",
      };
      this.loading = true;
      await this.GetListPort();
      this.loading = false;
      this.$store.state.puerto.drawer = !this.$store.state.puerto.drawer;
    },
    async Aceptar() {
      if (this.$store.state.puerto.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setPuerto();
          await this.GetListPort();
          this.loading = false;
        }
      }
      if (this.$store.state.puerto.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarPuerto();
          await this.GetListPort();
        }
        this.loading = false;
      }
      if (this.$store.state.puerto.tipo == "ver") {
        this.$store.state.puerto.drawer = !this.$store.state.puerto.drawer;
      }
    },
  },
  computed: {
    drawer: {
      get() {
        return this.$store.state.puerto.drawer;
      },
      set(val) {
        return (this.$store.state.puerto.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.PortModel = { ...this.$store.state.puerto.PortModel };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
