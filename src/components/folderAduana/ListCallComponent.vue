<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import moment from "moment";
import { useAppStore } from "@/stores/app";
import { usePricingStore } from "@/stores/pricing";
import { usePermissions } from "@/composables/usePermissions";
import { useAduanaStore } from "@/stores/aduana";
import { sessionUserIdOrEmpty } from "@/utils/sesion";
import type { FormNotaLlamada } from "@/types/cotizacion";

const router = useRouter();
const appStore = useAppStore();
const pricingStore = usePricingStore();
const aduanaStore = useAduanaStore();
const { can } = usePermissions();

const search = "";
const dialogRegistroNotaLlamada = ref(false);
const detallenota = useTemplateRef("detallenota");
const fromData = ref<FormNotaLlamada>({ date: "", descripcion: "", identities: "" });
const callAduanaId = ref<number>();
const loadingCallsPdf = ref(false);
const headers = [
    { key: "acciones", title: "", align: "center", estado: true },
    { key: "status", title: "ESTATUS ", aling: "center", estado: true },
    {
      key: "codigo_quote",
      title: "CÓDIGO ",
      aling: "center",
      estado: true,
    },
    {
      key: "fecha_ultima_llamada",
      title: "FECHA ÚLTIMA LLAMADA",
      aling: "center",
      estado: true,
    },
    {
      key: "ejecutivo_ventas",
      title: "EJECUTIVO",
      aling: "center",
      estado: true,
    },
    { key: "cliente", title: "CLIENTE", aling: "center", estado: true },
    {
      key: "ultimo_comentario",
      title: "ULTIMO COMENTARIO",
      aling: "center",
      estado: true,
    },
    { key: "telefono", title: "TELEFONO", aling: "center", estado: true },
    {
      key: "fecha_solicitud",
      title: "FECHA SOLICITUD",
      aling: "center",
      estado: true,
    },
    { key: "sentido", title: "SENTIDO", aling: "center", estado: true },
    { key: "origen", title: "ORIGEN ", aling: "center", estado: true },
    { key: "destino", title: "DESTINO", aling: "center", estado: true },
    {
      key: "incoterms",
      title: "INCOTERMS",
      aling: "center",
      estado: true,
    },
    {
      key: "tipo_de_carga",
      title: "TIPO DE CARGA",
      aling: "center",
      estado: true,
    },
] as const;
const filtro = {
  id_estado: "",
  id_sentido: "",
  id_carga: "",
  id_incoterms: "",
  desde: "",
  hasta: "",
};

async function printAduanaCalls() {
  loadingCallsPdf.value = true;
  await aduanaStore.printAduanaCallsReport();
  loadingCallsPdf.value = false;
}
function accionVerCotizacion(id: number | undefined) {
  router.push({ name: "VerAduana", params: { id } });
}
function registrarLlamada(id: number | undefined) {
  fromData.value = {
    date: moment().format("YYYY-MM-DD"),
    descripcion: "",
    identities: sessionUserIdOrEmpty(),
  };
  callAduanaId.value = id;
  dialogRegistroNotaLlamada.value = true;
}
async function guardarNota() {
  if ((await detallenota.value!.validate()).valid) {
    dialogRegistroNotaLlamada.value = false;
    appStore.spiner = true;

    const data = {
      id_quote: callAduanaId.value,
      id_operador: fromData.value.identities,
      comentario: fromData.value.descripcion,
      fecha: fromData.value.date,
    };

    if (await aduanaStore.guardarNotaAduana(data)) await aduanaStore.getQuoteCallAduana(filtro);

    appStore.spiner = false;
  }
}

onMounted(async () => {
  appStore.spiner = true;
  await aduanaStore.getQuoteCallAduana(filtro);
  appStore.spiner = false;
});
</script>

<template>
  <v-container fluid>
    <v-dialog
      v-model="dialogRegistroNotaLlamada"
      v-if="dialogRegistroNotaLlamada"
      max-width="30%"
    >
      <v-card>
        <v-card-title>
          <span class="text-headline-medium">Detalle de Nota de llamada</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="detallenota">
            <v-text-field
              v-model="fromData.date"
              readonly
              type="date"
            />
            <v-text-field
              v-model="fromData.descripcion"
              :rules="[(v) => !!v || 'El dato es requerido']"
              label="Descripcion"
            />
            <v-autocomplete
              :items="pricingStore.listEjecutivo"
              label="Ejecutivo."
              density="compact"
              clearable
              item-title="name"
              item-value="id_entitie"
              v-model="fromData.identities"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <div class="flex-grow-1 text-right">
            <v-btn
              variant="text"
              color="success"
              @click="guardarNota"
            >
              Aceptar
            </v-btn>
            <v-btn
              variant="text"
              color="red"
              @click="dialogRegistroNotaLlamada = !dialogRegistroNotaLlamada"
            >
              Cancelar
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-row>
      <v-col
        cols="8"
        offset="4"
      >
        <v-col
          cols="6"
          offset-md="6"
          class="text-right"
        >
          <v-btn
            v-if="can('lstQuoteAduanaAduana', 'EXPORTAR')"
            color="red"
            @click="printAduanaCalls()"
            class="mx-1"
            :loading="loadingCallsPdf"
            :disabled="loadingCallsPdf"
            size="small"
          >
            <v-icon>mdi-file-pdf-box</v-icon> Imprimir
          </v-btn>
        </v-col>
      </v-col>
    </v-row>
    <v-row>
      <v-data-table
        density="compact"
        :headers="headers"
        :items="pricingStore.listCall"
        :items-per-page="5"
        class="elevation-1 contenido"
        :search="search"
        multi-sort
      >
        <template #item="row">
          <tr
            @dblclick="accionVerCotizacion(row.item.id)"
            :class="{
              'text-red':
                row.item.status === 'COTIZANDO SEGURO' ||
                row.item.status === 'COTIZANDO PROSPECTO',
            }"
          >
            <td>
              <v-tooltip location="bottom">
                <template #activator="{ props }">
                  <v-btn
                    variant="text"
                    class="ma-2"
                    icon
                    size="x-small"
                   
                    v-bind="props"
                    color="#A43542 "
                    v-if="can('lstQuoteAduanaAduana', 'MODIFICAR')"
                    @click="registrarLlamada(row.item.id)"
                  >
                    <v-icon size="small">
                      mdi-phone-plus
                    </v-icon>
                  </v-btn>
                </template>
                <span>Actualizar Registro Llamada</span>
              </v-tooltip>
            </td>
            <td>
              {{ row.item.status }}
            </td>
            <td>
              {{ row.item.codigo }}
            </td>
            <td>
              {{ row.item.fecha_ultima_llamada }}
            </td>
            <td>
              {{ row.item.ejecutivo_ventas }}
            </td>
            <td>
              {{ row.item.cliente }}
            </td>
            <td>
              {{ row.item.ultimo_comentario }}
            </td>
            <td>
              {{ row.item.telefono }}
            </td>
            <td>
              {{ row.item.fecha_solicitud }}
            </td>
            <td>
              {{ row.item.sentido }}
            </td>
            <td>
              {{ row.item.origen }}
            </td>
            <td>
              {{ row.item.destino }}
            </td>
            <td>
              {{ row.item.incoterms }}
            </td>
            <td>
              {{ row.item.tipo_de_carga }}
            </td>
          </tr>
        </template>
        <template #no-data>
          No se encontraron registros
        </template>
      </v-data-table>
    </v-row>
  </v-container>
</template>

<style></style>
