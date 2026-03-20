import cron from 'node-cron';
import { Bot } from 'grammy';
import { TIMEZONE } from './const.js';
import { SeasonHandler } from './SeasonHandler.js';
import { PollEntity } from './entity/Poll.entity.js';
import { SeasonPollEntity } from './entity/SeasonPoll.entity.js';
import { SeasonScheduleNotifyEntity } from './entity/SeasonScheduleNotify.entity.js';
import { DateTime } from 'luxon';
import { pluralize } from './utils/pluralize.js';
import { AIPersonalityEntity } from './modules/AIModel/entity/AIPersonality.entity.js';
import { MessageEntity } from './entity/Message.entity.js';
import { proxiedFetch } from './utils/proxiedFetch.js';
import type { SeasonType } from './SeasonHandler.js';
import type { Context, Api, RawApi } from 'grammy';
import type { Message, Update } from 'grammy/types';
import type { IAIPerson } from './modules/AIModel/interfaces/IAIPerson.js';

interface SeasonPollOptions {
    text: string;
    periodicity: number;
}

export class PartyBot<C extends Context = Context> {
    public bot: Bot<C, Api<RawApi>>;
    private aiPerson: IAIPerson | undefined;

    constructor() {
        this.bot = new Bot(process.env.TG_API_KEY!, {
            client: {
                fetch: proxiedFetch,
            },
        });
    }

    public async init() {
        if (process.env.BIND_TEST) {
            this.bindTestCommand();
        }

        this.initOnMessage();
        this.startSeasonCron();

        await this.bot.init();

        this.bot
            .start()
            .catch((e) => console.error('Something bad happened: ', e));
    }

    public attachAIPersonality(person: IAIPerson) {
        this.aiPerson = person;
    }

    public async sendMessage(msg: string) {
        try {
            const message = await this.bot.api.sendMessage(process.env.CHAT_ID!, msg);
            return await this.saveMessageEntity(message);
        } catch (e) {
            console.error('Error while sending message: ', e);
        }
    }

    private async saveMessageEntity(msg: Message & Update.NonChannel | Message.TextMessage) {
        const entity = MessageEntity.create();
        entity.message_id = msg.message_id;
        entity.chat_id = msg.chat.id;
        entity.from_username = msg.from?.username || '';
        entity.date = String(DateTime.now().valueOf());
        entity.json = JSON.stringify(msg);
        await entity.save();
    }

    private extractMentionsUsernames(message: Message): string[] {
        if (!message.text || !message.entities) {
            return [];
        }

        return message.entities.filter((e) => e.type === 'mention').map((m) => {
            return message.text!.slice(m.offset, m.offset + m.length).replace('@', '');
        });
    }

    private getMessageText(message: Message): string {
        if (!message.text) {
            return '';
        }

        if (!message.entities) {
            return message.text;
        }

        return message.text.replace(/@\S+/gm, '').trim();
    }

    private initOnMessage() {
        this.bot.on('message', async (ctx) => {
            if (String(ctx.chatId) !== process.env.CHAT_ID!) {
                return;
            }

            // todo: implement queue
            await this.saveMessageEntity(ctx.message);

            // AI Job
            if (this.aiPerson) {
                const message = this.getMessageText(ctx.message);
                const mentions = this.extractMentionsUsernames(ctx.message);
                const botMentioned = mentions.includes(this.bot.botInfo.username);
                const reply = ctx.message.reply_to_message;
                const botReplied = ctx.message.reply_to_message?.from?.username === this.bot.botInfo.username;

                if (botMentioned || botReplied) {
                    const messageContext = {
                        from: {
                            firstName: ctx.message.from.first_name,
                            lastName: ctx.message.from.last_name,
                            username: ctx.message.from.username,
                            date: DateTime.now().setZone(TIMEZONE).toISO()!,
                        },
                        replyBotMessage: botReplied
                            ? { text: reply!.text! }
                            : undefined,
                    };
                    const response = await this.aiPerson.response(message, messageContext);
                    if (!response) return await this.sendMessage('Извините, ошибка...');
                    return await this.sendMessage(response);
                }
            }
        });
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

                const seasonSchedule = await SeasonScheduleNotifyEntity.findByDate(String(now.valueOf()));
                if (!seasonSchedule) {
                    return await this.createSeasonPoll(SeasonHandler.getSeasonInfo(String(now.valueOf())).nextSeason!);
                }

                if (!seasonChanged) {
                    return await this.seasonCountdown(String(now.valueOf()));
                }
            } catch (e) {
                console.error('Season countdown failed!', e);
            }

        }, { timezone: TIMEZONE });

        cron.schedule('0 0 1 3,6,9,12 *', async () => {
            try {
                const seasonInfo = SeasonHandler.getSeasonInfo(String(DateTime.now().valueOf()));
                if (!seasonInfo.curSeason || !seasonInfo.nextSeason) return;

                await this.seasonCongratulate(seasonInfo.curSeason);
                await this.createSeasonPoll(seasonInfo.nextSeason);
            } catch (e) {
                console.error('Season changed job failed!');
            }
        }, { timezone: TIMEZONE });
    }

    private async seasonCongratulate(season: SeasonType) {
        return this.sendMessage(SeasonHandler.SEASON_CONGRATS[season]);
    }

    private async seasonCountdown(timestamp: string) {
        const { nextSeason, daysUntilNextSeason } = SeasonHandler.getSeasonInfo(timestamp);

        if (!nextSeason || !daysUntilNextSeason) {
            throw new Error('Error calculating season info');
        }

        const msg = `До ${SeasonHandler.SEASONS_FORMS[nextSeason].until} `
            + `${pluralize(daysUntilNextSeason, ["остался", "осталось", "осталось"])} ${daysUntilNextSeason} `
            + `${pluralize(daysUntilNextSeason, ["день", "дня", "дней"])}! `
            + `${SeasonHandler.SEASON_EMOJIS[nextSeason]}`;

        const currentSchedule = await SeasonScheduleNotifyEntity.findByDate(timestamp);
        if (!currentSchedule) {
            await this.sendMessage(msg);
            return;
        }

        const current = DateTime.fromJSDate(new Date(timestamp)).setZone(TIMEZONE);
        const startDate = DateTime.fromJSDate(new Date(currentSchedule.start_date)).setZone(TIMEZONE);
        const endDate = DateTime.fromJSDate(new Date(currentSchedule.end_date)).setZone(TIMEZONE);

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

        const dbPoll = new PollEntity();
        dbPoll.options = JSON.stringify(options);
        dbPoll.message_id = poll.message_id;

        const untilTimestamp = DateTime.now().setZone(TIMEZONE).plus({ day: 1 }).startOf('day').valueOf();
        dbPoll.until_date = String(untilTimestamp);
        await dbPoll.save();

        const dbSeasonPoll = new SeasonPollEntity();
        dbSeasonPoll.poll_id = dbPoll.id;
        await dbSeasonPoll.save();
    }

    private async sendPoll(msg: string, options: SeasonPollOptions[]) {
        try {
            return await this.bot.api.sendPoll(process.env.CHAT_ID!, msg, options);
        } catch (e) {
            console.error('Error while sending poll: ', e);
        }
    }

    private async stopPoll(message_id: number) {
        try {
            return await this.bot.api.stopPoll(process.env.CHAT_ID!, message_id);
        } catch (e) {
            console.error('Error while stopping poll', e)
        }
    }

    private async processPolls() {
        const polls = await PollEntity.getExpired();

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
        const unprocessedSeasonPolls = await SeasonPollEntity.getUnprocessed();

        for (const p of unprocessedSeasonPolls) {
            const poll = await PollEntity.findOneBy({ id: p.poll_id });

            if (!poll) {
                console.warn('Process season polls: poll not found!');
                console.log('Unprocessed poll: ', p);
                continue;
            }

            if (poll.win_index === -1) {
                console.warn('Process season polls: poll not finished!');
                console.log(poll);
                continue;
            }

            const ssn = new SeasonScheduleNotifyEntity();
            const options = JSON.parse(poll.options) as SeasonPollOptions[];
            ssn.periodicity = options[poll.win_index]!.periodicity;
            ssn.start_date = poll.until_date;

            const seasonInfo = SeasonHandler.getSeasonInfo(String(DateTime.now().valueOf()));
            const endTimestamp = DateTime
                .now()
                .setZone(TIMEZONE)
                .set({ month: SeasonHandler.MONTHS_SEASONS[seasonInfo.nextSeason!][0]! })
                .startOf('month')
                .valueOf();

            ssn.end_date = String(endTimestamp);
            await ssn.save();

            p.is_processed = true;
            await p.save();
        }
    }

    private bindTestCommand() {
        this.bot.command('cm', async () => {
            try {
                const person = AIPersonalityEntity.create();
                person.name = 'ПатиБот';
                person.model = 'grok-4-1-fast-non-reasoning';
                person.instructions = 'Ты - ПатиБот. Бот для теста';
                person.sysname = 'party-bot-test-2';
                console.log('person: ', person);
                await person.save();
                await this.sendMessage('Персона создана');
            } catch (e) {
                console.error(e);
            }
        });

        this.bot.command('db', async () => {
            const rslt = await AIPersonalityEntity.find();
            await this.sendMessage('ok');
        });

        this.bot.command('test', async () => {
            await this.createSeasonPoll('autumn');
        });

        this.bot.command('pp', async () => {
            await this.processPolls();
            await this.sendMessage('ok');
        });

        this.bot.command('psp', async () => {
            await this.processSeasonPolls();
            await this.sendMessage('ok');
        });

        this.bot.command('d', async () => {
            await this.seasonCountdown('2026-06-01T15:00:00.000+03:00');
        });

        this.bot.command('e', async () => {
            await this.sendMessage('Hi! ☀️🌻');
        });

        this.bot.command('pzdc', async (ctx) => {
            await this.sendMessage('Hi! ☀️🌻');
        });

        this.bot.command('ai', async (ctx) => {
            if (!this.aiPerson) return;

            const response = await this.aiPerson.response(ctx.match, {
                from: {
                    firstName: ctx.message?.from.first_name,
                    lastName: ctx.message?.from.last_name,
                    username: ctx.message?.from.username,
                }
            });
            if (!response) {
                console.warn('Error requesting AI model response');
                return;
            }
            await this.sendMessage(response);
        });

        this.bot.command('js', async () => {
            async function shortPromise() {
                return await new Promise((res) => {
                    setTimeout(() => {
                        console.log('short promise resolve');
                        res('short promise resolved');
                    }, 100);
                });
            }

            async function longPromise() {
                return await new Promise((res) => {
                    setTimeout(() => {
                        console.log('long promise resolve');
                        res('long promise resolved');
                    }, 1000);
                });
            }

            const arr = [longPromise, shortPromise];

            let i = 0;
            while (arr[i]) {
                await arr[i]!();
                i++;
            }
        });
    }
}
