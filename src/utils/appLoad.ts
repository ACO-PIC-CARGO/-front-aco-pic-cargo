import moment from "moment";
import { sessionUserIdOrEmpty } from "@/utils/sesion";

export const userIdAtAppLoad = sessionUserIdOrEmpty();

export const quoteFilterDatesAtAppLoad = {
  fechainicio: moment().format("YYYY-01-01"),
  fechafin: moment().endOf("month").format("YYYY-MM-DD"),
};
