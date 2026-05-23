<template>
  <v-card>
    <v-card-title>
      <h4 class="mx-auto">
        ACTUALIZAR COSTOS -
        {{ Modality }} | {{ Shipment }} |
        {{ incoterms }}
      </h4>
    </v-card-title>
    <v-expansion-panels multiple class="px-5 py-2" :value="panelesAbiertos">
      <!-- Ahora iteramos sobre la propiedad computada filtrada -->
      <v-expansion-panel
        v-for="(item, index) in panelesConDatos"
        :key="index"
        dense
      >
        <v-expansion-panel-header>
          {{ item.name }}
          <v-btn
            color="success"
            small
            style="max-width: 370px"
            @click.stop="abrirModal(item.codigo)"
            class="ml-auto"
          >
            Añadir Costo {{ item.name }}</v-btn
          >
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-data-table
            :headers="headers"
            :items="obtenerCostosEnBaseTipoCosto(item.codigo)"
            dense
            hide-default-footer
          >
            <template v-slot:[`item.servicio`]="{ item }">
              <v-autocomplete
                :items="lstServicios"
                item-value="id"
                item-text="service"
                v-model="item.id_service"
                outlined
                dense
                hide-details
              ></v-autocomplete>
            </template>
            <template v-slot:[`item.multiplicador`]="{ item }">
              <v-autocomplete
                :items="lstMultiplicador"
                item-value="id"
                item-text="name"
                v-model="item.id_multiplicador"
                outlined
                dense
                hide-details
              ></v-autocomplete>
            </template>
            <template v-slot:[`item.costo`]="{ item }">
              <v-text-field
                dense
                v-model="item.costo"
                outlined
                hide-details
              ></v-text-field>
            </template>
            <template v-slot:[`item.minimo`]="{ item }">
              <v-text-field
                v-if="mostrarMinimo(item)"
                dense
                v-model="item.minimo"
                outlined
                hide-details
              ></v-text-field>
            </template>
            <template v-slot:[`item.precio`]="{ item }">
              <v-text-field
                dense
                v-model="item.precio"
                type="number"
                step="0.01"
                outlined
                hide-details
              ></v-text-field>
            </template>
            <template v-slot:[`item.status`]="{ item }">
              <v-switch
                v-model="item.status"
                :true-value="1"
                :false-value="0"
              ></v-switch>
            </template>
            <template v-slot:[`item.proveedor`]="{ item }">
              <v-autocomplete
                dense
                item-text="namelong"
                item-value="id"
                :items="$store.state.proveedor.lstProveedores"
                @update:search-input="recargarProveedores"
                v-model="item.id_proveedor"
                hide-details
                outlined
              ></v-autocomplete>
            </template>
          </v-data-table>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-card-actions>
      <v-btn class="ml-auto" @click="guardar()" color="success">Guardar</v-btn>
      <v-btn color="error" @click="$emit('cerrarModal')">Cancelar</v-btn>
    </v-card-actions>
    <!-- Diálogo para agregar nuevo costo -->
    <v-dialog v-model="dialog" persistent max-width="30%">
      <v-form ref="frmNuevoCosto">
        <v-card>
          <v-card-title primary-title> Nuevo Costo </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  label="Servicio Asociado"
                  item-text="service"
                  item-value="id"
                  :items="lstServicios"
                  v-model="fromDataService.id_service"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  label="Proveedor"
                  item-text="namelong"
                  item-value="id"
                  :items="$store.state.proveedor.lstProveedores"
                  @update:search-input="recargarProveedores"
                  v-model="fromDataService.id_proveedor"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-autocomplete
                  dense
                  label="Multiplicador"
                  :items="lstMultiplicador"
                  item-value="id"
                  item-text="name"
                  v-model="fromDataService.id_multiplicador"
                  :rules="[(v) => !!v || 'Dato requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  dense
                  label="Concepto"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.costo"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  dense
                  label="Precio"
                  type="number"
                  min="0"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.precio"
                >
                </v-text-field>
              </v-col>
              <v-col cols="12" class="my-1 py-1">
                <v-text-field
                  dense
                  label="Valor Mínimo"
                  type="number"
                  min="0"
                  v-if="mostrarMinimo(fromDataService)"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  v-model="fromDataService.minimo"
                >
                </v-text-field>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="d-flex justify-end">
            <v-btn color="success" @click="guardarCosto()">Aceptar</v-btn>
            <v-btn color="red" @click="dialog = !dialog" dark>cancelar</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapState } from "vuex";
import { mapActions } from "vuex/dist/vuex.common.js";
import _ from "lodash";

export default {
  props: {
    id_modality: {
      type: Number,
      default: null,
    },
    id_shipment: {
      type: Number,
      default: null,
    },
    id_incoterms: {
      type: Number,
      default: null,
    },
    Modality: {
      type: String,
      default: null,
    },
    Shipment: {
      type: String,
      default: null,
    },
    incoterms: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      dialog: false,
      fromDataService: { id_multiplicador: 0, minimo: 0 },
      headers: [
        { value: "servicio", text: "Servicio", width: "15%" },
        { value: "proveedor", text: "Proveedor", width: "15%" },
        { value: "multiplicador", text: "Multiplicador", width: "15%" },
        { value: "costo", text: "Costo", width: "15%" },
        { value: "precio", text: "Precio", width: "10%" },
        { value: "minimo", text: "Valor Mínimo", width: "10%" },
        { value: "status", text: "Status", width: "5%" },
      ],
    };
  },
  methods: {
    ...mapActions([
      "getModality",
      "getShipment",
      "CargarIncotermsConfig",
      "obtenerProveedorPricing",
      "getTipoCostos",
    ]),
    ...mapActions("configuracion", [
      "getCargarCostos",
      "getMultiplicadorConfigCosto",
      "setGuardarCostos",
    ]),
    mostrarMinimo(item) {
      const codigosEspeciales = [13, 14, 15];

      const multiplicador = this.lstMultiplicador.find(
        (v) => v.id === item.id_multiplicador,
      );

      if (
        multiplicador &&
        codigosEspeciales.includes(Number(multiplicador.code))
      ) {
        return true;
      }

      return false;
    },
    obtenerCostosEnBaseTipoCosto(codigoTipoCosto) {
      //   if (this.id_modality == 1) {
      if (codigoTipoCosto == "LO")
        return this.lstCostos.filter((v) => v.eslocalflag);
      if (codigoTipoCosto == "AD")
        return this.lstCostos.filter((v) => v.esaduanaflag);
      if (codigoTipoCosto == "AL")
        return this.lstCostos.filter((v) => v.esalmacenflag);
      if (codigoTipoCosto == "FL")
        return this.lstCostos.filter((v) => v.esfleteflag);
      if (codigoTipoCosto == "GT")
        return this.lstCostos.filter((v) => v.esgastostercerosflag);

      return this.lstCostos;
    },
    abrirModal(codigoTipoCosto) {
      this.fromDataService.idOpcion = codigoTipoCosto;
      this.dialog = true;
    },
    recargarProveedores: _.debounce(async function (e) {
      if (!e) return;

      let IdProveedor = this.lstCostos.map((v) => v.id_proveedor);
      await this.obtenerProveedorPricing({
        id: IdProveedor.join(","),
        search: e,
      });
    }, 100),
    guardarCosto() {
      if (!this.$refs.frmNuevoCosto.validate()) return; // Valida que los campos requeridos estén llenos

      // Creamos una copia limpia para evitar problemas de referencia en memoria
      const nuevoCosto = { ...this.fromDataService };

      // Inicializamos los flags por defecto para el nuevo registro de costo
      nuevoCosto.esgastostercerosflag = 0;
      nuevoCosto.esfleteflag = 0;
      nuevoCosto.eslocalflag = 0;
      nuevoCosto.esaduanaflag = 0;
      nuevoCosto.esalmacenflag = 0;
      nuevoCosto.status = 1; // Por defecto activo para la tabla
      nuevoCosto.costo = nuevoCosto.costo; // Mapeamos el costo unitario al v-model de la tabla
      nuevoCosto.precio = nuevoCosto.precio; // Mapeamos un precio inicial si lo requieres
      nuevoCosto.minimo = nuevoCosto.minimo; // Mapeamos un precio inicial si lo requieres

      // Asignamos el flag correcto según el código del panel donde se hizo click
      switch (nuevoCosto.idOpcion) {
        case "GT":
          nuevoCosto.esgastostercerosflag = 1;
          break;
        case "FL":
          nuevoCosto.esfleteflag = 1;
          break;
        case "LO":
          nuevoCosto.eslocalflag = 1;
          break;
        case "AD":
          nuevoCosto.esaduanaflag = 1;
          break;
        case "AL":
          nuevoCosto.esalmacenflag = 1;
          break;
      }

      this.lstCostos.push({
        ...nuevoCosto,
        id_costo: null,
        maximo: 0,
        id_modality: this.id_modality,
        id_shipment: this.id_shipment,
        id_incoterms: this.id_incoterms,
      });

      this.fromDataService = {};
      this.$refs.frmNuevoCosto.resetValidation();
      this.dialog = false;
    },
  },
  computed: {
    ...mapState("configuracion", [
      "lstCostos",
      "lstMultiplicador",
      "lstServicios",
    ]),

    // Nueva propiedad computada para filtrar los tipos de costos vacíos
    panelesConDatos() {
      const listaTipos = this.$store.state.pricing.listTipoCostos;
      if (!listaTipos) return [];

      // 1. Primero filtramos para quedarnos solo con los que sí tienen costos
      const panelesFiltrados = listaTipos.filter((tipo) => {
        const costosFiltrados = this.obtenerCostosEnBaseTipoCosto(tipo.codigo);
        return costosFiltrados && costosFiltrados.length > 0;
      });

      // 2. Ordenamos la lista filtrada basándonos en el prefijo de su "name"
      return panelesFiltrados.sort((a, b) => {
        // Asignamos un "peso" o prioridad a cada item según su nombre
        const obtenerPeso = (item) => {
          if (item.name && item.name.startsWith("ORIGEN")) {
            return 1; // Prioridad más alta (va al principio)
          }
          if (item.name && item.name.startsWith("DESTINO")) {
            return 3; // Prioridad más baja (va al final)
          }
          return 2; // Cualquiera que no sea ni Origen ni Destino se queda en medio
        };

        return obtenerPeso(a) - obtenerPeso(b);
      });
    },
    panelesAbiertos() {
      // Genera un array de índices basado en la cantidad de paneles con datos.
      // Ejemplo: si hay 3 paneles con datos, devolverá [0, 1, 2]
      return this.panelesConDatos.map((_, index) => index);
    },
  },
};
</script>
