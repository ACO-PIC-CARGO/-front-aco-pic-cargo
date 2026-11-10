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
  // await this._getHouseListAll();
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
                housesStore.house_filtrarData = !housesStore.house_filtrarData
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
              v-if="item.list_comentarios?.length && item.status != 0"
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
              v-if="statusList != '2' && can('listHouse', 'NUEVO')"
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
              v-if="statusList != '2' && can('listHouse', 'MODIFICAR')"
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
    <GuardarUrlMaster
      :dialog-url="dialogUrl"
      :master-editar="folderMaster"
      :editable="canEditFolder"
      @cerrar="cerrarCarpeta"
    />
  </div>
</template>


