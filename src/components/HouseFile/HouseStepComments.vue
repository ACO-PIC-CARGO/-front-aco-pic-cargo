<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import Swal from "sweetalert2";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { useTrackingStepCommentsStore } from "@/stores/trackingStepComments";
import SendToTrackingButton from "./SendToTrackingButton.vue";
import { commentSendState, stepDateTimeLabel } from "./houseTrackingFormat";
import type { HouseTrackingComment, HouseTrackingStep } from "@/types/houseTracking";

const COMMENT_MAX = 1000;
const COMMENT_MESSAGE = `Escribe el comentario (hasta ${COMMENT_MAX} caracteres).`;

const props = defineProps<{ houseId: number; step: HouseTrackingStep }>();

const store = useHouseTrackingStore();
const stepComments = useTrackingStepCommentsStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const adding = ref(false);
const loadingOptions = ref(false);
const comment = ref("");
const saving = ref(false);
const serverError = ref("");
const options = computed(() => stepComments.commentsOf(props.step.id));
const isValidComment = computed(() => comment.value.trim().length > 0 && comment.value.trim().length <= COMMENT_MAX);
const lengthRules = [(value: string) => value.trim().length <= COMMENT_MAX || COMMENT_MESSAGE];

async function open() {
  adding.value = true;
  loadingOptions.value = true;
  serverError.value = (await stepComments.load(props.step.id)) ?? "";
  loadingOptions.value = false;
}

function close() {
  adding.value = false;
  comment.value = "";
  serverError.value = "";
}

function appendPredefined(text: string) {
  const written = comment.value.trimEnd();
  comment.value = written ? `${written} ${text}` : text;
}

async function add() {
  if (saving.value || !isValidComment.value) return;
  saving.value = true;
  serverError.value = (await store.addComment(props.houseId, props.step.id, comment.value)) ?? "";
  saving.value = false;
  if (!serverError.value) close();
}

async function remove(item: HouseTrackingComment) {
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    titleText: "¿Eliminar este comentario?",
    text: "Si ya estaba en el tracking, tu cliente deja de verlo.",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  if (!isConfirmed) return;
  const reason = await store.deleteComment(props.houseId, item.id);
  if (reason) Swal.fire({ icon: "warning", text: reason });
}
</script>

<template>
  <v-form @submit.prevent="add">
    <v-sheet
      color="primary-soft"
      rounded="lg"
      class="d-flex flex-column ga-2 pa-3"
    >
      <div
        v-for="(item, index) in step.comments"
        :key="item.id"
        class="d-flex align-start ga-2"
      >
        <v-icon
          icon="mdi-comment-outline"
          size="16"
          class="mt-1"
        />
        <div class="flex-grow-1">
          <div class="d-flex flex-wrap align-center ga-2 text-body-small text-medium-emphasis">
            {{ stepDateTimeLabel(item.created_at, timeZone) }} · {{ item.author ?? "Usuario" }}
            <SendToTrackingButton
              :state="commentSendState(step, item)"
              :sent-at="item.sent_at"
              blocked-hint="Primero envía el paso al tracking."
              confirm-text="¿Enviar este comentario al tracking del cliente?"
              :send="() => store.sendComment(houseId, item.id)"
              withdraw-confirm-text="¿Retirar este comentario del tracking del cliente?"
              :withdraw="() => store.withdrawComment(houseId, item.id)"
            />
          </div>
          <div class="text-body-medium text-break">
            {{ item.comment }}
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          size="x-small"
          :aria-label="`Eliminar comentario ${index + 1}`"
          @click="remove(item)"
        >
          <v-icon icon="mdi-delete-outline" />
          <v-tooltip
            activator="parent"
            location="top"
          >
            Eliminar comentario
          </v-tooltip>
        </v-btn>
      </div>
      <p
        v-if="!step.comments.length"
        class="text-body-small text-medium-emphasis"
      >
        Aún no hay comentarios en este paso.
      </p>
      <div
        v-if="!adding"
        class="d-flex justify-end"
      >
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          prepend-icon="mdi-plus-circle-outline"
          class="text-none"
          @click="open"
        >
          Agregar comentario
        </v-btn>
      </div>
      <template v-else>
        <v-progress-linear
          v-if="loadingOptions"
          indeterminate
          color="primary"
          aria-label="Cargando comentarios predefinidos"
        />
        <div
          v-else-if="options.length"
          class="d-flex flex-column ga-1"
        >
          <span class="text-body-small text-medium-emphasis">Toca un comentario predefinido para agregarlo al texto.</span>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="option in options"
              :key="option.id"
              size="small"
              variant="outlined"
              color="primary"
              prepend-icon="mdi-plus"
              @click="appendPredefined(option.comment)"
            >
              {{ option.comment }}
            </v-chip>
          </div>
        </div>
        <p
          v-else-if="!serverError"
          class="text-body-small text-medium-emphasis"
        >
          Este paso no tiene comentarios predefinidos. Agrégalos en «Estatus del tracking».
        </p>
        <v-textarea
          v-model="comment"
          label="Comentario"
          :counter="COMMENT_MAX"
          :rules="lengthRules"
          rows="2"
          auto-grow
          density="compact"
          bg-color="surface"
          hide-details="auto"
          autofocus
        />
        <div class="d-flex flex-wrap align-center ga-2">
          <v-spacer />
          <v-btn
            variant="text"
            size="small"
            class="text-none"
            @click="close"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            size="small"
            type="submit"
            class="text-none"
            :loading="saving"
            :disabled="!isValidComment"
          >
            Guardar
          </v-btn>
        </div>
        <v-alert
          v-if="serverError"
          type="warning"
          variant="tonal"
          density="compact"
          :text="serverError"
        />
      </template>
    </v-sheet>
  </v-form>
</template>
