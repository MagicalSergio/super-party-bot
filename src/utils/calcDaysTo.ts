import dayjs from 'dayjs';

export function calcDaysTo(to: dayjs.Dayjs): number {
    const now = dayjs();
    return to.diff(now, 'days');
}
