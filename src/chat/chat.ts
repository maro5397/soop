import WebSocket, { MessageEvent } from "ws"
import { DEFAULT_BASE_URLS } from "../const"
import { SoopClient } from "../client"
import { ChatDelimiter, ChatType, Events, SoopChatOptions, SoopChatOptionsWithClient } from "./types"
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

        this.liveDetail = await this.client.live.detail(this.options.steamerId)
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
        this.emit('disconnect', this.chatUrl)
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

    on<T extends keyof Events>(event: T, handler: (data: Events[typeof event]) => void) {
        const e = event as string
        this.handlers[e] = this.handlers[e] || []
        this.handlers[e].push(handler)
    }

    private async handleMessage(data: MessageEvent) {
        const packet = data.data.toString()
        this.emit('raw', Buffer.from(packet))

        const messageType = this.parseMessageType(packet)

        switch (messageType) {
            case ChatType.CONNECT:
                this._connected = true
                this.emit('connect', this.options.steamerId)
                const JOIN_PACKET = `${ChatDelimiter.STARTER}0002${this.calculateByteSize(this.liveDetail.CHANNEL.CHATNO).toString().padStart(6, '0')}00${ChatDelimiter.SEPARATOR}${this.liveDetail.CHANNEL.CHATNO}${ChatDelimiter.SEPARATOR.repeat(5)}`;
                this.ws.send(JOIN_PACKET);
                break

            case ChatType.ENTERCHATROOM:
                this.emit('enterChatRoom', this.options.steamerId)
                break

            case ChatType.NOTIFICATION:
                this.emit('notification', this.options.steamerId)
                break

            case ChatType.CHAT:
                const chat = this.parseChat(packet)
                this.emit('chat', chat)
                break

            case ChatType.DONATION:
                this.emit('donation', null)
                break

            case ChatType.EMOTICON:
                this.emit('emoticon', null)
                break

            case ChatType.EXIT:
                this.emit('exit', null)
                break

            case ChatType.DISCONNECT:
                await this.disconnect();
                break;
        }
    }

    private parseChat(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [userId, comment, , , , , username] = parts;
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
        return `wss://${detail.CHANNEL.CHDOMAIN.toLowerCase()}:${Number(detail.CHANNEL.CHPT) + 1}/Websocket/${this.options.steamerId}`
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
}
