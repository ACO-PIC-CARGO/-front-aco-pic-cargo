<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { EntidadListado } from "@/types/entidades";

const router = useRouter();
const appStore = useAppStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

const dialogTelCont = ref(false);
const search = ref("");
const headers = [
  { title: "Cat", key: "codigo", width: "3%" },
  { title: "Correlativo", key: "correlativo", width: "5%" },
  { title: "Documento", key: "documento", width: "10%" },
  {
    title: "Nombre Comercial/ Razón Social",
    key: "nombrecompleto",
    width: "20%",
  },
  { title: "Tipo Proveedor", key: "tipo_proveedor", width: "6.5%" },
  { title: "Ubigeo", key: "ubigeo", width: "8%" },
  { title: "Dirección", key: "address" },
  { title: "Estado", key: "estado", width: "6.5%" },
  { title: "Acciones", key: "action", width: "7.5%" },
] as const;
const headersTel = [
  { title: "Tipo de Teléfono", key: "tipotelefono", width: "30%" },
  { title: "Nro Teléfono", key: "nro_telefono", width: "50%" },
] as const;
const headersContact = [
  { title: "Nombres", key: "nombre" },
  { title: "Tipo de Teléfono", key: "tipotelefono" },
  { title: "Nro Teléfono", key: "nro_telefono" },
] as const;

function cambiarRuta({ nameRuta = "", idProveedor = "" }) {
  router.push({
    name: nameRuta,
    // @ts-expect-error Kept: the "paramas" typo has never passed the id to the route.
    paramas: {
      id: idProveedor,
    },
  });
}
function eliminar(item: EntidadListado) {
  Swal.fire({
    icon: "question",
    title: "Eliminar Registro",
    html: `Está seguro que desea eliminar el proveedor <br/> PROV-${item.correlativo}`,
    allowOutsideClick: false,
    showConfirmButton: true,
    confirmButtonText: "ELIMINAR",
    showCancelButton: true,
    confirmButtonColor: "red",
    cancelButtonText: "Cerrar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      const data = { id: item.id };
      await entitiesStore.eliminarPersona(data);
      // await this.getListProveedor();
    }
  });
}
async function obtenerTelContactoProveedor(id: number) {
  appStore.spiner = true;
  await entitiesStore.telConctactoProveedor({ id: id });
  dialogTelCont.value = true;
  appStore.spiner = false;
}
async function exportProveedor() {
  appStore.spiner = true;
  await entitiesStore.exportListProveedor();
  appStore.spiner = false;
}

onMounted(async () => {
  entitiesStore.lstProveedor = [];
  appStore.spiner = true;
  await entitiesStore.getListProveedor();
  await Promise.all([
    appStore._getDocumentsPais(),
    masterusuariosStore.cargarMasterDetalleTipoProveedor(),
    appStore._getPais(),
    appStore._getRole(),
    masterusuariosStore.cargarTipoTelefono(),
  ]);
  appStore.spiner = false;
});
</script>

<template>
  <v-container fluid>
    <v-row>
      <v-col cols="6">
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="success"
          @click="cambiarRuta({ nameRuta: 'nuevoProveedor' })"
        >
          NUEVO
        </v-btn>
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="secondary"
          @click="
            entitiesStore.filtrarProveedor =
              !entitiesStore.filtrarProveedor
          "
        >
          FILTRAR
        </v-btn>
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="warning"
          @click="exportProveedor()"
        >
          EXPORTAR
        </v-btn>
      </v-col>
      <v-col cols="6">
        <v-spacer />
        <v-text-field
          name="Buscar"
          label="Buscar"
          v-model="search"
        />
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="entitiesStore.lstProveedor"
          item-value="id"
          :search="search"
        >
          <template #[`item.codigo`]>
            PROV
          </template>
          <template #[`item.documento`]="{ item }">
            {{ item.acronym_document }}-{{ item.document }}
          </template>
          <template #[`item.ubigeo`]="{ item }">
            {{
              item.pais && item.city
                ? item.pais.concat("-", item.city)
                : item.pais || item.city
            }}
          </template>
          <template #[`item.action`]="{ item }">
            <v-btn-toggle>
              <v-btn
                variant="text"
                size="x-small"
                icon
                @click="obtenerTelContactoProveedor(item.id)"
              >
                <v-icon color="blue-grey-darken-3">
                  mdi-phone
                </v-icon>
              </v-btn>
              <!-- <v-btn x-small icon @click="editar(item.id)">
                <v-icon color="green">mdi-currency-usd</v-icon>
              </v-btn> -->
              <v-btn
                variant="text"
                v-if="item.status == 1"
                size="x-small"
                icon
                @click="
                  $router.push({
                    name: 'editarProveedor',
                    params: { id: item.id },
                  })
                "
              >
                <v-icon color="#E65100">
                  mdi-pencil
                </v-icon>
              </v-btn>
              <v-btn
                variant="text"
                size="x-small"
                icon
                @click="
                  $router.push({
                    name: 'verProveedor',
                    params: { id: item.id },
                  })
                "
              >
                <v-icon color="info">
                  mdi-eye
                </v-icon>
              </v-btn>
              <v-btn
                variant="text"
                size="x-small"
                icon
                v-if="item.status == 1"
              >
                <v-icon
                  color="red"
                  @click="eliminar(item)"
                >
                  mdi-delete
                </v-icon>
              </v-btn>
            </v-btn-toggle>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialogTelCont"
      persistent
      max-width="50%"
      transition="dialog-transition"
      scrollable
    >
      <v-card>
        <v-card-title> Teléfonos y Contactos </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="10">
              <v-list-subheader> <b>Teléfonos:</b> <br> </v-list-subheader>
            </v-col>

            <v-col cols="12">
              <v-data-table
                :headers="headersTel"
                :items="entitiesStore.lstTelefono"
                item-value="id"
                class="elevation-5"
              >
                <template #[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    :error-messages="item.errorTipoTelf"
                    readonly
                  />
                </template>
                <template #[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                  />
                </template>
                <template #[`item.action`]="{ index }">
                  <!-- @vue-expect-error Kept: eliminarTelefono was never defined here; the table has no action column, so this button never renders. -->
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarTelefono(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>

            <!-- -------------------------------- -->
            <v-col cols="10">
              <v-list-subheader><b>Contactos</b></v-list-subheader>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headersContact"
                :items="entitiesStore.lstContactos"
                item-value="index"
                class="elevation-5"
              >
                <template #[`item.nombre`]="{ item }">
                  <v-text-field
                    v-model="item.nombre"
                    readonly
                    :error-messages="item.errornombre"
                  />
                </template>

                <template #[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    readonly
                    :error-messages="item.errorTipoTelf"
                  />
                </template>
                <template #[`item.nro_telefono`]="{ item }">
                  <!-- @vue-expect-error Kept: validarFormularioTelefonoContacto was never defined here, so leaving this field has always thrown. -->
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                    @blur="validarFormularioTelefonoContacto()"
                  />
                </template>

                <template #[`item.action`]="{ index }">
                  <!-- @vue-expect-error Kept: eliminarContacto was never defined here; the table has no action column, so this button never renders. -->
                  <v-btn
                    variant="text"
                    icon
                    color="red"
                    @click="eliminarContacto(index)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            class="mx-1"
            color="success"
            @click="dialogTelCont = !dialogTelCont"
          >
            Cerrar
          </v-btn>
          <!-- <v-btn class="mx-1" color="red" dark>Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style></style>
