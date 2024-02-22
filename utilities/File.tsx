// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';

/**
 * A class for debug file management
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 *  * @public
 */
const FILE_TAG : string = "FILE";

// TODO, file management only adapted to Android
export default class File
{
    private appLogFilePath : string;
    private appDownloadLogFilePath : string;
    private appFilePath : string;
    private devDownloadLogFilePath : string;

    public constructor()
    {
        console.log(FILE_TAG + ", " + "Constructor");

        if (Platform.OS != "android")
        {
            console.warn(FILE_TAG + ", " + "Constructor, file management currently only adapted to Android");
        }

        this.appLogFilePath = RNFS.DocumentDirectoryPath + "/dbglog.txt";
        this.appDownloadLogFilePath = RNFS.DownloadDirectoryPath + "/sweiot-app-dbglog-" + Date.now() + ".txt";
        this.appFilePath = this.appLogFilePath;

        this.devDownloadLogFilePath = RNFS.DownloadDirectoryPath + "/sweiot-dev-dbglog-" + Date.now() + ".txt";

        this.appLogFileDelete();
        this.appLogFileAppend("SweIoT app debug log, " + new Date().toLocaleString());

    } // constructor

    /**
    * Copies app log file in app's document directory to
    * download directory, and changes file path to
    * download directory for further append
    *
    * @remarks
    * -
    *
    * @param -
    * 
    * @returns -
    *
    * @beta
    */
    public appLogFileChangeToDownloadDir() : void
    {
        console.log(FILE_TAG + ", " + "appLogFileChangeToDownloadDir");
        this.appLogFileCopyToDownloadDir();
        this.appFilePath = this.appDownloadLogFilePath;

    } // appLogFileChangeToDownloadDir

    /**
    * Creates device log file in download directory
    *
    * @remarks
    * -
    *
    * @param -
    * 
    * @returns -
    *
    * @beta
    */
    public devLogFileCreate() : void
    {
        console.log(FILE_TAG + ", " + "devLogFileCreate");
        this.devLogFileAppend("SweIoT device debug log, " + new Date().toLocaleString());

    } // devLogFileCreate

    /**
    * Append text to app log file in app's document directory or
    * download directory depending on where file path points
    *
    * @remarks
    * -
    *
    * @param txt text to be written to file
    * 
    * @returns -
    *
    * @beta
    */
    public appLogFileAppend(txt : string) : void
    {
        RNFS.appendFile(this.appFilePath, txt + "\n", "utf8")
        .then(() => { /* console.log(FILE_TAG + ", " + "appLogFileAppend, success") */ })
        .catch((err : any) => console.error(FILE_TAG + ", " + "appLogFileAppend, error: " + err.message));

    } // appLogFileAppend

    /**
    * Append text to dev log file in download directory
    *
    * @remarks
    * -
    *
    * @param txt text to be written to file
    * 
    * @returns -
    *
    * @beta
    */
    public devLogFileAppend(txt : string) : void
    {
        RNFS.appendFile(this.devDownloadLogFilePath, txt + "\n", "utf8")
        .then(() => { /* console.log(FILE_TAG + ", " + "devLogFileAppend, success") */ })
        .catch((err : any) => console.error(FILE_TAG + ", " + "devLogFileAppend, error: " + err.message));

    } // devLogFileAppend

    /**
    * Read text from app log file in app's document directory
    *
    * @remarks
    * -
    *
    * @param txt text to be written to file
    * 
    * @returns -
    *
    * @beta
    */
    public appLogFileRead()
    {
        // Get a list of files and directories in the document directory
        RNFS.readDir(RNFS.DocumentDirectoryPath)
        .then((result : any) => 
        {
            for (let i = 0; i < result.length; i++)
            {
                // console.log(FILE_TAG + ", " + "appLogFileRead, result path: " + result[i].path);

                if (result[i].path === this.appLogFilePath)
                { 
                    return(Promise.all([RNFS.stat(result[i].path), result[i].path]));
                }
            }

            return(Promise.all([RNFS.stat(result[0].path), result[0].path]));
        })
        .then((statResult : any) => 
        {
            // console.log(FILE_TAG + ", " + "appLogFileRead, statResult: " + statResult[0].path);

            if (statResult[0].isFile()) 
            {
                // if we have a file, read it
                // console.log(FILE_TAG + ", " + "appLogFileRead, statResult: file found");
                return(RNFS.readFile(statResult[0].path, "utf8"));
            }

            console.log(FILE_TAG + ", " + "appLogFileRead, statResult: file not found");
            return("File not found");
        })
        .then((content : any) => 
        {
            // console.log(FILE_TAG + ", " + "appLogFileRead, content: " + content);
        })
        .catch((err : any) => 
        {
            console.error(FILE_TAG + ", " + "appLogFileRead, error: " + err.message + ", " + err.code);
        });

    } // appLogFileRead

    /**
    * Copy app log file from app's document directory to download directory
    *
    * @remarks
    * -
    *
    * @param -
    * 
    * @returns -
    *
    * @beta
    */
    private appLogFileCopyToDownloadDir()
    {
        RNFS.copyFile(this.appLogFilePath, this.appDownloadLogFilePath)
        .then(() => { console.log(FILE_TAG + ", " + "appLogFileCopyToDownloadDir, success") })
        .catch((err : any) => console.error(FILE_TAG + ", " + "appLogFileCopyToDownloadDir, error: " + err.message));

    } // appLogFileCopyToDownloadDir

    /**
    * Delete app log file from app's document directory
    *
    * @remarks
    * -
    *
    * @param -
    * 
    * @returns -
    *
    * @beta
    */
    public appLogFileDelete()
    {
        return(RNFS.unlink(this.appLogFilePath)
            .then(() => 
            {
                // console.log(FILE_TAG + ", " + "appLogFileDelete, success");
            })
            .catch((err : any) => 
            {
                // Normally means file not found
                console.log(FILE_TAG + ", " + "appLogFileDelete, error: " + err.message);
            }));

    } // appLogFileDelete

} // class File



