import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Theme from './Theme';
import { FlatList, ScrollView } from 'native-base';
import { LineChart } from "react-native-chart-kit";
import { Chart } from '../utilities/Chart';
import { disconnect } from 'react-native-ble-manager';
import { NativeBaseProvider } from 'native-base';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import AnimatedLottieView from 'lottie-react-native';
import Config from './Config';
import ConfigUtilities from '../utilities/ConfigUtilities';

const InfoItem = ({ variable, value, currentColors }: any) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 30, paddingHorizontal: 30 }}>
        <Text style={{ color: currentColors.textColor }}>{variable}</Text>
        <Text style={{ color: currentColors.textColor }}>{value}</Text>
    </View>
)
let counter = 0;
const Graph = ({ measurementData, getAndIncreaseMeasuredDataCounter, disconnect, getParTextState, sendDataReqCmd, setParTextState, setParTextListState, sendDataSetParsCmd }: any) => {
    const [data, setData] = useState([]);
    const [selectedConfigIndex, setSelectedConfigIndex] = useState(0);
    const [showConfig, setShowConfig] = useState(false);
   

    useEffect(() => {
        ConfigUtilities.setParTextDefaultState(selectedConfigIndex, setParTextListState);
    }, [selectedConfigIndex])

    useEffect(() => {
        const updatedData = measurementData.map((item: any) => {
            if (item["variable"] === "Measured data receptions") {
                return { ...item, value: getAndIncreaseMeasuredDataCounter() };
            }
            return item;
        });
        console.log(data.length < 1);

        setData(updatedData);
        if (getParTextState !== null) {
            // Perform your action here. This code will run whenever getParTextState updates.
            console.log(getParTextState(0));
          }
    }, [measurementData, getParTextState])

    return (
        <Theme>
            {({ currentColors }: any) => (
                <NativeBaseProvider>
                    <ScrollView style={{ flex: 1, backgroundColor: currentColors.secondaryColor }}>

                        

                        {showConfig ? <Config configIndex={selectedConfigIndex} sendDataReqCmd={sendDataReqCmd} isSuperUser={true} sendDataSetParsCmd={sendDataSetParsCmd}  getParTextState={getParTextState} setParTextState={setParTextState} setParTextListState={setParTextListState} showCallback={setShowConfig} /> :
                            <View style={{ marginTop: 40, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <Text style={{ fontWeight: 'bold', fontSize: 20, width: '100%', marginBottom: 20, marginLeft: "5%", backgroundColor: currentColors.secondaryColor, color: currentColors.textColor }}>
                                    Select your device
                                </Text>
                                <View style={{ backgroundColor: currentColors.backgroundColor, width: '90%', justifyContent: 'center', borderRadius: 20 }}>

                                    <LineChart
                                        style={{ paddingVertical: 30, alignSelf: "center" }}
                                        data={Chart.getData()}
                                        width={Dimensions.get('window').width / 1.11}
                                        height={256}
                                        verticalLabelRotation={0}
                                        chartConfig={{
                                            backgroundGradientFrom: "#FFFFFF", // "#1E2923"
                                            backgroundGradientFromOpacity: 0,
                                            backgroundGradientTo: "#FFFFFF", // "#08130D"
                                            backgroundGradientToOpacity: 0, // 0.5
                                            color: () => currentColors.describingTextColor, // green
                                            strokeWidth: 2, // optional, default 3
                                            barPercentage: 0.5,
                                            useShadowColorFromDataset: false, // optional
                                          }}
                                        bezier
                                    />


                                    <View style={{ paddingVertical: 30, borderTopColor: currentColors.describingTextColor, borderTopWidth: 1 }}>
                                        {data.map(((item: any, index: any) => <InfoItem key={index} variable={item.variable} currentColors={currentColors} value={item.value} />))}

                                    </View>

                                </View>
                                {/**next */}
                                <View style={{ marginTop: 40, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}></View>
                                <Text style={{ width: '100%', marginLeft: 40, fontSize: 16, color: currentColors.textColor }}>Device Settings</Text>
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedConfigIndex(1);
                                        setShowConfig(true);
                                    }}
                                    style={{ backgroundColor: currentColors.backgroundColor, marginTop: 15, width: '90%', paddingVertical: 20, justifyContent: 'space-between', borderRadius: 20, flexDirection: "row", alignItems: "center", paddingHorizontal: 30 }}
                                >

                                    <Text style={[styles.buttonText, { color: currentColors.textColor }]}>Config</Text>
                                    <SimpleLineIcons name="arrow-right" size={15} color={currentColors.textColor} />


                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedConfigIndex(0);
                                        setShowConfig(true);
                                    }}
                                    style={{ backgroundColor: currentColors.backgroundColor, marginTop: 15, width: '90%', paddingVertical: 20, justifyContent: 'space-between', borderRadius: 20, flexDirection: "row", alignItems: "center", paddingHorizontal: 30 }}
                                >

                                    <Text style={[styles.buttonText, { color: currentColors.textColor }]}>System</Text>
                                    <SimpleLineIcons name="arrow-right" size={15} color={currentColors.textColor} />


                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        disconnect();

                                    }}
                                   
                                    style={[styles.button, { backgroundColor: currentColors.dangerButton, alignSelf: 'center', marginBottom: 30 }]}
                                >
                                    <Text style={[styles.buttonText, { color: currentColors.backgroundColor, fontSize: 18 }]}>Disconnect</Text>
                                </TouchableOpacity>


                            </View>}


                    </ScrollView>
                </NativeBaseProvider>
            )
            }
        </Theme >
    );

};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    button: {
        marginTop: 25,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
        width: "90%"
    },
    buttonText: {

        fontSize: 16,
    }
});

export default Graph;
