export interface StreamOnlinePayload {
    id: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
    type: "live" | "";
    started_at: string;
}