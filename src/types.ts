import {SoopChat, SoopChatOptions} from "./chat"

export interface SoopAPIBaseUrls {
    soopLiveBaseUrl?: string
    soopChannelBaseUrl?: string
    soopAuthBaseUrl?: string
}

export interface SoopClientOptions {
    baseUrls?: SoopAPIBaseUrls
    userAgent?: string
}

export interface SoopLoginOptions {
    userId?: string,
    password?: string
}

export type SoopChatFunc = {
    (options: SoopChatOptions): SoopChat
}
