const baseUrl = "https://api.twitch.tv/helix/";
const eventSubBaseUrl = baseUrl + "eventsub/";

export const urls = {
    oauth2: "https://id.twitch.tv/oauth2/authorize",
    subscriptions: eventSubBaseUrl + "subscriptions"
}