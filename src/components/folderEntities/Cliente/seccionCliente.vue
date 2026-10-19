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
    <v-card-text>
      <div class="container-narrow">
        <v-form ref="formDatosCliente" :readonly="isFormReadonly">
          <v-row>
            <v-col cols="12">
              <v-list-subheader class="px-0 font-weight-bold"
                >Identificación del Cliente</v-list-subheader
              >
              <v-row>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoPersona"
                    item-title="descripcion"
                    item-value="id"
                    label="Persona Natural / Empresa"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.id_tipopersona"
                    @update:model-value="toggleNombre"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoTransaccion"
                    item-title="descripcion"
                    item-value="id"
                    label="Nacional / Extranjero"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.id_tipotransaccion"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <!--<v-row v-if="showNombreCompleto">
              <v-col cols="12">
                <v-text-field dense label="Nombre Completo" :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="$store.state.entities.cliente.nombrecompleto" @blur="handleNombre"></v-text-field>                      
              </v-col>
            </v-row>
            <v-row v-if="showNombreFiscal">
              <v-col cols="12">
                <v-text-field dense label="Nombre Fiscal" :rules="[(v) => !!v || 'Dato Requerido']"
                  v-model="$store.state.entities.cliente.nombrecompleto" @blur="handleNombre"></v-text-field>
              </v-col>
            </v-row>-->
              <v-row v-if="showNombreFiscal">
                <v-col cols="12">
                  <v-text-field
                    density="compact"
                    label="Nombre Fiscal"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.nombrecompleto"
                    @blur="handleNombre"
                  ></v-text-field>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <CustomAutocomplete
                    :items="entitiesStore.lstProveedores_x_nombre"
                    :label="
                      showNombreCompleto ? 'Nombre Completo' : 'Nombre Fiscal'
                    "
                    :value="entitiesStore.cliente.nombrecompleto"
                    v-on:search="handleNombre"
                    v-on:id="handleEditarCliente"
                    :loading="isNombreLoading"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    :disabled="false"
                  />
                </v-col>
              </v-row>
              <v-list-subheader class="px-0 font-weight-bold mt-2"
                >Documento Fiscal</v-list-subheader
              >
              <v-row>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="filteredDocumentsPais"
                    item-title="description"
                    item-value="id"
                    label="Tipo de Documento Fiscal"
                    v-model="entitiesStore.cliente.id_tipodocumento"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
                  <!--<v-text-field 
                  dense 
                  label="Nro De Documento" 
                  v-model="$store.state.entities.cliente.nro_documento"
                  :disabled="isNroDocumentoDisabled"
                ></v-text-field>-->
                  <CustomAutocomplete
                    :items="entitiesStore.lstProveedores_x_documento"
                    label="Nro De Documento"
                    :value="entitiesStore.cliente.nro_documento"
                    v-on:search="handleDocumento"
                    v-on:id="handleEditarCliente"
                    :loading="isDocumentoLoading"
                    :disabled="isNroDocumentoDisabled"
                  />
                </v-col>
              </v-row>
              <v-list-subheader class="px-0 font-weight-bold mt-2"
                >Ubicación y Contacto</v-list-subheader
              >
              <v-row>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    item-title="name"
                    item-value="id"
                    :items="$store.state.itemsPais"
                    label="País"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    v-model="entitiesStore.cliente.id_pais"
                    @update:model-value="_getState(entitiesStore.cliente.id_pais)"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="$store.state.itemsState"
                    item-title="name"
                    item-value="id"
                    label="Región / Estado"
                    v-model="entitiesStore.cliente.id_ciudad"
                  ></v-autocomplete>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Dirección"
                    v-model="entitiesStore.cliente.direccion"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Correo Electrónico"
                    v-model="entitiesStore.cliente.emailaddress"
                    :rules="[(v) => validarCorreoElectronico(v)]"
                    :error-messages="correoErrors"
                  ></v-text-field>
                </v-col>
              </v-row>
              <!--CONVENIO ACTUAL-->
              <div class="d-flex align-center mt-2">
                <v-list-subheader class="px-0 font-weight-bold">
                  Convenio Actual
                </v-list-subheader>
                <v-spacer></v-spacer>
                <v-file-input
                  v-if="showFormActions"
                  accept=".xlsx,.xls,.doc,.docx,.ppt,.pptx,.txt,.pdf,.gif,.jpg,.jpeg,.png"
                  label="Adjuntar Archivo"
                  hide-input
                  class="customFile"
                  v-model="fileinput"
                  @update:model-value="subirArchivoConvenio"
                ></v-file-input>
              </div>
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    type="number"
                    suffix="días"
                    v-model="
                      entitiesStore.cliente.convenioActual.dias_credito
                    "
                    label="Días de Crédito para el Pago"
                    :rules="[
                      (v) =>
                        v >= 0 ||
                        'Es necesario que ponga un número entero positivo',
                    ]"
                    @change="validarConvenioActual"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    type="date"
                    v-model="entitiesStore.cliente.convenioActual.fecha"
                    label="Fecha Convenio"
                    @change="validarConvenioActual"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    v-model="
                      entitiesStore.cliente.convenioActual.email_soporte
                    "
                    label="Email Soporte"
                    :rules="[(v) => validarCorreoElectronico(v)]"
                    :error-messages="correoConvenioActualErrors"
                    @change="validarConvenioActual"
                  ></v-text-field>
                </v-col>
              </v-row>
              <!--TELÉFONO ACTUAL-->
              <v-list-subheader class="px-0 font-weight-bold mt-2"
                >Teléfono Principal</v-list-subheader
              >
              <v-row>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="
                      entitiesStore.cliente.telefonoActual
                        .id_tipotelefono
                    "
                    @update:model-value="validarTelefonoActual"
                    :error-messages="
                      !entitiesStore.cliente.telefonoActual
                        .id_tipotelefono
                        ? 'Dato Requerido'
                        : ''
                    "
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Teléfono"
                    v-model="
                      entitiesStore.cliente.telefonoActual.telefono
                    "
                    @change="validarTelefonoActual"
                    :error-messages="
                      !entitiesStore.cliente.telefonoActual.telefono
                        ? 'Dato Requerido'
                        : ''
                    "
                    :prefix="getPrefix()"
                    :style="{
                      backgroundImage: `url(${obtenerFlag()})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '20px 15px',
                      backgroundPosition: '4px center',
                      paddingLeft: '30px',
                    }"
                  ></v-text-field>
                </v-col>
              </v-row>
              <!--CONTACTO ACTUAL-->
              <v-list-subheader class="px-0 font-weight-bold mt-2"
                >Teléfono Adicional</v-list-subheader
              >
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    density="compact"
                    variant="outlined"
                    label="Nombre"
                    v-model="
                      entitiesStore.cliente.contactoActual.nombre
                    "
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="validarContactoActual"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="4">
                  <v-autocomplete
                    density="compact"
                    variant="outlined"
                    :items="masterusuariosStore.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="
                      entitiesStore.cliente.contactoActual
                        .id_tipotelefono
                    "
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @update:model-value="validarContactoActual"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    hide-details
                    density="compact"
                    variant="outlined"
                    label="Teléfono"
                    v-model="
                      entitiesStore.cliente.contactoActual.telefono
                    "
                    :rules="[(v) => !!v || 'Dato Requerido']"
                    @change="validarContactoActual"
                    :prefix="getPrefix()"
                    :style="{
                      backgroundImage: `url(${obtenerFlag()})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '20px 15px',
                      backgroundPosition: '4px center',
                      paddingLeft: '30px',
                    }"
                  ></v-text-field>
                </v-col>
              </v-row>
              <!--NOTAS-->
              <v-list-subheader class="px-0 font-weight-bold mt-2"
                >Notas</v-list-subheader
              >
              <v-row>
                <v-col cols="12">
                  <v-textarea
                    density="compact"
                    variant="outlined"
                    rows="3"
                    label="Comentarios / Notas Importantes"
                    v-model="entitiesStore.cliente.notas"
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
        color="light-blue-darken-2"
        class="ma-2"
        size="small"
        @click="modificarCliente"
      >
        <v-icon start size="small">mdi-account-edit</v-icon>
        {{ isFormReadonly ? "EDITAR CLIENTE" : "GUARDAR CAMBIOS" }}
      </v-btn>
    </v-card-actions>
    <v-card-actions v-if="showNavigationButtons">
      <v-btn color="primary" class="ml-auto" @click="validarFormulario"
        >Agregar Más</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import CustomAutocomplete from "../customAutocomplete.vue";
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useEntitiesStore } from "@/stores/entities";
export default {
  name: "SeccionCliente",
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
      telefonoErrors: "",
      correoErrors: "",
      correoConvenioActualErrors: "",
      isAutocompleteLoading: false,
      fileinput: null,
      isFileLoading: false,
      isNombreLoading: false,
      isDocumentoLoading: false,
    };
  },
  computed: {
    ...mapStores(useEntitiesStore, useMasterusuariosStore),
    isNroDocumentoDisabled() {
      return !this.entitiesStore.cliente.id_tipodocumento;
    },
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
    filteredDocumentsPais() {
      const all = this.$store.state.itemsDocumentsPais || [];
      const tipoPersona = this.masterusuariosStore.lstTipoPersona.find(
        (v) => v.id == this.entitiesStore.cliente.id_tipopersona,
      );

      if (!tipoPersona) return all;

      const norm = (s) => (s || "").toString().trim().toUpperCase();

      const isNatural = tipoPersona.descripcion === "Persona Natural";
      const isEmpresa = tipoPersona.descripcion === "Empresa";

      if (isNatural) {
        const naturalAllowed = new Set([
          "DNI",
          "CEDULA",
          "CÉDULA",
          "PASAPORTE",
          "TELEFONO",
          "TELÉFONO",
          "CARNET DE EXTRANJERIA",
          "CARNET DE EXTRANJERÍA",
          "CARNET DIPLOMATICO",
          "CARNET DIPLOMÁTICO",
        ]);
        return all.filter(
          (it) =>
            naturalAllowed.has(norm(it.name)) ||
            naturalAllowed.has(norm(it.description)),
        );
      }

      if (isEmpresa) {
        const isCombined = (it) => {
          const d = norm(it.description);
          const n = norm(it.name);
          return (
            d.includes("REGISTRO UNICO DE CONTRIBUYENTE") ||
            d.includes("REGISTRO ÚNICO DE CONTRIBUYENTE") ||
            n === "RUC/RIF" ||
            n === "RUC / RIF"
          );
        };

        const telefonoMatch = (it) => {
          const d = norm(it.description);
          const n = norm(it.name);
          return (
            n === "TELEFONO" ||
            n === "TELÉFONO" ||
            d === "TELEFONO" ||
            d === "TELÉFONO"
          );
        };

        const combinedItems = all.filter(isCombined);
        if (combinedItems.length) {
          return all
            .filter((it) => isCombined(it) || telefonoMatch(it))
            .map((it) =>
              isCombined(it)
                ? {
                    ...it,
                    description: "REGISTRO ÚNICO DE CONTRIBUYENTE (RUC/RIF)",
                  }
                : it,
            );
        }

        // Fallback to RUC/RIF separate entries if combined not present
        const isRucOrRif = (it) => {
          const n = norm(it.name);
          const d = norm(it.description);
          return n === "RUC" || n === "RIF" || d === "RUC" || d === "RIF";
        };
        return all
          .filter((it) => isRucOrRif(it) || telefonoMatch(it))
          .map((it) =>
            isRucOrRif(it)
              ? {
                  ...it,
                  description: "REGISTRO ÚNICO DE CONTRIBUYENTE (RUC/RIF)",
                }
              : it,
          );
      }

      return all;
    },
  },
  methods: {
    ...mapActions([
      "_getState",
      "cargarClientes",
      "_uploadFile",
    ]),
    ...mapPiniaActions(useEntitiesStore, ["validarNombreCliente", "validarDocumentoCliente", "actualizarCliente"]),
    setDocumentoFiscalByDefault(criterio = "") {
      var vm = this;

      const tipoDocumento = vm.getIDTipoDocumento(criterio);
      if (tipoDocumento) {
        vm.entitiesStore.cliente.id_tipodocumento = tipoDocumento;
      }
    },
    getIDTipoDocumento(criterio = "") {
      var vm = this;
      var id = null;

      const tipoDocumentoData = vm.$store.state.itemsDocumentsPais.find(
        (v) => v.name.toUpperCase() == criterio.toUpperCase(),
      );
      if (tipoDocumentoData) {
        id = tipoDocumentoData.id;
      }

      return id;
    },
    toggleNombre() {
      var vm = this;

      const tipoPersonaData =
        vm.masterusuariosStore.lstTipoPersona.find(
          (v) => v.id == vm.entitiesStore.cliente.id_tipopersona,
        );
      if (tipoPersonaData) {
        if (tipoPersonaData.descripcion == "Persona Natural") {
          vm.showNombreCompleto = true;
          vm.setDocumentoFiscalByDefault("DNI");
        } else if (tipoPersonaData.descripcion == "Empresa") {
          vm.showNombreCompleto = false;
          vm.setDocumentoFiscalByDefault("RUC");
        }
      }
    },
    async handleNombre(val) {
      var vm = this;

      vm.entitiesStore.lstProveedores_x_nombre = [];
      vm.entitiesStore.cliente.nombrecompleto = val;
      if (vm.entitiesStore.cliente.nombrecompleto) {
        vm.isNombreLoading = true;
        // await this.validarNombreCliente();
        vm.isNombreLoading = false;
      }
    },
    async handleDocumento(val) {
      var vm = this;

      vm.entitiesStore.lstProveedores_x_documento = [];
      vm.entitiesStore.cliente.nro_documento = val;
      if (vm.entitiesStore.cliente.nro_documento) {
        vm.isDocumentoLoading = true;
        await this.validarDocumentoCliente();
        vm.isDocumentoLoading = false;
      }
    },
    async handleEditarCliente(val) {
      if (val) {
        if (!this.isPricing) {
          this.$swal({
            icon: "question",
            html: "<b>¿Desea cargar los datos del cliente seleccionado?</b>",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si",
            cancelButtonText: "No",
          }).then((result) => {
            if (result.isConfirmed) {
              this.$router.push({
                name: "editarCliente",
                params: { id: val },
              });

              setTimeout(() => window.location.reload(), 10);
            }
          });
        } else {
          this.$swal({
            icon: "question",
            html: "<b>¿Desea cargar los datos del cliente seleccionado?</b>",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Si",
            cancelButtonText: "No",
          }).then((result) => {
            if (result.isConfirmed) {
              let item =
                this.entitiesStore.lstProveedores_x_nombre.filter(
                  (v) => v.id == val,
                )[0];
              this.$store.state.pricing.datosPrincipales.id_entitie = item.id;
              this.$store.state.pricing.datosPrincipales.nombre =
                item.nombrecompleto;
              this.$store.state.pricing.datosPrincipales.telefono =
                item.telefono;
              this.$store.state.modalEntitie = false;
              this.$store.state.registroClienteFlag =
                !this.$store.state.registroClienteFlag;
              // setTimeout(() => window.location.reload(), 10);
            }
          });
        }
      }
    },
    validarCorreoElectronico(v) {
      if (
        v &&
        !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          v,
        )
      ) {
        return "Debe ingresar un correo electrónico válido";
      }

      return true;
    },
    validarConvenioActual() {
      var vm = this;
      const { convenioActual } = vm.entitiesStore.cliente;
      if (convenioActual.dias_credito > 0) {
        if (!convenioActual.fecha) {
          vm.$swal({
            icon: "info",
            text: "Si desea agregar como convenio actual, es necesario llenar la fecha del convenio",
          });
        } else {
          if (
            vm.entitiesStore.lstConvenios.indexOf(convenioActual) === -1
          ) {
            vm.entitiesStore.lstConvenios.push(convenioActual);
          }
        }
      }
    },
    validarTelefonoActual() {
      var vm = this;
      const { telefonoActual } = vm.entitiesStore.cliente;
      if (telefonoActual.id_tipotelefono && telefonoActual.telefono) {
        const index = vm.entitiesStore.lstTelefonos.findIndex(
          (v) =>
            v.id_tipotelefono == telefonoActual.id_tipotelefono &&
            v.telefono == telefonoActual.telefono,
        );
        if (index === -1) {
          vm.entitiesStore.lstTelefonos.push(telefonoActual);
        }
      }
    },
    validarContactoActual() {
      var vm = this;
      const { contactoActual } = vm.entitiesStore.cliente;
      if (
        contactoActual.nombre &&
        contactoActual.id_tipotelefono &&
        contactoActual.telefono
      ) {
        const index = vm.entitiesStore.lstContactos.findIndex(
          (v) =>
            v.nombre == contactoActual.nombre &&
            v.id_tipotelefono == contactoActual.id_tipotelefono &&
            v.telefono == contactoActual.telefono,
        );
        if (index === -1) {
          vm.entitiesStore.lstContactos.push(contactoActual);
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

          vm.entitiesStore.lstConvenios.map((item) => {
            if (item.id == vm.entitiesStore.cliente.convenioActual.id) {
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
    async validarFormulario() {
      var vm = this;
      if ((await vm.$refs.formDatosCliente.validate()).valid) {
        vm.validarConvenioActual();
        vm.validarTelefonoActual();
        vm.validarContactoActual();

        vm.entitiesStore.stepper = 2;
      }
    },
    isClienteInternacional() {
      let val = this.masterusuariosStore.lstTipoTransaccion.some(
        (v) => {
          return (
            v.codigo == "02" &&
            v.id == this.entitiesStore.cliente.id_tipotransaccion
          );
        },
      );
      return val;
    },
    async modificarCliente() {
      var vm = this;

      // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
      if (vm.isFormReadonly) {
        vm.entitiesStore.isReadonly = false;
        vm.entitiesStore.isEdit = true;
        vm.$swal({
          icon: "info",
          text: "Ahora puede modificar los datos del cliente",
        });
        return;
      }

      vm.entitiesStore.isStep1Valid = true;
      vm.entitiesStore.isStep2Valid = true;
      vm.entitiesStore.isStep3Valid = true;
      vm.entitiesStore.isStep4Valid = true;
      vm.entitiesStore.isStep5Valid = true;
      vm.entitiesStore.isStep6Valid = true;

      let okStep1 = true;
      if (vm.entitiesStore.cliente) {
        if (!vm.entitiesStore.cliente.id_tipopersona) {
          okStep1 = false;
        }
        if (!vm.entitiesStore.cliente.nombrecompleto) {
          okStep1 = false;
        }
        if (!vm.entitiesStore.cliente.id_tipotransaccion) {
          okStep1 = false;
        }
        if (!vm.entitiesStore.cliente.id_pais) {
          okStep1 = false;
        }
        if (
          vm.entitiesStore.cliente.emailaddress &&
          !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            vm.entitiesStore.cliente.emailaddress,
          )
        ) {
          okStep1 = false;
        }
      }

      let okStep2_1 = true;
      if (vm.entitiesStore.lstTelefonos.length > 0) {
        vm.entitiesStore.lstTelefonos.map((v) => {
          if (!v.id_tipotelefono) {
            okStep2_1 = false;
          }
          if (!v.telefono) {
            okStep2_1 = false;
          }
        });
      }

      let okStep2_2 = true;
      if (vm.entitiesStore.lstContactos.length > 0) {
        vm.entitiesStore.lstContactos.map((v) => {
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
      if (vm.entitiesStore.lstConvenios.length > 0) {
        vm.entitiesStore.lstConvenios.map((v) => {
          if (!v.fecha) {
            okStep3_1 = false;
          }
          if (v.dias_credito < 0) {
            okStep3_1 = false;
          }
          if (
            v.email_soporte &&
            !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
              v.email_soporte,
            )
          ) {
            okStep3_1 = false;
          }
        });
      }

      let okStep3_2 = true;
      if (vm.entitiesStore.lstTarifas.length > 0) {
        vm.entitiesStore.lstTarifas.map((v) => {
          if (!v.fecha) {
            okStep3_2 = false;
          }
          if (!v.codigo) {
            okStep3_2 = false;
          }
          if (
            v.email_soporte &&
            !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
              v.email_soporte,
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
      if (vm.entitiesStore.lstInformacionBancaria.length > 0) {
        vm.entitiesStore.lstInformacionBancaria.map((v) => {
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
          if (vm.isClienteInternacional()) {
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
        vm.entitiesStore.isStep1Valid =
          !vm.entitiesStore.isStep1Valid;
      } else if (!okStep2_1 || !okStep2_2) {
        vm.entitiesStore.isStep2Valid =
          !vm.entitiesStore.isStep2Valid;
      } else if (!okStep3_1 || !okStep3_2) {
        vm.entitiesStore.isStep3Valid =
          !vm.entitiesStore.isStep3Valid;
      } else if (!okStep4) {
        vm.entitiesStore.isStep4Valid =
          !vm.entitiesStore.isStep4Valid;
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
    getPrefix() {
      let pais = this.$store.state.itemsPais.find(
        (v) => v.id == this.entitiesStore.cliente.id_pais,
      );
      if (pais) {
        return   pais.phoneprefix ;
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
  },
  async mounted() {
    await this.cargarClientes();
  },
  watch: {
    "entitiesStore.isStep1Valid": {
      async handler(newValue) {
        if (!newValue) {
          await this.$refs.formDatosCliente.validate();
        }
      },
      immediate: true,
    },
  },
  isPricing() {
    console.log("isPricing", this.isPricing);
  },
};
</script>

<style>
.customFile {
  flex-grow: 0 !important;
  flex-direction: row-reverse !important;
}
.customFile .v-input__prepend {
  margin-right: 0;
}
.container-narrow {
  max-width: 1100px;
  margin: 0 auto;
}
</style>
