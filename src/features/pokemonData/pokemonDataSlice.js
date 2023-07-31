import { createSlice, createAsyncThunk, current, isAnyOf } from "@reduxjs/toolkit";
import { transformToKeyName } from "../../util";
import { getEndpointData, getPokemons, getData, getDataToFetch, getRequiredData, getAllSpecies  } from "../../api";
import { getIdFromURL, getNameByLanguage } from "../../util";
const initialState = {
	// pokemon
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
	// search
	searchParam: '',
	advancedSearch: {
		generations: {},
		types: [],
	},
	// display
	display: [],
	intersection: [],
	viewMode: 'module',
	language: 'en',
	nextRequest: [],
	sortBy: 'numberAsc',
	status: null,
};

// if we have multiple slices, and we decide to put loading status to its own slice, when we handle a thunk fetching pokemon, how are we gonna changing the status if it's in another "state"? (extraReducer' builder can only get access to the current state instead of the whole store state right?)
// the answer may be: you have to import the action creator from that slice and then dispath it in the thunk)
// or you can do the opposite, import the thunk to the statusSlice, and add this thunk to that slice's extraReducer..

const pokemonDataSlice = createSlice({
	// The string from the name option is used as the first part of each action type, and the key name of each reducer function is used as the second part.
	// also what you see when using Redux devtool
	name: 'pokeData',
	initialState,
	reducers : {
		dataLoading: state => {
			state.status = 'loading';
		},
		pokemonCountLoaded: (state, action) => {
			state.pokemonCount = action.payload;
		},
		pokemonNamesAndIdsLoaded: (state, action) => {
			state.allPokemonNamesAndIds = action.payload;
		},
		intersectionChanged: (state, action) => {
			state.intersection = action.payload;
		},
		generationsLoaded: (state, action) => {
			state.generations = action.payload;
		},
		typesLoaded: (state, action) => {
			state.types = action.payload;
		},
		pokemonsLoaded: (state, action) => {
			state.pokemons = {...state.pokemons, ...action.payload.data};
			state.nextRequest = action.payload.nextRequest === 'unchanged' ? state.nextRequest : action.payload.nextRequest;
		},
		displayChanged: (state, action) => {
			state.display = action.payload;
		},
		advancedSearchReset: state => {
			state.advancedSearch = { generations: {}, types: [] };
			state.searchParam = '';
		},
		backToRoot: state => {
			state.status = 'idle';
		},
		searchParamChanged: (state, action) => {
			state.searchParam = action.payload;
		},
		advancedSearchChanged: (state, action) => {
			const {field, data} = action.payload;
			state.advancedSearch = {...state.advancedSearch, [field]: data};
		},
		nextRequestChanged: (state, action) => {
			state.nextRequest = action.payload;
		},
		scrolling: state => {
			state.status = 'scrolling'
		},
		languageChanged: (state, action) => {
			state.language = action.payload;
		},
		pokemonSpeciesLoaded: (state, action) => {
			state.pokemonSpecies = {...state.pokemonSpecies, ...action.payload};
		},
		versionLoaded: (state, action) => {
			state.version = action.payload;
		},
		moveDamageClassLoaded: (state, action) => {
			state.move_damage_class = action.payload;
		},
		statLoaded: (state, action) => {
			state.stat = action.payload;
		},
		itemLoaded: (state, action) => {
			state.items = {...state.items, ...action.payload};
		},
		abilityLoaded: (state, action) => {
			state.abilities = {...state.abilities, ...action.payload};
		},
		error: state => {
			state.status = 'error'
		},
		evolutionChainsLoaded: (state, action) => {
			state.evolutionChains = {...state.evolutionChains, ...action.payload};
		},
		sortByChanged: (state, action) => {
			state.sortBy = action.payload;
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
		viewModeChanged: (state, action) => {
			state.viewMode = action.payload;
		}
	},
	extraReducers: builder => {
		builder
			.addCase(getInitialData.pending, state => {
				state.status = 'loading'
			})
			.addCase(getInitialData.fulfilled, (state, action) => {
				const {pokemonCount, pokemonsNamesAndId, intersection, generationData, typeData, fetchedPokemons, nextRequest,pokemonsToDisplay} = action.payload;
				return {
					...state,
					pokemonCount: pokemonCount,
					allPokemonNamesAndIds: pokemonsNamesAndId,
					intersection: intersection,
					generations: generationData,
					types: typeData,
					pokemons: fetchedPokemons,
					nextRequest: nextRequest,
					display: pokemonsToDisplay,
					status: 'idle'
				}
			})
			.addCase(searchPokemon.fulfilled, (state, action) => {
				const {intersection, searchParam, selectedGenerations, selectedTypes} = action.payload;
				state.intersection = intersection;
				state.advancedSearch.generations = selectedGenerations || state.advancedSearch.generations;
				state.advancedSearch.types = selectedTypes || state.advancedSearch.types;
				state.searchParam = searchParam;
			})
			.addCase(getPokemonsOnScroll.pending, state => {
				state.status = 'scrolling'
			})
			.addCase(changeLanguageThunk.pending, state => {
				const hasAllSpecies = Object.keys(state.pokemonSpecies).length === state.pokemonCount;
				if (!hasAllSpecies) {
					state.status = 'loading';
				};
			})
			.addCase(changeLanguageThunk.fulfilled, (state, {payload}) => {
				const {fetchedSpecies, newNamesIds, language} = payload;
				state.pokemonSpecies = fetchedSpecies ? {...state.pokemonSpecies, ...fetchedSpecies} : state.pokemonSpecies;
				state.allPokemonNamesAndIds = newNamesIds;
				state.language = language;
			})
			.addCase(sortPokemons.fulfilled, (state, action) => {
				const {sortBy} = action.payload;
				state.sortBy = sortBy;
			})
			// .addCase(changeViewMode.pending, (state, action) => {
			// 	state.abilities = Math.random()
			// })
			// .addCase(changeViewMode.fulfilled, (state, action) => {
			// 	const {viewMode} = action.payload;
			// 	state.viewMode = viewMode;
			// })



			//changeViewMode.fulfilled
			.addMatcher(isAnyOf(getRequiredDataThunk.fulfilled, changeLanguageThunk.fulfilled), (state, action) => {
				const {fetchedData} = action.payload;
				const keys = Object.keys(fetchedData);
				if (keys.length) {
					keys.forEach(key => {
						switch(key) {
							case 'evolutionChains' : {
								const [chainData, fetchedPokemons] = fetchedData[key];
								state[key] = {...state[key], ...chainData};
								if (Object.keys(fetchedPokemons)) {
									state.pokemons = {...state.pokemons, ...fetchedPokemons}
								};
								break;
							}
							default : 
								state[transformToKeyName(key)] = {...state[transformToKeyName(key)], ...fetchedData[key]};
						};
					});
				};
				state.status = 'idle';
			})
			.addMatcher(isAnyOf(sortPokemons.fulfilled, searchPokemon.fulfilled, getPokemonsOnScroll.fulfilled), (state, action) => {
				const {fetchedPokemons,	nextRequest, pokemonsToDisplay } = action.payload;
				state.pokemons = fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : state.pokemons;
				state.nextRequest = nextRequest;
				state.display = pokemonsToDisplay;
				state.status = 'idle';
			})
	}
});

// To do:
// 1. check performance of each component.
// 2. separate slices.
// 3. use shallowEqual, createSelector, createEntityAdapter, RTKQ.
// 4. see if it's possible to rewrite selectors.

export default pokemonDataSlice.reducer;

export const {dataLoading, pokemonCountLoaded, pokemonNamesAndIdsLoaded, intersectionChanged, generationsLoaded, typesLoaded, pokemonsLoaded, displayChanged, advancedSearchReset, backToRoot, searchParamChanged, advancedSearchChanged, nextRequestChanged, scrolling, languageChanged, pokemonSpeciesLoaded, versionLoaded, moveDamageClassLoaded, statLoaded, itemLoaded, abilityLoaded, error, evolutionChainsLoaded, movesLoaded, machineDataLoaded, viewModeChanged, sortByChanged} = pokemonDataSlice.actions;

// maybe we can just do:
// export const actions = pokemonDataSlice.actions, then use actions.xxx in each component, but if we're gonna separate these to different slice file, maybe there's no need to do this.

export const getInitialData = createAsyncThunk('pokeData/getInitialData', async(_, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
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

	const {fetchedPokemons,	nextRequest, pokemonsToDisplay } = await getPokemons(pokeData, dispatch, intersection, pokeData.sortBy);
	return {pokemonCount: speciesResponse.count, pokemonsNamesAndId, intersection, generationData, typeData, fetchedPokemons, nextRequest, pokemonsToDisplay}
});

export const sortPokemons = createAsyncThunk('pokeData/sortPokemons', async(sortOption, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const res = await getPokemons(pokeData, dispatch, pokeData.intersection, sortOption)
	return {sortBy: sortOption, ...res};
});

export const searchPokemon = createAsyncThunk('pokeData/searchPokemon', async ({searchParam, selectedGenerations, selectedTypes, matchMethod}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const pokemonNames = Object.keys(pokeData.allPokemonNamesAndIds);
	// get range
	let pokemonRange = [];

	if (!selectedGenerations || Object.keys(selectedGenerations).length === 0) {
		for (let i = 0; i < pokemonNames.length; i ++) {
			let obj = {};
			obj.name = pokemonNames[i];
			obj.url = `https://pokeapi.co/api/v2/pokemon-species/${pokeData.allPokemonNamesAndIds[pokemonNames[i]]}/`
			pokemonRange.push(obj);
		};
	} else {
		pokemonRange = Object.values(selectedGenerations).flat();
	};

	// handle search param
	const trimmedText = searchParam.trim();
	let searchResult = [];
	if (trimmedText === '') {
		// no input or only contains white space(s)
		searchResult = pokemonRange;
	} else if (isNaN(Number(trimmedText))) {
		// sort by name
		searchResult = pokemonRange.filter(pokemon => pokemon.name.toLowerCase().includes(trimmedText.toLowerCase()));
	} else {
		// sort by id
		searchResult = pokemonRange.filter(pokemon => String(getIdFromURL(pokemon.url)).padStart(4 ,'0').includes(String(trimmedText)));
	};

	// get intersection
	const rangeIds = searchResult.map(pokemon => getIdFromURL(pokemon.url));
	let intersection = rangeIds;

	// handle types
	if (selectedTypes?.length) {
		if (matchMethod === 'all') {
			const typeMatchingArray = selectedTypes.reduce((pre, cur) => {
				pre.push(pokeData.types[cur].pokemon.map(entry => getIdFromURL(entry.pokemon.url)));
				return pre;
			}, []);
			for (let i = 0; i < typeMatchingArray.length; i ++) {
				intersection = intersection.filter(pokemon => typeMatchingArray[i].includes(pokemon));
			};
		} else if (matchMethod === 'part') {
			const typeMatchingPokemonIds = selectedTypes.reduce((pre, cur) => {
				pokeData.types[cur].pokemon.forEach(entry => pre.push(getIdFromURL(entry.pokemon.url)));
				return pre;
			}, []);
			intersection = rangeIds.filter(id => typeMatchingPokemonIds.includes(id));
		};
	};
	const {fetchedPokemons, pokemonsToDisplay, nextRequest} = await getPokemons(pokeData, dispatch, intersection, pokeData.sortBy);
	return {intersection, searchParam, selectedGenerations, selectedTypes, fetchedPokemons, nextRequest, pokemonsToDisplay};
});

export const getPokemonsOnScroll = createAsyncThunk('pokeData/getPokemonsOnScroll', async(_, {getState}) => {
	// i can just get state value here, without passing them down (hence my component wounldn't need to read that many state value.)
	const pokeData = getState().pokeData;
	const request = [...pokeData.nextRequest];
	const pokemonsToDisplay = request.splice(0, 24);
	const nextRequest = request.length ? request : null;
	const cachedPokemons = pokeData.pokemons;
	const displayedPokemons = pokeData.display;
	const pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
	const fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
	return {fetchedPokemons, nextRequest, pokemonsToDisplay: [...displayedPokemons, ...pokemonsToDisplay]};
});

export const getRequiredDataThunk = createAsyncThunk('pokeData/getRequiredData', async({requestPokemonIds, requests, lang}, {dispatch, getState}) => {
	const fetchedData = await getRequiredData(getState().pokeData, dispatch, requestPokemonIds, requests, lang);
	return {fetchedData};
});

export const changeViewMode = createAsyncThunk('pokeData/changeViewMode', async({requestPokemonIds, requests, lang, viewMode}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	let fetchedData = {};
	const isAllSpeciesCached = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
	const isAllPokemonsCached = isAllSpeciesCached ? Object.keys(pokeData.pokemonSpecies).every(id => pokeData.pokemons[id]) : false;

	if (!(isAllSpeciesCached && isAllPokemonsCached)) {
		fetchedData = await getRequiredData(getState().pokeData, dispatch, requestPokemonIds, requests, lang);
	};
	// what I want is no dataLoading being dispatched if no data need to be fetched, but if we follow the original pattern(dispatched dataLoading in the pending reducer function --> fetched data in the thunk body --> set new data in the fulfilled reducer function) this will cause two re-renders even when there's no data need to be fetched(the first one is setView(in ViewMode.js), then the state updates in the thunk's fulfilled reducer function), in order to achieve what I want, I decided to dispatch state updates in the thunk body, and remove the fulfilled reducer function.
	dispatch(viewModeChanged(viewMode));
	dispatch(getRequiredDataThunk.fulfilled({fetchedData}));
});

export const changeLanguageThunk = createAsyncThunk('pokeData/changeLanguage', async({option: language, pokeId}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	let fetchedSpecies;
	const hasAllSpecies = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;

	const requests = pokeId ? ['pokemons', 'abilities', 'items', 'version', 'move-damage-class', 'stat'] : ['version', 'move-damage-class', 'stat'];
	const requestPokemonIds = pokeId ? pokeData.pokemonSpecies[getIdFromURL(pokeData.pokemons[pokeId].species.url)].varieties.map(variety => getIdFromURL(variety.pokemon.url)) : [undefined];

	if (!hasAllSpecies) {
		fetchedSpecies = await getAllSpecies(pokeData.pokemonSpecies, pokeData.pokemonCount);
	};

	const fetchedData = await getRequiredData(pokeData, dispatch, requestPokemonIds, requests, language);
	
	const newNamesIds = Object.values({...pokeData.pokemonSpecies, ...fetchedSpecies}).reduce((pre, cur) => {
		pre[getNameByLanguage(cur.name, language, cur)] = cur.id;
		return pre;
	}, {});
	
	return {fetchedData, fetchedSpecies, newNamesIds ,language};
});

// selector
// check this performance issue, and see if we have the same problem?
// https://redux.js.org/tutorials/essentials/part-6-performance-normalization#:~:text=Let%27s%20say%20we-,have,-fetched%20some%20notifications

// should be selectAll... but this is verbose...
export const selectAllIdsAndNames = state => state.pokeData.allPokemonNamesAndIds;
export const selectStatus = state => state.pokeData.status;
export const selectPokemons = state => state.pokeData.pokemons;
export const selectSpecies = state => state.pokeData.pokemonSpecies;
export const selectSortBy = state => state.pokeData.sortBy;
export const selectTypes = state => state.pokeData.types;
export const selectGenerations = state => state.pokeData.generations;
export const selectLanguage = state => state.pokeData.language;
export const selectViewMode = state => state.pokeData.viewMode;
export const selectIntersection = state => state.pokeData.intersection;
export const selectAbilities = state => state.pokeData.abilities;
export const selectEvolutionChains = state => state.pokeData.evolutionChains;
export const selectItems = state => state.pokeData.items;
export const selectStat = state => state.pokeData.stat;
export const selectSearchParam = state => state.pokeData.searchParam;
export const selectAdvancedSearch = state => state.pokeData.advancedSearch;
export const selectDisplay = state => state.pokeData.display;
export const selectNextRequest = state => state.pokeData.nextRequest;
export const selectPokemonCount = state => state.pokeData.pokemonCount;
export const selectVersions = state => state.pokeData.version;
export const selectMoves = state => state.pokeData.moves;
export const selectMoveDamageClass = state => state.pokeData.move_damage_class;
export const selectMachines = state => state.pokeData.machines;

export const selectPokeData = state => state.pokeData;



//  is this possible?
// const selectors = Object.keys(initialState).reduce((pre, cur) => {
// 	pre[`select${cur.charAt(0).toUpperCase() + cur.slice(1)}`] = state => state.pokeData[cur];
// 	return pre;
// }, {});

// export{...selectors};


//


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