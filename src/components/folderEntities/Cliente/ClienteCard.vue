<script setup lang="ts">
// `required` marks a section that must have at least one row before moving on.
defineProps<{ title: string; icon: string; subtitle?: string; required?: boolean }>();
</script>

<template>
  <section class="cli-card">
    <header class="cli-card__header">
      <span class="cli-card__icon">
        <v-icon
          :icon="icon"
          size="22"
        />
      </span>
      <div class="cli-card__titles">
        <h3 class="cli-card__title">
          {{ title }}<span
            v-if="required"
            class="cli-field__required"
            aria-hidden="true"
          > *</span>
        </h3>
        <p
          v-if="subtitle"
          class="cli-card__subtitle"
        >
          {{ subtitle }}
        </p>
      </div>
      <v-spacer />
      <slot name="actions" />
    </header>
    <div class="cli-card__body">
      <slot />
    </div>
  </section>
</template>
