import { BroadcasterUserIdCondition } from "./conditions/broadcaster_user_id";
import { EventSubSubscription } from "./EventSubSubscription";
import { StreamOfflinePayload } from "./payloads/stream.offline";
import { StreamOnlinePayload } from "./payloads/stream.online";

export interface EventSubNotification<Subscription, EventPayload> {
    subscription: Subscription;
    event: EventPayload;
}

export interface StreamOnlineNotification 
    extends EventSubNotification<
        EventSubSubscription<BroadcasterUserIdCondition>, 
        StreamOnlinePayload
    > {}

export interface StreamOfflineNotification
    extends EventSubNotification<
        EventSubSubscription<BroadcasterUserIdCondition>, 
        StreamOfflinePayload
    > {}