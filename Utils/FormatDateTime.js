import moment from 'moment';

export const formatDateTimeTimezone = (date, format) => {
  return moment(date || new Date()).format(format || 'DD-MM-YYYY');
};
