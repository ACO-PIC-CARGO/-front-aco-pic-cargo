import type {
  ContenedorCantidad,
  Costo,
  DatosPrincipales,
  EstadoCotizacion,
  Impuesto,
  ItemBegEnd,
  Multiplicador,
  Nota,
  Numerico,
  Servicio,
} from "@/types/cotizacion";

type ImpuestoOpcional = Impuesto | null;

export function numeroSeguro(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const normalized =
    typeof value === "string" ? value.trim().replace(/,/g, "") : value;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

export function probarFunction(): number {
  return 1;
}

export function obtenerFlagOrigen(item: ItemBegEnd): number {
  return item.codebegend == "OR" || item.codebegend == "FL" ? 1 : 0;
}

export function obtenerStatus({
  lstStatus,
}: {
  lstStatus: EstadoCotizacion[];
}): number | string | undefined {
  const found = lstStatus.filter((v) => v.code == "3");
  return found.length > 0 ? found[0]!.id : "";
}

export function obtenerLocalFlag(item: ItemBegEnd): number {
  return item.codebegend == "DE" &&
    item.categoria_role != "AD" &&
    item.categoria_role != "TR" &&
    item.categoria_role != "AL"
    ? 1
    : 0;
}

export function obtenerAduanaFlag(item: ItemBegEnd): number {
  return item.codebegend == "DE" &&
    (item.categoria_role == "AD" || item.categoria_role == "TR")
    ? 1
    : 0;
}

export function obtenerAlmacenFlag(item: ItemBegEnd): number {
  return item.codebegend == "DE" && item.categoria_role == "AL" ? 1 : 0;
}

export function calcularValor(
  precio: Numerico,
  flete: Numerico,
  multiplicador: unknown,
  porcentaje: Numerico = 0,
  minimo = 118,
): number {
  const cif =
    parseFloat(String(precio)) + parseFloat(String(flete ? flete : 0));
  const seguro = 0.015 * cif;
  const porcentajeDe = (base: number, piso: number): number => {
    if (porcentaje == 0) return 0;
    const monto = (parseFloat(String(porcentaje)) / 100) * base;
    return monto >= piso ? monto : piso;
  };

  switch (multiplicador) {
    case 5:
      return porcentajeDe(cif, 60);
    case 13:
      return porcentajeDe(cif, minimo);
    case 14:
    case 15:
      return porcentajeDe(cif + seguro, minimo);
    default:
      return 1;
  }
}

export function currencyFormat(number: number | string): string {
  return new Intl.NumberFormat("en-ES", {
    style: "currency",
    currency: "USD",
  }).format(number as number);
}

export function comienzaNoConCaracter(
  nombre: string,
  caracter: string,
): boolean {
  return nombre.charAt(0).toUpperCase() !== caracter.toUpperCase();
}

export function comienzaConCaracter(
  nombre: string,
  caracter: string,
): boolean {
  return nombre.charAt(0).toUpperCase() === caracter.toUpperCase();
}

export function validateCost({
  costo = [],
  multiplicador = [],
  services = [],
}: {
  costo?: Costo[];
  multiplicador?: Multiplicador[];
  services?: Servicio[];
}): { estado: boolean; mensaje: string } {
  const service = services.filter((v) => v.status == 1);
  const listMultiplicador = multiplicador.filter((v) =>
    comienzaNoConCaracter(v.text!, "%"),
  );

  const idMultiplicador = listMultiplicador.map((v) => v.id);
  const idServices = service.map((v) => v.id_groupservices);
  const listCostos = costo.filter(
    (v) =>
      idMultiplicador.includes(v.id_multiplicador) &&
      idServices.includes(v.id_groupservices),
  );
  const val = listCostos.filter((v) => v.costounitario == 0);
  return {
    estado: val.length > 0 ? false : true,
    mensaje: "Existe un costo que tiene un valor 0.00. Verifique",
  };
}

export function formatearServicios({
  services = [],
}: {
  services?: Servicio[];
}) {
  return services.map((element) => ({
    id: element.id ? element.id : "",
    idBegEnd: element.id_begend,
    nameservice: element.service,
    codegroupservices: element.code_service,
    status: element.status,
  }));
}

export function formatearNotas({ notas = [] }: { notas?: Nota[] }) {
  return notas.map((nota) => ({
    id: nota.id ? nota.id : null,
    descripcion: nota.descripcion,
    esprincipalflag: 1,
    esincluyeflag: nota.statusincluye ? nota.statusincluye : 0,
    esnoincluyeflag: nota.statusnoincluye ? nota.statusnoincluye : 0,
    status: nota.state ? nota.state : 1,
    nro_propuesta: nota.nro_propuesta,
  }));
}

export function formatearContainer({
  containers = [],
}: {
  containers?: ContenedorCantidad[];
}) {
  return containers.map((element) => ({
    id: element.id ? element.id : "",
    id_contenedor: element.id_containers,
    cantidad: element.cantidad,
    status: true,
  }));
}

export function formatearContainerEditar({
  containers = [],
}: {
  containers?: ContenedorCantidad[];
}) {
  return containers.map((element) => ({
    id: element.id ? element.id : null,
    id_contenedor: element.id,
    quantity: element.cantidad,
    status: true,
  }));
}

export function obtenerPorcentaje({
  listImpuestos = [],
  code = "",
}: {
  listImpuestos?: ImpuestoOpcional[] | null;
  code?: string | number;
}): number {
  const impuesto = (listImpuestos || []).find(
    (entry) => entry && String(entry.codigo) === String(code),
  );
  return numeroSeguro(impuesto && impuesto.codigo01);
}

export function calcularImpuestos({
  impuestos = [],
  item = null,
  totalFlete = 0,
  datosPrincipales = {},
}: {
  impuestos?: ImpuestoOpcional[] | null;
  item?: Impuesto | null;
  totalFlete?: Numerico;
  datosPrincipales?: DatosPrincipales;
} = {}): string {
  if (!item) return "0.00";

  const codigo = String(item.codigo);
  const fob = numeroSeguro(datosPrincipales.amount);
  const flete = numeroSeguro(totalFlete);
  const porcentaje = (code: string) =>
    obtenerPorcentaje({ listImpuestos: impuestos, code });
  const rate = numeroSeguro(item.codigo01);
  const seguro = ((flete + fob) * porcentaje("03")) / 100;
  const cif = fob + flete + seguro;
  const adv = (cif * porcentaje("05")) / 100;
  const isc = ((cif + adv) * porcentaje("06")) / 100;
  let monto = 0;

  switch (codigo) {
    case "01":
      monto = fob;
      break;
    case "02":
      monto = flete;
      break;
    case "03":
      monto = seguro;
      break;
    case "04":
      monto = cif;
      break;
    case "05":
      monto = (cif * rate) / 100;
      break;
    case "06":
      monto = ((cif + adv) * rate) / 100;
      break;
    case "07":
      monto = ((cif + adv + isc) * rate) / 100;
      break;
    case "08":
      monto = ((cif + adv + isc) * rate) / 100;
      break;
    case "09": {
      const ipm = ((cif + adv + isc) * porcentaje("07")) / 100;
      const igv = ((cif + adv + isc) * porcentaje("08")) / 100;
      monto = ((cif + adv + isc + igv + ipm) * rate) / 100;
      break;
    }
    case "10":
      monto = 100;
      break;
    case "11":
      monto = 7;
      break;
    case "12":
      monto = 3;
      break;
  }

  return numeroSeguro(monto).toFixed(2);
}

export function formatImp({
  impuestos = [],
  totalFlete = 0,
  datosPrincipales = {},
}: {
  impuestos?: Impuesto[];
  totalFlete?: Numerico;
  datosPrincipales?: DatosPrincipales;
}) {
  return impuestos.map((impuesto) => ({
    id: impuesto.id ? impuesto.id : "",
    type: parseInt(String(impuesto.codigo)),
    name: impuesto.descripcion,
    percentage: numeroSeguro(impuesto.codigo01),
    valor: calcularImpuestos({
      impuestos,
      item: impuesto,
      totalFlete,
      datosPrincipales,
    }),
    orden: parseInt(String(impuesto.codigo)),
    nro_propuesta: impuesto.nro_propuesta,
  }));
}

export function validateLength(
  value: string | unknown[] | null | undefined,
  maxLength: number,
): true | string {
  if (!value) {
    return true;
  }
  return (
    value.length <= maxLength || `Hasta ${maxLength} caracteres permitidoss`
  );
}
