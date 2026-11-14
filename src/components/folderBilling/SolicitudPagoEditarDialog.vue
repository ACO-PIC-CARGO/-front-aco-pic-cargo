<script setup lang="ts">
// Editar una solicitud de pago desde los listados (Bancos > Solicitudes de Pago y Pagos Pendientes).
// Al guardar se vuelve a enviar: aprobaciones y soporte de pago desde cero (lo hace la BD).
import { computed, ref, watch } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import axios from "@/api/http";
import type { AdminCredentials } from "@/types/seguridad";
import type { CuentaBancariaProveedor, TipoPagoSolicitud } from "@/types/billingEntries";
import type { SolicitudPagoAccion } from "@/composables/useAccionesSolicitudPago";
import { tieneAprobacionesSolicitud } from "@/composables/useAccionesSolicitudPago";
import { withAuthorization } from "@/utils/adminCredentials";
import { sessionBranchId } from "@/utils/sesion";
import { CONNECTION_ERROR_MESSAGE, notifySuccess, request } from "@/utils/request";

const props = defineProps<{
  modelValue: boolean;
  solicitud: SolicitudPagoAccion | null;
  admin?: AdminCredentials | null;
}>();
const emit = defineEmits<{ "update:modelValue": [valor: boolean]; guardado: [] }>();

const DATO_REQUERIDO = "Dato Requerido";
const { smAndDown } = useDisplay();
const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});

const tipos = ref<TipoPagoSolicitud[]>([]);
const cuentas = ref<CuentaBancariaProveedor[]>([]);
const cargando = ref(false);
const guardando = ref(false);
const form = ref({ id_tipopago: null as number | null, id_cuenta: null as number | null, codigopago: "", comentario: "" });

const codigoTipo = computed(() => tipos.value.find((t) => t.id === form.value.id_tipopago)?.codigo);
const esCodigo = computed(() => codigoTipo.value === "02");
const itemsCuentas = computed(() =>
  cuentas.value.map((c) => ({
    title: `${c.namebanks ?? ""} · ${c.namecoins ?? ""} · ${c.accountnumber ?? ""}${c.beneficiario ? " · " + c.beneficiario : ""}`,
    value: c.id,
  })),
);
const valida = computed(() => !!form.value.id_tipopago && (esCodigo.value ? !!form.value.codigopago.trim() : !!form.value.id_cuenta));

async function cargarDatos(s: SolicitudPagoAccion) {
  cargando.value = true;
  const [respTipos, respCuentas] = await Promise.all([
    tipos.value.length
      ? null
      : request<TipoPagoSolicitud>({ method: "get", url: import.meta.env.VITE_URL_MAIN + "cargar_master_detalle_tipo_pago_solicitud" }),
    axios({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + "getAccountsNumber/" + s.id_proveedor,
      data: { id_branch: sessionBranchId() },
    }).then((r) => (r.data?.data ?? []) as CuentaBancariaProveedor[]).catch(() => [] as CuentaBancariaProveedor[]),
  ]);
  if (respTipos) tipos.value = respTipos.estadoflag ? respTipos.data : [];
  cuentas.value = respCuentas;
  // se precarga lo que tiene la solicitud (tipo por código y cuenta por número)
  form.value = {
    id_tipopago: tipos.value.find((t) => t.codigo === s.codigo_tipopago)?.id ?? tipos.value[0]?.id ?? null,
    id_cuenta: cuentas.value.find((c) => c.accountnumber && c.accountnumber === s.nrocuenta)?.id ?? null,
    codigopago: s.codigopago ?? "",
    comentario: s.comentario ?? "",
  };
  cargando.value = false;
}

watch(
  () => [props.modelValue, props.solicitud] as const,
  ([visible, s]) => {
    if (visible && s) cargarDatos(s);
  },
);

async function guardar() {
  const s = props.solicitud;
  if (!s || !valida.value) return;
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    html:
      `¿Guardar los cambios y volver a enviar la solicitud de pago N° <b>${s.id}</b>?` +
      (tieneAprobacionesSolicitud(s) ? "<br><br>Las aprobaciones y el soporte de pago se reiniciarán." : ""),
    showCancelButton: true,
    confirmButtonText: "Sí, guardar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#1e5bd8",
  });
  if (!isConfirmed) return;
  guardando.value = true;
  const response = await request({
    method: "put",
    url: import.meta.env.VITE_URL_MAIN + "solicitud_pago_editar/" + s.id,
    data: {
      id_tipopago: form.value.id_tipopago,
      id_cuenta: esCodigo.value ? null : form.value.id_cuenta,
      codigopago: esCodigo.value ? form.value.codigopago : null,
      comentario: form.value.comentario,
      ...withAuthorization(props.admin),
    },
  });
  guardando.value = false;
  if (!response.estadoflag) {
    Swal.fire({ icon: "warning", text: response.mensaje || CONNECTION_ERROR_MESSAGE });
    return;
  }
  notifySuccess(response.mensaje);
  abierto.value = false;
  emit("guardado");
}
</script>

<template>
  <v-dialog
    v-model="abierto"
    max-width="620"
    :fullscreen="smAndDown"
    persistent
    scrollable
  >
    <v-card
      v-if="solicitud"
      class="soledit"
    >
      <div class="soledit__head">
        <div class="soledit__icon">
          <v-icon size="30">
            mdi-pencil-outline
          </v-icon>
        </div>
        <div class="soledit__titles">
          <h3>EDITAR SOLICITUD DE PAGO N° {{ solicitud.id }}</h3>
          <span>AL GUARDAR SE VUELVE A ENVIAR A ADMINISTRACIÓN.</span>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          aria-label="Cerrar"
          :disabled="guardando"
          @click="abierto = false"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="soledit__body">
        <v-progress-linear
          v-if="cargando"
          indeterminate
          color="primary"
          class="mb-2"
        />
        <div class="soledit__prov">
          <div>
            <span class="soledit__label-sm">PROVEEDOR</span>
            <b>{{ solicitud.proveedor }}</b>
          </div>
          <div class="text-right">
            <span class="soledit__label-sm">MONTO</span>
            <b>{{ Number(solicitud.monto || 0).toFixed(2) }} {{ solicitud.moneda }}</b>
          </div>
        </div>

        <span class="soledit__label">TIPO DE PAGO <span class="soledit__req">*</span></span>
        <div class="soledit__tipos">
          <button
            v-for="t in tipos"
            :key="t.id"
            type="button"
            class="soledit__tipo"
            :class="{ 'soledit__tipo--active': form.id_tipopago === t.id }"
            @click="form.id_tipopago = t.id"
          >
            <v-icon :color="form.id_tipopago === t.id ? 'primary' : 'grey'">
              {{ form.id_tipopago === t.id ? "mdi-radiobox-marked" : "mdi-radiobox-blank" }}
            </v-icon>
            <v-icon color="primary">
              {{ t.codigo === "01" ? "mdi-bank-transfer" : "mdi-barcode" }}
            </v-icon>
            {{ t.descripcion }}
          </button>
        </div>

        <template v-if="!esCodigo">
          <label
            class="soledit__label"
            for="soledit-cuenta"
          >CUENTA BANCARIA DEL PROVEEDOR <span class="soledit__req">*</span></label>
          <v-select
            id="soledit-cuenta"
            v-model="form.id_cuenta"
            :items="itemsCuentas"
            placeholder="Selecciona la cuenta"
            prepend-inner-icon="mdi-bank-outline"
            variant="outlined"
            density="compact"
            no-data-text="El proveedor no tiene cuentas registradas"
            hide-details="auto"
            :error-messages="form.id_cuenta ? '' : DATO_REQUERIDO"
          />
        </template>
        <template v-else>
          <label
            class="soledit__label"
            for="soledit-codigo"
          >CÓDIGO DE PAGO <span class="soledit__req">*</span></label>
          <v-text-field
            id="soledit-codigo"
            v-model="form.codigopago"
            prepend-inner-icon="mdi-barcode"
            variant="outlined"
            density="compact"
            hide-details="auto"
            :error-messages="form.codigopago.trim() ? '' : DATO_REQUERIDO"
          />
        </template>

        <label
          class="soledit__label"
          for="soledit-comentario"
        >OBSERVACIONES (OPCIONAL)</label>
        <v-textarea
          id="soledit-comentario"
          v-model="form.comentario"
          rows="2"
          auto-grow
          variant="outlined"
          density="compact"
          hide-details
        />
      </div>

      <div class="soledit__actions">
        <v-btn
          variant="outlined"
          class="soledit__btn"
          :disabled="guardando"
          @click="abierto = false"
        >
          CANCELAR
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="soledit__btn"
          prepend-icon="mdi-send"
          :loading="guardando"
          :disabled="!valida || cargando"
          @click="guardar"
        >
          GUARDAR Y REENVIAR
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.soledit {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  border-radius: 22px !important;
  overflow: hidden;
  color: #0a1f44;
}
.soledit__head {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 22px 8px;
}
.soledit__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #dcebfd;
  color: #0b5fd6;
}
.soledit__titles {
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 14px;
  border-left: 2px solid #0b5fd6;
}
.soledit__titles h3 {
  margin: 0;
  font-size: 19px;
  font-weight: 900;
  line-height: 1.15;
}
.soledit__titles span {
  font-size: 12px;
  font-weight: 600;
  color: #3b4a63;
}
.soledit__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 22px 4px;
}
.soledit__prov {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #dcebfd;
}
.soledit__label-sm {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #1e2c44;
}
.soledit__label {
  display: block;
  margin: 12px 0 4px;
  font-size: 13px;
  font-weight: 800;
}
.soledit__req {
  color: #e53935;
}
.soledit__tipos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.soledit__tipo {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid #c9d3e1;
  border-radius: 10px;
  background: #fff;
  font-weight: 600;
  text-align: left;
}
.soledit__tipo--active {
  border-color: #0b5fd6;
  background: #f1f7ff;
}
.soledit__actions {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 12px;
  padding: 14px 22px 18px;
}
.soledit__btn {
  min-height: 44px;
  border-radius: 10px !important;
  font-weight: 800;
  letter-spacing: 0;
}
@media (max-width: 600px) {
  .soledit__tipos,
  .soledit__actions {
    grid-template-columns: 1fr;
  }
}
</style>
