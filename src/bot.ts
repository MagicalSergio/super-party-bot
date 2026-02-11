import { Bot } from "grammy";
import dayjs from './utils/dayjs.js';
import { ENounWords } from './utils/ENounWords.js';
import { calcDaysTo } from './utils/calcDaysTo.js';
import { SPRING_DATE } from './const.js';
import { scheduleAction } from './utils/scheduleAction.js';

export async function startBot() {
    const bot = new Bot(process.env.TG_API_KEY!);
    bot.start();

    const now = dayjs();
    const nextDay = now.clone().hour(0).minute(0).second(0).millisecond(0).add(1, 'day');

    let clear: () => void;
    const action = () => {
        clear();
        print();
        clear = scheduleAction(dayjs().add(1, 'day'), action);
    }

    clear = scheduleAction(nextDay, action);

    async function print() {
        const days = calcDaysTo(dayjs(SPRING_DATE));
        bot.api.sendMessage(process.env.CHAT_ID!, `До весны осталось ${days} ${ENounWords.getNoun(days, ENounWords.Day)}.`);
    }
}
 