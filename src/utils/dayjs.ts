import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import timezone from 'dayjs/plugin/timezone.js';
import { TIMEZONE } from '../const.js';

export function initDayJs() {
    dayjs.extend(dayOfYear);
    dayjs.extend(timezone);
    dayjs.tz.setDefault(TIMEZONE);
}
