import type { PartyBot } from './PartyBot.js';
import express from 'express';

export class PartyBotAPI {
    private bot: PartyBot;

    constructor(bot: PartyBot) {
        this.bot = bot;

        const app = express();
        const port = 3000;

        app.post('/', (req, res) => {
            res.send('Hello World!');
        });

        app.get('/', (req, res) => {
            res.send('Это GET детка по HTTPS!');
        });

        app.listen(port, '0.0.0.0', () => {
            console.log('Party Bot API');
            console.log(`Start listening on ${port}`);
        });
    }
}
