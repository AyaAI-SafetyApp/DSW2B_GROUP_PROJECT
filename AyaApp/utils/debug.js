
export const debugLog = (message, data = null) => {
  if (__DEV__) {
    console.log(`🐛 DEBUG: ${message}`, data ? data : '');

    if (console.tron) {
      console.tron.log(message, data);
    }
  }
};

export const debugError = (message, error = null) => {
  if (__DEV__) {
    console.error(`ERROR: ${message}`, error ? error : '');

    if (console.tron) {
      console.tron.error(message, error);
    }
  }
};

export const debugWarn = (message, data = null) => {
  if (__DEV__) {
    console.warn(`WARNING: ${message}`, data ? data : '');
  }
};

export const debugNetwork = (url, method = 'GET', data = null) => {
  if (__DEV__) {
    console.log(`NETWORK ${method}: ${url}`, data ? data : '');
  }
};

export const debugState = (component, state) => {
  if (__DEV__) {
    console.log(`STATE UPDATE [${component}]:`, state);
  }
};

export const debugNavigation = (screen, params = null) => {
  if (__DEV__) {
    console.log(`NAVIGATION: ${screen}`, params ? params : '');
  }
};


export const debugPerformance = (label, fn) => {
  if (__DEV__) {
    console.time(label);
    const result = fn();
    console.timeEnd(label);
    return result;
  }
  return fn();
};

export const debugStorage = (operation, key, value = null) => {
  if (__DEV__) {
    console.log(`STORAGE ${operation.toUpperCase()}: ${key}`, value ? value : '');
  }
};