<template>
  <v-card fluid class="px-5">
    <v-container v-if="loading" style="height: 400px">
      <v-row class="fill-height align-content-center justify-center">
        <v-col class="text-body-large text-center" cols="12">
          Cargando información ....
        </v-col>
        <v-col cols="6">
          <v-progress-linear
            color="deep-purple-accent-4"
            indeterminate
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
      :items="yearStore.list ?? []"
      item-value="id"
      :search="search"
    >
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-list-item>
        
          <v-list-item-title class="text-headline-small"> Nuevo Año </v-list-item-title>
        
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
                @blur="validate_code()"
                :error-messages="errorCode"
              >
              </v-text-field>
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
              @update:model-value="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_insert()">
            Aceptar</v-btn
          >
          <v-btn
            class="mx-1"
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
      location="right"
      temporary
      
      width="30%"
    >
      <v-container v-if="!loading_as">
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-headline-small">
              Ver: {{ yearStore.record?.description }}
            </v-list-item-title>
          
        </v-list-item>

        <v-spacer></v-spacer>

        <v-card-text>
          <v-row>
            <v-text-field
              label="Código"
              readonly
              :model-value="yearStore.record?.description"
            ></v-text-field>
          </v-row>
          <v-row>
            <v-switch
              readonly
              :label="`Estado: ${
                !!yearStore.record?.status ? 'Activo' : 'Inactivo'
              }`"
              color="success"
              :model-value="yearStore.record?.status"
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
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
              height="6"
            ></v-progress-linear>
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
          
            <v-list-item-title class="text-headline-small">
              Modificar: {{ yearStore.record?.description }}
            </v-list-item-title>
          
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
              :value-comparator="(value, checked) => Boolean(value) === checked"
              color="success"
              @update:model-value="updateStatus"
            ></v-switch>
          </v-row>
        </v-card-text>

        <v-card-actions class="justify-end mt-3">
          <v-btn class="mx-1" color="success" @click="submit_update">
            Aceptar</v-btn
          >
          <v-btn
            class="mx-1"
            color="warning"
            @click="showFilterDrawerUpdate = !showFilterDrawerUpdate"
          >
            Cerrar</v-btn
          >
        </v-card-actions>
      </v-container>

      <v-container v-if="loading_as" style="height: 400px">
        <v-row class="fill-height align-content-center justify-center">
          <v-col class="text-body-large text-center" cols="12">
            Cargando información ....
          </v-col>
          <v-col cols="6">
            <v-progress-linear
              color="deep-purple-accent-4"
              indeterminate
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
      <v-container @click.stop>
        <v-list-item class="px-0">
          
            <v-list-item-title class="text-headline-small"> Filtrar Año </v-list-item-title>
          
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
              <v-radio-group v-model="records.status" inline density="compact">
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
import { mapState } from "vuex";
import Swal from "sweetalert2";
import axios from '@/api/http';
import { mapActions as mapPiniaActions, mapStores } from "pinia";
import { useYearStore } from "@/stores/year";

export default {
  name: "ListYearComponent",
  data() {
    return {
      headers: [
        { title: "Código", align: "start", key: "description" },
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
    ...mapPiniaActions(useYearStore, ["fetchDataYear", "insertYear", "readYear", "updateYear"]),
    updateStatus(newValue) {
      this.record.status = newValue ? 1 : 0;
    },
    async submit_insert() {
      this.validate_code();

      setTimeout(async () => {
        if ((await this.$refs.form.validate()).valid && this.errorCode == null) {
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
          import.meta.env.VITE_URL_MAIN +
          `validar_code_year?` +
          `description=${this.record.description}` +
          `&id_branch=${this.record.id_branch}`,
        headers: {
          "Content-Type": "application/json",
         
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
      if ((await this.$refs.form.validate()).valid) {
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
    ...mapStores(useYearStore),
    ...mapState(["list"]),
  },
  watch: {
    "yearStore.record": {
      handler(newRecord, oldRecord) {
        if (newRecord && Object.keys(newRecord).length > 0) {
          this.record.description = newRecord.description;
          this.record.status = newRecord.status;
          this.loading_as = false;
        }
      },
      immediate: true,
    },
    "yearStore.loading": {
      handler(newList, oldList) {
        this.loading = newList == true ? false : true;
      },
      immediate: true,
    },
  },
};
</script>
