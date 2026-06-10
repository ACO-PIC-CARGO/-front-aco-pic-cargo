<template>
  <v-container fluid>
    <v-card class="py-10 px-10">
      <v-tabs
        v-model="tab"
        background-color="teal darken-4"
        grow
        dark
        icons-and-text
      >
        <v-tabs-slider></v-tabs-slider>

        <v-tab href="#datos"> Datos de la Empresa</v-tab>

        <v-tab href="#admin"> Administrador Principal SISTEMA </v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab">
        <v-tab-item value="datos" class="px-5 items">
          <v-form ref="frmEmpresa">
            <v-row>
              <v-col cols="4">
                <v-autocomplete
                  label="Tipo de Documento (*)"
                  v-model="$store.state.enterprises.model.id_document"
                  :items="itemsDocumentsPais"
                  item-text="description"
                  item-value="id"
                  :rules="[(v) => !!v || 'Dato requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  type="text"
                  label="N° de Documento (*)"
                  v-model="$store.state.enterprises.model.document"
                  @blur="validateDocument"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 100) ||
                      'Hasta 100 caracteres permitidos',
                  ]"
                  :error-messages="errorDocument"
                >
                </v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="4">
                <v-text-field
                  label="Nombre Comercial (*)"
                  v-model="$store.state.enterprises.model.trade_name"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 255) ||
                      'Hasta 255 caracteres permitidos',
                  ]"
                >
                </v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Nombre Negocio (*)"
                  v-model="$store.state.enterprises.model.business_name"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 255) ||
                      'Hasta 255 caracteres permitidos',
                  ]"
                >
                </v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Phone"
                  v-model="$store.state.enterprises.model.phone"
                  
                >
                </v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Slogan"
                  v-model="$store.state.enterprises.model.slogan"
                  :rules="[(v) => validateLength(v, 255)]"
                >
                </v-text-field>
              </v-col>
              <v-col cols="4">
                <v-file-input
                  label="Logo"
                  v-model="payfile"
                  accept=".png"
                  :success-messages="msgfile"
                  :error-messages="errfile"
                  :loading="loadingFile"
                  show-size
                  prepend-icon="mdi-camera"
                  @change="uploadFile()"
                >
                </v-file-input>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="IC"
                  v-model="$store.state.enterprises.model.ic"
                  :rules="[(v) => validateLength(v, 255)]"
                >
                </v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="3">
                <v-autocomplete
                  label="País (*)"
                  :items="itemsPais"
                  item-value="id"
                  item-text="name"
                  @change="get_state()"
                  v-model="$store.state.enterprises.model.id_pais"
                  :rules="[(v) => !!v || 'Dato requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="3">
                <v-autocomplete
                  label="Región (*)"
                  :items="itemsState"
                  item-value="id"
                  item-text="name"
                  @change="get_city()"
                  v-model="$store.state.enterprises.model.id_state"
                  :disabled="!$store.state.enterprises.model.id_pais"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="3">
                <v-autocomplete
                  label="Provincia (*)"
                  :items="itemsCity"
                  item-value="id"
                  item-text="name"
                  @change="get_town()"
                  v-model="$store.state.enterprises.model.id_city"
                  :disabled="!$store.state.enterprises.model.id_state"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="3">
                <v-autocomplete
                  label="Distrito (*)"
                  v-model="$store.state.enterprises.model.id_town"
                  :items="itemsTown"
                  item-value="id"
                  item-text="name"
                  :disabled="!$store.state.enterprises.model.id_city"
                  :rules="[(v) => !!v || 'Dato requerido']"
                />
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Dirección (*)"
                  v-model="$store.state.enterprises.model.address"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      (v && v.length <= 255) ||
                      'Hasta 255 caracteres permitidos',
                  ]"
                >
                </v-text-field>
              </v-col>
              <v-col cols="4">
                <v-switch
                  dense
                  label="Activo/Inactivo"
                  v-model="$store.state.enterprises.model.status"
                  hide-details
                  color="success"
                  @change="updateStatus"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-tab-item>
        <v-tab-item value="admin" class="px-5 items">
          <v-form ref="frmDatos">
            <v-row>
              <v-col cols="4">
                <v-text-field
                  label="Nombre Usuario (*)"
                  id="users"
                  v-model="$store.state.user.model.users"
                  v-on:blur="validarUser()"
                  :error-messages="errUsers"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row align-sm-center>
              <v-col cols="4">
                <v-autocomplete
                  :items="$store.state.itemsDocumentsPais"
                  item-text="description"
                  item-value="id"
                  label="Tipo de Documento (*)"
                  v-model="$store.state.user.model.id_document"
                  @change="validarDocument()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Documento (*)"
                  id="id"
                  v-model="$store.state.user.model.document"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  v-on:blur="validarDocument()"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="4">
                <v-text-field
                  v-model="$store.state.user.model.names"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  label="Nombres (*)"
                  id="id"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="$store.state.user.model.surname"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  label="Apellido Paterno (*)"
                  id="id"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="$store.state.user.model.second_surname"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  label="Apellido Materno (*)"
                  id="id"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Teléfono (*)"
                  v-model="$store.state.user.model.phone"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  id="id"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  label="Correo (*)"
                  id="id"
                  v-model="$store.state.user.model.email"
                  :rules="[
                    (v) => !!v || 'Dato requerido',
                    (v) =>
                      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ||
                      'Debe ser un correo valido',
                  ]"
                  @blur="validarEmail()"
                  :error-messages="errEmail"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  type="date"
                  label="Fecha Nacimiento (*)"
                  id="id"
                  v-model="$store.state.user.model.birthday"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="4">
                <v-autocomplete
                  :items="$store.state.itemsSex"
                  item-text="name"
                  item-value="id"
                  label="Sexo (*)"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  :item-disabled="(item) => item.status != 1"
                  v-model="$store.state.user.model.id_sex"
                ></v-autocomplete>
              </v-col>
              <!-- <v-col cols="4">
                <v-autocomplete
                  label="Pais"
                  :items="$store.state.itemsPais"
                  v-model="$store.state.user.model.id_pais"
                  item-text="name"
                  item-value="id"
                  @change="ObtenerEstados($store.state.user.model.id_pais)"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="4" v-if="$store.state.user.model.id_pais">
                <v-autocomplete
                  label="Estado (Región)"
                  :items="$store.state.itemsState"
                  v-model="$store.state.user.model.id_state"
                  item-text="name"
                  item-value="id"
                  :loading="loadingEstado"
                  @change="ObtenerCity($store.state.user.model.id_state)"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="4" v-if="$store.state.user.model.id_state">
                <v-autocomplete
                  label="Ciudad"
                  :items="$store.state.itemsCity"
                  v-model="$store.state.user.model.id_city"
                  item-text="name"
                  item-value="id"
                  :loading="loadingEstado"
                  @change="ObtenerDistrito($store.state.user.model.id_city)"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col>
              <v-col cols="4" v-if="$store.state.user.model.id_city">
                <v-autocomplete
                  label="Distrito "
                  :items="$store.state.itemsTown"
                  v-model="$store.state.user.model.id_town"
                  item-text="name"
                  item-value="id"
                  :loading="loadingDistrito"
                  :item-disabled="(item) => item.status != 1"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                >
                </v-autocomplete>
              </v-col> -->
              <v-col cols="4">
                <v-text-field
                  v-model="$store.state.user.model.address"
                  label="Dirección (*)"
                  id="id"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="$store.state.user.model.socialprincipal"
                  label="URL Red Social Principal"
                  id="id"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model="$store.state.user.model.socialsecundary"
                  label="URL Red Social Alternativa"
                  id="id"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                Departamento
                <v-icon small @click="snackbar = true" class="iconDepartamento"
                  >mdi-information-slab-circle-outline</v-icon
                >
                <v-radio-group
                  :rules="[(v) => !!v || 'Dato Requerido']"
                  column
                  v-model="$store.state.user.model.departamento"
                >
                  <v-radio label="Operativo" value="1"></v-radio>
                  <v-radio label="Administrativo" value="2"></v-radio>
                </v-radio-group>
              </v-col>
              <v-col cols="6">
                <v-switch
                  label="Estado"
                  v-model="$store.state.user.model.status"
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-tab-item>
      </v-tabs-items>
      <v-btn block color="success" @click="insert()" class="mt-10" dark>{{
        tab == "datos" ? "Siguiente" : "Guardar"
      }}</v-btn>
      <!-- <v-card-actions class="justify-end mt-3">
        <v-btn small class="mx-1" color="success" @click="insert()" rounded>
          Guardar</v-btn
        >
        <v-btn small class="mx-1" dark color="red" @click="volver()" rounded>
          Cancelar</v-btn
        >
      </v-card-actions> -->
    </v-card>
    <v-snackbar v-model="snackbar" outlined vertical color="info">
      El departamento, define como se comportará el usuario para el llendo de
      montos (Pricing u Operaciones) , en el CONTROL DE GASTOS

      <template v-slot:action="{ attrs }">
        <v-btn text color="red" v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';;
import miMixin from "../mixins/funciones";
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";

export default {
  mixins: [miMixin],
  name: "ListEnterpriseComponent",
  data() {
    return {
      snackbar: false,
      tab: "datos",
      errfile: "",
      loadingFile: false,
      loading: false,
      msgfile: "",
      payfile: null,
      errorDocument: null,
      errPosition: "",
      errUsers: "",
      errEmail: "",
    };
  },
  async mounted() {
    this.$store.state.spiner = true;

    this.$store.state.mainTitle = `EMPRESAS`;
    this.$store.state.enterprises.model = {
      id_logo: "",
      document: "",
      trade_name: "",
      business_name: "",
      slogan: "",
      address: "",
      status: "1",
      id_pais: "",
      id_state: "",
      id_city: "",
      id_town: "",
      id_document: "",
      ic: "",
    };
    this.$store.state.user.model = {
      id: "",
      id_entitie: "",
      id_pais: "",
      id_city: "",
      id_state: "",
      id_town: "",
      users: "",
      id_document: "",
      document: "",
      id_sex: "",
      status: "1",
      departamento: "1",
      names: "",
      surname: "",
      second_surname: "",
      socialprincipal: "",
      socialsecundary: "",
      phone: "",
      address: "",
      birthday: "",
      email: "",
    };

    await this._getDocumentsPais();
    await this._getPais();
    await this._getSex();
    await this._callState();
    this.$store.state.spiner = false;
    this.$refs.frmDML.resetValidation();
    this.$refs.frmDatos.resetValidation();
  },
  methods: {
    ...mapActions([
      "_getSex",
      "insertEnterprise",
      "_getDocumentsPais",
      "_getPais",
      "_getState",
      "_getCity",
      "_getTown",
      "validateDocumentEnterprise",
      "_uploadFile",
      "validateUserUsuario",
      "validateDocumentUsuario",
      "validateEmailUsuario",
    ]),
    async _callState() {
      if (this.id_pais > 0) {
        await this._getState(this.id_pais);
      }
    },
    volver() {
      this.$router.go(-1);
    },
    async insert() {
      if (this.tab == "datos") {
        if (this.$refs.frmEmpresa.validate()) {
          this.tab = "admin";
          return true;
        }
      }
      if (this.tab == "admin") {
        if (!this.$refs.frmEmpresa.validate()) {
          this.tab = "datos";
          return false;
        }
        if (this.$refs.frmDatos.validate()) {
          this.$store.state.spiner = true;
          await this.insertEnterprise(this.$store.state.enterprises);
          this.$store.state.spiner = false;
        }
      }
    },
    async get_state() {
      this.$store.state.enterprises.model.id_state = "";
      this.$store.state.enterprises.model.id_city = "";
      this.$store.state.enterprises.model.id_town = "";
      await this._getState(this.$store.state.enterprises.model.id_pais);
    },
    async get_city() {
      this.$store.state.enterprises.model.id_city = "";
      this.$store.state.enterprises.model.id_town = "";
      await this._getCity(this.$store.state.enterprises.model.id_state);
    },
    async get_town() {
      this.$store.state.enterprises.model.id_town = "";
      await this._getTown(this.$store.state.enterprises.model.id_city);
    },
    async update() {
      if (this.$refs.form.validate()) {
        await this.updateEnterprise(this.$store.state.enterprises);
      }
    },
    async validarUser() {
      this.errUsers = "";
      this.$store.state.spiner = true;
      let res = await this.validateUserUsuario();
      if (res.estadoflag == true) {
        this.errUsers = res.mensaje;
        this.$store.state.user.model.users = "";
      }
      this.$store.state.spiner = false;
    },
    async validarEmail() {
      this.errEmail = "";
      this.$store.state.spiner = true;
      let res = await this.validateEmailUsuario();
      if (res.estadoflag == true) {
        this.errEmail = res.mensaje;
        this.$store.state.user.model.email = "";
      }
      this.$store.state.spiner = false;
    },
    async validarDocument() {
      // this.errUsers = "";
      if (
        !!this.$store.state.user.model.id_document &&
        !!this.$store.state.user.model.document
      ) {
        this.$store.state.spiner = true;
        let res = await this.validateDocumentUsuario();
        this.$store.state.spiner = false;

        if (res.estadoflag == true) {
          Swal.fire({
            icon: "question",
            title: "Pregunta",
            text: res.mensaje,
            allowEnterKey: false,
            allowOutsideClick: false,
            allowEnterKey: false,
            confirmButtonText: "Si",
            cancelButtonText: "No",
            showCancelButton: true,
            cancelButtonColor: "red",
            confirmButtonColor: "green",
          }).then(async (respuesta) => {
            if (respuesta.isConfirmed) {
              this.$store.state.spiner = true;
              this.$store.state.user.model.id_entitie = res.data[0].id_entitie;
              this.$store.state.user.model.address = res.data[0].address;
              this.$store.state.user.model.birthday = res.data[0].birthday;
              this.$store.state.user.model.estadoflag = res.data[0].estadoflag;
              this.$store.state.user.model.id_city = res.data[0].id_city;
              this.$store.state.user.model.id_pais = res.data[0].id_pais;
              this.$store.state.user.model.id_sex = res.data[0].id_sex;
              this.$store.state.user.model.id_state = res.data[0].id_state;
              this.$store.state.user.model.id_town = res.data[0].id_town;
              this.$store.state.user.model.names = res.data[0].names;
              this.$store.state.user.model.second_surname =
                res.data[0].second_surname;
              this.$store.state.user.model.socialprincipal =
                res.data[0].socialprincipal;
              this.$store.state.user.model.socialsecundary =
                res.data[0].socialsecundary;
              this.$store.state.user.model.surname = res.data[0].surname;
              await this._getState(res.data[0].id_pais);
              await this._getCity(res.data[0].id_state);
              await this._getTown(res.data[0].id_city);
              this.$store.state.spiner = false;
            }
            if (respuesta.isDismissed) {
              this.$store.state.user.model.document = "";
            }
          });
        }
        this.$store.state.spiner = false;
      }
      // if (res.estadoflag == true) {
      //   this.errUsers = res.mensaje;
      //   this.$store.state.user.model.users = "";
      // }
    },
    async validateDocument() {
      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `validar__nuevo_documento_enterprise?` +
          `id_branch=${
            JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch
          }` +
          `&id_document=${this.$store.state.enterprises.model.id_document}` +
          `&document=${encodeURIComponent(
            this.$store.state.enterprises.model.document
          )}`,
        headers: {
          "Content-Type": "application/json",
          "auth-token": sessionStorage.getItem("auth-token"),
        },
      };

      await axios(config)
        .then((response) => {
          let data = response.data;
          if (!data.estadoflag) {
            this.errorDocument = data.mensaje;
            this.$store.state.enterprises.model.document = "";
          } else {
            this.errorDocument = "";
          }
        })
        .catch((error) => {
          console.log("Error al obtener los datos:", error);
        });
    },
    async uploadFile() {
      this.msgfile = "";
      this.errfile = "";
      if (this.payfile) {
        this.loadingFile = true;
        if (this.payfile.size > 2097152) {
          this.loadingFile = false;
          this.errfile =
            "El archivo es demasiado grande. El tamaño máximo es 2 MB.";
        } else {
          await this._uploadFile(this.payfile);
          this.loadingFile = false;
          this.$store.state.files.payPath
            ? (this.msgfile = "Archivo cargado")
            : (this.errfile = "Comuniquese con el admistrador");
        }
      }
    },
    updateStatus(newValue) {
      this.$store.state.enterprises.model.status = newValue ? 1 : 0;
    },
  },
  watch: {
    "$store.state.files.payPath": {
      handler(newRecord, oldRecord) {
        if (newRecord) {
          this.$store.state.enterprises.model.id_logo = newRecord;
        }
      },
      immediate: true,
    },
  },
  computed: {
    ...mapState([
      "itemsDocumentsPais",
      "itemsPais",
      "itemsState",
      "itemsCity",
      "itemsTown",
    ]),
  },
};
</script>
