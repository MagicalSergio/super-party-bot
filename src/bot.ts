import { Bot } from "grammy";
import dayjs from 'dayjs';
import { ENounWords } from './utils/ENounWords.js';
import { calcDaysTo } from './utils/calcDaysTo.js';

export async function startBot() {
    const bot = new Bot(process.env.TG_API_KEY!);

    bot.start();

    let prev = dayjs();

    await print();

    while (true) {
        const now = dayjs();
        if (now.date() !== prev.date()) {
            prev = now;
            try {
                await print();
            } catch (e) {
                console.error(e);
            }
        }
    }

    async function print() {
        const springDate = dayjs('2026-03-01');
        const days = calcDaysTo(springDate);
        return bot.api.sendMessage(process.env.CHAT_ID!, `До весны осталось ${days} ${ENounWords.getNoun(days, ENounWords.Day)}.`);
    }
}
