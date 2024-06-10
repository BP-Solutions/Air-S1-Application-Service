import mqtt from "mqtt";
import config from './config/device-conf.json' assert {type: 'json'};
import {publishMessage} from "./mqtt/publishMessage.js";
import {SerialPort} from "serialport";
import {ReadlineParser} from "@serialport/parser-readline";
import network from "network";

export let globalConfig = config;
export let client = mqtt.connect(config.server);

let mqttError = false;

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
    try {
        await publishMessage(messageObject);
        mqttError = false;
    } catch (error) {
        mqttError = true;
    }
}

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    setInterval(sendMsg, 3000);
});

// Handle error event
client.on('error', (err) => {
    console.error('Connection error:', err);
    mqttError = true;
});

// serial
const port = new SerialPort({
    path: '/dev/ttyS1',
    baudRate: 115200
});

const parser = port.pipe(new ReadlineParser({delimiter: '\r\n'}));

async function sendStatus() {
    // Function to check Ethernet connection status
    let ethconnected = false;

    network.get_active_interface((err, activeInterface) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            return;
        }

        if (activeInterface && activeInterface.type === 'Wired') {
            ethconnected = true;
        } else {
            ethconnected = false;
        }
    });

    let statString = `{"ethernet":${ethconnected}, "mqttError":${mqttError}};\n`;

    port.write(statString, (err) => {
        if (err) {
            return console.error('Error on write:', err.message);
        }
        console.log('Message written');
    });
}

port.on('open', () => {
    console.log('Serial Port Opened');
    setInterval(sendStatus, 3000);
});

parser.on('data', (data) => {
    console.log('Received data:', data);
});

port.on('error', (err) => {
    console.error('Serial Error:', err.message);
});
