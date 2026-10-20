<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import axios from "@/api/http";
import { useHousesStore } from "@/stores/houses";
import type { HouseDeMaster } from "@/types/operacionesMaster";

const emit = defineEmits<{ recargarDatos: [] }>();

const rootStore = useStore();
const route = useRoute();
const router = useRouter();
const housesStore = useHousesStore();

const openExpand = ref(0);
const showAll = ref(false);
const activeTab = ref(0);
const flagCambiarExpediente = ref(false);
const dialogCambiarExpediente = ref(false);
const selectedNuevoExpediente = ref<number | number[] | null>([]);
const house = ref<HouseDeMaster>({} as HouseDeMaster);

const displayedItems = computed(() => {
  const list = rootStore.state.itemsHouseList || [];
  return showAll.value ? list : list.slice(0, 3);
});
const masterComments = computed(() => {
  const masterId =
    rootStore.state.master_insertId || rootStore.state.master_Id_get;
  if (!masterId) return [];

  if (
    rootStore.state.rowMaster &&
    rootStore.state.rowMaster.list_comentarios
  ) {
    return rootStore.state.rowMaster.list_comentarios;
  }

  if (rootStore.state.itemsMasterList) {
    const masterItem = rootStore.state.itemsMasterList.find(
      (m: { id: number }) => m.id == masterId,
    );
    return masterItem && masterItem.list_comentarios
      ? masterItem.list_comentarios
      : [];
  }

  return [];
});
const totalHouses = computed(() => {
  const list = rootStore.state.itemsHouseList || [];
  return list.length;
});
const totalPesoHouse = computed(() => {
  const list = rootStore.state.itemsHouseList || [];
  const total = list.reduce(
    (acc: number, it: HouseDeMaster) => acc + (parseFloat(String(it.peso)) || 0),
    0,
  );
  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
});
const totalVolumenHouse = computed(() => {
  const list = rootStore.state.itemsHouseList || [];
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
const esAereo = computed(() => {
  const st = rootStore.state;
  const id =
    st.master_id_trasnport && st.master_id_trasnport.id
      ? st.master_id_trasnport.id
      : st.master_id_trasnport;
  const items = st.itemsShipment || [];
  const it = items.find((v: { id: number; code: string }) => v.id == id);
  return it && it.code === "Aéreo";
});

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
  const targetLabel = rootStore.state.itemsMasterList.find(
    (x: { id: number }) => x.id === selectedNuevoExpediente.value,
  ).code_master;
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
    flagCambiarExpediente.value = false;
    dialogCambiarExpediente.value = false;
    emit("recargarDatos");
    if (response && response.data && response.data.estadoflag) {
      await Swal.fire({ icon: "success", text: "Expediente actualizado" });
      dialogCambiarExpediente.value = false;
      flagCambiarExpediente.value = true;
      emit("recargarDatos");
      // await this.getListControlGastos(this.$route.params.id);
    } else {
      await Swal.fire({
        icon: "warning",
        text:
          (response && response.data && response.data.mensaje) ||
          "No se pudo reasignar el expediente. Se requiere soporte de backend.",
      });
    }
  } catch (error) {
    console.error(error);
    await Swal.fire({
      icon: "info",
      text: "Endpoint para reasignar house a otro master no disponible. Front listo; requerirá habilitar API (PUT reasignar_house).",
    });
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
    const incoterms = rootStore.state.itemsIncoterms || [];
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

watch(() => rootStore.state.itemsHouseList, () => {
  openExpand.value = 0;
});

onMounted(async () => {
  await rootStore.dispatch("_getMasterList");
  nextTick(() => {
    openExpand.value = 0;
  });
});
</script>

<template>
  <div>
    <v-expansion-panels v-model="openExpand">
      <v-expansion-panel>
        <v-expansion-panel-text>
          <v-tabs
            v-model="activeTab"
            bg-color="transparent"
            color="primary"
          >
            <v-tab key="houses">
              <v-icon start>
                mdi-home-group
              </v-icon>
              Lista de House
            </v-tab>
            <v-tab key="comments">
              <v-icon start>
                mdi-comment-text-multiple
              </v-icon>
              Comentarios
            </v-tab>
          </v-tabs>

          <v-tabs-window v-model="activeTab">
            <v-tabs-window-item key="houses">
              <v-row density="compact">
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    :model-value="totalHouses"
                    label="Total de House"
                    readonly
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    :model-value="totalPesoHouse"
                    label="Total de House Peso"
                    suffix="kg"
                    readonly
                  />
                </v-col>
                <v-col
                  cols="12"
                  md="3"
                >
                  <v-text-field
                    :model-value="totalVolumenHouse"
                    label="Total de House Volumen"
                    suffix="m3"
                    readonly
                  />
                </v-col>
              </v-row>
              <div
                v-if="
                  rootStore.state.itemsHouseList &&
                    rootStore.state.itemsHouseList.length > 3 &&
                    !showAll
                "
                class="mb-2"
              >
                <v-btn
                  color="info"
                  @click="showAll = true"
                >
                  Leer más
                </v-btn>
              </div>
              <v-table>
                <template #default>
                  <thead>
                    <tr>
                      <th>Listado</th>
                      <th>Código</th>
                      <th>Cliente</th>
                      <th>Incoterm</th>
                      <th>Peso</th>
                      <th>Volumen</th>
                      <th v-if="esAereo">
                        Peso volumétrico
                      </th>
                      <th v-if="esAereo">
                        Peso Cargable
                      </th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in displayedItems"
                      :key="index"
                      @click="showHouse(item.id)"
                      style="cursor: pointer"
                    >
                      <td>{{ (index as number) + 1 }}</td>
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
                      <td>{{ item.peso || 0 }}</td>
                      <td>{{ item.volumen || 0 }}</td>
                      <td v-if="esAereo">
                        {{ computePesoVolumetrico(item) }}
                      </td>
                      <td v-if="esAereo">
                        {{ computePesoCargable(item) }}
                      </td>
                      <td>
                        <v-btn
                          variant="text"
                          icon
                          color="info"
                        >
                          <v-icon @click.stop="showHouse(item.id)">
                            mdi-open-in-new
                          </v-icon>
                        </v-btn>
                        <v-btn
                          variant="text"
                          icon
                          color="red"
                        >
                          <v-icon @click.stop="eliminar(item.id)">
                            mdi-delete
                          </v-icon>
                        </v-btn>
                        <v-btn
                          variant="text"
                          icon
                          color="#F57F17"
                        >
                          <v-icon
                            @click.stop="abrirModalCambiarExpediente(item)"
                          >
                            mdi-folder-arrow-up-down
                          </v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-table>
            </v-tabs-window-item>

            <v-tabs-window-item key="comments">
              <v-table
                v-if="masterComments && masterComments.length > 0"
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
                    class="bg-comentarios"
                  >
                    <td class="bg-comentarios">
                      {{ comment.fecha }}
                    </td>
                    <td class="bg-comentarios">
                      {{ comment.ejecutivo }}
                    </td>
                    <td class="bg-comentarios">
                      {{ comment.comentario }}
                    </td>
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
            </v-tabs-window-item>
          </v-tabs-window>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

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
              :items="
                rootStore.state.itemsMasterList.filter(
                  (v: { id: number | string }) => v.id != route.params.id,
                )
              "
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


