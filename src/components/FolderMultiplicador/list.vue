<template>
  <v-card fluid class="px-5">
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
              rounded
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
        <v-btn small class="mx-1" color="success" @click="open_new()">
          Nuevo
        </v-btn>
        <v-btn small class="mx-1" color="info" @click="open_filter()">
          Fitrar
        </v-btn>
        <v-btn small class="mx-1" color="#004D40" dark> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.multiplicador.list"
        item-key="id"
        :search="search"
      >
        <template v-slot:[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn icon>
            <v-icon color="primary" @click="open_read(item)">mdi-eye</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon color="warning" @click="open_update(item)"
              >mdi-pencil</v-icon
            >
          </v-btn>

          <v-btn
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerRead"
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
            Ver: {{ $store.state.multiplicador.record.name }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-container v-if="!loading_as">
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :value="$store.state.multiplicador.record.code"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Nombre"
              readonly
              :value="$store.state.multiplicador.record.name"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :value="$store.state.multiplicador.record.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Tipo de Carga"
              readonly
              :value="$store.state.multiplicador.record.type_carga"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Valor"
              readonly
              :value="$store.state.multiplicador.record.valor"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.multiplicador.record.status
                  ? 'Activo'
                  : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.multiplicador.record.status"
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
              rounded
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
              {{
                $store.state.multiplicador.record.id
                  ? "Modificar"
                  : "Nuevo Registro"
              }}
              {{ $store.state.multiplicador.record.name }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-autocomplete
              label="Tipo de Carga (*)"
              v-model="$store.state.multiplicador.record.type_carga"
              :items="$store.state.multiplicador.shipments"
              item-text="name"
              item-value="name"
              :rules="[(v) => !!v || 'Dato requerido']"
            >
            </v-autocomplete>
          </v-row>
          <v-row v-if="$store.state.multiplicador.record.type_carga == 'FCL'">
            <v-autocomplete
              label="Contenedor Asociado"
              clearable
              v-model="$store.state.multiplicador.record.id_containers"
              :items="$store.state.itemsContainers"
              item-text="name"
              item-value="id"
            >
            </v-autocomplete>
          </v-row>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Nombre (*)"
                v-model="$store.state.multiplicador.record.name"
                :rules="[(v) => validateFieldTextInForm(v, 50, false, 'max')]"
                lazy-validation
                clearable
                v-if="!$store.state.multiplicador.record.id_containers"
              >
              </v-text-field>
            </v-row>
            <!-- <v-row>
              <v-text-field
                type="text"
                label="Descripción"
                v-model="record.description"
                :rules="[(v) => validateFieldTextInForm(v, 255, true, 'max')]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row> -->

            <v-row>
              <v-text-field
                type="number"
                label="Valor (*)"
                v-model="$store.state.multiplicador.record.valor"
                :rules="[(v) => validateNumber(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              :label="`Estado: ${
                $store.state.multiplicador.record.status ? 'Activo' : 'Inactivo'
              }`"
              v-model="$store.state.multiplicador.record.status"
              color="success"
              @change="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            v-if="!$store.state.multiplicador.record.id"
            color="success"
            @click="btnNuevo"
          >
            Nuevo
          </v-btn>
          <v-btn
            class="mx-1"
            v-if="$store.state.multiplicador.record.id"
            color="success"
            @click="btnUpdate"
          >
            Actualizar
          </v-btn>
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
              rounded
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
      <v-container>
        <v-list-item class="px-0">
          <v-list-item-content>
            <v-list-item-title class="text-h6">
              Filtrar Registros
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

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
            <v-autocomplete
              label="Tipo de Carga"
              clearable
              v-model="records.id_shipment"
              :items="$store.state.multiplicador.shipments"
              item-text="name"
              item-value="id"
            >
            </v-autocomplete>
          </v-row>

          <v-row>
            <v-radio-group v-model="records.status" row dense>
              <v-radio label="Activo" color="green" :value="1"></v-radio>
              <v-radio label="Inactivo" color="red" :value="0"></v-radio>
              <v-radio label="Todos" color="blue" value="null"></v-radio>
            </v-radio-group>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filter()"> Aceptar</v-btn>
          <v-btn class="mx-1" color="ligth" @click="reset_records()">
            Limpiar
          </v-btn>
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
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";

export default {
  name: "ListMultiplicadorComponent",
  data() {
    return {
      headers: [
        { text: "Tipo de Carga", align: "start", value: "type_carga" },
        // { text: "Código", value: "code" },
        { text: "Nombre", value: "name" },
        // { text: "Descripción", value: "description" },
        { text: "Valor", value: "valor" },
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
        description: "",
        id_shipment: "",
        status: 1,
      },
      record: {
        id: "",
        name: "",
        description: "",
        id_shipment: "",
        valor: "",
        status: 1,
      },
      originalRecord: {},
      originalrecords: {},
      showFilterDrawerRead: false,
      showFilterDrawerUpdate: false,
      showFilterDrawer: false,
      id: "",
    };
  },
  created() {
    this.originalRecord = { ...this.record };
    this.originalRecords = { ...this.records };
  },
  async mounted() {
    Promise.all([
      this.fetchDataMultiplicador(this.records),
      this.fetchDataCargarShipment(),
      this._getContainers(),
    ]);
    this.$store.state.mainTitle = `Multiplicadores`;
  },
  methods: {
    ...mapActions([
      "fetchDataCargarShipment",
      "fetchDataMultiplicador",
      "readMultiplicador",
      "updateMultiplicador",
      "nuevoMultiplicador",
      "_getContainers",
    ]),
    updateStatus(newValue) {
      this.record.status = newValue ? 1 : 0;
    },
    async resetRecord(option) {
      if (option == "filter") {
        this.records = { ...this.originalRecords };
      } else {
        this.record = { ...this.originalRecord };
      }
      await this.fetchDataMultiplicador(this.records);
      this.showFilterDrawer = false;
    },
    async reset_records() {
      this.resetRecord("filter");
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
        if (result.isConfirmed) {
          item.status = 0;
          this.resetRecord("filter");
          await this.updateMultiplicador(item);
        }
      });
    },
    async open_new() {
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      this.loading_as = false;
      this.$store.state.multiplicador.record = {};
      setTimeout(() => {
        this.$refs.form.reset();
      }, 100);
    },
    async open_read(item) {
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      this.loading_as = false;
      this.$store.state.multiplicador.record = { ...item };
    },
    async open_update(item) {
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      this.loading_as = false;
      this.$store.state.multiplicador.record = { ...item };
      this.id = item.id;
    },
    async btnNuevo() {
      let containers = this.$store.state.multiplicador.list.map((v) => {
        if (v.id_containers) {
          return v.id_containers;
        }
      });
      if (containers.includes(this.$store.state.multiplicador.id_containers)) {
        Swal.fire({
          icon: "error",
          title: "Contenedor",
          text: "Ya Existe un contenedor asociado a un Multiplicador, elimine primero ese multiplicador.",
        });
        return;
      }
      if (this.$refs.form.validate()) {
        this.resetRecord("filter");
        await this.nuevoMultiplicador(this.$store.state.multiplicador.record);
      }
    },
    async btnUpdate() {
      if (this.$refs.form.validate()) {
        this.resetRecord("filter");
        await this.updateMultiplicador(this.$store.state.multiplicador.record);
      }
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    async filter() {
      let data = { ...this.records };
      data.status = data.status == "null" ? "" : data.status;
      if (data.code === null) data.code = "";
      if (data.name === null) data.name = "";
      if (data.description === null) data.description = "";
      if (data.id_shipment === null) data.id_shipment = "";

      await this.fetchDataMultiplicador(data);
      this.showFilterDrawer = false;
    },
    resetForms() {
      if (this.$refs.formNew) this.$refs.formNew.reset();
      if (this.$refs.form) this.$refs.form.reset();
    },
    validateFieldTextInForm(v, length, isOptional, condition) {
      if (!v && !isOptional) {
        return "El campo es requerido";
      }
      if (condition == "max" && v && v.length > length) {
        return `El campo permite hasta ${length} caracteres`;
      }
      if (condition == "equal" && v && v.length !== length) {
        return `El campo debe tener ${length} caracteres`;
      }
      return true;
    },
    validateNumber(value) {
      const regex = /^(0(\.\d{0,2})?|1(\.0{0,2})?)$|^(0\.\d{0,2}|[0-1])$/;
      if (!value) {
        return "El campo es requerido";
      }
      if (!regex.test(value)) {
        return "El campo debe ser un número positivo de hasta 2 decimales, desde 0 hasta 1.";
      }
      return true;
    },
  },
  computed: {
    ...mapState(["list"]),
  },
  watch: {
    "$store.state.multiplicador.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const { id, name, description, id_shipment, valor, status } =
            newRecord;
          this.record = { id, name, description, id_shipment, valor, status };
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.multiplicador.record.id_containers": {
      handler(newRecord, oldRecord) {
        if (newRecord) {
          let container = this.$store.state.itemsContainers.find(
            (v) => v.id == newRecord,
          );
          this.$store.state.multiplicador.record.name = container.name;
        } else {
          this.$store.state.multiplicador.record.name = "";
        }
      },
    },
    "$store.state.multiplicador.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
