import {EventEmitter} from "events";
import {createHmac, timingSafeEqual, randomBytes} from "crypto";
import { EventSubNotification, StreamOfflineNotification, StreamOnlineNotification } from "../../types/EventSubNotification";
import { EventSubSubscription } from "../../types/EventSubSubscription";
import { EventSubType } from "../../types/EventSubNotificationTypes";
import { Condition } from "../../types/conditions/ConditionType";
import { EventSubTransport } from "../../types/EventSubTransport";
import { TwitchEventSubEvent } from "./EventSubClient";

export class EventSubClientBase extends EventEmitter {
    protected _events: Set<string> = new Set();
    public webhookSecret?: string;

    constructor(protected clientId: string, protected clientSecret: string, webhookSecret?: string) {
        super();

        if (!clientId) throw new TypeError(`No client ID provided! Either include it in the constructur options, or load it into the environment as process.env.TWITCH_API_CLIENT_ID`);
        if (!clientSecret) throw new TypeError(`No client secret provided! Either include it in the constructor options, or load it into the environment as process.env.TWITCH_API_CLIENT_SECRET`);
        
        this.webhookSecret = webhookSecret; 
    }
    
    on(event: "stream.online", listener: (event: StreamOnlineNotification) => void): this
    on(event: "stream.offline", listener: (event: StreamOfflineNotification) => void): this
    on(event: "error", listener: (error: Error) => void): this
    on(event: "challenge", listener: (messageBody: Record<string, any>) => void): this
    on(event: "revocation", listener: (messageBody: Record<string, any>) => void): this
    on(event: EventSubType | "error" | "challenge" | "revocation", listener: (...args: any[]) => void): this {
        Reflect.apply(super.on, this, [event, listener]);
        return this;
    }

    async _start() {
        // if no webhook secret is given, generate a random one.
        // **Only to be used in development. Do not use in production.**
        if (!this.webhookSecret) {
            this.webhookSecret = await new Promise((res, rej) => randomBytes(256, (err, buf) => {
                if (err) rej(err);
                res(buf.toString("base64"));
            }));
            if (process.env.NODE_ENV !== "development") console.warn("NO WEBHOOK SECRET DETECTED! If this is expected behaviour, please change your NODE_ENV to \"development\".");
        }
    }


    // TODO: implement
    _buildSubscription(event: TwitchEventSubEvent, condition: Condition, transport: EventSubTransport) {
        return {
            type: event,
            version: "1",
            condition,
            transport
        }
    }

    _handleNotification(notificationBody: EventSubNotification<EventSubSubscription<any>, any>) {
        const {type} = notificationBody.subscription;
        if (!type || typeof type !== "string") throw new TypeError(`EventSubClientBase#_handleNotification: expected type to be a string, received ${type} (${typeof type})`); 

        // potential future code to make notifications look a little less like straight from the API.
        this.emit(type, notificationBody.event, notificationBody.subscription);
    }
    
    _verify(messageBody: string, messageId?: string, timestamp?: string, signature?: string): {status: number, isValid: boolean} {
        if (!messageId || !timestamp || !signature) return {status: 400, isValid: false};
        const tenMinutes = 1000 * 60 * 10;

        // check if an event has been seen before
        if (this._events.has(messageId)) return {status: 204, isValid: false};
        // if not, 
        this._events.add(messageId);
        setTimeout(() => this._events.delete(messageId), tenMinutes);

        const timestampDate = new Date(timestamp);
        if (isNaN(timestampDate.valueOf()) || (new Date().valueOf() - timestampDate.valueOf()) > tenMinutes) return {status: 400, isValid: true};

        const [algorithm, expected] = signature.split("=");
        const isValid = timingSafeEqual(
            Buffer.from(expected),
            Buffer.from(createHmac(
                algorithm,
                this.webhookSecret!
            ).update(messageId + timestamp + messageBody).digest("hex"))
        );
        return {status: isValid ? 200 : 400, isValid};
    }
}