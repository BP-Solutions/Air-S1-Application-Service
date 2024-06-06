import mqtt from "mqtt";

import config from './config/device-conf.json' assert { type: 'json' };

export let globalConfig = config;

import {publishMessage} from "./mqtt/publishMessage.js";


export let client = mqtt.connect(config.server);

const createMessageObject = () => ({
    deviceID: config.id,
    health: 'ok',
    readings: {
        temperature: 22.5,
        humidity: 60,
        pm25: 35
    },
    timestamp: new Date().toISOString()
});

async function sendMsg() {
    const messageObject = createMessageObject();
    await publishMessage(messageObject);
}


client.on('connect', () => {
    console.log('Connected to MQTT broker');

    setInterval(sendMsg, 3000);
});

// Handle error event
client.on('error', (err) => {
    console.error('Connection error:', err);
});