// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import Dbg from "../utilities/Dbg";
import { AUTHORIZED_MODE, REQUIRE_SECURE_MODE, SECURE_MODE, UNSECURE_MODE } from '../App';
import Http from "../backend/Http";
import Server from "../backend/Server";
import DeviceList, { Device } from "../utilities/DeviceList";
import Ble from "./Ble";
import { Utilities } from "../utilities/Utilities";
import Protocol from "./Protocol";
import AppHelper from "../AppHelper";
export const TAG: string = "BleHelper";

/**
 * A help class for, Bluetooth, BLE, management
 *
 * @remarks
 * -
 *
 * @packageDocumentation
 */
export default class BleHelper {
    private static instance: BleHelper;
    private dbg: Dbg;
    private app: any;
    ble: Ble;
    bleDeviceList: DeviceList;
    server: Server;
    devProt: Protocol;
    http: Http;

    private constructor(app: any, http: Http) // singleton
    {
        this.dbg = new Dbg(TAG);

        this.dbg.l("Constructor");

        this.app = app;

        this.ble = Ble.getInstance();

        this.bleDeviceList = new DeviceList();

        this.server = Server.getInstance();

        this.devProt = Protocol.getInstance();

        this.http = http;
    } // constructor

    public static getInstance(app: any, http: Http): BleHelper {
        if (!this.instance) { this.instance = new BleHelper(app, http); }

        return (this.instance);

    } // getInstance

    public getBleDeviceList(): Device[] {
        return (this.bleDeviceList.get());

    } // getBleDeviceList

    public isNotAuthorized(response: any, error: string): boolean {
        if (response !== null) {
            return (response.status === Http.ERROR_UNAUTHORIZED);
        }
        else {
            return (error === Server.NOT_AUTHORIZED);
        }

    } // isNotAuthorized


    /**
     * This method starts BLE scanning of SweIoT devices via bluetooth,
     * enables scanning list view where a devices may be selected
     * for connection and further communication
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns result or errors through callbacks
     *
     * @beta
     */

    public bleStartScanning(): void {
      
        this.app.setBleScanningViewVisible(true);

        this.app.setStatusText("BLE scanning ...");
        this.app.setReceivedDataText("No data received ...");

        this.bleDeviceList.clear();

        this.ble.bleScan((error: string, deviceId: string, deviceName: string | null, rssi: number | null) => {
            if (!error) {
                if (REQUIRE_SECURE_MODE) {
                    if (!this.bleDeviceList.isAlreadyPresent(deviceId)) {
                        //this.server.ownsDevice(deviceId, (error: string, response, responseJson: string) => {
                            
                           // if (!error) {
                                
                         
                                
                            
                        this.bleDeviceList.addDevOrUpdateIfPresent(deviceId, deviceName, rssi);
                              /*  }
                                else // not owned
                                {
                                    this.dbg.l("bleStartScanning, require secure mode, not present, device " + deviceId + " ignored due to not owned by user");
                                }
                           /* }
                            else // error
                            {
                                if (this.isNotAuthorized(response, error)) {
                                    this.dbg.l("ownsDevice, server API not authorized");
                                    this.bleStopScanningAndConnect(""); this.app.forceUpdate();
                                    this.app.setLoginViewVisible(true);
                                    this.app.setLoginStatusText("Session timed out, please enter login credentials");
                                }
                                else {
                                   
                                    //this.dbg.e("bleStartScanning, ownsDevice " + deviceId + " ignored due to error when asking if owned, error: " + error);
                                }
                            }

                        }); */
                    }
                    else // already present
                    {

                        this.bleDeviceList.addDevOrUpdateIfPresent(deviceId, deviceName, rssi);
                    }
                }
                else // secure mode not required
                {
                    this.bleDeviceList.addDevOrUpdateIfPresent(deviceId, deviceName, rssi);

                }
            }
            else {
                this.bleStopScanningAndConnect("");
                this.dbg.w("bleStartScanning, terminated: " + error);
                this.app.setStatusText(error);
            }

        }); // bleScan

    } // bleStartScanning

    /**
     * The method stops BLE scanning, connects to device, discover UART 
     * services on device, sets disconnection and reception of data listener 
     * via bluetooth to a SweIoT device
     *
     * @remarks
     * NA
     *
     * @param deviceId device identity to be connected
     * @returns result or errors through callbacks
     *
     * @beta
     */
    public bleStopScanningAndConnect(deviceId: string) {
        this.ble.bleStopDeviceScan();
        this.app.setStatusText("Stopped BLE scanning ...");
        this.app.setReceivedDataText("No data received ...");

        if (this.app.isBleScanningViewVisible()) // timed out, cancel or device selected
        {
            this.app.setBleScanningViewVisible(false);
            if (deviceId) {
                this.app.setPairingDeviceView(true);
                this.app.setStatusText("BLE connecting ...");

                this.ble.bleConnect(deviceId, (error: string, result: string) => {
                    if (!error) {
                        this.app.setStatusText("BLE device " + deviceId + " connected");
                        this.app.setPairingDeviceView(false);
                        this.app.setModeSelectorViewVisible(true);
                        this.ble.setDisconnectListener(deviceId, (error: string, result: string) => {
                            if (!error) { AppHelper.getInstance(this.app, this.http).setDisconnectState(deviceId); }
                            else { this.dbg.w(error); this.app.forceUpdate(); }

                        }); // setDisconnectListener

                        this.ble.bleDiscoverServices((error: string, result: string) => {
                            if (!error) {
                                this.dbg.l(result);

                                if (REQUIRE_SECURE_MODE) {
                                    this.server.secureDevice(deviceId, (error: string, response, responseJson: any) => {
                                        if (!error) {
                                            if (responseJson.secure) {
                                                this.app.setSecurityStatus(SECURE_MODE);
                                                this.app.setPublicKeyHex(responseJson.public_key_hex);
                                            }
                                            else {
                                                // NOTE, special in-between mode wanted by Knut ...
                                                this.dbg.l("bleStopScanningAndConnect, secureDevice, device should be run in unsecure mode even if secure mode is required (Knut decided)...");
                                                if (this.server.isAuthorized()) { this.app.setSecurityStatus(AUTHORIZED_MODE); }
                                                else { this.app.setSecurityStatus(UNSECURE_MODE); }
                                            }

                                            AppHelper.getInstance(this.app, this.http).sendInitReqCmd();
                                        }
                                        else // error
                                        {
                                            // setDisconnectState is called via BLE disconnection listener
                                            if (this.ble.bleDeviceConnected()) { this.bleDisconnect(); }

                                            if (this.isNotAuthorized(response, error)) {
                                                this.dbg.l("secureDevice, server API not authorized");
                                                this.app.setLoginViewVisible(true);
                                                this.app.setLoginStatusText("Session timed out, please enter login credentials");
                                            }
                                            else {
                                                this.dbg.e("bleStopScanningAndConnect, secureDevice " + deviceId + " could not be checked if secure ... error: " + error);
                                                this.app.setStatusText(error);
                                            }
                                        }
                                    }); // secureDevice  
                                }
                                else // secure mode not required
                                {
                                    AppHelper.getInstance(this.app, this.http).sendInitReqCmd();
                                }

                                this.ble.bleReceiveMessages((error: string, result: string) => {
                                    if (!error) {
                                        // NOTE, 0x00 terminators may appear in answers from devices
                                        const cleanResult: string = Utilities.remove0x00fromStr(result);
                                        AppHelper.getInstance(this.app, this.http).mangageReceivedMessage(cleanResult);
                                    }
                                    else {

                                        this.dbg.l(error); this.app.forceUpdate();
                                    }

                                }); // bleReceiveMessages
                            }
                            else {
                                this.dbg.w(error); this.app.forceUpdate();
                            }

                        }); // bleDiscoverServices
                    }
                    else {
                        this.dbg.w(error); this.app.forceUpdate();
                    }
                }); // bleConnect
            }
        }
        else // Could this happen?
        {
            //this.app.forceUpdate();
        }

    } // bleStopScanningAndConnect

    /**
     * The method sends a message via bluetooth to a SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param msg string to be sent
     * @returns result or error through callback
     *
     * @beta
     */
    public bleSend(msg: string): void {
        if (REQUIRE_SECURE_MODE && this.app.getSecurityStatus() === SECURE_MODE && !this.devProt.isSetPublicKeyCmd(msg)) {
            this.server.signMsg(this.ble.bleDeviceIdentity(), msg, (error: string, response: any, responseJson: string) => {
                if (!error) {
                    this.app.setReceivedDataText(responseJson);

                    this.ble.bleSendMessage(responseJson, (error: string, result: string) => {
                        if (!error) { /* this.dbg.l(result); */ }
                        else { this.dbg.l(error); }

                    }); // bleSendMessage
                }
                else // error
                {
                    if (this.isNotAuthorized(response, error)) {
                        this.dbg.l("signMsg, server API not authorized");
                        this.app.setLoginViewVisible(true);
                        this.app.setLoginStatusText("Session timed out, please enter login credentials");
                    }
                    else {
                        this.dbg.e("signMsg, error: " + error);
                        this.app.setReceivedDataText(error);
                    }
                }
            }); // signMsg  
        }
        else {
            this.ble.bleSendMessage(msg, (error: string, result: string) => {
                if (!error) { /* this.dbg.l(result); */ }
                else { this.dbg.l(error); }

            }); // bleSendMessage
        }

    } // bleSend

    /**
     * The method disconnetcs current SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns NA
     *
     * @beta
     */
    public bleDisconnect(): void {
        this.ble.bleDisconnect()
            .then((result: boolean) => {
                this.dbg.l("BLE disconnect done");
                this.app.setStatusText("BLE disconnected");
                this.app.setMeasurementDataGraphVisible(false);
                this.app.setPairingDeviceView(false);
                this.app.isStartDeviceScanViewVisible(true);
            })
            .catch((error: Error) => {
                this.dbg.e("Error when disconnecting: " + error);
            });

    } // bleDisconnect

} // class BleHelper