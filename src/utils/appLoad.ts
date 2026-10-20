import moment from "moment";
import type { SucursalSesion } from "@/types/sesion";
import { sessionUserIdOrEmpty } from "@/utils/sesion";

export const userIdAtAppLoad = sessionUserIdOrEmpty();

export const quoteFilterDatesAtAppLoad = {
  fechainicio: moment().format("YYYY-01-01"),
  fechafin: moment().endOf("month").format("YYYY-MM-DD"),
};

export const localDateAtAppLoad = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .substr(0, 10);

export const dataBranchAtAppLoad: SucursalSesion[] | null = JSON.parse(sessionStorage.getItem("dataBranch") as string);
