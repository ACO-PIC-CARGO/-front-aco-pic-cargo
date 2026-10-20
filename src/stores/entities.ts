import { defineStore } from "pinia";
import { ref } from "vue";
import Swal from "sweetalert2";
import moment from "moment";
import axios from "@/api/http";
import router from "@/router";
import { useAppStore } from "@/stores/app";
import type { ApiResponse } from "@/types/api";
import type { Numerico } from "@/types/cotizacion";
import type {
  Cliente,
  ClienteDetalle,
  ContactoEntidad,
  ConvenioEntidad,
  DatoTarifaProveedor,
  EmailEntidad,
  EntidadCoincidencia,
  EntidadListado,
  EntidadRegistrada,
  FiltroEntidad,
  InformacionBancaria,
  InformacionEntrega,
  MovimientosCliente,
  Persona,
  Proveedor,
  ProveedorDetalle,
  ShipperCliente,
  TarifaEntidad,
  TelefonoEntidad,
  TelefonosContactosEntidad,
} from "@/types/entidades";
import type { PersonaRol } from "@/types/seguridad";
import type { UsuarioSesion } from "@/types/sesion";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { sessionBranchId } from "@/utils/sesion";
// import { isReadonly } from "vue";
// console.log(router )

export const useEntitiesStore = defineStore("entities", () => {
  const dataEntitiePost = ref<unknown[]>([]);
  const persona = ref<Persona[]>([]);
  const statusEntitie = ref(false);
  const lstProveedor = ref<EntidadListado[]>([]);
  const lstPersona = ref<PersonaRol[]>([]);
  const lstEmails = ref<EmailEntidad[]>([]);
  const lstDatosTarifas = ref<DatoTarifaProveedor[]>([]);
  const itemsImportacion = ref<DatoTarifaProveedor[]>([]);
  const itemsExportacion = ref<DatoTarifaProveedor[]>([]);
  const titleVal = ref("");
  const filtro = ref<FiltroEntidad>({
    correlativo: "",
    bussiness_name: "",
    id_document: "",
    id_pais: "",
    id_state: "",
    status: "1",
    id_tipoproveedor: "",
    names: "",
    surname: "",
    second_surname: "",
    nro_documento: "",
    nombrecompleto: "",
    producto: "",
  });
  const proveedor = ref<Proveedor>({
    correlativo: "",
    bussiness_name: "",
    id_role: 0,
    id_tipotransaccion: 56,
    id_tipodocumento: 0,
    id_pais: null,
    id_ciudad: 0,
    dias_credito: 0,
    dias_sobreestadia: 0,
    dias_almacenaje: 0,
    direccion: "",
    notas: "",
    nro_documento: "",
    emailaddress: "",
    nombrecompleto: "",
    id_tipoproveedor: "",
    proveedorprincipalflag: false,
    convenioActual: {
      dias_credito: 0,
      fecha: "",
      email_soporte: "",
    },
    telefonoActual: {
      id_tipotelefono: "",
      telefono: "",
    },
    contactoActual: {
      nombre: "",
      id_tipotelefono: "",
      telefono: "",
    },
  });
  const cliente = ref<Cliente>({
    correlativo: "",
    names: "",
    surname: "",
    second_surname: "",
    birthday: "",
    id_role: 0,
    id_tipotransaccion: 56,
    id_tipodocumento: 0,
    id_pais: null,
    id_sex: 0,
    id_ciudad: 0,
    dias_credito: 0,
    dias_sobreestadia: 0,
    dias_almacenaje: 0,
    direccion: "",
    notas: "",
    nro_documento: "",
    emailaddress: "",
    convenioActual: {
      dias_credito: 0,
      fecha: "",
      email_soporte: "",
    },
    telefonoActual: {
      id_tipotelefono: "",
      telefono: "",
    },
    contactoActual: {
      nombre: "",
      id_tipotelefono: "",
      telefono: "",
    },
    nombrecompleto: "",
  });
  const lstTelefonos = ref<TelefonoEntidad[]>([]);
  const lstContactos = ref<ContactoEntidad[]>([]);
  const lstInformacionBancaria = ref<InformacionBancaria[]>([]);
  const lstConvenios = ref<ConvenioEntidad[]>([]);
  const lstTarifas = ref<TarifaEntidad[]>([]);
  const informacionEntrega = ref<InformacionEntrega>({});
  const lstShippers = ref<ShipperCliente[]>([]);
  const id = ref<number | null>(null);
  const filtrarProveedor = ref(false);
  const stepper = ref(1);
  const isEdit = ref(false);
  const isReadonly = ref(false);
  const showBtnSaveFlag = ref(false);
  const disabledBtnSave = ref(false);
  const isStep1Valid = ref(true);
  const isStep2Valid = ref(true);
  const isStep3Valid = ref(true);
  const isStep4Valid = ref(true);
  const isStep5Valid = ref(true);
  const isStep6Valid = ref(true);
  const lstProveedores_x_nombre = ref<EntidadCoincidencia[]>([]);
  const lstProveedores_x_documento = ref<EntidadCoincidencia[]>([]);
  // Vuex created this slot only when telConctactoProveedor first ran, so it starts undefined.
  const lstTelefono = ref<TelefonoEntidad[]>();

  function _setEntitie(dataEntitie: { status?: number }): void {
    if (dataEntitie.status == 200) {
      statusEntitie.value = true;
    } else {
      statusEntitie.value = false;
    }
  }

  async function CargarPersona(): Promise<void> {
    await axios<ApiResponse<Persona[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `cargar_persona?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          persona.value = data.data;
        } else {
          persona.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function ListarPersonaTipoPersona(): Promise<void> {
    await axios<ApiResponse<PersonaRol[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `listar_persona_tipo_persona?id_branch=${sessionBranchId()}`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstPersona.value = data.data;
        } else {
          lstPersona.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function guardarRolProveedor(): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_rol_proveedor`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        id: lstPersona.value.map((persona) => {
          return persona.id;
        }),
        proveedorflag: lstPersona.value.map((persona) => {
          return persona.proveedorflag;
        }),
        clienteflag: lstPersona.value.map((persona) => {
          return persona.clienteflag;
        }),
        personalflag: lstPersona.value.map((persona) => {
          return persona.personalflag;
        }),
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          title: "Aviso",
          text: data.mensaje,
          allowOutsideClick: false,
          confirmButtonText: "Ok",
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getListProveedor(): Promise<void> {
    await axios<ApiResponse<EntidadListado[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listado_proveedor?id_branch=${sessionBranchId()}&correlativo=${
          filtro.value.correlativo ? filtro.value.correlativo : ""
        }&bussiness_name=${
          filtro.value.bussiness_name ? filtro.value.bussiness_name : ""
        }&id_document=${
          filtro.value.id_document ? filtro.value.id_document : ""
        }&nro_documento=${
          filtro.value.nro_documento ? filtro.value.nro_documento : ""
        }&id_tipoproveedor=${
          filtro.value.id_tipoproveedor ? filtro.value.id_tipoproveedor : ""
        }&producto=${
          filtro.value.producto ? filtro.value.producto : ""
        }&id_pais=${
          filtro.value.id_pais ? filtro.value.id_pais : ""
        }&id_state=${
          filtro.value.id_state ? filtro.value.id_state : ""
        }&status=${
          filtro.value.status == 1 || filtro.value.status == 0
            ? filtro.value.status
            : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedor.value = data.data;
        } else {
          lstProveedor.value = [];

          showRejectedResponse(data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getValidaRazonSocial(): Promise<void> {
    await axios<ApiResponse<EntidadListado[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_razon_social?id_branch=${sessionBranchId()}&razonsocial=${
          proveedor.value.bussiness_name ? proveedor.value.bussiness_name : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedor.value = data.data;
        } else {
          lstProveedor.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getValidaDocument(): Promise<void> {
    await axios<ApiResponse<EntidadListado[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_documento?id_branch=${sessionBranchId()}&id_tipodocumento=${proveedor.value.id_tipodocumento}&documento=${
          proveedor.value.nro_documento
        }`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedor.value = data.data;
        } else {
          lstProveedor.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getVerProveedor(): Promise<void> {
    await axios<ApiResponse<ProveedorDetalle[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `ver_proveedor?id=${router.currentRoute.value.params.id}`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          const res = data.data[0]!;
          proveedor.value = res;

          proveedor.value.convenioActual = {
            dias_credito: 0,
            fecha: "",
            email_soporte: "",
          };
          proveedor.value.telefonoActual = {
            id_tipotelefono: "",
            telefono: "",
          };
          proveedor.value.contactoActual = {
            nombre: "",
            id_tipotelefono: "",
            telefono: "",
          };

          lstTelefonos.value = res.lsttelefonos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono!.toString(),
            };
          });
          lstContactos.value = res.lstcontactos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono!.toString(),
            };
          });
          lstConvenios.value = res.lstconvenios;
          lstTarifas.value = res.lsttarifas;
          lstInformacionBancaria.value = res.lstcuentas;
          lstEmails.value = res.lstemails;

          if (lstConvenios.value[0]) {
            proveedor.value.convenioActual = lstConvenios.value[0];
          }

          if (lstTelefonos.value[0]) {
            proveedor.value.telefonoActual = lstTelefonos.value[0];
          }

          if (lstContactos.value[0]) {
            proveedor.value.contactoActual = lstContactos.value[0];
          }
        } else {
          if (data.status == "401") {
            showRejectedResponse(data);
          } else {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: data.mensaje,
              allowOutsideClick: false,
              confirmButtonText: "Ir al listado",
            }).then((res) => {
              if (res.isConfirmed) {
                lstProveedor.value = [];
                router.push({
                  name: "listProveedor",
                });
              }
            });
          }
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function guardarProveedor(): Promise<Partial<ApiResponse<EntidadRegistrada[]>>> {
    let res: Partial<ApiResponse<EntidadRegistrada[]>> = {};
    proveedor.value.id_branch = sessionBranchId();
    proveedor.value.lstTelefonos = lstTelefonos.value;
    proveedor.value.lstContactos = lstContactos.value;
    proveedor.value.lstConvenios = lstConvenios.value;
    proveedor.value.lstTarifas = lstTarifas.value;
    proveedor.value.lstInformacionBancaria = lstInformacionBancaria.value;
    proveedor.value.lstEmails = lstEmails.value;
    proveedor.value.datosTarifa = [
      ...itemsImportacion.value,
      ...itemsExportacion.value,
    ];

    await axios<ApiResponse<EntidadRegistrada[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `registrar_proveedor`,
      headers: {
        "Content-Type": "application/json",
      },
      data: proveedor.value,
    })
      .then(function (response) {
        const data = response.data;
        res = response.data;

        sessionStorage.setItem("auth-token", data.token!);

        if (data.status == "401") {
          showRejectedResponse(data);
        } else {
          const quote = ["newQuote", "verQuote", "editQuote"];
          console.log(router.currentRoute.value.name);
          if (!quote.includes(router.currentRoute.value.name as string)) {
            Swal.fire({
              icon: data.estadoflag ? "success" : "error",
              title: "Aviso",
              text: data.mensaje,
              allowOutsideClick: false,
              confirmButtonText:
                useAppStore().modalEntitie == true
                  ? "Aceptar"
                  : "Ir al listado",
            }).then((res) => {
              if (res.isConfirmed) {
                if (useAppStore().modalEntitie == true) {
                  useAppStore().registroClienteFlag =
                    !useAppStore().registroClienteFlag;
                  id.value = data.data[0]!.id_entitie;
                  useAppStore().modalEntitie = false;
                } else {
                  lstProveedor.value = [];
                  router.push({
                    name: "listProveedor",
                  });
                }
              }
            });
          } else {
            console.log(response);
          }
        }
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }

  async function actualizarProveedor(): Promise<void> {
    proveedor.value.id_branch = sessionBranchId();
    proveedor.value.lstTelefonos = lstTelefonos.value;
    proveedor.value.lstContactos = lstContactos.value;
    proveedor.value.lstConvenios = lstConvenios.value;
    proveedor.value.lstTarifas = lstTarifas.value;
    proveedor.value.lstInformacionBancaria = lstInformacionBancaria.value;
    proveedor.value.lstEmails = lstEmails.value;

    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_proveedor`,
      headers: {
        "Content-Type": "application/json",
      },
      data: proveedor.value,
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        if (data.status == "401") {
          showRejectedResponse(data);
        } else {
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            title: "Aviso",
            text: data.mensaje,
            allowOutsideClick: false,
            confirmButtonText: "Ir al listado",
          }).then((res) => {
            if (res.isConfirmed) {
              lstProveedor.value = [];
              router.push({
                name: "listProveedor",
              });
            }
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function eliminarPersona(data: { id: number }): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `eliminar_proveedor`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        Swal.fire({
          icon: data.estadoflag ? "success" : "error",
          title: "Aviso",
          text: data.mensaje,
          allowOutsideClick: false,
          confirmButtonText: "Aceptar",
        });
      })
      .catch(function (error) {
        console.error(error);
      });
    getListProveedor();
  }

  async function telConctactoProveedor(data: { id: number }): Promise<void> {
    await axios<ApiResponse<TelefonosContactosEntidad[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN + `tel_contacto_proveedor?id=${data.id}`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        const res = data.data[0]!;
        lstTelefono.value = res.lsttelefono.map((item) => {
          return {
            ...item,
            id_tipotelefono: item.id_tipotelefono
              ? item.id_tipotelefono.toString()
              : "",
          };
        });
        lstContactos.value = res.lstcontactos.map((item) => {
          return {
            ...item,
            id_tipotelefono: item.id_tipotelefono
              ? item.id_tipotelefono.toString()
              : "",
          };
        });
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function exportListProveedor(): Promise<void> {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer" as const,
    };
    const data = {
      id_branch: sessionBranchId(),
      correlativo: filtro.value.correlativo,
      bussiness_name: filtro.value.bussiness_name,
      id_document: filtro.value.id_document,
      id_pais: filtro.value.id_pais,
      id_state: filtro.value.id_state,
      status: filtro.value.status,
      id_tipoproveedor: filtro.value.id_tipoproveedor,
    };
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "El documento se descargará automaticamente",
      showConfirmButton: false,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
    await axios
      .post<ArrayBuffer>(
        import.meta.env.VITE_URL_MAIN + `export_list_proveedor`,
        data,
        headers,
      )
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        // let name = this.uuidv4();
        link.setAttribute(
          "download",
          `Listo Proveedor ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
      });
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "Documento Descargado",
      confirmButtonText: "Ok",
      showConfirmButton: true,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
  }

  async function validarNombreProveedor(): Promise<void> {
    await axios<ApiResponse<EntidadCoincidencia[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_nombre_proveedor?id_branch=${sessionBranchId()}&nombre=${
          proveedor.value.nombrecompleto ? proveedor.value.nombrecompleto : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedores_x_nombre.value = data.data;
        } else {
          lstProveedores_x_nombre.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function validarDocumentoProveedor(): Promise<void> {
    await axios<ApiResponse<EntidadCoincidencia[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_documento_proveedor?id_branch=${sessionBranchId()}&id_tipodocumento=${
          proveedor.value.id_tipodocumento
            ? proveedor.value.id_tipodocumento
            : ""
        }&nro_documento=${
          proveedor.value.nro_documento ? proveedor.value.nro_documento : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedores_x_documento.value = data.data;
        } else {
          lstProveedores_x_documento.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  // CLIENTES
  async function getListClientes(): Promise<void> {
    await axios<ApiResponse<EntidadListado[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `listado_clientes?id_branch=${sessionBranchId()}&correlativo=${
          filtro.value.correlativo ? filtro.value.correlativo : ""
        }&nombrecompleto=${
          filtro.value.nombrecompleto ? filtro.value.nombrecompleto : ""
        }&id_document=${
          filtro.value.id_document ? filtro.value.id_document : ""
        }&nro_documento=${
          filtro.value.nro_documento ? filtro.value.nro_documento : ""
        }&id_pais=${
          filtro.value.id_pais ? filtro.value.id_pais : ""
        }&id_state=${
          filtro.value.id_state ? filtro.value.id_state : ""
        }&status=${
          filtro.value.status == 1 || filtro.value.status == 0
            ? filtro.value.status
            : ""
        }&id_tipoproveedor=${
          filtro.value.id_tipoproveedor ? filtro.value.id_tipoproveedor : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedor.value = data.data;
        } else {
          lstProveedor.value = [];

          showRejectedResponse(data);
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function getValidaDocumentCliente(): Promise<void> {
    await axios<ApiResponse<EntidadListado[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_documento?id_branch=${sessionBranchId()}&id_tipodocumento=${cliente.value.id_tipodocumento}&documento=${
          cliente.value.nro_documento
        }`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedor.value = data.data;
        } else {
          lstProveedor.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function guardarCliente(): Promise<void> {
    cliente.value.id_branch = sessionBranchId();
    cliente.value.lstTelefonos = lstTelefonos.value;
    cliente.value.lstContactos = lstContactos.value;
    cliente.value.lstConvenios = lstConvenios.value;
    cliente.value.lstTarifas = lstTarifas.value;
    cliente.value.lstInformacionBancaria = lstInformacionBancaria.value;
    cliente.value.lstShippers = lstShippers.value;
    cliente.value.informacionEntrega = informacionEntrega.value;
    cliente.value.lstEmails = lstEmails.value;

    await axios<ApiResponse<EntidadRegistrada[]>>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `registrar_cliente`,
      headers: {
        "Content-Type": "application/json",
      },
      data: cliente.value,
    })
      .then(function (response) {
        // console.log(response)
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        if (data.status == "401") {
          showRejectedResponse(data);
        } else {
          console.log(router.currentRoute.value.name);

          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            title: "Aviso",
            text: data.mensaje,
            allowOutsideClick: false,
            confirmButtonText:
              useAppStore().modalEntitie == true
                ? "Aceptar"
                : "Ir al listado",
          }).then((res) => {
            if (res.isConfirmed) {
              if (useAppStore().modalEntitie == true) {
                console.log("ddddd", data.data[0]);
                useAppStore().registroClienteFlag =
                  !useAppStore().registroClienteFlag;
                id.value = data.data[0]!.id_entitie;
                useAppStore().modalEntitie = false;
              } else {
                lstProveedor.value = [];
                router.push({
                  name: "listClientes",
                });
              }
            }
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function verCliente(idCliente: number | null = null): Promise<void> {
    await axios<ApiResponse<ClienteDetalle[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `ver_cliente?id=${idCliente ? idCliente : router.currentRoute.value.params.id}`,
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag) {
          const res = data.data[0]!;

          cliente.value = res;
          cliente.value.convenioActual = {
            dias_credito: 0,
            fecha: "",
            email_soporte: "",
          };
          cliente.value.telefonoActual = { id_tipotelefono: "", telefono: "" };
          cliente.value.contactoActual = {
            nombre: "",
            id_tipotelefono: "",
            telefono: "",
          };

          lstTelefonos.value = res.lsttelefonos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono!.toString(),
            };
          });
          lstContactos.value = res.lstcontactos.map((item) => {
            return {
              ...item,
              id_tipotelefono: item.id_tipotelefono!.toString(),
            };
          });
          lstConvenios.value = res.lstconvenios;
          lstTarifas.value = res.lsttarifas;
          lstInformacionBancaria.value = res.lstcuentas;
          lstShippers.value = res.lstshippers;
          lstEmails.value = res.lstemails;
          informacionEntrega.value = res.informacionentrega[0] || {
            status: true,
          };

          if (lstConvenios.value[0]) {
            cliente.value.convenioActual = lstConvenios.value[0];
          }

          if (lstTelefonos.value[0]) {
            cliente.value.telefonoActual = lstTelefonos.value[0];
          }

          if (lstContactos.value[0]) {
            cliente.value.contactoActual = lstContactos.value[0];
          }
        } else {
          if (response.data.status == "401") {
            showRejectedResponse(response.data);
          } else {
            Swal.fire({
              icon: "error",
              title: "Aviso",
              text: data.mensaje,
              allowOutsideClick: false,
              confirmButtonText: "Ir al listado",
            }).then((res) => {
              if (res.isConfirmed) {
                lstProveedor.value = [];
                router.push({
                  name: "listProveedor",
                });
              }
            });
          }
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function actualizarCliente(): Promise<void> {
    const nombreRuta = router.currentRoute.value.name;
    cliente.value.id_branch = sessionBranchId();
    cliente.value.usuario = (
      JSON.parse(sessionStorage.getItem("dataUser") as string) as UsuarioSesion[]
    )[0]!.usuario;
    cliente.value.lstTelefonos = lstTelefonos.value;
    cliente.value.lstContactos = lstContactos.value;
    cliente.value.lstConvenios = lstConvenios.value;
    cliente.value.lstTarifas = lstTarifas.value;
    cliente.value.lstInformacionBancaria = lstInformacionBancaria.value;
    cliente.value.lstShippers = lstShippers.value;
    cliente.value.informacionEntrega = informacionEntrega.value;
    cliente.value.lstEmails = lstEmails.value;

    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_cliente`,
      headers: {
        "Content-Type": "application/json",
      },
      data: { ...cliente.value, rute: nombreRuta },
    })
      .then(function (response) {
        // console.log(response)
        const data = response.data;
        sessionStorage.setItem("auth-token", data.token!);

        if (data.status == "401") {
          showRejectedResponse(data);
        } else {
          Swal.fire({
            icon: data.estadoflag ? "success" : "error",
            title: "Aviso",
            text: data.mensaje,
            allowOutsideClick: false,
            // confirmButtonText: "Ir al listado",
          }).then(() => {
            // if (res.isConfirmed) {
            //   state.lstProveedor = [];
            //   router.push({
            //     name: "listClientes",
            //   });
            // }
          });
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function exportListClientes(): Promise<void> {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "aplication/json",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        "Origin, Content-Type, X-Auth-Token, Authorization, Accept,charset,boundary,Content-Length",
      responseType: "arraybuffer" as const,
    };
    const data = {
      id_branch: sessionBranchId(),
      correlativo: filtro.value.correlativo ? filtro.value.correlativo : "",
      names: filtro.value.names ? filtro.value.names : "",
      surname: filtro.value.surname ? filtro.value.surname : "",
      second_surname: filtro.value.second_surname
        ? filtro.value.second_surname
        : "",
      id_document: filtro.value.id_document ? filtro.value.id_document : "",
      id_pais: filtro.value.id_pais ? filtro.value.id_pais : "",
      id_state: filtro.value.id_state ? filtro.value.id_state : "",
      status:
        filtro.value.status == 1 || filtro.value.status == 0
          ? filtro.value.status
          : "",
      id_tipoproveedor: filtro.value.id_tipoproveedor
        ? filtro.value.id_tipoproveedor
        : "",
    };
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "El documento se descargará automaticamente",
      showConfirmButton: false,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
    await axios
      .post<ArrayBuffer>(import.meta.env.VITE_URL_MAIN + `export_list_cliente`, data, headers)
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        // let name = this.uuidv4();
        link.setAttribute(
          "download",
          `Listo Proveedor ${moment().format("DD-MM-YYYY hh:mm:ss")}.xlsx`,
        );
        document.body.appendChild(link);
        link.click();
      });
    Swal.fire({
      icon: "info",
      title: "Aviso",
      text: "Documento Descargado",
      confirmButtonText: "Ok",
      showConfirmButton: true,
      showCloseButton: false,
      showDenyButton: false,
      allowOutsideClick: false,
    });
  }

  async function validarNombreCliente(): Promise<void> {
    await axios<ApiResponse<EntidadCoincidencia[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_nombre_cliente?id_branch=${sessionBranchId()}&nombre=${
          cliente.value.nombrecompleto ? cliente.value.nombrecompleto : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedores_x_nombre.value = data.data;
        } else {
          lstProveedores_x_nombre.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function validarDocumentoCliente(): Promise<void> {
    await axios<ApiResponse<EntidadCoincidencia[]>>({
      method: "get",
      url:
        import.meta.env.VITE_URL_MAIN +
        `validar_documento_cliente?id_branch=${sessionBranchId()}&id_tipodocumento=${
          cliente.value.id_tipodocumento ? cliente.value.id_tipodocumento : ""
        }&nro_documento=${
          cliente.value.nro_documento ? cliente.value.nro_documento : ""
        }`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {},
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstProveedores_x_documento.value = data.data;
        } else {
          lstProveedores_x_documento.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function cargarDatosTatifasEntite(data: { id: unknown }): Promise<void> {
    await axios<ApiResponse<{ datos: DatoTarifaProveedor[] }[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `entitie/cargar_datos_tarifas`,
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if (data.estadoflag == true) {
          lstDatosTarifas.value = data.data[0]!.datos;
        } else {
          lstDatosTarifas.value = [];
        }
      })
      .catch(function (error) {
        console.error(error);
      });
  }

  async function validarClienteTieneMovimientos(data: { id: number }): Promise<MovimientosCliente> {
    let res: MovimientosCliente = {};
    await axios<ApiResponse<MovimientosCliente>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `entities/validar_eliminar_cliente`,
      headers: {
        "Content-Type": "application/json",
      },
      params: data,
    })
      .then(function (response) {
        const { data } = response;
        res = data.data;
      })
      .catch(function (error) {
        console.error(error);
      });
    return res;
  }

  const id_entitie_selected = ref<Numerico>("");
  const data_id_role = ref<Numerico>("");

  return {
    dataEntitiePost,
    persona,
    statusEntitie,
    lstProveedor,
    lstPersona,
    lstEmails,
    lstDatosTarifas,
    itemsImportacion,
    itemsExportacion,
    titleVal,
    filtro,
    proveedor,
    cliente,
    lstTelefonos,
    lstContactos,
    lstInformacionBancaria,
    lstConvenios,
    lstTarifas,
    informacionEntrega,
    lstShippers,
    id,
    filtrarProveedor,
    stepper,
    isEdit,
    isReadonly,
    showBtnSaveFlag,
    disabledBtnSave,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    isStep5Valid,
    isStep6Valid,
    lstProveedores_x_nombre,
    lstProveedores_x_documento,
    lstTelefono,
    _setEntitie,
    CargarPersona,
    ListarPersonaTipoPersona,
    guardarRolProveedor,
    getListProveedor,
    getValidaRazonSocial,
    getValidaDocument,
    getVerProveedor,
    guardarProveedor,
    actualizarProveedor,
    eliminarPersona,
    telConctactoProveedor,
    exportListProveedor,
    validarNombreProveedor,
    validarDocumentoProveedor,
    getListClientes,
    getValidaDocumentCliente,
    guardarCliente,
    verCliente,
    actualizarCliente,
    exportListClientes,
    validarNombreCliente,
    validarDocumentoCliente,
    cargarDatosTatifasEntite,
    validarClienteTieneMovimientos,
    id_entitie_selected,
    data_id_role,
  };
});
