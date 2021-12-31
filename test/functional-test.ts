import { EventSubClient } from "../src";
import express from "express";

const client = new EventSubClient({
    host: "test", 
    server: express()
});

