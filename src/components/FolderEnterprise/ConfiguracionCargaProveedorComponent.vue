<script setup lang="ts">
import { onMounted, ref } from "vue";
import { readSheet as readXlsxFile } from "read-excel-file/browser";
import type { SheetData } from "read-excel-file/browser";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useEnterprisesStore } from "@/stores/enterprises";
import { usePricingStore } from "@/stores/pricing";
import type { Modalidad } from "@/types/catalogos";
import type { TipoCarga } from "@/types/cotizacion";

const emit = defineEmits<{ omitir: []; regresar: []; continuarClientes: [] }>();

const rootStore = useStore();

const pricingStore = usePricingStore();
const configEmpresaStore = useConfigEmpresaStore();
const enterprisesStore = useEnterprisesStore();

const dialog = ref(false);
const subirProveedor = ref(false);
const files = ref<File | File[] | null>([]);
const headers = [
  { title: "Acción", key: "action" },
  { title: "TAX ID / RUC /  VAT / RIF", key: "nro_documento" },
  { title: "Razón social/Nombre Comercial", key: "nombre_comercial" },
  { title: "Email", key: "email" },
  { title: "Persona Contacto 1", key: "contacto_1" },
  { title: "Teléfono Contacto 1", key: "contacto_telf_1" },
  { title: "Persona Contacto 2", key: "contacto_2" },
  { title: "Teléfono Contacto 2", key: "contacto_telf_2" },
  { title: "Dirección", key: "direccion" },
  { title: "Teléfono adicional 1", key: "telefono_1" },
  { title: "Teléfono adicional 2", key: "telefono_2" },
] as const;
const mostrarGuardar = ref(false);
const index_nombre_comercial = ref(0);
const index_nro_documento = ref(1);
const index_contacto_1 = ref(2);
const index_contacto_telf_1 = ref(3);
const index_contacto_2 = ref(4);
const index_contacto_telf_2 = ref(5);
const index_direccion = ref(6);
const index_telefono_1 = ref(7);
const index_telefono_2 = ref(8);
const index_email = ref(9);
const ids_modality = ref<Array<number | string>>([]);
const ids_shipment = ref<Array<number | string>>([]);
const id_modality = ref<number | string>();
const id_shipment = ref<number | string>();

onMounted(() => {
  // console.log("recargo");
  ids_modality.value = pricingStore.listModality.map((element: Modalidad) => {
    return element.id;
  });
  ids_shipment.value = pricingStore.listShipment.map((element: TipoCarga) => {
    return element.id!;
  });
  id_modality.value = ids_modality.value[0];
  id_shipment.value = ids_shipment.value[0];
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function omitir() {
  enterprisesStore.datoProveedorFlag = false;
  enterprisesStore.datoClienteFlag = true;
}
function scrollToSubirCostos() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function continuar() {
  scrollToSubirCostos();
  rootStore.state.dialogProcessing = true;
  if (configEmpresaStore.lstProveedor.length > 0) {
    dividirEnSubconjuntos();
    for (const subconjunto of dividirEnSubconjuntos()) {
      await configEmpresaStore.actualizarDatoCMProveedor(subconjunto);
    }
    Swal.fire({
      icon: "success",
      text: "Registro Correcto",
      showCancelButton: false,
      confirmButtonText: "Ok",
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((res) => {
      if (res.isConfirmed) {
        emit("continuarClientes");
      }
    });

    // this.$emit("continuarClientes");
  } else {
    Swal.fire({
      icon: "warning",
      text: "NO HA CARGADO NINGUN ARCHIVO",
      showCancelButton: false,
      confirmButtonText: "Ok",
      allowEnterKey: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((res) => {
      if (res.isConfirmed) {
        emit("continuarClientes");
      }
    });
  }
  rootStore.state.dialogProcessing = false;
}
function descargarFormato() {
  window.open(`${import.meta.env.VITE_URL_MAIN}uploads/Formato Proveedor.xlsx`, "_blank");
}
function dividirEnSubconjuntos() {
  const SUBCONJUNTO_TAMANO = 100;
  const subconjuntos = [];
  for (let i = 0; i < configEmpresaStore.lstProveedor.length; i += SUBCONJUNTO_TAMANO) {
    subconjuntos.push(configEmpresaStore.lstProveedor.slice(i, i + SUBCONJUNTO_TAMANO));
  }
  return subconjuntos;
}
function openFileInput() {
  const fileInput = document.getElementById("fileInput");
  if (fileInput) {
    files.value = [];
    fileInput.click();
  }
  //   document.getElementById("fileInput").click();
}
function handleFileChange() {
  configEmpresaStore.lstProveedor = [];
  readXlsxFile(files.value as File).then((rows) => {
    procesarDatosProveedor(rows);
  });
  mostrarGuardar.value = true;
  files.value = [];
}
function procesarDatosProveedor(rows: SheetData) {
  for (let index = 0; index < rows[0]!.length; index++) {
    if (rows[0]![index] == "nombre_comercial") {
      index_nombre_comercial.value = index;
    }
    if (rows[0]![index] == "nro_documento") {
      index_nro_documento.value = index;
    }
    if (rows[0]![index] == "contacto_1") {
      index_contacto_1.value = index;
    }
    if (rows[0]![index] == "contacto_telf_1") {
      index_contacto_telf_1.value = index;
    }
    if (rows[0]![index] == "contacto_2") {
      index_contacto_2.value = index;
    }
    if (rows[0]![index] == "contacto_telf_2") {
      index_contacto_telf_2.value = index;
    }
    if (rows[0]![index] == "direccion") {
      index_direccion.value = index;
    }
    if (rows[0]![index] == "telefono_1") {
      index_telefono_1.value = index;
    }
    if (rows[0]![index] == "telefono_2") {
      index_telefono_2.value = index;
    }

    if (rows[0]![index] == "email") {
      index_email.value = index;
    }
  }

  for (let index = 1; index < rows.length; index++) {
    configEmpresaStore.lstProveedor.push({
      nombre_comercial: rows[index]![index_nombre_comercial.value],
      nro_documento: rows[index]![index_nro_documento.value],
      contacto_1: rows[index]![index_contacto_1.value],
      contacto_telf_1: rows[index]![index_contacto_telf_1.value],
      contacto_2: rows[index]![index_contacto_2.value],
      contacto_telf_2: rows[index]![index_contacto_telf_2.value],
      direccion: rows[index]![index_direccion.value],
      telefono_1: rows[index]![index_telefono_1.value],
      telefono_2: rows[index]![index_telefono_2.value],
      email: rows[index]![index_email.value],
    });
  }
  files.value = [];
}
function eliminar(index: number) {
  configEmpresaStore.lstProveedor.splice(index, 1);
}
</script>

<template class="formulario">
  <v-row>
    <!-- <v-col cols="12">
      <center><p class="text-azul">2. CONFIGURACIÓN DE PROVEEDORES</p></center>
    </v-col> -->
    <v-row
      v-if="!subirProveedor"
      class="mx-1 my-1"
    >
      <!-- <v-col cols="12" class="ocultarMovil">
        <center>
          <v-icon size="60" color="red">mdi-alert</v-icon>
        </center>
      </v-col> -->
      <v-col
        cols="12"
        md="6"
        offset-md="4"
      >
        <div style="text-align: center">
          <v-icon
            style="color: #1a237e"
            size="x-large"
          >
            mdi-account
          </v-icon>
        </div>
        <div
          class=""
          style="text-align: center"
        >
          <h2 style="color: #1a237e">
            CARGA MASIVA DE PROVEEDORES
          </h2>
        </div>
        <div class="">
          <table>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #1976d2">
                  mdi-check-circle
                </v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Permite subir todos los proveedores de una sola vez
              </td>
            </tr>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #1976d2">
                  mdi-check-circle
                </v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Te entregamos una plantilla para hacerlo
              </td>
            </tr>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #1976d2">
                  mdi-check-circle
                </v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Se evita tener que añadirlos uno por uno después
              </td>
            </tr>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #388e3c">
                  mdi-check-circle
                </v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Podrás cargar o modificar tus proveedores más adelante desde el
                módulo de ficheros.
              </td>
            </tr>
          </table>
        </div>
        <div
          class=""
          style="align-items: center; align-content: center; text-align: center"
        >
          <v-btn
            class="my-1 mx-1 button"
            color="#7E7E7E"
            @click="subirProveedor = !subirProveedor"
            size="x-small"
          >
            CARGA MASIVA
          </v-btn>
          <v-btn
            class="my-1 mx-1 buttonDosFilas"
            color="#1A237E"
            @click="$emit('omitir')"
            size="x-small"
          >
            CONTINUAR <br class="ocultarPc">
            LO HARÉ DESPUÉS
          </v-btn>
        </div>
      </v-col>
      <!-- <v-col cols="12" lg="6">
        <div class="opcion">
          <div class="opcionText">
            <p><b> OPCION 1: CARGA MASIVA </b></p>
            <p>
              Permite cargar todos los
              <span class="spanProveedores">PROVEEDORES</span> de forma masiva
              (te brindaremos una plantilla de carga). De esta forma, se evita
              tener que agregar proveedores individualmente en el futuro y tu
              operatividad sea más rápida.
            </p>
          </div>
          <v-btn
            class="my-1"
            block
            color="#4256BE"
            dark
            @click="subirProveedor = !subirProveedor"
          >
            CARGA MASIVA PROVEEDORES
          </v-btn>
        </div>
      </v-col> -->
      <!-- <v-col lg="6" xl="6" cols="12">
        <div class="opcion">
          <div class="opcionText">
            <p><b> OPCION 2: CARGA MANUAL </b></p>
            <p>
              Si no usas la opción 1, el sistema creará
              <span class="spanProveedores">PROVEEDORES</span> automáticos para
              su uso inicial. Podrás agregar o modificar proveedores más
              adelante, ya sea de manera individual o masiva en el módulo de
              configuración.
            </p>
          </div>
          <v-btn
            class="my-1 wrap-text-button"
            block
            color="#7E7E7E"
            dark
            @click="$emit('omitir')"
          >
            USAR PROVEEDORES PROVISIONALES
          </v-btn>
        </div>
      </v-col> -->
    </v-row>
    <v-col
      cols="12"
      v-else
      class="my-1"
    >
      <v-row>
        <v-col cols="8">
          <v-icon
            size="40"
            color="red"
          >
            mdi-alert
          </v-icon> Encuentra los pasos a
          seguir en el tutorial adjunto
        </v-col>
        <v-col cols="4">
          <v-btn
            color="#5E9AD6"
            size="small"
            @click="dialog = true"
          >
            Ver Tutorial
          </v-btn>
        </v-col>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center flex-wrap">
              LISTADO DE PROVEEDORES <v-spacer />
              <v-btn
                color="#7d8288"
                @click="descargarFormato()"
                size="x-small"
                class="mx-1"
              >
                Descargar Plantilla
              </v-btn>
              <v-btn
                color="#062c52"
                size="x-small"
                class="mx-1"
                @click="openFileInput()"
              >
                Cargar Proveedores
              </v-btn>
              <v-file-input
                v-model="files"
                id="fileInput"
                style="display: none"
                @update:model-value="handleFileChange"
                accept=".xlsx, .xls"
              />
            </v-card-title>
            <v-data-table
              :headers="headers"
              :items="configEmpresaStore.lstProveedor"
              item-value="index"
              class="elevation-5"
            >
              <template #[`item.action`]="{ index }">
                <v-btn
                  variant="text"
                  icon
                  color="red"
                  @click="eliminar(index)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-col>
    <v-col
      cols="12"
      md="6"
      offset-md="4"
      style="text-align: center"
    >
      <v-btn
        @click="$emit('regresar')"
        color="#78909C"
        class="mx-5 mt-1 mb-10"
      >
        REGRESAR A LA ANTERIOR
      </v-btn>
      <v-btn
        class="mx-5 mt-1 mb-10"
        @click="continuar()"
        v-if="subirProveedor"
        color="#1A237E"
      >
        Guardar y Continuar
      </v-btn>
    </v-col>
    <v-dialog
      v-model="dialog"
      v-if="dialog"
      scrollable
      persistent
      max-width="60%"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          <v-spacer />
          <v-btn
            variant="text"
            icon
            @click="dialog = !dialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <iframe
            width="800"
            height="400"
            src="https://www.youtube.com/embed/Vk07cXLM2vo"
            title="Tutorial Carga Proveedor"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<style scoped>
.opcion {
  border: 1px solid #4256be;
  margin: 1%;
  padding: 5%;
  border-radius: 25px;
}
.text-azul {
  /* background: red; */
  color: #4256be !important;
  font-size: 1.5rem;
  font-weight: bold;
  /* text-decoration: underline; */
  /*  text-decoration-color: yellow; */
}
.opcionText {
  /* border: 1px solid red; */
  /* margin: 5%; */
  text-align: justify;
  height: 150px;
}
.spanProveedores {
  text-transform: uppercase;
  font-weight: bold;
  background: yellow;
  padding: 0 5px;
}
.button {
  padding: 23px !important;
  width: 160px;
}
.buttonDosFilas {
  padding: 23px !important;
  width: 160px;
  white-space: normal;
}
@media (max-width: 918px) {
  .formulario {
    /* margin: 0%; */
    /* width: 50px !important; */
    padding: 0 0 5% 5%;
  }
  .opcion {
    border: 1px solid #4256be;
    margin: 1% 0;
    padding: 5%;
    border-radius: 25px;
    max-width: 93% !important;
  }
  .opcionText {
    text-align: justify;
    height: 250px;
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
