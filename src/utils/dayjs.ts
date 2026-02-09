import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';

export function initDayJs() {
    dayjs.extend(dayOfYear);
}
