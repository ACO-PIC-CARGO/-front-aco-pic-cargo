<template>
  <div>
    <v-card>
      <v-card-title class="px-2 container-narrow d-flex align-center flex-wrap">
        <v-spacer></v-spacer>
        <v-btn
          v-if="!showNavigationButtons"
          color="light-blue-darken-2"
          class="ma-2"
          size="small"
          @click="modificarCliente"
        >
          <v-icon start size="small">mdi-account-edit</v-icon>
          {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
        </v-btn>
      </v-card-title>
      <v-card-text class="px-2">
        <div class="container-narrow">
          <v-list-subheader class="px-0">
            <b>Shippers</b>

            <template v-if="showFormActions">
              <v-btn
                color="primary"
                rounded
                size="small"
                class="ml-auto"
                @click="mostrarDialogShippers"
                >AGREGAR SHIPPER</v-btn
              >
            </template>
          </v-list-subheader>
          <v-row>
            <v-col cols="12">
              <v-form ref="formShippers" :readonly="isFormReadonly">
                <v-data-table
                  :headers="headersShippers"
                  :items="entitiesStore.lstShippers"
                  class="elevation-5"
                  item-value="index"
                  disable-sort
                >
                  <template v-slot:[`item.correlativo`]="{ item, index }">
                    PR-{{ item.correlativo }}
                  </template>
                  <template
                    v-slot:[`item.action`]="{ item, index }"
                    v-if="showFormActions"
                  >
                    <v-btn variant="text" icon color="red" @click="eliminarShipper(index)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                </v-data-table>
              </v-form>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions v-if="showNavigationButtons">
        <v-btn color="primary" @click="entitiesStore.stepper--"
          >Regresar</v-btn
        >
        <v-btn color="primary" class="ml-auto" @click="validarFormulario"
          >Continuar</v-btn
        >
      </v-card-actions>
    </v-card>

    <!--DIALOG SHIPPERS-->
    <v-dialog
      v-model="dialogShippers"
      scrollable
      persistent
      max-width="60%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title primary-title> Seleccionar Shipper </v-card-title>
        <v-card-text class="pt-2">
          <v-text-field label="Buscar" density="compact" v-model="search"></v-text-field>
          <v-data-table
            :headers="headersProveedoresRolShipper"
            :items="$store.state.itemsProveedorRolShipper"
            fixed-header
            class="elevation-1"
            v-model="lstSelectedShippers"
            item-value="id"
            return-object
            show-select
            :search="search"
            :loading="loading"
            @click:row="(event, { internalItem, toggleSelect }) => toggleSelect(internalItem)"
          >
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn rounded color="success" @click="aceptar">Aceptar</v-btn>
          <v-btn rounded color="error" @click="cancelar">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useEntitiesStore } from "@/stores/entities";
export default {
  name: "SeccionShippers",
  data() {
    return {
      loading: false,
      headersShippers: [
        { title: "Código", key: "correlativo", width: "20%" },
        { title: "Shipper", key: "nombrecompleto", width: "40%" },
        { title: "Producto que vende", key: "producto", width: "30%" },
        { title: "Acciones", key: "action", width: "10%" },
      ],
      headersProveedoresRolShipper: [
        {
          title: "Razón Social/Nombre Comercial",
          key: "namelong",
          width: "35%",
        },
        { title: "Teléfono", key: "telefono", width: "30%" },
        { title: "Producto que vende", key: "producto", width: "35%" },
      ],
      search: "",
      dialogShippers: false,
      lstSelectedShippers: [],
    };
  },
  computed: {
    ...mapStores(useEntitiesStore),
    isFormReadonly() {
      return this.entitiesStore.isReadonly;
    },
    showFormActions() {
      return !this.entitiesStore.isReadonly;
    },
    showNavigationButtons() {
      return !(
        this.entitiesStore.isEdit ||
        this.entitiesStore.isReadonly
      );
    },
  },
  methods: {
    ...mapActions(["_getProveedorRolShipper"]),
    ...mapPiniaActions(useEntitiesStore, ["actualizarCliente"]),
    async mostrarDialogShippers() {
      var vm = this;

      vm.dialogShippers = !vm.dialogShippers;

      vm.loading = true;
      await vm._getProveedorRolShipper();
      vm.loading = false;
    },
    eliminarShipper(index) {
      this.entitiesStore.lstShippers.splice(index, 1);
    },
    aceptar() {
      var vm = this;
      if (vm.lstSelectedShippers.length) {
        vm.lstSelectedShippers.map((item) => {
          if (
            !vm.entitiesStore.lstShippers.filter(
              (v) => v.id_shipper == item.id,
            ).length
          ) {
            vm.entitiesStore.lstShippers.push({
              id_shipper: item.id,
              correlativo: item.correlativo,
              nombrecompleto: item.namelong,
              producto: item.producto,
            });
          }
        });

        vm.lstSelectedShippers.length = 0;
      }

      vm.dialogShippers = !vm.dialogShippers;
    },
    cancelar() {
      this.lstSelectedShippers.length = 0;
      this.dialogShippers = !this.dialogShippers;
    },
    async validarFormulario() {
      var vm = this;
      let ok = true;
      if (vm.entitiesStore.lstShippers.length > 0) {
        if (!(await vm.$refs.formShippers.validate()).valid) {
          ok = false;
        }
      }

      if (ok) {
        vm.entitiesStore.stepper = 6;
      }
    },
    async modificarCliente() {
      var vm = this;
      if (vm.isFormReadonly) {
        vm.entitiesStore.isReadonly = false;
        vm.entitiesStore.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los campos",
        });
        return;
      }

      vm.$store.state.spiner = true;
      await vm.actualizarCliente();
      vm.$store.state.spiner = false;
      vm.$store.state.recargarClienteFlag =
        !vm.$store.state.recargarClienteFlag;
      vm.$store.state.modalEntitie = false;

      vm.entitiesStore.isReadonly = true;
      vm.entitiesStore.isEdit = false;
    },
  },
};
</script>

<style>
tr.selected {
  background: #ffccab !important;
}
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
