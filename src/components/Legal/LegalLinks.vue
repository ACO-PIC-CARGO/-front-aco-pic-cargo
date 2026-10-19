<script setup lang="ts">
import "@/styles/plans-theme.css";

withDefaults(defineProps<{ floating?: boolean }>(), { floating: false });
</script>

<template>
  <nav
    class="legal-links plans-theme"
    :class="{ 'legal-links--floating': floating }"
    aria-label="Información legal"
  >
    <router-link :to="{ name: 'LegalTerms' }">
      Términos y condiciones
    </router-link>
    <router-link :to="{ name: 'LegalPrivacy' }">
      Política de privacidad
    </router-link>
    <router-link :to="{ name: 'LegalRefunds' }">
      Política de reembolsos
    </router-link>
  </nav>
</template>

<style scoped>
.legal-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px 20px;
  font-size: 13px;
  background: none;
}

.legal-links a {
  color: var(--planes-text-subtle);
  text-decoration: none;
}

.legal-links a:hover,
.legal-links a:focus-visible {
  color: var(--planes-accent);
  text-decoration: underline;
}

.legal-links--floating {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  width: max-content;
  max-width: calc(100% - 32px);
  padding: 8px 16px;
  border-radius: var(--planes-radius-control);
  background: var(--planes-surface-solid);
}

@media (max-width: 600px) {
  .legal-links--floating {
    position: static;
    transform: none;
    margin: 16px auto;
  }
}
</style>
