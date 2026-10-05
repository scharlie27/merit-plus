import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  Animated,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

export default function App() {
  const [todayMerit, setTodayMerit] = useState(0);
  const [totalMerit, setTotalMerit] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const todayRef = useRef(0);
  const totalRef = useRef(0);
  const soundRef = useRef(null);

  const buttonScale = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const floatOpacity = useRef(new Animated.Value(0)).current;

  const getToday = () => {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const loadData = async () => {
    try {
      const savedTotal = await AsyncStorage.getItem('totalMerit');
      const savedToday = await AsyncStorage.getItem('todayMerit');
      const savedDate = await AsyncStorage.getItem('meritDate');
      const savedSound = await AsyncStorage.getItem('soundOn');

      const currentDate = getToday();

      const total = savedTotal ? parseInt(savedTotal, 10) : 0;

      let today = 0;

      if (savedDate === currentDate) {
        today = savedToday ? parseInt(savedToday, 10) : 0;
      } else {
        await AsyncStorage.setItem('todayMerit', '0');
        await AsyncStorage.setItem('meritDate', currentDate);
      }

      const soundEnabled =
        savedSound === null ? true : savedSound === 'true';

      todayRef.current = today;
      totalRef.current = total;

      setTodayMerit(today);
      setTotalMerit(total);
      setSoundOn(soundEnabled);
      setLoaded(true);
    } catch (error) {
      console.log('Load error:', error);
      setLoaded(true);
    }
  };

  const loadSound = async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        require('./mokugyo.mp3'),
        { shouldPlay: false }
      );

      soundRef.current = sound;
    } catch (error) {
      console.log('Sound load error:', error);
    }
  };

  useEffect(() => {
    loadData();
    loadSound();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const playMokugyo = async () => {
    if (!soundOn) return;

    try {
      if (soundRef.current) {
        await soundRef.current.replayAsync();
      }
    } catch (error) {
      console.log('Sound play error:', error);
    }
  };

  const toggleSound = async () => {
    const newValue = !soundOn;

    setSoundOn(newValue);

    try {
      await AsyncStorage.setItem('soundOn', String(newValue));
    } catch (error) {
      console.log('Sound setting save error:', error);
    }
  };

  const playAnimation = () => {
    buttonScale.setValue(1);
    floatY.setValue(0);
    floatOpacity.setValue(1);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(buttonScale, {
          toValue: 0.91,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.spring(buttonScale, {
          toValue: 1,
          friction: 4,
          tension: 130,
          useNativeDriver: true,
        }),
      ]),

      Animated.timing(floatY, {
        toValue: -55,
        duration: 750,
        useNativeDriver: true,
      }),

      Animated.timing(floatOpacity, {
        toValue: 0,
        duration: 750,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const addMerit = () => {
    if (!loaded) return;

    playMokugyo();
    Vibration.vibrate(35);
    playAnimation();

    todayRef.current += 1;
    totalRef.current += 1;

    const newToday = todayRef.current;
    const newTotal = totalRef.current;

    setTodayMerit(newToday);
    setTotalMerit(newTotal);

    AsyncStorage.multiSet([
      ['todayMerit', String(newToday)],
      ['totalMerit', String(newTotal)],
      ['meritDate', getToday()],
    ]).catch((error) => {
      console.log('Save error:', error);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.counterLabel}>今日功德</Text>
          <Text style={styles.counterNumber}>{todayMerit}</Text>
        </View>

        <View style={styles.topRight}>
          <TouchableOpacity
            style={styles.soundButton}
            onPress={toggleSound}
            activeOpacity={0.7}
          >
            <Text style={styles.soundIcon}>
              {soundOn ? '🔊' : '🔇'}
            </Text>
          </TouchableOpacity>

          <View style={styles.totalCounter}>
            <Text style={styles.counterLabel}>總功德</Text>
            <Text style={styles.counterNumber}>{totalMerit}</Text>
          </View>
        </View>
      </View>

      <View style={styles.center}>
        <Text style={styles.lotus}>🪷</Text>

        <Text style={styles.title}>功德+</Text>

        <Text style={styles.subtitle}>
          一念善心，一點功德
        </Text>

        <View style={styles.buttonArea}>
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.floatingText,
              {
                opacity: floatOpacity,
                transform: [{ translateY: floatY }],
              },
            ]}
          >
            功德 +1 ✨
          </Animated.Text>

          <Animated.View
            style={{
              transform: [{ scale: buttonScale }],
            }}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.meritButton}
              onPress={addMerit}
            >
              <Text style={styles.plus}>+1</Text>
              <Text style={styles.buttonText}>功德</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      <Text style={styles.footer}>
        每一念善意，都值得被記住
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#17130d',
    paddingTop: 55,
    paddingHorizontal: 25,
    paddingBottom: 30,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  topRight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  totalCounter: {
    alignItems: 'flex-end',
  },

  soundButton: {
    marginRight: 18,
    padding: 5,
  },

  soundIcon: {
    fontSize: 24,
  },

  counterLabel: {
    color: '#9d8a67',
    fontSize: 14,
  },

  counterNumber: {
    color: '#f5d58a',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 3,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  lotus: {
    fontSize: 54,
    marginBottom: 8,
  },

  title: {
    color: '#f5d58a',
    fontSize: 42,
    fontWeight: 'bold',
    letterSpacing: 3,
  },

  subtitle: {
    color: '#a99570',
    fontSize: 15,
    marginTop: 8,
    marginBottom: 45,
    letterSpacing: 2,
  },

  buttonArea: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  meritButton: {
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: '#9c682c',
    borderWidth: 5,
    borderColor: '#d9ae62',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },

  plus: {
    color: '#fff4d0',
    fontSize: 42,
    fontWeight: 'bold',
  },

  buttonText: {
    color: '#fff4d0',
    fontSize: 21,
    marginTop: 3,
    letterSpacing: 5,
  },

  floatingText: {
    position: 'absolute',
    top: 65,
    color: '#fff1ad',
    fontSize: 20,
    fontWeight: 'bold',
    zIndex: 10,
  },

  footer: {
    color: '#776d58',
    textAlign: 'center',
    fontSize: 13,
  },
});
