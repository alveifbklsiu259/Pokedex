import { useCallback, useRef } from 'react';
import { useNavigateNoUpdates } from "./components/RouterUtils";
import { getIdFromURL, transformToKeyName, transformToDash, toEndPointString } from "./util";
import { getRequiredDataThunk, type GetRequiredData, type CachedAbility, type CachedPokemon, type CachedPokemonSpecies, type CachedStat, type CachedMoveDamageClass, type CachedVersion, type CachedItem, type CachedAllPokemonNamesAndIds, getPokemonsOnScroll, PokemonDataTypes, CachedEvolutionChain} from "./features/pokemonData/pokemonDataSlice";
import { dataLoading, selectLanguage, type LanguageOption, type SortOption } from './features/display/displaySlice';
import type { AppDispatch, RootState } from './app/store';

/* maybe these two are not necessay? may have defined types in slice files
e.g
let a: CachedPokemon[keyof CachedPokemon]; */
import type { Pokemon, PokemonSpecies, EndPointData, PokemonForm, GetStringOrNumberKey, EvolutionChain, EvolutionChainResponse } from '../typeModule';
import { useAppSelector, useAppDispatch } from './app/hooks';

const BASE_URL = 'https://pokeapi.co/api/v2';

export type EndPointRequest = keyof Omit<PokemonDataTypes, 'pokemonCount' | 'allPokemonNamesAndIds'> | 'pokemonForm';

export const getEndpointData = async (dataType: EndPointRequest) => {
	const response = await fetch(`${BASE_URL}/${toEndPointString(dataType)}?limit=99999`);
	const data: EndPointData.Root = await response.json();
	return data;
};

type CachedEntries = Pick<PokemonDataTypes, 'pokemon' | 'pokemonSpecies' | 'ability' | 'move' | 'machine' | 'evolutionChain' | 'item'>;
type CachedEntry = CachedEntries[keyof CachedEntries];

export const getDataToFetch = <T extends string | number>(cachedData: CachedEntry, dataToDisplay: T[]) => dataToDisplay.filter(data => !cachedData[data]);


// CachedEvolutionChain and CachedEvolutionChain[number] is the modified version, not the original response from the API.
type PokemonDataResponseType = {
	[K in keyof PokemonDataTypes]: K extends 'evolutionChain' ? {[chainId: string | number]: EvolutionChainResponse.Root} : PokemonDataTypes[K]
};

type GetReturnedDataType<T extends EndPointRequest, K> = K extends (number | string)[] ? T extends keyof PokemonDataResponseType ? PokemonDataResponseType[T] : {[name: string]: PokemonForm.Root} : T extends keyof PokemonDataResponseType ? PokemonDataResponseType[T][number] : PokemonForm.Root;

// can we simplify the function, let it only take string or string[]
export async function getData<T extends EndPointRequest, K extends number | string>(dataType: T, dataToFetch: K): Promise<GetReturnedDataType<T, K>>;
export async function getData<T extends EndPointRequest, K extends number | string>(dataType: T, dataToFetch: K[], resultKey: GetStringOrNumberKey<GetReturnedDataType<T, undefined>>): Promise<GetReturnedDataType<T, K[]>>;
export async function getData<T extends EndPointRequest, K extends number | string>(dataType: T, dataToFetch: K | K[], resultKey?: GetStringOrNumberKey<GetReturnedDataType<T, undefined>>): Promise<GetReturnedDataType<T, K>> {
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
	const finalData: Array<GetReturnedDataType<T, undefined>> = await Promise.all(dataResponses.map(response => response.json()));

	if (resultKey) {
		const returnedData: GetReturnedDataType<EndPointRequest, []> = {};
		if (Array.isArray(dataToFetch)) {
			for (let i of finalData) {
				const key = transformToKeyName(String(i[resultKey]));
				returnedData[key] = i
			};
		} else {
			const key = transformToKeyName(String(finalData[0][resultKey]));
			returnedData[key] = finalData[0]
		}
		return returnedData as any
	} else {
		return finalData[0] as any
	};
	// reference: https://stackoverflow.com/questions/69783310/type-is-assignable-to-the-constraint-of-type-t-but-t-could-be-instantiated#:~:text=a%20type%20assertion-,to%20any,-(I%20could%20have
};

async function test () {
	// type A<T> = ReturnType<typeof getData>
	// let a: GetReturnedDataType<'pokemonForm', 1>

	// let fetchedData: Awaited<ReturnType<typeof getData>>;

	// infer ReturnType


	const fetchedData = await getData('evolutionChain', [1,2,3,4], 'id');

}

export function getAbilitiesToDisplay(pokemonData: Pokemon.Root | Pokemon.Root[]): string[] {
	const data = Array.isArray(pokemonData) ? pokemonData : [pokemonData];
	return [
		...Object.values(data as Pokemon.Root[]).reduce<Set<string>>((pre, cur) => {
			cur.abilities.forEach(entry => pre.add(transformToKeyName(entry.ability.name)));
			return pre;
		}, new Set())
	];
};

export const getAbilities = async (pokemonData: Parameters<typeof getAbilitiesToDisplay>['0'], cachedAbilities: CachedAbility) => {
	const abilitiesToDisplay = getAbilitiesToDisplay(pokemonData);
	const abilitiesToFetch = getDataToFetch(cachedAbilities, abilitiesToDisplay).map(ability => transformToDash(ability));
	if (abilitiesToFetch.length) {
		return await getData('ability', abilitiesToFetch, 'name');
	};
};

export type GetSortField<T extends SortOption> = T extends `${infer A}Asc` ? A : SortOption extends `${infer B}Desc` ? B : never;
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
		fetchedPokemons: GetReturnedDataType<'pokemon', typeof request> | undefined,
		pokemonsToDisplay: number[],
		nextRequest: number[] | null,
		allPokemons = {...cachedPokemons};
	const isSortByNameOrId = (sortOption.includes('number') || sortOption.includes('name'))
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

	// when sortBy number or name.
	if (isSortByNameOrId) {
		pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
		if (pokemonsToFetch.length) {
			dispatch(dataLoading());
			fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
		};
	};
	return {fetchedPokemons, pokemonsToDisplay, nextRequest}
};

const getFormData = async (cachedPokemons: CachedPokemon) => {
	const formsToFetch: number[] = [];

	Object.values(cachedPokemons).forEach(pokemon => {
		if (!pokemon.is_default) {
			formsToFetch.push(getIdFromURL(pokemon.forms[0].url));
		};
	});
	const formData = await getData('pokemonForm', formsToFetch, 'name');
	return formData
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

	// get all pokemons' pokemon/species data from the chain(s), including non-default-pokemon's pokemon data.(this is for evolutionChain to correctly display chain of different form)
	const pokemonsInChain = new Set(chainData.sortedChains.flat());

	const speciesToFetch = getDataToFetch(cachedSpecies, [...pokemonsInChain]);

	//toEndPointString
	const fetchedSpecies = await getData('pokemonSpecies', speciesToFetch, 'id');
	
	let allFormIds: number[] = [];
	[...pokemonsInChain].forEach(pokemonId => {
		(cachedSpecies[pokemonId] || fetchedSpecies[pokemonId]).varieties.forEach(variety => {
			allFormIds.push(getIdFromURL(variety.pokemon.url));
		});
	});
	const pokemonsToFetch = getDataToFetch(cachedPokemons, allFormIds);

	const fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
	const formData = await getFormData(fetchedPokemons);
	Object.values(formData).forEach(entry => {
		fetchedPokemons[getIdFromURL(entry.pokemon.url)].formData = entry;
	});

	return [chainData, fetchedPokemons, fetchedSpecies];
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

export const getRequiredData = async(pokeData: RootState['pokeData'], requestPokemonIds: (number| string)[], requests: Request[], language: LanguageOption, disaptch: AppDispatch | undefined) => {
	
	const cachedData: {
		[K in Request]?: (PokemonDataTypes[K][number] | undefined)[]
	} = {};

	// I think I can't really know what data will be return ahead of time based on "requests", because cached ones will not be return.
	const fetchedData: {
		[K in Request]?: K extends 'evolutionChain' ? {
			chainData: CachedEvolutionChain,
			fetchedPokemons: CachedPokemon,
			fetchedSpecies: CachedPokemonSpecies,
		} : PokemonDataTypes[K]
	} = {};

	// even no data in fetchedPokemon/species in chainData, I still return an empty object, maybe change it to not returing anything?


	// getCachedData:
	// pokemons: cachedPokemon[id] * all
	// species: default ids --> cachedSpecies[id] * can't assure they all share the same species(changeVIewmode)
	// evolutionChain: default id --> species --> evolutionChain[chainId]
	// ability: all ids --> abilities[ability]
	// items: chainId --> itesm[item]
	// moveDamageClass / stat / version

	function getCachedData(dataType: 'pokemon', ids: (string | number)[]): (Pokemon.Root | undefined)[];
	function getCachedData(dataType: 'pokemonSpecies', ids: (string | number)[]): (PokemonSpecies.Root | undefined)[];
	function getCachedData(dataType: 'pokemon' | 'pokemonSpecies', ids: (string | number)[]): (Pokemon.Root | PokemonSpecies.Root | undefined)[] {
		const fetchedEntry = fetchedData[dataType]
		return fetchedEntry ? [...cachedData[dataType] as [], ...Object.values(fetchedEntry)].filter(data => data) : cachedData[dataType]?.every(Boolean) ? [...<[]>cachedData[dataType]] : ids.map(id => pokeData[dataType][id]);
	};

	// the species data will all be the same
	const getCachedSpeciesData = (): (PokemonSpecies.Root | undefined)[] => {
		const pokemonData = getCachedData('pokemon', requestPokemonIds);
		
		const speciesIds = pokemonData.reduce((pre: number[], cur) => {
			const speciesId = getIdFromURL(cur?.species?.url);
			if (!pre.includes(speciesId)) {
				pre.push(speciesId);
			};
			return pre;
		}, [])
		const speciesData =  getCachedData('pokemonSpecies', speciesIds) as PokemonSpecies.Root[];
		return speciesData;
	};
	const initialSpeciesData = getCachedSpeciesData();

	// in our use cases, all requestPokemons will have the same evolution chain, so we can just randomly grab one.
	const randomSpecies = initialSpeciesData.find(data => data);
	const chainData = randomSpecies ? pokeData['evolutionChain'][getIdFromURL(randomSpecies.evolution_chain.url)] : undefined;

	// some data relies on other data, so if one of the following data is present in the requests, they have to be fetched before other data.
	// pokemon, pokemonSpecies, evolutionChain
	const sortedRequests = requests.sort((a, b) => b.indexOf('p') - a.indexOf('p'));
	if (requests.includes('evolutionChain')) {
		const indexOfChain = requests.indexOf('evolutionChain');
		const indexOfInsertion = requests.findLastIndex(req => req.startsWith('p')) + 1;
		sortedRequests.splice(indexOfChain, 1);
		sortedRequests.splice(indexOfInsertion, 0, 'evolutionChain');
	};

	// each entry in cachedData is an array of object/undefined
	sortedRequests.forEach(req => {
		switch(req) {
			case 'pokemon' : {
				cachedData[req] = getCachedData('pokemon', requestPokemonIds);
				break;
			}
			case 'pokemonSpecies' : {
				cachedData[req] = initialSpeciesData;
				break;
			}
			case 'evolutionChain' : 
				cachedData[req] = [chainData];
				break;
			case 'item' : {
				const requiredItems = !chainData ? [undefined] : getItemsFromChain(chainData.details);
				cachedData[req] = requiredItems.map(item => pokeData[req][transformToKeyName(item)]);
				break;
			}
			case 'ability' : {
				const pokemonData = getCachedData('pokemon', requestPokemonIds);
				if (pokemonData.includes(undefined)) {
					cachedData[req] = [undefined];
				} else {
					const abilitiesToDisplay = getAbilitiesToDisplay(pokemonData);
					cachedData[req] = abilitiesToDisplay.map(ability => pokeData[req][ability]);
				};
				break;
			};
			default :
				// stat, version, moveDamageClass, the structure of their cached data doesn't really matter, only fetch them once when language change.
				cachedData[req] = Object.keys(pokeData[transformToKeyName(req)]).length ? Object.values(pokeData[transformToKeyName(req)]) : [undefined];
		};
	});


	console.log(cachedData)
	console.log(requests)
	// some data is only required when language is not 'en';
	const langCondition = sortedRequests.reduce((pre, cur) => {
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

	for (let req of sortedRequests) {
		if (cachedData[req].includes(undefined) && langCondition[req] !== language) {
			if (disaptch) {
				disaptch(dataLoading());
			};
			break;
		};
	};
	// check the last one.. and return {}
	
	// for (let req of sortedRequests) {
	// 	if (cachedData[req].includes(undefined) && langCondition[req] !== language) {
	// 		disaptch(dataLoading());
	// 		break;
	// 	};
	// };

	// fetchedData will be:
	// pokemon/pokemonSpecies/ability: object/undefined
	// evolutionChain: an object or undefined.
	for (let req of sortedRequests) {
		// does each await call waits before the previous one's done?
		// can we remove await expression and at the end do a Promise.all(fetchedData)?
		if (cachedData[req].includes(undefined) && langCondition[req] !== language) {
			switch(req) {
				case 'pokemon' : {
					const pokemonsToFetch = getDataToFetch(pokeData[req], requestPokemonIds);
					if (pokemonsToFetch.length) {
						const fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
						// also get formData
						const formData = await getFormData(fetchedPokemons);
						
						
						// we can't know chain by now


						
						// changeLanguage
						
						Object.values(formData).forEach(entry => {
							fetchedPokemons[getIdFromURL(entry.pokemon.url)].formData = entry;
						});
						fetchedData[req] = fetchedPokemons;
					};
					break;
				};
				case 'pokemonSpecies' : {
					const pokemonData = getCachedData('pokemon', requestPokemonIds);
					const speciesIds = Object.values(pokemonData).map(data => getIdFromURL(data.species.url));
					const dataToFetch = getDataToFetch(pokeData[req], speciesIds);
					if (dataToFetch.length) {
						fetchedData[req] = await getData(req, dataToFetch, 'id');
					};
					break;
				};
				case 'ability' : {
					const pokemonData = getCachedData('pokemon', requestPokemonIds);
					fetchedData[req] = await getAbilities(pokemonData, pokeData[req]);
					break;
				};
				case 'evolutionChain' : {
					const speciesData = getCachedSpeciesData();
					const chainToFetch = getDataToFetch(pokeData[req], [getIdFromURL(speciesData[0].evolution_chain.url)]);
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
				case 'item' : {
					const speciesData = getCachedSpeciesData();
					const chainData = pokeData.evolutionChain[getIdFromURL(speciesData[0].evolution_chain.url)] || fetchedData['evolutionChain'].chainData[getIdFromURL(speciesData[0].evolution_chain.url)];
					// is it possible that by this time chainData is undefined?
					// if so, go back to modify getItemsFromChain's paramater type
					const requiredItems = getItemsFromChain(chainData.details);
					const itemToFetch = getDataToFetch(pokeData[req], requiredItems.map(item => transformToKeyName(item)));
					if (itemToFetch.length) {
						fetchedData[req] = await getData('item', requiredItems, 'name');
					};
					break;
				};
				default : {
					// stat, version, moveDamageClass
					const dataResponse = await getEndpointData(req);
					const dataToFetch = dataResponse.results.map(data => data.url);
					fetchedData[req] = await getData(req, dataToFetch, 'name');
				};
			};
		};
	};
	console.log(fetchedData)
	return fetchedData;
};


// or maybe prefetch when in sight?
// export const prefetchOnHover = () => {
	
// 	// prefetch
// 	const fetchedData = getRequiredData(pokeData, dispatch, requestPokemonIds, requests, lang);


// 	//navigate
// 	const data = await fetchedData
// 	navigateNoUpdates(`/pokemons/${requestPokemonIds[0]}`);
// 	dispatch(getRequiredDataThunk.fulfilled({fetchedData: data}));

// 	// or we could pass a promise down to getRequiredDataThunk and if this promise is passed, we don't make request
// }

export function usePrefetchOnNavigation() {
	const unresolvedDataRef = useRef<ReturnType<typeof getRequiredData> | null>(null);
	const pokeData = useAppSelector(state => state.pokeData);
	const language = useAppSelector(selectLanguage);

	const prefetch = (requestPokemonIds: number[], requests: Requests[], lang: LanguageOption = language) => {
		unresolvedDataRef.current = getRequiredData(pokeData, requestPokemonIds, requests, lang);
	};

	return [unresolvedDataRef, prefetch];
};

export function useNavigateToPokemon() {
	const navigateNoUpdates = useNavigateNoUpdates();
	const dispatch = useAppDispatch();
	
	const navigateToPokemon = useCallback(async (requestPokemonIds: number[], requests: Requests[], lang?: LanguageOption, unresolvedData?: ReturnType<typeof getRequiredData>) => {
		if (unresolvedData) {
			dispatch(dataLoading());
			const fetchedData = await unresolvedData;
			dispatch(getRequiredDataThunk.fulfilled({fetchedData}));
		} else {
			dispatch(getRequiredDataThunk({requestPokemonIds, requests, lang}));
		};
		navigateNoUpdates(`/pokemons/${requestPokemonIds[0]}`);
	}, [dispatch, navigateNoUpdates]);

	return navigateToPokemon;
};


// can I combine prefetch and navigate to one hook?

// downsides:
// always loading --> idle even though data is cached (but it's fast)
// the liink will alway re-render the first click


// problem:

// separate sort and fetch(search)
// since we only fetch the first 24 pokemons, it makes sence to sort the request first, the implementation for search should be:
// 1. determine the range (intersection), this would be the request
// 2. sort the request based on sort option
// 3. check pokemons needed to fetch (change status based on whether we have to get the weight/height info or not, sould be 2 or 3)
// 4. fetch pokemons
// dispatch display change / pokemons loaded
// 5. the subsequent pokemons should be fetched through scroll events, which wold use next request as request

// since we don't want the status to change, results in the Pokemons to re-render(which the content to display will be either Spinner or the pokemon list, and this will remove all children component when status change), we should not make any fetch request when changing sorting option, this sould only applies when we're showing all the pokemons and no next request.
//----
//when we're showing all the pokemons and there's no next request, when changing sort option, we should not make any fetch requset and should not change status
// 1. when nextRequest === null
// 2. when dispaly === state.intersection
// 3. when pokemonsToFetch is []
// ----
// otherwise the change of sort option would probably reqire new request to some pokemons we haven't cached
// the implementation of sort would be:
// 1. determine the range (intersection), this would be the request
// 2. sort the request based on sort option
// 3-1. check pokemons needed to fetch if there's still next request (note: next request arr + display arr = intersection arr)
// 3-2. if no next request, no fetch, if there is, fetch pokemons
// 4. the subsequent pokemons should be fetched through scroll events, which wold use next request as request


