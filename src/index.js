import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './app/store';
import { getInitialData } from './features/pokemonData/pokemonDataSlice';

// we call this function before initial render, which is why the initial render's status is not null, instead it's loading.

store.dispatch(getInitialData());


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
// <React.StrictMode>
	<Provider store={store}>
		<App />
	</Provider>
// </React.StrictMode>
);