<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useTownStore } from "@/stores/town";
import { useCalculadorasStore } from "@/stores/calculadoras";
import { usePricingStore } from "@/stores/pricing";
import type { Servicio } from "@/types/cotizacion";

withDefaults(defineProps<{ mostrarBtn?: boolean }>(), { mostrarBtn: true });
const emit = defineEmits<{ activarLlenadoCostos: []; recargarCostos: [] }>();

const appStore = useAppStore();
const pricingStore = usePricingStore();
const calculadorasStore = useCalculadorasStore();
const townStore = useTownStore();
const { begEndList, listServices, opcionCostos, errorValorMercancia } = storeToRefs(pricingStore);

const dialog = ref(false);
const mostrarContinuarFlag = ref(true);
const servicio = ref<Servicio>({
  codebegend: "OP",
  id_begend: "0",
  service: "",
  status: true,
});
const categoriasConfig = [
  { code: "OR", title: "ORIGEN" },
  { code: "FL", title: "FLETE" },
  { code: "DE", title: "DESTINO" },
  { code: "OP", title: "OPCIONAL" },
];
const errorIdTown = ref("");

const isEmpresaPermitida = computed(() => appStore.isEmpresaPermitida);
const iddestino = computed(() => pricingStore.datosPrincipales.iddestino);
// Two-way bindings para propiedades de Vuex usando getters/setters computados
const amountModel = computed({
  get() {
    return pricingStore.datosPrincipales.amount;
  },
  set(value) {
    pricingStore.datosPrincipales.amount = value;
  },
});
const descripcionCargaModel = computed({
  get() {
    return pricingStore.datosPrincipales.descripcioncarga;
  },
  set(value) {
    pricingStore.datosPrincipales.descripcioncarga = value;
  },
});

const requiereValorMercancia = computed(() => {
  const keywords = ["seguro", "impuesto", "impuestos", "aduana en destino"];
  return listServices.value.some((s) => {
    if (!s || !(s.status === true || s.status === 1)) return false;
    const name = normalizeText(s.service);
    return keywords.some((k) => name.includes(k));
  });
});

watch(
  iddestino,
  (nuevoValor) => {
    buscarYCARGAR(nuevoValor);
  },
  { immediate: true },
);

watch(
  () => pricingStore.listPortEnd,
  () => {
    buscarYCARGAR(iddestino.value);
  },
  { deep: true },
);

onMounted(async () => {
  const port = pricingStore.listPortEnd.find(
    (v) => v.id_port == pricingStore.datosPrincipales.iddestino,
  );
  if (port) {
    await townStore.cargarTownParaPricing({ id_pais: port.id_pais! });
  }
});

function normalizeText(str: unknown) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getServicesByCode(code: string) {
  if (code !== "OP") {
    return listServices.value.filter((v) => v.codebegend === code);
  }

  // Lógica de "serviciosOpcionalesUnicos" optimizada dentro de una función pura
  const vistos = new Set<string>();
  return listServices.value
    .filter((v) => v.codebegend === "OP")
    .filter((s) => {
      const name = (s.service || "").trim().toLowerCase();
      if (!name) return true;
      if (vistos.has(name)) return false;
      vistos.add(name);
      return true;
    });
}

function guardarServicio() {
  const selectedCategory = begEndList.value!.find(
    (v) => v.id === servicio.value.id_begend,
  );

  if (selectedCategory) {
    servicio.value.codebegend = selectedCategory.code;
  }

  listServices.value.push({ ...servicio.value });
  dialog.value = false;
  resetFormularioServicio();
}

function resetFormularioServicio() {
  servicio.value = {
    codebegend: "OP",
    id_begend: "0",
    service: "",
    status: true,
  };
}

function recargarCostos() {
  pricingStore.errorValorMercancia = "";
  pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;
}

function actualizarCostoTransporte(idTown: unknown) {
  const { datosPrincipales } = pricingStore;
  const opcionTransporte = datosPrincipales.esindividualflag
    ? 1
    : datosPrincipales.esgrupalflag
    ? 2
    : 0;
  const peso = parseFloat(datosPrincipales.peso as string) || 0;
  const tarifa = calculadorasStore.lstTransporte.find(
    (transporte) =>
      String(transporte.id_distrito) === String(idTown) &&
      Number(transporte.opcion) === opcionTransporte &&
      peso >= parseFloat(transporte.peso_desde as string) &&
      peso <= parseFloat(transporte.peso_hasta as string),
  );
  const monto = tarifa ? parseFloat(tarifa.tarifadolar as string) : 0;

  (opcionCostos.value || []).forEach((opcion) => {
    (opcion.listCostos || []).forEach((costo) => {
      if (Number(costo.code_cost) === 13) {
        costo.costounitario = monto;
      }
    });
  });

  pricingStore.actualizarCostosFlag = !pricingStore.actualizarCostosFlag;
}

function continuarLlenadoCostos() {
  errorIdTown.value = "";
  pricingStore.errorValorMercancia = "";
  let val = true;

  const validarTown = listServices.value.some(
    (v) => v.code_service == '14' && v.status == 1,
  );

  if (
    requiereValorMercancia.value ||
    (validarTown && !pricingStore.datosPrincipales.id_town)
  ) {
    const amount = pricingStore.datosPrincipales.amount;
    if (!amount || (amount as number) <= 0) {
      pricingStore.errorValorMercancia = "Datos Requeridos y mayor que 0";
      val = false;
    }
    if (validarTown && !pricingStore.datosPrincipales.id_town) {
      errorIdTown.value = "Datos Requeridos";
      val = false;
    }
  }
  if (val) {
    emit("activarLlenadoCostos");
    mostrarContinuarFlag.value = false;
  }
}

async function showConfirmationDialog(service: Servicio) {
  const { datosPrincipales } = pricingStore;
  const esActivacionTransporteGrupal =
    Number(service.code_service) === 14 &&
    service.status &&
    datosPrincipales.esgrupalflag;

  if (esActivacionTransporteGrupal) {
    const resultado = await Swal.fire({
      icon: "warning",
      title: "Cotización grupal",
      text: 'Está en una cotización grupal. ¿Está seguro de activar el "transporte"?',
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#28a745",
      confirmButtonText: "Sí, activar",
      cancelButtonText: "No, cancelar",
      allowOutsideClick: false,
    });

    if (!resultado.isConfirmed) {
      service.status = 0;
      return;
    }
  }

  const mensajeTransporte =
    "Tarifa no incluye transporte en destino se puede hacer pero necesitamos dirección de entrega";
  const esServicioTransporte = service.service!.trim() === "TRANSPORTE EN DESTINO";

  if (esServicioTransporte) {
    const opciones = opcionCostos.value || [];

    opciones.forEach((opcion) => {
      if (!Array.isArray(opcion.listNotasQuote)) {
        opcion.listNotasQuote = [];
      }

      const existeNota = opcion.listNotasQuote.some(
        (n) =>
          n.descripcion === mensajeTransporte &&
          !n.statusincluye &&
          !n.statusnoincluye,
      );

      if (service.status && !existeNota) {
        opcion.listNotasQuote.push({
          descripcion: mensajeTransporte,
          estado: 1,
          statusincluye: 0,
          statusnoincluye: 0,
        });
      } else if (!service.status) {
        opcion.listNotasQuote = opcion.listNotasQuote.filter(
          (n) =>
            !(
              n.descripcion === mensajeTransporte &&
              !n.statusincluye &&
              !n.statusnoincluye
            ),
        );
      }
    });
  }

  emit("recargarCostos");
  if (!requiereValorMercancia.value) {
    pricingStore.errorValorMercancia = "";
  }
}

async function buscarYCARGAR(idDestino: number | string | undefined) {
  if (!idDestino) return;
  const listaPuertos = pricingStore.listPortEnd || [];
  // Usamos Number() o String() para evitar problemas de tipos
  const port = listaPuertos.find(
    (v) => String(v.id_port) === String(idDestino),
  );

  if (port) {
    await townStore.cargarTownParaPricing({ id_pais: port.id_pais! });
  }
}
</script>

<template>
  <v-card elevation="0">
    <!-- Diálogo para Nuevo Servicio -->
    <v-dialog
      v-model="dialog"
      max-width="30%"
    >
      <v-card>
        <v-card-title primary-title>
          Nuevo Servicio
        </v-card-title>
        <v-card-text>
          <v-select
            :items="begEndList"
            v-model="servicio.id_begend"
            item-title="name"
            item-value="id"
            label="Categoria..."
          />
          <v-text-field
            label="Descripción"
            v-model="servicio.service"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            @click="guardarServicio"
          >
            Guardar
          </v-btn>
          <v-btn
            color="red"
            @click="dialog = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Título y Subcabecera -->
    <v-card-title primary-title>
      SERVICIOS A REALIZAR:
      <v-btn
        variant="text"
        icon
        color="primary"
        @click="dialog = true"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-card-title>
    <v-list-subheader class="mt-0">
      <h4>Desmarque los servicios que NO desea utilizar.</h4>
    </v-list-subheader>

    <!-- Lista de Servicios por Categoría -->
    <v-card-text>
      <v-row>
        <v-col
          cols="12"
          lg="3"
          xl="3"
          v-for="cat in categoriasConfig"
          :key="cat.code"
        >
          <h4 class="mb-2">
            {{ cat.title }}
          </h4>
          <div
            v-for="service in getServicesByCode(cat.code)"
            :key="service.id"
          >
            <v-checkbox
              density="compact"
              v-model="service.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
              @update:model-value="showConfirmationDialog(service)"
            >
              <template #label>
                {{ service.service }}
              </template>
            </v-checkbox>
            <template
              v-if="
                service.code_service == 14 &&
                  service.status == 1 &&
                  isEmpresaPermitida
              "
            >
              <v-autocomplete
                :items="townStore.lstTown"
                item-title="nombrecompleto"
                item-value="id"
                density="compact"
                variant="outlined"
                label="Distrito"
                class="pr-10"
                v-model="pricingStore.datosPrincipales.id_town"
                :error-messages="errorIdTown"
                @update:model-value="
                  (value) => {
                    errorIdTown = '';
                    actualizarCostoTransporte(value);
                  }
                "
              />
            </template>
          </div>

          <!-- Campos adicionales solo para la sección OPCIONAL -->
          <template v-if="cat.code === 'OP'">
            <v-text-field
              prefix="$"
              :color="requiereValorMercancia ? 'red' : ''"
              :error-messages="errorValorMercancia"
              v-model="amountModel"
              label="Valor de la mercancia"
              type="number"
              step="0.10"
              min="0"
              placeholder="Valor de la mercancia..."
              autocomplete="off"
              density="compact"
              :required="requiereValorMercancia"
              :rules="[
                (v) =>
                  !requiereValorMercancia ||
                  (!!v && Number(v) > 0) ||
                  'Dato Requerido',
                (v) =>
                  !v ||
                  /^(?!0\d+|\d*e)\d*(?:\.\d+)?$/.test(v) ||
                  'Debe ser un número real entero positivo',
              ]"
              @update:model-value="recargarCostos"
              @blur="recargarCostos"
            />

            <v-text-field
              v-model="descripcionCargaModel"
              label="Descripción de carga"
              placeholder="Descripción de carga"
              autocomplete="off"
              density="compact"
            />
          </template>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider />

    <v-card-actions
      class="sticky-actions pa-3"
      v-if="mostrarBtn"
    >
      <v-spacer />
      <v-btn
        color="primary"
        size="large"
        @click="continuarLlenadoCostos"
      >
        <v-icon start>
          mdi-arrow-right-bold
        </v-icon>
        Continuar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.sticky-actions {
  position: sticky;
  bottom: 0;
  background: white;
  border-top: 1px solid #eee;
  z-index: 2;
}
</style>
