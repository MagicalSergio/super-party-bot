export interface IAIPerson {
    response: (msg: string) => Promise<string | null>;
}
