import {SoopAPIBaseUrls, SoopLoginOptions} from "../types"
import {SoopClient} from "../client"

export interface SoopChatOptions {
    streamerId: string
    login?: SoopLoginOptions
    baseUrls?: SoopAPIBaseUrls
}

export interface SoopChatOptionsWithClient extends SoopChatOptions {
    client?: SoopClient
}

export enum ChatDelimiter {
    STARTER = "\x1b\t",
    SEPARATOR = "\x0c",
    ELEMENT_START = "\x11",
    ELEMENT_END = "\x12",
    SPACE = "\x06"
}

export enum ChatType {
    PING = "0000",
    CONNECT = "0001",
    ENTER_CHAT_ROOM = "0002",
    EXIT = "0004",
    CHAT = "0005",
    DISCONNECT = "0007",
    ENTER_INFO = "0012",
    TEXT_DONATION = "0018",
    AD_BALLOON_DONATION = "0087",
    SUBSCRIBE = "0093",
    NOTIFICATION = "0104",
    EMOTICON = "0109",
    VIDEO_DONATION = "0105",
    VIEWER = "0127",
    // UNKNOWN = "0009",
    // UNKNOWN = "0054",
    // UNKNOWN = "0088",
    // UNKNOWN = "0094",
}

export interface Events {
    connect: ConnectResponse
    enterChatRoom: EnterChatRoomResponse
    notification: NotificationResponse
    chat: ChatResponse
    emoticon: EmotionResponse
    textDonation: DonationResponse
    videoDonation: DonationResponse
    adBalloonDonation: DonationResponse
    subscribe: SubscribeResponse
    exit: ExitResponse
    disconnect: DisconnectResponse
    viewer: ViewerResponse
    unknown: string
    raw: string
}

export interface Response {
    receivedTime: string
}

export interface ConnectResponse extends Response{
    syn: string
    username: string
    streamerId: string
}

export interface EnterChatRoomResponse extends Response{
    synAck: string
    streamerId: string
}

export interface NotificationResponse extends Response{
    notification: string
}

export interface ChatResponse extends Response{
    username: string
    userId: string
    comment: string
}

export interface DonationResponse extends Response{
    to: string
    from: string
    fromUsername: string
    amount: string
    fanClubOrdinal: string
}

export interface EmotionResponse extends Response{
    userId: string
    username: string
    emoticonId: string
}

export interface ViewerResponse extends Response{
    userId: string[]
}

export interface SubscribeResponse extends Response {
    to: string
    from: string
    fromUsername: string
    monthCount: string
    tier: string
}

export interface ExitResponse extends Response{
    username: string
    userId: string
}

export interface DisconnectResponse extends Response{
    streamerId: string
}