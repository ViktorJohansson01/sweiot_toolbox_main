// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

/**
 * An Internet library for HTTP communication.
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
* @public
 */
import NetInfo, { NetInfoSubscription } from "@react-native-community/netinfo";
import Dbg from "../utilities/Dbg";

const HTTP_TAG = "Http";
const HTPP_DEFAULT_METHOD = "GET";
const HTPP_DEFAULT_HEADERS = { Accept: "application/json", 'Content-Type': "application/json" }
const HTPP_DEFAULT_BODY = JSON.stringify( { firstParam: "yourValue", secondParam: "yourOtherValue" })

interface httpConnectionListenerType { (isConnected: boolean): void; }
export default class Http
{
    public static ERROR_UNAUTHORIZED : number = 401;
    private httpDbg : Dbg;
    private internetConnection : boolean = false;
    private httpConnectionListener : httpConnectionListenerType | null = null;
    private httpRemoveConnectionListener : NetInfoSubscription | null = null;


    private httpParWithoutBody : any =
    {
        method: HTPP_DEFAULT_METHOD,
        headers: HTPP_DEFAULT_HEADERS
    };

    private httpParWithBody : any =
    {
        method: HTPP_DEFAULT_METHOD,
        headers: HTPP_DEFAULT_HEADERS,
        body: HTPP_DEFAULT_BODY
    };

    constructor()
    {
        this.httpDbg = new Dbg(HTTP_TAG);

        // this.httpDbg.l("Constructor");

        this.addConnectionListener();

    } // constructor

    private addConnectionListener() : void
    {
        this.httpRemoveConnectionListener = NetInfo.addEventListener(networkState => 
        {
            if (networkState.isConnected === null)
            {
                this.internetConnection = false;
            }
            else
            {
                this.internetConnection = networkState.isConnected;
            }

            if (this.httpConnectionListener != null)
            {
                this.httpConnectionListener(this.internetConnection);
            }

            // this.httpDbg.l("Internet connection: " + networkState.isConnected);
            // this.httpDbg.l("Internet connection, type: " + networkState.type);
        });

    } // addConnectionListener

    /**
     * Gets the status of the internet connection
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns true if connected else false
     *
     * @beta
     */
    public httpIsConnected() : boolean
    {
        return(this.internetConnection);

    } // httpIsConnected

    /**
     * Sets an internet connection listener
     *
     * @remarks
     * NA
     *
     * @param connectionListener internet connection listener
     * @returns NA
     *
     * @beta
     */
    public httpSetConnectionListener(connectionListener : (isConnected : boolean) => void) : void
    {
        this.httpConnectionListener = connectionListener;

    } // httpSetConnectionListener

    private httpBuildParameter(method : string | null, headers : string | null, body : string | null) : any
    {
        let httpPar : any;

        if (body === null) { httpPar = this.httpParWithoutBody; }
        else { httpPar = this.httpParWithBody; httpPar.body = body; }

        if (method != null) { httpPar.method = method; }
        else { httpPar.method = HTPP_DEFAULT_METHOD; }

        if (headers != null) { httpPar.headers = JSON.parse(headers); }  
        else { httpPar.headers = HTPP_DEFAULT_HEADERS; }

        return(httpPar);

    } // httpBuildParameter

    private responseText(responseStatus : number) : string
    { 
        switch(responseStatus)
        {
            case 200 : return(responseStatus + ", " + "Success");
            case 201 : return(responseStatus + ", " + "Success, resource created");
            case 204 : return(responseStatus + ", " + "Success, resource deleted");
            case 400 : return(responseStatus + ", " + "Bad request");
            case Http.ERROR_UNAUTHORIZED : return(responseStatus + ", " + "Unauthorized");
            case 404 : return(responseStatus + ", " + "Not found");
            case 409 : return(responseStatus + ", " + "Conflict");
            case 500 : return(responseStatus + ", " + "Internal server error");
            default: return(responseStatus + ", " + "Other error, see HTTP spec");
        }

    } // responseText

    /**
     * Sends a HTTP request
     *
     * @remarks
     * NA
     *
     * @param url adress of HTTP request
     * @param method HTTP request method, null if default should be used
     * @param headers HTTP request headers, null if default should be used
     * @param body HTTP request body, null if no body
     * @returns response or error via callback function
     *
     * @beta
     */
    public httpSend(url : string, method : string | null, headers : string | null, body : string | null, responseListener : (error : string, response : any, responseJson: string) => void) : void
    {
        let httpPar = this.httpBuildParameter(method, headers, body);
          
        // this.httpDbg.l("httpSend, httpPar.method: " + httpPar.method);
        // this.httpDbg.l("httpSend, httpPar.headers: " + JSON.stringify(httpPar.headers));
        if (body != null) { /* this.httpDbg.l("httpSend, httpPar.body: " + JSON.stringify(httpPar.body)); */ }

        fetch(url, httpPar)
        .then(response => 
        {
            this.httpDbg.l("httpSend, response.ok: " + response.ok);
            // this.httpDbg.l("httpSend, response.status: " + response.status);
            // this.httpDbg.l("httpSend, response.statusText: " + response.statusText);
            // this.httpDbg.l("httpSend, response.type: " + response.type);
            // console.log("httpSend, response: ", response);

            if (response.headers.get('content-type')?.includes('application/json'))
            {
                response.json()
                .then(json => 
                {
                    if (response.ok)
                    {
                        // this.httpDbg.l("httpSend, response: " + this.responseText(response.status) + ", JSON.stringify: " + JSON.stringify(json));
                        responseListener("", response, JSON.stringify(json));
                    }
                    else // json, response nok
                    {
                        if (response.status === 400 || response.status >= 409)
                        {
                            this.httpDbg.e("httpSend, response: " + this.responseText(response.status) + ", " + JSON.stringify(json));
                        }
                        else if (response.status === 404)
                        {
                            this.httpDbg.w("httpSend, response: " + this.responseText(response.status) + ", " + JSON.stringify(json));
                        }
                        else
                        {
                            this.httpDbg.l("httpSend, response: " + this.responseText(response.status) + ", " + JSON.stringify(json)); 
                        }
                        
                        responseListener("httpSend, response: " + this.responseText(response.status) + ", " + JSON.stringify(json), response, "");
                    }
                })
                .catch(error => 
                {
                    this.httpDbg.e("httpSend, json error: " + error);
                    responseListener("httpSend, json error: " + error, response, "");
                });
            }
            else if (response.headers.get('content-type')?.includes('text/html'))
            {
                // this.httpDbg.w("httpSend, answer aborted, non json response, BUT text/html");
                console.warn("httpSend, answer aborted, non json response, BUT text/html", response);
            }
            else // non json response
            {
                if (response.ok)
                {
                    this.httpDbg.l("httpSend, non json response: " + this.responseText(response.status));
                    responseListener("", response, "");
                }
                else // non json, response nok
                {
                    this.httpDbg.e("httpSend, non json response: " + this.responseText(response.status));
                    responseListener("httpSend, response: " + this.responseText(response.status), response, "");
                }
            }
        })
        .catch(error => 
        {
            this.httpDbg.e("httpSend, error: " + error);
            responseListener("httpSend, error: " + error, null, "");
        });

    } // httpSend

    /**
     * Closes the Http service
     *
     * @remarks
     * NA
     *
     * @param NA
     * @returns NA
     *
     * @beta
     */
    public httpClose() : void
    {
        if (this.httpRemoveConnectionListener != null)
        {
            this.httpRemoveConnectionListener();
        }

    } // httpClose

} // class Http