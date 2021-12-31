import { BroadcasterUserIdCondition } from "./broadcaster_user_id";
import { ChannelRaidCondition } from "./ChannelRaidCondition";
import { CustomRewardCondition } from "./CustomRewardCondition";
import { DropEntitlementGrantCondition } from "./DropEntitlementGrantCondition";
import { ExtensionClientIdCondition } from "./extension_client_id";
import { UserIdCondition } from "./user_id";

export type Condition = 
    BroadcasterUserIdCondition      |
    CustomRewardCondition           |
    UserIdCondition                 |
    ExtensionClientIdCondition      |
    ChannelRaidCondition            |
    DropEntitlementGrantCondition   
;