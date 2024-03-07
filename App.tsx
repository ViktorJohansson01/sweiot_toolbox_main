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
import BleHelper from './ble/BleHelper';
import YggioHelper from './backend/YggioHelper';
import ServerHelper from './backend/ServerHelper';
import AppHelper from './AppHelper';
import DeviceListView from './components/DeviceList';
import Login from './components/Login';
import ModeSelector from './components/ModeSelector';
import Theme from './components/Theme';
import Connect from './components/Connect';
import Loading from './components/Loading';
import _ from 'lodash';
import Graph from './components/Graph';

const APP_VERSION = "0.4.0";
const HL = "SweIoT, " + APP_VERSION;
const HEADLINE = HL + ", ";
const APP_TAG = "App";
const NO_OF_PRESSES_BEFORE_SUPER_USER = 7;
const NO_OF_MEASUREMENT_DATA = 8; // 7 data fields + counter
export const BLE_CHANNEL = "BLE";
export const YGGIO_CHANNEL = "YGGIO";
export const REQUIRE_SECURE_MODE = true; // Change here if secure or unsecure customers ...
//const TEST_USER_NAME = "fnitest";
//const TEST_USER_PASSWORD = "enter password";
const TEST_USER_NAME = "superknut";
const TEST_USER_PASSWORD = "superknutpassword_3951";
export const SECURE_MODE = "Sec";
export const AUTHORIZED_MODE = "Auth";
export const UNSECURE_MODE = "Unsec";

type AppLocalState =
  {
    jsonVersion: string,
    initCmdReqSent: boolean,
    sweIoTVersion: string,
    accVersion: string,
    cancelHwBackPress: boolean,
    superUserCounter: number,
    measuredDataCounter: number
  };

export default class SweIoTConf extends Component<any, any, any> {
  appStateSubscription?: NativeEventSubscription;
  hwBackPressSubscription?: NativeEventSubscription;
  state: any; // TODO give state a type?
  appLocalState: AppLocalState;
  dbg: Dbg;
  uiBuilder: UIBuilder;
  parListLength: number;
  currentConfigSetIndex: number = -1; // No value
  devProt: Protocol;
  http: Http;
  measuredDataListLength = 0;
  drawer: any;
  bleHelp: BleHelper;
  yggioHelp: YggioHelper;
  appHelp: AppHelper;
  measuredDataCounter = 1;
  deviceState: any;
  public constructor(props: any) {
    super(props);

    LogBox.ignoreLogs(['new NativeEventEmitter']); // To get rid of this warning ...

    this.dbg = new Dbg(APP_TAG);

    this.dbg.l("Constructor");

    this.uiBuilder = UIBuilder.getInstance();
    this.parListLength = this.uiBuilder.getCnfSetParsLength();

    this.deviceState = {
      deviceListArray: Array<Device>
    }

    this.state =
    {
      appLifeState: AppState.currentState,
      statusText: 'Status ...',
      receivedDataText: 'No data received ...',
      versionsText: 'Versions ...',
      parameterTextList: new Array<string>(this.parListLength),
      selectedModeIndex: 0,
      securityStatus: UNSECURE_MODE,
      isLoginViewVisible: REQUIRE_SECURE_MODE,
      isModeSelectorViewVisible: false,
      isloginButtonsDisabled: false,
      internetStatusText: "Internet not connected",
      loginStatusText: null,
      isBleScanningViewVisible: false,
      isPairingDeviceView: false,
      isStartDeviceScanViewVisible: false,
      isYggioDeviceViewVisible: false,
      isDebugViewVisible: false,
      isConfigSetViewVisible: false,
      superUser: false,
      measurementDataList: new Array<string>(NO_OF_MEASUREMENT_DATA),
      isMeasurementDataGraphVisible: false,
      currentChannel: BLE_CHANNEL,
      publicKeyHex: "no key received",
    };

    for (let i = 0; i < this.parListLength; i++) { this.state.parameterTextList[i] = "empty"; }

    this.appLocalState =
    {
      jsonVersion: this.uiBuilder.getJsonVersion(),
      initCmdReqSent: false,
      sweIoTVersion: "",
      accVersion: "",
      cancelHwBackPress: true,
      superUserCounter: 0,
      measuredDataCounter: 1
    };

    this.devProt = Protocol.getInstance();


    this.http = new Http();

    this.bleHelp = BleHelper.getInstance(this, this.http);
    
    this.yggioHelp = YggioHelper.getInstance(this, this.http);

    this.appHelp = AppHelper.getInstance(this, this.http);

  } // constructor

  componentDidMount() {
    this.dbg.l("componentDidMount");


    this.appStateSubscription = AppState.addEventListener("change", nextAppLifeState => {
      this.setState({ appLifeState: nextAppLifeState });
    });

    // TODO, only Android
    this.hwBackPressSubscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (this.appLocalState.cancelHwBackPress) {
        Alert.alert
          ("Back button pressed", "Choosing Ok will terminate the app next back button press!",
            [{ text: "Ok", onPress: () => this.appLocalState.cancelHwBackPress = false },
            { text: "Cancel", onPress: () => this.appLocalState.cancelHwBackPress = true, style: 'cancel', }
            ],
            { cancelable: false }
          );
      }
      else {
        Alert.alert("Back button pressed", "This terminates the app");
        BackHandler.exitApp(); // To make sure componentWillUnmount is called before termination
      }

      return (this.appLocalState.cancelHwBackPress);
    });

    Ble.getInstance().blePermissionsOk()
      .then(() => { this.dbg.l("componentDidMount, blePermissionsOk OK"); })
      .catch(() => { this.dbg.l("componentDidMount, all blePermissionsOk NOK"); })

    this.appHelp.buildAndDisplayVersions();

    this.setState({ statusText: "Internet connected: " + this.http.httpIsConnected() });


    this.setState({ internetStatusText: "Internet connected: " + this.http.httpIsConnected() });

    this.http.httpSetConnectionListener((isConnected: boolean) => {
      this.setState({ statusText: "Internet connected: " + isConnected });

      this.setState({ internetStatusText: "Internet connected: " + isConnected });

    }); // setConnectionListener  

  } // componentDidMount

  // componentWillMount() { /* this.dbg.l("componentWillMount"); */ }
  // componentWillReceiveProps(nextProp : any) { /* this.dbg.l("componentWillReceiveProps"); */ }
  // shouldComponentUpdate(nextProp : any, nextState : any) { /* this.dbg.l("shouldComponentUpdate"); */ return(true); }
  // componentWillUpdate(nextProp : any, nextState : any) { /* this.dbg.l("componentWillUpdate"); */ }
  // componentDidUpdate(prevProp : any, prevState : any) { /* this.dbg.l("componentDidUpdate"); */ }

  // Note componentWillUnmount is not called when app is swiped and killed, and only
  // called on some devices when back key is pressed (forced in back key management above)
  componentWillUnmount() {
    this.dbg.l("componentWillUnmount");

    Ble.getInstance().bleCloseService();

    this.http.httpClose();

    this.hwBackPressSubscription?.remove();

    this.appStateSubscription?.remove();

  } // componentWillUnmount

  componentDidCatch(error: any, info: any) { this.dbg.e("componentDidCatch, error: " + error + ", info: " + info); }

  public getParListLength(): number { return (this.parListLength); }

  public getMeasuredDataListLength(): number { return (this.measuredDataListLength); }
  public setMeasuredDataListLength(length: number): void { this.measuredDataListLength = length; }

  public getMeasuredDataCounter(): number { return (this.measuredDataCounter); }
  public setMeasuredDataCounter(value : number): number { return (this.measuredDataCounter = value); }
  public getAndIncreaseMeasuredDataCounter(): number { return (this.measuredDataCounter++); }

  public getMeasurementDataList(): object[] { return (this.state.measurementDataList); }
  public setMeasurementDataList(list: string[]): void { this.setState({ measurementDataList: list }); }

  public getVersionsText(): string { return (this.state.versionsText); }
  public setVersionsText(text: string): void { this.setState({ versionsText: text }); }

  public getJsonVersion(): string { return (this.appLocalState.jsonVersion); }
  public setJsonVersion(version: string): void { this.appLocalState.jsonVersion = version; }

  public getSweIoTVersion(): string { return (this.appLocalState.sweIoTVersion); }
  public setSweIoTVersion(version: string): void { this.appLocalState.sweIoTVersion = version; }

  public getAccVersion(): string { return (this.appLocalState.accVersion); }
  public setAccVersion(version: string): void { this.appLocalState.accVersion = version; }

  public getInitCmdReqSent(): boolean { return (this.appLocalState.initCmdReqSent); }
  public setInitCmdReqSent(sent: boolean): void { this.appLocalState.initCmdReqSent = sent; }

  public getCurrentChannel(): string { return (this.state.currentChannel); }
  public setCurrentChannel(channel: string): void { this.setState({ currentChannel: channel }); }

  public isSuperUser(): boolean { return (this.state.superUser); }

  public setStatusText(text: string): void { this.setState({ statusText: text }); }

  public getReceivedDataText(): any { return (this.state.receivedDataText); }
  public setReceivedDataText(text: string): void { this.setState({ receivedDataText: text }); }

  public setLoginViewVisible(visible: boolean): void { this.setState({ isLoginViewVisible: visible }); }
  public setLoginButtonsDisabled(disabled: boolean): void { this.setState({ isLoginButtonsDisabled: disabled }); }
  public setLoginStatusText(text: string): void { this.setState({ loginStatusText: text }); }

  public setYggioDeviceViewVisible(visible: boolean): void { this.setState({ isYggioDeviceViewVisible: visible }); }

  public getSecurityStatus(): any { return (this.state.securityStatus); }
  public setSecurityStatus(status: string): void { this.setState({ securityStatus: status }); }

  public getPublicKeyHex(): any { return (this.state.publicKeyHex); }
  public setPublicKeyHex(key: string): void { this.setState({ publicKeyHex: key }); }

  public setBleScanningViewVisible(visible: boolean): void { this.setState({ isBleScanningViewVisible: visible }); }
  public isBleScanningViewVisible(): boolean { return (this.state.isBleScanningViewVisible); }

  public setCurrentConfigSetIndex(currentConfigSetIndex: number): void { this.currentConfigSetIndex = currentConfigSetIndex; }
  public getCurrentConfigSetIndex(): number { return (this.currentConfigSetIndex); }

  public setConfigSetViewVisible(): void { this.setState({ isConfigSetViewVisible: true }); }
  public setConfigSetViewNotVisible(): void { this.setState({ isConfigSetViewVisible: false }); }

  public getParTextState(parmeterIndex: number) { return (this.state.parameterTextList[parmeterIndex]); }
  public setParTextListState(parameterList: string[]) { this.setState({ parameterTextList: parameterList }); }
  public getParTextListState(): any { return (this.state.parameterTextList); }

  public setModeSelectorViewVisible(visible: boolean): void { this.setState({ isModeSelectorViewVisible: visible }); }
  public isModeSelectorViewVisible(): boolean { return (this.state.isModeSelectorViewVisible); }

  public setPairingDeviceView(visible: boolean): void { this.setState({ isPairingDeviceView: visible }); }
  public isPairingDeviceView(): boolean { return (this.state.isPairingDeviceView); }

  public setStartDeviceScanViewVisible(visible: boolean): void { this.setState({ isStartDeviceScanViewVisible: visible }); }
  public isStartDeviceScanViewVisible(): boolean { return (this.state.isStartDeviceScanViewVisible); }

  public setMeasurementDataGraphVisible(visible: boolean): void { this.setState({ isMeasurementDataGraphVisible: visible }); }
  public isMeasurementDataGraphVisible(): boolean { return (this.state.isMeasurementDataGraphVisible); }

  public setSelectedModeIndex(index:any): void { this.setState({ selectedModeIndex: index }); }
  public getSelectedModeIndex(): any { return (this.state.selectedModeIndex); }


  /*public setAddDevice = _.throttle((newDevice: Device) => {
    this.setState((prevState: any) => {
      const updatedArray = [...prevState.deviceListArray, newDevice];

      //updatedArray.sort((a, b) => b["rssi"]! - a["rssi"]!);
      console.log("te");
      
      return {
        deviceListArray: updatedArray,
      };
    });
  }, 5000);*/

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

  public setParTextState(configSetIndex: number, parmeterIndex: number, data: string, allowedInput: boolean, warningInput: boolean) {
    if (allowedInput) {
      let copyList = [...this.state.parameterTextList];

      // TODO, check index for out of bounds
      copyList[parmeterIndex] = data;

      this.setState({ parameterTextList: copyList });

      if (warningInput) {
        Alert.alert("Warning", this.uiBuilder.getParWarningText(configSetIndex, parmeterIndex));
      }
    }
    else {
      Alert.alert("Unallowed input: " + data +
        ", allowed type: " + this.uiBuilder.getParType(configSetIndex, parmeterIndex) +
        ", min: " + this.uiBuilder.getParMinValue(configSetIndex, parmeterIndex) +
        ", max: " + this.uiBuilder.getParMaxValue(configSetIndex, parmeterIndex));
    }
  }

  // Free text commands ...
  freeTextCmdToBeSent = "Command to be sent ...";
  saveFreeTextCmdToBeSent(command: string): void { this.freeTextCmdToBeSent = command; }
  getFreeTextCmdToBeSent(): string { return (this.freeTextCmdToBeSent); }

  // Login credentials ...
  customerName = TEST_USER_NAME; // TODO, tmp for test
  saveCustomerName(name: string): void { this.customerName = name; }
  getCustomerName(): string { return (this.customerName); }
  customerPassword = TEST_USER_PASSWORD; // TODO, tmp for test
  saveCustomerPassword(password: string): void { this.customerPassword = password; }
  getCustomerPassword(): string { return (this.customerPassword); }

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
  BleItemRender = ({ device }: { device: Device }) =>
  (
    <View
      style=
      {{
        backgroundColor: '#eeeeee',
        borderRadius: 10,
        padding: 10,
        marginVertical: 4,
        marginHorizontal: 16,
      }}>
      <Text style={{ fontSize: 14 }} onPress={() => this.bleHelp.bleStopScanningAndConnect(device.id)}> {device.id + ", rssi: " + device.rssi} </Text>
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
  YggioItemRender = ({ device }: { device: Device }) =>
  (
    <View
      style=
      {{
        backgroundColor: '#eeeeee',
        borderRadius: 10,
        padding: 10,
        marginVertical: 4,
        marginHorizontal: 16,
      }}>
      <Text style={{ fontSize: 14 }} onPress={() => this.yggioHelp.yggioStartPollingDevice(device.id)}> {device.id + ", " + device.name} </Text>
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
  DebugItemRender = ({ debug }: { debug: DebugItem }) =>
  (
    <View
      style=
      {{
        backgroundColor: '#eeeeee',
        borderRadius: 10,
        padding: 10,
        marginVertical: 4,
        marginHorizontal: 16,
      }}>
      <Text style={{ fontSize: 14 }} > {debug.message} </Text>
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

  render() {
    console.log("hej");

    return (
      <View style={{ flex: 1, flexDirection: 'column', padding: 20 }}>{/*main skärmen */}


        <Modal transparent={false}>
          <View style={{ flex: 1 }}>

            {/*Ble.getInstance().bleDeviceConnected() ?
              (
                <View style={{ flex: 1 }}>
                  {/* {this.isModeSelectorViewVisible() ?
                    <ModeSelector sendSystemSettingsReq={this.appHelp.sendSystemSettingsReq.bind(this.appHelp)} app={this}></ModeSelector> :
                    (
                      <View style={{ flex: 1, flexDirection: 'column' }}>

                        <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                          {this.state.superUser ?
                            (
                              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>

                                <Text style={{ fontSize: 18, fontWeight: "bold" }}> {HEADLINE + this.state.currentChannel + ", " + this.state.securityStatus} </Text>
                                <Button title="..." onPress={() => { this.drawer.openDrawer(); }} />

                              </View>
                            ) :
                            (
                              <Pressable onPress={() => {
                                if (++this.appLocalState.superUserCounter === NO_OF_PRESSES_BEFORE_SUPER_USER) {
                                  this.setState({ superUser: true });

                                  this.dbg.getLogFile()?.appLogFileChangeToDownloadDir();
                                  if (Platform.OS === "android") {
                                    ToastAndroid.show("App debug log file stored in download folder", ToastAndroid.SHORT);
                                  }
                                }
                              }}>

                                <View pointerEvents="none" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>

                                  <Text style={{ fontSize: 18, fontWeight: "bold" }}> {HEADLINE + this.state.currentChannel + ", " + this.state.securityStatus} </Text>

                                </View>

                              </Pressable>
                            )
                          }
                          {(this.state.currentChannel === YGGIO_CHANNEL) ?
                            (
                              <View style={{ justifyContent: 'center', alignItems: 'center' }}>

                                {Yggio.getInstance().deviceChosen() ?
                                  (
                                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                                      <Button
                                        title="Unchoose Yggio device"
                                        onPress={() => this.appHelp.setDisconnectState(Yggio.getInstance().getDeviceId())}
                                      />
                                    </View>
                                  ) :
                                  (
                                    <Button
                                      title="Select Yggio device"
                                      onPress={() => this.yggioHelp.yggioFetchAllDevices()}
                                    />
                                  )}

                              </View>
                            ) :
                            (
                              <Text style={{ fontSize: 12, fontWeight: "bold" }}> {""} </Text>
                            )}

                            </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                    <Button
                      title="Disconnect BLE device"
                      onPress={() => {
                        this.bleHelp.bleDisconnect();
                      }}
                    />

                    <Text style={{ fontSize: 18, fontWeight: "bold" }}> {"   "} </Text>

                    <Button
                      title="Radar graph"
                      onPress={() => this.setState({ isMeasurementDataGraphVisible: true })}
                    />



                  </View>

                  {/*
                        <View style={{ alignItems: 'center', marginVertical: 10 }} >
                          <Text> {this.state.statusText} </Text>
                        </View>

                        <View style={{ alignItems: 'center', marginVertical: 10 }} >
                          <Text> {this.state.versionsText} </Text>
                        </View>



                        <View style={{ alignItems: 'center', marginVertical: 10 }} >
                          <Text> {this.state.receivedDataText} </Text>
                        </View>


                        <View style={this.styles.containerCol}>

                          <ScrollView style={{ flex: 1, flexGrow: 10, width: '50%', height: '100%' }}>
                            <this.uiBuilder.CnfSetMainBtns setCurrentConfigSetIndex={this.setCurrentConfigSetIndex.bind(this)}
                              setParTextListState={this.setParTextListState.bind(this)}
                              sendDataReqCmd={this.appHelp.sendDataReqCmd.bind(this.appHelp)}
                              setConfigSetViewVisible={this.setConfigSetViewVisible.bind(this)}
                              getCurrentChannel={this.getCurrentChannel.bind(this)} />
                          </ScrollView>

                        </View>

                        <View style={this.styles.containerRow}>

                          <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                            <Button
                              title="Send"
                              onPress={() => this.appHelp.sendMessage(this.getFreeTextCmdToBeSent())}
                            />
                          </View>

                          <TextInput style={{ fontSize: 16, fontWeight: "normal" }} placeholder={"Command to be sent ..."} onChangeText={(text) => this.saveFreeTextCmdToBeSent(text)} />

                        </View>



                        <Modal visible={this.state.isYggioDeviceViewVisible} transparent={false} >

                          <View style={{
                            flex: 1,
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>

                            <View style={{
                              width: Dimensions.get('window').width * 0.75,
                              height: Dimensions.get('window').height * 0.5
                            }}>

                              <Text style={{ fontWeight: "bold" }}> {"Select SweIoT Yggio device: "} </Text>

                              {/*<FlatList
                                showsVerticalScrollIndicator={true}
                                data={Yggio.getInstance().getDeviceList()}
                                renderItem={({ item }) => <this.YggioItemRender device={item} />}
                                keyExtractor={(item: Device) => item.id}
                          />

                              <Button
                                title="Cancel"
                                onPress={() => this.yggioHelp.yggioStartPollingDevice("")}
                              />

                            </View>

                          </View>

                        </Modal>

                        <Modal visible={this.state.isDebugViewVisible} transparent={false} >

                          <View style={{
                            flex: 1,
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>

                            <View style={{
                              width: Dimensions.get('window').width,
                              height: Dimensions.get('window').height
                            }}>

                              <Text style={{ fontWeight: "bold" }}> {"Debug messages:"} </Text>

                              <FlatList
                                showsVerticalScrollIndicator={true}
                                data={this.dbg.getAppLogList()}
                                renderItem={({ item }) => <this.DebugItemRender debug={item} />}
                                keyExtractor={(item: DebugItem) => item.id.toString()}
                              />

                              <Button
                                title="Cancel"
                                onPress={() => this.setState({ isDebugViewVisible: false })}
                              />

                            </View>

                          </View>

                        </Modal>

                        <Modal visible={this.state.isConfigSetViewVisible} transparent={false} >

                          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start' }}>

                            <this.uiBuilder.CnfSetHeader configSetIndex={this.getCurrentConfigSetIndex()} />

                            <ScrollView style={{ flex: 1, flexGrow: 10, width: '100%', height: '100%' }}>
                              <this.uiBuilder.CnfSetPars configSetIndex={this.getCurrentConfigSetIndex()}
                                setParTextState={this.setParTextState.bind(this)}
                                getParTextState={this.getParTextState.bind(this)}
                                isSuperUser={this.isSuperUser.bind(this)} />
                            </ScrollView>

                            <this.uiBuilder.CnfSetParBtns setConfigSetViewNotVisible={this.setConfigSetViewNotVisible.bind(this)}
                              getCurrentConfigSetIndex={this.getCurrentConfigSetIndex.bind(this)}
                              sendDataSetParsCmd={this.appHelp.sendDataSetParsCmd.bind(this.appHelp)}
                              getCurrentChannel={this.getCurrentChannel.bind(this)} />

                          </View>

                        </Modal>

                        <Modal visible={this.state.isMeasurementDataGraphVisible} transparent={false} >

                          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

                            <View style={{ width: Dimensions.get('window').width, height: Dimensions.get('window').height }}>

                              <Text style={{ fontWeight: "bold" }}> {"Radar data:"} </Text>
                              <Text style={{ fontWeight: "bold" }}> {""} </Text>

                              <LineChart
                                data={Chart.getData()}
                                width={Dimensions.get('window').width}
                                height={256}
                                verticalLabelRotation={0}
                                chartConfig={Chart.getConfig()}
                                bezier
                              />

                              <Text style={{ fontWeight: "bold" }}> {""} </Text>

                              <ScrollView style={{ flex: 1, flexGrow: 10, width: '100%', height: '100%' }}>

                                <this.uiBuilder.MeasurementDataFields measuredDataListLength={this.measuredDataListLength}
                                  measurementDataList={this.state.measurementDataList} />

                                <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                  <Text style={{ fontWeight: "bold" }}> {""} </Text>
                                  <Text style={{ fontWeight: "bold" }}> {""} </Text>
                                  <Button title="Cancel" onPress={() => this.setState({ isMeasurementDataGraphVisible: false })} />
                                </View>

                              </ScrollView>

                            </View>

                          </View>

                        </Modal>

                        <DrawerLayoutAndroid

                          ref={drawer => this.drawer = drawer}
                          drawerLockMode={"unlocked"}
                          drawerWidth={(Dimensions.get('window').width * 0.6)}
                          drawerPosition={"left"}
                          renderNavigationView={() =>

                            <View style={[{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }]}>

                              <ScrollView style={{ flex: 1, flexGrow: 10, width: '100%', height: '100%' }}>

                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title={this.appHelp.channelChangeText()} onPress={() => { this.appHelp.changeChannel(); }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="App dbg view" onPress={() => { this.setState({ isDebugViewVisible: true }) }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="Dev dbg file" onPress={() => { this.dbg.getLogFile()?.devLogFileCreate(); this.appHelp.sendMessage(this.devProt.getDevLogReqCmd()); }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="Radar graph" onPress={() => { this.setState({ isMeasurementDataGraphVisible: true }) }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="Set pub key" onPress={() => { this.appHelp.sendSetPublicKey(); }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="Remove pub key" onPress={() => { this.appHelp.sendRemovePublicKey(); }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="Set pub key (fixed MACs)" onPress={() => { this.appHelp.sendSetTestPublicKey(); }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="About" onPress={() => { Alert.alert(HL + ", (c) Nilsask Software for SweIoT AB."); }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                                <Button title="Close menu" onPress={() => { this.drawer.closeDrawer(); }} />
                                <Text style={{ fontSize: 4, textAlign: "center" }}>{""}</Text>

                              </ScrollView>

                            </View>}>

                          </DrawerLayoutAndroid>
                      </View>)}
                </View>
              ) :
              (
                <View />

              )*/}

            <View style={{ flex: 1 }}>

              {this.state.isLoginViewVisible ? <Login
                loginServer={ServerHelper.getInstance(this, this.http)}
                saveCustomerName={this.saveCustomerName}
                saveCustomerPassword={this.saveCustomerPassword}
                getCustomerName={this.getCustomerName}
                getCustomerPassword={this.getCustomerPassword}
                isLoginButtonsDisabled={this.state.isLoginButtonsDisabled}
                loginStatusText={this.state.loginStatusText}
              /> :

                this.state.isBleScanningViewVisible ?
                  <DeviceListView list={this.bleHelp.getBleDeviceList()} stopScanAndConnect={this.bleHelp.bleStopScanningAndConnect.bind(this.bleHelp)} refreshScan={this.bleHelp.bleDeviceList.clear} /> :

                  this.state.isPairingDeviceView ? <Loading /> :
                  
                  this.state.isModeSelectorViewVisible ? <ModeSelector sendSystemSettingsReq={this.appHelp.sendSystemSettingsReq.bind(this.appHelp)} app={this} setSelectedModeIndex={this.setSelectedModeIndex.bind(this)}></ModeSelector> :

                    this.state.isMeasurementDataGraphVisible && Ble.getInstance().bleDeviceConnected() ? 
                    <Graph disconnect={() => this.bleHelp.bleDisconnect()} 
                    measurementData={this.getMeasurementDataList()} 
                    getAndIncreaseMeasuredDataCounter={this.getAndIncreaseMeasuredDataCounter.bind(this)}
                    getParTextState={this.getParTextState.bind(this)} 
                    setParTextState={this.setParTextState.bind(this)}
                    setParTextListState={this.setParTextListState.bind(this)}
                    sendDataSetParsCmd={this.appHelp.sendDataSetParsCmd.bind(this.appHelp)}
                    sendDataReqCmd={this.appHelp.sendDataReqCmd.bind(this.appHelp)}
                    getSelectedModeIndex={this.getSelectedModeIndex.bind(this)}/>
                     :
                      <Connect startDeviceScan={this.bleHelp.bleStartScanning.bind(this.bleHelp)}></Connect>
              }
            </View>




          </View>

        </Modal>

        {/*<Text style={{ fontSize: 12, fontWeight: "bold" }}> {""} </Text>

        <View style={{ justifyContent: 'center', alignItems: 'center' }}>

          {(this.state.currentChannel === BLE_CHANNEL) ?
            (
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>

                {Ble.getInstance().bleDeviceConnected() ?
                  (

                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                      <Button
                        title="Disconnect BLE device"
                        onPress={() => this.bleHelp.bleDisconnect()}
                      />

                      <Text style={{ fontSize: 18, fontWeight: "bold" }}> {"   "} </Text>

                      <Button
                        title="Radar graph"
                        onPress={() => this.setState({ isMeasurementDataGraphVisible: true })}
                      />


                    </View>
                  ) :
                  (
                    <Button
                      title="Select BLE device"
                      onPress={() => this.bleHelp.bleStartScanning()}
                    />

                  )}
              </View>
            ) :
            (
              <View></View>
            )}

            </View>*/}



      </View>
    )

  }

} // SweIoTConf