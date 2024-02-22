// Copyright (c) Nilsask Software / Fredrik Nilsask for SweIoT / miThings. 
// All rights reserved.

import Dbg from "../utilities/Dbg";

/**
 * A component managing radar data chart
 *
 * @remarks
 * NA
 *
 * @packageDocumentation
 * 
 * @public
 */

const CHART_TAG = "Chart";
const NO_OF_CHART_VALUES = 10;

export abstract class Chart 
{  
    private static dbg : Dbg = new Dbg(CHART_TAG);
    
    private static chartConfig = 
    {
        backgroundGradientFrom: "#FFFFFF", // "#1E2923"
        backgroundGradientFromOpacity: 0,
        backgroundGradientTo: "#FFFFFF", // "#08130D"
        backgroundGradientToOpacity: 0, // 0.5
        color: (opacity = 1) => `rgba(0, 128, 0, ${opacity})`, // green
        strokeWidth: 2, // optional, default 3
        barPercentage: 0.5,
        useShadowColorFromDataset: false // optional
    };

    private static chartData = 
    {
        labels: 
        [
            "0"
        ],
        datasets: 
        [
            {
                data: [0],
                color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`, // blue
                strokeWidth: 2 // optional
            },
            {
                data: [0],
                color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`, // red
                strokeWidth: 2 // optional
            }
        ],
        legend: 
        [
            "Distance (mm)",
            "Amplitude (unit?)"
        ]
    };

    private static currentNoOfValues = Chart.chartData.labels.length;
    private static counter = this.currentNoOfValues;
    // private static currentValuePosition = 0;

    /**
    * Returns chart configuration
    *
    * @remarks
    * NA
    *
    * @returns returns chart configuration
    *
    * @beta
    */
    public static getConfig() : any
    {
        return(Chart.chartConfig);

    } // getConfig

    /**
    * Returns chart data
    *
    * @remarks
    * NA
    *
    * @returns returns data configuration
    *
    * @beta
    */
    public static getData() : any
    {
        return(Chart.chartData);

    } // getData

    public static addData(dist : string, ampl : string) : void
    {
        let distance : string = (Number(dist)*1000).toString();

        if (Chart.currentNoOfValues < NO_OF_CHART_VALUES)
        {
            this.chartData.labels.push((Chart.counter++).toString()); // x-axis
            this.chartData.datasets[0].data.push(Number(dist)); // distance
            this.chartData.datasets[1].data.push(Number(ampl)); // amplitude
            Chart.currentNoOfValues++;
        }
        else // push stack
        {
            for (let pos = 0; pos < NO_OF_CHART_VALUES; pos++)
            {
                if (pos === NO_OF_CHART_VALUES-1)
                {
                    this.chartData.labels[pos] = (Number(this.chartData.labels[pos])+1).toString();; // x-axis
                    this.chartData.datasets[0].data[pos] = Number(dist); // distance
                    this.chartData.datasets[1].data[pos] = Number(ampl); // amplitude
                }
                else
                {
                    this.chartData.labels[pos] = this.chartData.labels[pos+1];
                    this.chartData.datasets[0].data[pos] = this.chartData.datasets[0].data[pos+1];
                    this.chartData.datasets[1].data[pos] = this.chartData.datasets[1].data[pos+1];
                }

            } // for
        }
        /*
        else // round robin
        {
            if (Chart.currentValuePosition >= NO_OF_CHART_VALUES) { Chart.currentValuePosition = 0; }

            this.chartData.labels[Chart.currentValuePosition] = (Chart.counter++).toString(); // x-axis
            this.chartData.datasets[0].data[Chart.currentValuePosition] = Number(dist) * 1000; // distance, convet from m to mm
            this.chartData.datasets[1].data[Chart.currentValuePosition++] = Number(ampl); // amplitude
        }
        */

    } // addData

} // class Chart