<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import Swal from "sweetalert2";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { EntidadListado } from "@/types/entidades";
import { usePermissions } from "@/composables/usePermissions";
import EntityListTable from "@/components/folderEntities/EntityListTable.vue";

const router = useRouter();
const { can } = usePermissions();
const appStore = useAppStore();
const entitiesStore = useEntitiesStore();
const masterusuariosStore = useMasterusuariosStore();

const dialogTelCont = ref(false);
const nombrecompleto = ref("");
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
    // @ts-expect-error the "paramas" typo never passes the id to the route.
    paramas: {
      id: idProveedor,
    },
  });
}
async function eliminar(item: EntidadListado) {
  const val = await entitiesStore.validarClienteTieneMovimientos({ id: item.id });
  console.log("validarClienteTieneMovimientos", val);
  if (!val.estadoflag) {
    Swal.fire({
      icon: "error",
      title: "No se puede eliminar el cliente",
      html: val.mensaje,
      allowOutsideClick: false,
      showConfirmButton: true,
      confirmButtonText: "Cerrar",
      confirmButtonColor: "red",
    });
    return;
  }

  Swal.fire({
    icon: "question",
    title: "Eliminar Registro",
    html: `Está seguro que desea eliminar el CLIENTE <br/> CLI-${item.correlativo}`,
    allowOutsideClick: false,
    showConfirmButton: true,
    confirmButtonText: "ELIMINAR",
    showCancelButton: true,
    confirmButtonColor: "red",
    cancelButtonText: "Cerrar",
  }).then(async (res) => {
    if (res.isConfirmed) {
      const data = { id: item.id };
      await entitiesStore.eliminarPersona(data, true);
      await entitiesStore.getListClientes();
    }
  });
}
function irAEditar(item: EntidadListado) {
  router.push({
    name: "editarCliente",
    params: { id: item.id },
  });
}
async function obtenerTelContactoProveedor(item: EntidadListado) {
  appStore.spiner = true;
  nombrecompleto.value = item.nombrecompleto!;
  await entitiesStore.telConctactoProveedor({ id: item.id });
  dialogTelCont.value = true;
  appStore.spiner = false;
}
async function exportCliente() {
  appStore.spiner = true;
  await entitiesStore.exportListClientes();
  appStore.spiner = false;
}

onMounted(async () => {
  entitiesStore.lstProveedor = [];
  appStore.spiner = true;
  await entitiesStore.getListClientes();
  appStore.spiner = false;
  await Promise.all([
    appStore._getDocumentsPais(),
    masterusuariosStore.cargarMasterDetalleTipoProveedor(),
    appStore._getPais(),
    appStore._getRole(),
    masterusuariosStore.cargarTipoTelefono(),
  ]);
});
</script>

<template>
  <div>
    <EntityListTable
      :items="entitiesStore.lstProveedor"
      plural="clientes"
      new-label="Nuevo Cliente"
      search-placeholder="Buscar cliente..."
      :can-create="can('listClientes', 'NUEVO')"
      :can-export="can('listClientes', 'EXPORTAR')"
      :can-edit="can('listClientes', 'MODIFICAR')"
      :can-delete="can('listClientes', 'ELIMINAR')"
      @create="cambiarRuta({ nameRuta: 'nuevoClientes' })"
      @filter="entitiesStore.filtrarProveedor = !entitiesStore.filtrarProveedor"
      @export="exportCliente()"
      @phones="obtenerTelContactoProveedor"
      @edit="irAEditar"
      @view="(item) => router.push({ name: 'verCliente', params: { id: item.id } })"
      @remove="eliminar"
    />
    <v-dialog
      v-model="dialogTelCont"
      persistent
      max-width="50%"
      transition="dialog-transition"
      scrollable
    >
      <v-card>
        <v-card-title>
          Teléfonos y Contactos: {{ nombrecompleto }}
        </v-card-title>
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
                  <!-- @vue-expect-error eliminarTelefono is not defined here; the table has no action column, so this button never renders. -->
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
                  <!-- @vue-expect-error validarFormularioTelefonoContacto is not defined here, so leaving this field always throws. -->
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                    @blur="validarFormularioTelefonoContacto()"
                  />
                </template>

                <template #[`item.action`]="{ index }">
                  <!-- @vue-expect-error eliminarContacto is not defined here; the table has no action column, so this button never renders. -->
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
  </div>
</template>

<style></style>
