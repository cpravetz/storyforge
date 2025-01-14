import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = (endpoint: string): string => {
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(':')[0];

  if (Platform.OS === 'web') {
    // For web, use relative URLs
    return endpoint;
  } else if (localhost) {
    // For native platforms, use the Expo server IP
    return `http://${debuggerHost}${endpoint}`;
  } else {
    // Fallback for when hostUri is not available (e.g., in production builds)
    console.warn('Unable to determine API URL. Using relative path.');
    return endpoint;
  }
};

export { getApiUrl };