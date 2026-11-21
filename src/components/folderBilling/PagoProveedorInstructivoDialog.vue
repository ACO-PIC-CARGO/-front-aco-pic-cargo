<script setup lang="ts">
import { computed } from "vue";
import { useDisplay } from "vuetify";
import Swal from "sweetalert2";
import { notifySuccess } from "@/utils/request";
import LogoPlataformaPago from "@/components/comun/LogoPlataformaPago.vue";
import { abrirArchivo } from "@/composables/useVisorArchivo";
import { detalleClientePago, detallePagoProveedor } from "@/composables/usePagoProveedorInstructivo";
import type { CampoPago, PagoProveedorInstructivo } from "@/composables/usePagoProveedorInstructivo";

// Detalle (solo lectura) del pago al proveedor del instructivo de Pricing (paso 6.3), con el mismo
// diseño del formulario. Archivos con el ojo: pestaña nueva en web y modal en celular / tablet.
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    pagos: PagoProveedorInstructivo[];
    cargando?: boolean;
  }>(),
  { cargando: false },
);
const emit = defineEmits<{ "update:modelValue": [valor: boolean] }>();

const { smAndDown } = useDisplay();
const abierto = computed({
  get: () => props.modelValue,
  set: (valor: boolean) => emit("update:modelValue", valor),
});
const detalles = computed(() =>
  props.pagos.map((pago) => ({
    pago,
    cliente: detalleClientePago(pago.datos),
    detalle: detallePagoProveedor(pago.datos, pago.metodo),
  })),
);
function verArchivo(campo: CampoPago) {
  if (campo.archivo) abrirArchivo(campo.archivo.ruta, campo.archivo.name);
}
// Copiar el dato llenado (los archivos se ven con el ojo, no se copian)
async function copiar(texto: string | undefined) {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    notifySuccess("Copiado al portapapeles");
  } catch {
    void Swal.fire({ icon: "warning", text: "No se pudo copiar. Selecciona el texto y cópialo manualmente." });
  }
}
const proveedor = computed(() => props.pagos[0]?.proveedor ?? "");
</script>

<template>
  <v-dialog
    v-model="abierto"
    :fullscreen="smAndDown"
    max-width="720"
    scrollable
  >
    <v-card class="ppi">
      <div class="ppi__head">
        <span class="ppi__head-icon"><v-icon size="22">mdi-bank-transfer-out</v-icon></span>
        <div class="ppi__head-text">
          <span class="ppi__head-title">Pago al proveedor (instructivo)</span>
          <span
            v-if="proveedor"
            class="ppi__head-sub"
          >{{ proveedor }}</span>
        </div>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          aria-label="Cerrar"
          @click="abierto = false"
        />
      </div>

      <v-card-text class="ppi__body">
        <div
          v-if="cargando"
          class="ppi__empty"
        >
          <v-progress-circular
            indeterminate
            color="primary"
            size="28"
          />
        </div>
        <div
          v-else-if="!detalles.length"
          class="ppi__empty"
        >
          No hay datos del pago al proveedor en el instructivo.
        </div>

        <section
          v-for="{ pago, cliente, detalle } in detalles"
          :key="pago.id"
          class="ppi__card"
        >
          <!-- 6.1 ¿El cliente ya nos pagó? -->
          <div
            v-if="cliente"
            class="ppi__cliente"
          >
            <div class="ppi__cliente-head">
              <span class="ppi__cliente-q">¿El <span class="ppi__tag">CLIENTE</span> ya nos pagó?</span>
              <span
                class="ppi__sino"
                :class="cliente.pago ? 'ppi__sino--si' : 'ppi__sino--no'"
              >{{ cliente.pago ? "Sí" : "No" }}</span>
            </div>
            <div
              v-for="campo in cliente.campos"
              :key="campo.label"
              class="ppi__field"
            >
              <span class="ppi__field-icon"><v-icon size="24">{{ campo.icon }}</v-icon></span>
              <div class="ppi__field-main">
                <div class="ppi__field-label">
                  {{ campo.label }}
                </div>
                <div
                  class="ppi__value"
                  :class="{ 'ppi__value--empty': !campo.valor }"
                >
                  <span class="ppi__value-text">{{ campo.valor || "—" }}</span>
                  <v-btn
                    v-if="campo.valor"
                    icon="mdi-content-copy"
                    variant="text"
                    size="small"
                    color="primary"
                    class="ppi__copy"
                    :title="`Copiar ${campo.label}`"
                    :aria-label="`Copiar ${campo.label}`"
                    @click="copiar(campo.valor)"
                  />
                </div>
              </div>
            </div>
          </div>

          <header class="ppi__card-head">
            <div class="ppi__title">
              <span class="ppi__title-main">{{ detalle.titulo }}</span>
              <span
                v-if="detalle.subtitulo"
                class="ppi__title-sub"
              >{{ detalle.subtitulo }}</span>
            </div>
            <LogoPlataformaPago
              v-if="detalle.plataforma"
              :plataforma="detalle.plataforma"
            />
            <span
              v-else
              class="ppi__brand"
            ><v-icon size="22">{{ detalle.icono }}</v-icon></span>
          </header>

          <div class="ppi__meta">
            <span v-if="pago.nro_quote">Cotización <b>{{ pago.nro_quote }}</b></span>
            <span v-if="pago.correlativo">Correlativo <b>{{ pago.correlativo }}</b></span>
            <span>Registro <b>{{ pago.codigo }}</b></span>
          </div>

          <div class="ppi__form">
            <div
              v-for="campo in detalle.campos"
              :key="campo.label"
              class="ppi__field"
            >
              <span class="ppi__field-icon"><v-icon size="24">{{ campo.icon }}</v-icon></span>
              <div class="ppi__field-main">
                <div class="ppi__field-label">
                  {{ campo.label }}
                </div>
                <!-- archivo: nombre + ojo -->
                <div
                  v-if="campo.archivo"
                  class="ppi__file"
                >
                  <v-icon
                    size="16"
                    color="success"
                  >
                    mdi-file-document-outline
                  </v-icon>
                  <span
                    class="ppi__file-name"
                    :title="campo.archivo.name"
                  >{{ campo.archivo.name }}</span>
                  <v-btn
                    icon="mdi-eye-outline"
                    variant="text"
                    size="small"
                    color="primary"
                    :title="`Ver ${campo.label}`"
                    :aria-label="`Ver ${campo.label}`"
                    @click="verArchivo(campo)"
                  />
                </div>
                <div
                  v-else-if="campo.valor !== undefined"
                  class="ppi__value"
                  :class="{ 'ppi__value--empty': !campo.valor }"
                >
                  <span class="ppi__value-text">{{ campo.valor || "—" }}</span>
                  <v-btn
                    v-if="campo.valor"
                    icon="mdi-content-copy"
                    variant="text"
                    size="small"
                    color="primary"
                    class="ppi__copy"
                    :title="`Copiar ${campo.label}`"
                    :aria-label="`Copiar ${campo.label}`"
                    @click="copiar(campo.valor)"
                  />
                </div>
                <div
                  v-else
                  class="ppi__value ppi__value--empty"
                >
                  {{ campo.sinArchivo || "Sin archivo" }}
                </div>
              </div>
            </div>
          </div>
        </section>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.ppi {
  background: #f5f8fd !important;
}
.ppi__head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #dbe5f5;
}
.ppi__head-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  color: #1f73e8;
  background: #eaf2ff;
  border-radius: 10px;
}
.ppi__head-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
.ppi__head-title {
  font-size: 16px;
  font-weight: 800;
  color: #0a1f44;
}
.ppi__head-sub {
  overflow: hidden;
  font-size: 12px;
  color: #4b5563;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ppi__body {
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px !important;
}
.ppi__empty {
  display: flex;
  justify-content: center;
  padding: 24px 8px;
  color: #4b5563;
}
.ppi__card {
  flex-shrink: 0;
  overflow: hidden;
  background: #eef4ff;
  border: 1px solid #c9dcfb;
  border-radius: 14px;
}
.ppi__cliente {
  margin: 10px 10px 0;
  padding: 10px 14px 4px;
  background: #ffffff;
  border: 1px solid #dbe5f5;
  border-left: 3px solid #1f73e8;
  border-radius: 12px;
}
.ppi__cliente-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-bottom: 6px;
}
.ppi__cliente-q {
  font-size: 15px;
  font-weight: 700;
  color: #0a1f44;
}
.ppi__tag {
  padding: 1px 8px;
  font-size: 13px;
  color: #ffffff;
  background: #1f73e8;
  border-radius: 6px;
}
.ppi__sino {
  flex: 0 0 auto;
  min-width: 56px;
  padding: 4px 12px;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  border-radius: 8px;
}
.ppi__sino--si {
  color: #1b7a34;
  background: #e3f5e6;
  border: 1px solid #c3e8c9;
}
.ppi__sino--no {
  color: #c62828;
  background: #fdecec;
  border: 1px solid #f6c9c9;
}
.ppi__card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}
.ppi__title {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  padding-left: 10px;
  border-left: 2px solid #1f73e8;
}
.ppi__title-main {
  font-size: 15px;
  font-weight: 700;
  color: #1f73e8;
}
.ppi__title-sub {
  font-size: 12px;
  color: #4b5563;
}
.ppi__brand {
  display: inline-flex;
  padding: 6px 10px;
  color: #1f73e8;
  background: #ffffff;
  border: 1px solid #c9dcfb;
  border-radius: 10px;
}
.ppi__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  padding: 0 14px 10px;
  font-size: 12px;
  color: #4b5563;
}
.ppi__form {
  margin: 0 10px 10px;
  padding: 4px 14px;
  background: #ffffff;
  border: 1px solid #dbe5f5;
  border-radius: 12px;
}
.ppi__field {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}
.ppi__field + .ppi__field {
  border-top: 1px solid #eef2f7;
}
.ppi__field-icon {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  height: 40px;
  color: #1f73e8;
  background: #eaf2ff;
  border-radius: 10px;
}
.ppi__field-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.ppi__field-label {
  font-size: 14px;
  font-weight: 700;
  color: #1f2a44;
}
.ppi__value {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 4px 4px 4px 12px;
  font-size: 14px;
  color: #1f2a44;
  word-break: break-word;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.ppi__value-text {
  flex: 1;
  min-width: 0;
}
.ppi__copy {
  flex: 0 0 auto;
}
.ppi__value--empty {
  color: #6b7280;
}
.ppi__file {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 2px 4px 2px 12px;
  background: #e3f5e6;
  border: 1px solid #c3e8c9;
  border-radius: 8px;
}
.ppi__file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  color: #1f2a44;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 599.98px) {
  .ppi__body {
    padding: 12px !important;
  }
  .ppi__card-head {
    flex-wrap: wrap;
  }
  .ppi__form {
    margin: 0 6px 8px;
    padding: 2px 10px;
  }
  .ppi__field-icon {
    flex-basis: 34px;
    height: 34px;
  }
}
</style>
