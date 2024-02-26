import AsyncStorage from '@react-native-async-storage/async-storage';


export interface Device {
  id: string;
  name: string;
  rssi: number | null;
  distanceTime: string;
  distance: string;
  amplitudeTime: string;
  amplitude: string;
  uartTime: string;
  uartData: string;
}

export class StorageUtil {

  public static async storeArray(key: string, objectToAdd: Device) {
    try {
      const existingArrayString = await AsyncStorage.getItem(key);

      const existingArray = existingArrayString ? JSON.parse(existingArrayString) : [];

      const existingIndex = existingArray.findIndex((item: any) => item.id === objectToAdd.id);

      if (existingIndex !== -1) {
        existingArray[existingIndex] = { ...existingArray[existingIndex], ...objectToAdd };
      } else {
        existingArray.push(objectToAdd);
      }

      const newArrayString = JSON.stringify(existingArray);
      await AsyncStorage.setItem(key, newArrayString);

      console.log('Array stored successfully!');
    } catch (error) {
      console.error('Error storing array:', error);
    }
  }


  public static async retrieveArray(key: string): Promise<Device[]> {
    try {
      const arrayString = await AsyncStorage.getItem(key);
      
      if (arrayString && typeof arrayString === 'string') {
        const array: Device[] = JSON.parse(arrayString);
        return array;
      } else {
        console.log('No array found for the key');
        return [];
      }
    } catch (error) {
      console.error('Error retrieving array:', error);
      return [];
    }
  }

  public static async clearArray(key: string) {
    try {
      const emptyArray: Device[] = [];
      const emptyArrayString = JSON.stringify(emptyArray);
      await AsyncStorage.setItem(key, emptyArrayString);
  
      console.log('Array cleared successfully!');
    } catch (error) {
      console.error('Error clearing array:', error);
    }
  }
}