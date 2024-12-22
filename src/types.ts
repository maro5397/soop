import {SoopChat, SoopChatOptions} from "./chat"

export interface SoopAPIBaseUrls {
    soopLiveBaseUrl?: string
    soopChannelBaseUrl?: string
}

export interface SoopClientOptions {
    baseUrls?: SoopAPIBaseUrls
    userAgent?: string
}

export type SoopChatFunc = {
    (options: SoopChatOptions): SoopChat
}
