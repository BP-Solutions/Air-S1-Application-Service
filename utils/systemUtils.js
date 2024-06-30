import si from "systeminformation";
import {exec} from "child_process";
import network from "network";

export async function changeHostname(newHostname) {
    try {
        // Write the new hostname to /etc/hostname
        await si.hostname(newHostname);
        console.log(`Hostname set to: ${newHostname}`);

        // Apply the new hostname using hostnamectl
        exec(`hostnamectl set-hostname ${newHostname}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing hostnamectl: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`stderr: ${stderr}`);
                return;
            }
            console.log(`Hostname changed successfully to: ${newHostname}`);
        });
    } catch (err) {
        console.error(`Error setting hostname: ${err.message}`);
    }
}

export async function getNetwork() {
    return new Promise((resolve, reject) => {
        network.get_active_interface((err, activeInterface) => {
            if (err) {
                console.error(`Error: ${err.message}`);
                reject(err);
                return;
            }
            resolve(activeInterface);
        });
    });
}