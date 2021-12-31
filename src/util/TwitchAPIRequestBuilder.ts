import axios from "axios";

export class TwitchAPIRequestBuilder {
    private method?: "POST" | "GET" | "DELETE";
    private readonly headers: Record<string, string> = {}
    private readonly parameters: Record<string, string> = {};
    private url?: string;
    private body?: any;

    setMethod(method: "POST" | "GET" | "DELETE") {
        this.method = method;
        return this;
    }
    addHeader(name: string, value: string, nameToLowerCase = true) {
        this.headers[nameToLowerCase ? name.toLowerCase() : name] = value;
        return this;
    }

    addParam(key: string, value: string, keyToLowerCase = false) {
        this.parameters[!keyToLowerCase ? key : key.toLowerCase()] = value;
        return this;
    }

    setToken(token: string) {
        this.addHeader("Authorization", `Bearer ${token}`);
        return this;
    }

    setClientId(id: string) {
        this.addHeader("Client-Id", id);
        return this;
    }

    setUrl(url: string) {
        this.url = url;
        return this;
    }

    setBody(body: any) {
        this.body = body;
        return this;
    }

    async send(): Promise<any> {
        if (!this.url) throw new TypeError(`Target URL needs to be set before sending a request!`);

        return await axios({
            method: this.method ?? "GET",
            params: this.parameters,
            headers: this.headers,
            url: this.url,
            data: this.body
        });
    }
}