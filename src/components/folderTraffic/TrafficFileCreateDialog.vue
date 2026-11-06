<script setup lang="ts">
import { ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import { useTrafficStore } from "@/stores/traffic";
import type { TrafficFileForm } from "@/types/traffic";
import { generateIdempotencyKey } from "@/utils/idempotencia";
import { trafficFileProblem } from "@/utils/trafficSend";

const open = defineModel<boolean>({ required: true });
const emit = defineEmits<{ created: [] }>();

const emptyForm = (): TrafficFileForm => ({
  id_consigner: null,
  id_modality: null,
  id_shipment: null,
  id_port_begin: null,
  id_port_end: null,
  id_incoterms: null,
  id_pricing: null,
  bultos: null,
  peso: null,
  volumen: null,
  nro_traffic: null,
});

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const trafficStore = useTrafficStore();
const form = ref(emptyForm());
const manualNumber = shallowRef(false);
const nextCode = shallowRef("");
const problem = shallowRef("");
const saving = shallowRef(false);
let idempotencyKey = generateIdempotencyKey();

async function loadCatalogs() {
  const [numbering] = await Promise.all([
    trafficStore.correlative(),
    appStore.cargarClientes(),
    appStore._getModality(),
    appStore._getShipment(),
    appStore._getIncoterms(),
    pricingStore.getPersonalPricing(),
  ]);
  manualNumber.value = Boolean(numbering?.manual);
  nextCode.value = numbering?.next_code ?? "";
}

watch(
  open,
  (isOpen) => {
    if (!isOpen) return;
    form.value = emptyForm();
    problem.value = "";
    loadCatalogs();
  },
  { immediate: true },
);

watch(
  () => form.value.id_shipment,
  async (shipmentId) => {
    form.value.id_port_begin = null;
    form.value.id_port_end = null;
    const shipment = appStore.itemsShipment.find((item) => item.id === shipmentId);
    if (!shipment) return;
    await Promise.all([
      appStore._getPortBegin({ id_transport: shipment.id_transport }),
      appStore._getPortEnd({ id_transport: shipment.id_transport }),
    ]);
  },
);

async function create() {
  problem.value = trafficFileProblem(form.value, manualNumber.value);
  if (problem.value) return;

  saving.value = true;
  const answer = await trafficStore.createFile(
    { ...form.value, nro_traffic: manualNumber.value ? form.value.nro_traffic : null },
    idempotencyKey,
  );
  saving.value = false;
  idempotencyKey = generateIdempotencyKey();
  const created = answer.estadoflag ? answer.data[0] : undefined;
  if (!created) {
    problem.value = answer.mensaje;
    return;
  }

  open.value = false;
  emit("created");
  const choice = await Swal.fire({
    icon: "success",
    title: "Pre-expediente creado",
    text: answer.mensaje,
    confirmButtonText: "Ver expediente",
    showCancelButton: true,
    cancelButtonText: "Quedarme en la lista",
  });
  if (choice.isConfirmed) router.push({ name: "trafficVer", params: { id: created.id_house } });
}
</script>

<template>
  <v-dialog
    v-model="open"
    max-width="720"
    persistent
  >
    <v-card>
      <v-card-title class="pt-5 px-6">
        Nuevo pre-expediente
      </v-card-title>
      <v-card-text class="px-6">
        <v-row dense>
          <v-col cols="12">
            <v-autocomplete
              v-model="form.id_consigner"
              :items="appStore.clientes"
              item-title="namelong"
              item-value="id"
              label="Cliente"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              v-model="form.id_modality"
              :items="appStore.itemsModality"
              item-title="name"
              item-value="id"
              label="Sentido"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              v-model="form.id_shipment"
              :items="appStore.itemsShipment"
              item-title="embarque"
              item-value="id"
              label="Tipo de embarque"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              v-model="form.id_port_begin"
              :items="appStore.itemsPortBegin"
              item-title="name"
              item-value="id_port"
              label="Origen"
              :disabled="!form.id_shipment"
              :hint="form.id_shipment ? '' : 'Elige primero el tipo de embarque.'"
              persistent-hint
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              v-model="form.id_port_end"
              :items="appStore.itemsPortEnd"
              item-title="name"
              item-value="id_port"
              label="Destino"
              :disabled="!form.id_shipment"
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              v-model="form.id_incoterms"
              :items="appStore.itemsIncoterms"
              item-title="name"
              item-value="id"
              label="Incoterm (opcional)"
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            md="6"
          >
            <v-autocomplete
              v-model="form.id_pricing"
              :items="pricingStore.listEjecutivo"
              item-title="name"
              item-value="id_entitie"
              label="Pricing (opcional)"
              clearable
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-text-field
              v-model.number="form.bultos"
              type="number"
              min="0"
              label="Bultos (opcional)"
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-text-field
              v-model.number="form.peso"
              type="number"
              min="0"
              label="Peso en kg (opcional)"
            />
          </v-col>
          <v-col
            cols="12"
            md="4"
          >
            <v-text-field
              v-model.number="form.volumen"
              type="number"
              min="0"
              label="Volumen en m³ (opcional)"
            />
          </v-col>
          <v-col
            v-if="manualNumber"
            cols="12"
            md="6"
          >
            <v-text-field
              v-model.number="form.nro_traffic"
              type="number"
              min="1"
              step="1"
              label="Número de tráfico"
              :hint="nextCode ? `El siguiente libre es ${nextCode}.` : ''"
              persistent-hint
            />
          </v-col>
        </v-row>
        <v-alert
          v-if="problem"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-3"
          :text="problem"
        />
      </v-card-text>
      <v-card-actions class="px-6 pb-5">
        <v-spacer />
        <v-btn
          variant="text"
          @click="open = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :loading="saving"
          @click="create"
        >
          Crear pre-expediente
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
