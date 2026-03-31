<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
    <v-overlay :value="$store.state.spiner">
      <v-row class="fill-height" align-content="center" justify="center">
        <v-col class="text-subtitle-1 text-center" cols="12">
          Cargando Datos, espere un momento por favor...
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
    </v-overlay>
    <v-dialog persistent width="600" v-model="dialogWelcome">
      <v-card>
        <v-card-title> Bienvenido </v-card-title>
        <v-card-text>
          <p style="font-size: 18px">
            Hola querido usuario <br /><br />
            Te informamos que, a partir de este momento, cada vez que exista una
            nueva actualización por parte de nuestro proveedor, el sistema
            permanecerá bloqueado hasta que usted lo actualice presionando las
            teclas CTRL + F5. <br />
            <br />
            En el caso de dispositivo movil, tendra que salir del sistema e
            ingresar hasta que ya el mensaje no aparezca. <br /><br />
            Cuando el mensaje de la actualización desaparezca, quiere decir que
            el sistema ya se encuentra actualizado. Saludos
          </p>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="closeWelcome()" color="primary">Entendido</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      v-if="false"
      persistent
      v-model="dialogVersion"
      :width="$vuetify.breakpoint.smAndDown ? '100%' : '25%'"
    >
      <v-card class="px-1 py-2 text-center" elevation="2">
        <v-icon color="success" style="font-size: 6em"
          >mdi-check-circle-outline</v-icon
        >
        <h2 class="my-2">Hemos mejorado ACO para ti</h2>
        <div v-if="!cargando">
          Actualiza y Activa las nuevas funciones
          <v-btn class="my-2" color="success" @click="actualizar"
            >Actualizar Ahora</v-btn
          >
          <p class="my-2"><v-icon>mdi-clock</v-icon> Solo tomará 5 segundos</p>
        </div>
        <div v-else>
          <v-progress-circular
            indeterminate
            color="primary"
            size="40"
            class="my-3"
          ></v-progress-circular>
          <p class="my-2">Actualizando... Por favor espera</p>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogExito" max-width="400">
      <v-card class="text-center pa-4">
        <v-icon color="success" style="font-size: 5em">mdi-thumb-up</v-icon>
        <h3 class="my-2">¡Gracias!</h3>
        <p>¡Ya tienes la última versión de ACO!</p>
        <v-btn color="primary" class="mt-4" @click="dialogExito = false">
          Aceptar
        </v-btn>
      </v-card>
    </v-dialog>

    <v-dialog persistent width="600" v-model="dialogPower">
      <v-card>
        <v-card-title> SISTEMA APAGADO</v-card-title>
        <v-card-text>
          <v-container fluid>
            <v-row>
              <v-col cols="4">
                <img
                  class="mt-4"
                  width="80%"
                  src="../public/img/svg/power.svg"
                  alt=""
                />
              </v-col>
              <v-col cols="8">
                <p style="font-size: 18px">
                  Hola <br /><br />
                  En este momento el proveedor se encuentra realizando cambios o
                  mantenimientos en el sistema, por lo tanto el sistema estará
                  apagado hasta que el proveedor lo indique. <br /><br />
                  Nos disculpamos por las molestias, saludos.
                </p>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="$store.state.modalEntitie"
      v-if="$store.state.modalEntitie"
      width="90%"
    >
      <v-card>
        <v-card-title class="text-h5">
          Ficha de Clientes <v-spacer></v-spacer>
          <v-btn
            icon
            color="red"
            @click="$store.state.modalEntitie = !$store.state.modalEntitie"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <EditarCliente
            v-if="$store.state.house_id_consigner"
            @btnGuardar="guardarClienteFlag = $event"
            :isPricing="isPricing"
            :house_id_consigner="$store.state.house_id_consigner"
          />
          <NuevoCliente
            @btnGuardar="guardarClienteFlag = $event"
            :isPricing="isPricing"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            v-if="mostrarBtnGuardar()"
            color="success"
            @click="registrarCliente"
            class="px-10"
          >
            Guardar
          </v-btn>
          <v-btn
            v-if="$store.state.house_id_consigner"
            color="success"
            @click="modificarCliente"
            class="px-10"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalvelocidad" max-width="1200">
      <v-card>
        <!-- <v-card-title class="text-h5"> Test de velocidad </v-card-title> -->
        <v-card-text>
          <iframe
            width="100%"
            height="650px"
            frameborder="0"
            src="https://pic-cargo.speedtestcustom.com"
          ></iframe>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="$store.state.modalvelocidad = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalContainers" max-width="390">
      <v-card>
        <v-card-title class="text-h5"> Control de Contenedores </v-card-title>
        <v-card-text>
          <v-form ref="formContenedor">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-autocomplete
                    :items="$store.state.itemsContainers"
                    item-text="name"
                    item-value="id"
                    return-object
                    label="Tipo de contenedor"
                    v-model="$store.state.master_id_containers"
                    :rules="[(v) => !!v || 'Dato Requerido']"
                  ></v-autocomplete>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="$store.state.master_nro_containers"
                    label="Nro. Contenedor"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="$store.state.master_nro_precinto"
                    label="Nro. Precinto"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    type="number"
                    v-model="$store.state.master_cantidad"
                    label="Cant."
                    :rules="[
                      (v) => !!v || 'Dato Requerido',
                      (v) => v >= 0 || 'Debe ser un número positivo',
                    ]"
                  ></v-text-field>
                </v-col>
                <v-col>
                  <v-btn
                    @click.native="
                      _setDataContainers(
                        $store.state.master_id_containers.id,
                        $store.state.master_id_containers.name,
                        $store.state.master_nro_containers,
                        $store.state.master_nro_precinto,
                        $store.state.master_cantidad,
                      )
                    "
                    block
                    color="primary"
                    >AGREGAR CONTENEDOR</v-btn
                  >
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="$store.state.modalContainers = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalPhones" max-width="550">
      <v-card>
        <v-card-title class="text-h5"> Teléfono </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="4">
              <v-autocomplete
                :items="$store.state.itemsPhone"
                item-text="name"
                item-value="id"
                label="Tipo de Teléfono"
                return-object
                v-model="$store.state.phone_id"
              >
              </v-autocomplete>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="$store.state.phone_number"
                label="N°. Teléfono"
              >
              </v-text-field>
            </v-col>
            <v-col cols="2">
              <v-btn
                v-if="
                  $store.state.phone_id != '' && $store.state.phone_number != ''
                "
                class="mx-2"
                fab
                color="teal darken-1
"
                dark
                elevation="0"
                @click="_addPhones($route.params.id)"
                ><v-icon x-large>mdi-plus</v-icon></v-btn
              >
            </v-col>
          </v-row>
          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Tipo</th>
                  <th class="text-left">N°. Teléfono</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item of $store.state.itemsListPhone" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>
                    {{ item.number }}
                  </td>

                  <td>
                    <v-btn
                      @click="_deletePhones(item.id)"
                      fab
                      x-small
                      elevation="0"
                      ><v-icon color="red">mdi-delete</v-icon></v-btn
                    >
                    <a
                      v-if="item.id == 2"
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                      ><v-icon color="green">mdi-whatsapp</v-icon></a
                    >
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                      ><v-icon color="blue-grey darken-3">mdi-phone</v-icon></a
                    >
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="$store.state.modalPhones = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalPhonesEdit" max-width="550">
      <v-card>
        <v-card-title class="text-h5"> Teléfonos </v-card-title>
        <v-card-text>
          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Tipo</th>
                  <th class="text-left">N°. Teléfono</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item of $store.state.itemsListPhoneEdit"
                  :key="item.id"
                >
                  <td>{{ item.tipo_phone }}</td>
                  <td>
                    {{ item.phone }}
                  </td>

                  <td>
                    <!--  <v-btn
                      @click="_deletePhones(index)"
                      fab
                      x-small
                      elevation="0"
                      ><v-icon color="red">mdi-delete</v-icon></v-btn
                    > -->
                    <a
                      v-if="item.tipo_phone == 'Celular'"
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                      ><v-icon color="green">mdi-whatsapp</v-icon></a
                    >
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                      ><v-icon color="blue-grey darken-3">mdi-phone</v-icon></a
                    >
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="$store.state.modalPhonesEdit = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalContacts" max-width="750">
      <v-card>
        <v-card-title class="text-h5"> Contactos </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="7">
              <v-text-field
                label="Nombre Completo"
                v-model="$store.state.contact_name"
              >
              </v-text-field>
            </v-col>

            <v-col cols="3">
              <v-text-field
                v-model="$store.state.contact_number"
                label="N°. Teléfono"
              >
              </v-text-field>
            </v-col>
            <v-col cols="2">
              <v-btn
                v-if="
                  $store.state.contact_name != '' &&
                  $store.state.contact_number != ''
                "
                class="mx-2"
                fab
                color="teal darken-1
"
                dark
                elevation="0"
                @click="_addContacts()"
                ><v-icon x-large>mdi-plus</v-icon></v-btn
              >
            </v-col>
          </v-row>
          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Nombre Completo</th>
                  <th class="text-left">N°. Teléfono</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item, i) of $store.state.itemsListContact"
                  :key="item.id"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ item.number }}</td>
                  <td>
                    <v-btn @click="_deleteContacts(i)" fab x-small elevation="0"
                      ><v-icon color="red">mdi-delete</v-icon></v-btn
                    >
                    <a
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                      ><v-icon color="green">mdi-whatsapp</v-icon></a
                    >
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                      ><v-icon color="blue-grey darken-3">mdi-phone</v-icon></a
                    >
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="$store.state.modalContacts = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalCuentas" max-width="750">
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
                <tr
                  v-for="item of $store.state.itemsDataAccountsNumberList"
                  :key="item.id"
                >
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
          <v-btn
            color="green darken-1"
            text
            @click="$store.state.modalCuentas = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalContactsEdit" max-width="750">
      <v-card>
        <v-card-title class="text-h5"> Contactos </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="7">
              <v-text-field
                label="Nombre Completo"
                v-model="$store.state.contact_name"
              >
              </v-text-field>
            </v-col>

            <v-col cols="5">
              <v-text-field
                v-model="$store.state.contact_number"
                label="N°. Teléfono"
              >
              </v-text-field>
            </v-col>
            <!-- <v-col cols="2">
              <v-btn
                v-if="
                  $store.state.contact_name != '' &&
                  $store.state.contact_number != ''
                "
                class="mx-2"
                fab
                color="teal darken-1
"
                dark
                elevation="0"
                @click="_addContacts()"
                ><v-icon x-large>mdi-plus</v-icon></v-btn
              >
            </v-col> -->
          </v-row>
          <v-simple-table dense>
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-left">Nombre Completo</th>
                  <th class="text-left">N°. Teléfono</th>
                  <th class="text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item of $store.state.itemsListContactEdit"
                  :key="item.id"
                >
                  <td>{{ item.name }}</td>
                  <td>{{ item.number }}</td>
                  <td>
                    <!-- <v-btn @click="_deleteContacts(i)" fab x-small elevation="0"
                      ><v-icon color="red">mdi-delete</v-icon></v-btn
                    > -->
                    <a
                      fab
                      x-small
                      elevation="0"
                      color="green"
                      dark
                      class="ml-5"
                      target="_blank"
                      style="text-decoration: none"
                      :href="`https://wa.me/51${item.number}`"
                      ><v-icon color="green">mdi-whatsapp</v-icon></a
                    >
                    <a
                      fab
                      x-small
                      elevation="0"
                      dark
                      class="ml-5"
                      style="text-decoration: none"
                      :href="`tel:+${item.number}`"
                      ><v-icon color="blue-grey darken-3">mdi-phone</v-icon></a
                    >
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="green darken-1"
            text
            @click="$store.state.modalContactsEdit = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="$store.state.modalServices" max-width="400">
      <v-card>
        <v-card-title class="text-h5">
          Control de Servicios <v-spacer></v-spacer>
          <v-btn
            icon
            color="red"
            @click="$store.state.modalServices = !$store.state.modalServices"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <ControlServices />
        </v-card-text>
      </v-card>
    </v-dialog>

    <audio
      v-if="newquote"
      src="../public/sound/Messenger Tono de Mensaje - Sonido.mp3"
      autoplay
      loop
      controls
    ></audio>
  </v-app>
</template>

<script>
// import { io } from "socket.io-client";
import { mapActions, mapState } from "vuex";
import axios from "axios";
import Swal from "sweetalert2";

export default {
  name: "App",

  data: () => ({
    listAgente: false,
    dialogWelcome: false,
    dialogVersion: false,
    dialogExito: false,
    cargando: false,
    dialogPower: false,
    id: "",
    newquote: false,
    guardarClienteFlag: false,
    isPricing: false,
  }),
  async mounted() {
    this.$store.state.security = JSON.parse(sessionStorage.getItem("security"));
    setTimeout(() => {
      this.$store.state.lstMenu = JSON.parse(sessionStorage.getItem("menu"));
    }, 10);

    // Desactivado: comprobación de versión y diálogo de actualización
    // await this._validaVersion();
    await this._getVersion();

    var vm = this;
    vm.$store.state.drawer = false;

    if (this.$route.params.id) {
      this.id = this.$route.params.id;
    }
    let urlPricing = ["newQuote", "verQuote", "editQuote"];
    if (urlPricing.includes(this.$route.name)) {
      this.isPricing = true;
    }
    if (localStorage.getItem("actualizando") === "1") {
      localStorage.removeItem("actualizando");
      this.dialogVersion = false;
      this.dialogExito = true;
    }
  },
  async beforeMount() {
    sessionStorage.removeItem("hasReloaded");
    sessionStorage.setItem("version", process.env.VUE_APP_VERSION);
    localStorage.setItem("version", process.env.VUE_APP_VERSION);
  },

  computed: {},

  methods: {
    ...mapActions([
      "_getContainers",
      "_addPhones",
      "_addContacts",
      "_getAccountList",
      "_getBanksList",
      "_getCoinsList",
      "GetTotalCotizacion",
      "actualizarCliente",
      "guardarCliente",
    ]),
    actualizar() {
      this.cargando = true;
      localStorage.setItem("actualizando", "1");
      setTimeout(() => {
        const url = window.location.origin + window.location.pathname;
        window.location.href = `${url}?v=${new Date().getTime()}`;
      }, 5000); // espera 5 segundos
    },
    async registrarCliente() {
      var vm = this;

      vm.$store.state.spiner = true;
      await vm.guardarCliente();
      vm.$store.state.spiner = false;
    },
    async modificarCliente() {
      var vm = this;
      vm.$store.state.spiner = true;
      await vm.actualizarCliente();
      vm.$store.state.modalEntitie = false;
      vm.$store.state.recargarClienteFlag =
        !vm.$store.state.recargarClienteFlag;
      vm.$store.state.spiner = false;
    },
    closeWelcome() {
      sessionStorage.setItem("welcome", 1);
      this.dialogWelcome = false;
    },
    _validaWelcome() {
      if (sessionStorage.getItem("welcome")) {
        this.dialogWelcome = false;
      } else {
        this.dialogWelcome = true;
      }
    },
    _setDataContainers(id, name, nrocontainer, nroprecinto, cantidad) {
      if (this.$refs.formContenedor.validate()) {
        this.$store.state.master_itemsContainers.push({
          id_container: id,
          name: name,
          nro_container: nrocontainer,
          nro_precinto: nroprecinto,
          cantidad: cantidad,
        });

        this.$store.state.modalContainers = false;

        this.$store.state.master_id_containers = "";
        this.$store.state.master_nro_containers = "";
        this.$store.state.master_nro_precinto = "";
        this.$store.state.master_cantidad = "";
      }
    },

    async _validaVersion() {
      var vm = this;
      setInterval(async () => {
        await vm._getVersion();
        // await vm.validateTotal();
      }, 30000);
    },

    cleanData() {
      this.$store.state.accountIdTypeAccount = "";
      this.$store.state.accountIdBanks = "";
      this.$store.state.accountIdCoins = "";
      this.$store.state.accountNumer = "";
    },

    async _getVersion() {
      var vm = this;
      let data = {
        modulo: "operativo",
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "getVersion",
        headers: {
          "Content-Type": "application/json",
        },
        data: data,
      };

      try {
        await axios(config)
          .then(function (response) {
            const serverVersion = response.data.data[0].version;
            const currentVersion = sessionStorage.getItem("version");

            // if (currentVersion && serverVersion !== currentVersion) {
            //   sessionStorage.setItem("version", serverVersion);

            //   if (!sessionStorage.getItem("hasReloaded")) {
            //     sessionStorage.setItem("hasReloaded", "1");
            //     window.location.href = window.location.origin;
            //   }
            // }

            if (
              !!sessionStorage.getItem("version") &&
              response.data.data[0].version != sessionStorage.getItem("version")
            ) {
              // window.location.reload(true);
              vm.dialogVersion = true;
            } else {
              vm.dialogVersion = false;
            }

            if (response.data.data[0].power != 1) {
              vm.dialogPower = true;
            } else {
              vm.dialogPower = false;
            }
          })
          .catch(function (error) {
            console.log(error);
          });
      } catch (error) {
        console.log(error);
      }
    },

    async _delAccount(id) {
      var vm = this;
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "delAccount/" + id,
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
      };
      await axios(config)
        .then(function (response) {
          vm._getAccountsNumber();
        })
        .catch(function (error) {
          console.log(error);
        });
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
          "auth-token": sessionStorage.getItem("auth-token"),
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

    async _setAccounts() {
      var vm = this;
      var data = {
        id_entities: vm.$route.params.id,
        id_account: vm.$store.state.accountIdTypeAccount,
        id_banks: vm.$store.state.accountIdBanks,
        id_coins: vm.$store.state.accountIdCoins,
        accountNumber: vm.$store.state.accountNumer,
        status: vm.$store.state.accountStatus,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
      };
      var config = {
        method: "post",
        url: process.env.VUE_APP_URL_MAIN + "setAccount",
        headers: {
          "auth-token": sessionStorage.getItem("auth-token"),
          "Content-Type": "application/json",
        },
        data: data,
      };
      await axios(config)
        .then(function (response) {
          vm._getAccountsNumber();
        })
        .catch(function (error) {
          console.log(error);
        });
    },

    _delContainers(index) {
      this.$store.state.master_itemsContainers.splice(index, 1);
    },

    _nextListAgents() {
      this._getEntities(1);

      this.listAgente = !this.listAgente;
    },

    _deletePhones(index) {
      this.$store.state.itemsListPhone.splice(index, 1);
    },

    _deleteContacts(i) {
      this.$store.state.itemsListContact.splice(i, 1);
    },
    async validateTotal() {
      if (JSON.parse(sessionStorage.getItem("totalCotizacion"))) {
        let totalCotizacion = JSON.parse(
          sessionStorage.getItem("totalCotizacion"),
        );
        await this.GetTotalCotizacion();
        let val = true;
        totalCotizacion.forEach((element) => {
          let validate =
            this.$store.state.calculadoras.listTotalCotizacion.filter(
              (v) => v.rtype == element.rtype && v.total == element.total,
            ).length;
          val = validate == 0 ? false : val;
        });
        if (!val) {
          this.newquote = true;
          Swal.fire({
            icon: "warning",
            text: "Se a registrado una nueva cotización.",
            confirmButtonText: "Ok",
          }).then((result) => {
            if (result.isConfirmed) {
              this.newquote = false;
              sessionStorage.setItem(
                "totalCotizacion",
                JSON.stringify(
                  this.$store.state.calculadoras.listTotalCotizacion,
                ),
              );
            }
          });
        }
      } else {
        await this.GetTotalCotizacion();
        sessionStorage.setItem(
          "totalCotizacion",
          JSON.stringify(this.$store.state.calculadoras.listTotalCotizacion),
        );
      }
    },
    mostrarBtnGuardar() {
      if (!this.$store.state.entities.cliente.id_tipopersona) {
        return false;
      }
      if (!this.$store.state.entities.cliente.nombrecompleto) {
        return false;
      }
      if (!this.$store.state.entities.cliente.id_tipotransaccion) {
        return false;
      }
      if (!this.$store.state.entities.cliente.id_pais) {
        return false;
      }
      if (!this.$store.state.entities.cliente.telefonoActual.telefono) {
        return false;
      }
      if (this.$store.state.entities.house_id_consigner) {
        return false;
      }
      return true;
    },
  },

  components: {
    ControlServices: () => import("@/components/servicesControl.vue"),
    listEntitie: () => import("@/components/folderEntities/listEntities"),
    NuevoCliente: () =>
      import("@/components/folderEntities/Cliente/NuevoClienteComponent.vue"),
    EditarCliente: () =>
      import("@/components/folderEntities/Cliente/EditarClienteComponent.vue"),
  },
};
</script>

<style lang="scss">
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap");
* {
  font-family: "Roboto", sans-serif;
}

.v-application--wrap {
  min-height: 85vh !important;
}
.title {
  font-size: 2rem;
}
.ocultar {
  display: none !important;
}
</style>
<style>
/* Oculta en móviles (menos de 992px) */
@media screen and (max-width: 1024px) and (orientation: portrait) {
  .ocultarMovil {
    display: none !important;
  }

  .wrap-text-btn {
    white-space: normal !important;
    text-align: center;
    line-height: 1.3;
    word-break: break-word;
    display: inline-flex !important;
    flex-wrap: wrap !important;
    justify-content: center;
    align-items: center;
  }
}


.contenedor-scroll {
  height: 100vh;

  overflow-y: auto;
}
</style>
