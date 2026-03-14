interface IMessageContext {
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

export interface IAIPerson {
    response: (msg: string, ctx: IMessageContext) => Promise<string | null>;
}
