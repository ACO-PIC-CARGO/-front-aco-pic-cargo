<template>
  <v-container>
    <v-card class="py-10 px-10">
      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>
      <v-tabs v-model="tab" v-else>
        <v-tab href="#principal">Datos Principales</v-tab>
        <v-tab href="#bancario">Datos Bancarios</v-tab>
      </v-tabs>
      <v-tabs-items v-model="tab" v-if="!loading_as">
        <v-tab-item value="principal" class="px-10">
          <v-card-title>
            <v-card-text>
              <v-row>
                <v-form ref="form" class="my-4">
                  <v-row>
                    <v-col cols="6" class="py-0">
                      <v-autocomplete
                        label="Tipo de Documento (*)"
                        v-model="enterprise.id_document"
                        :items="itemsDocumentsPais"
                        item-text="description"
                        item-value="id"
                        :rules="[(v) => !!v || 'Dato requerido']"
                        clearable
                      >
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-text-field
                        type="text"
                        label="N° de Documento (*)"
                        v-model="enterprise.document"
                        @blur="validateDocument"
                        :rules="[
                          (v) => !!v || 'Dato requerido',
                          (v) =>
                            (v && v.length <= 100) ||
                            'Hasta 100 caracteres permitidos',
                        ]"
                        :error-messages="errorDocument"
                        clearable
                      >
                      </v-text-field>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-text-field
                        label="Nombre Comercial (*)"
                        v-model="enterprise.trade_name"
                        :rules="[
                          (v) => !!v || 'Dato requerido',
                          (v) =>
                            (v && v.length <= 255) ||
                            'Hasta 255 caracteres permitidos',
                        ]"
                        clearable
                      >
                      </v-text-field>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-text-field
                        label="Nombre Negocio (*)"
                        v-model="enterprise.business_name"
                        :rules="[
                          (v) => !!v || 'Dato requerido',
                          (v) =>
                            (v && v.length <= 255) ||
                            'Hasta 255 caracteres permitidos',
                        ]"
                        clearable
                      >
                      </v-text-field>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-text-field label="Teléfono" v-model="enterprise.phone">
                      </v-text-field>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-text-field
                        label="Slogan"
                        v-model="enterprise.slogan"
                        clearable
                        :rules="[(v) => validateLength(v, 255)]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6" class="py-0 text-left">
                      <v-text-field
                        label="Logo"
                        readonly
                        :value="enterprise.name_file"
                      ></v-text-field>

                      <!-- <div>
                    <label for="image">Logo</label>
                    <v-img
                        v-if="$store.state.enterprises.record.path"
                        :src="$store.state.enterprises.record.path"
                        height="200"
                        >
                    </v-img>
                  </div> -->
                    </v-col>
                    <v-col cols="6" class="py-0 text-left">
                      <v-file-input
                        label="Actualizar logo"
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
                    <v-col cols="6" class="py-0">
                      <v-text-field
                        label="IC"
                        v-model="enterprise.ic"
                        :rules="[(v) => validateLength(v, 255)]"
                        clearable
                      ></v-text-field>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-autocomplete
                        label="País (*)"
                        :items="itemsPais"
                        item-value="id"
                        item-text="name"
                        @change="get_state()"
                        v-model="enterprise.id_pais"
                        :rules="[(v) => !!v || 'Dato requerido']"
                        clearable
                      >
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-autocomplete
                        label="Región (*)"
                        :items="itemsState"
                        item-value="id"
                        item-text="name"
                        @change="get_city()"
                        v-model="enterprise.id_state"
                        :disabled="!enterprise.id_pais"
                        clearable
                      >
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-autocomplete
                        label="Provincia (*)"
                        :items="itemsCity"
                        item-value="id"
                        item-text="name"
                        @change="get_town()"
                        v-model="enterprise.id_city"
                        :disabled="!enterprise.id_state"
                        clearable
                      >
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-autocomplete
                        label="Distrito (*)"
                        :items="itemsTown"
                        item-value="id"
                        item-text="name"
                        v-model="enterprise.id_town"
                        :disabled="!enterprise.id_city"
                        clearable
                      >
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="6" class="py-0">
                      <v-text-field
                        label="Dirección (*)"
                        v-model="enterprise.address"
                        clearable
                        :rules="[(v) => !!v || 'Dato requerido']"
                      ></v-text-field>
                    </v-col>

                    <v-col cols="6" class="py-0">
                      <v-switch
                        label="Activo / Inactivo"
                        v-model="enterprise.status"
                        color="success"
                        @change="updateStatus"
                      ></v-switch>
                    </v-col>
                    <v-col cols="6">
                      <v-autocomplete
                        label="Impuestos a las Ventas en tu País"
                        :items="$store.state.masterusuarios.lstImpRenta"
                        item-value="id"
                        item-text="descripcion"
                        dense
                        v-model="enterprise.tipoimpuesto"
                      >
                        <template v-slot:selection="data">
                          <span v-if="data.item">{{ data.item.codigo }}</span>
                        </template>
                      </v-autocomplete>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field
                        type="number"
                        label="Porcentaje"
                        step="0.1"
                        suffix="%"
                        dense
                        hide-details
                        v-model="enterprise.impuesto"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                </v-form>
              </v-row>
            </v-card-text>
          </v-card-title>
        </v-tab-item>
        <v-tab-item value="bancario">
          <v-row>
            <v-col cols="12" style="text-align: right">
              <v-btn color="success" small @click="abrirModalNuevaCuenta"
                >Nueva Cuenta</v-btn
              >
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headerCuentas"
                :items="$store.state.enterprises.lstCuentas"
              >
                <template v-slot:[`item.esprincipalflag`]="{ item }">
                  <v-chip
                    v-if="item.esprincipalflag"
                    class="ma-2"
                    color="green"
                    text-color="white"
                  >
                    SI
                  </v-chip>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-tab-item>
      </v-tabs-items>

      <v-card-actions v-if="!loading_as" class="justify-end mt-3">
        <v-btn small class="mx-1" color="success" @click="update()" rounded>
          Guardar
        </v-btn>
        <v-btn small class="mx-1" dark color="red" @click="volver()" rounded>
          Cancelar
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-dialog v-model="dialogNuevaCuenta" scrollable max-width="30%">
      <v-card>
        <v-card-title> Nueva Cuenta </v-card-title>
        <v-card-text>
          <v-form ref="frmNuevaCuenta">
            <v-autocomplete
              :items="$store.state.bank.list"
              item-text="name"
              item-value="id"
              label="Banco"
              v-model="id_bank"
            />
            <v-text-field
              v-if="id_bank == 0"
              :rules="[(v) => !!v || 'Dato Requerido']"
              label="Acrónimo Banco"
              id="id"
              v-model="acronymbanco"
            ></v-text-field>
            <v-text-field
              v-if="id_bank == 0"
              :rules="[(v) => !!v || 'Dato Requerido']"
              label="Nombre Banco"
              id="id"
              v-model="nombrebanco"
            ></v-text-field>
            <v-autocomplete
              :items="$store.state.coins.itemsCoinsList"
              item-text="name"
              item-value="id"
              label="Moneda"
              :rules="[(v) => v === '0' || v === 0 || !!v || 'Dato Requerido']"
              v-model="id_coins"
            />
            <v-text-field
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-model="nro_cuenta"
              label="Número Cuenta"
            ></v-text-field>
            <v-text-field
              :rules="[(v) => !!v || 'Dato Requerido']"
              v-model="nro_cci"
              label="CCI"
            ></v-text-field>
            <v-switch
              v-model="esprincipalflag"
              label="Usar en Facturación"
            ></v-switch>
            <span
              v-if="bloquearEsPrincipal && esprincipalflag"
              class="mt-0"
              style="color: red"
            >
              <p class="my-0" style="font-size: 0.8rem">
                Ya existe una cuenta configurada para usar en facturación,
              </p>
              <p class="my-0" style="font-size: 0.8rem">
                Se actualizará el registro
              </p>
            </span>
          </v-form>
          <div style="text-align: right" class="mt-5">
            <v-spacer></v-spacer>
            <v-btn small class="mx-1" color="success" @click="guardarCuenta"
              >Guardar</v-btn
            >
            <v-btn
              small
              class="mx-1"
              color="error"
              @click="dialogNuevaCuenta = false"
              >Cancelar</v-btn
            >
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axios from '@/api/axios-config';
import { mapState, mapActions } from "vuex";
import miMixin from "../mixins/funciones";
export default {
  mixins: [miMixin],
  name: "UpdateEnterpriseComponent",
  data() {
    return {
      dialogNuevaCuenta: false,
      enterprise: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        id: this.$route.params.id,
        id_logo: "",
        document: "",
        trade_name: "",
        business_name: "",
        slogan: "",
        address: "",
        status: "",
        id_pais: "",
        id_state: "",
        id_city: "",
        id_town: null,
        id_document: "",
        phone: "",
        ic: "",
        originalname: "",
        name_file: "",
        impuesto: "",
        tipoimpuesto: "",
      },
      rulesPassed: false,
      loading_as: true,
      errfile: "",
      loadingFile: false,
      msgfile: "",
      payfile: null,
      errorDocument: null,
      tab: "principal",
      headerCuentas: [
        { text: "Banco", value: "banco" },
        { text: "Abrv.", value: "banco_acronym" },
        { text: "Nro Cuenta", value: "nrocuenta" },
        { text: "CCI", value: "nrocci" },
        { text: "Usar Facturación", value: "esprincipalflag" },
        { text: "Moneda", value: "moneda" },
        { text: "Abrv. Moneda", value: "monedacronym" },
      ],
      id_bank: 0,
      id_coins: "",
      nro_cuenta: "",
      nro_cci: "",
      esprincipalflag: false,
      acronymbanco: "",
      nombrebanco: "",
    };
  },
  async mounted() {
    await this.readEnterprise(this.$route.params.id);
    await Promise.all([
      this.cargarImpuestoRenta(),
      this._getDocumentsPais(),
      this._getPais(),
      this.listarCuentaEmpresa(this.$route.params.id),
      this.fetchDataBank({
        code: "",
        name: "",
        acronym: "",
        description: "",
        status: "",
      }),
      this.getCoinsListCargar(),
    ]);
    this.$store.state.bank.list.unshift({
      id: 0,
      name: "Crear Nuevo Banco",
    });
    this.$store.state.mainTitle = `ACTUALIZAR EMPRESA`;
  },
  watch: {
    "$store.state.enterprises.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const fieldsToCopy = [
            "id_logo",
            "document",
            "trade_name",
            "business_name",
            "slogan",
            "address",
            "status",
            "id_pais",
            "id_state",
            "id_city",
            "id_town",
            "id_document",
            "ic",
            "originalname",
            "name_file",
            "impuesto",
            "tipoimpuesto",
            "phone",
          ];
          this._getState(newRecord.id_pais);
          this._getCity(newRecord.id_state);
          this._getTown(newRecord.id_city);

          fieldsToCopy.forEach((field) => {
            this.enterprise[field] = newRecord[field];
          });

          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.files.payPath": {
      handler(newRecord, oldRecord) {
        if (newRecord) {
          this.enterprise.id_logo = newRecord;
        }
      },
      immediate: true,
    },
  },
  methods: {
    ...mapActions([
      "updateEnterprise",
      "readEnterprise",
      "_getDocumentsPais",
      "_getPais",
      "_getState",
      "_getCity",
      "_getTown",
      "_uploadFile",
      "cargarImpuestoRenta",
      "listarCuentaEmpresa",
      "fetchDataBank",
      "getCoinsListCargar",
      "registrarCuentaEmpresa",
    ]),
    _callState() {
      if (this.id_pais > 0) {
        this._getState(this.id_pais);
      }
    },
    abrirModalNuevaCuenta() {
      this.dialogNuevaCuenta = true;
      this.$nextTick(() => {
        this.$refs.frmNuevaCuenta.reset();
        setTimeout(() => {
          this.id_bank = 0;
          this.esprincipalflag = false;
        }, 500);
      });
    },
    volver() {
      this.$router.go(-1);
    },
    async get_state() {
      this.enterprise.id_state = "";
      this.enterprise.id_city = "";
      this.enterprise.id_town = null;
      await this._getState(this.enterprise.id_pais);
    },
    async get_city() {
      this.enterprise.id_city = "";
      this.enterprise.id_town = null;
      await this._getCity(this.enterprise.id_state);
    },
    async get_town() {
      this.enterprise.id_town = null;
      await this._getTown(this.enterprise.id_city);
    },
    async update() {
      if (this.$refs.form.validate()) {
        await this.updateEnterprise(this.enterprise);
      }
    },
    updateStatus(newValue) {
      this.enterprise.status = newValue ? 1 : 0;
    },
    async validateDocument() {
      this.errorDocument = null;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `validar_editar_documento_enterprise?` +
          `id=${this.enterprise.id}` +
          `&id_document=${this.enterprise.id_document}` +
          `&id_branch=${this.enterprise.id_branch}` +
          `&document=${encodeURIComponent(this.enterprise.document)}`,
        headers: {
          "Content-Type": "application/json",
         
        },
      };

      await axios(config)
        .then((response) => {
          let data = response.data;
          if (!data.estadoflag) {
            this.errorDocument = data.mensaje;
            this.enterprise.document = "";
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
          if (this.$store.state.files.payPath) {
            this.enterprise.name_file = "";
          }
        }
      }
    },
    async guardarCuenta() {
      if (this.$refs.frmNuevaCuenta.validate()) {
        await this.registrarCuentaEmpresa({
          id_banco: this.id_bank,
          id_coins: this.id_coins,
          numerocuenta: this.nro_cuenta,
          cci: this.nro_cci,
          esprincipalflag: this.esprincipalflag,
          acronymbanco: this.acronymbanco,
          nombrebanco: this.nombrebanco,
        });
        this.dialogNuevaCuenta = false;
        await this.fetchDataBank({
          code: "",
          name: "",
          acronym: "",
          description: "",
          status: "",
        });
      }
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
    bloquearEsPrincipal() {
      let res = this.$store.state.enterprises.lstCuentas.some(
        (v) => v.esprincipalflag
      );
      return res;
    },
  },
};
</script>
