<template>
  <v-card class="px-5">
    <v-card elevation="0">
      <v-container v-if="loading" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>

      <v-card-title v-if="!loading" class="elevation-0">
        <v-text-field
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          v-model="search"
        >
        </v-text-field>
        <v-spacer></v-spacer>
        <v-btn small color="success" @click="open_new()"> Nuevo </v-btn>
        <v-btn small class="mx-1" color="#2962FF" dark @click="open_filter()">
          Fitrar
        </v-btn>
        <v-btn small class="mx-1" color="#004D40" dark> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.bank.list"
        item-key="id"
        :search="search"
      >
        <template v-slot:[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn class="mx-1" small icon>
            <v-icon color="primary" @click="open_read(item.id)">mdi-eye</v-icon>
          </v-btn>
          <v-btn class="mx-1" small icon>
            <v-icon color="#0D47A1" @click="abrirCuentas(item)"
              >mdi-bank</v-icon
            >
          </v-btn>
          <v-btn class="mx-1" small icon>
            <v-icon color="warning" @click="open_update(item.id)"
              >mdi-pencil</v-icon
            >
          </v-btn>

          <v-btn
            class="mx-1"
            small
            icon
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon color="red">mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="100vh"
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6"> Nuevo Banco </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                :rules="[(v) => validateAcronym(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              dense
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              hide-details
              color="success"
              @change="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="insert()"> Aceptar</v-btn>
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerNew = !showFilterDrawerNew"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="100vh"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              Ver: {{ $store.state.bank.record.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :value="$store.state.bank.record.code"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :value="$store.state.bank.record.name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              readonly
              :value="$store.state.bank.record.acronym"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :value="$store.state.bank.record.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.bank.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.bank.record.status"
            ></v-switch>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerRead = !showFilterDrawerRead"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawerUpdate"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="100vh"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              Modificar: {{ $store.state.bank.record.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              type="text"
              label="Código"
              v-model="record.code"
              readonly
            >
            </v-text-field>
          </v-row>

          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Acrónimo (*)"
                v-model="record.acronym"
                :rules="[(v) => validateAcronym(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="record.name"
                :rules="[(v) => validateName(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
          </v-form>

          <v-row>
            <v-switch
              label="Activo / Inactivo"
              v-model="record.status"
              color="success"
              @change="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_update">
            Aceptar</v-btn
          >
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple accent-4"
              indeterminate
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>
    </v-navigation-drawer>

    <v-navigation-drawer
      v-model="showFilterDrawer"
      absolute
      bottom
      temporary
      right
      width="30%"
      height="100vh"
    >
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h6">
            Filtrar Registros
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              v-model="records.code"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Acrónimo"
              v-model="records.acronym"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              v-model="records.name"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              v-model="records.description"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-radio-group v-model="records.status" row dense>
              <v-radio label="Activo" color="green" :value="1"></v-radio>
              <v-radio label="Inactivo" color="red" :value="0"></v-radio>
              <v-radio label="Todos" color="blue" value="null"></v-radio>
            </v-radio-group>
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filter()">Aceptar</v-btn>
          <v-btn class="mx-1" color="ligth" @click="resetRecord('filter')"
            >Limpiar</v-btn
          >
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>

    <v-dialog v-model="cuentasFlag" scrollable persistent width="80%">
      <v-card v-if="datosBanco">
        <v-card-title primary-title>
          {{ datosBanco.name }} {{ datosBanco.acronym }}
          <v-spacer></v-spacer>
          <v-btn icon @click="cuentasFlag = !cuentasFlag"
            ><v-icon>mdi-close</v-icon></v-btn
          >
        </v-card-title>
        <v-card-text>
          <v-data-table
            :headers="headersCuenta"
            :items="datosBanco.banks_details"
            class="elevation-1"
            item-key="index"
            dense
            :items-per-page="5"
          >
            <template v-slot:[`item.coins`]="{ item }">
              <v-autocomplete
                :items="$store.state.itemsCoinsList"
                v-model="item.id_coin"
                item-text="acronym"
                item-value="id"
                readonly
                dense
              />
            </template>
            <template v-slot:[`item.action`]="{ item }">
              <v-row>
                <v-col>
                  <v-btn icon>
                    <v-icon color="warning" @click="abrirCuenta(item)"
                      >mdi-pencil</v-icon
                    >
                  </v-btn>
                </v-col>
                <v-col>
                  <v-btn color="error" icon @click="EliminarCuenta(item)"
                    ><v-icon>mdi-delete</v-icon></v-btn
                  >
                </v-col>
              </v-row>
            </template>
            <template v-slot:[`item.esprincipalflag`]="{ item }">
              {{ item.esprincipalflag == 1 ? "Si" : "No" }}
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="abrirNuevaCuenta()"
            >Nueva Cuenta</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="cuentaFlag" scrollable persistent width="50%">
      <v-card v-if="cuenta">
        <v-card-title primary-title> </v-card-title>
        <v-card-text>
          <v-form ref="frmCuenta">
            <v-autocomplete
              :items="$store.state.itemsCoinsList"
              v-model="cuenta.id_coin"
              item-text="acronym"
              item-value="id"
              label="Moneda"
              :rules="[(v) => !!v || 'Dato Requerido']"
            />
            <v-text-field
              label="Nro Cuenta"
              v-model="cuenta.nrocuenta"
              :rules="[(v) => !!v || 'Dato Requerido']"
            ></v-text-field>
            <v-text-field label="CCI" v-model="cuenta.nrocci"></v-text-field>

            <v-checkbox
              v-if="cuenta.id"
              :label="cuenta.status == 1 ? 'Activo' : 'Inactivo'"
              v-model="cuenta.status"
            ></v-checkbox>
            <!-- v-if="cuenta.id" -->
            <v-checkbox
              label="Usar En FACTURACIÓN DE CONTROL DE GASTOS"
              v-model="cuenta.esprincipalflag"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn sm color="success" @click="guardarCuenta()">Guardar</v-btn>
          <v-btn sm color="danger" @click="cuentaFlag = !cuentaFlag"
            >Cerrar</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";

export default {
  name: "ListBankComponent",
  data() {
    return {
      datosBanco: null,
      cuentasFlag: false,
      cuentaFlag: false,
      cuenta: "",
      headersCuenta: [
        { width: "35%", text: "Nro Cuenta", value: "nrocuenta" },
        { width: "35%", text: "CCI", value: "nrocci" },
        { width: "10%", text: "Moneda", value: "coins" },
        { width: "10%", text: "Usar Facturación", value: "esprincipalflag" },
        { width: "15%", text: "Acción", value: "action", align: "center" },
      ],
      lstCuentas: [],
      headers: [
        { text: "Código", align: "start", value: "code" },
        { text: "Acrónimo", value: "acronym" },
        { text: "Nombre", value: "name" },
        { text: "Descripción", value: "description" },
        { text: "Estado", value: "status" },
        { text: "Creación", value: "created_at" },

        { text: "Última Actualización", value: "updated_at" },
        { text: "Acciones", value: "action" },
      ],
      loading: true,
      loading_as: true,
      item: "",
      search: "",
      records: {
        code: "",
        name: "",
        acronym: "",
        description: "",
        status: 1,
      },
      record: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        acronym: "",
        name: "",
        code: "",
        description: "",
        status: 1,
      },
      originalRecord: {},
      originalRecords: {},
      showFilterDrawerNew: false,
      showFilterDrawerRead: false,
      showFilterDrawerUpdate: false,
      showFilterDrawer: false,
      id: "",
      response_filter: null,
    };
  },
  created() {
    this.originalRecord = { ...this.record };
    this.originalRecords = { ...this.records };
  },
  async mounted() {
    await this.fetchDataBank(this.records);
    this.$store.state.mainTitle = `Banco`;
    await this._getCoinsList(this.records);
  },
  methods: {
    ...mapActions([
      "fetchDataBank",
      "insertBank",
      "readBank",
      "updateBank",
      "_getCoinsList",
      "guardarCuentaDetalle",
      "eliminarCuentaDetalle",
    ]),
    updateStatus(newValue) {
      this.record.status = newValue ? 1 : 0;
    },
    abrirCuentas(item) {
      this.cuentasFlag = true;
      this.datosBanco = { ...item };
    },
    abrirCuenta(item) {
      this.cuentaFlag = true;
      this.cuenta = { ...item };
    },
    abrirNuevaCuenta() {
      this.cuentaFlag = true;
      this.cuenta = {
        id: "",
        id_bank: this.datosBanco.id,
        id_coin: "",
        nrocci: "",
        nrocuenta: "",
        status: "",
        trial438: "",
        uptated_at: "",
      };
    },
    async guardarCuenta() {
      console.log('dd')
      let val = false;
      let namePrincipal = "";
      if (this.cuenta.esprincipalflag) {
        this.$store.state.bank.list.forEach((element) => {
          element.banks_details.forEach((element2) => {
            if (element2.esprincipalflag && element2.id != this.cuenta.id) {
              val = true;
              namePrincipal = element.name + " - " + element2.nrocuenta;
            }
          });
        });
        if (val) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: `Ya existe una cuenta principal. ${namePrincipal}. Actualice`,
          });
          return;
        }
      }
      console.log('dd2')
      if (this.$refs.frmCuenta.validate()) {
        this.cuenta.status =
          this.cuenta.status == 0 || this.cuenta.status == false ? 0 : 1;
        await this.guardarCuentaDetalle(this.cuenta);
        this.cuentasFlag = false;
        this.cuentaFlag = false;
      }
    },
    async insert() {
      if (this.$refs.formNew.validate()) {
        this.resetRecord("filter");
        await this.insertBank(this.record);
      }
    },
    async EliminarCuenta(item) {
      Swal.fire({
        icon: "question",
        title: ``,
        text: `Desea ${item.status == 1 ? "Activar " : "Eliminar"} la cuenta ${
          item.nrocuenta
        } `,
        showDenyButton: true,
        denyButtonText: "Cancelar",
      }).then(async (res) => {
        if (res.isConfirmed) {
          item.status = item.status == 1 ? 1 : 0;
          await this.eliminarCuentaDetalle(item);
        }
        if (res.isDenied) {
          await this.fetchDataBank(this.records);
        }
      });
      this.cuentasFlag = false;
      //
    },
    async reset_records() {
      this.resetRecord("filter");
      this.filter();
    },
    async resetRecord(option) {
      if (option == "filter") {
        this.records = { ...this.originalRecords };
      } else {
        this.record = { ...this.originalRecord };
      }
      // await this.fetchDataBank(this.records);
      this.showFilterDrawer = false;
    },
    async switch_status(item) {
      Swal.fire({
        title: "¿Estás seguro?",
        text: `Si inactiva el registro, éste no aparecerá disponible en otros formularios ¿Está seguro de que desea inactivarlo?`,
        confirmButtonColor: "red",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, inactivar",
        cancelButtonColor: "orange",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        item.status = 0;
        if (result.isConfirmed) {
          this.resetRecord("filter");
          await this.updateBank(item);
        } else {
          item.status = !status;
        }
      });
    },
    open_read(id) {
      this.loading_as = true;
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      this.readBank(id);
    },
    async open_update(id) {
      this.loading_as = true;
      this.resetForms();
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      await this.readBank(id);
      this.id = id;
    },
    async submit_update() {
      if (this.$refs.form.validate()) {
        let data = {
          id: this.id,
          acronym: this.record.acronym,
          name: this.record.name,
          description: this.record.description,
          status: this.record.status,
        };
        this.resetRecord("filter");
        await this.updateBank(data);
      }
    },
    open_new() {
      this.loading_as = true;
      this.resetForms();
      this.resetRecord();
      this.showFilterDrawerNew = !this.showFilterDrawerNew;
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    async filter() {
      let data = { ...this.records };
      data.status = data.status == "null" ? "" : data.status;

      if (data.code === null) data.code = "";
      if (data.acronym === null) data.acronym = "";
      if (data.name === null) data.name = "";
      if (data.description === null) data.description = "";

      await this.fetchDataBank(data);
      this.showFilterDrawer = false;
    },
    validateAcronym(v) {
      let maxLength = 255;
      if (!v) {
        return "El acŕonimo es requerido";
      }
      if (v.length > maxLength) {
        return `El acrónimo permite hasta ${maxLength} caracteres `;
      }
      return true;
    },
    validateName(v) {
      let maxLength = 255;
      if (!v) {
        return "El nombre es requerido";
      }
      if (v.length > maxLength) {
        return `El nombre permite hasta ${maxLength} caracteres `;
      }
      return true;
    },
    validateDescription(v) {
      const maxLength = 255;
      return v && v.length > maxLength
        ? `La descripción permite hasta ${maxLength} caracteres`
        : true;
    },
    resetForms() {
      if (this.$refs.formNew) this.$refs.formNew.reset();
      if (this.$refs.form) this.$refs.form.reset();
    },
  },
  computed: {
    ...mapState(["list"]),
  },
  watch: {
    "$store.state.bank.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const { code, acronym, name, description, status } = newRecord;
          this.record = { code, acronym, name, description, status };
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.bank.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
