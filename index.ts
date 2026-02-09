import 'dotenv/config';
import { startBot } from './src/bot.js';
import { initDayJs } from './src/utils/dayjs.js';

initDayJs();
startBot();
