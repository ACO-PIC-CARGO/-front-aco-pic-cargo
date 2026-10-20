<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { readSheet as readXlsxFile } from "read-excel-file/browser";
import type { Row } from "read-excel-file/browser";
import Swal from "sweetalert2";
import type { FilaPedidoGastos, ResultadoCargaMasivaGastos } from "@/types/cargaMasiva";
import { sessionBranchId } from "@/utils/sesion";
import { useMastersStore } from "@/stores/masters";
import { useControlGastosStore } from "@/stores/controlGastos";

const appStore = useAppStore();
const controlGastosStore = useControlGastosStore();
const mastersStore = useMastersStore();
const router = useRouter();

const fileInput = useTemplateRef("fileInput");

const tab = ref<number | null>(null);
const dialog = ref(false);
const loading = ref(false);
const id_exp = ref<number | string | null>(null);
const nuevoExpediente = ref(false);
const loadingArras = ref(true);
const companiaflag = ref(false);
const nombrecampania = ref("");
const files = ref<File[]>([]);
const filesErrorExtension = ref<string[]>([]);
const filesErrorCampanias = ref<string[]>([]);
const filesErrorTelefono = ref<string[]>([]);
const filesErrorNombre = ref<string[]>([]);
const datos = ref<FilaPedidoGastos[]>([]);
const nro_cuotas = ref(3);
const cuota = ref<string[]>([]);
const fechacuota = ref<string[]>([]);
const headers = [
  { title: "Nombres", key: "nombres" },
  { title: "Apellidos Paterno", key: "apaterno" },
  { title: "Apellido  Materno", key: "amaterno" },
  { title: "Teléfono", key: "telefono" },
  { title: "Teléfono 2", key: "telefono2" },
  { title: "Monto ($)", key: "monto" },
  { title: "Pedidos", key: "pedidos" },
  { title: "Nombre del documento", key: "document" },
];

function addCol() {
  // Actualizar el número de elementos en los arreglos cuota y fechacuota
  // this.cuota = new Array(this.nro_cuotas).fill({ value: 0 });
  // this.fechacuota = new Array(this.nro_cuotas).fill({ value: "" });
}
function openFileInput() {
  fileInput.value!.$el.click();
}

function subirarchivoflag() {
  let val = false;
  if (
    nuevoExpediente.value == false &&
    (!id_exp.value || !nombrecampania.value)
  ) {
    val = true;
  }
  if (nuevoExpediente.value == true && !nombrecampania.value) {
    val = true;
  }
  for (let i = 0; i < nro_cuotas.value; i++) {
    if (!cuota.value[i] && !!nuevoExpediente.value) {
      val = true;
    }
    if (!fechacuota.value[i] && !!nuevoExpediente.value) {
      val = true;
    }
  }
  return val;
}
async function nombreCampania() {
  appStore.spiner = true;
  nombrecampania.value = (await controlGastosStore
    .getNombreCompania(id_exp.value)
    .catch((e: unknown) => console.log(e))) as string;

  if (!!nombrecampania.value) {
    companiaflag.value = true;
  }
  appStore.spiner = false;
}
function nuevoExpedienteFlag() {
  return nuevoExpediente.value == true ? false : true;
}

function abrirDialog() {
  files.value = [];
  tab.value = null;
  dialog.value = !dialog.value;
}
async function validarExtensionDocumento() {
  let validacion = true as boolean;
  const filesArray = Array.from(files.value);
  filesArray.forEach((element, index) => {
    const data = element.name.split(".");
    const format = data[data.length - 1];
    if (format != "xlsx") {
      filesErrorExtension.value.push(
        `Archivo N° ${index + 1}, Nombre: ${element.name}`
      );
      validacion = false;
    }
    return validacion;
  });
  return validacion;
  //   setTimeout(() => {
  //     resolve(validacion);
  //   }, vm.files.length * 250);
  // });
}
async function validarCampania() {
  filesErrorCampanias.value = [];
  // return new Promise((resolve) => {
  let val = true as boolean;
  let cant = 0;

  const filesArray = Array.from(files.value);
  filesArray.forEach(async (file, index) => {
    await readXlsxFile(file)
      .then((rows) => {
        if (cant == 0) {
          cant = rows.length;
        }
        if (cant != 0) {
          if (cant != rows.length) {
            val = false;
            //
            filesErrorCampanias.value.push(
              `Archivo N° ${index + 1}, Nombre: ${file.name}`
            );
          }
        }
      })
      .catch((error) => {
        console.error("Error al procesar el archivo:", error);
      });
  });
  return val;
}
function validarHayTelefonoYHayNombre() {
  filesErrorTelefono.value = [];
  let validacion = true as boolean;
  // return new Promise((resolve) => {
  const filesArray = Array.from(files.value);
  filesArray.forEach(async (file, index) => {
    await readXlsxFile(file)
      .then((rows) => {
        for (let i = 0; i < rows.length; i++) {
          if (i == 5) {
            if (!rows[i]![2]) {
              filesErrorTelefono.value.push(
                `Archivo N° ${index + 1}, Nombre: ${file.name}`
              );
              validacion = false;
            }
          }
          if (i == 4) {
            if (!rows[i]![2]) {
              filesErrorNombre.value.push(
                `Archivo N° ${index + 1}, Nombre: ${file.name}`
              );
              validacion = false;
            }
          }
        }
      })
      .catch((error) => {
        console.error("Error al procesar el archivo:", error);
      });
  });

  return validacion;
}

async function procesarExcel() {
  // return new Promise(async (resolve) => {
  let val = { validacion: true, html: "" };
  datos.value = [];
  let html = "";
  const valExtension = await validarExtensionDocumento().then((res) => {
    return res;
  });
  if (valExtension) {
    const valCampania = await validarCampania().then((res) => {
      return res;
    });
    if (valCampania) {
      const valTelefono = await validarHayTelefonoYHayNombre();

      if (!valTelefono) {
        html = `El(los) archivos: <br> "${filesErrorTelefono.value.join(
          "<br>"
        )}" <br> No Contiene número telefónico  . Verifique`;
      }
    } else {
      html = `El(los) archivos: <br> "${filesErrorCampanias.value.join(
        "<br>"
      )}" <br> No son la misma campaña que el primer archivo. Verifique`;
    }
  } else {
    html = `El(los) archivos: <br>  "${filesErrorExtension.value.join(
      "<br> "
    )}"<br>  No cumplen con el tipo de documento valido. Verifique`;
  }

  return !!html
    ? (val = {
        validacion: false,
        html: html,
      })
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    : (val = {
        validacion: true,
        html: html,
      });
}
async function guardarDatosEnTabla() {
  const filesArray = Array.from(files.value);

  await filesArray.forEach(async (element) => {
    await readXlsxFile(element)
      .then(async (rows) => {
        await procesarDatos({ item: rows, name: element.name }); // Aquí deberías hacer algo con los datos procesados
      })
      .catch((error) => {
        console.error("Error al procesar el archivo:", error);
      });
  });
  return true;
}
async function procesarDatos({ item: item, name: name }: { item: Row[]; name: string }) {
  const data: FilaPedidoGastos = { document: name };
  let indexMonto: number | null = null;
  let indexPedido: number | null = null;
  for (let i = 0; i < item.length; i++) {
    if (i > 0) {
      if (i == 4) {
        const cliente = (item[i]![2] as string).split(" ");
        data.nombres = cliente[0];
        data.apaterno = cliente.length > 1 ? cliente[1] : "";
        data.amaterno = cliente.length > 2 ? cliente[2] : "";
      }
      if (i == 5) {
        const tel = await obtenerTelefono(item[i]![2] as string);

        data.telefono = tel[0];
        data.telefono2 = tel.length > 1 ? tel[1] : "";
        // data.telefono2 = this.obtenerTelefono(item[i][2]);
      }
      if (i == 6) {
        for (let index = 0; index < item[i]!.length; index++) {
          if (item[i]![index] === "MONTO") {
            indexMonto = index;
          }
        }
      }
      if (i == 6) {
        for (let index = 0; index < item[i]!.length; index++) {
          if (item[i]![index] === "PEDIDOS") {
            indexPedido = index;
          }
        }
      }
      if (i == 7) {
        data.monto = isNaN(item[i]![indexMonto as number] as number)
          ? 0
          : parseFloat(item[i]![indexMonto as number] as string).toFixed(2);
      }
      if (i == 7) {
        data.pedidos = parseFloat(item[i]![indexPedido as number] as string);
      }
      // if (i==) {}
    }
  }
  datos.value.push(data);
}
function obtenerTelefono(telefono: string) {
  telefono = telefono.toString(); // Convertir a cadena de texto
  const regex = /\s*[\/,;\\]\s*/;
  if (regex.test(telefono)) {
    const telefonos = telefono.split(regex);
    return telefonos;
  } else {
    const tel: string[] = [];
    tel.push(telefono);
    return tel;
  }
}
async function handleDrop(event: DragEvent) {
  event.preventDefault();
  loadingArras.value = true;
  loading.value = true;
  // @ts-expect-error a drop stores the FileList itself
  files.value = event.dataTransfer!.files;
  const procesar = await procesarExcel().then((res) => {
    return res;
  });

  if (procesar.validacion == true) {
    await guardarDatosEnTabla().then((res) => {
      return res;
    });
  }
  if (procesar.validacion == false) {
    Swal.fire({
      icon: "error",
      html: procesar.html,
    });
  }
  loading.value = false;
  loadingArras.value = false;
  dialog.value = !dialog.value;
}
async function Procesar() {
  loading.value = true;
  const procesar = await procesarExcel().then((res) => {
    return res;
  });

  if (procesar.validacion == true) {
    await guardarDatosEnTabla().then((res) => {
      return res;
    });
  }
  if (procesar.validacion == false) {
    Swal.fire({
      icon: "error",
      html: procesar.html,
    });
  }
  loading.value = false;
  dialog.value = !dialog.value;
}
function validarRegistro() {
  let sum = 0;
  let val = true;
  for (let i = 0; i < nro_cuotas.value; i++) {
    sum += parseFloat(cuota.value[i]!);
  }
  if (sum != 100 && !!nuevoExpediente.value) {
    Swal.fire({
      icon: "error",
      html: "El porcentaje final debe ser igual al 100%",
    });
    val = false;
  }
  return val;
}
async function generarControlesGastos() {
  if (validarRegistro()) {
    const cuotas: { porcentaje: string | undefined; fecha: string | undefined }[] = [];
    for (let i = 0; i < nro_cuotas.value; i++) {
      cuotas.push({
        porcentaje: cuota.value[i],
        fecha: fechacuota.value[i],
      });
    }

    const data = {
      id_master: nuevoExpediente.value == true ? "" : id_exp.value,
      id_operador: JSON.parse(sessionStorage.getItem("dataUser") as string)[0].id,
      id_branch: sessionBranchId(),
      nombrecampania: nombrecampania.value,
      cuotas: cuotas,
      nro_cuotas: nro_cuotas.value,
      detalle: datos.value,
      nuevo: nuevoExpediente.value,
    };
    appStore.spiner = true;
    const response: ResultadoCargaMasivaGastos[] = await controlGastosStore.CargaMasivaControlDeGastos(data);

    if (response[0]!.esnuevoflag == true) {
      // nro_master
      const id_branch = sessionBranchId();
      const branchCreacion = [1, 2];
      if (branchCreacion.includes(id_branch)) {
        const url = await mastersStore.createCarpetaOneDrive({
          name: response[0]!.nro_master,
        });
        console.log("url1", url);
        if (url) {
          await mastersStore.actualizarMaster({
            id: response[0]!.id_master,
            url: url,
          });
        }
      }
      // actualizarMaster
    }
    appStore.spiner = false;
    Swal.fire({
      icon: "success",
      text:
        response[0]!.esnuevoflag == true
          ? `Se ha registrado el master con el código ${response[0]!.nro_master}`
          : "Actualización Correcta",
      confirmButtonText: "Descargar Reporte",
      denyButtonText: "Ir A Editar el Master",
      showDenyButton: true,
      showCancelButton: true,
      cancelButtonText: "Ir la control de gasto",
      allowOutsideClick: false,
    }).then(async (res) => {
      if (res.isConfirmed) {
        await controlGastosStore.DescargarConsolidadoCargaMasiva(response[0]!.id_master);
        // this.datos = [];
      }
      if (res.isDenied) {
        router.push({
          name: "controlMasterId",
          params: {
            id: response[0]!.id_master,
          },
        });
      }
      if (res.isDismissed) {
        router.push({
          name: "editControlGasto",
          params: {
            id: response[0]!.id_master,
            id_branch: sessionBranchId(),
          },
        });
      }
    });
  }
}

onMounted(async () => {
  Swal.fire({
    icon: "question",
    text: "¿Desea crear un nuevo expediente?",
    showConfirmButton: true,
    showDenyButton: true,
    confirmButtonText: "Crear un nuevo expediente",
    denyButtonText: "Seleccionar un expediente",
    confirmButtonColor: "#1A237E",
    denyButtonColor: "#004D40",
    allowOutsideClick: false,
    showCloseButton: true,
    timer: null as unknown as number,
  }).then(async (res) => {
    if (res.isConfirmed) {
      nuevoExpediente.value = true;
    }
    if (res.isDenied) {
      nuevoExpediente.value = false;
      appStore.spiner = true;
      await appStore._getMasterList();
      appStore.spiner = false;
    }
  });
});
</script>

<template>
  <v-container>
    <v-form>
      <v-row>
        <v-col
          cols="3"
          v-if="nuevoExpedienteFlag()"
        >
          <!--  -->
          <v-autocomplete
            :items="appStore.itemsMasterList"
            v-model="id_exp"
            @update:model-value="nombreCampania()"
            label="Expediente"
            item-title="code_master"
            item-value="id"
          />
        </v-col>
        <v-col cols="3">
          <v-text-field
            name="name"
            label="Nombre de la campaña"
            id="id"
            v-model="nombrecampania"
            :readonly="companiaflag"
          />
        </v-col>
        <v-col cols="1">
          <v-text-field
            label="Nro Cuotas"
            v-if="nuevoExpediente"
            v-model="nro_cuotas"
            @change="addCol"
            type="number"
            min="1"
          />
        </v-col>
        <v-col cols="5">
          <v-btn
            color="success"
            @click="abrirDialog"
            :disabled="subirarchivoflag()"
          >
            Subir Archivo
          </v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <center v-if="nro_cuotas > 0 && nuevoExpediente">
            PORCENTAJE Y FECHAS DE PAGO* (Datos requeridos para continuar)
          </center>
        </v-col>

        <v-col
          v-for="n in Number(nro_cuotas)"
          :cols="12 / nro_cuotas"
          :key="n"
        >
          <v-row>
            <v-col cols="6">
              <v-text-field
                :label="`Porcentaje Cuota-${n}`"
                v-if="nuevoExpediente"
                v-model="cuota[n - 1]"
                type="number"
                suffix="%"
                density="compact"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                :label="`Fecha de pago ${n}`"
                v-if="nuevoExpediente"
                v-model="fechacuota[n - 1]"
                type="date"
                density="compact"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-form>
    <v-row>
      <v-col cols="12">
        <center><h3>Listado de Datos Obtenidos</h3></center>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="datos"
          class="elevation-1"
          item-value="index"
          :loading="datos.length != files.length"
        />
      </v-col>
      <v-col cols="12">
        <v-spacer />
        <v-btn
          color="success"
          v-if="datos.length > 0"
          @click="generarControlesGastos()"
        >
          Generar
        </v-btn>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialog"
      max-width="50%"
      persistent
    >
      <v-card color="basil">
        <v-card-title class="text-center justify-center py-6">
          <h1 class="font-weight-bold text-display-medium basil--text">
            SUBIR ARCHIVOS
          </h1>
        </v-card-title>

        <v-tabs
          v-model="tab"
          bg-color="transparent"
          color="basil"
          grow
        >
          <!-- <v-tab> Seleccionar Archivos </v-tab> -->
          <v-tab> Cargar Archivos </v-tab>
        </v-tabs>

        <v-tabs-window v-model="tab">
          <v-tabs-window-item>
            <v-card
              color="basil"
              flat
            >
              <v-card-text>
                <div
                  class="drop-area"
                  @dragover.prevent
                  @drop="handleDrop"
                  @click="openFileInput"
                  v-if="!loading"
                >
                  <label>
                    Arrastra y suelta archivos aquí
                    <v-file-input
                      ref="fileInput"
                      v-model="files"
                      hide-details
                      multiple
                      @update:model-value="Procesar()"
                      style="display: none"
                    />
                  </label>
                </div>
                <div v-else>
                  <v-card color="primary">
                    <v-card-text>
                      Se está analizando los archivos, un momento por
                      favor....
                      <v-progress-linear
                        indeterminate
                        color="white"
                        class="mb-0"
                      />
                    </v-card-text>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.drop-area {
  width: 100%;
  height: 150px;
  border: 2px dashed #ccc;
  text-align: center;
  line-height: 150px;
  cursor: pointer;
}
</style>
