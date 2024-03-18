// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

/**
 * Various utility tools.
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 * @public
 */

import Dbg from "./Dbg";
import { Buffer } from 'buffer';

const UTILITIES_TAG = "Utilities";
export abstract class Utilities 
{       
    private static dbg : Dbg = new Dbg(UTILITIES_TAG); 

    /**
    * Converts base64 string to hex string
    *
    * @remarks
    * NA
    *
    * @param str base64 string to be converted
    * @returns returns hex string
    *
    * @beta
    */
    public static base64ToHex(str: string) : string
    {
        return(Buffer.from(str, 'base64').toString('hex'));

    } // base64ToHex

    /**
    * Converts string to hex string
    *
    * @remarks
    * NA
    *
    * @param str string to be converted
    * @returns returns hex string
    *
    * @beta
    */
    public static strToHex(str : string) : string  
    {
        let hexStr = "";

        for (var i = 0; i < str.length; i++) 
        {
            hexStr += str.charCodeAt(i).toString(16);
        }

        return(hexStr);

    } // strToHex


    public static getSplitStringCommaByIndex({inputString, index} : any) {
        if (inputString === undefined || inputString === null) {
            return "Unknown";
        }
        const words = inputString.split(',');
 
        if (index >= 0 && index < words.length) {
            const wordBeforeComma = words[index].trim();
            return wordBeforeComma;
        } else {
            return "Index out of range or invalid";
        }
    }

    /**
    * Removes 0x00 from string ...
    *
    * @remarks
    * NA
    *
    * @param str string to be checked
    * @returns returns "clean"" string
    *
    * @beta
    */
    public static remove0x00fromStr(str : string) : string  
    {
        if (!str) 
        { 
            console.log("remove0x00fromStr, parameter str is null, undefined or empty");
            return(""); 
        }
        
        let cleanStr = "";

        console.log("remove0x00fromStr, len: " + str.length + ", parameter str: " + str);

        for (var i = 0; i < str.length; i++) 
        {
            if (str.charCodeAt(i) === 0x00)
            {
                console.log("remove0x00fromStr, 0x00 found and removed!")
            }
            else
            {
                cleanStr += str.substring(i, i+1);
            }
        }

        console.log("remove0x00fromStr, len: " + cleanStr.length + ", clean str: " + cleanStr);

        return(cleanStr);

    } // remove0x00fromStr

    /**
    * Converts hex string to ascii string
    *
    * @remarks
    * NA
    *
    * @param hex hex string to be converted
    * @returns returns ascii string
    *
    * @beta
    */
    public static hexToStr(hex : string) : string 
    {
        let hexStr = hex.toString(); //force conversion
        let str = "";

        for (let i = 0; i < hexStr.length; i += 2)
        {
            str += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
        }

        return(str);

    } // hexToStr

    /**
    * Checks if string contains an integer
    *
    * @remarks
    * NA
    *
    * @param str to be checked
    * @returns true if an integer else false
    *
    * @beta
    */
    public static isInteger(str : string): boolean 
    {
        // TODO?, note Number() converts x.0, x.00 etc to x, ie consider those as integers
        let nr = Number(str);
        // Utilities.dbg.l("isInteger, nr: " + nr);

        if (!isNaN(nr))
        {
            return(Number.isInteger(nr));
        }

        return(false);

    } // isInteger

    /**
    * Checks if string contains a float (for now float or integer)
    *
    * @remarks
    * NA
    *
    * @param str to be checked
    * @returns true if a float (for now float or integer) else false
    *
    * @beta
    */
    public static isFloat(str : string): boolean 
    {
        // TODO?, note Number() converts x.0, x.00 etc to x, ie consider those as integers
        let nr = Number(str);

        // TODO?, to allow reasonable field edit possibilties both integers and float 
        // are allowed here, see commented lines below
        return(!isNaN(nr));

        /*
        if (!isNaN(nr))
        {
            return(!Number.isInteger(nr));
        }
        return(false);
        */

    } // isFloat

    /**
    * Checks if string contains a boolean
    *
    * @remarks
    * NA
    *
    * @param str to be checked
    * @returns true if a booelan else false
    *
    * @beta
    */
    public static isBoolean(str : string): boolean 
    {
        // TODO?, note Number() converts x.0, x.00 etc to x, ie consider those as integers
        let nr = Number(str);

        if (!isNaN(nr))
        {
            if (Number.isInteger(nr))
            {
                return(nr === 0 || nr === 1);
            }
        }

        return(false);
        
    } // isBoolean

} // class Utilities