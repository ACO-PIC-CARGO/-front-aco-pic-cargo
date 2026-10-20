<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
import { sessionBranchId } from "@/utils/sesion";
import type { DatosPrevisualizacion, FilaServicioNota, OpcionCosto } from "@/types/cotizacion";

const previewCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/PreviewQuote.vue"));

const route = useRoute();
const router = useRouter();
const rootStore = useStore();
const aduanaStore = useAduanaStore();

// opcionesSeleccionadas: [{ listNotasQuote: [] }],
const dialog = ref(false);
const headers = [
  { key: "index", title: "#" },
  { key: "description", title: "Descripción", align: "center" },
] as const;
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let loadingTable: boolean | undefined;
const frmNota = useTemplateRef("frmNota");
const frmReporte = useTemplateRef("frmReporte");


const opcionesSeleccionadas = computed(() => {
  return aduanaStore.opcionCostos.filter((v) => !!v.selected);
});
const actualizarNotas = computed(() => aduanaStore.actualizarNotas);
const page = computed(() => {
  return aduanaStore.page - 1;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const items = computed(() => {
  console.log(opcionesSeleccionadas.value[page.value]);
  return opcionesSeleccionadas.value[page.value]!.listNotasQuote.filter(
    (v) => v.estado == 1
  );
});
const lstSeIncluye = computed(() => {
  const val = aduanaStore.listServices.filter(
    (v) => v.status == 1
  );

  let opcion = opcionesSeleccionadas.value[
    aduanaStore.page - 1
  ]!.listNotasQuote.filter((v) => v.estado == 1 && v.statusincluye == 1);
  opcion = opcion.map((v) => ({ ...v, service: v.descripcion }));

  const final = [...val, ...opcion] as FilaServicioNota[];

  const opt: Partial<OpcionCosto> = opcionesSeleccionadas.value[aduanaStore.page - 1] || {};
  const fechaVigencia = opt.date_end || aduanaStore.datosPrincipales.fecha_fin;
  const ttransito = opt.tiempo_transito || aduanaStore.datosPrincipales.tiempo_transito;
  if (fechaVigencia) {
    final.push({ service: `Fecha de vigencia: ${formatDate(fechaVigencia)}` });
  }
  if (ttransito) {
    const unidad = Number(ttransito) === 1 ? "día" : "días";
    final.push({ service: `Tiempo de tránsito: ${ttransito} ${unidad}` });
  }

  return final;
});
const lstNoIncluye = computed(() => {
  const val = aduanaStore.listServices.filter(
    (v) => v.status == 0
  );

  let opcion = opcionesSeleccionadas.value[
    aduanaStore.page - 1
  ]!.listNotasQuote.filter((v) => v.estado == 1 && v.statusnoincluye == 1);
  opcion = opcion.map((v) => ({ ...v, service: v.descripcion }));

  const final = [...val, ...opcion] as FilaServicioNota[];

  return final;
});



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
function llenarNotasSeleccionadas() {
  // @ts-expect-error Kept: the computed is read-only, so this write is ignored
  opcionesSeleccionadas.value = aduanaStore.opcionCostos.filter(
    (v) => !!v.selected
  );
}
// Shadowed by the later abrirModalTipoReporte, so this body never ran.
function abrirModalTipoReporteSombreado() { // eslint-disable-line @typescript-eslint/no-unused-vars
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
    opcionesSeleccionadas.value[
      aduanaStore.page - 1
    ]!.listNotasQuote.push({
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
  aduanaStore.tiporeporte = tiporeporte.value;
  loading.value = true;
  if (!route.params.id) {
    if ((await frmReporte.value!.validate()).valid) {
      rootStore.state.spiner = true;
      await aduanaStore.registrarAduana({ fullflag: true }).catch((e) => {
       console.error(e);
      });
      if (aduanaStore.nro_quote) {
        rootStore.state.spiner = false;
        await aduanaStore.obtenerDatosEmpresaAduana().catch((e) => {
         console.error(e);
        });

        for (
          let index = 0;
          index < aduanaStore.opcionCostos.length;
          index++
        ) {
          if (
            aduanaStore.opcionCostos[index]!.selected == true
          ) {
            await aduanaStore.generarReporteAduana({
              tipo: tiporeporte.value,
              nro_propuesta:
                aduanaStore.opcionCostos[index]!.nro_propuesta,
            }).catch((e) => {
             console.error(e);
            });
          }
        }
        loadingTable = false;
        loading.value = false;
        rootStore.state.spiner = false;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const id_branch = sessionBranchId();
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const branchCreacion = [1, 2];
        // if (branchCreacion.includes(id_branch)) {
        //   this.crearCarpetaOneDrive({
        //     nro_quote: this.$store.state.aduana.nro_quote,
        //     nombre: this.$store.state.aduana.datosPrincipales.nombre,
        //   }).catch((err) => {
        //     console.log("crearCarpetaOneDrive", err);
        //   });

        //   await this.actualizarURLEnElQuote({
        //     id: this.$store.state.aduana.id,
        //     url: this.$store.state.aduana.urlFolder,
        //   }).catch((err) => {
        //     console.log("actualizarURLEnElQuote", err);
        //   });
        // }
        console.log(aduanaStore.id);
        router.push({
          name: "VerAduana",
          params: {
            id: aduanaStore.id,
          },
        });
      }
    }
  } else {
    if ((await frmReporte.value!.validate()).valid) {
      rootStore.state.spiner = true;
      imprimirFlag.value = false;

      await aduanaStore.actualizarQuoteAduana();
      await aduanaStore.obtenerDatosEmpresaAduana();

      for (
        let index = 0;
        index < aduanaStore.opcionCostos.length;
        index++
      ) {
        Swal.fire({
          icon: "info",
          text: "Se está generando el (los) pdf.",
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
          timerProgressBar: true,
          timer: null as unknown as number,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        if (aduanaStore.opcionCostos[index]!.selected == true) {
          await aduanaStore.generarReporteAduana({
            tipo: aduanaStore.tiporeporte,
            nro_propuesta:
              aduanaStore.opcionCostos[index]!.nro_propuesta,
          }).catch((e) => {
            console.error(e);
          });
        }
      }
      Swal.close();
      router.push({
        name: "VerAduana",
        params: {
          id: aduanaStore.id,
        },
      });
      rootStore.state.spiner = false;
    }
  }
}
function abrirModalTipoReporte() {
  imprimirFlag.value = true;
}
function abrirModalTipoReportePreview() {
  tiporeporte.value = "";
  previewFlag.value = true;
  dialogCambioNombreSecciones.value = false;
  aduanaStore.bloquearBtnImprimir = false;
}
async function generarPreview() {
  if ((await frmReporte.value!.validate()).valid) {
    rootStore.state.spiner = true;
    previewFlag.value = false;
    await aduanaStore.obtenerDatosEmpresaAduana();
    predataCotizacion.value = await aduanaStore.predataAduana({
      tipo: tiporeporte.value,
    });
    rootStore.state.spiner = false;
    dialogPreview.value = true;
  }
}

watch(actualizarNotas, () => {
  llenarNotasSeleccionadas();
});

onMounted(() => {
  dialog.value = false;
  dialogPreview.value = false;
});
</script>

<template>
  <v-card
    fluid
    v-if="opcionesSeleccionadas.length > 0"
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
          {{ opcionesSeleccionadas[page]!.nro_propuesta }}<v-spacer />
          <!-- @vue-expect-error Kept: abrirDialog needs its argument, so the click throws -->
          <v-btn
            variant="text"
            icon
            color="default"
            @click="abrirDialog()"
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
        {{ opcionesSeleccionadas[page]!.nro_propuesta }}
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
            v-model="aduanaStore.page"
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
                  opcionesSeleccionadas[
                    aduanaStore.page - 1
                  ]!.listNotasQuote.filter(
                    (v) =>
                      v.estado == 1 && !v.statusincluye && !v.statusnoincluye
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
      </v-col>
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
                v-for="(tipocosto, index) in aduanaStore.namesection"
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

          <v-spacer />
          <v-btn
            color="#A43542"
            class="mx-1"
            style="color: white !important"
            size="small"
            :disabled="aduanaStore.bloquearBtnImprimir"
            @click="abrirModalTipoReporte()"
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
