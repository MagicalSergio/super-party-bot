import fetch from 'node-fetch';
import type { RequestInfo, RequestInit } from 'node-fetch';
import { SocksProxyAgent } from 'socks-proxy-agent';

const agent = new SocksProxyAgent('socks5://127.0.0.1:1080');

export const proxiedFetch = async (url: URL | RequestInfo, init?: RequestInit) => {
    return await fetch(url, {
        ...init,
        agent,
    });
};
