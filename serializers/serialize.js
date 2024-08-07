import {globalConfig, port} from "../main.js";
import os from 'os';
import prettyMs from 'pretty-ms';
import {getNetwork} from "../utils/systemUtils.js";
import {publishMessage} from "../mqtt/mqttMain.js";
import {encodeSerial} from "../protobufs/proto.js";

//todo very important scaled operation here, make sure to have those present
const createMessageObject = async (data) => {

    const uptime = os.uptime() * 1000;
    const networkInfo = await getNetwork();
    return {
        deviceID: globalConfig.id,
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
            uptime: prettyMs(uptime),
            network: networkInfo,
        },
        timestamp: new Date().toISOString()
    };
};

export async function sendMsg(data) {
    const messageObject = await createMessageObject(data);
    try {
        await publishMessage(messageObject);
    } catch (error) {
        console.log(error);
    }
}

export async function callData() {
    let payload = {statCode: 5, inErrorState: false, sampleSensors: true, configSXX: false, abcPer: 180, SXXCalType: 0};

    let hexString = await encodeSerial(payload);

    let message = `\nR:${hexString}\n`;
    port.write(message, (err) => {
        if (err) {
            return console.error('Error on write:', err.message);
        }
    });
}