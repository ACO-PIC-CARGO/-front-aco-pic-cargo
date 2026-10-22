<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useBranchTimeZoneStore } from "@/stores/branchTimeZone";
import { useHouseTrackingStore } from "@/stores/houseTracking";
import { stepDateTimeLabel } from "./houseTrackingFormat";
import type { HouseTrackingStep } from "@/types/houseTracking";

const COMMENT_MAX = 1000;

const props = defineProps<{ houseId: number; step: HouseTrackingStep }>();

const store = useHouseTrackingStore();
const { timeZone } = storeToRefs(useBranchTimeZoneStore());
const adding = ref(false);
const comment = ref("");
const isPublic = ref(false);
const saving = ref(false);
const serverError = ref("");

function close() {
  adding.value = false;
  comment.value = "";
  isPublic.value = false;
  serverError.value = "";
}

async function add() {
  if (saving.value) return;
  saving.value = true;
  serverError.value = (await store.addComment(props.houseId, props.step.id, comment.value, isPublic.value)) ?? "";
  saving.value = false;
  if (!serverError.value) close();
}
</script>

<template>
  <v-form
    class="house-step-comments"
    @submit.prevent="add"
  >
    <div class="house-step-comments__top">
      <ul
        v-if="step.comments.length"
        class="house-step-comments__list"
      >
        <li
          v-for="item in step.comments"
          :key="item.id"
          class="house-step-comments__item"
        >
          <v-icon
            icon="mdi-comment-outline"
            size="18"
          />
          <span class="house-step-comments__when">{{ stepDateTimeLabel(item.created_at, timeZone) }}</span>
          <span class="house-step-comments__text">{{ item.comment }}</span>
          <span
            class="aco-chip"
            :class="item.is_public ? 'aco-chip--success' : 'aco-chip--neutral'"
          >{{ item.is_public ? "Público" : "Interno" }}</span>
        </li>
      </ul>
      <p
        v-else
        class="aco-caption"
      >
        Aún no hay comentarios en este paso.
      </p>
      <v-btn
        v-if="!adding"
        color="primary"
        variant="outlined"
        size="small"
        prepend-icon="mdi-plus-circle-outline"
        @click="adding = true"
      >
        Agregar comentario
      </v-btn>
    </div>
    <div
      v-if="adding"
      class="house-step-comments__form"
    >
      <v-textarea
        v-model="comment"
        label="Comentario"
        :counter="COMMENT_MAX"
        rows="2"
        auto-grow
        density="compact"
        hide-details="auto"
        autofocus
      />
      <div class="house-step-comments__actions">
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
          @click="close"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          type="submit"
          :loading="saving"
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
    </div>
  </v-form>
</template>

<style scoped>
.house-step-comments {
  display: grid;
  gap: var(--aco-space-3);
  padding: var(--aco-space-3) var(--aco-space-4);
  border-radius: var(--aco-radius-control);
  background: rgba(var(--v-theme-primary-soft), 0.55);
}

.house-step-comments__top {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--aco-space-3);
}

.house-step-comments__list {
  display: grid;
  flex: 1 1 280px;
  gap: var(--aco-space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.house-step-comments__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-2) var(--aco-space-3);
  font-size: 13px;
}

.house-step-comments__when {
  color: rgb(var(--v-theme-text-muted));
  white-space: nowrap;
}

.house-step-comments__text {
  flex: 1 1 160px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.house-step-comments__form {
  display: grid;
  gap: var(--aco-space-2);
}

.house-step-comments__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-2);
}
</style>
