import dayjs from '../utils/dayjs.js';
import dayJsPckg from 'dayjs';

export function calcDaysTo(to: dayJsPckg.Dayjs): number {
    const now = dayjs();
    return to.diff(now, 'days');
}
