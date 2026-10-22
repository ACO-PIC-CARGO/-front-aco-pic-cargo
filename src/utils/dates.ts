import moment from "moment-timezone";

export const SHORT_MONTHS = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export const inTimeZone = (value: moment.MomentInput, timeZone: string): moment.Moment => moment.tz(value, timeZone);

export const shortDate = (value: moment.MomentInput): string => {
  const date = moment.isMoment(value) ? value : moment(value);
  return `${date.format("DD")}/${SHORT_MONTHS[date.month()]}/${date.format("YYYY")}`;
};
