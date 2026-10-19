<template>
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
        <!-- ===== TELÉFONOS PROVEEDOR ===== -->
        <v-list-subheader class="px-0">
          <b>Teléfono Principal</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarTelefono()"
              >Agregar Teléfono</v-btn
            >
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formTelefonos" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersTelefonos"
                :items="entitiesStore.lstTelefonos"
                item-value="index"
                class="elevation-5"
                disable-sort
              >
                <template v-slot:[`item.id_tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    v-model="item.id_tipotelefono"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  >
                  </v-autocomplete>
                </template>
                <template v-slot:[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) =>
                        /^\d+$/.test(v) || 'Formato de teléfono incorrecto',
                    ]"
                    :prefix="getPrefix()"
                    :style="{
                      backgroundImage: `url(${obtenerFlag()})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '20px 15px',
                      backgroundPosition: '4px center',
                      paddingLeft: '30px',
                    }"
                  ></v-text-field>
                </template>
                <template
                  v-slot:[`item.action`]="{ item, index }"
                  v-if="showFormActions"
                >
                  <v-btn variant="text" icon color="red" @click="eliminarTelefono(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
          </v-col>
        </v-row>

        <br />

        <!-- ===== CONTACTOS ===== -->
        <v-list-subheader class="px-0">
          <b>Contactos</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              size="small"
              class="ml-auto"
              @click="agregarContacto()"
              >Agregar Contacto</v-btn
            >
          </template>
        </v-list-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formContactos" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersContactos"
                :items="entitiesStore.lstContactos"
                item-value="index"
                class="elevation-5"
              >
                <template v-slot:[`item.nombre`]="{ item }">
                  <v-text-field
                    v-model="item.nombre"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :error-messages="item.errornombre"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.id_tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    v-model="item.id_tipotelefono"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :error-messages="item.errorTipoTelf"
                  >
                  </v-autocomplete>
                </template>
                <template v-slot:[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) =>
                        /^\d+$/.test(v) || 'Formato de teléfono incorrecto',
                    ]"
                    :error-messages="item.errorTelefono"
                    :prefix="getPrefix()"
                    :style="{
                      backgroundImage: `url(${obtenerFlag()})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '20px 15px',
                      backgroundPosition: '4px center',
                      paddingLeft: '30px',
                    }"
                  ></v-text-field>
                </template>
                <template
                  v-slot:[`item.action`]="{ item, index }"
                  v-if="showFormActions"
                >
                  <v-btn variant="text" icon color="red" @click="eliminarContacto(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>

            <v-list-subheader class="px-0">
              <b>Emails</b>
              <template v-if="showFormActions">
                <v-btn
                  color="primary"
                  rounded
                  size="small"
                  class="ml-auto"
                  @click="agregarEmail()"
                  >Agregar Email</v-btn
                >
              </template>
            </v-list-subheader>

            <v-row>
              <v-col cols="12">
                <v-form ref="formProv_email" :readonly="isFormReadonly">
                  <v-data-table
                    :headers="headersEmails"
                    :items="
                      entitiesStore.lstEmails.filter(
                        (v) => !!v && v.estado,
                      )
                    "
                    item-value="index"
                    class="elevation-5"
                  >
                    <template v-slot:[`item.description`]="{ item }">
                      <v-text-field
                        v-model="item.description"
                        :rules="[(v) => !!v || 'Dato Requerido']"
                        :error-messages="item.errornombre"
                      ></v-text-field>
                    </template>
                    <template v-slot:[`item.email`]="{ item }">
                      <v-text-field
                        v-model="item.email"
                        :rules="[
                          (v) => !!v || 'Dato Requerido',
                          (v) =>
                            /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(
                              v,
                            ) || 'Email no válido',
                        ]"
                        :error-messages="item.errornombre"
                      ></v-text-field>
                    </template>

                    <template
                      v-slot:[`item.action`]="{ item, index }"
                      v-if="showFormActions"
                    >
                      <v-btn variant="text" icon color="red" @click="eliminarEmail(item)">
                        <v-icon>mdi-delete</v-icon>
                      </v-btn>
                    </template>
                  </v-data-table>
                </v-form>
              </v-col>
            </v-row>
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
</template>

<script>
import Swal from "sweetalert2";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEntitiesStore } from "@/stores/entities";
export default {
  name: "SeccionTelefonos",
  data() {
    return {
      headersTelefonos: [
        { title: "Tipo de Teléfono", key: "id_tipotelefono", width: "35%" },
        { title: "Nro Teléfono", key: "nro_telefono", width: "50%" },
        { title: "Acciones", key: "action", width: "15%" },
      ],
      headersContactos: [
        { title: "Nombres", key: "nombre", width: "35%" },
        { title: "Tipo de Teléfono", key: "id_tipotelefono", width: "25%" },
        { title: "Nro Teléfono", key: "nro_telefono", width: "25%" },
        { title: "Acciones", key: "action", width: "15%" },
      ],
      headersEmails: [
        { title: "Descripción", key: "description", width: "35%" },
        { title: "Email", key: "email", width: "25%" },
        // { text: "Nro Teléfono", value: "nro_telefono", width: "25%" },
        { title: "Acciones", key: "action", width: "15%" },
      ],
    };
  },
  computed: {
    ...mapStores(useEntitiesStore, useMasterusuariosStore),
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
    ...mapPiniaActions(useEntitiesStore, ["actualizarCliente"]),
    agregarTelefono() {
      this.entitiesStore.lstTelefonos.push({
        id_tipotelefono: "",
        telefono: "",
      });
    },
    getPrefix() {
      let pais = this.$store.state.itemsPais.find(
        (v) => v.id == this.entitiesStore.cliente.id_pais,
      );
      if (pais) {
        return pais.phoneprefix;
      }
      return "+xx";
    },
    obtenerFlag() {
      let pais = this.$store.state.itemsPais.find(
        (v) => v.id == this.entitiesStore.cliente.id_pais,
      );
      let flag = "";
      if (pais) {
        flag = `https://flagcdn.com/w40/${pais.codigo_iso.toLowerCase()}.png`;
      }
      return flag;
    },
    eliminarTelefono(index) {
      this.entitiesStore.lstTelefonos.splice(index, 1);
    },
    agregarContacto() {
      this.entitiesStore.lstContactos.push({
        nombre: "",
        id_tipotelefono: "",
        telefono: "",
      });
    },
    eliminarContacto(index) {
      this.entitiesStore.lstContactos.splice(index, 1);
    },
    async validarFormulario() {
      var vm = this;
      let ok = true;
      if (
        vm.entitiesStore.lstTelefonos.length === 0 ||
        vm.entitiesStore.lstContactos.length === 0
      ) {
        Swal.fire({
          icon: "error",
          text: "Para avanzar al paso 3, es necesario agregar al menos un teléfono y un contacto",
        });

        ok = false;
      }

      if (!(await vm.$refs.formTelefonos.validate()).valid) {
        ok = false;
      }
      if (!(await vm.$refs.formContactos.validate()).valid) {
        ok = false;
      }

      if (ok) {
        vm.entitiesStore.stepper = 3;
      }
    },
    agregarEmail() {
      this.entitiesStore.lstEmails.push({
        id: null,
        description: "",
        email: "",
        estado: true,
      });
    },
    eliminarEmail(item) {
      item.estado = false;
    },
    async modificarCliente() {
      var vm = this;

      // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
      if (vm.isFormReadonly) {
        vm.entitiesStore.isReadonly = false;
        vm.entitiesStore.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los campos",
        });
        return;
      }

      vm.entitiesStore.isStep1Valid = true;
      vm.entitiesStore.isStep2Valid = true;
      vm.entitiesStore.isStep3Valid = true;
      vm.entitiesStore.isStep4Valid = true;

      let okStep2_1 = true;
      if (vm.entitiesStore.lstTelefonos.length > 0) {
        vm.entitiesStore.lstTelefonos.map((v) => {
          if (!v.id_tipotelefono || !v.telefono) {
            okStep2_1 = false;
          }
        });
      }

      let okStep2_2 = true;
      if (vm.entitiesStore.lstContactos.length > 0) {
        vm.entitiesStore.lstContactos.map((v) => {
          if (!v.nombre || !v.id_tipotelefono || !v.telefono) {
            okStep2_2 = false;
          }
        });
      }

      if (!okStep2_1 || !okStep2_2) {
        vm.entitiesStore.isStep2Valid = false;
        this.$swal({
          icon: "warning",
          text: "Por favor complete todos los campos requeridos en Teléfonos y Contactos",
        });
      } else {
        vm.$store.state.spiner = true;
        await vm.actualizarCliente();
        vm.$store.state.spiner = false;
        vm.$store.state.recargarClienteFlag =
          !vm.$store.state.recargarClienteFlag;
        vm.$store.state.modalEntitie = false;

        // Volver a modo solo lectura después de guardar correctamente
        vm.entitiesStore.isReadonly = true;
        vm.entitiesStore.isEdit = false;
      }
    },
  },
  watch: {
    "entitiesStore.isStep2Valid": {
      async handler(newValue) {
        if (!newValue) {
          await this.$refs.formTelefonos.validate();
          await this.$refs.formContactos.validate();
        }
      },
      immediate: true,
    },
    "entitiesStore.lstTelefonos": {
      handler(newValue) {
        if (newValue[0]) {
          this.entitiesStore.cliente.telefonoActual = newValue[0];
        }
      },
      deep: true,
    },
    "entitiesStore.lstContactos": {
      handler(newValue) {
        if (newValue[0]) {
          this.entitiesStore.cliente.contactoActual = newValue[0];
        }
      },
      deep: true,
    },
  },
};
</script>

<style>
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
