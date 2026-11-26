import moment from "moment";

export const SHORT_MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export const shortDate = (value: moment.MomentInput): string => {
  const date = moment.isMoment(value) ? value : moment(value);
  return `${date.format("DD")}/${SHORT_MONTHS[date.month()]}/${date.format("YYYY")}`;
};

export const currentMonthToDate = (): { fechainicio: string; fechafin: string } => ({
  fechainicio: moment().startOf("month").format("YYYY-MM-DD"),
  fechafin: moment().format("YYYY-MM-DD"),
});

export const yearToDate = (): { desde: string; hasta: string } => ({
  desde: moment().startOf("year").format("YYYY-MM-DD"),
  hasta: moment().format("YYYY-MM-DD"),
});
