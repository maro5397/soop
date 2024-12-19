import {SoopAPIBaseUrls} from "../types"
import {SoopClient} from "../client"

export interface SoopChatOptions {
    steamerId: string
    baseUrls?: SoopAPIBaseUrls
    pollInterval?: number
}

export interface SoopChatOptionsWithClient extends SoopChatOptions {
    client?: SoopClient
}

export enum ChatDelimiter {
    STARTER = "\x1b\t",
    SEPARATOR = "\x0c",
}

export enum ChatType {
    PING = "0000",
    CONNECT = "0001",
    ENTERCHATROOM = "0002",
    EXIT = "0004",
    CHAT = "0005",
    DISCONNECT = "0007",
    DONATION = "0018",
    NOTIFICATION = "0104",
    EMOTICON = "0109",
    UNKNOWN1 = "0009",
    UNKNOWN2 = "0012",
    UNKNOWN3 = "0054",
    UNKNOWN4 = "0088",
    UNKNOWN5 = "0094",
    UNKNOWN6 = "0127",
}

export interface Events {
    connect: string
    chat: string
    emoticon: string
    donation: string
    disconnect: string
    enterChatRoom: string
    raw: string
}