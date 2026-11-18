<script setup lang="ts">
import { computed } from "vue";
import type { MessageDirection } from "./InternalCommunication/messageLabel";
import { lastCommentParts, lastCommentPillStyle } from "./quoteListActions";

const props = defineProps<{
  direction: MessageDirection | null | undefined;
  body: string | null | undefined;
  priorityColor: string | null | undefined;
}>();

const parts = computed(() => lastCommentParts(props.direction, props.body));
const style = computed(() => lastCommentPillStyle(props.priorityColor) ?? undefined);
</script>

<template>
  <span
    v-if="parts"
    class="last-comment-pill"
    :style="style"
  >
    <strong>{{ parts.label }}:</strong>
    {{ parts.body }}
  </span>
</template>

<style scoped>
.last-comment-pill {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8125rem;
}
</style>
