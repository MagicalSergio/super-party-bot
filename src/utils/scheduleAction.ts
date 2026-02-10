import dayjs from 'dayjs';

export function scheduleAction(date: dayjs.Dayjs, cb: () => unknown) {
    const ms = date.diff(dayjs());
    const timeout = setTimeout(cb, ms);
    return () => clearTimeout(timeout);
};
