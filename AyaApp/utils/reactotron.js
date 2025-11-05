import Reactotron from 'reactotron-react-native';
import { debugLog } from './debug';

let reactotron = null;

if (__DEV__) {
  try {
    reactotron = Reactotron
      .configure({
        name: 'Aya App',
        host: '127.0.0.1', 
        port: 9090,
      })
      .useReactNative({
        asyncStorage: false,
        networking: { 
          ignoreUrls: /symbolicate/
        },
        editor: false,
        errors: { veto: (stackFrame) => false },
        overlay: false,
      })
      .connect();

    reactotron.clear();
    
    debugLog('Reactotron connected successfully');

    console.tron = reactotron;
    
  } catch (error) {
    console.warn('Failed to initialize Reactotron:', error);
  }
} else {

  console.tron = {
    log: () => {},
    warn: () => {},
    error: () => {},
    display: () => {},
    image: () => {},
  };
}

export default reactotron;