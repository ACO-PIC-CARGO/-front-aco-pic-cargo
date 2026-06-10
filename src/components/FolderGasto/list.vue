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
        :items="$store.state.gastos.list"
        item-key="id"
        :search="search"
      >
        <template v-slot:[`item.calculoflag`]="{ item }">
          {{ !!item.calculoflag ? "Sí" : "No" }}
        </template>
        <template v-slot:[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn icon>
            <v-icon color="primary" @click="open_read(item.id)">mdi-eye</v-icon>
          </v-btn>
          <v-btn icon>
            <v-icon color="warning" @click="open_update(item.id)"
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
          <v-list-item-title class="text-h6">
            Nuevo Tipo de Gasto
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-spacer></v-spacer>

      <v-container>
        <v-card-text>
          <v-form ref="formNew">
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="record.code"
                @blur="validate_nuevo_code()"
                :rules="[(v) => validateCode(v)]"
                lazy-validation
                :error-messages="errorCode"
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-text-field
                type="text"
                label="Descripción (*)"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-checkbox
                label="Se calcula en Reportes"
                v-model="record.calculoflag"
              >
              </v-checkbox>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              dense
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              hide-details
              color="success"
            >
            </v-switch>
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_insert()">
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerNew = !showFilterDrawerNew"
          >
            Cerrar
          </v-btn>
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
              Ver: {{ $store.state.gastos.record.description }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :value="$store.state.gastos.record.code"
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :value="$store.state.gastos.record.description"
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-checkbox
              label="Se calcula en Reportes"
              readonly
              v-model="$store.state.gastos.record.calculoflag"
            ></v-checkbox>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.gastos.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.gastos.record.status"
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
            Cerrar
          </v-btn>
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
            >
            </v-progress-linear>
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
              Modificar: {{ $store.state.gastos.record.description }}
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
                label="Descripción (*)"
                v-model="record.description"
                :rules="[(v) => validateDescription(v)]"
                lazy-validation
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-checkbox
                label="Se calcula en Reportes"
                v-model="record.calculoflag"
              ></v-checkbox>
            </v-row>
          </v-form>

          <v-row>
            <v-switch
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              color="success"
            >
            </v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_update">
            Aceptar
          </v-btn>
          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar
          </v-btn>
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
              label="Descripción"
              v-model="records.description"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-col class="px-0 py-0">
              <v-list-item-title> Se calcula en Reportes </v-list-item-title>
              <v-radio-group v-model="records.calculoflag">
                <v-radio label="Sí" :value="true"></v-radio>
                <v-radio label="No" :value="false"></v-radio>
              </v-radio-group>
            </v-col>
          </v-row>
          <v-row>
            <v-radio-group v-model="records.status" row dense>
              <v-radio label="Activo" color="green" :value="true"></v-radio>
              <v-radio label="Inactivo" color="red" :value="false"></v-radio>
              <v-radio label="Todos" color="blue" value="null"></v-radio>
            </v-radio-group>
          </v-row>
        </v-card-text>
      </v-container>

      <v-container>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_filter()">
            Aceptar
          </v-btn>
          <v-btn class="mx-1" color="ligth" @click="reset_records()">
            Limpiar
          </v-btn>

          <v-btn
            class="mx-1"
            dark
            color="warning"
            @click="showFilterDrawer = !showFilterDrawer"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";
import axios from '@/api/axios-config';;

export default {
  name: "ListGastoComponent",
  data() {
    return {
      headers: [
        { text: "Código", align: "start", value: "code" },
        { text: "Descripción", value: "description" },
        { text: "Calculado en Reportes", value: "calculoflag" },
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
        description: "",
        calculoflag: "",
        status: true,
      },
      record: {
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
        code: "",
        description: "",
        calculoflag: "",
        status: true,
      },
      originalRecord: {},
      originalRecords: {},
      showFilterDrawerNew: false,
      showFilterDrawerRead: false,
      showFilterDrawerUpdate: false,
      showFilterDrawer: false,
      id: "",
      errorCode: null,
    };
  },
  created() {
    this.originalRecord = { ...this.record };
    this.originalRecords = { ...this.records };
  },
  async mounted() {
    await this.fetchDataGasto(this.records);
    this.$store.state.mainTitle = `Tipo de Gasto`;
  },
  methods: {
    ...mapActions([
      "fetchDataGasto",
      "insertGasto",
      "readGasto",
      "updateGasto",
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
      await this.fetchDataGasto(this.records);
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
          await this.updateGasto(item);
        }
      });
    },
    resetForms() {
      this.errorCode = null;
      if (this.$refs.formNew) this.$refs.formNew.reset();
      if (this.$refs.form) this.$refs.form.reset();
    },
    open_new() {
      this.resetRecord();
      this.resetForms();
      this.showFilterDrawerNew = !this.showFilterDrawerNew;
      this.$nextTick(() => {
        this.record.calculoflag = true;
      });
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    async open_read(id) {
      this.loading_as = true;
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      await this.readGasto(id);
    },
    async open_update(id) {
      this.loading_as = true;
      this.resetRecord();
      this.resetForms();
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      await this.readGasto(id);
      this.id = id;
    },
    async submit_insert() {
      this.validate_nuevo_code();
      if (this.$refs.formNew.validate() && this.errorCode == null) {
        this.resetRecord("filter");
        await this.insertGasto(this.record);
      }
    },
    async submit_update() {
      if (this.$refs.form.validate() && this.errorCode == null) {
        let data = {
          id: this.id,
          description: this.record.description,
          calculoflag: this.record.calculoflag,
          status: this.record.status,
        };
        this.resetRecord("filter");
        await this.updateGasto(data);
      }
    },
    async submit_filter() {
      let data = { ...this.records };
      data.status = data.status == "null" ? "" : data.status;
      if (data.code === null) data.code = "";
      if (data.description === null) data.description = "";
      await this.fetchDataGasto(data);
      this.showFilterDrawer = false;
    },
    validateCode(v) {
      if (!v) {
        return "El código es requerido";
      }
      if (v.length !== 5) {
        return "El código debe tener exactamente 5 caracteres";
      }
      return true;
    },
    validateDescription(v) {
      if (!v) {
        return "La descripción es requerida";
      }
      if (v.length > 255) {
        return "La descripción permite hasta 255 caracteres";
      }
      return true;
    },
    async validate_nuevo_code() {
      this.errorCode = null;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `validar_nuevo_codigo_gasto?` +
          `id_branch=${this.record.id_branch}` +
          `&code=${encodeURIComponent(this.record.code)}`,
        headers: {
          "Content-Type": "application/json",
          "auth-token": sessionStorage.getItem("auth-token"),
        },
      };

      await axios(config)
        .then((response) => {
          let data = response.data;
          this.errorCode = data.estadoflag ? null : data.mensaje;
          if (!data.estadoflag) this.record.code = "";
        })
        .catch((error) => {
          console.log("Error al obtener los datos:", error);
        });
    },
  },
  computed: {
    ...mapState(["list"]),
  },
  watch: {
    "$store.state.gastos.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const { code, description, calculoflag, status } = newRecord;
          this.record = { code, description, calculoflag, status };
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.gastos.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
