// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

/**
 * Protocol for configuration communication with SweIoT 
 * devices via bluetooth, LoRa and other means.
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 * @public
 */

import Dbg from '../utilities/Dbg';
import { Utilities } from "../utilities/Utilities";

const PROTOCOL_TAG = "Protocol";

const SWEIOT_VER_REQ: string = "version?";
const SWEIOT_VER_REQ_ANSW: string = "=version?"; // followed by version ...
const SWEIOT_VER_REQ_ANSW_PREFIX: string = SWEIOT_VER_REQ_ANSW;

const ACC_VER_REQ: string = "acc_ver?";
const ACC_VER_REQ_ANSW: string = "=acc_ver?"; // followed by version ...
const ACC_VER_REQ_ANSW_PREFIX: string = ACC_VER_REQ_ANSW;

const SYS_DATA_REQ_CMD: string = "sys";

const DATA_REQ_CMD_POSTFIX: string = ":?";

const CMD_MIDFIX1: string = "?";
const CMD_MIDFIX2: string = ":";
const DATA_SEPARATOR: string = ",";

const CMD_REQ_ANSW_OK_CHAR: string = "=";
const CMD_REQ_ANSW_OK: string = ":OK";
const CMD_REQ_ANSW_NOK_CHAR: string = "*";

const FACTORY_REQ_ANSW_OK = "=factory?OK"; // error in device protocol

const MEASUREMENT_DATA: string = "Measured:";
const DISTANCE_TEXT: string = " dist: ";
const DISTANCE_MULTIPLICATOR = 1000; // From meter to millimeter

const SET_PUBLIC_KEY_CMD: string = "key:";
const REMOVE_PUBLIC_KEY_CMD: string = "rm_key";
const REMOVE_PUBLIC_KEY_ANSW_OK: string = "=rm_key?OK"; // error in device protocol

const SET_DBG_MODE_ON_CMD: string = "deb_log:1";
const SET_DBG_MODE_OFF_CMD: string = "deb_log:0";

const SET_CLOCK_CMD: string = "set_clk:";

const DEV_LOG_REQ_CMD: string = "cat_log";
const DEV_LOG_REQ_ANSW: string = "cat_log?OK"; // End of file ...

export default class Protocol {
    private static instance: Protocol;
    private dbg: Dbg;

    private constructor() { this.dbg = new Dbg(PROTOCOL_TAG); } // singleton constructor

    /**
    * Gets the instance of the Protocol
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns instande of protocol
    *
    * @beta
    */
    public static getInstance(): Protocol {
        if (!this.instance) {
            this.instance = new Protocol();
        }

        return (this.instance);

    } // bleGetInstance

    /**
     * Returns set public key command
     *
     * @remarks
     * NA
     *
     * @param pubKey string containing public key
     * @returns set public key command
     *
     * @beta
     */
    public getSetPublicKeyCmd(pubKey: string): string {
        return (SET_PUBLIC_KEY_CMD + pubKey);

    } // getSetPublicKeyCmd

    /**
     * Returns remove public key command
     *
     * @remarks
     * NA
     *
     * @param -
     * @returns remove public key command
     *
     * @beta
     */
    public getRemovePublicKeyCmd(): string {
        return (REMOVE_PUBLIC_KEY_CMD);

    } // getRemovePublicKeyCmd

    /**
     * Check if set public key command
     *
     * @remarks
     * NA
     *
     * @param msg string containing command
     * @returns true or false
     *
     * @beta
     */
    public isSetPublicKeyCmd(cmd: string): boolean {
        if (cmd != null) {
            if (cmd.length >= SET_PUBLIC_KEY_CMD.length) {
                return (cmd.substring(0, SET_PUBLIC_KEY_CMD.length) === SET_PUBLIC_KEY_CMD);
            }
        }
        return (false);

    } // isSetPublicKeyCmd

    /**
     * Check if remove public key command
     *
     * @remarks
     * NA
     *
     * @param msg string containing command
     * @returns true or false
     *
     * @beta
     */
    public isRemovePublicKeyCmd(cmd: string): boolean {
        if (cmd != null) {
            if (cmd.length >= REMOVE_PUBLIC_KEY_CMD.length) {
                return (cmd.substring(0, REMOVE_PUBLIC_KEY_CMD.length) === REMOVE_PUBLIC_KEY_CMD);
            }
        }
        return (false);

    } // isRemovePublicKeyCmd

    /**
     * Returns set debug mode on command
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns set debug mode on command
     *
     * @beta
     */
    public getSetDbgModeOnCmd(): string {
        return (SET_DBG_MODE_ON_CMD);

    } // getSetDbgModeOnCmd

    /**
     * Returns set debug mode off command
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns set debug mode off command
     *
     * @beta
     */
    public getSetDbgModeOffCmd(): string {
        return (SET_DBG_MODE_OFF_CMD);

    } // getSetDbgModeOffCmd

    /**
     * Returns set clock command
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns set clock command
     *
     * @beta
     */
    public getSetClockCmd(): string {
        return (SET_CLOCK_CMD + (Date.now() / 1000));

    } // getSetClockCmd

    /**
     * Returns debug log request command
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns debug log request command
     *
     * @beta
     */
    public getDevLogReqCmd(): string {
        return (DEV_LOG_REQ_CMD);

    } // getDevLogReqCmd

    /**
     * Returns SweIoT version request command
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns version request command
     *
     * @beta
     */
    public getSweIoTVerReqCmd(): string {
        return (SWEIOT_VER_REQ);

    } // getSweIoTVerReqCmd

    /**
     * Checks if SweIoT version request answer
     *
     * @remarks
     * NA
     *
     * @param version string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isSweIoTVerReqAnsw(version: string): boolean {
        if (version != null) {
            if (version.length >= SWEIOT_VER_REQ_ANSW.length) {
                return (version.substring(0, SWEIOT_VER_REQ_ANSW.length) === SWEIOT_VER_REQ_ANSW);
            }
        }
        return (false);

    } // isSweIoTVerReqAnsw

    /**
     * Removes SweIoT version command prefix
     *
     * @remarks
     * NA
     *
     * @param version string containing version
     * @returns string with removed prefix or empty string
     *
     * @beta
     */
    public removeSweIoTVerReqAnswPrefix(version: string): string {
        if (this.isSweIoTVerReqAnsw(version)) {
            return (version.substring(SWEIOT_VER_REQ_ANSW_PREFIX.length));
        }
        else {
            return ("");
        }

    } // removeSweIoTVerReqAnswPrefix

    /**
     * Gets the actual SweIoT version "digits"
     *
     * @remarks
     * NA
     *
     * @param version string containing version
     * @returns string version "digits" or empty string
     *
     * @beta
     */
    public getSweIoTVerReqAnswDigits(version: string): string {
        if (this.isSweIoTVerReqAnsw(version)) {
            return (version.substring(SWEIOT_VER_REQ_ANSW_PREFIX.length).split(" ")[0]);
        }
        else {
            return ("");
        }

    } // getSweIoTVerReqAnswDigits

    /**
     * Returns Acconer version request command
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns version request command
     *
     * @beta
     */
    public getAccVerReqCmd(): string {
        return (ACC_VER_REQ);

    } // getAccVerReqCmd

    /**
     * Checks if Acconer version request answer
     *
     * @remarks
     * NA
     *
     * @param version string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isAccVerReqAnsw(version: string): boolean {
        if (version != null) {
            if (version.length >= ACC_VER_REQ_ANSW.length) {
                return (version.substring(0, ACC_VER_REQ_ANSW.length) === ACC_VER_REQ_ANSW);
            }
        }
        return (false);

    } // isAccVerReqAnsw

    /**
     * Removes Acconer version command prefix
     *
     * @remarks
     * NA
     *
     * @param version string containing version
     * @returns string with removed prefix or empty string
     *
     * @beta
     */
    public removeAccVerReqAnswPrefix(version: string): string {
        if (this.isAccVerReqAnsw(version)) {
            return (version.substring(ACC_VER_REQ_ANSW_PREFIX.length));
        }
        else {
            return ("");
        }

    } // removeAccVerReqAnswPrefix

    /**
     * Checks if command request was OK, ie
     * starts with CMD_REQ_ANSW_OK_CHAR and
     * contains CMD_REQ_ANSW_OK
     *
     * @remarks
     * NA
     *
     * @param result string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isCmdReqAnswOK(result: string): boolean {
        if (result != null) {
            if (result.length >= CMD_REQ_ANSW_OK_CHAR.length) {
                if (result.substring(0, CMD_REQ_ANSW_OK_CHAR.length) === CMD_REQ_ANSW_OK_CHAR) {
                    return (result.includes(CMD_REQ_ANSW_OK));
                }
            }
        }
        return (false);

    } // isCmdReqAnswOK

    /**
     * Checks if factory request was OK
     *
     * @remarks
     * NA
     *
     * @param result string to be checked
     * @returns true or false
     *
     * @beta
     */
    // Fix to manage error in sweiot unit's protocol (factory answer)
    public isFactoryReqAnswOK(result: string): boolean {
        if (result != null) {
            if (result.length >= FACTORY_REQ_ANSW_OK.length) {
                return ((result.substring(0, FACTORY_REQ_ANSW_OK.length) === FACTORY_REQ_ANSW_OK));
            }
        }
        return (false);

    } // isFactoryReqAnswOK

    /**
     * Checks if command request was NOT OK, ie
     * starts with CMD_REQ_ANSW_NOK_CHAR
     *
     * @remarks
     * NA
     *
     * @param result string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isCmdReqAnswNOK(result: string): boolean {
        if (result != null) {
            if (result.length >= CMD_REQ_ANSW_NOK_CHAR.length) {
                return (result.substring(0, CMD_REQ_ANSW_NOK_CHAR.length) === CMD_REQ_ANSW_NOK_CHAR);
            }
        }
        return (false);

    } // isCmdReqAnswNOK

    /**
     * Checks if data request answer
     *
     * @remarks
     * NA
     *
     * @param data string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isDataReqAnsw(data: string): boolean {
        if (data != null) {
            if (data.length >= CMD_REQ_ANSW_OK_CHAR.length) {
                if (data.substring(0, CMD_REQ_ANSW_OK_CHAR.length) === CMD_REQ_ANSW_OK_CHAR) {
                    let cmd: string[] = data.substring(CMD_REQ_ANSW_OK_CHAR.length).split(CMD_MIDFIX1);

                    if (cmd[0] === SYS_DATA_REQ_CMD || Utilities.isInteger(cmd[0])) {
                        return (true); // =sys? or =n? (where n is any number of digits)
                    }
                }
            }
        }

        return (false);

    } // isDataReqAnsw

    /**
     * Removes data reqeust answer prefix
     *
     * @remarks
     * NA
     *
     * @param data string containing data
     * @returns string with removed prefix or empty string
     *
     * @beta
     */
    public removeDataReqAnswPrefix(data: string): string {
        if (this.isDataReqAnsw(data)) {
            let reqData: string[] = data.substring(CMD_REQ_ANSW_OK_CHAR.length).split(CMD_MIDFIX1);
            return (reqData[1]);
        }
        else {
            return ("");
        }

    } // removeDataReqAnswPrefix

    /**
     * Returns data request command, ie adds DATA_REQ_CMD_POSTFIX to 
     * type.
     *
     * @remarks
     * NA
     *
     * @param type string to be sent as a command
     * @returns data request command
     *
     * @beta
     */
    public getDataReqCmd(type: string): string {
        return (type + DATA_REQ_CMD_POSTFIX);

    } // getDataReqCmd

    /**
     * Returns data request data in string array
     *
     * @remarks
     * NA
     *
     * @param result string to be parsed
     * @returns string array with data
     * type
     *
     * @beta
     */
    public parseDataReqResult(result: string, maxLength: number): string[] {
        let parsedResult: string[] = result.split(DATA_SEPARATOR, maxLength);

        // this.dbg.l("parseReqData: " + parsedResult);

        return (parsedResult);

    } // parseDataReqResult

    /**
     * Checks if data set answer
     *
     * @remarks
     * NA
     *
     * @param data string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isDataSetAnsw(data: string): boolean {
        if (data != null) {
            if (data.length >= CMD_REQ_ANSW_OK_CHAR.length) {
                if (data.substring(0, CMD_REQ_ANSW_OK_CHAR.length) === CMD_REQ_ANSW_OK_CHAR) {
                    let cmd: string[] = data.substring(CMD_REQ_ANSW_OK_CHAR.length).split(CMD_MIDFIX2);

                    if (cmd[0] === SYS_DATA_REQ_CMD || Utilities.isInteger(cmd[0])) {
                        return (true); // =sys: or =n: (where n is any number of digits)
                    }
                }
            }
        }

        return (false);

    } // isDataSetAnsw

    /**
     * Returns data set command
     *
     * @remarks
     * NA
     *
     * @param prefix string with type of command
     * @param parList string array with parameters to be set
     * @param parListLength number of parameters to be set
     * 
     * @returns data set command
     *
     * @beta
     */
    public getDataSetCmd(preFix: string, parList: string[], parListLength: number): string {
        let command = preFix + CMD_MIDFIX2;

        for (let i = 0; i < parListLength; i++) {
            if (i == (parListLength - 1)) {
                // NOTE, this is a fix since 0x00 is present in responses from devices, now instead checked
                // when all messages are received
                // command += (Utilities.remove0x00fromStr(parList[i])); // last parameter
                command += (parList[i]); // last parameter
            }
            else {
                command += (parList[i] + DATA_SEPARATOR);
            }
        }

        // this.dbg.l("getCnfSetCmd, command: " + command);

        return (command);

    } // getDataSetCmd


    /**
     * Checks if this is measurement data 
     *
     * @remarks
     * NA
     *
     * @param data string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isMeasurementData(data: string): boolean {
        if (data != null) {
            if (data.length >= MEASUREMENT_DATA.length) {
                return (data.substring(0, MEASUREMENT_DATA.length) === MEASUREMENT_DATA);
            }
        }
        return (false);

    } // isMeasurementData

    /**
     * Parses data string for measurment data
     *
     * @remarks
     * NA
     *
     * @param data string to be parsed
     * @returns vector with string containing measurement data or empty string
     *
     * @beta
     */

    

    public getMeasurmentData(data: string): Array<object> {
        let measuredData: Array<object> = new Array;

        if (this.isMeasurementData(data)) {
            // Measured: dist: 0.00, ampl: 0, occupied: 0, volt/batt: 3.504v (2), temp: 22.0, minor: 0016, major: 4000
            //measuredData = data.substring(MEASUREMENT_DATA.length).split(DATA_SEPARATOR);
            //measuredData[0] = DISTANCE_TEXT + this.getDistance(data); // multiply distance with DISTANCE_MULTIPLICATOR
            // this.dbg.l("getMeasurmentData, measuredData[0]: " + measuredData[0]);
            // Replace commas with semicolons and remove parentheses to make it a valid JSON string
            const measuredDataString = data.split("Measured: ")[1];
          
                const keyValuePairs = measuredDataString.split(', ');

                measuredData = keyValuePairs.map(pair => {
                    const [key, rawValue] = pair.split(':');
                    const value = rawValue ? rawValue.trim() : '';
                    let variable;
                    if (key === 'volt/batt') {
                        variable = 'volt';
                    } else {
                      variable = key.trim();
                    }
                    return { variable: variable.charAt(0).toUpperCase() + variable.slice(1), value };
                });
          
        }
       

        return (measuredData);

    } // getMeasurmentData

    /**
     * Parses data string for distance data
     *
     * @remarks
     * NA
     *
     * @param data string to be parsed
     * @returns string with distance data, or empty string
     *
     * @beta
     */
    public getDistance(data: string): string {
        let distance: string = "";

        if (this.isMeasurementData(data)) {
            // Measured: dist: 0.00, ampl: 0, occupied: 0, volt/batt: 3.504v (2), temp: 22.0, minor: 0016, major: 4000
            distance = data.substring(MEASUREMENT_DATA.length).split(DATA_SEPARATOR)[0].substring(1).split(CMD_MIDFIX2)[1].substring(1);
            distance = (Number(distance) * DISTANCE_MULTIPLICATOR).toString();
        }

        return (distance);

    } // getDistance

    /**
     * Parses data string for amplitude data
     *
     * @remarks
     * NA
     *
     * @param data string to be parsed
     * @returns string with amplitude data, or empty string
     *
     * @beta
     */
    public getAmplitude(data: string): string {
        let amplitude: string = "";

        if (this.isMeasurementData(data)) {
            // Measured: dist: 0.00, ampl: 0, occupied: 0, volt/batt: 3.504v (2), temp: 22.0, minor: 0016, major: 4000
            amplitude = data.substring(MEASUREMENT_DATA.length).split(DATA_SEPARATOR)[1].substring(1).split(CMD_MIDFIX2)[1].substring(1);
        }

        return (amplitude);

    } // getAmplitude

    /**
     * Parses data string for occupied data
     *
     * @remarks
     * NA
     *
     * @param data string to be parsed
     * @returns string with occupied data, or empty string
     *
     * @beta
     */
    public getOccupied(data: string): string {
        let occupied: string = "";

        if (this.isMeasurementData(data)) {
            // Measured: dist: 0.00, ampl: 0, occupied: 0, volt/batt: 3.504v (2), temp: 22.0, minor: 0016, major: 4000
            occupied = data.substring(MEASUREMENT_DATA.length).split(DATA_SEPARATOR)[2].substring(1).split(CMD_MIDFIX2)[1].substring(1);
        }

        return (occupied);

    } // getOccupied

    /**
     * Checks if this is device log file data 
     *
     * @remarks
     * NA
     *
     * @param data string to be checked
     * @returns true or false
     *
     * @beta
     */
    public isDevLogFileData(data: string): boolean {
        return (false); // TODO

    } // isDevLogFileData

    /**
     * Parses data string for device log file data
     *
     * @remarks
     * NA
     *
     * @param data string to be parsed
     * @returns string containing measurement data or empty string
     *
     * @beta
     */
    public getDevLogFileData(data: string): string {
        let devLogFileData: string = "";

        if (this.isDevLogFileData(data)) {
            devLogFileData = data; // TODO
        }

        return (devLogFileData);

    } // getDevLogFileData

    /**
     * Checks if first character in a string is a number
     *
     * @remarks
     * NA
     *
     * @param result string to be examined
     * @returns true if number else false
     *
     * @beta
     */
    public isFirstCharNo(result: string): boolean {
        return (result.charCodeAt(0) >= 48 && result.charCodeAt(0) <= 57);

    } // isFirstCharNo

    /**
     * Checks if first character is 'd'
     *
     * @remarks
     * NA
     *
     * @param result string to be examined
     * @returns true or false
     *
     * @beta
     */
    public isHeartbeat(result: string): boolean {
        return (result.charCodeAt(0) == 100 /* 'd' */);

    } // isHeartbeat

} // Protocol