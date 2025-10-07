import { AppRegistry } from 'react-native';
import App from './App';

// Register the app
AppRegistry.registerComponent('app', () => App);

// Setup web specific configuration
if (module.hot) {
  module.hot.accept();
}

AppRegistry.runApplication('app', {
  initialProps: {},
  rootTag: document.getElementById('root') || document.getElementById('app')
});
