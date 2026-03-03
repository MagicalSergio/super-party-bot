import 'dotenv/config';
import 'reflect-metadata';
import './src/db/index.js';

import { PartyBot } from './src/PartyBot.js';
import { PartyBotAPI } from './src/PartyBotAPI.js';

function main() {
    new PartyBotAPI(new PartyBot());
}

main();
