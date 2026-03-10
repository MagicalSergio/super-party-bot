import 'dotenv/config';
import 'reflect-metadata';
import './src/db/index.js';

import { PartyBot } from './src/PartyBot.js';
import { PartyBotAPI } from './src/PartyBotAPI.js';
import { XAIPerson } from './src/modules/AIModel/impl/XAIPerson.js';
import { AIPersonalityEntity } from './src/modules/AIModel/entity/AIPersonality.entity.js';

async function main() {
    const bot = new PartyBot();

    const person = await AIPersonalityEntity.getBySysname('party-bot-test');

    if (person) {
        bot.attachAIPersonality(new XAIPerson({
            sysname: person.sysname,
            name: person.name,
            model: person.model,
            instructions: person.instructions,
        }));
    }

    new PartyBotAPI(bot);
}

main();
