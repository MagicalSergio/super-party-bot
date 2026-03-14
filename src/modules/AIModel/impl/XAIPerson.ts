import { DateTime } from 'luxon';
import { XAIResponseHistoryEntity } from '../entity/XAIResponseHistory.entity.js';
import { TIMEZONE } from '../../../const.js';
import type { IAIPerson } from '../interfaces/IAIPerson.js';
import { proxiedFetch } from '../../../utils/proxiedFetch.js';

interface IXAiPersonConstructorArgs {
    sysname: string;
    name: string;
    instructions: string;
    model: string;
}

interface IXAiAPIResponsesBody {
    model: string;
    input: string;
    instructions?: string | undefined;
    previous_response_id?: string;
}

interface IResponseAdditionalCtx {
    from: string;
}

export class XAIPerson implements IAIPerson {
    private sysname: string;
    private name: string;
    private model: string;
    private instructions: string;

    constructor(opts: IXAiPersonConstructorArgs) {
        this.sysname = opts.sysname;
        this.name = opts.name;
        this.model = opts.model;
        this.instructions = opts.instructions;
    }

    public async response(msg: string, additionalCtx?: IResponseAdditionalCtx): Promise<string | null> {
        try {
            const body: IXAiAPIResponsesBody = {
                input: msg,
                model: this.model,
            };

            const prevResId = await XAIResponseHistoryEntity.getLastResponseId(this.sysname);
            if (prevResId) {
                body.previous_response_id = prevResId.response_id;
            } else {
                body.instructions = this.instructions ?? undefined;
            }

            const result = await proxiedFetch('https://api.x.ai/v1/responses', {
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
        
            return parsedResult.output[0].content[0].text;
        } catch (e) {
            console.error('xAi response request error: ', e);
            return null;
        }
    }

    private async savePreviousResponseId(id: string) {
        const response = XAIResponseHistoryEntity.create();
        response.date_created = String(DateTime.now().valueOf());
        response.personality_sysname = this.sysname;
        response.response_id = id;
        await response.save();
    }
}
