// Debugging test utilities
import { debugLog, debugError, debugWarn, debugNetwork, debugState } from './debug';

export const testDebugging = () => {
  console.log('🧪 Testing debugging setup...');
  
  // Test basic logging
  debugLog('Debug logging test', { timestamp: new Date().toISOString() });
  debugWarn('Warning test', { level: 'test' });
  debugError('Error test (this is expected)', new Error('Test error'));
  
  // Test network logging
  debugNetwork('https://api.example.com/test', 'POST', { test: true });
  
  // Test state logging
  debugState('TestComponent', { loading: false, data: 'test' });
  
  // Test Reactotron integration
  if (console.tron) {
    console.tron.display({
      name: '🎯 Debugging Test Complete',
      preview: 'All debugging tools are working!',
      value: {
        console: '✅ Console logging works',
        reactotron: '✅ Reactotron connected',
        vscode: '✅ VS Code debugger ready',
        timestamp: new Date().toISOString()
      }
    });
  }
  
  console.log('Debugging test complete - check console and Reactotron!');
};

// Export for easy testing in components
export default testDebugging;