// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

/**
 * A Bluetooth, BLE, library for UART communication with SweIoT devices.
 *
 * @remarks
 * The librararis react-native, react-native-base64, buffer, react-native-ble-plx and Dbg are used.
 *
 * @packageDocumentation
 * 
 * @public
 */

import { Platform, PermissionsAndroid } from 'react-native';
import base64 from 'react-native-base64';
import { BleManager, Service, Characteristic, NativeCharacteristic, Device } from 'react-native-ble-plx';
import Dbg from '../utilities/Dbg';
import { Utilities } from "../utilities/Utilities";

export const BLE_TAG : string = "Ble";

const BLE_UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_UART_WRITE_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_UART_NOTIFICATION_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";
const BLE_SWEIOT_UUID = "bd79ca110bfa41f4a334bf3ab66bb844";
const BLE_SCANNER_TIME_OUT = 10*60*1000; // 10 minutes

export default class Ble
{
    private static instance: Ble;
    private bleState : any;
    private dbg : Dbg;
    scanning: boolean = false;
    private constructor() // singleton
    {
        this.dbg = new Dbg(BLE_TAG);

        this.dbg.l("Constructor");

        this.bleInitState();

    } // constructor

    /**
    * Gets the instance of the Ble service (singleton)
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns instance of ble service
    *
    * @beta
    */
    public static getInstance(): Ble 
    {
        if (!this.instance) 
        {
            this.instance = new Ble();
        }

        return(this.instance);

    } // getInstance

    private bleInitState() : void
    {
        this.dbg.l("bleInitState");

        this.bleState = null;
        this.bleState =
        {
            bleManager : null,
            device : null,
            uartService : null,
            uartWriteCharacteristic : null,
            uartNotificationCharacteristic : null
        };
        this.bleState.bleManager = new BleManager();

    } // bleInitState

    private bleResetState() : void
    {
        this.bleState.device = null;
        this.bleState.uartService =  null;
        this.bleState.uartWriteCharacteristic = null;
        this.bleState.uartNotificationCharacteristic = null;

        this.dbg.l("bleResetState done");

    } // bleResetState

    /**
    * Returns current device identity or empty string ("")
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns device identity or empty string ("")
    *
    * @beta
    */
    public bleDeviceIdentity() : string
    {
        if (this.bleState.device)
        {
            return(this.bleState.device.id);
        }
        else
        {
            return("");
        }
        
    } // bleDeviceIdentity

    /**
    * Returns device connection status
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns true if connected else false
    *
    * @beta
    */
    public bleDeviceConnected() : boolean
    {
        return(this.bleState.device != null);

    } // bleDeviceConnected
    
    /**
    * Asks user for permission to use bluetooth
    *
    * @remarks
    * TODO, permission management only adapted to Android
    * Only permission for PERMISSIONS.ACCESS_FINE_LOCATION currently
    * granted, the rest returns status never_ask_again?
    *
    * @param NA
    * @returns true if permissions granted else false
    *
    * @beta
    */
    public blePermissionsOk() : Promise<boolean>
    {
        // this.dbg.l("blePermissionsOk beginning");

        if (Platform.OS != "android")
        {
            this.dbg.w("blePermissionsOk, permission management currently only adapted to Android");
        }

        return new Promise((resolve, reject) => 
        {
            if (Platform.OS === 'android') 
            { 
                // this.dbg.l("blePermissionsOk, Android");

                PermissionsAndroid.requestMultiple
                (
                    [PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                     PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                     PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, 
                     PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT, 
                     PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE]
                )
                .then((granted) => 
                { 
                    // this.dbg.l("ACCESS_COARSE_LOCATION, granted: " + granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION]);
                    // this.dbg.l("ACCESS_FINE_LOCATION, granted: " + granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION]);
                    // this.dbg.l("BLUETOOTH_SCAN, granted: " + granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]);
                    // this.dbg.l("BLUETOOTH_CONNECT, granted: " + granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]);
                    // this.dbg.l("BLUETOOTH_ADVERTISE, granted: " + granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE]);

                    if (granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE] === PermissionsAndroid.RESULTS.GRANTED) 
                    {
                        // this.dbg.l("blePermissionsOk, all permissions granted!");
                        resolve(true);
                    } 
                    else 
                    { 
                        // TODO, for some reason are only location permission granted, but everything works ...
                        // this.dbg.w("blePermissionsOk, all permissions NOT granted!");
                        // this.dbg.l("blePermissionsOk, all permissions NOT granted!");
                        reject(false); 
                    }
                })
                .catch((error : Error) => 
                { 
                    this.dbg.e("blePermissionsOk, error: " + error);
                    reject(false);
                })
            }
            else
            {
                this.dbg.l("blePermissionsOk, not Android");
                resolve(true);
            }
        });

    } // blePermissionsOk

    /**
    * Scans for SweIoT devices
    *
    * @remarks
    * SweIoT devices with uuid BLE_UART_SERVICE_UUID,
    * times out after BLE_SCANNER_TIME_OUT / 1000 seconds
    *
    * @param scanListener with parmeters error, device id, device name
    * @returns found device or error via scanListener
    *
    * @beta
    */
   //if (device?.manufacturerData && Utilities.base64ToHex(device?.manufacturerData).includes(BLE_SWEIOT_UUID))
    public bleScan(scanListener : (error : string, deviceId : string, deviceName : string | null, rssi : number | null) => void) : void
    {
        if (this.scanning) {
            this.dbg.l("Already scanning could not start.");
            return;
        }
        this.dbg.l("Scanning for SweIoT device ...");
        this.scanning = true;
        let timedOut = false;
        setTimeout(() => { timedOut = true; }, BLE_SCANNER_TIME_OUT);
        console.log(this.bleState.bleManager.state());
        if (this.bleState.bleManager) this.bleState.bleManager.startDeviceScan(null, null, (error : Error, device : Device) => 
        {
            if (timedOut) 
            {
                this.bleStopDeviceScan();
                this.dbg.l("Scannnig timed out after " + (BLE_SCANNER_TIME_OUT / 1000) + " secs");
                scanListener("Scannnig timed out after " + (BLE_SCANNER_TIME_OUT / 1000) + " secs", device.id, device.name, device.rssi);
                return;
            }
            if (device?.manufacturerData && device?.rssi)
            {
                this.dbg.l("startDeviceScan, RSSI: " + device.rssi);
                scanListener("", device.id, device.name, device.rssi);
            }
            else if (error)
            {
               
                if (device) {
                this.bleStopDeviceScan();
                this.dbg.e("Error when calling startDeviceScan: " + error);
                
                scanListener("Error when calling startDeviceScan: " + error, device.id, device.name, device.rssi);
                } else {
                    this.bleStopDeviceScan();
                    console.log("no device");
                    
                }
                return;
            }

        }); // startDeviceScan

    } // bleScan

    /**
    * Stops scanning if ongoing
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns NA
    *
    * @beta
    */
    public bleStopDeviceScan() : void
    {
        this.dbg.l("Stopped device scan");
        this.scanning = false;
        if (this.bleState.bleManager) this.bleState.bleManager.stopDeviceScan();

    } // bleStopDeviceScan

    /**
    * Connects with device
    *
    * @remarks
    * NA
    *
    * @param device id
    * @param connectListener with parmeters error, result
    * @returns result or error via connectListener
    *
    * @beta
    */
    public bleConnect(deviceId : string, connectListener : (error : string, result: string) => void) : void
    {
        this.dbg.l("Connecting to " + deviceId + " ...");

        if (this.bleState.bleManager) this.bleState.bleManager.connectToDevice(deviceId, {autoConnect:true})
        .then((device : Device) => 
        {
            this.scanning = false;
            this.dbg.l("Connected to " + device.id);
            this.bleState.device = device;
            connectListener("", "Connected to " + device.id);
        })
        .catch((error : Error) => 
        {
            this.dbg.e("connectToDevice, error: " + JSON.stringify(error));
            connectListener("connectToDevice, error: " + JSON.stringify(error), "");

        }); // connectToDevice

    } // bleConnect

    /**
    * Sets disconnect listener
    *
    * @remarks
    * NA
    *
    * @param device id
    * @param disconnectListener with parmeters error, result
    * @returns result or error via disconnectListener
    *
    * @beta
    */
    public setDisconnectListener(deviceId : string, disconnectListener : (error : string, result: string) => void) : void
    {
        this.bleState.bleManager.onDeviceDisconnected(deviceId, (error : Error, device : Device) => 
        {
            if (!error)
            {
                this.dbg.l("onDeviceDisconnected, device disconnected");
                disconnectListener("", "Device disconnected");
                this.bleResetState();
            }
            else
            {
                this.dbg.l("onDeviceDisconnected, error: " + error);
                disconnectListener("onDeviceDisconnected, error: " + error, "");
            }

        }); // onDeviceDisconnected

    } // setDisconnectListener

    /**
    * Discover services on current device
    *
    * @remarks
    * NA
    *
    * @param discoverListener with parmeters error, result
    * @returns result or error via discoverListener
    *
    * @beta
    */
    public bleDiscoverServices(discoverListener : (error : string, result: string) => void) : void
    {
        this.dbg.l("Discovering services and characteristics");
        if (this.bleState.device) this.bleState.device.discoverAllServicesAndCharacteristics()
        .then((device : Device) => 
        {
            this.bleCheckForUARTService()
            .then((result : boolean) => 
            {
                this.dbg.l("UART service available");
                discoverListener("", "UART service available");
            })
            .catch((error : Error) => 
            {
                this.bleDisconnect();
                this.dbg.w("UART service NOT available, disconnecting ..., error: " + error);
                discoverListener("UART service NOT available, disconnecting ..., error: " + error, "");

            }); // bleCheckForUARTService
        })
        .catch((error : Error) => 
        {
            this.dbg.e("discoverAllServicesAndCharacteristics, error: " + error);
            discoverListener("discoverAllServicesAndCharacteristics, error: " + error, "");

        }); // discoverAllServicesAndCharacteristics

    } // bleDiscoverServices

    private bleCheckForUARTService() : Promise<boolean>
    {
        let uartWriteFound = false;
        let uartNotficationFound = false;

        return new Promise((resolve, reject) => 
        {  
            this.bleState.device.services()
            .then((services : Service[]) => 
            {      
                // this.dbg.l("checkForUARTService, entering search for UART service and characteristics");
                services.forEach((service) => 
                {
                    if (service.uuid === BLE_UART_SERVICE_UUID)
                    {
                        // this.dbg.l("bleCheckForUARTService, UART service found");
                        this.bleState.uartService = service;
                        service.characteristics()
                        .then((characteristics : NativeCharacteristic[]) => 
                        {
                            characteristics.forEach((characteristic, noOfIterations) =>
                            {
                                if (characteristic.uuid === BLE_UART_WRITE_CHARACTERISTIC_UUID)
                                {
                                    // this.dbg.l("bleCheckForUARTService, UART write characteristic found");
                                    uartWriteFound = true;
                                    this.bleState.uartWriteCharacteristic = characteristic;
                                }

                                if (characteristic.uuid === BLE_UART_NOTIFICATION_CHARACTERISTIC_UUID)
                                {
                                    // this.dbg.l("bleCheckForUARTService, UART notification characteristic found");
                                    uartNotficationFound = true;
                                    this.bleState.uartNotificationCharacteristic = characteristic;
                                }

                                if (noOfIterations === (characteristics.length-1)) // Check if run through all charcteristics
                                {
                                    if (uartWriteFound && uartNotficationFound)
                                    {
                                        // this.dbg.l("bleCheckForUARTService, UART service & characteristics found");
                                        resolve(true);
                                    }
                                    else
                                    {
                                        this.dbg.w("bleCheckForUARTService, UART service & characteristics NOT found");
                                        reject(false);
                                    }
                                }

                            }); // forEach characteristic
                        })
                        .catch((error : Error) =>
                        {
                            this.dbg.e("bleCheckForUARTService, characteristics, error: " + error);
                            reject(false);

                        }); // characteristics

                    } // if correct service uuid

                }); // forEach service
            })
            .catch((error: Error) => 
            {
                this.dbg.e("bleCheckForUARTService, services, error: " + error);
                reject(false);   

            }) // Service

        }); // Promise

    } // bleCheckForUARTService

    /**
    * Sends a message to the current device via UART service
    *
    * @remarks
    * NA
    *
    * @param message to be sent
    * @param sendListener with parmeters error, result
    * @returns result or error via sendListener
    *
    * @beta
    */
    public bleSendMessage(msg : string, sendListener : (error : string, result: string) => void) : void
    {
        this.dbg.l("Data (len: " + msg.length + "), sent: " + msg);

        const senddata = base64.encode(msg);

        if (this.bleState.device)
        {
            this.bleState.device.writeCharacteristicWithResponseForService(BLE_UART_SERVICE_UUID, BLE_UART_WRITE_CHARACTERISTIC_UUID, senddata)
            .then((characteristic : NativeCharacteristic) => 
            {    
                this.dbg.l("Send command successful");
                sendListener("", "Send command successful");
            })
            .catch((error : Error) => 
            {
                this.dbg.l("bleSendMessage, error in sending: " + JSON.stringify(error));
                sendListener("bleSendMessage, error in sending: " + JSON.stringify(error), "");

            }); // writeCharacteristicWithResponseForService
        }
        else
        {
            this.dbg.l("bleSendMessage, no device is connected");
            sendListener("bleSendMessage, no device is connected", "");
        }

    } // bleSendMessage

    /**
    * Receives messages from the current device via UART service
    *
    * @remarks
    * NA
    *
    * @param receiveListener with parmeters error, result
    * @returns received data (result) or error via receiveListener
    *
    * @beta
    */
    public bleReceiveMessages(receiveListener : (error : string, result: string) => void) : void
    {
        this.dbg.l("Waiting for data ...");

        this.bleState.uartNotificationCharacteristic.monitor((error : Error, characteristic : Characteristic) => 
        {
            if (!error)
            {
                if (characteristic.value != null)
                {
                    this.dbg.l("Data received: " + base64.decode(characteristic.value));

                    receiveListener("", base64.decode(characteristic.value));
                }
            }
            else
            {
                if (!this.bleState.device)
                {
                    this.dbg.l("Reception interupted due to disconnection: " + error);
                    receiveListener("Reception interupted due to disconnection: " + error, "");
                    return;
                }
                else
                {
                    this.dbg.e("Error in reception: " + error);
                    receiveListener("Error in reception: " + error, "");    
                }
            }

        }); // monitor

    } // bleReceiveMessages
    
    /**
    * Disconnects the current device if connected
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns Promise<boolean>
    *
    * @beta
    */
    public bleDisconnect() : Promise<boolean>
    {
        this.dbg.l("bleDisconnect beginning");

        return new Promise((resolve, reject) => 
        {
            if (this.bleState.bleManager != null)
            {
                this.bleState.bleManager.cancelDeviceConnection(this.bleState.device.id)
                .then((device : Device) =>
                {
                    this.bleResetState();
                    this.dbg.l("bleDisconnect done");
                    resolve(true);
                })
                .catch((error : Error) => 
                { 
                    this.dbg.e("Error when disconnecting: " + error);
                    reject(false);
                    
                }); // cancelDeviceConnection
            }
            else
            {
                this.dbg.e("Error when disconnecting: bleManager == null");
                reject(false);
            }

        }); // Promise

    } // bleDisconnect

    /**
    * Closes the BLE service
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns NA
    *
    * @beta
    */
    public bleCloseService()
    {
        this.dbg.l("bleCloseService beginning");

        if (this.bleState.bleManager != null)
        {
            this.bleStopDeviceScan();
            this.bleDisconnect();
            this.bleState.bleManager.destroy();
            delete this.bleState.bleManager;
            this.bleState.bleManager = null;
        }
        this.bleResetState();

        this.dbg.l("bleCloseService done");

    } // bleCloseService

} // class SweIoTConf