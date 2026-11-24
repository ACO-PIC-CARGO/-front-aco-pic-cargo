<script setup lang="ts">
import { computed, ref, watch } from "vue";
import QuoteBottomBar from "../QuoteBottomBar.vue";
import InternalCommunicationThread from "./InternalCommunicationThread.vue";

const props = withDefaults(defineProps<{ quoteId: number | null; visible?: boolean }>(), { visible: true });

const TITLE = "Historial de comunicación interna";

const open = ref(false);
const thread = ref<InstanceType<typeof InternalCommunicationThread>>();
const active = computed(() => props.visible && props.quoteId !== null);
const count = computed(() => thread.value?.count ?? 0);

watch(active, (value) => {
  if (!value) open.value = false;
});
</script>

<template>
  <QuoteBottomBar
    icon="mdi-message-text"
    :title="`${TITLE} (${count})`"
    :label="TITLE"
    content-id="internal-communication-bar"
    :active="active"
    :expands="false"
    @activate="open = true"
  />
  <v-dialog
    v-if="quoteId !== null"
    v-model="open"
    max-width="960"
    scrollable
    eager
    :aria-label="TITLE"
  >
    <v-card>
      <v-card-title class="text-wrap">
        {{ TITLE }} ({{ count }})
      </v-card-title>
      <v-card-text>
        <InternalCommunicationThread
          ref="thread"
          hide-header
          :quote-id="quoteId"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="open = false"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
