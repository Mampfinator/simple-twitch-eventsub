export interface EventSubTransport {
    method: "webhook"; 
    callback: string;
    secret: string;
}