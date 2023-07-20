import { configureStore } from "@reduxjs/toolkit";
import pokemonDataReducer from '../features/pokemonData/pokemonDataSlice';

const store = configureStore({
	reducer: {
		// the key is used for the property name of tge state, e.g. state.pokeData
		pokeData: pokemonDataReducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
		serializableCheck: false,
    }),
});

export default store;