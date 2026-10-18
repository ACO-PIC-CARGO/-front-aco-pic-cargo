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
            :items="$store.state.pricing.listMarketing"
            item-title="name"
            item-value="id"
            v-model="$store.state.aduana.datosPrincipales.id_marketing"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Estado de la cotización"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listQuoteStatus"
            item-title="name"
            item-value="id"
            v-model="$store.state.aduana.datosPrincipales.id_status"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Ejecutivo"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            item-key="id_entitie"
            v-model="$store.state.aduana.datosPrincipales.id_vendedor"
            readonly
          ></v-autocomplete>

          <v-autocomplete
            label="Pricing"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.pricing.listEjecutivo"
            item-title="name"
            item-value="id_entitie"
            item-key="id_entitie"
            v-model="$store.state.aduana.datosPrincipales.id_pricing"
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
            v-model="$store.state.aduana.datosPrincipales.nombre"
            readonly
          ></v-text-field>
          <v-text-field
            label="Teléfono"
            variant="outlined"
            placeholder="Teléfono..."
            density="compact"
            readonly
            v-model="$store.state.aduana.datosPrincipales.telefono"
          ></v-text-field>

          <v-autocomplete
            label="Sentido"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.aduana.listModality"
            item-title="name"
            item-key="id"
            item-value="id"
            v-model="$store.state.aduana.datosPrincipales.idsentido"
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Tipo de Embarque"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.aduana.listShipment"
            item-title="embarque"
            item-key="id"
            item-value="id"
            v-model="$store.state.aduana.datosPrincipales.idtipocarga"
            return-object
            readonly
          ></v-autocomplete>
          <v-autocomplete
            label="Incoterms"
            variant="outlined"
            density="compact"
            class="my-1"
            :items="$store.state.aduana.listIncoterms"
            item-title="name"
            item-key="id"
            item-value="id"
            v-model="$store.state.aduana.datosPrincipales.idincoterms"
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
            v-model="$store.state.aduana.datosPrincipales.proveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            name="Teléfono"
            label="Teléfono del proveedor"
            v-model="$store.state.aduana.datosPrincipales.telefonoproveedor"
            density="compact"
            variant="outlined"
            readonly
            v-if="mostrarProveedorFlag()"
          ></v-text-field>

          <v-text-field
            label="Dirección del proveedor"
            v-model="$store.state.aduana.datosPrincipales.direccionproveedor"
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
      registro: this.$store.state.entities.registroFlag,
    };
  },
  name: "DatosPrincipalesComponent",
  //  itemsEntities
  mounted() {},
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
    ]),
    async changeShipment() {
      if (this.$store.state.aduana.datosPrincipales.idtipocarga) {
        this.$store.state.spiner = true;
        await this.getPortBegin();
        await this.getPortEnd();
        this.$store.state.spiner = false;
      }
    },
    async aceptar() {
      if ((await this.$refs.form.validate()).valid) {
        this.$store.state.aduana.step2 = true;
      }
    },
    guardarCliente(e, { item }) {
      this.$store.state.aduana.datosPrincipales.id_entitie = item.id;
      this.$store.state.aduana.datosPrincipales.nombre = item.namelong;
      this.$store.state.aduana.datosPrincipales.telefono = item.phone;
      this.buscarClienteDialog = false;
    },
    registrarNuevoCliente() {
      this.$store.state.modalEntitie = true;
    },
    mostrarProveedorFlag() {
      let exw = this.$store.state.aduana.listIncoterms.filter(
        (v) =>
          v.id == this.$store.state.aduana.datosPrincipales.idincoterms &&
          v.name == "EXW"
      );

      return exw.length > 0 ? true : false;
    },
  },
  computed: {
    ...mapState(["registroClienteFlag"]),
  },

  watch: {
    async registroClienteFlag() {
      this.$store.state.spiner = true;
      await this._getEntities();
      this.$store.state.spiner = false;
      if (!!this.$store.state.entities.id) {
        let cliente = this.$store.state.itemsEntities.filter(
          (v) => v.id == this.$store.state.entities.id
        )[0];

        this.$store.state.aduana.datosPrincipales.id_entitie = cliente.id;
        this.$store.state.aduana.datosPrincipales.nombre = cliente.namelong;
        this.$store.state.aduana.datosPrincipales.telefono = cliente.phone;
      }
      this.buscarClienteDialog = false;
    },
  },
};
</script>

<style></style>
