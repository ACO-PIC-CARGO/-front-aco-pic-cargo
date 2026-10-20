export interface LoginSessionRow {
  id: number;
  id_entitie: number;
  id_secutiry: number;
  user: string;
  names: string;
  surname: string;
  second_surname: string;
  birthday: string;
  ic: string;
  document: string;
  id_pais: number;
  id_sex: number;
  id_document: number;
  id_branch: number | string;
  path: string;
  nameDocuments: string;
  description: string;
  departamento: string;
  usuario: string;
  trade_name: string;
  id_PaisBrach: number;
  id_state: number;
  namePais: string;
  nameState: string;
}

export interface ProgrammedPaymentFlag {
  totalpendiente: number | string;
}
