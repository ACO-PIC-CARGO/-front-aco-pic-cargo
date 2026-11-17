<script setup lang="ts">
import { computed, ref, watch } from "vue";
import moment from "moment";
import Swal from "sweetalert2";
import { useDisplay } from "vuetify";
import { request, notifySuccess } from "@/utils/request";
import { shortDate } from "@/utils/dates";

export interface SesionActiva {
  codigo: string;
  dispositivo: string | null;
  ip: string | null;
  created_at: string;
  ultimo_uso: string;
  expira_at: string;
  recordarflag: boolean;
  actualflag: boolean;
  id_branch: number | null;
  sucursal: string | null;
}

const abierto = defineModel<boolean>({ default: false });
const { xs } = useDisplay();

const sesiones = ref<SesionActiva[]>([]);
const cargando = ref(false);
const cerrando = ref<string | null>(null);
const error = ref("");

const otras = computed(() => sesiones.value.filter((sesion) => !sesion.actualflag));

const iconoDispositivo = (dispositivo: string | null) => {
  if (/iPhone|Android/.test(dispositivo ?? "")) return "mdi-cellphone";
  if (/iPad/.test(dispositivo ?? "")) return "mdi-tablet";
  return "mdi-laptop";
};

// Mismo formato de fecha que FormatFecha (DD/MMM/YYYY) más la hora.
const fechaHora = (valor: string) => `${shortDate(valor)} ${moment(valor).format("HH:mm")}`;
const haceCuanto = (valor: string) => moment(valor).locale("es").fromNow();

async function cargar() {
  cargando.value = true;
  error.value = "";
  const res = await request<SesionActiva>({ method: "get", url: import.meta.env.VITE_URL_MAIN + "auth/sesiones" });
  if (res.estadoflag) sesiones.value = res.data;
  else error.value = res.mensaje ?? "No pudimos cargar tus sesiones.";
  cargando.value = false;
}

async function cerrar(codigo: string | null) {
  const todas = codigo === null;
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: todas ? "¿Cerrar todas las demás sesiones?" : "¿Cerrar esta sesión?",
    text: todas
      ? "Se cerrará la sesión en todos los demás dispositivos. Este dispositivo seguirá conectado."
      : "Ese dispositivo tendrá que volver a iniciar sesión.",
    showCancelButton: true,
    confirmButtonText: "Sí, cerrar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d32f2f",
  });
  if (!isConfirmed) return;

  cerrando.value = codigo ?? "todas";
  const res = await request<string>({
    method: "post",
    url: import.meta.env.VITE_URL_MAIN + "auth/sesiones/revocar",
    data: { codigo },
  });
  cerrando.value = null;
  if (res.estadoflag) notifySuccess(res.mensaje ?? "Sesión cerrada");
  else Swal.fire({ icon: "warning", text: res.mensaje });
  await cargar();
}

watch(abierto, (valor) => valor && cargar(), { immediate: true });
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="640"
    :fullscreen="xs"
    scrollable
  >
    <v-card class="sesiones-card">
      <div class="sesiones-card__head">
        <div class="sesiones-card__icon">
          <v-icon size="30">
            mdi-devices
          </v-icon>
        </div>
        <div class="sesiones-card__titles">
          <h2>Sesiones activas</h2>
          <p>Navegadores donde tu cuenta tiene la sesión iniciada y su sucursal.</p>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          aria-label="Cerrar"
          @click="abierto = false"
        />
      </div>

      <v-divider />

      <v-card-text class="sesiones-card__body">
        <v-progress-linear
          v-if="cargando && !sesiones.length"
          indeterminate
          color="#0b4fbf"
        />
        <v-alert
          v-else-if="error"
          type="warning"
          variant="tonal"
          :text="error"
        />
        <p
          v-else-if="!sesiones.length"
          class="sesiones-card__empty"
        >
          No hay sesiones activas.
        </p>

        <div
          v-for="sesion in sesiones"
          :key="sesion.codigo"
          class="sesion-item"
          :class="{ 'sesion-item--actual': sesion.actualflag }"
        >
          <div class="sesion-item__icon">
            <v-icon>{{ iconoDispositivo(sesion.dispositivo) }}</v-icon>
          </div>
          <div class="sesion-item__info">
            <div class="sesion-item__title">
              {{ sesion.dispositivo || "Dispositivo desconocido" }}
              <v-chip
                v-if="sesion.actualflag"
                size="x-small"
                color="success"
                variant="flat"
              >
                Este dispositivo
              </v-chip>
            </div>
            <div
              v-if="sesion.sucursal"
              class="sesion-item__branch"
            >
              <v-icon size="14">
                mdi-store-outline
              </v-icon>
              {{ sesion.sucursal }}
            </div>
            <div class="sesion-item__meta">
              <span v-if="sesion.ip">{{ sesion.ip }} · </span>
              <span>{{ sesion.actualflag ? "Activa ahora" : `Activa ${haceCuanto(sesion.ultimo_uso)}` }}</span>
            </div>
            <div class="sesion-item__meta">
              Inició: {{ fechaHora(sesion.created_at) }}
              <span v-if="sesion.recordarflag"> · Recordada hasta {{ shortDate(sesion.expira_at) }}</span>
            </div>
          </div>
          <v-btn
            v-if="!sesion.actualflag"
            class="sesion-item__action"
            color="error"
            variant="text"
            size="small"
            prepend-icon="mdi-logout"
            :loading="cerrando === sesion.codigo"
            @click="cerrar(sesion.codigo)"
          >
            Cerrar
          </v-btn>
        </div>
      </v-card-text>

      <v-divider />

      <v-card-actions class="sesiones-card__actions">
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-logout-variant"
          :disabled="!otras.length"
          :loading="cerrando === 'todas'"
          :block="xs"
          @click="cerrar(null)"
        >
          Cerrar todas las demás
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.sesiones-card.v-card {
  border-radius: 20px !important;
  color: #0a1f44;
}
.sesiones-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 16px 14px 20px;
}
.sesiones-card__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #d6e8fd;
  color: #0b4fbf;
}
.sesiones-card__titles {
  flex: 1 1 auto;
  min-width: 0;
}
.sesiones-card__titles h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
}
.sesiones-card__titles p {
  margin: 2px 0 0;
  font-size: 0.9rem;
  color: #3b4a63;
}
.sesiones-card__body {
  padding: 12px 16px !important;
}
.sesiones-card__empty {
  padding: 24px 0;
  text-align: center;
  color: #3b4a63;
}
.sesion-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid #dbe6f5;
  border-radius: 14px;
}
.sesion-item + .sesion-item {
  margin-top: 10px;
}
.sesion-item--actual {
  border-color: #9cc4f5;
  background: #f3f8ff;
}
.sesion-item__icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eef4fc;
  color: #0b4fbf;
}
.sesion-item__info {
  flex: 1 1 auto;
  min-width: 0;
}
.sesion-item__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.sesion-item__branch {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #0b4fbf;
}
.sesion-item__meta {
  font-size: 0.82rem;
  color: #5a6880;
  overflow-wrap: anywhere;
}
.sesiones-card__actions {
  justify-content: flex-end;
  padding: 12px 16px !important;
}

/* Móvil: el diálogo ocupa la pantalla y el botón de cada sesión baja bajo el texto. */
@media (max-width: 599px) {
  .sesiones-card.v-card {
    border-radius: 0 !important;
  }
  .sesion-item {
    flex-wrap: wrap;
  }
  .sesion-item__action {
    margin-left: 56px;
  }
}
</style>
