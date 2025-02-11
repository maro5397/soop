import {SoopClient} from "../client"
import {DEFAULT_BASE_URLS} from "../const"

export interface Cookie {
    AbroadChk: string,
    AbroadVod: string,
    AuthTicket: string,
    BbsTicket: string,
    RDB: string,
    UserTicket: string,
    _au: string,
    _au3rd: string,
    _ausa: string,
    _ausb: string,
    isBbs: Number
}


export class SoopAuth {
    private client: SoopClient

    constructor(client: SoopClient) {
        this.client = client
    }

    async signIn(
        userId: string,
        password: string,
        baseUrl: string = DEFAULT_BASE_URLS.soopAuthBaseUrl
    ): Promise<Cookie> {
        const formData = new FormData()
        formData.append("szWork", "login")
        formData.append("szType", "json")
        formData.append("szUid", userId)
        formData.append("szPassword", password)

        const response = await this.client.fetch(`${baseUrl}/app/LoginAction.php`, {
            method: "POST",
            body: formData
        })

        const setCookieHeader = response.headers.get("set-cookie")
        if (!setCookieHeader) {
            throw new Error("No set-cookie header found in response")
        }

        const getCookieValue = (name: string): string => {
            const regex = new RegExp(`${name}=([^;]+)`)
            const match = setCookieHeader.match(regex)
            if (!match) {
                throw new Error(`Cookie "${name}" not found in set-cookie header`)
            }
            return match[1]
        }

        const cookie: Cookie = {
            AbroadChk: getCookieValue("AbroadChk"),
            AbroadVod: getCookieValue("AbroadVod"),
            AuthTicket: getCookieValue("AuthTicket"),
            BbsTicket: getCookieValue("BbsTicket"),
            RDB: getCookieValue("RDB"),
            UserTicket: getCookieValue("UserTicket"),
            _au: getCookieValue("_au"),
            _au3rd: getCookieValue("_au3rd"),
            _ausa: getCookieValue("_ausa"),
            _ausb: getCookieValue("_ausb"),
            isBbs: Number(getCookieValue("isBbs"))
        }

        return cookie
    }
}