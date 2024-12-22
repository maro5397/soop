import {SoopClient} from "../client"
import {DEFAULT_BASE_URLS} from "../const"

interface StationInfo {
    profile_image: string;
    station: Station;
    broad: Broad;
    starballoon_top: StarBalloonTop[];
    sticker_top: StickerTop[];
    subscription: Subscription;
    is_best_bj: boolean;
    is_partner_bj: boolean;
    is_ppv_bj: boolean;
    is_af_supporters_bj: boolean;
    is_shopfreeca_bj: boolean;
    is_favorite: boolean;
    is_subscription: boolean;
    is_owner: boolean;
    is_manager: boolean;
    is_notice: boolean;
    is_adsence: boolean;
    is_mobile_push: boolean;
    subscribe_visible: string;
    country: string;
    current_timestamp: string;
}

interface Station {
    display: Display;
    groups: Group[];
    menus: Menu[];
    upd: Upd;
    vods: Vod[];
    broad_start: string;
    grade: number;
    jointime: string;
    station_name: string;
    station_no: number;
    station_title: string;
    total_broad_time: number;
    user_id: string;
    user_nick: string;
    active_no: number;
}

interface Display {
    main_type: string;
    title_type: string;
    title_text: string;
    profile_text: string;
    skin_type: number;
    skin_no: number;
    title_skin_image: string;
}

interface Group {
    idx: number;
    group_no: number;
    priority: number;
    info: {
        group_name: string;
        group_class_name: string;
        group_background_color: string;
    };
}

interface Menu {
    bbs_no: number;
    station_no: number;
    auth_no: number;
    w_auth_no: number;
    display_type: number;
    rnum: number;
    line: number;
    indention: number;
    name: string;
    name_font: number;
    main_view_yn: number;
    view_type: number;
}

interface Upd {
    station_no: number;
    user_id: string;
    asp_code: number;
    fan_cnt: number;
    today0_visit_cnt: number;
    today1_visit_cnt: number;
    total_visit_cnt: number;
    today0_ok_cnt: number;
    today1_ok_cnt: number;
    today0_fav_cnt: number;
    today1_fav_cnt: number;
    total_ok_cnt: number;
    total_view_cnt: number;
}

interface Vod {
    bbs_no: number;
    station_no: number;
    auth_no: number;
    w_auth_no: number;
    display_type: number;
    rnum: number;
    line: number;
    indention: number;
    name: string;
    name_font: number;
    main_view_yn: number;
    view_type: number;
}

interface Broad {
    user_id: string;
    broad_no: number;
    broad_title: string;
    current_sum_viewer: number;
    broad_grade: number;
    is_password: boolean;
}

interface StarBalloonTop {
    user_id: string;
    user_nick: string;
    profile_image: string;
}

interface StickerTop {
    user_id: string;
    user_nick: string;
    profile_image: string;
}

interface Subscription {
    total: number;
    tier1: number;
    tier2: number;
}

export class SoopChannel {
    private client: SoopClient

    constructor(client: SoopClient) {
        this.client = client
    }

    async station(streamerId: string, baseUrl: string = DEFAULT_BASE_URLS.soopChannelBaseUrl): Promise<StationInfo> {
        return this.client.fetch(`${baseUrl}/api/${streamerId}/station`, {
            method: "GET",
        })
            .then(response => response.json())
            .then(data => {
                return {
                    profile_image: data["profile_image"],
                    station: data["station"],
                    broad: data["broad"],
                    starballoon_top: data["starballoon_top"],
                    sticker_top: data["sticker_top"],
                    subscription: data["subscription"],
                    is_best_bj: data["is_best_bj"],
                    is_partner_bj: data["is_partner_bj"],
                    is_ppv_bj: data["is_ppv_bj"],
                    is_af_supporters_bj: data["is_af_supporters_bj"],
                    is_shopfreeca_bj: data["is_shopfreeca_bj"],
                    is_favorite: data["is_favorite"],
                    is_subscription: data["is_subscription"],
                    is_owner: data["is_owner"],
                    is_manager: data["is_manager"],
                    is_notice: data["is_notice"],
                    is_adsence: data["is_adsence"],
                    is_mobile_push: data["is_mobile_push"],
                    subscribe_visible: data["subscribe_visible"],
                    country: data["country"],
                    current_timestamp: data["current_timestamp"]
                };
            })
    }
}