<template>
  <v-card fluid class="px-5">
    <v-card elevation="0">
      <v-container v-if="loading" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              rounded
              height="6"
            ></v-progress-linear>
          </v-col>
        </v-row>
      </v-container>

      <v-card-title v-if="!loading" class="elevation-0 d-flex align-center flex-wrap">
        <v-text-field
          append-inner-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
          v-model="search"
        >
        </v-text-field>
        <v-spacer></v-spacer>
        <v-btn size="small" color="success" @click="open_new()"> Nuevo </v-btn>
        <v-btn size="small" class="mx-1" color="#2962FF" @click="open_filter()">
          Fitrar
        </v-btn>
        <v-btn size="small" class="mx-1" color="#004D40"> Exportar </v-btn>
      </v-card-title>

      <v-data-table
        v-if="!loading"
        class="elevation-1"
        :headers="headers"
        :items="$store.state.ingresos.list"
        item-value="id"
        :search="search"
      >
        <template v-slot:[`item.calculoflag`]="{ item }">
          {{ !!item.calculoflag ? "Sí" : "No" }}
        </template>
        <template v-slot:[`item.status`]="{ item }">
          {{ !!item.status ? "Activo" : "Inactivo" }}
        </template>
        <template v-slot:[`item.action`]="{ item }">
          <v-btn variant="text" icon>
            <v-icon color="primary" @click="open_read(item.id)">mdi-eye</v-icon>
          </v-btn>
          <v-btn variant="text" icon>
            <v-icon color="warning" @click="open_update(item.id)"
              >mdi-pencil</v-icon
            >
          </v-btn>

          <v-btn variant="text" icon>
            <v-btn variant="text"
              icon
              color="red"
              @click="switch_status(item)"
              v-if="item.status"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-navigation-drawer
      v-model="showFilterDrawerNew"
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-h6">
            Nuevo Tipo de Ingreso
          </v-list-item-title>
        
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
                @blur="validate_code()"
                :rules="[(v) => validateCode(v)]"
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
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-checkbox
                label="Se calcula en Reportes"
                v-model="record.calculoflag"
                :value-comparator="(value, checked) => Boolean(value) === checked"
              >
              </v-checkbox>
            </v-row>
          </v-form>
          <v-row>
            <v-switch
              density="compact"
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-h6">
              Ver: {{ $store.state.ingresos.record.description }}
            </v-list-item-title>
          
        </v-list-item>

        <v-spacer></v-spacer>
        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="$store.state.ingresos.record.code"
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-text-field
              label="Descripción"
              readonly
              :model-value="$store.state.ingresos.record.description"
            >
            </v-text-field>
          </v-row>
          <v-row>
            <v-checkbox
              label="Se calcula en Reportes"
              readonly
              v-model="$store.state.ingresos.record.calculoflag"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            ></v-checkbox>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!$store.state.ingresos.record.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              v-model="$store.state.ingresos.record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
            ></v-switch>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end mt-3">
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerRead = !showFilterDrawerRead"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-h6">
              Modificar: {{ $store.state.ingresos.record.description }}
            </v-list-item-title>
          
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
                clearable
              >
              </v-text-field>
            </v-row>
            <v-row>
              <v-checkbox
                label="Se calcula en Reportes"
                v-model="record.calculoflag"
                :value-comparator="(value, checked) => Boolean(value) === checked"
              ></v-checkbox>
            </v-row>
          </v-form>

          <v-row>
            <v-switch
              :label="`Estado: ${record.status ? 'Activo' : 'Inactivo'}`"
              v-model="record.status"
              :value-comparator="(value, checked) => Boolean(value) === checked"
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
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-h6">
            Filtrar Registros
          </v-list-item-title>
        
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
            <v-radio-group v-model="records.status" inline density="compact">
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
import axios from '@/api/axios-config';

export default {
  name: "ListIngresoComponent",
  data() {
    return {
      headers: [
        { title: "Código", align: "start", key: "code" },
        { title: "Descripción", key: "description" },
        { title: "Calculado en Reportes", key: "calculoflag" },
        { title: "Estado", key: "status" },
        { title: "Creación", key: "created_at" },

        { title: "Última Actualización", key: "updated_at" },
        { title: "Acciones", key: "action" },
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
    await this.fetchDataIngreso(this.records);
    this.$store.state.mainTitle = `Tipo de Ingreso`;
  },
  methods: {
    ...mapActions([
      "fetchDataIngreso",
      "insertIngreso",
      "readIngreso",
      "updateIngreso",
    ]),
    async resetRecord(option) {
      if (option == "filter") {
        this.records = { ...this.originalRecords };
      } else {
        this.record = { ...this.originalRecord };
      }
      await this.fetchDataIngreso(this.records);
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
          await this.updateIngreso(item);
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
      await this.readIngreso(id);
    },
    async open_update(id) {
      this.loading_as = true;
      this.resetRecord();
      this.resetForms();
      this.showFilterDrawerUpdate = !this.showFilterDrawerUpdate;
      await this.readIngreso(id);
      this.id = id;
    },
    submit_insert() {
      this.validate_code();
      setTimeout(async () => {
        if ((await this.$refs.formNew.validate()).valid && this.errorCode == null) {
          this.resetRecord("filter");
          await this.insertIngreso(this.record);
        }
      }, 500);
    },
    async submit_update() {
      if ((await this.$refs.form.validate()).valid && this.errorCode == null) {
        let data = {
          id: this.id,
          description: this.record.description,
          calculoflag: this.record.calculoflag,
          status: this.record.status,
        };
        this.resetRecord("filter");
        await this.updateIngreso(data);
      }
    },
    async submit_filter() {
      let data = { ...this.records };
      data.status = data.status == "null" ? "" : data.status;
      if (data.code === null) data.code = "";
      if (data.description === null) data.description = "";

      await this.fetchDataIngreso(data);
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
    async validate_code() {
      this.errorCode = null;

      var config = {
        method: "get",
        url:
          import.meta.env.VITE_URL_MAIN +
          `validar_nuevo_codigo_ingreso?` +
          `id_branch=${this.record.id_branch}` +
          `&code=${encodeURIComponent(this.record.code)}`,
        headers: {
          "Content-Type": "application/json",
         
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
    "$store.state.ingresos.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          const { code, calculoflag, description, status } = newRecord;
          this.record = { code, calculoflag, description, status };
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "$store.state.ingresos.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
