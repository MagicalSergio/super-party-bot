import 'dotenv/config';
import 'reflect-metadata';
import './src/db/index.js';

import { PartyBot } from './src/PartyBot.js';

function main() {
    new PartyBot();
}

main();
