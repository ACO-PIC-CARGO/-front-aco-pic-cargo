<template>
  <li class="legal-section">
    <div class="legal-section__head">
      <h2 class="legal-section__title">Sección {{ number }}</h2>
      <div class="legal-section__actions">
        <v-btn
          :id="`${value.key}-up`"
          icon
          text
          class="icon-button"
          :aria-label="`Subir la sección ${number}`"
          :disabled="index === 0"
          @click="$emit('move', -1)"
        >
          <v-icon>mdi-arrow-up</v-icon>
        </v-btn>
        <v-btn
          :id="`${value.key}-down`"
          icon
          text
          class="icon-button"
          :aria-label="`Bajar la sección ${number}`"
          :disabled="index === count - 1"
          @click="$emit('move', 1)"
        >
          <v-icon>mdi-arrow-down</v-icon>
        </v-btn>
        <v-btn
          icon
          text
          class="icon-button"
          :aria-label="`Eliminar la sección ${number}`"
          :disabled="count === 1"
          @click="$emit('remove')"
        >
          <v-icon>mdi-trash-can-outline</v-icon>
        </v-btn>
      </div>
    </div>

    <v-text-field
      :id="`${value.key}-heading`"
      :value="value.heading"
      label="Título de la sección"
      autocomplete="off"
      :maxlength="limits.heading"
      :counter="limits.heading"
      :error-messages="errors.heading"
      :aria-invalid="String(Boolean(errors.heading))"
      outlined
      dense
      @input="update('heading', $event)"
    />

    <v-textarea
      :id="`${value.key}-text`"
      :value="value.text"
      label="Texto"
      rows="6"
      auto-grow
      :hint="hint"
      persistent-hint
      :error-messages="errors.text"
      :aria-invalid="String(Boolean(errors.text))"
      outlined
      dense
      @input="update('text', $event)"
    />
  </li>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "LegalSectionEditor",
  props: {
    value: { type: Object, required: true },
    index: { type: Number, required: true },
    count: { type: Number, required: true },
    errors: { type: Object, default: () => ({ heading: "", text: "" }) },
  },
  computed: {
    ...mapGetters("legalPages", ["limits", "textLength"]),
    number() {
      return this.index + 1;
    },
    hint() {
      return `${this.textLength(this.value.text)} de ${
        this.limits.text
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
