<template>
  <v-card class="cardDatos pa-4" v-if="mostrarflag">
    <v-tabs
      v-model="tab"
      bg-color="teal-darken-4"
      grow
      stacked
    >
      <v-tab value="datos"> Datos del Usuario </v-tab>

      <v-tab value="posicion"> Módulos a Usar </v-tab>

      <!-- <v-tab value="sucursal"> Sucursal </v-tab> -->
    </v-tabs>
    <v-card-actions class="justify-end px-5 pt-4 pb-0">
      <v-btn @click="guardarUsuario()" color="success" size="small">
        Guardar
      </v-btn>
    </v-card-actions>
    <v-tabs-window v-model="tab">
      <v-tabs-window-item value="datos" class="px-5 items">
        <v-form ref="frmDatos">
          <v-row>
            <!-- <v-col cols="4">
              <v-text-field
                label="Nombre Usuario (*)"
                id="users"
                v-model="$store.state.user.model.users"
                :error-messages="errUsers"
                readonly
              ></v-text-field>
            </v-col> -->
          </v-row>
          <v-row class="align-sm-center">
            <v-col cols="4">
              <v-autocomplete
                :items="$store.state.itemsDocumentsPais"
                item-title="description"
                item-value="id"
                label="Tipo de Documento (*)"
                v-model="$store.state.user.model.id_document"
                :rules="[(v) => !!v || 'Dato Requerido']"
              ></v-autocomplete>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Documento (*)"
                v-model="$store.state.user.model.document"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.names"
                label="Nombres (*)"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.surname"
                label="Apellido Paternos (*)"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.second_surname"
                label="Apellido Maternos (*)"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Teléfono (*)"
                v-model="$store.state.user.model.phone"
                :rules="[(v) => !!v || 'Dato Requerido']"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                label="Correo (*)"
                v-model="$store.state.user.model.email"
                disabled
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <v-text-field
                type="date"
                label="Fecha Nacimiento"
                v-model="$store.state.user.model.birthday"
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
                :item-props="(item) => ({ disabled: item.status != 1 })"
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
                :item-props="(item) => ({ disabled: item.status != 1 })"
                :rules="[(v) => !!v || 'Dato Requerido']"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="4" v-if="$store.state.user.model.id_pais">
              <v-autocomplete
                label="Estado (Región) (*)"
                :items="$store.state.itemsState"
                v-model="$store.state.user.model.id_state"
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerCity($store.state.user.model.id_state)"
                :item-props="(item) => ({ disabled: item.status != 1 })"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="4" v-if="$store.state.user.model.id_state">
              <v-autocomplete
                label="Ciudad (*)"
                :items="$store.state.itemsCity"
                v-model="$store.state.user.model.id_city"
                item-title="name"
                item-value="id"
                :loading="loadingEstado"
                @update:model-value="ObtenerDistrito($store.state.user.model.id_city)"
                :item-props="(item) => ({ disabled: item.status != 1 })"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="4" v-if="$store.state.user.model.id_city">
              <v-autocomplete
                label="Distritos (*)"
                :items="$store.state.itemsTown"
                v-model="$store.state.user.model.id_town"
                item-title="name"
                item-value="id"
                :loading="loadingDistrito"
                :item-props="(item) => ({ disabled: item.status != 1 })"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model="$store.state.user.model.address"
                label="Dirección (*)"
              ></v-text-field>
            </v-col>

            <v-col cols="4">
              <v-checkbox
                label="Cambiar clave"
                v-model="$store.state.user.model.cambiarClave"
              ></v-checkbox>
            </v-col>
            <v-col cols="4" v-if="$store.state.user.model.cambiarClave">
              <v-text-field
                :type="espassword ? 'password' : 'text '"
                v-model="$store.state.user.model.clave"
                :append-inner-icon="!espassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="espassword = !espassword"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :error-messages="errorClave"
              ></v-text-field>
            </v-col>
            <v-col cols="4" v-if="$store.state.user.model.cambiarClave">
              <v-text-field
                :type="espassword ? 'password' : 'text '"
                :append-inner-icon="!espassword ? 'mdi-eye' : 'mdi-eye-off'"
                v-model="$store.state.user.model.confirmclave"
                @click:append-inner="espassword = !espassword"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :error-messages="errorClave"
              ></v-text-field>
            </v-col>

            <v-col cols="12" class="d-flex align-center">
              <span class="mr-4">Activo/ Inactivo</span>
              <v-switch
                hide-details
                :label="
                  $store.state.user.model.status == 1 ? 'Activo' : 'Inactivo'
                "
                v-model="$store.state.user.model.status"
                :value-comparator="(value, checked) => Boolean(value) === checked"
              ></v-switch>
            </v-col>
          </v-row>
        </v-form>
      </v-tabs-window-item>
      <v-tabs-window-item value="posicion" class="px-5 items">
        <v-form ref="frmPosicion">
          <v-row>
            <v-col cols="4" class="my-auto">
              <v-autocomplete
                :items="$store.state.position.lstPosition"
                item-title="name"
                item-value="id"
                v-model="itemPositon"
                return-object
                label="Posición"
                placeholder="Posición"
                :rules="[(v) => !!v || 'Dato Requerido']"
                :error-messages="errPosition"
                :item-props="(item) => ({ disabled: !item.estado })"
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
          <v-col cols="12" v-if="mostrarposicionesflag">
            <v-data-table
              :headers="headersPosition"
              :items="$store.state.user.positions.filter((v) => !!v.status)"
              item-value="id"
            >
              <template v-slot:[`item.action`]="{ index }">
                <v-btn icon color="red" @click="eliminarPosition(index)">
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
                v-model="$store.state.user.model.departamento"
              >
                <v-radio label="Pricing" :value="1"></v-radio>
                <v-radio label="Operativo" :value="2"></v-radio>
              </v-radio-group>
            </v-col>
            <v-col cols="12">
              <p class="justify">** Nota Importante **</p>
            </v-col>
            <v-col cols="12">
              <p class="justify">
                Está acción permitirá al usuario ajustar los montos dentro de
                la liquidación de costos operativos (Control de Gastos). Es
                necesario porque, aunque inicialmente se cotizan ciertos
                valores, pueden surgir pequeños ajustes durante la operación
                que requieren modificación
              </p>
            </v-col>
          </v-col>
        </v-row>
      </v-tabs-window-item>
      <v-tabs-window-item value="sucursal" class="px-5 py-5 items">
        <v-form ref="frmSucursal">
          <v-row>
            <v-col cols="4" class="my-auto">
              <v-autocomplete
                :items="$store.state.securitys.lstSucursal"
                v-model="itemSucursal"
                item-title="trade_name"
                item-value="id"
                density="compact"
                placeholder="Sucursal"
                label="Sucursal"
                :rules="[(v) => !!v || 'Dato Requerido']"
                return-object
                :error-messages="errSucursal"
                :item-props="(item) => ({ disabled: !item.status })"
              ></v-autocomplete>
            </v-col>
            <v-col cols="4" class="my-auto">
              <v-btn @click="agregarSucursal()" size="small" color="success"
                >Agregar</v-btn
              >
            </v-col>
          </v-row>
        </v-form>
        <v-row>
          <v-col cols="12" v-if="mostrarsucursal">
            <v-data-table
              :headers="headersSucursal"
              :items="$store.state.user.sucursales.filter((v) => !!v.status)"
              item-value="id"
            >
              <template v-slot:[`item.action`]="{ index }">
                <v-btn icon color="red" @click="eliminarbranch(index)">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-tabs-window-item>
    </v-tabs-window>

    <v-snackbar v-model="snackbar" variant="outlined" vertical color="info">
      El departamento, define como se comportará el usuario para el llendo de
      montos (Pricing u Operaciones) , en el CONTROL DE GASTOS

      <template v-slot:actions>
        <v-btn variant="text" color="red" @click="snackbar = false">
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
      tab: "datos",
      headersPosition: [
        { title: "Código", key: "code" },
        { title: "Posición", key: "name" },
        { title: "Acción", key: "action" },
      ],

      headersSucursal: [
        { title: "Documento", key: "document" },
        { title: "Nombre", key: "trade_name" },
        { title: "Acción", key: "action" },
      ],
      errorClave: "",
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
      mostrarposicionesflag: true,
      mostrarsucursal: true,
      mostrarflag: false,
      cambiarClave: true,
      espassword: true,
    };
  },
  async mounted() {
    this.$store.state.user.model.id = this.$route.params.id;
    this.$store.state.spiner = true;
    await this.GetVerUsers();
    await this._getDocumentsPais();
    await this._getPais();
    await this._getSex();
    await this.cargarPosition();
    await this.CargarBranch();
    await this._getState(this.$store.state.user.model.id_pais);
    await this._getCity(this.$store.state.user.model.id_state);
    await this._getTown(this.$store.state.user.model.id_city);
    this.$store.state.spiner = false;
    this.mostrarflag = true;
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
      "GetVerUsers",
      "ActualizarUsers",
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
      if ((await this.$refs.frmSucursal.validate()).valid) {
        if (
          this.$store.state.user.sucursales.some(
            (v) => v.id_branch == this.itemSucursal.id
          )
        ) {
          if (
            this.$store.state.user.sucursales.some(
              (v) => v.id_branch == this.itemSucursal.id && !v.status
            )
          ) {
            this.$store.state.user.sucursales.filter(
              (v) => v.id_branch == this.itemSucursal.id && !v.status
            )[0].status = true;
          } else {
            this.errSucursal = "La sucursal ya se encuentra asignada.";
          }
        } else {
          this.$store.state.user.sucursales.push(this.itemSucursal);
        }
        this.mostrarsucursal = false;
        this.mostrarsucursal = true;
      }
    },
    async agregarPosicion() {
      this.errPosition = "";

      if ((await this.$refs.frmPosicion.validate()).valid) {
        if (
          this.$store.state.user.positions.some(
            (v) => v.id_position == this.itemPositon.id
          )
        ) {
          if (
            this.$store.state.user.positions.some(
              (v) => v.id_position == this.itemPositon.id && !v.status
            )
          ) {
            this.$store.state.user.positions.filter(
              (v) => v.id_position == this.itemPositon.id
            )[0].status = true;
          } else {
            this.errPosition = "La posición ya se encuentra asignada.";
          }
        } else {
          this.itemPositon.id_position = this.itemPositon.id;
          this.itemPositon.status = this.itemPositon.estado;
          this.$store.state.user.positions.push(this.itemPositon);
        }
      }
      this.mostrarposicionesflag = false;
      this.mostrarposicionesflag = true;
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

    eliminarPosition(index) {
      this.$store.state.user.positions[index].status = false;
      this.mostrarposicionesflag = false;
      this.mostrarposicionesflag = true;
    },
    eliminarbranch(index) {
      this.$store.state.user.lstSucursal[index].status = false;
      this.mostrarsucursal = false;
      this.mostrarsucursal = true;
    },

    async guardarUsuario() {
      console.log(this.$store.state.itemsDocumentsPais);
      if ((await this.$refs.frmDatos.validate()).valid) {
        if (
          this.$store.state.user.positions.filter((v) => !!v.status).length == 0
        ) {
          this.errPosition =
            "Es necesario asignar al menos una Position, al usuario";
          this.tab = "posicion";
          return false;
        }
        if (
          this.$store.state.user.sucursales.filter((v) => !!v.status).length ==
          0
        ) {
          this.errSucursal =
            "Es necesario asignar al menos una Sucursal, al usuario";
          this.tab = "sucursal";
          return false;
        }

        if (
          this.$store.state.user.model.clave !=
          this.$store.state.user.model.confirmclave
        ) {
          this.errorClave = "Las claves no coinciden";
          return false;
        }
        await this.ActualizarUsers();
      } else {
        this.tab = "datos";
      }
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
  min-height: 60vh !important;
}
.iconDepartamento {
  cursor: pointer;
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
