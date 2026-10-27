<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useAduanaStore } from "@/stores/aduana";
import { usePricingStore } from "@/stores/pricing";
import { sessionIsoPais } from "@/utils/sesion";
import type { TipoContenedor } from "@/types/catalogos";
import type {
  FilaMedidaCarga,
  FormMedidasCarga,
  Puerto,
  TipoCarga,
  TotalMedidaCarga,
} from "@/types/cotizacion";

const props = withDefaults(
  defineProps<{ mostrarBtn?: boolean; abrirModalContenedorRecargar?: boolean }>(),
  { mostrarBtn: true, abrirModalContenedorRecargar: false },
);
const emit = defineEmits<{
  recargarCostos: [abrirModal?: boolean];
  activarServicios: [];
}>();

const appStore = useAppStore();
const aduanaStore = useAduanaStore();
const masterusuariosStore = useMasterusuariosStore();
const pricingStore = usePricingStore();

const mostrarContinuarFlag = ref(true);
const headers = [
  { title: "", key: "action" },
  { title: "#", key: "number" },
  { title: "Tipo Contendor", key: "description" },
  { title: "Cantidad", key: "cantidad" },
];
const dialogConteiner = ref(false);
const numerobultos = ref("");
const volumen = ref("");
const peso = ref("");
const err = ref("");
const containers = ref({
  container: "" as unknown as TipoContenedor,
  cantidad: "",
});
const calculadoraFlag = ref(false);
const unidadesLongitud = [
  { text: "Centimetros", value: 1, factor: 0.01 },
  { text: "Metros", value: 2, factor: 1 },
  { text: "Pulgadas", value: 3, factor: 0.0254 },
  { text: "Pie", value: 4, factor: 0.3048 },
  { text: "Milímetros", value: 5, factor: 0.001 },
];
const unidadesPeso = [
  { text: "Kilo", value: 1, factor: 1 },
  { text: "Libra", value: 2, factor: 0.4535 },
  { text: "Tonelada", value: 3, factor: 1000 },
];
const fromMedidas = ref<FormMedidasCarga>({
  idLongitud: null,
  idpeso: null,
  bultos: null,
  largo: null,
  ancho: null,
  alto: null,
  peso: null,
});
const tblMedida = ref<FilaMedidaCarga[]>([]);
const tblTotal = ref<TotalMedidaCarga>({
  descripcion: null,
  uni: null,
  peso: null,
  volumen: null,
});
const frmPuerto = useTemplateRef("frmPuerto");
const frmDatosCarga = useTemplateRef("frmDatosCarga");
const frmContainer = useTemplateRef("frmContainer");
const calcularPesoFrom = useTemplateRef("calcularPesoFrom");

// Shadowed by the later computed block, so it never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const abrirModalContenedorSombreado = computed(() => aduanaStore.abrirModalContenedor);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPuertoOrigen = computed(() => {
  let puertos: Puerto[] = [];

  if (aduanaStore.datosPrincipales.iddestino) {
    const id_port = aduanaStore.listPortEnd.filter(
      (v) =>
        v.id_port == aduanaStore.datosPrincipales.iddestino
    )[0]!.id_port;
    puertos = aduanaStore.listPortBegin.filter(
      (v) => v.id_port != id_port
    );
  } else {
    return aduanaStore.listPortBegin;
  }
  return puertos;
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getPuertoDestino = computed(() => {
  let puertos: Puerto[] = [];
  if (aduanaStore.datosPrincipales.idorigen) {
    const id_port = aduanaStore.listPortBegin.filter(
      (v) =>
        v.id_port == aduanaStore.datosPrincipales.idorigen
    )[0]!.id_port;
    puertos = aduanaStore.listPortEnd.filter(
      (v) => v.id_port != id_port
    );
  } else {
    puertos = aduanaStore.listPortEnd;
  }
  return puertos;
});

const isFcl = computed(() => {
  if (
    typeof aduanaStore.datosPrincipales.idtipocarga ===
    "object"
  ) {
    return (
      aduanaStore.datosPrincipales.idtipocarga.code === "FCL"
    );
  }
  if (
    typeof aduanaStore.datosPrincipales.idtipocarga !==
    "object"
  ) {
    return aduanaStore.listShipment.some(
      (v) =>
        v.id == aduanaStore.datosPrincipales.idtipocarga &&
        v.code == "FCL"
    );
  }
  return false;
});

watch(
  () => props.abrirModalContenedorRecargar,
  () => {
    if (aduanaStore.datosPrincipales.containers!.length == 0) {
      dialogConteiner.value = true;
    }
  },
);
// Shadowed with the earlier computed block, so this watcher never ran.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function abrirModalContenedorSombreadoWatcher() {
  const isFCL = aduanaStore.listShipment.some(
    (v) =>
      v.id ==
        ((aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id
          ? (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).id
          : aduanaStore.datosPrincipales.idtipocarga) &&
      v.code == "FCL"
  );
  if (
    isFCL &&
    aduanaStore.datosPrincipales.containers!.length == 0
  ) {
    dialogConteiner.value = true;
  }
  if (
    !isFCL &&
    (aduanaStore.datosPrincipales.numerobultos == 0 ||
      aduanaStore.datosPrincipales.peso == 0 ||
      aduanaStore.datosPrincipales.volumen == 0)
  ) {
    Swal.fire({
      icon: "info",
      title: "Importante",
      text: "Es necesario llenar los datos, el Nro Bultos, Volumen, Peso.",
    });
  }
}

async function recargarPuertoOrigen(textoBuscar: string) {
  const idtipocarga =
    typeof aduanaStore.datosPrincipales.idtipocarga ===
    "object"
      ? aduanaStore.datosPrincipales.idtipocarga.id
      : aduanaStore.datosPrincipales.idtipocarga;

  const id_transport = aduanaStore.listShipment.filter(
    (v) => v.id == idtipocarga
  );

  await aduanaStore.getPortBeginAduana({
    id_transport: id_transport[0]!.id_transport!,
    id: aduanaStore.datosPrincipales.idorigen,
    search: textoBuscar,
  });
}
async function recargarPuertoDestino(textoBuscar: string) {
  const idtipocarga =
    typeof aduanaStore.datosPrincipales.idtipocarga ===
    "object"
      ? aduanaStore.datosPrincipales.idtipocarga.id
      : aduanaStore.datosPrincipales.idtipocarga;
  const id_transport = aduanaStore.listShipment.filter(
    (v) => v.id == idtipocarga
  );
  await aduanaStore.getPortEndAduana({
    id_transport: id_transport[0]!.id_transport!,
    id: aduanaStore.datosPrincipales.iddestino,
    search: textoBuscar,
  });
}
async function anadirCarga() {
  if ((await frmDatosCarga.value!.validate()).valid) {
    aduanaStore.datosPrincipales.numerobultos =
      numerobultos.value;
    aduanaStore.datosPrincipales.volumen = volumen.value;
    aduanaStore.datosPrincipales.peso = peso.value;
    frmDatosCarga.value!.reset();
    aduanaStore.actualizarCostosFlag =
      !aduanaStore.actualizarCostosFlag;
  }
}
async function guardarContainer() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cantCostos = aduanaStore.listCostos.length;
  err.value = "";
  if ((await frmContainer.value!.validate()).valid) {
    if (
      aduanaStore.datosPrincipales.containers!.filter(
        (v) => v.id == containers.value.container.id
      ).length == 0
    ) {
      aduanaStore.datosPrincipales.containers!.push({
        id_containers: containers.value.container.id,
        id: containers.value.container.id,
        description: containers.value.container.name,
        cantidad: containers.value.cantidad as unknown as number,
        code: containers.value.container.code,
      });
      dialogConteiner.value = false;
      containers.value = {
        container: "" as unknown as TipoContenedor,
        cantidad: "",
      };
      emit("recargarCostos", false);
    } else {
      err.value = "Contenedor ya se encuentra en la lista";
    }
  }
}
async function eliminarContainer({ index = null }: { index?: number | null }) {
  aduanaStore.datosPrincipales.containers!.splice(index!, 1);
  emit("recargarCostos");
}
async function aceptar() {
  let validate = true;
  if ((await frmPuerto.value!.validate()).valid) {
    if (
      (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).code == "FCL"
    ) {
      if (
        aduanaStore.datosPrincipales.containers!.length == 0
      ) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita al menos un contenedor",
        });
        validate = false;
      }
    }
    if (
      (aduanaStore.datosPrincipales.idtipocarga as TipoCarga).code != "FCL"
    ) {
      if (
        !aduanaStore.datosPrincipales.numerobultos &&
        !aduanaStore.datosPrincipales.volumen &&
        !aduanaStore.datosPrincipales.peso
      ) {
        Swal.fire({
          icon: "error",
          title: "Aviso",
          text: "Se necesita los datos de la carga",
        });
        validate = false;
      }
    }
    if (validate) {
      emit("activarServicios");
      mostrarContinuarFlag.value = false;
    }
    //
  }
  // this.$store.commit("SET_STEP_3", true);
}

//
async function calcular() {
  if ((await calcularPesoFrom.value!.validate()).valid) {
    // bultos

    // factores
    const factLongitud = unidadesLongitud.filter(
      (v) => v.value == fromMedidas.value.idLongitud
    )[0]!.factor;

    const facPeso = unidadesPeso.filter(
      (v) => v.value == fromMedidas.value.idpeso
    )[0]!.factor;

    // volumen

    const volumen =
      (fromMedidas.value.largo as number) *
      (fromMedidas.value.ancho as number) *
      (fromMedidas.value.alto as number) *
      Math.pow(factLongitud, 3);
    // peso
    const peso =
      facPeso *
      (fromMedidas.value.peso as number) *
      (fromMedidas.value.bultos as number);
    tblMedida.value.push({
      uni: fromMedidas.value.bultos,
      peso: parseFloat(String(peso)).toFixed(2),
      volumen: parseFloat(
        String((fromMedidas.value.bultos as number) * volumen)
      ).toFixed(2),
    } as FilaMedidaCarga);

    nextTick(() => {
      calcularPesoFrom.value!.reset();
      total();
    });
  }
}

function total() {
  tblTotal.value = null as unknown as TotalMedidaCarga;
  let uni = 0;
  let peso = 0;
  let volumen = 0;
  tblMedida.value.forEach((element) => {
    uni += parseFloat(element.uni as string);
    peso += parseFloat(element.peso as string);
    volumen += parseFloat(element.volumen as string);
  });
  tblTotal.value = {
    descripcion: "Total:",
    uni: uni,
    peso: peso,
    volumen: volumen,
  };
}

function borrarFila(i: number) {
  tblMedida.value.splice(i, 1);
  total();
}

function guardarDatosCalculadora() {
  aduanaStore.datosPrincipales.numerobultos =
    tblTotal.value.uni;
  aduanaStore.datosPrincipales.volumen = tblTotal.value.volumen;
  aduanaStore.datosPrincipales.peso = tblTotal.value.peso;
  calculadoraFlag.value = false;
  aduanaStore.actualizarCostosFlag =
    !aduanaStore.actualizarCostosFlag;
}
function mostrarComboPercepcionAduana() {
  const esPeru = sessionIsoPais() == 9589;
  return (
    esPeru &&
    aduanaStore.listModality.some(
      (v) =>
        v.id == aduanaStore.datosPrincipales.idsentido &&
        v.code == "I"
    )
  );
}

function cambiarImpuesto() {
  let porcentaje = "10";
  const impuestos = Array.isArray(aduanaStore.listImpuestos)
    ? aduanaStore.listImpuestos
    : [];
  if (aduanaStore.datosPrincipales.id_percepcionaduana) {
    const percepciones = Array.isArray(
      masterusuariosStore.lstPercepcionAduana
    )
      ? masterusuariosStore.lstPercepcionAduana
      : [];
    const percepcion = percepciones.find(
      (v) =>
        v.id ==
        aduanaStore.datosPrincipales.id_percepcionaduana
    );
    if (percepcion) porcentaje = percepcion.codigo01!;
  }
  const newImpuesto = impuestos.map((impuesto) =>
    impuesto.codigo == "09"
      ? { ...impuesto, codigo01: porcentaje }
      : impuesto
  );
  pricingStore.listImpuestos = newImpuesto;
  aduanaStore.listImpuestos = newImpuesto;
  aduanaStore.opcionCostos.forEach((element) => {
    const impuestosOpcion = Array.isArray(element.listImpuestos)
      ? element.listImpuestos
      : [];
    element.listImpuestos = impuestosOpcion.map((impuesto) =>
      impuesto.codigo == "09"
        ? { ...impuesto, codigo01: porcentaje }
        : impuesto
    );
  });
}
function recalcularCalculadora() {
  let uni = 0;
  let peso = 0;
  let volumen = 0;
  tblMedida.value.forEach((element) => {
    uni += parseFloat(element.uni as string);
    peso += parseFloat(element.peso as string);
    volumen += parseFloat(element.volumen as string);
  });
  tblTotal.value.uni = parseFloat(String(uni)).toFixed(2);
  tblTotal.value.peso = parseFloat(String(peso)).toFixed(2);
  tblTotal.value.volumen = parseFloat(String(volumen)).toFixed(2);
}
</script>

<template>
  <v-container
    fluid
    class="pa-0"
  >
    <v-card elevation="0">
      <v-card-title> Datos de la Carga </v-card-title>
      <v-card-text>
        <v-form ref="frmPuerto">
          <v-row>
            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
            >
              <v-autocomplete
                label="Puerto Origen"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="aduanaStore.listPortBegin"
                item-title="name"
                item-value="id_port"
                v-model="aduanaStore.datosPrincipales.idorigen"
                @update:search="recargarPuertoOrigen"
              />
            </v-col>
            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
            >
              <v-autocomplete
                label="Puerto Destino"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="aduanaStore.listPortEnd"
                item-title="name"
                item-value="id_port"
                v-model="aduanaStore.datosPrincipales.iddestino"
                @update:search="recargarPuertoDestino"
              />
            </v-col>
            <v-col
              cols="12"
              lg="6"
              xl="6"
              class="py-1"
              v-if="mostrarComboPercepcionAduana()"
            >
              <v-autocomplete
                label="Primera o Segunda Importación"
                variant="outlined"
                density="compact"
                :rules="[(v) => !!v || 'Dato requerido']"
                class="my-1"
                :items="masterusuariosStore.lstPercepcionAduana"
                item-title="descripcion"
                item-value="id"
                v-model="
                  aduanaStore.datosPrincipales.id_percepcionaduana
                "
                @update:model-value="cambiarImpuesto()"
              />
            </v-col>
          </v-row>
        </v-form>

        <v-row>
          <v-col class="center">
            <v-icon color="red">
              mdi-arrow-down-left-bold
            </v-icon>
            <b>LLENAR ESTOS CAMPOS</b>
            <v-icon color="red">
              mdi-arrow-down-right-bold
            </v-icon>
          </v-col>
        </v-row>
        <v-form ref="frmDatosCarga">
          <v-row v-if="!isFcl">
            <v-col
              cols="12"
              lg="4"
              xl="4"
            >
              <v-text-field
                label="Número Bultos"
                v-model="numerobultos"
                variant="outlined"
                density="compact"
                type="number"
                suffix="uni"
                :error-messages="err"
                step="1"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) =>
                    /^-?\d+$/.test(v) || 'Debe ser un número entero válido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
              />
            </v-col>

            <v-col
              cols="12"
              lg="4"
              xl="4"
            >
              <v-text-field
                label="Volumen"
                v-model="volumen"
                variant="outlined"
                density="compact"
                type="number"
                suffix="m3"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
              />
            </v-col>
            <v-col
              cols="12"
              lg="4"
              xl="4"
            >
              <v-text-field
                label="Peso"
                v-model="peso"
                variant="outlined"
                density="compact"
                type="number"
                suffix="kg"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => v > 0 || 'El valor tiene que ser un númro positivo',
                ]"
                @keyup.enter="anadirCarga()"
              />
            </v-col>
            <v-col
              cols="12"
              align="center"
            >
              <v-btn
                class="mx-1"
                size="small"
                color="info"
                @click="anadirCarga()"
              >
                AGREGAR
              </v-btn>
              <v-btn
                class="mx-1"
                size="small"
                color="warning"
                @click="calculadoraFlag = !calculadoraFlag"
              >
                USAR CALCULADORA
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-table
                density="compact"
                class="elevation-1 my-2"
              >
                <thead class="bg-teal-lighten-2 text-white">
                  <tr>
                    <th>Cant. Bultos</th>
                    <th>Peso</th>
                    <th>Volumen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {{ aduanaStore.datosPrincipales.numerobultos }}
                    </td>
                    <td>{{ aduanaStore.datosPrincipales.peso }}</td>
                    <td>{{ aduanaStore.datosPrincipales.volumen }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-row>

          <v-row v-else>
            <v-col
              cols="12"
              align="right"
            >
              <v-btn
                color="success"
                @click="dialogConteiner = !dialogConteiner"
              >
                Agregar Contenedor
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headers"
                :items="aduanaStore.datosPrincipales.containers!"
                class="elevation-1"
              >
                <template #[`item.action`]="item">
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarContainer({ index: item.index })"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
                <template #[`item.number`]="item">
                  {{ item.index + 1 }}
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions
        class="mt-auto"
        v-if="mostrarContinuarFlag && mostrarBtn"
      >
        <v-spacer />
        <v-btn
          color="#3F51B5"
          size="small"
          @click="aceptar()"
        >
          Continuar Servicios
        </v-btn>
      </v-card-actions>
    </v-card>
    <!-- AGREGAR CONTAINER -->
    <v-dialog
      v-model="dialogConteiner"
      scrollable
      persistent
      max-width="30%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title> Añadir Contenedor </v-card-title>
        <v-card-text>
          <!-- {{ $store.state.itemsContainers }} -->
          <v-form ref="frmContainer">
            <v-select
              :items="appStore.itemsContainers"
              v-model="containers.container"
              label="Container"
              item-title="name"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido']"
              :error-messages="err"
              return-object
            />
            <v-text-field
              name="Cantidad"
              label="Cantidad"
              v-model="containers.cantidad"
              type="number"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="guardarContainer()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            @click="dialogConteiner = !dialogConteiner"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- USAR CALCULADORA -->
    <v-dialog
      v-model="calculadoraFlag"
      max-width="40%"
    >
      <v-card>
        <v-card-title class="custom-card-title justify-center">
          <h3>CALCULADORA VOLUMÉTRICA</h3>
        </v-card-title>

        <v-card-text>
          <v-container>
            <v-form ref="calcularPesoFrom">
              <v-row>
                <v-col cols="4">
                  <v-autocomplete
                    item-title="text"
                    density="compact"
                    :items="unidadesLongitud"
                    label="Longitud"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.idLongitud"
                  />
                </v-col>

                <v-col cols="4">
                  <v-autocomplete
                    item-title="text"
                    density="compact"
                    :items="unidadesPeso"
                    label="Peso"
                    :rules="[(v) => !!v || 'Dato Requerido.']"
                    v-model="fromMedidas.idpeso"
                  />
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    type="number"
                    min="1"
                    label="N° Bultos"
                    required
                    density="compact"
                    step="1"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        /^-?\d+$/.test(v) || 'Debe ser un número entero válido',
                      (v) => v > 0 || 'El dato debe ser positivo',
                    ]"
                    v-model="fromMedidas.bultos"
                  />
                </v-col>
                <v-col
                  cols="12"
                  class="t-blue justify-center"
                >
                  <b>MEDIDAS POR CADA BULTO</b>
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    type="text"
                    label="Largo"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.largo"
                    inputmode="numeric"
                  />
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    type="text"
                    label="Ancho"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.ancho"
                    inputmode="numeric"
                  />
                </v-col>
                <v-col cols="3">
                  <v-text-field
                    type="text"
                    label="Alto"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.alto"
                    inputmode="numeric"
                  />
                </v-col>

                <v-col cols="3">
                  <v-text-field
                    type="number"
                    min="0"
                    step="0.01"
                    label="Peso X Bulto"
                    required
                    density="compact"
                    :rules="[
                      (v) => !!v || 'Dato Requerido.',
                      (v) =>
                        v > 0.0 || 'El valor tiene que ser un númro positivo',
                    ]"
                    v-model="fromMedidas.peso"
                  />
                </v-col>
                <div class="flex-grow-1 text-right">
                  <v-btn
                    size="small"
                    color="#fb9514"
                    class="me-2 text-white"
                    @click="calcular()"
                  >
                    <b>Calcular</b>
                  </v-btn>
                </div>
              </v-row>
            </v-form>
            <v-col cols="12">
              <span class="mt-2 ma-1 pa-1">
                Nota: Los valores de Peso y Volumen serán convertidos
                automáticamente al sistema MKS (Metros, Kilogramos, segundos)
                respectivamente.
              </span>
              <v-table
                density="compact"
                class="elevation-1"
                v-if="tblMedida.length > 0"
              >
                <thead class="bg-success text-white">
                  <tr>
                    <td>#</td>
                    <td>Uni(s)</td>
                    <td>Peso (Kg.)</td>
                    <td>Volumen (m <sup>3</sup>)</td>
                    <td />
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(medida, i) in tblMedida"
                    :key="i"
                  >
                    <td>{{ i + 1 }}</td>
                    <td>
                      <v-text-field
                        v-model="medida.uni"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="medida.peso"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="medida.volumen"
                        type="number"
                        variant="outlined"
                        density="compact"
                        hide-details
                        @update:model-value="recalcularCalculadora"
                      />
                    </td>
                    <td>
                      <v-btn
                        variant="text"
                        class="ma-0 pa-0"
                        icon
                      >
                        <v-icon
                          color="orange-darken-4"
                          @click="borrarFila(i)"
                        >
                          mdi-delete-circle
                        </v-icon>
                      </v-btn>
                    </td>
                  </tr>
                  <tr>
                    <td>{{ tblTotal.descripcion }}</td>
                    <td>{{ tblTotal.uni }}</td>
                    <td>{{ tblTotal.peso }}</td>
                    <td>{{ tblTotal.volumen }}</td>
                  </tr>
                </tbody>
              </v-table>
            </v-col>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            size="small"
            :disabled="tblMedida.length < 0"
            @click="guardarDatosCalculadora()"
          >
            Aceptar
          </v-btn>
          <v-btn
            color="red"
            class="text-white"
            size="small"
            @click="calculadoraFlag = !calculadoraFlag"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style>
.center {
  align-content: center !important;
  align-items: center !important;
  text-align: center !important;
}

.custom-card-title {
  background-color: #64b5f6 !important;
}

.justify-center {
  text-align: center !important;
}
.t-blue {
  color: blue !important;
}
</style>
