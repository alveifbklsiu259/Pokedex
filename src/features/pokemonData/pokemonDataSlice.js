import { createSlice } from "@reduxjs/toolkit";
import { transformToKeyName } from "../../util";

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
}


// if we have multiple slices, and we decide to put loading status to its own slice, when we handle a thunk fetching pokemon, how are we gonna changing the status if it's in another "state"? (extraReducer' builder can only get access to the current state instead of the whole store state right?)

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
			return {
				...state, advancedSearch: {...state.advancedSearch, [field]: data}
			}
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
	}
})

export default pokemonDataSlice.reducer;

export const {dataLoading, pokemonCountLoaded, pokemonNamesAndIdsLoaded, intersectionChanged, generationsLoaded, typesLoaded, pokemonsLoaded, displayChanged, advancedSearchReset, backToRoot, searchParamChanged, advancedSearchChanged, nextRequestChanged, scrolling, languageChanged, pokemonSpeciesLoaded, versionLoaded, moveDamageClassLoaded, statLoaded, itemLoaded, abilityLoaded, error, evolutionChainsLoaded, movesLoaded, machineDataLoaded, viewModeChanged} = pokemonDataSlice.actions;




// thunk

// when a component needs to do fetch some data, do we create a thunk in the slice file, then import it into the component, or do we just do the async logic in say onClick event? (what's the point of defining a thunk here, encapsulating?)







// selector
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