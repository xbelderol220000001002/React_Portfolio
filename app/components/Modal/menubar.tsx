import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, Image, Modal, StatusBar, Text, TouchableOpacity, View } from 'react-native';

// Import your custom icons with correct paths
const icons = {
  weather: require('@/assets/icons/weather.png'),
  maps: require('@/assets/icons/map.png'),
  spotify: require('@/assets/icons/Earthquake.png'),
};

type MenuItem = {
  id: string;
  title: string;
  icon: keyof typeof icons;
  color: string;
  description: string;
};

const MenuBar = () => {
  const [isVisible, setIsVisible] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const toggleModal = () => {
    if (isVisible) {
      Animated.timing(animation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setIsVisible(false));
    } else {
      setIsVisible(true);
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const menuItems: MenuItem[] = [
    { 
      id: '1', 
      title: 'Weather Tracker', 
      description: 'Check the weather in your area', 
      icon: 'weather', 
      color: '#FF4655'
    },
    { 
      id: '2', 
      title: 'Earthquake Tracker', 
      description: 'Possible earthquake in your area', 
      icon: 'spotify', 
      color: '#1DB954'  
    },
    { 
      id: '3', 
      title: 'My Location', 
      description: 'My current location and timezone', 
      icon: 'maps', 
      color: '#34A853' 
    },
  ];

  const opacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  // Arrow rotation animation (starts pointing down, rotates up when opened)
  const arrowRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '0deg'],
  });

  const handleMenuItemPress = (item: MenuItem) => {
    console.log(`Selected: ${item.title}`);
    toggleModal();
    
    // Handle navigation based on menu item
    switch(item.id) {
      case '1': // Weather Tracker
        router.push('/api/weatherApi');
        break;
      case '2': // My Location
        router.push('/api/earthquakeApi');
        break;
        case '3': // My Location
        router.push('/api/myLocation');
        break;
    }
  };

  return (
    <View className="relative">
      {/* Menu Button */}
      <View className="items-end pr-2 py-2">
        <TouchableOpacity 
          onPress={toggleModal}
          className="relative w-16 h-12 rounded-2xl justify-end items-center pr-4"
          activeOpacity={0.8}
        >
          {/* Solid Background - NOT transparent */}
          <Animated.View 
            className="absolute inset-0 rounded-2xl"
            style={{
              transform: [
                { scale: animation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.95, 1]
                }) }
              ],
            }}
          />
          
          {/* Animated Up/Down Arrow Icon - Larger and Right-Aligned */}
          <View style={{ position: 'absolute', right: 0, top: '50%', transform: [{ translateY: -18 }], zIndex: 10 }}>
            <Animated.View 
              style={{ 
                transform: [{ rotate: arrowRotation }],
                width: 36,
                height: 36,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {/* Single Arrow that transforms from down to up */}
              <View style={{ width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View 
                  style={{
                    width: 14,
                    height: 14,
                    borderLeftWidth: 2.2,
                    borderTopWidth: 2.2,
                    borderColor: 'white',
                    transform: [{ rotate: '45deg' }],
                  }}
                />
              </View>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal
        visible={isVisible}
        transparent
        animationType="none"
        onRequestClose={toggleModal}
      >
        <TouchableOpacity
          className="absolute inset-0 bg-black/30 justify-center items-center pt-12 px-6 pb-6"
          style={{ marginTop: -(StatusBar.currentHeight || 0) }}
          activeOpacity={1}
          onPress={toggleModal}
        >
          <Animated.View
            className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-700"
            style={{
              opacity,
              transform: [{ scale }],
            }}
          >
            <View className="items-center mb-8">
              <Text className="text-Black text-2xl font-bold mb-1">API Integrations</Text>
              <Text className="text-gray-800 text-sm">Select an option below</Text>
              <View className="w-16 h-0.5 bg-gray-500 my-4" />
            </View>

            {/* Menu Items with proper spacing */}
            <View className="space-y-4">
              {menuItems.map((item, index) => (
                <View key={item.id} className="mb-3">
                  <TouchableOpacity
                    className="flex-row items-start p-5 rounded-xl bg-white/90 backdrop-blur-xl border border-white active:bg-white/80"
                    activeOpacity={0.8}
                    onPress={() => handleMenuItemPress(item)}
                  >
                    <View className="w-12 h-12 rounded-xl items-center justify-center mr-4 mt-1">
                      <Image
                        source={icons[item.icon]}
                        style={{ width: 34, height: 34 }}
                        resizeMode="contain"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-black text-lg font-semibold mb-1">
                        {item.title}
                      </Text>
                      <Text className="text-gray-800 text-sm leading-5">
                        {item.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  {/* Add spacing between items except for the last one */}
                  {index < menuItems.length - 1 && (
                    <View className="h-2" />
                  )}
                </View>
              ))}
            </View>

            <TouchableOpacity 
              onPress={toggleModal}
              className="mt-8 py-3 rounded-xl bg-white/90 backdrop-blur-xl border border-white items-center active:bg-white/80"
              activeOpacity={0.7}
            >
              <Text className="text-black font-bold">Close</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default MenuBar;