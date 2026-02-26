import dayjs from '../utils/dayjs.js';
import dayJsPckg from 'dayjs';

interface CalcDaysToOptions {
    addCurrentDay: boolean;
}

export function calcDaysTo(
    to: dayJsPckg.Dayjs,
    opts: CalcDaysToOptions = { addCurrentDay: true },
): number {
    const now = dayjs();
    let diff = to.diff(now, 'days');
    return opts.addCurrentDay ? diff + 1 : diff;
}
