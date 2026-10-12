<template>
  <v-container fluid>
    <v-row>
      <v-col cols="6">
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="success"
          @click="cambiarRuta({ nameRuta: 'nuevoProveedor' })"
        >
          NUEVO
        </v-btn>
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="secondary"
          @click="
            $store.state.entities.filtrarProveedor =
              !$store.state.entities.filtrarProveedor
          "
        >
          FILTRAR
        </v-btn>
        <v-btn
          rounded
          size="small"
          class="mx-1"
          color="warning"
          @click="exportProveedor()"
          >EXPORTAR</v-btn
        >
      </v-col>
      <v-col cols="6">
        <v-spacer></v-spacer>
        <v-text-field
          name="Buscar"
          label="Buscar"
          v-model="search"
        ></v-text-field>
      </v-col>
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="$store.state.entities.lstProveedor"
          item-key="id"
          :search="search"
        >
          <template v-slot:[`item.codigo`]="{ item }"> PROV </template>
          <template v-slot:[`item.documento`]="{ item }">
            {{ item.acronym_document }}-{{ item.document }}
          </template>
          <template v-slot:[`item.ubigeo`]="{ item }">
            {{
              item.pais && item.city
                ? item.pais.concat("-", item.city)
                : item.pais || item.city
            }}
          </template>
          <template v-slot:[`item.action`]="{ item }">
            <v-btn-toggle>
              <v-btn size="x-small" icon @click="obtenerTelContactoProveedor(item.id)">
                <v-icon color="blue-grey-darken-3">mdi-phone</v-icon>
              </v-btn>
              <!-- <v-btn x-small icon @click="editar(item.id)">
                <v-icon color="green">mdi-currency-usd</v-icon>
              </v-btn> -->
              <v-btn
                v-if="item.status == 1"
                size="x-small"
                icon
                @click="
                  $router.push({
                    name: 'editarProveedor',
                    params: { id: item.id },
                  })
                "
              >
                <v-icon color="#E65100">mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                size="x-small"
                icon
                @click="
                  $router.push({
                    name: 'verProveedor',
                    params: { id: item.id },
                  })
                "
              >
                <v-icon color="info">mdi-eye</v-icon>
              </v-btn>
              <v-btn size="x-small" icon v-if="item.status == 1">
                <v-icon color="red" @click="eliminar(item)">mdi-delete</v-icon>
              </v-btn>
            </v-btn-toggle>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="dialogTelCont"
      persistent
      max-width="50%"
      transition="dialog-transition"
      scrollable
    >
      <v-card>
        <v-card-title> Teléfonos y Contactos </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="10">
              <v-subheader> <b>Teléfonos:</b> <br /> </v-subheader>
            </v-col>

            <v-col cols="12">
              <v-data-table
                :headers="headersTel"
                :items="$store.state.entities.lstTelefono"
                item-key="id"
                class="elevation-5"
              >
                <template v-slot:[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.masterusuarios.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    :error-messages="item.errorTipoTelf"
                    readonly
                  >
                  </v-autocomplete>
                </template>
                <template v-slot:[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                  ></v-text-field>
                </template>
                <template v-slot:[`item.action`]="{ item, index }">
                  <v-btn icon color="red" @click="eliminarTelefono(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>

            <!-- -------------------------------- -->
            <v-col cols="10">
              <v-subheader><b>Contactos</b></v-subheader>
            </v-col>
            <v-col cols="12">
              <v-data-table
                :headers="headersContact"
                :items="$store.state.entities.lstContactos"
                item-key="index"
                class="elevation-5"
              >
                <template v-slot:[`item.nombre`]="{ item }">
                  <v-text-field
                    v-model="item.nombre"
                    readonly
                    :error-messages="item.errornombre"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.tipotelefono`]="{ item }">
                  <v-autocomplete
                    :items="$store.state.masterusuarios.lstTipoTelefono"
                    item-title="descripcion"
                    item-value="id"
                    label="Tipo de Teléfono"
                    v-model="item.id_tipotelefono"
                    readonly
                    :error-messages="item.errorTipoTelf"
                  >
                  </v-autocomplete>
                </template>
                <template v-slot:[`item.nro_telefono`]="{ item }">
                  <v-text-field
                    v-model="item.telefono"
                    prefix="+"
                    :error-messages="item.errorTelefono"
                    v-on:blur="validarFormularioTelefonoContacto()"
                  ></v-text-field>
                </template>

                <template v-slot:[`item.action`]="{ item, index }">
                  <v-btn icon color="red" @click="eliminarContacto(index)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </template>
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            class="mx-1"
            color="success"
            @click="dialogTelCont = !dialogTelCont"
            >Cerrar</v-btn
          >
          <!-- <v-btn class="mx-1" color="red" dark>Cancelar</v-btn> -->
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      dialogTelCont: false,
      search: "",
      filtroflag: true,
      headers: [
        { text: "Cat", value: "codigo", width: "3%" },
        { text: "Correlativo", value: "correlativo", width: "5%" },
        { text: "Documento", value: "documento", width: "10%" },
        {
          text: "Nombre Comercial/ Razón Social",
          value: "nombrecompleto",
          width: "20%",
        },
        { text: "Tipo Proveedor", value: "tipo_proveedor", width: "6.5%" },
        { text: "Ubigeo", value: "ubigeo", width: "8%" },
        { text: "Dirección", value: "address" },
        { text: "Estado", value: "estado", width: "6.5%" },
        { text: "Acciones", value: "action", width: "7.5%" },
      ],
      headersTel: [
        { text: "Tipo de Teléfono", value: "tipotelefono", width: "30%" },
        { text: "Nro Teléfono", value: "nro_telefono", width: "50%" },
      ],
      headersContact: [
        { text: "Nombres", value: "nombre" },
        { text: "Tipo de Teléfono", value: "tipotelefono" },
        { text: "Nro Teléfono", value: "nro_telefono" },
      ],
    };
  },
  methods: {
    ...mapActions([
      "getListProveedor",
      "_getDocumentsPais",
      "cargarMasterDetalleTipoProveedor",
      "_getPais",
      "_getState",
      "_getRole",
      "cambioURL",
      "eliminarPersona",
      "telConctactoProveedor",
      "cargarTipoTelefono",
      "exportListProveedor",
    ]),
    cambiarRuta({ nameRuta = "", idProveedor = "" }) {
      this.$router.push({
        name: nameRuta,
        paramas: {
          id: idProveedor,
        },
      });
    },
    eliminar(item) {
      Swal.fire({
        icon: "question",
        title: "Eliminar Registro",
        html: `Está seguro que desea eliminar el proveedor <br/> PROV-${item.correlativo}`,
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: "ELIMINAR",
        showCancelButton: true,
        confirmButtonColor: "red",
        cancelButtonText: "Cerrar",
      }).then(async (res) => {
        if (res.isConfirmed) {
          let data = { id: item.id };
          await this.eliminarPersona(data);
          // await this.getListProveedor();
        }
      });
    },
    async obtenerTelContactoProveedor(id) {
      this.$store.state.spiner = true;
      await this.telConctactoProveedor({ id: id });
      this.dialogTelCont = true;
      this.$store.state.spiner = false;
    },
    async exportProveedor() {
      this.$store.state.spiner = true;
      await this.exportListProveedor();
      this.$store.state.spiner = false;
    },
  },
  async mounted() {
    this.$store.state.entities.lstProveedor = [];
    this.$store.state.spiner = true;
    await this.getListProveedor();
    await Promise.all([
      this._getDocumentsPais(),
      this.cargarMasterDetalleTipoProveedor(),
      this._getPais(),
      this._getRole(),
      this.cargarTipoTelefono(),
    ]);
    this.$store.state.spiner = false;
  },
};
</script>

<style></style>
