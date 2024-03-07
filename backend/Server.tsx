// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

/**
 * This module implements the SweIoT Device Mgmt API
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 * @public
 */
import Dbg from "../utilities/Dbg";
import Http from "./Http";

export const SERVER_TAG = "Server";

// When running on DEVELOPMENT EMULATOR
// const SERVER_BASE_URL = "http://10.0.2.2:8000";

// When running on LOCAL HOST
// const SERVER_BASE_URL = "localhost:8000";
// const SERVER_BASE_URL = "http://127.0.0.1:8000";

// When running LOCALHOST from PHONE ON SAME WIFI
// MACs IP number when running from phone on same WiFi (note unicorn must be set to listen to 0.0.0.0 in backend)
// NOTE, IP address needs to be cheked for current WiFi, and port changed to 80?
// const SERVER_BASE_URL = "http://192.168.68.60:8000";

// When running SweIoT TEST ENVIRONMENT on Azure
//const SERVER_BASE_URL = "https://testsweiot.mithings.org";
const SERVER_BASE_URL = "https://testsweiot.mithings.org";
// When running SweIoT PRODUCTION ENVIRONMENT on Azure
// const SERVER_BASE_URL = "http://20.91.188.140";
// const SERVER_BASE_URL = "https://sweiot.se";

const AUTHORIZATION_URL = SERVER_BASE_URL + "/login/";
const AUTHORIZATION_METHOD = "POST";

const GET_PRIVATE_KEY_URL_1 = SERVER_BASE_URL + "/users/";
const GET_PRIVATE_KEY_URL_2 = "/devices/";
const GET_PRIVATE_KEY_URL_3 = "/keys/public";
const GET_PRIVATE_KEY_METHOD = "GET";

const OWNS_DEV_URL_1 = SERVER_BASE_URL + "/users/";
const OWNS_DEV_URL_2 = "/devices/";
const OWNS_DEV_URL_3 = "/own/";
const OWNS_DEV_METHOD = "GET";

const SEC_DEV_URL_1 = SERVER_BASE_URL + "/users/";
const SEC_DEV_URL_2 = "/devices/";
const SEC_DEV_URL_3 = "/secure/";
const SEC_DEV_METHOD = "GET";

const SIGN_MSG_URL_1 = SERVER_BASE_URL + "/users/";
const SIGN_MSG_URL_2 = "/devices/";
const SIGN_MSG_URL_3 = "/sign/";
const SIGN_MSG_METHOD = "POST";


const BEARER = "Bearer ";

export default class Server extends Http
{
    public static NOT_AUTHORIZED : string = "SweIoT Server API not authorized";

    private static instance: Server;
    private dbg : Dbg;
    private userName : string = "";
    private authorizationToken : string = ""; 

    // Content-Type: application/x-www-form-urlencoded

    private authorizationHeaders =
    {
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    private tokenHeaders =
    {
        Accept: 'application/json', 
        'Content-Type': 'application/json', 
        Authorization: "Bearer token"
    };

    private constructor() // singleton
    {
        super();

        this.dbg = new Dbg(SERVER_TAG);

        // this.dbg.l("Constructor");

    } // constructor

    /**
     * Gets the instance of the Server service (singleton)
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns instance of the service
     *
     * @beta
     */
    public static getInstance(): Server 
    {
        if (!this.instance) 
        {
            this.instance = new Server();
        }

        return(this.instance);

    } // getInstance

    /**
     * Check if authorized
     *
     * @remarks
     * NA
     * 
     * @returns response or error via callback function
     *
     * @beta
     */
    public isAuthorized() : boolean
    {
        return(this.authorizationToken !== "");

    } // isAuthorized

    /**
     * Authorize the user towards the Server
     *
     * @remarks
     * NA
     * 
     * @param userName string with user name
     * @param userPassword string with user password
     * @returns response or error via callback function
     *
     * @beta
     */
    public authorize(userName : string, userPassword : string, responseListener : (error : string, response : any, responseJson: string) => void) : void
    {
        this.userName = userName;

        this.authorizationToken = "";

        if (this.httpIsConnected())
        {
            let authorizationBody = JSON.stringify({ "user_name": userName, "user_password": userPassword });

            this.dbg.l("authorize, command sent, user_name: " + userName + ", user_password: " + userPassword);
            this.dbg.l("authorize, command sent, url: " + AUTHORIZATION_URL);

            this.httpSend(AUTHORIZATION_URL, AUTHORIZATION_METHOD, null, authorizationBody, (error : string, response: any, responseJson : string) =>
            {
                if (!error)
                {
                    if (responseJson)
                    {
                        // console.log("authorize, succesful, responseJson: ", responseJson);
                        // console.log("authorize, succesful, JSON.parse(responseJson): ", JSON.parse(responseJson));
                        this.authorizationToken = JSON.parse(responseJson).jwt;
                        this.dbg.l("authorize, successful");
                        // this.dbg.l("authorize, succesful, authorizationToken: " + this.authorizationToken);
                        responseListener("", response, "Server authorization successful");
                    }
                    else
                    {
                        this.dbg.e("authorize, failed with unknown non json response" + response);
                        console.log("authorize, failed with unknown non json response" + response);
                        
                        responseListener("Server authorization failed with unknown error", response, "");
                    }
                }
                else // error
                {

                    this.dbg.e("authorize, failed with error: " + error);
                    responseListener("Server authorization failed. ", response, "");
                }
        
            }); // httpSend
        }
        else // no Internet
        {
            this.dbg.w("authorize, no internet connection");
            responseListener("No internet connection", null, "");
        }

    } // authorize

    /**
     * Get public key from the Server for a given user id and device id
     *
     * @remarks
     * NA
     * 
     * @param deviceId string with device identity
     * @returns response or error via callback function
     *
     * @beta
     */
    public getPublicKey(deviceId : string, responseListener : (error : string, response : any, responseJson: string) => void) : void
    {
        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                let getPublicKeyUrl = GET_PRIVATE_KEY_URL_1 + 
                                      this.userName +
                                      GET_PRIVATE_KEY_URL_2 +
                                      deviceId + 
                                      GET_PRIVATE_KEY_URL_3;

                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;

                this.dbg.l("getPublicKey, command sent ... url: " + getPublicKeyUrl);

                this.httpSend(getPublicKeyUrl, GET_PRIVATE_KEY_METHOD, JSON.stringify(this.tokenHeaders), null, (error : string, response: any, responseJson : string) =>
                {
                    if (!error)
                    {
                        if (responseJson)
                        {
                            let responseObj = JSON.parse(responseJson);
                            // this.dbg.l("getPublicKey, successful");
                            this.dbg.l("getPublicKey, successful, key: " + responseObj.public_key_hex);
                            responseListener("", response, responseObj.public_key_hex);
                        }
                        else
                        {
                            this.dbg.e("getPublicKey, failed with unknown non json response");
                            responseListener("Fetching public key failed with unknown error", response, "");
                        }
                    }
                    else // error
                    {
                        this.dbg.l("getPublicKey, failed with error: " + error);
                        responseListener("Fetching public key failed with: " + error, response, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("getPublicKey, not authorized");
                responseListener(Server.NOT_AUTHORIZED, null, "");
            }
        }
        else // no Internet
        {
            this.dbg.w("getPublicKey, no internet connection");
            responseListener("No internet connection", null, "");
        }

    } // getPublicKey


    

    /**
     * Get answer (true or false) from the Server if a given user id 
     * "owns" a given device id
     *
     * @remarks
     * NA
     * 
     * @param deviceId string with device identity
     * @returns response or error via callback function
     *
     * @beta
     */
    public ownsDevice(deviceId : string, responseListener : (error : string, response : any, responseJson: string) => void) : void
    {
        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                let getOwnsDevUrl = OWNS_DEV_URL_1 + 
                                    this.userName +
                                    OWNS_DEV_URL_2 +
                                    deviceId + 
                                    OWNS_DEV_URL_3;

                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;

                this.dbg.l("ownsDevice, command sent ... url: " + getOwnsDevUrl);

                this.httpSend(getOwnsDevUrl, OWNS_DEV_METHOD, JSON.stringify(this.tokenHeaders), null, (error : string, response: any, responseJson : string) =>
                {
                    if (!error)
                    {
                        if (responseJson)
                        {
                            let responseObj = JSON.parse(responseJson);
                            // this.dbg.l("ownsDevice, successful");
                            console.log(responseObj);
                            
                            this.dbg.l("ownsDevice, successful, result: " + responseObj.own);
                            responseListener("", response, "true");
                        }
                        else
                        {
                            this.dbg.e("ownsDevice, failed with unknown non json response");
                            responseListener("Owns device call failed with unknown error", response, "");
                        }
                    }
                    else // error
                    {
                        this.dbg.l("ownsDevice, failed with error: " + error);
                        responseListener("Owns device call failed with: " + error, response, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("ownsDevice, not authorized");
                responseListener(Server.NOT_AUTHORIZED, null, "");
            }
        }
        else // no Internet
        {
            this.dbg.w("ownsDevice, no internet connection");
            responseListener("No internet connection", null, "");
        }

    } // ownsDevice    

    /**
     * Get answer (true or false) from the Server if a given device id 
     * should be managed in secure mode
     *
     * @remarks
     * NA
     * 
     * @param deviceId string with device identity
     * @returns response or error via callback function
     *
     * @beta
     */
    public secureDevice(deviceId : string, responseListener : (error : string, response : any, responseJson: string) => void) : void
    {
        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                let getSecDevUrl = SEC_DEV_URL_1 + 
                                   this.userName +
                                   SEC_DEV_URL_2 +
                                   deviceId + 
                                   SEC_DEV_URL_3;

                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;

                this.dbg.l("secureDevice, command sent ... url: " + getSecDevUrl);

                this.httpSend(getSecDevUrl, SEC_DEV_METHOD, JSON.stringify(this.tokenHeaders), null, (error : string, response: any, responseJson : any) =>
                {
                    if (!error)
                    {
                        if (responseJson)
                        {
                            let responseObj = JSON.parse(responseJson);
                            this.dbg.l("secureDevice, successful, result: " + responseObj.secure);
                            responseListener("", response, responseObj);
                        }
                        else
                        {
                            this.dbg.e("secureDevice, failed with unknown non json response");
                            responseListener("Secure device call failed with unknown error", response, "");
                        }
                    }
                    else // error
                    {
                        this.dbg.l("secureDevice, failed with error: " + error);
                        responseListener("Secure device call failed with: " + error, response, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("secureDevice, not authorized");
                responseListener(Server.NOT_AUTHORIZED, null, "");
            }
        }
        else // no Internet
        {
            this.dbg.w("secureDevice, no internet connection");
            responseListener("No internet connection", null, "");
        }

    } // secureDevice    

    /**
     * Ask the Server to sign a message for a given user id and device id
     *
     * @remarks
     * NA
     * 
     * @param deviceId string with device identity
     * @param message string with message to be signed
     * @returns response or error via callback function
     *
     * @beta
     */
    public signMsg(deviceId : string, message : string, responseListener : (error : string, response : any, responseJson: string) => void) : void
    {
        if (this.httpIsConnected())
        {
            if (this.authorizationToken)
            {
                let signMsgUrl = SIGN_MSG_URL_1 + 
                                 this.userName +
                                 SIGN_MSG_URL_2 +
                                 deviceId + 
                                 SIGN_MSG_URL_3;

                this.tokenHeaders.Authorization = BEARER + this.authorizationToken;

                let signMsgBody = JSON.stringify({ "message": message });

                this.dbg.l("signMsg, command sent ... url: " + signMsgUrl);

                this.httpSend(signMsgUrl, SIGN_MSG_METHOD, JSON.stringify(this.tokenHeaders), signMsgBody, (error : string, response: any, responseJson : string) =>
                {
                    if (!error)
                    {
                        if (responseJson)
                        {
                            let responseObj = JSON.parse(responseJson);
                            this.dbg.l("signMsg, succesful, signed msg: " + responseObj.signed_message);
                            responseListener("", response, responseObj.signed_message);
                        }
                        else
                        {
                            this.dbg.e("signMsg, failed with unknown non json response");
                            responseListener("Fetching signed message failed with unknown error", response, "");
                        }
                    }
                    else // error
                    {
                        this.dbg.l("signMsg, failed with error: " + error);
                        responseListener("Fetching signed message failed with: " + error, response, "");
                    }
            
                }); // httpSend
            }
            else // no token
            {
                this.dbg.w("signMsg, not authorized");
                responseListener(Server.NOT_AUTHORIZED, null, "");
            }
        }
        else // no Internet
        {
            this.dbg.w("signMsg, no internet connection");
            responseListener("No internet connection", null, "");
        }

    } // signMsg

} // class Server