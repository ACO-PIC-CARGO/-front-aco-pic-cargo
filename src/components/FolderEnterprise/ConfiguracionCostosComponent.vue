<script setup lang="ts">
import { defineAsyncComponent, nextTick, onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { usePricingStore } from "@/stores/pricing";
import { useSecuritysStore } from "@/stores/securitys";
import type { Modalidad } from "@/types/catalogos";
import type { CostoConfig, TipoCostoConfig } from "@/types/empresas";
import type { TipoCarga } from "@/types/cotizacion";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Proceesing = defineAsyncComponent(() => import("../modal/ModalProcessing.vue"));

const emit = defineEmits<{ regresar: [] }>();

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const configEmpresaStore = useConfigEmpresaStore();
const securitysStore = useSecuritysStore();

const isMobile = ref(false);
const finalizar = ref(false);
const subirCostos = ref(false);
const loadingTable = ref(false);
const loading = ref(false);
const headers = ref([
  { title: "TRAMO", key: "tramo" },
  { title: "SERVICIO", key: "servicio" },
  { title: "CONCEPTO", key: "concepto" },
  { title: "MULTIPLICADOR", key: "multiplicador" },
  { title: "MONTO", key: "monto" },
  { title: "PROVEEDOR", key: "proveedor" },
]);
const dialog = ref(false);
const ids_modality = ref<Array<number | string>>([]);
const ids_shipment = ref<Array<number | string>>([]);
const id_modality = ref<number | string>("");
const id_shipment = ref<number | string>("");
const lstTramo = [
  { id: "ORIGEN", text: "ORIGEN" },
  { id: "FLETE", text: "FLETE" },
  { id: "DESTINO", text: "DESTINO" },
  { id: "OPCIONAL", text: "OPCIONAL" },
];
const frmNuevoCosto = ref<{
  exwflag: boolean;
  fcaflag: boolean;
  fobflag: boolean;
  cfrflag: boolean;
  cifflag: boolean;
  ddpflag: boolean;
  tramo: string;
  servicio: string;
  concepto: string;
  id_multiplicador: number | string;
  monto: number | string;
  id_proveedor: number | string;
  id_tipocosto?: string;
}>({
  exwflag: false,
  fcaflag: false,
  fobflag: false,
  cfrflag: false,
  cifflag: false,
  ddpflag: false,
  tramo: "",
  servicio: "",
  concepto: "",
  id_multiplicador: "",
  monto: 0,
  id_proveedor: "",
});
const indexShipment = ref(0); // Índice para rastrear la posición actual del shipment
const indexModality = ref(0); // Índice para rastrear la posición actual de la modalidad
const frmNuevosCostos = useTemplateRef("frmNuevosCostos");
// Not bound to the template, as in the old code.
const frmRegistro = ref<{ $el: { scrollTop: number } }>();

onMounted(async () => {
  checkIfMobile();
  loadingTable.value = true;
  ids_modality.value = pricingStore.listModality.map((element: Modalidad) => {
    return element.id;
  });
  ids_shipment.value = pricingStore.listShipment.map((element: TipoCarga) => {
    return element.id!;
  });
  id_modality.value = ids_modality.value[0]!;
  id_shipment.value = ids_shipment.value[0]!;
  await configEmpresaStore.obtenerConfigCostos({
    id_modality: id_modality.value,
    shipment: pricingStore.listShipment.filter(
      (v: TipoCarga) =>
        v.id ==
        pricingStore.listShipment.map((element: TipoCarga) => {
          return element.id;
        })[0],
    )[0]!.code!,
  });
  generarHeader();
  await configEmpresaStore.getMultiplicadorConfig({
    id_shipment: id_shipment.value,
  });
  loadingTable.value = false;
  await generarSecciones();
});

async function finalizarSinLogin() {
  Swal.fire({
    title: "Procesando...",
    text: "Por favor espera",
    allowOutsideClick: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
  const dataBranch = JSON.parse(sessionStorage.getItem("dataBranch") as string);

  dataBranch[0].esnuevoflag = false;

  sessionStorage.setItem("dataBranch", JSON.stringify(dataBranch));
  await securitysStore._getMenuItem();

  setTimeout(async () => {
    await router.push({
      name: "Main",
    });
    Swal.close();
    window.location.reload();
  }, 1000);
}
function checkIfMobile() {
  isMobile.value = window.innerWidth <= 600; // 600px como referencia para dispositivos móviles
}
function scrollToSubirCostos() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function abrirNuevoCosto() {
  checkIfMobile();
  dialog.value = true;
  frmNuevosCostos.value!.reset();
}
async function agregarNuevoCosto() {
  if ((await frmNuevosCostos.value!.validate()).valid) {
    configEmpresaStore.lstCostos.push({
      exwflag: frmNuevoCosto.value.exwflag,
      fcaflag: frmNuevoCosto.value.fcaflag,
      fobflag: frmNuevoCosto.value.fobflag,
      cfrflag: frmNuevoCosto.value.cfrflag,
      cifflag: frmNuevoCosto.value.cifflag,
      ddpflag: frmNuevoCosto.value.ddpflag,
      tramo: frmNuevoCosto.value.tramo,
      servicio: frmNuevoCosto.value.servicio,
      concepto: frmNuevoCosto.value.concepto,
      id_multiplicador: frmNuevoCosto.value.id_multiplicador,
      monto: frmNuevoCosto.value.monto,
      id_proveedor: frmNuevoCosto.value.id_proveedor,
      seccion: frmNuevoCosto.value.id_tipocosto,
      code: 0,
    });
    dialog.value = false;
    console.log(configEmpresaStore.lstCostos);
  }
}
// omitir() {
//   this.$store.state.enterprises.step++;
//   this.$store.state.enterprises.datoCostosFlag = false;

// },
// async omitir() {
//   this.$store.state.dialogProcessing = true;
//   this.scrollToSubirCostos();
//   if (this.subirCostos) {
//     this.loading = !this.loading;
//     if (this.ids_shipment.length > 1) {
//       this.loadingTable = true;
//       this.ids_shipment.splice(0, 1);
//       this.id_shipment = this.ids_shipment[0];
//       await this.obtenerConfigCostos({
//         id_modality: this.id_modality,
//         shipment: this.$store.state.pricing.listShipment.filter(
//           (v) => v.id == this.id_shipment
//         )[0].code,
//       });
//       await this.getMultiplicadorConfig({
//         id_shipment: this.id_shipment,
//       });
//       this.generarHeader();
//       this.loadingTable = false;
//     } else {
//       if (this.ids_modality.length > 1) {
//         this.loadingTable = true;
//         this.ids_modality.splice(0, 1);
//         this.id_modality = this.ids_modality[0];
//         this.ids_shipment = this.$store.state.pricing.listShipment.map(
//           (element) => {
//             return element.id;
//           }
//         );
//         this.id_shipment = this.ids_shipment[0];
//         await this.obtenerConfigCostos({
//           id_modality: this.id_modality,
//           shipment: this.$store.state.pricing.listShipment.filter(
//             (v) => v.id == this.id_shipment
//           )[0].code,
//         });

//         await this.getMultiplicadorConfig({
//           id_shipment: this.id_shipment,
//         });
//         this.generarHeader();
//         this.loadingTable = false;
//       } else {
//         this.finalizar = true;
//       }
//     }
//     this.generarSecciones();
//     this.loading = !this.loading;
//   } else {
//     this.finalizar = true;
//   }
//   setTimeout(() => {
//     this.$store.state.dialogProcessing = false;
//   }, 300);
// },
function OmitirConfiguracionCostos() {
  Swal.fire({
    icon: "warning",
    title: "OMITIR CONFIGURACIÓN DE COSTOS.",
    html: `Se usaran los valores predeterminado del sistema, con la finalidad de que puedas usar el istema. Podras editar estos valores mas adelante`,
    allowEnterKey: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: "Continuar",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
  }).then((res) => {
    if (res.isConfirmed) {
      configEmpresaStore.OmitirConfiguracionCost();
      finalizar.value = true;
    }
  });
}
function omitir() {
  Swal.fire({
    icon: "warning",
    title: "OPCIÓN OMITIDA",
    html: `Se usaran los valores predeterminado del sistema, con la finalidad de que puedas usar el istema. Podras editar estos valores mas adelante`,
    allowEnterKey: false,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: "Continuar",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
  }).then((res) => {
    if (res.isConfirmed) {
      guardarCostosPredefinidos();
    }
  });
}
async function guardarCostosPredefinidos() {
  appStore.dialogProcessing = true;
  await configEmpresaStore.guardarCostos({
    id_modality: id_modality.value,
    id_shipment: id_shipment.value,
    lstCostos: configEmpresaStore.lstCostos,
  });
  scrollToSubirCostos();

  if (subirCostos.value) {
    loading.value = !loading.value;

    // Avanzar en los shipments
    if (indexShipment.value < ids_shipment.value.length - 1) {
      loadingTable.value = true;
      indexShipment.value++;
      id_shipment.value = ids_shipment.value[indexShipment.value]!;

      await configEmpresaStore.obtenerConfigCostos({
        id_modality: id_modality.value,
        shipment: pricingStore.listShipment.find((v: TipoCarga) => v.id === id_shipment.value)!.code!,
      });

      await configEmpresaStore.getMultiplicadorConfig({
        id_shipment: id_shipment.value,
      });

      generarHeader();
      loadingTable.value = false;
    } else if (indexModality.value < ids_modality.value.length - 1) {
      // Si ya no quedan shipments, pasar a la siguiente modalidad
      loadingTable.value = true;
      indexModality.value++;
      id_modality.value = ids_modality.value[indexModality.value]!;

      // Reiniciar los shipments para la nueva modalidad
      indexShipment.value = 0;
      ids_shipment.value = pricingStore.listShipment.map((element: TipoCarga) => element.id!);
      id_shipment.value = ids_shipment.value[indexShipment.value]!;

      await configEmpresaStore.obtenerConfigCostos({
        id_modality: id_modality.value,
        shipment: pricingStore.listShipment.find((v: TipoCarga) => v.id === id_shipment.value)!.code!,
      });

      await configEmpresaStore.getMultiplicadorConfig({
        id_shipment: id_shipment.value,
      });

      generarHeader();
      loadingTable.value = false;
    } else {
      finalizar.value = true;
    }

    generarSecciones();
    loading.value = !loading.value;
  } else {
    finalizar.value = true;
  }

  setTimeout(() => {
    appStore.dialogProcessing = false;
  }, 300);
}

async function retroceder() {
  appStore.dialogProcessing = true;
  scrollToSubirCostos();

  if (subirCostos.value) {
    loading.value = !loading.value;

    // Retroceder en los shipments
    if (indexShipment.value > 0) {
      loadingTable.value = true;
      indexShipment.value--;
      id_shipment.value = ids_shipment.value[indexShipment.value]!;

      await configEmpresaStore.obtenerConfigCostos({
        id_modality: id_modality.value,
        shipment: pricingStore.listShipment.find((v: TipoCarga) => v.id === id_shipment.value)!.code!,
      });

      await configEmpresaStore.getMultiplicadorConfig({
        id_shipment: id_shipment.value,
      });

      generarHeader();
      loadingTable.value = false;
    } else if (indexModality.value > 0) {
      // Retroceder en las modalidades si no hay más shipments anteriores
      loadingTable.value = true;
      indexModality.value--;
      id_modality.value = ids_modality.value[indexModality.value]!;

      // Reiniciar los shipments para la modalidad anterior
      indexShipment.value = ids_shipment.value.length - 1;
      ids_shipment.value = pricingStore.listShipment.map((element: TipoCarga) => element.id!);
      id_shipment.value = ids_shipment.value[indexShipment.value]!;

      await configEmpresaStore.obtenerConfigCostos({
        id_modality: id_modality.value,
        shipment: pricingStore.listShipment.find((v: TipoCarga) => v.id === id_shipment.value)!.code!,
      });

      await configEmpresaStore.getMultiplicadorConfig({
        id_shipment: id_shipment.value,
      });

      generarHeader();
      loadingTable.value = false;
    } else {
      emit("regresar");
    }

    generarSecciones();
    loading.value = !loading.value;
  } else {
    emit("regresar");
  }

  setTimeout(() => {
    appStore.dialogProcessing = false;
  }, 300);
}

async function guardarCosto() {
  scrollToSubirCostos();
  loading.value = !loading.value;
  appStore.dialogProcessing = true;
  await configEmpresaStore.guardarCostos({
    id_modality: id_modality.value,
    id_shipment: id_shipment.value,
    lstCostos: configEmpresaStore.lstCostos,
  });

  if (indexShipment.value < ids_shipment.value.length - 1) {
    loadingTable.value = true;
    indexShipment.value++; // Avanzar al siguiente shipment
    id_shipment.value = ids_shipment.value[indexShipment.value]!;

    // Obtener los costos y multiplicadores para el siguiente shipment
    await configEmpresaStore.obtenerConfigCostos({
      id_modality: id_modality.value,
      shipment: pricingStore.listShipment.find((v: TipoCarga) => v.id === id_shipment.value)!.code!,
    });

    await configEmpresaStore.getMultiplicadorConfig({
      id_shipment: id_shipment.value,
    });

    generarHeader();
    loadingTable.value = false;
  } else if (indexModality.value < ids_modality.value.length - 1) {
    // Si no hay más envíos, verificar si hay más modalidades
    loadingTable.value = true;
    indexModality.value++; // Avanzar a la siguiente modalidad
    id_modality.value = ids_modality.value[indexModality.value]!;

    // Reiniciar los shipments para la nueva modalidad
    indexShipment.value = 0;
    ids_shipment.value = pricingStore.listShipment.map((element: TipoCarga) => element.id!);
    id_shipment.value = ids_shipment.value[indexShipment.value]!;

    // Obtener los costos y multiplicadores para el primer shipment de la nueva modalidad
    await configEmpresaStore.obtenerConfigCostos({
      id_modality: id_modality.value,
      shipment: pricingStore.listShipment.find((v: TipoCarga) => v.id === id_shipment.value)!.code!,
    });

    await configEmpresaStore.getMultiplicadorConfig({
      id_shipment: id_shipment.value,
    });

    generarHeader();
    loadingTable.value = false;
  } else {
    // Si no quedan más modalidades o envíos, finalizar el proceso
    finalizar.value = true;
  }

  loading.value = !loading.value;
  appStore.dialogProcessing = false;
  generarSecciones();

  // Mover el scroll hacia arriba al finalizar el registro
  nextTick(() => {
    const form = frmRegistro.value;
    if (form && form.$el) {
      form.$el.scrollTop = 0; // Mover el scroll hacia arriba
    }
  });
}
function generarHeader() {
  headers.value = [];
  if (configEmpresaStore.lstCostos.some((v) => v.exwflag)) {
    headers.value.push({ title: "EXW", key: "exwflag" });
  }
  if (configEmpresaStore.lstCostos.some((v) => v.fcaflag)) {
    headers.value.push({ title: "FCA", key: "fcaflag" });
  }
  if (configEmpresaStore.lstCostos.some((v) => v.fobflag)) {
    headers.value.push({ title: "FOB", key: "fobflag" });
  }
  if (configEmpresaStore.lstCostos.some((v) => v.cfrflag)) {
    headers.value.push({ title: "CFR", key: "cfrflag" });
  }
  if (configEmpresaStore.lstCostos.some((v) => v.cifflag)) {
    headers.value.push({ title: "CIF", key: "cifflag" });
  }
  if (configEmpresaStore.lstCostos.some((v) => v.ddpflag)) {
    headers.value.push({ title: "DDP", key: "ddpflag" });
  }
  headers.value.push({ title: "TRAMO", key: "tramo" });
  headers.value.push({ title: "SERVICIO", key: "servicio" });
  headers.value.push({ title: "CONCEPTO", key: "concepto" });
  headers.value.push({ title: "MULTIPLICADOR", key: "multiplicador" });
  headers.value.push({ title: "MONTO", key: "monto" });
  headers.value.push({ title: "PROVEEDOR", key: "proveedor" });
}
function generarSecciones() {
  configEmpresaStore.listTipoCostos = [];
  const seccionesArr = configEmpresaStore.lstCostos.map((item) => {
    return item.seccion;
  });
  const secciones = new Set(seccionesArr);
  const lstSecciones: TipoCostoConfig[] = [];
  secciones.forEach((element) => {
    if (element) {
      lstSecciones.push({
        name: element,
      });
    }
  });

  lstSecciones.push({
    name: "DESTINO: GASTOS DE TERCEROS",
  });

  configEmpresaStore.listTipoCostos = lstSecciones;
}
async function finalizarConfig() {
  await configEmpresaStore.finalizarConfiguracion();
  if (sessionStorage.getItem("auth-token")) {
    sessionStorage.removeItem("auth-token");
  }
  if (sessionStorage.getItem("dataUser")) {
    sessionStorage.removeItem("dataUser");
  }
  if (sessionStorage.getItem("dataBranch")) {
    sessionStorage.removeItem("dataBranch");
  }
  await router.push({ name: "Login" });
  // @ts-expect-error Kept: the non-standard forced-reload flag was part of the old call.
  window.location.reload(true);
}
function reponerCero(valor: CostoConfig) {
  if (valor.monto == "" || valor.monto == null || valor.monto == undefined) {
    valor.monto = 0;
  }
}
</script>

<template>
  <v-container fluid>
    <div v-if="finalizar">
      <v-row>
        <v-col cols="12">
          <center>
            <p class="text-azul">
              4. CONFIGURACIÓN TARIFAS DE SERVICIO
            </p>
          </center>
        </v-col>
        <v-row
          v-if="!subirCostos"
          class="mx-10 my-1"
        >
          <v-col cols="12">
            <v-row>
              <v-col
                cols="1"
                class="ocultarMovil"
              >
                <v-icon
                  size="50"
                  color="red"
                >
                  mdi-alert
                </v-icon>
              </v-col>
              <v-col
                cols="12"
                lg="11"
                xl="11"
                class="infoImportante"
              >
                <h2>AUTOMATIZA LAS TARIFAS DE TUS PROVEEDORES</h2>

                <p>
                  Con esta opción podrás agilizar tus cotizaciones. Olvídate de
                  los cálculos manuales y evita errores. La configuración que
                  realices se aplicará automáticamente en cada propuesta a tus
                  clientes, ahorrándote tiempo y garantizando precisión en todas
                  tus cotizaciones
                </p>
                <h2 class="mt-10">
                  SI DECIDES OMITIR ESTA CONFIGURACION
                </h2>
                <p>
                  El sistema asignará conceptos predeterminados con precios en
                  cero.
                  <span class="bg-yellow">
                    Podrás ajustarlas la configuración de las tarifas en
                    cualquier momento desde el módulo de configuración
                  </span>
                </p>
              </v-col>
            </v-row>
          </v-col>
          <v-col
            cols="12"
            class="centrado"
          >
            <v-btn
              class="mt-1 mb-1"
              color="#7E7E7E"
              @click="OmitirConfiguracionCostos()"
              v-if="!subirCostos"
            >
              Omitir
            </v-btn>
            <v-spacer />
            <v-btn
              color="#5E9AD6"
              @click="subirCostos = !subirCostos"
              class="mt-1 mb-1"
            >
              CONFIGURAR TARIFAS
            </v-btn>
          </v-col>
          <v-col
            cols="12"
            class="centrado mt-10"
          >
            <v-btn
              @click="retroceder()"
              color="#78909C"
              class="mt-1 mb-1"
              v-if="!subirCostos"
            >
              REGRESAR A LA ANTERIOR
            </v-btn>
          </v-col>
        </v-row>
        <v-col
          cols="12"
          v-else
        >
          <v-card
            elevation="2"
            class="px-5 mb-3"
          >
            <v-row>
              <v-col
                cols="12"
                lg="8"
                xl="8"
              >
                TARIFAS SEGÚN TIPO DE SERVICIO
              </v-col>
              <v-col
                cols="12"
                lg="4"
                xl="4"
              >
                <v-btn
                  variant="outlined"
                  hide-details
                  class="my-2"
                  color="success"
                  size="small"
                  @click="abrirNuevoCosto()"
                >
                  Agregar nuevo Costo
                  <v-icon color="green">
                    mdi-plus
                  </v-icon>
                </v-btn>
              </v-col>
              <v-col
                cols="12"
                lg="3"
                xl="3"
              >
                <b>Modalidad: </b>
                <span class="description">
                  {{
                    pricingStore.listModality.filter(
                      (v: Modalidad) => v.id == id_modality
                    )[0]!.name
                  }}
                </span>
              </v-col>

              <v-col
                cols="12"
                lg="3"
                xl="3"
              >
                <b>Tipo de Carga: </b>
                <span class="description">
                  {{
                    pricingStore.listShipment.filter(
                      (v: TipoCarga) => v.id == id_shipment
                    )[0]!.code
                  }}
                </span>
              </v-col>

              <v-col cols="12">
                <v-data-table
                  :headers="headers"
                  :items="configEmpresaStore.lstCostos"
                  class="elevation-1 table_costos"
                  item-value="id"
                  :loading="loadingTable"
                  hide-default-footer
                  :items-per-page="20"
                  disable-sort
                >
                  <template #[`item.exwflag`]="{ item }">
                    <v-icon
                      color="green"
                      v-if="item.exwflag"
                    >
                      mdi-check-bold
                    </v-icon>
                    <v-icon
                      color="red"
                      v-else
                    >
                      mdi-close
                    </v-icon>
                  </template>
                  <template #[`item.fcaflag`]="{ item }">
                    <v-icon
                      color="green"
                      v-if="item.fcaflag"
                    >
                      mdi-check-bold
                    </v-icon>
                    <v-icon
                      color="red"
                      v-else
                    >
                      mdi-close
                    </v-icon>
                  </template>
                  <template #[`item.fobflag`]="{ item }">
                    <v-icon
                      color="green"
                      v-if="item.fobflag"
                    >
                      mdi-check-bold
                    </v-icon>
                    <v-icon
                      color="red"
                      v-else
                    >
                      mdi-close
                    </v-icon>
                  </template>
                  <template #[`item.cfrflag`]="{ item }">
                    <v-icon
                      color="green"
                      v-if="item.cfrflag"
                    >
                      mdi-check-bold
                    </v-icon>
                    <v-icon
                      color="red"
                      v-else
                    >
                      mdi-close
                    </v-icon>
                  </template>
                  <template #[`item.cifflag`]="{ item }">
                    <v-icon
                      color="green"
                      v-if="item.cifflag"
                    >
                      mdi-check-bold
                    </v-icon>
                    <v-icon
                      color="red"
                      v-else
                    >
                      mdi-close
                    </v-icon>
                  </template>
                  <template #[`item.ddpflag`]="{ item }">
                    <v-icon
                      color="green"
                      v-if="item.ddpflag"
                    >
                      mdi-check-bold
                    </v-icon>
                    <v-icon
                      color="red"
                      v-else
                    >
                      mdi-close
                    </v-icon>
                  </template>
                  <template #[`item.monto`]="{ item }">
                    <v-text-field
                      v-model="item.monto"
                      @blur="reponerCero(item)"
                      density="compact"
                      hide-details
                      class="my-2"
                      v-if="item.concepto"
                    />
                  </template>
                  <template #[`item.multiplicador`]="{ item }">
                    <v-autocomplete
                      item-title="text"
                      :items="configEmpresaStore.lstMultiplicador"
                      v-model="item.id_multiplicador"
                      density="compact"
                      hide-details
                      class="my-2"
                      item-value="id"
                      v-if="item.concepto"
                    />
                  </template>
                  <template #[`item.proveedor`]="{ item }">
                    <v-autocomplete
                      :items="appStore.itemsProveedorList"
                      v-model="item.id_proveedor"
                      density="compact"
                      hide-details
                      class="my-2"
                      item-title="namelong"
                      item-value="id"
                      v-if="item.concepto"
                    />
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <v-col
        cols="12"
        class="centrado"
      >
        <!-- @click="$emit('regresar')" -->

        <v-btn
          v-if="subirCostos"
          class="mx-5 mt-1 mb-1"
          color="#7E7E7E"
          @click="omitir()"
        >
          Omitir
        </v-btn>
        <v-btn
          class="mx-5 mt-1 mb-1"
          color="#1A237E"
          v-if="subirCostos"
          @click="guardarCosto()"
        >
          Guardar y continuar
        </v-btn>
      </v-col>
      <v-col
        cols="12"
        class="centrado"
      >
        <v-btn
          @click="retroceder()"
          color="#78909C"
          class="mx-5 mt-1 mb-1"
          v-if="subirCostos"
        >
          REGRESAR A LA ANTERIOR
        </v-btn>
      </v-col>
    </div>
    <div v-else>
      <v-row>
        <v-col
          cols="12"
          md="4"
          offset-md="4"
        >
          <v-card
            elevation="2"
            class="pa-5"
          >
            <center class="mb-5">
              <h1>
                <img
                  src="/img/png/trofeo.png"
                  width="30px"
                  alt=""
                  srcset=""
                >
                Tu empresa ha sido configurada
              </h1>
            </center>
            <table>
              <tr style="margin: 150px 0 !important">
                <td style="text-align: left; vertical-align: top">
                  <v-icon>mdi-check</v-icon>
                </td>
                <td style="text-align: justify; vertical-align: top">
                  Ya puedes comenzar a usar ACO ahora mismo.
                </td>
              </tr>
              <tr>
                <td
                  colspan="2"
                  style="height: 30px"
                />
              </tr>
              <tr style="margin: 150px 0 !important">
                <td style="text-align: left; vertical-align: top">
                  <v-icon>mdi-check</v-icon>
                </td>
                <td style="text-align: justify; vertical-align: top">
                  Para aplicar los últimos ajustes que realizaste (Tarifario,
                  logo, Impuestos), solo debes volver a ingresar.
                </td>
              </tr>
            </table>
            <div
              class="mt-5"
              style="text-align: center"
            >
              <!-- color="#4256BE" -->
              <v-btn
                class="my-1 mx-1 buttonDosFilas"
                size="x-small"
                color="#1A237E"
                @click="finalizarSinLogin()"
              >
                INGRESAR Y EXPLORAR <br class="ocultarPc">
                LOS MÓDULOS
              </v-btn>
              <v-btn
                class="my-1 mx-1 buttonDosFilas"
                @click="finalizarConfig()"
                size="x-small"
              >
                VOLVER A INGRESAR <br class="ocultarPc">
                PARA APLICAR CAMBIOS
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>
    <!-- max-width="30%" -->
    <v-dialog
      v-model="dialog"
      eager
      scrollable
      :max-width="isMobile ? '100%' : '30%'"
      transition="dialog-transition"
      persistent
      class="modalNuevoCosto"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          AGREGAR NUEVO COSTO
          <v-spacer />
          <v-icon
            @click="dialog = !dialog"
            color="default"
          >
            mdi-close
          </v-icon>
        </v-card-title>
        <v-form ref="frmNuevosCostos">
          <v-card-text>
            <v-select
              item-title="text"
              :items="lstTramo"
              v-model="frmNuevoCosto.tramo"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Tramo*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
            />

            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Servicio*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.servicio"
            />
            <v-autocomplete
              :items="configEmpresaStore.listTipoCostos"
              v-model="frmNuevoCosto.id_tipocosto"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="name"
              label="Sección*"
              item-title="name"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
            />
            <v-text-field
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Concepto*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.concepto"
            />

            <v-autocomplete
              item-title="text"
              :items="configEmpresaStore.lstMultiplicador"
              v-model="frmNuevoCosto.id_multiplicador"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              item-value="id"
              label="Multiplicador*"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
            />
            <v-text-field
              label="Monto"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              v-model="frmNuevoCosto.monto"
            />

            <v-autocomplete
              :items="appStore.itemsEntities"
              v-model="frmNuevoCosto.id_proveedor"
              :rules="[(v) => !!v || 'Dato obligatorio']"
              label="Proveedor*"
              item-title="namelong"
              variant="outlined"
              density="compact"
              hide-details
              class="my-2"
              item-value="id"
            />
            <p>Incoterms</p>
            <v-row>
              <v-checkbox
                class="mx-5"
                v-if="
                  configEmpresaStore.lstCostos.some(
                    (v) => v.exwflag
                  )
                "
                label="EXW"
                v-model="frmNuevoCosto.exwflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  configEmpresaStore.lstCostos.some(
                    (v) => v.fcaflag
                  )
                "
                label="FCA"
                v-model="frmNuevoCosto.fcaflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  configEmpresaStore.lstCostos.some(
                    (v) => v.fobflag
                  )
                "
                label="FOB"
                v-model="frmNuevoCosto.fobflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  configEmpresaStore.lstCostos.some(
                    (v) => v.cfrflag
                  )
                "
                label="CFR"
                v-model="frmNuevoCosto.cfrflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  configEmpresaStore.lstCostos.some(
                    (v) => v.cifflag
                  )
                "
                label="CIF"
                v-model="frmNuevoCosto.cifflag"
              />
              <v-checkbox
                class="mx-5"
                v-if="
                  configEmpresaStore.lstCostos.some(
                    (v) => v.ddpflag
                  )
                "
                label="DDP"
                v-model="frmNuevoCosto.ddpflag"
              />
            </v-row>
          </v-card-text>
        </v-form>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1 mt-1 mb-5"
            @click="dialog = !dialog"
            color="#923939"
          >
            CANCELAR
          </v-btn>
          <v-btn
            class="mx-1 mt-1 mb-5"
            @click="agregarNuevoCosto()"
            color="#346E3D"
          >
            AGREGAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.derecha {
  align-content: right !important;
  text-align: right !important;
}
.izquierda {
  align-content: left !important;
  text-align: left !important;
}
.centrado {
  align-content: center !important;
  text-align: center !important;
}
.logo {
  max-width: 25%;
  background: brown;
}
.blue {
  background: none !important;
  color: #09305e !important;
}
.btnAcciones {
  margin: 0 0 10% 0 !important;
}
.no-scroll {
  overflow: hidden;
}
.no-scroll-dialog {
  overflow: hidden;
  position: relative;
}
.bg-yellow {
  background: yellow;
  padding: 0 1%;
}
.text-azul {
  /* background: red; */
  color: #4256be !important;
  font-size: 1.5rem;
  font-weight: bold;
}
.text-description {
  padding: 0 5px;
  /* color: red; */
}
/* .table_costos[data-v-3a7680ae] .v-data-table-header thead th {
  font-weight: bold !important;
  background: #bbdefb !important;
} */

.description {
  color: #203bc7;
  font-size: 1.2rem;
  font-weight: bold;
}
.infoImportante {
  text-align: justify;
}
.button {
  padding: 20px !important;
  width: 160px;
}
.buttonDosFilas {
  padding: 23px !important;
  width: 160px;
  white-space: normal;
}
@media (max-width: 918px) {
  .infoImportante {
    padding: 0 2% 0 0 !important;
  }
  :deep(.v-data-table__sort-label) {
    display: none !important;
  }
  .button {
    padding: 15px !important;
    width: 120px;
  }
  .buttonDosFilas {
    padding: 15px !important;
    width: 120px;
    white-space: normal;
  }
}
</style>
