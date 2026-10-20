<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import Swal from "sweetalert2";
import moment from "moment";
import FormatFecha from "../comun/FormatFecha.vue";
import { usePricingStore } from "@/stores/pricing";
import type { ArchivoDrive, ContenedorEnvio, TipoCarga } from "@/types/cotizacion";

const pricingStore = usePricingStore();

const errorFechaEntrega = ref("");
const dialog = ref(false);
const tabIndex = ref("pdfflag");
const loading = ref(false);
const localTextoPdf = ref("");
const localTextoLink = ref("");
// dateRangeText: null,
const dates = ref<string[]>([]);
const menu = ref(false);
const fecha_max = ref<string | null>("");
const nombrePdfEnviarCliente = ref("");
const frmEnvioWsp = useTemplateRef("frmEnvioWsp");

const texto_pdf_vuex = computed(
  () => pricingStore.textWhatsapp?.[0]?.texto_pdf || "",
);
const texto_link_vuex = computed(
  () => pricingStore.textWhatsapp?.[0]?.texto_link || "",
);
const dateRangeText = computed(() => {
  if (!dates.value || dates.value.length === 0) return "";

  const fechasOrdenadas = dates.value.slice().sort();
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];

  const desglosarFecha = (fecha: string) => {
    const [year, month, day] = fecha.split("-");
    return {
      dia: parseInt(day!, 10).toString(), // Convierte "05" a "5"
      mes: meses[parseInt(month!, 10) - 1],
      year: year,
    };
  };

  if (fechasOrdenadas.length === 1) {
    // Si solo ha seleccionado una fecha
    const f1 = desglosarFecha(fechasOrdenadas[0]!);
    return `${f1.dia} de ${f1.mes}`;
  }

  const f1 = desglosarFecha(fechasOrdenadas[0]!);
  const f2 = desglosarFecha(fechasOrdenadas[1]!);

  if (f1.year === f2.year) {
    if (f1.mes === f2.mes) {
      // Mismo año y MISMO mes (El formato exacto que pediste)
      // Ejemplo: "25 al 30 de julio"
      return `${f1.dia} al ${f2.dia} de ${f1.mes}`;
    } else {
      // Mismo año pero DIFERENTE mes
      // Ejemplo: "25 de julio al 5 de agosto"
      return `${f1.dia} de ${f1.mes} al ${f2.dia} de ${f2.mes}`;
    }
  } else {
    // Diferente año
    // Ejemplo: "25 de diciembre de 2026 al 5 de enero de 2027"
    return `${f1.dia} de ${f1.mes} de ${f1.year} al ${f2.dia} de ${f2.mes} de ${f2.year}`;
  }
});

watch(
  texto_pdf_vuex,
  (val) => {
    localTextoPdf.value = val;
  },
  { immediate: true }, // <-- Hace que se asigne el valor al cargar el componente
);
watch(
  texto_link_vuex,
  (val) => {
    localTextoLink.value = val;
  },
  { immediate: true }, // <-- Hace que se asigne el valor al cargar el componente
);

function selectDateRange(value: moment.MomentInput[]) {
  dates.value = value.map((date) => moment(date).format("YYYY-MM-DD"));
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GetArchivos(payload?: string | null) {
  return pricingStore.GetArchivos(payload);
}
function abrirModal() {
  dialog.value = true;
}
function limpiarNombre(str: string) {
  return str
    .normalize("NFD") // Separa los acentos del carácter base
    .replace(/[\u0300-\u036f]/g, "") // Elimina los acentos
    .replace(/ñ/g, "n") // Convierte ñ a n
    .replace(/Ñ/g, "N") // Convierte Ñ a N
    .replace(/\s+/g, "_") // Convierte espacios a guion bajo
    .replace(/[^a-zA-Z0-9_]/g, ""); // Elimina cualquier otro carácter especial que sobre
}
async function enviarWsp() {
  errorFechaEntrega.value = "";

  if (!(await frmEnvioWsp.value!.validate()).valid) {
    return;
  }

  if (!fecha_max.value && pricingStore.datosPrincipales.esgrupalflag) {
    errorFechaEntrega.value = "Dato Requerido";
    return;
  }

  const nameFile = nombrePdfEnviarCliente.value + ".pdf";
  if (pricingStore.listadoFilesDrive.some((v: ArchivoDrive) => v.name == nameFile)) {
    Swal.fire({
      icon: "warning",
      title: "Nombre duplicado",
      text: "El nombre del archivo ya está en uso en la carpeta. Por favor, ingresa un nombre diferente para continuar.",
      confirmButtonText: "Entendido",
    });
    return;
  }

  loading.value = true;
  let tipo = "individual";
  if (pricingStore.datosPrincipales.esgrupalflag) {
    tipo = "grupal";
  }
  await Promise.all([
    pricingStore.generarReporte({
      tipo: "AGRUPADO",
      enviarWspCliente: true,
      guardarFlag: true,
      textWhatsapp: tabIndex.value == "pdfflag" ? localTextoPdf.value : localTextoLink.value,
      pdfflag: tabIndex.value == "pdfflag",
      linkflag: tabIndex.value == "linkflag",
      tipoCotizacion: tipo,
      fecha_salida: dateRangeText.value,
      nombre_cliente: pricingStore.datosPrincipales.nombre,
      fecha_max: fecha_max.value,
      nombrePdfEnviarCliente: nombrePdfEnviarCliente.value,
    }),
    pricingStore.setEmisionPdf(),
  ]);
  loading.value = false;
  dialog.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatearFecha(fecha: string) {
  if (!fecha) return "";
  const [year, month, day] = fecha.split("-");
  const meses = [
    "ENE",
    "FEB",
    "MAR",
    "ABR",
    "MAY",
    "JUN",
    "JUL",
    "AGO",
    "SEP",
    "OCT",
    "NOV",
    "DIC",
  ];
  // Aseguramos que el mes sea un índice válido y formateamos
  return `${day}/${meses[parseInt(month!) - 1]}/${year}`;
}

onMounted(() => {
  pricingStore.obtenerDatosEmpresa();
  const contenedor: Array<{ name?: string; valor?: number | string; code?: string }> = [];

  (pricingStore.datosPrincipales.containers || []).forEach(
    (element: ContenedorEnvio) => {
      contenedor.push({
        name: element.description,
        valor: element.cantidad,
        code: element.code,
      });
    },
  );

  nombrePdfEnviarCliente.value = "COTIZACION_";

  if (pricingStore.datosPrincipales.esindividualflag) {
    nombrePdfEnviarCliente.value += "INDIVIDUAL";
  }
  if (pricingStore.datosPrincipales.esgrupalflag) {
    nombrePdfEnviarCliente.value += "GRUPAL";
  }

  const shipment = pricingStore.listShipment.find(
    (v: TipoCarga) => v.id == pricingStore.datosPrincipales.idtipocarga,
  );

  if (shipment?.code == "FCL") {
    nombrePdfEnviarCliente.value += contenedor
      .map((v) => {
        return "_" + v.valor + "x" + v.code;
      })
      .join("_");
  }
  if (shipment?.code == "LCL") {
    nombrePdfEnviarCliente.value += "_CONSOLIDADOS";
  }
  nombrePdfEnviarCliente.value +=
    "_" + limpiarNombre(pricingStore.datosPrincipales.nombre!);
});
</script>

<template>
  <div class="">
    <v-btn
      color="#25D366"
      @click="abrirModal"
    >
      <v-icon class="mr-2">
        mdi-whatsapp
      </v-icon> ENVIAR A WHATSAPP
    </v-btn>
    <v-dialog
      v-model="dialog"
      persistent
      max-width="50%"
    >
      <v-card>
        <v-card-title primary-title>
          <span style="font-size: 1.2em; font-weight: bold">Mensaje para el cliente
          </span>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmEnvioWsp">
            <v-row>
              <v-col cols="12">
                <v-tabs
                  v-model="tabIndex"
                  align-tabs="center"
                  slider-color="primary"
                >
                  <v-tab value="pdfflag">
                    PDF
                  </v-tab>
                </v-tabs>
                <v-tabs-window v-model="tabIndex">
                  <v-tabs-window-item value="linkflag">
                    <v-card-text>
                      <v-textarea
                        v-model="localTextoLink"
                        auto-grow
                        variant="outlined"
                        class="my-2"
                        :rules="[(v) => !!v || 'Dato Requerido']"
                      />
                    </v-card-text>
                  </v-tabs-window-item>
                  <v-tabs-window-item value="pdfflag">
                    <p
                      class="py-0 mt-5"
                      style="font-size: 1.2em; color: red"
                    >
                      <center>
                        <v-icon
                          color="warning"
                          class="mx-2"
                        >
                          mdi-alert
                        </v-icon>
                        <i>
                          Este mensaje solo se verá reflejado, si está dentro de
                          las 24h
                        </i>
                      </center>
                    </p>
                    <v-textarea
                      v-model="localTextoPdf"
                      auto-grow
                      variant="outlined"
                      class="py-0 my-0"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                    />
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-col>
              <!-- <v-col cols="12">
              {{ $store.state.pricing.datosPrincipales }}
              <v-select item-title="text" :items="cboTipoReporte" label="Tipo de Reporte a Envíar"></v-select>
            </v-col> -->
              <v-col cols="12">
                <v-text-field
                  label="Nombre de Archivo"
                  v-model="nombrePdfEnviarCliente"
                  variant="outlined"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                />
              </v-col>
              <v-col cols="6">
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  max-width="290px"
                  min-width="auto"
                  outline
                  v-if="pricingStore.datosPrincipales.esgrupalflag"
                >
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="dateRangeText"
                      label="Fecha Aproximada de Salida"
                      prepend-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      :rules="[(v) => !!v || 'Dato Requerido']"
                      v-if="pricingStore.datosPrincipales.esgrupalflag"
                      color="blue-grey-darken-2"
                      variant="outlined"
                      density="compact"
                    />
                  </template>

                  <v-date-picker
                    :model-value="dates"
                    @update:model-value="selectDateRange"
                    multiple="range"
                    hide-header
                  >
                    <template #actions>
                      <v-spacer />
                      <v-btn
                        variant="text"
                        color="primary"
                        @click="menu = false"
                      >
                        Confirmar
                      </v-btn>
                      <v-btn
                        variant="text"
                        color="error"
                        @click="menu = false"
                      >
                        Cerrar
                      </v-btn>
                    </template>
                  </v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="6">
                <FormatFecha
                  :dense="true"
                  label="Fecha Máxima de Entrega"
                  v-model="fecha_max"
                  v-if="pricingStore.datosPrincipales.esgrupalflag"
                  :error-messages="errorFechaEntrega"
                  :outlined="true"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="enviarWsp"
            :loading="loading"
          >
            Enviar
            {{ tabIndex == "pdfflag" ? "PDF" : "LINK" }} Cotización
          </v-btn>
          <v-btn
            color="error"
            @click="dialog = false"
            variant="text"
            :loading="loading"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style></style>
