import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Provider } from 'react-redux';
import store from './app/store';
import { getEndpointData, getData, getPokemons } from './api';
import { getIdFromURL } from './util';
import { dataLoading, pokemonCountLoaded, pokemonNamesAndIdsLoaded, intersectionChanged, generationsLoaded, typesLoaded } from './features/pokemonData/pokemonDataSlice';

const dispatch = store.dispatch;


// is it correct to directly use async function witg redux? or do I have to use thunk?
// seems like this function can also be called as a thunk, because we're using RTK, middleware is included automatically, we can also define a thunk function in the slice file and import it here.
const getInitialPokemonData = async () => {
	let generationData, typeData;
	dispatch(dataLoading());
	// get pokemons count, all names and ids
	const speciesResponse = await getEndpointData('pokemon-species')
	const pokemonsNamesAndId = {};
	for (let pokemon of speciesResponse.results) {
		pokemonsNamesAndId[pokemon.name] = getIdFromURL(pokemon.url);
	};

	// set the range
	const intersection = [];
	for (let i = 1; i <= speciesResponse.count; i++) {
		intersection.push(i);
	};

	// get generations
	const generationResponse = await getEndpointData('generation');
	generationData = await getData('generation', generationResponse.results.map(entry => entry.name), 'name');

	// get types
	const typeResponse = await getEndpointData('type');
	typeData = await getData('type', typeResponse.results.map(entry => entry.name), 'name');

	// batch dispatches
	await getPokemons(dispatch, {}, pokemonsNamesAndId, intersection, 'numberAsc', 'loading');
	dispatch(pokemonCountLoaded(speciesResponse.count));
	dispatch(pokemonNamesAndIdsLoaded(pokemonsNamesAndId));
	dispatch(intersectionChanged(intersection));
	dispatch(generationsLoaded(generationData));
	dispatch(typesLoaded(typeData));
	// cache input 
	// see if i can batch dispatches between PokemonProvider and Pokemon
	// encapsulate type/generation logic

	// handling direct changes in url
	// the below code is not enough, other data needs to be fetched.

	// const lang = window.sessionStorage.getItem('pokedexLang');
	// if (lang !== 'en') {
	// 	dispatch({type: 'languageChanged', payload: lang});
	// }
	// or can we directly set lange to sessionStorage, so we don't have to dispatch languageChange, but we still have to fetch other data
	// if (initialState.language !== 'en') {get generations/species...}
};

getInitialPokemonData();


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
// <React.StrictMode>
	<Provider store={store}>
		<App />
	</Provider>
// </React.StrictMode>
);