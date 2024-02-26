// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

// COMMON TODO LIST
// TODO, check device secure mode management, when is it checked, why disconnect (unauthorized?)?
// Make sure current channel is disconnected / unchosen, when choosing another channel?

/**
 * The application configures SweIoT devices via bluetooth, Yggio / LoRa and other means.
 *
 * @remarks
 * -
 * @packageDocumentation
 */

import React, { Component } from 'react';
import { View, Text, Button, FlatList, Modal, Dimensions, StyleSheet, TextInput, Alert, LogBox, NativeEventSubscription, AppState, BackHandler, ScrollView, ToastAndroid, Platform, Pressable, DrawerLayoutAndroid } from 'react-native';
import Ble from './ble/Ble';
import Dbg, { DebugItem } from './utilities/Dbg';
import UIBuilder from './userinterface/UIBuilder';
import DeviceList, { Device } from './utilities/DeviceList';
import Protocol from './ble/Protocol';
import Http from './backend/Http';
import Yggio from './backend/Yggio';
import { LineChart } from "react-native-chart-kit";
import { Chart } from './utilities/Chart';
import Server from './backend/Server';
import { Utilities } from './utilities/Utilities';

const APP_VERSION = "0.3.4";
const HL = "SweIoT, " + APP_VERSION;
const HEADLINE = HL +  ", ";
const APP_TAG = "App";
const INIT_CMD_REQ_TIME_OUT = 1000; // 1 second
const YGGIO_POLL_DEVICE_TIME_OUT = 10000; // 10 seconds
const NO_OF_PRESSES_BEFORE_SUPER_USER = 7;
const NO_OF_MEASUREMENT_DATA = 8; // 7 data fields + counter
export const BLE_CHANNEL = "BLE";
export const YGGIO_CHANNEL = "YGGIO";
export const REQUIRE_SECURE_MODE = true; // Change here if secure or unsecure customers ...
const TEST_USER_NAME = "user name";
const TEST_USER_PASSWORD = "password";
export const SECURE_MODE = "Sec";
export const AUTHORIZED_MODE = "Auth";
export const UNSECURE_MODE = "Unsec";

type AppLocalState = 
{
  jsonVersion : string,
  initCmdReqSent : boolean,
  sweIoTVersion : string,
  accVersion : string,
  cancelHwBackPress : boolean,
  superUserCounter : number,
  measuredDataCounter : number
};

export default class SweIoTConf extends Component<any, any, any> 
{
  appStateSubscription?: NativeEventSubscription;
  hwBackPressSubscription?: NativeEventSubscription;
  state : any; // TODO give state a type?
  appLocalState : AppLocalState;
  ble : Ble;
  dbg : Dbg;
  bleDeviceList : DeviceList;
  uiBuilder : UIBuilder;
  parListLength : number;
  currentConfigSetIndex : number = -1; // No value
  devProt : Protocol;
  http : Http;
  yggio : Yggio;
  server : Server;
  measuredDataListLength = NO_OF_MEASUREMENT_DATA;
  drawer : any;

  public constructor(props : any) 
  {
    super(props);

    LogBox.ignoreLogs(['new NativeEventEmitter']); // To get rid of this warning ...

    this.dbg = new Dbg(APP_TAG);

    this.dbg.l("Constructor");

    this.uiBuilder = UIBuilder.getInstance();
    this.parListLength = this.uiBuilder.getCnfSetParsLength();
    // this.dbg.l("parListLength: " + this.parListLength);

    this.state = 
    {
      appLifeState : AppState.currentState,
      statusText : 'Status ...', 
      receivedDataText : 'No data received ...',
      versionsText : 'Versions ...',
      parameterTextList : new Array<string>(this.parListLength),
      securityStatus : UNSECURE_MODE,
      isLoginViewVisible : REQUIRE_SECURE_MODE,
      isloginButtonsDisabled : false,
      internetStatusText : "Internet not connected",
      loginStatusText : "Please enter login credentials",
      isBleScanningViewVisible : false,
      isYggioDeviceViewVisible : false,
      isDebugViewVisible : false,
      isConfigSetViewVisible : false,
      superUser : false,
      measurementDataList : new Array<string>(NO_OF_MEASUREMENT_DATA),
      isMeasurementDataGraphVisible : false,
      currentChannel : BLE_CHANNEL,
      publicKeyHex : "no key received",
    };

    for (let i = 0; i < this.parListLength; i++)
    {
      this.state.parameterTextList[i] = "empty"; 
    }

    for (let i = 0; i < NO_OF_MEASUREMENT_DATA; i++)
    {
      this.state.measurementDataList[i] = "no data received yet"; 
    }

    this.appLocalState =
    {
      jsonVersion : this.uiBuilder.getJsonVersion(),
      initCmdReqSent : false,
      sweIoTVersion : "",
      accVersion : "",
      cancelHwBackPress : true,
      superUserCounter : 0,
      measuredDataCounter : 1
    };

    this.ble = Ble.getInstance();

    this.bleDeviceList = new DeviceList();

    this.devProt = Protocol.getInstance();

    this.http = new Http();

    this.yggio = Yggio.getInstance();

    this.server = Server.getInstance();

  } // constructor

  // componentWillMount() { /* this.dbg.l("componentWillMount"); */ }

  componentDidMount()
  {
    this.dbg.l("componentDidMount");

    this.appStateSubscription = AppState.addEventListener("change", nextAppLifeState => 
    {
      // this.dbg.l("componentDidMount, currentAppLifeState: " + this.state.appLifeState);
      // this.dbg.l("componentDidMount, nextLifeAppState: " + nextAppLifeState);

      this.setState({appLifeState : nextAppLifeState});
    });

    // TODO, only Android
    this.hwBackPressSubscription = BackHandler.addEventListener("hardwareBackPress", () =>
    {
      if (this.appLocalState.cancelHwBackPress)
      {
        Alert.alert
        ("Back button pressed", "Choosing Ok will terminate the app next back button press!",
        [ { text: "Ok", onPress: () => this.appLocalState.cancelHwBackPress = false },
          { text: "Cancel", onPress: () => this.appLocalState.cancelHwBackPress = true, style: 'cancel', }
        ],
        { cancelable: false }
        );
      }
      else
      {
        Alert.alert("Back button pressed", "This terminates the app");
        BackHandler.exitApp(); // To make sure componentWillUnmount is called before termination
      }

      // this.dbg.l("componentDidMount, hardwareBackPress, cancelHwBackPress: " + this.appLocalState.cancelHwBackPress);
      return(this.appLocalState.cancelHwBackPress);
    });

    this.ble.blePermissionsOk()
    .then(() => { this.dbg.l("componentDidMount, blePermissionsOk OK"); })
    .catch(() => { this.dbg.l("componentDidMount, all blePermissionsOk NOK"); })

    this.buildAndDisplayVersions();

    this.setState({statusText : "Internet connected: " + this.http.httpIsConnected()});

    this.setState({internetStatusText : "Internet connected: " + this.http.httpIsConnected()});

    this.http.httpSetConnectionListener((isConnected : boolean) =>
    {
        this.setState({statusText : "Internet connected: " + isConnected});

        this.setState({internetStatusText : "Internet connected: " + isConnected});

    }); // setConnectionListener  

  } // componentDidMount

  // componentWillReceiveProps(nextProp : any) { /* this.dbg.l("componentWillReceiveProps"); */ }
  // shouldComponentUpdate(nextProp : any, nextState : any) { /* this.dbg.l("shouldComponentUpdate"); */ return(true); }
  // componentWillUpdate(nextProp : any, nextState : any) { /* this.dbg.l("componentWillUpdate"); */ }
  // componentDidUpdate(prevProp : any, prevState : any) { /* this.dbg.l("componentDidUpdate"); */ }

  // Note componentWillUnmount is not called when app is swiped and killed, and only
  // called on some devices when back key is pressed (forced in back key management above)
  componentWillUnmount() 
  {
    this.dbg.l("componentWillUnmount");

    this.ble.bleCloseService();

    this.http.httpClose();

    this.hwBackPressSubscription?.remove();
    this.appStateSubscription?.remove();

  } // componentWillUnmount

  componentDidCatch(error : any, info : any) { this.dbg.l("componentDidCatch, error: " + error + ", info: " + info); }

  // *** START CHANNEL INDEPENDENT METHODS ***

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
  private changeChannel() : void
  {
    if (this.state.currentChannel === BLE_CHANNEL)
    {
      this.setState({currentChannel : YGGIO_CHANNEL});

      // setDisconnectState is called via BLE disconnection listener
      if (this.ble.bleDeviceConnected()) { this.bleDisconnect(); }

    }
    else if (this.state.currentChannel === YGGIO_CHANNEL)
    {
      this.setState({currentChannel : BLE_CHANNEL});

      if (this.yggio.getDeviceId() != "")
      {
        this.setDisconnectState(this.yggio.getDeviceId());
      }
    }
    else // error
    {
      this.dbg.e("changeChannel, unknown channel");
      this.setState({currentChannel : BLE_CHANNEL});
    }
  }

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
  private channelChangeText() : string
  {
    if (this.state.currentChannel === BLE_CHANNEL)
    {
      return("Change to " + YGGIO_CHANNEL);
    }
    else if (this.state.currentChannel === YGGIO_CHANNEL)
    {
      return("Change to " + BLE_CHANNEL);
    }
    else // error
    {
      this.dbg.e("channelChangeText, unknown channel");
      return("Change to XXX");
    }
  }

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
    if (this.state.currentChannel === BLE_CHANNEL)
    {
      // this.dbg.l("sendMessage, message sent via BLE");
      this.bleSend(message);
    }
    else if (this.state.currentChannel === YGGIO_CHANNEL)
    {
      this.yggioSend(message);
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

    this.sendMessage(this.devProt.getSetPublicKeyCmd(this.state.publicKeyHex));

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

    // New SweIoT Server
    if (this.ble.bleDeviceIdentity() === "E5:B4:ED:28:8D:E8") // (not LoRa device)
    {
      this.dbg.l("sendSetTestPublicKey, E5:B4:ED:28:8D:E8");
      this.sendMessage(this.devProt.getSetPublicKeyCmd("8e60b3d98f9a1bb5d250381e83f057b001c3ceb062dc2f952b73ebcaecfecad817829aa89503380f1bb8247f6f585a1c1448fb4fdb2095e3e3d21133e716a424"));
    }
    else if (this.ble.bleDeviceIdentity() === "EB:0E:D4:95:8C:3B") // (LoRA device)
    {
      this.dbg.l("sendSetTestPublicKey, EB:0E:D4:95:8C:3B (LoRA)");
      this.sendMessage(this.devProt.getSetPublicKeyCmd("63eb6db77e00ed1f64d248fbe585e59cdf4dcedd132e0bb3d718a43736cb54f1edd1a3cfd0c0d459e149316637d3b8850c268c0925e6cf480ce831e3830a181e"));
    }
    else
    {
      this.dbg.l("sendSetTestPublicKey, unknown device id: " + this.ble.bleDeviceIdentity() + " ,command not sent");
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
    if (this.state.currentChannel === BLE_CHANNEL)
    {
      // this.dbg.l("sendInitReqCmd, sending init commands via BLE");
    
      // Test if 'init commands request sent', necessary since this 
      // code section may be called several times in BLE mode
      if (!this.appLocalState.initCmdReqSent)
      {
        if (this.ble.bleDeviceConnected())
        {
          this.appLocalState.initCmdReqSent = true;

          // Make sure BLE is fully up and running before sending init command requests
          setTimeout(() => 
          { 
            // this.dbg.l("sendInitReqCmd: send SweIoT version request");
            this.bleSend(this.devProt.getSweIoTVerReqCmd()); 
            
            setTimeout(() => 
            { 
              // this.dbg.l("sendInitReqCmd: send Acconer version request");
              this.bleSend(this.devProt.getAccVerReqCmd()); 
                                                
              setTimeout(() => 
              { 
                // this.dbg.l("sendInitReqCmd: send set device debug on command");
                this.bleSend(this.devProt.getSetDbgModeOnCmd()); 

                setTimeout(() => 
                { 
                  // this.dbg.l("sendInitReqCmd: send set clock command");
                  this.bleSend(this.devProt.getSetClockCmd()); 

                  // TODO, add set public key here?

                }, INIT_CMD_REQ_TIME_OUT / 2);

              }, INIT_CMD_REQ_TIME_OUT / 2); 

            }, INIT_CMD_REQ_TIME_OUT / 2); 

          }, INIT_CMD_REQ_TIME_OUT); 

        } // if
      }
    }
    else if (this.state.currentChannel === YGGIO_CHANNEL)
    {
      this.dbg.l("sendInitReqCmd, sending init commands via Yggio");
      this.yggioSend(this.devProt.getSweIoTVerReqCmd());
      this.yggioSend(this.devProt.getAccVerReqCmd()); 
      this.yggioSend(this.devProt.getSetDbgModeOnCmd());
      this.yggioSend(this.devProt.getSetClockCmd());
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
  * @param channel defines the channel used for communication
  * @returns NA
  *
  * @beta
  */
  public sendDataReqCmd(configSetIndex : number) : void
  {
    let cmdPrefix = this.uiBuilder.getReqCmdPrefix(configSetIndex);

    this.sendMessage(this.devProt.getDataReqCmd(cmdPrefix));

  } // sendDataReqCmd
  
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
      let parList = this.getParTextListState();
      let cnfSetParCmd = this.devProt.getDataSetCmd(prefix, parList, parListLength);
      this.sendMessage(cnfSetParCmd);

  } // sendDataSetParsCmd
  
  private buildAndDisplayVersions() : void
  {
    this.setState({versionsText : 
                   "json: " + this.appLocalState.jsonVersion + 
                   ", sweiot: " + this.appLocalState.sweIoTVersion + 
                   ", acc: " + this.appLocalState.accVersion});
  }

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
  private mangageReceivedMessage(result : string) : void
  {
    if (this.devProt.isSweIoTVerReqAnsw(result))
    {
      this.setState({receivedDataText : result});
      // this.dbg.l("mangageReceivedMessage, SweIoT version received: " + result);
      this.appLocalState.sweIoTVersion = this.devProt.getSweIoTVerReqAnswDigits(result);
      this.buildAndDisplayVersions();
    }
    else if (this.devProt.isAccVerReqAnsw(result))
    {
      this.setState({receivedDataText : result});
      // this.dbg.l("mangageReceivedMessage, Acconer version received: " + result);
      this.appLocalState.accVersion = this.devProt.removeAccVerReqAnswPrefix(result);
      this.buildAndDisplayVersions();
    }
    else if (this.devProt.isDataReqAnsw(result))
    {
      this.setState({receivedDataText : result});
      // this.dbg.l("mangageReceivedMessage, requested data received: " + result);
      let confData : string[] = this.devProt.parseDataReqResult(this.devProt.removeDataReqAnswPrefix(result), this.parListLength);
      this.setParTextListState(confData);
    }
    else if (this.devProt.isDataSetAnsw(result))
    {
      // this.dbg.l("mangageReceivedMessage, data setting result received: " + result);
      Alert.alert("Parameter setting result OK ");
    } 
    else if (this.devProt.isCmdReqAnswOK(result) || this.devProt.isFactoryReqAnswOK(result))
    { // Fix to manage error in sweiot unit's protocol (factory answer)
      this.setState({receivedDataText : result});
      // this.dbg.l("mangageReceivedMessage, command request OK, received: " + result);
      Alert.alert("Command result OK ");
    }
    else if (this.devProt.isCmdReqAnswNOK(result))
    {
      this.setState({receivedDataText : result});
      // this.dbg.l("mangageReceivedMessage, command result NOK, received: " + result);
      Alert.alert("Command result NOT OK ");
    }
    else if (this.devProt.isMeasurementData(result))
    {
      this.setState({receivedDataText : result});
      // this.dbg.l("mangageReceivedMessage, measurement data received: " + result);
      // this.dbg.l("mangageReceivedMessage, measurement distance: " + this.devProt.getDistance(result));
      // this.dbg.l("mangageReceivedMessage, measurement amplitude: " + this.devProt.getAmplitude(result));

      let measuredData : string[] = this.devProt.getMeasurmentData(result);
      this.measuredDataListLength = measuredData.push(" measured data receptions: " + this.appLocalState.measuredDataCounter++);
      this.setState({measurementDataList : measuredData});

      Chart.addData(this.devProt.getDistance(result), this.devProt.getAmplitude(result));
      this.forceUpdate();
    }
    else if (this.devProt.isDevLogFileData(result)) // TODO, reception of device debug file data ...
    {
      this.setState({receivedDataText : result});
      // this.dbg.l("mangageReceivedMessage, device debug file data received: " + result);
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
  private setDisconnectState(deviceId : string) : void
  {
    this.dbg.l("setDisconnectState: " + this.state.currentChannel + " device " + deviceId + " disconnected / unchosen");
    this.setState({statusText : this.state.currentChannel + " device " + deviceId + " disconnected / unchosen"});

    if (this.state.currentChannel === YGGIO_CHANNEL)
    {
      this.yggio.setDeviceId("");
      this.forceUpdate();
    }

    this.setState({receivedDataText : "No data received ..."});
    this.appLocalState.sweIoTVersion = "";
    this.appLocalState.accVersion = "";
    this.buildAndDisplayVersions();

    this.appLocalState.initCmdReqSent = false;

    if (this.server.isAuthorized()) { this.setState({securityStatus : AUTHORIZED_MODE}); }
    else { this.setState({securityStatus : UNSECURE_MODE}); }

    this.setState({publicKeyHex : "no key received"});
    
  } // setDisconnectState
  
// *** END CHANNEL INDEPENDENT METHODS ***

// *** START BLE SPECIFIC METHODS ***

  private isNotAuthorized(response : any, error : string) : boolean
  {
      if (response !== null)
      {
          return(response.status === Http.ERROR_UNAUTHORIZED);
      }
      else
      {
          return(error === Server.NOT_AUTHORIZED);
      }
  } // isNotAuthorized

  /**
  * This method starts BLE scanning of SweIoT devices via bluetooth,
  * enables scanning list view where a devices may be selected
  * for connection and further communication
  *
  * @remarks
  * NA
  *
  * @param NA
  * @returns result or errors through callbacks
  *
  * @beta
  */
  private bleStartScanning() : void
  {
    // this.dbg.l("bleStartScanning");
    this.setState({statusText : "BLE scanning ..."});
    this.setState({receivedDataText : "No data received ..."});
    this.bleDeviceList.clear();
    this.setState({isBleScanningViewVisible : true});

    this.ble.bleScan((error: string, deviceId : string, deviceName : string | null, rssi : number | null) =>
    {
      if (!error)
      {
        if (REQUIRE_SECURE_MODE)
        {
          if (!this.bleDeviceList.isAlreadyPresent(deviceId))
          {
            this.server.ownsDevice(deviceId, (error : string, response, responseJson: string) =>
            {
              if (!error)
              {
                // this.dbg.l("ownsDevice, succesfull, response: " + responseJson);

                if (responseJson) 
                {
                  this.bleDeviceList.addDevOrUpdateIfPresent(deviceId, deviceName, rssi); this.forceUpdate();
                  // this.dbg.l("bleStartScanning, require secure mode, not present, deviceId: " + deviceId + ", deviceName: " + deviceName + ", rssi: " + rssi);
                }
                else // not owned
                {
                  this.dbg.l("bleStartScanning, require secure mode, not present, device " + deviceId + " ignored due to not owned by user");
                }
              }
              else // error
              {
                if (this.isNotAuthorized(response, error))
                {
                  this.dbg.l("ownsDevice, server API not authorized");
                  this.bleStopScanningAndConnect(""); this.forceUpdate();

                  this.setState({isLoginViewVisible : true});
                  this.setState({loginStatusText : "Session timed out, please enter login credentials"});
                }
                else
                {
                  this.dbg.e("bleStartScanning, ownsDevice " + deviceId + " ignored due to error when asking if owned, error: " + error);
                }
              }
        
            }); // ownsDevice  
          }
          else // already present
          {
            this.bleDeviceList.addDevOrUpdateIfPresent(deviceId, deviceName, rssi); this.forceUpdate();
            // this.dbg.l("bleStartScanning, require secure mode, already present, deviceId: " + deviceId + ", deviceName: " + deviceName + ", rssi: " + rssi);
          }
        }
        else // secure mode not required
        {
          this.bleDeviceList.addDevOrUpdateIfPresent(deviceId, deviceName, rssi); this.forceUpdate();
          // this.dbg.l("bleStartScanning, secure mode not required, deviceId: " + deviceId + ", deviceName: " + deviceName + ", rssi: " + rssi);  
        }       
      }
      else
      {
        this.bleStopScanningAndConnect(""); this.forceUpdate();
        this.dbg.w("bleStartScanning, terminated: " + error); 
        this.setState({statusText : error});
      }

    }); // bleScan

  } // bleStartScanning

  /**
  * The method stops BLE scanning, connects to device, discover UART 
  * services on device, sets disconnection and reception of data listener 
  * via bluetooth to a SweIoT device
  *
  * @remarks
  * NA
  *
  * @param deviceId device identity to be connected
  * @returns result or errors through callbacks
  *
  * @beta
  */
  private bleStopScanningAndConnect(deviceId : string)
  {
    this.ble.bleStopDeviceScan();
    this.setState({statusText : "Stopped BLE scanning ..."});
    this.setState({receivedDataText : "No data received ..."});

    if (this.state.isBleScanningViewVisible) // timed out, cancel or device selected
    {
      this.setState({isBleScanningViewVisible : false});

      if (deviceId)
      {
        this.setState({statusText : "BLE connecting ..."});

        this.ble.bleConnect(deviceId, (error : string, result: string) =>
        {
          if (!error)
          {
            // this.dbg.l(result);
            this.setState({statusText : "BLE device " + deviceId + " connected"});

            this.ble.setDisconnectListener(deviceId, (error : string, result: string) =>
            {
              if (!error)
              {
                // this.dbg.l(result);
                this.setDisconnectState(deviceId);
              }
              else
              {
                this.dbg.w(error); this.forceUpdate();
              }
            
            }); // setDisconnectListener

            this.ble.bleDiscoverServices((error : string, result: string) =>
            {
              if (!error)
              {
                this.dbg.l(result);
                // this.setState({statusText : "BLE device " + deviceId + " ready"});  
                
                if (REQUIRE_SECURE_MODE)
                {
                  this.server.secureDevice(deviceId, (error : string, response, responseJson: any) =>
                  {
                    if (!error)
                    {
                      // this.dbg.l("bleStopScanningAndConnect, secureDevice, succesfull, secure mode: " + responseJson.secure);
                      // this.dbg.l("bleStopScanningAndConnect, secureDevice, succesfull, public key hex: " + responseJson.public_key_hex);
 
                      if (responseJson.secure) 
                      { 
                        // this.dbg.l("bleStopScanningAndConnect, secureDevice, succesfull, device in secure mode");
                        this.setState({securityStatus : SECURE_MODE}); 
                        this.setState({publicKeyHex : responseJson.public_key_hex});
                      }
                      else 
                      { 
                        // NOTE, special in-between mode wanted by Knut ...
                        this.dbg.l("bleStopScanningAndConnect, secureDevice, device should be run in unsecure mode even if secure mode is required (Knut decided)...");
                        if (this.server.isAuthorized()) { this.setState({securityStatus : AUTHORIZED_MODE}); }
                        else { this.setState({securityStatus : UNSECURE_MODE}); }
                      }

                      this.sendInitReqCmd();
                    }
                    else // error
                    {
                      // setDisconnectState is called via BLE disconnection listener
                      if (this.ble.bleDeviceConnected()) { this.bleDisconnect(); }
                      
                      if (this.isNotAuthorized(response, error))
                      {
                        this.dbg.l("secureDevice, server API not authorized");
      
                        this.setState({isLoginViewVisible : true});
                        this.setState({loginStatusText : "Session timed out, please enter login credentials"});
                      }
                      else
                      {
                        this.dbg.e("bleStopScanningAndConnect, secureDevice " + deviceId + " could not be checked if secure ... error: " + error);
                        this.setState({statusText : error});
                      }
                    }
              
                  }); // secureDevice  
                }
                else // secure mode not required
                {
                  this.sendInitReqCmd();
                }

                this.ble.bleReceiveMessages((error : string, result: string) =>
                {
                  if (!error)
                  {
                    // NOTE, 0x00 terminators may appear in string from devices
                    const cleanResult : string = Utilities.remove0x00fromStr(result);
                    this.mangageReceivedMessage(cleanResult);
                  }
                  else
                  {
                    this.dbg.l(error); this.forceUpdate();
                  }

                }); // bleReceiveMessages
              }
              else
              {
                this.dbg.w(error); this.forceUpdate();
              }

            }); // bleDiscoverServices

          }
          else
          {
            this.dbg.w(error); this.forceUpdate();
          }

        }); // bleConnect
      }
    }
    else // Could this happen?
    {
      this.forceUpdate();
    }

  } // bleStopScanningAndConnect

  /**
  * The method sends a message via bluetooth to a SweIoT devices
  *
  * @remarks
  * NA
  *
  * @param msg string to be sent
  * @returns result or error through callback
  *
  * @beta
  */
  private bleSend(msg : string) : void
  {
    if (REQUIRE_SECURE_MODE && this.state.securityStatus === SECURE_MODE && !this.devProt.isSetPublicKeyCmd(msg))
    {
      // this.dbg.l("bleSend, secure mode required and available");

      this.server.signMsg(this.ble.bleDeviceIdentity(), msg, (error : string, response : any, responseJson: string) =>
      {
        if (!error)
        {
          // this.dbg.l("signMsg, succesfull, response: " + responseJson);
          this.setState({receivedDataText : responseJson});

          this.ble.bleSendMessage(responseJson, (error : string, result: string) =>
          {
            if (!error) { /* this.dbg.l(result); */ }
            else { this.dbg.l(error); }

          }); // bleSendMessage
        }
        else // error
        {
          if (this.isNotAuthorized(response, error))
          {
            this.dbg.l("signMsg, server API not authorized");

            this.setState({isLoginViewVisible : true});
            this.setState({loginStatusText : "Session timed out, please enter login credentials"});
          }
          else
          {
            this.dbg.e("signMsg, error: " + error);
            this.setState({receivedDataText : error});
          }
        }
  
      }); // signMsg  
    }
    else
    {
      this.dbg.l("bleSend, secure mode not required or device in unsecure mode or set public key command");

      this.ble.bleSendMessage(msg, (error : string, result: string) =>
      {
        if (!error) { /* this.dbg.l(result); */ }
        else { this.dbg.l(error); }

      }); // bleSendMessage
    }

  } // bleSend

  /**
  * The method disconnetcs current SweIoT devices
  *
  * @remarks
  * NA
  *
  * @param NA
  * @returns NA
  *
  * @beta
  */
  private bleDisconnect() : void
  {
    this.ble.bleDisconnect()
    .then((result : boolean) =>
    {
        this.dbg.l("Disconnect done");
        this.setState({statusText : "BLE disconnected"});
    })
    .catch((error : Error) => 
    { 
        this.dbg.e("Error when disconnecting: " + error); this.forceUpdate();
        
    });

  } // bleDisconnect

// *** END BLE SPECIFIC METHODS ***

// *** START YGGIO SPECIFIC METHODS ***

  /**
  * This method authorizes and sends data to a device via Yggio / LoRa
  *
  * @remarks
  * NA
  *
  * @param yggioDeviceId identity of device
  * @param data to be sent
  * @returns response or error through callback
  *
  * @beta
  */
  private yggioSend(data : string) : void
  {
    // TODO, manage secure mode while in Yggio mode ...

    let yggioDeviceId = this.yggio.getDeviceId();
    this.setState({statusText : "Internet connected: " + this.http.httpIsConnected() + ", id: " + yggioDeviceId + ", sending data ..."});
    
    if (yggioDeviceId)
    {
      this.yggio.authorize((error : string, response: string) =>
      {
        if (!error)
        {
          this.dbg.l("yggioSend, authorize response: " + response);
          this.setState({receivedDataText : response});

          this.yggio.queueData(yggioDeviceId, data, (error : string, response: string) =>
          {
            if (!error)
            {
              this.dbg.l("yggioSend, queueData response: " + response);
              this.setState({receivedDataText : response});
            }
            else
            {
              this.dbg.w("yggioSend, queueData error: " + error);
              this.setState({receivedDataText : error});    
            }

          }); // queueData
        }
        else
        {
          this.dbg.e("yggioSend, authorize error: " + error);
          this.setState({receivedDataText : error});
        }

      }); // authorize
    }
    else
    {
      this.dbg.l("yggioSend, no chosen Yggio device id");
      this.setState({statusText : "Internet connected: " + this.http.httpIsConnected() + ", no chosen Yggio device id"});
    }

  } // yggioSend

  /**
  * This method authorizes and fetches all Yggio devices 
  * (and their data)
  *
  * @remarks
  * NA
  *
  * @param -
  * @returns response or error through callback
  *
  * @beta
  */
  private yggioFetchAllDevices() : void
  {
    this.setState({statusText : "Internet connected: " + this.http.httpIsConnected() + ", fetching Yggio devices ..."});
    this.dbg.l("yggioFetchAllDevices");
    this.setState({receivedDataText : "No data received ..."});
    
    this.yggio.authorize((error : string, response: string) =>
    {
      if (!error)
      {
        this.dbg.l("yggioFetchAllDevices, authorize response: " + response);
        this.setState({receivedDataText : response});

        this.yggio.fetchAllDevices((error : string, response: string) =>
        {
          if (!error)
          {
            this.dbg.l("yggioFetchAllDevices, fetchAllDevices response: " + response);
            this.setState({receivedDataText : response});
            this.setState({isYggioDeviceViewVisible : true});
          }
          else
          {
            this.dbg.w("yggioFetchAllDevices, fetchAllDevices error: " + error);
            this.setState({receivedDataText : error});    
          }

        }); // fetchAllDevices
      }
      else
      {
        this.dbg.e("yggioFetchAllDevices, authorize error: " + error);
        this.setState({receivedDataText : error});
      }

    }); // authorize

  } // yggioFetchAllDevices

  /**
  * This method authorizes and fetches the specified 
  * Yggio device and its data
  *
  * @remarks
  * NA
  *
  * @param -
  * @returns response or error through callback
  *
  * @beta
  */
  private yggioFetchDevice(deviceId : string) : void
  {
    this.setState({statusText : "Internet connected: " + this.http.httpIsConnected() + ", fetching Yggio device: " + deviceId});
    this.dbg.l("yggioFetchDevice, device: " + deviceId);
    
    this.yggio.authorize((error : string, response: string) =>
    {
      if (!error)
      {
        this.dbg.l("yggioFetchDevice, authorize response: " + response);
        this.setState({receivedDataText : response});

        this.yggio.fetchDevice(deviceId, (error : string, response: string) =>
        {
          if (!error)
          {
            this.dbg.l("yggioFetchDevice, fetchDevice response: " + response);
            this.setState({receivedDataText : response});

            let device = this.yggio.getDevice(deviceId);
            if (device != null)
            {
              this.dbg.l("yggioFetchDevice, device distanceTime: " + device.distanceTime);
              this.dbg.l("yggioFetchDevice, device distance: " + device.distance);
              this.dbg.l("yggioFetchDevice, device amplitudeTime: " + device.amplitudeTime);
              this.dbg.l("yggioFetchDevice, device amplitude: " + device.amplitude);
              this.dbg.l("yggioFetchDevice, device uartTime: " + device.uartTime);
              this.dbg.l("yggioFetchDevice, device uartData: " + device.uartData);
              this.setState({receivedDataText : "Yggio device: " + deviceId + 
                                                ", distance: " + device.distance +
                                                ", amplitude: " + device.amplitude +
                                                ", uartData: " + device.uartData});

              this.mangageReceivedMessage(device.uartData);
            }
            else
            {
              this.dbg.l("yggioFetchDevice, device: " + deviceId + " not found");
              this.setState({receivedDataText : "Yggio device: " + deviceId + " not found"});
            }
          }
          else
          {
            this.dbg.w("yggioFetchDevice, fetchDevice error: " + error);
            this.setState({receivedDataText : error});    
          }

        }); // fetchDevice
      }
      else
      {
        this.dbg.e("yggioFetchDevice, authorize error: " + error);
        this.setState({receivedDataText : error});
      }

    }); // authorize

  } // yggioFetchDevice

  /**
  * This starts polling the specified device, every
  * YGGIO_POLL_DEVICE_TIME_OUT time unit 
  *
  * @remarks
  * NA
  *
  * @param deviceId device to be polled
  * @returns response or error through callback
  *
  * @beta
  */
  private yggioStartPollingDevice(deviceId : string) : void
  {
    this.yggio.setDeviceId(deviceId);

    this.setState({isYggioDeviceViewVisible : false});

    if (deviceId)
    {
      this.setState({statusText : "Yggio device " + deviceId + " chosen"});
      this.dbg.l("yggioStartPollingDevice, chosen device: " + deviceId);

      this.sendInitReqCmd();

      let yggioPollIntervalId = setInterval(() => 
      { 
        if (this.yggio.getDeviceId() && this.state.currentChannel === YGGIO_CHANNEL)
        {
          this.yggioFetchDevice(deviceId);
        }
        else
        {
          this.dbg.l("yggioStartPollingDevice, polling stopped, deviceId: " + this.yggio.getDeviceId() + ", channel: " + this.state.currentChannel);
          clearInterval(yggioPollIntervalId)
        }

      }, YGGIO_POLL_DEVICE_TIME_OUT); 
    }
    else
    {
      this.setState({statusText : "No Yggio device chosen"});
    }

  } // yggioStartPollingDevice

  // *** START SERVER SPECIFIC METHODS ***

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
  private serverLogin(customerName : string, customerPassword : string) : void
  {
    this.setState({statusText : "Internet connected: " + this.http.httpIsConnected() + ", logging in towards server ..."});
    this.setState({loginStatusText : "Waiting for login answer ..."}); 

    this.setState({isLoginButtonsDisabled : true}); 
    
    this.server.authorize(customerName, customerPassword, (error : string, response : any, responseJson: string) =>
    {
      if (!error)
      {
        // this.dbg.l("serverLogin, authorize succesfull");
        // this.dbg.l("serverLogin, authorize succesfull, response: " + responseJson);
        this.setState({securityStatus : AUTHORIZED_MODE});
        this.setState({isLoginViewVisible : false});
        this.setState({statusText : "Authorize succesfull"});
      }
      else
      {
        this.dbg.e("serverLogin, authorize error: " + error);
        this.setState({securityStatus : UNSECURE_MODE});
        this.setState({loginStatusText : error});
        this.setState({statusText : error});
      }

      this.setState({isLoginButtonsDisabled : false}); 

    }); // authorize

  } // serverLogin

  // *** END SERVER SPECIFIC METHODS ***

  // *** START SET AND GET RN AND APP STATE VARIABLES ***

  public getCurrentChannel() : string { return(this.state.currentChannel); }

  public isSuperUser() : boolean { return(this.state.superUser); }

  public setstatusText(text : string) : void { this.setState({statusText : text}); }

  public getReceivedDataText() : any {  return(this.state.receivedDataText); }
  public setReceivedDataText(text : string) : void { this.setState({receivedDataText : text}); }

  public setLoginButtonsDisabled(disabled : boolean) : void { this.setState({isLoginButtonsDisabled : disabled}); }

  public setLoginStatusText(text : string) : void { this.setState({loginStatusText : text}); }

  public getSecurityStatus() : any {  return(this.state.securityStatus); }
  public setSecurityStatus(status : string) : void { this.setState({securityStatus : status}); }

  public getPublicKeyHex() : any {  return(this.state.publicKeyHex); }
  public setPublicKeyHex(key : string) : void { this.setState({publicKeyHex : key}); }

  public setBleScanningViewVisible(visible : boolean) : void { this.setState({isBleScanningViewVisible : visible}); }
  public isBleScanningViewVisible() : boolean { return(this.state.isBleScanningViewVisible); }
  
  public setCurrentConfigSetIndex(currentConfigSetIndex : number) : void { this.currentConfigSetIndex = currentConfigSetIndex; }
  public getCurrentConfigSetIndex() : number { return(this.currentConfigSetIndex); }

  public setConfigSetViewVisible() : void { this.setState({isConfigSetViewVisible : true}); }
  public setConfigSetViewNotVisible() : void { this.setState({isConfigSetViewVisible : false}); }

  public getParTextState(parmeterIndex : number) { return(this.state.parameterTextList[parmeterIndex]); }
  public setParTextListState(parameterList : string[]) { this.setState({parameterTextList : parameterList}); }
  public getParTextListState() : any { return(this.state.parameterTextList); }

  /**
  * Sets RN state (text / parameter field) for the given configuration set and parameter
  * identity
  *
  * @remarks
  * NA
  *
  * @param configSetIndex current configuration set
  * @param parmeterIndex current parameter identity
  * @param data string to be put in the parameter field
  * @param allowedInput boolean stating if allowed input or not
  * @param warningInput boolean stating if warning should be raised or not
  * @returns NA
  *
  * @beta
  */
  public setParTextState(configSetIndex : number, parmeterIndex : number, data : string, allowedInput : boolean, warningInput : boolean)
  {
    if (allowedInput)
    {
      let copyList = [...this.state.parameterTextList];

      // TODO, check index for out of bounds
      copyList[parmeterIndex] = data;

      this.setState({parameterTextList : copyList});

      if (warningInput)
      {
        Alert.alert("Warning", this.uiBuilder.getParWarningText(configSetIndex, parmeterIndex));
      }
    }
    else
    {
      Alert.alert("Unallowed input: " + data + 
                  ", allowed type: " + this.uiBuilder.getParType(configSetIndex, parmeterIndex) +
                  ", min: " + this.uiBuilder.getParMinValue(configSetIndex, parmeterIndex) + 
                  ", max: " + this.uiBuilder.getParMaxValue(configSetIndex, parmeterIndex));
    }
  }

  // Free text commands ...
  freeTextCmdToBeSent = "Command to be sent ...";
  saveFreeTextCmdToBeSent(command : string) : void { this.freeTextCmdToBeSent = command; }
  getFreeTextCmdToBeSent() : string { return(this.freeTextCmdToBeSent); }

  // Login credentials ...
  customerName = TEST_USER_NAME; // TODO, tmp for test
  saveCustomerName(name : string) : void { this.customerName = name; }
  getCustomerName() : string { return(this.customerName); }
  customerPassword = TEST_USER_PASSWORD; // TODO, tmp for test
  saveCustomerPassword(password : string) : void { this.customerPassword = password; }
  getCustomerPassword() : string { return(this.customerPassword); }


// *** END SET AND GET RN AND APP STATE VARIABLES ***

  /**
  * This render component displays BLE devices
  * and calls stopScanningAndConnect 
  * when a BLE device is selected by the user
  *
  * @remarks
  * NA
  *
  * @param device to be displayed
  * @returns NA
  *
  * @beta
  */
   BleItemRender = ({device}: {device: Device}) => 
   (
     <View
       style = 
       {{
         backgroundColor: '#eeeeee',
         borderRadius: 10,
         padding: 10,
         marginVertical: 4,
         marginHorizontal: 16,
       }}>
       <Text style = {{fontSize: 14}} onPress = {()=> this.bleStopScanningAndConnect(device.id)}> {device.id + ", rssi: " + device.rssi} </Text>
     </View>
   );

  /**
  * This render component displays Yggio devices
  * and calls yggio.setChosenDeviceId
  * when a Yggio device is selected by the user
  *
  * @remarks
  * NA
  *
  * @param device to be displayed
  * @returns NA
  *
  * @beta
  */
   YggioItemRender = ({device}: {device: Device}) => 
   (
     <View
       style = 
       {{
         backgroundColor: '#eeeeee',
         borderRadius: 10,
         padding: 10,
         marginVertical: 4,
         marginHorizontal: 16,
       }}>
       <Text style = {{fontSize: 14}} onPress = {()=> this.yggioStartPollingDevice(device.id)}> {device.id + ", " + device.name} </Text>
     </View>
   );

   /**
  * This render component displays Debug
  * messages
  *
  * @remarks
  * NA
  *
  * @param device to be displayed
  * @returns NA
  *
  * @beta
  */
   DebugItemRender = ({debug}: {debug: DebugItem}) => 
   (
     <View
       style = 
       {{
         backgroundColor: '#eeeeee',
         borderRadius: 10,
         padding: 10,
         marginVertical: 4,
         marginHorizontal: 16,
       }}>
       <Text style = {{fontSize: 14}} > {debug.message} </Text>
     </View>
   );

  // Styles used in this module
  styles = StyleSheet.create({
    containerRow: {
        flex: 1,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    containerCol: {
      flex: 1,
      padding: 10,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
  },
    buttonContainer: {
        flex: 1,
        padding: 10
    }
  });

  render() 
  {
    return (
      <View style = {{flex:1, flexDirection: 'column', padding: 20}}>
              
          {this.state.superUser ?
            (
              <View style = {{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>

                <Text style = {{fontSize: 18, fontWeight: "bold"}}> {HEADLINE + this.state.currentChannel + ", " + this.state.securityStatus} </Text>
                <Button title = "..." onPress = {() => { this.drawer.openDrawer(); }} />

              </View>
            ) :
            (
              <Pressable onPress = {() => 
                {
                  if (++this.appLocalState.superUserCounter === NO_OF_PRESSES_BEFORE_SUPER_USER ) 
                  { 
                    this.setState({superUser : true}); 

                    this.dbg.getLogFile()?.appLogFileChangeToDownloadDir(); 
                    if (Platform.OS === "android")
                    {
                      ToastAndroid.show("App debug log file stored in download folder", ToastAndroid.SHORT);
                    }
                  } 
                }}>

                <View pointerEvents = "none" style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>

                  <Text style = {{fontSize: 18, fontWeight: "bold"}}> {HEADLINE + this.state.currentChannel + ", " + this.state.securityStatus} </Text>

                </View>

              </Pressable>
            )
          }

          <Text style = {{fontSize: 12, fontWeight: "bold"}}> {""} </Text>

          <View style = {{justifyContent: 'center', alignItems: 'center'}}>

            {(this.state.currentChannel === BLE_CHANNEL) ?
            (
              <View style = {{justifyContent: 'center', alignItems: 'center'}}>

              {this.ble.bleDeviceConnected() ?
              (
                <View style = {{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                  <Button 
                    title = "Disconnect BLE device"
                    onPress = {() => this.bleDisconnect()}
                  />

                  <Text style={{fontSize: 18, fontWeight: "bold"}}> {"   "} </Text>

                  <Button 
                    title = "Radar graph"
                    onPress = {() => this.setState({isMeasurementDataGraphVisible : true}) }
                  />
                </View>
              ) : 
              (
                <Button 
                  title = "Select BLE device"
                  onPress = {() => this.bleStartScanning()}
                />
                
              )}
              </View>
            ) :
            (
              <View></View>
            )}

          </View>

          <View style={{justifyContent: 'center', alignItems: 'center'}}>
            
            {(this.state.currentChannel === YGGIO_CHANNEL) ?
            (
              <View style={{justifyContent: 'center', alignItems: 'center'}}>

                {this.yggio.deviceChosen() ?
                (
                  <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    <Button 
                      title = "Unchoose Yggio device"
                      onPress = {() => this.setDisconnectState(this.yggio.getDeviceId())}
                    />
                  </View>
                ) : 
                (
                  <Button 
                    title = "Select Yggio device"
                    onPress = {() => this.yggioFetchAllDevices()}
                  />
                )}

              </View>
            ) :
            (
              <Text style = {{fontSize: 12, fontWeight: "bold"}}> {""} </Text>
            )}
            
          </View>

          <View style = {{ alignItems : 'center', marginVertical : 10}} >
            <Text> {this.state.statusText} </Text>
          </View>

          <View style = {{alignItems : 'center', marginVertical : 10}} >
            <Text> {this.state.versionsText} </Text>
          </View>

          <Text style = {{fontWeight: "bold"}}> {""} </Text>  

          <View style = {{alignItems : 'center', marginVertical : 10}} >
            <Text> {this.state.receivedDataText} </Text>
          </View>

          <Text style = {{fontWeight: "bold"}}> {""} </Text>  

          <View style = {this.styles.containerCol}>

            <ScrollView style = {{flex: 1, flexGrow: 10, width:'50%', height:'100%'}}>
              <this.uiBuilder.CnfSetMainBtns setCurrentConfigSetIndex = {this.setCurrentConfigSetIndex.bind(this)}
                                             setParTextListState = {this.setParTextListState.bind(this)}
                                             sendDataReqCmd = {this.sendDataReqCmd.bind(this)}
                                             setConfigSetViewVisible = {this.setConfigSetViewVisible.bind(this)}
                                             getCurrentChannel = {this.getCurrentChannel.bind(this)}/>
            </ScrollView>

          </View>

          <View style = {this.styles.containerRow}>

            <View style = {{justifyContent: 'center', alignItems: 'center'}}>
                <Button  
                  title = "Send"
                  onPress = {() => this.sendMessage(this.getFreeTextCmdToBeSent())}
                />
            </View>

            <TextInput style = {{fontSize: 16, fontWeight: "normal"}} placeholder = {"Command to be sent ..."} onChangeText={(text) => this.saveFreeTextCmdToBeSent(text)} />

          </View>

          <Modal visible = {this.state.isLoginViewVisible} transparent = {false} >
                 
            <View style = {{
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'}}>

              <View style = {{justifyContent: 'center', alignItems: 'center',
                              width: Dimensions.get('window').width * 0.75,
                              height: Dimensions.get('window').height * 0.5}}>

                <Text style = {{fontSize: 18, fontWeight: "bold"}}> {HEADLINE + this.state.currentChannel + ", " + this.state.securityStatus} </Text>

                <Text style = {{fontWeight: "bold"}}> {""} </Text>

                <Text style = {{fontWeight: "bold"}}> { "SERVER LOGIN" } </Text>  

                <Text style = {{fontWeight: "bold"}}> {""} </Text>         

                <Text style = {{fontWeight: "normal"}}> { this.state.internetStatusText } </Text>

                <Text style = {{fontWeight: "bold"}}> {""} </Text>

                <Text style = {{fontWeight: "normal"}}> { this.state.loginStatusText } </Text>

                <Text style = {{fontWeight: "bold"}}> {""} </Text>

                <Text style = {{fontWeight: "bold"}}> {""} </Text>

                <TextInput style = {{fontSize: 16, fontWeight: "normal"}} placeholder = {TEST_USER_NAME} onChangeText={(text) => this.saveCustomerName(text)} />

                <TextInput style = {{fontSize: 16, fontWeight: "normal"}} placeholder = {TEST_USER_PASSWORD} onChangeText={(text) => this.saveCustomerPassword(text)} />

                <View style = {{
                  flex: 1,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'}}>

                  <Button 
                    title = "Login" 
                    disabled = {this.state.isLoginButtonsDisabled}
                    onPress = {() => { this.serverLogin(this.getCustomerName(), this.getCustomerPassword()); }}
                  />

                </View>

              </View>

            </View>

          </Modal>

          <Modal visible = {this.state.isBleScanningViewVisible} transparent = {false} >
                 
            <View style = {{
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'}}>

              <View style = {{width: Dimensions.get('window').width * 0.75,
                              height: Dimensions.get('window').height * 0.5}}>

                <Text style = {{fontWeight: "bold"}}> {"Select SweIoT BLE device: "} </Text>

                {/*<FlatList
                  showsVerticalScrollIndicator = {true}
                  data = {await this.bleDeviceList.get()}
                  renderItem = {({item}) => <this.BleItemRender device = {item} />}
                  keyExtractor = {(item: Device) => item.id}
            />*/}

                <Button 
                  title = "Cancel scanning" 
                  onPress = {() => this.bleStopScanningAndConnect("")}
                />

              </View>

            </View>

          </Modal>

          <Modal visible = {this.state.isYggioDeviceViewVisible} transparent = {false} >
                 
            <View style = {{
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'}}>

              <View style = {{ width: Dimensions.get('window').width * 0.75,
                               height: Dimensions.get('window').height * 0.5}}>

                <Text style={{fontWeight: "bold"}}> {"Select SweIoT Yggio device: "} </Text>

                {/*<FlatList
                  showsVerticalScrollIndicator ={true}
                  data = {this.yggio.getDeviceList()}
                  renderItem = {({item}) => <this.YggioItemRender device = {item} />}
                  keyExtractor = {(item: Device) => item.id}
            />*/}

                <Button 
                  title = "Cancel" 
                  onPress = {() => this.yggioStartPollingDevice("")}
                />

              </View>

            </View>

          </Modal>

          <Modal visible = {this.state.isDebugViewVisible} transparent = {false} >
                 
            <View style = {{
                  flex: 1,
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'}}>

              <View style={{ width: Dimensions.get('window').width,
                            height: Dimensions.get('window').height}}>

                <Text style={{fontWeight: "bold"}}> {"Debug messages:"} </Text>

                <FlatList
                  showsVerticalScrollIndicator ={true}
                  data = {this.dbg.getAppLogList()}
                  renderItem = {({item}) => <this.DebugItemRender debug = {item} />}
                  keyExtractor = {(item: DebugItem) => item.id.toString()}
                />

                <Button 
                  title = "Cancel" 
                  onPress = {() => this.setState({isDebugViewVisible : false})}
                />

              </View>

            </View>

          </Modal>
     
          <Modal visible = {this.state.isConfigSetViewVisible} transparent = {false} >

            <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start'}}>

              <this.uiBuilder.CnfSetHeader configSetIndex = {this.getCurrentConfigSetIndex()}/>

              <ScrollView style = {{flex: 1, flexGrow: 10, width:'100%', height:'100%'}}>
                <this.uiBuilder.CnfSetPars configSetIndex = {this.getCurrentConfigSetIndex()}
                                           setParTextState = {this.setParTextState.bind(this)}
                                           getParTextState = {this.getParTextState.bind(this)}
                                           isSuperUser = {this.isSuperUser.bind(this)}/>
              </ScrollView>

              <this.uiBuilder.CnfSetParBtns setConfigSetViewNotVisible = {this.setConfigSetViewNotVisible.bind(this)}
                                            getCurrentConfigSetIndex = {this.getCurrentConfigSetIndex.bind(this)}
                                            sendDataSetParsCmd = {this.sendDataSetParsCmd.bind(this)}
                                            getCurrentChannel = {this.getCurrentChannel.bind(this)}/>

            </View>

          </Modal>   

          <Modal visible = {this.state.isMeasurementDataGraphVisible} transparent = {false} >

            <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>

              <View style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height}}>

                <Text style={{fontWeight: "bold"}}> {"Radar data:"} </Text>
                <Text style={{fontWeight: "bold"}}> {""} </Text>

                <LineChart
                  data = {Chart.getData()}
                  width = {Dimensions.get('window').width}
                  height = {256}
                  verticalLabelRotation = {0}
                  chartConfig = {Chart.getConfig()}
                  bezier
                />
              
                <Text style={{fontWeight: "bold"}}> {""} </Text>

                <ScrollView style = {{flex: 1, flexGrow: 10, width:'100%', height:'100%'}}>

                  <this.uiBuilder.MeasurementDataFields measuredDataListLength = {this.measuredDataListLength}
                                                        measurementDataList = {this.state.measurementDataList}/>

                  <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
                    <Text style={{fontWeight: "bold"}}> {""} </Text>
                    <Text style={{fontWeight: "bold"}}> {""} </Text>
                    <Button title = "Cancel" onPress = {() => this.setState({isMeasurementDataGraphVisible : false})}/>
                  </View>

                </ScrollView>

              </View>

            </View>

          </Modal>   

          <DrawerLayoutAndroid

            ref = {drawer => this.drawer = drawer}
            drawerLockMode = {"unlocked"}
            drawerWidth = {(Dimensions.get('window').width * 0.6)}
            drawerPosition = {"left"}
            renderNavigationView = {() => 

              <View style = {[{flex: 1, alignItems: "center", justifyContent: "center", padding: 16}, {backgroundColor: "#ecf0f1"}]}>

                <ScrollView style = {{flex: 1, flexGrow: 10, width:'100%', height:'100%'}}>

                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = { this.channelChangeText() } onPress = {() => { this.changeChannel(); }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = "App dbg view" onPress = {() => { this.setState({isDebugViewVisible : true}) }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = "Dev dbg file" onPress = {() => { this.dbg.getLogFile()?.devLogFileCreate(); this.sendMessage(this.devProt.getDevLogReqCmd()); }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = "Radar graph" onPress = {() => { this.setState({isMeasurementDataGraphVisible : true}) }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = "Set pub key" onPress = {() => { this.sendSetPublicKey(); }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = "Remove pub key" onPress = {() => { this.sendRemovePublicKey(); }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = "Set pub key (fixed MACs)" onPress = {() => { this.sendSetTestPublicKey(); }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>
                  
                  <Button title = "About" onPress = {() => { Alert.alert(HL + ", (c) Nilsask Software for SweIoT AB."); }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                  <Button title = "Close menu" onPress={() => { this.drawer.closeDrawer(); }} />
                  <Text style={{fontSize: 4, textAlign: "center"}}>{""}</Text>

                </ScrollView>

              </View>}>

          </DrawerLayoutAndroid>

      </View>
    )
  }
  
} // SweIoTConf