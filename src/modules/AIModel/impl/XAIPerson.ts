import { DateTime } from 'luxon';
import { XAIResponseHistoryEntity } from '../entity/XAIResponseHistory.entity.js';
import { TIMEZONE } from '../../../const.js';
import type { IAIPerson } from '../interfaces/IAIPerson.js';
import { proxiedFetch } from '../../../utils/proxiedFetch.js';
import { MessageEntity } from '../../../entity/Message.entity.js';
import { XAIProcessedMessageEntity } from '../entity/XAIProcessedMessage.entity.js';
import { chunk } from 'lodash-es';
import fetch from 'node-fetch';

interface IXAIPersonConstructorArgs {
    sysname: string;
    name: string;
    instructions: string;
    model: string;
    username: string;
}

interface IXAIAPIResponsesBody {
    model: string;
    input: string;
    instructions?: string | undefined;
    previous_response_id?: string;
    temperature?: number;
}

interface IXAIMessageContext {
    from: {
        firstName?: string;
        lastName?: string;
        username?: string;
        date?: string;
    };
    replyBotMessage?: {
        text: string;
    };
}

export class XAIPerson implements IAIPerson {
    private sysname: string;
    private name: string;
    private model: string;
    private instructions: string;
    private username: string;

    private static RESPONSE_URL = 'https://api.x.ai/v1/responses';

    constructor(opts: IXAIPersonConstructorArgs) {
        this.sysname = opts.sysname;
        this.name = opts.name;
        this.model = opts.model;
        this.instructions = opts.instructions;
        this.username = opts.username;
    }

    public async response(msg: string, msgContext: IXAIMessageContext): Promise<string | null> {
        try {
            await this.updateContextHistory();
            const result = await this.requestResponse(this.formMessage(msg, msgContext));
            if (!result) return null;
            return result;
        } catch (e) {
            console.error('xAi response request error: ', e);
            return null;
        }
    }

    private async requestResponse(message: string): Promise<string | null> {
        try {
            const body: IXAIAPIResponsesBody = {
                input: message,
                model: this.model,
                temperature: 0.2,
            };

            const prevResId = await XAIResponseHistoryEntity.getLastResponseId(this.sysname);
            if (prevResId) {
                body.previous_response_id = prevResId.response_id;
            } else {
                body.instructions = this.instructions ?? undefined;
            }

            const requiredFetch = process.env.USE_PROXIED_AI ? proxiedFetch : fetch;
            const result = await requiredFetch(XAIPerson.RESPONSE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.X_AI_APIKEY!}`,
                },
                body: JSON.stringify(body),
            });

            if (!result.ok) {
                const errorBody = await result.text();
                throw new Error(errorBody);
            }

            const parsedResult = await result.json() as any;
            await this.savePreviousResponseId(parsedResult.id);
            return parsedResult.output[0].content[0].text as string;
        } catch (e) {
            console.error('Error requesting response from model: ', e);
            return null;
        }
    }

    private async savePreviousResponseId(id: string) {
        const response = XAIResponseHistoryEntity.create();
        response.date_created = String(DateTime.now().setZone(TIMEZONE).valueOf());
        response.personality_sysname = this.sysname;
        response.response_id = id;
        await response.save();
    }

    public async updateContextHistoryAccess() {
        return await this.updateContextHistory();
    }

    private async updateContextHistory() {
        const lastProcessedDate = await XAIProcessedMessageEntity.getLastDateProcessed(this.sysname);

        const unprocessedMessages = (lastProcessedDate
            ? await MessageEntity.getSince(lastProcessedDate)
            : await MessageEntity.getLast(200)
        ).filter((msg) => (
            msg.from_username !== this.username // сообщение не от самого бота
            && msg.getData().reply_to_message?.from?.username !== this.username // сообщение не для бота (reply)
            && msg.getData().text?.indexOf(`@${this.username}`) === -1) // сообщение не для бота (mention)
        );

        try {
            let prompt = 'Это сообщение содержит недостающую тебе историю чата\n'
                + 'Запомни участников чата и общий контекст беседы\n'
                + 'Ответь на это сообщение "ок"\n'
                + '(Начало сообщения)\n'
                + '$$content$$\n'
                + '(Конец сообщения)';

            let contentItemTemplate = 'От кого: $$username$$, $$first_name$$, $$last_name$$\n'
                + 'Сообщение: $$text$$\n'
                + '---\n';

            const chunks = chunk(unprocessedMessages, 20);

            for (const chunk of chunks) {
                let content = '';

                for (const msg of chunk) {
                    const data = msg.getData();

                    content += contentItemTemplate
                        .replace('$$username$$', msg.from_username)
                        .replace('$$first_name$$', String(data.from?.first_name))
                        .replace('$$last_name$$', String(data.from?.last_name))
                        .replace('$$date$$', DateTime.fromJSDate(new Date(msg.date)).toISO()!)
                        .replace('$$text$$', String(data.text));
                }

                console.log(`prompt.replace('$$content$$', content)`, prompt.replace('$$content$$', content));

                const response = await this.requestResponse(prompt.replace('$$content$$', content));
            }
        } catch (e) {
            console.error('Error processing context messages:', e);
            return;
        }

        const entities: XAIProcessedMessageEntity[] = [];
        for (const msg of unprocessedMessages) {
            const processed = XAIProcessedMessageEntity.create();
            processed.personality_sysname = this.sysname;
            processed.message_id = msg.message_id;
            processed.chat_id = msg.chat_id;
            processed.date_processed = msg.date;
            entities.push(processed);
        }

        await XAIProcessedMessageEntity.save(entities);
    }

    private formMessage(message: string, context: IXAIMessageContext) {
        const prompt = '--- Системные данные ---\n'
            + `Сообщение от: username: ${context.from.username}, firstName: ${context.from.firstName}, lastName: ${context.from.lastName}\n`
            + `Дата: ${context.from.date}\n`
            + (context.replyBotMessage
                ? 'Это ответ на твоё сообщение, цитата:\n'
                + `\"${context.replyBotMessage.text}\"\n`
                : '')
            + '--- Системные данные (END) ---\n\n'
            + '--- Сообщение (START) ---\n'
            + message
            + '\n --- Сообщение (END) ---';

        return prompt;
    }
}
