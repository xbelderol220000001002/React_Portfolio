import MenuBar from '@/app/components/Modal/menubar';
import React, { useEffect, useRef, useState } from "react";
import { Image, Linking, ScrollView, StatusBar, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// TypeWriter Component Props Interface
interface TypeWriterProps {
  text: string;
  speed?: number;
  deleteSpeed?: number;
  delay?: number;
  style?: TextStyle;
}

// TypeWriter Component with smooth continuous loop
const TypeWriter = ({ text, speed = 100, deleteSpeed = 50, delay = 1500, style }: TypeWriterProps) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentText] = useState(text);

  useEffect(() => {
    let frameId: number;
    let lastTime = 0;
    let accumulatedTime = 0;
    let isPaused = false;
    let pauseUntil = 0;

    const animate = (timestamp: number) => {
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      if (isPaused) {
        if (timestamp >= pauseUntil) {
          isPaused = false;
          lastTime = timestamp;
        } else {
          frameId = requestAnimationFrame(animate);
          return;
        }
      }

      accumulatedTime += deltaTime;
      const targetSpeed = isDeleting ? deleteSpeed : speed;

      if (accumulatedTime >= targetSpeed) {
        accumulatedTime = 0;

        if (!isDeleting) {
          if (currentIndex <= currentText.length) {
            setDisplayText(currentText.substring(0, currentIndex + 1));
            setCurrentIndex((prev) => {
              const newIndex = prev + 1;
              if (newIndex === currentText.length) {
                isPaused = true;
                pauseUntil = timestamp + delay;
                setIsDeleting(true);
              }
              return newIndex;
            });
          }
        } else {
          if (currentIndex > 0) {
            setDisplayText(currentText.substring(0, currentIndex - 1));
            setCurrentIndex((prev) => prev - 1);
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
          }
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [isDeleting, currentIndex, currentText, speed, deleteSpeed, delay]);

  return (
    <Text style={style} className="text-white text-3xl font-bold">
      {displayText}
      <Text className="animate-pulse">|</Text>
    </Text>
  );
};

const Homepage: React.FC = () => {
  const contactsRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleEmailPress = () => {
    // Scroll to contacts section
    if (scrollViewRef.current) {
      // First try to scroll to end
      scrollViewRef.current.scrollToEnd({ animated: true });
      
      // As a fallback, try scrolling to a large number after a short delay
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 2000, animated: true });
      }, 100);
    }
  };

  const handleCVDownload = () => {
    console.log("Downloading CV...");
    // You might want to implement actual download logic here
  };

  const handleSocialLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header - Fixed at the very top */}
      <View className="absolute top-0 left-0 right-0 z-10">
        <View className="h-24 bg-white/40 backdrop-blur-lg rounded-b-xl" />
        <View className="absolute top-0 left-0 right-0">
          <SafeAreaView edges={['top']} className="pt-1">
            <View className="flex-row justify-between items-center px-6 py-3 h-14">
              <View className="flex-row items-center">
                <Text className="text-extrabold text-white text-2xl">こんにちは</Text>
                <Text className="text-bold text-white/80 text-lg ml-2">(Konnichiwa)</Text>
              </View>
              <View>
                <MenuBar />
              </View>
            </View>
          </SafeAreaView>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 mt-6">
        {/* Background Image */}
        <View className="absolute top-0 left-0 right-0 bottom-0 w-full h-full">
          <Image 
            source={require('@/assets/myimages/gif.gif')}
            className="w-full h-full opacity-60"
            resizeMode="cover"
          />
        </View>

        {/* Scrollable Content */}
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ paddingTop: 80, paddingBottom: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Intro Section */}
          <View className="flex-row items-center mb-4 px-4">
            <View className="w-48 h-48 overflow-hidden rounded-lg mr-1">
              <Image 
                source={require('@/assets/myimages/xan2.png')} 
                style={{ width: '100%', height: '100%', borderRadius: 12 }}
                resizeMode="cover"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            </View>
            <View style={{ flex: 2, marginLeft: 8, top: 2 }}>
              <TypeWriter 
                text="Hello, I'm Xan!" 
                speed={100}
                deleteSpeed={100}
                delay={1000}
                style={{
                  color: 'white',
                  fontSize: 24,
                  fontWeight: 'bold',
                  minHeight: 32,
                  display: 'flex'
                }}
              />
              <Text className="text-gray-200 text-base mt-1 top-2">Project Manager and a</Text>
              <Text className="text-gray-200 text-base mt-1 top-2">bit of a developer</Text>
              <View className="flex-row mt-4 top-2">
                <TouchableOpacity className="bg-[#4D4C51] px-3.5 py-1.5 rounded mr-3" onPress={handleEmailPress}>
                  <Text className="text-white text-xs font-medium top-0.5">My Contact!</Text>
                </TouchableOpacity>
                <TouchableOpacity className="border border-gray-400 px-3.5 py-1.5 rounded" onPress={handleCVDownload}>
                  <Text className="text-white text-xs font-medium">Download CV</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row mt-5 left-1">
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  onPress={() => handleSocialLink('https://www.facebook.com/xpeb.kaizer')}
                >
                  <Image source={require('@/assets/icons/fb.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  onPress={() => handleSocialLink('https://mail.google.com/mail/u/0/?ui=2#search/xbelderol_220000001002%40uic.edu.ph?compose=new')}
                >
                  <Image source={require('@/assets/icons/gmail.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  onPress={() => handleSocialLink('https://github.com/xbelderol220000001002')}
                >
                  <Image source={require('@/assets/icons/github.png')} style={{ width: 24, height: 24, tintColor: 'white' }} resizeMode="contain" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  onPress={() => handleSocialLink('https://www.youtube.com/@xaianpaulbelderol')}
                >
                  <Image source={require('@/assets/icons/youtube.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* About & Skills */}
          <View className="mx-4 mb-4">
            <View className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
              <View className="mb-8">
                <Text className="text-2xl font-bold text-white mb-4">About Me</Text>
                <Text style={{textAlign: 'justify'}} className="text-white text-lg leading-relaxed">
                  Hi, it's me, Xan! Actually I'm not really a passionate IT student, I'm more into playing video games, watching anime, and movies. I can code and handle IT stuff, but my motivation depends on my mood.
                </Text>
              </View>
              <View className="h-px bg-white mb-8"></View>
              <View>
                <Text className="text-2xl font-bold text-white mb-2">Skills</Text>
                <View className="flex-row flex-wrap gap-2 mb-6">
                  <View className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-md">
                    <Text className="text-sm text-white">Problem Solver</Text>
                  </View>
                  <View className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-md">
                    <Text className="text-sm text-white">Team Player</Text>
                  </View>
                  <View className="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-md">
                    <Text className="text-sm text-white">Innovation</Text>
                  </View>
                </View>
                <Text className="text-white leading-relaxed mb-4 bottom-2">
                  My technical skill set allows me to accurately scope projects, identify potential risks, and communicate effectively with development teams, ensuring a seamless and efficient workflow from conception to deployment.
                </Text>
                <View className="space-y-3">
                  <Text className="text-white text-2xl text-bold mb-2">Technical Forte:</Text>
                  <View>
                    <Text className="font-bold text-lg text-white">Frontend Development</Text>
                    <Text className="text-white text-sm mb-2">React.js, React Native (NativeWind), Vue.js</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-lg text-white">Backend & Database</Text>
                    <Text className="text-white text-sm mb-2">Python, Laravel (php), Supabase</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-lg text-white">Emerging Focus</Text>
                    <Text className="text-white text-sm mb-2">AI Automation & Implementation</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-lg text-white">Project Leadership</Text>
                    <Text className="text-white text-sm mb-2">Methodologies, Client Relations, Strategic Planning</Text>
                  </View>
                  <View>
                    <Text className="font-bold text-lg text-white">AI Prompter & Vibe Coder</Text>
                    <Text className="text-white text-sm mb-2">Let AI do my work, and, wallah, I’ll get the vibe.</Text>
                  </View>
                </View> 
              </View>
            </View>
          </View>

          {/* Projects */}
          <View className="mx-4 mb-4">
            <View className="bg-white/20 backdrop-blur-md rounded-xl p-6 border border-white/20 shadow-lg">
              <Text className="text-2xl font-bold text-white mb-4">My Projects</Text>
              <View className="flex-row justify-between mb-4">
                <TouchableOpacity className="bg-white/20 w-[48%] p-4 items-center rounded-xl border border-white/20" activeOpacity={0.8}>
                  <Text className="text-white text-2xl mb-1 font-bold">10+</Text>
                  <Text className="text-white/80 text-xs font-semibold text-center">WEB DEVELOPMENT</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-white/20 w-[48%] p-4 items-center rounded-xl border border-white/20" activeOpacity={0.8}>
                  <Text className="text-white text-2xl mb-1 font-bold">10+</Text>
                  <Text className="text-white/80 text-xs font-semibold text-center">MOB DEVELOPMENT</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-between">
                <TouchableOpacity className="bg-white/20 w-[48%] p-4 items-center rounded-xl border border-white/20" activeOpacity={0.8}>
                  <Text className="text-white text-2xl mb-1 font-bold">5+</Text>
                  <Text className="text-white/80 text-xs font-semibold text-center">PROJ MANAGEMENT</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-white/20 w-[48%] p-4 items-center rounded-xl border border-white/20" activeOpacity={0.8}>
                  <Text className="text-white text-2xl mb-1 font-bold">20+</Text>
                  <Text className="text-white/80 text-xs font-semibold text-center">PROTOTYPE DESIGNS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Contacts */}
          <View 
            ref={contactsRef}
            className="bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 p-6 mb-6 mx-4"
          >
            <Text className="text-white text-2xl font-bold mb-6">Contacts</Text>
            <Text className="text-white/90 text-lg mb-6">
              Got a project in mind? Let's talk. I'm always interested in new challenges and opportunities to collaborate.
            </Text>
            <View className="bg-white/10 backdrop-blur-sm p-5 rounded-2xl space-y-5">
              <View>
                <View className="flex-row items-center space-x-2 mb-1">
                  <Text className="text-white text-lg right-2">📍</Text>
                  <Text className="text-white font-bold text-lg">My Address</Text>
                </View>
                <Text className="text-white/90 text-base">
                  Brgy. Miranda Sitio Kaimito, Purok 6, Babak Dist. Island Garden City of Samal.
                </Text>
              </View>

              <View className="pt-2">
                <View className="flex-row items-center space-x-2 mb-1">
                  <Text className="text-white text-lg right-2">✉️</Text>
                  <Text className="text-white font-bold text-lg">My Email</Text>
                </View>
                <Text className="text-white/90 text-base">xpeb2003@gmail.com</Text>
                <Text className="text-white/90 text-base">xbelderol_220000001002@uic.edu.ph</Text>
              </View>

              <View className="pt-2">
                <View className="flex-row items-center space-x-2 mb-1">
                  <Text className="text-white text-lg right-2">☎️</Text>
                  <Text className="text-white font-bold text-lg">My Phone Number</Text>
                </View>
                <Text className="text-white/90 text-base">09472708250 (SMART)</Text>
              </View>
            </View>
            <TouchableOpacity className="py-3 rounded-lg items-center" onPress={handleEmailPress}>
              <View className="flex-row items-center justify-center mt-5">
                <Image 
                  source={require('@/assets/icons/pointing-right.png')} 
                  style={{ width: 36, height: 36, marginRight: 16 }} 
                  resizeMode="contain" 
                />
                <Text className="text-white text-2xl font-bold">Email Me Now!</Text>
                <Image 
                  source={require('@/assets/icons/pointing-left.png')} 
                  style={{ width: 36, height: 36, marginLeft: 16 }} 
                  resizeMode="contain" 
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View className="py-3 items-center bottom-3 px-4">
            <Text className="text-white/70 text-sm">2025 Xaian Paul Belderol. All Rights Reserved.</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

export default Homepage;


