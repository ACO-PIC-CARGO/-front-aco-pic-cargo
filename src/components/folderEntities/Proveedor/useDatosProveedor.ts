import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";
import { useAppStore } from "@/stores/app";
import { useEntitiesStore } from "@/stores/entities";
import { useMasterusuariosStore } from "@/stores/masterusuarios";
import type { Pais } from "@/types/catalogos";
import type { RolProveedor } from "@/types/entidades";
import { useDebouncedSearch } from "@/composables/useDebouncedSearch";

const EMAIL_PATTERN =
  /^(([^<>()[\]\\.,;:\s@']+(\.[^<>()\\[\]\\.,;:\s@']+)*)|('.+'))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// The provider's data rules, shared by the provider card (Ver, Editar and Nuevo Proveedor) and its first tab.
// `onExistente` receives a provider picked from the name/document matches while inside a quote.
export function useDatosProveedor(
  isPricing: () => boolean = () => false,
  onExistente: (id: number) => void = () => {},
) {
  const router = useRouter();
  const appStore = useAppStore();
  const entitiesStore = useEntitiesStore();
  const masterusuariosStore = useMasterusuariosStore();

  const isNombreLoading = ref(false);
  const isDocumentoLoading = ref(false);

  const paisProveedor = computed(() =>
    (appStore.itemsPais as Pais[]).find((v) => v.id == entitiesStore.proveedor.id_pais),
  );

  // The provider type's name ends in its kind, e.g. "01 - SHIPPER".
  function isTipo(kind: string) {
    return (appStore.itemsDataRoleList as RolProveedor[]).some((v) => {
      const item = (v.name.split("-")[1] || "").trim().toUpperCase();
      return v.id == entitiesStore.proveedor.id_tipoproveedor && item == kind;
    });
  }
  const isShipper = () => isTipo("SHIPPER");
  const isNaviera = () => isTipo("NAVIERA");
  const isAlmacen = () => isTipo("ALMACEN");

  function isInternacional() {
    return masterusuariosStore.lstTipoTransaccion.some(
      (v) => v.codigo == "02" && v.id == entitiesStore.proveedor.id_tipotransaccion,
    );
  }

  const validarNombre = useDebouncedSearch(async () => {
    if (entitiesStore.proveedor.nombrecompleto) {
      isNombreLoading.value = true;
      await entitiesStore.validarNombreProveedor();
      isNombreLoading.value = false;
    }
  });
  const validarDocumento = useDebouncedSearch(async () => {
    if (entitiesStore.proveedor.nro_documento) {
      isDocumentoLoading.value = true;
      await entitiesStore.validarDocumentoProveedor();
      isDocumentoLoading.value = false;
    }
  });
  function handleNombre(val: string) {
    entitiesStore.lstProveedores_x_nombre = [];
    entitiesStore.proveedor.nombrecompleto = val;
    validarNombre();
  }
  function handleDocumento(val: string) {
    entitiesStore.lstProveedores_x_documento = [];
    entitiesStore.proveedor.nro_documento = val;
    validarDocumento();
  }
  function handleEditarProveedor(val: number) {
    if (!val) return;
    Swal.fire({
      icon: "question",
      html: "<b>¿Desea cargar los datos del proveedor seleccionado?</b>",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si",
      cancelButtonText: "No",
    }).then((result) => {
      if (!result.isConfirmed) return;
      if (isPricing()) {
        onExistente(val);
        return;
      }
      router.push({ name: "editarProveedor", params: { id: val } });
      setTimeout(() => window.location.reload(), 10);
    });
  }

  function validarCorreoElectronico(v: string | null | undefined) {
    if (v && !EMAIL_PATTERN.test(v)) return "Debe ingresar un correo electrónico válido";
    return true;
  }
  function validarProducto(v: string | null | undefined) {
    if (isShipper() && !v) return "Dato Requerido";
    return true;
  }
  function validarDiasPositivos(v: unknown) {
    return Number(v) >= 0 || "Debe ser un número entero positivo";
  }

  // In read mode it only opens editing; while editing it checks every tab and saves.
  async function modificarProveedor() {
    if (entitiesStore.isReadonly) {
      entitiesStore.isReadonly = false;
      entitiesStore.isEdit = true;
      Swal.fire({ icon: "info", text: "Ahora puede modificar los datos del proveedor" });
      return;
    }
    if (entitiesStore.rejectInvalidProvider()) return;

    appStore.spiner = true;
    const saved = await entitiesStore.actualizarProveedor();
    appStore.spiner = false;
    if (!saved) return;

    entitiesStore.isReadonly = true;
    entitiesStore.isEdit = false;
  }

  // A new provider's bank accounts are checked once more before it is registered, as the header's button did.
  async function registrarProveedor() {
    entitiesStore.isStep4Valid = true;
    const internacional = isInternacional();
    const okStep4 = entitiesStore.lstInformacionBancaria.every(
      (v) =>
        v.nro_cuenta &&
        v.cci &&
        v.id_banco &&
        v.id_coins &&
        (!internacional || (v.nro_swift && v.id_intermediario && v.nro_cuenta_intermediario)),
    );
    if (!okStep4) {
      entitiesStore.isStep4Valid = false;
      return;
    }
    appStore.spiner = true;
    await entitiesStore.guardarProveedor();
    appStore.spiner = false;
  }

  function getPrefix() {
    return paisProveedor.value?.phoneprefix ?? "+xx";
  }
  function obtenerFlag() {
    const pais = paisProveedor.value;
    return pais?.codigo_iso ? `https://flagcdn.com/w40/${pais.codigo_iso.toLowerCase()}.png` : "";
  }

  return {
    isNombreLoading,
    isDocumentoLoading,
    paisProveedor,
    isShipper,
    isNaviera,
    isAlmacen,
    isInternacional,
    handleNombre,
    handleDocumento,
    handleEditarProveedor,
    validarCorreoElectronico,
    validarProducto,
    validarDiasPositivos,
    modificarProveedor,
    registrarProveedor,
    getPrefix,
    obtenerFlag,
  };
}
