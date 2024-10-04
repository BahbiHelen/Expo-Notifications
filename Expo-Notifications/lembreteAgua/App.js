import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Platform, StyleSheet, TouchableOpacity, FlatList, ImageBackground, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as Application from 'expo-application';
import { StatusBar } from 'expo-status-bar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import aguaGif from './assets/agua.gif';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [dailyWaterIntake, setDailyWaterIntake] = useState('');
  const [wakeUpTime, setWakeUpTime] = useState(new Date());
  const [bedTime, setBedTime] = useState(new Date());
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showBedPicker, setShowBedPicker] = useState(false);
  const [waterTimes, setWaterTimes] = useState([]);
  const [completedTimes, setCompletedTimes] = useState([]);

  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const calculateIntervals = () => {
    const wakeHours = wakeUpTime.getHours() + wakeUpTime.getMinutes() / 60;
    const bedHours = bedTime.getHours() + bedTime.getMinutes() / 60;
    const totalHours = bedHours - wakeHours;

    if (totalHours > 0) {
      const intervalCount = Math.floor(totalHours);
      const times = generateWaterTimes(intervalCount);
      setWaterTimes(times);
      setCompletedTimes(new Array(times.length).fill(false));
      scheduleWaterReminders(times);
      Alert.alert('Atenção', `Notificações agendadas para ${times.length} lembretes de água para hoje!`, [{ text: 'Tudo bem!' }]);
    } else {
      Alert.alert('Atenção', 'O horário de dormir deve ser depois do horário de acordar.');
    }
  };

  const generateWaterTimes = (intervalCount) => {
    let currentTime = new Date(wakeUpTime);
    const times = [];

    for (let i = 1; i <= intervalCount; i++) {
      currentTime.setHours(currentTime.getHours() + 1);
      times.push(new Date(currentTime));
    }

    return times;
  };

  const scheduleWaterReminders = async (times) => {
    const intervalVolume = Math.floor(Number(dailyWaterIntake) / times.length); // Mudança: garante que o valor seja um número

    for (let time of times) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Hora de beber água!',
          body: `Beba ${intervalVolume}ml de água.`,
          sound: 'default',
        },
        trigger: { hour: time.getHours(), minute: time.getMinutes(), repeats: false },
      });
    }
  };

  const toggleCompletion = (index) => {
    const updatedCompletedTimes = [...completedTimes];
    updatedCompletedTimes[index] = !updatedCompletedTimes[index];
    setCompletedTimes(updatedCompletedTimes);
  };

  const onWakeTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || wakeUpTime;
    setShowWakePicker(Platform.OS === 'ios');
    setWakeUpTime(currentDate);
  };

  const onBedTimeChange = (event, selectedDate) => {
    const currentDate = selectedDate || bedTime;
    setShowBedPicker(Platform.OS === 'ios');
    setBedTime(currentDate);
  };

  const testNotification = async () => {
    if (waterTimes.length > 0) {
      const intervalVolume = Math.floor(Number(dailyWaterIntake) / waterTimes.length);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Teste de Notificação',
          body: `Beba ${intervalVolume}ml de água.`,
          sound: 'default',
        },
        trigger: null,
      });
    } else {
      Alert.alert('Atenção', 'Por favor, calcule os lembretes antes de testar a notificação.');
    }
  };

  const renderWaterTime = ({ item, index }) => {
    const intervalVolume = Math.floor(Number(dailyWaterIntake) / waterTimes.length);
    return (
      <TouchableOpacity onPress={() => toggleCompletion(index)} style={styles.timeItem}>
        <MaterialCommunityIcons
          name={completedTimes[index] ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={completedTimes[index] ? '#00796b' : '#333'}
        />
        <Text style={[styles.timeText, completedTimes[index] && styles.completedText]}>
          {item.getHours().toString().padStart(2, '0')}:{item.getMinutes().toString().padStart(2, '0')} ({intervalVolume}ml)
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ImageBackground source={aguaGif} style={styles.background}>
      <View style={styles.container}>
        <StatusBar style="light" />

        <Text style={styles.header}>Lembrete de Hidratação</Text>

        <TouchableOpacity style={[styles.button, styles.testButton]} onPress={testNotification}>
          <MaterialCommunityIcons name="bell-check" size={20} color="#fff" />
          <Text style={styles.buttonText}> Testar Notificação</Text>
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Informe o valor em ml"
            value={dailyWaterIntake} // Mantém como string
            onChangeText={(text) => setDailyWaterIntake(text.replace(/[^0-9]/g, ''))} // Garante que apenas números sejam inseridos
          />
          <MaterialCommunityIcons name="pencil" size={24} color="#00509d" />
        </View>

        <TouchableOpacity style={styles.button} onPress={() => setShowWakePicker(true)}>
          <MaterialCommunityIcons name="white-balance-sunny" size={20} color="#fff" />
          <Text style={styles.buttonText}> Definir horário de acordar</Text>
        </TouchableOpacity>
        {showWakePicker && (
          <DateTimePicker
            value={wakeUpTime}
            mode="time"
            display="default"
            onChange={onWakeTimeChange}
          />
        )}

        <TouchableOpacity style={styles.button} onPress={() => setShowBedPicker(true)}>
          <MaterialCommunityIcons name="bed" size={20} color="#fff" />
          <Text style={styles.buttonText}> Definir horário de dormir</Text>
        </TouchableOpacity>
        {showBedPicker && (
          <DateTimePicker
            value={bedTime}
            mode="time"
            display="default"
            onChange={onBedTimeChange}
          />
        )}

        <TouchableOpacity style={[styles.button, styles.calculateButton]} onPress={calculateIntervals}>
          <MaterialCommunityIcons name="calculator" size={20} color="#E65729" />
          <Text style={styles.calculateButtonText}> Calcular lembretes</Text>
        </TouchableOpacity>

        {waterTimes.length > 0 && (
          <>
            <View style={styles.separator} />
            <FlatList
              data={waterTimes}
              renderItem={renderWaterTime}
              keyExtractor={(item, index) => index.toString()}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
            />
          </>
        )}
      </View>
    </ImageBackground>
  );
}

async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    Alert.alert('Failed to get push token for push notification!');
    return;
  }

  const projectId = await Application.getProjectIdAsync();
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: projectId,
  })).data;

  console.log(token);

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical:'center',
    marginBottom: 30,
    marginTop: 40,
    color: '#00509d',
    backgroundColor:'white',
    borderRadius: 10,
    height:60,
    
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold'

  },
  button: {
    backgroundColor: '#E65729',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calculateButton: {
    backgroundColor: '#fff',
    borderColor: '#E65729',
    borderWidth: 2,
  },
  calculateButtonText: {
    color: '#E65729',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: 'blue',
  },
  separator: {
    borderBottomColor: 'white',
    borderBottomWidth: 5,
    marginVertical: 20,
  },
  timeItem: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    margin: 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 18,
    color: '#00796b',
    marginLeft: 10,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#ccc',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});
