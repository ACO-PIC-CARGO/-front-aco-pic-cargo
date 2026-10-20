<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useProyeccionesStore } from "@/stores/proyecciones";
import type { FiltroProyeccion, ProyeccionListado } from "@/types/finanzas";
import type { UsuarioSesionProyeccion } from "@/types/proyecciones";
import { sessionBranchId, sessionUser } from "@/utils/sesion";

const appStore = useAppStore();
const appRouter = useRouter();
const proyeccionesStore = useProyeccionesStore();

const filtar = ref(false);
const selectedItem = ref<ProyeccionListado>("" as unknown as ProyeccionListado);
const dialog = ref(false);
const search = ref("");
const id_month = ref<number | string>("");
const id_year = ref<number | string>("");
const correlativo = ref<number | string>("");
const total_proyectado_ext = ref<number | string>("");
const estado = ref("");
const aprobado = ref("");
const id_monthn = ref<number | string>("");
const id_yearn = ref<number | string>("");
const headers = [
  { title: "Correlativo", key: "proyeccion_correlativo" },
  { title: "Mes", key: "month_description" },
  { title: "Año", key: "year_description" },
  // { text:'Tipo de Cambio' ,value: "proyeccion_tipocambio" },
  // { text:'Total Moneda Local' ,value: "proyeccion_total_monlocal" },
  // { text:'Total Conversion' ,value: "proyeccion_total_conversionext" },
  // { text:'Total Dolar' ,value: "proyeccion_total_monext" },
  { title: "Proyectado (USD)", key: "proyeccion_total_proyectado_ext" },
  { title: "Usuario Creación", key: "entitie_namelong" },
  { title: "Estado", key: "proyeccion_estado" },
  { title: "Aprobado", key: "proyeccion_aprobadoflag" },
  { title: "Acciones", key: "action" },
];
const loading = ref(false);
const dialogn = ref(false);
const generarflag = ref(false);

async function pProyeccion(): Promise<void> {
  const data = {
    id_month: id_monthn.value,
    id_year: id_yearn.value,
    id_branch: sessionBranchId(),
    id_user: (sessionUser() as UsuarioSesionProyeccion).id_user,
  };
  await proyeccionesStore.primeraProyeccion(data);
  dialogn.value = false;
}
function ver(id: unknown): void {
  appRouter.push({ name: "verProyeccion", params: { id: id as string } });
}
function editar(id: unknown): void {
  appRouter.push({ name: "editarProyeccion", params: { id: id as string } });
}
async function eliminar(id: unknown): Promise<void> {
  appStore.spiner = true;
  let data: Record<string, unknown> = { id: id };
  await proyeccionesStore.eliminarProyeccion(data);
  data = {};
  await proyeccionesStore.getProyeccion(data as unknown as FiltroProyeccion);
  appStore.spiner = false;
}
function copiar(itemFila: ProyeccionListado): void {
  id_month.value = "";
  id_year.value = "";
  selectedItem.value = itemFila;
  dialog.value = true;
}
async function copyProyeccion(): Promise<void> {
  loading.value = true;
  let data: Record<string, unknown> = {
    id: selectedItem.value.proyeccion_id,
    id_month: id_month.value,
    id_year: id_year.value,
    id_branch: sessionBranchId(),
    id_user: (sessionUser() as UsuarioSesionProyeccion).id_user,
  };

  await proyeccionesStore.copiarProyeccion(data);
  data = {
    id_month: "",
    id_year: "",
    correlativo: "",
    total_proyectado_ext: "",
    estado: "",
    aprobadoflag: "",
  };
  await proyeccionesStore.getProyeccion(data as unknown as FiltroProyeccion);
  loading.value = false;
  dialog.value = false;
  id_month.value = "";
  id_year.value = "";
}
async function filtrar(): Promise<void> {
  const data = {
    id_month: id_month.value ? id_month.value : "",
    id_year: id_year.value ? id_year.value : "",
    correlativo: correlativo.value ? correlativo.value : "",
    total_proyectado_ext: total_proyectado_ext.value ? total_proyectado_ext.value : "",
    estado: estado.value ? estado.value : "",
    aprobadoflag: aprobado.value ? aprobado.value : "",
  };
  await proyeccionesStore.getProyeccion(data);
  filtar.value = false;
}
function clearestado(): void {
  estado.value = "";
}
function clearaprobado(): void {
  aprobado.value = "";
}

onMounted(async () => {
  const data = {
    id_month: "",
    id_year: "",
    correlativo: "",
    total_proyectado_ext: "",
    estado: "",
    aprobadoflag: "",
  };
  appStore.spiner = true;
  await Promise.all([
    proyeccionesStore.getProyeccion(data),
    appStore._getChargeMonth(),
    appStore._getChargeYear(),
  ]);
  generarflag.value = proyeccionesStore.listProyeccion.length == 0;
  appStore.spiner = false;
  appStore.drawer = false;
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-text-field
        name="Buscar"
        label="Buscar Proyección"
        v-model="search"
      />

      <v-spacer />
      <v-btn
        color="#3F51B5"
        class="mx-1"
        @click="dialogn = !dialogn"
        size="small"
        rounded
        v-if="generarflag"
      >
        GENERAR
      </v-btn>
      <v-btn
        color="success"
        class="mx-1"
        @click="$router.push({ name: 'nuevaProyeccionCXP' })"
        size="small"
        rounded
      >
        NUEVA
      </v-btn>
      <v-btn
        color="info"
        class="mx-1"
        size="small"
        rounded
        @click="filtar = !filtar"
      >
        FILTRAR
      </v-btn>
      <v-btn
        color="success"
        class="mx-1"
        size="small"
        rounded
      >
        EXPORTAR
      </v-btn>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="proyeccionesStore.listProyeccion"
          class="elevation-1"
          item-value="id"
          :search="search"
        >
          <template #[`item.action`]="{ item }">
            <v-btn
              variant="text"
              icon
            >
              <v-icon
                color="info"
                @click="ver(item.proyeccion_id)"
              >
                mdi-eye
              </v-icon>
            </v-btn>
            <v-btn
              variant="text"
              icon
              v-if="!item.proyeccion_aprobadoflag"
            >
              <v-icon
                color="orange"
                @click="editar(item.proyeccion_id)"
              >
                mdi-pencil
              </v-icon>
            </v-btn>
            <v-btn
              variant="text"
              icon
            >
              <v-icon
                color="blue-grey-darken-4"
                @click="copiar(item)"
              >
                mdi-content-copy
              </v-icon>
            </v-btn>
            <v-btn
              variant="text"
              icon
              v-if="!item.proyeccion_aprobadoflag && !!item.proyeccion_estado"
              @click="eliminar(item.proyeccion_id)"
            >
              <v-icon color="red">
                mdi-trash-can
              </v-icon>
            </v-btn>
          </template>
          <template #[`item.proyeccion_estado`]="{ item }">
            <v-chip :color="!!item.proyeccion_estado ? 'green' : 'red'">
              {{ !!item.proyeccion_estado ? "Activo" : "Inactivo" }}
            </v-chip>
          </template>
          <template #[`item.proyeccion_aprobadoflag`]="{ item }">
            <v-chip
              :color="!!item.proyeccion_aprobadoflag ? 'green' : 'red'"
            >
              {{ !!item.proyeccion_aprobadoflag ? "Si" : "No" }}
            </v-chip>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialog"
      persistent
      :overlay="false"
      max-width="30%"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          Copiar Proyección {{ selectedItem.proyeccion_correlativo }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="defaul"
            @click="dialog = !dialog"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                :items="appStore.month"
                v-model="id_month"
                label="Mes"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                :items="Array.isArray(appStore.year) ? appStore.year : []"
                v-model="id_year"
                label="Año"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            class="mx-1"
            @click="copyProyeccion()"
            :loading="loading"
          >
            Copiar
          </v-btn>
          <v-btn
            color="red"
            class="mx-1"
            @click="dialog = !dialog"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogn"
      persistent
      :overlay="false"
      max-width="30%"
    >
      <v-card>
        <v-card-title
          class="d-flex align-center flex-wrap"
          primary-title
        >
          REALIZAR PRIMERA PROYECCIÓN
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="defaul"
            @click="dialogn = !dialogn"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-select
                :items="appStore.month"
                v-model="id_monthn"
                label="Mes"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              />
            </v-col>

            <v-col cols="12">
              <v-select
                :items="Array.isArray(appStore.year) ? appStore.year : []"
                v-model="id_yearn"
                label="Año"
                density="compact"
                item-title="description"
                item-value="id"
                :rules="[(v) => !!v || 'Dato requerido']"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="success"
            class="mx-1"
            @click="pProyeccion()"
            :loading="loading"
          >
            Copiar
          </v-btn>
          <v-btn
            color="red"
            class="mx-1"
            @click="dialogn = !dialogn"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-navigation-drawer
      v-model="filtar"
      location="right"
      temporary
      
      width="20%"
    >
      <v-list-item>
        <v-list-item-title class="text-headline-small">
          Filtrar
        </v-list-item-title>
      </v-list-item>

      <v-divider />

      <v-divider />
      <v-list
        density="compact"
        nav
      >
        <v-row>
          <v-col cols="12">
            <v-select
              :items="appStore.month"
              v-model="id_month"
              label="Mes"
              density="compact"
              item-title="description"
              item-value="id"
              clearable
            />
          </v-col>
          <v-col cols="12">
            <v-select
              :items="Array.isArray(appStore.year) ? appStore.year : []"
              v-model="id_year"
              label="Año"
              density="compact"
              item-title="description"
              item-value="id"
              clearable
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Correlativo"
              v-model="correlativo"
              clearable
              density="compact"
              step="1"
            />
          </v-col>
          <v-col cols="12">
            <v-text-field
              type="number"
              label="Monto Proyectado (USD)"
              v-model="total_proyectado_ext"
              clearable
              density="compact"
              step="1"
            />
          </v-col>
          <v-col cols="12">
            Estado
            <v-radio-group
              v-model="estado"
              inline
              density="compact"
            >
              <v-radio
                label="Activo"
                :value="'true'"
              />
              <v-radio
                label="Inactivo"
                color="red"
                :value="'false'"
              />
              <v-btn
                variant="text"
                icon
                size="small"
                @click="clearestado()"
                v-if="!!estado"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-radio-group>
          </v-col>
          <v-col cols="12">
            Aprobados
            <v-radio-group
              v-model="aprobado"
              inline
              density="compact"
            >
              <v-radio
                label="Aprobados"
                :value="'true'"
              />
              <v-radio
                label="No Aprobados"
                color="red"
                :value="'false'"
              />
              <v-btn
                variant="text"
                icon
                size="small"
                @click="clearaprobado()"
                v-if="!!aprobado"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-radio-group>
          </v-col>
        </v-row>
      </v-list>
      <v-card-actions>
        <v-spacer />
        <v-btn
          size="small"
          color="success"
          @click="filtrar()"
        >
          Aceptar
        </v-btn>
        <v-btn
          size="small"
          color="red"
          @click="filtar = !filtar"
        >
          Cerrar
        </v-btn>
      </v-card-actions>
    </v-navigation-drawer>
  </v-container>
</template>

<style></style>
