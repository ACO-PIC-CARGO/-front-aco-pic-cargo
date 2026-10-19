<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap" primary-title>
      {{ getName() }}
      <v-spacer></v-spacer>
      <v-btn variant="text"
        icon
        color="default"
        @click="puertoStore.drawer = !puertoStore.drawer"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-text v-if="puertoStore.tipo == 'filter'">
      <div class="col-12 py-1">
        <v-autocomplete
          label="Tipo Transporte"
          :items="transportStore.list"
          v-model="puertoStore.PortFilter.id_transporte"
          item-title="name"
          item-value="id"
          :clearable="puertoStore.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>
      <div class="col-12 py-1">
        <v-autocomplete
          label="Pais"
          :items="$store.state.itemsPais"
          v-model="puertoStore.PortFilter.id_pais"
          item-title="name"
          item-value="id"
          :clearable="puertoStore.tipo != 'ver'"
        >
        </v-autocomplete>
      </div>

      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="puertoStore.PortFilter.code"
          label="Código"
          :clearable="puertoStore.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <div class="col-12 py-1">
        <v-text-field
          v-model="puertoStore.PortFilter.name"
          label="Nombre"
          :clearable="puertoStore.tipo != 'ver'"
        ></v-text-field>
      </div>
      <!-- <div class="col-12 py-1">
        <v-text-field
          v-model="puertoStore.PortFilter.description"
          label="Descripción"
          :clearable="puertoStore.tipo != 'ver'"
        ></v-text-field>
      </div> -->
      <div class="col-12 py-1">
        <span> Estado</span>
        <v-radio-group
          v-model="puertoStore.PortFilter.status"
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
            :items="transportStore.list"
            v-model="puertoStore.PortModel.id_transporte"
            :readonly="puertoStore.tipo != 'nuevo'"
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
            v-model="puertoStore.PortModel.id_pais"
            :readonly="puertoStore.tipo == 'ver'"
            item-title="name"
            item-value="id"
            :rules="[(v) => !!v || 'Dato Requerido']"
            :item-props="(item) => ({ disabled: item.status != 1 })"
          >
          </v-autocomplete>
        </div>

        <!-- <div class="col-12 py-1">
          <v-text-field
            v-model="puertoStore.PortModel.code"
            :readonly="puertoStore.tipo != 'nuevo'"
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
            v-model="puertoStore.PortModel.name"
            :readonly="puertoStore.tipo == 'ver'"
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
            v-model="puertoStore.PortModel.description"
            :readonly="puertoStore.tipo == 'ver'"
            label="Descripción"
            :clearable="puertoStore.tipo != 'ver'"
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
            :readonly="puertoStore.tipo == 'ver'"
            :label="`Estado: ${
              !!puertoStore.PortModel.status ? 'Activo' : 'Inactivo'
            }`"
            color="success"
            v-model="puertoStore.PortModel.status"
          ></v-switch>
        </div> -->
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        class="mx-1"
        color="success"
        v-if="puertoStore.tipo == 'filter'"
        @click="Filtrar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="default"
        v-if="puertoStore.tipo == 'filter'"
        @click="Limpiar()"
        :loading="loading"
        >Limpiar</v-btn
      >
      <v-btn
        class="mx-1"
        color="success"
        v-if="
          puertoStore.tipo != 'filter' &&
          puertoStore.tipo != 'ver'
        "
        @click="Aceptar()"
        :loading="loading"
        >Aceptar</v-btn
      >
      <v-btn
        class="mx-1"
        color="warning"
        @click="puertoStore.drawer = !puertoStore.drawer"
        :loading="loading"
        >Cerrar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useTransportStore } from "@/stores/transport";
import { usePuertoStore } from "@/stores/puerto";
export default {
  data() {
    return { errIATA: "", errICAO: "", loading: false, puerto: "" };
  },
  methods: {
    ...mapActions([
      "_getPais",
    ]),
    ...mapPiniaActions(usePuertoStore, ["GetListPort", "setPuerto", "ActualizarPuerto"]),
    ...mapPiniaActions(useTransportStore, ["cargarTransport"]),
    getName() {
      if (this.puertoStore.tipo == "ver") {
        return `Puerto ${this.PortModel.name} – Modo Vista`;
      }
      if (this.puertoStore.tipo == "nuevo") {
        return "Nuevo Puerto";
      }
      if (this.puertoStore.tipo == "editar") {
        return `Modificar Puerto: ${this.PortModel.name}`;
      }
      if (this.puertoStore.tipo == "filter") {
        return "Filtrar Registros";
      }
    },
    async Filtrar() {
      this.loading = true;
      await this.GetListPort();
      this.loading = false;
      this.puertoStore.drawer = !this.puertoStore.drawer;
    },
    async Limpiar() {
      this.puertoStore.PortFilter = {
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
      this.puertoStore.drawer = !this.puertoStore.drawer;
    },
    async Aceptar() {
      if (this.puertoStore.tipo == "nuevo") {
        if ((await this.$refs.frmDML.validate()).valid) {
          this.loading = true;
          await this.setPuerto();
          await this.GetListPort();
          this.loading = false;
        }
      }
      if (this.puertoStore.tipo == "editar") {
        this.loading = true;
        if ((await this.$refs.frmDML.validate()).valid) {
          await this.ActualizarPuerto();
          await this.GetListPort();
        }
        this.loading = false;
      }
      if (this.puertoStore.tipo == "ver") {
        this.puertoStore.drawer = !this.puertoStore.drawer;
      }
    },
  },
  computed: {
    ...mapStores(usePuertoStore, useTransportStore),
    drawer: {
      get() {
        return this.puertoStore.drawer;
      },
      set(val) {
        return (this.puertoStore.drawer = drawer);
      },
    },
  },
  watch: {
    drawer() {
      this.PortModel = { ...this.puertoStore.PortModel };
      this.$refs.frmDML.resetValidation();
    },
  },
};
</script>

<style></style>
