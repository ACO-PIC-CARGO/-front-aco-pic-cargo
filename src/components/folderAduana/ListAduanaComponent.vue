<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import moment from "moment";
import Swal from "sweetalert2";
import { useSecuritysStore } from "@/stores/securitys";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
import { sessionUser, sessionUserIdOrEmpty } from "@/utils/sesion";
import type { CotizacionListado, FormNotaLlamada } from "@/types/cotizacion";

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const aduanaStore = useAduanaStore();
const securitysStore = useSecuritysStore();

const lstPricing = ref(true);
const id_status = ref<number | string | null>(null);
const comentario = ref("");
const search = ref("");
const dialogRegistroNotaLlamada = ref(false);
const expanded = ref<CotizacionListado[]>([]);
const singleExpand = false;
const loading = ref(false);
const loading2 = ref(false);
const loading3 = ref(false);
const dialog = ref(false);
const fromData = ref<FormNotaLlamada>({
  date: moment().format("YYYY-MM-DD"),
  descripcion: "",
  identities: sessionUserIdOrEmpty(),
});
const aprobarflag = ref(false);
const cabCotizaciones = [
    {
      key: "acciones",
      title: "",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "created",
      title: "FECHA REGISTRO",
      align: "center",
      groupable: true,
      estado: true,
      dataType: "Date",
    },
    {
      key: "recibidocotizacion",
      title: "RECIBIDO COTIZACION EN PRICING",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "enviadocliente",
      title: "ENVIADO AL CLIENTE",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "status",
      title: "ESTATUS",
      align: "center",
      groupable: true,
      estado: true,
    },

    {
      key: "codigo",
      title: "CÓD.",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "ejecutivo_ventas",
      title: "EJECUTIVO",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "nombres",
      title: "CLIENTE",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "telefono",
      title: "TÉLEFONO",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "sentido",
      title: "SENTIDO",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "tipo_de_carga",
      title: "TIPO DE CARGA",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "incoterms",
      title: "INCOTERMS",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "origen",
      title: "ORIGEN",
      align: "center",
      groupable: true,
      estado: true,
    },
    {
      key: "destino",
      title: "DESTINO",
      align: "center",
      groupable: true,
      estado: true,
    },
] as const;
const filtro = {
  idmarketing: null,
  idstatus: null,
  identities: null,
  idmodality: null,
  idshipment: null,
  idincoterm: null,
  fechainicio: null,
  fechafin: null,
  estado: "activo",
};
const quote = ref<CotizacionListado | null>(null);
const id_master_recibidocotizacion = ref<number | string>("");
const id_master_enviadocliente = ref<number | string>("");
const fecha_enviocliente = ref("");
const nuevoexpediente = ref(true);
const id_exp = ref<number | string>("");
let fecha_validez: string | undefined;
const frmEstado = useTemplateRef("frmEstado");
const detallenota = useTemplateRef("detallenota");
const frmAprobar = useTemplateRef("frmAprobar");

async function iraAprobado(id: number | undefined) {
  let val = false;
  let msg = "";

  await Swal.fire({
    title: "Ingrese sus datos Administrador",
    html:
      '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
      '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    focusConfirm: false,
    didOpen: () => {
      // Aquí forzamos el foco manualmente
      document.getElementById("swal-input1")!.focus();
    },
    preConfirm: () => {
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value;
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value;

      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }

      return {
        usuario: input1,
        clave: input2,
      };
    },
  }).then(async (result) => {
    if (result.isConfirmed && result.value) {
      const res = await securitysStore.validarUsuarioAdmin(result.value);
      val = res!.estadoflag === true;
      msg = res!.mensaje;
    }
  });

  if (!val) {
    if (msg) {
      await Swal.fire({ icon: "error", text: msg });
    }
    return;
  }
  router.push({
    name: "EditarAduana",
    params: {
      id: id,
    },
  });
}
function fecha(fecha: string | undefined) {
  moment.locale("es");
  const newFecha = moment(fecha).format("YYYY-MMM-DD HH:mm");
  return newFecha;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function clickRow(item: CotizacionListado, event: { isExpanded: boolean }) {
  if (event.isExpanded) {
    const index = expanded.value.findIndex((i) => i === item);
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item);
  }
}
function toggleRow(item: CotizacionListado) {
  const isExpanded = expanded.value.includes(item);
  if (isExpanded) {
    const index = expanded.value.findIndex((i) => i === item);
    expanded.value.splice(index, 1);
  } else {
    expanded.value.push(item);
  }
}
function to_direct({ url }: { url: string }) {
  window.open(url, "_blank");
}

async function reporteListado() {
  loading2.value = true;
  // @ts-expect-error the action destructures other keys, so the filter is ignored.
  await pricingStore.imprimiReporteListado(filtro).catch((e) => {
    console.error(e);
  });
  loading2.value = false;
}
async function excelListadoQuote() {
  loading3.value = true;
  await pricingStore.exportarExcelListadoQuote().catch((e) => {
    console.error(e);
  });
  loading3.value = false;
}
async function imprimirListMercadeo() {
  loading.value = true;
  await pricingStore.imprimirMercadeo().catch((e) => {
    console.error(e);
  });
  loading.value = false;
}
function abrirModal(quoteFila: CotizacionListado) {
  quote.value = quoteFila;
  id_master_recibidocotizacion.value = quoteFila.id_master_recibidocotizacion!;
  id_master_enviadocliente.value = quoteFila.id_master_enviadocliente!;
  fecha_enviocliente.value = quoteFila.fecha_enviocliente!;
  dialog.value = true;
}
async function updateQuoteRecibidoEnviado() {
  if ((await frmEstado.value!.validate()).valid) {
    appStore.spiner = true;
    const data = {
      id: quote.value!.id,
      id_master_recibidocotizacion: id_master_recibidocotizacion.value,
      id_master_enviadocliente: id_master_enviadocliente.value,
      fecha_enviocliente: fecha_enviocliente.value,
      id_status: id_status.value,
      comentario: comentario.value,
      id_pricing: sessionUser().id,
    };
    await aduanaStore.actualizarAduanaRecibidoEnviado(data);
    await aduanaStore.getListQuoteAduana();
    dialog.value = false;
    appStore.spiner = false;
    frmEstado.value!.reset();
  }
}
function registrarLlamada(id: number | undefined) {
  fromData.value = {
    date: moment().format("YYYY-MM-DD"),
    descripcion: "",
    identities: sessionUserIdOrEmpty(),
  };
  pricingStore.id = id!;
  dialogRegistroNotaLlamada.value = true;
}
async function guardarNota() {
  if ((await detallenota.value!.validate()).valid) {
    dialogRegistroNotaLlamada.value = false;
    appStore.spiner = true;

    const data = {
      id_quote: pricingStore.id,
      id_operador: fromData.value.identities,
      comentario: fromData.value.descripcion,
      fecha: fromData.value.date,
    };

    await aduanaStore.guardarNotaAduana(data).catch((err) => {
      console.log(err);
    });
    await aduanaStore.getListQuoteAduana().catch((err) => {
      console.log(err);
    });

    appStore.spiner = false;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalAprobar({ item: item }: { item: CotizacionListado }) {
  quote.value = item;
  nuevoexpediente.value = true;
  id_exp.value = "";
  Swal.fire({
    icon: "question",
    iconColor: "red",
    text: "¿Desea crear un nuevo expediente o seleccionar uno registrado?",
    showConfirmButton: true,
    confirmButtonText: "CREAR NUEVO EXPEDIENTE",
    showDenyButton: true,
    denyButtonText: "SELECCIONAR EXPEDIENTE",
    showCancelButton: true,
    cancelButtonText: "CERRAR",
    allowOutsideClick: false,
  }).then(async (res) => {
    if (res.isConfirmed) {
      Swal.fire({
        icon: "warning",
        title: "Fecha de Validez de la Cotización",
        html: '<input type="date" id="swal-input1" class="swal2-input">',
        allowOutsideClick: false,
        confirmButtonText: "ACEPTAR",
        showCancelButton: true,
        cancelButtonText: "CANCELAR",
        preConfirm: () => {
          const dateInput = (document.getElementById("swal-input1") as HTMLInputElement).value;
          if (!dateInput) {
            Swal.showValidationMessage("La fecha de validez es requerida");
          } else {
            const selectedDate = moment(dateInput, "YYYY-MM-DD"); // Parsea la fecha ingresada
            const currentDate = moment(); // Obtiene la fecha actual

            if (selectedDate.isSameOrBefore(currentDate)) {
              Swal.showValidationMessage(
                "La fecha debe ser mayor que la fecha actual"
              );
            } else {
              return dateInput;
            }
          }
        },
      }).then(async (res) => {
        fecha_validez = res.value;
        if (res.isConfirmed) {
          Swal.fire({
            icon: "info",
            title: "Aprobando Cotizacion",
            timerProgressBar: true,
            allowOutsideClick: false,
            timer: null as unknown as number,
            didOpen: () => {
              Swal.showLoading();
            },
          });
          await pricingStore.aprobarCotizacion({
            id_quote: quote.value!.id,
            nuevoexpediente: true,
            id_exp: id_exp.value,
            fecha_validez: fecha_validez,
          });
          appStore.spiner = true;
          await aduanaStore.getListQuoteAduana();
          appStore.spiner = false;
        }
      });
    }
    if (res.isDenied) {
      nuevoexpediente.value = false;
      aprobarflag.value = true;
    }
  });
}

async function aprobar() {
  if ((await frmAprobar.value!.validate()).valid) {
    Swal.fire({
      icon: "info",
      title: "Aprobando Cotizacion",
      timerProgressBar: true,
      allowOutsideClick: false,
      timer: null as unknown as number,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    await pricingStore.aprobarCotizacion({
      id_quote: quote.value!.id,
      nuevoexpediente: nuevoexpediente.value,
      id_exp: id_exp.value,
      fecha_validez: fecha_validez,
    });
    appStore.spiner = true;
    await aduanaStore.getListQuoteAduana();
    aprobarflag.value = false;
    appStore.spiner = false;
  }
}

function ira(ruta: string, id: number | undefined) {
  router.push({
    name: ruta,
    params: {
      id: id,
    },
  });
  // setTimeout(() => {
  //   window.location.reload();
  // }, 100);
}

async function eliminar(id: number | undefined, codigo: string | undefined) {
  Swal.fire({
    title: "ADVERTENCIA",
    text: "DESEA ELIMINAR LA COTIZACIÓN CON CÓDIGO: " + codigo,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ACEPTAR",
    cancelButtonText: "CANCELAR",
    reverseButtons: false,
  }).then(async (result) => {
    if (result.isConfirmed) {
      pricingStore.eliminarRegistro(id!);
      Swal.fire(
        "ELIMINADO!",
        "COTIZACIÓN " + codigo + " ELIMINADA CON ÉXITO",
        "success"
      );
      lstPricing.value = false;
      await aduanaStore.getListQuoteAduana().catch((err) => {
        console.log(err);
      });
      lstPricing.value = true;
    }
  });
}

onMounted(async () => {
  pricingStore.filtro = {
    id_marketing: "",
    id_status: "",
    id_entities: "",
    id_modality: "",
    id_shipment: "",
    id_incoterm: "",
    fechainicio: "",
    fechafin: "",
    estado: "activo",
  };

  appStore.spiner = true;
  await aduanaStore.getListQuoteAduana();
  await pricingStore.getListRecibidoCotizacion();
  await pricingStore.getListEnviadoCliente();
  await pricingStore.getModulesEntities();
  await pricingStore.getQuoteStatus();
  // await this.cargarMaster({
  //   idsentido: "",
  //   idtipocarga: "",
  //   idincoterms: "",
  // });
  appStore.spiner = false;
});
</script>

<template>
  <v-container fluid>
    <v-row v-if="lstPricing">
      <v-col cols="4">
        <v-text-field
          placeholder="Buscar..."
          label="Buscar"
          v-model="search"
          append-inner-icon="mdi-magnify"
        />
      </v-col>
      <v-col cols="8">
        <v-col
          cols="6"
          offset-md="6"
          class="text-right"
        >
          <v-btn
            color="red"
            @click="reporteListado()"
            class="mx-1"
            :loading="loading2"
            :disabled="loading2"
            size="small"
          >
            <v-icon>mdi-file-pdf-box</v-icon> REPORTE
          </v-btn>
          <v-btn
            color="teal-darken-4"
            @click="excelListadoQuote()"
            class="mx-1"
            :loading="loading3"
            :disabled="loading3"
            size="small"
          >
            <v-icon>mdi-file-excel</v-icon> REPORTE
          </v-btn>
          <v-btn
            color="red"
            @click="imprimirListMercadeo()"
            class="mx-1"
            :loading="loading"
            :disabled="loading"
            size="small"
          >
            <v-icon>mdi-file-pdf-box</v-icon> MERCADEO
          </v-btn>
          <v-btn
            color="info"
            @click="
              pricingStore.filtrarQuoteFlag =
                !pricingStore.filtrarQuoteFlag
            "
            class="mx-1"
            size="small"
          >
            Filtrar
          </v-btn>
        </v-col>
      </v-col>
    </v-row>
    <!-- @vue-expect-error return-object makes the expanded model hold rows, the typing says string ids -->
    <v-data-table
      :search="search"
      :headers="cabCotizaciones"
      :items="pricingStore.listQuotes"
      :expand-strategy="singleExpand ? 'single' : 'multiple'"
      v-model:expanded="expanded"
      item-value="index"
      return-object
      show-expand
      class="elevation-1"
    >
      <template #item="{ item, internalItem, isExpanded, toggleExpand }">
        <tr
          :class="[
            item.status_code == 3
              ? 't-red'
              : item.status_code == 5
                ? 't-green'
                : 't-black',
            isExpanded(internalItem) ? 'filaActivda' : '',
          ]"
        >
          <td />
          <td>
            <v-btn-toggle>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                    v-bind="props"
                   
                    @click="ira('VerAduana', item.id)"
                  >
                    <v-icon
                      color="#4A148C"
                      size="small"
                    >
                      mdi-eye
                    </v-icon>
                  </v-btn>
                </template>
                <span>Ver</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                    v-bind="props"
                   
                    @click="ira('EditarAduana', item.id)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon
                      color="#FB9514"
                      size="small"
                    >
                      mdi-pencil
                    </v-icon>
                  </v-btn>
                </template>
                <span>Editar</span>
              </v-tooltip>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                    v-bind="props"
                   
                    v-if="item.aprobadoflag"
                    @click="iraAprobado(item.id)"
                  >
                    <v-icon
                      color="#FB9514"
                      size="small"
                    >
                      mdi-pencil
                    </v-icon>
                  </v-btn>
                </template>
                <span>Editar</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                   
                    v-bind="props"
                    size="x-small"
                    @click="abrirModal(item)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon
                      color="#E65100"
                      size="small"
                    >
                      mdi-receipt-text-send-outline
                    </v-icon>
                  </v-btn>
                </template>
                <span>Actualizar Estado Cotización</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                   
                    v-bind="props"
                    size="x-small"
                    @click="registrarLlamada(item.id)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon
                      color="#1A237E"
                      size="small"
                    >
                      mdi-phone-plus
                    </v-icon>
                  </v-btn>
                </template>
                <span>Actualizar Registro Llamada</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    @click="to_direct({ url: item.url_folderonedrive })"
                    v-if="item.url_folderonedrive"
                  >
                    <v-icon
                      color="#FFAB00"
                      size="small"
                    >
                      mdi-folder
                    </v-icon>
                  </v-btn>
                </template>
                <span>Abrir Carpeta cotización</span>
              </v-tooltip>
              <!--  -->
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    @click="eliminar(item.id, item.codigo)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon
                      color="#A43542"
                      size="small"
                    >
                      mdi-delete
                    </v-icon>
                  </v-btn>
                </template>
                <span>Eliminar</span>
              </v-tooltip>
              <v-tooltip location="top">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    @click="toggleRow(item)"
                    v-if="!(item.statusmain == 0 || item.aprobadoflag)"
                  >
                    <v-icon
                      color="#263238"
                      size="small"
                    >
                      mdi-phone
                    </v-icon>
                  </v-btn>
                </template>
                <span>Historial llamada</span>
              </v-tooltip>
            </v-btn-toggle>
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ fecha(item.created) }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.recibidocotizacion }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.enviadocliente }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.status }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.codigo }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.ejecutivo_ventas }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.nombres }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.telefono }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.sentido }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.tipo_de_carga }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.incoterms }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.origen }}
          </td>
          <td @click="toggleExpand(internalItem)">
            {{ item.destino }}
          </td>
        </tr>
      </template>

      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length">
            <v-table>
              <thead class="headerDetails">
                <tr>
                  <th v-if="item.details!.length > 0">
                    Notas
                  </th>
                  <th v-if="item.details!.length > 0">
                    Pricing Call
                  </th>
                  <th>Fecha Enviado Al Cliente</th>
                </tr>
              </thead>
              <tbody v-if="item.details!.length > 0">
                <!-- @vue-expect-error the row object is the key -->
                <tr
                  v-for="i in item.details!"
                  :key="i"
                >
                  <td>{{ i.notes }}</td>
                  <td>{{ i.namelong }}</td>
                  <td>{{ item.fecha_enviocliente }}</td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td>{{ item.fecha_enviocliente }}</td>
                </tr>
              </tbody>
            </v-table>
          </td>
        </tr>
      </template>
    </v-data-table>
    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      :overlay="false"
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Actualizar Recibido / Enviado
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialog = !dialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmEstado">
            <v-select
              auto-select-first
              :items="
                pricingStore.listQuoteStatus.filter((v) => v.id != 1)
              "
              label="ESTADO DE LA COTIZACIÓN"
              v-model="id_status"
              :rules="[(v) => !!v || 'Dato Requerido']"
              item-title="name"
              item-value="id"
            />
            <v-select
              :items="pricingStore.listRecibidoCotizacion"
              item-value="id"
              item-title="descripcion"
              v-model="id_master_recibidocotizacion"
              label="RECIBIDO COTIZACION EN PRICING"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-select
              :items="pricingStore.listEnviadoCliente"
              item-value="id"
              item-title="descripcion"
              v-model="id_master_enviadocliente"
              label="ENVIADO AL CLIENTE"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-text-field
              type="date"
              label="FECHA DE ENVÍO AL CLIENTE"
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-if="
                pricingStore.listEnviadoCliente.filter(
                  (v) => v.id == id_master_enviadocliente && v.codigo == 'SE'
                ).length > 0
              "
              v-model="fecha_enviocliente"
            />
            <v-text-field
              label="COMENTARIO"
              v-model="comentario"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="updateQuoteRecibidoEnviado"
          >
            Guardar
          </v-btn>
          <v-btn
            color="red"
            @click="dialog = !dialog"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogRegistroNotaLlamada"
      v-if="dialogRegistroNotaLlamada"
      max-width="30%"
    >
      <v-card>
        <v-card-title>
          <span class="text-headline-medium">Detalle de Nota de llamada</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="detallenota">
            <v-text-field
              v-model="fromData.date"
              readonly
              type="date"
            />
            <v-text-field
              v-model="fromData.descripcion"
              :rules="[(v) => !!v || 'El dato es requerido']"
              label="Descripcion"
            />
            <v-autocomplete
              :items="pricingStore.listEjecutivo"
              label="Ejecutivo."
              density="compact"
              clearable
              item-title="name"
              item-value="id_entitie"
              v-model="fromData.identities"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <div class="flex-grow-1 text-right">
            <v-btn
              variant="text"
              color="success"
              @click="guardarNota"
            >
              Aceptar
            </v-btn>
            <v-btn
              variant="text"
              color="red"
              @click="dialogRegistroNotaLlamada = !dialogRegistroNotaLlamada"
            >
              Cancelar
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="aprobarflag"
      scrollable
      persistent
      max-width="35%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          SELECCIONE EL EXPEDIENTE A ASOCIAR:
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="aprobarflag = !aprobarflag"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmAprobar">
            <v-row>
              <v-autocomplete
                :items="appStore.itemsMasterList"
                v-model="id_exp"
                label="Expediente"
                item-title="code_master"
                item-value="id"
                :rules="[(v) => !!v || 'Dato Requerido']"
              />
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            size="small"
            @click="aprobar()"
            color="success"
          >
            Generar
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            @click="aprobarflag = !aprobarflag"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.headerDetails {
  color: #000 !important;
  background: #80deea !important;
}
.t-red {
  color: red;
}
.t-green {
  color: green;
}
.t-black {
  color: #000;
}
.filaActivda {
  background: #0097a7;
}
/* #create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
} */
</style>

<!--  -->
