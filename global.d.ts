/// <reference types="expo" />
/// <reference types="react-native" />
/// <reference types="react-native-safe-area-context" />

// This file helps TypeScript understand React Native types
import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    // Add any custom View props here if needed
  }
}

declare module 'react-native-safe-area-context' {
  export * from 'react-native-safe-area-context/lib/typescript';
}
