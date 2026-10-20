<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { getNombreCotizacion, usePricingStore } from "@/stores/pricing";
import type {
  DatosPrevisualizacion,
  FilaServicioNota,
} from "@/types/cotizacion";

const previewCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/previewQuote.vue"));

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const pricingStore = usePricingStore();

// opcionesSeleccionadas: [{ listNotasQuote: [] }],
const dialog = ref(false);
const headers = [
  { key: "index", title: "#" },
  { key: "description", title: "Descripción", align: "center" },
] as const;
const guardarFlag = ref(false);
const pagePrev = ref(1);
const tiporeporte = ref("");
const descripcion = ref("");
const predataCotizacion = ref<DatosPrevisualizacion | null>(null);
const dialogPreview = ref(false);
const previewFlag = ref(false);
const imprimirFlag = ref(false);
const loading = ref(false);
const dialogCambioNombreSecciones = ref(false);
const statusincluye = ref(0);
const statusnoincluye = ref(0);
const cambiarStatus = ref(false);
const selectedStatusId = ref<number | string | null>(null);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadingTable: boolean | undefined;
const frmNota = useTemplateRef("frmNota");
const frmReporte = useTemplateRef("frmReporte");

const opcionesSeleccionadas = computed(() =>
  pricingStore.opcionCostos.filter((v) => !!v.selected),
);
const opcionSeleccionadaActual = computed(() => {
  const page = pricingStore.page - 1;
  return (
    opcionesSeleccionadas.value[page] ||
    opcionesSeleccionadas.value[0] ||
    null
  );
});
const actualizarNotas = computed(() => pricingStore.actualizarNotas);
const lstSeIncluye = computed(() => {
  const val: FilaServicioNota[] = pricingStore.listServices.filter(
    (v) => v.status == 1,
  );

  const opcionActual = opcionSeleccionadaActual.value;
  if (!opcionActual) {
    return val;
  }
  const opcion = opcionActual.listNotasQuote.filter(
    (v) => v.estado == 1 && v.statusincluye == 1,
  );
  const opcionConServicio = opcion.map((v) => ({ ...v, service: v.descripcion }));

  const final = [...val, ...opcionConServicio] as FilaServicioNota[];


  const opt = opcionActual;
  const fechaVigencia =
    opt.date_end || pricingStore.datosPrincipales.fecha_fin;
  const ttransito =
    opt.tiempo_transito ||
    pricingStore.datosPrincipales.tiempo_transito;
  if (fechaVigencia) {
    final.push({
      service: `Fecha de vigencia: ${formatDate(fechaVigencia)}`,
    });
  }
  if (ttransito) {
    const unidad = Number(ttransito) === 1 ? "día" : "días";
    final.push({ service: `Tiempo de tránsito: ${ttransito} ${unidad}` });
  }

  return final;
});
const lstNoIncluye = computed(() => {
  const val: FilaServicioNota[] = pricingStore.listServices.filter(
    (v) => v.status == 0,
  );

  const opcionActual = opcionSeleccionadaActual.value;
  if (!opcionActual) {
    return val;
  }
  const opcion = opcionActual.listNotasQuote.filter(
    (v) => v.estado == 1 && v.statusnoincluye == 1,
  );
  const opcionConServicio = opcion.map((v) => ({ ...v, service: v.descripcion }));

  const final = [...val, ...opcionConServicio] as FilaServicioNota[];

  return final;
});

function abrirDialogCotizacionRapida() {
  const esperandoSeguro = pricingStore.listQuoteStatus.find(
    (v) => v.code == "4",
  );
  // this.previewFlag = true;
  nextTick(() => {
    tiporeporte.value = "AGRUPADO";
    selectedStatusId.value = esperandoSeguro!.id!;
    generarPreview({ val: true });
  });
}

function formatDate(val: string) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return String(val);
  }
}
function to_link({ url = "" }: { url?: string }) {
  window.open(url, "_blank");
}
function llenarNotasSeleccionadas() {
  // @ts-expect-error Kept: the computed is read-only, so this write is ignored
  opcionesSeleccionadas.value =
    pricingStore.opcionCostos.filter((v) => !!v.selected);
}
// Shadowed by the later abrirModalTipoReporte, so this body never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalTipoReporteSombreado() {
  tiporeporte.value = "";
  dialogPreview.value = false;

  previewFlag.value = true;
}
function abrirModalCambioNombreSecciones() {
  Swal.fire({
    icon: "question",
    width: 1000,
    html: "<h1> ¿Desea cambiar el nombre de la secciones?. Recuerde que  este cambio se verá reflejado solo en la cotización(pdf) </h1>",
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    confirmButtonText: "<h1>Si cambiar</h1>",
    showCancelButton: true,
    showDenyButton: true,
    cancelButtonText: "<h1>No cambiar<h1>",
    denyButtonText: "<h1>Cerrar<h1>",
  }).then((accion) => {
    if (accion.isConfirmed) {
      dialogCambioNombreSecciones.value = true;
    }
    if (accion.isDismissed) {
      abrirModalTipoReportePreview();
    }
  });
}
function abrirDialog({ statusincluye: incluye = 0, statusnoincluye: noIncluye = 0 }) {
  statusincluye.value = incluye;
  statusnoincluye.value = noIncluye;
  dialog.value = true;
}
async function anidarNota() {
  if ((await frmNota.value!.validate()).valid) {
    opcionSeleccionadaActual.value!.listNotasQuote.push({
      descripcion: descripcion.value,
      estado: 1,
      statusincluye: statusincluye.value,
      statusnoincluye: statusnoincluye.value,
    });
  }
  setTimeout(() => {
    descripcion.value = "";
    frmNota.value!.resetValidation();
  }, 10);
  dialog.value = !dialog.value;
}

async function generar() {
  pricingStore.tiporeporte = tiporeporte.value;
  loading.value = true;

  if ((await frmReporte.value!.validate()).valid) {
    rootStore.state.spiner = true;
    const name = route.name;
    // 1. Registro inicial
    if (name == "newQuote") {
      await pricingStore.registrarQuote({ fullflag: true }).catch((e) =>
        console.log(e),
      );
    }
    if (name == "editQuote") {
      await pricingStore.updateQuote();
    }
    if (pricingStore.nro_quote) {
      rootStore.state.spiner = false;
      await pricingStore.obtenerDatosEmpresa().catch((e) => console.log(e));

      // 2. Generación de reportes
      for (
        let index = 0;
        index < pricingStore.opcionCostos.length;
        index++
      ) {
        if (
          pricingStore.opcionCostos[index]!.selected == true
        ) {
          await Promise.all([
            pricingStore.generarReporte({
              tipo: tiporeporte.value,
              nro_propuesta:
                pricingStore.opcionCostos[index]!.nro_propuesta,
              guardarFlag: guardarFlag.value,
            }).catch((e) => console.log(e)),
            pricingStore.setEmisionPdf(),
          ]);
        }
      }

       

      loadingTable = false;
      loading.value = false;
      dialog.value = false;
      guardarFlag.value = false;
      dialogPreview.value = false;
      previewFlag.value = false;
      imprimirFlag.value = false;
      loading.value = false;
      dialogCambioNombreSecciones.value = false;
      cambiarStatus.value = false;
      // 3. Lógica de OneDrive
      const userStr = sessionStorage.getItem("dataUser");
      const id_branch = userStr ? JSON.parse(userStr)[0].id_branch : null;
      const branchCreacion = [1, 2];

      if (branchCreacion.includes(id_branch) && name == "newQuote") {
        console.log("Iniciando creación de carpeta...");

        // Aquí recibimos el return de la función anterior
        const urlGenerada = await pricingStore.crearCarpetaOneDrive({
          nro_quote: pricingStore.nro_quote,
          nombre: pricingStore.datosPrincipales.nombre,
        });


        if (urlGenerada) {
          await pricingStore.actualizarURLEnElQuote({
            id: pricingStore.id,
            url: urlGenerada,
          });
          console.log("Base de datos actualizada con URL de OneDrive");
        } else {
          console.warn(
            "No se obtuvo URL de OneDrive, se saltó la actualización.",
          );
        }
      }

      // 4. Redirección final
      const destino = {
        name: "verQuote",
        params: { id: pricingStore.id },
      };
      if (
        router.resolve(destino).fullPath !==
        route.fullPath
      ) {
        await router.push(destino);
      }else{
        window.location.reload()
      }
    }
  }
}
function abrirModalTipoReporte(guardar = false) {
  guardarFlag.value = guardar;
  imprimirFlag.value = true;
}
function abrirModalTipoReportePreview() {
  tiporeporte.value = "";
  previewFlag.value = true;
  dialogCambioNombreSecciones.value = false;
  pricingStore.bloquearBtnImprimir = false;
  // valor por defecto: primer estado disponible
  const list = pricingStore.listQuoteStatus || [];
  const estatusDefault = list.find(
    (estatus) =>
      estatus.defaultstatus === 1 ||
      estatus.defaultstatus === "1" ||
      estatus.defaultstatus === true,
  );

  if (estatusDefault) {
    selectedStatusId.value = estatusDefault.id!;
  } else if (list.length > 0) {
    selectedStatusId.value = list[0]!.id!;
  } else {
    selectedStatusId.value = null;
  }
  cambiarStatus.value = false;
}
async function generarPreview({ val = false }: { val?: boolean }) {
  if (val || (await frmReporte.value!.validate()).valid) {
    rootStore.state.spiner = true;
    previewFlag.value = false;
    if (cambiarStatus.value && selectedStatusId.value) {
      pricingStore.datosPrincipales.id_status =
        selectedStatusId.value;
    }
    await pricingStore.obtenerDatosEmpresa();
    predataCotizacion.value = await pricingStore.predata({
      tipo: tiporeporte.value,
    });
    rootStore.state.spiner = false;
    dialogPreview.value = true;
    getNombreCotizacion(pricingStore);
  }
}

watch(opcionesSeleccionadas, () => {
  pricingStore.page = 1;
});
watch(actualizarNotas, () => {
  llenarNotasSeleccionadas();
});

onMounted(() => {
  dialog.value = false;
});
</script>

<template>
  <v-card
    fluid
    v-if="opcionSeleccionadaActual"
  >
    <v-dialog
      v-model="dialog"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Registro de nueva nota - Opción
          {{ opcionSeleccionadaActual.nro_propuesta }}<v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmNota">
            <v-text-field
              label="Descripción Nota Nueva"
              v-model="descripcion"
              id="id"
              :rules="[(v) => !!v || 'Dato requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            @click="anidarNota"
            color="success"
          >
            Agregar Nueva nota
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-row>
      <v-col cols="12">
        Añadir nueva Nota: Opción
        {{ opcionSeleccionadaActual.nro_propuesta }}
        <v-btn
          variant="text"
          icon
          color="primary"
          @click="dialog = !dialog"
        >
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        class="derecha"
      >
        <div class="text-center">
          <v-pagination
            v-model="pricingStore.page"
            :length="opcionesSeleccionadas.length"
            rounded
          />
        </div>
      </v-col>
      <v-col cols="12">
        <v-expansion-panels class="my-1 condensed">
          <v-expansion-panel>
            <v-expansion-panel-title>
              Notas Principales
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-data-table
                :headers="headers"
                :items="
                  opcionSeleccionadaActual.listNotasQuote.filter(
                    (v) =>
                      v.estado == 1 && !v.statusincluye && !v.statusnoincluye,
                  )
                "
                hide-default-footer
                density="compact"
                disable-sort
                :items-per-page="-1"
              >
                <template #item="row">
                  <tr>
                    <td class="indexTblClass">
                      {{ row.index + 1 }}
                    </td>
                    <td class="btnDescriptionClass">
                      <v-textarea
                        v-model="row.item.descripcion"
                        hide-details
                        density="compact"
                        rows="1"
                        auto-grow
                      />
                    </td>
                    <td class="btnTblClass">
                      <v-btn
                        variant="text"
                        icon
                        color="red"
                        size="x-small"
                        @click="row.item.estado = 0"
                      >
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-col cols="12">
        <v-expansion-panels class="my-1 condensed">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <span class="d-inline-flex align-center">
                Se incluye
                <v-btn
                  variant="text"
                  color="success"
                  size="x-small"
                  icon
                  class="ml-2"
                  @click="abrirDialog({ statusincluye: 1 })"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </span>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <v-data-table
                :headers="headers"
                :items="lstSeIncluye"
                hide-default-footer
                density="compact"
                :items-per-page="-1"
                disable-sort
              >
                <template #item="row">
                  <tr>
                    <td class="indexTblClass">
                      {{ row.index + 1 }}
                    </td>

                    <td class="btnDescriptionClass">
                      <v-textarea
                        v-model="row.item.service"
                        readonly
                        hide-details
                        density="compact"
                        rows="1"
                        auto-grow
                      />
                    </td>
                  </tr>
                </template>
              </v-data-table>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-expansion-panels class="my-1 condensed">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <span class="d-inline-flex align-center">
              No Se Incluye
              <v-btn
                variant="text"
                color="success"
                size="x-small"
                icon
                class="ml-2"
                @click="abrirDialog({ statusnoincluye: 1 })"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </span>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-data-table
              :headers="headers"
              :items="lstNoIncluye"
              hide-default-footer
              density="compact"
              :items-per-page="-1"
              disable-sort
            >
              <template #item="row">
                <tr>
                  <td class="indexTblClass">
                    {{ row.index + 1 }}
                  </td>

                  <td class="btnDescriptionClass">
                    <v-textarea
                      v-model="row.item.service"
                      readonly
                      hide-details
                      density="compact"
                      rows="1"
                      auto-grow
                    />
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <v-col class="derecha">
        <v-btn
          color="#3363A2"
          @click="abrirModalCambioNombreSecciones()"
        >
          PREVIEW COTIZACIÓN(es)
        </v-btn>
        <v-btn
          color="#FFD600"
          class="mx-1"
          @click="abrirDialogCotizacionRapida"
        >
          <v-icon
            class="mx-1"
            size="small"
          >
            mdi-folder
          </v-icon>Guardar en
          Carpeta
        </v-btn>
      </v-col>
      <!-- <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="info"
        class="mx-1"
        small
        @click="abrirModalTipoReportePreview()"
      >
        Preview Cotizacion
      </v-btn>
    </v-card-actions> -->
    </v-row>
    <v-dialog
      v-model="dialogCambioNombreSecciones"
      scrollable
      persistent
      width="50%"
    >
      <v-card>
        <v-card-title> Secciones de los costos </v-card-title>
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(tipocosto, index) in pricingStore.namesection"
                :key="index"
              >
                <td>{{ tipocosto.codigo }}</td>
                <td>
                  <v-text-field v-model="tipocosto.name" />
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        <v-card-actions>
          <v-btn
            class="mx-1"
            @click="abrirModalTipoReportePreview()"
            color="success"
          >
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            @click="dialogCambioNombreSecciones = !dialogCambioNombreSecciones"
            color="warning"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="imprimirFlag"
      max-width="40%"
      v-if="imprimirFlag"
    >
      <v-card
        color=""
        class="py-5"
      >
        <v-card-title primary-title>
          SELECCIÓN DE TIPO DE REPORTE A IMPRIMIR
        </v-card-title>
        <v-card-text>
          <v-form ref="frmReporte">
            <v-radio-group
              v-model="tiporeporte"
              disabled
              :rules="[(v) => !!v || 'Dato requerido']"
            >
              <v-radio
                label="Costo detallado por cada item"
                color="red-darken-3"
                value="DETALLE"
              />

              <v-radio
                label="Totales por servicios"
                color="indigo-darken-3"
                value="TOTAL"
              />

              <v-radio
                label="Reporte total general sin desglose"
                color="orange-darken-3"
                value="AGRUPADO"
              />
            </v-radio-group>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            :loading="loading"
            variant="text"
            @click="generar"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            variant="text"
            @click="imprimirFlag = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="previewFlag"
      max-width="40%"
      v-if="previewFlag"
    >
      <v-card
        color=""
        class="py-5"
      >
        <v-card-title primary-title>
          SELECCIÓN DE TIPO DE REPORTE PARA LA PREVISUALIZACIÓN
        </v-card-title>
        <v-card-text>
          <v-form ref="frmReporte">
            <v-radio-group
              v-model="tiporeporte"
              :rules="[(v) => !!v || 'Dato requerido']"
            >
              <v-radio
                label="Costo detallado por cada item"
                color="red-darken-3"
                value="DETALLE"
              />

              <v-radio
                label="Totales por servicios"
                color="indigo-darken-3"
                value="TOTAL"
              />

              <v-radio
                label="Reporte total general sin desglose"
                color="orange-darken-3"
                value="AGRUPADO"
              />
            </v-radio-group>

            <v-divider class="my-4" />

            <v-switch
              v-model="cambiarStatus"
              label="¿Desea cambiar el estatus de la cotización?"
              inset
            />

            <v-slide-y-transition>
              <div v-if="cambiarStatus">
                <v-select
                  v-model="selectedStatusId"
                  :items="pricingStore.listQuoteStatus"
                  item-title="name"
                  item-value="id"
                  label="Nuevo estatus de la cotización"
                  density="compact"
                  variant="outlined"
                />
              </div>
            </v-slide-y-transition>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            variant="text"
            @click="generarPreview"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            variant="text"
            @click="previewFlag = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogPreview"
      scrollable
      persistent
      max-width="80%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title class="bg-indigo text-white my-0 py-0 d-flex align-center flex-wrap">
          PREVISUALIZACIÓN DE LA COTIZACIÓN - NO TIENE NINGÚN VALOR COMERCIAL

          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="white"
            @click="dialogPreview = !dialogPreview"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <previewCotizacion
            :data="predataCotizacion"
            @cerrar="dialogPreview = $event"
            :index="pagePrev"
          />
        </v-card-text>
        <v-card-actions>
          <div class="text-center">
            <v-pagination
              v-model="pagePrev"
              :length="opcionesSeleccionadas.length"
              rounded
            />
          </div>
          
          <v-textarea
            label="Nombre Archivo Generar"
            v-model="pricingStore.nombre_cotizacion"
            auto-grow
            rows="1"
          />

          <v-btn
            v-if="pricingStore.datosPrincipales.url_folderonedrive"
            color="#FFD600"
            class="mx-1"
            size="small"
            @click="
              to_link({
                url: pricingStore.datosPrincipales.url_folderonedrive,
              })
            "
          >
            <v-icon>mdi-folder-open-outline</v-icon>
            Abrir Carpeta
          </v-btn>
          <v-btn
            color="#FFD600"
            class="mx-1"
            size="small"
            @click="abrirModalTipoReporte(true)"
          >
            <v-icon>mdi-folder-arrow-right</v-icon> Guardar En Folder
          </v-btn>
          <v-btn
            color="#A43542"
            class="mx-1"
            size="small"
            :disabled="pricingStore.bloquearBtnImprimir"
            @click="abrirModalTipoReporte(false)"
          >
            Imprimir Cotizacion
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.derecha {
  text-align: right !important;
  align-content: right !important;
}
.izquierda {
  text-align: left !important;
  align-content: left !important;
}
</style>
