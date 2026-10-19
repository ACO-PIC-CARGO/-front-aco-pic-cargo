type Valor = string | number | null;

export interface FiltroBarra {
  fechapagodesde?: string | null;
  fechapagohasta?: string | null;
  desde?: string | null;
  hasta?: string | null;
  fechadesde?: string | null;
  fechahasta?: string | null;
  id_proveedor?: Valor;
  id_consigner?: Valor;
  id_cliente?: Valor;
  tipoingreso?: Valor;
  tiposubingreso?: Valor;
  id_cuenta?: Valor;
  id_banco?: Valor;
  expediente?: Valor;
  nro_operacion?: Valor;
  nro_exp?: Valor;
  factura?: Valor;
  serie?: Valor;
  monto?: Valor;
}
