// earthquakeApi.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Types
export interface EarthquakeProperties {
  mag: number;
  place: string;
  time: number;
  updated: number;
  url: string;
  detail: string;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  title: string;
}

export interface EarthquakeGeometry {
  type: string;
  coordinates: [number, number, number];
}

export interface EarthquakeFeature {
  type: string;
  properties: EarthquakeProperties;
  geometry: EarthquakeGeometry;
  id: string;
}

interface EarthquakeTrackerProps {
  // No props needed for screen version
}

// Philippine regions and major cities
const PHILIPPINE_REGIONS = [
  { name: 'Davao City', lat: 7.1907, lng: 125.4553, region: 'Mindanao' },
  { name: 'Metro Manila', lat: 14.5995, lng: 120.9842, region: 'Luzon' },
  { name: 'Cebu City', lat: 10.3157, lng: 123.8854, region: 'Visayas' },
  { name: 'Zamboanga City', lat: 6.9214, lng: 122.0790, region: 'Mindanao' },
  { name: 'Cagayan de Oro', lat: 8.4542, lng: 124.6319, region: 'Mindanao' },
  { name: 'Iloilo City', lat: 10.7202, lng: 122.5621, region: 'Visayas' },
  { name: 'Bacolod City', lat: 10.6270, lng: 122.9918, region: 'Visayas' },
  { name: 'General Santos', lat: 6.1164, lng: 125.1716, region: 'Mindanao' },
  { name: 'Baguio City', lat: 16.4023, lng: 120.5960, region: 'Luzon' },
  { name: 'Tacloban City', lat: 11.2447, lng: 125.0031, region: 'Visayas' }
];

// Global regions for wider monitoring
const WORLD_REGIONS = [
  { name: 'Philippines', lat: 12.8797, lng: 121.7740, region: 'Southeast Asia' },
  { name: 'Japan', lat: 36.2048, lng: 138.2529, region: 'East Asia' },
  { name: 'Indonesia', lat: -0.7893, lng: 113.9213, region: 'Southeast Asia' },
  { name: 'California, USA', lat: 36.7783, lng: -119.4179, region: 'North America' },
  { name: 'Chile', lat: -35.6751, lng: -71.5430, region: 'South America' },
  { name: 'Turkey', lat: 38.9637, lng: 35.2433, region: 'Middle East' },
  { name: 'New Zealand', lat: -40.9006, lng: 174.8860, region: 'Oceania' },
  { name: 'Alaska, USA', lat: 61.2181, lng: -149.9003, region: 'North America' }
];

// Davao City coordinates (default)
const DAVAO_COORDINATES = {
  latitude: 7.1907,
  longitude: 125.4553
};

// Alert thresholds
const ALERT_THRESHOLDS = {
  LOW: 4.0,
  MEDIUM: 5.5,
  HIGH: 7.0,
  DANGEROUS: 8.0
};

// Global notification context
interface NotificationContextType {
  showNotification: (message: string, level: AlertLevel) => void;
  currentAlert: string;
  alertLevel: AlertLevel;
}

type AlertLevel = 'low' | 'medium' | 'high' | 'danger' | 'none';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Global notification component that shows on all pages
export const GlobalEarthquakeAlert: React.FC = () => {
  const { currentAlert, alertLevel } = useEarthquakeNotifications();
  
  if (!currentAlert || alertLevel === 'none') return null;

  const getAlertStyles = () => {
    switch (alertLevel) {
      case 'danger': return 'bg-red-600 text-white border-red-800';
      case 'high': return 'bg-orange-500 text-white border-orange-700';
      case 'medium': return 'bg-yellow-500 text-black border-yellow-600';
      case 'low': return 'bg-blue-500 text-white border-blue-700';
      default: return 'bg-gray-200 text-black';
    }
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 p-4 rounded-lg shadow-lg border-2 animate-pulse ${getAlertStyles()}`}>
      <div className="flex items-center space-x-3">
        <span className="text-xl">🌍</span>
        <div>
          <strong>Earthquake Alert:</strong> {currentAlert}
        </div>
      </div>
    </div>
  );
};

// Hook for using earthquake notifications
export const useEarthquakeNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useEarthquakeNotifications must be used within a EarthquakeNotificationProvider');
  }
  return context;
};

// Notification provider
export const EarthquakeNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAlert, setCurrentAlert] = useState<string>('');
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('none');

  const showNotification = (message: string, level: AlertLevel) => {
    setCurrentAlert(message);
    setAlertLevel(level);
    
    // Auto-hide after 10 seconds for low/medium, 30 seconds for high/danger
    const duration = level === 'high' || level === 'danger' ? 30000 : 10000;
    setTimeout(() => {
      setCurrentAlert('');
      setAlertLevel('none');
    }, duration);
  };

  return (
    <NotificationContext.Provider value={{ showNotification, currentAlert, alertLevel }}>
      {children}
      <GlobalEarthquakeAlert />
    </NotificationContext.Provider>
  );
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const EarthquakeTracker: React.FC<EarthquakeTrackerProps> = () => {
  const [earthquakes, setEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [nearbyEarthquakes, setNearbyEarthquakes] = useState<EarthquakeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastMagnitude, setLastMagnitude] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(PHILIPPINE_REGIONS[0]); // Default to Davao
  const [showRegionSelector, setShowRegionSelector] = useState(false);
  const [magnitudeFilter, setMagnitudeFilter] = useState(0);
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('hour');
  const [viewMode, setViewMode] = useState<'nearby' | 'global'>('nearby');
  const { showNotification } = useEarthquakeNotifications();
  const router = useRouter();

  // Fetch earthquake data with focus on selected region
  const fetchEarthquakes = async () => {
    try {
      setLoading(true);
      const timeRangeUrl = {
        hour: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
        day: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
        week: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'
      };
      
      const response = await fetch(timeRangeUrl[timeRange]);
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json() as { features: EarthquakeFeature[] };
      const allQuakes = data.features.sort((a: EarthquakeFeature, b: EarthquakeFeature) => 
        b.properties.time - a.properties.time
      );

      // Filter earthquakes near selected region (within 500km radius)
      const nearSelected = allQuakes.filter((quake: EarthquakeFeature) => {
        const [longitude, latitude] = quake.geometry.coordinates;
        const distance = calculateDistance(
          selectedRegion.lat, 
          selectedRegion.lng, 
          latitude, 
          longitude
        );
        return distance <= 500; // Within 500km of selected region
      });

      // Get global significant earthquakes (magnitude based on filter)
      const globalSignificant = allQuakes.filter((quake: EarthquakeFeature) => 
        quake.properties.mag >= magnitudeFilter
      ).slice(0, 20);

      setEarthquakes(globalSignificant);
      setNearbyEarthquakes(nearSelected);
      
      // Check for alerts
      checkMagnitudeAlerts(nearSelected, globalSignificant);
      
      setError(null);
    } catch (err) {
      setError('Failed to load earthquake data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check for magnitude alerts and send notifications
  const checkMagnitudeAlerts = (nearbyQuakes: EarthquakeFeature[], globalQuakes: EarthquakeFeature[]) => {
    const allQuakes = [...nearbyQuakes, ...globalQuakes.slice(0, 5)];
    
    if (allQuakes.length === 0) return;

    const latestQuake = allQuakes[0];
    const latestMag = latestQuake.properties.mag;
    const [longitude, latitude] = latestQuake.geometry.coordinates;
    
    // Calculate distance from selected region
    const distanceFromRegion = calculateDistance(
      selectedRegion.lat,
      selectedRegion.lng,
      latitude,
      longitude
    );

    // Determine if it's near selected region
    const isNearRegion = distanceFromRegion <= 500;
    const locationInfo = isNearRegion ? `NEAR ${selectedRegion.name.toUpperCase()} (${distanceFromRegion.toFixed(0)}km away)` : 'GLOBAL';

    let message = '';
    let level: AlertLevel = 'none';

    // High magnitude alerts
    if (latestMag >= ALERT_THRESHOLDS.DANGEROUS) {
      message = `🚨 EXTREME ALERT! M${latestMag} earthquake ${locationInfo}`;
      level = 'danger';
    } else if (latestMag >= ALERT_THRESHOLDS.HIGH) {
      message = `⚠️ MAJOR ALERT! M${latestMag} earthquake ${locationInfo}`;
      level = 'high';
    } else if (latestMag >= ALERT_THRESHOLDS.MEDIUM && isNearRegion) {
      message = `🔔 SIGNIFICANT ALERT! M${latestMag} earthquake near ${selectedRegion.name}`;
      level = 'medium';
    } else if (latestMag >= ALERT_THRESHOLDS.LOW && isNearRegion) {
      message = `ℹ️ EARTHQUAKE ALERT! M${latestMag} earthquake near ${selectedRegion.name}`;
      level = 'low';
    }

    // Magnitude increase detection
    if (lastMagnitude !== null) {
      const magnitudeChange = latestMag - lastMagnitude;
      
      if (magnitudeChange > 2.0) {
        message = `📈 RAPID INCREASE! Magnitude jumped from M${lastMagnitude.toFixed(1)} to M${latestMag.toFixed(1)} ${locationInfo}`;
        level = level === 'none' ? 'high' : level;
      } else if (magnitudeChange > 1.0) {
        message = `↗️ INCREASING ACTIVITY! Magnitude rising ${locationInfo}`;
        if (level === 'none') level = 'medium';
      }
    }

    // Tsunami warning
    if (latestQuake.properties.tsunami === 1 && isNearRegion) {
      message = `🌊 TSUNAMI WARNING! M${latestMag} earthquake near ${selectedRegion.name}`;
      level = 'danger';
    }

    setLastMagnitude(latestMag);

    if (message && level !== 'none') {
      showNotification(message, level);
    }
  };

  // Filter earthquakes based on search query
  const filteredEarthquakes = (earthquakes: EarthquakeFeature[]) => {
    if (!searchQuery) return earthquakes;
    return earthquakes.filter(quake => 
      quake.properties.place.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Get earthquake risk level description
  const getRiskDescription = (magnitude: number): string => {
    if (magnitude >= 8.0) return 'Catastrophic damage expected';
    if (magnitude >= 7.0) return 'Major damage likely';
    if (magnitude >= 6.0) return 'Strong earthquake - damaging';
    if (magnitude >= 5.0) return 'Moderate earthquake - felt widely';
    if (magnitude >= 4.0) return 'Light earthquake - felt locally';
    if (magnitude >= 3.0) return 'Minor earthquake - barely felt';
    return 'Micro earthquake - not felt';
  };

  // Get simple earthquake description for regular users
  const getSimpleDescription = (magnitude: number): string => {
    if (magnitude >= 7.0) return '🔴 Very Dangerous';
    if (magnitude >= 6.0) return '🟠 Dangerous';
    if (magnitude >= 5.0) return '🟡 Strong';
    if (magnitude >= 4.0) return '🟢 Moderate';
    return '🔵 Light';
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get magnitude color
  const getMagnitudeColor = (mag: number) => {
    if (mag >= 7.0) return 'text-red-600 font-bold';
    if (mag >= 5.5) return 'text-orange-500 font-bold';
    if (mag >= 4.0) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Get distance from selected region
  const getDistanceFromRegion = (latitude: number, longitude: number): string => {
    const distance = calculateDistance(
      selectedRegion.lat,
      selectedRegion.lng,
      latitude,
      longitude
    );
    return `${distance.toFixed(0)}km from ${selectedRegion.name}`;
  };

  // Auto-refresh based on time range
  useEffect(() => {
    fetchEarthquakes();
    const refreshInterval = timeRange === 'hour' ? 30000 : timeRange === 'day' ? 300000 : 600000;
    const interval = setInterval(fetchEarthquakes, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedRegion, magnitudeFilter, timeRange]);

  return (
    <SafeAreaView className="flex-1 bg-gradient-to-b from-blue-50 to-white">
      {/* Enhanced Header */}
      <View className="bg-gradient-to-r from-blue-600 to-blue-700 p-4">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-black">Safety Earthquake Tracker</Text>
            <Text className="text-sm text-gray mt-2">Monitor earthquakes for the safety</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center bg-black/10 rounded-full"
          >
            <Text className="text-white text-2xl font-bold">×</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View className="bg-black/10 border border-black/20 rounded-lg p-0.1 mb-3 flex-row items-center">
          <Text className="text-black/60 text-lg mr-3 left-2">🔍</Text>
          <TextInput
            placeholder="Search earthquake location..."
            placeholderTextColor="#00000099"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="text-white text-base flex-1"
          />
        </View>

        {/* Region & Filter Controls */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            onPress={() => setShowRegionSelector(true)}
            className="flex-1 bg-black/5 border border-black/30 rounded-lg p-3 flex-row items-center"
          >
            <Text className="text-black font-medium">📍 {selectedRegion.name}</Text>
            <Text className="text-black/60 ml-auto">▼</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => setViewMode(viewMode === 'nearby' ? 'global' : 'nearby')}
            className="p-3"
          >
            <Text className="text-black font-medium">
              {viewMode === 'nearby' ? '🏠 Nearby' : '🌎 Global'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Stats & Controls */}
      <View className="bg-white p-4 border-b border-gray-200">
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <View className={`w-3 h-3 rounded-full mr-2 ${loading ? 'bg-yellow-500' : 'bg-green-500'}`} />
            <Text className="text-sm text-gray-600">
              {loading ? 'Updating...' : `Last update: ${new Date().toLocaleTimeString()}`}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={fetchEarthquakes}
            disabled={loading}
            className={`px-4 py-2 rounded-full flex-row items-center ${loading ? 'bg-gray-300' : 'bg-blue-500'}`}
          >
            <Text className="text-white font-medium mr-1">
              {loading ? 'Refreshing' : 'Refresh'}
            </Text>
            <Text className="text-white">🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Time Range & Magnitude Filter */}
        <View className="px-4">
          <View className="flex-row right-5 justify-start">
            <View className="w-48">
              <Text className="text-xs text-gray-500 mb-1">Time Range</Text>
              <View className="flex-row bg-gray-100 rounded-lg p-1">
                {(['hour', 'day', 'week'] as const).map((range) => (
                  <TouchableOpacity
                    key={range}
                    onPress={() => setTimeRange(range)}
                    className={`flex-1 py-1.5 rounded ${timeRange === range ? 'bg-blue-500' : 'bg-transparent'}`}
                  >
                    <Text className={`text-center text-xs font-medium ${timeRange === range ? 'text-white' : 'text-gray-600'}`}>
                      {range === 'hour' ? '1 Hour' : range === 'day' ? '1 Day' : '1 Week'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View className="w-56 ml-2 right-1">
              <Text className="text-xs text-gray-500 mb-1">Min Magnitude</Text>
              <View className="flex-row bg-gray-100 rounded-lg p-1">
                {[0, 4, 5, 6].map((mag) => (
                  <TouchableOpacity
                    key={mag}
                    onPress={() => setMagnitudeFilter(mag)}
                    className={`flex-1 py-1.5 rounded ${magnitudeFilter === mag ? 'bg-blue-500' : 'bg-transparent'}`}
                  >
                    <Text className={`text-center text-xs font-medium ${magnitudeFilter === mag ? 'text-white' : 'text-gray-600'}`}>
                      {mag === 0 ? 'All' : mag === 4 ? 'Light' : mag === 5 ? 'Moderate' : 'Strong'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Enhanced Content - No Scroll */}
      <View className="flex-1 px-4">
        {loading && earthquakes.length === 0 ? (
          <View className="items-center py-12">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-4 text-gray-600 text-lg">Loading earthquake data...</Text>
            <Text className="text-gray-500 text-sm mt-2">Please wait while we fetch the latest information</Text>
          </View>
        ) : error ? (
          <View className="items-center py-12 px-6">
            <Text className="text-6xl mb-4">⚠️</Text>
            <Text className="text-red-600 text-lg font-semibold mb-2">Connection Error</Text>
            <Text className="text-gray-600 text-center mb-6">{error}</Text>
            <TouchableOpacity 
              onPress={fetchEarthquakes}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Summary Cards */}
            <View className="flex-row space-x-4 my-2">
              <View className="flex-1 bg-white rounded-xl p-4 shadow-sm mx-1">
                <Text className="text-3xl font-bold top-2 text-blue-600">{nearbyEarthquakes.length}</Text>
                <Text className="text-xs text-gray-500 top-2">Near {selectedRegion.name}</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 shadow-sm mx-1">
                <Text className="text-3xl font-bold top-2 text-green-600">
                  {nearbyEarthquakes.length > 0 ? `M${Math.max(...nearbyEarthquakes.map(q => q.properties.mag)).toFixed(1)}` : '0.0'}
                </Text>
                <Text className="text-xs text-gray-500 top-2">Highest Magnitu.</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 shadow-sm mx-1">
                <Text className="text-3xl font-bold top-2 text-orange-600">{earthquakes.length}</Text>
                <Text className="text-xs text-gray-500 top-2">Global Total</Text>
              </View>
            </View>

            {viewMode === 'nearby' ? (
              /* Nearby Region Earthquakes */
              <View className="mb-6">
                <View className="flex-row items-center mb-4">
                  <Text className="text-red-500 text-2xl mr-3">📍</Text>
                  <View className="flex-1">
                    <Text className="font-bold text-xl text-gray-800">Near {selectedRegion.name}</Text>
                    <Text className="text-gray-500 text-sm">Within 500km radius • {selectedRegion.region}</Text>
                  </View>
                </View>

                {filteredEarthquakes(nearbyEarthquakes).length > 0 ? (
                  <View className="items-center">
                    {filteredEarthquakes(nearbyEarthquakes).map((quake: EarthquakeFeature) => {
                      const [longitude, latitude] = quake.geometry.coordinates;
                      const magnitude = quake.properties.mag;
                      return (
                        <View key={quake.id} className="bg-white rounded-xl p-4 mb-6 shadow-sm border-l-4 border-red-400 w-11/12">
                          <View className="flex-row justify-between items-start mb-3">
                            <View className="flex-1">
                              <View className="flex-row items-center mb-2">
                                <Text className={`text-3xl font-bold mr-3 ${getMagnitudeColor(magnitude)}`}>
                                  M{magnitude.toFixed(1)}
                                </Text>
                                <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-lg">{quake.properties.place}</Text>
                                <Text className="text-gray-500 text-sm">
                                  {formatDate(quake.properties.time)} • {getDistanceFromRegion(latitude, longitude)}
                                </Text>
                              </View>
                            </View>
                            
                            {/* Simple Risk Description */}
                            <View className="bg-gray-50 rounded-lg p-3 mt-2">
                              <Text className="font-semibold text-gray-700 mb-1">
                                {getSimpleDescription(magnitude)}
                              </Text>
                              <Text className="text-gray-600 text-sm">
                                {getRiskDescription(magnitude)}
                              </Text>
                            </View>
                          </View>
                          
                          {quake.properties.tsunami === 1 && (
                            <View className="bg-red-100 px-3 py-1 rounded-full">
                              <Text className="text-red-800 text-sm font-bold">🌊 TSUNAMI</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                  </View>
                ) : (
                  <View className="items-center py-8 bg-white rounded-xl">
                    <Text className="text-6xl mb-3">✅</Text>
                    <Text className="text-lg font-semibold text-gray-700 mb-1">All Clear!</Text>
                    <Text className="text-gray-500 text-center">
                      No earthquake activity near {selectedRegion.name} in the selected time range
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              /* Global Significant Earthquakes */
              <View className="mb-6">
                <View className="flex-row items-center mb-4">
                  <Text className="text-blue-500 text-2xl mr-3">🌎</Text>
                  <View className="flex-1">
                    <Text className="font-bold text-xl text-gray-800">Global Earthquakes</Text>
                    <Text className="text-gray-500 text-sm">Magnitude {magnitudeFilter}+ • Last {timeRange}</Text>
                  </View>
                </View>

                <View className="items-center">
                  {filteredEarthquakes(earthquakes).map((quake: EarthquakeFeature) => {
                    const [longitude, latitude] = quake.geometry.coordinates;
                    const magnitude = quake.properties.mag;
                    const distance = calculateDistance(
                      selectedRegion.lat,
                      selectedRegion.lng,
                      latitude,
                      longitude
                    );
                    
                    return (
                      <View key={quake.id} className="bg-white rounded-xl p-4 mb-6 shadow-sm w-11/12">
                        <View className="flex-row justify-between items-start mb-3">
                          <View className="flex-1">
                            <View className="flex-row items-center mb-2">
                              <Text className={`text-3xl font-bold mr-3 ${getMagnitudeColor(magnitude)}`}>
                                M{magnitude.toFixed(1)}
                              </Text>
                              <View className="flex-1">
                                <Text className="font-semibold text-gray-800 text-lg">{quake.properties.place}</Text>
                              <Text className="text-gray-500 text-sm">
                                {formatDate(quake.properties.time)} • {distance.toFixed(0)}km from {selectedRegion.name}
                              </Text>
                            </View>
                          </View>
                          
                          {/* Simple Risk Description */}
                          <View className="bg-gray-50 rounded-lg p-3 mt-2">
                            <Text className="font-semibold text-gray-700 mb-1">
                              {getSimpleDescription(magnitude)}
                            </Text>
                            <Text className="text-gray-600 text-sm">
                              {getRiskDescription(magnitude)}
                            </Text>
                          </View>
                        </View>
                        
                        {distance <= 1000 && (
                          <View className="bg-orange-100 px-3 py-1 rounded-full">
                            <Text className="text-orange-800 text-sm font-bold">📍 Near Region</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
                </View>
              </View>
            )}

            {/* Enhanced Footer */}
            <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-10 bottom-8">
              <Text className="text-center text-lg font-semibold text-gray-800 mb-2">
              Currently monitoring: {selectedRegion.name}
              </Text>
              <Text className="text-center text-sm text-gray-600 mb-3">
                Location: {selectedRegion.lat.toFixed(4)}°N, {selectedRegion.lng.toFixed(4)}°E
              </Text>
              <View className="border-t border-gray-200 pt-3">
                <Text className="text-center text-xs text-gray-500 mb-1">
                  Data provided by USGS Earthquake Hazards Program
                </Text>
                <Text className="text-center text-xs text-gray-500">
                  Auto-updates every {timeRange === 'hour' ? '30 seconds' : timeRange === 'day' ? '5 minutes' : '10 minutes'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Region Selector Modal - Compact Version */}
      <Modal
        visible={showRegionSelector}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between p-3 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-800">Select Region</Text>
            <TouchableOpacity
              onPress={() => setShowRegionSelector(false)}
              className="w-7 h-7 items-center justify-center"
            >
              <Text className="text-gray-500 text-lg">×</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView className="flex-1">
            <View className="p-3">
              <Text className="text-base font-semibold text-gray-800 mb-2">🇵🇭 Philippine Regions</Text>
              {PHILIPPINE_REGIONS.map((region) => (
                <TouchableOpacity
                  key={region.name}
                  onPress={() => {
                    setSelectedRegion(region);
                    setShowRegionSelector(false);
                  }}
                  className={`p-2.5 rounded-lg mb-1.5 flex-row items-center ${
                    selectedRegion.name === region.name ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                  }`}
                >
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800 text-sm">{region.name}</Text>
                    <Text className="text-gray-500 text-xs">{region.region}</Text>
                  </View>
                  {selectedRegion.name === region.name && (
                    <Text className="text-blue-500 text-base">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              
              <Text className="text-base font-semibold text-gray-800 mb-2 mt-4">🌍 World Regions</Text>
              {WORLD_REGIONS.map((region) => (
                <TouchableOpacity
                  key={region.name}
                  onPress={() => {
                    setSelectedRegion(region);
                    setShowRegionSelector(false);
                  }}
                  className={`p-2.5 rounded-lg mb-1.5 flex-row items-center ${
                    selectedRegion.name === region.name ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                  }`}
                >
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800 text-sm">{region.name}</Text>
                    <Text className="text-gray-500 text-xs">{region.region}</Text>
                  </View>
                  {selectedRegion.name === region.name && (
                    <Text className="text-blue-500 text-base">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// Hook for background monitoring (runs even when tracker is closed)
export const useBackgroundEarthquakeMonitor = () => {
  const { showNotification } = useEarthquakeNotifications();
  const [lastChecked, setLastChecked] = useState<number>(0);

  useEffect(() => {
    const monitorEarthquakes = async () => {
      try {
        const response = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson');
        const data = await response.json() as { features: EarthquakeFeature[] };
        
        const recentQuakes = data.features
          .filter((quake) => quake.properties.time > lastChecked)
          .sort((a, b) => b.properties.time - a.properties.time);

        if (recentQuakes.length > 0) {
          setLastChecked(Date.now());
          
          // Check for significant earthquakes near Davao
          recentQuakes.forEach((quake) => {
            const [longitude, latitude] = quake.geometry.coordinates;
            const distance = calculateDistance(
              DAVAO_COORDINATES.latitude,
              DAVAO_COORDINATES.longitude,
              latitude,
              longitude
            );

            if (distance <= 500 && quake.properties.mag >= 4.0) {
              showNotification(
                `🌍 M${quake.properties.mag} earthquake detected ${distance.toFixed(0)}km from Davao`,
                quake.properties.mag >= 5.5 ? 'high' : 'medium'
              );
            }
          });
        }
      } catch (error) {
        console.error('Background monitoring error:', error);
      }
    };

    // Check every 2 minutes even when tracker is closed
    const interval = setInterval(monitorEarthquakes, 120000);
    return () => clearInterval(interval);
  }, [lastChecked, showNotification]);
};

// Wrapper component that provides the notification context
const EarthquakeTrackerWithProvider: React.FC = () => {
  return (
    <EarthquakeNotificationProvider>
      <EarthquakeTracker />
    </EarthquakeNotificationProvider>
  );
};

export default EarthquakeTrackerWithProvider;