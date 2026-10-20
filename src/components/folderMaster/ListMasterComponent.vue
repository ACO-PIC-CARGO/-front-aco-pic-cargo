<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import { useAppStore } from "@/stores/app";
import { useSecuritysStore } from "@/stores/securitys";
import axios from "@/api/http";
import type { AxiosResponse } from "axios";
import moment from "moment";
import Swal from "sweetalert2";
import GuardarUrlMaster from "../comun/GuardarUrlMaster.vue";
import FormatFecha from "../comun/FormatFecha.vue";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import { useMastersStore } from "@/stores/masters";
import type { RegistroConUrlCarpeta } from "@/types/archivos";
import type { CotizacionListado } from "@/types/cotizacion";
import type { MasterListado } from "@/types/operacionesMaster";
import { sessionBranchId, sessionUserIdOrEmpty } from "@/utils/sesion";

const appStore = useAppStore();
const appRouter = useRouter();
const pricingStore = usePricingStore();
const mastersStore = useMastersStore();
const masterusuariosStore = useMasterusuariosStore();
const securitysStore = useSecuritysStore();
const itemsMasterList = computed(() => appStore.itemsMasterList);
const itemsModality = computed(() => appStore.itemsModality);
const frmQuote = useTemplateRef("frmQuote");
const frmComentario = useTemplateRef("frmComentario");

const loading = ref(false);
const dialogUrl = ref(false);
const url_folderonedrive = ref("");
const masterEditar = ref<RegistroConUrlCarpeta>({});
const exp = ref<MasterListado>({} as MasterListado);
const dialogFecha = ref(false);
const dialogEscogerCotizacion = ref(false);
const id_vendedor = ref(sessionUserIdOrEmpty());
const id_quote = ref("");
const comentario = ref("");
const fecha = ref(moment().format("YYYY-MM-DD"));
const dialog = ref(false);
const master = ref<MasterListado>("" as unknown as MasterListado);
const search = ref("");
const expanded = ref<string[]>([]);
const loadingDataTable = ref(false);
const headers = [
  { title: "Canal", key: "canal" },
  { title: "Codigo", key: "code_master", align: "start" },
  { title: "BL Master", key: "nro_mbl", align: "start" },
  { title: "Sentido", key: "namemodality" },
  { title: "Origen", key: "nameportbegin" },
  { title: "Destino", key: "nameportend" },
  { title: "Agente", key: "nameagent" },
  { title: "Consignatario del House", key: "nameconsigner" },
  { title: "Fecha ETD", key: "fecha_etd" },
  { title: "Fecha ETA", key: "fecha_eta" },
  { title: "House", key: "cantidad_houses" },
  { title: "Acciones", key: "actions", sortable: false },
] as const;

const mastersConHouse = computed(() => {
  return (itemsMasterList.value || []) as MasterListado[];
});

async function cerrarDialog() {
  dialogUrl.value = false;
  appStore.spiner = true;
  await appStore._getMasterList();
  appStore.spiner = false;
}
function irControlGastos(id: number) {
  appRouter.push({
    name: "editControlGasto",
    params: {
      id: id,
      id_branch: sessionBranchId(),
    },
  });
}
async function reactivarMaster({
  id = null,
  activaranulado = null,
  abriroperativo = null,
  abriradministrativo = null,
}: {
  id?: number | null;
  activaranulado?: boolean | null;
  abriroperativo?: boolean | null;
  abriradministrativo?: boolean | null;
}) {
  let val = true as boolean;
  let msg = null as string | null;
  await Swal.fire({
    title: "Ingrese sus datos Administrador",
    html:
      '<input id="swal-input1" class="swal2-input" placeholder="Nombre">' +
      '<input id="swal-input2" type="password" class="swal2-input" placeholder="Clave">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "Aceptar",
    cancelButtonText: "Cancelar",
    preConfirm: () => {
      const input1 = (document.getElementById("swal-input1") as HTMLInputElement).value.trim();
      const input2 = (document.getElementById("swal-input2") as HTMLInputElement).value.trim();
      if (!input1 || !input2) {
        Swal.showValidationMessage("Por favor, complete ambos campos");
        return false;
      }
      return { usuario: input1, clave: input2 };
    },
  }).then(async (result) => {
    if (!result.isConfirmed) {
      // Usuario canceló
      val = false;
      msg = "Operación cancelada";
      return;
    }

    if (result.value) {
      const res = await securitysStore.validarUsuarioAdmin({
        usuario: result.value.usuario,
        clave: result.value.clave,
      });

      if (res && res.estadoflag) {
        val = true;
      } else {
        val = false;
        msg = res?.mensaje || "Credenciales incorrectas";
      }
    } else {
      val = false;
      msg = "Debe ingresar las credenciales";
    }
  });

  if (!val) {
    await Swal.fire({
      icon: "error",
      text: msg!,
    });
    return false;
  }
  appStore.spiner = true;
  await mastersStore.controlGastosReactivar({
    id: id,
    activaranulado: activaranulado,
    abriroperativo: abriroperativo,
    abriradministrativo: abriradministrativo,
  });
  await appStore._getMasterList();
  appStore.spiner = false;
}
// validarUsuarioAdmin
// controlGastosReactivar
function editFechas(item: MasterListado) {
  exp.value = {
    ...item,
    fecha_eta: item.fecha_eta
      ? moment(item.fecha_eta, "DD-MM-YYYY").format("YYYY-MM-DD")
      : null,
    fecha_etd: item.fecha_etd
      ? moment(item.fecha_etd, "DD-MM-YYYY").format("YYYY-MM-DD")
      : null,
  };
  dialogFecha.value = true;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function actualizarUrl() {
  await mastersStore.actualizarURLEnElMaster({
    id: masterEditar.value.id,
    url: url_folderonedrive.value,
  });
  masterEditar.value.url_folderonedrive = url_folderonedrive.value;
  dialogUrl.value = false;
  setTimeout(async () => {
    await appStore._getMasterList();
  }, 1000);
}
async function guardarFechas() {
  loading.value = true;
  try {
    const response = await axios
      .put(
        import.meta.env.VITE_URL_MAIN + "updateFechasMaster",
        {
          fecha_etd: exp.value.fecha_etd,
          fecha_eta: exp.value.fecha_eta,
          fecha_disponibilidad: exp.value.fecha_disponibilidad,
          salidaflag: exp.value.salidaflag,
          llegadaflag: exp.value.llegadaflag,
          disponibilidadflag: exp.value.disponibilidadflag,
          id: exp.value.id,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      )
      .catch((e) => {
        console.error(e);
      });

    const data = (response as AxiosResponse).data;
    if (data.estadoflag) {
      Swal.fire({
        icon: "success",
        text: data.mensaje,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
      });
    }

    // Ahora 'this' funcionará correctamente
    await appStore._getMasterList();
    dialogFecha.value = false;
    loading.value = false;
  } catch (error) {
    console.error("Error al guardar fechas:", error);
  } finally {
    dialogFecha.value = false;
  }
}
function abrirModalSeleccionQuote() {
  Swal.fire({
    icon: "question",
    title: "Puede crear una expediente de dos formas.",
    html: "<p>1. Aprobando una cotización</p> <p>2. Realizando un expediente desde cero</p>",
    showConfirmButton: true,
    confirmButtonText: "Escoger una Cotización",
    showDenyButton: true,
    denyButtonText: "Crear un expediente desde cero",
    allowOutsideClick: false,
  }).then((res) => {
    if (res.isDenied) {
      appRouter.push({ name: "controlMaster" });
    }
    if (res.isConfirmed) {
      dialogEscogerCotizacion.value = true;
    }
  });
}
function itemRowBackground(item: MasterListado) {
  if (
    item.statusLock === 1 &&
    item.statusLockAdm === 0 &&
    item.status === 1
  ) {
    return "rowRed";
  } else if (
    item.statusLock === 0 &&
    item.statusLockAdm === 1 &&
    item.status === 1
  ) {
    return "rowRed";
  } else if (
    item.statusLock === 1 &&
    item.statusLockAdm === 1 &&
    item.status === 1
  ) {
    return "rowRedMark";
  } else if (item.status === 0) {
    return "rowNull";
  } else if (item.background == "#ff9898") {
    return "rowLlego";
  } else if (item.background == "#f9cfcf") {
    return "rowLlegar";
  }
}
function _lockMaster(id: number) {
  Swal.fire({
    title: "Esta seguro de cerrar el expediente operativamente?",
    text: "Una vez cerrado, tendra que solicitar permiso para poder abrir",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si, Cerrar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "lockMaster/" + id,
        headers: {
          "Content-Type": "application/json",
        },
      };

      axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            Swal.fire("Cerrado!", "Expediente cerrado", "success");
            await appStore._getMasterList();
          } else {
            Swal.fire({
              icon: response.data.status == "401" ? "error" : "info",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                // @ts-expect-error router is not defined in this scope
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  });
}
function _nullMaster(id: number) {
  Swal.fire({
    title: "Esta seguro de anular el expediente?",
    text: "Una vez anulado, tendra que solicitar permiso para poder aperturarlo de nuevo",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si, anular",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "nullMaster/" + id,
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          status: 0,
        },
      };
      axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            Swal.fire("Anulado!", "Expediente anulado", "success");
            appStore.spiner = true;
            await appStore._getMasterList();
            appStore.spiner = false;
          } else {
            Swal.fire({
              icon: response.data.status == "401" ? "error" : "info",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                // @ts-expect-error router is not defined in this scope
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  });
}
function _lockMasterAdm(id: number) {
  Swal.fire({
    title: "Esta seguro de cerrar el expediente administrativamente?",
    text: "Una vez cerrado, tendra que solicitar permiso para poder abrir",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si, Cerrar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const config = {
        method: "post",
        url: import.meta.env.VITE_URL_MAIN + "lockMasterAdm/" + id,
        headers: {
          "Content-Type": "application/json",
        },
      };
      axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          if (response.data.estadoflag) {
            Swal.fire("Cerrado!", "Expediente cerrado", "success");
            await appStore._getMasterList();
          } else {
            Swal.fire({
              icon: response.data.status == "401" ? "error" : "info",
              text: response.data.mensaje,
              allowOutsideClick: false,
              allowEscapeKey: false,
              allowEnterKey: false,
            }).then((resSwal) => {
              if (resSwal.isConfirmed && response.data.status == "401") {
                // @ts-expect-error router is not defined in this scope
                router.push({ name: "Login" });
                setTimeout(() => {
                  window.location.reload();
                }, 10);
              }
            });
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  });
}
function editMaster(id: number) {
  appRouter.push("/home/folderMaster/control/editar/" + id);
}
function viewMaster(id: number) {
  appRouter.push("/home/folderMaster/control/ver/" + id);
}
function abrirCaperta(item: MasterListado) {
  console.log("item:", item);
  masterEditar.value = { ...item };
  url_folderonedrive.value = "";
  dialogUrl.value = true;
  // window.open(url, "_blank");
}
function redirectHouse(id: number) {
  appRouter.push({
    name: "controlHouseEditar",
    params: {
      id: id,
    },
  });
}
function redirectHouseVer(id: number) {
  appRouter.push({
    name: "controlHouseVer",
    params: {
      id: id,
    },
  });
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function abrirModalNotaMaster(item: MasterListado) {
  master.value = item;
  dialog.value = true;
}
async function guardarComentario() {
  if ((await frmComentario.value!.validate()).valid) {
    loading.value = true;
    appStore.spiner = true;
    await mastersStore.insertComentarioMaster({
      id_entitie: id_vendedor.value as number,
      id_master: master.value.id,
      fecha: fecha.value,
      comentario: comentario.value,
    });
    dialog.value = !dialog.value;
    await appStore._getMasterList();
    comentario.value = "";
    appStore.spiner = false;
    loading.value = false;
  }
}
async function redireccionarQuote() {
  if ((await frmQuote.value!.validate()).valid) {
    appRouter.push({
      name: "verQuote",
      params: {
        id: id_quote.value,
      },
    });
  }
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isImportacion(id: number) {
  let val = false;

  const name =
    itemsModality.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number }) => v.id == id)[0]!.name
      : "";

  if (name == "Importación") {
    val = true;
  }

  return val;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isExportacion(id: number) {
  let val = false;

  const name =
    itemsModality.value.filter((v: { id: number }) => v.id == id).length > 0
      ? itemsModality.value.filter((v: { id: number }) => v.id == id)[0]!.name
      : "";

  if (name == "Exportación") {
    val = true;
  }

  return val;
}
// obtenerAgente({ id_modality = "", nameagent = "", nameconsigner = "" }) {
//   return this.isImportacion(id_modality)
//     ? nameagent
//     : this.isExportacion(id_modality)
//     ? nameconsigner
//     : "";
// },

async function getMasterListPaginated(options: { page?: number; itemsPerPage?: number; sortBy?: string[]; sortDesc?: boolean[] } = {}) {
  const {
    page = 1,
    itemsPerPage = 10,
    sortBy = [],
    sortDesc = [],
  } = options;

  mastersStore.master_filtro.pagina = page;
  mastersStore.master_filtro.limite = itemsPerPage;
  mastersStore.master_filtro.orden = sortBy
    .map((item, i) => item + " " + (!sortDesc[i] ? "ASC" : "DESC"))
    .toString();
  mastersStore.master_filtro.busqueda = search.value;

  loadingDataTable.value = true;
  await appStore._getMasterList();
  loadingDataTable.value = false;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function deleteMaster(id: number) {
  Swal.fire({
    html: "Si elimina el expediente máster, también se eliminarán todos los expedientes houses asociados. <br>¿Está seguro que desea continuar?",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Si",
    cancelButtonText: "No",
  }).then((result) => {
    if (result.isConfirmed) {
      const config = {
        method: "delete",
        url: import.meta.env.VITE_URL_MAIN + "deleteMaster/" + id,
        headers: {
          "Content-Type": "application/json",
        },
      };

      axios(config)
        .then(async function (response) {
          sessionStorage.setItem("auth-token", response.data.token);

          const res = response.data;
          if (res.status == 200) {
            Swal.fire("", res.mensaje, "success");
            await getMasterListPaginated();
          }
        })
        .catch(function (error) {
          console.error(error);
        });
    }
  });
}

onMounted(async () => {
  appStore.drawer = false;
  appStore.spiner = true;
  await appStore._getMasterList();
  appStore.spiner = false;
  await Promise.all([
    pricingStore.getModulesEntities(),
    pricingStore.getQuoteNoAsignadoHouse(),
    masterusuariosStore.cargarMasterDetalleCanal(),
    appStore._getModality(),
    appStore._getProveedor(),
    appStore._getShipment(),
  ]);
});
</script>

<template>
  <v-container fluid>
    <v-dialog
      v-model="dialogEscogerCotizacion"
      scrollable
      persistent
      max-width="20%"
      transition="dialog-transition"
    >
      <v-card>
        <v-card-title class="text-headline-medium bg-grey-lighten-2">
          Escoger la cotización para redireccionar:
        </v-card-title>
        <v-card-text>
          <v-form ref="frmQuote">
            <v-autocomplete
              :items="
                pricingStore.listQuotes.filter((v: CotizacionListado & { porasignar?: boolean }) => !!v.porasignar)
              "
              v-model="id_quote"
              item-title="code"
              item-value="id"
              :rules="[(v) => !!v || 'Dato Requerido.']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="success"
            @click="redireccionarQuote()"
          >
            REDIRECCIONAR
          </v-btn>
          <v-btn
            color="red"
            @click="dialogEscogerCotizacion = !dialogEscogerCotizacion"
          >
            CANCELAR
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-card elevation="0">
      <v-card-title class="align-end d-flex flex-wrap">
        <v-text-field
          v-model="search"
          append-inner-icon="mdi-magnify"
          label="Buscar"
          placeholder="Texto Buscado..."
          hide-details
          variant="outlined"
          density="compact"
          style="max-width: 300px"
        />
        <v-spacer />
        <div class="">
          - Leyenda
          <span
            style="
              display: inline-block;
              background: #00ea80;
              width: 20px;
              height: 20px;
              border-radius: 250px;
              margin-left: 10px;
              margin-right: 20px;
            "
          />
          Cargas Llegadas |
          <span
            style="
              display: inline-block;
              background: #fddd0c;
              width: 20px;
              height: 20px;
              border-radius: 250px;
              margin-left: 10px;
              margin-right: 20px;
            "
          />
          Cargas a 5 días de llegar

          <div class="d-flex justify-end mt-3">
            <v-btn
              color="success"
              elevation="0"
              rounded
              @click="abrirModalSeleccionQuote()"
            >
              NUEVO EXPEDIENTE
            </v-btn>
            <v-btn
              color="secondary"
              elevation="0"
              rounded
              class="ml-3"
              @click="
                mastersStore.master_filtrarData =
                  !mastersStore.master_filtrarData
              "
            >
              FILTRAR
            </v-btn>
          </div>
        </div>
      </v-card-title>

      <!--<v-container v-if="!$store.state.dataMaster" style="height: 400px">
        <v-row class="fill-height" align-content="center" justify="center">
          <v-col class="text-subtitle-1 text-center" cols="12">
            Cargando informacíon
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
      </v-container>-->

      <v-data-table
        :headers="headers"
        :items="mastersConHouse"
        :search="search"
        :row-props="({ item }) => ({ class: itemRowBackground(item) })"
        expand-on-click
        v-model:expanded="expanded"
        item-value="id"
        :loading="loadingDataTable"
        disable-sort
      >
        <template #expanded-row="{ columns, item }">
          <tr>
            <!-- list_houses -->
            <td
              :colspan="columns.length"
              class="px-3"
              v-if="
                (item.list_comentarios.length > 0 ||
                  item.list_houses.length > 0) &&
                  item.status != 0
              "
            >
              <v-table v-if="item.list_comentarios.length > 0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ejecutivo</th>
                    <th>Comentario</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(i, index) in item.list_comentarios"
                    :key="index"
                    class="bg-comentarios"
                  >
                    <td class="bg-comentarios">
                      {{ i.fecha }}
                    </td>
                    <td class="bg-comentarios">
                      {{ i.ejecutivo }}
                    </td>
                    <td class="bg-comentarios">
                      {{ i.comentario }}
                    </td>
                  </tr>
                </tbody>
              </v-table>

              <v-table v-if="item.list_houses.length > 0">
                <thead>
                  <tr>
                    <th>Acción</th>
                    <th>Code House</th>
                    <th>Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(i, index) in item.list_houses"
                    :key="index"
                    style="background: #e0f2f1"
                  >
                    <td>
                      <v-btn
                        variant="text"
                        icon
                        color="primary"
                        @click="redirectHouseVer(i.id_house)"
                      >
                        <v-icon class="mx-1">
                          mdi-eye
                        </v-icon>
                      </v-btn>
                      <v-btn
                        variant="text"
                        icon
                        color="#FFD600"
                        @click="redirectHouse(i.id_house)"
                      >
                        <v-icon class="mx-1">
                          mdi-pencil
                        </v-icon>
                      </v-btn>
                    </td>
                    <td>{{ i.code_house }}</td>
                    <td>{{ i.namelong }}</td>
                  </tr>
                </tbody>
              </v-table>
            </td>
          </tr>
        </template>

        <template #[`item.canal`]="{ item }">
          <label
            v-if="item.status == 0"
            style="color: red; font-weight: 700 !important"
          >
            ANULADO
          </label>
          <v-chip
            :color="item.codigo01"
            variant="flat"
            v-if="item.descripcion_canal && item.status == 1"
          >
            {{ item.descripcion_canal }}
          </v-chip>
        </template>
        <template #[`item.code_master`]="{ item }">
          <label
            v-if="item.status == 0"
            style="color: red; font-weight: 700 !important"
          >{{ item.code_master }}</label>
          <label
            v-if="item.status == 1"
            style="color: black"
          >{{
            item.code_master
          }}</label>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-menu
            location="top"
            :persistent="!(true)"
            v-if="item.status == 1"
          >
            <template #activator="{ props }">
              <v-btn
                variant="text"
                icon
                color="#212121"
                v-bind="props"
              >
                <v-icon class="mx-1">
                  mdi-menu
                </v-icon>
              </v-btn>
            </template>

            <v-list>
              <v-list-item
                class="itemMenu"
                v-if="!item.statuslock && item.status == 1"
              >
                <v-list-item-title
                  small
                  @click="editMaster(item.id)"
                  icon
                >
                  <v-icon
                    class="mx-1"
                    color="#FFD600"
                  >
                    mdi-pencil
                  </v-icon>
                  Editar Master
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-if="item.status == 1"
              >
                <v-list-item-title
                  icon
                  small
                  @click="irControlGastos(item.id)"
                >
                  <v-icon
                    class="mx-1"
                    color="#01579B"
                  >
                    mdi-truck-cargo-container
                  </v-icon>
                  Ir Control Gastos
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-if="!item.statuslock && item.status == 1"
              >
                <v-list-item-title
                  icon
                  small
                  @click="_lockMaster(item.id)"
                >
                  <v-icon
                    class="mx-1"
                    color="#E65100"
                  >
                    mdi-lock
                  </v-icon> Cerrar
                  Expediente Operativo
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-else
              >
                <v-list-item-title
                  icon
                  small
                  @click="
                    reactivarMaster({
                      id: item.id,
                      abriroperativo: true,
                    })
                  "
                >
                  <v-icon
                    class="mx-1"
                    color="#E65100"
                  >
                    mdi-lock-open-alert
                  </v-icon>
                  Abrir Expediente Operativo
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-if="!item.statuslockadm && item.status == 1"
              >
                <v-list-item-title
                  icon
                  @click="_lockMasterAdm(item.id)"
                  small
                >
                  <v-icon
                    class="mx-1"
                    color="#E65100"
                  >
                    mdi-lock
                  </v-icon>Cerrar
                  Expediente Administrativo
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-else
              >
                <v-list-item-title
                  icon
                  @click="
                    reactivarMaster({
                      id: item.id,
                      abriradministrativo: true,
                    })
                  "
                  small
                >
                  <v-icon
                    class="mx-1"
                    color="#E65100"
                  >
                    mdi-lock-open-alert
                  </v-icon>
                  Abrir Expediente Administrativo
                </v-list-item-title>
              </v-list-item>
              <v-list-item
                class="itemMenu"
                v-if="item.status == 1"
              >
                <v-list-item-title
                  icon
                  small
                  @click="abrirCaperta(item)"
                >
                  <v-icon
                    class="mx-1"
                    color="#FFD600"
                  >
                    mdi-folder
                  </v-icon>Abrir
                  Carpeta
                </v-list-item-title>
              </v-list-item>

              <v-list-item
                class="itemMenu"
                v-if="item.status == 1"
              >
                <v-list-item-title
                  icon
                  fab|
                  small
                  @click="_nullMaster(item.id)"
                >
                  <v-icon
                    class="mx-1"
                    color="#D50000"
                  >
                    mdi-cancel
                  </v-icon>
                  Anular
                </v-list-item-title>
              </v-list-item>

              <!-- <v-list-item class="itemMenu" v-if="item.status == 1">
                <v-list-item-title
                  icon
                  fab|
                  small
                  @click="deleteMaster(item.id)"
                >
                  <v-icon class="mx-1" color="#D50000">mdi-trash-can</v-icon>
                  Eliminar Master
                </v-list-item-title>
              </v-list-item> -->
            </v-list>
          </v-menu>
          <!-- <label
            v-if="item.status == 0"
            style="color: red; font-weight: 700 !important"
          >
            ANULADO
          </label> -->
          <v-btn
            color="red"
            v-if="item.status == 0"
            @click="
              reactivarMaster({
                id: item.id,
                activaranulado: true,
              })
            "
          >
            <v-icon class="mx-1">
              mdi-delete-empty
            </v-icon>Activar
          </v-btn>
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                variant="text"
                v-if="item.status == 1"
                color="#212121"
                size="small"
                icon
                class="mx-1"
                v-bind="props"
                @click="editFechas(item)"
              >
                <v-icon class="mx-1">
                  mdi-calendar-edit
                </v-icon>
              </v-btn>
            </template>
            <span>Editar Fechas</span>
          </v-tooltip>
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                v-if="!item.statuslock && item.status == 1"
                color="#212121"
                small
                @click="editMaster(item.id)"
                icon
                fab
                v-on="on"
                v-bind="attrs"
              >
                <v-icon class="mx-1">mdi-pencil</v-icon>
              </v-btn>
            </template>
            <span>Editar Master</span>
          </v-tooltip> -->
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                variant="text"
                icon
                v-bind="props"
                v-if="item.status == 1"
                color="#212121"
                size="small"
                aria-label="Ver master"
                @click="viewMaster(item.id)"
              >
                <v-icon class="mx-1">
                  mdi-eye
                </v-icon>
              </v-btn>
            </template>
            <span>Ver Master</span>
          </v-tooltip>
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                color="#212121"
                small
                @click="irControlGastos(item.id)"
              >
                <v-icon class="mx-1">mdi-truck-cargo-container</v-icon>
              </v-btn>
            </template>
            <span>Ir Control Gastos</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="!item.statuslock && item.status == 1"
                @click="_lockMaster(item.id)"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-lock</v-icon>
              </v-btn>
            </template>
            <span>Cerrar Expediente Operativo</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="!item.statuslockadm && item.status == 1"
                @click="_lockMasterAdm(item.id)"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-lock</v-icon>

              </v-btn>
            </template>
            <span>Cerrar Expediente Administrativo</span>
          </v-tooltip> -->
          <v-tooltip location="top">
            <template #activator="{ props }">
              <v-btn
                variant="text"
                v-if="item.status == 1"
                icon
                v-bind="props"
                @click="abrirCaperta(item)"
                color="#212121"
                size="small"
              >
                <v-icon class="mx-1">
                  mdi-folder
                </v-icon>
              </v-btn>
            </template>
            <span>Abrir Carpeta</span>
          </v-tooltip>
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">

              <v-btn
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                @click="abrirModalNotaMaster(item)"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-comment-alert-outline</v-icon>

              </v-btn>
            </template>
            <span>Añadir Estado/ Comentario</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="_nullMaster(item.id)"
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-cancel</v-icon>
              </v-btn>
            </template>
            <span>Anular</span>
          </v-tooltip> -->
          <!-- <v-tooltip top>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                @click="deleteMaster(item.id)"
                icon
                fab
                v-on="on"
                v-bind="attrs"
                v-if="item.status == 1"
                color="#212121"
                small
              >
                <v-icon class="mx-1">mdi-trash-can</v-icon>

              </v-btn>
            </template>
            <span>Editar Master</span>
          </v-tooltip> -->
        </template>
      </v-data-table>
    </v-card>
    <v-dialog
      v-model="dialog"
      persistent
      width="50%"
    >
      <v-card>
        <v-card-title class="d-flex align-center flex-wrap">
          Registro de Estado/ Comentario - {{ master.code_master }}
          <v-spacer />
          <v-btn
            variant="text"
            icon
            color="default"
            @click="dialog = !dialog"
          >
            <v-icon class="mx-1">
              mdi-close
            </v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-form ref="frmComentario">
            <v-text-field
              label="Fecha"
              v-model="fecha"
              type="date"
              readonly
            />
            <v-autocomplete
              label="Ejecutivo"
              class="my-1"
              :items="pricingStore.listEjecutivo"
              item-title="name"
              item-value="id_entitie"
              v-model="id_vendedor"
              :rules="[(v) => !!v || 'Dato requerido']"
            />
            <v-textarea
              label="Estado/ Comentario"
              v-model="comentario"
              rows="4"
              auto-grow
              :rules="[(v) => !!v || 'Dato requerido']"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            size="small"
            color="success"
            @click="guardarComentario"
            :loading="loading"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog
      v-model="dialogFecha"
      width="45%"
    >
      <v-card>
        <v-card-title primary-title>
          {{ exp.code_master }} - Editar Fechas
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="7">
              <FormatFecha
                label="Fecha ETD"
                id="filtroDesde"
                v-model="exp.fecha_etd"
              />
            </v-col>
            <v-col cols="5">
              <v-checkbox
                label="Salida Confirmada"
                v-model="exp.salidaflag"
              />
            </v-col>

            <v-col cols="7">
              <FormatFecha
                label="Fecha ETA"
                id="filtroDesde"
                v-model="exp.fecha_eta"
              />
            </v-col>
            <v-col cols="5">
              <v-checkbox
                label="Llegada Confirmada"
                v-model="exp.llegadaflag"
              />
            </v-col>

            <v-col cols="7">
              <FormatFecha
                label="Disponibilidad Confirmada"
                id="filtroDesde"
                v-model="exp.fecha_disponibilidad"
              />
            </v-col>
            <v-col cols="5">
              <v-checkbox
                label="Confirmación Disponibilidad"
                v-model="exp.disponibilidadflag"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            size="small"
            color="success"
            :loading="loading"
            @click="guardarFechas"
          >
            Guardar
          </v-btn>
          <v-btn
            size="small"
            color="error"
            :loading="loading"
            @click="dialogFecha = false"
          >
            Cancelar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <GuardarUrlMaster
      :dialog-url="dialogUrl"
      :master-editar="masterEditar"
      @cerrar="cerrarDialog"
    />
  </v-container>
</template>

<style lang="scss" scoped>
.itemMenu {
  cursor: pointer;
}
.itemMenu:hover {
  background: #eeeeee;
}

.rowRed {
  background: #e2e8ec;
  color: #000000;
}

.rowNull {
  background: white;
  color: #ffffff;
}

.rowRedMark {
  background: #b6c8d4;
  color: #000000;
}

.rowLlego {
  background: #00ea80;
}

.rowLlegar {
  background: #fddd0c;
}

.circle__legends {
  height: 20px;
  width: 20px;
  background: #ffd6d3;
  float: left;
  border-radius: 250px;
  margin-right: 10px;
}
.bg-comentario {
  background: #bbdefb !important;
}
</style>
