import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ViewStyle } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets, EdgeInsets } from 'react-native-safe-area-context';
import "../global.css";

// This component handles the bottom navigation bar on Android
function NavigationBarHandler() {
  const insets = useSafeAreaInsets();
  
  const navigationBarStyle: ViewStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: insets.bottom || 0,
    backgroundColor: '#C0C0C0', // Silver color for the navigation bar
  };

  return <View style={navigationBarStyle} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={{ flex: 1, backgroundColor: '#C0C0C0' }}>
        <Stack screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 300,
        }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="homepage" options={{ animation: 'fade' }} />
          <Stack.Screen name="api/weatherApi" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="api/myLocation" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <NavigationBarHandler />
      </View>
    </SafeAreaProvider>
  );
}