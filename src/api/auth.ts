import {SoopClient} from "../client"
import {DEFAULT_BASE_URLS} from "../const"

interface Auth {
    RESULT: number,
    notChangePwd: number
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
    ): Promise<string> {
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
                if (authTicketMatch) {
                    return authTicketMatch[1];
                } else {
                    return null;
                }
            })
    }
}