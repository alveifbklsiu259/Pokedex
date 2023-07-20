import { configureStore } from "@reduxjs/toolkit";
import pokemonDataReducer from '../features/pokemonData/pokemonDataSlice';

const store = configureStore({
	reducer: {
		// the key is used for the property name of tge state, e.g. state.pokeData
		pokeData: pokemonDataReducer,
	},
	middleware: getDefaultMiddleware => getDefaultMiddleware({serializableCheck: false}),
	devTools: { 
		actionSanitizer: action => {
			return action.type === 'pokeData/pokemonsLoaded' || action.type === 'pokeData/pokemonSpeciesLoaded' ? { ...action, payload: '<<LONG_BLOB>>' } : action
		},
		// stateSanitizer: state => state.pokeData ? { ...state, pokeData: '<<LONG_BLOB>>' } : state
	  }
});

export default store;