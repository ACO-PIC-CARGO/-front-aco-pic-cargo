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
