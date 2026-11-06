<script setup lang="ts">
import { onMounted, ref, shallowRef } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import FileSequenceInstructivo from "@/components/comun/FileSequenceInstructivo.vue";
import { usePricingStore } from "@/stores/pricing";
import { useTrafficStore } from "@/stores/traffic";
import type { QuoteKind, TrafficMasterOption } from "@/types/traffic";
import { generateIdempotencyKey } from "@/utils/idempotencia";
import { masterChoiceProblem } from "@/utils/trafficSend";

interface TrafficFileToSend {
  id_traffic: number;
  code_traffic: string;
  id_house: number;
  quote_kind: QuoteKind | null;
  id_quote: number | null;
}

const props = defineProps<{ file: TrafficFileToSend }>();
const emit = defineEmits<{ close: []; sent: [] }>();

const router = useRouter();
const pricingStore = usePricingStore();
const trafficStore = useTrafficStore();
const firstStep = () => {
  if (props.file.id_quote === null) return "confirm";
  return props.file.quote_kind === "PRICING" ? "loading" : "master";
};
const step = shallowRef<"confirm" | "loading" | "instructivo" | "master">(firstStep());
const isNew = shallowRef(true);
const availability = shallowRef("");
const masterId = shallowRef<number | null>(null);
const masters = ref<TrafficMasterOption[]>([]);
const problem = shallowRef("");
const sending = shallowRef(false);
let idempotencyKey = generateIdempotencyKey();

const today = () => new Date().toLocaleDateString("en-CA");

async function openInstructivo() {
  const failure = await pricingStore.getQuote({ id: String(props.file.id_quote) });
  if (failure) {
    Swal.fire({ icon: "error", title: "No se pudo abrir el instructivo", text: failure });
    emit("close");
    return;
  }
  step.value = "instructivo";
}

async function send() {
  problem.value = masterChoiceProblem(
    { isNew: isNew.value, availability: availability.value, masterId: masterId.value },
    today(),
  );
  if (problem.value) return;

  sending.value = true;
  const answer = await trafficStore.sendToOperations(
    props.file.id_traffic,
    {
      nuevoexpediente: isNew.value,
      id_exp: isNew.value ? null : masterId.value,
      fecha_validez: isNew.value ? availability.value : null,
    },
    idempotencyKey,
  );
  sending.value = false;
  if (!answer.estadoflag) {
    idempotencyKey = generateIdempotencyKey();
    problem.value = answer.mensaje;
    return;
  }

  emit("sent");
  const choice = await Swal.fire({
    icon: "success",
    title: "Enviado a Operaciones",
    text: answer.mensaje,
    confirmButtonText: "Ver house",
    showCancelButton: true,
    cancelButtonText: "Quedarme en Tráfico",
  });
  if (choice.isConfirmed) router.push({ name: "controlHouseVer", params: { id: props.file.id_house } });
}

async function confirmWithoutQuote() {
  const choice = await Swal.fire({
    icon: "question",
    title: "¿Enviar sin cotización?",
    text:
      "Este expediente no tiene cotización. Se enviará a Operaciones con los datos del expediente (cliente, ruta y carga), " +
      "sin instructivo ni costos de una cotización. Después puedes asociarle una cotización desde el house y completar su instructivo.",
    confirmButtonText: "Enviar sin cotización",
    showCancelButton: true,
    cancelButtonText: "Cancelar",
  });
  if (!choice.isConfirmed) {
    emit("close");
    return;
  }
  step.value = "master";
}

onMounted(async () => {
  const loadingMasters = trafficStore.mastersFor(props.file.id_traffic);
  if (step.value === "confirm") await confirmWithoutQuote();
  if (step.value === "loading") await openInstructivo();
  masters.value = await loadingMasters;
});
</script>

<template>
  <v-dialog
    v-if="step === 'loading'"
    :model-value="true"
    max-width="360"
    persistent
  >
    <v-card>
      <v-card-text class="d-flex align-center ga-3">
        <v-progress-circular
          indeterminate
          size="24"
        />
        Cargando el instructivo de {{ file.code_traffic }}…
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog
    v-else-if="step === 'instructivo'"
    :model-value="true"
    fullscreen
    persistent
  >
    <v-card>
      <v-toolbar
        color="primary"
        :title="`Instructivo Tráfico → Operaciones · ${file.code_traffic}`"
      />
      <v-card-text class="pa-0">
        <!-- Own form, so a read-only host form (the house screen) cannot make these fields read-only. -->
        <v-form>
          <FileSequenceInstructivo
            :quote-id="file.id_quote ?? undefined"
            :aprobadoflag="false"
            destino="OPERATIONS"
            @continuar="step = 'master'"
            @cerrar-dialogo="emit('close')"
          />
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog
    v-else
    :model-value="true"
    max-width="520"
    persistent
  >
    <v-card :title="`Enviar ${file.code_traffic} a Operaciones`">
      <v-card-text>
        <v-form>
          <v-radio-group
            v-model="isNew"
            hide-details
          >
            <v-radio
              :value="true"
              label="Crear un master nuevo"
            />
            <v-radio
              :value="false"
              label="Enlazar a un master existente"
            />
          </v-radio-group>
          <v-text-field
            v-if="isNew"
            id="traffic-master-availability"
            v-model="availability"
            type="date"
            class="mt-4"
            label="Fecha de disponibilidad del master"
            hint="Si es importación, la ETA; si es exportación, la ETD."
            persistent-hint
          />
          <v-autocomplete
            v-else
            id="traffic-master"
            v-model="masterId"
            :items="masters"
            item-title="code_master"
            item-value="id"
            class="mt-4"
            label="Master"
            no-data-text="No hay masters de tu empresa con la misma ruta. Crea uno nuevo."
          />
        </v-form>
        <v-alert
          v-if="problem"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          {{ problem }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="emit('close')">
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          :loading="sending"
          @click="send"
        >
          Enviar a Operaciones
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
