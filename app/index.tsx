import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, ImageBackground, Text, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideUpAnim = useRef(new Animated.Value(30)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const textGlowAnim = useRef(new Animated.Value(0)).current;
  const bgFadeAnim = useRef(new Animated.Value(0)).current;
  
  // State for progress percentage
  const [progressPercent, setProgressPercent] = useState(0);
  
  // Update progress percentage when progressAnim changes
  useEffect(() => {
    const listener = progressAnim.addListener(({ value }) => {
      setProgressPercent(Math.round(value * 100));
    });
    
    return () => {
      progressAnim.removeListener(listener);
    };
  }, [progressAnim]);

  // Animation sequences
  const startAnimations = useCallback(() => {
    // Background fade in first
    Animated.timing(bgFadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Text glow animation
    Animated.sequence([
      Animated.timing(textGlowAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(textGlowAnim, {
        toValue: 0.3,
        duration: 1200,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }),
    ]).start();

    // Main content animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 30,
        useNativeDriver: true,
      }),
      Animated.timing(slideUpAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation - 5 seconds duration
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000, // 5 seconds total duration
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [fadeAnim, scaleAnim, slideUpAnim, progressAnim, textGlowAnim, bgFadeAnim]);

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeApp = () => {
      if (!mounted) return;
      
      startAnimations();
      
      // Navigate after progress completes (add a small delay to ensure smooth transition)
      if (mounted) {
        const totalDuration = 5000; // 5 seconds
        timeoutRef.current = setTimeout(() => {
          // Ensure we're at 100% before navigating
          setProgressPercent(100);
          router.replace('/homepage');
        }, totalDuration) as unknown as number;
      }
    };

    initializeApp();

    return () => {
      mounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [startAnimations, router]);

  // Interpolated values
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Interpolate color based on progress (red to yellow to green)
  const progressColor = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#FFFFFF'] // white to white (if you want a single color)
  });
  
  // Current progress percentage (0-100)
  const progressPercentage = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  const textGlow = textGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View className="flex-1">
      {/* GIF Background */}
      <Animated.View 
        style={{ opacity: bgFadeAnim }}
        className="absolute inset-0"
      >
        <ImageBackground
          source={require('@/assets/myimages/japan1.gif')}
          className="flex-1"
          resizeMode="cover"
        >
          {/* Dark overlay for better text readability */}
          <View className="absolute inset-0" />
        </ImageBackground>
      </Animated.View>

      {/* Main Content */}
      <View className="flex-1 items-center justify-center px-6">
        <Animated.View
          className="items-center justify-center p-12 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/20 w-full max-w-md shadow-2xl shadow-white/10"
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }, { translateY: slideUpAnim }],
            width: '100%',
            maxWidth: 420,
          }}
        >
          {/* Logo Container */}
          <View className="w-32 h-32 mb-8 rounded-full bg-gradient-to-br from-white/30 to-white/10 items-center justify-center border-2 border-white/40 overflow-hidden">
            <Image 
              source={require('@/assets/myimages/xannn.jpg')} 
              style={{ width: '100%', height: '100%', borderRadius: 9999 }} 
              resizeMode="cover"
            />
          </View>

          {/* Welcome Text */}
          <Text className="text-white text-4xl font-bold text-center tracking-wider mb-2">
            Welcome to
          </Text>
          
          {/* Portfolio Name */}
          <Text className="text-white text-5xl font-bold text-center tracking-tight mb-3">
            Xan's Portfolio
          </Text>

          {/* Subtitle */}
          <Text className="text-gray-200 text-lg font-medium text-center tracking-wide mb-6">
            Digital Designer & Developer
          </Text>
          
          {/* Progress Bar Container */}
          <View className="w-full mb-4">
            <View className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
              <Animated.View 
                className="h-full rounded-full"
                style={{
                  width: progressWidth,
                  backgroundColor: progressColor,
                }}
              />
            </View>
            
            {/* Loading Info */}
            <View className="flex-row justify-between items-center mt-2">
              <Text className="text-gray-300 text-xs font-medium tracking-wider">
                LOADING...
              </Text>
              <Animated.Text 
                className="text-white text-xs font-bold tracking-wider"
                style={{
                  opacity: progressAnim.interpolate({
                    inputRange: [0, 0.1, 1],
                    outputRange: [0.3, 1, 1],
                  }),
                }}
              >
                {progressPercent}%
              </Animated.Text>
            </View>
          </View>

          {/* Loading Status Messages */}
          <View className="mt-4">
            <Text className="text-gray-300 text-sm font-light text-center tracking-wide">
              Preparing your experience...
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}