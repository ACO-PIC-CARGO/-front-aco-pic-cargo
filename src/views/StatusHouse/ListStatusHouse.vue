<script setup lang="ts">
import { nextTick, onMounted, ref, useTemplateRef } from "vue";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import { useStatushouseStore } from "@/stores/statushouse";
import type { ComentarioEstadoHouse, EstadoHouse } from "@/types/catalogos";

const statushouseStore = useStatushouseStore();
const { listStatusHouse, orden } = storeToRefs(statushouseStore);
const appStore = useAppStore();
const pricingStore = usePricingStore();

const filtrar = ref(false);
const loadingTable = ref(false);
const lstStatus = ref<EstadoHouse[]>([]);
const dialogOrden = ref(false);
const dialog = ref(false);
const search = ref("");
const name = ref("");
const id = ref<number | string>("");
const exw = ref(false);
const fob = ref(false);
const fca = ref(false);
const cfr = ref(false);
const cif = ref(false);
const ddp = ref(false);
const headerEstado = [
  { title: "Nombre", key: "name", sortable: false },
  { key: "exw", title: "EXW", sortable: false },
  { key: "fob", title: "fob", sortable: false },
  { key: "fca", title: "FCA", sortable: false },
  { key: "cfr", title: "CFR", sortable: false },
  { key: "cif", title: "CIF", sortable: false },
  { key: "ddp", title: "DDP", sortable: false },
  { title: "Orden", key: "orden", sortable: false },
] as const;
const headers = [
  { key: "modalidad", title: "Modalidad", sort: false },
  { key: "shipment", title: "Tipo de Embarque", sort: false },
  { key: "name", title: "Status", sort: false },
  { key: "comentarios", title: "Comentarios", sort: false },
  { key: "exw", title: "EXW", sort: false },
  { key: "fob", title: "FOB", sortable: false },
  { key: "fca", title: "FCA", sort: false },
  { key: "cfr", title: "CFR", sort: false },
  { key: "cif", title: "CIF", sort: false },
  { key: "ddp", title: "DDP", sort: false },
  { key: "orden", title: "Orden", sort: false },
  { key: "action", title: "", sort: false },
] as const;
const items = ref<ComentarioEstadoHouse[]>([]);
const id_modality = ref<number | string>("");
const id_shipment = ref<number | string>("");
const nroorden = ref<number | string | undefined>("");
const errorInconterms = ref("");
const frmStatus = useTemplateRef("frmStatus");
const frmOrdenEstatus = useTemplateRef("frmOrdenEstatus");

function eliminarComentario(comentario: ComentarioEstadoHouse) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, eliminarlo!",
  }).then(async (result) => {
    if (result.isConfirmed) {
      appStore.spiner = true;
      await statushouseStore.EliminarComentario(comentario);
      appStore.spiner = false;
      dialog.value = false;
    }
  });
}
function eliminar(estado: EstadoHouse) {
  Swal.fire({
    title: "¿Estás seguro?",
    text: "¡No podrás revertir esto!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Sí, eliminarlo!",
  }).then(async (result) => {
    if (result.isConfirmed) {
      appStore.spiner = true;
      await statushouseStore.EliminarStatus(estado);
      appStore.spiner = false;
    }
  });
}
function nuevoStatus() {
  dialog.value = true;
  id.value = "";
  items.value = [];
  nextTick(() => {
    frmStatus.value!.reset();
  });
}
async function filtrarListado() {
  const data = {
    id_modalidad: id_modality.value,
    id_shipment: id_shipment.value,

    // exwflag: this.exw,
    // fcaflag: this.fca,
    // fobflag: this.fob,
    // cfrflag: this.cfr,
    // cifflag: this.cif,
    // ddpflag: this.ddp,
  };
  await statushouseStore.getListStatusHouse(data);
  filtrar.value = false;
}
function moveUp(index: number) {
  const item = items.value[index]!;
  items.value.splice(index, 1);
  items.value.splice(index - 1, 0, item);
}
function moveDown(index: number) {
  const item = items.value[index]!;
  items.value.splice(index, 1);
  items.value.splice(index + 1, 0, item);
}
function abrirModalOrden() {
  lstStatus.value = [];
  dialogOrden.value = true;
  nextTick(() => {
    frmOrdenEstatus.value!.reset();
  });
}
async function buscarEstatusPorModalidadYEmbarque() {
  if ((await frmOrdenEstatus.value!.validate()).valid) {
    lstStatus.value = [];
    lstStatus.value = [
      ...listStatusHouse.value.filter((v) => v.id_modalidad == id_modality.value && v.id_shipment == id_shipment.value),
    ];
  }
}
function cambiarOrdenEstado(index: number) {
  const elementoModificado = lstStatus.value[index]!;
  const nuevoOrden = parseFloat(String(elementoModificado.orden));

  if (isNaN(nuevoOrden) || nuevoOrden <= 0) {
    console.warn("El orden debe ser un número positivo.");
    return;
  }

  // Mostrar un indicador visual de "calculando" (opcional)
  loadingTable.value = true;

  // Agregar un pequeño retraso
  setTimeout(() => {
    const lstSinElemento = lstStatus.value.filter((_, i) => i !== index);

    let ordenActual = 1;
    const lstReordenada = lstSinElemento.map((element) => {
      if (ordenActual === nuevoOrden) ordenActual++;
      return { ...element, orden: ordenActual++ };
    });

    lstReordenada.splice(nuevoOrden - 1, 0, {
      ...elementoModificado,
      orden: nuevoOrden,
    });

    lstStatus.value = [];
    nextTick(() => {
      lstStatus.value = lstReordenada;

      // Ocultar el indicador de "calculando" (opcional)
      loadingTable.value = false;

      // Enfocar el campo
      nextTick(() => {
        const input = document.querySelector<HTMLInputElement>(`[data-index="${nuevoOrden - 1}"] input`);
        if (input) {
          input.focus();
          input.select();
        }
      });
    });
  }, 500); // Retraso de 500 ms
}
async function obtenerOrden() {
  if (id_modality.value && id_shipment.value) {
    await statushouseStore.getObtenerOrdenStatusHouse({
      id_modalidad: id_modality.value,
      id_shipment: id_shipment.value,
    });
    const ordenActual = { ...orden.value };
    nroorden.value = ordenActual.orden;
  }
}
function anadirComentario() {
  items.value.push({ descripcion: "" });
}
async function guardarStatus() {
  errorInconterms.value = "";
  if ((await frmStatus.value!.validate()).valid) {
    if (!exw.value && !fca.value && !cfr.value && !cif.value && !ddp.value) {
      errorInconterms.value = "Es necesario seleccionar al menos un Incoterms";
      return false;
    }
    items.value.map((item, index) => {
      item.orden = index + 1;
    });
    const data = {
      id: id.value,
      id_modality: id_modality.value,
      id_shipment: id_shipment.value,
      name: name.value,
      nroorden: nroorden.value,
      exw: exw.value,
      fob: fob.value,
      fca: fca.value,
      cfr: cfr.value,
      cif: cif.value,
      ddp: ddp.value,
      lstComentatios: items.value,
    };
    await statushouseStore.GuardarStatusHouse(data);
    dialog.value = false;
  }
}
function editar(item: EstadoHouse) {
  dialog.value = true;
  id.value = item.id;
  id_modality.value = item.id_modalidad;
  id_shipment.value = item.id_shipment;
  name.value = item.name;
  exw.value = item.exwflag;
  fob.value = item.fobflag;
  fca.value = item.fcaflag;
  cfr.value = item.cfrflag;
  cif.value = item.cifflag;
  ddp.value = item.ddpflag;
  items.value = item.comentarios;
  nroorden.value = item.orden;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mostrarComentario(item: EstadoHouse) {
   
  item.verComentarios = item.verComentarios;
}
async function guardarOrden() {
  await statushouseStore.GuardarStatus(lstStatus.value);
  dialogOrden.value = false;
}

onMounted(async () => {
  appStore.spiner = true;
  await statushouseStore.getListStatusHouse();
  appStore.spiner = false;
  await pricingStore.getModality();
  await pricingStore.getShipment();
});
</script>

<template>
  <v-card>
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <v-card-title
            class="d-flex align-center flex-wrap"
            primary-title
          >
            <v-text-field
              label="Buscar..."
              v-model="search"
            />
            <v-spacer />
            <v-btn
              color="success"
              size="small"
              class="mx-2"
              @click="nuevoStatus()"
            >
              CREAR ESTATUS
              <v-icon
                class="ml-1"
                size="small"
              >
                mdi-plus
              </v-icon>
            </v-btn>
            <v-btn
              color="purple"
              size="small"
              class="mx-2"
              @click="abrirModalOrden()"
            >
              Cambiar Orden
              <v-icon
                class="ml-1"
                size="small"
              >
                mdi-swap-vertical
              </v-icon>
            </v-btn>
            <v-btn
              color="info"
              size="small"
              class="mx-2"
              @click="filtrar = !filtrar"
            >
              Filtrar <v-icon
                class="ml-1"
                size="small"
              >
                mdi-filter-outline
              </v-icon>
            </v-btn>
            <v-btn
              color="default"
              size="small"
              class="mx-2"
              @click="statushouseStore.getListStatusHouse()"
            >
              Limpiar <v-icon
                class="ml-1"
                size="small"
              >
                mdi-clean
              </v-icon>
            </v-btn>
          </v-card-title>
        </v-col>
        <v-col cols="12">
          <!-- @vue-expect-error the root state items are untyped until the Vuex store is typed -->
          <v-data-table
            :headers="headers"
            :items="listStatusHouse"
            item-value="id"
            :search="search"
          >
            <template #[`item.exw`]="{ item }">
              {{ item.exwflag ? "Si" : "No" }}
            </template>
            <template #[`item.fca`]="{ item }">
              {{ item.fcaflag ? "Si" : "No" }}
            </template>
            <template #[`item.cfr`]="{ item }">
              {{ item.cfrflag ? "Si" : "No" }}
            </template>
            <template #[`item.cif`]="{ item }">
              {{ item.cifflag ? "Si" : "No" }}
            </template>
            <template #[`item.fob`]="{ item }">
              {{ item.fobflag ? "Si" : "No" }}
            </template>
            <template #[`item.ddp`]="{ item }">
              {{ item.ddpflag ? "Si" : "No" }}
            </template>
            <template #[`item.comentarios`]="{ item }">
              <div
                class=""
                v-if="item.comentarios.length > 0"
              >
                <v-btn
                  color="success"
                  v-if="!item.verComentarios"
                  @click="item.verComentarios = !item.verComentarios"
                  size="x-small"
                >
                  Ver Comentarios
                </v-btn>
                <v-btn
                  color="warning"
                  v-else
                  @click="item.verComentarios = !item.verComentarios"
                  size="x-small"
                >
                  Ocultar Comentarios
                </v-btn>
                <ol
                  type="I"
                  v-if="item.verComentarios"
                >
                  <li
                    class="justify"
                    v-for="(comentario, index) in item.comentarios"
                    :key="index"
                  >
                    {{ comentario.descripcion }}
                  </li>
                </ol>
              </div>
            </template>
            <template #[`item.action`]="{ item }">
              <!-- <v-btn color="info" x-small @click="edi"> <v-icon dense>mdi-plus</v-icon> Comentario</v-btn> -->
              <v-btn
                size="x-small"
                color="warning"
                @click="editar(item)"
              >
                AÑADIR COMENTARIOS
              </v-btn>
              <v-btn
                class="mx-1"
                size="x-small"
                color="error"
                @click="eliminar(item)"
              >
                <v-icon size="28">
                  mdi-delete
                </v-icon>
              </v-btn>
              <!-- <v-btn color="error" icon @click="edi" > <v-icon dense>mdi-delete</v-icon></v-btn> -->
            </template>
          </v-data-table>
        </v-col>
      </v-row>
    </v-container>
    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      max-width="70%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          primary-title
          v-if="!id"
        >
          Agregar Status
        </v-card-title>
        <v-card-title
          primary-title
          v-else
        >
          Editar Status
        </v-card-title>
        <v-card-text>
          <v-form ref="frmStatus">
            <v-row>
              <v-col cols="6">
                <v-autocomplete
                  :items="pricingStore.listModality"
                  label="Sentido*"
                  item-title="name"
                  item-value="id"
                  v-model="id_modality"
                  @update:model-value="obtenerOrden()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="6">
                <v-autocomplete
                  :items="pricingStore.listShipment"
                  label="Tipo de Embarque*"
                  item-title="embarque"
                  item-value="id"
                  v-model="id_shipment"
                  @update:model-value="obtenerOrden"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Estatus"
                  v-model="name"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-if="nroorden"
                  label="Orden"
                  type="number"
                  v-model="nroorden"
                  :rules="[
                    (v) => !!v || 'Dato Requerido',
                    (v) => v > 0 || 'No puede ser 0 o menor',
                  ]"
                  min="1"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <h4>Incoterms</h4>
              </v-col>
              <v-col
                cols="12"
                v-if="errorInconterms"
              >
                <span class="text-red">
                  {{ errorInconterms }}
                </span>
              </v-col>
            </v-row>
            <v-row>
              <v-checkbox
                row
                label="EXW"
                class="mx-2"
                v-model="exw"
                :value="true"
              />
              <v-checkbox
                row
                label="FOB"
                class="mx-2"
                v-model="fob"
                :value="true"
              />
              <v-checkbox
                row
                label="FCA"
                class="mx-2"
                v-model="fca"
                :value="true"
              />
              <v-checkbox
                row
                label="CFR"
                class="mx-2"
                v-model="cfr"
                :value="true"
              />
              <v-checkbox
                row
                label="CIF"
                class="mx-2"
                v-model="cif"
                :value="true"
              />
              <v-checkbox
                row
                label="DDP"
                class="mx-2"
                v-model="ddp"
                :value="true"
              />
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn
                  color="success"
                  size="small"
                  @click="anadirComentario()"
                >
                  Añadir Comentario
                </v-btn>
              </v-col>
              <v-col cols="12">
                <v-table>
                  <thead>
                    <tr>
                      <th>Orden</th>
                      <th>Comentario</th>
                      <th>Mover</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(item, index) in items"
                      :key="index"
                    >
                      <td>{{ index + 1 }}</td>
                      <td>
                        <v-textarea
                          auto-grow
                          v-model="item.descripcion"
                          density="compact"
                          hide-details
                          variant="solo"
                          rows="1"
                        />
                      </td>
                      <td>
                        <v-btn
                          variant="text"
                          color="error"
                          icon
                          @click="moveUp(index)"
                          :disabled="index === 0"
                        >
                          <v-icon>mdi-arrow-up-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          variant="text"
                          color="success"
                          icon
                          @click="moveDown(index)"
                          :disabled="index === items.length - 1"
                        >
                          <v-icon>mdi-arrow-down-drop-circle-outline</v-icon>
                        </v-btn>
                        <v-btn
                          variant="text"
                          icon
                          color="error"
                          @click="eliminarComentario(item)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions v-if="!id">
          <v-spacer />
          <v-btn
            size="small"
            class="mx-1"
            color="success"
            @click="guardarStatus()"
          >
            Guardar
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            color="error"
            @click="dialog = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
        <v-card-actions v-else>
          <v-spacer />
          <v-btn
            size="small"
            class="mx-1"
            color="success"
            @click="guardarStatus()"
          >
            Actualizar
          </v-btn>
          <v-btn
            size="small"
            class="mx-1"
            color="error"
            @click="dialog = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogOrden"
      scrollable
      persistent
      width="80%"
    >
      <v-card>
        <v-card-title primary-title>
          Ordenar Estatus:
        </v-card-title>
        <v-card-text>
          <v-form ref="frmOrdenEstatus">
            <v-row>
              <v-col cols="4">
                <v-autocomplete
                  :items="pricingStore.listModality"
                  label="Sentido*"
                  item-title="name"
                  item-value="id"
                  v-model="id_modality"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-autocomplete
                  :items="pricingStore.listShipment"
                  label="Tipo de Embarque*"
                  item-title="embarque"
                  item-value="id"
                  v-model="id_shipment"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-btn
                  size="small"
                  color="info"
                  @click="buscarEstatusPorModalidadYEmbarque()"
                >
                  Buscar
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
          <v-row>
            <v-col cols="12">
              <v-data-table
                :headers="headerEstado"
                :items="lstStatus"
                class="elevation-1"
                item-value="index"
                :loading="loadingTable"
              >
                <template #[`item.exw`]="{ item }">
                  {{ item.exwflag ? "Si" : "No" }}
                </template>
                <template #[`item.fob`]="{ item }">
                  {{ item.fobflag ? "Si" : "No" }}
                </template>
                <template #[`item.fca`]="{ item }">
                  {{ item.fcaflag ? "Si" : "No" }}
                </template>
                <template #[`item.cfr`]="{ item }">
                  {{ item.cfrflag ? "Si" : "No" }}
                </template>
                <template #[`item.cif`]="{ item }">
                  {{ item.cifflag ? "Si" : "No" }}
                </template>
                <template #[`item.ddp`]="{ item }">
                  {{ item.ddpflag ? "Si" : "No" }}
                </template>
                <template #[`item.orden`]="{ item, index }">
                  <v-text-field
                    density="compact"
                    hide-details
                    v-model="item.orden"
                    type="number"
                    :min="0"
                    @update:model-value="cambiarOrdenEstado(index)"
                  />
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            class="mx-1"
            @click="guardarOrden()"
            size="small"
          >
            Guardar
          </v-btn>
          <v-btn
            color="error"
            class="mx-1"
            @click="dialogOrden = false"
            size="small"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="filtrar"
      location="right"
      
      width="30%"
      temporary
      class="px-5 py-5"
    >
      <template #prepend>
        FILTRAR
      </template>

      <v-divider />

      <v-autocomplete
        :items="pricingStore.listModality"
        label="Sentido*"
        item-title="name"
        item-value="id"
        v-model="id_modality"
        :rules="[(v) => !!v || 'Dato Requerido']"
      />

      <v-autocomplete
        :items="pricingStore.listShipment"
        label="Tipo de Embarque*"
        item-title="embarque"
        item-value="id"
        v-model="id_shipment"
        :rules="[(v) => !!v || 'Dato Requerido']"
      />
      <!-- <v-row>
        <v-checkbox
          row
          label="EXW"
          class="mx-2"
          v-model="exw"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="FOB"
          class="mx-2"
          v-model="fob"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="FCA"
          class="mx-2"
          v-model="fca"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="CFR"
          class="mx-2"
          v-model="cfr"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="CIF"
          class="mx-2"
          v-model="cif"
          :value="true"
        ></v-checkbox>
        <v-checkbox
          row
          label="DDP"
          class="mx-2"
          v-model="ddp"
          :value="true"
        ></v-checkbox>
      </v-row> -->
      <v-divider class="mb-5" />
      <v-btn
        color="success"
        class="mx-1"
        size="small"
        @click="filtrarListado()"
      >
        Filtrar
      </v-btn>
      <v-btn
        color="error"
        class="mx-1"
        size="small"
      >
        Cancelar
      </v-btn>
    </v-navigation-drawer>
  </v-card>
</template>

<style scoped>
.justify {
  text-align: justify;
}
</style>
