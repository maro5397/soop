import WebSocket, {MessageEvent} from "ws"
import {DEFAULT_BASE_URLS} from "../const"
import {SoopClient} from "../client"
import {ChatDelimiter, ChatType, Events, SoopChatOptions, SoopChatOptionsWithClient} from "./types"
import {Auth, LiveDetail} from "../api"
import {createSecureContext, SecureContextOptions} from "tls"
import {Agent} from "https"

export class SoopChat {
    private readonly client: SoopClient
    private ws: WebSocket
    private chatUrl: string
    private liveDetail: LiveDetail
    private auth: Auth
    private options: SoopChatOptions
    private handlers: [string, (data: any) => void][] = []
    private pingIntervalId = null

    constructor(options: SoopChatOptionsWithClient) {
        this.options = options
        this.options.baseUrls = options.baseUrls ?? DEFAULT_BASE_URLS
        this.client = options.client ?? new SoopClient({baseUrls: options.baseUrls})
    }

    private _connected: boolean = false
    private _entered: boolean = false

    async connect() {
        if (this._connected) {
            this.errorHandling('Already connected')
        }

        if(this.options.login) {
            this.auth = await this.client.auth.signIn(this.options.login.userId, this.options.login.password);
        }

        this.liveDetail = await this.client.live.detail(this.options.streamerId)
        if (this.liveDetail.CHANNEL.RESULT === 0) {
            throw this.errorHandling("Not Streaming now")
        }
        this.chatUrl = this.makeChatUrl(this.liveDetail)

        this.ws = new WebSocket(
            this.chatUrl,
            ['chat'],
            { agent: this.createAgent() }
        )

        this.ws.onopen = () => {
            const CONNECT_PACKET = this.getConnectPacket();
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

    public async sendChat(message: string): Promise<boolean> {
        if (!this.auth.cookie) {
            this.errorHandling("No Cookie");
            return false;
        }
        if (!this.ws) return false;
        if (!this._entered) await this.waitForEnter();
        const packet = `${ChatDelimiter.SEPARATOR.repeat(1)}${message}${ChatDelimiter.SEPARATOR.repeat(1)}0${ChatDelimiter.SEPARATOR.repeat(1)}`
        this.ws.send(`${ChatDelimiter.STARTER}${ChatType.CHAT}${this.getPayloadLength(packet)}00${packet}`);
        return true;
    }

    public on<T extends keyof Events>(event: T, handler: (data: Events[T]) => void) {
        const e = event as string
        this.handlers[e] = this.handlers[e] || []
        this.handlers[e].push(handler)
    }

    public emit(event: string, data: any) {
        if (this.handlers[event]) {
            for (const handler of this.handlers[event]) {
                handler(data)
            }
        }
    }

    private async handleMessage(data: MessageEvent) {
        const receivedTime = new Date().toISOString();
        const packet = data.data.toString()
        this.emit('raw', Buffer.from(packet))

        const messageType = this.parseMessageType(packet)

        switch (messageType) {
            case ChatType.CONNECT:
                this._connected = true
                const connect = this.parseConnect(packet)
                this.emit('connect', {...connect, streamerId: this.options.streamerId, receivedTime: receivedTime})
                const JOIN_PACKET = this.getJoinPacket();
                this.ws.send(JOIN_PACKET);
                break

            case ChatType.ENTERCHATROOM:
                const enterChatRoom = this.parseEnterChatRoom(packet);
                this.emit('enterChatRoom', {...enterChatRoom, receivedTime: receivedTime})
                if(this.auth.cookie) {
                    const ENTER_INFO_PACKET = this.getEnterInfoPacket(enterChatRoom.synAck);
                    this.ws.send(ENTER_INFO_PACKET);
                }
                this._entered = true
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
                this.emit('subscribe', {...subscribe, receivedTime: receivedTime})
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

    private parseConnect(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, username, syn] = parts
        return {username: username, syn: syn}
    }

    private parseEnterChatRoom(packet: string) {
        const parts = packet.split(ChatDelimiter.SEPARATOR);
        const [, , streamerId, , , , , synAck] = parts
        return {streamerId: streamerId, synAck: synAck}
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
            throw this.errorHandling("Invalid data: does not start with STARTER byte");
        }
        if (packet.length >= 5) {
            return packet.substring(2, 6);
        }
        throw this.errorHandling("Invalid data: does not have any data for opcode");
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
        const packet = this.getPacket(ChatType.PING, ChatDelimiter.SEPARATOR);
        this.ws.send(packet);
    }

    private makeChatUrl(detail: LiveDetail): string {
        return `wss://${detail.CHANNEL.CHDOMAIN.toLowerCase()}:${Number(detail.CHANNEL.CHPT) + 1}/Websocket/${this.options.streamerId}`
    }

    private getByteSize(input: string): number {
        return Buffer.byteLength(input, 'utf-8');
    }

    private getPayloadLength(packet: string): string {
        return this.getByteSize(packet).toString().padStart(6, '0');
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

    private getConnectPacket(): string {
        let payload = `${ChatDelimiter.SEPARATOR.repeat(3)}16${ChatDelimiter.SEPARATOR}`;
        if(this.auth.cookie) {
            payload = `${ChatDelimiter.SEPARATOR.repeat(1)}${this.auth.cookie}${ChatDelimiter.SEPARATOR.repeat(2)}16${ChatDelimiter.SEPARATOR}`
        }
        return this.getPacket(ChatType.CONNECT, payload);
    }

    private getJoinPacket(): string {
        let payload = `${ChatDelimiter.SEPARATOR}${this.liveDetail.CHANNEL.CHATNO}`;
        payload += `${ChatDelimiter.SEPARATOR}`; // `${ChatDelimiter.SEPARATOR}${this.liveDetail.CHANNEL.FTK}`;
        payload += `${ChatDelimiter.SEPARATOR}0${ChatDelimiter.SEPARATOR}`
        const log = {
            // set_bps: this.liveDetail.CHANNEL.BPS,
            // view_bps: this.liveDetail.CHANNEL.VIEWPRESET[0].bps,
            // quality: 'normal',
            uuid: this.auth.uuid,
            geo_cc: this.liveDetail.CHANNEL.geo_cc,
            geo_rc: this.liveDetail.CHANNEL.geo_rc,
            acpt_lang: this.liveDetail.CHANNEL.acpt_lang,
            svc_lang: this.liveDetail.CHANNEL.svc_lang,
            // subscribe: 0,
            // lowlatency: 0,
            // mode: "landing"
        }
        const query = this.objectToQueryString(log)
        payload += `log${ChatDelimiter.ELEMENT_START}${query}${ChatDelimiter.ELEMENT_END}`
        // payload += `pwd${ChatDelimiter.ELEMENT_START}${ChatDelimiter.ELEMENT_END}`
        // payload += `auth_info${ChatDelimiter.ELEMENT_START}NULL${ChatDelimiter.ELEMENT_END}`
        // payload += `pver${ChatDelimiter.ELEMENT_START}2${ChatDelimiter.ELEMENT_END}`
        // payload += `access_system${ChatDelimiter.ELEMENT_START}html5${ChatDelimiter.ELEMENT_END}`
        payload += `${ChatDelimiter.SEPARATOR}`
        return this.getPacket(ChatType.ENTERCHATROOM, payload);
    }

    private getEnterInfoPacket(synAck: string): string {
        const payload = `${ChatDelimiter.SEPARATOR}${synAck}${ChatDelimiter.SEPARATOR}0${ChatDelimiter.SEPARATOR}`
        return this.getPacket(ChatType.ENTER_INFO, payload);
    }

    private getPacket(chatType: ChatType, payload: string): string {
        const packetHeader = `${ChatDelimiter.STARTER}${chatType}${this.getPayloadLength(payload)}00`;
        return packetHeader + payload;
    }

    private waitForEnter(): Promise<void> {
        return new Promise((resolve) => {
            if (this._entered) {
                resolve();
                return;
            }
            const checkInterval = setInterval(() => {
                if (this._entered) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 500);
        });
    }

    private errorHandling(message: string): Error {
        const error = new Error(message);
        console.error(error);
        return error;
    }

    private objectToQueryString(obj: Record<string, any>): string {
        return Object.entries(obj)
            .map(([key, value]) => `${ChatDelimiter.SPACE}&${ChatDelimiter.SPACE}${key}${ChatDelimiter.SPACE}=${ChatDelimiter.SPACE}${value}`)
            .join("");
    }
}
