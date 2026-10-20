<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import axios from '@/api/http';
import moment from "moment";
import Swal from "sweetalert2";
import type { ApiResponse } from "@/types/api";
import type { ConceptoSolicitud, DocumentoProveedor, SolicitudPagoProveedor } from "@/types/billing";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

const rootStore = useStore();
const route = useRoute();
const actualizar = computed(() => rootStore.state.actualizar);
const itemsDataConceptos = computed<ConceptoSolicitud[]>(() => rootStore.state.itemsDataConceptos);

const dialogSolicitud = ref(false);
const dialogSolicitudDivision = ref(false);
const nameproveedorLocal = ref("");
const TotalLocal = ref<number | string>("");
const proveedorId = ref<number | string>("");
const comentarios = ref("");
const codigo_pago = ref("");
const codigo_master = ref("");
const selected = ref<ConceptoSolicitud[]>([]);
const selectedAccount = ref<unknown[]>([]);
const total = ref<number | string>(0);
const e1 = ref(1);
const dataList = ref(false);
const dialogInvoice = ref(false);
const radio = ref(1);
const boolFile = ref(false);
const dialogListInvoince = ref(false);
const payPath = ref("");
const payfile = ref("" as unknown as File | File[]);
const date = ref<string | null>(new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10));
const menu = ref(false);
const dateOnOpen = ref<string | null>(null);
const nro_invoice = ref("");
const checkPago = ref(false);
const checkMaster = ref(false);
const nameproveedorSeleccionado = ref("");
const dialogPayment = ref(false);
const itemsSPayment = ref<SolicitudPagoProveedor[]>([]);
const itemsListInvoice = ref<DocumentoProveedor[]>([]);
const itemsInvoice = ref<unknown[]>([]);
const search = ref("");
const sPaymentId = ref<number | string>("");
const headers = [
  {
    title: "Concepto",
    align: "start",
    sortable: false,

    key: "concepto",
  },
  {
    title: "Monto",

    key: "monto_op",
  },
  {
    title: "Status",

    key: "status",
  },
] as const;
const headersPdf = [
  {
    title: "Nombre",
    align: "start",
    sortable: false,
    key: "path",
  },
  {
    title: "Fecha Creado",
    key: "fecha_letra",
  },
  {
    title: "Hora Creado",
    key: "hora_letra",
  },
  {
    title: "Fecha de Solicitud",
    key: "fecha_sol_letra",
  },
  {
    title: "Fecha de Pago",
    key: "fecha_pago_letra",
  },
  {
    title: "Ver",
    key: "accion",
  },
  {
    title: "Status",
    key: "status",
  },
  {
    title: "Enviar",
    key: "accions",
  },
] as const;
const headersInvoice = [
  {
    title: "Nombre",
    key: "originalname",
  },
  {
    title: "Fecha",
    key: "date_letra",
  },
  {
    title: "Ver",
    key: "path",
  },
  {
    title: "Acción",
    key: "action",
  },
] as const;
const headersAccount = [
  {
    title: "Cuenta",
    align: "start",
    sortable: false,
    key: "nameaccount",
  },
  { title: "Banco", key: "namebanks" },
  { title: "Moneda", key: "namecoins" },
  { title: "Número de cuenta", key: "accountnumber" },
] as const;

function setDate(value: moment.MomentInput) {
  date.value = moment(value).format("YYYY-MM-DD");
}
function openDoc(path: string) {
  window.open(path, "_blank");
}
function cleandData() {
  nro_invoice.value = "";
  payfile.value = [];
  boolFile.value = false;
}
function openInvoice(id: number, nameproveedor: string, type: number) {
  itemsListInvoice.value = [];
  if (type == 1) {
    proveedorId.value = id;

    _getInvoice();
    nameproveedorSeleccionado.value = nameproveedor;
  } else {
    proveedorId.value = id;

    _getInvoice();
    nameproveedorSeleccionado.value = nameproveedor;
    //vm.dialogInvoice = true;
  }
}
async function _getInvoice() {
  const data = {
    id_house: route.params.id_house,
    id_proveedor: proveedorId.value,
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "get",
    url:
      import.meta.env.VITE_URL_MAIN +
      `list_invoice_path/${route.params.id_house}/${proveedorId.value}`,

    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios<ApiResponse<DocumentoProveedor[]>>(config)
    .then(function (response) {
      dialogListInvoince.value = true;
      if (!!response.data.data[0]!.estadoflag) {
        itemsListInvoice.value = response.data.data;
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _setInvoice() {
  Swal.fire({
    icon: "info",
    title: "Guardando...",
    text: "Por favor espere",
  });
  const data = {
    id_house: route.params.id_house,
    id_proveedor: proveedorId.value,
    id_path: payPath.value,
    type_pago: radio.value,
    number: nro_invoice.value,
    date: date.value,
    status: 1,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setInvoice",

    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      itemsInvoice.value = response.data.data;
      rootStore.dispatch("_getTotalesProveedor");
      Swal.fire({
        icon: "success",
        title: "Documento Cargado",
        text: "El documento ha sido cargado correctamente",
      });

      cleandData();
      _getInvoice();
      dialogInvoice.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _delInvoice(id: number) {
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "delInvoice/" + id,

    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsInvoice.value = response.data.data;

      _getInvoice();
      dialogInvoice.value = false;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _uploadFile() {
  const data = new FormData();
  data.append("name", "Prueba");
  data.append("file", payfile.value as Blob);

  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "uploadAllPath",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };

  axios<ApiResponse<{ insertid: number }[]>>(config)
    .then(function (response) {
      boolFile.value = true;
      payPath.value = JSON.stringify(response.data.data[0]!.insertid);
    })
    .catch(function (error) {
      console.error(error);
    });
}
function openPayments(id: number, type: number) {
  if (type == 1) {
    Swal.fire({
      icon: "warning",
      title: "Lo sentimos",
      text: "No puede realizar solicitudes hasta colocar un proveedor real.",
    });
  } else {
    _getSPaymentPro(id);
    sPaymentId.value = id;
    dataList.value = false;
    dialogPayment.value = true;
  }
}
function viewPdf(pdf: string) {
  window.open(import.meta.env.VITE_URL_MAIN + pdf, "_blank");
}
async function _getAccountsNumber() {
  const data = {
    id_branch: sessionBranchId(),
  };
  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN + "getAccountsNumber/" + proveedorId.value,
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  await axios(config)
    .then(function (response) {
      rootStore.state.itemsDataAccountsNumberList = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function sendAdmin(id: number) {
  Swal.fire({
    title: "¿Desea realizar esta solicitud a Administración?",
    showDenyButton: true,

    confirmButtonText: "Si",
    denyButtonText: `No`,

    icon: "info",
  }).then((result) => {
    /* Read more about isConfirmed, isDenied below */
    if (result.isConfirmed) {
      const data = {
        fecha_sol: new Date(
          Date.now() - new Date().getTimezoneOffset() * 60000
        )
          .toISOString()
          .substr(0, 10),
        status: 2,
      };
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "putSPaymentPro/" + id,
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function () {
          Swal.fire({
            icon: "success",
            title: "Excelente",
            text: "Solicitud enviada correctamente",
          });

          _getSPaymentPro(sPaymentId.value as number);
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  });

  _getAccountsNumber();

  // @ts-expect-error nameproveedor is not defined in this scope
  nameproveedorLocal.value = nameproveedor;
  // @ts-expect-error pagar is not defined in this scope
  TotalLocal.value = pagar;
}
async function _getSPaymentPro(id: number) {
  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN +
      "getSPaymentPro/" +
      route.params.id_house +
      "/" +
      id +
      "/" +
      sessionBranchId(),
    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      itemsSPayment.value = response.data.data;
      dataList.value = true;
    })
    .catch(function (error) {
      console.error(error);
    });
}
function openPaymentFile(path: string) {
  window.open(path, "_blank");
}
function solicitar(nameproveedor: string, pagar: number | string, id: number, type: number) {
  if (type == 1) {
    Swal.fire({
      icon: "warning",
      title: "Lo sentimos",
      text: "No puede realizar solicitudes hasta colocar un proveedor real.",
    });
  } else {
    proveedorId.value = id;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    (selected.value = []),
      (selectedAccount.value = []),
      Swal.fire({
          title: "¿Desea realizar una solicitud con división de pago?",
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: "Si",
          denyButtonText: `No`,
          cancelButtonText: "Cancelar",
          imageUrl: "https://point.qreport.site/files/alto_icono.png",
        })
        .then((result) => {
          /* Read more about isConfirmed, isDenied below */
          if (result.isConfirmed) {
            _getConceptos();
          } else if (result.isDenied) {
            _getConceptosSimple();
            //vm.selected = vm.$store.state.itemsDataConceptos;
            dialogSolicitud.value = !dialogSolicitud.value;
          }
        });

    _getAccountsNumber();

    nameproveedorLocal.value = nameproveedor;
    TotalLocal.value = pagar;
  }
}
async function _generateSolicitud() {
  _calcularTotales();
  Swal.fire({
    icon: "info",
    title: "Generando PDF...",
    text: "Por favor espere",
  });
  let sentido;
  if (rootStore.state.report_id_sentido == "") {
    sentido = "";
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    sentido = rootStore.state.report_id_sentido;
  }

  let pago;
  if ((total.value as number) > 0) {
    pago = total.value;
  } else {
    pago = TotalLocal.value;
  }

  let concepto = [];

  if (selected.value.length > 0) {
    concepto = selected.value;
  } else {
    concepto = rootStore.state.itemsDataConceptos;
  }

  const datas = {
    id_house: route.params.id_house,
    id_proveedor: proveedorId.value,
    conceptos: concepto,
    monto: pago,
    status: 1,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "setSPaymentPro",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: datas,
  };

  axios(config)
    .then(function (response) {
      const data = {
        nameProveedor: nameproveedorLocal.value,
        nameConsignatario: rootStore.state.dataHouse_consigners,
        totalPagar: TotalLocal.value,
        expediente: rootStore.state.dataHouse_exp,
        fecha: currentDate(),
        totalProveedores: rootStore.state.itemsDataTotalesProveedor,
        comentarios: comentarios.value,
        codigo_pago: codigo_pago.value,
        codigo_master: codigo_master.value,
        cuentas: selectedAccount.value,
        operador: rootStore.state.dataHouse_operador,
        conceptos: rootStore.state.itemsDataConceptos,
        selected: selected.value,
        totalSelected: total.value,
        number: response.data.data[0].number,
        url_logo: sessionUser().path,
      };
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "pdfSolicitud",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };

      axios(config)
        .then(function (response) {
          rootStore.dispatch("_getTotalesProveedor");
          Swal.fire({
            icon: "success",
            title: "PDF Generado",
            text: "El PDF se descargará automaticamente",
          });
          window.open(
            import.meta.env.VITE_URL_MAIN + response.data.path,
            "_blank"
          );
        })
        .catch(function (error) {
          console.error(error);
        });
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _calcularTotales() {
  if (selected.value.length > 0) {
    total.value = 0;

    let calculo = 0;

    selected.value.map((item) => {
      calculo = calculo + parseFloat(String(item.total_op));

      total.value = calculo.toFixed(2);
    });
  } else {
    total.value = 0;

    let calculo = 0;

    rootStore.state.itemsDataConceptos.map((item: ConceptoSolicitud) => {
      calculo = calculo + parseFloat(String(item.total_op));

      total.value = calculo.toFixed(2);
    });
  }
}
function currentDate() {
  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const current = new Date();
  const date = `${current.getDate()} de ${
    monthNames[current.getMonth()]
  } del ${current.getFullYear()}`;
  return date;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _deleteServices(id: number) {
  const data = {
    id: id,
  };
  const config = {
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "deleteServices",
    headers: {
     
      "Content-Type": "application/json",
    },
    data: data,
  };
  axios(config)
    .then(function (response) {
      if (response.data.status == 200) {
        _validaData();
      }
    })
    .catch(function (error) {
      console.error(error);
    });
}
function _validaData() {
  rootStore.state.spiner = true;
  if (route.params.id_house) {
    rootStore.state.house_Id_get = route.params.id_house;
    const data = {
      id: route.params.id_house,
      id_branch: sessionBranchId(),
    };
    const config = {
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getHouseServices",
      headers: {
       
        "Content-Type": "application/json",
      },
      data: data,
    };
    axios(config)
      .then(function (response) {
        rootStore.state.itemsHouseServices = response.data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
  }
  rootStore.state.spiner = false;
}
async function _getConceptosSimple() {
  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN +
      "getEgresosDivision/" +
      route.params.id_orders +
      "/" +
      proveedorId.value,
    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      rootStore.state.itemsDataConceptos = response.data.data;
    })
    .catch(function (error) {
      console.error(error);
    });
}
async function _getConceptos() {
  const config = {
    method: "post",
    url:
      import.meta.env.VITE_URL_MAIN +
      "getEgresosDivision/" +
      route.params.id_orders +
      "/" +
      proveedorId.value,
    headers: {
     
      "Content-Type": "application/json",
    },
  };
  await axios(config)
    .then(function (response) {
      rootStore.state.itemsDataConceptos = response.data.data;
      dialogSolicitudDivision.value = !dialogSolicitudDivision.value;
    })
    .catch(function (error) {
      console.error(error);
    });
}

watch(menu, (open) => {
  if (open) dateOnOpen.value = date.value;
  else date.value = dateOnOpen.value;
});
watch(actualizar, () => {
  rootStore.dispatch("_getTotalesProveedor");
});

onMounted(() => {
  _validaData();
});
</script>

<template>
  <div>
    <h3>Total por Proveedores</h3>

    <v-dialog
      width="780"
      v-model="dialogSolicitud"
    >
      <v-stepper v-model="e1">
        <v-stepper-header>
          <v-stepper-item
            :complete="e1 > 1"
            :value="1"
            title="Códigos"
          />

          <v-divider />

          <v-stepper-item
            :complete="e1 > 2"
            :value="2"
            title="Cuentas Bancarias"
          />
          <v-divider />

          <v-stepper-item
            :complete="e1 > 3"
            :value="3"
            title="Observaciones"
          />
        </v-stepper-header>

        <v-stepper-window>
          <v-stepper-window-item :value="1">
            <v-card
              class="mb-12"
              elevation="0"
              height="200px"
            >
              <v-card-text>
                <v-row density="compact">
                  <v-col
                    md="6"
                    cols="12"
                  >
                    <v-checkbox
                      v-model="checkPago"
                      label="Aplica código de pago"
                    />
                    <v-text-field
                      v-if="checkPago"
                      v-model="codigo_pago"
                      label="CODIGO DE PAGO"
                    >
                      CODIGO DE PAGO
                    </v-text-field>
                  </v-col>
                  <v-col
                    md="6"
                    cols="12"
                  >
                    <v-checkbox
                      v-model="checkMaster"
                      label="Aplica Número de Expediente"
                    />
                    <v-text-field
                      v-if="checkMaster"
                      v-model="codigo_master"
                      label="CODIGO DE MASTER BL"
                    >
                      CODIGO DE MASTER BL
                    </v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <v-btn
              color="primary"
              @click="e1 = 2"
            >
              Continuar
            </v-btn>

            <v-btn
              variant="text"
              @click="e1 = 1"
            >
              Volver
            </v-btn>
            <v-btn
              variant="text"
              @click="dialogSolicitud = false"
            >
              Cerrar
            </v-btn>
          </v-stepper-window-item>

          <v-stepper-window-item :value="2">
            <v-card
              class="mb-12"
              elevation="0"
              height="200px"
            >
              <v-card-text>
                <b>Cuentas</b>
                <v-data-table
                  v-if="!checkPago"
                  v-model="selectedAccount"
                  :headers="headersAccount"
                  :items="rootStore.state.itemsDataAccountsNumberList"
                  hide-default-footer
                  item-value="id"
                  return-object
                  show-select
                  class="elevation-0"
                  density="compact"
                />
                <h2 class="mt-5">
                  Ya seleccionó el codigo de pago
                </h2>
              </v-card-text>
            </v-card>

            <v-btn
              color="primary"
              @click="e1 = 3"
            >
              Continuar
            </v-btn>

            <v-btn
              variant="text"
              @click="e1 = 1"
            >
              Volver
            </v-btn>
            <v-btn
              variant="text"
              @click="dialogSolicitud = false"
            >
              Cerrar
            </v-btn>
          </v-stepper-window-item>

          <v-stepper-window-item :value="3">
            <v-card
              class="mb-12"
              elevation="0"
              height="200px"
            >
              <v-card-text>
                <v-textarea
                  v-model="comentarios"
                  rows="3"
                  label="Observación Adicionales"
                />
                <v-btn
                  block
                  @click="_generateSolicitud()"
                  class="mt-2"
                  color="primary"
                >
                  GENERAR SOLICITUD
                </v-btn>
              </v-card-text>
            </v-card>

            <v-btn
              variant="text"
              @click="e1 = 2"
            >
              Volver
            </v-btn>
            <v-btn
              variant="text"
              @click="dialogSolicitud = false"
            >
              Cerrar
            </v-btn>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-dialog>

    <v-dialog
      width="680"
      v-model="dialogSolicitudDivision"
    >
      <v-card>
        <v-card-title> Solicitar pago por concepto</v-card-title>

        <v-card-text>
          <v-row density="compact">
            <v-col
              md="6"
              cols="12"
            >
              <v-text-field
                v-model="codigo_pago"
                label="CODIGO DE PAGO"
              >
                CODIGO DE PAGO
              </v-text-field>
            </v-col>
            <v-col
              md="6"
              cols="12"
            >
              <v-text-field
                v-model="codigo_master"
                label="CODIGO DE MASTER BL"
              >
                CODIGO DE MASTER BL
              </v-text-field>
            </v-col>
          </v-row>

          <v-textarea
            v-model="comentarios"
            rows="3"
            label="Observación Adicionales"
          />

          <h2>Seleccione los conceptos</h2>

          <v-data-table
            v-model="selected"
            :headers="headers"
            hide-default-header
            :items="itemsDataConceptos"
            hide-default-footer
            item-value="concepto"
            return-object
            :items-per-page-options="[10, 20, 30, 40, 50]"
            :items-per-page="30"
            density="compact"
            show-select
            class="elevation-0"
          >
            <template #[`item.data-table-select`]="{ item, props }">
              <v-checkbox-btn
                v-bind="props"
                :readonly="item.pagado == 1"
                v-if="(!item.pagado as unknown) == 1"
              />
            </template>
            <template #[`item.status`]="{ item }">
              <v-chip
                v-if="item.pagado == 1"
                class="ma-2 text-white"
                color="green"
                size="small"
                variant="flat"
              >
                {{ item.status == 1 ? "Pagado" : "" }}
              </v-chip>

              <v-icon
                class="btn__add mr-2"
                size="large"
                color="grey"
                v-if="item.pagado == 1"
                @click="openPaymentFile(item.path as string)"
              >
                mdi-eye
              </v-icon>
            </template>
          </v-data-table>

          <b>Cuentas</b>
          <v-data-table
            v-model="selectedAccount"
            :headers="headersAccount"
            :items="rootStore.state.itemsDataAccountsNumberList"
            hide-default-footer
            item-value="id"
            return-object
            show-select
            density="compact"
            class="elevation-0"
          />

          <v-btn
            block
            @click="_generateSolicitud()"
            class="mt-2"
            color="primary"
          >
            GENERAR SOLICITUD
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      width="70%"
      v-model="dialogPayment"
    >
      <v-card class="mx-auto">
        <v-toolbar
          color="cyan"
          class="text-white"
        >
          <v-toolbar-title>SOLICITUDES GENERADAS</v-toolbar-title>

          <v-spacer />
        </v-toolbar>
        <v-card-title>
          <v-text-field
            v-model="search"
            append-inner-icon="mdi-magnify"
            label="Buscar solicitud"
            single-line
            hide-details
          />
        </v-card-title>
        <v-container
          v-if="!dataList"
          style="height: 400px"
        >
          <v-row class="fill-height align-content-center justify-center">
            <v-col
              class="text-body-large text-center"
              cols="12"
            >
              Cargando informacíon
            </v-col>
            <v-col cols="6">
              <v-progress-linear
                color="deep-purple-accent-4"
                indeterminate
                rounded
                height="6"
              />
            </v-col>
          </v-row>
        </v-container>
        <v-data-table
          v-if="dataList"
          :headers="headersPdf"
          :items="itemsSPayment"
          :search="search"
        >
          <template #[`item.status`]="{ item }">
            <v-chip
              v-if="item.status == 2"
              class="ma-2 text-white"
              color="orange"
              variant="flat"
            >
              {{ item.status == 2 ? "Pendiente" : "" }}
            </v-chip>
            <v-chip
              v-if="item.status == 3"
              class="ma-2 text-white"
              color="green"
              variant="flat"
            >
              {{ item.status == 3 ? "Pagado" : "" }}
            </v-chip>
          </template>
          <template #[`item.accion`]="{ item }">
            <v-icon
              class="mr-2"
              @click="viewPdf(item.path)"
            >
              mdi-eye
            </v-icon>
          </template>
          <template #[`item.accions`]="{ item }">
            <v-icon
              v-if="item.status != 3"
              class="mr-2"
              @click="sendAdmin(item.id)"
            >
              mdi-send
            </v-icon>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>

    <v-dialog
      max-width="800"
      v-model="dialogListInvoince"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Facturas y Performance de {{ nameproveedorSeleccionado }}
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="dialogInvoice = true"
            color="primary"
          >
            Cargar Nueva
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersInvoice"
            :items="itemsListInvoice"
            density="compact"
            item-value="id"
            class="elevation-0"
          >
            <template #[`item.originalname`]="{ item }">
              <v-icon
                v-if="item.type == 'pdf'"
                color="red"
                class="mr-2"
              >
                mdi-file-pdf-box
              </v-icon>
              <v-icon
                v-if="
                  item.type == 'png' ||
                    item.type == 'jpg' ||
                    item.type == 'jpeg'
                "
                color="blue-grey-darken-1"
                class="mr-2"
              >
                mdi-file-image
              </v-icon>
              {{
                item.type_pago == 1
                  ? "FACTURA"
                  : String("") || item.type_pago == 2
                    ? "PERFORMANCE"
                    : "OTRO"
              }}
              -
              {{ item.number }}
            </template>
            <template #[`item.path`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                size="large"
                color="grey"
                @click="openDoc(item.path)"
              >
                mdi-eye
              </v-icon>
            </template>
            <template #[`item.action`]="{ item }">
              <v-icon
                class="btn_add mr-2"
                size="large"
                color="red"
                @click="_delInvoice(item.id)"
              >
                mdi-delete
              </v-icon>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      width="800"
      v-model="dialogInvoice"
    >
      <v-card>
        <v-card-title>
          <h3>Subir factura o proforma para {{ nameproveedorSeleccionado }}</h3>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row density="compact">
              <v-col
                cols="12"
                md="12"
              >
                <v-radio-group
                  v-model="radio"
                  inline
                >
                  <v-radio
                    label="Factura"
                    value="1"
                  />
                  <v-radio
                    label="Performance"
                    value="2"
                  />
                  <v-radio
                    label="Otro"
                    value="3"
                  />
                </v-radio-group>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-menu
                  v-model="menu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  min-width="auto"
                >
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="date"
                      :label="`Fecha de ${
                        radio == 1
                          ? 'Factura'
                          : String('') || radio == 2
                            ? 'Performance'
                            : 'Otro'
                      }`"
                      prepend-icon="mdi-calendar"
                      readonly
                     
                      v-bind="props"
                    />
                  </template>
                  <v-locale-provider locale="es">
                    <v-date-picker
                      :model-value="date"
                      @update:model-value="setDate"
                      hide-header
                    >
                      <template #actions>
                        <v-spacer />
                        <v-btn
                          variant="text"
                          color="primary"
                          @click="menu = false"
                        >
                          Cancel
                        </v-btn>
                        <v-btn
                          variant="text"
                          color="primary"
                          @click="dateOnOpen = date; menu = false"
                        >
                          OK
                        </v-btn>
                      </template>
                    </v-date-picker>
                  </v-locale-provider>
                </v-menu>
              </v-col>
              <v-col
                cols="12"
                md="6"
              >
                <v-text-field
                  v-model="nro_invoice"
                  :label="`Nro de ${
                    radio == 1
                      ? 'Factura'
                      : String('') || radio == 2
                        ? 'Performance'
                        : 'Otro'
                  }`"
                />
              </v-col>

              <v-col
                cols="12"
                md="7"
              >
                <v-file-input
                  v-if="!boolFile"
                  v-model="payfile"
                  show-size
                  :label="`Adjuntar File de ${
                    radio == 1
                      ? 'Factura'
                      : String('') || radio == 2
                        ? 'Performance'
                        : 'Otro'
                  }`"
                />

                <v-chip
                  block
                  v-if="boolFile"
                  size="large"
                  class=""
                  color="success"
                  variant="outlined"
                >
                  <v-icon start>
                    mdi-check
                  </v-icon>
                  Archivo cargado éxitosamente
                </v-chip>
              </v-col>
              <v-col cols="5">
                <!-- @vue-expect-error comparing an array by reference is always false -->
                <v-btn
                  :disabled="boolFile || payfile == []"
                  color="blue-grey"
                  block
                  class="ma-2 text-white"
                  size="large"
                  @click="_uploadFile()"
                >
                  Subir
                  {{
                    radio == 1
                      ? "Factura"
                      : String("") || radio == 2
                        ? "Performance"
                        : "Otro"
                  }}
                  <v-icon end>
                    mdi-cloud-upload
                  </v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            @click="_setInvoice()"
            :disabled="!boolFile"
          >
            GUARDAR
            {{
              radio == 1 ? "Factura" : String("") || radio == 2 ? "Performance" : "Otro"
            }}
          </v-btn>

          <v-btn
            variant="outlined"
            color="red"
            @click="dialogInvoice = !dialogInvoice"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-table
      density="compact"
      max-height="440"
      fixed-header
    >
      <template #default>
        <thead>
          <tr>
            <th class="text-left">
              Proveedor
            </th>
            <th class="text-left">
              Total Pricing
            </th>
            <th class="text-left">
              Total Operaciones
            </th>
            <th class="text-left">
              Facturas o Proformance
            </th>

            <th class="text-left">
              Generar PDF de pago
            </th>
            <th class="text-left">
              Solicitar a Administración
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            :style="`background:${item.color}`"
            v-for="item in rootStore.state.itemsDataTotalesProveedor"
            :key="item.id"
          >
            <td>{{ item.nameproveedor }}</td>
            <td>{{ item.total_pr }}</td>
            <td>{{ item.total_op }}</td>
            <td>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-btn
                   
                    v-bind="props"
                    @click="
                      openInvoice(
                        item.id_proveedor,
                        item.nameproveedor,
                        item.type
                      )
                    "
                    elevation="0"
                    size="small"
                    color="white"
                  >
                    <v-icon :color="item.docs > 0 ? 'blue' : 'grey'">
                      mdi-file-compare
                    </v-icon>
                  </v-btn>
                </template>
                <span>{{ item.docs }}</span>
              </v-tooltip>
            </td>
            <td>
              <v-btn
                @click="
                  solicitar(
                    item.nameproveedor,
                    item.total_op,
                    item.id_proveedor,
                    item.type
                  )
                "
                elevation="0"
                size="small"
                color="white"
              >
                <v-icon color="blue">
                  mdi-send
                </v-icon>
              </v-btn>
            </td>
            <td>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-btn
                   
                    v-bind="props"
                    @click="openPayments(item.id_proveedor, item.type)"
                    elevation="0"
                    size="small"
                    color="white"
                  >
                    <v-icon :color="item.solicitudes > 0 ? 'blue' : 'grey'">
                      mdi-email-arrow-right
                    </v-icon>
                  </v-btn>
                </template>
                <span>{{ item.solicitudes }}</span>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </template>
    </v-table>
  </div>
</template>

<style lang="scss" scoped>
.listMain {
  padding: 0px;
}

.btn_add {
  cursor: pointer;
}
</style>
