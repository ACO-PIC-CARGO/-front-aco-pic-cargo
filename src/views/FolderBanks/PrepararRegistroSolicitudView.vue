<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";

// "REGISTRAR EN BANCO" abre esta pestaña al instante (sin about:blank ni botón cargando en el listado):
// aquí se genera el token de la solicitud y se pasa al formulario de Bancos precargado.
// Cobro: /registroCobroDesdeSolicitud/:codigo  ·  Pago: /registroPagoDesdeSolicitud/:id
const route = useRoute();
const router = useRouter();
const error = ref("");

const esCobro = route.meta.solicitud === "cobro";
const titulo = esCobro ? "Nuevo ingreso" : "Nueva salida";

async function preparar() {
  error.value = "";
  const clave = String(esCobro ? route.params.codigo : route.params.id);
  const response = await request<{ token: string }>({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + (esCobro ? "solicitud_cobro_transferir/" : "solicitud_pago_transferir/") + encodeURIComponent(clave),
  });
  const token = response.estadoflag ? response.data[0]?.token : null;
  if (!token) {
    error.value = response.mensaje || CONNECTION_ERROR_MESSAGE;
    return;
  }
  await router.replace({ name: esCobro ? "registroCobroSolicitud" : "registroPagoSolicitud", params: { token } });
}

function cerrar() {
  window.close();
}

onMounted(preparar);
</script>

<template>
  <v-container class="prep">
    <v-card
      class="prep__card"
      rounded="xl"
    >
      <template v-if="!error">
        <v-progress-circular
          indeterminate
          color="primary"
          size="48"
        />
        <h3>Preparando el registro en Bancos…</h3>
        <p>{{ titulo }} precargado con los datos de la solicitud.</p>
      </template>
      <template v-else>
        <v-icon
          size="48"
          color="warning"
        >
          mdi-alert-circle-outline
        </v-icon>
        <h3>No se pudo abrir el registro en Bancos</h3>
        <p>{{ error }}</p>
        <div class="prep__acciones">
          <v-btn
            variant="outlined"
            @click="cerrar"
          >
            Cerrar pestaña
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-refresh"
            @click="preparar"
          >
            Reintentar
          </v-btn>
        </div>
      </template>
    </v-card>
  </v-container>
</template>

<style scoped>
.prep {
  display: grid;
  min-height: 60vh;
  place-items: center;
}
.prep__card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(460px, 100%);
  padding: 32px 24px;
  text-align: center;
}
.prep__card h3 {
  margin: 4px 0 0;
  color: #0a1f44;
  font-weight: 800;
}
.prep__card p {
  margin: 0;
  color: #5b6b86;
}
.prep__acciones {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}
</style>
