<template>
  <v-card fluid class="px-5">
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
      :items="$store.state.year.list"
      item-key="id"
      :search="search"
    >
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

        <v-btn icon>
          <v-btn
            icon
            color="red"
            @click="switch_status(item)"
            v-if="item.status"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
          <!-- <v-switch
              v-model="item.status"
              color="success"
              @change="switch_status(item)"
            ></v-switch> -->
        </v-btn>
      </template>
    </v-data-table>

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
          <v-list-item-title class="text-h6"> Nuevo Año </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-spacer></v-spacer>
      <v-container class="">
        <v-card-text>
          <v-form ref="form">
            <v-row>
              <v-text-field
                type="text"
                label="Código (*)"
                v-model="record.description"
                clearable
                :rules="[(v) => validateCode(v)]"
                lazy-validation
                @blur="validate_code()"
                :error-messages="errorCode"
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
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_insert()">
            Aceptar</v-btn
          >
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
              Ver: {{ $store.state.year.record.description }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :value="$store.state.year.record.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.year.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.year.record.status"
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
              Modificar: {{ $store.state.year.record.description }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field readonly label="Código" v-model="record.description">
            </v-text-field>
          </v-row>
          <v-row>
            <v-switch
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
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
      <v-container @click.stop>
        <v-list-item class="px-0">
          <v-list-item-content>
            <v-list-item-title class="text-h6"> Filtrar Año </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              v-model="records.description"
              clearable
            ></v-text-field>
          </v-row>
          <v-row>
            <v-row>
              <v-radio-group v-model="records.status" row dense>
                <v-radio label="Activo" color="green" :value="1"></v-radio>
                <v-radio label="Inactivo" color="red" :value="0"></v-radio>
                <v-radio label="Todos" color="blue" value="null"></v-radio>
              </v-radio-group>
            </v-row>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="filter()"> Aceptar</v-btn>
          <v-btn class="mx-1" color="ligth" @click="reset_records()">
            Limpiar</v-btn
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
  </v-card>
</template>

<script>
import { mapState, mapActions } from "vuex";
import Swal from "sweetalert2";
import axios from '@/api/axios-config';

export default {
  name: "ListYearComponent",
  data() {
    return {
      headers: [
        { text: "Código", align: "start", value: "description" },
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
        description: "",
        status: 1,
      },
      record: {
        description: "",
        status: 1,
        id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0].id_branch,
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
    await this.fetchDataYear(this.records);
    this.$store.state.mainTitle = `Año`;
  },
  methods: {
    ...mapActions(["fetchDataYear", "insertYear", "readYear", "updateYear"]),
    updateStatus(newValue) {
      this.record.status = newValue ? 1 : 0;
    },
    async submit_insert() {
      this.validate_code();

      setTimeout(async () => {
        if (this.$refs.form.validate() && this.errorCode == null) {
          this.resetRecord("filter");
          await this.insertYear(this.record);
        }
      }, 500);
    },
    async resetRecord(option) {
      if (option == "filter") this.records = { ...this.originalRecords };
      else this.record = { ...this.originalRecord };
      await this.filter();
      this.showFilterDrawer();
    },
    async reset_records() {
      this.resetRecord("filter");
    },
    async validate_code() {
      this.errorCode = null;

      var config = {
        method: "get",
        url:
          process.env.VUE_APP_URL_MAIN +
          `validar_code_year?` +
          `description=${this.record.description}` +
          `&id_branch=${this.record.id_branch}`,
        headers: {
          "Content-Type": "application/json",
          "auth-token": sessionStorage.getItem("auth-token"),
        },
      };

      await axios(config)
        .then((response) => {
          let data = response.data;
          this.errorCode = data.estadoflag ? null : data.mensaje;
          if (!data.estadoflag) this.record.description = "";
        })
        .catch((error) => {
          console.log("Error al obtener los datos:", error);
        });
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
          await this.updateYear(item);
          await this.reset_records();
        }
      });
    },
    async open_read(id) {
      this.loading_as = true;
      this.showFilterDrawerRead = !this.showFilterDrawerRead;
      await this.readYear(id);
    },
    async open_update(id) {
      this.loading_as = true;
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      await this.readYear(id);
      this.id = id;
    },
    async submit_update() {
      if (this.$refs.form.validate()) {
        let data = {
          id: this.id,
          description: this.record.description,
          status: this.record.status,
        };
        this.resetRecord("filter");
        await this.updateYear(data);
      }
    },
    open_new() {
      this.resetRecord();
      this.$refs.form.reset();
      this.showFilterDrawerNew = !this.showFilterDrawerNew;
    },
    open_filter() {
      this.showFilterDrawer = !this.showFilterDrawer;
    },
    async filter() {
      let data = { ...this.records };
      data.status = data.status == "null" ? "" : data.status;
      if (data.description === null) data.description = "";
      await this.fetchDataYear(data);
      this.showFilterDrawer = false;
    },
    validateCode(v) {
      if (!v) {
        return "El código es requerido";
      } else if (!/^\d{4}$/.test(v)) {
        return "El código debe ser numérico de 4 caracteres";
      } else {
        return true;
      }
    },
  },
  computed: {
    ...mapState(["list"]),
  },
  watch: {
    "$store.state.year.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          this.record.description = newRecord.description;
          this.record.status = newRecord.status;
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.year.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
