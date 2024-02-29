// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import Dbg from "./utilities/Dbg";
import { AUTHORIZED_MODE, BLE_CHANNEL, UNSECURE_MODE, YGGIO_CHANNEL} from './App';
import Http from "./backend/Http";
import Server from "./backend/Server";
import Ble from "./ble/Ble";
import Yggio from "./backend/Yggio";
import BleHelper from "./ble/BleHelper";
import YggioHelper from "./backend/YggioHelper";
import Protocol from "./ble/Protocol";
import UIBuilder from "./userinterface/UIBuilder";
import { Alert } from "react-native";
import { Chart } from "./utilities/Chart";

const TAG : string = "AppHelper";
const INIT_CMD_REQ_TIME_OUT = 1000; // 1 second

/**
 * A help class for App management
 *
 * @remarks
 * -
 *
 * @packageDocumentation
 */
export default class AppHelper
{
    private static instance: AppHelper;
    private dbg : Dbg;
    private app : any;
    http : Http;
    devProt : Protocol;

    private constructor(app : any, http : Http) // singleton
    {
        this.dbg = new Dbg(TAG);

        this.dbg.l("Constructor");

        this.app = app;

        this.http = http;

        this.devProt = Protocol.getInstance();

    } // constructor

    public static getInstance(app : any, http: Http): AppHelper 
    {
        if (!this.instance) { this.instance = new AppHelper(app, http); }

        return(this.instance);

    } // getInstance

    /**
     * This method changes the channel from BLE to YGGIO,
     * or from Yggio to BLE
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns NA
     *
     * @beta
     */
    public changeChannel() : void
    {
        if (this.app.getCurrentChannel() === BLE_CHANNEL)
        {
            this.app.setCurrentChannel(YGGIO_CHANNEL);

            // setDisconnectState is called via BLE disconnection listener
            if (Ble.getInstance().bleDeviceConnected()) { BleHelper.getInstance(this.app, this.http).bleDisconnect(); }
        }
        else if (this.app.getCurrentChannel() === YGGIO_CHANNEL)
        {
            this.app.setCurrentChannel(BLE_CHANNEL);

            if (Yggio.getInstance().getDeviceId() != "") { this.setDisconnectState(Yggio.getInstance().getDeviceId()); }
        }
        else // error
        {
            this.dbg.e("changeChannel, unknown channel, set to BLE");
            this.app.setCurrentChannel(BLE_CHANNEL);
        }

    } // changeChannel

    /**
     * This returns a "change text" depending on
     * current channel
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns change text
     *
     * @beta
     */
    public channelChangeText() : string
    {
        if (this.app.getCurrentChannel() === BLE_CHANNEL)
        {
            return("Change to " + YGGIO_CHANNEL);
        }
        else if (this.app.getCurrentChannel() === YGGIO_CHANNEL)
        {
            return("Change to " + BLE_CHANNEL);
        }
        else // error
        {
            this.dbg.e("channelChangeText, unknown channel");
            return("Change to nknown channel");
        }

    } // channelChangeText

    /**
     * This method sends a message via "channel" to a SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param message data to be sent
     * @returns NA
     *
     * @beta
     */
    public sendMessage(message : string) : void
    {
        if (this.app.getCurrentChannel() === BLE_CHANNEL)
        {
            BleHelper.getInstance(this.app, this.http).bleSend(message);
        }
        else if (this.app.getCurrentChannel() === YGGIO_CHANNEL)
        {
            YggioHelper.getInstance(this.app, this.http).yggioSend(message);
        }
        else
        {
            this.dbg.e("sendMessage, message not sent, due to unknown channel");
        } 

    } // sendMessage

    /**
     * This method sends a set public key command to a SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns NA
     *
     * @beta
     */
    public sendSetPublicKey() : void
    {
        this.dbg.l("sendSetPublicKey");

        this.sendMessage(this.devProt.getSetPublicKeyCmd(this.app.getPublicKeyHex()));

    } // sendSetPublicKey

    /**
     * This test method sends a set public key command to a predefined MAC address / SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns NA
     *
     * @beta
     */
    // Only for test purpose - in production should public key already be set in device during provisioning
    public sendSetTestPublicKey() : void
    {
        if (Ble.getInstance().bleDeviceIdentity() === "E5:B4:ED:28:8D:E8") // (not LoRa device)
        {
            this.dbg.l("sendSetTestPublicKey, E5:B4:ED:28:8D:E8");
            this.sendMessage(this.devProt.getSetPublicKeyCmd("8e60b3d98f9a1bb5d250381e83f057b001c3ceb062dc2f952b73ebcaecfecad817829aa89503380f1bb8247f6f585a1c1448fb4fdb2095e3e3d21133e716a424"));
        }
        else if (Ble.getInstance().bleDeviceIdentity() === "EB:0E:D4:95:8C:3B") // (LoRA device)
        {
            this.dbg.l("sendSetTestPublicKey, EB:0E:D4:95:8C:3B (LoRA)");
            this.sendMessage(this.devProt.getSetPublicKeyCmd("63eb6db77e00ed1f64d248fbe585e59cdf4dcedd132e0bb3d718a43736cb54f1edd1a3cfd0c0d459e149316637d3b8850c268c0925e6cf480ce831e3830a181e"));
        }
        else
        {
            this.dbg.l("sendSetTestPublicKey, unknown device id: " + Ble.getInstance().bleDeviceIdentity() + " ,command not sent");
        }

    } // sendSetTestPublicKey

    /**
     * This method sends a remove public key command to a SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns NA
     *
     * @beta
     */
    public sendRemovePublicKey() : void
    {
        this.dbg.l("sendRemovePublicKey");

        this.sendMessage(this.devProt.getRemovePublicKeyCmd());

    } // sendRemovePublicKey

    /**
     * This method sends a "init" request commands via "channel" to a SweIoT device
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns NA
     *
     * @beta
     */
    public sendInitReqCmd() : void
    {
        if (this.app.getCurrentChannel() === BLE_CHANNEL)
        {    
            // Test if 'init commands request sent', necessary since this 
            // code section may be called several times in BLE mode
            if (!this.app.getInitCmdReqSent())
            {
                if (Ble.getInstance().bleDeviceConnected())
                {
                    this.app.setInitCmdReqSent(true);

                    // Make sure BLE is fully up and running before sending init command requests
                    setTimeout(() => 
                    { 
                        BleHelper.getInstance(this.app, this.http).bleSend(this.devProt.getSweIoTVerReqCmd()); 
                        
                        setTimeout(() => 
                        { 
                            BleHelper.getInstance(this.app, this.http).bleSend(this.devProt.getAccVerReqCmd()); 
                                                            
                            setTimeout(() => 
                            { 
                                BleHelper.getInstance(this.app, this.http).bleSend(this.devProt.getSetDbgModeOnCmd()); 

                                setTimeout(() => 
                                { 
                                    BleHelper.getInstance(this.app, this.http).bleSend(this.devProt.getSetClockCmd()); 

                                }, INIT_CMD_REQ_TIME_OUT / 2);

                            }, INIT_CMD_REQ_TIME_OUT / 2); 

                        }, INIT_CMD_REQ_TIME_OUT / 2); 

                    }, INIT_CMD_REQ_TIME_OUT); 

                } // if
            }
        }
        else if (this.app.getCurrentChannel() === YGGIO_CHANNEL)
        {
            this.dbg.l("sendInitReqCmd, sending init commands via Yggio");
            YggioHelper.getInstance(this.app, this.http).yggioSend(this.devProt.getSweIoTVerReqCmd());
            YggioHelper.getInstance(this.app, this.http).yggioSend(this.devProt.getAccVerReqCmd()); 
            YggioHelper.getInstance(this.app, this.http).yggioSend(this.devProt.getSetDbgModeOnCmd());
            YggioHelper.getInstance(this.app, this.http).yggioSend(this.devProt.getSetClockCmd());
        }
        else
        {
            this.dbg.e("sendInitReqCmd, init commands not sent, due to unknown channel");
        } 

    } // sendInitReqCmd

    /**
     * This method sends a data request command to a SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param configSetIndex defines the configurations set to be requested
     * @returns NA
     *
     * @beta
     */
    public sendDataReqCmd(configSetIndex : number) : void
    {
        let cmdPrefix = UIBuilder.getInstance().getReqCmdPrefix(configSetIndex);

        this.sendMessage(this.devProt.getDataReqCmd(cmdPrefix));

    } // sendDataReqCmd
  

    public sendSystemSettingsReq(cmd : string) : void {
        this.sendMessage(cmd);
        this.dbg.l("data: " + cmd);
    }

    /**
     * The method sends a data set command to a SweIoT devices
     *
     * @remarks
     * NA
     *
     * @param prefix stateing type of command
     * @param parListLength number of parameters to be set
     * @returns NA
     *
     * @beta
     */
    public sendDataSetParsCmd(prefix : string, parListLength : number)
    {
        let parList = this.app.getParTextListState();
        let cnfSetParCmd = this.devProt.getDataSetCmd(prefix, parList, parListLength);//här
        this.sendMessage(cnfSetParCmd);

    } // sendDataSetParsCmd

    public sendSystemDataSetParsCmd(prefix : string, parListLength : number)
    {
        let parList = this.app.getParTextListState();
        let cnfSetParCmd = this.devProt.getDataSetCmd(prefix, parList, parListLength);//här
        this.sendMessage(cnfSetParCmd);

    } // sendDataSetParsCmd

    /**
     * The method sets the software versions from json, SweIoT device and Acconer device
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns NA
     *
     * @beta
     */    
    public buildAndDisplayVersions() : void
    {
        this.app.setVersionsText("json: " + this.app.getJsonVersion() + 
                                 ", sweiot: " + this.app.getSweIoTVersion() + 
                                 ", acc: " + this.app.getAccVersion());

    } // buildAndDisplayVersions

    /**
     * Parses and manages the result from the device
     *
     * @remarks
     * NA
     *
     * @param result data or result from the device
     * @returns NA
     *
     * @beta
     */
    public mangageReceivedMessage(result : string) : void
    {
        if (this.devProt.isSweIoTVerReqAnsw(result))
        {
            this.app.setReceivedDataText(result);
            this.app.setSweIoTVersion(this.devProt.getSweIoTVerReqAnswDigits(result));
            this.buildAndDisplayVersions();
        }
        else if (this.devProt.isAccVerReqAnsw(result))
        {
            this.app.setReceivedDataText(result);
            this.app.setAccVersion(this.devProt.removeAccVerReqAnswPrefix(result));
            this.buildAndDisplayVersions();
        }
        else if (this.devProt.isDataReqAnsw(result))
        {
            this.app.setReceivedDataText(result);
            let confData : string[] = this.devProt.parseDataReqResult(this.devProt.removeDataReqAnswPrefix(result), this.app.getParListLength());
            this.app.setParTextListState(confData);
        }
        else if (this.devProt.isDataSetAnsw(result))
        {
            //Alert.alert("Parameter setting result OK ");
        } 
        else if (this.devProt.isCmdReqAnswOK(result) || this.devProt.isFactoryReqAnswOK(result))
        { // Fix to manage error in sweiot device protocol (factory answer)
            this.app.setReceivedDataText(result);
            //Alert.alert("Command result OK ");
        }
        else if (this.devProt.isCmdReqAnswNOK(result))
        {
            this.app.setReceivedDataText(result);
            Alert.alert("Command result NOT OK ");
        }
        else if (this.devProt.isMeasurementData(result))
        {
            this.app.setReceivedDataText(result);
            console.log(result);
            
            let measuredData : Array<object> = this.devProt.getMeasurmentData(result);
            //measuredData.push({"Measured data receptions": this.app.getAndIncreaseMeasuredDataCounter()})
            //measuredData.push({"Measured data receptions": this.app.getAndIncreaseMeasuredDataCounter()});
            //this.app.setMeasuredDataListLength(measuredData.push({"Measured data receptions": this.app.getAndIncreaseMeasuredDataCounter()}));
            this.app.setMeasurementDataList(measuredData);

            Chart.addData(this.devProt.getDistance(result), this.devProt.getAmplitude(result));
            this.app.forceUpdate();
        }
        else if (this.devProt.isDevLogFileData(result)) // TODO, reception of device debug file data ...
        {
            this.app.setReceivedDataText(result);
            this.dbg.getLogFile()?.devLogFileAppend(this.devProt.getDevLogFileData(result));
            }
        else
        {
            this.dbg.l("mangageReceivedMessage, unknown or debug data received: " + result);
        }

    } // mangageReceivedMessage

    /**
     * Resets the application's state when device is disconnected
     *
     * @remarks
     * NA
     *
     * @param deviceId device identity that was disconnected
     * @returns NA
     *
     * @beta
     */
    public setDisconnectState(deviceId : string) : void
    {
        this.dbg.l("setDisconnectState: " + this.app.getCurrentChannel() + " device " + deviceId + " disconnected / unchosen");
        this.app.setStatusText(this.app.getCurrentChannel() + " device " + deviceId + " disconnected / unchosen");

        if (this.app.getCurrentChannel() === YGGIO_CHANNEL)
        {
            Yggio.getInstance().setDeviceId("");
            this.app.forceUpdate();
        }

        this.app.setReceivedDataText("No data received ...");
        this.app.setSweIoTVersion("");
        this.app.setAccVersion("");
        this.buildAndDisplayVersions();

        this.app.setInitCmdReqSent(false);

        
        if (Server.getInstance().isAuthorized()) { this.app.setSecurityStatus(AUTHORIZED_MODE); }
        else { this.app.setSecurityStatus(UNSECURE_MODE); }

        this.app.setPublicKeyHex("no key received");
        
    } // setDisconnectState

} // class AppHelper