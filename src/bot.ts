import { Bot } from "grammy";
import dayjs from './utils/dayjs.js';
import { ENounWords } from './utils/ENounWords.js';
import { calcDaysTo } from './utils/calcDaysTo.js';
import { SPRING_DATE } from './const.js';
import { scheduleAction } from './utils/scheduleAction.js';
import { Menu } from "@grammyjs/menu";
import OpenAI from "openai";

export async function startBot() {
    const client = new OpenAI();

    const bot = new Bot(process.env.TG_API_KEY!);

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

    bot.command('daily_news', async (ctx) => {
        const chatInfo = await ctx.getChat();
        // ctx.mem
        console.log('chatInfo: ', chatInfo);

        const response = await client.responses.create({
            model: 'gpt-4-turbo',
            input: 'Это тестовый запрос, отвечай одним словом.',
        });

        await ctx.reply(response.output_text);
    });

    bot.start();
}
