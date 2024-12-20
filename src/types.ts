import {SoopChat, SoopChatOptions} from "./chat"
import {SoopLiveStatus, SoopLiveStatusOptions} from "./live-status"

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

export type SoopLiveStatusFunc = {
    (options: SoopLiveStatusOptions): SoopLiveStatus
}