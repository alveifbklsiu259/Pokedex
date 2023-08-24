import { createSlice, createAsyncThunk, current, isAnyOf } from "@reduxjs/toolkit";
import { transformToKeyName, getIdFromURL } from "../../util";
import { getEndpointData, getPokemons, getData, getDataToFetch, getRequiredData } from "../../api";
import { changeViewMode, changeLanguage, sortPokemons, scrolling } from "../display/displaySlice";
import { searchPokemon } from "../search/searchSlice";

const initialState = {
	pokemons: {},
	pokemonCount: null,
	pokemonSpecies: {},
	abilities: {},
	types: {},
	moves: {},
	machines: {},
	stat: {},
	move_damage_class: {},
	version: {},
	generations: {},
	evolutionChains: {},
	items: {},
	allPokemonNamesAndIds: {},
};

const pokemonDataSlice = createSlice({
	// The string from the name option is used as the first part of each action type, and the key name of each reducer function is used as the second part.
	name: 'pokeData',
	initialState,
	reducers : {
		abilityLoaded: (state, action) => {
			state.abilities = {...state.abilities, ...action.payload};
		},
		//The "prepare callback" function can take multiple arguments, generate random values like unique IDs, and run whatever other synchronous logic is needed to decide what values go into the action object. It should then return an object with the payload field inside. (The return object may also contain a meta field, which can be used to add extra descriptive values to the action, and an error field, which should be a boolean indicating whether this action represents some kind of an error.)
		movesLoaded: {
			prepare(fetchedMoves) {
				return {
					payload: fetchedMoves.reduce((pre, cur) => {
						pre[transformToKeyName(cur.name)] = cur;
						return pre;
					}, {})
				};
			},
			reducer(state, action) {
				state.moves = {...state.moves, ...action.payload};
			}
		},
		machineDataLoaded: (state, action) => {
			const newEntities = Object.keys(action.payload).reduce((pre, cur) => {
				pre[cur] = {
					version_groups: {...state.machines[cur]?.version_groups, ...action.payload[cur].version_groups}
				};
				return pre;
			}, {});
			state.machines = {...state.machines, ...newEntities};
		},
		// pokemonCountLoaded: (state, action) => {
		// 	state.pokemonCount = action.payload;
		// },
		// pokemonNamesAndIdsLoaded: (state, action) => {
		// 	state.allPokemonNamesAndIds = action.payload;
		// },
		// intersectionChanged: (state, action) => {
		// 	state.intersection = action.payload;
		// },
		// generationsLoaded: (state, action) => {
		// 	state.generations = action.payload;
		// },
		// typesLoaded: (state, action) => {
		// 	state.types = action.payload;
		// },
		// pokemonsLoaded: (state, action) => {
		// 	state.pokemons = {...state.pokemons, ...action.payload.data};
		// 	state.nextRequest = action.payload.nextRequest === 'unchanged' ? state.nextRequest : action.payload.nextRequest;
		// },
		// displayChanged: (state, action) => {
		// 	state.display = action.payload;
		// },
		// nextRequestChanged: (state, action) => {
		// 	state.nextRequest = action.payload;
		// },
		// languageChanged: (state, action) => {
		// 	state.language = action.payload;
		// },
		// pokemonSpeciesLoaded: (state, action) => {
		// 	state.pokemonSpecies = {...state.pokemonSpecies, ...action.payload};
		// },
		// versionLoaded: (state, action) => {
		// 	state.version = action.payload;
		// },
		// moveDamageClassLoaded: (state, action) => {
		// 	state.move_damage_class = action.payload;
		// },
		// statLoaded: (state, action) => {
		// 	state.stat = action.payload;
		// },
		// itemLoaded: (state, action) => {
		// 	state.items = {...state.items, ...action.payload};
		// },
		// evolutionChainsLoaded: (state, action) => {
		// 	state.evolutionChains = {...state.evolutionChains, ...action.payload};
		// },
	},
	extraReducers: builder => {
		builder
			.addCase(getInitialData.fulfilled, (state, action) => {
				const {pokemonCount, pokemonsNamesAndId, generationData, typeData, fetchedPokemons} = action.payload;
				return {
					...state,
					pokemonCount: pokemonCount,
					allPokemonNamesAndIds: pokemonsNamesAndId,
					generations: generationData,
					types: typeData,
					pokemons: fetchedPokemons,
				};
			})
			.addCase(changeLanguage.fulfilled, (state, action) => {
				const {fetchedSpecies, newNamesIds} = action.payload;
				state.pokemonSpecies = fetchedSpecies ? {...state.pokemonSpecies, ...fetchedSpecies} : state.pokemonSpecies;
				state.allPokemonNamesAndIds = newNamesIds;
			})
			.addMatcher(isAnyOf(getRequiredDataThunk.fulfilled, changeViewMode.fulfilled, changeLanguage.fulfilled), (state, action) => {
				const {fetchedData} = action.payload;
				const keys = Object.keys(fetchedData);
				if (keys.length) {
					keys.forEach(key => {
						switch(key) {
							case 'evolutionChains' : {
								const {chainData, fetchedPokemons, fetchedSpecies} = fetchedData[key];
								state[key] = {...state[key], ...chainData};
								if (Object.keys(fetchedPokemons).length) {
									state.pokemons = {...state.pokemons, ...fetchedPokemons}
								};
								if (Object.keys(fetchedSpecies).length) {
									state.pokemonSpecies = {...state.pokemonSpecies, ...fetchedSpecies}
								};
								break;
							}
							default : 
								state[transformToKeyName(key)] = {...state[transformToKeyName(key)], ...fetchedData[key]};
						};
					});
				};
			})
			.addMatcher(isAnyOf(sortPokemons.fulfilled, searchPokemon.fulfilled, getPokemonsOnScroll.fulfilled), (state, action) => {
				const {fetchedPokemons} = action.payload;
				state.pokemons = fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : state.pokemons;
			})
			.addDefaultCase((state, action) => {
				if (action.payload === 'multiple requests while data is loading') {
					// intentionally do nothing.
					console.log('multiple requests while data is loading')
				} else if (action?.error?.message === 'Rejected') {
					// handle fetch error
				}
			})
	}
});

export default pokemonDataSlice.reducer;

// export const {pokemonCountLoaded, pokemonNamesAndIdsLoaded, intersectionChanged, generationsLoaded, typesLoaded, pokemonsLoaded, displayChanged, nextRequestChanged, languageChanged, pokemonSpeciesLoaded, versionLoaded, moveDamageClassLoaded, statLoaded, itemLoaded, abilityLoaded, evolutionChainsLoaded, movesLoaded, machineDataLoaded, tablePageChanged, sortByChange} = pokemonDataSlice.actions;

export const {abilityLoaded, movesLoaded, machineDataLoaded} = pokemonDataSlice.actions;

export const getInitialData = createAsyncThunk('pokeData/getInitialData', async(_, {dispatch, getState}) => {
	const dispalyData = getState().display;
	let generationData, typeData, pokemonsNamesAndId = {}, intersection = [];
	// get pokemons count, all names and ids
	const speciesResponse = await getEndpointData('pokemon-species')
	for (let pokemon of speciesResponse.results) {
		pokemonsNamesAndId[pokemon.name] = getIdFromURL(pokemon.url);
	};
	// set the range
	for (let i = 1; i <= speciesResponse.count; i++) {
		intersection.push(i);
	};
	// get generations
	const generationResponse = await getEndpointData('generation');
	generationData = await getData('generation', generationResponse.results.map(entry => entry.name), 'name');

	// get types
	const typeResponse = await getEndpointData('type');
	typeData = await getData('type', typeResponse.results.map(entry => entry.name), 'name');

	const {fetchedPokemons, nextRequest, pokemonsToDisplay} = await getPokemons({}, pokemonsNamesAndId, dispatch, intersection, dispalyData.sortBy);
	return {pokemonCount: speciesResponse.count, pokemonsNamesAndId, intersection, generationData, typeData, fetchedPokemons, nextRequest, pokemonsToDisplay};
});

export const getPokemonsOnScroll = createAsyncThunk('pokeData/getPokemonsOnScroll', async(_, {dispatch ,getState}) => {
	const pokeData = getState().pokeData;
	const dispalyData = getState().display;
	const request = [...dispalyData.nextRequest];
	const pokemonsToDisplay = request.splice(0, 24);
	const nextRequest = request.length ? request : null;
	const cachedPokemons = pokeData.pokemons;
	const displayedPokemons = dispalyData.display;
	const pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
	// prevent extra re-render if no fetching needed.
	if (pokemonsToFetch.length) {
		dispatch(scrolling());
	};
	const fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
	return {fetchedPokemons, nextRequest, pokemonsToDisplay: [...displayedPokemons, ...pokemonsToDisplay]};
});

export const getRequiredDataThunk = createAsyncThunk('pokeData/getRequiredData', async({requestPokemonIds, requests, lang}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display;
	// if language is not provided, use the current language.
	const language = lang || displayData.language;
	const fetchedData = await getRequiredData(pokeData, dispatch, requestPokemonIds, requests, language);
	return {fetchedData};
});

export const selectAllIdsAndNames = state => state.pokeData.allPokemonNamesAndIds;
export const selectPokemons = state => state.pokeData.pokemons;
export const selectSpecies = state => state.pokeData.pokemonSpecies;
export const selectTypes = state => state.pokeData.types;
export const selectGenerations = state => state.pokeData.generations;
export const selectAbilities = state => state.pokeData.abilities;
export const selectItems = state => state.pokeData.items;
export const selectStat = state => state.pokeData.stat;
export const selectPokemonCount = state => state.pokeData.pokemonCount;
export const selectVersions = state => state.pokeData.version;
export const selectMoves = state => state.pokeData.moves;
export const selectMoveDamageClass = state => state.pokeData.move_damage_class;
export const selectMachines = state => state.pokeData.machines;
export const selectPokemonById = (state, id) => state.pokeData.pokemons[id];
export const selectSpeciesById = (state, id) => {
	const speciesId = getIdFromURL(state.pokeData.pokemons[id]?.species?.url);
	return state.pokeData.pokemonSpecies[speciesId];
};
export const selectChainDataByChainId = (state, chainId) => state.pokeData.evolutionChains?.[chainId];

// To do:
// 1. check performance of each component.
// 2. separate slices.
// 3. use shallowEqual, createSelector, createEntityAdapter, RTKQ.
// 4. see if it's possible to rewrite selectors.
// maybe prefetch pokemons on scrolling
// html title...
// show navbar when visiting undefined route, e.g. localhost:3000/ddd





// selector
// check this performance issue, and see if we have the same problem?
// https://redux.js.org/tutorials/essentials/part-6-performance-normalization#:~:text=Let%27s%20say%20we-,have,-fetched%20some%20notifications


//  is this possible?
// const selectors = Object.keys(initialState).reduce((pre, cur) => {
// 	pre[`select${cur.charAt(0).toUpperCase() + cur.slice(1)}`] = state => state.pokeData[cur];
// 	return pre;
// }, {});

// export{...selectors};


// cache input 
// see if i can batch dispatches between getInitialData and getRequiredData
// handling direct changes in url
// the below code is not enough, other data needs to be fetched.
// const lang = window.sessionStorage.getItem('pokedexLang');
// if (lang !== 'en') {
// 	dispatch({type: 'languageChanged', payload: lang});
// }
// or can we directly set lange to sessionStorage, so we don't have to dispatch languageChange, but we still have to fetch other data
// if (initialState.language !== 'en') {get generations/species...}


// optimize: reorder table, change viewMode (pokemons will re-renders twice because of sortPokemons's pending + sortPokemons's fulfilled + changeViewMode's pending) (but this will not be trigger that often.)