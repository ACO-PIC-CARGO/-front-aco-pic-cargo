<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useAduanaStore } from "@/stores/aduana";
import type { FilaServicioNota, OpcionCosto } from "@/types/cotizacion";

const appStore = useAppStore();
const aduanaStore = useAduanaStore();

const headers = [
  { key: "index", title: "#" },
  { key: "description", title: "Descripción", align: "center" },
] as const;
const previewFlag = ref(false);
const tiporeporte = ref("");
const dialogCambioNombreSecciones = ref(false);
const opcionesSeleccionadas = ref([{ listNotasQuote: [] }] as unknown as OpcionCosto[]);


const lstSeIncluye = computed(() => {
  const val: FilaServicioNota[] = aduanaStore.listServices.filter(
    (v) => v.status == 1
  );

  let opcion: FilaServicioNota[] = opcionesSeleccionadas.value[
    aduanaStore.page - 1
  ]!.listNotasQuote.filter((v) => v.estado == 1 && v.statusincluye == 1) as FilaServicioNota[];
  opcion = opcion.map((v) => ({
    ...v,
    service: v.descripcion,
    namegroupservice: v.descripcion,
  }));
  const final = [...val, ...opcion];

  const opt = opcionesSeleccionadas.value[aduanaStore.page - 1] || ({} as Partial<OpcionCosto>);
  const fechaVigencia = opt.date_end || aduanaStore.datosPrincipales.fecha_fin;
  const ttransito = opt.tiempo_transito || aduanaStore.datosPrincipales.tiempo_transito;
  if (fechaVigencia) {
    const texto = `Fecha de vigencia: ${formatDate(fechaVigencia)}`;
    final.push({ service: texto, namegroupservice: texto });
  }
  if (ttransito) {
    const unidad = Number(ttransito) === 1 ? "día" : "días";
    const texto = `Tiempo de tránsito: ${ttransito} ${unidad}`;
    final.push({ service: texto, namegroupservice: texto });
  }

  return final;
});
const lstNoIncluye = computed(() => {
  const val: FilaServicioNota[] = aduanaStore.listServices.filter(
    (v) => v.status == 0
  );

  let opcion: FilaServicioNota[] = opcionesSeleccionadas.value[
    aduanaStore.page - 1
  ]!.listNotasQuote.filter((v) => v.estado == 1 && v.statusnoincluye == 1) as FilaServicioNota[];
  opcion = opcion.map((v) => ({
    ...v,
    service: v.descripcion,
    namegroupservice: v.descripcion,
  }));

  const final = [...val, ...opcion];

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return String(val);
  }
}
function abrirModalTipoReporte() {
  tiporeporte.value = "";
  dialogCambioNombreSecciones.value = false;
  previewFlag.value = true;
}
function abrirModalCambioHeader() {
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
      abrirModalTipoReporte();
    }
  });
}
async function generar() {
  appStore.spiner = true;
  previewFlag.value = false;
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
  appStore.spiner = false;
}

onMounted(() => {
  if (
    (opcionesSeleccionadas.value = aduanaStore.opcionCostos.some(
      (v) => !!v.selected
    ) as unknown as OpcionCosto[])
  ) {
    opcionesSeleccionadas.value = aduanaStore.opcionCostos.filter(
      (v) => !!v.selected
    );
  }
});
</script>

<template>
  <v-card fluid>
    <v-expansion-panels class="my-1 condensed">
      <v-expansion-panel>
        <v-expansion-panel-title> Notas Principales </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="
              aduanaStore.opcionCostos[
                aduanaStore.page - 1
              ]!.listNotasQuote.filter(
                (v) => v.estado == 1 && !v.statusincluye && !v.statusnoincluye
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
                <!-- <td class="btnTblClass">
                  <v-btn icon color="red" x-small @click="row.item.estado = 0">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td> -->
              </tr>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-divider />
    <v-expansion-panels class="my-1 condensed">
      <v-expansion-panel>
        <v-expansion-panel-title> Se incluye </v-expansion-panel-title>
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
                    v-model="row.item.namegroupservice"
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
    <v-divider />
    <v-expansion-panels class="my-1 condensed">
      <v-expansion-panel>
        <v-expansion-panel-title> No se incluye </v-expansion-panel-title>
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
                    v-model="row.item.namegroupservice"
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
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="info"
        class="mx-1"
        size="small"
        @click="abrirModalCambioHeader()"
      >
        Imprimir Cotizacion
      </v-btn>
    </v-card-actions>
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
            @click="abrirModalTipoReporte()"
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
      v-model="previewFlag"
      max-width="40%"
      v-if="previewFlag"
    >
      <v-card
        color=""
        class="py-5"
      >
        <v-card-title primary-title>
          <p>TIPO DE REPORTE</p>

          <p class="text-red">
            Si necesita cambiar el tipo de reporte, lo debe realizar desde el
            editar
          </p>
        </v-card-title>

        <v-card-text>
          <v-form ref="frmReporte">
            <v-radio-group
              v-model="aduanaStore.tiporeporte"
              :rules="[(v) => !!v || 'Dato requerido']"
              disabled
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
            @click="generar"
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
  </v-card>
</template>

<style></style>
