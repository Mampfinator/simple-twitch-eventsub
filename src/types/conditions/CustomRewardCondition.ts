import { BroadcasterUserIdCondition } from "./broadcaster_user_id";

export interface CustomRewardCondition extends BroadcasterUserIdCondition {
    reward_id: string;
}