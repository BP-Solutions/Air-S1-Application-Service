import {client, globalConfig} from "../main.js";

export async function publishMessage(msg) {
    const msgPayload = JSON.stringify(msg);

    const topic = `${globalConfig.topic}`;

    client.publish(topic, msgPayload, {qos: 1, retain: true, dup: true},(err) => {
        if (err) {
            console.error('Failed to publish message:', err);
            throw err;
        }
    });
}