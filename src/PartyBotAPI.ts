import type { PartyBot } from './PartyBot.js';
import express from 'express';

export class PartyBotAPI {
    private bot: PartyBot;

    constructor(bot: PartyBot) {
        this.bot = bot;

        const app = express();
        const port = 80;

        app.post('/', (req, res) => {
            res.send('Hello World!');
        });

        app.listen(port, () => {
            console.log('Party Bot API');
            console.log(`Start listening on ${port}`);
        });
    }

    private async sendMessage() {
        await this.bot.sendMessage('hi!');
    }
}
