import {SoopClient} from "../client"

export interface LiveDetail {
    geo_cc: string
    geo_rc: string
    acpt_lang: string
    svc_lang: string
    ISSP: number
    LOWLAYTENCYBJ: number
    VIEWPRESET: ViewPreset[]
    RESULT: number
    PBNO: string
    BNO: string
    BJID: string
    BJNICK: string
    BJGRADE: number
    STNO: string
    ISFAV: string
    CATE: string
    CPNO: number
    GRADE: string
    BTYPE: string
    CHATNO: string
    BPWD: string
    TITLE: string
    BPS: string
    RESOLUTION: string
    CTIP: string
    CTPT: string
    VBT: string
    CTUSER: number
    S1440P: number
    AUTO_HASHTAGS: string[]
    CATEGORY_TAGS: string[]
    HASH_TAGS: string[]
    CHIP: string
    CHPT: string
    CHDOMAIN: string
    CDN: string
    RMD: string
    GWIP: string
    GWPT: string
    STYPE: string
    ORG: string
    MDPT: string
    BTIME: number
    DH: number
    WC: number
    PCON: number
    PCON_TIME: number
    PCON_MONTH: string[]
    PCON_OBJECT: any[]
    FTK: string
    BPCBANNER: boolean
    BPCCHATPOPBANNER: boolean
    BPCTIMEBANNER: boolean
    BPCCONNECTBANNER: boolean
    BPCLOADINGBANNER: boolean
    BPCPOSTROLL: string
    BPCPREROLL: string
    MIDROLL: Midroll
    PREROLLTAG: string
    MIDROLLTAG: string
    POSTROLLTAG: string
    BJAWARD: boolean
    BJAWARDWATERMARK: boolean
    BJAWARDYEAR: string
    GEM: boolean
    GEM_LOG: boolean
    CLEAR_MODE_CATE: string[]
    PLAYTIMINGBUFFER_DURATION: string
    STREAMER_PLAYTIMINGBUFFER_DURATION: string
    MAXBUFFER_DURATION: string
    LOWBUFFER_DURATION: string
    PLAYBACKRATEDELTA: string
    MAXOVERSEEKDURATION: string
    TIER1_NICK: string
    TIER2_NICK: string
    EXPOSE_FLAG: number
    SUB_PAY_CNT: number
}

export interface ViewPreset {
    label: string
    label_resolution: string
    name: string
    bps: number
}

export interface Midroll {
    VALUE: string
    OFFSET_START_TIME: number
    OFFSET_END_TIME: number
}

export interface LiveDetailOptions {
    type: string
    pwd: string
    player_type: string
    stream_type: string
    quality: string
    mode: string
    from_api: string
    is_revive: boolean
}

export const DEFAULT_REQUEST_BODY_FOR_LIVE_STATUS = {
    'type': 'live',
    'pwd': '',
    'player_type': 'html5',
    'stream_type': 'common',
    'quality': 'HD',
    'mode': 'landing',
    'from_api': '0',
    'is_revive': false
}

export class SoopLive {
    private client: SoopClient

    constructor(client: SoopClient) {
        this.client = client
    }

    async detail(streamerId: string, options: LiveDetailOptions = DEFAULT_REQUEST_BODY_FOR_LIVE_STATUS): Promise<LiveDetail> {
        return this.client.fetch(`?bjid=${streamerId}`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    bid: streamerId,
                    ...(options || {})
                })
            })
            .then(r => r.json())
            .then(data => {
                const result = data['result']
                if (result === 0) return null
                return data
            })
    }
}