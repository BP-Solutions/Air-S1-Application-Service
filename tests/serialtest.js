import {SerialPort} from "serialport";
import {ReadlineParser} from "@serialport/parser-readline";

import protobuf from "protobufjs";


const port = new SerialPort({
    path: '/dev/ttyS1',
    baudRate: 115200
});

const parser = port.pipe(new ReadlineParser({delimiter: '\r\n'}));

function decodeSerial(data){
    protobuf.load("RPDeviceReading.proto", function(err, root) {
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
    });
}

async function encodeSerial(payload){
    let data;
    const promise = new Promise((resolve, reject) => {
        protobuf.load("SBCDeviceTelemetry.proto", function (err, root) {
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

            data = buffer.toString('hex');
            resolve(data);
        });
    });

    data = await promise;
    return data;
}

async function callData() {
    let payload = {statCode: 5, inErrorState: false, sampleSensors: true};


    let hexString = await encodeSerial(payload);


    let message = `\nR:${hexString}\n`;
    port.write(message, (err) => {
        if (err) {
            return console.error('Error on write:', err.message);
        }
        console.log("Message written: ", hexString);
    });
}

parser.on('data', (data) => {
    decodeSerial(data);
});

port.on('open', () => {
    console.log('Serial Port Opened');
    setInterval(callData, 5000);
});
