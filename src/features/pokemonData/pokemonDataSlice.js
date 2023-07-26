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
};


// if we have multiple slices, and we decide to put loading status to its own slice, when we handle a thunk fetching pokemon, how are we gonna changing the status if it's in another "state"? (extraReducer' builder can only get access to the current state instead of the whole store state right?)
//(the answer may be: you have to import the action creator from that slice and then dispath it)

const pokemonDataSlice = createSlice({
	// The string from the name option is used as the first part of each action type, and the key name of each reducer function is used as the second part.
	// also what you see when using Redux devtool
	name: 'pokeData',
	initialState,
	reducers : {
		//Redux actions and state should only contain plain JS values like objects, arrays, and primitives. Don't put class instances, functions, or other non-serializable values into Redux!.

		// Notice that our action object just contains the minimum amount of information needed to describe what happened. We know which post we need to update, and which reaction name was clicked on. We could have calculated the new reaction counter value and put that in the action, but it's always better to keep the action objects as small as possible, and do the state update calculations in the reducer. This also means that reducers can contain as much logic as necessary to calculate the new state.
		dataLoading: state => {
			state.status = 'loading'
		},
		pokemonCountLoaded: (state, action) => {
			state.pokemonCount = action.payload;
			state.status = 'idle';
		},
		pokemonNamesAndIdsLoaded: (state, action) => {
			state.allPokemonNamesAndIds = action.payload;
			state.status = 'idle';
		},
		intersectionChanged: (state, action) => {
			state.intersection = action.payload;
		},
		generationsLoaded: (state, action) => {
			state.generations = action.payload;
			state.status = 'idle';
		},
		typesLoaded: (state, action) => {
			state.types = action.payload;
			state.status = 'idle';
		},
		pokemonsLoaded: (state, action) => {
			state.pokemons = {...state.pokemons, ...action.payload.data};
			state.nextRequest = action.payload.nextRequest === 'unchanged' ? state.nextRequest : action.payload.nextRequest;
			state.status = 'idle';
		},
		displayChanged: (state, action) => {
			state.display = action.payload;
			state.status = 'idle';
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
			state.status = 'idle';
			state.pokemonSpecies = {...state.pokemonSpecies, ...action.payload};
		},
		versionLoaded: (state, action) => {
			state.status = 'idle';
			state.version = action.payload;
		},
		moveDamageClassLoaded: (state, action) => {
			state.status = 'idle';
			state.move_damage_class = action.payload;
		},
		statLoaded: (state, action) => {
			state.status = 'idle';
			state.stat = action.payload;
		},
		itemLoaded: (state, action) => {
			state.status = 'idle';
			state.items = {...state.items, ...action.payload};
		},
		abilityLoaded: (state, action) => {
			state.status = 'idle';
			state.abilities = {...state.abilities, ...action.payload};
		},
		error: state => {
			state.status = 'error'
		},
		evolutionChainsLoaded: (state, action) => {
			state.status = 'idle';
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
				const {
					pokemonCount,
					pokemonsNamesAndId,
					intersection,
					generationData,
					typeData,
					fetchedPokemons,
					nextRequest,
					pokemonsToDisplay
				} = action.payload;
				return {
					...state,
					pokemonCount: pokemonCount,
					allPokemonNamesAndIds: pokemonsNamesAndId,
					intersection: intersection,
					generations: generationData,
					types: typeData,
					pokemons: fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : {...state.pokemons},
					nextRequest: nextRequest === 'unchanged' ? state.nextRequest : nextRequest,
					display: pokemonsToDisplay,
					status: 'idle'
				}
			})
			.addCase(getPokemonsThunk.pending, state => {
				state.status = 'loading';
			})
			.addCase(getPokemonsThunk.fulfilled, (state, action) => {
				const {fetchedPokemons,	nextRequest, pokemonsToDisplay } = action.payload;
				state.pokemons = fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : {...state.pokemons};
				state.nextRequest = nextRequest === 'unchanged' ? state.nextRequest : nextRequest;
				state.display = pokemonsToDisplay;
				state.status = 'idle';
			})
			.addCase(searchPokemon.pending, state => {
				state.status = 'loading'
			})
			.addCase(searchPokemon.fulfilled, (state, action) => {
				const {intersection, searchParam, selectedGenerations, selectedTypes, fetchedPokemons, nextRequest, pokemonsToDisplay} = action.payload;
				if (JSON.stringify(state.intersection) !== JSON.stringify(intersection)) {
					state.intersection = intersection;
					state.searchParam = searchParam;
					state.advancedSearch.generations = selectedGenerations;
					state.advancedSearch.types = selectedTypes;
					state.pokemons = fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : {...state.pokemons};
					state.nextRequest = nextRequest === 'unchanged' ? state.nextRequest : nextRequest;
					state.display = pokemonsToDisplay;
				};
				state.status = 'idle';
			})
			.addCase(getPokemonsOnScroll.pending, state => {
				state.status = 'scrolling'
			})
			.addCase(getPokemonsOnScroll.fulfilled, (state, action) => {
				const {fetchedPokemons, nextRequest, display} = action.payload;
				state.pokemons = fetchedPokemons ? {...state.pokemons, ...fetchedPokemons} : {...state.pokemons};
				state.nextRequest = nextRequest === 'unchanged' ? state.nextRequest : nextRequest;
				state.display = display;
				state.status = 'idle'
			})
			.addCase(getRequiredDataThunk.pending, state => {
				state.status = 'loading'
			})
			// .addCase(getRequiredDataThunk.fulfilled, (state, action) => {
			// 	const {fetchedData} = action.payload;
			// 	Object.keys(fetchedData).forEach(key => {
			// 		switch(key) {
			// 			case 'evolutionChains' : {
			// 				const [chainData, fetchedPokemons] = fetchedData[key];
			// 				state[key] = {...state[key], ...chainData};
			// 				if (Object.keys(fetchedPokemons)) {
			// 					state.pokemons = {...state.pokemons, ...fetchedPokemons}
			// 				};
			// 				break;
			// 			}
			// 			default : 
			// 				state[key] = {...state[key], ...fetchedData[key]};
			// 		};
			// 	})
			// 	state.status = 'idle';
			// })
			.addCase(changeLanguageThunk.pending, state => {
				const hasAllSpecies = Object.keys(state.pokemonSpecies).length === state.pokemonCount;
				if (!hasAllSpecies) {
					state.status = 'loading';
				};
			})
			.addCase(changeLanguageThunk.fulfilled, (state, {payload}) => {
				const {fetchedSpecies, newNamesIds ,language} = payload;
				if (fetchedSpecies) {
					state.pokemonSpecies = {...state.pokemonSpecies, ...fetchedSpecies};
				};
				state.allPokemonNamesAndIds = newNamesIds;
				state.language = language;
			})
			.addMatcher(isAnyOf(getRequiredDataThunk.fulfilled, changeLanguageThunk.fulfilled), (state, action) => {
				const {fetchedData} = action.payload;
				Object.keys(fetchedData).forEach(key => {
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
							state[key] = {...state[key], ...fetchedData[key]};
					};
				})
				state.status = 'idle';
			})
	}
})

export default pokemonDataSlice.reducer;

export const {dataLoading, pokemonCountLoaded, pokemonNamesAndIdsLoaded, intersectionChanged, generationsLoaded, typesLoaded, pokemonsLoaded, displayChanged, advancedSearchReset, backToRoot, searchParamChanged, advancedSearchChanged, nextRequestChanged, scrolling, languageChanged, pokemonSpeciesLoaded, versionLoaded, moveDamageClassLoaded, statLoaded, itemLoaded, abilityLoaded, error, evolutionChainsLoaded, movesLoaded, machineDataLoaded, viewModeChanged, sortByChanged} = pokemonDataSlice.actions;

// maybe we can just do:
// export const actions = pokemonDataSlice.actions, then use actions.xxx in each component, but if we're gonna separate these to different slice file, maybe there's no need to do this.



// thunk
// thuk API: dispatch and getState: the actual dispatch and getState methods from our Redux store. You can use these inside the thunk to dispatch more actions, or get the latest Redux store state (such as reading an updated value after another action is dispatched), then maybe we don't have to use flushSynch or we can still read the state value after they've changed, for example we can check status(if (getState().status !== 'loading') {dispatch(dataLoading())} things like that.)


// when a component needs to fetch some data, do we create a thunk in the slice file, then import it into the component, or do we just do the async logic in say onClick event? (what's the point of defining a thunk here, encapsulating?)

// when using a asyncThunk, I can just dispatch some action creators already defined in the slice's reducer, what's the point of adding extraReducer? (there're some reasons I can think of: 
// 1. it automatically generates pending/fulfilled/rejected states for you to dispatch at different life time of a request
// 2. you can also use addMatcher/addDefaultCase

export const getInitialData = createAsyncThunk('pokeData/getInitialData', async(undefined, {dispatch, getState}) => {
	// if status is stored in a separate slicem we're gonna have to dispatch here.
	// separate slices later near the end.
	
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

	const {fetchedPokemons,	nextRequest, pokemonsToDisplay } = await getPokemons({}, pokemonsNamesAndId, intersection, 'numberAsc');
	return {
		pokemonCount: speciesResponse.count, pokemonsNamesAndId, intersection, generationData, typeData, fetchedPokemons, nextRequest, pokemonsToDisplay
	}

	// dispatch(pokemonCountLoaded(speciesResponse.count));
	// dispatch(pokemonNamesAndIdsLoaded(pokemonsNamesAndId));
	// dispatch(intersectionChanged(intersection));
	// dispatch(generationsLoaded(generationData));
	// dispatch(typesLoaded(typeData));

	// if (fetchedPokemons) {
	// 	dispatch(pokemonsLoaded({data: fetchedPokemons, nextRequest: nextRequest}));
	// } else {
	// 	dispatch(nextRequestChanged(nextRequest));
	// };
	// dispatch(displayChanged(pokemonsToDisplay));


	// or you can return all those data and change them all at once in the extraReducer?

	// if we do getInitialData.pending + getInitialData.fulfilled, does it cause multiple re-renders?

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
});

export const getPokemonsThunk = createAsyncThunk('pokeData/getPokemons', async(sortOption, {getState}) => {
	const pokeData = getState().pokeData;
	return (await getPokemons(pokeData.pokemons, pokeData.allPokemonNamesAndIds, pokeData.intersection, sortOption))
});

export const searchPokemon = createAsyncThunk('pokeData/searchPokemon', async ({intersection, searchParam, selectedGenerations, selectedTypes}, {getState}) => {
	const pokeData = getState().pokeData;
	const cachedPokemons = pokeData.pokemons;
	const allPokemonNamesAndIds = pokeData.allPokemonNamesAndIds;
	const sortBy = pokeData.sortBy;
	
	const {fetchedPokemons,	nextRequest, pokemonsToDisplay} = await getPokemons(cachedPokemons, allPokemonNamesAndIds, intersection, sortBy);

	return {intersection, searchParam, selectedGenerations, selectedTypes, fetchedPokemons, nextRequest, pokemonsToDisplay};
		// dispatch(intersectionChanged(intersection));
		// dispatch(searchParamChanged(searchParam));
		// dispatch(advancedSearchChanged({field: 'generations', data: selectedGenerations}));
		// dispatch(advancedSearchChanged({field: 'types', data: selectedTypes}));
		// if (fetchedPokemons) {
		// 	dispatch(pokemonsLoaded({data: fetchedPokemons, nextRequest: nextRequest}));
		// } else {
		// 	dispatch(nextRequestChanged(nextRequest));
		// };
		// dispatch(displayChanged(pokemonsToDisplay));
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
	return {fetchedPokemons, nextRequest, display: [...displayedPokemons, ...pokemonsToDisplay]};

	// we could dispatch here, or pass the data to payload then modify state in extraReducer, which method is better?
});

export const getRequiredDataThunk = createAsyncThunk('pokeData/getRequiredData', async({requestPokemonIds, requests, lang, callback}, { getState}) => {
	const fetchedData = await getRequiredData(getState().pokeData, requestPokemonIds, requests, lang);
	return {fetchedData};
});
// remove callback function

export const changeLanguageThunk = createAsyncThunk('pokeData/changeLanguage', async({option: language, pokeId}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	let fetchedSpecies;
	const hasAllSpecies = Object.keys(pokeData.pokemonSpecies).length === pokeData.pokemonCount;

	const requests = pokeId ? ['pokemons', 'abilities', 'items', 'version', 'move-damage-class', 'stat'] : ['version', 'move-damage-class', 'stat'];
	const requestPokemonIds = pokeId ? pokeData.pokemonSpecies[getIdFromURL(pokeData.pokemons[pokeId].species.url)].varieties.map(variety => getIdFromURL(variety.pokemon.url)) : [undefined];

	if (!hasAllSpecies) {
		fetchedSpecies = await getAllSpecies(pokeData.pokemonSpecies, pokeData.pokemonCount);
	};

	// const callback = !hasAllSpecies ? getAllSpecies : undefined;
	const fetchedData = await getRequiredData(pokeData, requestPokemonIds, requests, language);

	// seems like there's gonna be more than one dispatch(dataLoading());
	// change language will cause dataLoading to be dispatched even though there's no data need to be fetched
	
	const newNamesIds = Object.values({...pokeData.pokemonSpecies, ...fetchedSpecies}).reduce((pre, cur) => {
		pre[getNameByLanguage(cur.name, language, cur)] = cur.id;
		return pre;
	}, {});
	
	return {fetchedData, fetchedSpecies, newNamesIds ,language};
	
	// dispatch(getRequiredDataThunk.fulfilled(fetchedData));
	// dispatch(pokemonSpeciesLoaded(fetchedSpecies));
	// dispatch(pokemonNamesAndIdsLoaded(newNamesIds));
	// dispatch(languageChanged(language));
});


// in redux thunk, is state value stale in the same thunk execution?
// e.g. 
// dispatch(....)
//  will getState() read the new state?




// what exactly is the use of asyncThunk, event without it, we can still make async request.


// normal asynchronous data flow (click event):
// in the component, click --> async function --> fetch data --> data ready --> dispatch regular action to redux.
// declare in slice file, in the component --> click --> dispatch thunk function --> the thunk calls the async function declared inside, --> (we can dispatch other action) --> when the data comes back, the middle dispatch the response to the reducer

// if it's a function that dispatches some action, without the redux-thunk, you're gonna have to import dispatch to the component and pass dispatch down to that async function, furthermore, if that async function needs to interact with state data, in that component you're gonna list to a lot of state value which may cause the component to re-render too ofen.
// if it's a function that return some data, you're still gonna have to dispatch the returned data to redux state yourself in that component, and the above state-reading problem also applies to this.
// with redux-thunk, you create a thunk function in your slice file, and you only have to dispatch this thunk function in your component, if your thunk function needs to interact with state value, you don't have to listen for a lot of state values in that component, because the thunk function takes state and dispatch by default, this can reduce the chance that the component re-renders too often.




// I want to check if there's need to run theses thunks, cause if there's no data to fetch, i don't want unnecessary re-renders(loading --> idle)





































// We know that useSelector will re-run every time an action(including action from other components) is dispatched, and that it forces the component to re-render if we return a new reference value.
// say if we intentionally batch dispatchs, if a component reads the whole state vlaue, and each dispatch changes the state, say we try to batch 5 dispatches, does each dispatch cause that component to re-render once (so, 5 in total) or those re-renders will be batched to only one re-render?



//We could also customize the comparison function that useSelector runs to check the results, like useSelector(selectPostIds, shallowEqual)

// selector

// check this performance issue, and see if we have the same problem?
// https://redux.js.org/tutorials/essentials/part-6-performance-normalization#:~:text=Let%27s%20say%20we-,have,-fetched%20some%20notifications


// when writting selector, the state is the global redux state, which is different than the state in the each slice file's reducer function(the state in it only contains its own field, no other slices' state value), because under the hood, when you create a selector, it's gonna be passed to useSelector which will call state.getState() for us.

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