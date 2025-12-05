// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { StyleSheet, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Trips'); // Go to main screen
    }, 3500); // 2 seconds splash duration

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#2563EB', 'rgba(23, 100, 255, 1)']}
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <Image
        source={require('../../assets/TPLogo.png')} // <-- adjust path if needed
        style={styles.logo}
        resizeMode="contain"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
});
