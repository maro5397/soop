import {SoopChat, SoopChatOptions} from "./chat"

export interface SoopAPIBaseUrls {
    soopPlayerBaseUrl?: string
    soopBridgeBaseUrl?: string
}

export interface SoopClientOptions {
    baseUrls?: SoopAPIBaseUrls
    userAgent?: string
}

export type SoopChatFunc = {
    (options: SoopChatOptions): SoopChat
}
