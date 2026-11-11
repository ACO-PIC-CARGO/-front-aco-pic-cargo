import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { useFilesStore } from "@/stores/files";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import { usePricingStore } from "@/stores/pricing";
import type { DocumentoPais, Pais } from "@/types/catalogos";
import type { TipoTransaccion } from "@/types/entidades";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";

// The client's data, phones and agreement rules, shared by the stepper form (Nuevo/Editar) and the Ver Cliente cards.
export function useDatosCliente(isPricing: () => boolean = () => false) {
  const router = useRouter();
  const appStore = useAppStore();
  const filesStore = useFilesStore();
  const pricingStore = usePricingStore();
  const entitiesStore = useEntitiesStore();
  const masterusuariosStore = useMasterusuariosStore();

  const showNombreCompleto = ref(true);
  const fileinput = ref<File | File[] | null>(null);
  const isFileLoading = ref(false);
  const isNombreLoading = ref(false);
  const isDocumentoLoading = ref(false);

  const filteredDocumentsPais = computed(() => {
    const all: DocumentoPais[] = appStore.itemsDocumentsPais || [];
    const tipoPersona = masterusuariosStore.lstTipoPersona.find(
      (v) => v.id == entitiesStore.cliente.id_tipopersona,
    );

    if (!tipoPersona) return all;

    const norm = (s: string | null | undefined) => (s || "").toString().trim().toUpperCase();

    const isNatural = tipoPersona.descripcion === "Persona Natural";
    const isEmpresa = tipoPersona.descripcion === "Empresa";

    if (isNatural) {
      const naturalAllowed = new Set([
        "DNI",
        "CEDULA",
        "CÉDULA",
        "PASAPORTE",
        "TELEFONO",
        "TELÉFONO",
        "CARNET DE EXTRANJERIA",
        "CARNET DE EXTRANJERÍA",
        "CARNET DIPLOMATICO",
        "CARNET DIPLOMÁTICO",
      ]);
      return all.filter(
        (it) =>
          naturalAllowed.has(norm(it.name)) ||
          naturalAllowed.has(norm(it.description)),
      );
    }

    if (isEmpresa) {
      const isCombined = (it: DocumentoPais) => {
        const d = norm(it.description);
        const n = norm(it.name);
        return (
          d.includes("REGISTRO UNICO DE CONTRIBUYENTE") ||
          d.includes("REGISTRO ÚNICO DE CONTRIBUYENTE") ||
          n === "RUC/RIF" ||
          n === "RUC / RIF"
        );
      };

      const telefonoMatch = (it: DocumentoPais) => {
        const d = norm(it.description);
        const n = norm(it.name);
        return (
          n === "TELEFONO" ||
          n === "TELÉFONO" ||
          d === "TELEFONO" ||
          d === "TELÉFONO"
        );
      };

      const combinedItems = all.filter(isCombined);
      if (combinedItems.length) {
        return all
          .filter((it) => isCombined(it) || telefonoMatch(it))
          .map((it) =>
            isCombined(it)
              ? {
                  ...it,
                  description: "REGISTRO ÚNICO DE CONTRIBUYENTE (RUC/RIF)",
                }
              : it,
          );
      }

      // Fallback to RUC/RIF separate entries if combined not present
      const isRucOrRif = (it: DocumentoPais) => {
        const n = norm(it.name);
        const d = norm(it.description);
        return n === "RUC" || n === "RIF" || d === "RUC" || d === "RIF";
      };
      return all
        .filter((it) => isRucOrRif(it) || telefonoMatch(it))
        .map((it) =>
          isRucOrRif(it)
            ? {
                ...it,
                description: "REGISTRO ÚNICO DE CONTRIBUYENTE (RUC/RIF)",
              }
            : it,
        );
    }

    return all;
  });

  const paisCliente = computed(() =>
    (appStore.itemsPais as Pais[]).find((v) => v.id == entitiesStore.cliente.id_pais),
  );

  function setDocumentoFiscalByDefault(criterio = "") {
    const tipoDocumento = getIDTipoDocumento(criterio);
    if (tipoDocumento) {
      entitiesStore.cliente.id_tipodocumento = tipoDocumento;
    }
  }
  function getIDTipoDocumento(criterio = "") {
    let id = null;

    const tipoDocumentoData = (appStore.itemsDocumentsPais as DocumentoPais[]).find(
      (v) => v.name.toUpperCase() == criterio.toUpperCase(),
    );
    if (tipoDocumentoData) {
      id = tipoDocumentoData.id;
    }

    return id;
  }
  function toggleNombre() {
    const tipoPersonaData =
      masterusuariosStore.lstTipoPersona.find(
        (v) => v.id == entitiesStore.cliente.id_tipopersona,
      );
    if (tipoPersonaData) {
      if (tipoPersonaData.descripcion == "Persona Natural") {
        showNombreCompleto.value = true;
        setDocumentoFiscalByDefault("DNI");
      } else if (tipoPersonaData.descripcion == "Empresa") {
        showNombreCompleto.value = false;
        setDocumentoFiscalByDefault("RUC");
      }
    }
  }
  async function handleNombre(val: string) {
    entitiesStore.lstProveedores_x_nombre = [];
    entitiesStore.cliente.nombrecompleto = val;
    if (entitiesStore.cliente.nombrecompleto) {
      isNombreLoading.value = true;
      // await this.validarNombreCliente();
      isNombreLoading.value = false;
    }
  }
  const validarDocumento = useDebouncedSearch(async () => {
    if (entitiesStore.cliente.nro_documento) {
      isDocumentoLoading.value = true;
      await entitiesStore.validarDocumentoCliente();
      isDocumentoLoading.value = false;
    }
  });
  function handleDocumento(val: string) {
    entitiesStore.lstProveedores_x_documento = [];
    entitiesStore.cliente.nro_documento = val;
    validarDocumento();
  }
  async function handleEditarCliente(val: number) {
    if (val) {
      if (!isPricing()) {
        Swal.fire({
          icon: "question",
          html: "<b>¿Desea cargar los datos del cliente seleccionado?</b>",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Si",
          cancelButtonText: "No",
        }).then((result) => {
          if (result.isConfirmed) {
            router.push({
              name: "editarCliente",
              params: { id: val },
            });

            setTimeout(() => window.location.reload(), 10);
          }
        });
      } else {
        Swal.fire({
          icon: "question",
          html: "<b>¿Desea cargar los datos del cliente seleccionado?</b>",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Si",
          cancelButtonText: "No",
        }).then((result) => {
          if (result.isConfirmed) {
            const item =
              entitiesStore.lstProveedores_x_nombre.filter(
                (v) => v.id == val,
              )[0]!;
            pricingStore.datosPrincipales.id_entitie = item.id;
            pricingStore.datosPrincipales.nombre =
              item.nombrecompleto;
            pricingStore.datosPrincipales.telefono =
              item.telefono;
            appStore.modalEntitie = false;
            appStore.registroClienteFlag =
              !appStore.registroClienteFlag;
          }
        });
      }
    }
  }
  function validarCorreoElectronico(v: string | null | undefined) {
    if (
      v &&
      !/^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
        v,
      )
    ) {
      return "Debe ingresar un correo electrónico válido";
    }

    return true;
  }
  function validarConvenioActual() {
    const { convenioActual } = entitiesStore.cliente;
    if (convenioActual.dias_credito > 0) {
      if (!convenioActual.fecha) {
        Swal.fire({
          icon: "info",
          text: "Si desea agregar como convenio actual, es necesario llenar la fecha del convenio",
        });
      } else {
        if (
          entitiesStore.lstConvenios.indexOf(convenioActual) === -1
        ) {
          entitiesStore.lstConvenios.push(convenioActual);
        }
      }
    }
  }
  function validarTelefonoActual() {
    const { telefonoActual } = entitiesStore.cliente;
    if (telefonoActual.id_tipotelefono && telefonoActual.telefono) {
      const index = entitiesStore.lstTelefonos.findIndex(
        (v) =>
          v.id_tipotelefono == telefonoActual.id_tipotelefono &&
          v.telefono == telefonoActual.telefono,
      );
      if (index === -1) {
        entitiesStore.lstTelefonos.push(telefonoActual);
      }
    }
  }
  function validarContactoActual() {
    const { contactoActual } = entitiesStore.cliente;
    if (
      contactoActual.nombre &&
      contactoActual.id_tipotelefono &&
      contactoActual.telefono
    ) {
      const index = entitiesStore.lstContactos.findIndex(
        (v) =>
          v.nombre == contactoActual.nombre &&
          v.id_tipotelefono == contactoActual.id_tipotelefono &&
          v.telefono == contactoActual.telefono,
      );
      if (index === -1) {
        entitiesStore.lstContactos.push(contactoActual);
      }
    }
  }
  async function subirArchivoConvenio() {
    if (fileinput.value) {
      isFileLoading.value = true;
      await filesStore._uploadFile(fileinput.value as File);
      isFileLoading.value = false;

      if (filesStore.payPath) {
        Swal.fire({
          icon: "success",
          text: "Archivo cargado",
        });

        entitiesStore.cliente.convenioActual.id_path = filesStore.payPath;
      } else {
        Swal.fire({
          icon: "error",
          text: "Comuníquese con el administrador",
        });
      }
    }
  }
  function isClienteInternacional() {
    const val = masterusuariosStore.lstTipoTransaccion.some(
      (v: TipoTransaccion) => {
        return (
          v.codigo == "02" &&
          v.id == entitiesStore.cliente.id_tipotransaccion
        );
      },
    );
    return val;
  }
  async function modificarCliente() {
    // Si está en modo solo lectura, pasar a modo edición y no guardar todavía
    if (entitiesStore.isReadonly) {
      if (!(await entitiesStore.approveClientEdit(entitiesStore.cliente.id!))) return;
      entitiesStore.isReadonly = false;
      entitiesStore.isEdit = true;
      Swal.fire({
        icon: "info",
        text: "Ahora puede modificar los datos del cliente",
      });
      return;
    }

    entitiesStore.isStep1Valid = true;
    entitiesStore.isStep2Valid = true;
    entitiesStore.isStep3Valid = true;
    entitiesStore.isStep4Valid = true;
    entitiesStore.isStep5Valid = true;
    entitiesStore.isStep6Valid = true;

    let okStep1 = true;
    if (entitiesStore.cliente) {
      if (!entitiesStore.cliente.id_tipopersona) {
        okStep1 = false;
      }
      if (!entitiesStore.cliente.nombrecompleto) {
        okStep1 = false;
      }
      if (!entitiesStore.cliente.id_tipotransaccion) {
        okStep1 = false;
      }
      if (!entitiesStore.cliente.id_pais) {
        okStep1 = false;
      }
      if (
        entitiesStore.cliente.emailaddress &&
        !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
          entitiesStore.cliente.emailaddress,
        )
      ) {
        okStep1 = false;
      }
    }

    let okStep2_1 = true;
    if (entitiesStore.lstTelefonos.length > 0) {
      entitiesStore.lstTelefonos.map((v) => {
        if (!v.id_tipotelefono) {
          okStep2_1 = false;
        }
        if (!v.telefono) {
          okStep2_1 = false;
        }
      });
    }

    let okStep2_2 = true;
    if (entitiesStore.lstContactos.length > 0) {
      entitiesStore.lstContactos.map((v) => {
        if (!v.nombre) {
          okStep2_2 = false;
        }
        if (!v.id_tipotelefono) {
          okStep2_2 = false;
        }
        if (!v.telefono) {
          okStep2_2 = false;
        }
      });
    }

    let okStep3_1 = true;
    if (entitiesStore.lstConvenios.length > 0) {
      entitiesStore.lstConvenios.map((v) => {
        if (!v.fecha) {
          okStep3_1 = false;
        }
        if (v.dias_credito < 0) {
          okStep3_1 = false;
        }
        if (
          v.email_soporte &&
          !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            v.email_soporte,
          )
        ) {
          okStep3_1 = false;
        }
      });
    }

    let okStep3_2 = true;
    if (entitiesStore.lstTarifas.length > 0) {
      entitiesStore.lstTarifas.map((v) => {
        if (!v.fecha) {
          okStep3_2 = false;
        }
        if (!v.codigo) {
          okStep3_2 = false;
        }
        if (
          v.email_soporte &&
          !/^(([^<>()\[\]\\.,;:\s@']+(\.[^<>()\\\[\\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
            v.email_soporte,
          )
        ) {
          okStep3_2 = false;
        }
        if (v.tarifa < 0) {
          okStep3_2 = false;
        }
      });
    }

    let okStep4 = true;
    if (entitiesStore.lstInformacionBancaria.length > 0) {
      entitiesStore.lstInformacionBancaria.map((v) => {
        if (!v.nro_cuenta) {
          okStep4 = false;
        }
        if (!v.cci) {
          okStep4 = false;
        }
        if (!v.id_banco) {
          okStep4 = false;
        }
        if (!v.id_coins) {
          okStep4 = false;
        }
        if (isClienteInternacional()) {
          if (!v.nro_swift) {
            okStep4 = false;
          }
          if (!v.id_intermediario) {
            okStep4 = false;
          }
          if (!v.nro_cuenta_intermediario) {
            okStep4 = false;
          }
        }
      });
    }

    if (!okStep1) {
      entitiesStore.isStep1Valid =
        !entitiesStore.isStep1Valid;
    } else if (!okStep2_1 || !okStep2_2) {
      entitiesStore.isStep2Valid =
        !entitiesStore.isStep2Valid;
    } else if (!okStep3_1 || !okStep3_2) {
      entitiesStore.isStep3Valid =
        !entitiesStore.isStep3Valid;
    } else if (!okStep4) {
      entitiesStore.isStep4Valid =
        !entitiesStore.isStep4Valid;
    } else {
      appStore.spiner = true;
      const saved = await entitiesStore.actualizarCliente();
      appStore.spiner = false;
      if (!saved) return;
      appStore.recargarClienteFlag =
        !appStore.recargarClienteFlag;
      appStore.modalEntitie = false;

      // Volver a modo solo lectura después de guardar correctamente
      entitiesStore.isReadonly = true;
      entitiesStore.isEdit = false;
    }
  }
  function getPrefix() {
    return paisCliente.value?.phoneprefix ?? "+xx";
  }
  function obtenerFlag() {
    const pais = paisCliente.value;
    return pais ? `https://flagcdn.com/w40/${pais.codigo_iso!.toLowerCase()}.png` : "";
  }

  return {
    showNombreCompleto,
    fileinput,
    isFileLoading,
    isNombreLoading,
    isDocumentoLoading,
    filteredDocumentsPais,
    paisCliente,
    toggleNombre,
    handleNombre,
    handleDocumento,
    handleEditarCliente,
    validarCorreoElectronico,
    validarConvenioActual,
    validarTelefonoActual,
    validarContactoActual,
    subirArchivoConvenio,
    modificarCliente,
    getPrefix,
    obtenerFlag,
  };
}
