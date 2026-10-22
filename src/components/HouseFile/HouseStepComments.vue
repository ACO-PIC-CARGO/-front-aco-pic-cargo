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
const comment = ref("");
const isPublic = ref(false);
const saving = ref(false);
const serverError = ref("");

async function add() {
  if (saving.value) return;
  saving.value = true;
  serverError.value = (await store.addComment(props.houseId, props.step.id, comment.value, isPublic.value)) ?? "";
  saving.value = false;
  if (serverError.value) return;
  comment.value = "";
  isPublic.value = false;
}
</script>

<template>
  <v-form
    class="house-step-comments"
    @submit.prevent="add"
  >
    <ul
      v-if="step.comments.length"
      class="house-step-comments__list"
    >
      <li
        v-for="item in step.comments"
        :key="item.id"
        class="house-step-comments__item"
      >
        <div class="house-step-comments__meta">
          <span
            class="aco-chip"
            :class="item.is_public ? 'aco-chip--success' : 'aco-chip--neutral'"
          >{{ item.is_public ? "Público" : "Interno" }}</span>
          <span class="aco-caption">{{ item.author ?? "Usuario" }} · {{ stepDateTimeLabel(item.created_at, timeZone) }}</span>
        </div>
        <p class="aco-body">
          {{ item.comment }}
        </p>
      </li>
    </ul>
    <p
      v-else
      class="aco-caption"
    >
      Aún no hay comentarios en este paso.
    </p>
    <v-textarea
      v-model="comment"
      label="Comentario"
      :counter="COMMENT_MAX"
      rows="2"
      auto-grow
      hide-details="auto"
    />
    <div class="house-step-comments__actions">
      <v-switch
        v-model="isPublic"
        label="Visible para el cliente"
        color="success"
        inset
        hide-details
        density="compact"
      />
      <v-btn
        color="primary"
        variant="tonal"
        :loading="saving"
        @click="add"
      >
        Agregar comentario
      </v-btn>
    </div>
    <v-alert
      v-if="serverError"
      type="warning"
      variant="tonal"
      :text="serverError"
    />
  </v-form>
</template>

<style scoped>
.house-step-comments {
  display: grid;
  gap: var(--aco-space-3);
  padding: var(--aco-space-4);
  border-radius: var(--aco-radius-control);
  background: rgb(var(--v-theme-background));
}

.house-step-comments__list {
  display: grid;
  gap: var(--aco-space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.house-step-comments__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--aco-space-2);
}

.house-step-comments__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--aco-space-3);
}
</style>
