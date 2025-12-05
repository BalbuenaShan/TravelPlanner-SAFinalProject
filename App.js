// App.js - MAIN FILE
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import screens
import TripsScreen from './src/screens/TripsScreen';
import AddTripScreen from './src/screens/AddTripScreen';
import TripDetailsScreen from './src/screens/TripDetailsScreen';
import SplashScreen from './src/screens/SplashScreen'; // <-- new

const Stack = createStackNavigator();

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F3F4F6', // same as your other screens
  },
};

export default function App() {
  return (
    <NavigationContainer theme={AppTheme}>
      <Stack.Navigator
        initialRouteName="Splash" // <-- start at splash
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F3F4F6' },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Trips" component={TripsScreen} />
        <Stack.Screen name="AddTrip" component={AddTripScreen} />
        <Stack.Screen name="TripDetails" component={TripDetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
