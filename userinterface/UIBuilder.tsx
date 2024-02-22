// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

/**
 * UI builder, UI components for the application that configures 
 * SweIoT devices via bluetooth.
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 * @public
 */

import { View, Button, TextInput, Alert, Text } from "react-native";
import Dbg from '../utilities/Dbg';
import uiBuilderData from './uiBuilder.json';
import { Utilities } from "../utilities/Utilities";

 const UI_BUILDER_TAG = "UIBuilder";

 const UI_BUILDER_TYPE_INTEGER = "integer";
 const UI_BUILDER_TYPE_FLOAT = "float";
 const UI_BUILDER_TYPE_BOOLEAN = "boolean";
 const UI_BUILDER_TYPE_STRING = "string";

 export default class UIBuilder
{
    private static instance: UIBuilder;
    private dbg : Dbg;

    private constructor() 
    { 
        this.dbg = new Dbg(UI_BUILDER_TAG); 

    } // singleton

    /**
    * Gets the instance of the UIBuilder service (singleton)
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns instande of the service
    *
    * @beta
    */
     public static getInstance(): UIBuilder 
     {
         if (!this.instance) 
         {
             this.instance = new UIBuilder();
         }

         return(this.instance);
 
     } // bleGetInstance

    /**
    * Gets the version of the json file (from the json file)
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns json version
    *
    * @beta
    */
     public getJsonVersion() : string
     {
        return(uiBuilderData.version);

     } // getJsonVersion

    /**
    * Gets the length of the longest configuration set parameter list (from the json file)
    *
    * @remarks
    * NA
    *
    * @param NA
    * @returns length of longest parameter list
    *
    * @beta
    */
     public getCnfSetParsLength() : number
     {
        let length : number = 0;

        for (let configSetIndex = 0; configSetIndex < Object.keys(uiBuilderData.config).length; configSetIndex++)
        {
            if (Object.keys(uiBuilderData.config[configSetIndex].parameter).length > length)
            {
                length = Object.keys(uiBuilderData.config[configSetIndex].parameter).length;
            }
        }

        return(length);

     } // getCnfSetParsLength

    /**
    * Gets the given configuration set request command prefix (from the json file)
    *
    * @remarks
    * NA
    *
    * @param configSetIndex number that identifies the current configuration set
    * @returns request command prefix
    *
    * @beta
    */
     public getReqCmdPrefix(configSetIndex : number) : string
     {
        return(uiBuilderData.config[configSetIndex].command);

     } // getCmdPrefix

    /**
    * Gets the given parameter type (from the json file)
    *
    * @remarks
    * NA
    *
    * @param configSetIndex number that identifies the current configuration set
    * @param parmeterIndex number that identifies the current parameter
    * @returns parameter type
    *
    * @beta
    */
    public getParType(configSetIndex : number, parmeterIndex: number) : string
    {
        return(uiBuilderData.config[configSetIndex].parameter[parmeterIndex].type);

    } // getParType

    /**
    * Gets the given parameter type (from the json file)
    *
    * @remarks
    * NA
    *
    * @param configSetIndex number that identifies the current configuration set
    * @param parmeterIndex number that identifies the current parameter
    * @returns parameter warning text
    *
    * @beta
    */
    public getParWarningText(configSetIndex : number, parmeterIndex: number) : string
    {
        return(uiBuilderData.config[configSetIndex].parameter[parmeterIndex].warningText);

    } // getParWarningText

    /**
    * Gets the given parameter min value (from the json file)
    *
    * @remarks
    * NA
    *
    * @param configSetIndex number that identifies the current configuration set
    * @param parmeterIndex number that identifies the current parameter
    * @returns parameter min value
    *
    * @beta
    */
    public getParMinValue(configSetIndex : number, parmeterIndex: number) : string
    {
        return(uiBuilderData.config[configSetIndex].parameter[parmeterIndex].min);

    } // getParMinValue

    /**
    * Gets the given parameter max value (from the json file)
    *
    * @remarks
    * NA
    *
    * @param configSetIndex number that identifies the current configuration set
    * @param parmeterIndex number that identifies the current parameter
    * @returns parameter max value
    *
    * @beta
    */
    public getParMaxValue(configSetIndex : number, parmeterIndex: number) : string
    {
        return(uiBuilderData.config[configSetIndex].parameter[parmeterIndex].max);

    } // getParMaxValue

    // TODO consider interface for props for the below methods

    /**
    * Creates the main buttons based on json where config set is chosen
    *
    * @remarks
    * NA
    *
    * @param props.setCurrentConfigSetIndex function that sets the current configuration set
    * @param props.setParTextListState function that sets the parameters' state
    * @param props.sendDataReqCmd function that sends a request command via defined channel
    * @param props.setConfigSetViewVisible function that displays the modal window to show current configuration set
    * @param props.getCurrentChannel function that gets current channel
    * @returns jsx to be rendered
    *
    * @beta
    */
    public CnfSetMainBtns(props : any) : any
    {
        let renderString : JSX.Element[] = [];

        for (let configSetIndex = 0; configSetIndex < Object.keys(uiBuilderData.config).length; configSetIndex++)
        {
            // console.log(UI_BUILDER_TAG + ", CnfSetMainBtns, configSetIndex: " + configSetIndex);

            renderString.push(      

                <View style = {{flex: 1, padding: 10}} key = {configSetIndex}>
                    
                    <Button  
                        title = {uiBuilderData.config[configSetIndex].type}

                        onPress = {(event) => { // console.log(UI_BUILDER_TAG + ", CnfSetMainBtns, onPress, configSetIndex: " + configSetIndex);
                                                props.setCurrentConfigSetIndex(configSetIndex);
                                                UIBuilder.setParTextDefaultState(configSetIndex, props);
                                                props.sendDataReqCmd(configSetIndex);
                                                props.setConfigSetViewVisible(); }}
                        
                    />
    
                </View>
            );
        }

        return(renderString);

    } // CnfSetMainBtns

    /**
    * Creates the header of the currennt config set view based on json
    *
    * @remarks
    * NA
    *
    * @param props.configSetIndex current config set, ie index
    * @returns jsx to be rendered
    *
    * @beta
    */
    public CnfSetHeader(props : any) : any
    {
        return(
            <View style = {{flex: 1, flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start'}}>

                <Text style = {{fontSize: 12, fontWeight: "bold"}}> {"test"} </Text>

                <Text style = {{fontSize: 18, fontWeight: "bold"}}> {uiBuilderData.config[Number(props.configSetIndex)].type} </Text>

            </View>
        );

    } // CnfSetHeader

    private static setParTextDefaultState(configSetIndex : number, props : any) : void
    {
        let parSetList : string[] = [];

        for (let parmeterIndex = 0; parmeterIndex < Object.keys(uiBuilderData.config[configSetIndex].parameter).length; parmeterIndex++)
        {
            parSetList.push(uiBuilderData.config[configSetIndex].parameter[parmeterIndex].currVal);
        }

        props.setParTextListState(parSetList);

        console.log(UI_BUILDER_TAG + ", setParTextDefaultState: " + parSetList);

    } // setParTextDefaultState

    // * Types UI_BUILDER_TYPE_INTEGER, UI_BUILDER_TYPE_FLOAT, UI_BUILDER_TYPE_BOOLEAN, 
    // and UI_BUILDER_TYPE_STRING are allowed.
    // * Unknown type, none of the above, are currently allowed.
    // * If both Max and Min are numbers, and Max >= Min, then fieldvalue is checked to be within
    // the boundaries.
    // * If Max or Min or both are not numbers then boundaris are not checked.
    // * Empty field are allowed. 
    // * An alertmessage is triggered if a non integer is entered in an integer field.
    // * x.0, x.00 in an integer field does not trigger an alert, but . and trailing 0s are removed.
    // * An alertmessage is triggered if a non boolean (0 or 1) is entered in a boolean field.
    // * x.0, x.00 in a boolean field does not trigger an alert, but . and trailing 0s are removed.
    // * Both float and integers are allowed in a float field to allow reasonable field edit 
    // possibilties.   
    private static checkDataToBeSent(configSetIndex : number, parameterIndex : number, data : string, props : any)
    {
        let allowedInput : boolean = false;
        let warningInput : boolean = false;

        if (data.length != 0)
        {
            let fieldType : string = uiBuilderData.config[configSetIndex].parameter[parameterIndex].type;
            // The type number in typescript represent both integer and float
            let min : number = Number(uiBuilderData.config[configSetIndex].parameter[parameterIndex].min);
            let max : number = Number(uiBuilderData.config[configSetIndex].parameter[parameterIndex].max);

            switch(fieldType)
            {
                case UI_BUILDER_TYPE_INTEGER:
                case UI_BUILDER_TYPE_FLOAT:
                    interface checkFunc { (str: string): boolean; }
                    let check : checkFunc = Utilities.isFloat;
                    if (fieldType === UI_BUILDER_TYPE_INTEGER) 
                    { 
                        data = Number(data).toString(); // To avoid 1.0, 3.00 etc
                        check = Utilities.isInteger; 
                    }

                    if (check(data)) // Check if correct type
                    {
                        if (!isNaN(min) && !isNaN(max)) // Check if min and max are numbers
                        {
                            let dataInt = Number(data);
                            // Check if within boundaries
                            allowedInput = (min <= dataInt) && (dataInt <= max);
                        }
                        else // Skip boundary check if min or max, or both are NOT numbers
                        {
                            allowedInput = true;
                        }
                    }
                    break;

                case UI_BUILDER_TYPE_BOOLEAN:
                    allowedInput = Utilities.isBoolean(data);
                    data = Number(data).toString(); // To avoid 0.0, 1.00 etc
                    break;
                
                case UI_BUILDER_TYPE_STRING:
                    // Allowed with any character
                    if (!isNaN(min) && !isNaN(max)) // Check if min and max are numbers
                    {
                        // Check if within boundaries
                        allowedInput = (min <= data.length) && (data.length <= max);
                    }
                    else // Skip boundary check if min or max, or both are NOT numbers
                    {
                        allowedInput = true;
                    }
                    break;

                default:
                    // TODO unkown data type
                    allowedInput = true;
                    break;

            } // switch

        }
        else // inputField is empty
        {
            allowedInput = true;
        }

        if (data === uiBuilderData.config[configSetIndex].parameter[parameterIndex].warningValue &&
            data != "")
        {
            warningInput = true;
        }

        // TODO, manage allowed input at a later stage ... for now allways OK ...
        allowedInput = true;

        props.setParTextState(configSetIndex, parameterIndex, data, allowedInput, warningInput);

    } // checkDataToBeSent

    /**
    * Creates the parameters of the current configuration set based on json
    *
    * @remarks
    * NA
    *
    * @param props.configSetIndex current config set, ie index
    * @param props.setParTextState function that sets the parameter's state
    * @param props.getParTextState function that gets the parameter's state
    * @param props.isSuperUser function that gets the superUser state
    * @returns jsx to be rendered
    *
    * @beta
    */
    public CnfSetPars(props : any) : any
    {
        let configSetIndex : number = props.configSetIndex;
        let renderString : JSX.Element[] = [];

        for (let parameterIndex = 0; parameterIndex < Object.keys(uiBuilderData.config[configSetIndex].parameter).length; parameterIndex++)
        {
            let help = uiBuilderData.config[configSetIndex].parameter[parameterIndex].help; // Necessary to get json data here to avoid execution error!?

            // console.log("CnfSetPars, booleans: " + uiBuilderData.actOnVisible + ", " + uiBuilderData.config[configSetIndex].parameter[parameterIndex].visible + ", " + props.isSuperUser());
            if ((uiBuilderData.actOnVisible === "true" && uiBuilderData.config[configSetIndex].parameter[parameterIndex].visible === "true") || (props.isSuperUser()))
            {
                renderString.push(
                
                    <View style = {{flex: 2, padding: 5, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start'}} key = {parameterIndex}>
                        <Text>testd</Text>
                        <View style = {{flex : 4, justifyContent: 'flex-start', alignItems: 'flex-start'}} >
                            <Text style = {{fontSize: 18, fontWeight: "normal"}}> {uiBuilderData.config[configSetIndex].parameter[parameterIndex].name + ": "} </Text>
                        </View>

                        <View style = {{flex : 1, justifyContent: 'flex-start', alignItems: 'flex-start'}}>
                            <TextInput style = {{fontSize: 18, fontWeight: "normal"}} 
                                    onChangeText = {(text) => {UIBuilder.checkDataToBeSent(configSetIndex, parameterIndex, text, props)}} 
                                    value = {props.getParTextState(parameterIndex)} />
                        </View>

                        <View style = {{flex : 1, justifyContent: 'center', alignItems: 'center'}} >
                            <Button  title = {"?"} onPress = {() => {Alert.alert("Help", help);}}/>
                        </View>

                    </View>

                ); // render

            } // if

        } // for

        return(renderString);

    } // CnfSetPars

    private static sendPars(props : any) : any
    {
        let configSetIndex = props.getCurrentConfigSetIndex();//Här
        let parListLength = Object.keys(uiBuilderData.config[configSetIndex].parameter).length;
        let prefix = uiBuilderData.config[configSetIndex].command;
        props.sendDataSetParsCmd(prefix, parListLength);
        
    } // sendPars

    /**
    * Creates the buttons of the current configuration set based on json
    *
    * @remarks
    * NA
    *
    * @param props.setConfigSetViewNotVisible function that closes the modal window where the current configuration set is displayed
    * @param props.getCurrentConfigSetIndex function that gets the current configuration set index
    * @param props.sendDataSetParsCmd function that sends current configuration set parameters
    * @param props.getCurrentChannel function that gets current channel
    * @returns jsx to be rendered
    *
    * @beta
    */
    public CnfSetParBtns(props : any) : any
    {
        return(
            <View style = {{ flex: 1, padding: 10, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start' }}>

                <Text style={{fontSize: 12, fontWeight: "bold"}}> {"      "} </Text>

                <View style = {{flex : 1, justifyContent: 'center', alignItems: 'flex-start'}}>
                    <Button  
                    title = {"Menu"}
                    onPress = {() => {props.setConfigSetViewNotVisible()}}
                    />
                </View>

                <View style = {{flex : 1, justifyContent: 'center', alignItems: 'flex-end'}}>
                    <Button  
                    title = {"Send"}
                    onPress = {() => {UIBuilder.sendPars(props);}}
                    />
                </View>

                <Text style={{fontSize: 12, fontWeight: "bold"}}> {"      "} </Text>

            </View>
        );

    } // CnfSetParBtns

    /**
    * Creates the measurement data fields to be rendered
    *
    * @remarks
    * NA
    *
    * @param props.measuredDataListLength
    * @param props.measurementDataList[]
    * @returns jsx to be rendered
    *
    * @beta
    */
    public MeasurementDataFields(props : any) : any
    {
        let renderString : JSX.Element[] = [];

        for (let i = 0; i < props.measuredDataListLength; i++)
        {
            renderString.push(

                <View style = {{flex : 1, justifyContent: 'flex-start', alignItems: 'flex-start'}} key = {i}>
                    <Text style={{fontWeight: "normal"}}> {props.measurementDataList[i]} </Text>
                </View>

            );
        }

        return(renderString);

    } // MeasurementDataFields

} // UIBuilder