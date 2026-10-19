<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue";
import { useStore } from "vuex";
import { readSheet as readXlsFile } from "read-excel-file/browser";
import Swal from "sweetalert2";
import { useCalculadorasStore } from "@/stores/calculadoras";
import type { OpcionCalculadora, TransporteCalculadora } from "@/types/calculadora";

const props = withDefaults(defineProps<{ type?: string; idModality?: number }>(), {
  type: "type",
  idModality: 1,
});

const calculadorasStore = useCalculadorasStore();
const rootStore = useStore();

const id_state = null;
const dialogEditar = ref(false);
const loading = ref(false);
const headers = [
  { key: "index", title: "#" },
  { key: "peso_desde", title: "Peso Desde" },
  { key: "peso_hasta", title: "Peso Hasta" },
  { key: "provinciacbo", title: "Provincia Sistema" },
  { key: "provincia", title: "Provincia Excel" },
  { key: "distritocbo", title: "Distrito Sistema" },
  { key: "distrito", title: "Distrito Excel" },
  { key: "tarifamonlocal", title: "Tarifa Soles" },
  { key: "tarifadolar", title: "Tarifa En Dolares" },
];

const headersListado = [
  { key: "peso_desde", title: "Peso Desde" },
  { key: "peso_hasta", title: "Peso Hasta" },
  { key: "provincia", title: "Provincia" },
  { key: "distrito", title: "Distrito" },
  { key: "tarifamonlocal", title: "Tarifa Soles" },
  { key: "tipocambio", title: "Tipo Cambio" },
  { key: "tarifadolar", title: "Tarifa En Dolares" },
  { key: "action" },
];
const procesando = false;
const excel = ref<File | null>(null);
const tipocambio = ref<number | string>(3.4);
const tabTransporte = ref("datosactuales");
const datosExcel = ref<TransporteCalculadora[]>([]);
const transporte = ref<TransporteCalculadora>({});
const subir = ref(false);
const frmEditar = useTemplateRef("frmEditar");
const frmDatos = useTemplateRef("frmDatos");

const opcionCalculadora = computed({
  get() {
    return calculadorasStore.opcionCalculadora;
  },
  set(value) {
    calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
  },
});
const obtenerValoresTransportePorOpcion = computed(() => {
  return calculadorasStore.lstTransporte.filter(
    (v) => v.opcion == opcionCalculadora.value,
  );
});
const opciones = computed({
  get() {
    return calculadorasStore.opciones;
  },
  set(value: OpcionCalculadora[]) {
    // @ts-expect-error Kept: the old setter passed the option list as the selected option
    calculadorasStore.setOpcion(value); // o una mutation/action de Vuex
  },
});
const procesarflag = computed(() => {
  if (!excel.value) return false;
  return true;
});

watch(opcionCalculadora, () => {
  datosExcel.value = [];
  excel.value = null;
});
watch(
  () => transporte.value.tipocambio,
  () => {
    if ((transporte.value.tipocambio as number) > 0) {
      transporte.value.tarifadolar = parseFloat(
        String((transporte.value.tarifamonlocal as number) / (transporte.value.tipocambio as number)),
      ).toFixed(2);
    }
  },
);
watch(
  () => transporte.value.tarifamonlocal,
  () => {
    if ((transporte.value.tipocambio as number) > 0) {
      transporte.value.tarifadolar = parseFloat(
        String((transporte.value.tarifamonlocal as number) / (transporte.value.tipocambio as number)),
      ).toFixed(2);
    }
  },
);

onMounted(async () => {
  Promise.all([cargarDistritos(), calculadorasStore.getCiudad({})]);
});

function editar(item: TransporteCalculadora) {
  transporte.value = { ...item };
  dialogEditar.value = true;
}

function abrirModalNuevo() {
  transporte.value = {
    id: null,
    peso_desde: null,
    peso_hasta: null,
    id_provincia: null,
    id_distrito: null,
    tarifadolar: null,
    tarifamonlocal: null,
    opcion: calculadorasStore.opcionCalculadora,
    shimpent: props.type,
    tipocambio: 1,
    id_modality: props.idModality,
  };
  dialogEditar.value = true;
  setTimeout(() => {
    frmEditar.value!.resetValidation();
  }, 100);
}
async function guardarRegistro() {
  console.log("frmEditar", frmEditar.value);
  if ((await frmEditar.value!.validate()).valid) {
    await calculadorasStore.RegistroTransporte(transporte.value);
    await calculadorasStore.getTransporte({
      shimpent: props.type,
      id_modality: props.idModality,
    });
    dialogEditar.value = false;
  }
}
async function actualizarRegistro() {
  // @ts-expect-error Kept: tests that validate exists instead of calling it
  if (frmEditar.value!.validate) {
    await calculadorasStore.ActualizarTransporte(transporte.value);
    await calculadorasStore.getTransporte({
      shimpent: props.type,
      id_modality: props.idModality,
    });
    dialogEditar.value = false;
  }
}
function borrar(item: TransporteCalculadora) {
  Swal.fire({
    icon: "question",
    title: "Eliminar",
    text: "Está seguro que desea eliminar el registro",
    allowEnterKey: false,
    allowEscapeKey: false,
    allowOutsideClick: false,
    confirmButtonText: "Si, Eliminar",
    denyButtonText: "Cancelar",
    showDenyButton: true,
    showCloseButton: true,
  }).then(async (res) => {
    if (res.isConfirmed) {
      await calculadorasStore.EliminarTransporte(item);
      await calculadorasStore.getTransporte({
        shimpent: props.type,
        id_modality: props.idModality,
      });
    }
  });
}
async function cargarDistritos() {
  loading.value = true;
  await calculadorasStore.getDistritos({
    id_state: id_state,
  });
  loading.value = false;
}
async function procesarExcel() {
  const file = document.getElementById("excel") as HTMLInputElement;
  const datos: TransporteCalculadora[] = [];
  datosExcel.value = [];

  await readXlsFile(file.files![0]!).then((rows) => {
    for (let index = 0; index < rows.length; index++) {
      if (index > 1) {
        datos.push({
          peso_desde: rows[index]![0] as number,
          peso_hasta: rows[index]![1] as number,
          provincia: rows[index]![2] as string,
          // puerto_destino: rows[index][3],
          distrito: rows[index]![4] as string,
          tarifadolar: parseFloat(String((rows[index]![5] as number) / (tipocambio.value as number))).toFixed(
            2,
          ),
          tarifamonlocal: rows[index]![5] as number,
          opcion: calculadorasStore.opcionCalculadora,
        });
      }
    }
  });
  rootStore.state.spiner = true;
  datosExcel.value = await calculadorasStore.validarTransporte({ datovalidar: datos });
  rootStore.state.spiner = false;
}

async function registrarDatos() {
  // 1. Primero validamos el formulario para evitar cálculos si hay errores
  if (!(await frmDatos.value!.validate()).valid) {
    Swal.fire({
      icon: "error",
      title: "Verificar",
      text: "Faltan Datos por Rellenar. Verifique",
    });
    return; // Detenemos la ejecución aquí
  }

  rootStore.state.spiner = true;

  try {
    // 2. Definimos de qué tamaño serán los lotes (ej. 500 registros por petición)
    const tamañoLote = 100; // Ajusta este número según la capacidad de tu backend
    const peticionesPromesas = [];

    // 3. Rompemos this.datosExcel en lotes más pequeños
    for (let i = 0; i < datosExcel.value.length; i += tamañoLote) {
      const lote = datosExcel.value.slice(i, i + tamañoLote);

      const dataLote = {
        shimpent: "LCL",
        id_modality: props.idModality,
        datos: lote, // Enviamos solo la porción del array
      };

      // 4. En lugar de hacer await aquí, empujamos la promesa al array
      peticionesPromesas.push(calculadorasStore.setGuardarTransporte(dataLote));
    }

    // 5. Ejecutamos todas las peticiones en paralelo
    await Promise.all(peticionesPromesas);

    // 6. Una vez que TODAS las peticiones terminaron, actualizamos la tabla principal
    await calculadorasStore.getTransporte({
      shimpent: props.type,
      id_modality: props.idModality, // Nota: agregué 'this.' que faltaba en tu código original
    });

    tabTransporte.value = "datosactuales";
  } catch (error) {
    console.error("Error procesando el lote de datos:", error);
    Swal.fire({
      icon: "error",
      title: "Error de Servidor",
      text: "Ocurrió un error al guardar los registros. Revisa la consola.",
    });
  } finally {
    // 7. Apagamos el spinner sin importar si hubo éxito o error
    rootStore.state.spiner = false;
  }
}
</script>

<template>
  <v-container>
    <v-col cols="12">
      <center>
        <v-btn
          :class="opcionCalculadora == opcion.id ? 'Active' : 'Inactive'"
          v-for="(opcion, index) in opciones"
          :key="index"
          class="mx-1"
          size="small"
          @click="opcionCalculadora = opcion.id"
        >
          {{ opcion.nombre }}
        </v-btn>
      </center>
    </v-col>
    <v-row class="mt-2">
      <v-col
        cols="12"
        class="py-0"
      >
        <v-divider />
      </v-col>
      <v-col cols="12">
        <v-tabs
          v-model="tabTransporte"
          align-tabs="center"
          slider-color="yellow"
        >
          <v-tab value="datosactuales">
            Datos Actuales
          </v-tab>
          <v-tab value="cargamasiva">
            Carga Masiva
          </v-tab>
        </v-tabs>
        <v-tabs-window v-model="tabTransporte">
          <v-tabs-window-item value="datosactuales">
            <v-row>
              <v-col
                cols="12"
                class="d-flex justify-end"
              >
                <v-btn
                  color="success"
                  size="small"
                  @click="abrirModalNuevo"
                >
                  Nuevo Registro
                </v-btn>
              </v-col>
              <v-col cols="12">
                <v-data-table
                  :headers="headersListado"
                  :items="obtenerValoresTransportePorOpcion"
                >
                  <template #[`item.action`]="{ item }">
                    <v-btn
                      variant="text"
                      color="#E65100"
                      icon
                      @click="editar(item)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      variant="text"
                      color="#D50000"
                      icon
                      @click="borrar(item)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item value="cargamasiva">
            <v-row class="my-2">
              <v-col
                cols="12"
                md="2"
                style="text-align: right"
              >
                <v-text-field
                  type="number"
                  label="Tipo Cambio"
                  step="0.01"
                  density="compact"
                  variant="outlined"
                  v-model="tipocambio"
                />
              </v-col>
              <v-col
                cols="12"
                md="4"
                style="text-align: right"
              >
                <v-file-input
                  variant="outlined"
                  show-size
                  density="compact"
                  v-model="excel"
                  label="Cargar Excel de Transporte"
                  placeholder="Seleccione un archivo"
                  id="excel"
                  hide-details
                  @click:clear="subir = false"
                  @update:model-value="subir = false"
                  @click="subir = false"
                />
              </v-col>
              <v-col
                cols="12"
                md="6"
                style="text-align: right"
              >
                <v-btn
                  color="warning"
                  @click="procesarExcel()"
                  :loading="procesando"
                  class="mx-1"
                  size="small"
                  :disabled="!procesarflag"
                >
                  Procesar
                </v-btn>
                <!-- <v-btn color="success" small @click="abrirModalNuevo">Nuevo</v-btn> -->
                <v-btn
                  color="success"
                  size="small"
                  @click="registrarDatos"
                  :disabled="!datosExcel.length"
                >
                  Guardar
                </v-btn>
              </v-col>
              <v-col cols="12">
                <v-form ref="frmDatos">
                  <v-data-table
                    :headers="headers"
                    :items="
                      datosExcel.filter(
                        (v) =>
                          v.opcion ==
                          calculadorasStore.opcionCalculadora,
                      )
                    "
                    density="compact"
                  >
                    <template #[`item.index`]="{ item }">
                      {{ item.index }}
                    </template>
                    <template #[`item.provinciacbo`]="{ item }">
                      <v-autocomplete
                        :items="calculadorasStore.lstCiudades"
                        v-model="item.id_provincia"
                        item-value="id"
                        item-title="name"
                        density="compact"
                        :rules="[(v) => !!v || 'Datos requeridos']"
                      />
                    </template>
                    <template #[`item.distritocbo`]="{ item }">
                      <v-autocomplete
                        :items="
                          calculadorasStore.lstDistritos.filter(
                            (d) => d.id_city == item.id_provincia,
                          )
                        "
                        v-model="item.id_distrito"
                        item-value="id"
                        item-title="name"
                        density="compact"
                        :rules="[(v) => !!v || 'Datos requeridos']"
                      />
                    </template>
                  </v-data-table>
                </v-form>
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialogEditar"
      persistent
      max-width="30%"
    >
      <v-card>
        <v-card-title>
          {{ transporte.id ? "Editar Transporte" : "Nuevo Registro" }}
        </v-card-title>
        <v-card-text>
          <v-form ref="frmEditar">
            <v-text-field
              label="Peso Desde"
              v-model="transporte.peso_desde"
              type="number"
              step="0.01"
              :rules="[(v) => v === 0 || !!v || 'Dato Requerido']"
            />
            <v-text-field
              label="Peso Hasta"
              v-model="transporte.peso_hasta"
              type="number"
              step="0.01"
              :rules="[(v) => v === 0 || !!v || 'Dato Requerido']"
            />

            <v-autocomplete
              :items="calculadorasStore.lstCiudades"
              label="Departamento"
              placeholder="Departamento"
              item-value="id"
              item-title="name"
              v-model="transporte.id_provincia"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />

            <v-autocomplete
              :items="
                calculadorasStore.lstDistritos.filter(
                  (v) => v.id_city == transporte.id_provincia,
                )
              "
              label="Distrito"
              placeholder="Distrito"
              item-value="id"
              item-title="name"
              :loading="loading"
              v-model="transporte.id_distrito"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />

            <v-text-field
              v-model="transporte.tarifamonlocal"
              label="Tarifa SOLES"
              type="number"
              step="0.001"
              :rules="[(v) => (!!v && v > 0) || 'Dato Requerido']"
            />

            <v-text-field
              v-model="transporte.tipocambio"
              label="Tipo Cambio"
              type="number"
              step="0.001"
              :rules="[(v) => (!!v && v > 0) || 'Dato Requerido']"
            />

            <v-text-field
              v-model="transporte.tarifadolar"
              label="Tarifa Dolar"
              type="number"
              step="0.001"
              :rules="[(v) => (!!v && v > 0) || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            v-if="!transporte.id"
            @click="guardarRegistro"
            size="small"
          >
            Guardar
          </v-btn>
          <v-btn
            color="success"
            v-if="!!transporte.id"
            @click="actualizarRegistro"
            size="small"
          >
            Actualizar
          </v-btn>
          <v-btn
            color="error"
            size="small"
            @click="dialogEditar = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
