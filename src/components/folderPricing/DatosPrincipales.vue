<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import { usePricingStore } from "@/stores/pricing";
import { sessionBranchId } from "@/utils/sesion";
import type {
  ArchivoDrive,
  Costo,
  DatosPrincipales,
  OpcionCosto,
  Servicio,
} from "@/types/cotizacion";
import type { ClienteListado } from "@/types/entidades";
import { useFilesStore } from "@/stores/files";

withDefaults(
  defineProps<{ mostrarBtn?: boolean; editableFlag?: boolean; recargarFlag?: boolean }>(),
  { mostrarBtn: true, editableFlag: true, recargarFlag: false },
);
const emit = defineEmits<{ activarDatosCarga: [activar: boolean] }>();

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const filesStore = useFilesStore();
const pricingStore = usePricingStore();
const entitiesStore = useEntitiesStore();

const dialogFiles = ref(false);
const search = ref("");
const buscarClienteDialog = ref(false);
const mostrarContinuarFlag = ref(true);
const headers = [
  { title: "Documento", key: "document" },
  { title: "Nombres (s)", key: "nombrecompleto" },
  { title: "Teléfono", key: "phone" },
  { value: "action" },
];
const servicesActuales = ref<Servicio[]>([]);
const nuevosServicios = ref<Servicio[]>([]);
const opcionNuevos = ref<OpcionCosto[]>([]);
const idincoterms = ref<DatosPrincipales["idincoterms"] | null>(null);
const urlGenerada = ref<string>("");
const headersFiles = [
  { title: "Archivo", key: "name" },
  { title: "", key: "action" },
];
const frmDatosPrincipales = useTemplateRef("frmDatosPrincipales");

const listMarketingActivos = computed(() => {
  const list = pricingStore.listMarketing || [];
  return list;
});
const incoterms = computed(() =>
  (pricingStore.listIncoterms || [])
    .filter((element) => element && typeof element === "object")
    .map((element) => ({
      ...element,
      text: `${element.name || ""} - ${element.description || ""}`,
    })),
);
const mostrarProveedorFlag = computed(() => {
  const exw = (pricingStore.listIncoterms || []).filter(
    (v) =>
      v &&
      v.id == pricingStore.datosPrincipales.idincoterms &&
      v.name == "EXW",
  );

  return exw.length > 0 ? true : false;
});

watch(
  () => appStore.registroClienteFlag,
  async () => {
    appStore.spiner = true;
    await appStore._getEntitiesCliente();
    appStore.spiner = false;
    if (entitiesStore.id) {
      const cliente = appStore.itemsEntities.filter(
        (v: ClienteListado) => v.id == entitiesStore.id,
      )[0]!;
      pricingStore.datosPrincipales.id_entitie = cliente.id;
      pricingStore.datosPrincipales.nombre = cliente.nombrecompleto;
      pricingStore.datosPrincipales.telefono = cliente.phone;
    }
    buscarClienteDialog.value = false;
  },
);

onMounted(async () => {
  frmDatosPrincipales.value!.resetValidation();
  appStore._getProveedor();
  setTimeout(async () => {
    servicesActuales.value = pricingStore.listServices;
    if (route.name === "editQuote") {
      idincoterms.value = pricingStore.datosPrincipales.idincoterms;
    }
    // await this.GetArchivos();
  }, 500);

  // this.mostrar = true;
});

async function copiarArchivos() {
  await filesStore.moveFileToOneDrive({
      fileIds: pricingStore.selectedFile.map((file) => file.id),
      destinationFolderUrl: urlGenerada.value,
    })
    .catch((e: unknown) => {
      console.error(e);
    });
  router.push({
    name: "editQuote",
    params: {
      id: pricingStore.id,
    },
  });
  setTimeout(() => {
    window.location.reload();
  }, 500);
}
function registrarNuevoCliente() {
  appStore.modalEntitie = true;
}
function abrirModalCliente() {
  buscarClienteDialog.value = true;
  appStore.itemsEntities = [];
  appStore._getEntitiesCliente();
}
function guardarCliente(e: unknown, { item }: { item: ClienteListado }) {
  if (!item.phone) {
    Swal.fire({
      icon: "warning",
      title: "¡Advertencia!",
      text: "El cliente seleccionado no tiene un número de teléfono registrado. Por favor, seleccione otro cliente o puede actualizar luego en el fichero de cliente.",
    });
  }
  pricingStore.datosPrincipales.id_entitie = item.id;
  pricingStore.datosPrincipales.nombre = item.nombrecompleto;
  pricingStore.datosPrincipales.telefono = item.phone;
  buscarClienteDialog.value = false;
}
async function continuarDatosCarga() {
  if ((await frmDatosPrincipales.value!.validate()).valid) {
    emit("activarDatosCarga", true);
    mostrarContinuarFlag.value = false;
  }
}
function getColorIcon(item: ArchivoDrive) {
  if (item.folder) return "amber";
  const extension = item.extension ? item.extension.toLowerCase() : "";

  const colors: Record<string, string> = {
    pdf: "red",
    xlsx: "green",
    xls: "green",
    docx: "blue",
    doc: "blue",
    png: "purple",
    jpg: "purple",
  };

  return colors[extension] || "grey";
}
function getIconFile(item: ArchivoDrive) {
  if (item.folder) return "mdi-folder";

  const extension = item.extension ? item.extension.toLowerCase() : "";

  switch (extension) {
    case "pdf":
      return "mdi-file-pdf-box";
    case "xls":
    case "xlsx":
      return "mdi-file-excel";
    case "doc":
    case "docx":
      return "mdi-file-word";
    case "png":
    case "jpg":
    case "jpeg":
      return "mdi-file-image";
    case "zip":
    case "rar":
      return "mdi-zip-box";
    default:
      return "mdi-file";
  }
}
function recargarServiciosCostos(id_incoterms?: number | string) {
  if (route.name === "editQuote") {
    Swal.fire({
      icon: "question",
      title: "Nueva Cotización",
      html: "<span style='font-size:1.5em'> Se creará una nueva cotización con el <b> NUEVO INCOTERMS </b> seleccionado.</span> ",
      confirmButtonText: "Si, crear una nueva Cotización",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
      allowEnterKey: true,
      allowEscapeKey: true,
      allowOutsideClick: true,
      cancelButtonColor: "red",
    }).then((res) => {
      if (res.isConfirmed) {
        recargarServiciosCostosContinuar(id_incoterms);
      } else {
        pricingStore.datosPrincipales.idincoterms = idincoterms.value as DatosPrincipales["idincoterms"];
        Swal.close();
      }
    });
  }
  // this.recargarServiciosCostosContinuar(id_incoterms)
}
function recargarServiciosCostosContinuar(id_incoterms?: number | string) {
  if (route.name == "editQuote") {
    recargarServicioEditar(id_incoterms);
    recargarCostosEditar(id_incoterms);
    const data = {
      listServices: nuevosServicios.value,
      opcionCostos: opcionNuevos.value,
    };
    setTimeout(async () => {
      appStore.spiner = true;
      await pricingStore.registrarQuotePorCambioIncoterms(data);
      appStore.spiner = false;
      if (pricingStore.nro_quote) {
        Swal.fire({
          icon: "success",
          title: "Aviso",
          text: pricingStore.mensaje,
          confirmButtonText: "Copiar Archivos",
          showConfirmButton: true,
          allowEnterKey: true,
          allowOutsideClick: true,
          allowEscapeKey: true,
        }).then(() => {
          dialogFiles.value = true;
        });
        const id_branch = sessionBranchId();
        const branchCreacion = [1, 2];
        if (branchCreacion.includes(id_branch)) {
          const urlCarpeta = await pricingStore
            .crearCarpetaOneDrive({
              nro_quote: pricingStore.nro_quote,
              nombre: pricingStore.datosPrincipales.nombre,
            })
            .catch((e: unknown) => {
              console.error(e);
            });

          if (urlCarpeta) {
            urlGenerada.value = urlCarpeta;
            console.log(urlGenerada.value);
            await Promise.all([
              pricingStore.actualizarURLEnElQuote({
                id: pricingStore.id,
                url: urlCarpeta,
              }),
            ]);
          } else {
            console.warn(
              "No se obtuvo URL de OneDrive, se saltó la actualización.",
            );
          }
        }
      }
    }, 500);
  }
  // if (this.$route.name == "newQuote") {
  //   this.recargarNuevo(id_incoterms);
  // }
}
function recargarServicioEditar(id_incoterms?: number | string) {
  const servicesPorIncoterm = pricingStore.preServices.filter(
    (v) =>
      v.id_incoterms == id_incoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment == pricingStore.datosPrincipales.idtipocarga,
  );

  const servicesActual = servicesActuales.value;

  const nuevosServiciosEditar: Servicio[] = [];

  servicesPorIncoterm.forEach((element) => {
    if (
      servicesActual.some(
        (v) => Number(v.code_service) === Number(element.code_service),
      )
    ) {
      const serv = servicesActual.find(
        (v) => Number(v.code_service) === Number(element.code_service),
      );
      nuevosServiciosEditar.push({ ...element, status: serv!.status });
    } else {
      nuevosServiciosEditar.push(element);
    }
  });

  nuevosServicios.value = nuevosServiciosEditar;
}

function recargarCostosEditar(id_incoterms?: number | string) {
  const preCostos = pricingStore.preCostos.filter(
    (v) =>
      v.id_incoterms == id_incoterms &&
      v.id_modality == pricingStore.datosPrincipales.idsentido &&
      v.id_shipment == pricingStore.datosPrincipales.idtipocarga,
  );
  const opcionCostos = [...pricingStore.opcionCostos];
  const newOpcionCosto: OpcionCosto[] = [];
  opcionCostos.forEach((opcion) => {
    const newCosto: Costo[] = [];
    const {
      listCostos,
      listImpuestos,
      nro_propuesta,
      listNotasQuote,
      date_end,
      tiempo_transito,
      selected,
    } = opcion;
    preCostos.forEach((element) => {
      if (
        listCostos.some(
          (v) => String(v.code_cost) === String(element.code_cost),
        )
      ) {
        const costo = listCostos.find(
          (v) =>
            v.esopcionflag == 1 &&
            String(v.code_cost) === String(element.code_cost),
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const venta = listCostos.find(
          (v) =>
            v.esventaflag == 1 &&
            String(v.code_cost) === String(element.code_cost),
        );
        if (costo) {
          newCosto.push({
            ...element,
            id_proveedor: costo.id_proveedor,
            id_multiplicador: costo.id_multiplicador,
            costounitario: costo.costounitario,
            nameservice: costo.nameservice,
            seguro: costo.seguro,
            status: 1,
            esopcionflag: 1,
            esventaflag: 0,
          });
          newCosto.push({
            ...element,
            id_proveedor: costo.id_proveedor,
            id_multiplicador: costo.id_multiplicador,
            costounitario: costo.costounitario,
            nameservice: costo.nameservice,
            seguro: costo.seguro,
            status: 1,
            esopcionflag: 0,
            esventaflag: 1,
          });
        }
      } else {
        newCosto.push({
          ...element,
          status: 1,
          esopcionflag: 1,
          esventaflag: 0,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        });
        newCosto.push({
          ...element,
          status: 1,
          esopcionflag: 0,
          esventaflag: 1,
          cif: parseFloat(String(0.35)),
          seguro: parseFloat(String(0.45)),
        });
      }
    });
    newOpcionCosto.push({
      listCostos: newCosto,
      listImpuestos: listImpuestos,
      nro_propuesta: nro_propuesta,
      listNotasQuote: listNotasQuote,
      date_end: date_end,
      tiempo_transito: tiempo_transito,
      selected: selected,
    });
  });
  opcionNuevos.value = newOpcionCosto;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function recargarNuevo(id_incoterms?: number | string) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const servicesPorIncoterm = pricingStore.preServices.filter(
    (v) => v.id_incoterms == id_incoterms,
  );
}
</script>

<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-card
      elevation="0"
      ref="frmPuerto"
    >
      <v-card-title>Datos Principales</v-card-title>
      <v-card-text>
        <v-form
          class=""
          ref="frmDatosPrincipales"
        >
          <v-container>
            <v-row>
              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Tipo de Marketing"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-1"
                  :items="listMarketingActivos"
                  item-title="name"
                  item-value="id"
                  v-model="pricingStore.datosPrincipales.id_marketing"
                />
                <v-autocomplete
                  label="Estado de la cotización"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listQuoteStatus"
                  item-title="name"
                  item-value="id"
                  v-model="pricingStore.datosPrincipales.id_status"
                  :item-props="(item) => ({ disabled: item.status != 1 })"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Ejecutivo"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listEjecutivo"
                  item-title="nombrecompleto"
                  item-value="id"
                  v-model="pricingStore.datosPrincipales.id_vendedor"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Pricing"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listEjecutivo"
                  item-title="nombrecompleto"
                  item-value="id"
                  v-model="pricingStore.datosPrincipales.id_pricing"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  label="Nombre del cliente"
                  variant="outlined"
                  placeholder="Nombre del cliente"
                  :append-inner-icon="'mdi-account-search'"
                  v-model="pricingStore.datosPrincipales.nombre"
                  @click:append-inner.stop="abrirModalCliente()"
                  @click="abrirModalCliente()"
                  :rules="[(v) => !!v || 'El nombre es requerido']"
                  density="compact"
                  required
                  autocomplete="off"
                  id="nombre"
                  name="nombre"
                  readonly
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  label="Teléfono"
                  variant="outlined"
                  placeholder="Teléfono..."
                  density="compact"
                  readonly
                  v-model="pricingStore.datosPrincipales.telefono"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Sentido"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listModality"
                  item-title="name"
                  item-value="id"
                  v-model="pricingStore.datosPrincipales.idsentido"
                  @update:model-value="recargarServiciosCostos()"
                  :disabled="!editableFlag"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <!-- @vue-expect-error return-object writes the shipment row into the id-or-row field -->
                <v-autocomplete
                  label="Tipo de Embarque"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="pricingStore.listShipment"
                  item-title="embarque"
                  item-value="id"
                  v-model="pricingStore.datosPrincipales.idtipocarga"
                  @update:model-value="recargarServiciosCostos()"
                  return-object
                  :disabled="!editableFlag"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-autocomplete
                  label="Incoterms"
                  variant="outlined"
                  density="compact"
                  :rules="[(v) => !!v || 'Dato requerido']"
                  class="my-0"
                  :items="incoterms"
                  item-title="text"
                  item-value="id"
                  v-model="pricingStore.datosPrincipales.idincoterms"
                  @update:model-value="recargarServiciosCostos"
                >
                  <template #selection="data">
                    {{ data.item.name }} - {{ data.item.description }}
                  </template>
                </v-autocomplete>
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  name="name"
                  label="Nombre del proveedor"
                  id="id"
                  v-model="pricingStore.datosPrincipales.proveedor"
                  density="compact"
                  variant="outlined"
                  v-if="mostrarProveedorFlag"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  name="Teléfono"
                  label="Teléfono del proveedor"
                  v-model="
                    pricingStore.datosPrincipales.telefonoproveedor
                  "
                  density="compact"
                  variant="outlined"
                  :rules="[
                    (v) => {
                      if (v === '' || /^\+?\d+$/.test(v)) {
                        return true; // Válido si está en blanco o cumple con el formato
                      } else {
                        return 'Formato de teléfono no válido';
                      }
                    },
                  ]"
                  v-if="mostrarProveedorFlag"
                />
              </v-col>

              <v-col
                cols="12"
                class="my-0 py-0"
              >
                <v-text-field
                  label="Dirección del proveedor"
                  v-model="
                    pricingStore.datosPrincipales.direccionproveedor
                  "
                  density="compact"
                  variant="outlined"
                  v-if="mostrarProveedorFlag"
                />
              </v-col>
              <v-col
                cols="12"
                class="my-0 py-0 align-right"
                v-if="mostrarContinuarFlag && mostrarBtn"
              >
                <v-btn
                  color="#3F51B5"
                  @click="continuarDatosCarga()"
                  size="small"
                >
                  Continuar Datos Carga
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
    </v-card>
    <!-- dIALOG -->
    <v-dialog
      v-model="buscarClienteDialog"
      max-width="80%"
      v-if="buscarClienteDialog"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Buscar Cliente<v-spacer />
          <v-btn
            color="success"
            @click="registrarNuevoCliente"
            size="small"
          >
            Nuevo Cliente
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  label="Buscar..."
                  v-model="search"
                />
              </v-col>
              <v-col cols="12">
                <v-data-table
                  :headers="headers"
                  :items="appStore.itemsEntities"
                  :search="search"
                  @dblclick:row="guardarCliente"
                  item-value="index"
                  :loading="appStore.itemsEntities.length == 0"
                  loading-text="Buscando Clientes..."
                >
                  <template #[`item.action`]="{ item }">
                    <v-btn
                      size="small"
                      color="success"
                      @click="guardarCliente(null, { item: item as ClienteListado })"
                    >
                      Seleccionar <v-icon class="mx-2">
                        mdi-account-plus
                      </v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogFiles"
      max-width="40%"
    >
      <v-card>
        <v-card-title> Archivos a Copiar </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersFiles"
            :items="pricingStore.listadoFilesDrive"
            show-select
            v-model="pricingStore.selectedFile"
            item-value="id"
            return-object
          >
            <template #[`item.action`]="{ item }">
              <v-btn
                variant="text"
                icon
                size="small"
                :color="getColorIcon(item)"
                :href="item.webUrl"
                target="_blank"
              >
                <v-icon>{{ getIconFile(item) }}</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            @click="copiarArchivos"
          >
            Guardar e Ir A la Nueva Cotización
          </v-btn>
          <v-btn
            size="small"
            color="error"
            @click="dialogFiles = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.align-right {
  text-align: right;
}
</style>
