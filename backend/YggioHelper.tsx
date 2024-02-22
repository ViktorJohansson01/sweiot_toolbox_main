// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import Dbg from "../utilities/Dbg";
import { YGGIO_CHANNEL} from '../App';
import Http from "./Http";
import Yggio from "./Yggio";
import AppHelper from "../AppHelper";

const TAG : string = "YggioHelper";
const YGGIO_POLL_DEVICE_TIME_OUT = 10000; // 10 seconds

/**
 * A help class for Yggio / LoRa management
 *
 * @remarks
 * -
 *
 * @packageDocumentation
 */
export default class YggioHelper
{
    private static instance: YggioHelper;
    private dbg : Dbg;
    private app : any;
    yggio : Yggio;
    http : Http;

    private constructor(app : any, http :Http) // singleton
    {
        this.dbg = new Dbg(TAG);

        this.dbg.l("Constructor");

        this.app = app;

        this.http = http;

        this.yggio = Yggio.getInstance();

    } // constructor

    public static getInstance(app : any, http: Http): YggioHelper 
    {
        if (!this.instance) { this.instance = new YggioHelper(app, http); }

        return(this.instance);

    } // getInstance

    /**
     * This method authorizes and sends data to a device via Yggio / LoRa
     *
     * @remarks
     * NA
     *
     * @param data to be sent
     * @returns response or error through callback
     *
     * @beta
     */
    public yggioSend(data : string) : void
    {
        // TODO, manage secure mode while in Yggio mode ...

        let yggioDeviceId = this.yggio.getDeviceId();
        this.app.setStatusText("Internet connected: " + this.http.httpIsConnected() + ", id: " + yggioDeviceId + ", sending data ...");

        if (yggioDeviceId)
        {
            this.yggio.authorize((error : string, response: string) =>
            {
                if (!error)
                {
                    this.dbg.l("yggioSend, authorize response: " + response);
                    this.app.setReceivedDataText(response);

                    this.yggio.queueData(yggioDeviceId, data, (error : string, response: string) =>
                    {
                        if (!error)
                        {
                            this.dbg.l("yggioSend, queueData response: " + response);
                            this.app.setReceivedDataText(response);
                        }
                        else
                        {
                            this.dbg.w("yggioSend, queueData error: " + error);
                            this.app.setReceivedDataText(error);
                        }
                    }); // queueData
                }
                else
                {
                    this.dbg.e("yggioSend, authorize error: " + error);
                    this.app.setReceivedDataText(error);
                }
            }); // authorize
        }
        else
        {
            this.dbg.l("yggioSend, no chosen Yggio device id");
            this.app.setStatusText("Internet connected: " + this.http.httpIsConnected() + ", no chosen Yggio device id");
        }

    } // yggioSend

    /**
     * This method authorizes and fetches all Yggio devices 
     * (and their data)
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns response or error through callback
     *
     * @beta
     */
    public yggioFetchAllDevices() : void
    {
        this.app.setStatusText("Internet connected: " + this.http.httpIsConnected() + ", fetching Yggio devices ...");
        this.dbg.l("yggioFetchAllDevices");
        this.app.setReceivedDataText("No data received ...");
        
        this.yggio.authorize((error : string, response: string) =>
        {
            if (!error)
            {
                this.dbg.l("yggioFetchAllDevices, authorize response: " + response);
                this.app.setReceivedDataText(response);

                this.yggio.fetchAllDevices((error : string, response: string) =>
                {
                    if (!error)
                    {
                        this.dbg.l("yggioFetchAllDevices, fetchAllDevices response: " + response);
                        this.app.setReceivedDataText(response);
                        this.app.setYggioDeviceViewVisible(true);
                    }
                    else
                    {
                        this.dbg.w("yggioFetchAllDevices, fetchAllDevices error: " + error);
                        this.app.setReceivedDataText(error);  
                    }
                }); // fetchAllDevices
            }
            else
            {
                this.dbg.e("yggioFetchAllDevices, authorize error: " + error);
                this.app.setReceivedDataText(error); 
            }
        }); // authorize

    } // yggioFetchAllDevices

    /**
     * This method authorizes and fetches the specified 
     * Yggio device and its data
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns response or error through callback
     *
     * @beta
     */
    public yggioFetchDevice(deviceId : string) : void
    {
        this.app.setStatusText("Internet connected: " + this.http.httpIsConnected() + ", fetching Yggio device: " + deviceId);
        this.dbg.l("yggioFetchDevice, device: " + deviceId);
        
        this.yggio.authorize((error : string, response: string) =>
        {
            if (!error)
            {
                this.dbg.l("yggioFetchDevice, authorize response: " + response);
                this.app.setReceivedDataText(response);

                this.yggio.fetchDevice(deviceId, (error : string, response: string) =>
                {
                    if (!error)
                    {
                        this.dbg.l("yggioFetchDevice, fetchDevice response: " + response);
                        this.app.setReceivedDataText(response);

                        let device = this.yggio.getDevice(deviceId);
                        if (device != null)
                        {
                            this.dbg.l("yggioFetchDevice, device distanceTime: " + device.distanceTime);
                            this.dbg.l("yggioFetchDevice, device distance: " + device.distance);
                            this.dbg.l("yggioFetchDevice, device amplitudeTime: " + device.amplitudeTime);
                            this.dbg.l("yggioFetchDevice, device amplitude: " + device.amplitude);
                            this.dbg.l("yggioFetchDevice, device uartTime: " + device.uartTime);
                            this.dbg.l("yggioFetchDevice, device uartData: " + device.uartData);
                            this.app.setReceivedDataText("Yggio device: " + deviceId + 
                                                        ", distance: " + device.distance +
                                                        ", amplitude: " + device.amplitude +
                                                        ", uartData: " + device.uartData);

                            AppHelper.getInstance(this.app, this.http).mangageReceivedMessage(device.uartData);
                        }
                        else
                        {
                            this.dbg.l("yggioFetchDevice, device: " + deviceId + " not found");
                            this.app.setReceivedDataText("Yggio device: " + deviceId + " not found");
                        }
                    }
                    else
                    {
                        this.dbg.w("yggioFetchDevice, fetchDevice error: " + error);
                        this.app.setReceivedDataText(error);
                    }
                }); // fetchDevice
            }
            else
            {
                this.dbg.e("yggioFetchDevice, authorize error: " + error);
                this.app.setReceivedDataText(error);
            }
        }); // authorize

    } // yggioFetchDevice

    /**
     * This starts polling the specified device, every
     * YGGIO_POLL_DEVICE_TIME_OUT time unit 
     *
     * @remarks
     * NA
     *
     * @param deviceId device to be polled
     * @returns response or error through callback
     *
     * @beta
     */
    public yggioStartPollingDevice(deviceId : string) : void
    {
        this.yggio.setDeviceId(deviceId);
        this.app.setYggioDeviceViewVisible(false);

        if (deviceId)
        {
            this.app.setStatusText("Yggio device " + deviceId + " chosen");
            this.dbg.l("yggioStartPollingDevice, chosen device: " + deviceId);

            AppHelper.getInstance(this.app, this.http).sendInitReqCmd();

            let yggioPollIntervalId = setInterval(() => 
            { 
                if (this.yggio.getDeviceId() && this.app.getCurrentChannel() === YGGIO_CHANNEL)
                {
                    this.yggioFetchDevice(deviceId);
                }
                else
                {
                    this.dbg.l("yggioStartPollingDevice, polling stopped, deviceId: " + this.yggio.getDeviceId() + ", channel: " + this.app.getCurrentChannel());
                    clearInterval(yggioPollIntervalId)
                }

            }, YGGIO_POLL_DEVICE_TIME_OUT); 
        }
        else
        {
            this.app.setStatusText("No Yggio device chosen");
        }

    } // yggioStartPollingDevice

} // class YggioHelper