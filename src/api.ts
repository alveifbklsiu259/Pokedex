import { useCallback, useRef } from 'react';
import { useNavigateNoUpdates } from "./components/RouterUtils";
import { getIdFromURL, transformToKeyName, transformToDash, toEndPointString } from "./util";
import { getRequiredDataThunk, type GetRequiredData, type CachedAbility, type CachedPokemon, type CachedPokemonSpecies, type CachedAllPokemonNamesAndIds, type PokemonDataTypes} from "./features/pokemonData/pokemonDataSlice";
import { dataLoading, selectLanguage, type LanguageOption, type SortOption } from './features/display/displaySlice';
import type { AppDispatch, RootState } from './app/store';
import type { Pokemon, EndPointData, PokemonForm, GetStringOrNumberKey, EvolutionChain, EvolutionChainResponse, NonNullableArray } from '../typeModule';
import { useAppSelector, useAppDispatch } from './app/hooks';

const BASE_URL = 'https://pokeapi.co/api/v2';

export type EndPointRequest = keyof Omit<PokemonDataTypes, 'pokemonCount' | 'allPokemonNamesAndIds'> | 'pokemonForm';

export const getEndpointData = async (dataType: EndPointRequest) => {
	const response = await fetch(`${BASE_URL}/${toEndPointString(dataType)}?limit=99999`);
	const data: EndPointData.Root = await response.json();
	return data;
};

type CachedEntries = Pick<PokemonDataTypes, 'pokemon' | 'pokemonSpecies' | 'ability' | 'move' | 'machine' | 'evolutionChain' | 'item'>;
type CachedData = CachedEntries[keyof CachedEntries];

export const getDataToFetch = <T extends string | number>(cachedData: CachedData, dataToDisplay: T[]): T[] => dataToDisplay.filter(data => !cachedData[data]);

// CachedEvolutionChain and CachedEvolutionChain[number] is the modified version, not the original response from the API.
type PokemonDataResponseType = {
	[K in keyof PokemonDataTypes]: K extends 'evolutionChain' ? {[chainId: string | number]: EvolutionChainResponse.Root} : PokemonDataTypes[K]
};

type GetKeysOfUnion<T> = T extends any ? GetStringOrNumberKey<Required<T>> : never;
export type GetReturnedDataType<T extends EndPointRequest, K> = K extends (number | string)[] ? T extends keyof PokemonDataResponseType ? PokemonDataResponseType[T] : {[name: string]: PokemonForm.Root} : T extends keyof PokemonDataResponseType ? PokemonDataResponseType[T][number] : PokemonForm.Root;

export async function getData<T extends EndPointRequest, S extends number | string>(dataType: T, dataToFetch: S): Promise<GetReturnedDataType<T, S>>;
export async function getData<T extends EndPointRequest, S extends number | string, K extends GetStringOrNumberKey<Required<GetReturnedDataType<T, undefined>>>>(dataType: T, dataToFetch: S[], resultKey: K): Promise<GetReturnedDataType<T, S[]>>;
export async function getData<T extends EndPointRequest, S extends number | string, K extends GetStringOrNumberKey<Required<GetReturnedDataType<T, undefined>>>>(dataType: T, dataToFetch: S | S[], resultKey?: K): Promise<GetReturnedDataType<T, S>>;
export async function getData(dataType: EndPointRequest, dataToFetch: (number | string) | (number | string)[], resultKey?: GetKeysOfUnion<GetReturnedDataType<EndPointRequest, undefined>>): Promise<GetReturnedDataType<EndPointRequest, (number | string) | (number | string)[]>> {
	let request: (number | string)[] = [];
	if (Array.isArray(dataToFetch)) {
		request = dataToFetch.map(element => {
			if (typeof element === "string" && element.includes(BASE_URL)) {
				return getIdFromURL(element);
			} else {
				return element;
			};
		});
	} else {
		if (typeof dataToFetch === 'string' && dataToFetch.includes(BASE_URL)) {
			request = [getIdFromURL(dataToFetch)];
		} else {
			request = [dataToFetch];
		};
	};

	const dataResponses = await Promise.all(request.map(entry => fetch(`${BASE_URL}/${toEndPointString(dataType)}/${entry}`)));
	const finalData: Array<GetReturnedDataType<EndPointRequest, undefined>> = await Promise.all(dataResponses.map(response => response.json()));

	if (resultKey) {
		const returnedData: GetReturnedDataType<EndPointRequest, []> = {};
		if (Array.isArray(dataToFetch)) {
			for (let i of finalData) {
				const key = transformToKeyName(String(i[resultKey as keyof typeof i]));
				returnedData[key] = i;
			};
		} else {
			const data = finalData[0];
			const key = transformToKeyName(String(data[resultKey as keyof typeof data]));
			returnedData[key] = data;
		};
		return returnedData;
	} else {
		return finalData[0];
	};
	// reference: https://stackoverflow.com/questions/69783310/type-is-assignable-to-the-constraint-of-type-t-but-t-could-be-instantiated#:~:text=a%20type%20assertion-,to%20any,-(I%20could%20have
};

export function getAbilitiesToDisplay(pokemonData: Pokemon.Root | Pokemon.Root[]): string[] {
	const data = Array.isArray(pokemonData) ? pokemonData : [pokemonData];
	return [
		...Object.values(data).reduce<Set<string>>((pre, cur) => {
			cur.abilities.forEach(entry => pre.add(transformToKeyName(entry.ability.name)));
			return pre;
		}, new Set())
	];
};

export const getAbilities = async (pokemonData: Pokemon.Root | Pokemon.Root[], cachedAbilities: CachedAbility) => {
	const abilitiesToDisplay = getAbilitiesToDisplay(pokemonData);
	const abilitiesToFetch = getDataToFetch(cachedAbilities, abilitiesToDisplay).map(ability => transformToDash(ability));
	if (abilitiesToFetch.length) {
		return await getData('ability', abilitiesToFetch, 'name');
	};
};

type GetSortField<T extends SortOption> = T extends `${infer A}Asc` ? A : SortOption extends `${infer B}Desc` ? B : never;
type SortField = GetSortField<SortOption>;
type Stat = Exclude<SortField, "number" | "height" | "name" | "weight" >

const sortPokemons = (allPokemons: CachedPokemon, sortOption: SortOption, allPokemonNamesAndIds: CachedAllPokemonNamesAndIds, request: number[]) => {
	const sortPokemonsByName = () => {
		let sortedNames: string[];
		const sort = sortOption.includes('Asc') ? 'asc' : 'desc';
		if (sort === 'asc') {
			sortedNames = Object.keys(allPokemonNamesAndIds).sort((a, b) => a.localeCompare(b));
		} else {
			sortedNames = Object.keys(allPokemonNamesAndIds).sort((a, b) => b.localeCompare(a));
		};
		return sortedNames.map(name => allPokemonNamesAndIds[name])
			.filter(id => request.includes(id));
	};

	const sortPokemonsByWeightOrHeight = (sortBy: 'weight' | 'height') => {
		let sortedPokemons: Pokemon.Root[];
		const sort = sortOption.includes('Asc') ? 'asc' : 'desc';
		if (sort === 'asc') {
			sortedPokemons = Object.values(allPokemons).sort((a, b) => a[sortBy] - b[sortBy]);
		} else {
			sortedPokemons = Object.values(allPokemons).sort((a, b) => b[sortBy] - a[sortBy]);
		};
		return sortedPokemons.map(pokemon => pokemon.id)
			.filter(id => request.includes(id));
	};

	const sortPokemonsByStat = (stat: Stat) => {
		let sortedPokemons: Pokemon.Root[];
		const getBaseStat = (pokemon: Pokemon.Root) => {
			if (stat === 'total') {
				const total = pokemon.stats.reduce((pre, cur) => pre + cur.base_stat, 0);
				return total;
			} else {
				const statVal = pokemon.stats.find(entry => entry.stat.name === stat)!.base_stat;
				return statVal;
			};
		};
		const sort = sortOption.includes('Asc') ? 'asc' : 'desc';
		if (sort === 'asc') {
			sortedPokemons = Object.values(allPokemons).sort((a, b) => getBaseStat(a) - getBaseStat(b));
		} else {
			sortedPokemons = Object.values(allPokemons).sort((a, b) => getBaseStat(b) - getBaseStat(a));
		};
		return sortedPokemons.map(pokemon => pokemon.id)
			.filter(id => request.includes(id));
	};

	switch(sortOption) {
		case 'numberAsc' : {
			return [...request].sort((a, b) => a - b);
		}
		case 'numberDesc' : {
			return [...request].sort((a, b) => b - a);
		}
		case 'nameAsc' : 
		case 'nameDesc' : {
			return sortPokemonsByName();
		}
		case 'heightAsc' : 
		case 'heightDesc' : {
			return sortPokemonsByWeightOrHeight('height');
		}
		case 'weightAsc' :
		case 'weightDesc' : {
			return sortPokemonsByWeightOrHeight('weight');
		}
		default : {
			let stat: Stat;
			if (sortOption.includes('Asc')) {
				stat = sortOption.slice(0, sortOption.indexOf('Asc')) as Stat;
			} else {
				stat = sortOption.slice(0, sortOption.indexOf('Desc')) as Stat;
			};
			return sortPokemonsByStat(stat);
		};
	};
};

export const getPokemons = async (cachedPokemons: CachedPokemon, allPokemonNamesAndIds: CachedAllPokemonNamesAndIds, dispatch: AppDispatch, request: number[], sortOption: SortOption) => {
	// the dataLoading dispatches in this function will not cause extra re-render in getInitialData thunk.
	let sortedRequest: number[],
		pokemonsToFetch: ReturnType<typeof getDataToFetch>,
		fetchedPokemons: GetReturnedDataType<'pokemon', []> | undefined,
		pokemonsToDisplay: number[],
		nextRequest: number[] | null,
		allPokemons = {...cachedPokemons};
	const isSortByNameOrId = (sortOption.includes('number') || sortOption.includes('name'));
	// when sort by options other than number or name, it requires all the pokemon data in intersection to make some comparison.
	if (!isSortByNameOrId) {
		pokemonsToFetch = getDataToFetch(cachedPokemons, request);
		if (pokemonsToFetch.length) {
			dispatch(dataLoading());
			fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
			allPokemons = {...cachedPokemons, ...fetchedPokemons};
		};
	};

	sortedRequest = sortPokemons(allPokemons, sortOption, allPokemonNamesAndIds, request).slice();
	pokemonsToDisplay = sortedRequest.splice(0, 24);
	nextRequest = sortedRequest.length ? sortedRequest : null;

	if (isSortByNameOrId) {
		pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
		if (pokemonsToFetch.length) {
			dispatch(dataLoading());
			fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
		};
	};
	return {fetchedPokemons, pokemonsToDisplay, nextRequest};
};

const addFormData = async (cachedPokemons: CachedPokemon, fetchedPokemons: CachedPokemon) => {
	const formsToFetch: number[] = [];
	Object.values(cachedPokemons).forEach(pokemon => {
		if (!pokemon.is_default) {
			// some newly added pokemon in the API may lack forms data.
			if (pokemon.forms[0]?.url) {
				formsToFetch.push(getIdFromURL(pokemon.forms[0].url));
			}
		};
	});
	if (formsToFetch.length) {
		const formData = await getData('pokemonForm', formsToFetch, 'name');
		Object.values(formData).forEach(entry => {
			fetchedPokemons[getIdFromURL(entry.pokemon.url)].formData = entry;
		});
	};
	return fetchedPokemons;
};

const getChainData = async(chainId: number, cachedPokemons: CachedPokemon, cachedSpecies: CachedPokemonSpecies) => {
	const getEvolutionChains = async () => {
		const evolutionChainResponse = await getData('evolutionChain', chainId);

		// get chains, details
		let evolutionDetails: EvolutionChain.Root['details'] = {};
		let chainIds: {[depth: string]: number}[] = [];
		let index = 0;
		let depth = 1;
		chainIds[index] = {};
		const getIdsFromChain = (chains: EvolutionChainResponse.Chain) => {
			// get details
			if (chains.evolution_details.length) {
				evolutionDetails[getIdFromURL(chains.species.url)] = chains.evolution_details;
			};
			// get ids
			chainIds[index][`depth-${depth}`] = getIdFromURL(chains.species.url);
			if (chains.evolves_to.length) {
				depth ++;
				chains.evolves_to.forEach((chain, index, array) => {
					getIdsFromChain(chain);
					// the last chain of each depth
					if (index === array.length - 1) {
						depth --;
					};
				});
			} else {
				if (index !== 0) {
					const minDepth = Number(Object.keys(chainIds[index])[0].split('-')[1]);
					for (let i = 1; i < minDepth; i++) {
						// get pokemon ids from the prvious chain, since they share the same pokemon(s)
						chainIds[index][`depth-${i}`] = chainIds[index - 1][`depth-${i}`];
					};
				};
				index ++;
				chainIds[index] = {};
			};
		};
		getIdsFromChain(evolutionChainResponse.chain);
		chainIds.pop();
		// sort chains
		const sortedChains = chainIds.map(chain => {
			// sort based on depth
			const sortedKeys = Object.keys(chain).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
			const sortedChain = sortedKeys.reduce<typeof chain>((previousReturn, currentElement) => {
				previousReturn[currentElement] = chain[currentElement];
				return previousReturn;
			}, {});
			return Object.values(sortedChain);
		});
		return {sortedChains, evolutionDetails};
	};

	const chainData = await getEvolutionChains();

	type EmptyObj = Record<string, never>;

	let fetchedPokemons: GetReturnedDataType<'pokemon', []> | EmptyObj = {};
	let fetchedSpecies: GetReturnedDataType<'pokemonSpecies', []> | EmptyObj = {};
	
	// get all pokemons' pokemon/species data from the chain(s), including non-default-pokemon's pokemon data(for evolutionChain to correctly display chain of different form).
	const pokemonsInChain = new Set(chainData.sortedChains.flat());
	const speciesToFetch = getDataToFetch(cachedSpecies, [...pokemonsInChain]);
	if (speciesToFetch.length) {
		fetchedSpecies = await getData('pokemonSpecies', speciesToFetch, 'id');
	};
	const allFormIds: number[] = [];
	[...pokemonsInChain].forEach(pokemonId => {
		(cachedSpecies[pokemonId] || fetchedSpecies[pokemonId]).varieties.forEach(variety => {
			allFormIds.push(getIdFromURL(variety.pokemon.url));
		});
	});
	const pokemonsToFetch = getDataToFetch(cachedPokemons, allFormIds);

	if (pokemonsToFetch.length) {
		fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
		fetchedPokemons = await addFormData(fetchedPokemons, fetchedPokemons);
	}
	return [chainData, fetchedPokemons, fetchedSpecies] as const;
};

export const getItemsFromChain = (chainDetails: EvolutionChain.Root['details']) => {
	const requiredItems: string[] = [];
	Object.values(chainDetails).forEach(evolutionDetails=> {
		evolutionDetails.forEach(detail => {
			const item: undefined | string = detail['item']?.name || detail['held_item']?.name;
			if (item) {
				requiredItems.push(item);
			};
		})
	});
	return requiredItems;
};

export async function getAllSpecies(cachedSpecies: CachedPokemonSpecies, pokemonCount: number) {
	const range: number[] = [];
	for (let i = 1; i <= pokemonCount; i ++) {
		range.push(i);
	};
	const speciesDataToFetch = getDataToFetch(cachedSpecies, range);
	const fetchedSpecies = await getData('pokemonSpecies', speciesDataToFetch, 'id');
	return fetchedSpecies;
};

type Request = GetRequiredData.Request;
type FetchedData = GetRequiredData.FetchedData;

export const getRequiredData = async(pokeData: RootState['pokeData'], requestPokemonIds: (number | string)[], requests: Request[], language: LanguageOption, disaptch?: AppDispatch): Promise<FetchedData> => {
	const cachedData: {
		[K in Request]?: (PokemonDataTypes[K][number] | undefined)[]
	} = {};

	const fetchedData: FetchedData = {};
	const requestIds = requestPokemonIds.map(id => Number(id));

	const getCachedPokemonOrSpecies = <T extends 'pokemon' | 'pokemonSpecies'>(dataType: T): NonNullable<typeof cachedData[T]> => {
		const fetchedEntry = fetchedData[dataType];
		const ids = requestIds.map(id => {
			if (dataType === 'pokemonSpecies') {
				const pokemonData = getCachedPokemonOrSpecies('pokemon').find(entry => entry?.id === id);
				return pokeData[dataType][id] ? id : getIdFromURL(pokemonData?.species?.url) || id ;
			} else {
				return id;
			};
		});
		return ids.map(id => pokeData[dataType][id] || fetchedEntry?.[id]) as NonNullable<typeof cachedData[T]>;
	};

	const chacedPokemonData = getCachedPokemonOrSpecies('pokemon');
	const cachedSpeciesData = getCachedPokemonOrSpecies('pokemonSpecies');

	// In our use cases, when requesting evolutionChain/item, requestIds will only contain the ids of the pokemons who share the same evolution chain, so we can just randomly grab one species data and check the chain data.
	const randomSpecies = cachedSpeciesData.find(data => data);
	const chainData = randomSpecies ? pokeData['evolutionChain'][getIdFromURL(randomSpecies.evolution_chain.url)] : undefined;

	// some data relies on other data, so if one of the following data is present in the requests, they have to be fetched before other data. e.g. pokemon > pokemonSpecies > evolutionChain > others.
	const sortedRequests = requests.sort((a, b) => b.indexOf('p') - a.indexOf('p'));
	if (requests.includes('evolutionChain')) {
		const indexOfChain = requests.indexOf('evolutionChain');
		const indexOfInsertion = requests.findLastIndex(req => req.startsWith('p')) + 1;
		sortedRequests.splice(indexOfChain, 1);
		sortedRequests.splice(indexOfInsertion, 0, 'evolutionChain');
	};

	sortedRequests.forEach(req => {
		switch(req) {
			case 'pokemon': {
				cachedData[req] = chacedPokemonData;
				break;
			}
			case 'pokemonSpecies': {
				cachedData[req] = cachedSpeciesData;
				break;
			}
			case 'evolutionChain':
				cachedData[req] = [chainData];
				break;
			case 'item': {
				const requiredItems = chainData ? getItemsFromChain(chainData.details) : undefined;
				if (requiredItems) {
					cachedData[req] = requiredItems.map(item => pokeData[req][transformToKeyName(item)])
				} else {
					cachedData[req] = [undefined];
				}
				break;
			}
			case 'ability': 
				if (chacedPokemonData.includes(undefined)) {
					cachedData[req] = [undefined];
				} else {
					const abilitiesToDisplay = getAbilitiesToDisplay(chacedPokemonData as NonNullableArray<typeof chacedPokemonData>);
					cachedData[req] = abilitiesToDisplay.map(ability => pokeData[req][ability]);
				};
				break;
			default:
				// stat, version, moveDamageClass, the structure of their cached data doesn't really matter, only fetch them once when language change.
				const cachedEntry = pokeData[req];
				cachedData[req] = Object.keys(cachedEntry).length ? Object.values(cachedEntry) : [undefined];
		};
	});

	// some data is only required when language is not 'en';
	type LanguageCondition= {
		[K in Request]?: K extends 'pokemon' | 'pokemonSpecies' | 'evolutionChain' ? null : 'en'
	}

	const langCondition = sortedRequests.reduce<LanguageCondition>((pre, cur) => {
		switch (cur) {
			case 'version' :
			case 'stat' :
			case 'moveDamageClass' :
			case 'item' :
			case 'ability' : 
				pre[cur] = 'en';
				break;
			default : 
				pre[cur] = null;
		};
		return pre;
	}, {});

	const isFetchNeeded = (req: Request) => cachedData[req]!.includes(undefined) && langCondition[req] !== language;

	for (let req of sortedRequests) {
		if (isFetchNeeded(req)) {
			if (disaptch) {
				disaptch(dataLoading());
			};
			break;
		};
	};

	for (let req of sortedRequests) {
		if (isFetchNeeded(req)) {
			switch(req) {
				// at the end of each case, we can be sure that all requestIds will have the relevant data.
				case 'pokemon': {
					const pokemonsToFetch = getDataToFetch(pokeData[req], requestIds);
					if (pokemonsToFetch.length) {
						let fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
						// also get formData
						fetchedPokemons = await addFormData(fetchedPokemons, fetchedPokemons);
						fetchedData[req] = fetchedPokemons;
					};
					break;
				};
				case 'pokemonSpecies': {
					const pokemonData = getCachedPokemonOrSpecies('pokemon');
					const speciesIds = Object.values(pokemonData as NonNullableArray<typeof pokemonData>).map(data => getIdFromURL(data.species.url));
					
					const dataToFetch = getDataToFetch(pokeData[req], speciesIds);
					if (dataToFetch.length) {
						fetchedData[req] = await getData(req, dataToFetch, 'id');
					};
					break;
				};
				case 'ability': {
					const pokemonData = getCachedPokemonOrSpecies('pokemon');
					fetchedData[req] = await getAbilities(pokemonData as NonNullableArray<typeof pokemonData>, pokeData[req]);
					break;
				};
				case 'evolutionChain' : {
					const speciesData = getCachedPokemonOrSpecies('pokemonSpecies');
					const chainToFetch = getDataToFetch(pokeData[req], [getIdFromURL((speciesData as NonNullableArray<typeof speciesData>)[0].evolution_chain.url)]);
					if (chainToFetch.length) {
						const cachedPokemons = {...pokeData.pokemon, ...fetchedData['pokemon']};
						const cachedSpecies = {...pokeData.pokemonSpecies, ...fetchedData['pokemonSpecies']};

						const [{sortedChains: chains, evolutionDetails: details}, fetchedPokemons, fetchedSpecies] = await getChainData(chainToFetch[0], cachedPokemons, cachedSpecies);

						fetchedData[req] = {
							chainData: {[chainToFetch[0]]: {chains, details}},
							fetchedPokemons,
							fetchedSpecies
						};
					};
					break;
				};
				case 'item': {
					const speciesData = getCachedPokemonOrSpecies('pokemonSpecies');
					const chainData = pokeData.evolutionChain[getIdFromURL((speciesData as NonNullableArray<typeof speciesData>)[0].evolution_chain.url)] || fetchedData['evolutionChain']!.chainData[getIdFromURL((speciesData as NonNullableArray<typeof speciesData>)[0].evolution_chain.url)];
					const requiredItems = getItemsFromChain(chainData.details);
					const itemToFetch = getDataToFetch(pokeData[req], requiredItems.map(item => transformToKeyName(item)));
					if (itemToFetch.length) {
						fetchedData[req] = await getData('item', requiredItems, 'name');
					};
					break;
				};
				default: {
					// stat, version, moveDamageClass
					const dataResponse = await getEndpointData(req);
					const dataToFetch = dataResponse.results.map(data => data.url);
					fetchedData[req] = await getData(req, dataToFetch, 'name') as any;
				};
			};
		};
	};
	return fetchedData;
};

type PrefetchOnNavigation = ((requestPokemonIds: number[], requests: Request[], lang?: LanguageOption) => void);
type NavigationUnresolvedDataRef = React.MutableRefObject<Promise<GetRequiredData.FetchedData> | null>;
type PrefetchOnScroll = ((pokemonsToFetch: number[])=> void);
type ScrollUnresolvedDataRef = React.MutableRefObject<Promise<CachedPokemon> | null>;

export function usePrefetch<T extends 'scroll' | 'navigation'>(action: T): T extends 'navigation' ? [NavigationUnresolvedDataRef, PrefetchOnNavigation] : [ScrollUnresolvedDataRef, PrefetchOnScroll];
export function usePrefetch(action: 'scroll' | 'navigation'): [NavigationUnresolvedDataRef, PrefetchOnNavigation] | [ScrollUnresolvedDataRef, PrefetchOnScroll] {
	const unresolvedDataRef = useRef<Promise<GetRequiredData.FetchedData> | Promise<CachedPokemon> | null>(null);
	const pokeData = useAppSelector(state => state.pokeData);
	const language = useAppSelector(selectLanguage);
	// let prefetch: PrefetchOnScroll | PrefetchOnNavigation;
	let prefetch: typeof action extends 'scroll' ? PrefetchOnScroll : PrefetchOnNavigation;

	if (action === 'navigation') {
		prefetch = (requestPokemonIds, requests, lang = language) => {
			unresolvedDataRef.current = getRequiredData(pokeData, requestPokemonIds, requests, lang);
		};
	} else {
		prefetch = (pokemonsToFetch) => {
			unresolvedDataRef.current = getData('pokemon', pokemonsToFetch, 'id');
		};
	};
	return [unresolvedDataRef, prefetch];
};

export function useNavigateToPokemon() {
	const navigateNoUpdates = useNavigateNoUpdates();
	const dispatch = useAppDispatch();
	
	const navigateToPokemon = useCallback(async (requestPokemonIds: number[], requests: Request[], lang?: LanguageOption, unresolvedData?: Promise<GetRequiredData.FetchedData>) => {
		if (unresolvedData) {
			dispatch(dataLoading());
			const fetchedData = await unresolvedData;
			dispatch(getRequiredDataThunk.fulfilled({fetchedData}, 'pokeData/getRequiredData', {requestPokemonIds: [], requests: []}));
		} else {
			dispatch(getRequiredDataThunk({requestPokemonIds, requests, language: lang}));
		};
		navigateNoUpdates(`/pokemons/${requestPokemonIds[0]}`);
	}, [dispatch, navigateNoUpdates]);

	return navigateToPokemon;
};