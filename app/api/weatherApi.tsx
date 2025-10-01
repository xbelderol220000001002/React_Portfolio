// weatherApi.tsx
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type RootStackParamList = {
  Home: undefined;
  Weather: undefined; // Add other screens as needed
};

const { width, height } = Dimensions.get('window');

interface Weather {
  main: string;
  description: string;
  icon: string;
}

interface Main {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
}

interface Wind {
  speed: number;
}

interface CurrentWeather {
  weather: Weather[];
  main: Main;
  wind: Wind;
  clouds: { all: number };
  visibility: number;
  name: string;
  sys: {
    country: string;
    sunrise: number;
    sunset: number;
  };
  dt: number;
}

interface ForecastItem {
  dt: number;
  main: Main;
  weather: Weather[];
  dt_txt: string;
}

interface ForecastData {
  list: ForecastItem[];
  city: {
    name: string;
    country: string;
  };
}

interface WeatherData {
  current: CurrentWeather;
  forecast: ForecastData;
}


const WeatherApi = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchWidth = useRef(new Animated.Value(40)).current;
  const searchPosition = useRef(new Animated.Value(-15)).current;
  const [currentTime, setCurrentTime] = useState(new Date());

  const API_KEY = '8548b5ce3b12ab1e15c82931121afe49';
  const [CITY, setCITY] = useState('Davao City');
  const UNITS = 'metric';

  const backgroundImage = require('@/assets/myimages/Linear.jpg');

  useEffect(() => {
    fetchWeatherData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const fetchWeatherData = async (cityName = CITY) => {
    try {
      setLoading(true);
      
      const currentResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&units=${UNITS}&appid=${API_KEY}`
      );
      
      const forecastResponse = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&units=${UNITS}&appid=${API_KEY}`
      );
      
      if (!currentResponse.ok) {
        throw new Error('City not found. Please try another location.');
      }
      
      if (!forecastResponse.ok) {
        throw new Error('Forecast data unavailable.');
      }
      
      const currentData = (await currentResponse.json()) as CurrentWeather;
      const forecastData = (await forecastResponse.json()) as ForecastData;
      
      setWeatherData({
        current: currentData,
        forecast: forecastData
      });
      setCITY(cityName);
      setError(null);
      setIsSearching(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearch = () => {
    const query = searchQuery.trim();
    if (query) {
      // Add to search history
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(item => item.toLowerCase() !== query.toLowerCase())];
        return newHistory.slice(0, 5); // Keep only the last 5 searches
      });
      
      // If no country code is specified, default to PH
      const searchWithCountry = query.includes(',') ? query : `${query},PH`;
      fetchWeatherData(searchWithCountry);
      
      setShowSuggestions(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setShowSuggestions(!!text);
  };

  const handleFocus = () => {
    setShowSuggestions(true);
  };

  const handleSelectFromHistory = (query: string) => {
    setSearchQuery(query);
    const searchWithCountry = query.includes(',') ? query : `${query},PH`;
    fetchWeatherData(searchWithCountry);
    setShowSuggestions(false);
  };


  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const handleBack = () => {
    if (showSuggestions) {
      setShowSuggestions(false);
      return;
    }
    if (isSearchExpanded) {
      Animated.parallel([
        Animated.timing(searchWidth, {
          toValue: 40,
          duration: 300,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(searchPosition, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
          easing: Easing.out(Easing.ease)
        })
      ]).start(() => {
        setIsSearchExpanded(false);
        setSearchQuery('');
      });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // If there's no screen to go back to, just reset the search
      setSearchQuery('Davao City');
      setIsSearching(false);
      fetchWeatherData('Davao City');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchWeatherData();
  };

  const getWeatherIcon = (main: string) => {
    const iconMap: { [key: string]: string } = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Partly cloudy': '⛅',
    };
    return iconMap[main] || '🌈';
  };

  const getDayName = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDailyForecast = () => {
    if (!weatherData?.forecast?.list) return [];
    
    const dailyData: ForecastItem[] = [];
    const dates = new Set();
    
    weatherData.forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toDateString();
      if (!dates.has(date)) {
        dates.add(date);
        dailyData.push(item);
      }
    });
    
    return dailyData.slice(0, 5);
  };

  if (loading) {
    return (
      <ImageBackground source={backgroundImage} className="flex-1" resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 justify-center items-center">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View className="bg-white/15 rounded-3xl p-8 backdrop-blur-2xl border border-white/20">
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text className="text-white mt-4 text-lg font-semibold">Loading weather data...</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    );
  }

  if (error || !weatherData) {
    return (
      <ImageBackground source={backgroundImage} className="flex-1" resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          className="flex-1"
        >
          <SafeAreaView className="flex-1 justify-center items-center px-6">
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <View className="bg-white/15 rounded-3xl p-8 backdrop-blur-2xl border border-white/20 items-center">
              <Ionicons name="cloud-offline" size={48} color="white" />
              <Text className="text-white text-xl font-bold mb-4 mt-2">Weather App</Text>
              <Text className="text-white text-center mb-6">{error}</Text>
              <TouchableOpacity 
                className="bg-white/20 px-8 py-4 rounded-full mt-2 border border-white/30"
                onPress={handleBack}
              >
                <Text className="text-white font-semibold">Back to Davao City</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    );
  }

  const dailyForecast = getDailyForecast();
  const cityName = weatherData.current.name || CITY;
  const country = weatherData.forecast.city?.country || 'Philippines';

  return (
    <ImageBackground source={backgroundImage} className="flex-1" resizeMode="cover">
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
        className="flex-1"
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <SafeAreaView className="flex-1">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <ScrollView 
              className="flex-1" 
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#fff"
                  colors={['#fff']}
                />
              }
            >
              <View className="px-4 pt-2 pb-2">
                {/* Header with Search */}
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <TouchableOpacity 
                      onPress={handleBack} 
                      className="p-2 mr-2"
                    >
                      <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="relative" style={{ left: -15 }}>
                    <Animated.View 
                      className="flex-row items-center bg-white/15 rounded-xl overflow-hidden backdrop-blur-2xl border border-white/20"
                      style={[{
                        width: searchWidth,
                        height: 40,
                        justifyContent: isSearchExpanded ? 'flex-start' : 'center',
                        marginLeft: searchPosition,
                      }]}
                    >
                      <TouchableOpacity 
                        onPress={() => {
                          if (!isSearchExpanded) {
                            Animated.parallel([
                              Animated.timing(searchWidth, {
                                toValue: 300,
                                duration: 300,
                                useNativeDriver: false,
                                easing: Easing.out(Easing.ease)
                              }),
                              Animated.timing(searchPosition, {
                                toValue: -15,
                                duration: 300,
                                useNativeDriver: false,
                                easing: Easing.out(Easing.ease)
                              })
                            ]).start(() => {
                              setIsSearchExpanded(true);
                            });
                          } else if (!searchQuery) {
                            Animated.parallel([
                              Animated.timing(searchWidth, {
                                toValue: 40,
                                duration: 300,
                                useNativeDriver: false,
                                easing: Easing.out(Easing.ease)
                              }),
                              Animated.timing(searchPosition, {
                                toValue: 0,
                                duration: 300,
                                useNativeDriver: false,
                                easing: Easing.out(Easing.ease)
                              })
                            ]).start(() => {
                              setIsSearchExpanded(false);
                            });
                          }
                        }}
                        className="items-center justify-center w-8 h-8"
                        style={{
                          marginLeft: isSearchExpanded ? 8 : 0,
                          justifyContent: 'center',
                          alignItems: 'center',
                          paddingLeft: 8, // Added padding to shift the icon right
                        }}
                      >
                        <Ionicons 
                          name="search" 
                          size={18} 
                          color="white" 
                          style={{ marginLeft: 0 }}
                          // Removed left margin as we're handling positioning with container padding
                        />
                      </TouchableOpacity>
                      <View className="flex-1">
                        {isSearchExpanded && (
                          <View className="flex-row items-center">
                            <TextInput
                              className="flex-1 text-white px-3 py-2 text-base"
                              placeholder="Search city..."
                              placeholderTextColor="rgba(255, 255, 255, 0.7)"
                              value={searchQuery}
                              onChangeText={handleSearchChange}
                              onFocus={handleFocus}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              onSubmitEditing={handleSearch}
                              returnKeyType="search"
                              autoCapitalize="words"
                              autoCorrect={false}
                              style={{ width: isSearchExpanded ? '100%' : 0 }}
                            />
                            {showSuggestions && searchHistory.length > 0 && (
                              <View className="absolute top-12 left-0 right-0 bg-white/90 rounded-xl z-10 max-h-60 overflow-hidden border border-white/20">
                                <ScrollView 
                                  className="max-h-60"
                                  keyboardShouldPersistTaps="always"
                                >
                                  <Text className="px-4 py-2 font-semibold text-gray-500 text-sm">Recent Searches</Text>
                                  {searchHistory.map((query, index) => (
                                    <TouchableOpacity
                                      key={`history-${index}`}
                                      className="px-4 py-3 border-b border-white/10"
                                      onPress={() => handleSelectFromHistory(query)}
                                    >
                                      <Text className="text-gray-800">{query}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                            {isSearchExpanded && searchQuery && (
                              <TouchableOpacity 
                                onPress={() => setSearchQuery('')}
                                className="p-1 ml-2"
                              >
                                <Ionicons name="close-circle" size={18} color="white" />
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  </View>
                </View>

                {/* Current Time and Date */}
                <View className="items-center mb-6">
                  <Text className="text-white text-2xl font-light">
                    {currentTime.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </Text>
                  <Text className="text-white/70 text-sm mt-1">
                    {currentTime.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>

                {/* Main Weather Card */}
                <View className="px-2 mb-6 w-full">
                  <View className="bg-white/15 rounded-3xl p-8 backdrop-blur-2xl border border-white/20 mx-1">
                    {/* Location */}
                    <View className="flex-row items-center justify-center mb-2">
                      <Text className="text-white text-3xl font-bold">
                        {cityName}, {country}
                      </Text>
                    </View>
                    
                    {/* Temperature and Condition */}
                    <View className="items-center mt-4 mb-10">
                      <View className="flex-row items-center justify-center">
                        <Text className="text-white text-7xl font-light">
                          {Math.round(weatherData.current.main.temp)}°
                        </Text>
                        <Text className="text-white text-7xl ml-2">
                          {getWeatherIcon(weatherData.current.weather[0]?.main)}
                        </Text>
                      </View>
                      <Text className="text-white text-3xl capitalize font-medium mt-6">
                        {weatherData.current.weather[0]?.description}
                      </Text>
                    </View>
                    
                    {/* Weather Stats Grid */}
                    <View className="flex-row justify-between px-4 py-2 mb-0.1">
                      <View className="items-center">
                        <Ionicons name="speedometer" size={20} color="white" />
                        <Text className="text-white/80 text-xs mt-1">Wind</Text>
                        <Text className="text-white text-base font-semibold">
                          {Math.round(weatherData.current.wind.speed * 3.6)} km/h
                        </Text>
                      </View>
                      
                      <View className="items-center">
                        <Ionicons name="water" size={20} color="white" />
                        <Text className="text-white/80 text-xs mt-1">Humidity</Text>
                        <Text className="text-white text-base font-semibold">
                          {weatherData.current.main.humidity}%
                        </Text>
                      </View>
                      
                      <View className="items-center">
                        <Ionicons name="sunny" size={20} color="white" />
                        <Text className="text-white/80 text-xs mt-1">Sunrise</Text>
                        <Text className="text-white text-base font-semibold">
                          {formatTime(weatherData.current.sys.sunrise)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Weather Highlights */}
                <View className="px-2 mb-6 w-full">
                  <Text className="text-white text-xl font-bold mb-4 ml-1">Weather Highlights</Text>
                  
                  <View className="flex-row flex-wrap justify-between" style={{ gap: 12 }}>
                    <View className="bg-white/15 rounded-2xl p-5 backdrop-blur-2xl border border-white/20" style={{ width: '48%' }}>
                      <Ionicons name="thermometer" size={24} color="white" />
                      <Text className="text-white/80 text-sm mt-2">Feels Like</Text>
                      <Text className="text-white text-2xl font-bold mt-1">
                        {Math.round(weatherData.current.main.feels_like)}°
                      </Text>
                    </View>
                    
                    <View className="bg-white/15 rounded-2xl p-5 backdrop-blur-2xl border border-white/20" style={{ width: '48%' }}>
                      <Ionicons name="compass" size={24} color="white" />
                      <Text className="text-white/80 text-sm mt-2">Pressure</Text>
                      <Text className="text-white text-2xl font-bold mt-1">
                        {weatherData.current.main.pressure} hPa
                      </Text>
                    </View>
                    
                    <View className="bg-white/15 rounded-2xl p-5 backdrop-blur-2xl border border-white/20" style={{ width: '48%' }}>
                      <Ionicons name="eye" size={24} color="white" />
                      <Text className="text-white/80 text-sm mt-2">Visibility</Text>
                      <Text className="text-white text-2xl font-bold mt-1">
                        {(weatherData.current.visibility / 1000).toFixed(1)} km
                      </Text>
                    </View>
                    
                    <View className="bg-white/15 rounded-2xl p-5 backdrop-blur-2xl border border-white/20" style={{ width: '48%' }}>
                      <Ionicons name="moon" size={24} color="white" />
                      <Text className="text-white/80 text-sm mt-2">Sunset</Text>
                      <Text className="text-white text-2xl font-bold mt-1">
                        {formatTime(weatherData.current.sys.sunset)}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Day Forecast */}
                <View className="px-2 mb-6 w-full">
                  <Text className="text-white text-xl font-bold mb-4 ml-1">Day Forecast</Text>
                  
                  <View className="bg-white/15 rounded-2xl p-4 backdrop-blur-2xl border border-white/20">
                    {dailyForecast.map((day, index) => (
                      <View key={day.dt} className="flex-row items-center justify-between py-3 border-b border-white/10 last:border-b-0">
                        <View className="flex-1">
                          <Text className="text-white font-medium">
                            {index === 0 ? 'Today' : getDayName(day.dt)}
                          </Text>
                        </View>
                        
                        <View className="flex-row items-center flex-1 justify-center">
                          <Text className="text-white text-2xl mr-3">
                            {getWeatherIcon(day.weather[0]?.main)}
                          </Text>
                          <Text className="text-white/80 text-sm capitalize flex-1">
                            {day.weather[0]?.description}
                          </Text>
                        </View>
                        
                        <View className="flex-1 items-end">
                          <Text className="text-white text-lg font-semibold">
                            {Math.round(day.main.temp)}°
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
};

export default WeatherApi;