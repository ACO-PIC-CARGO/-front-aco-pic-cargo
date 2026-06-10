<template>
  <div>
    <v-container fluid>
      <v-row>
        <v-col cols="10">
          <v-form ref="frmData">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="itemsDocumentsPais"
                  item-text="description"
                  item-value="id"
                  label="Tipo de Documento Fiscal"
                  v-model="id_documents"
                  @change="_validaDocumento()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="n_documents"
                  type="text"
                  label="N° de Documento Fiscal"
                  @focusout.native="_validaDocumento()"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="$store.state.masterusuarios.lstTipoProveedor"
                  item-text="descripcion"
                  item-value="id"
                  label="Tipo de Proveedor"
                  v-model="id_tipo_proveedor"
                ></v-autocomplete>
              </v-col>
              <v-col v-if="id_documents != 2" cols="12" md="12">
                <v-text-field
                  v-model="names"
                  label="Nombres"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col v-if="id_documents != 2" cols="12" md="6">
                <v-text-field
                  v-model="surname"
                  label="Primer Apellido"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col v-if="id_documents != 2" cols="12" md="6">
                <v-text-field
                  v-model="second_surname"
                  label="Segundo Apellido"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col v-if="id_documents == 2" cols="12" md="6">
                <v-text-field
                  v-model="tradename"
                  label="Nombre Comercial"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col v-if="id_documents == 2" cols="12" md="6">
                <v-text-field
                  v-model="business_name"
                  label="Razón Social"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  item-text="name"
                  item-value="id"
                  :items="itemsPais"
                  label="País"
                  @change="_getState(id_pais)"
                  v-model="id_pais"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="itemsState"
                  item-text="name"
                  item-value="id"
                  @change="_getCity(id_state)"
                  v-model="id_state"
                  label="Departamento"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="itemsCity"
                  item-text="name"
                  item-value="id"
                  @change="_getTown(id_city)"
                  v-model="id_city"
                  label="Provincia"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-autocomplete
                  :items="itemsTown"
                  item-text="name"
                  item-value="id"
                  label="Distrito"
                  v-model="id_town"
                ></v-autocomplete>
              </v-col>
              <v-col v-if="id_documents != 2" cols="12" md="6">
                <v-autocomplete
                  :items="itemsSex"
                  item-text="name"
                  item-value="id"
                  v-model="id_sex"
                  label="Sexo"
                  :rules="[(v) => !!v || 'Dato Requerido']"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  type="number"
                  step="1"
                  label="Días de Crédito para que nos paguen"
                  v-model="diascredito"
                  :rules="[(v) => v >= 0 || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  type="number"
                  step="1"
                  label="Días de Crédito para nosotros pagar"
                  v-model="diasdeuda"
                  :rules="[(v) => v >= 0 || 'Dato Requerido']"
                ></v-text-field>
              </v-col>
              <v-col v-if="id_documents != 2" cols="12" md="6">
                <v-text-field
                  type="date"
                  v-model="date"
                  label="Fecha de Nacimiento"
                ></v-text-field>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="12" md="6">
                <v-textarea
                  rows="3"
                  v-model="address"
                  label="Dirección"
                ></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-textarea
                  rows="3"
                  v-model="notes"
                  label="Notas Importantes"
                ></v-textarea>
              </v-col>

              <v-col cols="12" md="12">
                <v-btn
                  v-if="statusData == 1"
                  @click="_postEntitie()"
                  color="success"
                  class="mr-2"
                  elevation="0"
                  >Guardar</v-btn
                >
                <v-btn
                  v-if="statusData == 2"
                  @click="_updatetEntitie()"
                  color="success"
                  class="mr-2"
                  elevation="0"
                >
                  Actualizar
                </v-btn>
                <v-btn color="error" elevation="0">Cancelar</v-btn>
              </v-col>

              <v-col cols="8">
                <v-autocomplete
                  v-model="$store.state.data_id_role"
                  :items="$store.state.itemsDataRoleList"
                  item-text="name"
                  item-value="id"
                  label="Cambiar Tipo de Role"
                ></v-autocomplete>
              </v-col>
              <v-col cols="4">
                <v-btn @click="cambiarRole()" x-large block>CAMBIAR</v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-col>
        <v-col cols="2">
          <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-2 mt-5"
                fab
                dark
                elevation="0"
                large
                v-bind="attrs"
                v-on="on"
                @click="getPhone()"
                color="blue-grey darken-3"
              >
                <v-icon dark> mdi-phone </v-icon>
              </v-btn>
            </template>
            <span>Teléfonos</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-2 mt-5"
                fab
                dark
                elevation="0"
                large
                v-bind="attrs"
                v-on="on"
                @click="
                  $store.state.modalContacts = !$store.state.modalContacts
                "
                color="blue-grey darken-3"
              >
                <v-icon dark> mdi-account-multiple </v-icon>
              </v-btn>
            </template>
            <span>Contactos</span>
          </v-tooltip>

          <v-tooltip v-if="this.$route.params.id" bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-2 mt-5"
                fab
                dark
                elevation="0"
                large
                v-bind="attrs"
                v-on="on"
                @click="$store.state.modalCuentas = !$store.state.modalCuentas"
                color="blue-grey darken-3"
              >
                <v-icon dark> mdi-bank </v-icon>
              </v-btn>
            </template>
            <span>Cuentas</span>
          </v-tooltip>
          <v-tooltip v-else bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                class="mx-2 mt-5"
                fab
                dark
                elevation="0"
                large
                v-bind="attrs"
                v-on="on"
                @click="modalCuentas = !modalCuentas"
                color="blue-grey darken-3"
              >
                <v-icon dark> mdi-bank </v-icon>
              </v-btn>
            </template>
            <span>Cuentas</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-container>
    <v-dialog v-model="modalCuentas" max-width="750">
      <v-card>
        <v-card-title class="text-h5"> Cuentas </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="2">
              <v-autocomplete
                v-model="$store.state.accountIdTypeAccount"
                :items="$store.state.itemsDataAccountList"
                item-text="name"
                item-value="id"
                label="Cuenta"
              ></v-autocomplete>
            </v-col>

            <v-col cols="2">
              <v-autocomplete
                v-model="$store.state.accountIdBanks"
                :items="$store.state.itemsDataBanksList"
                item-text="acronym"
                item-value="id"
                label="Banco"
              ></v-autocomplete>
            </v-col>

            <v-col cols="2">
              <v-autocomplete
                v-model="$store.state.accountIdCoins"
                :items="$store.state.itemsCoinsList"
                item-text="acronym"
                item-value="id"
                label="Moneda"
              ></v-autocomplete>
            </v-col>

            <v-col cols="4">
              <v-text-field
                type="number"
                label="N°. Cuenta"
                v-model="$store.state.accountNumer"
              >
              </v-text-field>
            </v-col>

            <v-col cols="1">
              <v-btn
                v-if="$store.state.accountNumer != ''"
                class="mx-2"
                fab
                color="teal darken-1
"
                dark
                elevation="0"
                @click="_setAccounts()"
                ><v-icon x-large>mdi-plus</v-icon></v-btn
              >
            </v-col>
          </v-row>
          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Cuenta</th>
                  <th class="text-left">Banco</th>
                  <th class="text-left">Moneda</th>
                  <th class="text-left">Número de cuenta</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item of cuentas" :key="item.id">
                  <td>{{ item.nameaccount }}</td>
                  <td>{{ item.namebanks }}</td>
                  <td>{{ item.namecoins }}</td>
                  <td>{{ item.accountnumber }}</td>
                  <td>
                    <v-btn
                      @click.native="_delAccount(item.id)"
                      color="white"
                      elevation="0"
                      ><v-icon color="error">mdi-delete</v-icon></v-btn
                    >
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="modalCuentas = false">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from '@/api/axios-config';;
import { mapState, mapActions } from "vuex";
export default {
  name: "controlEntitiesCom",
  // props: {
  //   dataClien: 1,
  // },
  data() {
    return {
      cuentas: [],
      modalCuentas: false,
      id_documents: "",
      n_documents: "",
      names: "",
      surname: "",
      second_surname: "",
      tradename: "",
      business_name: "",
      phone: "",
      mail: "",
      id_pais: "",
      id_state: "",
      id_city: "",
      id_town: "",
      id_sex: "",
      address: "",
      notes: "",
      statusData: 1,
      id_entitie: "",
      id_role: "",
      dataList: true,
      diascredito: 0,
      diasdeuda: 0,
      //id_role: this.$route.params.id_role,

      date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .substr(0, 10),
      menu: false,
      modal: false,
      menu2: false,
      id_tipo_proveedor: null,
    };
  },
  computed: {
    ...mapState([
      "itemsDocumentsPais",
      "itemsPais",
      "itemsState",
      "itemsCity",
      "itemsTown",
      "itemsSex",
      "lstTipoProveedor",
    ]),
  },
  async mounted() {
    this.$store.state.spiner = true;
    await this._getDocumentsPais();
    await this._getPais();
    await this._getRole();
    await this._callState();
    await this._getSex();
    await this._validatyDocuments();
    await this.cargarMasterDetalleTipoProveedor();
    if (this.$route.params.id) {
      await this._getAccountsNumber();
    }
    this.id_pais = JSON.parse(
      sessionStorage.getItem("dataBranch")
    )[0].id_PaisBrach;
    if (this.$route.params.id_role) {
      this.$store.state.id_role_actual = this.$route.params.id_role;
    }
    await this._validaData();
    this.$store.state.spiner = false;
  },
  methods: {
    ...mapActions([
      "_getDocumentsPais",
      "_getPais",
      "_getState",
      "_getCity",
      "_getTown",
      "_getSex",
      "_getEntities",
      "_getAgents",
      "_getConsigners",
      "_getNotify",
      "_getColoaders",
      "_getNavieras",
      "_getRole",
      "ListarPhones",
      "cargarMasterDetalleTipoProveedor",
    ]),

    _validatyDocuments() {
      if (
        JSON.parse(sessionStorage.getItem("dataBranch"))[0].id_PaisBrach == 139
      ) {
        this.id_documents = 2;
      }
    },

    _callState() {
      if (this.id_pais > 0) {
        this._getState(this.id_pais);
      }
    },

    async _getAccountsNumber() {
      var vm = this;
      let data = {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url:
          process.env.VUE_APP_URL_MAIN +
          "getAccountsNumber/" +
          vm.$route.params.id,
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm.$store.state.itemsDataAccountsNumberList = response.data.data;
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    clenData() {
      this.names = "";
      this.surname = "";
      this.second_surname = "";
      this.tradename = "";
      this.business_name = "";
      this.date = "";
      this.n_documents = "";
      this.address = "";
      this.notes = "";
      this.id_tipo_proveedor = "";
    },
    getPhone() {
      this.ListarPhones(this.$route.params.id);
      this.$store.state.modalPhones = !this.$store.state.modalPhones;
    },
    _validaDocumento() {
      var vm = this;
      if (vm.n_documents) {
        var data = {
          ic: vm.id_documents + vm.n_documents,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        };

        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "getEntitiesListIc",
          headers: {
           
            "Content-Type": "application/json",
          },
          data: data,
        };
        axios(config)
          .then(function (response) {
            if (response.data.estadoflag == true) {
              vm.$swal({
                icon: "warning",
                title: "Lo sentimos",
                text: "Este documento ya existe en la base de datos",
                showDenyButton: true,
                confirmButtonText: "Modificar datos existentes",
                denyButtonText: `Cancelar registro`,
              }).then((result) => {
                /* Read more about isConfirmed, isDenied below */
                if (result.isConfirmed) {
                  vm.$router.push(
                    "/home/folderEntities/control/edit/" +
                      response.data.data[0].id
                  );
                  vm._validaData();
                } else if (result.isDenied) {
                  vm.$swal("Registro cancelado", "", "info");
                }
              });
              vm.statusData = 2;
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },

    _validaData() {
      var vm = this;

      if (vm.$route.params.id) {
        vm.dataList = false;
        vm.$store.state.house_Id_get = vm.$route.params.id;
        var data = {
          id: vm.$route.params.id,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "getEntitiesListId",
          headers: {
           
            "Content-Type": "application/json",
          },
          data: data,
        };
        axios(config)
          .then(function (response) {
            vm.names = response.data.data[0].names;
            vm.surname = response.data.data[0].surname;
            vm.second_surname = response.data.data[0].second_surname;
            vm.tradename = response.data.data[0].tradename;
            vm.business_name = response.data.data[0].business_name;
            vm.date = response.data.data[0].birthday;
            vm.n_documents = response.data.data[0].document;
            vm.address = response.data.data[0].address;
            vm.notes = response.data.data[0].notes;
            vm.id_pais = response.data.data[0].id_pais;
            vm.id_state = response.data.data[0].id_state;
            vm._getCity(response.data.data[0].id_state);
            vm.id_city = response.data.data[0].id_city;
            vm._getTown(response.data.data[0].id_city);
            vm.id_town = response.data.data[0].id_town;
            vm.id_sex = response.data.data[0].id_sex;
            vm.id_documents = response.data.data[0].id_document;
            vm.statusData = 2;
            vm.id_entitie = response.data.data[0].id;
            vm.id_role = response.data.data[0].id_role;
            vm.diascredito = response.data.data[0].diascredito;
            vm.diasdeuda = response.data.data[0].diasdeuda;
            vm.id_tipo_proveedor = response.data.data[0].id_tipo_proveedor;
            vm.dataList = true;
          })
          .catch(function (error) {
            console.log(error);
          });
      }
    },

    async _postEntitie() {
      if (this.$refs.frmData.validate()) {
        var vm = this;
        var dataEntitie = {
          names: !vm.names || vm.names == "" ? null : vm.names,
          surname: !vm.surname || vm.surname == "" ? null : vm.surname,
          second_surname:
            !vm.second_surname || vm.second_surname == ""
              ? null
              : vm.second_surname,
          tradename: !vm.tradename || vm.tradename == "" ? null : vm.tradename,
          business_name:
            !vm.business_name || vm.business_name == ""
              ? null
              : vm.business_name,
          birthday: !vm.date || vm.date == "" ? null : vm.date,
          document:
            !vm.n_documents || vm.n_documents == "" ? null : vm.n_documents,
          address: !vm.address || vm.address == "" ? null : vm.address,
          notes: !vm.notes || vm.notes == "" ? null : vm.notes,
          status: 1,
          id_pais: !vm.id_pais || vm.id_pais == "" ? null : vm.id_pais,
          id_state: vm.id_state ? vm.id_state : null,
          id_city: vm.id_city ? vm.id_city : null,
          id_town: vm.id_town ? vm.id_town : null,
          id_sex: vm.id_sex ? vm.id_sex : null,
          id_document: vm.id_documents ? vm.id_documents : null,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
          dataPhones: vm.$store.state.itemsListPhone,
          dataContacts: vm.$store.state.itemsListContact,
          accounts: vm.cuentas,
          id_role: vm.$store.state.data_id_role,
          diascredito: vm.diascredito,
          diasdeuda: vm.diasdeuda,
          id_tipo_proveedor: vm.id_tipo_proveedor,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "addEntities",
          headers: {
           
            "Content-Type": "application/json",
          },
          data: dataEntitie,
        };
        await axios(config)
          .then(function (response) {
            if (response.data.status == 200) {
              var idInsert = response.data.data[0].insertid;
              vm._postRoleEntitie(idInsert);
            } else {
              vm.$swal({
                icon: "error",
                title: "Lo sentimos",
                text: "Ha ocurrido un error en el proceso",
              });
            }
          })
          .catch(function (error) {
            console.log(error);
            vm.$swal({
              icon: "error",
              title: "Lo sentimos",
              text: "Ha ocurrido un error en el proceso " + error,
            });
          });
      }
    },

    cambiarRole() {
      var vm = this;
      var data = {
        id_role: vm.$store.state.data_id_role,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "editRole/" + vm.$route.params.id,
        headers: {
         
          "Content-Type": "application/json",
        },
        data: data,
      };
      axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            vm.$swal({
              icon: "success",
              title: "Excelente",
              text: "Role actualizada con éxito",
            });
            if (vm.$route.params.id) {
              // vm._getEntities(vm.id_role);
              vm.$router.back();
            }
          } else {
            vm.$swal({
              icon: "error",
              title: "Lo sentimos",
              text: "Ha ocurrido un error en el proceso",
            });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    async _updatetEntitie() {
      if (this.$refs.frmData.validate()) {
        var vm = this;
        var dataEntitie = {
          names: vm.names,
          surname: vm.surname,
          second_surname: vm.second_surname,
          tradename: vm.tradename,
          business_name: vm.business_name,
          birthday: vm.date,
          document: vm.n_documents,
          address: vm.address,
          notes: vm.notes,
          id_pais: vm.id_pais,
          id_state: vm.id_state,
          id_city: vm.id_city,
          id_town: vm.id_town,
          id_sex: vm.id_sex,
          id_document: vm.id_documents,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
          telefono: vm.$store.state.itemsListPhone,
          diascredito: vm.diascredito,
          diascredito: vm.diascredito,
          diasdeuda: vm.diasdeuda,
          id_tipo_proveedor: vm.id_tipo_proveedor,
        };
        var config = {
          method: "post",
          url: process.env.VUE_APP_URL_MAIN + "editEntitie/" + vm.id_entitie,
          headers: {
           
            "Content-Type": "application/json",
          },
          data: dataEntitie,
        };
        await axios(config)
          .then(function (response) {
            if (response.data.status == 200) {
              vm.$swal({
                icon: "success",
                title: "Excelente",
                text: "Entidad actualizada con éxito",
              });
              if (vm.$route.params.id) {
                vm.$router.back();
              }
            } else {
              vm.$swal({
                icon: "error",
                title: "Lo sentimos",
                text: "Ha ocurrido un error en el proceso",
              });
            }
          })
          .catch(function (error) {
            vm.$swal({
              icon: "error",
              title: "Lo sentimos",
              text: "Ha ocurrido un error en el proceso " + error,
            });
          });
      }
    },

    async _postRoleEntitie(id_entitie) {
      var vm = this;

      var dataEntitie = {
        id_entities: id_entitie,
        id_role: vm.$store.state.id_role_actual,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "addRoleEntitie",
        headers: {
         
          "Content-Type": "application/json",
        },
        data: dataEntitie,
      };
      await axios(config)
        .then(function (response) {
          if (response.data.status == 200) {
            if (vm.$store.state.id_role_actual == 1) {
              vm._getAgents();
              vm.clenData();
              vm.$store.state.modalAgente = false;
            } else if (vm.$store.state.id_role_actual == 11) {
              vm._getConsigners();
              vm._getNotify();

              vm.clenData();
              vm.$store.state.modalEntitie = false;
            } else if (vm.$store.state.id_role_actual == 17) {
              vm._getColoaders();
              vm.clenData();
              vm.$store.state.modalColoader = false;
            } else if (vm.$store.state.id_role_actual == 2) {
              vm._getNavieras();
              vm.clenData();
              vm.$store.state.modalNaviera = false;
            }

            vm.$swal({
              icon: "success",
              title: "Excelente",
              text: "Proceso éxitoso",
            });
            if (vm.$store.state.modalEntitie == false) {
              vm.$store.state.registroClienteFlag =
                !vm.$store.state.registroClienteFlag;
              vm.$store.state.entities.id = id_entitie;
              vm.$store.state.modalEntitie = false;
            } else {
              vm.$router.back();
            }
          } else {
            vm.$swal({
              icon: "error",
              title: "Lo sentimos",
              text: "Ha ocurrido un error en el proceso",
            });
          }
        })
        .catch(function (error) {
          vm.$swal({
            icon: "error",
            title: "Lo sentimos",
            text: "Ha ocurrido un error en el proceso " + error,
          });
        });
    },
    _setAccounts() {
      this.cuentas.push({
        accountIdTypeAccount: this.$store.state.accountIdTypeAccount,
        nameaccount: this.$store.state.itemsDataAccountList.filter(
          (v) => v.id == this.$store.state.accountIdTypeAccount
        )[0].name,
        accountIdBanks: this.$store.state.accountIdBanks,
        namebanks: this.$store.state.itemsDataBanksList.filter(
          (v) => v.id == this.$store.state.accountIdBanks
        )[0].name,
        accountIdCoins: this.$store.state.accountIdCoins,
        namecoins: this.$store.state.itemsCoinsList.filter(
          (v) => v.id == this.$store.state.accountIdCoins
        )[0].acronym,
        accountnumber: this.$store.state.accountNumer,
      });
      this.$store.state.accountIdTypeAccount = "";
      this.$store.state.accountIdBanks = "";
      this.$store.state.accountIdCoins = "";
      this.$store.state.accountNumer = "";
    },
  },
};
</script>
