<script setup lang="ts">
import { serverSearchText } from "@/utils/serverSearch";
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import MasterField from "./MasterField.vue";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import axios from "@/api/http";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import type { CotizacionListado } from "@/types/cotizacion";
import type { CotizacionParaMaster } from "@/types/operacionesMaster";
import { sessionSucursal, sessionUser } from "@/utils/sesion";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";

const appStore = useAppStore();
const mastersStore = useMastersStore();
const route = useRoute();
const pricingStore = usePricingStore();
const masterusuariosStore = useMasterusuariosStore();
const itemsModality = computed(() => appStore.itemsModality);
const itemsShipment = computed(() => appStore.itemsShipment);
const itemsPortBegin = computed(() => appStore.itemsPortBegin);
const itemsPortEnd = computed(() => appStore.itemsPortEnd);
const itemsIncoterms = computed(() => appStore.itemsIncoterms);
const itemsOperadorList = computed(() => appStore.itemsOperadorList);
const itemsContainers = computed(() => appStore.itemsContainers);

const mostrarflag = ref(true);
const mostrarGrupal = ref(false);
const id_transport = ref<number | null>(null);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const operadorNombre = computed(() => {
  if (!mastersStore.master_id_operador || !itemsOperadorList.value) {
    return "";
  }
  const operador = itemsOperadorList.value.find(
    (op: { id: number; namelong: string }) => op.id == mastersStore.master_id_operador,
  );
  return operador ? operador.namelong : "";
});

async function _activePort(idTransport: number) {
  id_transport.value = idTransport;

  appStore.spiner = true;
  await Promise.all([
    appStore._getPortBegin({ id_transport: idTransport }),
    appStore._getPortEnd({ id_transport: idTransport }),
  ]);

  if (appStore.master_id_trasnport.id == 1) {
    appStore.embar_title_nacn = "Aerolinea";
  } else if (appStore.master_id_trasnport.id == 2) {
    appStore.embar_title_nacn = "Naviera";
  } else if (appStore.master_id_trasnport.id == 3) {
    appStore.embar_title_nacn = "Coloader";
  } else {
    appStore.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
  appStore.spiner = false;
}
function _getDataService() {
  mastersStore._getServicesBegin();
  // this._getBitacoraList();
  // this._getServicesList();
}
function _getValidad() {
  mastersStore.master_id_operador = sessionUser().id;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getDate() {
  if (mastersStore.master_sentido == 1) {
    mastersStore.master_fecha_disponibilidad =
      mastersStore.master_fecha_eta;
  } else if (mastersStore.master_sentido == 2) {
    mastersStore.master_fecha_disponibilidad =
      mastersStore.master_fecha_etd;
  }
}
function _validaDatass() {
  if (route.params.id) {
    mastersStore.master_Id_get = route.params.id;

    const config = {
      method: "post",
      url:
        import.meta.env.VITE_URL_MAIN +
        "getMasterId/" +
        mastersStore.master_Id_get,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(async function (response) {
        // console.log(response)

        if (!response.data.estadoflag) {
          Swal.fire({ icon: "info", text: "No encontramos ese expediente en tu empresa. Vuelve a la lista y ábrelo desde allí." });
          return;
        }
        mastersStore.master_insertId = mastersStore.master_Id_get;
        mastersStore.nro_master = response.data.data[0].nro_master;
        mastersStore.master_cantidad_house =
          response.data.data[0].cantidad_house;
        mastersStore.master_nro_expediente =
          response.data.data[0].code_master;
        mastersStore.master_expediente =
          response.data.data[0].code_master;
        mastersStore.master_sentido = response.data.data[0].id_modality;
        appStore.master_id_trasnport =
          response.data.data[0].id_shipment;
        mastersStore.master_cotizanion = response.data.data[0].id_cot;
        mastersStore.master_incoterms =
          response.data.data[0].id_incoterms;
        id_transport.value = response.data.data[0].id_transport;
        await appStore._getPortBegin({
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_begin,
        });
        await appStore._getPortEnd({
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_end,
        });

        appStore.master_origen = response.data.data[0].id_port_begin;
        appStore.master_destino = response.data.data[0].id_port_end;
        mastersStore.master_id_operador =
          response.data.data[0].id_operador;
        mastersStore.master_fecha_eta = response.data.data[0].fecha_eta;
        mastersStore.master_fecha_etd = response.data.data[0].fecha_etd;
        mastersStore.master_fecha_disponibilidad =
          response.data.data[0].fecha_disponibilidad;
        mastersStore.master_ganancia_pricing =
          response.data.data[0].ganancia_pricing;
        mastersStore.master_ganancia_operaciones =
          response.data.data[0].ganancia_operaciones;
        appStore.master_id_agente = response.data.data[0].id_agent;
        mastersStore.master_id_consigner =
          response.data.data[0].id_consigner;
        mastersStore.master_id_notify = response.data.data[0].id_notify;
        mastersStore.master_id_airlines =
          response.data.data[0].id_aerolinea;
        mastersStore.statusData = true;
        mastersStore.salidaflag = response.data.data[0].salidaflag;
        mastersStore.llegadaflag = response.data.data[0].llegadaflag;
        mastersStore.disponibilidadflag =
          response.data.data[0].disponibilidadflag;
        mastersStore.master_id_coloader =
          response.data.data[0].id_coloader;
        mastersStore.master_id_naviera =
          response.data.data[0].id_naviera;
        mastersStore.master_blmaster = response.data.data[0].nro_mbl;
        mastersStore.master_id_motonave =
          response.data.data[0].id_motonave;
        mastersStore.master_viaje = response.data.data[0].nro_viaje;
        // Nuevos campos de embarque
        mastersStore.master_vuelo = response.data.data[0].vuelo;
        appStore.master_nro_containers =
          response.data.data[0].nro_containers;
        appStore.master_nro_precinto =
          response.data.data[0].nro_precinto;
        mastersStore.master_bultos = response.data.data[0].bultos;
        mastersStore.master_peso = response.data.data[0].peso;
        mastersStore.master_volumen = response.data.data[0].volumen;
        mastersStore.master_id_condicion =
          response.data.data[0].id_conditions;
        mastersStore.master_id_coins = response.data.data[0].id_moneda;
        mastersStore.master_monto = response.data.data[0].monto;
        mastersStore.grupalflag = response.data.data[0].grupalflag;
        appStore.nro_cuotas = response.data.data[0].nro_cuotas;
        mastersStore.comentario = response.data.data[0].comentario;
        mastersStore.fecha_libre_almacenaje =
          response.data.data[0].fecha_libre_almacenaje;
        mastersStore.fecha_libre_sobreestadia =
          response.data.data[0].fecha_libre_sobreestadia;
        mastersStore.almacen_recepcion =
          response.data.data[0].almacen_recepcion;
        mastersStore.dias_sobreestadia =
          response.data.data[0].dias_sobreestadia;
        mastersStore.id_canal =
          response.data.data[0].id_masterdetallecanal;
        mastersStore.nro_manifiesto =
          response.data.data[0].nro_manifiesto;
        mastersStore.url_folderonedrive =
          response.data.data[0].url_folderonedrive;

        const cuotas = response.data.data[0].cuotas || [];
        cuotas.forEach((element: { porcentaje: number; fecha: string }) => {
          appStore.cuota.push(element.porcentaje);
          appStore.fechacuota.push(element.fecha);
        });
        mastersStore.namecampaign = response.data.data[0].namecampaign;
        appStore.master_itemsContainers =
          response.data.data[0].lstmastercontainers.map((item: { id_container: number }) => {
            return {
              ...item,
              name: itemsContainers.value.filter(
                (v: { id: number }) => v.id == item.id_container,
              ).length
                ? itemsContainers.value.find((v: { id: number }) => v.id == item.id_container)!
                    .name
                : "",
            };
          });
        mostrarflag.value = false;
        mostrarflag.value = true;

        await appStore._getHouseList();
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
function limpiar() {
  mastersStore.master_nro_expediente = "";
  mastersStore.master_expediente = "";
  mastersStore.master_sentido = "";
  appStore.master_id_trasnport = "" as never;
  mastersStore.master_incoterms = "";
  appStore.master_origen = "";
  appStore.master_destino = "";
  mastersStore.master_id_operador = "";
  mastersStore.master_ganancia_pricing = "";
  mastersStore.master_ganancia_operaciones = "";
  appStore.master_id_agente = "";
  mastersStore.master_id_consigner = "";
  mastersStore.master_id_notify = "";
  mastersStore.master_id_airlines = "";
  mastersStore.statusData = "";
  mastersStore.master_id_coloader = "";
  mastersStore.master_id_naviera = "";
  mastersStore.master_blmaster = "";
  mastersStore.master_id_motonave = "";
  mastersStore.master_viaje = "";
  mastersStore.master_bultos = "";
  mastersStore.master_volumen = "";
  mastersStore.master_id_condicion = "";
  mastersStore.master_id_coins = "";
  mastersStore.master_monto = "";
  mastersStore.grupalflag = false;
  appStore.nro_cuotas = 3;
  mastersStore.comentario = [];
  appStore.cuota = [];
  mastersStore.master_fecha_eta = "";
  mastersStore.master_fecha_etd = "";
  mastersStore.master_fecha_disponibilidad = "";
  mastersStore.fecha_libre_almacenaje = "";
  mastersStore.almacen_recepcion = "";
  mastersStore.dias_sobreestadia = "";
  mastersStore.id_canal = "";
  mastersStore.nro_manifiesto = "";
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function obternerDatosCotizacion() {
  if (!!mastersStore.master_cotizanion && !route.params.id) {
    const cot = pricingStore.listQuotes.filter(
      (v) => v.id == mastersStore.master_cotizanion,
    )[0] as CotizacionListado & CotizacionParaMaster;
    mastersStore.master_sentido = cot.id_modality;
    appStore.master_id_trasnport = cot.id_shipment as never;
    const id_transport = itemsShipment.value.filter(
      (v: { id: number }) => v.id == cot.id_shipment,
    )[0]!.id_transport;
    await _activePort(id_transport);
    mastersStore.master_incoterms = cot.id_incoterms;
    appStore.master_origen = cot.id_port_begin;
    appStore.master_destino = cot.id_port_end;
    mastersStore.master_fecha_disponibilidad = cot.fecha_fin as string;
    mastersStore.master_id_operador = cot.id_vendedor;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validarCampaniaGrupales() {
  let val = true;
  if (route.params.id) {
    const cantidadHouse = appStore.itemsHouseList;
    if (cantidadHouse.length > 1) {
      val = false;
    }
  }

  return val;
}
function isAereo() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "Aéreo") {
    val = true;
  }
  return val;
}
function isLCL() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "LCL") {
    val = true;
  }
  return val;
}
function isFCL() {
  let val = false;
  const id = appStore.master_id_trasnport.id
    ? appStore.master_id_trasnport.id
    : appStore.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0]!.code
      : "";

  if (code == "FCL") {
    val = true;
  }
  return val;
}
function isImportacion() {
  let val = false;
  const id = mastersStore.master_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number }) => v.id == id)[0]!.name
      : "";

  if (name == "Importación") {
    val = true;
  }

  return val;
}
function isExportacion() {
  let val = false;
  const id = mastersStore.master_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number }) => v.id == id)[0]!.name
      : "";

  if (name == "Exportación") {
    val = true;
  }

  return val;
}
function handleSentido() {
  if (isImportacion()) {
    const nombreEmpresa = "PIC CARGO S.A.C";
    const empresa = appStore.clientes.filter(
      (item: { namelong: string }) => item.namelong.toUpperCase() == nombreEmpresa,
    ).length
      ? appStore.clientes.find(
          (item: { namelong: string }) => item.namelong.toUpperCase() == nombreEmpresa,
        )!.id
      : "";

    mastersStore.master_id_consigner = empresa;
    mastersStore.master_id_notify = empresa;
  } else if (isExportacion()) {
    mastersStore.master_id_consigner = "";
    mastersStore.master_id_notify = "";
  }
}
const recargarPuertoOrigen = useDebouncedSearch(async (textoBuscar: string) => {
  await appStore._getPortBegin({
    id_transport: id_transport.value as number,
    id: appStore.master_origen,
    search: serverSearchText(textoBuscar, appStore.itemsPortBegin, (port) => port.name),
  });
});
const recargarPuertoDestino = useDebouncedSearch(async (textoBuscar: string) => {
  await appStore._getPortEnd({
    id_transport: id_transport.value as number,
    id: appStore.master_destino,
    search: serverSearchText(textoBuscar, appStore.itemsPortEnd, (port) => port.name),
  });
});

onMounted(async () => {
  const branch = sessionSucursal();
  mostrarGrupal.value = branch.id == 1;
  appStore.spiner = true;
  limpiar();
  await Promise.all([
    _getValidad(),
    appStore._getModality(),
    appStore._getShipment(),
    appStore._getIncoterms(),
    masterusuariosStore.cargarMasterDetalleCanal(),
    appStore._getOperador(),
    appStore.cargarClientes(),
    mastersStore._getProveedorRolAgente(),
    mastersStore._getProveedorRolColoader(),
    _validaDatass(),
  ]);
  appStore.spiner = false;
  //this.$store.state.drawer = false;
});
</script>

<template>
  <div v-if="mostrarflag">
    <v-row
      v-if="mostrarGrupal"
      density="compact"
    >
      <v-col cols="6">
        <v-checkbox
          label="Campañas Grupales"
          v-model="mastersStore.grupalflag"
        />
      </v-col>
      <v-col
        cols="6"
        v-if="mastersStore.grupalflag"
      >
        <MasterField
          label="Nro Cuotas"
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            v-model="appStore.nro_cuotas"
            min="0"
            type="number"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        v-if="mastersStore.grupalflag"
      >
        <MasterField
          label="Nombre de Campaña"
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            v-model="mastersStore.namecampaign"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        v-if="!!mastersStore.grupalflag"
      >
        <div class="text-center font-weight-bold my-3">
          Porcentaje y Fecha de pago
        </div>
        <v-row density="compact">
          <v-col
            cols="12"
            v-for="n in Number(appStore.nro_cuotas)"
            :key="n"
          >
            <v-row density="compact">
              <v-col cols="5">
                <v-text-field
                  :label="`Cuota-${n}`"
                  v-model="appStore.cuota[n - 1]"
                  type="number"
                  suffix="%"
                  min="0"
                  max="100"
                  :rules="[
                    (v) => !!v || 'Dato Requerido',
                    (v) => v > 0 || 'El porcentaje tiene que ser positivo',
                    (v) =>
                      v <= 100 || 'El por centaje no puede ser mayor que 100%',
                  ]"
                />
              </v-col>
              <v-col cols="7">
                <v-text-field
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  :label="`Fecha de pago ${n}`"
                  v-model="appStore.fechacuota[n - 1]"
                  type="date"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row density="compact">
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Sentido"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsModality"
            item-title="name"
            item-value="id"
            placeholder="Seleccionar"
            v-model="mastersStore.master_sentido"
            @update:model-value="handleSentido(), _getDataService()"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Tipo de Embarque"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsShipment"
            item-title="embarque"
            item-value="id"
            placeholder="Seleccionar"
            return-object
            v-model="appStore.master_id_trasnport"
            @update:model-value="_activePort(appStore.master_id_trasnport.id_transport)"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Incoterms"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsIncoterms"
            item-title="name"
            item-value="id"
            placeholder="Seleccionar"
            v-model="mastersStore.master_incoterms"
            @update:model-value="_getDataService()"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Origen"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsPortBegin"
            item-title="name"
            item-value="id_port"
            placeholder="Seleccionar"
            v-model="appStore.master_origen"
            @update:search="recargarPuertoOrigen"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        sm="6"
      >
        <MasterField
          label="Destino"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsPortEnd"
            item-title="name"
            item-value="id_port"
            placeholder="Seleccionar"
            v-model="appStore.master_destino"
            @update:search="recargarPuertoDestino"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        sm="6"
        v-if="route.params.id"
      >
        <MasterField
          label="Cantidad de House"
          v-slot="{ id }"
        >
          <v-text-field
            :id="id"
            type="text"
            readonly
            v-model="mastersStore.master_cantidad_house"
          />
        </MasterField>
      </v-col>
      <v-col cols="12">
        <MasterField
          label="Operador"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="itemsOperadorList"
            item-title="namelong"
            item-value="id"
            placeholder="Seleccionar"
            :model-value="mastersStore.master_id_operador || null"
            @update:model-value="(val) => (mastersStore.master_id_operador = val)"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        v-if="isAereo() || isFCL() || isLCL()"
      >
        <MasterField
          label="Agente"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="mastersStore.itemsProveedorRolAgente"
            item-title="namelong"
            item-value="id"
            placeholder="Seleccionar"
            :model-value="appStore.master_id_agente || null"
            @update:model-value="(val) => (appStore.master_id_agente = val)"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        v-if="isLCL()"
      >
        <MasterField
          label="Coloader"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="mastersStore.itemsProveedorRolColoader"
            item-title="namelong"
            item-value="id"
            placeholder="Seleccionar"
            :model-value="mastersStore.master_id_coloader || null"
            @update:model-value="(val) => (mastersStore.master_id_coloader = val)"
          />
        </MasterField>
      </v-col>
      <v-col
        cols="12"
        v-if="isFCL()"
      >
        <MasterField
          label="Naviera"
          v-slot="{ id }"
        >
          <v-autocomplete
            :id="id"
            :items="mastersStore.itemsProveedorRolNaviera"
            item-title="namelong"
            item-value="id"
            placeholder="Seleccionar"
            :model-value="mastersStore.master_id_naviera || null"
            @update:model-value="(val) => (mastersStore.master_id_naviera = val)"
          />
        </MasterField>
      </v-col>
    </v-row>
  </div>
</template>

<style lang="scss" scoped>
.icon_question {
  position: absolute;
  left: 150px;
}
</style>
