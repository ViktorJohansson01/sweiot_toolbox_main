import { View, Button, TextInput, Alert, Text } from "react-native";
import Dbg from '../utilities/Dbg';
import uiBuilderData from '../userinterface/uiBuilder.json';
import { Utilities } from "../utilities/Utilities";

const UI_BUILDER_TAG = "UIBuilder";

const UI_BUILDER_TYPE_INTEGER = "integer";
const UI_BUILDER_TYPE_FLOAT = "float";
const UI_BUILDER_TYPE_BOOLEAN = "boolean";
const UI_BUILDER_TYPE_STRING = "string";

export default class ConfigUtilities {
    private static instance: ConfigUtilities;
    private dbg: Dbg;

    private constructor() {
        this.dbg = new Dbg(UI_BUILDER_TAG);

    } // singleton

    public static checkDataToBeSent(configSetIndex: number, parameterIndex: number, data: string, setParTextState: any) {
        let allowedInput: boolean = false;
        let warningInput: boolean = false;

        if (data.length != 0) {
            let fieldType: string = uiBuilderData.config[configSetIndex].parameter[parameterIndex].type;
            // The type number in typescript represent both integer and float
            let min: number = Number(uiBuilderData.config[configSetIndex].parameter[parameterIndex].min);
            let max: number = Number(uiBuilderData.config[configSetIndex].parameter[parameterIndex].max);

            switch (fieldType) {
                case UI_BUILDER_TYPE_INTEGER:
                case UI_BUILDER_TYPE_FLOAT:
                    interface checkFunc { (str: string): boolean; }
                    let check: checkFunc = Utilities.isFloat;
                    if (fieldType === UI_BUILDER_TYPE_INTEGER) {
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
            data != "") {
            warningInput = true;
        }

        // TODO, manage allowed input at a later stage ... for now allways OK ...
        allowedInput = true;

        setParTextState(configSetIndex, parameterIndex, data, allowedInput, warningInput);

    } // checkDataToBeSent

    public static sendPars(configSetIndex: any, sendDataSetParsCmd : any) : any
    {
        console.log(configSetIndex, "sendPars h");
        
        let parListLength = Object.keys(uiBuilderData.config[configSetIndex].parameter).length;
        let prefix = uiBuilderData.config[configSetIndex].command;
        console.log(UI_BUILDER_TAG + ", sendPars: " + parListLength + ", " + prefix);
        
        sendDataSetParsCmd(prefix, parListLength);
        
    }

    public static setParTextDefaultState(configSetIndex : number, setParTextListState : any) : void
    {
        let parSetList : string[] = [];

        for (let parmeterIndex = 0; parmeterIndex < Object.keys(uiBuilderData.config[configSetIndex].parameter).length; parmeterIndex++)
        {
            parSetList.push(uiBuilderData.config[configSetIndex].parameter[parmeterIndex].currVal);
        }

        setParTextListState(parSetList);

        console.log(UI_BUILDER_TAG + ", setParTextDefaultState: " + parSetList);

    } // setParTextDefaultState

    public static getDeviceMethodFromString(param: string) : any {
        const splitString = Utilities.getSplitStringCommaByIndex({inputString: param, index: 0});
        if (splitString) {
            const findMethod:any = uiBuilderData.config
            .find((data) => data.command === splitString);
            return findMethod ? findMethod?.type : "Unknown"
        }
        return "Unknown";
    }

} // UIBuilder