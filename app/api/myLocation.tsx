import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type RootStackParamList = {
  Home: undefined;
  // Add other screen params here if needed
};

const { width, height } = Dimensions.get('window');

interface UserLocation {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const MyLocation: React.FC = () => {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLocation, setHasLocation] = useState<boolean>(false);
  
  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const getCurrentLocation = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        Alert.alert('Location Access', 'Please enable location permissions in settings to use this feature.');
        setIsLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = currentLocation.coords;
      
      const newLocation = {
        latitude,
        longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      
      setLocation(newLocation);
      setHasLocation(true);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newLocation, 1000);
      }

      // Animation removed to prevent scrolling

    } catch (error) {
      setErrorMsg('Error getting location');
      Alert.alert('Location Error', 'Unable to retrieve your current location. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const zoomToLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        ...location,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      }, 1000);
    }
  };

  useEffect(() => {
    getCurrentLocation();
    // Keep scroll position at top when component mounts
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  return (
    <ScrollView 
      ref={scrollViewRef}
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={true}
      contentOffset={{ x: 0, y: 0 }}
      scrollEventThrottle={16}
      bounces={false}
      alwaysBounceVertical={false}
    >
      {/* Header with back button */}
      <View className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 pt-12 pb-6 shadow-lg">
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          className="mb-4 self-start"
        >
          <Ionicons name="arrow-back" size={28} color="black" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-blue-600 text-3xl font-bold">
            Xan's Location
          </Text>
        </View>
        <Text className="text-black text-center mt-2 text-lg">
          Find my exact position in real-time
        </Text>
      </View>

      {/* Fixed Button Container with high contrast */}
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }] 
        }}
        className="px-6 py-5 bg-white mx-4 mt-6 rounded-2xl"
      >
        <TouchableOpacity
          className={`bg-white rounded-xl py-4 px-6 mt-4 flex-row items-center justify-center border-2 border-blue-500 active:bg-blue-50 shadow-md ${
            isLoading ? 'opacity-90' : 'active:scale-95'
          }`}
          onPress={getCurrentLocation}
          disabled={isLoading}
        >
          <Ionicons 
            name={isLoading ? "refresh" : "locate"} 
            size={24} 
            color="#2563eb" 
          />
          <Text className="text-blue-600 text-lg font-bold ml-3">
            {isLoading ? 'Locating...' : 'Find My Location'}
          </Text>
        </TouchableOpacity>

        {hasLocation && (
          <TouchableOpacity
            onPress={zoomToLocation}
            className="bg-white rounded-xl py-4 px-6 mt-4 flex-row items-center justify-center border-2 border-blue-500 active:bg-blue-50 shadow-md"
          >
            <Ionicons name="search" size={20} color="#2563eb" />
            <Text className="text-blue-600 font-bold ml-3 text-base">
              Zoom to My Location
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Fixed Error Message */}
      {errorMsg && (
        <View className="mx-6 mt-4 bg-red-100 rounded-xl py-4 px-4 border-2 border-red-300 flex-row items-center shadow-md">
          <Ionicons name="warning" size={24} color="#dc2626" />
          <Text className="text-red-800 font-semibold ml-3 flex-1 text-base">{errorMsg}</Text>
        </View>
      )}

      {/* Map Container */}
      <View className="h-96 mx-4 my-4 rounded-2xl overflow-hidden border-2 border-gray-300 shadow-xl">
        {location ? (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            region={location}
            showsUserLocation={true}
            showsMyLocationButton={true}
            zoomEnabled={true}
            scrollEnabled={true}
            rotateEnabled={true}
            pitchEnabled={true}
            showsCompass={true}
            showsPointsOfInterest={true}
            customMapStyle={[
              {
                "elementType": "geometry",
                "stylers": [{"color": "#f5f5f5"}]
              },
              {
                "elementType": "labels.icon",
                "stylers": [{"visibility": "on"}]
              },
              {
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#616161"}]
              },
              {
                "elementType": "labels.text.stroke",
                "stylers": [{"color": "#f5f5f5"}]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [{"color": "#c9c9c9"}]
              },
              {
                "featureType": "road",
                "elementType": "geometry",
                "stylers": [{"color": "#ffffff"}]
              }
            ]}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title="You are here!"
              description="This is your exact current location"
            >
              <></>
            </Marker>
          </MapView>
        ) : (
          <View className="flex-1 justify-center items-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Text className="text-gray-700 text-xl font-bold text-center px-8">
              {isLoading ? 'Finding your location...' : 'Ready to locate you!'}
            </Text>
          </View>
        )}
      </View>

      {/* Location Coordinates Card */}
      {location && (
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="bg-white mx-4 mb-6 rounded-2xl p-5 shadow-xl border border-gray-200"
        >
          <View className="flex-row items-center mb-4">
            <Ionicons name="navigate" size={24} color="#2563eb" />
            <Text className="text-blue-600 font-bold ml-3 text-lg">Location Coordinates</Text>
          </View>
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-semibold">LATITUDE</Text>
              <Text className="text-gray-900 font-mono text-lg font-bold">
                {location.latitude.toFixed(6)}
              </Text>
            </View>
            <View className="w-px h-10 bg-gray-300 mx-3" />
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-semibold">LONGITUDE</Text>
              <Text className="text-gray-900 font-mono text-lg font-bold">
                {location.longitude.toFixed(6)}
              </Text>
            </View>
          </View>
          
          {/* Copy Coordinates Button */}
          <TouchableOpacity className="bg-gray-100 rounded-xl py-3 px-5 mt-4 flex-row items-center justify-center border border-gray-300 active:bg-gray-200">
            <Ionicons name="copy-outline" size={18} color="#374151" />
            <Text className="text-gray-800 font-semibold ml-2 text-base">Copy Coordinates</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Additional Info Section */}
      <View className="bg-blue-100 mx-4 mb-8 rounded-2xl p-5 border-2 border-blue-300 shadow-md">
        <View className="flex-row items-center mb-3">
          <Ionicons name="information-circle" size={24} color="#1d4ed8" />
          <Text className="text-blue-800 font-bold ml-3 text-lg">How it works</Text>
        </View>
        <Text className="text-blue-900 text-base leading-6">
          • Tap "Find My Location" to get your current position{"\n"}
          • Use "Zoom to My Location" to focus closely{"\n"}
          • Scroll and pinch to explore the map{"\n"}
          • Your coordinates are displayed below
        </Text>
      </View>

      {/* Spacer for better scrolling */}
      <View className="h-20" />
    </ScrollView>
  );
};

export default MyLocation;