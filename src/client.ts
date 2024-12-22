import {SoopLive} from "./api"
import {SoopChatFunc, SoopClientOptions} from "./types"
import {DEFAULT_BASE_URLS, DEFAULT_USER_AGENT} from "./const"
import { SoopChatOptions } from "./chat/types"
import { SoopChat } from "./chat"
import {SoopChannel} from "./api/channel"

export class SoopClient {
    readonly options: SoopClientOptions
    live = new SoopLive(this)
    channel = new SoopChannel(this)

    constructor(options: SoopClientOptions = {}) {
        options.baseUrls = options.baseUrls || DEFAULT_BASE_URLS
        options.userAgent = options.userAgent || DEFAULT_USER_AGENT

        this.options = options
    }

    get chat(): SoopChatFunc {
        return (options: SoopChatOptions) => {
            return new SoopChat({
                client: this,
                baseUrls: this.options.baseUrls,
                ...options
            })
        }
    }

    fetch(url: string, options?: RequestInit): Promise<Response> {
        const headers = {
            "User-Agent": this.options.userAgent,
            ...(options?.headers || {})
        }

        return fetch(url, {
            headers: headers,
            ...options
        })
    }
}
