// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.
import { AUTHORIZED_MODE, REQUIRE_SECURE_MODE, SECURE_MODE, UNSECURE_MODE } from '../App';
import Http from '../backend/Http';
import Server from '../backend/Server';
import Dbg from "./Dbg";

/**
 * A list of devices used to display devices
 * found during bluetooth, yggio/lora or other communication
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 * @public
 */

/**
 * An interface describing the device contained in the
 * list managing devices used to display devices found 
 * during bluetooth, yggio/lora or other communication
 */
export interface Device {
    id: string;
    name: string;
    rssi: number | null;
    distanceTime: string;
    distance: string;
    amplitudeTime: string;
    amplitude: string;
    uartTime: string;
    uartData: string;
}

const DEVICE_LIST_TAG = "DeviceList";

/**
 * A class managing a list of devices used to display 
 * devices found during bluetooth, yggio/lora or other 
 * communication
 */
export default class DeviceList {
    private deviceList: Device[] = [];
    private checkedDevices: Device[] = [];
    private dbg: Dbg;
    private server: Server;
    private app: any;
    private bleHelper: any;
    constructor(app: any, bleHelper: any) {
        this.dbg = new Dbg(DEVICE_LIST_TAG);
        this.server = Server.getInstance();
        this.app = app;
        this.bleHelper = bleHelper;
        // this.dbg.l("Constructor");

    } // constructor

    /**
    * Checks if a device id is already present in
    * the device list
    *
    * @remarks
    * NA
    *
    * @param deviceId identity of the device
    * @returns true if present else false
    *
    * @beta
    */
    public isAlreadyPresent(deviceId: string): boolean {
        for (let i = 0; i < this.deviceList.length; i++) {
            if (this.deviceList[i].id === deviceId) { return (true); }
        }

        return (false);
    }

    /**
    * Adds a device to the devicelist if not already present
    *
    * @remarks
    * NA
    *
    * @param deviceId identity of the device
    * @param deviceName name of the device
    * @param rssi signal strength of device
    * @param distanceTime timestamp for distance
    * @param distance distance data from the device
    * @param amplitudeTime timestamp for amplitude
    * @param amplitude aplitude data from the device
    * @param uartTime timestamp for uart data
    * @param uartData from the device
    * @returns true if added else false
    *
    * @beta
    */
    public addDevIfNotPresent(deviceId: string,
        deviceName: string | null,
        rssi: number | null,
        distanceTime: string = "",
        distance: string = "",
        amplitudeTime: string = "",
        amplitude: string = "",
        uartTime: string = "",
        uartData: string = ""): boolean {
        for (let i = 0; i < this.deviceList.length; i++) {

            if (this.deviceList[i].id === deviceId) { return (false); }
        }

        if (!deviceName) { deviceName = deviceId; }
        // this.dbg.l("addIfNotAlreadyPresent, Device added to list: " + deviceId);
        // this.dbg.l("addIfNotAlreadyPresent, distance: " + distance + ", amplitude: " + amplitude + ", uartTime: " + uartTime + ", uartData: " + uartData);
        this.deviceList.push({ id: deviceId, name: deviceName, rssi: rssi, distanceTime: distanceTime, distance: distance, amplitudeTime: amplitudeTime, amplitude: amplitude, uartTime: uartTime, uartData: uartData });

        return (true);

    } // addDevIfNotPresent

    /**
    * Adds a device to the devicelist, or updates its data
    * if already present
    *
    * @remarks
    * NA
    *
    * @param deviceId identity of the device
    * @param deviceName name of the device
    * @param rssi signal strength of device
    * @param distanceTime timestamp for distance
    * @param distance distance data from the device
    * @param amplitudeTime timestamp for amplitude
    * @param amplitude aplitude data from the device
    * @param uartTime timestamp for uart data
    * @param uartData from the device
    * @returns true if added else false
    *
    * @beta
    */
    public addDevOrUpdateIfPresent(deviceId: string,
        deviceName: string | null,
        rssi: number | null,
        distanceTime: string = "",
        distance: string = "",
        amplitudeTime: string = "",
        amplitude: string = "",
        uartTime: string = "",
        uartData: string = ""): boolean {
        if (!deviceName) { deviceName = deviceId; }


        for (let i = 0; i < this.deviceList.length; i++) {
            if (this.deviceList[i].id === deviceId) {
                // this.dbg.l("addDevOrUpdateIfPresent, Device updated in list: " + deviceId);
                // this.dbg.l("addDevOrUpdateIfPresent, update device, distanceTime: " + distanceTime + ", distance: " + distance + ", amplitudeTime: " + amplitudeTime + ", amplitude: " + amplitude + ", uartTime: " + uartTime + ", uartData: " + uartData);

                this.deviceList[i].name = deviceName;
                this.deviceList[i].distanceTime = distanceTime;
                this.deviceList[i].rssi = rssi;
                this.deviceList[i].distance = distance;
                this.deviceList[i].amplitudeTime = amplitudeTime;
                this.deviceList[i].amplitude = amplitude;
                this.deviceList[i].uartTime = uartTime;
                this.deviceList[i].uartData = uartData;

                return (false);
            }
        }

        // this.dbg.l("addDevOrUpdateIfPresent, Device added to list: " + deviceId);
        // this.dbg.l("addDevOrUpdateIfPresent, added device, distanceTime: " + distanceTime + ", distance: " + distance + ", amplitudeTime: " + amplitudeTime + ", amplitude: " + amplitude + ", uartTime: " + uartTime + ", uartData: " + uartData);
        this.deviceList.push({ id: deviceId, name: deviceName, rssi: rssi, distanceTime: distanceTime, distance: distance, amplitudeTime: amplitudeTime, amplitude: amplitude, uartTime: uartTime, uartData: uartData });
        return (true);

    } // addDevOrUpdateIfPresent

    public async get(): Promise<Device[]> {
        return new Promise((resolve, reject) => {
        const deviceIds = this.deviceList.map((device: any) => device.name);
        let array: Device[] = [];


        const newDeviceIds = deviceIds.filter((deviceId: any) => !this.checkedDevices.find((device: any) => device.name === deviceId));

        if (REQUIRE_SECURE_MODE) {

            if (newDeviceIds.length > 0) {
                

                this.server.ownsDevice(newDeviceIds, (error: string, response: any, responseJson: any) => {
                    if (!error) {
                        console.log("sending: ", newDeviceIds, " sending");
                        const ownedDevices = responseJson.map((deviceInfo: any) => {
                            return {
                                name: deviceInfo[0],
                                settings: deviceInfo[1],
                                version: deviceInfo[2],
                                owned: deviceInfo[3]
                            };
                        });

                        ownedDevices.forEach((device: any) => {
                            this.checkedDevices.push(device);
                            
                            //if (device.owned === true) {
                            array = this.deviceList.filter((devices: any) => devices.name === device.name);
                            resolve(array);
                            //}
                        });

                    }
                    if (this.isNotAuthorized(response, error)) {
                        console.log("ownsDevice, server API not authorized");
                        this.bleHelper.stopScanAndConnect("");
                        this.app.setLoginViewVisible(true);
                        this.app.setLoginStatusText("Session timed out, please enter login credentials");
                        reject();
                    }
                    reject();
                });
            }
        } else {
            resolve(this.deviceList);
        }

            resolve(this.deviceList);
        });
    }



    public isNotAuthorized(response: any, error: string): boolean {
        if (response !== null) {
            return (response.status === Http.ERROR_UNAUTHORIZED);
        }
        else {
            return (error === Server.NOT_AUTHORIZED);
        }

    }

    public getDevice(deviceId: string): Device | null {
        for (let i = 0; i < this.deviceList.length; i++) {
            if (this.deviceList[i].id === deviceId) {

                return (this.deviceList[i]);
            }
        }
        return (null);
    }

    public clear(): void { this.deviceList = []; }

} // DeviceList