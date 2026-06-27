<template>
  <v-container fluid>
    <v-form ref="frmDatos">
      <v-row>
        <v-col cols="12" md="2">
          <v-autocomplete
            label="Sentido"
            outlined
            dense
            :rules="[(v) => !!v || 'Dato requerido']"
            class="my-0"
            :items="$store.state.pricing.listModality"
            item-text="name"
            item-key="id"
            item-value="id"
            v-model="$store.state.profitPricing.id_modality"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" md="2">
          <v-autocomplete
            label="Tipo de Embarque"
            outlined
            dense
            :rules="[(v) => !!v || 'Dato requerido']"
            class="my-0"
            :items="$store.state.pricing.listShipment"
            item-text="embarque"
            item-key="id"
            item-value="id"
            v-model="$store.state.profitPricing.id_shipment"
          ></v-autocomplete>
        </v-col>

        <v-col cols="12" icons-and-text class="px-10" v-if="mostrarIncoterms">
          <v-data-table :headers="headersIncoterms" :items="incoterms">
            <template v-slot:[`item.action`]="{ item }">
              <v-btn
                color="info"
                icon
                @click="abrirModalActualizacionConceptos(item.id)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-col>
        <v-col cols="12" icons-and-text>
          <template> </template>
        </v-col>
      </v-row>
    </v-form>
    <v-dialog
      v-model="dialogNuevoProfit"
      scrollable
      persistent
      :overlay="false"
      fullscreen
    >
      <v-card>
        <v-card-title>
          <center>
            {{
              $store.state.profitPricing.id_modality
                ? $store.state.pricing.listModality.find(
                    (v) => v.id == $store.state.profitPricing.id_modality,
                  ).name
                : ""
            }}
            |
            {{
              $store.state.profitPricing.id_shipment
                ? $store.state.pricing.listShipment.find(
                    (v) => v.id == $store.state.profitPricing.id_shipment,
                  ).embarque
                : ""
            }}
            |
            {{
              $store.state.profitPricing.id_incoterms
                ? incoterms.find(
                    (v) => v.id == $store.state.profitPricing.id_incoterms,
                  ).name
                : ""
            }}
          </center>
        </v-card-title>
        <v-card-text>
          <v-row class="ma-0 py-0">
            <v-col cols="12">
              <v-tabs centered v-model="tab">
                <v-tab>
                  Individual
                  <v-icon class="mx-1">mdi-account</v-icon>
                </v-tab>
                <v-tab>
                  Grupal
                  <v-icon class="mx-1">mdi-account-group</v-icon>
                </v-tab>
              </v-tabs>
              <v-tabs-items v-model="tab">
                <v-tab-item>
                  <v-expansion-panels multiple class="px-5 py-2">
                    <v-expansion-panel
                      v-for="(item, index) in panelesConDatos"
                      :key="index"
                      dense
                    >
                      <v-expansion-panel-header>
                        {{ item.name }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <v-data-table
                          :headers="headers"
                          :items="obtenerCostosEnBaseTipoCosto(item.codigo)"
                          item-key="id"
                          dense
                        >
                          <template v-slot:[`item.proveedor`]="{ item }">
                            <v-select
                              :items="$store.state.proveedor.lstProveedores"
                              v-model="item.id_proveedor"
                              outlined
                              dense
                              hide-details
                              item-text="namelong"
                              item-value="id"
                              disabled
                            ></v-select>
                          </template>
                          <template v-slot:[`item.multiplicador`]="{ item }">
                            <v-select
                              :items="
                                $store.state.configEmpresa.lstMultiplicador
                              "
                              v-model="item.id_multiplicador"
                              outlined
                              dense
                              hide-details
                              disabled
                            ></v-select>
                            <!-- {{ listTipoCostos }} -->
                          </template>
                          <template
                            v-slot:[`item.profitprimeraimportacion`]="{ item }"
                          >
                            <v-text-field
                              dense
                              outlined
                              type="number"
                              hide-details
                              v-model="item.profitprimeraimportacion"
                            ></v-text-field>
                          </template>
                          <template
                            v-slot:[`item.profitsegundaimportacion`]="{ item }"
                          >
                            <v-text-field
                              dense
                              outlined
                              v-model="item.profitsegundaimportacion"
                              type="number"
                              hide-details
                            ></v-text-field>
                          </template>
                          <template v-slot:[`item.estado`]="{ item }">
                            <v-switch
                              label=""
                              dense
                              v-model="item.estado"
                            ></v-switch>
                          </template>
                        </v-data-table>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-tab-item>
                <v-tab-item>
                  <v-expansion-panels multiple class="px-5 py-2">
                    <v-expansion-panel
                      v-for="(item, index) in panelesConDatos"
                      :key="index"
                      dense
                    >
                      <v-expansion-panel-header>
                        {{ item.name }}
                      </v-expansion-panel-header>
                      <v-expansion-panel-content>
                        <v-data-table
                          :headers="headers"
                          :items="obtenerCostosEnBaseTipoCosto(item.codigo)"
                          item-key="id"
                          dense
                        >
                          <template v-slot:[`item.proveedor`]="{ item }">
                            <v-select
                              :items="$store.state.proveedor.lstProveedores"
                              v-model="item.id_proveedor"
                              outlined
                              dense
                              hide-details
                              item-text="namelong"
                              item-value="id"
                              disabled
                            ></v-select>
                          </template>
                          <template v-slot:[`item.multiplicador`]="{ item }">
                            <v-select
                              :items="
                                $store.state.configEmpresa.lstMultiplicador
                              "
                              v-model="item.id_multiplicador"
                              outlined
                              dense
                              hide-details
                              disabled
                            ></v-select>
                            <!-- {{ listTipoCostos }} -->
                          </template>
                          <template
                            v-slot:[`item.profitprimeraimportacion`]="{ item }"
                          >
                            <v-text-field
                              dense
                              outlined
                              type="number"
                              hide-details
                              v-model="item.profitprimeraimportacion"
                            ></v-text-field>
                          </template>
                          <template
                            v-slot:[`item.profitsegundaimportacion`]="{ item }"
                          >
                            <v-text-field
                              dense
                              outlined
                              v-model="item.profitsegundaimportacion"
                              type="number"
                              hide-details
                            ></v-text-field>
                          </template>
                          <template v-slot:[`item.estado`]="{ item }">
                            <v-switch
                              label=""
                              dense
                              v-model="item.estado"
                            ></v-switch>
                          </template>
                        </v-data-table>
                      </v-expansion-panel-content>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-tab-item>
              </v-tabs-items>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" :loading="loadingGuardar" @click="guardarDatos"
            >Guardar</v-btn
          >
          <v-btn color="error" @click="dialogNuevoProfit = false"
            >Cancelar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions, mapState } from "vuex";

export default {
  data() {
    return {
      tab: 0,
      loadingGuardar:false,
      headersIncoterms: [
        { value: "text", text: "Icoterms" },
        { value: "action", text: "" },
      ],
      headers: [
        { value: "proveedor", text: "Proveedor", width: "20%" },
        { value: "multiplicador", text: "Multiplicador", width: "20%" },
        { value: "concepto", text: "Concepto", width: "20%" },
        {
          value: "profitprimeraimportacion",
          text: "Ganancia Primera Importación",
          sortable: false,
          width: "10%",
        },
        {
          value: "profitsegundaimportacion",
          text: "Ganancia Segunda Importación",
          sortable: false,
          width: "10%",
        },
        {
          value: "estado",
          text: "Activo/ Inactivo",
          sortable: false,
          width: "10%",
        },
      ],
      items: [],
      bloquearBotonAnadirConcepto: true,
      loadingObtenerDatos: false,
      formData: {
        id: null,
        profitprimeraimportacion: null,
        profitsegundaimportacion: null,
      },
      dialogNuevoProfit: false,
      mostrarIncoterms: false,
    };
  },
  computed: {
    incoterms() {
      let Icoterms = [];
      [...this.$store.state.pricing.listIncoterms].forEach((element) => {
        element.text = element.name + " - " + element.description;
        Icoterms.push(element);
      });

      return Icoterms;
    },
    mostrarBotonActualizar() {
      if (this.tab == 0) {
        return this.$store.state.profitPricing.lstProfigIndividual.length > 0;
      }
      if (this.tab == 1) {
        return this.$store.state.profitPricing.lstProfigGrupal.length > 0;
      }
      return false;
    },
    panelesConDatos() {
      const listaTipos = this.$store.state.configEmpresa.listTipoCostos;
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
  },
  methods: {
    ...mapActions("profitPricing", [
      "getProfitPricing",
      "getProfitPricingCostos",
      "setProfitPricingCostos",
    ]),
    ...mapActions([
      "getTipoCostosConfig",
      "getMultiplicadorConfig",
      "obtenerProveedorPricing",
    ]),
    obtenerCostosEnBaseTipoCosto(codigoTipoCosto) {
      let lstCostos = [];
      if (this.tab == 0) {
        lstCostos = this.$store.state.profitPricing.lstProfigIndividual;
      }
      if (this.tab == 1) {
        lstCostos = this.$store.state.profitPricing.lstProfigGrupal;
      }
      //   if (this.id_modality == 1) {
      if (codigoTipoCosto == "LO")
        return lstCostos.filter((v) => v.eslocalflag);
      if (codigoTipoCosto == "AD")
        return lstCostos.filter((v) => v.esaduanaflag);
      if (codigoTipoCosto == "AL")
        return lstCostos.filter((v) => v.esalmacenflag);
      if (codigoTipoCosto == "FL")
        return lstCostos.filter((v) => v.esfleteflag);
      if (codigoTipoCosto == "GT")
        return lstCostos.filter((v) => v.esgastostercerosflag);

      return lstCostos;
    },
    async abrirModalActualizacionConceptos(id_incoterms) {
      this.$store.state.profitPricing.id_incoterms = id_incoterms;
      this.$store.state.spiner = true;
      await this.cargarDatos().catch((e) => {
        console.error(e);
      });
      this.$store.state.spiner = false;
      this.dialogNuevoProfit = true;
    },
    async cargarDatos() {
      if (this.$refs.frmDatos.validate()) {
        this.loadingObtenerDatos = true;
        await Promise.all([
          this.getProfitPricing(),
          this.getTipoCostosConfig({
            id_modality: this.$store.state.profitPricing.id_modality,
            id_shipment: this.$store.state.profitPricing.id_shipment,
          }),
          this.getMultiplicadorConfig({
            id_shipment: this.$store.state.profitPricing.id_shipment,
          }),
        ]);
        let id = [
          ...this.$store.state.profitPricing.lstProfigIndividual.map((v) => {
            return v.id_proveedor;
          }),
        ];
        console.log(id);
        await this.obtenerProveedorPricing({ id: id.join(",") });
        this.$forceUpdate();
        this.loadingObtenerDatos = false;
        this.bloquearBotonAnadirConcepto = false;
      }
    },
    anadirConcepto() {
      if (this.$refs.frmAsignarCosto.validate()) {
        if (this.tab == 0) {
          this.$store.state.profitPricing.lstProfigIndividual.unshift({
            ...this.formData,
            concepto:
              this.$store.state.profitPricing.lstCostosAsignarProfit.find(
                (v) => this.formData.id,
              ).concepto,
            estado: true,
          });
        }
        if (this.tab == 1) {
          this.$store.state.profitPricing.lstProfigGrupal.unshift({
            ...this.formData,
            concepto:
              this.$store.state.profitPricing.lstCostosAsignarProfit.find(
                (v) => this.formData.id,
              ).concepto,
            estado: true,
          });
        }
      }
    },
    async guardarDatos() {
      this.loadingGuardar = true;
      await this.setProfitPricingCostos().catch((e) => {
        console.error(e);
      });
      this.dialogNuevoProfit = false;
      this.loadingGuardar = false;
    },
  },
  watch: {
    "$store.state.profitPricing.id_modality"() {
      this.mostrarIncoterms = false;
      if (
        this.$store.state.profitPricing.id_shipment &&
        this.$store.state.profitPricing.id_modality
      ) {
        this.$store.state.spiner = true;
        setTimeout(() => {}, 500);
      }
    },
    "$store.state.profitPricing.id_shipment"() {
      this.mostrarIncoterms = false;
      if (
        this.$store.state.profitPricing.id_shipment &&
        this.$store.state.profitPricing.id_modality
      ) {
        this.$store.state.spiner = true;
        setTimeout(() => {
          this.$store.state.spiner = false;
          this.mostrarIncoterms = true;
        }, 500);
      }
    },
  },
};
</script>

<style></style>
