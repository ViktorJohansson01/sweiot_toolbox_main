import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Theme from './Theme';
import { FlatList, ScrollView } from 'native-base';
import { LineChart } from "react-native-chart-kit";
import { Chart } from '../utilities/Chart';
import { disconnect } from 'react-native-ble-manager';
import { NativeBaseProvider } from 'native-base';

const InfoItem = ({ variable, value }: any) => (
    <View style={{ flexDirection: 'row', paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between', width: '100%', height: 30, paddingHorizontal: 30 }}>
        <Text>{variable}</Text>
        <Text>{value}</Text>
    </View>
)
let counter = 0;
const Graph = ({ measurementData, measurementDataLength, disconnect }: any) => {
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!measurementData.includes("Measured data receptions"))
            if (counter > 0) {
                measurementData.push({ variable: "Measured data receptions", value: counter });
            }
        counter++
        setData(measurementData);

    }, [measurementData])

    return (
        <Theme>
            {({ currentColors }: any) => (
                <NativeBaseProvider>
                    <ScrollView style={{ flex: 1, backgroundColor: currentColors.secondaryColor }}>
                        <View style={{ marginTop: 40, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}>
                            <View style={{ backgroundColor: currentColors.backgroundColor, width: '90%', height: 720, justifyContent: 'center', borderRadius: 20 }}>

                                <LineChart
                                    style={{ paddingVertical: 30 }}
                                    data={Chart.getData()}
                                    width={Dimensions.get('window').width / 1.1}
                                    height={256}
                                    verticalLabelRotation={0}
                                    chartConfig={Chart.getConfig()}
                                    bezier
                                />


                                <View style={{ height: 400, paddingVertical: 30, borderTopColor: currentColors.describingTextColor, borderTopWidth: 1 }}>
                                    {data.map(((item: any, index: any) => <InfoItem key={index} variable={item.variable} value={item.value} />))}

                                </View>

                            </View>
                            {/**next */}
                            <View style={{ marginTop: 40, flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderRadius: 20 }}></View>
                            <Text style={{width: '100%', marginLeft: 40, fontSize: 16}}>Settings</Text>
                            <View style={{ backgroundColor: currentColors.backgroundColor, width: '90%', marginTop: 20, height: 100, justifyContent: 'center', borderRadius: 20 }}>

                                <TouchableOpacity
                                    onPress={disconnect}
                                    accessibilityLabel='Cancel scanning'
                                    style={[styles.button, { backgroundColor: currentColors.primaryColor, alignSelf: 'center' }]}
                                >
                                    <Text style={[styles.buttonText, {color: currentColors.backgroundColor}]}>Disconnect</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                 

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
        marginTop: 15,
        padding: 17,
        borderRadius: 50,
        alignItems: 'center',
        width: '80%'
    },
    buttonText: {

        fontSize: 16,
    }
});

export default Graph;
