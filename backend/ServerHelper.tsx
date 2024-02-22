// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import Dbg from "../utilities/Dbg";
import { AUTHORIZED_MODE, UNSECURE_MODE } from '../App';
import Http from "./Http";
import Server from "./Server";

const TAG : string = "ServerHelper";

/**
 * A help class for Server management
 *
 * @remarks
 * -
 *
 * @packageDocumentation
 */
export default class ServerHelper
{
    private static instance: ServerHelper;
    private dbg : Dbg;
    private app : any;
    http : Http;

    private constructor(app : any, http : Http) // singleton
    {
        this.dbg = new Dbg(TAG);

        this.dbg.l("Constructor");

        this.app = app;

        this.http = http;

    } // constructor

    public static getInstance(app : any, http: Http): ServerHelper 
    {
        if (!this.instance) { this.instance = new ServerHelper(app, http); }

        return(this.instance);

    } // getInstance

    /**
     * This method authorizes / logins the customer towards the server
     *
     * @remarks
     * NA
     *
     * @param customerName string with customer's name
     * @param customerPassword string with customer's password
     * @returns response or error through callback
     *
     * @beta
     */
    public serverLogin(customerName : string, customerPassword : string) : void
    {
        this.app.setStatusText("Internet connected: " + this.http.httpIsConnected() + ", logging in towards server ...");
        this.app.setLoginStatusText("Waiting for login answer ...");

        this.app.setLoginButtonsDisabled(true);
        
        Server.getInstance().authorize(customerName, customerPassword, (error : string, response : any, responseJson: string) =>
        {
        if (!error)
        {
            this.app.setSecurityStatus(AUTHORIZED_MODE);
            this.app.setLoginViewVisible(false);
            this.app.setStatusText("Authorize succesfull");
        }
        else
        {
            this.dbg.e("serverLogin, authorize error: " + error);
            this.app.setSecurityStatus(UNSECURE_MODE);
            this.app.setLoginStatusText(error);
            this.app.setStatusText(error);
        }

        this.app.setLoginButtonsDisabled(false);

        }); // authorize

    } // serverLogin

} // class ServerHelper