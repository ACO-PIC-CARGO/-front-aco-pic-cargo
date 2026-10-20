<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import moment from "moment";
import axios from "@/api/http";
import { useSecuritysStore } from "@/stores/securitys";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import { useAduanaStore } from "@/stores/aduana";
import type { ExpedienteMaster, HouseAsociadoMaster, OpcionCosto } from "@/types/cotizacion";
import type { ProveedorPricing } from "@/types/entidades";

const ConfigCotizacion = defineAsyncComponent(() =>
  import("@/components/folderPricing/ConfigExpediente.vue"));

const route = useRoute();
const appStore = useAppStore();
const aduanaStore = useAduanaStore();
const pricingStore = usePricingStore();
const configEmpresaStore = useConfigEmpresaStore();
const securitysStore = useSecuritysStore();

const notaForm = useTemplateRef("nota");
const frmAprobar = useTemplateRef("frmAprobar");
const masterForm = useTemplateRef("masterForm");

const nuevoexpediente = ref<boolean | string>("");
const aprobarflag = ref(false);
const id_exp = ref<number | string>("");
const fecha_validez = ref<string | undefined>("");
const descripcionNota = ref("");
const dialog = ref(false);
const seleccionQuoteAprobar = ref(false);
const page = ref(1);
const nro_propuesta = ref<number | string>("");
const mostrarAdvertencia = ref(false);
const textValidacionCotizacionMaster = ref<string[]>([]);
const dialogConfig = ref(false);
const dialogCostos = ref(false);
const textValidacionPago = ref("");
const activarBtnContinuar = ref(true);
const loading = ref(false);
const lstHouse = ref<HouseAsociadoMaster[]>([]);
const dialogHouse = ref(false);
const id_house = ref<number | string>("");
const optionCostos = [
  { id: "0", text: "No hacer ninguna acción" },
  { id: "1", text: "Reemplazar los costos, ya existente de proveedores" },
  {
    id: "2",
    text: "Sumar los nuevos costos, a los costos ya existentes de proveedores",
  },
];
const optionHouse = [
  // { id: "0", text: "Crear un nuevo house" },
  {
    id: "1",
    text: "Reemplazar los nuevos montos, ya existente del house",
  },
  {
    id: "2",
    text: "Sumar los nuevos montos, a los costos ya existentes del house",
  },
];
const id_opcion = ref<number | string>("0");
const id_opcion_house = ref<number | string>("0");

onMounted(async () => {
  // console.log("generaInstructivoparaguardataAduana");
  nextTick(async () => {
    setTimeout(async () => {
      await aduanaStore.generaInstructivoparaguardataAduana();
    }, 4000);
  });
});

async function guardarConfig() {
  await configEmpresaStore.GuardarConfiguracionEmpresa();
  await securitysStore.ObtenerDatosConfig();
  dialogConfig.value = false;
  abrirSeleccionDeQuoteAAprobar();
}
function verificarMaster() {
  mostrarAdvertencia.value = false;
  textValidacionCotizacionMaster.value = [];
  const master = appStore.itemsMasterList.filter(
    (v: ExpedienteMaster) => v.id == id_exp.value
  )[0]!;
  if (
    !(
      aduanaStore.datosPrincipales.idsentido ==
      master.id_modality
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Modalidad");
  }
  if (
    !(
      aduanaStore.datosPrincipales.idtipocarga ==
      master.id_shipment
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Tipó de Cargar");
  }
  if (
    !(
      aduanaStore.datosPrincipales.idincoterms ==
      master.id_incoterms
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Incoterms");
  }

  if (
    !(
      aduanaStore.datosPrincipales.idorigen ==
      master.id_port_begin
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Puerto de origien");
  }
  if (
    !(
      aduanaStore.datosPrincipales.iddestino ==
      master.id_port_end
    )
  ) {
    mostrarAdvertencia.value = true;
    textValidacionCotizacionMaster.value.push("Puerto de Destino");
  }
  console.log(textValidacionCotizacionMaster.value);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function imprimir() {
  for (
    let index = 0;
    index <
    aduanaStore.opcionCostos.filter((v) => !!v.selected)
      .length;
    index++
  ) {
    ((index: number) => {
      pricingStore.imprimirInstructivoQuote(
        aduanaStore.opcionCostos[index]!
          .nro_propuesta as unknown as { nro_propuesta?: number }
      );
    })(index); // Pasamos 'index' como argumento y establecemos el contexto a 'this'
  }
}
async function guardarNota() {
  if ((await notaForm.value!.validate()).valid) {
    appStore.spiner = true;
    const data = {
      name: descripcionNota.value,
      id_quote: route.params.id,
    };
    await pricingStore.setNoteQuote(data);
    notaForm.value!.reset();
    await pricingStore.getInstructivoId({ id: route.params.id as string });
    dialog.value = false;
    appStore.spiner = false;
  }
}
async function abrirSeleccionDeQuoteAAprobar() {
  const val = JSON.parse(sessionStorage.getItem("ConfigEmpresa") as string);
  dialogConfig.value = !val.existemaster;
  if (dialogConfig.value) {
    return false;
  }
  await appStore.cargarMaster(aduanaStore.datosPrincipales as Parameters<typeof appStore.cargarMaster>[0]);

  seleccionQuoteAprobar.value = true;
}
function mostrarBtnAprobar() {
  return !aduanaStore.aprobadoflag;
}
async function abrirModalAprobar() {
  await aduanaStore.generaInstructivoparaguardataAduana();
  if ((await frmAprobar.value!.validate()).valid) {
    const fechaValidezOpcion = aduanaStore.opcionCostos.filter(
      (v) => v.nro_propuesta == nro_propuesta.value
    )[0]!.date_end;
    let esValida = moment(fechaValidezOpcion).isSameOrAfter(moment(), "day");
    if (!esValida) {
      return Swal.fire({
        icon: "warning",
        title: "Advertencia",
        text: "No se puede aprobar ya que la validez ya expiró.",
      }).then(() => false);
    }
    esValida = moment(fechaValidezOpcion, "YYYY-MM-DD").isSameOrAfter(
      moment().add(15, "days").startOf("day")
    );
    const hoy = moment();
    const newFechaValize = moment(fechaValidezOpcion);
    const cantFecha = newFechaValize.diff(hoy, "days");

    if (!esValida) {
      return Swal.fire({
        icon: "question",
        title: "Advertencia",
        text: `Quedan ${
          cantFecha + 1
        } días de validez. ¿Desea continuar.? `,
        allowEnterKey: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showCancelButton: true,
        confirmButtonText: "Enviar a Operaciones.",
        cancelButtonText: "No aprobar.",
      }).then((res) => {
        if (res.isDismissed) {
          return false;
        }

        nuevoexpediente.value = true;
        id_exp.value = "";
        Swal.fire({
          icon: "question",
          iconColor: "red",
          width: 1000,
          html:
            appStore.itemsMasterList.length > 0
              ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
              : "<h1>¿Desea crear un nuevo expediente?</h1>",
          showConfirmButton: true,
          confirmButtonText: "CREAR NUEVO EXPEDIENTE",
          showDenyButton: appStore.itemsMasterList.length > 0,
          denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO",
          showCloseButton: true,
          showCancelButton: false,
          allowOutsideClick: false,
        }).then(async (res) => {
          if (res.isConfirmed) {
            Swal.fire({
              icon: "warning",
              width: 1000,
              title: "Fecha de Disponibilidad - Master",
              html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
              allowOutsideClick: false,
              confirmButtonText: "ACEPTAR",
              showCancelButton: true,
              cancelButtonText: "CANCELAR",
              preConfirm: () => {
                const dateInput =
                  (document.getElementById("swal-input1") as HTMLInputElement).value;
                if (!dateInput) {
                  Swal.showValidationMessage(
                    "La fecha de validez es requerida"
                  );
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
              fecha_validez.value = res.value;
              console.log(
                "b",
                aduanaStore.listIngresosInstructivoAprobar
              );
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const sum =
                aduanaStore.listIngresosInstructivoAprobar.filter(
                  (v) => v.nro_propuesta == nro_propuesta.value
                );
              const igv =
                aduanaStore.listIngresosInstructivoAprobar
                  .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                  .dataIngresos.filter(
                    (v) => v.descripcion === "TOTAL"
                  )[0]!.igv;
              const valor =
                aduanaStore.listIngresosInstructivoAprobar
                  .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                  .dataIngresos.filter(
                    (v) => v.descripcion === "TOTAL"
                  )[0]!.valor;
              const listCostosInstructivo =
                aduanaStore.listIngresosInstructivoAprobar.filter(
                  (v) => v.nro_propuesta == nro_propuesta.value
                )[0]!.dataCostos;
              const listVentasInstructivo =
                aduanaStore.listIngresosInstructivoAprobar.filter(
                  (v) => v.nro_propuesta == nro_propuesta.value
                )[0]!.dataVentas;
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
                await aduanaStore.aprobarCotizacionAduana({
                  id_quote: route.params.id,
                  nuevoexpediente: true,
                  id_exp: id_exp.value,
                  fecha_validez: fecha_validez.value,
                  totalIngreso: valor,
                  igvIngreso: igv,
                  valorIngreso: valor,
                  listCostosInstructivo: listCostosInstructivo,
                  listVentasInstructivo: listVentasInstructivo,
                  id_house: id_house.value,
                  id_opcion: id_opcion.value,
                });
                appStore.spiner = true;

                appStore.spiner = false;
              }
            });
          }
          if (res.isDenied) {
            nuevoexpediente.value = false;
            aprobarflag.value = true;
          }
        });
      });
    } else {
      nuevoexpediente.value = true;
      id_exp.value = "";
      Swal.fire({
        icon: "question",
        iconColor: "red",
        width: 1000,
        html:
          appStore.itemsMasterList.length > 0
            ? "<h1>¿Desea crear un nuevo expediente o seleccionar uno registrado?</h1>"
            : "<h1>¿Desea crear un nuevo expediente?</h1>",
        showConfirmButton: true,
        confirmButtonText: "CREAR NUEVO EXPEDIENTE",
        showDenyButton: appStore.itemsMasterList.length > 0,
        denyButtonText: "SELECCIONAR EXPEDIENTE YA CREADO",
        showCloseButton: true,
        showCancelButton: false,
        allowOutsideClick: false,
      }).then(async (res) => {
        if (res.isConfirmed) {
          Swal.fire({
            icon: "warning",
            width: 1000,
            title: "Fecha de Disponibilidad - Master",
            html: `<input type="date" id="swal-input1" class="swal2-input">
              <p>Si es Importación seria el ETA </p>
              <p>SI  es Exportación Colocar el ETD </p>
              <p style="color:red">Esto te Ayudara a Controlar tus Operaciones  </p>


              `,
            allowOutsideClick: false,
            confirmButtonText: "ACEPTAR",
            showCancelButton: true,
            cancelButtonText: "CANCELAR",
            preConfirm: () => {
              const dateInput =
                (document.getElementById("swal-input1") as HTMLInputElement).value;
              if (!dateInput) {
                Swal.showValidationMessage(
                  "La fecha de validez es requerida"
                );
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
            fecha_validez.value = res.value;
            console.log(
              "a",
              aduanaStore.listIngresosInstructivoAprobar
            );
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const sum =
              aduanaStore.listIngresosInstructivoAprobar.filter(
                (v) => v.nro_propuesta == nro_propuesta.value
              );
            const igv =
              aduanaStore.listIngresosInstructivoAprobar
                .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                .dataIngresos.filter(
                  (v) => v.descripcion === "TOTAL"
                )[0]!.igv;
            const valor =
              aduanaStore.listIngresosInstructivoAprobar
                .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
                .dataIngresos.filter(
                  (v) => v.descripcion === "TOTAL"
                )[0]!.valor;
            const listCostosInstructivo =
              aduanaStore.listIngresosInstructivoAprobar.filter(
                (v) => v.nro_propuesta == nro_propuesta.value
              )[0]!.dataCostos;
            const listVentasInstructivo =
              aduanaStore.listIngresosInstructivoAprobar.filter(
                (v) => v.nro_propuesta == nro_propuesta.value
              )[0]!.dataVentas;
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
              await aduanaStore.aprobarCotizacionAduana({
                id_quote: route.params.id,
                nuevoexpediente: true,
                id_exp: id_exp.value,
                fecha_validez: fecha_validez.value,
                totalIngreso: valor,
                igvIngreso: igv,
                valorIngreso: valor,
                listCostosInstructivo: listCostosInstructivo,
                listVentasInstructivo: listVentasInstructivo,
              });
              appStore.spiner = true;

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
  }
}
async function validarExistePagosMaster() {
  loading.value = true;
  activarBtnContinuar.value = true;
  textValidacionPago.value = "";
  if (id_opcion.value == "1") {
    const config = {
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_existe_pago_master",
      headers: {
        "Content-Type": "application/json",
       
      },
      params: {
        id: id_exp.value,
      },
    };
    const res = await axios(config).then((res) => {
      return res.data;
    });
    activarBtnContinuar.value = res.estadoflag;
    textValidacionPago.value = res.mensaje;
    loading.value = false;
    return;
  }
  activarBtnContinuar.value = false;
  loading.value = false;
}
async function validarExistePagosHouse() {
  activarBtnContinuar.value = true;
  textValidacionPago.value = "";
  loading.value = true;
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "validar_existe_pago_house",
    headers: {
      "Content-Type": "application/json",
     
    },
    params: {
      id: id_house.value,
    },
  };
  const res = await axios(config).then((res) => {
    return res.data;
  });
  activarBtnContinuar.value = res.estadoflag;
  textValidacionPago.value = res.mensaje;
  loading.value = false;
}
async function buscarHouseAsociadosAMaster() {
  lstHouse.value = [];
  const config = {
    method: "get",
    url: import.meta.env.VITE_URL_MAIN + "cargar_house_asociado_master",
    headers: {
      "Content-Type": "application/json",
     
    },
    params: {
      id_master: id_exp.value,
    },
  };
  loading.value = true;
  const res = await axios(config).then((res) => {
    return res.data;
  });
  loading.value = false;

  if (!!res.estadoflag) {
    lstHouse.value = res.data;
  }
  lstHouse.value.unshift({
    id: 0,
    code_house: "CREAR UN NUEVO HOUSE",
  });
  activarBtnContinuar.value = true;
  textValidacionPago.value = "";
  aprobarflag.value = false;
  dialogHouse.value = true;
}
function continuarAprobar() {
  id_opcion.value = "";
  aprobarflag.value = false;
  dialogCostos.value = true;
}
async function aprobar() {
  await aduanaStore.generaInstructivoparaguardataAduana();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const sum = aduanaStore.listIngresosInstructivoAprobar.filter(
    (v) => v.nro_propuesta == nro_propuesta.value
  );
  const igv = aduanaStore.listIngresosInstructivoAprobar
    .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
    .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0]!.igv;
  const valor = aduanaStore.listIngresosInstructivoAprobar
    .filter((v) => v.nro_propuesta == nro_propuesta.value)[0]!
    .dataIngresos.filter((v) => v.descripcion === "TOTAL")[0]!.valor;
  const listCostosInstructivo =
    aduanaStore.listIngresosInstructivoAprobar.filter(
      (v) => v.nro_propuesta == nro_propuesta.value
    )[0]!.dataCostos;
  const listVentasInstructivo =
    aduanaStore.listIngresosInstructivoAprobar.filter(
      (v) => v.nro_propuesta == nro_propuesta.value
    )[0]!.dataVentas;
  if ((await masterForm.value!.validate()).valid) {
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
    await aduanaStore.aprobarCotizacionAduana({
      id_quote: route.params.id,
      nuevoexpediente: false,
      id_exp: id_exp.value,
      fecha_validez: fecha_validez.value,
      totalIngreso: valor,
      igvIngreso: igv,
      valorIngreso: valor,
      listCostosInstructivo: listCostosInstructivo,
      listVentasInstructivo: listVentasInstructivo,
      id_house: id_house.value,
      id_opcion: id_opcion.value,
      id_opcion_house: id_opcion_house.value,
    });
    appStore.spiner = true;
    aprobarflag.value = false;
    appStore.spiner = false;
  }
}

function noDataText() {
  return `No se encontraron Masters con la misma Modalidad, Tipo de Carga, Incoterms y/o Puerto Origen/ Destino asociados a la cotización.`;
}
function getProveedor(element: OpcionCosto) {
  const id_proveedor = element.listCostos.some(
    (v) => v.code_cost == 4 && v.esopcionflag == 1
  )
    ? element.listCostos.filter(
        (v) => v.code_cost == 4 && v.esopcionflag == 1
      )[0]!.id_proveedor
    : "";
  const nameProveedor = id_proveedor
    ? appStore.provedores.filter((v: ProveedorPricing) => v.id == id_proveedor)[0]!
        .namelong
    : "";
  return nameProveedor;
}
</script>

<template>
  <v-container>
    <v-col cols="12">
      <div class="text-center">
        <v-pagination
          v-model="page"
          :length="
            aduanaStore.opcionCostos.filter((v) => !!v.selected)
              .length
          "
          rounded
        />
      </div>
    </v-col>

    <v-dialog
      v-model="aprobarflag"
      eager
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
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
          <v-form ref="masterForm">
            <v-row>
              <v-autocomplete
                :items="appStore.itemsMasterList"
                v-model="id_exp"
                label="Expediente"
                item-title="code_master"
                item-value="id"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :no-data-text="noDataText()"
                @update:model-value="verificarMaster()"
                class="mx-5 my-5"
              />
            </v-row>
          </v-form>
          <v-alert
            v-if="mostrarAdvertencia"
            border="start"
            border-color="error"
            type="error"
            elevation="2"
          >
            El Master seleccionado no coincide con
            {{ textValidacionCotizacionMaster.join(", ") }} asociados a la
            cotización.
            <h3>¿Está seguro, de asociar la cotización a este registro?</h3>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            size="small"
            @click="continuarAprobar()"
            color="success"
            :loading="loading"
          >
            SELECCIONAR
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
    <v-dialog
      v-model="seleccionQuoteAprobar"
      eager
      scrollable
      persistent
      max-width="35%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card class="pa-5">
        <h2 class="text-blue">
          ESTÁS A PUNTO DE GENERAR UN INSTRUCTIVO A OPERACIONES
        </h2>
        Seleccione la opción aprobada por el cliente:

        <v-card-text>
          <v-form ref="frmAprobar">
            <v-radio-group
              v-model="nro_propuesta"
              :rules="[(v) => !!v || 'Seleccione una opción']"
            >
              <v-radio
                :value="opcion.nro_propuesta"
                v-for="(
                  opcion, index
                ) in aduanaStore.opcionCostos.filter((v) => v.selected)"
                :key="index"
                :label="`Opción ${opcion.nro_propuesta} - ${getProveedor(
                  opcion
                )}`"
              />
            </v-radio-group>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            @click="abrirModalAprobar()"
            color="success"
          >
            Enviar a Operaciones - Tráfico
          </v-btn>
          <v-btn
            class="mx-1"
            color="error"
            @click="seleccionQuoteAprobar = !seleccionQuoteAprobar"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-col
      cols="12"
      class="mb-0 pa-0"
    >
      <v-btn
        class="mx-1"
        color="#004D40"
        elevation="2"
        v-if="mostrarBtnAprobar()"
        size="small"
        @click="abrirSeleccionDeQuoteAAprobar()"
      >
        <span style="color: #ffffff">Enviar a Operaciones/ Tráfico</span>
      </v-btn>
      <center>
        <h3>
          INSTRUCTIVO COMPRA
          {{ aduanaStore.listInstructivo[0]!.expediente }} - N°{{
            aduanaStore.listIngresosInstructivo[page - 1]!.nro_propuesta
          }}
        </h3>

        <h3 class="mb-1 ml-1">
          {{
            pricingStore.listQuoteStatus.filter(
              (v) => v.id == aduanaStore.datosPrincipales.id_status
            )[0]!.name
          }}
          | Exp. Master:
          {{
            aduanaStore.listInstructivo[0]!.code_master
              ? aduanaStore.listInstructivo[0]!.code_master
              : "--"
          }}
          | Exp. House:
          {{
            aduanaStore.listInstructivo[0]!.code_house
              ? aduanaStore.listInstructivo[0]!.code_house
              : "--"
          }}
        </h3>
        <h4 class="mb-1 ml-1">
          {{ aduanaStore.listInstructivo[0]!.sentido }} -
          {{ aduanaStore.listInstructivo[0]!.carga }} -
          {{ aduanaStore.listInstructivo[0]!.incoterms }}
        </h4>
      </center>
    </v-col>
    <v-row>
      <v-col
        cols="12"
        md="4"
        lg="4"
        xl="4"
      >
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-5 ml-1">
              DATOS DEL CLIENTE
            </h4>
            <v-text-field
              class="my-1"
              readonly
              v-model="aduanaStore.datosPrincipales.nombre"
              label="NOMBRE:"
              density="compact"
            />
            <v-text-field
              class="my-1"
              readonly
              v-model="aduanaStore.listInstructivo[0]!.direccion"
              label="DIRECCIÓN:"
              density="compact"
            />
            <v-text-field
              class="my-1"
              readonly
              v-model="aduanaStore.datosPrincipales.telefono"
              label="CONTACTO:"
              density="compact"
            />

            <v-text-field
              class="my-1"
              readonly
              v-model="aduanaStore.vendedor"
              label="VENDEDOR:"
              density="compact"
            />
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-1 ml-1">
              SERVICIOS A REALIZAR
            </h4>
            <v-table density="compact">
              <tbody>
                <tr
                  v-for="(servicio, i) in aduanaStore
                    .listServiciosInstructivo"
                  :key="i"
                >
                  <td>{{ servicio.name }}</td>
                  <td>{{ servicio.status }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-5 ml-1">
              DATOS DE MOVIMIENTO DE MERCANCIA
            </h4>
            <v-text-field
              class="my-1"
              density="compact"
              label="NOMBRE DEL PROVEEDOR:"
              v-model="aduanaStore.listInstructivo[0]!.proveedor"
              required
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="aduanaStore.listInstructivo[0]!.direccionorigen"
              label="DIRECCION ORIGEN:"
              v-if="aduanaStore.listInstructivo[0]!.icotems == 'SXWORK'"
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="aduanaStore.listInstructivo[0]!.origen"
              label="POL:"
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="aduanaStore.listInstructivo[0]!.destino"
              label="POD:"
            />
            <v-text-field
              class="my-1"
              density="compact"
              v-model="aduanaStore.listInstructivo[0]!.fiscal"
              required
              label="NOMBRE FISCAL"
            />
            <v-text-field
              class="my-1"
              density="compact"
              readonly
              v-model="aduanaStore.listInstructivo[0]!.ruc"
              label="RUC:"
            />
          </v-card>
        </v-col>
        <v-col cols="12">
          <v-card
            class="pa-1"
            elevation="5"
          >
            <h4 class="mb-5 ml-1">
              NOTAS ESPECIALES:
              <v-btn
                variant="text"
                color="success"
                @click="dialog = !dialog"
                icon
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </h4>
            <v-table
              density="compact"
              border
            >
              <tbody>
                <tr
                  v-for="(nota, i) in aduanaStore.listInstructivo[0]!
                    .notas as { description?: string }[]"
                  :key="i"
                >
                  <td>{{ nota.description }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
        <v-col cols="12" />
      </v-col>

      <v-col
        cols="12"
        md="8"
        lg="8"
        xl="8"
      >
        <v-row>
          <v-col cols="12">
            <v-card
              class="pa-1"
              elevation="5"
            >
              <h4 class="mb-1 ml-1">
                INGRESOS
              </h4>
              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="header align-right" />
                    <th class="header align-left">
                      DESCRIPCIÓN
                    </th>
                    <th class="header align-right" />
                    <th class="header align-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(venta, index) in aduanaStore
                      .listIngresosInstructivo[page - 1]!.opcion"
                    :key="index"
                    :class="[
                      venta.descripcion === 'TOTAL'
                        ? 'totalClass'
                        : venta.descripcion === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                      venta.service === 'TOTAL'
                        ? 'totalClass'
                        : venta.service === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                    ]"
                  >
                    <td>
                      {{ venta.descripcion }}
                    </td>
                    <td>
                      {{ venta.service }}
                    </td>
                    <td class="align-right">
                      {{ venta.igv }}
                    </td>
                    <td class="align-right">
                      {{ venta.total }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>

          <v-col cols="12">
            <v-card
              class="pa-1"
              elevation="5"
            >
              <h4 class="mb-1 ml-1">
                COSTOS:
              </h4>

              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="header" />
                    <th class="header align-left">
                      DESCRIPCIÓN
                    </th>
                    <th class="header align-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in aduanaStore
                      .listCostosInstructivo[page - 1]!.opcion"
                    :key="index"
                    :class="[
                      costo.proveedor === 'TOTAL'
                        ? 'totalClass'
                        : costo.proveedor === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                      costo.service === 'TOTAL'
                        ? 'totalClass'
                        : costo.service === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                    ]"
                  >
                    <td>
                      {{ costo.proveedor }}
                    </td>
                    <td>
                      {{ costo.service }}
                    </td>
                    <td class="align-right">
                      {{ costo.total }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>

          <v-col
            cols="12"
            v-if="aduanaStore.listImpuestosInstructivo.length > 0"
          >
            <v-card
              class="pa-1"
              elevation="5"
            >
              <h4 class="mb-1 ml-1">
                IMPUESTOS
              </h4>

              <v-table density="compact">
                <thead>
                  <tr>
                    <th class="header align-left">
                      DESCRIPCIÓN
                    </th>

                    <th class="header align-left">
                      PORCENTAJE
                    </th>
                    <th class="header align-right">
                      TOTAL
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(costo, index) in aduanaStore
                      .listImpuestosInstructivo[page - 1]!.opcion"
                    :key="index"
                    :class="[
                      costo.name === 'TOTAL'
                        ? 'totalClass'
                        : costo.name === 'SubTotal'
                          ? 'subTotalClass'
                          : '',
                    ]"
                  >
                    <td>
                      {{ costo.name }}
                    </td>
                    <td>
                      {{ costo.percentage }}
                    </td>

                    <td class="align-right">
                      {{ costo.valor }}
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialog"
      max-width="600px"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title>
          NUEVA NOTA:
        </v-card-title>
        <v-card-text>
          <v-form ref="nota">
            <v-text-field
              label="DESCRIPCIÓN"
              v-model="descripcionNota"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            variant="text"
            @click="guardarNota"
          >
            Añadir
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogConfig"
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <ConfigCotizacion />
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            color="success"
            @click="guardarConfig()"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogHouse"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5 ">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          CREAR NUEVO HOUSE O ASOCIAR A UNO
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogHouse = !dialogHouse"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            :items="lstHouse"
            v-model="id_house"
            item-title="code_house"
            item-value="id"
            @update:model-value="validarExistePagosHouse"
          />
          <v-autocomplete
            item-title="text"
            v-if="id_house != 0 && !textValidacionPago"
            :items="optionHouse"
            v-model="id_opcion_house"
            item-value="id"
            @update:model-value="validarExistePagosMaster"
          />
          <p class="text-red mx-5 my-0">
            {{ textValidacionPago }}
          </p>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            size="small"
            color="success"
            @click="aprobar()"
            :disabled="activarBtnContinuar"
            :loading="loading"
          >
            APROBAR
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            @click="dialogHouse = !dialogHouse"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogCostos"
      scrollable
      persistent
      max-width="50%"
      transition="dialog-transition"
      class="classDialog"
    >
      <v-card cass="px-5">
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          OPCIÓN SOBRE LOS COSTOS
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialogCostos = !dialogCostos"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-autocomplete
            item-title="text"
            :items="optionCostos"
            v-model="id_opcion"
            item-value="id"
            @update:model-value="validarExistePagosMaster"
          />
        </v-card-text>
        <p class="text-red mx-5 my-0">
          {{ textValidacionPago }}
        </p>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            size="small"
            color="success"
            @click="buscarHouseAsociadosAMaster"
            :disabled="activarBtnContinuar"
            :loading="loading"
          >
            CONITNUAR
          </v-btn>
          <v-btn
            class="mx-1"
            size="small"
            color="error"
            :loading="loading"
            @click="dialogCostos = !dialogCostos"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.header[data-v-44bc4a93] {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  /* text-align: center !important; */
}
.align-left {
  text-align: left !important;
}
.align-center {
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
.header align-right[data-v-44bc4a93] {
  background: #3949ab;
  color: white !important;
  align-content: center !important;
  text-align: center !important;
}
.align-right {
  text-align: right !important;
}

.totalClass {
  font-weight: bold;
  /* background: #1a237e !important; */
  background: #42a5f5 !important;
  color: black !important;
}
.subTotalClass {
  font-weight: bold;
  background: #bbdefb !important;
  color: black !important;
}

.flotante {
  position: fixed !important;
  z-index: 99;
  /* bottom: 40px;
	right: 40px; */
}
#create .v-speed-dial {
  position: absolute;
}

#create .v-btn--floating {
  position: relative;
}
/* .tableClass:hover[data-v-44bc4a93] { */
/* .v-data-table >>> tr:hover {
  background: unset !important;
} */
.classDialog {
  min-height: 900px !important;
}
</style>
