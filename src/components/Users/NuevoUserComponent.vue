<template>
  <v-card class="cardDatos pa-4">
    <v-tabs
      v-model="tab"
      bg-color="teal darken-4"
      grow
      dark
      stacked
    >
      <v-tabs-slider></v-tabs-slider>

      <v-tab href="#datos"> Datos del Usuario </v-tab>

      <v-tab href="#posicion"> Módulos a Usar </v-tab>

      <!-- <v-tab href="#sucursal"> Sucursal </v-tab> -->
    </v-tabs>
    <v-card-actions class="justify-end px-5 pt-4 pb-0">
      <v-btn
        v-if="tab == 'posicion'"
        @click="guardarUsuario()"
        color="success"
        dark
        size="small"
      >
        Guardar
      </v-btn>
      <v-btn v-else @click="continuar()" color="success" variant="outlined" size="small">
        Siguiente
      </v-btn>
    </v-card-actions>
    <v-tabs-items v-model="tab">
      <v-tab-item value="datos" class="px-5 items">
        <v-form ref="frmDatos">
          <!-- <v-row>
            <v-col cols="4">
              <v-text-field
                label="Alias del Usuario (*)"
                id="users"
                v-model="$store.state.user.model.users"
                v-on:blur="validarUser()"
                :error-messages="errUsers"
                v-no-spaces
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) =>
                    (!!v && v.length <= 255) ||
                    'El USUARIO no puede exceder los 255 caracteres.',
                ]"
              ></v-text-field>
            </v-col>
          </v-row> -->
          <v-row class="align-sm-center">
            <v-col cols="4">
              <v-autocomplete
                :items="$store.state.itemsDocumentsPais"
                item-title="description"
                item-value="id"
                label="Tipo de Documento (*)"
                v-model="$store.state.user.model.id_document"
                @update:model-value="validarDocument()"
                :rules="[(v) => !!v || 'Dato Requerido']"
              ></v-autocomplete>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Documento (*)"
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
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.surname"
                :rules="[(v) => !!v || 'Dato Requerido']"
                label="Apellido Paterno (*)"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.second_surname"
                :rules="[(v) => !!v || 'Dato Requerido']"
                label="Apellido Materno (*)"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Teléfono (*)"
                v-model="$store.state.user.model.phone"
                :rules="[
                  (v) => !!v || 'Dato Requerido',
                  (v) => /^[0-9]+$/.test(v) || 'Ingrese solo números',
                ]"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Correo (*)"
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
                label="Fecha Nacimiento"
                v-model="$store.state.user.model.birthday"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                :type="verClave == false ? 'password' : 'text'"
                label="Clave*"
                v-model="$store.state.user.model.clave"
                :append-icon="!verClave ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="verClave = !verClave"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                :type="confirverClave == false ? 'password' : 'text'"
                label="Confirmar Clave*"
                v-model="$store.state.user.model.confirmclave"
                :append-icon="!confirverClave ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="confirverClave = !confirverClave"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-autocomplete
                :items="$store.state.itemsSex"
                item-title="name"
                item-value="id"
                label="Sexo (*)"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :item-disabled="(item) => item.status != 1"
                v-model="$store.state.user.model.id_sex"
              ></v-autocomplete>
            </v-col>
            <v-col cols="4">
              <v-autocomplete
                label="Pais (*)"
                :items="$store.state.itemsPais"
                v-model="$store.state.user.model.id_pais"
                item-title="name"
                item-value="id"
                @update:model-value="ObtenerEstados($store.state.user.model.id_pais)"
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
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerCity($store.state.user.model.id_state)"
                :item-disabled="(item) => item.status != 1"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="4" v-if="$store.state.user.model.id_state">
              <v-autocomplete
                label="Ciudad"
                :items="$store.state.itemsCity"
                v-model="$store.state.user.model.id_city"
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerDistrito($store.state.user.model.id_city)"
                :item-disabled="(item) => item.status != 1"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="4" v-if="$store.state.user.model.id_city">
              <v-autocomplete
                label="Distrito"
                :items="$store.state.itemsTown"
                v-model="$store.state.user.model.id_town"
                item-title="name"
                item-value="id"
                :loading="loadingDistrito"
                :item-disabled="(item) => item.status != 1"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.address"
                label="Dirección (*)"
                :rules="[(v) => !!v || 'Dato Requerido']"
              ></v-text-field>
            </v-col>
            <!-- <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.socialprincipal"
                label="URL Red Social Principal"
                
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.socialsecundary"
                label="URL Red Social Alternativa"
                
              ></v-text-field>
            </v-col> -->

            <v-col cols="12" class="d-flex align-center">
              <span class="mr-4">Activo/ Inactivo</span>
              <v-switch
                hide-details
                :label="
                  $store.state.user.model.status == 1 ? 'Activo' : 'Inactivo'
                "
                v-model="$store.state.user.model.status"
              ></v-switch>
            </v-col>
          </v-row>
        </v-form>
      </v-tab-item>
      <v-tab-item value="posicion" class="px-5 items">
        <v-form ref="frmPosicion">
          <v-row>
            <v-col cols="4" class="my-auto">
              <v-autocomplete
                :items="$store.state.position.lstPosition"
                item-title="name"
                item-value="id"
                v-model="itemPositon"
                return-object
                label="Módulo"
                placeholder="Módulo"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :error-messages="errPosition"
                :item-disabled="(item) => !item.estado"
              />
            </v-col>

            <v-col cols="4" class="my-auto">
              <v-btn @click="agregarPosicion()" size="small" color="success"
                >Agregar</v-btn
              >
            </v-col>
          </v-row>
        </v-form>
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headersPosition"
              :items="$store.state.user.positions"
              item-key="id"
              loading="true"
            >
              <template v-slot:[`item.action`]="{ index }">
                <v-btn icon color="red" @click="eliminarPosicion(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
          <v-col cols="12">
            <v-col cols="12">
              <p class="py-2">Departamento</p>

              <v-radio-group
                :rules="[(v) => !!v || 'Dato Requerido']"
                column
                v-model="$store.state.user.model.departamento"
              >
                <v-radio label="Pricing" value="1"></v-radio>
                <v-radio label="Operativo" value="2"></v-radio>
              </v-radio-group>
            </v-col>
            <v-col cols="12">
              <p class="justify">** Nota Importante **</p>
            </v-col>
            <v-col cols="12">
              <v-subheader>
                <!--  -->
                <p class="justify">
                  Está acción permitirá al usuario ajustar los montos dentro de
                  la liquidación de costos operativos (Control de Gastos). Es
                  necesario porque, aunque inicialmente se cotizan ciertos
                  valores, pueden surgir pequeños ajustes durante la operación
                  que requieren modificación
                </p>
              </v-subheader>
            </v-col>
          </v-col>
        </v-row>
      </v-tab-item>
      <!-- <v-tab-item value="sucursal" class="px-5 py-5 items">
        <v-form ref="frmSucursal">
          <v-row>
            <v-col cols="4" class="my-auto">
              <v-autocomplete
                :items="$store.state.securitys.lstSucursal"
                v-model="itemSucursal"
                item-text="trade_name"
                item-value="id"
                dense
                placeholder="Sucursal"
                label="Sucursal"
                :rules="[(v) => !!v || 'Dato Requerido']"
                return-object
                :error-messages="errSucursal"
              ></v-autocomplete>
            </v-col>
            <v-col cols="4" class="my-auto">
              <v-btn @click="agregarSucursal()" small color="success"
                >Agregar</v-btn
              >
            </v-col>
          </v-row>
        </v-form>
        <v-row>
          <v-col cols="12">
            <v-data-table
              :headers="headersSucursal"
              :items="$store.state.user.sucursales"
              item-key="id"
              loading="true"
            >
              <template v-slot:[`item.action`]="{ index }">
                <v-btn icon color="red" @click="eliminarSucursal(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tab-item> -->
    </v-tabs-items>

    <v-snackbar v-model="snackbar" variant="outlined" vertical color="info">
      El departamento, define como se comportará el usuario para el llendo de
      montos (Pricing u Operaciones) , en el CONTROL DE GASTOS

      <template v-slot:action="{ attrs }">
        <v-btn variant="text" color="red" v-bind="attrs" @click="snackbar = false">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      verClave: false,
      confirverClave: false,
      mostrarflag: false,
      tab: "datos",
      headersPosition: [
        { title: "Código", key: "code" },
        { title: "Módulo", key: "name" },
        { title: "Acción", key: "action" },
      ],

      headersSucursal: [
        { title: "Documento", key: "document" },
        { title: "Nombre", key: "trade_name" },
        { title: "Acción", key: "action" },
      ],

      itemPositon: "",
      errPosition: "",
      errUsers: "",
      errEmail: "",
      itemSucursal: "",
      errSucursal: "",
      loadingEstado: false,
      loadingCity: false,
      loadingDistrito: false,
      snackbar: false,
    };
  },
  async mounted() {
    this.$store.state.spiner = true;
    await Promise.all([
      this._getDocumentsPais(),
      this._getPais(),
      this._getSex(),
      this.cargarPosition(),
      this.CargarBranch(),
    ]);
    this.mostrarflag = true;
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
    this.$store.state.user.sucursales = [];
    this.$store.state.user.positions = [];
    this.$store.state.spiner = false;
    this.$refs.frmDatos.resetValidation();
  },
  methods: {
    ...mapActions([
      "_getDocumentsPais",
      "_getPais",
      "_getSex",
      "cargarPosition",
      "CargarBranch",
      "_getState",
      "_getCity",
      "_getTown",
      "validateUserUsuario",
      "validateDocumentUsuario",
      "validateEmailUsuario",
      "setUsers",
    ]),

    // 10705871171
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

    async agregarSucursal() {
      this.errSucursal = "";
      if (this.$refs.frmSucursal.validate()) {
        if (
          this.$store.state.user.sucursales.some(
            (v) => v.id == this.itemSucursal.id,
          )
        ) {
          this.errSucursal = "La sucursal ya se encuentra asignada.";
        } else {
          this.$store.state.user.sucursales.push(this.itemSucursal);
        }
      }
    },
    async agregarPosicion() {
      this.errPosition = "";
      if (this.$refs.frmPosicion.validate()) {
        if (
          this.$store.state.user.positions.some(
            (v) => v.id == this.itemPositon.id,
          )
        ) {
          this.errPosition = "La posición ya se encuentra asignada.";
        } else {
          this.$store.state.user.positions.push(this.itemPositon);
        }
      }
    },

    async ObtenerEstados(id_pais) {
      this.loadingEstado = true;
      await this._getState(id_pais);

      this.loadingEstado = false;
    },
    async ObtenerCity(id_state) {
      this.loadingCity = true;
      await this._getCity(id_state);
      this.loadingCity = false;
    },
    async ObtenerDistrito(id_city) {
      this.loadingDistrito = true;
      await this._getTown(id_city);
      this.loadingDistrito = false;
    },

    eliminarPosicion(index) {
      this.$store.state.user.positions.splice(index, 1);
    },
    eliminarSucursal(index) {
      this.$store.state.user.sucursales.splice(index, 1);
    },
    async continuar() {
      if (
        this.$store.state.user.model.clave &&
        this.$store.state.user.model.confirmclave &&
        this.$store.state.user.model.clave !=
          this.$store.state.user.model.confirmclave
      ) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Las claves no coinciden",
        });
        return false;
      }
      if (this.$refs.frmDatos.validate()) {
        if (this.$store.state.user.positions.length == 0) {
          this.errPosition =
            "Es necesario asignar al menos una Position, al usuario";
          this.tab = "posicion";
          return false;
        }
        if (this.$store.state.user.sucursales.length == 0) {
          this.errSucursal =
            "Es necesario asignar al menos una Sucursal, al usuario";
          this.tab = "sucursal";
          return false;
        }
        if (this.tab == "datos") {
          this.tab = "posicion";
          return true;
        }
        if (this.tab == "posicion") {
          this.tab = "sucursal";
          return true;
        }
      } else {
        this.tab = "datos";
      }
    },
    async guardarUsuario() {
      if (this.$refs.frmDatos.validate()) {
        if (this.$store.state.user.positions.length == 0) {
          this.errPosition =
            "Es necesario asignar al menos una Position, al usuario";
          this.tab = "posicion";
          return false;
        }
        // if (this.$store.state.user.sucursales.length == 0) {
        //   this.errSucursal =
        //     "Es necesario asignar al menos una Sucursal, al usuario";
        //   this.tab = "sucursal";
        //   return false;
        // }
        this.$store.state.spiner = true;
        await this.setUsers();
        this.$store.state.spiner = false;
      } else {
        this.tab = "datos";
      }
    },
  },
  directives: {
    noSpaces(el) {
      el.addEventListener("input", (event) => {
        const value = event.target.value;
        const hasSpaces = /\s/.test(value);
        if (hasSpaces) {
          event.target.value = value.slice(0, -1); // Elimina el último carácter (el espacio)
        }
      });
    },
  },
};
</script>

<style scoped>
.cardDatos {
  width: 100%;
  max-width: 100%;
}
.items {
  min-height: 50vh !important;
}
.iconDepartamento {
  cursor: pointer;
}
.justify {
  text-align: justify;
}
@media (max-width: 1000px) {
  .cardDatos {
    width: 100% !important;
  }
  .items {
    min-height: auto !important;
  }
}
</style>
