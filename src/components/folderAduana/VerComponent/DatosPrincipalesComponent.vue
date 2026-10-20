<template>
  <v-container fluid class="pa-0">
    <v-card elevation="0">
      <v-card-title primary-title> Datos Principales </v-card-title>
      <v-card-text>
        <v-form class="px-2" ref="form">
          
          <v-autocomplete
            label="Tipo de Marketing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listMarketing"
            item-title="name"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.id_marketing"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Estado de la cotización"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listQuoteStatus"
            item-title="name"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.id_status"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Ejecutivo"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="aduanaStore.datosPrincipales.id_vendedor"
            readonly
          ></v-autocomplete>

          <v-autocomplete
            label="Pricing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="pricingStore.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            v-model="aduanaStore.datosPrincipales.id_pricing"
            readonly
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
            v-model="aduanaStore.datosPrincipales.nombre"
            readonly
          ></v-text-field>
          <v-text-field
            label="Teléfono"
            variant="outlined"
            placeholder="Teléfono..."
            density="compact"
            readonly
            v-model="aduanaStore.datosPrincipales.telefono"
          ></v-text-field>

          <v-autocomplete
            label="Sentido"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="aduanaStore.listModality"
            item-title="name"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.idsentido"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Tipo de Embarque"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="aduanaStore.listShipment"
            item-title="embarque"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.idtipocarga"
            return-object
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Incoterms"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="aduanaStore.listIncoterms"
            item-title="name"
            item-value="id"
            v-model="aduanaStore.datosPrincipales.idincoterms"
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
            v-model="aduanaStore.datosPrincipales.proveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            name="Teléfono"
            label="Teléfono del proveedor"
            v-model="aduanaStore.datosPrincipales.telefonoproveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            label="Dirección del proveedor"
            v-model="aduanaStore.datosPrincipales.direccionproveedor"
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
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";

export default {
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
  mounted() {},
  methods: {
    ...mapActions([
      "_getRole",
      "_getEntities",
    ]),
    ...mapPiniaActions(usePricingStore, ["getMarketingList", "getQuoteStatus", "getModulesEntities", "getModality", "getShipment", "getIncoterms", "getPortBegin", "getPortEnd", "getModuleRole", "getCargarMasterDetalleNotasCotizacion"]),
    async changeShipment() {
      if (this.aduanaStore.datosPrincipales.idtipocarga) {
        this.$store.state.spiner = true;
        await this.getPortBegin();
        await this.getPortEnd();
        this.$store.state.spiner = false;
      }
    },
    async aceptar() {
      if ((await this.$refs.form.validate()).valid) {
        this.aduanaStore.step2 = true;
      }
    },
    guardarCliente(e, { item }) {
      this.aduanaStore.datosPrincipales.id_entitie = item.id;
      this.aduanaStore.datosPrincipales.nombre = item.namelong;
      this.aduanaStore.datosPrincipales.telefono = item.phone;
      this.buscarClienteDialog = false;
    },
    registrarNuevoCliente() {
      this.$store.state.modalEntitie = true;
    },
    mostrarProveedorFlag() {
      let exw = this.aduanaStore.listIncoterms.filter(
        (v) =>
          v.id == this.aduanaStore.datosPrincipales.idincoterms &&
          v.name == "EXW"
      );

      return exw.length > 0 ? true : false;
    },
  },
  computed: {
    ...mapStores(useAduanaStore, usePricingStore, useEntitiesStore),
    ...mapState(["registroClienteFlag"]),
  },

  watch: {
    async registroClienteFlag() {
      this.$store.state.spiner = true;
      await this._getEntities();
      this.$store.state.spiner = false;
      if (!!this.entitiesStore.id) {
        let cliente = this.$store.state.itemsEntities.filter(
          (v) => v.id == this.entitiesStore.id
        )[0];

        this.aduanaStore.datosPrincipales.id_entitie = cliente.id;
        this.aduanaStore.datosPrincipales.nombre = cliente.namelong;
        this.aduanaStore.datosPrincipales.telefono = cliente.phone;
      }
      this.buscarClienteDialog = false;
    },
  },
};
</script>

<style></style>
