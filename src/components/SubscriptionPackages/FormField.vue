<template>
  <div class="field">
    <label :for="inputId" class="field__label">{{ label }}</label>
    <slot :describedby="describedBy" :invalid="Boolean(error)" />
    <p v-if="error" :id="messageId" class="field__error">{{ error }}</p>
    <p v-else-if="hint" :id="messageId" class="field__hint">{{ hint }}</p>
  </div>
</template>

<script>
export default {
  name: "FormField",
  props: {
    label: { type: String, required: true },
    inputId: { type: String, required: true },
    error: { type: String, default: "" },
    hint: { type: String, default: "" },
  },
  computed: {
    messageId() {
      return `${this.inputId}-message`;
    },
    describedBy() {
      return this.error || this.hint ? this.messageId : null;
    },
  },
};
</script>

<style scoped>
.field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--planes-text);
}

.field :where(p) {
  margin: 0;
}

.field__hint {
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--planes-text-subtle);
}

.field__error {
  font-size: 12.5px;
  line-height: 1.4;
  color: var(--planes-danger);
}
</style>
