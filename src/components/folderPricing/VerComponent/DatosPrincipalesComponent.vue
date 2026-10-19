<template>
  <v-container fluid class="pa-0">
    <v-card elevation="0">
      <v-card-title primary-title> Datos Principales</v-card-title>
      <v-card-text>
        <v-form class="px-2" ref="form">
          <v-autocomplete
            label="Tipo de Marketing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listMarketing"
            item-title="name"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.id_marketing"
            readonly
            v-if="mostrarmarketing"
          ></v-autocomplete>
          <v-autocomplete
            label="Estado de la cotización"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="estadoCotizacionItems"
            item-title="name"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.id_status"
            readonly
            v-if="mostrarmarestado"
          ></v-autocomplete>
          <v-autocomplete
            label="Ejecutivo"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="$store.state.pricing.datosPrincipales.id_vendedor"
            readonly
            v-if="mostrarmarejecutivo"
          ></v-autocomplete>

          <v-autocomplete
            label="Pricing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="$store.state.pricing.datosPrincipales.id_pricing"
            readonly
            v-if="mostrarmarpricing"
          ></v-autocomplete>
          <v-text-field
            label="Nombres"
            variant="outlined"
            placeholder="Nombres..."
            density="compact"
            requerid
            autocomplete="off"
            id="nombre"
            name="nombre"
            v-model="$store.state.pricing.datosPrincipales.nombre"
            readonly
          ></v-text-field>
          <v-text-field
            label="Teléfono"
            variant="outlined"
            placeholder="Teléfono..."
            density="compact"
            readonly
            v-model="$store.state.pricing.datosPrincipales.telefono"
          ></v-text-field>

          <v-autocomplete
            label="Sentido"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listModality"
            item-title="name"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.idsentido"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Tipo de Embarque"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listShipment"
            item-title="embarque"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.idtipocarga"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Incoterms"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listIncoterms"
            item-title="name"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.idincoterms"
            readonly
          >
            <template v-slot:selection="data" >
              {{ data.item.name }} - {{ data.item.description }}
            </template>
          </v-autocomplete>

          <v-text-field
            name="name"
            label="Nombre del proveedor"
            id="id"
            v-model="$store.state.pricing.datosPrincipales.proveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            name="Teléfono"
            label="Teléfono del proveedor"
            v-model="$store.state.pricing.datosPrincipales.telefonoproveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            label="Dirección del proveedor"
            v-model="$store.state.pricing.datosPrincipales.direccionproveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import axios from "@/api/http";
import { mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";

export default {
  props: {
    mostrarmarketing: {
      type: Boolean,
      default: true,
    },
    mostrarmarestado: {
      type: Boolean,
      default: true,
    },
    mostrarmarejecutivo: {
      type: Boolean,
      default: true,
    },
    mostrarmarpricing: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      buscarClienteDialog: false,
      search: "",
      headers: [
        { title: "Documento", key: "document" },
        { title: "Nombres (s)", key: "namelong" },
        { title: "Teléfono", key: "phone" },
      ],
      registro: useEntitiesStore().registroFlag,
    };
  },
  name: "DatosPrincipalesComponent",
  //  itemsEntities
  mounted() {
    this._getProveedor();
  },
  methods: {
    ...mapActions([
      "getMarketingList",
      "getQuoteStatus",
      "getModulesEntities",
      "getModality",
      "getShipment",
      "getIncoterms",
      "getPortBegin",
      "getPortEnd",
      "getModuleRole",
      "_getRole",
      "getCargarMasterDetalleNotasCotizacion",
      "_getEntities",
      "_getProveedor",
    ]),
    async changeShipment() {
      if (this.$store.state.pricing.datosPrincipales.idtipocarga) {
        this.$store.state.spiner = true;
        await this.getPortBegin();
        await this.getPortEnd();
        this.$store.state.spiner = false;
      }
    },
    async aceptar() {
      if ((await this.$refs.form.validate()).valid) {
        this.$store.state.pricing.step2 = true;
      }
    },
    guardarCliente(e, { item }) {
      this.$store.state.pricing.datosPrincipales.id_entitie = item.id;
      this.$store.state.pricing.datosPrincipales.nombre = item.namelong;
      this.$store.state.pricing.datosPrincipales.telefono = item.phone;
      this.buscarClienteDialog = false;
    },
    registrarNuevoCliente() {
      this.$store.state.modalEntitie = true;
    },
    mostrarProveedorFlag() {
      let exw = this.$store.state.pricing.listIncoterms.filter(
        (v) =>
          v.id == this.$store.state.pricing.datosPrincipales.idincoterms &&
          v.name == "EXW",
      );

      return exw.length > 0 ? true : false;
    },
  },
  computed: {
    ...mapStores(useEntitiesStore),
    ...mapState(["registroClienteFlag"]),
    estadoCotizacionItems() {
      const list = this.$store.state.pricing.listQuoteStatus || [];
      const idStatus = this.$store.state.pricing.datosPrincipales.id_status;
      const nameStatus =
        this.$store.state.pricing.datosPrincipales.nameStatusQuote;

      const exists = list.some((v) => v.id == idStatus);
      if (exists || !idStatus || !nameStatus) {
        return list;
      }

      return [
        ...list,
        {
          id: idStatus,
          name: nameStatus,
        },
      ];
    },
  },

  watch: {
    async registroClienteFlag() {
      this.$store.state.spiner = true;
      await this._getEntities();
      this.$store.state.spiner = false;
      if (!!this.entitiesStore.id) {
        let cliente = this.$store.state.itemsEntities.filter(
          (v) => v.id == this.entitiesStore.id,
        )[0];

        this.$store.state.pricing.datosPrincipales.id_entitie = cliente.id;
        this.$store.state.pricing.datosPrincipales.nombre = cliente.namelong;
        this.$store.state.pricing.datosPrincipales.telefono = cliente.phone;
      }
      this.buscarClienteDialog = false;
    },
  },
};
</script>

<style></style>
