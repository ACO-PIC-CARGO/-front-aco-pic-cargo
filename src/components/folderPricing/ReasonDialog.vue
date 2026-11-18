<script setup lang="ts">
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    placeholder: string;
    confirmText: string;
    canConfirm: boolean;
    sending: boolean;
    error: string | null;
    showReason?: boolean;
  }>(),
  { showReason: true },
);
const reason = defineModel<string>({ required: true });
const emit = defineEmits<{ confirm: []; close: [] }>();
</script>

<template>
  <v-dialog
    :model-value="open"
    max-width="480"
    persistent
  >
    <v-card>
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <slot />
        <v-textarea
          v-if="showReason"
          v-model="reason"
          label="Motivo"
          :placeholder="placeholder"
          variant="outlined"
          rows="4"
          auto-grow
        />
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-3"
        >
          {{ error }}
        </v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn
          variant="text"
          @click="emit('close')"
        >
          Cancelar
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!canConfirm"
          :loading="sending"
          @click="emit('confirm')"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
