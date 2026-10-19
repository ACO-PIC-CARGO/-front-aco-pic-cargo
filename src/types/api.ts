export interface ApiResponse<T = unknown> {
  estadoflag: boolean;
  mensaje: string;
  tipomensaje: string;
  data: T;
  token?: string;
  status?: number | string;
}
