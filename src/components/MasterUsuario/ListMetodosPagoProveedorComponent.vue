<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Swal from "sweetalert2";
import { usePermissions } from "@/composables/usePermissions";
import {
  CODIGO_METODO_PAGO,
  type MetodoPagoProveedor,
  nombreMetodoPago,
  useMetodosPagoProveedor,
} from "@/composables/useMetodosPagoProveedor";

const RUTA = "ListMetodosPagoProveedor";
const { can } = usePermissions();
const { metodos, cargando, listar, guardar, ordenar } = useMetodosPagoProveedor();

// Códigos con comportamiento propio en el instructivo: se editan, pero no cambian de código.
const DESCRIPCION_SISTEMA: Record<string, string> = {
  [CODIGO_METODO_PAGO.ALIBABA_TARJETA]: "Pide factura, link de pago y contrato de Alibaba",
  [CODIGO_METODO_PAGO.ALIBABA_TRANSFERENCIA]: "Igual que Alibaba tarjeta + datos de la transferencia",
  [CODIGO_METODO_PAGO.TRANSFERENCIA_INTERNACIONAL]: "Pide factura, comprobante, captura y datos bancarios",
  [CODIGO_METODO_PAGO.ALIPAY]: "Pide QR de pago y montos en CNY / USD",
  [CODIGO_METODO_PAGO.MADE_IN_CHINA_TRANSFERENCIA]: "Igual que Alibaba transferencia (Made in China)",
  [CODIGO_METODO_PAGO.MADE_IN_CHINA_TARJETA]: "Igual que Alibaba tarjeta (Made in China)",
  [CODIGO_METODO_PAGO.OTROS]: "Pide especificar el método de pago y el monto",
};

const buscar = ref("");
const ordenando = ref(false);
const dialogo = ref(false);
const guardando = ref(false);
const formulario = ref<{ codigo: string | null; descripcion: string; detalle: string; estado: boolean }>({
  codigo: null,
  descripcion: "",
  detalle: "",
  estado: true,
});

const puedeModificar = computed(() => can(RUTA, "MODIFICAR"));
const filtrando = computed(() => !!buscar.value?.trim());
const metodosVisibles = computed(() => {
  const texto = buscar.value?.trim().toLowerCase();
  if (!texto) return metodos.value;
  return metodos.value.filter((m) =>
    `${m.codigo} ${nombreMetodoPago(m)}`.toLowerCase().includes(texto),
  );
});

function avisar(icono: "success" | "warning" | "error", titulo: string) {
  void Swal.fire({ icon: icono, title: titulo, timer: icono === "success" ? 1500 : undefined, showConfirmButton: icono !== "success" });
}

function nuevo() {
  formulario.value = { codigo: null, descripcion: "", detalle: "", estado: true };
  dialogo.value = true;
}
function editar(metodo: MetodoPagoProveedor) {
  formulario.value = {
    codigo: metodo.codigo,
    descripcion: metodo.descripcion,
    detalle: metodo.detalle ?? "",
    estado: metodo.estado,
  };
  dialogo.value = true;
}

async function guardarFormulario() {
  if (!formulario.value.descripcion.trim()) {
    avisar("warning", "Ingresa el nombre del método de pago");
    return;
  }
  guardando.value = true;
  try {
    const respuesta = await guardar(formulario.value);
    if (!respuesta.estadoflag) {
      avisar("warning", respuesta.mensaje);
      return;
    }
    dialogo.value = false;
    avisar("success", respuesta.mensaje);
    await listar();
  } catch (error) {
    console.error(error);
    avisar("error", "No se pudo guardar el método de pago");
  } finally {
    guardando.value = false;
  }
}

async function cambiarEstado(metodo: MetodoPagoProveedor) {
  const activar = !metodo.estado;
  const { isConfirmed } = await Swal.fire({
    icon: "question",
    title: activar ? "¿Activar método de pago?" : "¿Inactivar método de pago?",
    text: activar
      ? `"${nombreMetodoPago(metodo)}" volverá a aparecer en el instructivo.`
      : `"${nombreMetodoPago(metodo)}" ya no aparecerá en el instructivo. Los instructivos ya guardados no cambian.`,
    showCancelButton: true,
    confirmButtonText: activar ? "Sí, activar" : "Sí, inactivar",
    confirmButtonColor: activar ? "#22a559" : "red",
    cancelButtonText: "Cancelar",
  });
  if (!isConfirmed) return;
  try {
    const respuesta = await guardar({ ...metodo, detalle: metodo.detalle, estado: activar });
    if (!respuesta.estadoflag) {
      avisar("warning", respuesta.mensaje);
      return;
    }
    await listar();
  } catch (error) {
    console.error(error);
    avisar("error", "No se pudo actualizar el método de pago");
  }
}

// Mueve una fila y guarda el orden completo de la sucursal.
async function mover(indice: number, direccion: -1 | 1) {
  const destino = indice + direccion;
  if (destino < 0 || destino >= metodos.value.length || ordenando.value) return;
  const lista = [...metodos.value];
  [lista[indice], lista[destino]] = [lista[destino]!, lista[indice]!];
  const anterior = metodos.value;
  metodos.value = lista;
  ordenando.value = true;
  try {
    const respuesta = await ordenar(lista.map((m) => m.codigo));
    if (!respuesta.estadoflag) {
      metodos.value = anterior;
      avisar("warning", respuesta.mensaje);
    }
  } catch (error) {
    console.error(error);
    metodos.value = anterior;
    avisar("error", "No se pudo guardar el orden");
  } finally {
    ordenando.value = false;
  }
}

onMounted(listar);
</script>

<template>
  <v-card class="mpp">
    <div class="mpp__head">
      <div>
        <div class="mpp__title">
          Métodos de pago al proveedor
        </div>
        <div class="mpp__sub">
          Opciones del paso «Método de Pago al Proveedor» del instructivo. Usa las flechas para cambiar el orden.
        </div>
      </div>
      <div class="mpp__actions">
        <v-text-field
          v-model="buscar"
          density="compact"
          variant="outlined"
          placeholder="Buscar"
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          class="mpp__search"
        />
        <v-btn
          v-if="can(RUTA, 'NUEVO')"
          color="success"
          class="text-none"
          prepend-icon="mdi-plus"
          @click="nuevo"
        >
          Nuevo
        </v-btn>
      </div>
    </div>

    <v-progress-linear
      v-if="cargando || ordenando"
      indeterminate
      color="primary"
    />

    <div
      v-if="!cargando && !metodosVisibles.length"
      class="mpp__empty"
    >
      No hay métodos de pago registrados.
    </div>

    <div class="mpp__list">
      <div
        v-for="(metodo, indice) in metodosVisibles"
        :key="metodo.codigo"
        class="mpp__row"
        :class="{ 'is-inactive': !metodo.estado }"
      >
        <div
          v-if="puedeModificar && !filtrando"
          class="mpp__move"
        >
          <v-btn
            icon="mdi-chevron-up"
            size="x-small"
            variant="text"
            title="Subir"
            :disabled="indice === 0 || ordenando"
            @click="mover(indice, -1)"
          />
          <v-btn
            icon="mdi-chevron-down"
            size="x-small"
            variant="text"
            title="Bajar"
            :disabled="indice === metodosVisibles.length - 1 || ordenando"
            @click="mover(indice, 1)"
          />
        </div>
        <span class="mpp__pos">{{ indice + 1 }}</span>
        <span class="mpp__code">{{ metodo.codigo }}</span>
        <div class="mpp__name">
          <b>{{ metodo.descripcion }}</b>
          <span v-if="metodo.detalle"> ({{ metodo.detalle }})</span>
          <div
            v-if="DESCRIPCION_SISTEMA[metodo.codigo]"
            class="mpp__hint"
          >
            {{ DESCRIPCION_SISTEMA[metodo.codigo] }}
          </div>
        </div>
        <v-chip
          size="small"
          variant="flat"
          :color="metodo.estado ? 'success' : 'grey'"
          class="mpp__state"
        >
          {{ metodo.estado ? "Activo" : "Inactivo" }}
        </v-chip>
        <div class="mpp__btns">
          <v-btn
            v-if="puedeModificar"
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="warning"
            title="Editar"
            @click="editar(metodo)"
          />
          <v-btn
            v-if="metodo.estado && (can(RUTA, 'ELIMINAR') || puedeModificar)"
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            title="Inactivar"
            @click="cambiarEstado(metodo)"
          />
          <v-btn
            v-else-if="!metodo.estado && puedeModificar"
            icon="mdi-restore"
            size="small"
            variant="text"
            color="success"
            title="Activar"
            @click="cambiarEstado(metodo)"
          />
        </div>
      </div>
    </div>

    <v-dialog
      v-model="dialogo"
      max-width="520"
    >
      <v-card>
        <v-card-title class="mpp__dlg-title">
          {{ formulario.codigo ? `Editar método de pago · ${formulario.codigo}` : "Nuevo método de pago" }}
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="formulario.descripcion"
            label="Nombre *"
            placeholder="Ej. Alibaba"
            variant="outlined"
            density="compact"
            maxlength="100"
            autofocus
          />
          <v-text-field
            v-model="formulario.detalle"
            label="Detalle (opcional)"
            placeholder="Ej. Tarjeta de Débito / Crédito"
            hint="Se muestra entre paréntesis"
            persistent-hint
            variant="outlined"
            density="compact"
            maxlength="150"
          />
          <v-switch
            v-model="formulario.estado"
            label="Activo"
            color="success"
            density="compact"
            hide-details
            class="mt-2"
          />
          <div class="mpp__preview">
            <span class="mpp__preview-label">Así se verá:</span>
            <span class="mpp__radio" />
            <b>{{ formulario.descripcion || "Nombre" }}</b>
            <span v-if="formulario.detalle?.trim()">&nbsp;({{ formulario.detalle.trim() }})</span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="text"
            class="text-none"
            @click="dialogo = false"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            :loading="guardando"
            @click="guardarFormulario"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.mpp {
  padding: 16px;
  border-radius: 12px;
}
.mpp__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.mpp__title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2a44;
}
.mpp__sub {
  font-size: 13px;
  color: #5b6b85;
}
.mpp__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.mpp__search {
  width: 240px;
  max-width: 100%;
}
.mpp__empty {
  padding: 24px;
  text-align: center;
  color: #6b7280;
}
.mpp__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.mpp__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #ffffff;
  border: 1px solid #e3e8f0;
  border-radius: 10px;
}
.mpp__row.is-inactive {
  background: #f6f7f9;
}
.mpp__row.is-inactive .mpp__name {
  color: #9ca3af;
}
.mpp__move {
  display: flex;
  flex-direction: column;
}
.mpp__pos {
  width: 22px;
  text-align: center;
  font-weight: 700;
  color: #6b7280;
}
.mpp__code {
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  color: #1f73e8;
  background: #eaf2ff;
  border-radius: 6px;
}
.mpp__name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #1f2a44;
}
.mpp__hint {
  font-size: 11px;
  color: #6b7280;
}
.mpp__btns {
  display: flex;
}
.mpp__dlg-title {
  font-size: 17px;
  font-weight: 700;
}
.mpp__preview {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
  padding: 10px 12px;
  font-size: 14px;
  background: #eaf2ff;
  border: 1px solid #c9dcfb;
  border-radius: 10px;
}
.mpp__preview-label {
  width: 100%;
  font-size: 11px;
  color: #5b6b85;
}
.mpp__radio {
  width: 16px;
  height: 16px;
  border: 4px solid #1f73e8;
  border-radius: 50%;
}
@media (max-width: 600px) {
  .mpp__row {
    flex-wrap: wrap;
  }
  .mpp__name {
    flex-basis: calc(100% - 120px);
  }
  .mpp__search {
    width: 100%;
  }
}
</style>
