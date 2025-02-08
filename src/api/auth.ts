import {SoopClient} from "../client"
import {DEFAULT_BASE_URLS} from "../const"

export interface Auth {
    uuid: string,
    cookie: string
}

export class SoopAuth {
    private client: SoopClient

    constructor(client: SoopClient) {
        this.client = client;
    }

    async signIn(
        userId: string,
        password: string,
        baseUrl: string = DEFAULT_BASE_URLS.soopAuthBaseUrl
    ): Promise<Auth> {
        const formData = new FormData();
        formData.append("szWork", "login");
        formData.append("szType", "json");
        formData.append("szUid", userId);
        formData.append("szPassword", password);

        return this.client.fetch(`${baseUrl}/app/LoginAction.php`, {
            method: "POST",
            body: formData
        })
            .then(response => {
                const setCookieHeader = response.headers.get('set-cookie');
                const authTicketMatch = setCookieHeader?.match(/AuthTicket=([^;]+)/);
                const uuid = setCookieHeader?.match(/_au=([^;]+)/);
                if (authTicketMatch && uuid) {
                    return { uuid: uuid[1], cookie: authTicketMatch[1] };
                } else {
                    return null;
                }
            })
    }
}