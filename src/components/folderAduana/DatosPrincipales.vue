<template>
  <v-container fluid class="pa-0">
    <v-card elevation="0" ref="frmPuerto">
      <v-card-title primary-title> Datos Principales </v-card-title>
      <v-card-text>
        <v-form class="" ref="frmDatosPrincipales">
          <v-container>
            <v-row>
              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Tipo de Marketing"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-1"
                  :items="$store.state.pricing.listMarketing"
                  item-text="name"
                  item-value="id"
                  v-model="$store.state.aduana.datosPrincipales.id_marketing"
                ></v-autocomplete>
                <v-autocomplete
                  label="Estado de la cotización"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listQuoteStatus"
                  item-text="name"
                  item-value="id"
                  v-model="$store.state.aduana.datosPrincipales.id_status"
                  :item-disabled="(item) => item.status != 1"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Ejecutivo"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listEjecutivo"
                  item-text="nombrecompleto"
                  item-value="id"
                  item-key="id"
                  v-model="$store.state.aduana.datosPrincipales.id_vendedor"
                ></v-autocomplete>
              </v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Pricing"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.pricing.listEjecutivo"
                  item-text="nombrecompleto"
                  item-value="id"
                  item-key="id"
                  v-model="$store.state.aduana.datosPrincipales.id_pricing"
                ></v-autocomplete
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  label="Nombre del cliente"
                  outlined
                  placeholder="Nombre del cliente"
                  :append-icon="'mdi-account-search'"
                  @click:append="abrirModalCliente()"
                  @click="abrirModalCliente()"
                  :rules="[(v) => !!v || 'El nombre es requerido']"
                  dense
                  required
                  autocomplete="off"
                  id="nombre"
                  name="nombre"
                  v-model="$store.state.aduana.datosPrincipales.nombre"
                  readonly
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  label="Teléfono"
                  outlined
                  placeholder="Teléfono..."
                  dense
                  readonly
                  v-model="$store.state.aduana.datosPrincipales.telefono"
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Sentido"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.aduana.listModality"
                  item-text="name"
                  item-key="id"
                  item-value="id"
                  v-model="$store.state.aduana.datosPrincipales.idsentido"
                  @change="recargarServiciosCostos()"
                  :disabled="!EditableFlag"
                ></v-autocomplete
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Tipo de Embarque"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="$store.state.aduana.listShipment"
                  item-text="embarque"
                  item-key="id"
                  item-value="id"
                  v-model="$store.state.aduana.datosPrincipales.idtipocarga"
                  @change="recargarServiciosCostos()"
                  return-object
                  :disabled="!EditableFlag"
                ></v-autocomplete
              ></v-col>
              <v-col cols="12" class="my-0 py-0">
                <v-autocomplete
                  label="Incoterms"
                  outlined
                  dense
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="incoterms"
                  item-text="text"
                  item-key="id"
                  item-value="id"
                  v-model="$store.state.aduana.datosPrincipales.idincoterms"
                  @change="recargarServiciosCostos()"
                >
                  <template slot="selection" slot-scope="data">
                    {{ data.item.name }} - {{ data.item.description }}
                  </template>
                </v-autocomplete></v-col
              >

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  name="name"
                  label="Nombre del proveedor"
                  id="id"
                  v-model="$store.state.aduana.datosPrincipales.proveedor"
                  dense
                  outlined
                  v-if="mostrarProveedorFlag"
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  name="Teléfono"
                  label="Teléfono del proveedor"
                  v-model="
                    $store.state.aduana.datosPrincipales.telefonoproveedor
                  "
                  dense
                  outlined
                  :rules="[
                    (v) => {
                      if (v === '' || /^\+?\d+$/.test(v)) {
                        return true; // Válido si está en blanco o cumple con el formato
                      } else {
                        return 'Formato de teléfono no válido';
                      }
                    },
                  ]"
                  v-if="mostrarProveedorFlag"
                ></v-text-field
              ></v-col>

              <v-col cols="12" class="my-0 py-0">
                <v-text-field
                  name="name"
                  label="Dirección del proveedor"
                  id="id"
                  v-model="
                    $store.state.aduana.datosPrincipales.direccionproveedor
                  "
                  dense
                  outlined
                  v-if="mostrarProveedorFlag"
                ></v-text-field>
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0 align-right"
                v-if="mostrarContinuarFlag && mostrarBtn"
              >
                <v-btn color="#3F51B5" dark @click="continuarDatosCarga()" small
                  >Continuar Datos Carga</v-btn
                >
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
    </v-card>
    <!-- dIALOG -->
    <v-dialog v-model="buscarClienteDialog" max-width="80%">
      <v-card>
        <v-card-title
          >Buscar Cliente<v-spacer></v-spacer>
          <v-btn color="success" @click="registrarNuevoCliente" small>
            Nuevo Cliente
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field label="Buscar..." v-model="search"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-data-table
                  :headers="headers"
                  :items="$store.state.itemsEntities"
                  :search="search"
                  @dblclick:row="guardarCliente"
                  item-key="index"
                  :loading="$store.state.itemsEntities.length == 0"
                  loading-text="Buscando Clientes..."
                >
                  <template v-slot:[`item.action`]="{ item }">
                    <v-btn
                      small
                      color="success"
                      @click="guardarCliente(null, { item })"
                    >
                      Seleccionar <v-icon class="mx-2">mdi-account-plus</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";
import Swal from "sweetalert2";
export default {
  props: {
    mostrarBtn: {
      type: Boolean,
      default: true,
    },
    EditableFlag: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      search: "",
      buscarClienteDialog: false,
      mostrarContinuarFlag: true,
      headers: [
        { text: "Documento", value: "document" },
        { text: "Nombres (s)", value: "nombrecompleto" },
        { text: "Teléfono", value: "phone" },
        { value: "action" },
      ],
      mostrar: false,
    };
  },
  async mounted() {
    this.$refs.frmDatosPrincipales.resetValidation();
    // this.mostrar = true;
  },
  methods: {
    ...mapActions([
      "getMarketingList",
      "getQuoteStatus",
      "getShipment",
      "getIncoterms",
      "_getEntitiesCliente",
      "getCargarEjecutivo",
    ]),
    registrarNuevoCliente() {
      this.$store.state.modalEntitie = true;
    },
    abrirModalCliente() {
      this.buscarClienteDialog = true;
      this.$store.state.itemsEntities = [];
      this._getEntitiesCliente();
    },
    guardarCliente(e, { item }) {
      if (!item.phone) {
        Swal.fire({
          icon: "warning",
          title: "¡Advertencia!",
          text: "El cliente seleccionado no tiene un número de teléfono registrado. Por favor, seleccione otro cliente o puede actualizar luego en el fichero de cliente.",
        });
      }
      this.$store.state.aduana.datosPrincipales.id_entitie = item.id;
      this.$store.state.aduana.datosPrincipales.nombre = item.nombrecompleto;
      this.$store.state.aduana.datosPrincipales.telefono = item.phone;
      this.buscarClienteDialog = false;
    },
    continuarDatosCarga() {
      if (this.$refs.frmDatosPrincipales.validate()) {
        this.$emit("activarDatosCarga", true);
        this.mostrarContinuarFlag = false;
      }
    },
    recargarServiciosCostos() {
      if (
        !this.$store.state.aduana.datosPrincipales.idsentido ||
        !this.$store.state.aduana.datosPrincipales.idincoterms ||
        Object.keys(this.$store.state.aduana.datosPrincipales.idtipocarga) === 0
      ) {
        return;
      }
      this.$emit("recargarServiciosCostos", true);
    },
  },
  computed: {
    ...mapState(["registroClienteFlag", ""]),
    incoterms() {
      let Icoterms = [];
      [...this.$store.state.aduana.listIncoterms].forEach((element) => {
        element.text = element.name + " - " + element.description;
        Icoterms.push(element);
      });

      return Icoterms;
    },
    mostrarProveedorFlag() {
      let exw = this.$store.state.aduana.listIncoterms.filter(
        (v) =>
          v.id == this.$store.state.aduana.datosPrincipales.idincoterms &&
          v.name == "EXW",
      );

      return exw.length > 0 ? true : false;
    },
  },
  watch: {
    async registroClienteFlag() {
      this.$store.state.spiner = true;
      await this._getEntitiesCliente();
      this.$store.state.spiner = false;
      if (!!this.$store.state.entities.id) {
        let cliente = this.$store.state.itemsEntities.filter(
          (v) => v.id == this.$store.state.entities.id,
        )[0];
        this.$store.state.aduana.datosPrincipales.id_entitie = cliente.id;
        this.$store.state.aduana.datosPrincipales.nombre =
          cliente.nombrecompleto;
        this.$store.state.aduana.datosPrincipales.telefono = cliente.phone;
      }
      this.buscarClienteDialog = false;
    },
  },
};
</script>

<style scoped>
.align-right {
  text-align: right;
}
</style>
