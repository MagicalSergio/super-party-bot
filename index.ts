import 'dotenv/config';
import { PartyBot } from './src/PartyBot.js';

function main() {
    new PartyBot(process.env.TG_API_KEY!);
}

main();
