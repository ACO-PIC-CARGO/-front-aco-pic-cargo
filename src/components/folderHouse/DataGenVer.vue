<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";
import type { CotizacionHouse, ServicioCotizadoHouse } from "@/types/cotizacion";
import type { ServicioHouse } from "@/types/operaciones";
import { sessionBranchId } from "@/utils/sesion";
import type { BegEndHouseRaiz, TipoEmbarqueRaiz } from "@/types/app";

const appStore = useAppStore();
const mastersStore = useMastersStore();
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
    housesStore.house_cotizacion ||
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
  if (housesStore.house_cotizacion) {
    let id_shipment = 0;
    appStore.spiner = true;

    await pricingStore.getQuoteDataNoAsignadaHouse({
      id_quote: housesStore.house_cotizacion,
    });

    if (
      Object.keys(pricingStore.dataQuote as object).length &&
      dataQuoteAsignada.value.id_modality ==
        housesStore.copy_house.id_modality &&
      dataQuoteAsignada.value.id_shipment ==
        housesStore.copy_house.id_shipment &&
      dataQuoteAsignada.value.id_port_begin ==
        housesStore.copy_house.id_port_begin &&
      dataQuoteAsignada.value.id_port_end ==
        housesStore.copy_house.id_port_end
    ) {
      housesStore.house_sentido =
        dataQuoteAsignada.value.id_modality;
      housesStore.house_id_trasnport =
        dataQuoteAsignada.value.id_shipment;
      appStore.house_id_consigner =
        dataQuoteAsignada.value.id_cliente;
      housesStore.house_incoterms =
        dataQuoteAsignada.value.id_incoterms;

      if (typeof housesStore.house_id_trasnport === "object") {
        id_shipment = (housesStore.house_id_trasnport as TipoEmbarqueRaiz).id_transport;
      } else if (typeof housesStore.house_id_trasnport === "number") {
        id_shipment = appStore.itemsShipment.filter(
          (v: { id: number }) => v.id == dataQuoteAsignada.value.id_shipment,
        )[0]!.id_transport;
      }

      housesStore.house_bultos =
        dataQuoteAsignada.value.nro_bultos;
      housesStore.house_peso =
        dataQuoteAsignada.value.peso;
      housesStore.house_volumen =
        dataQuoteAsignada.value.volumen;
      housesStore.house_monto =
        dataQuoteAsignada.value.monto;
      await _activePort(id_shipment);
      housesStore.house_origen =
        dataQuoteAsignada.value.id_port_begin;
      housesStore.house_destino =
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

      appStore.itemsHouseServices = lstServices;
    } else {
      Swal.fire({
        icon: "error",
        html: "<b>El quote que está intentando agregar no tiene el mismo Sentido, Tipo de Embarque, Origen, Destino que el expediente máster. Verifique</b>",
        showConfirmButton: true,
        confirmButtonText: "Aceptar",
        confirmButtonColor: "#4CAF50",
        allowOutsideClick: false,
      });

      housesStore.house_cotizacion = "";
      searchHouseCotizacion.value = "";
    }

    appStore.spiner = false;
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
        housesStore.copy_house = response.data.data[0];
        housesStore.dataHouse_transporte =
          response.data.data[0].id_transport;
        housesStore.house_origen = response.data.data[0].id_port_begin;
        housesStore.house_destino = response.data.data[0].id_port_end;
        housesStore.house_sentido = response.data.data[0].id_modality;
        housesStore.house_id_vendedor = response.data.data[0].id_vendedor;
        housesStore.house_id_pricing = response.data.data[0].id_pricing;
        housesStore.house_id_trasnport =
          response.data.data[0].id_shipment;
        housesStore.house_incoterms =
          response.data.data[0].id_incoterms;
        housesStore.house_cotizacion = response.data.data[0].id_cot;
        await appStore._getPortBegin({
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_begin,
        });
        await appStore._getPortEnd({
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_end,
        });
        housesStore.house_origen = response.data.data[0].id_port_begin;
        housesStore.house_destino = response.data.data[0].id_port_end;
        appStore.house_expediente = response.data.data[0].code_house;
        housesStore.house_master_expediente =
          response.data.data[0].code_master;
        housesStore.house_id_agente =
          response.data.data[0].id_proveedor;
        appStore.house_id_consigner =
          response.data.data[0].id_consigner;
        housesStore.house_id_notify = response.data.data[0].id_notify;
        housesStore.house_id_airlines =
          response.data.data[0].id_aerolinea;
        housesStore.house_id_coloader =
          response.data.data[0].id_coloader;
        //vm.$store.state.house_id_agente = response.data.data[0].id_agent;
        housesStore.house_id_naviera = response.data.data[0].id_naviera;
        housesStore.house_blmaster = response.data.data[0].nro_hbl;
        housesStore.house_id_motonave =
          response.data.data[0].id_motonave;
        housesStore.house_viaje = response.data.data[0].nro_viaje;
        housesStore.house_bultos = response.data.data[0].bultos;
        housesStore.house_peso = response.data.data[0].peso;
        housesStore.house_volumen = response.data.data[0].volumen;
        housesStore.house_id_condicion =
          response.data.data[0].id_conditions;
        housesStore.house_id_coins = response.data.data[0].id_moneda;
        housesStore.house_monto = response.data.data[0].monto;
        housesStore.house_id = response.data.data[0].id;
        housesStore.house_id_consigner_real =
          response.data.data[0].id_consigner_real;
        housesStore.house_nro_declaracion_aduana =
          response.data.data[0].nro_declaracion_aduana || "";
        housesStore.house_canal_aduana =
          response.data.data[0].canal_aduana || "";
        await mastersStore._getServicesBegin();
        // await vm._getBitacoraLineal();
        housesStore.house_enlace_tracking = response.data.data[0]
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
  await appStore._getPortBegin({ id_transport: idTransport });
  await appStore._getPortEnd({ id_transport: idTransport });
  if (appStore.master_id_trasnport.id == 1) {
    appStore.embar_title_nacn = "Aerolinea";
  } else if (appStore.master_id_trasnport.id == 2) {
    appStore.embar_title_nacn = "Naviera";
  } else if (appStore.master_id_trasnport.id == 3) {
    appStore.embar_title_nacn = "Coloader";
  } else {
    appStore.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getDataService() {
  mastersStore._getServicesBegin();
  // this._getBitacoraList();
  // this._getBitacoraLineal();
}
async function setNewService() {
  if ((await formNewService.value!.validate()).valid) {
    const dataBegend =
      appStore.itemsBegEndList.find(
        (v: { id: number }) => v.id === house_service_id_begend.value,
      ) || ({} as BegEndHouseRaiz);
    const dataService = {
      id_begend: house_service_id_begend.value as number,
      namebegend: dataBegend.name as string,
      position_begend: dataBegend.position_begend,
      nameservice: house_service_name.value,
      status: 0,
    };

    let value_itemImpuestos = null;
    const index_itemImpuestos = appStore.itemsHouseServices.findIndex(
      (item: ServicioHouse) => item.nameservice!.toUpperCase() == "IMPUESTOS",
    );
    if (index_itemImpuestos !== -1) {
      value_itemImpuestos =
        appStore.itemsHouseServices[index_itemImpuestos]!;
      appStore.itemsHouseServices.splice(index_itemImpuestos, 1);
    }

    appStore.itemsHouseServices.push(dataService);

    if (value_itemImpuestos !== null) {
      appStore.itemsHouseServices.push(value_itemImpuestos);
    }

    housesStore.modalServices_manualMode = false;
  }

  formNewService.value!.reset();
}
function cancelNewService() {
  formNewService.value!.reset();
  housesStore.modalServices_manualMode =
    !housesStore.modalServices_manualMode;
}
async function recargarPuertoOrigen(textoBuscar: string) {
  await appStore._getPortBegin({
    id_transport: id_transport.value as number,
    id: appStore.master_origen,
    search: textoBuscar,
  });
}
async function recargarPuertoDestino(textoBuscar: string) {
  await appStore._getPortEnd({
    id_transport: id_transport.value as number,
    id: appStore.master_destino,
    search: textoBuscar,
  });
}
function verCotizacion() {
  const quoteId =
    housesStore.house_cotizacion ||
    housesStore.house.id_cot;
  if (quoteId) {
    router.push(`/home/folderPricing/verQuote/${quoteId}`);
  }
}

onMounted(async () => {
  appStore.spiner = true;

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
  appStore.spiner = false;

  await appStore._getBegEndList();
  //this._getnroMaster();
  // this._validaData();
  //this.$store.state.drawer = false;
  appStore.spiner = false;

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
          v-model="housesStore.house_cotizacionaduana"
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
              (housesStore.house_id_containers &&
                housesStore.house_id_containers.name) ||
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
            :model-value="housesStore.house_cantidad"
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
      v-model="housesStore.modalServices_manualMode"
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
              housesStore.modalServices_manualMode =
                !housesStore.modalServices_manualMode
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
                    :items="appStore.itemsBegEndList"
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
