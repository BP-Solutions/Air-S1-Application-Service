import protobuf from "protobufjs";
import {sendMsg} from "../serializers/serialize.js";

export function decodeSerial(data){
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

export async function encodeSerial(payload){
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