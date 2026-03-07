import type { PartyBot } from './PartyBot.js';
import express from 'express';

interface APISendMessageBody {
    tg_api_key?: string;
    msg?: string;
}

export class PartyBotAPI {
    private bot: PartyBot;

    constructor(bot: PartyBot) {
        this.bot = bot;

        const app = express();
        app.use(express.json());

        app.listen(3000, '0.0.0.0', () => {
            console.log('Party Bot API');
            console.log(`Start listening on 3000`);
        });

        app.post('/send-message/', async (req, res) => {
            try {
                const { tg_api_key, msg } = req.body as APISendMessageBody;

                if (!msg || !tg_api_key) {
                    return res.status(400).json({ success: false, message: 'props required' });
                }

                if (tg_api_key !== process.env.TG_API_KEY!) {
                    return res.status(400).json({ success: false, message: 'wrong tg api key' });
                }

                const result = await this.bot.sendMessage(msg);
                res.status(200).json({ success: true, info: result });
            } catch (e) {
                console.error('Failed to send message: ', e);
                res.status(500).json({ success: false, message: 'something went wrong' });
            }
        });
    }
}
