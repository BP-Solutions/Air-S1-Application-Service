import {encodeSerial} from "../protobufs/proto.js";

import {SerialPort} from "serialport";
import {ReadlineParser} from "@serialport/parser-readline";
export const port = new SerialPort({
    path: '/dev/myserialdevice',
    baudRate: 115200
});


let payload = {statCode: 0, inErrorState: false, sampleSensors: false, configSXX: true, abcPer: 180, SXXCalType: 0};

let hexString = await encodeSerial(payload);

let message = `\nR:${hexString}\n`;
port.write(message, (err) => {
    if (err) {
        return console.error('Error on write:', err.message);
    }
});