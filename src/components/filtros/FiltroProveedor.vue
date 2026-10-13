<template>
  <v-card elevation="0">
    <v-card-title> FILTRAR REGISTROS </v-card-title>
    <v-card-text>
      <v-form ref="frmFiltro">

        <v-text-field
          label="Correlativo"
          placeholder="Correlativo..."
          :rules="[
            (v) =>
              /^(?!0\d+|\d*e)\d*(?:\.\d+)?$/.test(v) ||
              'Debe ser un número real entero positivo',
          ]"
          prefix="PROV-"
          clearable
          v-model="$store.state.entities.filtro.correlativo"
        ></v-text-field>

        <v-text-field
          label="Nombre Comercial/ Razón Social"
          placeholder="Nombre Comercial/ Razón Social..."
          clearable
          v-model="$store.state.entities.filtro.bussiness_name"
        ></v-text-field>

        <v-select
          :items="$store.state.itemsDocumentsPais"
          item-title="description"
          item-value="id"
          label="Tipo de Documento Fiscal"
          clearable
          v-model="$store.state.entities.filtro.id_document"
        ></v-select>

        <v-text-field
          label="Nro. Documento"
          placeholder="Nro. Documento"
          clearable
          v-model="$store.state.entities.filtro.nro_documento"
        ></v-text-field>

        <v-autocomplete
          :items="$store.state.itemsDataRoleList"
          item-title="name"
          item-value="id"
          label="Tipo de Proveedor"
          v-model="$store.state.entities.filtro.id_tipoproveedor"
          clearable
        ></v-autocomplete>

        <v-text-field
          label="Producto que vende"
          placeholder="Producto que vende"
          clearable
          v-model="$store.state.entities.filtro.producto"
        ></v-text-field>

        <v-autocomplete
          item-title="name"
          item-value="id"
          :items="$store.state.itemsPais"
          label="País"
          clearable
          v-model="$store.state.entities.filtro.id_pais"
          @update:model-value="_getState($store.state.entities.filtro.id_pais)"
        ></v-autocomplete>

        <v-autocomplete
          :items="$store.state.itemsState"
          item-title="name"
          item-value="id"
          label="Departamento"
          clearable
          v-model="$store.state.entities.filtro.id_state"
        ></v-autocomplete>

        <v-radio-group v-model="$store.state.entities.filtro.status" inline>
          <v-radio color="green" label="Activo" value="1"></v-radio>
          <v-radio color="error" label="Inactivo" value="0"></v-radio>
          <v-radio color="default" label="Todos" value=""></v-radio>
        </v-radio-group>
        
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn size="small" class="mx-1" color="success" @click="filtrar()">
        Filtrar
      </v-btn>
      <v-btn
        size="small"
        class="mx-1"
        color="error"
        @click="
          $store.state.entities.filtrarProveedor =
            !$store.state.entities.filtrarProveedor
        "
      >
        Cerrar
      </v-btn>
      <v-btn size="small" class="mx-1" color="default" @click="limpiar()">
        Limpiar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import miMixin from "../mixins/funciones";
export default {
  mixins: [miMixin],
  data() {
    return {};
  },
  methods: {
    ...mapActions(["_getState", "getListProveedor"]),
    async filtrar() {
      this.$store.state.spiner = true;
      await this.getListProveedor();
      this.$store.state.entities.filtrarProveedor =
        !this.$store.state.entities.filtrarProveedor;
        this.$store.state.spiner = false;
    },
    async limpiar() {
      this.$store.state.spiner = true;
      this.$refs.frmFiltro.reset();
      this.$store.state.entities.filtro.status = "1";
      await this.getListProveedor();
      this.$store.state.entities.filtrarProveedor =
        !this.$store.state.entities.filtrarProveedor;
        this.$store.state.spiner = false;
    },
  },
};
</script>

<style></style>
