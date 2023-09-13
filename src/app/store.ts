import { configureStore } from "@reduxjs/toolkit";
import pokemonDataReducer from '../features/pokemonData/pokemonDataSlice';
import searchSliceReducer from "../features/search/searchSlice";
import displaySliceReducer from "../features/display/displaySlice";

const store = configureStore({
	reducer: {
		// the key is used for the property name of tge state, e.g. state.pokeData
		pokeData: pokemonDataReducer,
		search: searchSliceReducer,
		display: displaySliceReducer
	},
	middleware: getDefaultMiddleware => getDefaultMiddleware({serializableCheck: false}),
	devTools: {
		actionSanitizer: action => {
			return action.type === 'pokeData/pokemonsLoaded' || action.type === 'pokeData/pokemonSpeciesLoaded' ? { ...action, payload: '<<LONG_BLOB>>' } : action
		},
		// stateSanitizer: state => state.pokeData ? { ...state, pokeData: '<<LONG_BLOB>>' } : state
		// stateSanitizer: state => state.pokeData?.pokemonSpecies ? { ...state, pokeData: {...state.pokeData, pokemonSpecies: '<<LONG_BLOB>>'} } : state
		stateSanitizer: (state: any) => ({...state, pokeData: {...state.pokeData , pokemons: '<<LONG_BLOB>>', pokemonSpecies: '<<LONG_BLOB>>'}}),
		trace: true
	},
});


export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


// performance: if there's no need to fetched data, don't even change status to loading then idle (thunk);
// performance: check if all dispatches(and state setter) are batched.
// separate slices
