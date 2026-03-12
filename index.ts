import 'dotenv/config';
import 'reflect-metadata';
import './src/db/index.js';

import { PartyBot } from './src/PartyBot.js';
import { PartyBotAPI } from './src/PartyBotAPI.js';
import { XAIPerson } from './src/modules/AIModel/impl/XAIPerson.js';
import { AIPersonalityEntity } from './src/modules/AIModel/entity/AIPersonality.entity.js';
import { AppDataSource } from './src/db/index.js';

async function main() {
    try {
        await AppDataSource.initialize();
    } catch (e) {
        console.error('DB error: ', e);
        return;
    }

    const bot = new PartyBot();
    await bot.init();

    const person = await AIPersonalityEntity.getBySysname(process.env.MODE === 'prod' ? 'party-bot-context' : 'party-bot-test');

    if (person) {
        bot.attachAIPersonality(new XAIPerson({
            sysname: person.sysname,
            name: person.name,
            model: person.model,
            instructions: person.instructions,
            username: bot.bot.botInfo.username,
        }));
    }

    new PartyBotAPI(bot);
}

main();
