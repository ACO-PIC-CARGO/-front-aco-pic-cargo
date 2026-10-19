<script setup lang="ts">
import { onMounted, ref } from "vue";
import { readSheet as readXlsxFile } from "read-excel-file/browser";
import type { SheetData } from "read-excel-file/browser";
import { useStore } from "vuex";
import Swal from "sweetalert2";
import { useConfigEmpresaStore } from "@/stores/configEmpresa";
import { useEnterprisesStore } from "@/stores/enterprises";
import type { Modalidad } from "@/types/catalogos";
import type { TipoCarga } from "@/types/cotizacion";

const emit = defineEmits<{ omitir: []; regresar: []; continuarConfigurarTarifario: [] }>();

const rootStore = useStore();
const configEmpresaStore = useConfigEmpresaStore();
const enterprisesStore = useEnterprisesStore();

const dialog = ref(false);
const subirCliente = ref(false);
const headers = [
  { title: "Acción", key: "action" },
  { title: "TAX ID / RUC /  VAT / RIF", key: "document" },
  { title: "Razón social/Nombre Comercial", key: "nombre_completo" },
  // { text: "Ap Paterno", value: "nombre_fiscal" },
  { title: "Dirección", key: "direccion" },
  { title: "Email", key: "emailaddress" },
  { title: "Persona Contacto 1", key: "contacto_1" },
  { title: "Teléfono Contacto 1", key: "contacto_telf_1" },
  { title: "Persona Contacto 2", key: "contacto_2" },
  { title: "Teléfono Contacto 2", key: "contacto_telf_2" },
  { title: "Teléfono adicional 1", key: "telefono_1" },
  { title: "Teléfono adicional 2", key: "telefono_2" },
] as const;
const files = ref<File | File[] | null>([]);
const mostrarGuardar = ref(false);
const index_nombre_completo = ref(0);
const index_nombre_fiscal = ref(1);
const index_document = ref(2);
const index_direccion = ref(3);
const index_emailaddress = ref(4);
const index_contacto_1 = ref(5);
const index_contacto_telf_1 = ref(6);
const index_contacto_2 = ref(7);
const index_contacto_telf_2 = ref(8);
const index_telefono_1 = ref(9);
const index_telefono_2 = ref(10);
const ids_modality = ref<Array<number | string>>([]);
const ids_shipment = ref<Array<number | string>>([]);
const id_modality = ref<number | string>();
const id_shipment = ref<number | string>();

onMounted(() => {
  ids_modality.value = rootStore.state.pricing.listModality.map((element: Modalidad) => {
    return element.id;
  });
  ids_shipment.value = rootStore.state.pricing.listShipment.map((element: TipoCarga) => {
    return element.id;
  });
  id_modality.value = ids_modality.value[0];
  id_shipment.value = ids_shipment.value[0];
});

// Shadowed by the later omitir, so it never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function omitirSombreado() {
  enterprisesStore.datoClienteFlag = false;
  enterprisesStore.step++;
  enterprisesStore.inicioFlag = true;
}
function scrollToSubirCostos() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function continuar() {
  scrollToSubirCostos();
  rootStore.state.dialogProcessing = true;
  if (configEmpresaStore.lstClientes.length > 0) {
    for (const subconjunto of dividirEnSubconjuntos()) {
      await configEmpresaStore.actualizarDatoCMCliente(subconjunto);
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
        emit("continuarConfigurarTarifario");
        configEmpresaStore.OmitirConfiguracionCost();
      }
    });
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
        emit("continuarConfigurarTarifario");
        configEmpresaStore.OmitirConfiguracionCost();
      }
    });
  }
  rootStore.state.dialogProcessing = false;
}
function omitir() {
  configEmpresaStore.OmitirConfiguracionCost();
  emit("omitir");
}
function dividirEnSubconjuntos() {
  const SUBCONJUNTO_TAMANO = 100;
  const subconjuntos = [];
  for (let i = 0; i < configEmpresaStore.lstClientes.length; i += SUBCONJUNTO_TAMANO) {
    subconjuntos.push(configEmpresaStore.lstClientes.slice(i, i + SUBCONJUNTO_TAMANO));
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
function descargarFormato() {
  window.open(`${import.meta.env.VITE_URL_MAIN}uploads/Formato Cliente.xlsx`, "_blank");
}
function handleFileChange() {
  configEmpresaStore.lstClientes = [];
  readXlsxFile(files.value as File).then((rows) => {
    procesarDatosCliente(rows);
  });
  mostrarGuardar.value = true;
  files.value = [];
}
function procesarDatosCliente(rows: SheetData) {
  for (let index = 0; index < rows[0]!.length; index++) {
    if (rows[0]![index] == "document") {
      index_document.value = index;
    }
    if (rows[0]![index] == "nombre_completo") {
      index_nombre_completo.value = index;
    }
    if (rows[0]![index] == "nombre_fiscal") {
      index_nombre_fiscal.value = index;
    }

    if (rows[0]![index] == "direccion") {
      index_direccion.value = index;
    }
    if (rows[0]![index] == "emailaddress") {
      index_emailaddress.value = index;
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
    if (rows[0]![index] == "telefono_1") {
      index_telefono_1.value = index;
    }
    if (rows[0]![index] == "telefono_2") {
      index_telefono_2.value = index;
    }
  }

  for (let index = 1; index < rows.length; index++) {
    configEmpresaStore.lstClientes.push({
      document: rows[index]![index_document.value],
      nombre_completo: rows[index]![index_nombre_completo.value],
      nombre_fiscal: rows[index]![index_nombre_fiscal.value],
      direccion: rows[index]![index_direccion.value],
      emailaddress: rows[index]![index_emailaddress.value],
      contacto_1: rows[index]![index_contacto_1.value],
      contacto_telf_1: rows[index]![index_contacto_telf_1.value],
      contacto_2: rows[index]![index_contacto_2.value],
      contacto_telf_2: rows[index]![index_contacto_telf_2.value],
      telefono_1: rows[index]![index_telefono_1.value],
      telefono_2: rows[index]![index_telefono_2.value],
    });
  }
  files.value = [];
}
function eliminar(index: number) {
  configEmpresaStore.lstClientes.splice(index, 1);
}
</script>

<template class="formulario">
  <v-row>
    <!-- <v-col cols="12">
      <center>
        <p class="text-azul">3. CONFIGURACIÓN DE CLIENTES</p>
      </center>
    </v-col> -->

    <v-row
      v-if="!subirCliente"
      class="mx-1 my-1"
    >
      <v-col
        cols="12"
        md="6"
        offset-md="4"
      >
        <div style="text-align: center">
          <v-icon
            style="color: #f57c00"
            size="x-large"
          >
            mdi-account
          </v-icon>
        </div>
        <div
          class=""
          style="text-align: center"
        >
          <h2 style="color: #f57c00">
            CARGA MASIVA DE CLIENTES
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
                Permite subir todos los clientes de una sola vez.
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
                Ahorra tiempo y trabajo en próximas configuraciones.
              </td>
            </tr>
            <tr>
              <td style="text-align: left; vertical-align: top">
                <v-icon style="color: #388e3c">
                  mdi-check-circle
                </v-icon>
              </td>
              <td style="text-align: justify; vertical-align: top">
                Ideal si ya tienes tu base de datos lista.
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
            @click="subirCliente = !subirCliente"
            size="x-small"
          >
            CARGA MASIVA
          </v-btn>
          <v-btn
            class="my-1 mx-1 buttonDosFilas"
            color="#1A237E"
            @click="omitir"
            size="x-small"
          >
            CONTINUAR <br class="ocultarPc">
            LO HARÉ DESPUÉS
          </v-btn>
        </div>
      </v-col>
      <!-- <v-col cols="12" class="ocultarMovil">
        <center>
          <v-icon size="60" color="red">mdi-alert</v-icon>
        </center>
      </v-col>
      <v-col lg="6" md="6" sm="12" cols="12">
        <div class="opcion">
          <div class="opcionText">
            <p><b> OPCION 1: CARGA MASIVA </b></p>
            <p class="text-description">
              Permite cargar todos los
              <span class="spanClientes">clientes</span> de forma masiva (te
              brindaremos una plantilla de carga). De esta forma, se evita tener
              que agregar clientes individualmente en el futuro y tu
              operatividad sea más rápida.
            </p>
          </div>
          <v-btn
            class="my-2"
            block
            color="#4256BE"
            dark
            @click="subirCliente = !subirCliente"
          >
            CARGA MASIVA CLIENTES
          </v-btn>
        </div>
      </v-col>
      <v-col lg="6" md="6" sm="12" cols="12">
        <div class="opcion">
          <div class="opcionText">
            <p><b> OPCION 2: CARGA MANUAL POSTERIORMENTE </b></p>
            <p>
              Si no cargas <span class="spanClientes">clientes</span> (OPCION
              1), el sistema creará unos automáticos para su uso inicial. Podrás
              agregar o modificar clientes más adelante, ya sea de manera
              individual o masiva en el módulo de configuración.
            </p>
          </div>
          <v-btn
            class="my-2"
            block
            color="#7E7E7E"
            dark
            @click="$emit('omitir')"
          >
            USAR CLIENTE PROVISIONAL
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
        <v-card>
          <v-card-title class="d-flex align-center flex-wrap">
            LISTADO DE CLIENTES <v-spacer />
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
              Cargar Clientes
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
            :items="configEmpresaStore.lstClientes"
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
      </v-row>
    </v-col>
    <v-col
      cols="12"
      md="6"
      offset-md="4"
      style="text-align: center"
    >
      <!-- <v-btn
        class="mx-10 mt-1 mb-10"
        color="#7E7E7E"
        @click="$emit('omitir')"
        dark
      >
        Omitir
      </v-btn> -->
      <v-btn
        @click="$emit('regresar')"
        color="#78909C"
        class="mx-5 mt-1 mb-10"
      >
        REGRESAR A LA ANTERIOR
      </v-btn>
      <v-btn
        class="mx-10 mt-1 mb-10"
        @click="continuar()"
        v-if="subirCliente"
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
            src="https://www.youtube.com/embed/XHTTTYsE1UA"
            title="Tutorial Carga Cliente"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-row>
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
.classTableCliente {
  margin: 0 0 20% 0;
}
.opcion {
  border: 1px solid blue;
  margin: 1%;
  padding: 5%;
  border-radius: 25px;
}
.text-azul {
  /* background: red; */
  color: #4256be !important;
  font-size: 1.5rem;
  font-weight: bold;
}
.opcionText {
  /* border: 1px solid red; */
  /* margin: 5%; */
  text-align: justify;
  height: 150px;
}
.spanClientes {
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
/* .mt-info {
      padding: 0% 5%;
      margin: 25% 0 0 0;
    } */
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
