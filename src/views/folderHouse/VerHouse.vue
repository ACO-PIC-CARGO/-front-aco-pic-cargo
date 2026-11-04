<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import dataGen from "@/components/folderHouse/DataGenVer.vue";
//import houselist from "./houselist.vue";
import dataEmbar from "@/components/folderHouse/DataEmbarVer.vue";
import "@/styles/aco-ui.css";
import HouseStepList from "@/components/HouseFile/HouseStepList.vue";
import ClientTrackingPreview from "@/components/HouseFile/ClientTrackingPreview.vue";
import HouseCustomsCard from "@/components/HouseFile/HouseCustomsCard.vue";
import HouseMasterDates from "@/components/HouseFile/HouseMasterDates.vue";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import HouseArrivalNoticeDialog from "@/components/HouseFile/HouseArrivalNoticeDialog.vue";
import HouseClientRequiredDialog from "@/components/HouseFile/HouseClientRequiredDialog.vue";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { notifySuccess } from "@/utils/request";
import { useHouseEditStore } from "@/stores/houseEdit";
import { usePricingStore } from "@/stores/pricing";
import { useHousesStore } from "@/stores/houses";
import { usePermissions } from "@/composables/usePermissions";
import { provideHouseScreen } from "@/composables/useHouseScreen";
import TrafficFileBar from "@/components/folderTraffic/TrafficFileBar.vue";

const FORMAT_ERROR = "No pudimos generar el formato. Intenta de nuevo en unos minutos.";

const appStore = useAppStore();
const route = useRoute();
const appRouter = useRouter();
const housesStore = useHousesStore();
const pricingStore = usePricingStore();
const houseTrackingStore = useHouseTrackingStore();
const branchTimeZoneStore = useBranchTimeZoneStore();
const houseId = computed(() => Number(route.params.id));
const isTrafficFile = route.meta?.permissionScreen === "lstTraffic";
const permissionScreen = isTrafficFile ? "lstTraffic" : "listHouse";
const viewRoute = isTrafficFile ? "trafficVer" : "controlHouseVer";
const editRoute = isTrafficFile ? "trafficEditar" : "controlHouseEditar";
provideHouseScreen(() => permissionScreen);
const houseEdit = useHouseEditStore();
const { can } = usePermissions();
const isEditing = computed(() => route.name === editRoute && can(permissionScreen, "MODIFICAR"));
const hasHouseActions = ["MODIFICAR", "ELIMINAR", "EXPORTAR"].some((action) => can(permissionScreen, action));

function showTitle() {
  const heading = isTrafficFile ? "Expediente de tráfico" : `N° BL House ${housesStore.house?.nro_hbl || ""}`;
  appStore.mainTitle = `${heading} - ${housesStore.house?.consigner || ""} [${isEditing.value ? "EDITAR" : "VER"}]`;
}

async function reloadHouse() {
  await housesStore.verHouse({ id: houseId.value });
}

function startEditing() {
  appRouter.replace({ name: editRoute, params: { id: houseId.value } });
}

async function finishEditing() {
  await reloadHouse();
  await appRouter.replace({ name: viewRoute, params: { id: houseId.value } });
}

async function saveChanges() {
  const reason = await houseEdit.save(housesStore.house);
  if (reason) {
    Swal.fire({ icon: "warning", text: reason });
    return;
  }
  notifySuccess("Guardamos los cambios del house.");
  await finishEditing();
}

watch(isEditing, (editing) => {
  showTitle();
  if (editing) houseEdit.start(housesStore.house);
});
const trackingError = ref("");
const COMPACT_FIELDS = {
  VTextField: { density: "compact", hideDetails: "auto" },
  VAutocomplete: { density: "compact", hideDetails: "auto" },
};
const itemsShipment = computed(() => appStore.itemsShipment);

async function loadTracking() {
  trackingError.value = (await houseTrackingStore.load(houseId.value)) ?? "";
}

const noticeDialog = ref(false);
const clientDialog = ref(false);
const loadingBotonEliminarHouse = ref(false);
const fab = ref(false);
const dialogFormato = ref(false);
const formatoflag = ref(true);

function abrirModalFormato() {
  dialogFormato.value = true;
}

async function downloadFormat(url: string, prefix: string) {
  try {
    const response = await axios({
      method: "get",
      url,
      params: { id_house: houseId.value, formatoflag: formatoflag.value },
      responseType: "blob",
    });
    const blob = response.data as Blob;
    if (blob.type.includes("json")) {
      Swal.fire({ icon: "warning", text: JSON.parse(await blob.text()).mensaje || FORMAT_ERROR });
      return;
    }
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${prefix}_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error(err);
    Swal.fire({ icon: "error", text: FORMAT_ERROR });
  } finally {
    dialogFormato.value = false;
  }
}

const exportarFormatoAWB = () => downloadFormat("generar_formato_awb", "formato_awb");
const exportarFormatoHBL = () => downloadFormat("generar_formato_bl", "formato_bl");

async function eliminarHouse() {
  const answer = await Swal.fire({
    icon: "question",
    text: "¿Quieres eliminar este house? Su cotización quedará disponible para otro expediente.",
    showDenyButton: true,
    confirmButtonText: "Sí, eliminar",
    denyButtonText: "No",
  });
  if (!answer.isConfirmed) return;
  loadingBotonEliminarHouse.value = true;
  await housesStore.deleteHouse({ id: houseId.value });
  loadingBotonEliminarHouse.value = false;
}

function shipmentCode() {
  return itemsShipment.value.find((v: { id: number; code: string }) => v.id == housesStore.house.id_shipment)?.code ?? "";
}

function isAereo() {
  return shipmentCode() == "Aéreo";
}

const NOTICE_REQUIREMENTS: [string, string][] = [
  ["id_modality", "Sentido"],
  ["id_shipment", "Tipo de embarque"],
  ["id_port_begin", "Puerto de origen"],
  ["id_port_end", "Puerto de destino"],
  ["id_proveedor", "Proveedor"],
  ["id_consigner", "Cliente"],
  ["emailaddress_clientefinal", "Correo del cliente"],
  ["id_operador", "Operador"],
  ["fecha_etd", "Fecha ETD"],
  ["fecha_eta", "Fecha ETA"],
  ["monto", "Monto"],
];
const LOOSE_CARGO_REQUIREMENTS: [string, string][] = [
  ["bultos", "Nº de bultos"],
  ["peso", "Peso"],
  ["volumen", "Volumen"],
];

function openNotificaciones() {
  const house = housesStore.house as Record<string, unknown>;
  const requirements = shipmentCode() == "FCL" ? NOTICE_REQUIREMENTS : [...NOTICE_REQUIREMENTS, ...LOOSE_CARGO_REQUIREMENTS];
  const missing = requirements.filter(([field]) => !house[field]).map(([, label]) => label);
  if (!missing.length) {
    noticeDialog.value = true;
    return;
  }
  Swal.fire({
    icon: "warning",
    title: "Completa el house para enviar el aviso",
    html: `<p>Falta:</p>${missing.map((label) => `<p>${label}</p>`).join("")}`,
  });
}

async function clientSaved() {
  await finishEditing();
}

onMounted(async () => {
  appStore.spiner = true;
  await housesStore.verHouse({ id: houseId.value });
  await Promise.all([loadTracking(), branchTimeZoneStore.load()]);
  await pricingStore.getCargarEjecutivo();
  showTitle();
  clientDialog.value = isEditing.value && Boolean(route.params.activar) && !housesStore.house.id_consigner;
  if (isEditing.value) await houseEdit.start(housesStore.house);
  appStore.spiner = false;
});
</script>

<template>
  <v-theme-provider
    theme="aco"
    with-background
    class="aco-ui house-file"
  >
    <v-form
      ref="formControlHouse"
      :readonly="!isEditing"
    >
      <v-container fluid>
        <TrafficFileBar
          v-if="isTrafficFile"
          :house-id="houseId"
        />
        <v-row density="compact">
          <v-col
            cols="12"
            md="8"
            lg="9"
          >
            <div class="d-flex flex-column ga-3">
              <v-row density="compact">
                <v-col
                  cols="12"
                  lg="5"
                  class="house-data d-flex flex-column ga-3"
                >
                  <v-defaults-provider :defaults="COMPACT_FIELDS">
                    <v-card
                      variant="flat"
                      border
                      rounded="lg"
                      class="pa-3"
                    >
                      <dataGen :editing="isEditing" />
                    </v-card>
                    <v-card
                      v-if="housesStore.house.id_master"
                      variant="flat"
                      border
                      rounded="lg"
                      class="pa-3"
                    >
                      <HouseMasterDates :master-id="housesStore.house.id_master" />
                    </v-card>
                    <v-card
                      variant="flat"
                      border
                      rounded="lg"
                      class="pa-3"
                    >
                      <dataEmbar :editing="isEditing" />
                    </v-card>
                  </v-defaults-provider>
                  <HouseCustomsCard :editing="isEditing" />
                  <div
                    v-if="isEditing"
                    class="d-flex flex-wrap ga-2"
                  >
                    <v-btn
                      color="primary"
                      variant="flat"
                      prepend-icon="mdi-content-save-outline"
                      :loading="houseEdit.saving"
                      :disabled="houseEdit.loadingLists"
                      @click="saveChanges"
                    >
                      Guardar cambios
                    </v-btn>
                    <v-btn
                      variant="text"
                      :disabled="houseEdit.saving"
                      @click="finishEditing"
                    >
                      Cancelar
                    </v-btn>
                    <v-spacer />
                    <v-btn
                      v-if="can(permissionScreen, 'ELIMINAR')"
                      color="error"
                      variant="text"
                      prepend-icon="mdi-delete-outline"
                      :loading="loadingBotonEliminarHouse"
                      @click="eliminarHouse()"
                    >
                      Eliminar
                    </v-btn>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  lg="7"
                >
                  <HouseStepList
                    :house-id="houseId"
                    :load-error="trackingError"
                    @retry="loadTracking"
                  />
                </v-col>
              </v-row>
            </div>
          </v-col>
          <v-col
            cols="12"
            md="4"
            lg="3"
          >
            <ClientTrackingPreview :house-id="houseId" />
          </v-col>
        </v-row>
        <div style="position: fixed; bottom: 16px; right: 16px; z-index: 3000">
          <v-speed-dial
            v-if="hasHouseActions"
            v-model="fab"
            location="top end"
            transition="slide-y-reverse-transition"
            content-class="acciones-dial"
          >
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                color="info"
                icon
              >
                <v-icon v-if="fab">
                  mdi-close
                </v-icon>
                <v-icon v-else>
                  mdi-tools
                </v-icon>
              </v-btn>
            </template>

            <v-btn
              v-if="can(permissionScreen, 'ELIMINAR')"
              key="eliminar"
              color="red"
              :loading="loadingBotonEliminarHouse"
              @click="eliminarHouse()"
            >
              <v-icon start>
                mdi-delete
              </v-icon>
              Eliminar
            </v-btn>
            <v-btn
              v-if="can(permissionScreen, 'EXPORTAR')"
              key="imprimir"
              :style="{ backgroundColor: 'rgb(92, 116, 137)', color: 'white' }"
              @click="abrirModalFormato()"
            >
              <v-icon
                start
                style="color: white"
              >
                mdi-printer
              </v-icon>
              Imprimir BL
            </v-btn>

            <v-btn
              v-if="can(permissionScreen, 'MODIFICAR')"
              key="notificaciones"
              color="deep-purple"
              @click="openNotificaciones"
            >
              <v-icon
                start
                style="transform: rotate(-45deg)"
              >
                mdi-send
              </v-icon>
              Notificaciones
            </v-btn>
            <v-btn
              v-if="!isEditing && can(permissionScreen, 'MODIFICAR')"
              key="editar"
              color="light-green-lighten-1"
              @click="startEditing"
            >
              <v-icon start>
                mdi-pencil
              </v-icon>
              Editar
            </v-btn>
          </v-speed-dial>
        </div>
        <!-- Modal para seleccionar formato de impresión -->
        <v-dialog
          v-model="dialogFormato"
          max-width="400px"
        >
          <v-card>
            <v-card-title
              primary-title
              class="bg-light-blue-darken-2 text-white"
            >
              Imprimir Formato {{ isAereo() ? "GUÍA AÉREA" : "BL" }}
            </v-card-title>
            <v-card-text class="pt-4">
              <p class="text-body-large mb-2">
                ¿Imprimir con fondo?
              </p>
              <v-radio-group v-model="formatoflag">
                <v-radio
                  label="Sí"
                  :value="true"
                />
                <v-radio
                  label="No"
                  :value="false"
                />
              </v-radio-group>
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn
                color="success"
                v-if="isAereo()"
                @click="exportarFormatoAWB()"
              >
                <v-icon start>
                  mdi-printer
                </v-icon>
                Imprimir Guía Aérea
              </v-btn>
              <v-btn
                color="success"
                v-else
                @click="exportarFormatoHBL()"
              >
                <v-icon start>
                  mdi-printer
                </v-icon>
                Imprimir BL
              </v-btn>
              <v-btn
                color="grey"
                variant="text"
                @click="dialogFormato = false"
              >
                Cancelar
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-container>

      <HouseArrivalNoticeDialog
        v-model="noticeDialog"
        :house-id="houseId"
        :modality="housesStore.house.modality"
      />
      <HouseClientRequiredDialog
        v-model="clientDialog"
        @saved="clientSaved"
      />
    </v-form>
  </v-theme-provider>
</template>

<style lang="scss" scoped>
._content__bitacora {
  height: 90vh;
  overflow-y: scroll;
  --scrollbar-width: none !important;
}

.div__button_bottom {
  text-decoration: none;
  text-align: center;
  margin-right: 20px;
  display: block;
}

.title_button_bottom {
  text-decoration: none;
  color: #252c32;
}

:global(.acciones-dial.v-speed-dial__content) {
  flex-direction: column-reverse;
  align-items: flex-end;
}
.acciones-dial .v-btn {
  min-width: 220px;
}
.acciones-dial .v-btn :deep(.v-btn__content) {
  justify-content: flex-start;
  width: 100%;
  font-size: 1.2rem;
  line-height: 1.4;
}
.acciones-dial .v-btn .v-icon {
  font-size: 22px !important;
  margin-right: 8px;
}

.house-data :deep(h3) {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
}
.house-data :deep(.v-field__input),
.house-data :deep(.v-label:not(.v-field-label--floating)) {
  font-size: 13px;
}
</style>
