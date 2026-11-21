<script setup lang="ts">
import { computed, ref } from "vue";
import QuoteBottomBar from "../QuoteBottomBar.vue";
import InternalCommunicationThread from "./InternalCommunicationThread.vue";

const props = withDefaults(defineProps<{ quoteId: number | null; visible?: boolean }>(), { visible: true });

const thread = ref<InstanceType<typeof InternalCommunicationThread>>();
const active = computed(() => props.visible && props.quoteId !== null);
</script>

<template>
  <QuoteBottomBar
    icon="mdi-message-text"
    :title="`Historial de comunicación interna (${thread?.count ?? 0})`"
    label="Historial de comunicación interna"
    content-id="internal-bar-content"
    :active="active"
  >
    <InternalCommunicationThread
      v-if="quoteId !== null"
      ref="thread"
      hide-header
      :quote-id="quoteId"
    />
  </QuoteBottomBar>
</template>
