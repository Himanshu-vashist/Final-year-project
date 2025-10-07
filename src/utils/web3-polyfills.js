// Polyfills for web platform
if (typeof window !== 'undefined') {
  // Error handling polyfills
  if (!window.ErrorHandler) {
    window.ErrorHandler = {
      handleError: (error) => {
        console.error('Handled error:', error);
      }
    };
  }

  if (!global.ErrorUtils) {
    global.ErrorUtils = {
      setGlobalHandler: (callback) => {
        window.ErrorHandler.handleError = callback;
      },
      getGlobalHandler: () => {
        return window.ErrorHandler.handleError;
      }
    };
  }
}
