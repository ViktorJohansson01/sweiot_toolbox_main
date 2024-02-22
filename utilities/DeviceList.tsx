// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import App from "../App";
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
 export interface Device 
 {
   id : string;
   name : string;
   rssi : number | null;
   distanceTime : string;
   distance : string;
   amplitudeTime : string;
   amplitude : string;
   uartTime : string;
   uartData : string;
 }

 const DEVICE_LIST_TAG = "DeviceList";

/**
 * A class managing a list of devices used to display 
 * devices found during bluetooth, yggio/lora or other 
 * communication
 */
export default class DeviceList
{
  
    private dbg : Dbg; 

    private app: App;
    private static instance: DeviceList;
    private static list: Array<Device>;
    private constructor(app : any) {
        this.dbg = new Dbg(DEVICE_LIST_TAG);
        // this.dbg.l("Constructor");
        this.app = app;
        
    }

    public static getInstance(app: any, list:any): DeviceList {
        if (!DeviceList.instance) {
            DeviceList.instance = new DeviceList(app);
            this.list = list;
            
        }

        return DeviceList.instance;
    }
   
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
    public isAlreadyPresent(deviceId : string) : boolean
    {
        let list = this.app.getDeviceListArray();
        for (let i = 0; i < list.length; i++)
        {
            if (list[i].id === deviceId) { return(true); }
        }

        return(false);
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
    public addDevIfNotPresent(deviceId : string, 
                              deviceName : string | null,
                              rssi : number | null,
                              distanceTime : string = "", 
                              distance : string = "",
                              amplitudeTime : string = "",
                              amplitude : string = "",
                              uartTime : string = "",
                              uartData : string = "") : boolean
    {
        let list = this.app.getDeviceListArray();
        for (let i = 0; i < list.length; i++)
        {
            
            if (list[i].id === deviceId) { return(false); }
        }
        
        if (!deviceName) { deviceName = deviceId; }
        // this.dbg.l("addIfNotAlreadyPresent, Device added to list: " + deviceId);
        // this.dbg.l("addIfNotAlreadyPresent, distance: " + distance + ", amplitude: " + amplitude + ", uartTime: " + uartTime + ", uartData: " + uartData);
        this.app.setAddDevice({id : deviceId, name : deviceName, rssi : rssi, distanceTime : distanceTime, distance : distance, amplitudeTime : amplitudeTime, amplitude : amplitude, uartTime : uartTime, uartData : uartData});

        return(true);
        
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
    public addDevOrUpdateIfPresent(deviceId : string, 
                                   deviceName : string | null, 
                                   rssi : number | null,
                                   distanceTime : string = "", 
                                   distance : string = "",
                                   amplitudeTime : string = "",
                                   amplitude : string = "",
                                   uartTime : string = "",
                                   uartData : string = "") : boolean
    {
        let list = this.app.getDeviceListArray();
        if (!deviceName) { deviceName = deviceId; }
        
        
        for (let i = 0; i < list.length; i++)
        {
            if (list[i].id === deviceId) 
            { 
                // this.dbg.l("addDevOrUpdateIfPresent, Device updated in list: " + deviceId);
                // this.dbg.l("addDevOrUpdateIfPresent, update device, distanceTime: " + distanceTime + ", distance: " + distance + ", amplitudeTime: " + amplitudeTime + ", amplitude: " + amplitude + ", uartTime: " + uartTime + ", uartData: " + uartData);
                
                list[i].name = deviceName;
                list[i].distanceTime = distanceTime;
                list[i].rssi = rssi;
                list[i].distance = distance;
                list[i].amplitudeTime = amplitudeTime;
                list[i].amplitude = amplitude;
                list[i].uartTime = uartTime;
                list[i].uartData = uartData;

                return(false); 
            }
        }

        // this.dbg.l("addDevOrUpdateIfPresent, Device added to list: " + deviceId);
        // this.dbg.l("addDevOrUpdateIfPresent, added device, distanceTime: " + distanceTime + ", distance: " + distance + ", amplitudeTime: " + amplitudeTime + ", amplitude: " + amplitude + ", uartTime: " + uartTime + ", uartData: " + uartData);
        this.app.setAddDevice({id : deviceId, name : deviceName, rssi : rssi, distanceTime : distanceTime, distance : distance, amplitudeTime : amplitudeTime, amplitude : amplitude, uartTime : uartTime, uartData : uartData});
        
        return(true);

    } // addDevOrUpdateIfPresent

    public get() :  Array<Device> { return(DeviceList.list); }

    public getDevice(deviceId : string) : Device | null
    {
        
     
        const list = DeviceList.list;
        
        for (let i = 0; i < list.length; i++)
        {
            if (list[i].id === deviceId) 
            { 
                
                return(list[i]); 
            }
        }
        return(null);
    }

    public clear() : void { this.app.clearDeviceArray() }

} // DeviceList
