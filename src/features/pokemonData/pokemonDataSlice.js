import { createSlice, createAsyncThunk, current, isAnyOf } from "@reduxjs/toolkit";
import { transformToKeyName } from "../../util";
import { getEndpointData, getPokemons, getData, getDataToFetch, getRequiredData, getAllSpecies } from "../../api";
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
	tableInfo: {
		page: 1,
		rowsPerPage: 10,
		// for scroll restoration
		selectedPokemonId: null
	}
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
			if (state.advancedSearch.types.length) {
				state.advancedSearch.types = [];
			};
			if (Object.keys(state.advancedSearch.generations).length) {
				state.advancedSearch.generations = {};
			};
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
		sortByChange: (state, action) => {
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
		tableInfoChanged: (state, action) => {
			state.tableInfo = {...state.tableInfo, ...action.payload};
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
			// .addCase(searchPokemon.pending, (state, action) => {
			// 	const {searchParam, selectedGenerations, selectedTypes} = action.meta.arg;
			// 	state.advancedSearch.generations = selectedGenerations || state.advancedSearch.generations;
			// 	state.advancedSearch.types = selectedTypes || state.advancedSearch.types;
			// 	state.searchParam = searchParam;
			// 	// reset table info
			// 	state.tableInfo.page = 1;
			// 	state.tableInfo.selectedPokemonId = null;
			// })
			.addCase(searchPokemon.fulfilled, (state, action) => {
				const {intersection, searchParam, selectedGenerations, selectedTypes} = action.payload;
				state.intersection = intersection;
				state.advancedSearch.generations = selectedGenerations || state.advancedSearch.generations;
				state.advancedSearch.types = selectedTypes || state.advancedSearch.types;
				state.searchParam = searchParam;

				// reset table info
				state.tableInfo.page = 1;
				state.tableInfo.selectedPokemonId = null;
			})
			.addCase(getPokemonsOnScroll.pending, state => {
				// prevent extra re-render if no fetching needed.
				const nextDisplay = state.nextRequest.slice(0, 24);
				if (!nextDisplay.every(id => state.pokemons[id])) {
					state.status = 'scrolling';
				};
			})
			.addCase(changeLanguage.fulfilled, (state, {payload}) => {
				const {fetchedSpecies, newNamesIds, language} = payload;
				state.pokemonSpecies = fetchedSpecies ? {...state.pokemonSpecies, ...fetchedSpecies} : state.pokemonSpecies;
				state.allPokemonNamesAndIds = newNamesIds;
				state.language = language;
			})
			.addCase(sortPokemons.pending, (state, action) => {
				// change UI before data is fetched.
				if (state.status === 'idle') {
					const sortBy = action.meta.arg;
					state.sortBy = sortBy;
				};
			})
			.addCase(changeViewMode.pending, (state, action) => {
				// change UI before data is fetched and prevent buttons from being clicked when there's data being fetched.
				if (state.status === 'idle') {
					const {viewMode} = action.meta.arg;
					state.viewMode = viewMode;
				};
			})
			.addMatcher(isAnyOf(getRequiredDataThunk.fulfilled, changeViewMode.fulfilled, changeLanguage.fulfilled), (state, action) => {
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
					state.status = 'idle';
				};
			})
			.addMatcher(isAnyOf(sortPokemons.fulfilled, searchPokemon.fulfilled, getPokemonsOnScroll.fulfilled), (state, action) => {
				const {fetchedPokemons,	nextRequest, pokemonsToDisplay } = action.payload;
				state.pokemons = fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : state.pokemons;
				state.nextRequest = nextRequest;
				state.display = pokemonsToDisplay;
				state.status = 'idle';
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

// To do:
// 1. check performance of each component.
// 2. separate slices.
// 3. use shallowEqual, createSelector, createEntityAdapter, RTKQ.
// 4. see if it's possible to rewrite selectors.

// check if we can move more state updates into pending case(if the component only cares about state that's been updated in either pending/thunk body or fulfilled, then this pattern will not cause extra re-render)

export default pokemonDataSlice.reducer;

export const {dataLoading, pokemonCountLoaded, pokemonNamesAndIdsLoaded, intersectionChanged, generationsLoaded, typesLoaded, pokemonsLoaded, displayChanged, advancedSearchReset, backToRoot, searchParamChanged, advancedSearchChanged, nextRequestChanged, languageChanged, pokemonSpeciesLoaded, versionLoaded, moveDamageClassLoaded, statLoaded, itemLoaded, abilityLoaded, error, evolutionChainsLoaded, movesLoaded, machineDataLoaded, tablePageChanged, tableInfoChanged, sortByChange} = pokemonDataSlice.actions;

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

	const {fetchedPokemons,	nextRequest, pokemonsToDisplay } = await getPokemons({}, pokemonsNamesAndId, dispatch, intersection, pokeData.sortBy);
	return {pokemonCount: speciesResponse.count, pokemonsNamesAndId, intersection, generationData, typeData, fetchedPokemons, nextRequest, pokemonsToDisplay}
});

export const sortPokemons = createAsyncThunk('pokeData/sortPokemons', async(sortOption, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;

	if (pokeData.status === 'idle') {
		const res = await getPokemons(pokeData.pokemons, pokeData.allPokemonNamesAndIds, dispatch, pokeData.intersection, sortOption);
		return res;
	} else {
		// prevent fulfilled reducer function from runing.
		return rejectWithValue('multiple requests while data is loading');
	};
});

export const searchPokemon = createAsyncThunk('pokeData/searchPokemon', async ({searchParam, selectedGenerations, selectedTypes, matchMethod}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const allNamesAndIds = pokeData.allPokemonNamesAndIds;
	const pokemonNames = Object.keys(allNamesAndIds);
	// get range
	let pokemonRange = [];

	if (!selectedGenerations || Object.keys(selectedGenerations).length === 0) {
		for (let i = 0; i < pokemonNames.length; i ++) {
			let obj = {};
			obj.name = pokemonNames[i];
			obj.url = `https://pokeapi.co/api/v2/pokemon-species/${allNamesAndIds[pokemonNames[i]]}/`
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
	const {fetchedPokemons, pokemonsToDisplay, nextRequest} = await getPokemons(pokeData.pokemons, allNamesAndIds, dispatch, intersection, pokeData.sortBy);
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
	console.log('thunk runs')
	const pokeData = getState().pokeData;
	const fetchedData = await getRequiredData(pokeData, dispatch, requestPokemonIds, requests, lang);
	return {fetchedData};
});

export const changeViewMode = createAsyncThunk('pokeData/changeViewMode', async({requestPokemonIds, requests, viewMode}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	let fetchedData = {};
	if (pokeData.status === 'idle') {
		// prevent multiple fetches, I don't want to listen for status in the ViewMode component, else when scrolling, ViewMode will re-render.
		const isAllSpeciesCached = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
		const isAllPokemonsCached = isAllSpeciesCached ? Object.keys(pokeData.pokemonSpecies).every(id => pokeData.pokemons[id]) : false;
		if (!isAllSpeciesCached || !isAllPokemonsCached) {
			fetchedData = await getRequiredData(getState().pokeData, dispatch, requestPokemonIds, requests);
		};
	};
	return {fetchedData, viewMode};
});

export const changeLanguage = createAsyncThunk('pokeData/changeLanguage', async({option: language, pokeId}, {dispatch, getState, rejectWithValue}) => {
	const pokeData = getState().pokeData;
	if (pokeData.status === 'idle') {
		let fetchedSpecies;
		const hasAllSpecies = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;
	
		const requests = pokeId ? ['pokemons', 'abilities', 'items', 'version', 'move-damage-class', 'stat'] : ['version', 'move-damage-class', 'stat'];
		const requestPokemonIds = pokeId ? pokeData.pokemonSpecies[getIdFromURL(pokeData.pokemons[pokeId].species.url)].varieties.map(variety => getIdFromURL(variety.pokemon.url)) : [undefined];
	
		if (!hasAllSpecies) {
			// the reason why I decide to dispatch dataLoading here instead of passing the dispatch down to getAllSpecies like some other functions(getRequiredData, getPokemons) is because that it requires some effors to check if the fecth is needed, but right here I already know that.
			dispatch(dataLoading());
			fetchedSpecies = await getAllSpecies(pokeData.pokemonSpecies, pokeData.pokemonCount);
		};
	
		const fetchedData = await getRequiredData(pokeData, dispatch, requestPokemonIds, requests, language);
		
		const newNamesIds = Object.values({...pokeData.pokemonSpecies, ...fetchedSpecies}).reduce((pre, cur) => {
			pre[getNameByLanguage(cur.name, language, cur)] = cur.id;
			return pre;
		}, {});
		
		return {fetchedData, fetchedSpecies, newNamesIds ,language};
	} else {
		return rejectWithValue('multiple requests while data is loading');
	};
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
export const selectTableInfo = state => state.pokeData.tableInfo;


export const selectPokemonById = (state, id) => state.pokeData.pokemons[id];

export const selectSpeciesById = (state, id) => {
	const speciesId = getIdFromURL(state.pokeData.pokemons[id]?.species?.url);
	return state.pokeData.pokemonSpecies[speciesId];
};

export const selectChainDataByChainId = (state, chainId) => state.pokeData.evolutionChains?.[chainId];


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

// see if you want to disable Search/Sort the same way used in ViewMode
	// html title...
	// is it possible to batch thunk dispatch with regular action dispatch? (seems not possible, more experiments are needed.)



	// optimize: reorder table, change viewMode (pokemons will re-renders twice because of sortPokemons's pending + sortPokemons's fulfilled + changeViewMode's pending) (but this will not be trigger that often.)


	// can we change state in the thunk body instead of dispatching? e.g.
	// getState().pokeData.status = 'loading'



	// Redux dispatch pattern (for minimum re-renders):
	/* 
	Always only use thunk body + fulfilled reducer.
	Have a isFetchRequired boolean value.
	(fetch is needed)
	1. if isFetchRequired is true, then dispatch dataLoading and dispatch UI change in the thunk body before fetching.
	2. return the fetched data.
	3. update state in the fulfilled reducer function
	--------------------------------------------------------
	in the case of fetch is required, there're only two re-renders.

	(fetch is NOT needed)
	1. if isFetchRequired is false, neither dispatch dataLoading nor dispatch UI change in the thunk body.
	2. in the fulfilled reducer function, check if fetched data existes, if it does, update the relevant state value and UI, if it doesn't, just update the relevant state value.
	--------------------------------------------------------
	in the case of fetch is not required, there's only one re-renders

	Note 1: in the fulfilled reducer function, there's should be a condition check if fetched data exist to determin whether update the UI here or UI has already been updated in the thunk body. (if UI update is about premitive value, then update UI again in the fulfilled reducer function wounldn't make extra re-render)
	Note 2: the fetch logic should only be executed when isFetchRequired === true.
	*/