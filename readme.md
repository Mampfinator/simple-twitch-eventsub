# A Mistake But Twitch EventSub

## Usage

importing, configuring & starting the client:
```js
const {EventSubClient} = require("simple-twitch-eventsub");

const client = new EventSubClient({
    clientId: "yourIdGoesHere",
    clientSecret: "yourSecretGoesHere",
    host: "your-domain.edu", 
    webhookSecret: "soopersicritsicrit"
});

(async () => {
    await client.start();
    console.log("Client started successfully!");
})();
```


subscribing & listening to events:
```js
const express = require("express");
const app = express();

const client = new EventSubClient({
    // all the shenanigans from above...
    server: app, 
    path: "/twitch-eventsub"
});

const eventName = "stream.online";
const condition = {broadcaster_user_id: "700463105"} // Hylo's Twitch ID

client.on(eventName, ({subscription, event}) => {
    if (event.broadcaster_user_id === "700463105") console.log(`Hylo is now live on https://twitch.tv/${event.broadcaster_user_login}!`);
    console.log("Subscription details: ", subscription);
});

await client.subscribe("stream.online", condition);
```

manually setting up a listener:
```js
const app = express();

// method has to be POST as per Twitch's spec
app.post("/some-random-path/morepath/i-heard-you-like-complex-paths", client.listener());
```
Client#listener returns a function `(req, res, next) => void` that does all the logic & event relaying for the rest of the client.