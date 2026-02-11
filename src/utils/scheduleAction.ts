import dayjs from '../utils/dayjs.js';
import dayjsPckg from 'dayjs';

export function scheduleAction(date: dayjsPckg.Dayjs, cb: () => unknown) {
    const ms = date.diff(dayjs());
    const timeout = setTimeout(cb, ms);
    return () => clearTimeout(timeout);
};
