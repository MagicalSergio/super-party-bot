import { Bot } from "grammy";
import dayjs from './utils/dayjs.js';
import { ENounWords } from './utils/ENounWords.js';
import { calcDaysTo } from './utils/calcDaysTo.js';
import { SPRING_DATE } from './const.js';
import { scheduleAction } from './utils/scheduleAction.js';
import { NewsGenerator } from './NewsGenerator.js';

export async function startBot() {
    const bot = new Bot(process.env.TG_API_KEY!);
    const newsGenerator = new NewsGenerator();

    const now = dayjs();
    const nextDay = now.clone().hour(0).minute(0).second(0).millisecond(0).add(1, 'day');

    let dailyNewsGenerated = false;
    let clear: () => void;
    const action = () => {
        print();
        dailyNewsGenerated = true;

        clear();
        clear = scheduleAction(dayjs().add(1, 'day'), action);
    }

    clear = scheduleAction(nextDay, action);

    async function print() {
        const days = calcDaysTo(dayjs(SPRING_DATE));
        bot.api.sendMessage(process.env.CHAT_ID!, `До весны осталось ${days} ${ENounWords.getNoun(days, ENounWords.Day)}.`);
    }

    bot.command('shit_news', async (ctx) => {
        let message_id: number = 0;
        try {
            const reply = await ctx.reply('Звоню в редакцию ShitNews...');
            message_id = reply.message_id;
            const { data } = await newsGenerator.generateNews();
            await ctx.reply(data.output[0].content[0].text);
        } catch (e: any) {
            if (e?.reason === 'limit reached') {
                ctx.reply('На сегодня новостей больше нет :(');
            } else {
                ctx.reply('Произошла непредвиденная ошибка');
            }

            console.log(e);
        } finally {
            ctx.api.deleteMessage(process.env.CHAT_ID!, message_id);
        }
    });

    bot.start();
    bot.api.sendMessage(process.env.CHAT_ID!, 'Здравствуйте, друзья! Меня зовут ПатиБот. С сегодняшнего дня у меня имеются контакты международного новостного агенства ShitNews!\n\nБудь в курсе событий!\n\nНабери /shit_news для ежедневной дозы высококачественных новостей!');
}
