export interface ArchivoSubido {
  ruta?: string;
  name?: string;
}

export interface ArchivoInicial {
  ruta?: string;
  archivo?: ArchivoSubido | null;
}

export interface RegistroConUrlCarpeta {
  id?: number | string;
  url_folderonedrive?: string;
}

/** Archivo subido con su id de table_allpath (p. ej. comprobante del pago del cliente en el instructivo). */
export interface ArchivoComprobante {
  id: number;
  ruta: string;
  name: string;
}
