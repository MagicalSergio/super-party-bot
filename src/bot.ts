import { Bot } from "grammy";
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';

dayjs.extend(dayOfYear);

export async function startBot() {
    const bot = new Bot(process.env.TG_API_KEY!);

    bot.start();

    let prev = dayjs();

    while (true) {
        const now = dayjs();
        if (now.second() !== prev.second()) {
            prev = now;
            try {
                const response = await bot.api.sendMessage(process.env.CHAT_ID!, String(now.second()));
                console.log(response);
            } catch (e) {
                console.error(e);
            }

        }
    }
}
