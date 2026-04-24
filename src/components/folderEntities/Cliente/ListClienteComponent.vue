<template>
  <v-container fluid>
    <v-row>
      <v-col cols="6">
        <v-btn
          rounded
          small
          class="mx-1"
          color="success"
          @click="cambiarRuta({ nameRuta: 'nuevoClientes' })"
        >
          NUEVO
        </v-btn>
        <v-btn
          rounded
          small
          class="mx-1"
          color="secondary"
          @click="
            $store.state.entities.filtrarProveedor =
              !$store.state.entities.filtrarProveedor
          "
        >
          FILTRAR
        </v-btn>
        <v-btn
          rounded
          small
          class="mx-1"
          color="warning"
          @click="exportCliente()"
          >EXPORTAR</v-btn
        >
      </v-col>
      <v-col cols="6">
        <v-spacer></v-spacer>
        <v-text-field
          name="Buscar"
          label="Buscar"
          v-model="search"
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="$store.state.entities.lstProveedor"
          item-key="id"
          :search="search"
        >
          <template v-slot:[`item.documento`]="{ item }">
            {{ item.acronym_document }}-{{ item.document }}
          </template>
          <template v-slot:[`item.ubigeo`]="{ item }">
            {{
              item.pais && item.city
                ? item.pais.concat("-", item.city)
                : item.pais || item.city
            }}
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <v-btn-toggle>
              <v-btn x-small icon @click="obtenerTelContactoProveedor(item)">
                <v-icon color="blue-grey darken-3">mdi-phone</v-icon>
              </v-btn>
              <!-- <v-btn x-small icon @click="editar(item.id)">
                <v-icon color="green">mdi-currency-usd</v-icon>
              </v-btn> -->
              <v-btn
                v-if="item.status == 1"
                x-small
                icon
                @click="irAEditar(item)"
              >
                <v-icon color="#E65100">mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                x-small
                icon
                @click="
                  $router.push({
                    name: 'verCliente',
                    params: { id: item.id },
                  })
                "
              >
                <v-icon color="info">mdi-eye</v-icon>
              </v-btn>
              <v-btn x-small icon v-if="item.status == 1">
                <v-icon color="red" @click="eliminar(item)">mdi-delete</v-icon>
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
        <v-card-title>
          Teléfonos y Contactos: {{ nombrecompleto }}
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="10">
              <v-subheader> <b>Teléfonos:</b> <br /> </v-subheader>
            </v-col>

            <v-col cols="12">
              <v-data-table
                :headers="headersTel"
                :items="$store.state.entities.lstTelefono"
                item-key="id"
                class="elevation-5"
              >
                <template v-slot:[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.masterusuarios.lstTipoTelefono"
                    item-text="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    :error-messages="item.errorTipoTelf"
                    readonly
                  >
                  </v-autocomplete>
                </template>
                <template v-slot:[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.action`]="{ item, index }">
                  <v-btn icon color="red" @click="eliminarTelefono(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>

            <!-- -------------------------------- -->
            <v-col cols="10">
              <v-subheader><b>Contactos</b></v-subheader>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headersContact"
                :items="$store.state.entities.lstContactos"
                item-key="index"
                class="elevation-5"
              >
                <template v-slot:[`item.nombre`]="{ item }">
                  <v-text-field
                    v-model="item.nombre"
                    readonly
                    :error-messages="item.errornombre"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.masterusuarios.lstTipoTelefono"
                    item-text="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    readonly
                    :error-messages="item.errorTipoTelf"
                  >
                  </v-autocomplete>
                </template>
                <template v-slot:[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                    v-on:blur="validarFormularioTelefonoContacto()"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.action`]="{ item, index }">
                  <v-btn icon color="red" @click="eliminarContacto(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="mx-1"
            color="success"
            @click="dialogTelCont = !dialogTelCont"
            >Cerrar</v-btn
          >
          <!-- <v-btn class="mx-1" color="red" dark>Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogAdminAuth" max-width="400" persistent>
      <v-card>
        <v-card-title class="headline grey lighten-2">
          Autenticación Requerida
        </v-card-title>
        <v-card-text class="pt-4">
          <div v-html="msg"></div>
          <p class="mb-4">
            Ingrese las credenciales de administrador para continuar.
          </p>
          <v-text-field
            v-model="adminUser"
            label="Usuario o Email"
            prepend-icon="mdi-account"
            outlined
            dense
          ></v-text-field>
          <v-text-field
            v-model="adminPassword"
            label="Contraseña"
            prepend-icon="mdi-lock"
            :type="showAdminPassword ? 'text' : 'password'"
            :append-icon="showAdminPassword ? 'mdi-eye' : 'mdi-eye-off'"
            @click:append="showAdminPassword = !showAdminPassword"
            outlined
            dense
          ></v-text-field>
          <v-alert v-if="adminAuthError" type="error" dense class="mt-2">
            {{ adminAuthError }}
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="cerrarDialogAdminAuth()">
            Cancelar
          </v-btn>
          <v-btn
            color="success"
            :loading="adminAuthLoading"
            @click="validarAdminAuth()"
          >
            Ingresar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
import axios from "axios";
export default {
  data() {
    return {
      dialogAdminAuth: false,
      adminAuthLoading: false,
      adminUser: "",
      adminPassword: "",
      showAdminPassword: false,
      dialogTelCont: false,
      search: "",
      filtroflag: true,
      nombrecompleto: "",
      id: null,
      adminAuthError: "",
      msg: "",
      headers: [
        { text: "Correlativo", value: "correlativo" },
        { text: "Documento", value: "documento" },
        { text: "Nombre Completo", value: "nombrecompleto" },
        { text: "Ubigeo", value: "ubigeo" },
        { text: "Dirección", value: "address" },
        { text: "Estado", value: "estado" },
        { text: "Acciones", value: "action" },
      ],
      headersTel: [
        { text: "Tipo de Teléfono", value: "tipotelefono", width: "30%" },
        { text: "Nro Teléfono", value: "nro_telefono", width: "50%" },
      ],
      headersContact: [
        { text: "Nombres", value: "nombre" },
        { text: "Tipo de Teléfono", value: "tipotelefono" },
        { text: "Nro Teléfono", value: "nro_telefono" },
      ],
    };
  },
  methods: {
    ...mapActions([
      "getListClientes",
      "_getDocumentsPais",
      "cargarMasterDetalleTipoProveedor",
      "_getPais",
      "_getState",
      "_getRole",
      "cambioURL",
      "eliminarPersona",
      "telConctactoProveedor",
      "cargarTipoTelefono",
      "exportListClientes",
      "validarClienteTieneMovimientos",
    ]),
    cambiarRuta({ nameRuta = "", idProveedor = "" }) {
      this.$router.push({
        name: nameRuta,
        paramas: {
          id: idProveedor,
        },
      });
    },
    async eliminar(item) {
      let val = await this.validarClienteTieneMovimientos({ id: item.id });
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
          let data = { id: item.id };
          await this.eliminarPersona(data);
          await this.getListClientes();
        }
      });
    },
    async irAEditar(item) {
      let val = await this.validarClienteTieneMovimientos({ id: item.id });
      console.log("validarClienteTieneMovimientos", val);
      if (!val.estadoflag) {
        this.id = item.id;
        this.dialogAdminAuth = true;
        this.msg = val.mensaje;
        return;
      } else {
        this.$router.push({
          name: "editarCliente",
          params: { id: item.id },
        });
      }
    },
    cerrarDialogAdminAuth() {
      this.dialogAdminAuth = false;
      this.adminUser = "";
      this.adminPassword = "";
      this.adminAuthError = "";
    },
    async validarAdminAuth() {
      this.adminAuthError = "";

      if (!this.adminUser || !this.adminPassword) {
        this.adminAuthError = "Ingrese usuario y contraseña";
        return;
      }

      this.adminAuthLoading = true;

      try {
        const config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "singin",
          headers: {
            "Content-Type": "application/json",
          },
          data: JSON.stringify({
            user: this.adminUser,
            password: this.adminPassword,
          }),
        };

        const response = await axios(config);

        if (response.data.estadoflag) {
          const userEmail =
            response.data.data[0].user || response.data.data[0].usuario;

          if (userEmail && userEmail.toLowerCase() === "cmrg1979a@gmail.com") {
            // Es el admin, permitir edición
            this.cerrarDialogAdminAuth();
            this.$router.push({
              name: "editarCliente",
              params: { id: this.id },
            });
          } else {
            this.adminAuthError =
              "Solo el usuario administrador puede editar cotizaciones aprobadas";
          }
        } else {
          this.adminAuthError =
            response.data.mensaje || "Credenciales incorrectas";
        }
      } catch (error) {
        console.error("Error en validación admin:", error);
        this.adminAuthError = "Error al validar credenciales";
      } finally {
        this.adminAuthLoading = false;
      }
    },
    async obtenerTelContactoProveedor(item) {
      this.$store.state.spiner = true;
      this.nombrecompleto = item.nombrecompleto;
      await this.telConctactoProveedor({ id: item.id });
      this.dialogTelCont = true;
      this.$store.state.spiner = false;
    },
    async exportCliente() {
      this.$store.state.spiner = true;
      await this.exportListClientes();
      this.$store.state.spiner = false;
    },
  },
  async mounted() {
    this.$store.state.entities.lstProveedor = [];
    this.$store.state.spiner = true;
    await this.getListClientes();
    this.$store.state.spiner = false;
    await Promise.all([
      this._getDocumentsPais(),
      this.cargarMasterDetalleTipoProveedor(),
      this._getPais(),
      this._getRole(),
      this.cargarTipoTelefono(),
    ]);
  },
};
</script>

<style></style>
