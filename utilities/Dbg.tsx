// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import { BLE_TAG } from "../ble/Ble";
import File from "./File";
import { YGGIO_TAG } from "../backend/Yggio";

/**
 * A simple debug component
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 * @public
 */

export interface DebugItem 
{
    id: Number
    message : string;
}

const LOG : string = "";
const WARN : string = "Warn, ";
const ERR : string = "Err, ";

/**
 * A debug class writing messages to the console and 
 * list / file for certain tags if configured so in 
 * listAndFileTag()
 * 
 * @public
 */
 export default class Dbg
 {
    private static startSeconds = 0;
    private static debugCounter = 0;
    private static debugList : DebugItem[] = [];
    private tag : string = "";
    private static file : File | null = null;

    constructor(tag : string) 
    { 
        this.tag = tag; 

        if (Dbg.file === null)
        {
            Dbg.startSeconds = new Date().getTime() / 1000;
            Dbg.file = new File();
            Dbg.file.appLogFileAppend("Logged tags: " + this.listAndFileTags());
        }

    } // constructor

    private listAndFileTag() : boolean
    {
        // TODO, change here and in listAndFileTags() depending on which 
        // tags should be listed and filed. Note, all tags are always written 
        // to the console
        return(this.tag === BLE_TAG || this.tag === YGGIO_TAG);
    }

    private listAndFileTags() : string
    {
        // TODO, change here and in listAndFileTag() depending on which 
        // tags should be listed and filed.
        return(BLE_TAG + ", " + YGGIO_TAG);
    }

    private x(msg : string, logType : string) : void
    {
        if (this.listAndFileTag())
        {
            let diffSeconds : Number = Math.round((new Date().getTime() / 1000) - Dbg.startSeconds);
            // console.log(this.tag + ", x, startSeconds: " + Dbg.startSeconds + ", diffSeconds: " + diffSeconds);

            // Add log message first in list
            // console.log(this.tag + ", x, length: " + msg.length + ", message: " + msg);
            Dbg.debugList.unshift({message : diffSeconds + "s, " + logType + this.tag + ", " + msg, id : Dbg.debugCounter++});

            // Add log message last in list
            // Dbg.debugList.push({message : diffSeconds + "s, " + logType + this.tag + ", " + msg, id : Dbg.debugCounter++});

            // Add log message last in file
            Dbg.file?.appLogFileAppend(diffSeconds + "s, " + logType + this.tag + ", " + msg);
        }

        if (logType === WARN)
        {
            console.warn(this.tag + ", " + msg);
        }
        else if (logType === ERR)
        {
            console.error(this.tag + ", " + msg);
        }
        else // LOG
        {
            console.log(this.tag + ", " + msg);
        }

    } // x

    /**
    * Logs information message at console, and in list 
    * and file if configured so in listAndFileTag()
    *
    * @remarks
    * NA
    *
    * @param message to be logged
    * @returns NA
    *
    * @beta
    */
    public l(msg : string) : void { this.x(msg, LOG); }

    /**
    * Logs warning message at console, and in list 
    * and file if configured so in listAndFileTag()
    *
    * @remarks
    * NA
    *
    * @param message to be logged
    * @returns NA
    *
    * @beta
    */
    public w(msg : string) : void { this.x(msg, WARN); }

    /**
    * Logs error message at console, and in list 
    * and file if configured so in listAndFileTag()
    *
    * @remarks
    * NA
    *
    * @param message to be logged
    * @returns NA
    *
    * @beta
    */
    public e(msg : string) : void { this.x(msg, ERR); }

    public getAppLogList() :  DebugItem[] { return(Dbg.debugList); }

    public clearAppLogList() : void { Dbg.debugList = []; }

    public getLogFile() : File | null { return(Dbg.file); }

 } // Dbg