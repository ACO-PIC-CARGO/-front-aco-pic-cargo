<template>
  <li class="legal-section">
    <div class="legal-section__head">
      <h2 class="legal-section__title">Sección {{ number }}</h2>
      <div class="legal-section__actions">
        <button
          :id="`${value.key}-up`"
          type="button"
          class="icon-button"
          :aria-label="`Subir la sección ${number}`"
          :disabled="index === 0"
          @click="$emit('move', -1)"
        >
          <i class="mdi mdi-arrow-up" aria-hidden="true"></i>
        </button>
        <button
          :id="`${value.key}-down`"
          type="button"
          class="icon-button"
          :aria-label="`Bajar la sección ${number}`"
          :disabled="index === count - 1"
          @click="$emit('move', 1)"
        >
          <i class="mdi mdi-arrow-down" aria-hidden="true"></i>
        </button>
        <button
          type="button"
          class="icon-button"
          :aria-label="`Eliminar la sección ${number}`"
          :disabled="count === 1"
          @click="$emit('remove')"
        >
          <i class="mdi mdi-trash-can-outline" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <FormField
      label="Título de la sección"
      :input-id="`${value.key}-heading`"
      :error="errors.heading"
    >
      <template #default="field">
        <input
          :id="`${value.key}-heading`"
          :value="value.heading"
          class="legal-admin__input"
          type="text"
          autocomplete="off"
          :maxlength="limits.heading"
          :aria-describedby="field.describedby"
          :aria-invalid="String(field.invalid)"
          @input="update('heading', $event.target.value)"
        />
      </template>
    </FormField>

    <FormField
      label="Texto"
      :input-id="`${value.key}-text`"
      :error="errors.text"
      :hint="hint"
    >
      <template #default="field">
        <textarea
          :id="`${value.key}-text`"
          :value="value.text"
          class="legal-admin__input legal-admin__textarea"
          rows="6"
          :aria-describedby="field.describedby"
          :aria-invalid="String(field.invalid)"
          @input="update('text', $event.target.value)"
        ></textarea>
      </template>
    </FormField>
  </li>
</template>

<script>
import FormField from "@/components/SubscriptionPackages/FormField.vue";
import { LEGAL_LIMITS, textLength } from "./legalPageEditor";

export default {
  name: "LegalSectionEditor",
  components: { FormField },
  props: {
    value: { type: Object, required: true },
    index: { type: Number, required: true },
    count: { type: Number, required: true },
    errors: { type: Object, default: () => ({ heading: "", text: "" }) },
  },
  data: () => ({ limits: LEGAL_LIMITS }),
  computed: {
    number() {
      return this.index + 1;
    },
    hint() {
      return `${textLength(this.value.text)} de ${
        LEGAL_LIMITS.text
      } caracteres. Separa los párrafos con una línea en blanco.`;
    },
  },
  methods: {
    update(field, text) {
      this.$emit("input", { ...this.value, [field]: text });
    },
  },
};
</script>

<style scoped>
.legal-section {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: var(--planes-radius-card);
  border: 1px solid var(--planes-border);
}

.legal-section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.legal-section__title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.legal-section__actions {
  display: flex;
  gap: 4px;
}
</style>
