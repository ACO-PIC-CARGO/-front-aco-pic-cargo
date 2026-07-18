<template>
  <v-card>
    <v-card-title class="px-2 container-narrow">
      <v-spacer></v-spacer>
      <v-btn
        v-if="!showNavigationButtons"
        color="light-blue darken-2"
        class="ma-2"
        dark
        small
        @click="modificarCliente"
      >
        <v-icon left small>mdi-account-edit</v-icon>
        {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-title>
    <v-card-text class="px-2">
      <div class="container-narrow">
        <!-- ===== TELÉFONOS PROVEEDOR ===== -->
        <v-subheader class="px-0">
          <b>Teléfono Principal</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              small
              class="ml-auto"
              @click="agregarTelefono()"
              >Agregar Teléfono</v-btn
            >
          </template>
        </v-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formTelefonos" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersTelefonos"
                :items="$store.state.entities.lstTelefonos"
                item-key="index"
                class="elevation-5"
                disable-sort
              >
                <template v-slot:[`item.id_tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.masterusuarios.lstTipoTelefono"
                    item-text="descripcion"
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
                  <v-btn icon color="red" @click="eliminarTelefono(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>
          </v-col>
        </v-row>

        <br />

        <!-- ===== CONTACTOS ===== -->
        <v-subheader class="px-0">
          <b>Contactos</b>

          <template v-if="showFormActions">
            <v-btn
              color="primary"
              rounded
              small
              class="ml-auto"
              @click="agregarContacto()"
              >Agregar Contacto</v-btn
            >
          </template>
        </v-subheader>
        <v-row>
          <v-col cols="12">
            <v-form ref="formContactos" :readonly="isFormReadonly">
              <v-data-table
                :headers="headersContactos"
                :items="$store.state.entities.lstContactos"
                item-key="index"
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
                    :items="$store.state.masterusuarios.lstTipoTelefono"
                    item-text="descripcion"
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
                  <v-btn icon color="red" @click="eliminarContacto(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-form>

            <v-subheader class="px-0">
              <b>Emails</b>
              <template v-if="showFormActions">
                <v-btn
                  color="primary"
                  rounded
                  small
                  class="ml-auto"
                  @click="agregarEmail()"
                  >Agregar Email</v-btn
                >
              </template>
            </v-subheader>

            <v-row>
              <v-col cols="12">
                <v-form ref="formProv_email" :readonly="isFormReadonly">
                  <v-data-table
                    :headers="headersEmails"
                    :items="
                      $store.state.entities.lstEmails.filter(
                        (v) => !!v && v.estado,
                      )
                    "
                    item-key="index"
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
                      <v-btn icon color="red" @click="eliminarEmail(item)">
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
      <v-btn color="primary" @click="$store.state.entities.stepper--"
        >Regresar</v-btn
      >
      <v-btn color="primary" class="ml-auto" @click="validarFormulario"
        >Continuar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  name: "SeccionTelefonos",
  data() {
    return {
      headersTelefonos: [
        { text: "Tipo de Teléfono", value: "id_tipotelefono", width: "35%" },
        { text: "Nro Teléfono", value: "nro_telefono", width: "50%" },
        { text: "Acciones", value: "action", width: "15%" },
      ],
      headersContactos: [
        { text: "Nombres", value: "nombre", width: "35%" },
        { text: "Tipo de Teléfono", value: "id_tipotelefono", width: "25%" },
        { text: "Nro Teléfono", value: "nro_telefono", width: "25%" },
        { text: "Acciones", value: "action", width: "15%" },
      ],
      headersEmails: [
        { text: "Descripción", value: "description", width: "35%" },
        { text: "Email", value: "email", width: "25%" },
        // { text: "Nro Teléfono", value: "nro_telefono", width: "25%" },
        { text: "Acciones", value: "action", width: "15%" },
      ],
    };
  },
  computed: {
    isFormReadonly() {
      return this.$store.state.entities.isReadonly;
    },
    showFormActions() {
      return !this.$store.state.entities.isReadonly;
    },
    showNavigationButtons() {
      return !(
        this.$store.state.entities.isEdit ||
        this.$store.state.entities.isReadonly
      );
    },
  },
  methods: {
    ...mapActions(["actualizarCliente"]),
    agregarTelefono() {
      this.$store.state.entities.lstTelefonos.push({
        id_tipotelefono: "",
        telefono: "",
      });
    },
    getPrefix() {
      let pais = this.$store.state.itemsPais.find(
        (v) => v.id == this.$store.state.entities.cliente.id_pais,
      );
      if (pais) {
        return pais.phoneprefix;
      }
      return "+xx";
    },
    obtenerFlag() {
      let pais = this.$store.state.itemsPais.find(
        (v) => v.id == this.$store.state.entities.cliente.id_pais,
      );
      let flag = "";
      if (pais) {
        flag = `https://flagcdn.com/w40/${pais.codigo_iso.toLowerCase()}.png`;
      }
      return flag;
    },
    eliminarTelefono(index) {
      this.$store.state.entities.lstTelefonos.splice(index, 1);
    },
    agregarContacto() {
      this.$store.state.entities.lstContactos.push({
        nombre: "",
        id_tipotelefono: "",
        telefono: "",
      });
    },
    eliminarContacto(index) {
      this.$store.state.entities.lstContactos.splice(index, 1);
    },
    validarFormulario() {
      var vm = this;
      let ok = true;
      if (
        vm.$store.state.entities.lstTelefonos.length === 0 ||
        vm.$store.state.entities.lstContactos.length === 0
      ) {
        Swal.fire({
          icon: "error",
          text: "Para avanzar al paso 3, es necesario agregar al menos un teléfono y un contacto",
        });

        ok = false;
      }

      if (!vm.$refs.formTelefonos.validate()) {
        ok = false;
      }
      if (!vm.$refs.formContactos.validate()) {
        ok = false;
      }

      if (ok) {
        vm.$store.state.entities.stepper = 3;
      }
    },
    agregarEmail() {
      this.$store.state.entities.lstEmails.push({
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
        vm.$store.state.entities.isReadonly = false;
        vm.$store.state.entities.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los campos",
        });
        return;
      }

      vm.$store.state.entities.isStep1Valid = true;
      vm.$store.state.entities.isStep2Valid = true;
      vm.$store.state.entities.isStep3Valid = true;
      vm.$store.state.entities.isStep4Valid = true;

      let okStep2_1 = true;
      if (vm.$store.state.entities.lstTelefonos.length > 0) {
        vm.$store.state.entities.lstTelefonos.map((v) => {
          if (!v.id_tipotelefono || !v.telefono) {
            okStep2_1 = false;
          }
        });
      }

      let okStep2_2 = true;
      if (vm.$store.state.entities.lstContactos.length > 0) {
        vm.$store.state.entities.lstContactos.map((v) => {
          if (!v.nombre || !v.id_tipotelefono || !v.telefono) {
            okStep2_2 = false;
          }
        });
      }

      if (!okStep2_1 || !okStep2_2) {
        vm.$store.state.entities.isStep2Valid = false;
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
        vm.$store.state.entities.isReadonly = true;
        vm.$store.state.entities.isEdit = false;
      }
    },
  },
  watch: {
    "$store.state.entities.isStep2Valid": {
      handler(newValue) {
        if (!newValue) {
          this.$refs.formTelefonos.validate();
          this.$refs.formContactos.validate();
        }
      },
      immediate: true,
    },
    "$store.state.entities.lstTelefonos": {
      handler(newValue) {
        if (newValue[0]) {
          this.$store.state.entities.cliente.telefonoActual = newValue[0];
        }
      },
      deep: true,
    },
    "$store.state.entities.lstContactos": {
      handler(newValue) {
        if (newValue[0]) {
          this.$store.state.entities.cliente.contactoActual = newValue[0];
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
