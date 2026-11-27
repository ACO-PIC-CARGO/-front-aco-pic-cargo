<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useMastersStore } from "@/stores/masters";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useHousesStore } from "@/stores/houses";
import { usePermissions } from "@/composables/usePermissions";
import type { HouseDeMaster } from "@/types/operacionesMaster";
import { mastersToMoveHouseTo } from "@/utils/masters";
import { usePricingStore } from "@/stores/pricing";
import { hasFailed } from "@/utils/request";
import { sessionUserIdOrEmpty } from "@/utils/sesion";
import moment from "moment-timezone";
import type { ComentarioMasterFila } from "@/types/operaciones";

const HOUSE_NOT_MOVED = "No pudimos mover el house. Revisa tu conexión e intenta de nuevo.";
const HOUSES_PREVIEW = 5;
const numberFormat = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const formatNumber = (value: unknown) => numberFormat.format(parseFloat(String(value ?? 0)) || 0);
const REQUIRED = (value: unknown) => !!String(value ?? "").trim() || "Dato requerido";

const emit = defineEmits<{ recargarDatos: [] }>();

const appStore = useAppStore();
const mastersStore = useMastersStore();
const route = useRoute();
const router = useRouter();
const housesStore = useHousesStore();
const { can } = usePermissions();
const pricingStore = usePricingStore();

const showAll = ref(false);
const activeTab = ref(0);
const flagCambiarExpediente = ref(false);
const dialogCambiarExpediente = ref(false);
const selectedNuevoExpediente = ref<number | number[] | null>([]);
const house = ref<HouseDeMaster>({} as HouseDeMaster);

const displayedItems = computed(() => {
  const list = appStore.itemsHouseList || [];
  return showAll.value ? list : list.slice(0, HOUSES_PREVIEW);
});
const masterComments = ref<ComentarioMasterFila[]>([]);
const commentsNotice = ref("");
const dialogComentario = ref(false);
const savingComentario = ref(false);
const nuevoComentario = ref({ fecha: "", id_entitie: null as number | null, comentario: "" });
const frmComentario = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const masterId = computed(() => Number(route.params.id) || 0);
const totalHouses = computed(() => {
  const list = appStore.itemsHouseList || [];
  return list.length;
});
const totalPesoHouse = computed(() => {
  const list = appStore.itemsHouseList || [];
  const total = list.reduce(
    (acc: number, it: HouseDeMaster) => acc + (parseFloat(String(it.peso)) || 0),
    0,
  );
  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
});
const totalVolumenHouse = computed(() => {
  const list = appStore.itemsHouseList || [];
  const total = list.reduce(
    (acc: number, it: HouseDeMaster) => acc + (parseFloat(String(it.volumen)) || 0),
    0,
  );
  return Number.isFinite(total) ? Number(total.toFixed(3)) : 0;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const sumaTotal = computed(() => {
  return 0;
});
const isViewMode = computed(() => route.name == "controlMasterVer");
const mastersForHouse = computed(() => mastersToMoveHouseTo(appStore.itemsMasterList || [], route.params.id as string));
const esAereo = computed(() => {
  const st = appStore;
  const id =
    st.master_id_trasnport && st.master_id_trasnport.id
      ? st.master_id_trasnport.id
      : st.master_id_trasnport;
  const items = st.itemsShipment || [];
  const it = items.find((v: { id: number; code: string }) => v.id == id);
  return it && it.code === "Aéreo";
});

async function cargarComentarios() {
  if (!masterId.value) return;
  const answer = await mastersStore.listarComentariosMaster(masterId.value);
  masterComments.value = answer.estadoflag ? answer.data ?? [] : [];
  commentsNotice.value = hasFailed(answer) ? answer.mensaje || "" : "";
}
async function abrirModalComentario() {
  const sessionEntity = sessionUserIdOrEmpty();
  nuevoComentario.value = {
    fecha: moment().format("YYYY-MM-DD"),
    id_entitie: sessionEntity === "" ? null : sessionEntity,
    comentario: "",
  };
  dialogComentario.value = true;
  if (!pricingStore.listEjecutivo.length) await pricingStore.getModulesEntities();
}
async function guardarComentario() {
  if (!(await frmComentario.value?.validate())?.valid) return;
  savingComentario.value = true;
  try {
    const saved = await mastersStore.insertComentarioMaster({
      id_master: masterId.value,
      id_entitie: nuevoComentario.value.id_entitie ?? undefined,
      fecha: nuevoComentario.value.fecha,
      comentario: nuevoComentario.value.comentario.trim(),
    });
    if (!saved) return;
    dialogComentario.value = false;
    await cargarComentarios();
  } catch (error) {
    console.error(error);
    await Swal.fire({ icon: "error", text: "No pudimos guardar el comentario. Revisa tu conexión e intenta de nuevo." });
  } finally {
    savingComentario.value = false;
  }
}
async function abrirModalCambiarExpediente(houseItem: HouseDeMaster = {} as HouseDeMaster) {
  house.value = houseItem;

  flagCambiarExpediente.value = true;

  selectedNuevoExpediente.value = Number(route.params.id) || null;
  dialogCambiarExpediente.value = true;
  flagCambiarExpediente.value = false;
}
async function aplicarCambioExpediente() {
  if (!house.value || !selectedNuevoExpediente.value) return;
  if (
    Number(selectedNuevoExpediente.value) === Number(route.params.id)
  ) {
    dialogCambiarExpediente.value = false;
    return;
  }
  const targetLabel = mastersForHouse.value.find(
    (x: { id: number }) => x.id === selectedNuevoExpediente.value,
  )?.code_master;
  if (!targetLabel) return;
  const res = await Swal.fire({
    icon: "question",
    title: "Confirmar cambio",
    text: `¿Desea mover el house ${house.value.code_house} (con todos sus registros) al master ${targetLabel}?`,
    showCancelButton: true,
    confirmButtonText: "Sí, cambiar",
    cancelButtonText: "Cancelar",
  });
  if (!res.isConfirmed) return;

  try {
    const payload = {
      id_orders: house.value.id_orders,
      id_house: house.value.id,
      id_master_origen: Number(route.params.id),
      id_master_destino: Number(selectedNuevoExpediente.value),
    };
    const config = {
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + "reasignar_house",
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    };
    const response = await axios(config);
    dialogCambiarExpediente.value = false;
    if (response.data?.estadoflag) {
      await Swal.fire({ icon: "success", text: response.data.mensaje || `Movimos el house al expediente ${targetLabel}.` });
      emit("recargarDatos");
    } else {
      await Swal.fire({ icon: "warning", text: response.data?.mensaje || HOUSE_NOT_MOVED });
    }
  } catch (error) {
    console.error(error);
    await Swal.fire({ icon: "error", text: HOUSE_NOT_MOVED });
  }
}
function showHouse(id: number) {
  if (route.name == "controlMasterEditar") {
    router.push("/home/folderHouse/control/editar/" + id);
  } else if (route.name == "controlMasterVer") {
    router.push("/home/folderHouse/control/ver/" + id);
  }
}
function computePesoVolumetrico(item: HouseDeMaster) {
  const m3 = parseFloat(String(item.volumen || 0));
  const pv = m3 > 0 ? m3 * 166.66 : 0;
  return isNaN(pv) ? 0 : Number(pv.toFixed(2));
}
function computePesoCargable(item: HouseDeMaster) {
  const kg = parseFloat(String(item.peso || 0));
  const m3 = parseFloat(String(item.volumen || 0));
  const charge = Math.max(kg, m3 * 166.66);
  return isNaN(charge) ? 0 : Number(charge.toFixed(2));
}
function getIncotermName(item: HouseDeMaster) {
  if (item.incoterm) return item.incoterm;
  if (item.nameincoterm) return item.nameincoterm;
  if (item.incoterms) return item.incoterms;
  if (item.name_incoterm) return item.name_incoterm;
  if (item.id_incoterms) {
    const incoterms = appStore.itemsIncoterms || [];
    const found = incoterms.find(function (inc: { id: number; name: string }) {
      return inc.id == item.id_incoterms;
    });
    if (found) return found.name;
  }
  return "-";
}
function eliminar(id: number) {
  Swal.fire({
    icon: "question",
    title: "Eliminar",
    text: "Desea Eliminar el house",
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    showCancelButton: true,
    cancelButtonText: "Cancelar",
    confirmButtonText: "Si, Eliminar",
  }).then((res) => {
    if (res.isConfirmed) {
      housesStore.deleteHouse({ id: id });
    }
  });
}

watch(masterId, cargarComentarios);

onMounted(async () => {
  cargarComentarios();
  await appStore._getMasterList();
});
</script>

<template>
  <div>
    <v-card
      class="master-houses"
      rounded="lg"
      elevation="0"
    >
      <v-tabs
        v-model="activeTab"
        bg-color="transparent"
        color="primary"
        density="compact"
        class="master-houses__tabs"
      >
        <v-tab key="houses">
          <v-icon start>
            mdi-home-outline
          </v-icon>
          Lista de House
        </v-tab>
        <v-tab key="comments">
          <v-icon start>
            mdi-comment-text-multiple-outline
          </v-icon>
          Comentarios
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="activeTab">
        <v-tabs-window-item key="houses">
          <div class="master-houses__kpis">
            <div class="master-houses__kpi">
              <v-icon
                color="primary"
                size="28"
              >
                mdi-ferry
              </v-icon>
              <div>
                <div class="master-houses__kpi-label">
                  Total de House
                </div>
                <div class="master-houses__kpi-value">
                  {{ totalHouses }}
                </div>
              </div>
            </div>
            <div class="master-houses__kpi">
              <v-icon
                color="primary"
                size="28"
              >
                mdi-weight-kilogram
              </v-icon>
              <div>
                <div class="master-houses__kpi-label">
                  Total de House Peso
                </div>
                <div class="master-houses__kpi-value">
                  {{ formatNumber(totalPesoHouse) }} kg
                </div>
              </div>
            </div>
            <div class="master-houses__kpi">
              <v-icon
                color="primary"
                size="28"
              >
                mdi-cube-outline
              </v-icon>
              <div>
                <div class="master-houses__kpi-label">
                  Total de House Volumen
                </div>
                <div class="master-houses__kpi-value">
                  {{ formatNumber(totalVolumenHouse) }} m³
                </div>
              </div>
            </div>
          </div>

          <div class="master-houses__table-wrap">
            <v-table
              density="compact"
              class="master-houses__table"
            >
              <thead>
                <tr>
                  <th class="text-center">
                    Listado
                  </th>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Incoterm</th>
                  <th class="text-right">
                    Peso (kg)
                  </th>
                  <th class="text-right">
                    Volumen (m³)
                  </th>
                  <th
                    v-if="esAereo"
                    class="text-right"
                  >
                    Peso volumétrico
                  </th>
                  <th
                    v-if="esAereo"
                    class="text-right"
                  >
                    Peso Cargable
                  </th>
                  <th class="text-center">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, index) in displayedItems"
                  :key="item.id ?? index"
                  @click="showHouse(item.id)"
                  style="cursor: pointer"
                >
                  <td class="text-center">
                    {{ (index as number) + 1 }}
                  </td>
                  <td>{{ item.nro_hbl || item.code_house || "-" }}</td>
                  <td>
                    {{
                      item.cliente_nombre ||
                        item.nameconsigner ||
                        item.cliente ||
                        item.consigner ||
                        "-"
                    }}
                  </td>
                  <td>{{ getIncotermName(item) }}</td>
                  <td class="text-right">
                    {{ formatNumber(item.peso) }}
                  </td>
                  <td class="text-right">
                    {{ formatNumber(item.volumen) }}
                  </td>
                  <td
                    v-if="esAereo"
                    class="text-right"
                  >
                    {{ formatNumber(computePesoVolumetrico(item)) }}
                  </td>
                  <td
                    v-if="esAereo"
                    class="text-right"
                  >
                    {{ formatNumber(computePesoCargable(item)) }}
                  </td>
                  <td class="text-center text-no-wrap">
                    <v-btn
                      variant="text"
                      icon
                      size="small"
                      color="info"
                      aria-label="Abrir house"
                      @click.stop="showHouse(item.id)"
                    >
                      <v-icon>mdi-open-in-new</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="!isViewMode && can('listMaster', 'ELIMINAR')"
                      variant="text"
                      icon
                      size="small"
                      color="red"
                      aria-label="Eliminar house"
                      @click.stop="eliminar(item.id)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                    <v-btn
                      v-if="!isViewMode && can('listMaster', 'MODIFICAR')"
                      variant="text"
                      icon
                      size="small"
                      color="#F57F17"
                      aria-label="Cambiar expediente"
                      @click.stop="abrirModalCambiarExpediente(item)"
                    >
                      <v-icon>mdi-folder-arrow-up-down</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </div>
          <!-- Celular: una tarjeta por house en lugar de la tabla -->
          <div class="master-houses__cards">
            <div
              v-for="(item, index) in displayedItems"
              :key="item.id ?? index"
              class="master-houses__card"
              role="button"
              tabindex="0"
              @click="showHouse(item.id)"
              @keydown.enter="showHouse(item.id)"
            >
              <div class="master-houses__card-head">
                <span class="master-houses__card-num">{{ Number(index) + 1 }}</span>
                <span class="master-houses__card-code">{{ item.nro_hbl || item.code_house || "-" }}</span>
                <v-spacer />
                <span class="master-houses__card-inco">{{ getIncotermName(item) }}</span>
              </div>
              <div class="master-houses__card-client">
                {{
                  item.cliente_nombre ||
                    item.nameconsigner ||
                    item.cliente ||
                    item.consigner ||
                    "-"
                }}
              </div>
              <div class="master-houses__card-metrics">
                <div>
                  <span>Peso</span>
                  <strong>{{ formatNumber(item.peso) }} kg</strong>
                </div>
                <div>
                  <span>Volumen</span>
                  <strong>{{ formatNumber(item.volumen) }} m³</strong>
                </div>
                <div v-if="esAereo">
                  <span>P. volumétrico</span>
                  <strong>{{ formatNumber(computePesoVolumetrico(item)) }} kg</strong>
                </div>
                <div v-if="esAereo">
                  <span>P. cargable</span>
                  <strong>{{ formatNumber(computePesoCargable(item)) }} kg</strong>
                </div>
              </div>
              <div class="master-houses__card-actions">
                <v-btn
                  variant="text"
                  icon
                  size="small"
                  color="info"
                  aria-label="Abrir house"
                  @click.stop="showHouse(item.id)"
                >
                  <v-icon>mdi-open-in-new</v-icon>
                </v-btn>
                <v-btn
                  v-if="!isViewMode && can('listMaster', 'ELIMINAR')"
                  variant="text"
                  icon
                  size="small"
                  color="red"
                  aria-label="Eliminar house"
                  @click.stop="eliminar(item.id)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
                <v-btn
                  v-if="!isViewMode && can('listMaster', 'MODIFICAR')"
                  variant="text"
                  icon
                  size="small"
                  color="#F57F17"
                  aria-label="Cambiar expediente"
                  @click.stop="abrirModalCambiarExpediente(item)"
                >
                  <v-icon>mdi-folder-arrow-up-down</v-icon>
                </v-btn>
              </div>
            </div>
          </div>
          <div
            v-if="(appStore.itemsHouseList?.length ?? 0) > HOUSES_PREVIEW"
            class="text-center pa-2"
          >
            <v-btn
              variant="text"
              color="primary"
              class="text-decoration-underline text-none"
              @click="showAll = !showAll"
            >
              {{ showAll ? "Ver menos" : "Ver todos" }}
            </v-btn>
          </div>
        </v-tabs-window-item>

        <v-tabs-window-item key="comments">
          <div class="pa-3">
            <div
              v-if="!isViewMode"
              class="d-flex justify-end mb-2"
            >
              <v-btn
                color="primary"
                variant="flat"
                size="small"
                prepend-icon="mdi-comment-plus-outline"
                @click="abrirModalComentario"
              >
                Añadir comentario
              </v-btn>
            </div>
            <v-alert
              v-if="commentsNotice"
              type="warning"
              variant="tonal"
              density="compact"
              class="mb-2"
              :text="commentsNotice"
            />
            <v-table
              v-if="masterComments.length > 0"
              density="compact"
              class="master-houses__table"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Ejecutivo</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(comment, index) in masterComments"
                  :key="index"
                >
                  <td>{{ comment.fecha }}</td>
                  <td>{{ comment.ejecutivo }}</td>
                  <td>{{ comment.comentario }}</td>
                </tr>
              </tbody>
            </v-table>
            <v-alert
              v-else
              type="info"
              variant="tonal"
            >
              No hay comentarios disponibles
            </v-alert>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>

    <v-dialog
      v-model="dialogComentario"
      max-width="560"
      persistent
    >
      <v-card rounded="lg">
        <v-card-title class="d-flex align-center flex-wrap">
          Añadir comentario
          <v-spacer />
          <v-btn
            variant="text"
            icon="mdi-close"
            size="small"
            aria-label="Cerrar"
            @click="dialogComentario = false"
          />
        </v-card-title>
        <v-card-text>
          <v-form ref="frmComentario">
            <v-text-field
              v-model="nuevoComentario.fecha"
              label="Fecha"
              type="date"
              readonly
            />
            <v-autocomplete
              v-model="nuevoComentario.id_entitie"
              label="Ejecutivo"
              :items="pricingStore.listEjecutivo"
              item-title="name"
              item-value="id_entitie"
              :rules="[REQUIRED]"
            />
            <v-textarea
              v-model="nuevoComentario.comentario"
              label="Estado / Comentario"
              rows="4"
              auto-grow
              :rules="[REQUIRED]"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="red"
            @click="dialogComentario = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="savingComentario"
            @click="guardarComentario"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DDDDDDDDDDDDDDDDD -->
    <v-dialog
      v-model="dialogCambiarExpediente"
      max-width="500"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2 d-flex align-center flex-wrap">
          Cambiar expediente (House)
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogCambiarExpediente = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-form
          :readonly="false"
          :disabled="false"
        >
          <v-card-text>
            <v-autocomplete
              :items="mastersForHouse"
              :readonly="false"
              v-model="selectedNuevoExpediente"
              item-value="id"
              item-title="code_master"
              label="Seleccione nuevo expediente"
              variant="outlined"
              class="my-5"
            />
            <p class="text-body-small mb-0">
              Actual: {{ house.code_house }}
            </p>
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            color="red"
            @click="dialogCambiarExpediente = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedNuevoExpediente"
            @click="aplicarCambioExpediente"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.master-houses {
  border: 1px solid #dbe4ee;
}
.master-houses__tabs {
  border-bottom: 1px solid #e5ebf2;
}
.master-houses__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin: 8px 12px;
}
.master-houses__kpi {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
}
.master-houses__kpi + .master-houses__kpi {
  border-left: 1px solid #e5ebf2;
}
.master-houses__kpi-label {
  font-size: 12px;
  color: #4b5563;
}
.master-houses__kpi-value {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}
.master-houses__table-wrap {
  margin: 0 12px;
  overflow-x: auto;
}
.master-houses__table :deep(thead th) {
  background: #eef2f6 !important;
  font-weight: 700 !important;
  color: #1f2937 !important;
}
.master-houses__table :deep(tbody td) {
  font-size: 13px;
}

.master-houses__cards {
  display: none;
}
.master-houses__card {
  padding: 10px 12px;
  border: 1px solid #e5ebf2;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
.master-houses__card + .master-houses__card {
  margin-top: 8px;
}
.master-houses__card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.master-houses__card-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #eef2f6;
  font-size: 12px;
  font-weight: 700;
}
.master-houses__card-code {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}
.master-houses__card-inco {
  padding: 2px 8px;
  border-radius: 999px;
  background: #e8f1fb;
  color: #1e6fd9;
  font-size: 12px;
  font-weight: 700;
}
.master-houses__card-client {
  margin: 6px 0;
  font-size: 13px;
  color: #374151;
}
.master-houses__card-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 12px;
}
.master-houses__card-metrics span {
  display: block;
  font-size: 11px;
  color: #6b7280;
}
.master-houses__card-metrics strong {
  font-size: 13px;
  color: #111827;
}
.master-houses__card-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

@media (max-width: 600px) {
  .master-houses__kpis {
    margin: 4px 8px;
  }
  .master-houses__kpi {
    padding: 8px;
  }
  .master-houses__kpi + .master-houses__kpi {
    border-left: 0;
    border-top: 1px solid #e5ebf2;
  }
  .master-houses__table-wrap {
    display: none;
  }
  .master-houses__cards {
    display: block;
    /* deja espacio para el botón flotante */
    margin: 0 8px 72px;
  }
}
</style>
