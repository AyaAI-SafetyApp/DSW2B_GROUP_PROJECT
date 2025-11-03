import Reactotron from 'reactotron-react-native';
import { debugLog } from './debug';

let reactotron = null;

if (__DEV__) {
  try {
    reactotron = Reactotron
      .configure({
        name: 'Aya App',
        host: '127.0.0.1', // Change to your IP if using physical device
        port: 9090,
      })
      .useReactNative({
        asyncStorage: false, // there are more options to the async storage.
        networking: { // optionally, you can turn it off with false.
          ignoreUrls: /symbolicate/
        },
        editor: false, // there are more options to editor
        errors: { veto: (stackFrame) => false }, // or turn it off with false
        overlay: false, // just turning off overlay
      })
      .connect();

    // Let's clear Reactotron on every time we load the app
    reactotron.clear();
    
    debugLog('Reactotron connected successfully');
    
    // Make Reactotron available globally for debugging
    console.tron = reactotron;
    
  } catch (error) {
    console.warn('Failed to initialize Reactotron:', error);
  }
} else {
  // Create a mock for production
  console.tron = {
    log: () => {},
    warn: () => {},
    error: () => {},
    display: () => {},
    image: () => {},
  };
}

export default reactotron;