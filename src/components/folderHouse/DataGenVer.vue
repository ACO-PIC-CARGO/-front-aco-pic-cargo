<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";
import type { CotizacionHouse, ServicioCotizadoHouse } from "@/types/cotizacion";
import type { ServicioHouse } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();
const router = useRouter();
const housesStore = useHousesStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();

const searchHouseCotizacion = ref("");
const house_service_id_begend = ref<number | string>("");
const house_service_name = ref("");
const id_transport = ref<number | null>(null);
const formNewService = useTemplateRef("formNewService");

const esAereo = computed(() => {
  const s =
    (housesStore.house &&
      housesStore.house.shipment) ||
    "";
  return (
    String(s).toLowerCase().includes("aéreo") ||
    String(s).toLowerCase().includes("aereo")
  );
});
const esFCL = computed(() => {
  const s =
    (housesStore.house &&
      housesStore.house.shipment) ||
    "";
  return String(s).toUpperCase() === "FCL";
});
const esLCL = computed(() => {
  const s =
    (housesStore.house &&
      housesStore.house.shipment) ||
    "";
  return String(s).toUpperCase() === "LCL";
});
const dataQuoteAsignada = computed(() => pricingStore.dataQuote as CotizacionHouse);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const quotesFiltered = computed(() => {
  // Filtrar y asegurar que cada item tenga las propiedades correctas
  console.log("listQuotes", pricingStore.listQuotes);
  return (pricingStore.listQuotes || []).filter((item) => {
    return item && typeof item === "object" && item.code && item.id;
  });
});
const quoteCodeDisplay = computed(() => {
  const quoteId =
    rootStore.state.house_cotizacion ||
    housesStore.house.id_cot;

  if (!quoteId) return "";

  return housesStore.house.quote;
});
const pesoVolumetrico = computed(() => {
  if (!esAereo.value) return null;
  const m3 = parseFloat(
    String((housesStore.house &&
      housesStore.house.volumen) ||
      0),
  );
  if (!m3) return null;
  const pv = m3 > 0 ? m3 * 166.66 : 0;
  if (!pv || !isFinite(pv)) return null;
  return parseFloat(pv.toFixed(2));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function asignarDatos() {
  if (rootStore.state.house_cotizacion) {
    let id_shipment = 0;
    rootStore.state.spiner = true;

    await pricingStore.getQuoteDataNoAsignadaHouse({
      id_quote: rootStore.state.house_cotizacion,
    });

    if (
      Object.keys(pricingStore.dataQuote as object).length &&
      dataQuoteAsignada.value.id_modality ==
        rootStore.state.copy_house.id_modality &&
      dataQuoteAsignada.value.id_shipment ==
        rootStore.state.copy_house.id_shipment &&
      dataQuoteAsignada.value.id_port_begin ==
        rootStore.state.copy_house.id_port_begin &&
      dataQuoteAsignada.value.id_port_end ==
        rootStore.state.copy_house.id_port_end
    ) {
      rootStore.state.house_sentido =
        dataQuoteAsignada.value.id_modality;
      rootStore.state.house_id_trasnport =
        dataQuoteAsignada.value.id_shipment;
      rootStore.state.house_id_consigner =
        dataQuoteAsignada.value.id_cliente;
      rootStore.state.house_incoterms =
        dataQuoteAsignada.value.id_incoterms;

      if (typeof rootStore.state.house_id_trasnport === "object") {
        id_shipment = rootStore.state.house_id_trasnport.id_transport;
      } else if (typeof rootStore.state.house_id_trasnport === "number") {
        id_shipment = rootStore.state.itemsShipment.filter(
          (v: { id: number }) => v.id == dataQuoteAsignada.value.id_shipment,
        )[0].id_transport;
      }

      rootStore.state.house_bultos =
        dataQuoteAsignada.value.nro_bultos;
      rootStore.state.house_peso =
        dataQuoteAsignada.value.peso;
      rootStore.state.house_volumen =
        dataQuoteAsignada.value.volumen;
      rootStore.state.house_monto =
        dataQuoteAsignada.value.monto;
      await _activePort(id_shipment);
      rootStore.state.house_origen =
        dataQuoteAsignada.value.id_port_begin;
      rootStore.state.house_destino =
        dataQuoteAsignada.value.id_port_end;

      // Ubicación/Tramo (categoría del servicio: Origen, Flete, Destino, Opcional)
      let lstSortedServices: ServicioCotizadoHouse[] = [];
      const lstServicesOrigen: ServicioCotizadoHouse[] = [];
      const lstServicesFlete: ServicioCotizadoHouse[] = [];
      const lstServicesDestino: ServicioCotizadoHouse[] = [];
      const lstServicesOpcional: ServicioCotizadoHouse[] = [];

      dataQuoteAsignada.value.lstservices!.filter((item) => {
        const categoriaServicio = item.codebegend.toUpperCase();
        switch (categoriaServicio) {
          case "OR":
            lstServicesOrigen.push(item);
            break;
          case "FL":
            lstServicesFlete.push(item);
            break;
          case "DE":
            lstServicesDestino.push(item);
            break;
          case "OP":
            lstServicesOpcional.push(item);
            break;
        }
      });

      lstSortedServices = ([] as ServicioCotizadoHouse[]).concat(
        lstServicesOrigen,
        lstServicesFlete,
        lstServicesDestino,
        lstServicesOpcional,
      );

      const lstServices: ServicioCotizadoHouse[] = [];
      let itemImpuestos = null as ServicioCotizadoHouse | null;
      lstSortedServices.map((item) => {
        const dataService = {
          ...item,
          status: 0,
        };

        if (item.nameservice.toUpperCase() == "IMPUESTOS") {
          itemImpuestos = dataService;
        } else {
          lstServices.push(dataService);
        }
      });

      if (itemImpuestos !== null) {
        lstServices.push(itemImpuestos);
      }

      rootStore.state.itemsHouseServices = lstServices;
    } else {
      Swal.fire({
        icon: "error",
        html: "<b>El quote que está intentando agregar no tiene el mismo Sentido, Tipo de Embarque, Origen, Destino que el expediente máster. Verifique</b>",
        showConfirmButton: true,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#4CAF50",
        allowOutsideClick: false,
      });

      rootStore.state.house_cotizacion = "";
      searchHouseCotizacion.value = "";
    }

    rootStore.state.spiner = false;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _validaData() {
  console.log('sssssssssss')
  if (route.params.id) {
    const data = {
      id: route.params.id,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getHouseListId/",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };
    await axios(config)
      .then(async function (response) {
        sessionStorage.setItem("auth-token", response.data.token);
        console.log('id_vendedor',response.data.data[0].id_vendedor)
        console.log('id_pricing',response.data.data[0].id_pricing)
        rootStore.state.copy_house = response.data.data[0];
        rootStore.state.dataHouse_transporte =
          response.data.data[0].id_transport;
        rootStore.state.house_origen = response.data.data[0].id_port_begin;
        rootStore.state.house_destino = response.data.data[0].id_port_end;
        rootStore.state.house_sentido = response.data.data[0].id_modality;
        rootStore.state.house_id_vendedor = response.data.data[0].id_vendedor;
        rootStore.state.house_id_pricing = response.data.data[0].id_pricing;
        rootStore.state.house_id_trasnport =
          response.data.data[0].id_shipment;
        rootStore.state.house_incoterms =
          response.data.data[0].id_incoterms;
        rootStore.state.house_cotizacion = response.data.data[0].id_cot;
        await rootStore.dispatch("_getPortBegin", {
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_begin,
        });
        await rootStore.dispatch("_getPortEnd", {
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_end,
        });
        rootStore.state.house_origen = response.data.data[0].id_port_begin;
        rootStore.state.house_destino = response.data.data[0].id_port_end;
        rootStore.state.house_expediente = response.data.data[0].code_house;
        rootStore.state.house_master_expediente =
          response.data.data[0].code_master;
        rootStore.state.house_id_agente =
          response.data.data[0].id_proveedor;
        rootStore.state.house_id_consigner =
          response.data.data[0].id_consigner;
        rootStore.state.house_id_notify = response.data.data[0].id_notify;
        rootStore.state.house_id_airlines =
          response.data.data[0].id_aerolinea;
        rootStore.state.house_id_coloader =
          response.data.data[0].id_coloader;
        //vm.$store.state.house_id_agente = response.data.data[0].id_agent;
        rootStore.state.house_id_naviera = response.data.data[0].id_naviera;
        rootStore.state.house_blmaster = response.data.data[0].nro_hbl;
        rootStore.state.house_id_motonave =
          response.data.data[0].id_motonave;
        rootStore.state.house_viaje = response.data.data[0].nro_viaje;
        rootStore.state.house_bultos = response.data.data[0].bultos;
        rootStore.state.house_peso = response.data.data[0].peso;
        rootStore.state.house_volumen = response.data.data[0].volumen;
        rootStore.state.house_id_condicion =
          response.data.data[0].id_conditions;
        rootStore.state.house_id_coins = response.data.data[0].id_moneda;
        rootStore.state.house_monto = response.data.data[0].monto;
        rootStore.state.house_id = response.data.data[0].id;
        rootStore.state.house_id_consigner_real =
          response.data.data[0].id_consigner_real;
        rootStore.state.house_nro_declaracion_aduana =
          response.data.data[0].nro_declaracion_aduana || "";
        rootStore.state.house_canal_aduana =
          response.data.data[0].canal_aduana || "";
        await rootStore.dispatch("_getServicesBegin");
        // await vm._getBitacoraLineal();
        rootStore.state.house_enlace_tracking = response.data.data[0]
          .token_rastreo
          ? "https://aco.agentedecargaonline.com/tracking/" +
            response.data.data[0].token_rastreo
          : "";
      })
      .catch(function (error) {
        console.error(error);
      });
    // vm.$store.state.spiner = false;
  }
}
async function _activePort(idTransport: number) {
  id_transport.value = idTransport;
  await rootStore.dispatch("_getPortBegin", { id_transport: idTransport });
  await rootStore.dispatch("_getPortEnd", { id_transport: idTransport });
  if (rootStore.state.master_id_trasnport.id == 1) {
    rootStore.state.embar_title_nacn = "Aerolinea";
  } else if (rootStore.state.master_id_trasnport.id == 2) {
    rootStore.state.embar_title_nacn = "Naviera";
  } else if (rootStore.state.master_id_trasnport.id == 3) {
    rootStore.state.embar_title_nacn = "Coloader";
  } else {
    rootStore.state.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getDataService() {
  rootStore.dispatch("_getServicesBegin");
  // this._getBitacoraList();
  // this._getBitacoraLineal();
}
async function setNewService() {
  if ((await formNewService.value!.validate()).valid) {
    const dataBegend =
      rootStore.state.itemsBegEndList.find(
        (v: { id: number }) => v.id === house_service_id_begend.value,
      ) || {};
    const dataService = {
      id_begend: house_service_id_begend.value,
      namebegend: dataBegend.name,
      position_begend: dataBegend.position_begend,
      nameservice: house_service_name.value,
      status: 0,
    };

    let value_itemImpuestos = null;
    const index_itemImpuestos = rootStore.state.itemsHouseServices.findIndex(
      (item: ServicioHouse) => item.nameservice!.toUpperCase() == "IMPUESTOS",
    );
    if (index_itemImpuestos !== -1) {
      value_itemImpuestos =
        rootStore.state.itemsHouseServices[index_itemImpuestos];
      rootStore.state.itemsHouseServices.splice(index_itemImpuestos, 1);
    }

    rootStore.state.itemsHouseServices.push(dataService);

    if (value_itemImpuestos !== null) {
      rootStore.state.itemsHouseServices.push(value_itemImpuestos);
    }

    rootStore.state.modalServices_manualMode = false;
  }

  formNewService.value!.reset();
}
function cancelNewService() {
  formNewService.value!.reset();
  rootStore.state.modalServices_manualMode =
    !rootStore.state.modalServices_manualMode;
}
async function recargarPuertoOrigen(textoBuscar: string) {
  await rootStore.dispatch("_getPortBegin", {
    id_transport: id_transport.value,
    id: rootStore.state.master_origen,
    search: textoBuscar,
  });
}
async function recargarPuertoDestino(textoBuscar: string) {
  await rootStore.dispatch("_getPortEnd", {
    id_transport: id_transport.value,
    id: rootStore.state.master_destino,
    search: textoBuscar,
  });
}
function verCotizacion() {
  const quoteId =
    rootStore.state.house_cotizacion ||
    housesStore.house.id_cot;
  if (quoteId) {
    router.push(`/home/folderPricing/verQuote/${quoteId}`);
  }
}

onMounted(async () => {
  rootStore.state.spiner = true;

  // await this._getModality();
  // await this._getShipment();
  // await this._getIncoterms();
  // await this._getnroMaster();
  // await this._getAgents();
  // await this._getConsigners();
  // await this._getNotify();
  // await this._getColoaders();
  // await this._getAirlines();
  // await this._getNavieras();
  // await this._getMotonave();
  // await this._getContainers();
  // await this._getFleteCon();
  // await this._getCoinsList();
  // this.$store.state.house_id_coins = this.$store.state.itemsCoinsList.filter(
  //   (v) => v.symbol === "USD"
  // )[0].id;
  // await this._validaData();
  // await this._getProveedor();
  // await this._getHouseContainers();
  rootStore.state.spiner = false;

  await rootStore.dispatch("_getBegEndList");
  //this._getnroMaster();
  // this._validaData();
  //this.$store.state.drawer = false;
  rootStore.state.spiner = false;

  // await this.getQuoteNoAsignadoHouse();
});
</script>

<template>
  <div>
    <h3>Datos y Servicios a Realizar</h3>
    <v-row density="compact">
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          readonly
          v-model="housesStore.house.code_master"
          label="N° de Expedientes Master"
        />
      </v-col>
      <!-- <v-col cols="12" md="4">
        <v-text-field
          readonly
          v-model="$store.state.houses.house.code_house"
          label="N° de Expedientes House"
        ></v-text-field>
      </v-col> -->
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          label="Cot Nro"
          :model-value="quoteCodeDisplay"
          readonly
          @click="verCotizacion"
          :style="quoteCodeDisplay ? 'cursor: pointer;' : ''"
          :append-inner-icon="quoteCodeDisplay ? 'mdi-eye' : ''"
        />
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          label="Quote aduana"
          :items="aduanaStore.listQuotes2"
          item-title="quote"
          item-value="id"
          v-model="rootStore.state.house_cotizacionaduana"
          clearable
        />
      </v-col>
    </v-row>

    <v-row density="compact">
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          label="Sentido"
          v-model="housesStore.house.modality"
          readonly
        />
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          readonly
          v-model="housesStore.house.shipment"
          label="Tipo de Embarque"
          return-object
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          label="Incoterms"
          readonly
          v-model="housesStore.house.incoterms"
        />
      </v-col>
    </v-row>

    <v-row density="compact">
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          label="Origen"
          readonly
          v-model="housesStore.house.port_begin"
          @update:search="recargarPuertoOrigen"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-text-field
          label="Destino"
          readonly
          v-model="housesStore.house.port_end"
          @update:search="recargarPuertoDestino"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        v-if="esAereo"
      >
        <v-text-field
          label="Aerolínea"
          :model-value="housesStore.house.aerolinea"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        v-else-if="esFCL"
      >
        <v-text-field
          label="Naviera"
          :model-value="housesStore.house.naviera"
          readonly
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
        v-else-if="esLCL"
      >
        <v-text-field
          label="Coloader"
          :model-value="housesStore.house.coloader"
          readonly
        />
      </v-col>
    </v-row>

    <v-row density="compact">
      <template v-if="esLCL">
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            label="Bultos"
            :model-value="housesStore.house.bultos"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            label="Peso"
            suffix="kg"
            :model-value="housesStore.house.peso"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            label="Volumen"
            suffix="m3"
            :model-value="housesStore.house.volumen"
            readonly
          />
        </v-col>
      </template>
      <template v-else-if="esAereo">
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            label="Bultos"
            :model-value="housesStore.house.bultos"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            label="Peso"
            suffix="kg"
            :model-value="housesStore.house.peso"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            label="Peso Cargable"
            suffix="kg"
            :model-value="housesStore.house.peso_cargable"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="4"
        >
          <v-text-field
            label="Peso Volumétrico"
            suffix="kg"
            :model-value="pesoVolumetrico"
            readonly
          />
        </v-col>
      </template>
      <template v-else-if="esFCL">
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            label="Tipo de contenedor"
            :model-value="
              (rootStore.state.house_id_containers &&
                rootStore.state.house_id_containers.name) ||
                ''
            "
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            label="Cantidad de contenedores"
            :model-value="rootStore.state.house_cantidad"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            label="Peso"
            suffix="kg"
            :model-value="housesStore.house.peso"
            readonly
          />
        </v-col>
        <v-col
          cols="12"
          md="3"
        >
          <v-text-field
            label="Volumen"
            suffix="m3"
            :model-value="housesStore.house.volumen"
            readonly
          />
        </v-col>
      </template>
    </v-row>

    <v-dialog
      v-model="rootStore.state.modalServices_manualMode"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-headline-small d-flex align-center flex-wrap">
          Agregar Servicio Manual <v-spacer />
          <v-btn
            variant="text"
            icon
            color="red"
            @click="
              rootStore.state.modalServices_manualMode =
                !rootStore.state.modalServices_manualMode
            "
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="formNewService">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    :items="rootStore.state.itemsBegEndList"
                    item-title="name"
                    item-value="id"
                    label="Ubicación/Tramo"
                    v-model="house_service_id_begend"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="house_service_name"
                    label="Nombre Servicio"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  />
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="red"
            rounded
            @click="cancelNewService"
          >
            CANCELAR
          </v-btn>
          <v-btn
            color="success"
            class="ml-2"
            rounded
            @click="setNewService"
          >
            ACEPTAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
