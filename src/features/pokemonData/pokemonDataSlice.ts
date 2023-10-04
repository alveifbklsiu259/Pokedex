import type { Pokemon, PokemonSpecies, Type, Move, Stat, MoveDamageClass, Version, Generation, Item, EvolutionChain, Ability } from "../../../typeModule";
import type { AppDispatch, RootState } from "../../app/store";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice, createAsyncThunk, isAnyOf } from "@reduxjs/toolkit";
import { transformToKeyName, getIdFromURL } from "../../util";
import { getEndpointData, getPokemons, getData, getDataToFetch, getRequiredData } from "../../api";
import { changeViewMode, changeLanguage, sortPokemons, scrolling, type LanguageOption } from "../display/displaySlice";
import { searchPokemon } from "../search/searchSlice";

export type CachedPokemon = {
	[id: string | number]: Pokemon.Root
}
export type CachedPokemonSpecies = {
	[id: string | number]: PokemonSpecies.Root
}
export type CachedAbility = {
	[name: string]: Ability.Root
}

type CachedType = {
	[name: string]: Type.Root
}

type CachedMove = {
	[name: string]: Move.Root
}

export type CachedMachine = {
	[name: string]: {
		version_groups: {
			[name: string]: string
		}
	}
}

export type CachedStat = {
	[name: string]: Stat.Root
}

export type CachedAllPokemonNamesAndIds = {
	[name: string]: number
}

export type CachedMoveDamageClass = {
	[name: string]: MoveDamageClass.Root;
}

export type CachedVersion = {
	[name: string]: Version.Root
}

type CachedGeneration = {
	[name: string]: Generation.Root
}

export type CachedItem = {
	[name: string]: Item.Root
}

export type CachedEvolutionChain = {
	[id: string | number]: EvolutionChain.Root
}

export type PokemonDataTypes = {
	pokemon: CachedPokemon,
	pokemonCount: null | number,
	pokemonSpecies: CachedPokemonSpecies,
	ability: CachedAbility,
	type: CachedType,
	move: CachedMove,
	machine: CachedMachine
	stat: CachedStat
	moveDamageClass: CachedMoveDamageClass
	version: CachedVersion
	generation: CachedGeneration
	evolutionChain: CachedEvolutionChain
	item: CachedItem
	allPokemonNamesAndIds: CachedAllPokemonNamesAndIds
}

const initialState: PokemonDataTypes = {
	pokemon: {},
	pokemonCount: null,
	pokemonSpecies: {},
	ability: {},
	type: {},
	move: {},
	machine: {},
	stat: {},
	moveDamageClass: {},
	version: {},
	generation: {},
	evolutionChain: {},
	item: {},
	allPokemonNamesAndIds: {},
};

const pokemonDataSlice = createSlice({
	// The string from the name option is used as the first part of each action type, and the key name of each reducer function is used as the second part.
	name: 'pokeData',
	initialState,
	reducers : {
		abilityLoaded: (state, action: PayloadAction<CachedAbility>) => {
			state.ability = {...state.ability, ...action.payload};
		},
		//The "prepare callback" function can take multiple arguments, generate random values like unique IDs, and run whatever other synchronous logic is needed to decide what values go into the action object. It should then return an object with the payload field inside. (The return object may also contain a meta field, which can be used to add extra descriptive values to the action, and an error field, which should be a boolean indicating whether this action represents some kind of an error.)
		movesLoaded: {
			prepare(fetchedMoves: Move.Root[]) {
				return {
					payload: fetchedMoves.reduce((pre: {[name: string]: Move.Root}, cur) => {
						pre[transformToKeyName(cur.name)!] = cur;
						return pre;
					}, {}),
					meta: {},
					error: {}
				};
			},
			reducer(state, action: PayloadAction<CachedMove>) {
				state.move = {...state.move, ...action.payload};
			}
		},
		machineDataLoaded: (state, action: PayloadAction<CachedMachine>) => {
			const newEntities = Object.keys(action.payload).reduce<CachedMachine>((pre, cur) => {
				pre[cur] = {
					version_groups: {...state.machine[cur]?.version_groups, ...action.payload[cur].version_groups}
				};
				return pre;
			}, {});
			state.machine = {...state.machine, ...newEntities};
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
		// 	state.generation = action.payload;
		// },
		// typesLoaded: (state, action) => {
		// 	state.type = action.payload;
		// },
		// pokemonsLoaded: (state, action) => {
		// 	state.pokemon = {...state.pokemon, ...action.payload.data};
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
		// 	state.moveDamageClass = action.payload;
		// },
		// statLoaded: (state, action) => {
		// 	state.stat = action.payload;
		// },
		// itemLoaded: (state, action) => {
		// 	state.item = {...state.item, ...action.payload};
		// },
		// evolutionChainsLoaded: (state, action) => {
		// 	state.evolutionChain = {...state.evolutionChain, ...action.payload};
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
					generation: generationData,
					type: typeData,
					pokemon: fetchedPokemons,
				};
			})
			.addCase(changeLanguage.fulfilled, (state, action) => {
				const {fetchedSpecies, newNamesIds} = action.payload;
				state.pokemonSpecies = fetchedSpecies ? {...state.pokemonSpecies, ...fetchedSpecies} : state.pokemonSpecies;
				state.allPokemonNamesAndIds = newNamesIds;
			})
			.addMatcher(isAnyOf(getRequiredDataThunk.fulfilled, changeViewMode.fulfilled, changeLanguage.fulfilled), (state, action) => {
				const {fetchedData} = action.payload;
				if (fetchedData) {
					const keys = Object.keys(fetchedData) as unknown as Array<keyof typeof fetchedData>;
					keys.forEach(key => {
						switch(key) {
							case 'evolutionChain' : {
								const {chainData, fetchedPokemons, fetchedSpecies} = fetchedData[key]!;
								state[key] = {...state[key], ...chainData};
								if (Object.keys(fetchedPokemons).length) {
									state.pokemon = {...state.pokemon, ...fetchedPokemons}
								};
								if (Object.keys(fetchedSpecies).length) {
									state.pokemonSpecies = {...state.pokemonSpecies, ...fetchedSpecies}
								};
								break;
							}
							default : 
							state[key] = {...state[key], ...fetchedData[key]!} as any;
						};
					});
				};
			})
			.addMatcher(isAnyOf(sortPokemons.fulfilled, searchPokemon.fulfilled, getPokemonsOnScroll.fulfilled), (state, action) => {
				const {fetchedPokemons} = action.payload;
				state.pokemon = fetchedPokemons ? {...state.pokemon, ...fetchedPokemons} : state.pokemon;
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

type ReturnedInitialDataTypes = {
	pokemonCount: number;
	pokemonsNamesAndId: CachedAllPokemonNamesAndIds;
	intersection: number[];
	generationData: CachedGeneration;
	typeData: CachedType;
	fetchedPokemons: CachedPokemon;
	nextRequest: number[] | null;
	pokemonsToDisplay: number[]
}

export const getInitialData = createAsyncThunk<ReturnedInitialDataTypes, undefined, {state: RootState, dispatch: AppDispatch }>('pokeData/getInitialData', async(_, {dispatch, getState}) => {
	const dispalyData = getState().display;
	let generationData: CachedGeneration, typeData: CachedType, pokemonsNamesAndId: CachedAllPokemonNamesAndIds = {}, intersection: number[] = [];
	// get pokemon count, all names and ids
	const speciesResponse = await getEndpointData('pokemonSpecies');
	for (let pokemon of speciesResponse.results) {
		pokemonsNamesAndId[pokemon.name] = getIdFromURL(pokemon.url) as number;
	};
	// set the range
	for (let i = 1; i <= speciesResponse.count; i++) {
		intersection.push(i);
	};
	// get generation
	const generationResponse = await getEndpointData('generation');
	generationData = await getData('generation', generationResponse.results.map(entry => entry.name), 'name');

	// get type
	const typeResponse = await getEndpointData('type');
	typeData = await getData('type', typeResponse.results.map(entry => entry.name), 'name');

	const {fetchedPokemons, nextRequest, pokemonsToDisplay} = await getPokemons({}, pokemonsNamesAndId, dispatch, intersection, dispalyData.sortBy);
	return {pokemonCount: speciesResponse.count, pokemonsNamesAndId, intersection, generationData, typeData, fetchedPokemons, nextRequest, pokemonsToDisplay} as ReturnedInitialDataTypes;
});

type ReturnedScrollDataTypes = {
	fetchedPokemons: CachedPokemon,
	nextRequest: null | number[],
	pokemonsToDisplay: number[]
};

export const getPokemonsOnScroll = createAsyncThunk<ReturnedScrollDataTypes, undefined, {state: RootState}>('pokeData/getPokemonsOnScroll', async(_, {dispatch ,getState}) => {
	const pokeData = getState().pokeData;
	const dispalyData = getState().display;
	const request = dispalyData.nextRequest ? [...dispalyData.nextRequest] : null;
	const pokemonsToDisplay = request ? request.splice(0, 24) : [];
	const nextRequest = request || null;
	const cachedPokemons = pokeData.pokemon;
	const displayedPokemons = dispalyData.display;
	const pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
	// prevent extra re-render if no fetching needed.
	if (pokemonsToFetch.length) {
		dispatch(scrolling());
	};
	const fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id') as CachedPokemon;
	return {fetchedPokemons, nextRequest, pokemonsToDisplay: [...displayedPokemons, ...pokemonsToDisplay]} as ReturnedScrollDataTypes
});

export namespace GetRequiredData {
	export type Request = 'pokemon' | 'pokemonSpecies' | 'evolutionChain' | 'item' | 'ability' | 'version' | 'stat' | 'moveDamageClass';
	export type Params = {
		pokeData: RootState['pokeData'],
		requestPokemonIds: (number| string)[],
		requests: Request[],
		language: LanguageOption;
		disaptch?: AppDispatch;
	};
	export type FetchedData = {
		[K in Request]?: K extends 'evolutionChain' ? {
			chainData: CachedEvolutionChain,
			fetchedPokemons: CachedPokemon,
			fetchedSpecies: CachedPokemonSpecies,
		} : PokemonDataTypes[K]
	};
};

type GetRequiredDataThunkParams = {
	requestPokemonIds: (number| string)[],
	requests: GetRequiredData.Request[],
	language?: LanguageOption
}

type GetRequiredDataThunkReturnedType = {
	fetchedData: Awaited<ReturnType<typeof getRequiredData>>
};

export const getRequiredDataThunk = createAsyncThunk<GetRequiredDataThunkReturnedType, GetRequiredDataThunkParams, {state: RootState, dispatch: AppDispatch}>('pokeData/getRequiredData', async({requestPokemonIds, requests, language}, {dispatch, getState}) => {
	const pokeData = getState().pokeData;
	const displayData = getState().display;
	// if language is not provided, use the current language.
	const lang = language || displayData.language;

	const fetchedData = await getRequiredData(pokeData, requestPokemonIds, requests, lang, dispatch);
	return {fetchedData};
});

export const selectAllIdsAndNames = (state: RootState) => state.pokeData.allPokemonNamesAndIds;
export const selectPokemons = (state: RootState) => state.pokeData.pokemon;
export const selectSpecies = (state: RootState) => state.pokeData.pokemonSpecies;
export const selectTypes = (state: RootState) => state.pokeData.type;
export const selectGenerations = (state: RootState) => state.pokeData.generation;
export const selectAbilities = (state: RootState) => state.pokeData.ability;
export const selectItems = (state: RootState) => state.pokeData.item;
export const selectStat = (state: RootState) => state.pokeData.stat;
export const selectPokemonCount = (state: RootState) => state.pokeData.pokemonCount;
export const selectVersions = (state: RootState) => state.pokeData.version;
export const selectMoves = (state: RootState) => state.pokeData.move;
export const selectMoveDamageClass = (state: RootState) => state.pokeData.moveDamageClass;
export const selectMachines = (state: RootState) => state.pokeData.machine;
export const selectPokemonById = (state: RootState, id: number | string): Pokemon.Root | undefined => state.pokeData.pokemon[id];
export const selectSpeciesById = (state: RootState, id: number | string): PokemonSpecies.Root | undefined => {
	const speciesId = getIdFromURL(state.pokeData.pokemon[id]?.species?.url);
	return state.pokeData.pokemonSpecies[speciesId];
};
export function selectChainDataByChainId<T extends number | undefined>(state: RootState, chainId: T): T extends number ? EvolutionChain.Root : undefined;
export function selectChainDataByChainId(state: RootState, chainId: number | undefined): EvolutionChain.Root | undefined {
	if (chainId) {
		return state.pokeData.evolutionChain[chainId];
	} else {
		return undefined;
	};
};


// turn on strcitnullcheck and noimplicitany
// prefetch is not working on mobile

// when passing props down to another React component, you'll have to describe the shape of the props again in the child component, what if the props passed down is an object with tons of properties, is there other workaround than re-creating the shape again? (e.g. pass the props also?)

// To do:
// 1. check performance of each component.
// 3. use shallowEqual, createSelector, createEntityAdapter, RTKQ.
// 4. see if it's possible to rewrite selectors.
// maybe prefetch pokemon on scrolling
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
// if (initialState.language !== 'en') {get generation/species...}


// optimize: reorder table, change viewMode (pokemons will re-renders twice because of sortPokemons's pending + sortPokemons's fulfilled + changeViewMode's pending) (but this will not be trigger that often.)