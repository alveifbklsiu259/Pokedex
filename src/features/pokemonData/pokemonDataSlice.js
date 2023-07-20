import { createSlice, createAsyncThunk, current } from "@reduxjs/toolkit";
import { transformToKeyName } from "../../util";
import { getEndpointData, getPokemons, getData } from "../../api";
import { getIdFromURL } from "../../util";
const initialState = {
	viewMode: 'module',
	language: 'en',
	pokemons: {},
	pokemonCount: null,
	nextRequest: [],
	pokemonSpecies: {},
	abilities: {},
	// loading | idle | scrolling | error 
	status: null,
	evolutionChains: {},
	searchParam: '',
	sortBy: 'numberAsc',
	advancedSearch: {
		generations: {},
		types: [],
	},
	display: [],
	allPokemonNamesAndIds: {},
	intersection: [],
	generations: {},
	types: {},
	moves: {},
	machines: {},
	// belowe are data that currently only required when language !== 'en'
	items: {},
	version: {},
	move_damage_class: {},
	stat: {}
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
			.addCase(getInitialData.pending, (state, action) => {
				console.log(current(state))
			})
			.addCase(getInitialData.fulfilled, (state, action) => {
				console.log(current(state))
			})
	}
})

export default pokemonDataSlice.reducer;

export const {dataLoading, pokemonCountLoaded, pokemonNamesAndIdsLoaded, intersectionChanged, generationsLoaded, typesLoaded, pokemonsLoaded, displayChanged, advancedSearchReset, backToRoot, searchParamChanged, advancedSearchChanged, nextRequestChanged, scrolling, languageChanged, pokemonSpeciesLoaded, versionLoaded, moveDamageClassLoaded, statLoaded, itemLoaded, abilityLoaded, error, evolutionChainsLoaded, movesLoaded, machineDataLoaded, viewModeChanged} = pokemonDataSlice.actions;

// maybe we can just do:
// export const actions = pokemonDataSlice.actions, then use actions.xxx in each component, but if we're gonna separate these to different slice file, maybe there's no need to do this.



// thunk
// thuk API: dispatch and getState: the actual dispatch and getState methods from our Redux store. You can use these inside the thunk to dispatch more actions, or get the latest Redux store state (such as reading an updated value after another action is dispatched), then maybe we don't have to use flushSynch or we can still read the state value after they've changed, for example we can check status(if (getState().status !== 'loading') {dispatch(dataLoading())} things like that.)


// when a component needs to fetch some data, do we create a thunk in the slice file, then import it into the component, or do we just do the async logic in say onClick event? (what's the point of defining a thunk here, encapsulating?)

// when using a asyncThunk, I can just dispatch some action creators already defined in the slice's reducer, what's the point of adding extraReducer? (there're some reasons I can think of: 
// 1. it automatically generates pending/fulfilled/rejected states for you to dispatch at different life time of a request
// 2. you can also use addMatcher/addDefaultCase

export const getInitialData = createAsyncThunk('pokeData/getInitialData', async(_, {dispatch, getState}) => {
	let generationData, typeData, pokemonsNamesAndId = {}, intersection = [];
	// dispatch(dataLoading());
	// check if status === loading
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

	// batch dispatches
	await getPokemons(dispatch, {}, pokemonsNamesAndId, intersection, 'numberAsc', 'loading');
	dispatch(pokemonCountLoaded(speciesResponse.count));
	dispatch(pokemonNamesAndIdsLoaded(pokemonsNamesAndId));
	dispatch(intersectionChanged(intersection));
	dispatch(generationsLoaded(generationData));
	dispatch(typesLoaded(typeData));
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



// We know that useSelector will re-run every time an action(including action from other components) is dispatched, and that it forces the component to re-render if we return a new reference value.

//We could also customize the comparison function that useSelector runs to check the results, like useSelector(selectPostIds, shallowEqual)

// selector

// check this performance issue, and see if we have the same problem?
// https://redux.js.org/tutorials/essentials/part-6-performance-normalization#:~:text=Let%27s%20say%20we-,have,-fetched%20some%20notifications


// when writting selector, the state is the global redux state, which is different than the state in the each slice file's reducer function(the state in it only contains its own field, no other slices' state value), because under the hood, when you create a selector, it's gonna be passed to useSelector which will call state.getState() for us.
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


// export const selectLanguage = state => state.pokeData.language;
// export const selectTypes = state => state.pokeData.types;
// export const selectTypes = state => state.pokeData.types;
// export const selectTypes = state => state.pokeData.types;
// export const selectTypes = state => state.pokeData.types;
// export const selectTypes = state => state.pokeData.types;
export const selectPokeData = state => state.pokeData;



//  is this possible?
// const selectors = Object.keys(initialState).reduce((pre, cur) => {
// 	pre[`select${cur.charAt(0).toUpperCase() + cur.slice(1)}`] = state => state.pokeData[cur];
// 	return pre;
// }, {});

// export{...selectors};