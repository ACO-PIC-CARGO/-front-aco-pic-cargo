<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { useTrackingStepCommentsStore } from "@/stores/trackingStepComments";
import type { TrackingStep, TrackingStepComment } from "@/types/trackingCatalog";

const COMMENT_MAX = 1000;
const COMMENT_MESSAGE = `Escribe el comentario (hasta ${COMMENT_MAX} caracteres).`;

const props = defineProps<{ step: TrackingStep }>();

const store = useTrackingStepCommentsStore();
const loading = ref(false);
const saving = ref(false);
const serverError = ref("");
const newComment = ref("");
const editingId = ref<number | null>(null);
const editingText = ref("");
const comments = computed(() => store.commentsOf(props.step.id));
const isValidComment = (value: string) => value.trim().length > 0 && value.trim().length <= COMMENT_MAX;
const lengthRules = [(value: string) => value.trim().length <= COMMENT_MAX || COMMENT_MESSAGE];

function cancelEdit() {
  editingId.value = null;
  editingText.value = "";
}

function startEdit(item: TrackingStepComment) {
  editingId.value = item.id;
  editingText.value = item.comment;
  serverError.value = "";
}

onMounted(async () => {
  loading.value = true;
  serverError.value = (await store.load(props.step.id)) ?? "";
  loading.value = false;
});

async function run(change: (stepId: number) => Promise<string | null>): Promise<boolean> {
  if (saving.value) return false;
  saving.value = true;
  serverError.value = (await change(props.step.id)) ?? "";
  saving.value = false;
  return !serverError.value;
}

async function add() {
  if (!isValidComment(newComment.value)) return;
  if (await run((stepId) => store.create(stepId, newComment.value))) newComment.value = "";
}

async function saveEdit() {
  const id = editingId.value;
  if (id === null || !isValidComment(editingText.value)) return;
  if (await run((stepId) => store.update(stepId, id, editingText.value))) cancelEdit();
}

async function remove(item: TrackingStepComment) {
  const { isConfirmed } = await Swal.fire({
    icon: "warning",
    title: "¿Eliminar este comentario predefinido?",
    text: "Ya no aparecerá al comentar un house. Los comentarios que ya se guardaron no cambian.",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
  });
  if (isConfirmed) await run((stepId) => store.remove(stepId, item.id));
}
</script>

<template>
  <div class="step-comments">
    <p class="aco-caption mb-4">
      Tu equipo elegirá uno de estos comentarios al comentar este paso en un house.
    </p>
    <v-skeleton-loader
      v-if="loading"
      type="list-item@3"
      aria-busy="true"
    />
    <p
      v-else-if="!comments.length && !serverError"
      class="aco-body step-comments__empty"
    >
      Este paso aún no tiene comentarios predefinidos. Escribe el primero abajo.
    </p>
    <ol
      v-else
      class="step-comments__list"
    >
      <li
        v-for="(item, index) in comments"
        :key="item.id"
        class="step-comments__item"
      >
        <v-form
          v-if="editingId === item.id"
          class="step-comments__row"
          @submit.prevent="saveEdit"
        >
          <v-text-field
            v-model="editingText"
            label="Comentario"
            :counter="COMMENT_MAX"
            :rules="lengthRules"
            density="compact"
            autofocus
          />
          <v-btn
            icon
            variant="text"
            type="submit"
            aria-label="Guardar comentario"
            :loading="saving"
            :disabled="!isValidComment(editingText)"
          >
            <v-icon icon="mdi-check" />
          </v-btn>
          <v-btn
            icon
            variant="text"
            aria-label="Cancelar edición"
            @click="cancelEdit"
          >
            <v-icon icon="mdi-close" />
          </v-btn>
        </v-form>
        <div
          v-else
          class="step-comments__row"
        >
          <span class="aco-body step-comments__text">{{ item.comment }}</span>
          <v-btn
            icon
            variant="text"
            :aria-label="`Editar comentario ${index + 1}`"
            @click="startEdit(item)"
          >
            <v-icon icon="mdi-pencil-outline" />
            <v-tooltip
              activator="parent"
              location="top"
            >
              Editar comentario
            </v-tooltip>
          </v-btn>
          <v-btn
            icon
            variant="text"
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
      </li>
    </ol>
    <v-form
      class="step-comments__row mt-4"
      @submit.prevent="add"
    >
      <v-text-field
        v-model="newComment"
        label="Nuevo comentario"
        :counter="COMMENT_MAX"
        :rules="lengthRules"
        density="compact"
      />
      <v-btn
        color="primary"
        variant="tonal"
        type="submit"
        prepend-icon="mdi-plus"
        :loading="saving && editingId === null"
        :disabled="!isValidComment(newComment)"
      >
        Agregar
      </v-btn>
    </v-form>
    <v-alert
      v-if="serverError"
      type="warning"
      variant="tonal"
      class="mt-4"
      :text="serverError"
    />
  </div>
</template>

<style scoped>
.step-comments {
  margin-bottom: var(--aco-space-3);
  padding: var(--aco-space-4);
  border-radius: var(--aco-radius-control);
  background: rgb(var(--v-theme-background));
}

.step-comments__list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.step-comments__item {
  padding: var(--aco-space-2) 0;
  border-top: 1px solid rgb(var(--v-theme-border));
}

.step-comments__row {
  display: flex;
  align-items: flex-start;
  gap: var(--aco-space-2);
}

.step-comments__text {
  flex: 1 1 auto;
  min-width: 0;
  padding-top: var(--aco-space-2);
  overflow-wrap: anywhere;
}

.step-comments__empty {
  padding: var(--aco-space-4);
  border-radius: var(--aco-radius-control);
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-text-muted));
}
</style>
