import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import timezone from 'dayjs/plugin/timezone.js';
import utc from 'dayjs/plugin/utc.js'
import { TIMEZONE } from '../const.js';

dayjs.extend(dayOfYear);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault(TIMEZONE);

export default dayjs.tz;
