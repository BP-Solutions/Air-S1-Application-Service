import mqtt from "mqtt";
import config from './config/device-conf.json' assert {type: 'json'};
import {publishMessage} from "./mqtt/publishMessage.js";
import {SerialPort} from "serialport";
import {ReadlineParser} from "@serialport/parser-readline";

import protobuf from "protobufjs";
import {getNetwork} from "./utils/systemUtils.js";


export let globalConfig = config;
export let client = mqtt.connect(config.server);

let mqttError = false;



// await changeHostname(config.id);


//todo very important math operation here, make sure to have those saved
const createMessageObject = async (data) => {
    const networkInfo = await getNetwork();
    return {
        deviceID: config.id,
        health: 'ok',
        readings: {
            co2: data.co2,
            pm1p0: (data.pm1p0 / 10).toFixed(2),
            pm2p5: (data.pm2p5 / 10).toFixed(2),
            pm4p0: (data.pm2p5 / 10).toFixed(2),
            pm10p0: ( data.pm10p0 / 10).toFixed(2),
            voc: data.voc,
            temperature: (data.temperature * 9/5) + 32,
            humidity: data.humidity,
        },
        deviceTelemetry: {
            network: networkInfo,
        },
        timestamp: new Date().toISOString()
    };
};

async function sendMsg(data) {
    const messageObject = await createMessageObject(data);
    try {
        await publishMessage(messageObject);
        mqttError = false;
    } catch (error) {
        mqttError = true;
    }
}

client.on('connect', () => {
    console.log('Connected to MQTT broker');
});

// Handle error event
client.on('error', (err) => {
    console.error('Connection error:', err);
    mqttError = true;
});

// serial
const port = new SerialPort({
    path: '/COM6',
    baudRate: 115200
});

const parser = port.pipe(new ReadlineParser({delimiter: '\r\n'}));

function decodeSerial(data){
    protobuf.load("protobufs/schema/RPDeviceReading.proto", async function (err, root) {
        if (err) throw err;

        const AwesomeMessage = root.lookupType("RPDeviceReading");

        const result = data.split("M:")[1];

        const buffer = Buffer.from(result, 'hex');
        const message = AwesomeMessage.decode(buffer);
        const object = AwesomeMessage.toObject(message, {
            longs: String,
            enums: String,
            bytes: String,
        });

        console.log("Decoded object:", object);
        await sendMsg(object);
    });
}

async function encodeSerial(payload){
   return new Promise((resolve, reject) => {
        protobuf.load("protobufs/schema/SBCDeviceTelemetry.proto", function (err, root) {
            if (err) {
                reject(err);
                return;
            }

            const AwesomeMessage = root.lookupType("SBCDeviceTelemetry");

            const errMsg = AwesomeMessage.verify(payload);
            if (errMsg) {
                reject(new Error(errMsg));
                return;
            }

            let message = AwesomeMessage.create(payload);
            const buffer = AwesomeMessage.encode(message).finish();
            resolve(buffer.toString('hex'));
        });
    });
}


async function callData() {
    let payload = {statCode: 4, inErrorState: false, sampleSensors: true};


    let hexString = await encodeSerial(payload);


    let message = `\nR:${hexString}\n`;
    port.write(message, (err) => {
        if (err) {
            return console.error('Error on write:', err.message);
        }
        console.log("Message written: ", hexString);
    });
}

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
