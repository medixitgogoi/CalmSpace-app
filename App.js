import { Provider } from 'react-redux';
import Stacknavigation from './src/navigation/Stacknavigation';
import Toast from 'react-native-toast-message';
import { store } from './src/redux/Store';
import FlashMessage from 'react-native-flash-message';

const App = () => {
  return (
    <Provider store={store}>
      <Stacknavigation />
      <Toast />
      <FlashMessage position="top" />
    </Provider>
  );
};

export default App;