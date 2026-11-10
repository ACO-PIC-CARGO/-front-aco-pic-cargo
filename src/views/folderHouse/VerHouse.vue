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
import NotificacionesHouse from "@/components/folderHouse/NotificacionesHouse.vue";
import HouseClientRequiredDialog from "@/components/HouseFile/HouseClientRequiredDialog.vue";
import HouseNoticeRequiredDataDialog from "@/components/HouseFile/HouseNoticeRequiredDataDialog.vue";
import { missingHouseNoticeRequirements } from "@/components/HouseFile/houseNoticeRequirements";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { notifySuccess } from "@/utils/request";
import { useHouseEditStore } from "@/stores/houseEdit";
import { usePricingStore } from "@/stores/pricing";
import { useHousesStore } from "@/stores/houses";
import { usePermissions } from "@/composables/usePermissions";
import { provideHouseScreen } from "@/composables/useHouseScreen";
import TrafficFileBar from "@/components/folderTraffic/TrafficFileBar.vue";
import type { HouseNotice, NotificacionHouse } from "@/types/operaciones";

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
const hasHeaderTarget = ref(Boolean(document.querySelector("#house-header-actions")));

// On a full reload the app bar mounts after this view, so wait for its slot.
function waitForHeaderTarget(attempts = 50) {
  if (hasHeaderTarget.value) return;
  if (document.querySelector("#house-header-actions")) {
    hasHeaderTarget.value = true;
    return;
  }
  if (attempts > 0) setTimeout(() => waitForHeaderTarget(attempts - 1), 100);
}

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
const pendingNotice = ref<HouseNotice | null>(null);
const pendingNoticeDate = ref<string | null>(null);
const notificacionesHouseRef = ref<InstanceType<typeof NotificacionesHouse> | null>(null);
const requiredDataDialog = ref(false);
const pendingRequiredNotice = ref<NotificacionHouse | null>(null);
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

function missingNoticeData() {
  return missingHouseNoticeRequirements(housesStore.house);
}

function loadNotices() {
  return housesStore.getListadoNotificacionesHouse({ id_house: houseId.value, id_modality: housesStore.house.id_modality });
}

function requestHouseNotification(notification: NotificacionHouse) {
  if (missingNoticeData().length) {
    pendingRequiredNotice.value = notification;
    requiredDataDialog.value = true;
    return;
  }
  notificacionesHouseRef.value?.requestSend(notification);
}

async function requiredDataSaved() {
  const notification = pendingRequiredNotice.value;
  if (!notification) return;
  await reloadHouse();
  await loadNotices();
  const missing = missingNoticeData();
  if (missing.length) {
    await Swal.fire({
      icon: "warning",
      title: "No pudimos actualizar todos los datos",
      text: `Revisa estos campos y vuelve a guardar: ${missing.map(({ label }) => label).join(", ")}.`,
    });
    requiredDataDialog.value = true;
    return;
  }
  pendingRequiredNotice.value = null;
  const refreshedNotification = housesStore.ListadoNotificacionesHouse.find((item) => item.id == notification.id) ?? notification;
  notificacionesHouseRef.value?.requestSend(refreshedNotification);
}

function sendHouseNotification({ notification, fecha }: { notification: NotificacionHouse; fecha: string }) {
  if (!fecha) {
    Swal.fire({ icon: "warning", text: "La fecha es obligatoria para enviar la notificación." });
    return;
  }
  pendingNotice.value = { id: notification.id, title: notification.descripcion || notification.codigo || "Notificación" };
  pendingNoticeDate.value = fecha;
  noticeDialog.value = true;
}

async function clientSaved() {
  await finishEditing();
}

onMounted(async () => {
  waitForHeaderTarget();
  appStore.spiner = true;
  await housesStore.verHouse({ id: houseId.value });
  await Promise.all([loadTracking(), branchTimeZoneStore.load(), loadNotices()]);
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
    <Teleport
      v-if="hasHeaderTarget"
      to="#house-header-actions"
      defer
    >
      <v-btn
        v-if="!isEditing && can(permissionScreen, 'MODIFICAR')"
        color="light-green-lighten-1"
        variant="elevated"
        prepend-icon="mdi-pencil"
        @click="startEditing"
      >
        Editar
      </v-btn>
      <v-btn
        v-if="isEditing"
        color="primary"
        variant="elevated"
        prepend-icon="mdi-content-save-outline"
        :loading="houseEdit.saving"
        :disabled="houseEdit.loadingLists"
        @click="saveChanges"
      >
        Guardar
      </v-btn>
    </Teleport>
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
                  <NotificacionesHouse
                    ref="notificacionesHouseRef"
                    :house-id="houseId"
                    @request-send="requestHouseNotification"
                    @send="sendHouseNotification"
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
            <v-btn
              v-if="isEditing"
              key="guardar"
              color="primary"
              :loading="houseEdit.saving"
              :disabled="houseEdit.loadingLists"
              @click="saveChanges"
            >
              <v-icon start>
                mdi-content-save-outline
              </v-icon>
              Guardar
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
        :notice="pendingNotice"
        :fecha="pendingNoticeDate"
        @sent="loadNotices"
      />
      <HouseNoticeRequiredDataDialog
        v-model="requiredDataDialog"
        @saved="requiredDataSaved"
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

:global(.house-validation-container.swal2-backdrop-show) {
  backdrop-filter: blur(3px);
  background: rgba(15, 35, 61, 0.56);
}

:global(.house-validation-popup.swal2-popup) {
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(13, 43, 82, 0.24);
  overflow: hidden;
  padding: 0 2.25rem 1.6rem;
  position: relative;
}

:global(.house-validation-popup.swal2-popup::before) {
  background: linear-gradient(125deg, #70c4ff 0%, #cbe8ff 55%, #f5faff 100%);
  clip-path: ellipse(86% 100% at 50% 0%);
  content: "";
  height: 145px;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
}

:global(.house-validation-title.swal2-title) {
  color: #14365e;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  padding: 0;
}

:global(.house-validation-content.swal2-html-container) {
  color: #536780;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0.75rem 0 0;
}

:global(.house-validation-content .house-validation-list) {
  border-bottom: 1px solid #e2eaf5;
  display: grid;
  gap: 0.3rem;
  list-style: none;
  margin: 1rem 0 0;
  padding: 0 0 0.85rem;
  text-align: left;
}

:global(.house-validation-content .house-validation-list li) {
  align-items: flex-start;
  background: rgba(232, 241, 253, 0.56);
  border: 1px solid #dce8f8;
  border-radius: 12px;
  color: #234365;
  display: flex;
  gap: 0.85rem;
  min-height: 52px;
  padding: 0.55rem 0.75rem;
}

:global(.house-validation-content .house-validation-item-icon) {
  align-items: center;
  background: #dcecff;
  border-radius: 50%;
  color: #1471dc;
  display: inline-flex;
  flex: 0 0 36px;
  font-size: 1.25rem;
  height: 36px;
  justify-content: center;
}

:global(.house-validation-content .house-validation-item-label) {
  align-self: center;
  line-height: 1.3;
}

:global(.house-validation-icon.swal2-icon.swal2-warning) {
  background: #126bd5;
  border: 8px solid #fff;
  box-shadow: 0 4px 14px rgba(18, 107, 213, 0.24);
  color: #fff;
  height: 6rem;
  margin: 1rem auto 0.75rem;
  position: relative;
  width: 6rem;
  z-index: 1;
}

:global(.house-validation-icon .swal2-icon-content) {
  color: #fff;
  font-size: 3.5rem;
}

:global(.house-validation-close.swal2-close) {
  color: #33475e;
  font-size: 2rem;
  z-index: 1;
}

:global(.house-validation-confirm.swal2-styled) {
  align-items: center;
  background: #0969d8 !important;
  border-radius: 14px;
  box-shadow: 0 4px 10px rgba(9, 105, 216, 0.2);
  display: inline-flex;
  gap: 0.5rem;
  font-weight: 600;
  justify-content: center;
  min-width: 13rem;
  padding: 0.8rem 1.5rem;
}

:global(.house-validation-confirm.swal2-styled:hover) {
  background: #0759ba !important;
}
</style>
