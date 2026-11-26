<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import moment from "moment";
import { useHousesStore } from "@/stores/houses";
import { usePricingStore } from "@/stores/pricing";
import GuardarUrlMaster from "@/components/comun/GuardarUrlMaster.vue";
import type { HouseListado } from "@/types/cotizacion";
import type { RegistroConUrlCarpeta } from "@/types/archivos";
import { sessionBranchId, sessionUserIdOrEmpty } from "@/utils/sesion";
import { usePermissions } from "@/composables/usePermissions";

const props = defineProps<{ statusReport?: boolean; statusList?: string }>();

const appStore = useAppStore();
const router = useRouter();
const housesStore = useHousesStore();
const pricingStore = usePricingStore();
const { can } = usePermissions();
const canEditFolder = can(props.statusList == "2" ? "listControlGastos" : "listHouse", "MODIFICAR");

const search = ref("");
const dialogUrl = ref(false);
const folderMaster = ref<RegistroConUrlCarpeta>({});
const expanded = ref([]);
const headers = [
  { title: "Expediente Master", key: "code_master" },
  { title: "Cliente del House", key: "nameconsigner" },
  { title: "Proveedor", key: "nameproveedor" },
  { title: "Nro. BL House", key: "nro_hbl" },
  { title: "Cotización", key: "quote_number", align: "center" },
  { title: "Sentido", key: "namemodality" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },
  { title: "Salida ETD", key: "fecha_etd" },
  { title: "Llegada ETA", key: "fecha_eta" },
  { title: "N° Declaración de Aduana", key: "nro_declaracion_aduana" },
  { title: "Naviera", key: "naviera" },
  { title: "Canal de Aduana", key: "canal_aduana", align: "center" },
  { title: "Acciones", key: "actions", sortable: false, align: "center" },
] as const;
const page = ref(1);
const itemsPerPage = ref(10);
const itemsPerPageOptions = [
  { value: 10, title: "10" },
  { value: 25, title: "25" },
  { value: 50, title: "50" },
  { value: 100, title: "100" },
];
const canalColors: Record<string, string> = { VERDE: "green", NARANJA: "orange", AMARILLO: "amber", ROJO: "red" };
function canalColor(canal?: string) {
  return canalColors[(canal ?? "").trim().toUpperCase()] ?? "grey";
}
const dialogComentario = ref(false);
const loading = ref(false);
const house = ref<HouseListado>({} as HouseListado);
const fecha = ref(moment().format("YYYY-MM-DD"));
const id_vendedor = ref<number | "">("");
const frmComentario = useTemplateRef("frmComentario");
const comentario = ref("");

function abrirCaperta(item: HouseListado) {
  folderMaster.value = { id: item.id_master, url_folderonedrive: item.url_folderonedrive };
  dialogUrl.value = true;
}
async function cerrarCarpeta() {
  dialogUrl.value = false;
  await housesStore.listarHouse(housesStore.house_filtro);
}
// The house guard loads the house before the screen changes: show the spinner meanwhile so a click is not repeated.
async function openHouse(path: string) {
  if (appStore.spiner) return;
  appStore.spiner = true;
  try {
    await router.push(path);
  } finally {
    if (router.currentRoute.value.name === "listHouse") appStore.spiner = false;
  }
}
function editHouse(id: number) {
  openHouse("/home/folderHouse/control/editar/" + id);
}
function viewHouse(id: number) {
  openHouse("/home/folderHouse/control/ver/" + id);
}
function verCotizacion(id_quote?: number) {
  if (id_quote) {
    router.push(`/home/folderPricing/verQuote/${id_quote}`);
  }
}
function selectHouse(houseItem: HouseListado) {
  router.push({
    name: "editControlGasto",
    params: {
      id: houseItem.id_master,
      id_branch: sessionBranchId(),
    },
  });
}
function abrirModalComentario(item: HouseListado) {
  dialogComentario.value = true;
  house.value = item;
  id_vendedor.value = sessionUserIdOrEmpty();
  comentario.value = "";
}
async function guardarComentario() {
  if ((await frmComentario.value!.validate()).valid) {
    loading.value = true;
    appStore.spiner = true;

    await housesStore.insertComentarioHouse({
      id_house: house.value.id,
      id_entities: id_vendedor.value,
      fecha: fecha.value,
      comentario: comentario.value,
    });

    dialogComentario.value = !dialogComentario.value;

    await housesStore.listarHouse(housesStore.house_filtro);

    appStore.spiner = false;
    loading.value = false;
  }
}

onMounted(async () => {
  appStore.spiner = true;

  await housesStore.listarHouse(housesStore.house_filtro);
  appStore.spiner = false;
  await Promise.all([
    pricingStore.getModulesEntities(),
    appStore._getModality(),
    appStore._getShipment(),
    appStore.cargarClientes(),
    appStore._getMasterList(),
  ]);
});
</script>

<template>
  <div>
    <v-card elevation="0">
      <v-card-text class="pt-4 pb-2">
        <div class="d-flex align-center flex-wrap ga-4">
          <v-text-field
            v-model="search"
            placeholder="Buscar"
            variant="solo-filled"
            flat
            density="compact"
            hide-details
            prepend-icon="mdi-magnify"
            class="list-house__search"
            @update:model-value="page = 1"
          />
          <v-btn
            color="primary"
            elevation="0"
            @click="housesStore.house_filtrarData = !housesStore.house_filtrarData"
          >
            FILTRAR
          </v-btn>
        </div>
      </v-card-text>

      <v-data-table
        class="list-house"
        :headers="headers"
        :items="housesStore.listHouse"
        :search="search"
        v-model:page="page"
        v-model:items-per-page="itemsPerPage"
        :items-per-page-options="itemsPerPageOptions"
        expand-on-click
        v-model:expanded="expanded"
        item-value="id"
        density="compact"
        hover
      >
        <template #expanded-row="{ columns, item }">
          <tr v-if="item.list_comentarios?.length && item.status != 0">
            <td
              :colspan="columns.length"
              class="py-3 px-3"
            >
              <v-table density="compact">
                <thead>
                  <tr>
                    <th width="10%">
                      Fecha
                    </th>
                    <th width="20%">
                      Ejecutivo
                    </th>
                    <th width="70%">
                      Comentario
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(c, index) in item.list_comentarios"
                    :key="index"
                    class="bg-comentarios"
                  >
                    <td class="bg-comentarios">
                      {{ c.fecha }}
                    </td>
                    <td class="bg-comentarios">
                      {{ c.ejecutivo }}
                    </td>
                    <td class="bg-comentarios">
                      {{ c.comentario }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </td>
          </tr>
        </template>

        <template #[`item.code_master`]="{ item }">
          <span class="font-weight-medium text-no-wrap">{{ item.code_master }}</span>
        </template>

        <template #[`item.nameproveedor`]="{ item }">
          <span class="list-house__proveedor">{{ item.nameproveedor }}</span>
        </template>

        <template #[`item.quote_number`]="{ item }">
          <v-chip
            v-if="item.quote_number"
            color="primary"
            variant="flat"
            size="small"
            class="cursor-pointer"
            @click.stop="verCotizacion(item.id_quote)"
          >
            <v-icon
              size="small"
              start
            >
              mdi-file-document-outline
            </v-icon>
            {{ item.quote_number }}
            <v-icon
              size="small"
              end
            >
              mdi-eye
            </v-icon>
          </v-chip>
          <span
            v-else
            class="text-grey-lighten-1 text-no-wrap"
          >Sin cotización</span>
        </template>

        <template #[`item.fecha_etd`]="{ item }">
          <span class="text-no-wrap">{{ item.fecha_etd }}</span>
        </template>

        <template #[`item.fecha_eta`]="{ item }">
          <span class="text-no-wrap">{{ item.fecha_eta }}</span>
        </template>

        <template #[`item.nro_declaracion_aduana`]="{ item }">
          <span class="text-no-wrap">{{ item.nro_declaracion_aduana }}</span>
        </template>

        <template #[`item.canal_aduana`]="{ item }">
          <v-chip
            v-if="item.canal_aduana"
            :color="canalColor(item.canal_aduana)"
            variant="flat"
            size="small"
            class="list-house__canal font-weight-bold"
          >
            {{ item.canal_aduana.toUpperCase() }}
          </v-chip>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex align-center justify-center ga-1">
            <v-icon
              v-if="statusList != '2' && can('listHouse', 'NUEVO')"
              color="primary"
              size="small"
              title="Agregar comentario"
              @click.stop="abrirModalComentario(item)"
            >
              mdi-chat-plus
            </v-icon>

            <v-icon
              color="#FFD600"
              size="small"
              title="Carpeta"
              @click.stop="abrirCaperta(item)"
            >
              mdi-folder
            </v-icon>

            <v-icon
              v-if="statusList != '2'"
              color="primary"
              size="small"
              title="Ver house"
              aria-label="Ver house"
              @click.stop="viewHouse(item.id)"
            >
              mdi-eye-outline
            </v-icon>

            <v-icon
              v-if="statusList != '2' && can('listHouse', 'MODIFICAR')"
              color="orange"
              size="small"
              title="Editar house"
              @click.stop="editHouse(item.id)"
            >
              mdi-pencil
            </v-icon>

            <v-icon
              v-if="statusList == '2'"
              size="large"
              color="primary"
              @click.stop="selectHouse(item)"
            >
              mdi-cursor-default-click
            </v-icon>
          </div>
        </template>
      </v-data-table>
      <v-container v-if="statusReport">
        <v-row>
          <v-col>
            <v-btn
              color="primary"
              elevation="0"
            >
              GENERAR REPORTE {{ page }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>

      <v-dialog
        v-model="dialogComentario"
        persistent
        width="50%"
      >
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap">
            Registro de Estado/ Comentario - {{ house.code_house }}
            <v-spacer />
            <v-btn
              variant="text"
              icon
              color="default"
              @click="dialogComentario = !dialogComentario"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-form ref="frmComentario">
              <v-text-field
                label="Fecha"
                v-model="fecha"
                type="date"
                readonly
              />
              <v-autocomplete
                label="Ejecutivo"
                :items="pricingStore.listEjecutivo"
                item-title="name"
                item-value="id_entitie"
                v-model="id_vendedor"
                :rules="[(v) => !!v || 'Dato requerido']"
              />
              <v-textarea
                label="Estado/ Comentario"
                v-model="comentario"
                rows="4"
                auto-grow
                :rules="[(v) => !!v || 'Dato requerido']"
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              size="small"
              color="success"
              @click="guardarComentario"
              :loading="loading"
            >
              Guardar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-card>
    <GuardarUrlMaster
      :dialog-url="dialogUrl"
      :master-editar="folderMaster"
      :editable="canEditFolder"
      @cerrar="cerrarCarpeta"
    />
  </div>
</template>

<style scoped>
.list-house__search {
  max-width: 640px;
}
.list-house :deep(thead th) {
  background: #f1f3f5 !important;
  font-weight: 700 !important;
  font-size: 0.8rem;
  line-height: 1.2;
  white-space: normal;
}
.list-house :deep(tbody td) {
  font-size: 0.8rem;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
.list-house__proveedor {
  display: block;
  min-width: 200px;
  max-width: 260px;
  font-size: 0.75rem;
  line-height: 1.25;
}
.list-house__canal {
  min-width: 80px;
  justify-content: center;
}
</style>
