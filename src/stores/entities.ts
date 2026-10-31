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
  Persona,
  Proveedor,
  ProveedorDetalle,
  ShipperCliente,
  TarifaEntidad,
  TelefonoEntidad,
  TelefonosContactosEntidad,
} from "@/types/entidades";
import type { PersonaRol } from "@/types/seguridad";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { useSecuritysStore } from "@/stores/securitys";
import { showRejectedResponse } from "@/utils/rejectedResponse";
import { CONNECTION_ERROR_MESSAGE, request } from "@/utils/request";
import { sessionBranchId } from "@/utils/sesion";
// import { isReadonly } from "vue";
// console.log(router )

const CLIENT_HAS_MOVEMENTS = "warning";
const ADMIN_USER_INPUT = "swal-admin-user";
const ADMIN_PASSWORD_INPUT = "swal-admin-password";

const EMAIL_PATTERN =
  /^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const isInvalidEmail = (email: string | null | undefined) => Boolean(email) && !EMAIL_PATTERN.test(email!);
const INVALID_PROVIDER_STEP_MESSAGES: Record<number, string> = {
  1: "Completa el nombre, el tipo de proveedor, si es nacional o extranjero y el país del proveedor, y revisa su correo antes de guardar.",
  2: "Completa el tipo y el número de cada teléfono, y el nombre, el tipo y el número de cada contacto antes de guardar.",
  3: "Completa la fecha de cada convenio y la fecha y el código de cada tarifa, y revisa sus correos de soporte antes de guardar.",
  4: "Completa la cuenta, el CCI, el banco y la moneda de cada cuenta bancaria; si el proveedor es extranjero, también el SWIFT y el intermediario.",
};

const phoneTypeText = (phoneType: unknown) => (phoneType == null ? "" : String(phoneType));

const emailsToSave = (emails: EmailEntidad[]) =>
  emails.filter((email) => email.id || (email.estado !== false && email.email && email.email.trim()));

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
  const clienteModalEditId = ref<number | null>(null);
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
  // Starts undefined until telConctactoProveedor first fills it.
  const lstTelefono = ref<TelefonoEntidad[]>();
  const providerLoadFailed = ref(false);

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
      url: import.meta.env.VITE_URL_MAIN + "listado_proveedor",
      params: providerFilters(),
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
    providerLoadFailed.value = true;
    lstTelefonos.value = [];
    lstContactos.value = [];
    lstConvenios.value = [];
    lstTarifas.value = [];
    lstInformacionBancaria.value = [];
    lstEmails.value = [];
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
              id_tipotelefono: phoneTypeText(item.id_tipotelefono),
            };
          });
          lstContactos.value = res.lstcontactos.map((item) => {
            return {
              ...item,
              id_tipotelefono: phoneTypeText(item.id_tipotelefono),
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
          providerLoadFailed.value = false;
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
    proveedor.value.lstEmails = emailsToSave(lstEmails.value);
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

  function firstInvalidProviderStep(): number {
    const provider = proveedor.value;
    const isInternational = useMasterusuariosStore().lstTipoTransaccion.some(
      (v) => v.codigo == "02" && v.id == provider.id_tipotransaccion,
    );
    if (
      !(provider.nombrecompleto && provider.nombrecompleto.trim()) ||
      !provider.id_tipoproveedor ||
      !provider.id_tipotransaccion ||
      !provider.id_pais ||
      isInvalidEmail(provider.emailaddress)
    ) {
      return 1;
    }
    if (
      lstTelefonos.value.some((v) => !v.id_tipotelefono || !v.telefono) ||
      lstContactos.value.some((v) => !v.nombre || !v.id_tipotelefono || !v.telefono)
    ) {
      return 2;
    }
    if (
      lstConvenios.value.some((v) => !v.fecha || v.dias_credito < 0 || isInvalidEmail(v.email_soporte)) ||
      lstTarifas.value.some((v) => !v.fecha || !v.codigo || v.tarifa < 0 || isInvalidEmail(v.email_soporte))
    ) {
      return 3;
    }
    if (
      lstInformacionBancaria.value.some(
        (v) =>
          !v.nro_cuenta ||
          !v.cci ||
          !v.id_banco ||
          !v.id_coins ||
          (isInternational && (!v.nro_swift || !v.id_intermediario || !v.nro_cuenta_intermediario)),
      )
    ) {
      return 4;
    }
    return 0;
  }

  function rejectInvalidProvider(): boolean {
    const step = firstInvalidProviderStep();
    isStep1Valid.value = step !== 1;
    isStep2Valid.value = step !== 2;
    isStep3Valid.value = step !== 3;
    isStep4Valid.value = step !== 4;
    if (step) Swal.fire({ icon: "warning", title: "Aviso", text: INVALID_PROVIDER_STEP_MESSAGES[step] });
    return step !== 0;
  }

  async function actualizarProveedor(): Promise<boolean> {
    if (providerLoadFailed.value) {
      Swal.fire({
        icon: "error",
        title: "Aviso",
        text: "No pudimos cargar los datos de este proveedor, así que no los guardamos. Recarga la página e intenta de nuevo.",
      });
      return false;
    }
    if (rejectInvalidProvider()) return false;
    proveedor.value.id_branch = sessionBranchId();
    proveedor.value.lstTelefonos = lstTelefonos.value;
    proveedor.value.lstContactos = lstContactos.value;
    proveedor.value.lstConvenios = lstConvenios.value;
    proveedor.value.lstTarifas = lstTarifas.value;
    proveedor.value.lstInformacionBancaria = lstInformacionBancaria.value;
    proveedor.value.lstEmails = emailsToSave(lstEmails.value);

    let saved = false;
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
        saved = data.estadoflag === true;

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
    return saved;
  }

  async function eliminarPersona(data: { id: number }, asClient = false): Promise<void> {
    await axios<ApiResponse>({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + (asClient ? "eliminar_cliente" : "eliminar_proveedor"),
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

  const statusFilter = () =>
    filtro.value.status == 1 || filtro.value.status == 0 ? filtro.value.status : "";

  const clientFilters = () => ({
    correlativo: filtro.value.correlativo || "",
    nombrecompleto: filtro.value.nombrecompleto || "",
    id_document: filtro.value.id_document || "",
    nro_documento: filtro.value.nro_documento || "",
    id_pais: filtro.value.id_pais || "",
    id_state: filtro.value.id_state || "",
    status: statusFilter(),
  });

  const providerFilters = () => ({
    correlativo: filtro.value.correlativo || "",
    bussiness_name: filtro.value.bussiness_name || "",
    id_document: filtro.value.id_document || "",
    nro_documento: filtro.value.nro_documento || "",
    id_tipoproveedor: filtro.value.id_tipoproveedor || "",
    producto: filtro.value.producto || "",
    id_pais: filtro.value.id_pais || "",
    id_state: filtro.value.id_state || "",
    status: statusFilter(),
  });

  async function exportFailureMessage(error: unknown): Promise<string> {
    const { response } = error as { response?: { data?: unknown } };
    if (!(response && response.data instanceof Blob)) return CONNECTION_ERROR_MESSAGE;
    try {
      return (JSON.parse(await response.data.text()) as ApiResponse).mensaje || CONNECTION_ERROR_MESSAGE;
    } catch {
      return CONNECTION_ERROR_MESSAGE;
    }
  }

  async function downloadEntityList(path: string, filters: object, fileName: string): Promise<void> {
    try {
      const { data } = await axios.post<Blob>(import.meta.env.VITE_URL_MAIN + path, filters, { responseType: "blob" });
      const url = window.URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName} ${moment().format("DD-MM-YYYY HH-mm-ss")}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      Swal.fire({ icon: "error", title: "Aviso", text: await exportFailureMessage(error) });
    }
  }

  function exportListProveedor(): Promise<void> {
    return downloadEntityList("export_list_proveedor", providerFilters(), "Listado Proveedor");
  }

  async function validarNombreProveedor(): Promise<void> {
    const nombre = proveedor.value.nombrecompleto || "";
    await axios<ApiResponse<EntidadCoincidencia[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_nombre_proveedor",
      params: { nombre },
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if ((proveedor.value.nombrecompleto || "") !== nombre) return;
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
    const nroDocumento = proveedor.value.nro_documento || "";
    await axios<ApiResponse<EntidadCoincidencia[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_documento_proveedor",
      params: {
        id_tipodocumento: proveedor.value.id_tipodocumento || "",
        nro_documento: nroDocumento,
      },
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if ((proveedor.value.nro_documento || "") !== nroDocumento) return;
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
      url: import.meta.env.VITE_URL_MAIN + "listado_clientes",
      params: clientFilters(),
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

  async function guardarCliente(): Promise<boolean> {
    cliente.value.id_branch = sessionBranchId();
    cliente.value.lstTelefonos = lstTelefonos.value;
    cliente.value.lstContactos = lstContactos.value;
    cliente.value.lstConvenios = lstConvenios.value;
    cliente.value.lstTarifas = lstTarifas.value;
    cliente.value.lstInformacionBancaria = lstInformacionBancaria.value;
    cliente.value.lstShippers = lstShippers.value;
    cliente.value.informacionEntrega = informacionEntrega.value;
    cliente.value.lstEmails = emailsToSave(lstEmails.value);

    const data = await request<EntidadRegistrada>({
      method: "post",
      url: import.meta.env.VITE_URL_MAIN + `registrar_cliente`,
      data: cliente.value,
    });
    if (data.status == "401") {
      showRejectedResponse(data);
      return false;
    }
    if (!data.estadoflag) {
      Swal.fire({ icon: "error", title: "No se registró el cliente", text: data.mensaje, allowOutsideClick: false });
      return false;
    }

    const app = useAppStore();
    const desdeDialogo = app.modalEntitie == true;
    const res = await Swal.fire({
      icon: "success",
      title: "Cliente registrado",
      text: data.mensaje,
      allowOutsideClick: false,
      confirmButtonText: desdeDialogo ? "Aceptar" : "Ir al listado",
    });
    if (desdeDialogo) {
      id.value = data.data[0]!.id_entitie;
      app.registroClienteFlag = !app.registroClienteFlag;
      app.modalEntitie = false;
    } else if (res.isConfirmed) {
      lstProveedor.value = [];
      router.push({
        name: "listClientes",
      });
    }
    return true;
  }

  async function guardarClienteModal(): Promise<void> {
    if (!clienteModalEditId.value) {
      await guardarCliente();
      return;
    }
    if (!(await actualizarCliente())) return;
    const app = useAppStore();
    app.modalEntitie = false;
    app.recargarClienteFlag = !app.recargarClienteFlag;
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
                  name: "listClientes",
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

  async function actualizarCliente(): Promise<boolean> {
    const nombreRuta = router.currentRoute.value.name;
    cliente.value.lstTelefonos = lstTelefonos.value;
    cliente.value.lstContactos = lstContactos.value;
    cliente.value.lstConvenios = lstConvenios.value;
    cliente.value.lstTarifas = lstTarifas.value;
    cliente.value.lstInformacionBancaria = lstInformacionBancaria.value;
    cliente.value.lstShippers = lstShippers.value;
    cliente.value.informacionEntrega = informacionEntrega.value;
    cliente.value.lstEmails = emailsToSave(lstEmails.value);

    const response = await request({
      method: "put",
      url: import.meta.env.VITE_URL_MAIN + `actualizar_cliente`,
      data: { ...cliente.value, rute: nombreRuta },
    });
    if (!response.estadoflag) {
      Swal.fire({ icon: "error", title: "No se guardaron los cambios del cliente", text: response.mensaje, allowOutsideClick: false });
      return false;
    }

    await verCliente(cliente.value.id);
    Swal.fire({ icon: "success", title: "Cliente actualizado", text: response.mensaje, allowOutsideClick: false });
    return true;
  }

  function exportListClientes(): Promise<void> {
    return downloadEntityList("export_list_cliente", clientFilters(), "Listado Cliente");
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
    const nroDocumento = cliente.value.nro_documento || "";
    await axios<ApiResponse<EntidadCoincidencia[]>>({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + "validar_documento_cliente",
      params: {
        id_tipodocumento: cliente.value.id_tipodocumento || "",
        nro_documento: nroDocumento,
      },
    })
      .then(function (response) {
        const { data } = response;
        sessionStorage.setItem("auth-token", data.token!);
        if ((cliente.value.nro_documento || "") !== nroDocumento) return;
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

  function validarClienteTieneMovimientos(data: { id: number }): Promise<ApiResponse> {
    return request({
      method: "get",
      url: import.meta.env.VITE_URL_MAIN + `entities/validar_eliminar_cliente`,
      params: data,
    });
  }

  async function confirmAdministrator(): Promise<boolean> {
    const usuario = (document.getElementById(ADMIN_USER_INPUT) as HTMLInputElement).value.trim();
    const clave = (document.getElementById(ADMIN_PASSWORD_INPUT) as HTMLInputElement).value;
    if (!usuario || !clave) {
      Swal.showValidationMessage("Ingresa el usuario y la contraseña del administrador.");
      return false;
    }
    const answer = await useSecuritysStore().validarUsuarioAdmin({ usuario, clave });
    if (!answer || !answer.estadoflag) {
      Swal.showValidationMessage((answer && answer.mensaje) || CONNECTION_ERROR_MESSAGE);
      return false;
    }
    return true;
  }

  async function approveClientEdit(idCliente: number): Promise<boolean> {
    const movements = await validarClienteTieneMovimientos({ id: idCliente });
    if (movements.estadoflag) return true;
    if (movements.tipomensaje !== CLIENT_HAS_MOVEMENTS) {
      await Swal.fire({ icon: "error", text: movements.mensaje });
      return false;
    }

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Se necesita un administrador",
      html:
        `<p>${movements.mensaje}</p>` +
        "<p>Este cliente ya tiene movimientos. Para editarlo, pide a un administrador que ingrese su usuario y contraseña.</p>" +
        `<input id="${ADMIN_USER_INPUT}" class="swal2-input" placeholder="Usuario o correo del administrador" autocomplete="off">` +
        `<input id="${ADMIN_PASSWORD_INPUT}" type="password" class="swal2-input" placeholder="Contraseña" autocomplete="new-password">`,
      showCancelButton: true,
      confirmButtonText: "Autorizar",
      cancelButtonText: "Cancelar",
      allowOutsideClick: false,
      focusConfirm: false,
      preConfirm: confirmAdministrator,
    });
    return isConfirmed;
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
    clienteModalEditId,
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
    guardarClienteModal,
    verCliente,
    actualizarCliente,
    exportListClientes,
    validarNombreCliente,
    validarDocumentoCliente,
    cargarDatosTatifasEntite,
    validarClienteTieneMovimientos,
    approveClientEdit,
    id_entitie_selected,
    data_id_role,
  };
});
