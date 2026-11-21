<script setup lang="ts">
// Aprobar una cotización (Pricing / Aduana): elegir a dónde va (Operaciones o Tráfico) y la opción
// aprobada por el cliente. "Continuar" solo se habilita con ambas elegidas.
import { computed } from "vue";
import type { SendTarget } from "@/utils/trafficSend";

export interface OpcionAprobable {
  value: number | string;
  titulo: string;
  detalle?: string;
}

const props = defineProps<{
  targets: SendTarget[];
  opciones: OpcionAprobable[];
}>();
const abierto = defineModel<boolean>({ required: true });
const target = defineModel<SendTarget | null>("target", { required: true });
const opcion = defineModel<number | string>("opcion", { required: true });
const emit = defineEmits<{ continuar: [] }>();

const DESTINOS: Record<SendTarget, { titulo: string; icono: string }> = {
  OPERATIONS: { titulo: "Enviar a Operaciones", icono: "mdi-layers-outline" },
  TRAFFIC: { titulo: "Enviar a Tráfico", icono: "mdi-truck-outline" },
};

const itemsDestino = computed(() =>
  props.targets.map((t) => ({ value: t, title: DESTINOS[t].titulo, icono: DESTINOS[t].icono })),
);
const itemsOpcion = computed(() =>
  props.opciones.map((o) => ({ value: o.value, title: [o.titulo, o.detalle].filter(Boolean).join(" – ") })),
);

const listo = computed(() => !!target.value && !!opcion.value);

// mismo contrato que un v-form: el flujo de aprobación valida antes de seguir
async function validate() {
  return { valid: listo.value };
}
defineExpose({ validate });

function continuar() {
  if (listo.value) emit("continuar");
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    eager
    persistent
    max-width="760"
  >
    <v-card class="apd">
      <header class="apd__head">
        <v-icon
          size="40"
          class="apd__icon"
        >
          mdi-file-document-edit-outline
        </v-icon>
        <div class="apd__titles">
          <h2 class="apd__title">
            Generar Instructivo
          </h2>
          <p class="apd__subtitle">
            Selecciona a dónde enviar la cotización y la opción aprobada por el cliente.
          </p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          aria-label="Cerrar"
          @click="abierto = false"
        />
      </header>

      <div class="apd__body">
        <div class="apd__row">
          <label class="apd__label">
            <v-icon size="26">mdi-send-outline</v-icon>
            ¿A dónde envías la cotización?
          </label>
          <v-select
            id="aprobar-destino"
            v-model="target"
            :items="itemsDestino"
            placeholder="Selecciona el destino"
            variant="outlined"
            density="comfortable"
            hide-details
            class="apd__select"
          >
            <template #selection="{ item }">
              <v-icon
                size="22"
                class="mr-3"
              >
                {{ DESTINOS[item.value as SendTarget]?.icono }}
              </v-icon>
              {{ item.title }}
            </template>
            <template #item="{ props: p, item }">
              <v-list-item
                v-bind="p"
                :prepend-icon="DESTINOS[item.value as SendTarget]?.icono"
              />
            </template>
          </v-select>
        </div>

        <div class="apd__row">
          <label class="apd__label">
            <v-icon size="26">mdi-layers-outline</v-icon>
            Opción aprobada por el cliente
          </label>
          <v-select
            id="aprobar-opcion"
            v-model="opcion"
            :items="itemsOpcion"
            :placeholder="itemsOpcion.length ? 'Selecciona la opción' : 'No hay opciones seleccionadas'"
            :disabled="!itemsOpcion.length"
            variant="outlined"
            density="comfortable"
            hide-details
            class="apd__select"
          />
        </div>
      </div>

      <footer class="apd__foot">
        <v-btn
          variant="flat"
          class="apd__btn apd__btn--cancel"
          @click="abierto = false"
        >
          Cancelar
        </v-btn>
        <v-btn
          id="aprobar-continuar"
          variant="flat"
          class="apd__btn apd__btn--ok"
          prepend-icon="mdi-send"
          :disabled="!listo"
          @click="continuar"
        >
          Continuar
        </v-btn>
      </footer>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.apd {
  border-radius: 18px !important;
  color: #0f1e3d;
}
.apd__head {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 26px 22px 10px 28px;
}
.apd__icon {
  flex: 0 0 auto;
  color: #334155;
}
.apd__titles {
  flex: 1;
  min-width: 0;
}
.apd__title {
  margin: 0;
  color: #0f1e3d;
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1.2;
}
.apd__subtitle {
  margin: 4px 0 0;
  color: #5b6b86;
  font-size: 0.95rem;
}
.apd__body {
  padding: 8px 28px 0;
}
.apd__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
  align-items: center;
  gap: 20px;
  padding: 18px 0;
  border-bottom: 1px solid #e5e9f0;
}
.apd__label {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 1rem;
  font-weight: 700;
}
.apd__label .v-icon {
  color: #334155;
}
.apd__select :deep(.v-field) {
  border-radius: 10px;
}
.apd__foot {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  padding: 22px 28px 24px;
}
.apd__btn {
  min-width: 150px;
  height: 46px !important;
  border-radius: 10px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}
.apd__btn--cancel {
  border: 1px solid #d5dbe5;
  background: #f3f5f9 !important;
  color: #0f1e3d !important;
}
.apd__btn--ok {
  background: #0f1e3d !important;
  color: #ffffff !important;
}
@media (max-width: 600px) {
  .apd__head {
    padding: 18px 12px 6px 16px;
  }
  .apd__title {
    font-size: 1.3rem;
  }
  .apd__body {
    padding: 0 16px;
  }
  .apd__row {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .apd__foot {
    flex-direction: column-reverse;
    padding: 18px 16px;
  }
  .apd__btn {
    width: 100%;
  }
}
</style>
