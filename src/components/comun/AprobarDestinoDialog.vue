<script setup lang="ts">
// Aprobar una cotización (Pricing / Aduana): elegir a dónde va (Operaciones o Tráfico) y la opción
// aprobada por el cliente. "Continuar" solo se habilita con ambas elegidas.
import { computed } from "vue";
import { useDisplay } from "vuetify";
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

const { smAndDown } = useDisplay();

const DESTINOS: Record<SendTarget, { titulo: string; detalle: string; icono: string }> = {
  OPERATIONS: {
    titulo: "Operaciones",
    detalle: "Se genera el instructivo y el expediente operativo (master).",
    icono: "mdi-ferry",
  },
  TRAFFIC: {
    titulo: "Tráfico",
    detalle: "Queda como expediente TR- en Tráfico; luego pasa a Operaciones desde Embarques.",
    icono: "mdi-transit-connection-variant",
  },
};

const listo = computed(() => !!target.value && !!opcion.value);
const pendiente = computed(() => {
  if (!target.value && !opcion.value) return "Elige el destino y la opción aprobada para continuar.";
  if (!target.value) return "Elige a dónde envías la cotización.";
  if (!opcion.value) return "Elige la opción aprobada por el cliente.";
  return "";
});

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
    scrollable
    persistent
    :fullscreen="smAndDown"
    max-width="640"
  >
    <v-card class="apd">
      <header class="apd__head">
        <span class="apd__icon">
          <v-icon size="26">mdi-file-send-outline</v-icon>
        </span>
        <div class="apd__titles">
          <h2 class="apd__title">
            Generar instructivo<template v-if="target">
              a {{ DESTINOS[target].titulo }}
            </template>
          </h2>
          <p class="apd__subtitle">
            Cotización aprobada por el cliente
          </p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="abierto = false"
        />
      </header>

      <v-card-text class="apd__body">
        <section>
          <h3 class="apd__label">
            <span class="apd__num">1</span> ¿A dónde envías la cotización? <span class="apd__req">*</span>
          </h3>
          <div
            class="apd__destinos"
            role="radiogroup"
            aria-label="Destino de la cotización"
          >
            <button
              v-for="t in props.targets"
              :key="t"
              type="button"
              role="radio"
              :aria-checked="target === t"
              class="apd__destino"
              :class="{ 'apd__destino--on': target === t }"
              @click="target = t"
            >
              <v-icon
                size="28"
                class="apd__destinoicon"
              >
                {{ DESTINOS[t].icono }}
              </v-icon>
              <span class="apd__destinotxt">
                <b>Enviar a {{ DESTINOS[t].titulo }}</b>
                <small>{{ DESTINOS[t].detalle }}</small>
              </span>
              <v-icon
                class="apd__check"
                size="22"
              >
                {{ target === t ? "mdi-check-circle" : "mdi-circle-outline" }}
              </v-icon>
            </button>
          </div>
        </section>

        <section class="mt-5">
          <h3 class="apd__label">
            <span class="apd__num">2</span> Opción aprobada por el cliente <span class="apd__req">*</span>
          </h3>
          <p
            v-if="!props.opciones.length"
            class="apd__vacio"
          >
            No hay opciones seleccionadas en la cotización.
          </p>
          <div
            v-else
            class="apd__opciones"
            role="radiogroup"
            aria-label="Opción aprobada"
          >
            <button
              v-for="o in props.opciones"
              :key="o.value"
              type="button"
              role="radio"
              :aria-checked="opcion === o.value"
              class="apd__opcion"
              :class="{ 'apd__opcion--on': opcion === o.value }"
              @click="opcion = o.value"
            >
              <v-icon
                size="22"
                class="apd__check"
              >
                {{ opcion === o.value ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
              </v-icon>
              <span class="apd__opcionchip">{{ o.titulo }}</span>
              <span class="apd__opciondet">{{ o.detalle }}</span>
            </button>
          </div>
        </section>
      </v-card-text>

      <footer class="apd__foot">
        <p
          v-if="pendiente"
          class="apd__hint"
        >
          <v-icon size="16">
            mdi-information-outline
          </v-icon>
          {{ pendiente }}
        </p>
        <div class="apd__btns">
          <v-btn
            variant="outlined"
            class="apd__btn"
            @click="abierto = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            id="aprobar-continuar"
            variant="flat"
            color="primary"
            class="apd__btn"
            append-icon="mdi-arrow-right"
            :disabled="!listo"
            @click="continuar"
          >
            Continuar
          </v-btn>
        </div>
      </footer>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.apd {
  border-radius: 18px !important;
  color: #1f2a44;
}
.apd__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 18px 14px 22px;
  border-bottom: 1px solid #e3e8f0;
}
.apd__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #e7efff;
  color: #1d4ed8;
}
.apd__titles {
  flex: 1;
  min-width: 0;
}
.apd__title {
  margin: 0;
  color: #12306b;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.2;
}
.apd__subtitle {
  margin: 2px 0 0;
  color: #5b6b86;
  font-size: 0.85rem;
}
.apd__body {
  padding: 20px 22px !important;
}
.apd__label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 10px;
  font-size: 0.95rem;
  font-weight: 700;
}
.apd__num {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #1d4ed8;
  color: #ffffff;
  font-size: 0.75rem;
}
.apd__req {
  color: #dc2626;
}
.apd__destinos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px;
}
.apd__destino,
.apd__opcion {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border: 1.5px solid #dbe3ef;
  border-radius: 12px;
  background: #ffffff;
  text-align: left;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
}
.apd__destino:hover,
.apd__opcion:hover {
  border-color: #93b4f5;
}
.apd__destino:focus-visible,
.apd__opcion:focus-visible {
  outline: 2px solid #1d4ed8;
  outline-offset: 2px;
}
.apd__destino--on,
.apd__opcion--on {
  border-color: #1d4ed8;
  background: #f1f6ff;
  box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.12);
}
.apd__destinoicon {
  flex: 0 0 auto;
  color: #1d4ed8;
}
.apd__destinotxt {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.apd__destinotxt b {
  font-size: 0.95rem;
}
.apd__destinotxt small {
  color: #5b6b86;
  font-size: 0.78rem;
  line-height: 1.3;
}
.apd__check {
  flex: 0 0 auto;
  color: #94a3b8;
}
.apd__destino--on .apd__check,
.apd__opcion--on .apd__check {
  color: #1d4ed8;
}
.apd__opciones {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.apd__opcionchip {
  flex: 0 0 auto;
  padding: 3px 10px;
  border-radius: 999px;
  background: #e8edf6;
  color: #12306b;
  font-size: 0.8rem;
  font-weight: 800;
  white-space: nowrap;
}
.apd__opcion--on .apd__opcionchip {
  background: #1d4ed8;
  color: #ffffff;
}
.apd__opciondet {
  flex: 1;
  min-width: 0;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.apd__vacio {
  margin: 0;
  color: #b42318;
  font-size: 0.85rem;
}
.apd__foot {
  padding: 14px 22px 18px;
  border-top: 1px solid #e3e8f0;
}
.apd__hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 10px;
  color: #5b6b86;
  font-size: 0.82rem;
}
.apd__btns {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.apd__btn {
  min-width: 130px;
  border-radius: 10px !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}
@media (max-width: 600px) {
  .apd {
    border-radius: 0 !important;
  }
  .apd__btns {
    flex-direction: column-reverse;
  }
  .apd__btn {
    width: 100%;
  }
}
</style>
