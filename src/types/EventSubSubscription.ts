import { EventSubType } from "./EventSubNotificationTypes";
import { EventSubTransport } from "./EventSubTransport";

export interface EventSubSubscription<ConditionType = Record<string, string>> {
    id: string;
    type: EventSubType;
    version: "1";
    status: "enabled" | "disabled";
    cost: number;
    condition: ConditionType;
    transport: EventSubTransport;
    created_at: string;
}