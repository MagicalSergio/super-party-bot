import { Bot } from "grammy";
import dayjs from 'dayjs';
import dayOfYear from 'dayjs/plugin/dayOfYear.js';
import 'dotenv/config';

dayjs.extend(dayOfYear);

const bot = new Bot("8528953684:AAGReTa_2Lpn50KVYSNWdnR14il7Jqq6TbY");

bot.start();

let prev = dayjs();

while(true) {
    const now = dayjs();
    if (now.dayOfYear() !== prev.dayOfYear()) {
        console.log('hu!: ');
    }

    if (now.second() !== prev.second()) {
        prev = now;
        try {
            const response = await bot.api.sendMessage(process.env.CHAT_ID, String(now.second()));
            console.log(response);
        } catch (e) {
            console.error(e);
        }
        
    }
}
