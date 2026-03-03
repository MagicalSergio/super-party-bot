import { Bot } from 'grammy';
import cron from 'node-cron';
import { TIMEZONE } from './const.js';
import { SeasonHandler } from './SeasonHandler.js';
import { Poll } from './entity/Poll.js';
import { SeasonPoll } from './entity/SeasonPoll.js';
import type { SeasonType } from './SeasonHandler.js';
import type { Context, Api, RawApi } from 'grammy';
import { SeasonScheduleNotify } from './entity/SeasonScheduleNotify.js';
import { DateTime } from 'luxon';
import { pluralize } from './utils/pluralize.js';

interface SeasonPollOptions {
    text: string;
    periodicity: number;
}

export class PartyBot<C extends Context = Context> {
    private _bot: Bot<C, Api<RawApi>>;
    get bot(): Bot<C, Api<RawApi>> {
        return this._bot;
    }

    constructor() {
        this._bot = new Bot(process.env.TG_API_KEY!);
        this._bot
            .start()
            .catch((e) => console.error('Something bad happened: ', e));

        this.startSeasonCron();

        if (process.env.BIND_TEST) {
            this.bindTestCommand();
        }
    }

    private startSeasonCron() {
        cron.schedule('0 0 * * *', async () => {
            await this.processPolls();
            await this.processSeasonPolls();

            try {
                const now = DateTime.now().setZone(TIMEZONE);
                const monthChanged = now.day === 1;
                let seasonChanged = false;
                if (monthChanged) {
                    for (const months of Object.values(SeasonHandler.MONTHS_SEASONS)) {
                        if (months[0] === now.month) {
                            seasonChanged = true;
                            break;
                        }
                    }
                }

                const nowISO = now.toISO();
                if (!nowISO) {
                    console.warn('Failed to convert now to ISO date');
                    return;
                }

                const seasonSchedule = await SeasonScheduleNotify.findByDate(nowISO);
                if (!seasonSchedule) {
                    return await this.createSeasonPoll(SeasonHandler.getSeasonInfo(nowISO).nextSeason!);
                }

                if (!seasonChanged) {
                    return await this.seasonCountdown(nowISO);
                }
            } catch (e) {
                console.error('Season countdown failed!', e);
            }

        }, { timezone: TIMEZONE });

        cron.schedule('0 0 1 3,6,9,12 *', async () => {
            try {
                const nowISO = DateTime.now().setZone(TIMEZONE).toISO();
                if (!nowISO) {
                    console.warn('Failed to convert now to ISO date');
                    return;
                }

                const season = SeasonHandler.getSeasonInfo(nowISO).curSeason;
                if (!season) return;

                await this.seasonCongratulate(season);
                await this.createSeasonPoll(season);
            } catch (e) {
                console.error('Season changed job failed!');
            }
        }, { timezone: TIMEZONE });
    }

    private async seasonCongratulate(season: SeasonType) {
        return this.sendMessage(SeasonHandler.SEASON_CONGRATS[season]);
    }

    private async seasonCountdown(dateISO: string) {
        const { nextSeason, daysUntilNextSeason } = SeasonHandler.getSeasonInfo(dateISO);

        if (!nextSeason || !daysUntilNextSeason) {
            throw new Error('Error calculating season info');
        }

        const msg = `До ${SeasonHandler.SEASONS_FORMS[nextSeason].until} `
            + `${pluralize(daysUntilNextSeason, ["остался", "осталось", "осталось"])} ${daysUntilNextSeason} `
            + `${pluralize(daysUntilNextSeason, ["день", "дня", "дней"])}! `
            + `${SeasonHandler.SEASON_EMOJIS[nextSeason]}`;

        const currentSchedule = await SeasonScheduleNotify.findByDate(dateISO);
        if (!currentSchedule) {
            await this.sendMessage(msg);
            return;
        }

        const current = DateTime.fromISO(dateISO).setZone(TIMEZONE);
        const startDate = DateTime.fromISO(currentSchedule.start_date).setZone(TIMEZONE);
        const endDate = DateTime.fromISO(currentSchedule.end_date).setZone(TIMEZONE);

        const lastDayDiff = endDate.diff(current, 'day').days;
        if (0 < lastDayDiff && lastDayDiff <= 1) {
            await this.sendMessage(msg);
            return;
        }

        const periodicity = currentSchedule.periodicity;
        if (periodicity === 0) {
            return;
        }

        if (Math.floor(current.diff(startDate, 'day').days) % periodicity === 0) {
            await this.sendMessage(msg);
        }
    }

    private async createSeasonPoll(season: SeasonType) {
        const options = [
            { text: 'Присылать раз в день.', periodicity: 1 },
            { text: 'Присылать раз в 3 дня.', periodicity: 3 },
            { text: 'Присылать раз в неделю.', periodicity: 7 },
            { text: 'Не присылать :p', periodicity: 0 },
        ];

        const poll = await this.sendPoll(
            `Считаем дни до ${SeasonHandler.SEASONS_FORMS[season].until}?`,
            options,
        );

        if (!poll) return;

        const dbPoll = new Poll();
        dbPoll.options = JSON.stringify(options);
        dbPoll.message_id = poll.message_id;

        const untilISO = DateTime.now().setZone(TIMEZONE).plus({ day: 1 }).startOf('day').toISO();
        if (!untilISO) {
            console.warn('Failed to convert until_date to ISO date');
            return;
        }

        dbPoll.until_date = untilISO;
        await dbPoll.save();

        const dbSeasonPoll = new SeasonPoll();
        dbSeasonPoll.poll_id = dbPoll.id;
        await dbSeasonPoll.save();
    }

    private async sendMessage(msg: string) {
        try {
            return await this._bot.api.sendMessage(process.env.CHAT_ID!, msg);
        } catch (e) {
            console.error('Error while sending message: ', e);
        }
    }

    private async sendPoll(msg: string, options: SeasonPollOptions[]) {
        try {
            return await this._bot.api.sendPoll(process.env.CHAT_ID!, msg, options);
        } catch (e) {
            console.error('Error while sending poll: ', e);
        }
    }

    private async stopPoll(message_id: number) {
        try {
            return await this._bot.api.stopPoll(process.env.CHAT_ID!, message_id);
        } catch (e) {
            console.error('Error while stopping poll', e)
        }
    }

    private async processPolls() {
        const polls = await Poll.getExpired();

        for (const p of polls) {
            const poll = await this.stopPoll(p.message_id);

            if (!poll) return;

            const winIndex = poll.options.reduce((acc, curO, i) => {
                if (curO.voter_count > acc) return i;
                return acc;
            }, 0);

            p.win_index = winIndex;
            await p.save();
        }
    }

    private async processSeasonPolls() {
        const unprocessedSeasonPolls = await SeasonPoll.getUnprocessed();

        for (const p of unprocessedSeasonPolls) {
            const poll = await Poll.findOneBy({ id: p.poll_id });

            if (!poll) {
                console.warn('Process season polls: poll not found!');
                return;
            }

            const ssn = new SeasonScheduleNotify();

            const options = JSON.parse(poll.options) as SeasonPollOptions[];
            ssn.periodicity = options[poll.win_index]!.periodicity;

            ssn.start_date = poll.until_date;

            const nowISO = DateTime.now().setZone(TIMEZONE).toISO();
            if (!nowISO) {
                console.warn('Failed to convert now to ISO date');
                return;
            }
            const seasonInfo = SeasonHandler.getSeasonInfo(nowISO);

            const endISO = DateTime
                .now()
                .setZone(TIMEZONE)
                .set({ month: SeasonHandler.MONTHS_SEASONS[seasonInfo.nextSeason!][0]! })
                .startOf('month')
                .toISO();

            if (!endISO) {
                console.warn('Failed to convert end_date to ISO date');
                return;
            }

            ssn.end_date = endISO;
            await ssn.save();

            p.is_processed = true;
            await p.save();
        }
    }

    private bindTestCommand() {
        this._bot.command('test', async () => {
            await this.createSeasonPoll('summer');
        });

        this._bot.command('pp', async () => {
            await this.processPolls();
        });

        this._bot.command('psp', async () => {
            await this.processSeasonPolls();
        });

        this._bot.command('d', async () => {
            await this.seasonCountdown('2026-05-31T15:00:00.000+03:00');
        });

        this._bot.command('e', async () => {
            await this.sendMessage('Hi! ☀️🌻');
        });
    }
}
