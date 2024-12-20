import {SoopLive} from "./api"
import {SoopChatFunc, SoopClientOptions, SoopLiveStatusFunc} from "./types"
import {DEFAULT_BASE_URLS, DEFAULT_USER_AGENT} from "./const"
import { SoopChatOptions } from "./chat/types"
import { SoopChat } from "./chat"
import {SoopLiveStatus, SoopLiveStatusOptions} from "./live-status"

export class SoopClient {
    readonly options: SoopClientOptions
    live = new SoopLive(this)

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

    get liveStatus(): SoopLiveStatusFunc {
        return (options: SoopLiveStatusOptions) => {
            return new SoopLiveStatus({
                client: this,
                baseUrls: this.options.baseUrls,
                ...options
            })
        }
    }

    fetch(pathOrUrl: string, options?: RequestInit): Promise<Response> {
        const headers = {
            "User-Agent": this.options.userAgent,
            ...(options?.headers || {})
        }

        if ((pathOrUrl.startsWith("/") || pathOrUrl.startsWith("?"))
             && !pathOrUrl.startsWith(this.options.baseUrls.soopPlayerBaseUrl)) {
            pathOrUrl = `${this.options.baseUrls.soopPlayerBaseUrl}${pathOrUrl}`
        }

        return fetch(pathOrUrl, {
            headers: headers,
            ...options
        })
    }
}
