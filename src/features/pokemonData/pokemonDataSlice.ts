import { createSlice, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import type { AppDispatch, RootState } from "../../app/store";
import { getIdFromURL } from "../../util";
import { getEndpointData, getPokemons, getData, getRequiredData, GetReturnedDataType } from "../../api";
import { changeViewMode, changeLanguage, sortPokemons, scrolling, type LanguageOption } from "../display/displaySlice";
import { searchPokemon } from "../search/searchSlice";
import type { Pokemon, PokemonSpecies, Type, Move, Stat, MoveDamageClass, Version, Generation, Item, EvolutionChain, Ability } from "../../../typeModule";
import { createAppAsyncThunk } from "../../app/hooks";

export type CachedPokemon = {
	[id: string | number]: Pokemon.Root
};

export type CachedPokemonSpecies = {
	[id: string | number]: PokemonSpecies.Root
};

export type CachedAbility = {
	[name: string]: Ability.Root
};

export type CachedMachine = {
	[name: string]: {
		version_groups: {
			[name: string]: string | undefined
		}
	}
};

export type CachedStat = {
	[name: string]: Stat.Root
};

export type CachedAllPokemonNamesAndIds = {
	[name: string]: number
};

export type CachedMoveDamageClass = {
	[name: string]: MoveDamageClass.Root;
};

export type CachedVersion = {
	[name: string]: Version.Root
};

export type CachedItem = {
	[name: string]: Item.Root
};

export type CachedEvolutionChain = {
	[id: string | number]: EvolutionChain.Root
};

type CachedGeneration = {
	[name: string]: Generation.Root
};

type CachedType = {
	[name: string]: Type.Root
};

type CachedMove = {
	[name: string]: Move.Root
};

export type PokemonDataTypes = {
	pokemon: CachedPokemon,
	pokemonCount: null | number,
	pokemonSpecies: CachedPokemonSpecies,
	ability: CachedAbility,
	type: CachedType,
	move: CachedMove,
	machine: CachedMachine,
	stat: CachedStat,
	moveDamageClass: CachedMoveDamageClass,
	version: CachedVersion,
	generation: CachedGeneration,
	evolutionChain: CachedEvolutionChain,
	item: CachedItem,
	allPokemonNamesAndIds: CachedAllPokemonNamesAndIds
};

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
	name: 'pokeData',
	initialState,
	reducers : {
		abilityLoaded: (state, action: PayloadAction<CachedAbility>) => {
			state.ability = {...state.ability, ...action.payload};
		},
		movesLoaded: (state, action: PayloadAction<CachedMove>) => {
			state.move = {...state.move, ...action.payload};
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
					// handle fetch error...
				}
			})
	}
});

export default pokemonDataSlice.reducer;
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
};

/* alternatively, createAsyncThunk takes a generic type of three params, returnType, paramType, thunkAPIType, e.g.
const getInitialData = createAsyncThunk<ReturnedInitialDataTypes, undefined, {state: RootState, dispatch: AppDispatch }> */
export const getInitialData = createAppAsyncThunk('pokeData/getInitialData', async(_, {dispatch, getState}): Promise<ReturnedInitialDataTypes> => {
	const dispalyData = getState().display;
	let generationData: CachedGeneration, typeData: CachedType, pokemonsNamesAndId: CachedAllPokemonNamesAndIds = {}, intersection: number[] = [];
	// get pokemon count, all names and ids
	const speciesResponse = await getEndpointData('pokemonSpecies');
	for (let pokemon of speciesResponse.results) {
		pokemonsNamesAndId[pokemon.name] = getIdFromURL(pokemon.url);
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
	return {pokemonCount: speciesResponse.count, pokemonsNamesAndId, intersection, generationData, typeData, fetchedPokemons: fetchedPokemons!, nextRequest, pokemonsToDisplay}
});

type ReturnedScrollDataTypes = {
	fetchedPokemons: CachedPokemon | undefined,
	nextRequest: null | number[],
	pokemonsToDisplay: number[]
};

type GetPokemonsOnScrollParams = {
	unresolvedData: Promise<CachedPokemon> | null;
};

export const getPokemonsOnScroll = createAppAsyncThunk('pokeData/getPokemonsOnScroll', async({unresolvedData}: GetPokemonsOnScrollParams, {dispatch ,getState}): Promise<ReturnedScrollDataTypes> => {
	const dispalyData = getState().display;
	const request = dispalyData.nextRequest?.length ? [...dispalyData.nextRequest] : null;
	const pokemonsToDisplay = request ? request.splice(0, 24) : [];
	const displayedPokemons = dispalyData.display;
	let fetchedPokemons: GetReturnedDataType<'pokemon', []> | undefined;
	
	if (unresolvedData) {
		dispatch(scrolling());
		fetchedPokemons = await unresolvedData;
	};
	return {fetchedPokemons, nextRequest: request, pokemonsToDisplay: [...displayedPokemons, ...pokemonsToDisplay]};
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
	requestPokemonIds: (number | string)[],
	requests: GetRequiredData.Request[],
	language?: LanguageOption
}

type GetRequiredDataThunkReturnedType = {
	fetchedData: GetRequiredData.FetchedData
};

export const getRequiredDataThunk = createAppAsyncThunk('pokeData/getRequiredData', async({requestPokemonIds, requests, language}: GetRequiredDataThunkParams, {dispatch, getState}): Promise<GetRequiredDataThunkReturnedType> => {
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