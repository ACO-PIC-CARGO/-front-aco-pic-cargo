<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { useTrackingStepCommentsStore } from "@/stores/trackingStepComments";
import { stepDateTimeLabel } from "./houseTrackingFormat";
import type { HouseTrackingStep } from "@/types/houseTracking";

const props = defineProps<{ houseId: number; step: HouseTrackingStep }>();

const store = useHouseTrackingStore();
const stepComments = useTrackingStepCommentsStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const adding = ref(false);
const loadingOptions = ref(false);
const stepCommentId = ref<number | null>(null);
const isPublic = ref(false);
const saving = ref(false);
const serverError = ref("");
const options = computed(() => stepComments.commentsOf(props.step.id));
const hasNoOptions = computed(() => !loadingOptions.value && !serverError.value && !options.value.length);

async function open() {
  adding.value = true;
  loadingOptions.value = true;
  serverError.value = (await stepComments.load(props.step.id)) ?? "";
  loadingOptions.value = false;
}

function close() {
  adding.value = false;
  stepCommentId.value = null;
  isPublic.value = false;
  serverError.value = "";
}

async function add() {
  if (saving.value || stepCommentId.value === null) return;
  saving.value = true;
  serverError.value = (await store.addComment(props.houseId, props.step.id, stepCommentId.value, isPublic.value)) ?? "";
  saving.value = false;
  if (!serverError.value) close();
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
        v-for="item in step.comments"
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
            <v-chip
              size="x-small"
              variant="tonal"
              :color="item.is_public ? 'success-ink' : 'neutral-ink'"
            >
              {{ item.is_public ? "Público" : "Interno" }}
            </v-chip>
          </div>
          <div class="text-body-medium text-break">
            {{ item.comment }}
          </div>
        </div>
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
        <v-select
          v-model="stepCommentId"
          label="Comentario"
          :items="options"
          item-title="comment"
          item-value="id"
          :loading="loadingOptions"
          density="compact"
          bg-color="surface"
          hide-details="auto"
          autofocus
        />
        <v-alert
          v-if="hasNoOptions"
          type="info"
          variant="tonal"
          density="compact"
          text="Este paso no tiene comentarios predefinidos. Agrégalos en Listado status house."
        />
        <div class="d-flex flex-wrap align-center ga-2">
          <v-switch
            v-model="isPublic"
            label="Visible para el cliente"
            color="primary"
            inset
            hide-details
            density="compact"
          />
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
            :disabled="stepCommentId === null"
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
