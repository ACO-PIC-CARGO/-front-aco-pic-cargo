import moment from "moment-timezone";

export const inTimeZone = (value: moment.MomentInput, timeZone: string): moment.Moment => moment.tz(value, timeZone);
