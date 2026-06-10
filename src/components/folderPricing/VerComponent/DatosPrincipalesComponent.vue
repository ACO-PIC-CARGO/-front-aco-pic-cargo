<template>
  <v-container fluid class="pa-0">
    <v-card elevation="0">
      <v-card-title primary-title> Datos Principales</v-card-title>
      <v-card-text>
        <v-form class="px-2" ref="form">
          <v-autocomplete
            label="Tipo de Marketing"
            outlined
            dense
            class="my-1"
            :items="$store.state.pricing.listMarketing"
            item-text="name"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.id_marketing"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Estado de la cotización"
            outlined
            dense
            class="my-1"
            :items="estadoCotizacionItems"
            item-text="name"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.id_status"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Ejecutivo"
            outlined
            dense
            class="my-1"
            :items="$store.state.pricing.listEjecutivo"
            item-text="name"
            item-value="id_entitie"
            item-key="id_entitie"
            v-model="$store.state.pricing.datosPrincipales.id_vendedor"
            readonly
          ></v-autocomplete>

          <v-autocomplete
            label="Pricing"
            outlined
            dense
            class="my-1"
            :items="$store.state.pricing.listEjecutivo"
            item-text="name"
            item-value="id_entitie"
            item-key="id_entitie"
            v-model="$store.state.pricing.datosPrincipales.id_pricing"
            readonly
          ></v-autocomplete>
          <v-text-field
            label="Nombres"
            outlined
            placeholder="Nombres..."
            dense
            requerid
            autocomplete="off"
            id="nombre"
            name="nombre"
            v-model="$store.state.pricing.datosPrincipales.nombre"
            readonly
          ></v-text-field>
          <v-text-field
            label="Teléfono"
            outlined
            placeholder="Teléfono..."
            dense
            readonly
            v-model="$store.state.pricing.datosPrincipales.telefono"
          ></v-text-field>

          <v-autocomplete
            label="Sentido"
            outlined
            dense
            class="my-1"
            :items="$store.state.pricing.listModality"
            item-text="name"
            item-key="id"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.idsentido"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Tipo de Embarque"
            outlined
            dense
            class="my-1"
            :items="$store.state.pricing.listShipment"
            item-text="embarque"
            item-key="id"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.idtipocarga"
            return-object
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Incoterms"
            outlined
            dense
            class="my-1"
            :items="$store.state.pricing.listIncoterms"
            item-text="name"
            item-key="id"
            item-value="id"
            v-model="$store.state.pricing.datosPrincipales.idincoterms"
            readonly
          >
            <template slot="selection" slot-scope="data">
              {{ data.item.name }} - {{ data.item.description }}
            </template>
          </v-autocomplete>

          <v-text-field
            name="name"
            label="Nombre del proveedor"
            id="id"
            v-model="$store.state.pricing.datosPrincipales.proveedor"
            dense
            outlined
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            name="Teléfono"
            label="Teléfono del proveedor"
            v-model="$store.state.pricing.datosPrincipales.telefonoproveedor"
            dense
            outlined
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            name="name"
            label="Dirección del proveedor"
            id="id"
            v-model="$store.state.pricing.datosPrincipales.direccionproveedor"
            dense
            outlined
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
import axios from '@/api/axios-config';

export default {
  data() {
    return {
      buscarClienteDialog: false,
      search: "",
      headers: [
        { text: "Documento", value: "document" },
        { text: "Nombres (s)", value: "namelong" },
        { text: "Teléfono", value: "phone" },
      ],
      registro: this.$store.state.entities.registroFlag,
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
      "_getEntities","_getProveedor"
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
      if (this.$refs.form.validate()) {
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
      if (!!this.$store.state.entities.id) {
        let cliente = this.$store.state.itemsEntities.filter(
          (v) => v.id == this.$store.state.entities.id,
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
