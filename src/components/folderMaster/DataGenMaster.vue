<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from "@/api/http";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import type { CotizacionListado } from "@/types/cotizacion";
import type { CotizacionParaMaster } from "@/types/operacionesMaster";
import { sessionSucursal, sessionUser } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();
const pricingStore = usePricingStore();
const masterusuariosStore = useMasterusuariosStore();
const itemsModality = computed(() => rootStore.state.itemsModality);
const itemsShipment = computed(() => rootStore.state.itemsShipment);
const itemsPortBegin = computed(() => rootStore.state.itemsPortBegin);
const itemsPortEnd = computed(() => rootStore.state.itemsPortEnd);
const itemsIncoterms = computed(() => rootStore.state.itemsIncoterms);
const itemsOperadorList = computed(() => rootStore.state.itemsOperadorList);
const itemsContainers = computed(() => rootStore.state.itemsContainers);

const mostrarflag = ref(true);
const mostrarGrupal = ref(false);
const id_transport = ref<number | null>(null);

const obtenerLabelBLMaster = computed(() => {
  return isAereo() ? "BL Máster Nro." : "BL Máster";
});
const obtenerInputTypeBLMaster = computed(() => {
  return "text";
  // return this.isAereo() ? "number" : "text";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const operadorNombre = computed(() => {
  if (!rootStore.state.master_id_operador || !itemsOperadorList.value) {
    return "";
  }
  const operador = itemsOperadorList.value.find(
    (op: { id: number; namelong: string }) => op.id == rootStore.state.master_id_operador,
  );
  return operador ? operador.namelong : "";
});

async function _activePort(idTransport: number) {
  id_transport.value = idTransport;

  rootStore.state.spiner = true;
  await Promise.all([
    rootStore.dispatch("_getPortBegin", { id_transport: idTransport }),
    rootStore.dispatch("_getPortEnd", { id_transport: idTransport }),
  ]);

  if (rootStore.state.master_id_trasnport.id == 1) {
    rootStore.state.embar_title_nacn = "Aerolinea";
  } else if (rootStore.state.master_id_trasnport.id == 2) {
    rootStore.state.embar_title_nacn = "Naviera";
  } else if (rootStore.state.master_id_trasnport.id == 3) {
    rootStore.state.embar_title_nacn = "Coloader";
  } else {
    rootStore.state.embar_title_nacn = "Aerolinea/Coloader/Naviera";
  }
  rootStore.state.spiner = false;
}
function _getDataService() {
  rootStore.dispatch("_getServicesBegin");
  // this._getBitacoraList();
  // this._getServicesList();
}
function _getValidad() {
  rootStore.state.master_id_operador = sessionUser().id;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getDate() {
  if (rootStore.state.master_sentido == 1) {
    rootStore.state.master_fecha_disponibilidad =
      rootStore.state.master_fecha_eta;
  } else if (rootStore.state.master_sentido == 2) {
    rootStore.state.master_fecha_disponibilidad =
      rootStore.state.master_fecha_etd;
  }
}
function _validaDatass() {
  if (route.params.id) {
    rootStore.state.master_Id_get = route.params.id;

    const config = {
      method: "post",
      url:
        import.meta.env.VITE_URL_MAIN +
        "getMasterId/" +
        rootStore.state.master_Id_get,
      headers: {
        "Content-Type": "application/json",
      },
    };
    axios(config)
      .then(async function (response) {
        // console.log(response)

        sessionStorage.setItem("auth-token", response.data.token);

        rootStore.state.master_insertId = rootStore.state.master_Id_get;
        rootStore.state.nro_master = response.data.data[0].nro_master;
        rootStore.state.master_cantidad_house =
          response.data.data[0].cantidad_house;
        rootStore.state.master_nro_expediente =
          response.data.data[0].code_master;
        rootStore.state.master_expediente =
          response.data.data[0].code_master;
        rootStore.state.master_sentido = response.data.data[0].id_modality;
        rootStore.state.master_id_trasnport =
          response.data.data[0].id_shipment;
        rootStore.state.master_cotizanion = response.data.data[0].id_cot;
        rootStore.state.master_incoterms =
          response.data.data[0].id_incoterms;
        id_transport.value = response.data.data[0].id_transport;
        await rootStore.dispatch("_getPortBegin", {
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_begin,
        });
        await rootStore.dispatch("_getPortEnd", {
          id_transport: response.data.data[0].id_transport,
          id: response.data.data[0].id_port_end,
        });

        rootStore.state.master_origen = response.data.data[0].id_port_begin;
        rootStore.state.master_destino = response.data.data[0].id_port_end;
        rootStore.state.master_id_operador =
          response.data.data[0].id_operador;
        rootStore.state.master_fecha_eta = response.data.data[0].fecha_eta;
        rootStore.state.master_fecha_etd = response.data.data[0].fecha_etd;
        rootStore.state.master_fecha_disponibilidad =
          response.data.data[0].fecha_disponibilidad;
        rootStore.state.master_ganancia_pricing =
          response.data.data[0].ganancia_pricing;
        rootStore.state.master_ganancia_operaciones =
          response.data.data[0].ganancia_operaciones;
        rootStore.state.master_id_agente = response.data.data[0].id_agent;
        rootStore.state.master_id_consigner =
          response.data.data[0].id_consigner;
        rootStore.state.master_id_notify = response.data.data[0].id_notify;
        rootStore.state.master_id_airlines =
          response.data.data[0].id_aerolinea;
        rootStore.state.statusData = true;
        rootStore.state.salidaflag = response.data.data[0].salidaflag;
        rootStore.state.llegadaflag = response.data.data[0].llegadaflag;
        rootStore.state.disponibilidadflag =
          response.data.data[0].disponibilidadflag;
        rootStore.state.master_id_coloader =
          response.data.data[0].id_coloader;
        rootStore.state.master_id_naviera =
          response.data.data[0].id_naviera;
        rootStore.state.master_blmaster = response.data.data[0].nro_mbl;
        rootStore.state.master_id_motonave =
          response.data.data[0].id_motonave;
        rootStore.state.master_viaje = response.data.data[0].nro_viaje;
        // Nuevos campos de embarque
        rootStore.state.master_vuelo = response.data.data[0].vuelo;
        rootStore.state.master_nro_containers =
          response.data.data[0].nro_containers;
        rootStore.state.master_nro_precinto =
          response.data.data[0].nro_precinto;
        rootStore.state.master_bultos = response.data.data[0].bultos;
        rootStore.state.master_peso = response.data.data[0].peso;
        rootStore.state.master_volumen = response.data.data[0].volumen;
        rootStore.state.master_id_condicion =
          response.data.data[0].id_conditions;
        rootStore.state.master_id_coins = response.data.data[0].id_moneda;
        rootStore.state.master_monto = response.data.data[0].monto;
        rootStore.state.grupalflag = response.data.data[0].grupalflag;
        rootStore.state.nro_cuotas = response.data.data[0].nro_cuotas;
        rootStore.state.comentario = response.data.data[0].comentario;
        rootStore.state.fecha_libre_almacenaje =
          response.data.data[0].fecha_libre_almacenaje;
        rootStore.state.fecha_libre_sobreestadia =
          response.data.data[0].fecha_libre_sobreestadia;
        rootStore.state.almacen_recepcion =
          response.data.data[0].almacen_recepcion;
        rootStore.state.dias_sobreestadia =
          response.data.data[0].dias_sobreestadia;
        rootStore.state.id_canal =
          response.data.data[0].id_masterdetallecanal;
        rootStore.state.nro_manifiesto =
          response.data.data[0].nro_manifiesto;
        rootStore.state.url_folderonedrive =
          response.data.data[0].url_folderonedrive;

        const cuotas = response.data.data[0].cuotas || [];
        cuotas.forEach((element: { porcentaje: number; fecha: string }) => {
          rootStore.state.cuota.push(element.porcentaje);
          rootStore.state.fechacuota.push(element.fecha);
        });
        rootStore.state.namecampaign = response.data.data[0].namecampaign;
        rootStore.state.master_itemsContainers =
          response.data.data[0].lstmastercontainers.map((item: { id_container: number }) => {
            return {
              ...item,
              name: itemsContainers.value.filter(
                (v: { id: number }) => v.id == item.id_container,
              ).length
                ? itemsContainers.value.find((v: { id: number }) => v.id == item.id_container)
                    .name
                : "",
            };
          });
        mostrarflag.value = false;
        mostrarflag.value = true;

        await rootStore.dispatch("_getHouseList");
      })
      .catch(function (error) {
        console.error(error);
      });
  }
}
function limpiar() {
  rootStore.state.master_nro_expediente = "";
  rootStore.state.master_expediente = "";
  rootStore.state.master_sentido = "";
  rootStore.state.master_id_trasnport = "";
  rootStore.state.master_incoterms = "";
  rootStore.state.master_origen = "";
  rootStore.state.master_destino = "";
  rootStore.state.master_id_operador = "";
  rootStore.state.master_ganancia_pricing = "";
  rootStore.state.master_ganancia_operaciones = "";
  rootStore.state.master_id_agente = "";
  rootStore.state.master_id_consigner = "";
  rootStore.state.master_id_notify = "";
  rootStore.state.master_id_airlines = "";
  rootStore.state.statusData = "";
  rootStore.state.master_id_coloader = "";
  rootStore.state.master_id_naviera = "";
  rootStore.state.master_blmaster = "";
  rootStore.state.master_id_motonave = "";
  rootStore.state.master_viaje = "";
  rootStore.state.master_bultos = "";
  rootStore.state.master_volumen = "";
  rootStore.state.master_id_condicion = "";
  rootStore.state.master_id_coins = "";
  rootStore.state.master_monto = "";
  rootStore.state.grupalflag = false;
  rootStore.state.nro_cuotas = 3;
  rootStore.state.comentario = [];
  rootStore.state.cuota = [];
  rootStore.state.master_fecha_eta = "";
  rootStore.state.master_fecha_etd = "";
  rootStore.state.master_fecha_disponibilidad = "";
  rootStore.state.fecha_libre_almacenaje = "";
  rootStore.state.almacen_recepcion = "";
  rootStore.state.dias_sobreestadia = "";
  rootStore.state.id_canal = "";
  rootStore.state.nro_manifiesto = "";
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function obternerDatosCotizacion() {
  if (!!rootStore.state.master_cotizanion && !route.params.id) {
    const cot = pricingStore.listQuotes.filter(
      (v) => v.id == rootStore.state.master_cotizanion,
    )[0] as CotizacionListado & CotizacionParaMaster;
    rootStore.state.master_sentido = cot.id_modality;
    rootStore.state.master_id_trasnport = cot.id_shipment;
    const id_transport = itemsShipment.value.filter(
      (v: { id: number }) => v.id == cot.id_shipment,
    )[0].id_transport;
    await _activePort(id_transport);
    rootStore.state.master_incoterms = cot.id_incoterms;
    rootStore.state.master_origen = cot.id_port_begin;
    rootStore.state.master_destino = cot.id_port_end;
    rootStore.state.master_fecha_disponibilidad = cot.fecha_fin;
    rootStore.state.master_id_operador = cot.id_vendedor;
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function validarCampaniaGrupales() {
  let val = true;
  if (route.params.id) {
    const cantidadHouse = rootStore.state.itemsHouseList;
    if (cantidadHouse.length > 1) {
      val = false;
    }
  }

  return val;
}
function isAereo() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "Aéreo") {
    val = true;
  }
  return val;
}
function isLCL() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "LCL") {
    val = true;
  }
  return val;
}
function isFCL() {
  let val = false;
  const id = rootStore.state.master_id_trasnport.id
    ? rootStore.state.master_id_trasnport.id
    : rootStore.state.master_id_trasnport;

  const code =
    itemsShipment.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsShipment.value.filter((v: { id: number }) => v.id == id)[0].code
      : "";

  if (code == "FCL") {
    val = true;
  }
  return val;
}
function isImportacion() {
  let val = false;
  const id = rootStore.state.master_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number }) => v.id == id)[0].name
      : "";

  if (name == "Importación") {
    val = true;
  }

  return val;
}
function isExportacion() {
  let val = false;
  const id = rootStore.state.master_sentido || "";

  const name =
    itemsModality.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number }) => v.id == id)[0].name
      : "";

  if (name == "Exportación") {
    val = true;
  }

  return val;
}
function handleSentido() {
  if (isImportacion()) {
    const nombreEmpresa = "PIC CARGO S.A.C";
    const empresa = rootStore.state.clientes.filter(
      (item: { namelong: string }) => item.namelong.toUpperCase() == nombreEmpresa,
    ).length
      ? rootStore.state.clientes.find(
          (item: { namelong: string }) => item.namelong.toUpperCase() == nombreEmpresa,
        ).id
      : "";

    rootStore.state.master_id_consigner = empresa;
    rootStore.state.master_id_notify = empresa;
  } else if (isExportacion()) {
    rootStore.state.master_id_consigner = "";
    rootStore.state.master_id_notify = "";
  }
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

onMounted(async () => {
  const branch = sessionSucursal();
  mostrarGrupal.value = branch.id == 1;
  rootStore.state.spiner = true;
  limpiar();
  await Promise.all([
    _getValidad(),
    rootStore.dispatch("_getModality"),
    rootStore.dispatch("_getShipment"),
    rootStore.dispatch("_getIncoterms"),
    masterusuariosStore.cargarMasterDetalleCanal(),
    rootStore.dispatch("_getOperador"),
    rootStore.dispatch("cargarClientes"),
    rootStore.dispatch("_getProveedorRolAgente"),
    rootStore.dispatch("_getProveedorRolColoader"),
    _validaDatass(),
  ]);
  if (!route.params.id) {
    await rootStore.dispatch("_getnroMaster");
  }
  rootStore.state.spiner = false;
  //this.$store.state.drawer = false;
});
</script>

<template>
  <div v-if="mostrarflag">
    <h3>Datos y Servicios a Realizar</h3>

    <v-row density="compact">
      <v-col
        cols="12"
        md="12"
      >
        <v-text-field
          v-model="rootStore.state.master_expediente"
          label="N° de Expedientes"
          disabled
        />
      </v-col>

      <v-col
        cols="6"
        v-if="mostrarGrupal"
      >
        <v-checkbox
          label="Campañas Grupales"
          v-model="rootStore.state.grupalflag"
        />
      </v-col>
      <v-col
        cols="6"
        v-if="mostrarGrupal"
      >
        <v-text-field
          v-if="rootStore.state.grupalflag"
          label="Nro Cuotas"
          v-model="rootStore.state.nro_cuotas"
          min="0"
          type="number"
        />
      </v-col>
      <v-col
        cols="12"
        md="12"
        v-if="rootStore.state.grupalflag"
      >
        <v-text-field
          v-model="rootStore.state.namecampaign"
          label="Nombre de Campaña"
        />
      </v-col>

      <v-col
        cols="12"
        v-if="!!rootStore.state.grupalflag"
      >
        <center class="my-5">
          <h3>Porcentaje y Fecha de pago</h3>
        </center>
        <v-row>
          <v-col
            cols="6"
            v-for="n in Number(rootStore.state.nro_cuotas)"
            :key="n"
          >
            <v-row>
              <v-col cols="4">
                <v-text-field
                  :label="`Porcentaje Cuota-${n}`"
                  v-model="rootStore.state.cuota[n - 1]"
                  type="number"
                  suffix="%"
                  min="0"
                  max="100"
                  density="compact"
                  :rules="[
                    (v) => !!v || 'Dato Requerido',
                    (v) => v > 0 || 'El porcentaje tiene que ser positivo',
                    (v) =>
                      v <= 100 || 'El por centaje no puede ser mayor que 100%',
                  ]"
                />
              </v-col>
              <v-col cols="8">
                <v-text-field
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  :label="`Fecha de pago ${n}`"
                  v-model="rootStore.state.fechacuota[n - 1]"
                  type="date"
                  density="compact"
                />
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="itemsModality"
          item-title="name"
          item-value="id"
          label="Sentido"
          v-model="rootStore.state.master_sentido"
          @update:model-value="handleSentido(), _getDataService()"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="itemsShipment"
          item-title="embarque"
          item-value="id"
          label="Tipo de Embarque"
          return-object
          v-model="rootStore.state.master_id_trasnport"
          @update:model-value="_activePort(rootStore.state.master_id_trasnport.id_transport)"
        />
      </v-col>
      <v-col
        cols="12"
        md="4"
      >
        <v-autocomplete
          :items="itemsIncoterms"
          item-title="name"
          item-value="id"
          label="Incoterms"
          v-model="rootStore.state.master_incoterms"
          @update:model-value="_getDataService()"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          :items="itemsPortBegin"
          item-title="name"
          item-value="id_port"
          label="Origen"
          v-model="rootStore.state.master_origen"
          @update:search="recargarPuertoOrigen"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          :items="itemsPortEnd"
          item-title="name"
          item-value="id_port"
          label="Destino"
          v-model="rootStore.state.master_destino"
          @update:search="recargarPuertoDestino"
        />
      </v-col>

      <v-col
        cols="12"
        md="6"
        v-if="route.params.id"
      >
        <v-text-field
          type="text"
          step="1"
          min="1"
          readonly
          v-model="rootStore.state.master_cantidad_house"
          label="Cantidad de House"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
      >
        <v-autocomplete
          :items="itemsOperadorList"
          item-title="namelong"
          item-value="id"
          label="Operador"
          v-model="rootStore.state.master_id_operador"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        v-if="isAereo() || isFCL() || isLCL()"
      >
        <v-autocomplete
          :items="rootStore.state.itemsProveedorRolAgente"
          item-title="namelong"
          item-value="id"
          label="Agente"
          v-model="rootStore.state.master_id_agente"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        v-if="isLCL()"
      >
        <v-autocomplete
          :items="rootStore.state.itemsProveedorRolColoader"
          item-title="namelong"
          item-value="id"
          label="Coloader"
          v-model="rootStore.state.master_id_coloader"
        />
      </v-col>
      <v-col
        cols="12"
        md="6"
        v-if="isFCL()"
      >
        <v-autocomplete
          :items="rootStore.state.itemsProveedorRolNaviera"
          item-title="namelong"
          item-value="id"
          label="Naviera"
          v-model="rootStore.state.master_id_naviera"
        />
      </v-col>
      <!--
      <v-col cols="12" md="6">
        <v-autocomplete
          :items="$store.state.clientes"
          item-text="namelong"
          item-value="id"
          label="Notify Master MBL"
          v-model="$store.state.master_id_notify"
        ></v-autocomplete>
      </v-col>
      -->
      <v-col
        cols="12"
        md="6"
      >
        <v-text-field
          :type="obtenerInputTypeBLMaster"
          v-model="rootStore.state.master_blmaster"
          :label="obtenerLabelBLMaster"
        />
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
