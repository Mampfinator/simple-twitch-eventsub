import axios from "axios";
import EventEmitter from "events";
import { TwitchAPIRequestBuilder } from "../util/TwitchAPIRequestBuilder";
import { urls } from "../util/constants";
import { NextFunction, Request, Response } from "express";

export class AccessTokenManager extends EventEmitter {
    private _refreshToken?: string;
    public accessToken?: string;

    private _interval?: ReturnType<typeof setInterval>;

    constructor(
        private readonly clientId: string,
        private readonly clientSecret: string
    ) {
        super();
    }

    private _refresh(): {callback: () => Promise<void>, refreshIn: number} {
        return {
            callback: async () => {
                const {access_token, refresh_token} = await (
                    new TwitchAPIRequestBuilder()
                        .setUrl(urls.oauth2)
                        .setMethod("POST")
                        .addParam("client_id", this.clientId)
                        .addParam("client_secret", this.clientSecret)
                        .addParam("grant_type", "client_credentials")
                        .send()
                )

                this.accessToken = access_token;
                this._refreshToken = refresh_token;

                this.emit("refresh", access_token);
            },
            refreshIn: 1000 * 60 * 60 * 24 * 14 // 14 days; not *entirely* sure how long exactly access tokens last. But surely longer than that.
        }
    }

    /**
     * @private
     */
    async _start() {
        const {refreshIn, callback} = this._refresh();
        this._interval = setInterval(callback, refreshIn);
        
        // set initial access token
        await callback();
    }

    private _handleSubscription() {

    }

    private _verify(req: Request, res: Response, next?: NextFunction) {
        

        if (next) next();
    }
}