import mqtt from "mqtt";
import config from './config/device-conf.json' assert {type: 'json'};
import {SerialPort} from "serialport";
import {ReadlineParser} from "@serialport/parser-readline";
import {decodeSerial} from "./protobufs/proto.js";
import {callData} from "./serializers/serialize.js";

export let globalConfig = config;
export let client = mqtt.connect(config.server);

export let mqttError = false;


// await changeHostname(config.id);

// mqtt
client.on('connect', () => {
    console.log('Connected to MQTT broker');
});
client.on('error', (err) => {
    console.error('Connection error:', err);
    mqttError = true;
});

// serial
export const port = new SerialPort({
    path: '/COM6',
    baudRate: 115200
});

const parser = port.pipe(new ReadlineParser({delimiter: '\r\n'}));

port.on('open', () => {
    console.log('Serial Port Opened');
    setInterval(callData, 5000);
});

parser.on('data', (data) => {
    console.log(data)
    decodeSerial(data);
});

port.on('error', (err) => {
    console.error('Serial Error:', err.message);
});