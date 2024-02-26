// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

/**
 * This module implements the Yggio LoRa API
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
  * @public
 */
import Dbg from "../utilities/Dbg";
import DeviceList, { Device } from "../utilities/DeviceList";
import Http from "./Http";
import { Utilities } from "../utilities/Utilities";

// https://yggio3-beta.sensative.net/control-panel-v2
// https://yggio3-beta.sensative.net/swagger/src/index.yaml
export const YGGIO_TAG = "Yggio";

const AUTHORIZATION_URL = "https://yggio3-beta.sensative.net/api/auth/local";
const AUTHORIZATION_METHOD = "POST";
const AUTHORIZATION_BODY = JSON.stringify({ "username": "sweIoT", "password": "E*67nqeBE4gq" });

const GET_IOT_NODES_URL = "https://yggio3-beta.sensative.net/api/iotnodes";
const GET_IOT_NODES_METHOD = "GET";

// TODO, unsure if same URL for queueData, getQueuedData and flushQueuedData?
const QUEUE_DATA_URL = "https://yggio3-beta.sensative.net/api/iotnodes/command";
const GET_QUEUED_DATA_URL = QUEUE_DATA_URL;
const FLUSH_QUEUED_DATA_URL = QUEUE_DATA_URL;
const QUEUE_METHOD = "PUT";

const BEARER = "Bearer ";

export default class Yggio extends Http
{
    private static instance: Yggio;
    private dbg : Dbg;
    private authorizationToken : string = ""; 
    private loraDeviceList : DeviceList;  
    private chosenDeviceId : string = "";

    private tokenHeaders =
    {
        Accept: 'application/json', 
        'Content-Type': 'application/json', 
        Authorization: "Bearer token"
    };

    private queueDataBody =
    {
        "command" : "loraAppServerQueueDownlink", // use as is
        "integrationName" : "ChirpStack", // use as is
        "iotnodeId" : "633c3444862b4c00063b5ef5", // Set yggioId of the current device
        "data" : 
        {
            "confirmed" : false, // currently not used
            "reference" : "I sent this to configure blabla", // ref to the data in plain text
            "fPort" : "32", // port
            "data" : "1234" // Set, string, hex, data to be sent to the device
        }
    };

    // TODO, unsure if same body, or not, for queueData, getQueuedData and flushQueuedData?
    private getQueueBody =
    {
        "command": "loraAppServerGetDeviceQueue", // use as is
        "integrationName": "ChirpStack", // use as is
        "iotnodeId": "633c3444862b4c00063b5ef5", // Set yggioId of the current device
    };

    private flushQueueBody =
    {
        "command": "loraAppServerFlushQueue", // use as is
        "integrationName": "ChirpStack", // use as is
        "iotnodeId": "5d2c6561ecb9a30aa5fc3e41", // Set yggioId of the current device
    };

    private constructor() // singleton
    {
        super();

        this.dbg = new Dbg(YGGIO_TAG);

        // this.dbg.l("Constructor");

        this.loraDeviceList = new DeviceList();

    } // constructor

    /**
     * Gets the instance of the Yggio service (singleton)
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns instance of http service
     *
     * @beta
     */
    public static getInstance(): Yggio 
    {
        if (!this.instance) 
        {
            this.instance = new Yggio();
        }

        return(this.instance);

    } // getInstance

    /**
     * Authorizes the Yggio API
     *
     * @remarks
     * NA
     *
     * @returns response or error via callback function
     *
     * @beta
     */
    public authorize(responseListener : (error : string, response : string) => void) : void
    {
        // TODO, don't authorize if token alreday received?
        this.authorizationToken = "";

        if (this.httpIsConnected())
        {
            this.dbg.l("authorize, command sent ...");
            this.httpSend(AUTHORIZATION_URL, AUTHORIZATION_METHOD, null, AUTHORIZATION_BODY, (error : string, response: any, responseJson : string) =>
            {
                if (!error)
                {
                    if (responseJson)
                    {
                        this.authorizationToken = JSON.parse(responseJson).token;
                        this.dbg.l("authorize, successful");
                        // this.dbg.l("authorize, authorizationToken: " + this.authorizationToken);
                        responseListener("", "Yggio authorization successful");
                    }
                    else
                    {
                        this.dbg.e("authorize, failed with unknown non json response");
                        responseListener("Yggio authorization failed with unknown error", "");
                    }
                }
                else // error
                {
                    this.dbg.e("authorize, failed with error: " + error);
                    responseListener("Yggio authorization failed with: " + error, "");
                }
        
            }); // httpSend
        }
        else // no Internet
        {
            this.dbg.w("authorize, no internet connection");
            responseListener("No internet connection", "");
        }

    } // authorize

    /**
     * Fetches Yggio devices, devices' data, and puts
     * them in a list
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns response or error via callback function
     *
     * @beta
     */
    public fetchAllDevices(responseListener : (error : string, response : string) => void) : void
    {
        this.fetchDevices("", responseListener);
    }

    /**
     * Fetches specified Yggio device, device's data, and puts
     * them in a list or updates data if already in list
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns response or error via callback function
     *
     * @beta
     */
    public fetchDevice(deviceId : string, responseListener : (error : string, response : string) => void) : void
    {
        this.fetchDevices(deviceId, responseListener);
    }

    /**
     * Fetches Yggio devices, devices' data, and puts
     * them in a list
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns response or error via callback function
     *
     * @beta
     */
    private fetchDevices(deviceId : string, responseListener : (error : string, response : string) => void) : void
    {
        if (deviceId === "")
        {
            this.loraDeviceList.clear();
            this.setDeviceId("");
        }

        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;

                let url = GET_IOT_NODES_URL;
                // TODO, check with Sensative why json conversion fails while getting a specified yggio device ..
                if (deviceId !== "") { url += "/" + deviceId; }
                this.dbg.l("fetchDevices, command sent ... url: " + url);

                this.httpSend(url, GET_IOT_NODES_METHOD, JSON.stringify(this.tokenHeaders), null, (error : string, response: any, responseJson : string) =>
                {
                    if (!error)
                    {
                        if (responseJson)
                        {
                            let responseObj = JSON.parse(responseJson);

                            if (deviceId === "") // All available Yggio devices
                            {
                                for (let index = 0; index < Object.keys(responseObj).length; index++)
                                {
                                    // this.dbg.l("fetchDevices, name: " + responseObj[index].name + ", _id: " + responseObj[index]._id);
                                    // this.dbg.l("fetchDevices, distance: " + responseObj[index].output.distance + ", amplitude: " + responseObj[index].output.amplitude);
                                    // this.dbg.l("fetchDevices, timestamp: " + (responseObj[index].forward?.port32?.timestamp ?? "value not present") + ", data: " + (Utilities.hexToStr(responseObj[index].forward?.port32?.data ?? "76616C7565206E6F742070726573656E74")));

                                    this.loraDeviceList.addDevOrUpdateIfPresent(responseObj[index]._id, 
                                                                                responseObj[index].name, 
                                                                                responseObj[index].timestamps?.distance ?? "value not present",
                                                                                responseObj[index].output?.distance ?? "value not present", 
                                                                                responseObj[index].timestamps?.amplitude ?? "value not present",
                                                                                responseObj[index].output?.amplitude ?? "value not present",
                                                                                responseObj[index].forward?.port32?.timestamp ?? "value not present",
                                                                                Utilities.hexToStr(responseObj[index].forward?.port32?.data ?? "76616C7565206E6F742070726573656E74"));
                                }
                            }
                            else
                            {
                                // this.dbg.l("fetchDevices, name: " + responseObj[index].name + ", _id: " + responseObj[index]._id);
                                // this.dbg.l("fetchDevices, distance: " + responseObj[index].output.distance + ", amplitude: " + responseObj[index].output.amplitude);
                                // this.dbg.l("fetchDevices, timestamp: " + (responseObj[index].forward?.port32?.timestamp ?? "value not present") + ", data: " + (Utilities.hexToStr(responseObj[index].forward?.port32?.data ?? "76616C7565206E6F742070726573656E74")));

                                this.loraDeviceList.addDevOrUpdateIfPresent(responseObj._id, 
                                                                            responseObj.name, 
                                                                            responseObj.timestamps?.distance ?? "value not present",
                                                                            responseObj.output?.distance ?? "value not present", 
                                                                            responseObj.timestamps?.amplitude ?? "value not present",
                                                                            responseObj.output?.amplitude ?? "value not present",
                                                                            responseObj.forward?.port32?.timestamp ?? "value not present",
                                                                            Utilities.hexToStr(responseObj.forward?.port32?.data ?? "76616C7565206E6F742070726573656E74"));
                            }

                            responseListener("", "Yggio devices successfully fetched");
                        }
                        else
                        {
                            this.dbg.e("fetchDevices, failed with unknown non json response");
                            responseListener("Fetching Yggio devices failed with unknown error", "");
                        }
                    }
                    else // error
                    {
                        this.dbg.e("fetchDevices, failed with error: " + error);
                        responseListener("Fetching Yggio devices failed with: " + error, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("fetchDevices, not authorized");
                responseListener("Yggio API not authorized", "");
            }
        }
        else // no Internet
        {
            this.dbg.w("fetchDevices, no internet connection");
            responseListener("No internet connection", "");
        }

    } // fetchDevices

    /**
     * Returns list of devices
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns list of devices
     *
     * @beta
     */
    public async getDeviceList() : Promise<Device[]>
    {
        return(this.loraDeviceList.get());

    } // getDeviceList

    /**
     * Returns specified device from device list
     *
     * @remarks
     * NA
     *
     * @param deviceId of device to be returned
     * @returns device or null if not found
     *
     * @beta
     */
    public getDevice(deviceId : string) : Device | null
    {
        return(this.loraDeviceList.getDevice(deviceId));

    } // getDevice

    /**
     * Saves chosen device identity
     *
     * @remarks
     * NA
     *
     * @param id to be saved
     * @returns -
     *
     * @beta
     */
    public setDeviceId(id : string) : void
    {
        this.chosenDeviceId = id;

    } // setDeviceId

    /**
     * Get chosen device identity
     *
     * @remarks
     * NA
     *
     * @param -
     * 
     * @returns earlier saved device identity
     *
     * @beta
     */
    public getDeviceId() : string
    {
        return(this.chosenDeviceId);

    } // getDeviceId

    /**
     * Checks if a device is chosen
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns true or false
     *
     * @beta
     */
    public deviceChosen() : boolean
    {
        // this.dbg.l("deviceChosen: "+ (this.chosenDeviceId !== ""));

        return(this.chosenDeviceId !== "");

    } // deviceChosen

    /**
     * Queues data in Yggio to be sent to device via LoRa
     *
     * @remarks
     * NA
     *
     * @param yggioDeviceId id of device
     * @param data to be queued / sent to device
     * 
     * @returns response or error via callback function
     *
     * @beta
     */
    public queueData(yggioDeviceId : string, data : string, responseListener : (error : string, response : string) => void) : void
    {
        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;
                this.queueDataBody.iotnodeId = yggioDeviceId;
                let hexData = Utilities.strToHex(data);
                this.dbg.l("queueData, command sent: "+ data + " / " + hexData);
                this.queueDataBody.data.data = hexData;

                this.httpSend(QUEUE_DATA_URL, QUEUE_METHOD, JSON.stringify(this.tokenHeaders), JSON.stringify(this.queueDataBody), (error : string, response: any, responseJson : string) =>
                {
                    if (!error)
                    {
                        this.dbg.l("queueData, Data succesfully queued");
                        responseListener("", "Yggio data succesfully queued");
                    }
                    else // error
                    {
                        this.dbg.e("queueData, failed with error: " + error);
                        responseListener("Yggio data queueing failed with: " + error, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("queueData, not authorized");
                responseListener("Yggio API not authorized", "");
            }
        }
        else // no Internet
        {
            this.dbg.w("queueData, no internet connection");
            responseListener("No internet connection", "");
        }

    } // queueData

    /**
     * Get queued data in Yggio (to be sent to device via LoRa)
     *
     * @remarks
     * NA
     *
     * @param yggioDeviceId id of device
     * @returns response or error via callback function
     *
     * @beta
     */
    public getQueuedData(yggioDeviceId : string, responseListener : (error : string, response : string) => void) : void
    {
        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;
                this.getQueueBody.iotnodeId = yggioDeviceId;

                this.dbg.l("getQueuedData, command sent ...");
                this.httpSend(GET_QUEUED_DATA_URL, QUEUE_METHOD, JSON.stringify(this.tokenHeaders), JSON.stringify(this.getQueueBody), (error : string, response: any, responseJson : string) =>
                {
                    if (!error)
                    {
                        if (responseJson)
                        {
                            this.dbg.l("getQueuedData, responseJson: " + responseJson);
                            // TODO, format of response?
                            responseListener("", "Yggio format of response?");
                        }
                        else
                        {
                            this.dbg.e("getQueuedData, failed with unknown non json response");
                            responseListener("Getting Yggio queued data failed with unknown error", "");
                        }
                    }
                    else // error
                    {
                        this.dbg.e("getQueuedData, failed with error: " + error);
                        responseListener("Getting Yggio queued data failed with: " + error, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("getQueuedData, not authorized");
                responseListener("Yggio API not authorized", "");
            }
        }
        else // no Internet
        {
            this.dbg.w("getQueuedData, no internet connection");
            responseListener("No internet connection", "");
        }

    } // getQueuedData

    /**
     * Flushes queued data in Yggio (to be sent to device via LoRa)
     *
     * @remarks
     * NA
     *
     * @param yggioDeviceId id of device
     * @returns response or error via callback function
     *
     * @beta
     */
    public flushQueuedData(yggioDeviceId : string, responseListener : (error : string, response : string) => void) : void
    {
        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;
                this.flushQueueBody.iotnodeId = yggioDeviceId;

                this.dbg.l("flushQueuedData, command sent ...");
                this.httpSend(FLUSH_QUEUED_DATA_URL, QUEUE_METHOD, JSON.stringify(this.tokenHeaders), JSON.stringify(this.flushQueueBody), (error : string, response: any, responseJson : string) =>
                {
                    if (!error)
                    {
                        this.dbg.l("flushQueuedData, Queued data succesfully flushed");
                        responseListener("", "Yggio quedued data succesfully flushed");
                    }
                    else // error
                    {
                        this.dbg.e("flushQueuedData, failed with error: " + error);
                        responseListener("Flushing Yggio queue failed with: " + error, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("flushQueuedData, not authorized");
                responseListener("Yggio API not authorized", "");
            }
        }
        else // no Internet
        {
            this.dbg.w("flushQueuedData, no internet connection");
            responseListener("No internet connection", "");
        }

    } // flushQueuedData

} // class Yggio