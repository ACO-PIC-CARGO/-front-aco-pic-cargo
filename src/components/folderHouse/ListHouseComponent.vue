<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import moment from "moment";
import { useHousesStore } from "@/stores/houses";
import { useMastersStore } from "@/stores/masters";
import { usePricingStore } from "@/stores/pricing";
import type { HouseListado } from "@/types/cotizacion";
import { sessionBranchId, sessionUserIdOrEmpty } from "@/utils/sesion";

defineProps<{ statusReport?: boolean; statusList?: string }>();

const rootStore = useStore();
const router = useRouter();
const housesStore = useHousesStore();
const pricingStore = usePricingStore();
const mastersStore = useMastersStore();

const search = ref("");
const dialogUrl = ref(false);
const url_folderonedrive = ref("");
const houseEditar = ref<HouseListado>({} as HouseListado);
const expanded = ref([]);
const headers = [
  { title: "Master", key: "code_master" },
  { title: "Nro BL House", key: "nro_hbl", align: "start" },
  { title: "Cotización", key: "quote_number" },
  { title: "Sentido", key: "namemodality" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },
  { title: "Proveedor", key: "nameproveedor" },
  { title: "Cliente del House", key: "nameconsigner" },
  { title: "Salida ETD", key: "fecha_etd" },
  { title: "Llegada ETA", key: "fecha_eta" },
  { title: "Naviera", key: "naviera" },
  { title: "Acciones", key: "actions", sortable: false },
] as const;
const pagination = undefined as unknown as { page: number };
const dialogComentario = ref(false);
const loading = ref(false);
const house = ref<HouseListado>({} as HouseListado);
const fecha = ref(moment().format("YYYY-MM-DD"));
const id_vendedor = ref<number | string>("");
const frmComentario = useTemplateRef("frmComentario");
const comentario = ref("");

function abrirCaperta(item: HouseListado) {
  console.log("item:", item);
  houseEditar.value = { ...item };
  url_folderonedrive.value = "";
  dialogUrl.value = true;
  // window.open(url, "_blank");
}
async function actualizarUrl() {
  await mastersStore.actualizarURLEnElMaster({
    id: houseEditar.value.id,
    url: url_folderonedrive.value,
  });
  houseEditar.value.url_folderonedrive = url_folderonedrive.value;
  dialogUrl.value = false;
  setTimeout(async () => {
    await housesStore.listarHouse(rootStore.state.house_filtro);
  }, 1000);
}
function to_link({ url = "" }: { url?: string }) {
  window.open(url, "_blank");
}
function editHouse(id: number) {
  router.push("/home/folderHouse/control/editar/" + id);
}
function viewHouse(id: number) {
  router.push("/home/folderHouse/control/ver/" + id);
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
    rootStore.state.spiner = true;

    await housesStore.insertComentarioHouse({
      id_house: house.value.id,
      id_entities: id_vendedor.value,
      fecha: fecha.value,
      comentario: comentario.value,
    });

    dialogComentario.value = !dialogComentario.value;

    await rootStore.dispatch("_getHouseListAll");

    rootStore.state.spiner = false;
    loading.value = false;
  }
}

onMounted(async () => {
  rootStore.state.spiner = true;

  await housesStore.listarHouse(rootStore.state.house_filtro);
  // await this._getHouseListAll();
  rootStore.state.spiner = false;
  await Promise.all([
    rootStore.dispatch("_getTotalHouseListAll"),
    pricingStore.getModulesEntities(),
    rootStore.dispatch("_getModality"),
    rootStore.dispatch("_getShipment"),
    rootStore.dispatch("cargarClientes"),
    rootStore.dispatch("_getMasterList"),
  ]);
});
</script>

<template>
  <div>
    <v-card elevation="0">
      <v-card-title>
        <v-row>
          <v-col
            cols="12"
            lg="6"
            xl="6"
          >
            <v-text-field
              v-model="search"
              label="Buscar"
              single-line
              hide-details
              prepend-icon="mdi-magnify"
            />
          </v-col>
          <v-col
            cols="12"
            lg="6"
            xl="6"
          >
            <v-btn
              color="secondary"
              elevation="0"
              @click="
                rootStore.state.house_filtrarData = !rootStore.state.house_filtrarData
              "
            >
              FILTRAR
            </v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="housesStore.listHouse"
        :search="search"
        expand-on-click
        v-model:expanded="expanded"
        item-value="id"
        disable-sort
      >
        <template #expanded-row="{ columns, item }">
          <tr>
            <td
              :colspan="columns.length"
              class="py-3 px-3"
              v-if="item.list_comentarios.length > 0 && item.status != 0"
            >
              <v-table v-if="item.list_comentarios.length > 0">
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

        <template #[`item.quote_number`]="{ item }">
          <v-chip
            v-if="item.quote_number"
            color="primary"
            size="small"
            @click.stop="verCotizacion(item.id_quote)"
            class="cursor-pointer"
          >
            <v-icon
              size="small"
              start
            >
              mdi-file-document-outline
            </v-icon>
            {{ item.quote_number }}
          </v-chip>
          <span
            v-else
            class="text-grey-lighten-1"
          >Sin cotización</span>
        </template>

        <template #[`item.actions`]="{ item }">
          <div class="d-flex">
            <v-icon
              v-if="statusList != '2'"
              color="secondary"
              class="mr-1"
              @click.stop="abrirModalComentario(item)"
            >
              mdi-chat-plus
            </v-icon>

            <v-icon
              color="#FFD600"
              class="mr-1"
              @click.stop="abrirCaperta(item)"
            >
              mdi-folder
            </v-icon>

            <v-icon
              v-if="statusList != '2'"
              color="info"
              class="mr-1"
              aria-label="Ver house"
              @click.stop="viewHouse(item.id)"
            >
              mdi-eye
            </v-icon>

            <v-icon
              v-if="statusList != '2'"
              color="orange"
              class="mr-1"
              @click.stop="editHouse(item.id)"
            >
              mdi-pencil
            </v-icon>

            <v-icon
              v-if="statusList == '2'"
              size="large"
              color="primary"
              class="mr-1"
              @click.stop="selectHouse(item)"
            >
              mdi-cursor-default-click
            </v-icon>
          </div>
        </template>
      </v-data-table>
      <v-container>
        <v-row>
          <v-col>
            <v-btn
              v-if="statusReport"
              color="primary"
              elevation="0"
            >
              GENERAR REPORTE {{ pagination.page }}
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
    <v-dialog
      v-model="dialogUrl"
      scrollable
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title> Actualizar URL Carpeta </v-card-title>
        <v-card-text>
          <v-btn
            color="success"
            size="small"
            :disabled="!houseEditar.url_folderonedrive"
            @click="to_link({ url: houseEditar.url_folderonedrive })"
          >
            Abrir <v-icon class="mx-1">
              mdi-folder-open-outline
            </v-icon>
          </v-btn>
          <v-divider class="my-3" />
          <v-text-field
            label="Nueva URL"
            id="id"
            v-model="url_folderonedrive"
            append-inner-icon="mdi-folder-check"
            @click:append-inner="actualizarUrl"
          />
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="error"
              @click="dialogUrl = false"
            >
              Cerrar
            </v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>


