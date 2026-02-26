import { Bot } from 'grammy';
import cron from 'node-cron';
import type { BotConfig, Context, Api, RawApi } from 'grammy';
import dayjs from './utils/dayjs.js';
import { TIMEZONE } from './const.js';
import { SeasonHandler } from './SeasonHandler.js';
import { ENounWords } from './utils/ENounWords.js';
import type { SeasonType } from './SeasonHandler.js';

export class PartyBot<C extends Context = Context> {
    private _bot: Bot<C, Api<RawApi>>;
    get bot(): Bot<C, Api<RawApi>> {
        return this._bot;
    }

    constructor() {
        this._bot = new Bot(process.env.TG_API_KEY!);
        this.startSeasonCron();
    }

    private startSeasonCron() {
        cron.schedule('0 0 * * *', async (ctx) => {
            try {
                await this.doSeasonJob(ctx.date);
            } catch (e) {
                console.error('Season job failed', e);
            }

        }, { timezone: TIMEZONE });
    }

    private async doSeasonJob(date: Date) {
        const now = dayjs(date);
        // const now = dayjs().date(1).month(2);
        const seasonInfo = SeasonHandler.getSeasonInfo(now);

        if (!seasonInfo.nextSeason || !seasonInfo.daysUntilNextSeason || !seasonInfo.curSeason) {
            throw new Error('Error calculating season info');
        }

        const monthChanged = now.date() === 1;
        let seasonChanged = false;
        if (monthChanged) {
            for (const [season, months] of Object.entries(SeasonHandler.MONTHS_SEASONS) as [SeasonType, number[]][]) {
                if (months[0] === now.month()) {
                    seasonChanged = true;
                    await this.sendMessage(SeasonHandler.SEASON_CONGRATS[season]);

                    // todo: make poll
                    // const poll = await this._bot.api.sendPoll(
                    //     process.env.CHAT_ID!,
                    //     `Считаем дни до ${SeasonHandler.SEASONS_FORMS[seasonInfo.nextSeason].until}?`,
                    //     [
                    //         { text: 'Присылать раз в день.' },
                    //         { text: 'Присылать раз в 3 дня.' },
                    //         { text: 'Присылать раз в неделю.' },
                    //         { text: 'Надоел, иди в попу' },
                    //     ],
                    //     { is_anonymous: false },
                    // )

                    // await this._bot.api.sent

                    // console.log('poll: ', poll);
                }
            }
        }

        if (!seasonChanged) {
            const msg = `До ${SeasonHandler.SEASONS_FORMS[seasonInfo.nextSeason].until}`
                + ` осталось ${seasonInfo.daysUntilNextSeason} `
                + `${ENounWords.getNoun(seasonInfo.daysUntilNextSeason, ENounWords.Day)}`;

            await this.sendMessage(msg);
        }
    }

    private async sendMessage(msg: string) {
        return this._bot.api.sendMessage(process.env.CHAT_ID!, msg);
    }
}
