<template>
  <v-container>
    <v-form>
      <v-row>
        <v-col cols="3" v-if="nuevoExpedienteFlag()">
          <!--  -->
          <v-autocomplete
            @change="nombreCampania()"
            :items="$store.state.itemsMasterList"
            v-model="id_exp"
            label="Expediente"
            item-text="code_master"
            item-value="id"
          >
          </v-autocomplete>
        </v-col>
        <v-col cols="3">
          <v-text-field
            name="name"
            label="Nombre de la campaña"
            id="id"
            v-model="nombrecampania"
            :readonly="companiaflag"
          ></v-text-field>
        </v-col>
        <v-col cols="1">
          <v-text-field
            label="Nro Cuotas"
            v-if="nuevoExpediente"
            v-model="nro_cuotas"
            @change="addCol"
            type="number"
            min="1"
          ></v-text-field>
        </v-col>
        <v-col cols="5">
          <v-btn
            color="success"
            @click="abrirDialog"
            :disabled="subirarchivoflag()"
            >Subir Archivo
          </v-btn>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <center v-if="nro_cuotas > 0 && nuevoExpediente">
            PORCENTAJE Y FECHAS DE PAGO* (Datos requeridos para continuar)
          </center>
        </v-col>

        <v-col v-for="n in Number(nro_cuotas)" :cols="12 / nro_cuotas" :key="n">
          <v-row>
            <v-col cols="6">
              <v-text-field
                :label="`Porcentaje Cuota-${n}`"
                v-if="nuevoExpediente"
                v-model="cuota[n - 1]"
                type="number"
                suffix="%"
                dense
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                :label="`Fecha de pago ${n}`"
                v-if="nuevoExpediente"
                v-model="fechacuota[n - 1]"
                type="date"
                dense
              ></v-text-field>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-form>
    <v-row>
      <v-col cols="12"
        ><center><h3>Listado de Datos Obtenidos</h3></center></v-col
      >
      <v-col cols="12">
        <v-data-table
          :headers="headers"
          :items="datos"
          class="elevation-1"
          pagination.sync="pagination"
          item-key="index"
          :loading="datos.length != files.length"
        >
        </v-data-table>
      </v-col>
      <v-col cols="12">
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          v-if="datos.length > 0"
          @click="generarControlesGastos()"
          >Generar</v-btn
        >
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" max-width="50%" height="80%" persistent>
      <template>
        <v-card color="basil">
          <v-card-title class="text-center justify-center py-6">
            <h1 class="font-weight-bold text-h2 basil--text">SUBIR ARCHIVOS</h1>
          </v-card-title>

          <v-tabs
            v-model="tab"
            background-color="transparent"
            color="basil"
            grow
          >
            <!-- <v-tab> Seleccionar Archivos </v-tab> -->
            <v-tab :loading="loadingArras"> Cargar Archivos </v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab">
            <v-tab-item>
              <v-card color="basil" flat>
                <v-card-text>
                  <div
                    class="drop-area"
                    @dragover.prevent
                    @drop="handleDrop"
                    @click="openFileInput"
                    v-if="!loading"
                  >
                    <label>
                      Arrastra y suelta archivos aquí
                      <v-file-input
                        ref="fileInput"
                        v-model="files"
                        hide-details
                        multiple
                        @change="Procesar()"
                        style="display: none"
                      ></v-file-input>
                    </label>
                  </div>
                  <div v-else>
                    <v-card color="primary" dark>
                      <v-card-text>
                        Se está analizando los archivos, un momento por
                        favor....
                        <v-progress-linear
                          indeterminate
                          color="white"
                          class="mb-0"
                        ></v-progress-linear>
                      </v-card-text>
                    </v-card>
                  </div>
                </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-card>
      </template>
    </v-dialog>
  </v-container>
</template>

<script>
import { readSheet as readXlsxFile } from "read-excel-file/browser";
import { mapActions } from "vuex";
import Swal from "sweetalert2";
export default {
  data() {
    return {
      tab: null,
      dialog: false,
      loading: false,
      id_exp: null,
      nuevoExpediente: false,
      loadingArras: true,
      companiaflag: false,
      nroexp: "",
      nombrecampania: "",
      files: [],
      filesErrorExtension: [],
      filesErrorCampanias: [],
      filesErrorTelefono: [],
      filesErrorNombre: [],
      datos: [],
      nro_cuotas: 3,
      cuota: [],
      fechacuota: [],
      headers: [
        { text: "Nombres", value: "nombres" },
        { text: "Apellidos Paterno", value: "apaterno" },
        { text: "Apellido  Materno", value: "amaterno" },
        { text: "Teléfono", value: "telefono" },
        { text: "Teléfono 2", value: "telefono2" },
        { text: "Monto ($)", value: "monto" },
        { text: "Pedidos", value: "pedidos" },
        { text: "Nombre del documento", value: "document" },
      ],
    };
  },
  async mounted() {
    let vm = this;
    Swal.fire({
      icon: "question",
      text: "¿Desea crear un nuevo expediente?",
      showConfirmButton: true,
      showDenyButton: true,
      confirmButtonText: "Crear un nuevo expediente",
      denyButtonText: "Seleccionar un expediente",
      confirmButtonColor: "#1A237E",
      denyButtonColor: "#004D40",
      allowOutsideClick: false,
      showCloseButton: true,
      timer: null,
    }).then(async (res) => {
      if (res.isConfirmed) {
        vm.nuevoExpediente = true;
      }
      if (res.isDenied) {
        vm.nuevoExpediente = false;
        vm.$store.state.spiner = true;
        await vm._getMasterList();
        vm.$store.state.spiner = false;
      }
    });
  },
  methods: {
    ...mapActions([
      "_getMasterList",
      "CargaMasivaControlDeGastos",
      "createCarpetaOneDrive",
      "actualizarMaster",
      "getNombreCompania",
      "DescargarConsolidadoCargaMasiva",
    ]),
    addCol() {
      // Actualizar el número de elementos en los arreglos cuota y fechacuota
      // this.cuota = new Array(this.nro_cuotas).fill({ value: 0 });
      // this.fechacuota = new Array(this.nro_cuotas).fill({ value: "" });
    },
    openFileInput() {
      this.$refs.fileInput.$el.click();
    },

    subirarchivoflag() {
      let val = false;
      if (
        this.nuevoExpediente == false &&
        (!this.id_exp || !this.nombrecampania)
      ) {
        val = true;
      }
      if (this.nuevoExpediente == true && !this.nombrecampania) {
        val = true;
      }
      for (let i = 0; i < this.nro_cuotas; i++) {
        if (!this.cuota[i] && !!this.nuevoExpediente) {
          val = true;
        }
        if (!this.fechacuota[i] && !!this.nuevoExpediente) {
          val = true;
        }
      }
      return val;
    },
    async nombreCampania() {
      this.$store.state.spiner = true;
      this.nombrecampania = await this.getNombreCompania(this.id_exp).catch(
        (e) => console.log(e)
      );

      if (!!this.nombrecampania) {
        this.companiaflag = true;
      }
      this.$store.state.spiner = false;
    },
    nuevoExpedienteFlag() {
      return this.nuevoExpediente == true ? false : true;
    },

    abrirDialog() {
      this.files = [];
      this.tab = null;
      this.dialog = !this.dialog;
    },
    async validarExtensionDocumento() {
      let vm = this;
      let validacion = true;
      const filesArray = Array.from(vm.files);
      filesArray.forEach((element, index) => {
        let data = element.name.split(".");
        let format = data[data.length - 1];
        if (format != "xlsx") {
          vm.filesErrorExtension.push(
            `Archivo N° ${index + 1}, Nombre: ${element.name}`
          );
          validacion = false;
        }
        return validacion;
      });
      return validacion;
      //   setTimeout(() => {
      //     resolve(validacion);
      //   }, vm.files.length * 250);
      // });
    },
    async validarCampania() {
      this.filesErrorCampanias = [];
      // return new Promise((resolve) => {
      let val = true;
      let vm = this;
      let cant = 0;

      const filesArray = Array.from(vm.files);
      filesArray.forEach(async (file, index) => {
        await readXlsxFile(file)
          .then((rows) => {
            if (cant == 0) {
              cant = rows.length;
            }
            if (cant != 0) {
              if (cant != rows.length) {
                val = false;
                //
                vm.filesErrorCampanias.push(
                  `Archivo N° ${index + 1}, Nombre: ${file.name}`
                );
              }
            }
          })
          .catch((error) => {
            console.error("Error al procesar el archivo:", error);
          });
      });
      return val;
    },
    validarHayTelefonoYHayNombre() {
      let vm = this;
      vm.filesErrorTelefono = [];
      let validacion = true;
      // return new Promise((resolve) => {
      const filesArray = Array.from(vm.files);
      filesArray.forEach(async (file, index) => {
        await readXlsxFile(file)
          .then((rows) => {
            for (let i = 0; i < rows.length; i++) {
              if (i == 5) {
                if (!rows[i][2]) {
                  vm.filesErrorTelefono.push(
                    `Archivo N° ${index + 1}, Nombre: ${file.name}`
                  );
                  validacion = false;
                }
              }
              if (i == 4) {
                if (!rows[i][2]) {
                  vm.filesErrorNombre.push(
                    `Archivo N° ${index + 1}, Nombre: ${file.name}`
                  );
                  validacion = false;
                }
              }
            }
          })
          .catch((error) => {
            console.error("Error al procesar el archivo:", error);
          });
      });

      return validacion;
    },

    async procesarExcel() {
      // return new Promise(async (resolve) => {
      let val = { validacion: true, html: "" };
      this.datos = [];
      let html = "";
      let valExtension = await this.validarExtensionDocumento().then((res) => {
        return res;
      });
      if (valExtension) {
        let valCampania = await this.validarCampania().then((res) => {
          return res;
        });
        if (valCampania) {
          let valTelefono = await this.validarHayTelefonoYHayNombre();

          if (!valTelefono) {
            html = `El(los) archivos: <br> "${this.filesErrorTelefono.join(
              "<br>"
            )}" <br> No Contiene número telefónico  . Verifique`;
          }
        } else {
          html = `El(los) archivos: <br> "${this.filesErrorCampanias.join(
            "<br>"
          )}" <br> No son la misma campaña que el primer archivo. Verifique`;
        }
      } else {
        html = `El(los) archivos: <br>  "${this.filesErrorExtension.join(
          "<br> "
        )}"<br>  No cumplen con el tipo de documento valido. Verifique`;
      }

      return !!html
        ? (val = {
            validacion: false,
            html: html,
          })
        : (val = {
            validacion: true,
            html: html,
          });
    },
    async guardarDatosEnTabla() {
      const filesArray = Array.from(this.files);

      await filesArray.forEach(async (element) => {
        await readXlsxFile(element)
          .then(async (rows) => {
            await this.procesarDatos({ item: rows, name: element.name }); // Aquí deberías hacer algo con los datos procesados
          })
          .catch((error) => {
            console.error("Error al procesar el archivo:", error);
          });
      });
      return true;
    },
    async procesarDatos({ item: item, name: name }) {
      let data = { document: name };
      let indexMonto = null;
      let indexPedido = null;
      for (let i = 0; i < item.length; i++) {
        if (i > 0) {
          if (i == 4) {
            let cliente = item[i][2].split(" ");
            data.nombres = cliente[0];
            data.apaterno = cliente.length > 1 ? cliente[1] : "";
            data.amaterno = cliente.length > 2 ? cliente[2] : "";
          }
          if (i == 5) {
            let tel = await this.obtenerTelefono(item[i][2]);

            data.telefono = tel[0];
            data.telefono2 = tel.length > 1 ? tel[1] : "";
            // data.telefono2 = this.obtenerTelefono(item[i][2]);
          }
          if (i == 6) {
            for (let index = 0; index < item[i].length; index++) {
              if (item[i][index] === "MONTO") {
                indexMonto = index;
              }
            }
          }
          if (i == 6) {
            for (let index = 0; index < item[i].length; index++) {
              if (item[i][index] === "PEDIDOS") {
                indexPedido = index;
              }
            }
          }
          if (i == 7) {
            data.monto = isNaN(item[i][indexMonto])
              ? 0
              : parseFloat(item[i][indexMonto]).toFixed(2);
          }
          if (i == 7) {
            data.pedidos = parseFloat(item[i][indexPedido]);
          }
          // if (i==) {}
        }
      }
      this.datos.push(data);
    },
    obtenerTelefono(telefono) {
      telefono = telefono.toString(); // Convertir a cadena de texto
      const regex = /\s*[\/,;\\]\s*/;
      if (regex.test(telefono)) {
        let telefonos = telefono.split(regex);
        return telefonos;
      } else {
        const tel = [];
        tel.push(telefono);
        return tel;
      }
    },
    async handleDrop(event) {
      event.preventDefault();
      this.loadingArras = true;
      this.loading = true;
      this.files = event.dataTransfer.files;
      let procesar = await this.procesarExcel().then((res) => {
        return res;
      });

      if (procesar.validacion == true) {
        await this.guardarDatosEnTabla().then((res) => {
          return res;
        });
      }
      if (procesar.validacion == false) {
        Swal.fire({
          icon: "error",
          html: procesar.html,
        });
      }
      this.loading = false;
      this.loadingArras = false;
      this.dialog = !this.dialog;
    },
    async Procesar() {
      this.loading = true;
      let procesar = await this.procesarExcel().then((res) => {
        return res;
      });

      if (procesar.validacion == true) {
        await this.guardarDatosEnTabla().then((res) => {
          return res;
        });
      }
      if (procesar.validacion == false) {
        Swal.fire({
          icon: "error",
          html: procesar.html,
        });
      }
      this.loading = false;
      this.dialog = !this.dialog;
    },
    validarRegistro() {
      let sum = 0;
      let val = true;
      for (let i = 0; i < this.nro_cuotas; i++) {
        sum += parseFloat(this.cuota[i]);
      }
      if (sum != 100 && !!this.nuevoExpediente) {
        Swal.fire({
          icon: "error",
          html: "El porcentaje final debe ser igual al 100%",
        });
        val = false;
      }
      return val;
    },
    async generarControlesGastos() {
      if (this.validarRegistro()) {
        let cuotas = [];
        for (let i = 0; i < this.nro_cuotas; i++) {
          cuotas.push({
            porcentaje: this.cuota[i],
            fecha: this.fechacuota[i],
          });
        }

        let data = {
          id_master: this.nuevoExpediente == true ? "" : this.id_exp,
          id_operador: JSON.parse(sessionStorage.getItem("dataUser"))[0].id,
          id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch,
          nombrecampania: this.nombrecampania,
          cuotas: cuotas,
          nro_cuotas: this.nro_cuotas,
          detalle: this.datos,
          nuevo: this.nuevoExpediente,
        };
        this.$store.state.spiner = true;
        let response = await this.CargaMasivaControlDeGastos(data);

        if (response[0].esnuevoflag == true) {
          // nro_master
          let id_branch = JSON.parse(sessionStorage.getItem("dataUser"))[0]
            .id_branch;
          let branchCreacion = [1, 2];
          if (branchCreacion.includes(id_branch)) {
            let url = await this.createCarpetaOneDrive({
              name: response[0].nro_master,
            });
            console.log("url1", url);
            if (url) {
              await this.actualizarMaster({
                id: response[0].id_master,
                url: url,
              });
            }
          }
          // actualizarMaster
        }
        this.$store.state.spiner = false;
        Swal.fire({
          icon: "success",
          text:
            response[0].esnuevoflag == true
              ? `Se ha registrado el master con el código ${response[0].nro_master}`
              : "Actualización Correcta",
          confirmButtonText: "Descargar Reporte",
          denyButtonText: "Ir A Editar el Master",
          showDenyButton: true,
          showCancelButton: true,
          cancelButtonText: "Ir la control de gasto",
          allowOutsideClick: false,
        }).then(async (res) => {
          if (res.isConfirmed) {
            await this.DescargarConsolidadoCargaMasiva(response[0].id_master);
            // this.datos = [];
          }
          if (res.isDenied) {
            this.$router.push({
              name: "controlMasterId",
              params: {
                id: response[0].id_master,
              },
            });
          }
          if (res.isDismissed) {
            this.$router.push({
              name: "editControlGasto",
              params: {
                id: response[0].id_master,
                id_branch: JSON.parse(sessionStorage.getItem("dataUser"))[0]
                  .id_branch,
              },
            });
          }
        });
      }
    },
  },
};
</script>

<style scoped>
.drop-area {
  width: 100%;
  height: 150px;
  border: 2px dashed #ccc;
  text-align: center;
  line-height: 150px;
  cursor: pointer;
}
</style>
