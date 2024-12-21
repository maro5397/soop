import WebSocket, { MessageEvent } from "ws"
import { DEFAULT_BASE_URLS } from "../const"
import { SoopClient } from "../client"
import {ChatDelimiter, ChatType, Events, SoopChatOptions, SoopChatOptionsWithClient} from "./types"
import { LiveDetail } from "../api"
import { SecureContextOptions, createSecureContext } from "tls";
import { Agent } from "https";

export class SoopChat {
    private readonly client: SoopClient
    private ws: WebSocket
    private chatUrl: string
    private liveDetail: LiveDetail
    private options: SoopChatOptions
    private handlers: [string, (data: any) => void][] = []
    private pingIntervalId = null

    constructor(options: SoopChatOptionsWithClient) {
        this.options = options
        this.options.baseUrls = options.baseUrls ?? DEFAULT_BASE_URLS
        this.client = options.client ?? new SoopClient({baseUrls: options.baseUrls})
    }

    private _connected: boolean = false

    async connect() {
        if (this._connected) {
            throw new Error('Already connected')
        }

        this.liveDetail = await this.client.live.detail(this.options.streamerId)
        if (this.liveDetail.CHANNEL.RESULT === 0) {
            throw new Error("Not streaming now")
        }
        this.chatUrl = this.makeChatUrl(this.liveDetail)

        this.ws = new WebSocket(
            this.chatUrl,
            ['chat'],
            { agent: this.createAgent() }
        )

        this.ws.onopen = () => {
            const CONNECT_PACKET = `${ChatDelimiter.STARTER}000100000600${ChatDelimiter.SEPARATOR.repeat(3)}16${ChatDelimiter.SEPARATOR}`;
            this.ws.send(CONNECT_PACKET)
        }

        this.ws.onmessage = this.handleMessage.bind(this)
        this.startPingInterval();

        this.ws.onclose = () => {
            this.disconnect()
        }
    }

    async disconnect() {
        if (!this._connected) {
            return
        }
        const receivedTime = new Date().toISOString();
        this.emit('disconnect', {streamerId: this.options.streamerId, receivedTime: receivedTime})
        this.stopPingInterval()
        this.ws?.close()
        this.ws = null
        this._connected = false
    }

    emit(event: string, data: any) {
        if (this.handlers[event]) {
            for (const handler of this.handlers[event]) {
                handler(data)
            }
        }
    }

    on<T extends keyof Events>(event: T, handler: (data: Events[T]) => void) {
        const e = event as string
        this.handlers[e] = this.handlers[e] || []
        this.handlers[e].push(handler)
    }

    private async handleMessage(data: MessageEvent) {
        const receivedTime = new Date().toISOString();
        const packet = data.data.toString()
        this.emit('raw', Buffer.from(packet))

        const messageType = this.parseMessageType(packet)

        switch (messageType) {
            case ChatType.CONNECT:
                this._connected = true
                this.emit('connect', {streamerId: this.options.streamerId, receivedTime: receivedTime})
                const JOIN_PACKET = `${ChatDelimiter.STARTER}0002${this.calculateByteSize(this.liveDetail.CHANNEL.CHATNO).toString().padStart(6, '0')}00${ChatDelimiter.SEPARATOR}${this.liveDetail.CHANNEL.CHATNO}${ChatDelimiter.SEPARATOR.repeat(5)}`;
                this.ws.send(JOIN_PACKET);
                break

            case ChatType.ENTERCHATROOM:
                this.emit('enterChatRoom', {streamerId: this.options.streamerId, receivedTime: receivedTime})
                break

            case ChatType.NOTIFICATION:
                const notification = this.parseNotification(packet)
                this.emit('notification', {...notification, receivedTime: receivedTime})
                break

            case ChatType.CHAT:
                const chat = this.parseChat(packet)
                this.emit('chat', {...chat, receivedTime: receivedTime})
                break

            case ChatType.VIDEODONATION:
                const videoDonation = this.parseVideoDonation(packet)
                this.emit('videoDonation', {...videoDonation, receivedTime: receivedTime})
                break

            case ChatType.TEXTDONATION:
                const textDonation = this.parseTextDonation(packet)
                this.emit('textDonation', {...textDonation, receivedTime: receivedTime})
                break

            case ChatType.ADBALLOONDONATION:
                const adBalloonDonation = this.parseAdBalloonDonation(packet)
                this.emit('adBalloonDonation', {...adBalloonDonation, receivedTime: receivedTime})
                break

            case ChatType.EMOTICON:
                const emoticon = this.parseEmoticon(packet)
                this.emit('emoticon', {...emoticon, receivedTime: receivedTime})
                break

            case ChatType.VIEWER:
                const viewer = this.parseViewer(packet)
                this.emit('viewer', {...viewer, receivedTime: receivedTime})
                break

            case ChatType.SUBSCRIBE:
                const subscribe = this.parseSubscribe(packet)
                this.emit('viewer', {...subscribe, receivedTime: receivedTime})
                break

            case ChatType.EXIT:
                const exit = this.parseExit(packet)
                this.emit('exit', {...exit, receivedTime: receivedTime})
                break

            case ChatType.DISCONNECT:
                await this.disconnect();
                break;

            default:
                const parts = packet.split(ChatDelimiter.SEPARATOR);
                this.emit('unknown', parts)
                break;
        }
    }

    private parseSubscribe(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, to, from, fromUsername, amount, , , , tier] = parts
        return {to: to, from: from, fromUsername: fromUsername, amount: amount, tier: tier}
    }

    private parseAdBalloonDonation(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , to, from, fromUsername, , , , , , amount, fanClubOrdinal] = parts
        return {to: to, from: from, fromUsername: fromUsername, amount: amount, fanClubOrdinal: fanClubOrdinal}
    }

    private parseVideoDonation(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , to, from, fromUsername, amount, fanClubOrdinal] = parts
        return {to: to, from: from, fromUsername: fromUsername, amount: amount, fanClubOrdinal: fanClubOrdinal}
    }

    private parseViewer(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        if (parts.length > 4) {
            return { userId: this.getViewerElements(parts) }
        } else {
            const [, userId] = parts
            return { userId: [ userId ] }
        }
    }

    private parseExit(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , userId, username] = parts
        return {userId: userId, username: username}
    }

    private parseEmoticon(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , , emoticonId, , , userId, username] = parts
        return {userId: userId, username: username, emoticonId: emoticonId}
    }

    private parseTextDonation(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, to, from, fromUsername, amount, fanClubOrdinal] = parts
        return {to: to, from: from, fromUsername: fromUsername, amount: amount, fanClubOrdinal: fanClubOrdinal}
    }

    private parseNotification(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , , , notification] = parts
        return {notification: notification}
    }

    private parseChat(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, comment, userId, , , , username] = parts;
        return {userId: userId, comment: comment, username: username};
    }

    private parseMessageType(packet: string): string {
        if(!packet.startsWith(ChatDelimiter.STARTER)) {
            throw new Error("Invalid data: does not start with STARTER byte");
        }
        if (packet.length >= 5) {
            return packet.substring(2, 6);
        }
        throw new Error("Invalid data: does not have any data for opcode");
    }

    private startPingInterval() {
        if (this.pingIntervalId) {
            clearInterval(this.pingIntervalId);
        }

        this.pingIntervalId = setInterval(() => this.sendPing(), 60000);
    }

    private stopPingInterval() {
        if (this.pingIntervalId) {
            clearInterval(this.pingIntervalId);
            this.pingIntervalId = null;
        }
    }

    private sendPing() {
        if (!this.ws) return;
        this.ws.send(`${ChatDelimiter.STARTER}000000000100${ChatDelimiter.SEPARATOR}`);
    }

    private makeChatUrl(detail: LiveDetail): string {
        return `wss://${detail.CHANNEL.CHDOMAIN.toLowerCase()}:${Number(detail.CHANNEL.CHPT) + 1}/Websocket/${this.options.streamerId}`
    }

    private calculateByteSize(input: string): number {
        return Buffer.byteLength(input, 'utf-8') + 6;
    }

    private createAgent(): Agent {
        const options: SecureContextOptions = {};
        const secureContext = createSecureContext(options);
        return new Agent({
            secureContext,
            rejectUnauthorized: false
        })
    }

    private getViewerElements<T>(array: T[]): T[] {
        return array.filter((_, index) => index % 2 === 1);
    }
}
