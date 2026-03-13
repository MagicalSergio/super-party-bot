import { DateTime } from 'luxon';
import { XAIResponseHistoryEntity } from '../entity/XAIResponseHistory.entity.js';
import { TIMEZONE } from '../../../const.js';
import type { IAIPerson } from '../interfaces/IAIPerson.js';
import { proxiedFetch } from '../../../utils/proxiedFetch.js';
import { MessageEntity } from '../../../entity/Message.entity.js';
import { XAIProcessedMessageEntity } from '../entity/XAIProcessedMessage.entity.js';
import { chunk } from 'lodash-es';

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
            // const result = await this.requestResponse(this.formMessage(msg, msgContext));
            return null;
            // if (!result) return null;
            // await this.savePreviousResponseId(result.id);
            // return result.response;
        } catch (e) {
            console.error('xAi response request error: ', e);
            return null;
        }
    }

    private async requestResponse(message: string): Promise<{ response: string, id: string } | null> {
        try {
            const body: IXAIAPIResponsesBody = {
                input: message,
                model: this.model,
            };

            const prevResId = await XAIResponseHistoryEntity.getLastResponseId(this.sysname);
            if (prevResId) {
                body.previous_response_id = prevResId.response_id;
            } else {
                body.instructions = this.instructions ?? undefined;
            }

            const result = await proxiedFetch(XAIPerson.RESPONSE_URL, {
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

            return {
                id: parsedResult.id,
                response: parsedResult.output[0].content[0].text,
            };
        } catch (e) {
            console.error('Error requesting response from model: ', e);
            return null;
        }
    }

    private async savePreviousResponseId(id: string) {
        const response = XAIResponseHistoryEntity.create();
        response.date_created = DateTime.now().setZone(TIMEZONE).toISO()!;
        response.personality_sysname = this.sysname;
        response.response_id = id;
        await response.save();
    }

    private async updateContextHistory() {
        const lastProcessedDate = await XAIProcessedMessageEntity.getLastDateProcessed(this.sysname);

        console.log('lastProcessedDate: ', lastProcessedDate);

        const unprocessedMessages = (lastProcessedDate
            ? await MessageEntity.getSince(lastProcessedDate)
            : await MessageEntity.getLast(100))
            .filter((msg) => msg.from_username !== this.username);

        try {
            let prompt = '*** Это системное сообщение для обновления твоего контекста ***\n'
                + '*** Ответь на него "ok", запомни этот контекст ***\n'
                + '*** (Начало системного сообщения) ***\n'
                + '$$content$$\n'
                + '*** (Конец системного сообщения)';

            let contentItemTemplate = '---\n'
                + '- Type: Message\n'
                + '- From: username: $$username$$, first_name: $$first_name$$, last_name: $$last_name$$\n'
                + '- Date (ISO): $$date$$\n'
                + '- Message Content (START):\n'
                + '$$text$$\n'
                + '- Message Content (END)\n'
                + '---';

            const chunks = chunk(unprocessedMessages, 20);

            console.log('unprocessedMessages: ', unprocessedMessages);

            for (const chunk of chunks) {
                let content = '';

                for (const msg of chunk) {
                    const data = msg.getData();

                    content += contentItemTemplate
                        .replace('$$username$$', msg.from_username)
                        .replace('$$first_name$$', String(data.from?.first_name))
                        .replace('$$last_name$$', String(data.from?.last_name))
                        .replace('$$date$$', msg.date)
                        .replace('$$text$$', String(data.text));
                }

                // await this.requestResponse(prompt.replace('$$content$$', content));
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

        console.log('prompt: ', prompt);

        return prompt;
    }
}
