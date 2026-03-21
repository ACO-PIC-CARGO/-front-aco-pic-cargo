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
        @click="modificarProveedor"
      >
        <v-icon left small>mdi-account-edit</v-icon>
        {{ isFormReadonly ? 'EDITAR PROVEEDOR' : 'GUARDAR CAMBIOS' }}
      </v-btn>
    </v-card-title>
    <v-card-text>
      <div class="container-narrow">
      <v-form ref="formProv_datosProveedor" :readonly="isFormReadonly">
        <v-row>
          <v-col cols="12">
            <!--<v-row>
              <v-col cols="12">
                <v-text-field dense label="Nombre Comercial o Razón Social" :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => (v && v.length >= 3) || 'Debe tener al menos 3 caracteres'
                ]" v-model="$store.state.entities.proveedor.nombrecompleto"></v-text-field>
              </v-col>
            </v-row>-->

            <!--CUSTOM AUTOCOMPLETE-->
            <v-subheader class="px-0 font-weight-bold">Identificación del Proveedor</v-subheader>
            <v-row>
              <v-col cols="12">
                <CustomAutocomplete
                  :items="$store.state.entities.lstProveedores_x_nombre"
                  label="Nombre Comercial o Razón Social"
                  :value="$store.state.entities.proveedor.nombrecompleto"
                  v-on:search="handleNombre"
                  v-on:id="handleEditarProveedor"
                  :loading="isNombreLoading"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  :disabled="false"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  dense
                  outlined
                  :items="$store.state.itemsDataRoleList"
                  item-text="name"
                  item-value="id"
                  label="Tipo de Proveedor"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="$store.state.entities.proveedor.id_tipoproveedor"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  dense
                  outlined
                  :items="$store.state.masterusuarios.lstTipoTransaccion"
                  item-text="descripcion"
                  item-value="id"
                  label="Nacional / Extranjero"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="$store.state.entities.proveedor.id_tipotransaccion"
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-subheader class="px-0 font-weight-bold mt-2">Documento Fiscal</v-subheader>
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  dense
                  outlined
                  :items="$store.state.itemsDocumentsPais"
                  item-text="description"
                  item-value="id"
                  label="Tipo de Documento Fiscal"
                  v-model="$store.state.entities.proveedor.id_tipodocumento"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <!--<v-text-field 
                  dense 
                  label="Nro De Documento" 
                  v-model="$store.state.entities.proveedor.nro_documento"
                  :disabled="isNroDocumentoDisabled"
                ></v-text-field>-->
                <CustomAutocomplete
                  :items="$store.state.entities.lstProveedores_x_documento"
                  label="Nro De Documento"
                  :value="$store.state.entities.proveedor.nro_documento"
                  v-on:search="handleDocumento"
                  v-on:id="handleEditarProveedor"
                  :loading="isDocumentoLoading"
                  :disabled="isNroDocumentoDisabled"
                />
              </v-col>
            </v-row>
            <v-subheader class="px-0 font-weight-bold mt-2">Ubicación y Contacto</v-subheader>
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  dense
                  outlined
                  item-text="name"
                  item-value="id"
                  :items="$store.state.itemsPais"
                  label="País"
                  @change="_getState($store.state.entities.proveedor.id_pais)"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="$store.state.entities.proveedor.id_pais"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  dense
                  outlined
                  :items="$store.state.itemsState"
                  item-text="name"
                  item-value="id"
                  label="Región / Estado"
                  v-model="$store.state.entities.proveedor.id_ciudad"
                ></v-autocomplete>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  dense
                  outlined
                  label="Dirección"
                  v-model="$store.state.entities.proveedor.direccion"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  dense
                  outlined
                  label="Correo Electrónico"
                  v-model="$store.state.entities.proveedor.emailaddress"
                  :rules="[(v) => validarCorreoElectronico(v)]"
                  :error-messages="correoErrors"
                ></v-text-field>
              </v-col>
            </v-row>

            <!--CONVENIO ACTUAL-->
            <v-subheader class="px-0 font-weight-bold mt-2">
              Convenio Actual
              <v-spacer></v-spacer>
              <v-file-input
                v-if="showFormActions"
                accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                label="Adjuntar Archivo"
                hide-input
                class="customFile"
                v-model="fileinput"
                @change="subirArchivoConvenio"
              ></v-file-input>
            </v-subheader>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  outlined
                  type="number"
                  suffix="días"
                  v-model="
                    $store.state.entities.proveedor.convenioActual.dias_credito
                  "
                  label="Días de Crédito para el Pago"
                  :rules="[
                    (v) => v >= 0 || 'Debe ser un número entero positivo',
                  ]"
                  @change="validarConvenioActual"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  outlined
                  type="date"
                  v-model="$store.state.entities.proveedor.convenioActual.fecha"
                  label="Fecha Convenio"
                  @change="validarConvenioActual"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  outlined
                  v-model="
                    $store.state.entities.proveedor.convenioActual.email_soporte
                  "
                  label="Email Soporte"
                  :rules="[(v) => validarCorreoElectronico(v)]"
                  :error-messages="correoConvenioActualErrors"
                  @change="validarConvenioActual"
                ></v-text-field>
              </v-col>
            </v-row>

            <!--TELÉFONO ACTUAL-->
            <v-subheader class="px-0 font-weight-bold mt-2">Teléfono Principal</v-subheader>
            <v-row>
              <v-col cols="12" md="6">
                <v-autocomplete
                  dense
                  outlined
                  :items="$store.state.masterusuarios.lstTipoTelefono"
                  item-text="descripcion"
                  item-value="id"
                  label="Tipo de Teléfono"
                  v-model="
                    $store.state.entities.proveedor.telefonoActual
                      .id_tipotelefono
                  "
                  @change="validarTelefonoActual"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  dense
                  outlined
                  label="Teléfono"
                  v-model="
                    $store.state.entities.proveedor.telefonoActual.telefono
                  "
                  @change="validarTelefonoActual"
                ></v-text-field>
              </v-col>
            </v-row>

            <!--CONTACTO ACTUAL-->
            <v-subheader class="px-0 font-weight-bold mt-2">Teléfono Adicional</v-subheader>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  outlined
                  label="Nombre"
                  v-model="
                    $store.state.entities.proveedor.contactoActual.nombre
                  "
                  @change="validarContactoActual"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                  dense
                  outlined
                  :items="$store.state.masterusuarios.lstTipoTelefono"
                  item-text="descripcion"
                  item-value="id"
                  label="Tipo de Teléfono"
                  v-model="
                    $store.state.entities.proveedor.contactoActual
                      .id_tipotelefono
                  "
                  @change="validarContactoActual"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  dense
                  outlined
                  label="Teléfono"
                  v-model="
                    $store.state.entities.proveedor.contactoActual.telefono
                  "
                  @change="validarContactoActual"
                ></v-text-field>
              </v-col>
            </v-row>

            <!--PRODUCTO QUE VENDE-->
            <v-subheader class="px-0 font-weight-bold mt-2">Producto</v-subheader>
            <v-row :disabled="isProductoDisabled">
              <v-col cols="12">
                <v-textarea
                  dense
                  outlined
                  rows="2"
                  label="Producto que vende"
                  :rules="[(v) => validarProducto(v)]"
                  :error-messages="productoErrors"
                  v-model="$store.state.entities.proveedor.producto"
                  
                ></v-textarea>
              </v-col>
            </v-row>

            <!--DÍAS LIBRES DE SOBREESTADÍA-->
            <v-subheader class="px-0 font-weight-bold mt-2">Condiciones del Servicio</v-subheader>
            <v-row v-show="showDiasSobreestadia">
              <v-col cols="12" md="6">
                <v-text-field
                  dense
                  outlined
                  type="number"
                  label="Días Libres de Sobreestadía"
                  :rules="[
                    (v) => v >= 0 || 'Debe ser un número entero positivo',
                  ]"
                  v-model="$store.state.entities.proveedor.dias_sobreestadia"
                ></v-text-field>
              </v-col>
            </v-row>

            <!--DÍAS LIBRES DE ALMACENAJE-->
            <v-row v-show="showDiasAlmacenaje">
              <v-col cols="12" md="6">
                <v-text-field
                  dense
                  outlined
                  type="number"
                  label="Días Libres de Almacenaje"
                  :rules="[
                    (v) => v >= 0 || 'Debe ser un número entero positivo',
                  ]"
                  v-model="$store.state.entities.proveedor.dias_almacenaje"
                ></v-text-field>
              </v-col>
            </v-row>

            <!--NOTAS-->
            <v-subheader class="px-0 font-weight-bold mt-2">Notas</v-subheader>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  dense
                  outlined
                  rows="3"
                  label="Comentarios / Notas Importantes"
                  v-model="$store.state.entities.proveedor.notas"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-form>
      </div>
    </v-card-text>
    <v-card-actions v-if="!showNavigationButtons" class="px-2 container-narrow">
      <v-spacer></v-spacer>
      <v-btn
        color="light-blue darken-2"
        class="ma-2"
        dark
        small
        @click="modificarProveedor"
      >
        <v-icon left small>mdi-account-edit</v-icon>
        {{ isFormReadonly ? 'EDITAR PROVEEDOR' : 'GUARDAR CAMBIOS' }}
      </v-btn>
    </v-card-actions>
    <v-card-actions v-if="showNavigationButtons">
      <v-btn color="primary" class="ml-auto" @click="validarFormulario"
        >Continuar</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import CustomAutocomplete from "../customAutocomplete.vue";
export default {
  name: "SeccionProveedor",
  components: {
    CustomAutocomplete,
  },
  props: {
    isPricing: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      showNombreCompleto: true,
      showNombreFiscal: false,
      telefonoErrors: "",
      correoErrors: "",
      correoConvenioActualErrors: "",
      productoErrors: "",
      isAutocompleteLoading: false,
      fileinput: null,
      isFileLoading: false,
      isNombreLoading: false,
      isDocumentoLoading: false,
    };
  },
  computed: {
    isNroDocumentoDisabled() {
      return !this.$store.state.entities.proveedor.id_tipodocumento;
    },
    isProductoDisabled() {
      return !this.isShipper();
    },
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
    showDiasSobreestadia() {
      return this.isNaviera();
    },
    showDiasAlmacenaje() {
      return this.isAlmacen();
    },
  },
  methods: {
    ...mapActions([
      "_getState",
      "cargarClientes",
      "validarNombreProveedor",
      "validarDocumentoProveedor",
      "_uploadFile",
      "actualizarProveedor",
    ]),
    isShipper() {
      let val = this.$store.state.itemsDataRoleList.some((v) => {
        const item = (v.name.split("-")[1] || "").trim().toUpperCase();
        return (
          v.id == this.$store.state.entities.proveedor.id_tipoproveedor &&
          item == "SHIPPER"
        );
      });

      return val;
    },
    isNaviera() {
      let val = this.$store.state.itemsDataRoleList.some((v) => {
        const item = (v.name.split("-")[1] || "").trim().toUpperCase();
        return (
          v.id == this.$store.state.entities.proveedor.id_tipoproveedor &&
          item == "NAVIERA"
        );
      });

      return val;
    },
    isAlmacen() {
      let val = this.$store.state.itemsDataRoleList.some((v) => {
        const item = (v.name.split("-")[1] || "").trim().toUpperCase();
        return (
          v.id == this.$store.state.entities.proveedor.id_tipoproveedor &&
          item == "ALMACEN"
        );
      });

      return val;
    },
    async handleNombre(val) {
      var vm = this;

      vm.$store.state.entities.lstProveedores_x_nombre = [];
      vm.$store.state.entities.proveedor.nombrecompleto = val;
      if (vm.$store.state.entities.proveedor.nombrecompleto) {
        vm.isNombreLoading = true;
        await this.validarNombreProveedor();
        vm.isNombreLoading = false;
      }
    },
    async handleDocumento(val) {
      var vm = this;

      vm.$store.state.entities.lstProveedores_x_documento = [];
      vm.$store.state.entities.proveedor.nro_documento = val;
      if (vm.$store.state.entities.proveedor.nro_documento) {
        vm.isDocumentoLoading = true;
        await this.validarDocumentoProveedor();
        vm.isDocumentoLoading = false;
      }
    },
    async handleEditarProveedor(val) {
      if (val) {
        this.$swal({
          icon: "question",
          html: "<b>¿Desea cargar los datos del proveedor seleccionado?</b>",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Si",
          cancelButtonText: "No",
        }).then((result) => {
          if (result.isConfirmed) {
            if (!this.isPricing) {
              this.$router.push({
                name: "editarProveedor",
                params: { id: val },
              });

              setTimeout(() => window.location.reload(), 10);
            } else {
              
              this.$emit("ObtenerProveedor", val);
            }
          }
        });
      }
    },
    validarCorreoElectronico(v) {
      if (
        v &&
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v
        )
      ) {
        return "Debe ingresar un correo electrónico válido";
      }

      return true;
    },
    validarProducto(v) {
      var vm = this;
      if (vm.isShipper() && !v) {
        return "Dato Requerido";
      }

      return true;
    },
    validarConvenioActual() {
      var vm = this;
      const { convenioActual } = vm.$store.state.entities.proveedor;
      if (convenioActual.dias_credito > 0) {
        if (!convenioActual.fecha) {
          vm.$swal({
            icon: "info",
            text: "Si desea agregar como convenio actual, es necesario llenar la fecha del convenio",
          });
        } else {
          if (
            vm.$store.state.entities.lstConvenios.indexOf(convenioActual) === -1
          ) {
            vm.$store.state.entities.lstConvenios.push(convenioActual);
          }
        }
      }
    },
    validarTelefonoActual() {
      var vm = this;
      const { telefonoActual } = vm.$store.state.entities.proveedor;
      if (telefonoActual.id_tipotelefono && telefonoActual.telefono) {
        const index = vm.$store.state.entities.lstTelefonos.findIndex(
          (v) =>
            v.id_tipotelefono == telefonoActual.id_tipotelefono &&
            v.telefono == telefonoActual.telefono
        );
        if (index === -1) {
          vm.$store.state.entities.lstTelefonos.push(telefonoActual);
        }
      }
    },
    validarContactoActual() {
      var vm = this;
      const { contactoActual } = vm.$store.state.entities.proveedor;
      if (
        contactoActual.nombre &&
        contactoActual.id_tipotelefono &&
        contactoActual.telefono
      ) {
        const index = vm.$store.state.entities.lstContactos.findIndex(
          (v) =>
            v.nombre == contactoActual.nombre &&
            v.id_tipotelefono == contactoActual.id_tipotelefono &&
            v.telefono == contactoActual.telefono
        );
        if (index === -1) {
          vm.$store.state.entities.lstContactos.push(contactoActual);
        }
      }
    },
    async subirArchivoConvenio() {
      var vm = this;

      if (vm.fileinput) {
        vm.isFileLoading = true;
        await vm._uploadFile(vm.fileinput);
        vm.isFileLoading = false;

        if (vm.$store.state.files.payPath) {
          vm.$swal({
            icon: "success",
            text: "Archivo cargado",
          });

          vm.$store.state.entities.lstConvenios.map((item) => {
            if (
              item.id == vm.$store.state.entities.proveedor.convenioActual.id
            ) {
              item["id_path"] = vm.$store.state.files.payPath;
            }

            return item;
          });
        } else {
          vm.$swal({
            icon: "error",
            text: "Comuníquese con el administrador",
          });
        }
      }
    },
    validarFormulario() {
      var vm = this;
      if (vm.$refs.formProv_datosProveedor.validate()) {
        vm.validarConvenioActual();
        vm.validarTelefonoActual();
        vm.validarContactoActual();

        vm.$store.state.entities.stepper = 2;
      }
    },
    isProveedorInternacional() {
      let val = this.$store.state.masterusuarios.lstTipoTransaccion.some((v) => {
        return (
          v.codigo == "02" &&
          v.id == this.$store.state.entities.proveedor.id_tipotransaccion
        );
      });
      return val;
    },
    async modificarProveedor() {
      var vm = this;

      // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
      if (vm.isFormReadonly) {
        vm.$store.state.entities.isReadonly = false;
        vm.$store.state.entities.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los datos del proveedor",
        });
        return;
      }

      vm.$store.state.entities.isStep1Valid = true;
      vm.$store.state.entities.isStep2Valid = true;
      vm.$store.state.entities.isStep3Valid = true;
      vm.$store.state.entities.isStep4Valid = true;

      let okStep1 = true;
      if (vm.$store.state.entities.proveedor) {
        if (!vm.$store.state.entities.proveedor.nombrecompleto) {
          okStep1 = false;
        }
        if (!vm.$store.state.entities.proveedor.id_tipoproveedor) {
          okStep1 = false;
        }
        if (!vm.$store.state.entities.proveedor.id_tipotransaccion) {
          okStep1 = false;
        }
        if (!vm.$store.state.entities.proveedor.id_pais) {
          okStep1 = false;
        }
        if (
          vm.$store.state.entities.proveedor.emailaddress &&
          !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            vm.$store.state.entities.proveedor.emailaddress
          )
        ) {
          okStep1 = false;
        }
      }

      let okStep2_1 = true;
      if (vm.$store.state.entities.lstTelefonos.length > 0) {
        vm.$store.state.entities.lstTelefonos.map((v) => {
          if (!v.id_tipotelefono) {
            okStep2_1 = false;
          }
          if (!v.telefono) {
            okStep2_1 = false;
          }
        });
      }

      let okStep2_2 = true;
      if (vm.$store.state.entities.lstContactos.length > 0) {
        vm.$store.state.entities.lstContactos.map((v) => {
          if (!v.nombre) {
            okStep2_2 = false;
          }
          if (!v.id_tipotelefono) {
            okStep2_2 = false;
          }
          if (!v.telefono) {
            okStep2_2 = false;
          }
        });
      }

      let okStep3_1 = true;
      if (vm.$store.state.entities.lstConvenios.length > 0) {
        vm.$store.state.entities.lstConvenios.map((v) => {
          if (!v.fecha) {
            okStep3_1 = false;
          }
          if (v.dias_credito < 0) {
            okStep3_1 = false;
          }
          if (
            v.email_soporte &&
            !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
              v.email_soporte
            )
          ) {
            okStep3_1 = false;
          }
        });
      }

      let okStep3_2 = true;
      if (vm.$store.state.entities.lstTarifas.length > 0) {
        vm.$store.state.entities.lstTarifas.map((v) => {
          if (!v.fecha) {
            okStep3_2 = false;
          }
          if (!v.codigo) {
            okStep3_2 = false;
          }
          if (
            v.email_soporte &&
            !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
              v.email_soporte
            )
          ) {
            okStep3_2 = false;
          }
          if (v.tarifa < 0) {
            okStep3_2 = false;
          }
        });
      }

      let okStep4 = true;
      if (vm.$store.state.entities.lstInformacionBancaria.length > 0) {
        vm.$store.state.entities.lstInformacionBancaria.map((v) => {
          if (!v.nro_cuenta) {
            okStep4 = false;
          }
          if (!v.cci) {
            okStep4 = false;
          }
          if (!v.id_banco) {
            okStep4 = false;
          }
          if (!v.id_coins) {
            okStep4 = false;
          }
          if (vm.isProveedorInternacional()) {
            if (!v.nro_swift) {
              okStep4 = false;
            }
            if (!v.id_intermediario) {
              okStep4 = false;
            }
            if (!v.nro_cuenta_intermediario) {
              okStep4 = false;
            }
          }
        });
      }

      if (!okStep1) {
        vm.$store.state.entities.isStep1Valid =
          !vm.$store.state.entities.isStep1Valid;
      } else if (!okStep2_1 || !okStep2_2) {
        vm.$store.state.entities.isStep2Valid =
          !vm.$store.state.entities.isStep2Valid;
      } else if (!okStep3_1 || !okStep3_2) {
        vm.$store.state.entities.isStep3Valid =
          !vm.$store.state.entities.isStep3Valid;
      } else if (!okStep4) {
        vm.$store.state.entities.isStep4Valid =
          !vm.$store.state.entities.isStep4Valid;
      } else {
        vm.$store.state.spiner = true;
        await vm.actualizarProveedor();
        vm.$store.state.spiner = false;

        // Volver a modo solo lectura después de guardar correctamente
        vm.$store.state.entities.isReadonly = true;
        vm.$store.state.entities.isEdit = false;
      }
    },
  },
  async mounted() {
    await this.cargarClientes();
    console.log("isPricing", this.isPricing);
  },
  watch: {
    "$store.state.entities.isStep1Valid": {
      handler(newValue) {
        if (!newValue) {
          this.$refs.formProv_datosProveedor.validate();
        }
      },
      immediate: true,
    },
  },
};
</script>

<style>
.customFile {
  flex-grow: 0 !important;
  flex-direction: row-reverse !important;
}
.customFile .v-input__prepend-outer {
  margin-right: 0;
}
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
