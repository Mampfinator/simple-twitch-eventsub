import { EventSubClientBase } from "./EventSubClientBase";
import type {Express, NextFunction, Request, Response} from "express";
import { AccessTokenManager } from "./AccessTokenManager";
import { TwitchAPIRequestBuilder } from "../util/TwitchAPIRequestBuilder";
import { urls } from "../util/constants";
import { Condition } from "../../types/conditions/ConditionType";


export interface EventSubClientOptions {
    /**
     * If clientId is not provided, will try finding it under process.env.TWITCH_API_CLIENT_ID.
     */
    clientId?: string;
    /**
     * If clientSecret is not provided, will try finding it under process.env.TWITCH_API_CLIENT_SECRET.
     */
    clientSecret?: string;
    host: string;
    port?: number;
    /**
     * Webhook secret to send to Twitch for message verification. 
     * If no secret is provided, will try finding it under process.env.TWITCH_WEBHOOK_SECRET. 
     * If none is found, will generate a random one at startup. 
     * **Only fall back on this behavior for testing.**
     */
    webhookSecret?: string;
    /**
     * express app to automatically set up server at provided path.
     */
    server?: Express,
    /**
     * If not provided, will default to "/".
     */
    path?: string;
}

export type TwitchEventSubEvent = "stream.online" | "stream.offline";

/**
 * Central EventEmitter & logic unit for everything Twitch API related.
 * @example
 * ```js
 * const client = new EventSubClient({
 *      clientId: "YourIdGoesHere",
 *      clientSecret: "YourSecretGoesHere",
 *      host: "your-domain.edu",
 *      webhookSecret: "soopers3cür3sicrit"
 * });
 * ```
 */
export class EventSubClient extends EventSubClientBase {
    public readonly tokenManager: AccessTokenManager;
    public accessToken?: string;
    private _subscriptionQueue: Set<Record<string, any>>;
    public webhookSecret?: string;
    private readonly address: string;

    constructor(options: EventSubClientOptions) {
        let {
            clientId, 
            clientSecret, 
            webhookSecret, 
            host, 
            port,
            path,
            server
        } = options;
        clientId = clientId ?? process.env.TWITCH_API_CLIENT_ID
        clientSecret = clientSecret ?? process.env.TWITCH_API_CLIENT_SECRET;
        super(clientId!, clientSecret!);
        
        if (!host) throw new TypeError(`Must provide a host for Twitch to send events & verifications to!`);
        this.address = `https://${host}${port ? port : ""}/${path ? path : ""}`;

        this.tokenManager = new AccessTokenManager(clientId!, clientSecret!);
        this.tokenManager.on("refresh", (token: string) => this.accessToken = token);
        
        if (webhookSecret) this.webhookSecret = webhookSecret;

        this._subscriptionQueue = new Set();

        if (server) server.post(path ?? "/", this.listener());
    }

    /**
     * @returns a listener function for use with express.
     */
    listener(): (req: Request, res: Response, next?: NextFunction) => void {
        return (req, res, next?) => {
            const rawBody: string = typeof req.body === "string" ? req.body: JSON.stringify(req.body, null, 4);
            const messageId = req.header("Twitch-Eventsub-Message-Id");
            const timestamp = req.header("Twitch-Eventsub-Message-Timestamp");
            const twitchSignature = req.header("Twitch-Eventsub-Message-Signature");

            const {isValid, status} = this._verify(rawBody, messageId, timestamp, twitchSignature);
            res.writeHead(status);

            if (!isValid) return res.end();
            // from here on out, we can be pretty sure that whatever is sent to us is from Twitch


            const message = typeof req.body === "object" ? req.body : JSON.parse(req.body);
            const mode = req.header("Twitch-Eventsub-Message-Type");

            switch(mode) {
                case "notification":
                    this._handleNotification(message);
                    break;
                case "webhook_callback_verification":
                    const {challenge} = message;
                    this.emit("challenge", message);
                    return res.send(challenge);
                case "revocation": 
                    this.emit("revocation", message);
                    break;
                default:
                    this.emit("error", new Error("Could not determine Eventsub-Message-Type in EventSubClient#listener!"), req, res);
                    return res.writeHead(500, "Internal server error.").end();
            }

            
            if (!res.headersSent) res.end();
            if (next) next();
        }
    }

    /**
     * Subscribe to an event type
     */
    subscribe(event: TwitchEventSubEvent, condition: Condition): Promise<any>
    async subscribe(event: TwitchEventSubEvent, condition: Condition ): Promise<any> {
        const fullEvent = this._buildSubscription(event, condition, {callback: this.address, method: "webhook", secret: this.webhookSecret!});
        if (!this.accessToken) this._subscriptionQueue.add(fullEvent);
        // send to Twitch servers
        return await this._subscribe(fullEvent);
    }

    /**
     * @private
     */
    async _subscribe(payload: Record<string, any>) {
        return await new TwitchAPIRequestBuilder()
            .setMethod("POST")
            .setUrl(urls.subscriptions)
            .setToken(this.accessToken!)
            .setClientId(this.clientId)
            .addHeader("Content-Type", "application/json")
            .setBody(payload)
            .send()
    }

    async getSubscriptions(filter?: string) {
        if (!this.accessToken) throw new Error("Please start the client first!");
        const builder = new TwitchAPIRequestBuilder()
            .setMethod("GET")
            .setUrl(urls.subscriptions)
            .setToken(this.accessToken)
            .setClientId(this.clientId);
        
        if (filter) builder.addParam("status", filter);
        return await builder.send();
    }

    async deleteSubscription(id: string) {
        if (!this.accessToken) throw new Error("Please start the client first!");
        if (!id) throw new TypeError(`Expected id to be defined, received: ${id}.`);
        return await new TwitchAPIRequestBuilder()
            .setMethod("DELETE")
            .setUrl(urls.subscriptions)
            .setToken(this.accessToken)
            .setClientId(this.clientId)
            .send()

    }

    async start() {
        await this._start(); // Careful: sets a random webhook secret for testing if none is given!
        await this.tokenManager._start();

        const subscriptions: Promise<any>[] = [];
        for (const subscription of this._subscriptionQueue) subscriptions.push(this._subscribe(subscription))
        
        await Promise.all(subscriptions) 
    }
}