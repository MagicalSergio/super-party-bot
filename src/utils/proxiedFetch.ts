import fetch from 'node-fetch';
import { agent } from './socksProxyAgent.js';
import type { RequestInfo, RequestInit } from 'node-fetch';

export const proxiedFetch = async (url: URL | RequestInfo, init?: RequestInit) => {
    return await fetch(url, {
        ...init,
        agent,
    });
};
