<script setup lang="ts">
import { useHousesStore } from "@/stores/houses";

const housesStore = useHousesStore();
</script>

<template>
  <section
    class="aco-card house-customs"
    aria-labelledby="house-customs-title"
  >
    <h2
      id="house-customs-title"
      class="aco-title-card"
    >
      Datos de Aduana
    </h2>
    <dl class="house-customs__list">
      <div>
        <dt class="aco-caption">
          N° de declaración
        </dt>
        <dd class="aco-title-row">
          {{ housesStore.house.nro_declaracion_aduana || "—" }}
        </dd>
      </div>
      <div>
        <dt class="aco-caption">
          Canal
        </dt>
        <dd class="aco-title-row">
          {{ housesStore.house.canal_aduana || "—" }}
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.house-customs {
  padding: var(--aco-space-5);
}

.house-customs__list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--aco-space-4);
  margin: var(--aco-space-3) 0 0;
}

.house-customs__list dd {
  margin: 0;
}
</style>
