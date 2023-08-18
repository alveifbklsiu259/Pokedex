import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigateNoUpdates } from "./components/RouterUtils";
import { getIdFromURL, transformToKeyName, transformToDash } from "./util";
import { getRequiredDataThunk} from "./features/pokemonData/pokemonDataSlice";
import { dataLoading, selectLanguage } from './features/display/displaySlice';


const BASE_URL = 'https://pokeapi.co/api/v2';

// export const getIndividualPokemon = async (pokemon, dispatch) => {
// 	//pass in id or name
// 	dispatch({type: 'dataLoading'});
// 	const response = await fetch(`${BASE_URL}/pokemon/${pokemon}`);
// 	const data = await response.json();
// 	dispatch({type: 'individualPokemonLoaded', payload: data});
// 	return data
// };




// export const useIndividualPokemon = (pokemon) => {
// 	const [pokemonData, setPokemonData] = useState({});
// 	const {dispatch} = usePokemonData();

// 	useEffect(() => {
// 		let ignore = false;
		
// 		const getIndividualPokemon = async () => {
// 			//pass in id or name
// 			dispatch({type: 'dataLoading'});
// 			const response = await fetch(`${BASE_URL}/pokemon/${pokemon}`);
// 			const data = await response.json();
// 			if (!ignore) {
// 				dispatch({type: 'individualPokemonLoaded', payload: data});
// 			} else {
// 				// logic to revert this code : dispatch({type: 'dataLoading'});
// 			}
// 			setPokemonData(data);
// 			getIndividualPokemon();
// 		};
// 		return () => {
// 			ignore = true
// 		};
// 	}, [pokemon, dispatch]);

// 	return pokemonData
// }



export const getEndpointData = async dataType => {
	const response = await fetch(`${BASE_URL}/${dataType}?limit=99999`);
	const data = await response.json();
	return data;
};

export const getDataToFetch = (cachedData, dataToDisplay) => dataToDisplay.filter(data => !cachedData[data]);

// resultKey is only required when fetch multiple data
// dataToFetch can be string/number (as making single request), or array(multiple request)
export const getData = async (dataType, dataToFetch, resultKey) => {
	let request;
	if (dataToFetch instanceof Array) {
		request = dataToFetch;
		request = request.map(element => {
			if (typeof element === "string" && element.includes(BASE_URL)) {
				return getIdFromURL(element);
			} else {
				return element;
			};
		});
	} else {
		// when request is url;
		if (dataToFetch?.includes?.(BASE_URL)) {
			request = [getIdFromURL(dataToFetch)];
		} else {
			request = [dataToFetch];
		};
	};

	const dataResponses = await Promise.all(request.map(entry => fetch(`${BASE_URL}/${dataType}/${entry}`)));
	const finalData = await Promise.all(dataResponses.map(response => response.json()));

	if (dataToFetch instanceof Array) {
		const obj = {};
		for (let i of finalData) {
			obj[transformToKeyName(String(i[resultKey]))] = i
		};
		return obj;
	} else {
		if (resultKey) {
			return {[transformToKeyName(finalData[0][resultKey])] : finalData[0]};
		} else {
			return finalData[0];
		}
	};
};

export const getAbilitiesToDisplay = pokemonData => {
	let data = pokemonData instanceof Array ? pokemonData : [pokemonData]
	if (data.includes(undefined)) {
		return undefined;
	} else {
		return [
			...Object.values(data).reduce((pre, cur) => {
				cur.abilities.forEach(entry => pre.add(transformToKeyName(entry.ability.name)));
				return pre;
			}, new Set())
		];
	};
};

export const getAbilities = async (pokemonData, cachedAbilities) => {
	const abilitiesToDisplay = getAbilitiesToDisplay(pokemonData);
	const abilitiesToFetch = getDataToFetch(cachedAbilities, abilitiesToDisplay).map(ability => transformToDash(ability));
	if (abilitiesToFetch.length) {
		return await getData('ability', abilitiesToFetch, 'name');
	};
};

export const sortPokemons = (allPokemons, sortOption, allPokemonNamesAndIds, request) => {
	const sortPokemonsByName = () => {
		let sortedNames;
		let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
		if (sort === 'asc') {
			sortedNames = Object.keys(allPokemonNamesAndIds).sort((a, b) => a.localeCompare(b));
		} else if(sort === 'desc') {
			sortedNames = Object.keys(allPokemonNamesAndIds).sort((a, b) => b.localeCompare(a));
		};
		return sortedNames.map(name => allPokemonNamesAndIds[name])
			.filter(id => request.includes(id));
	};

	const sortPokemonsByWeightOrHeight = sortBy => {
		let sortedPokemons;
		let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
		if (sort === 'asc') {
			sortedPokemons = Object.values(allPokemons).sort((a, b) => a[sortBy] - b[sortBy]);
		} else if (sort === 'desc') {
			sortedPokemons = Object.values(allPokemons).sort((a, b) => b[sortBy] - a[sortBy]);
		};
		return sortedPokemons.map(pokemon => pokemon.id)
			.filter(id => request.includes(id));
	};

	const sortPokemonsByStat = stat => {
		let sortedPokemons;
		const getBaseStat = pokemon => {
			if (stat.includes('total')) {
				return pokemon.stats.reduce((pre, cur) => pre + cur.base_stat, 0);
			} else {
				return pokemon.stats.find(entry => entry.stat.name === stat).base_stat;
			};
		};
		let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
		if (sort === 'asc') {
			sortedPokemons = Object.values(allPokemons).sort((a, b) => getBaseStat(a) - getBaseStat(b));
		} else if (sort === 'desc') {
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
			let stat;
			if (sortOption.includes('Asc')) {
				stat = sortOption.slice(0, sortOption.indexOf('Asc'));
			} else {
				stat = sortOption.slice(0, sortOption.indexOf('Desc'));
			};
			return sortPokemonsByStat(stat);
		};
	};
};

export const getPokemons = async (cachedPokemons, allPokemonNamesAndIds, dispatch, request, sortOption) => {
	// the dataLoading dispatches in this function will not cause extra re-render in getInitialData thunk.(I think it's because of Immer and we update the status in a mutational way.)
	let sortedRequest, pokemonsToFetch, fetchedPokemons, pokemonsToDisplay, nextRequest, allPokemons;
	
	if (!(sortOption.includes('number') || sortOption.includes('name'))) {
		pokemonsToFetch = getDataToFetch(cachedPokemons, request);
		if (pokemonsToFetch.length) {
			dispatch(dataLoading());
			fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
			allPokemons = {...cachedPokemons, ...fetchedPokemons};
		} else {
			allPokemons = {...cachedPokemons};
		};
	};

	sortedRequest = sortPokemons(allPokemons, sortOption, allPokemonNamesAndIds, request).slice();
	pokemonsToDisplay = sortedRequest.splice(0, 24);
	nextRequest = sortedRequest.length ? sortedRequest : null;

	// when sortBy is neither weight nor height.
	if (!pokemonsToFetch) {
		pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
		if (pokemonsToFetch.length) {
			dispatch(dataLoading());
			fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
		};
	};
	return {fetchedPokemons, pokemonsToDisplay, nextRequest}
};

export const getFormData = async pokemons => {
	const formsToFetch = [];
	Object.values(pokemons).forEach(pokemon => {
		if (!pokemon.is_default) {
			formsToFetch.push(pokemon.forms[0].url);
		};
	});
	const formData = await getData('pokemon-form', formsToFetch, 'name');
	return formData
};

export const getChainData = async(chainUrl, cachedPokemons, cachedSpecies) => {
	let chainData, pokemonsToFetch, fetchedPokemons, fetchedSpecies = {};
	const getEvolutionChains = async () => {
		const evolutionChainResponse = await getData('evolution-chain', chainUrl)

		// get chains, details
		let evolutionDetails = {};
		let chainIds = [];
		let index = 0;
		let depth = 1;
		chainIds[index] = {};
		const getIdsFromChain = chains => {
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
					// the last chain in each depth
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
			const sortedKeys = Object.keys(chain).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
			const sortedChain = sortedKeys.reduce((previousReturn, currentElement) => {
				previousReturn[currentElement] = chain[currentElement];
				return previousReturn;
			}, {});
			return Object.values(sortedChain);
		});
		return {sortedChains, evolutionDetails};
	};
	chainData = await getEvolutionChains();

	// get all pokemons' pokemon/species data from the chain(s), including non-default-pokemon's pokemon data.(this is for evolutionChain to correctly display chain of different form)
	const pokemonsInChain = new Set(chainData.sortedChains.flat());
	if (pokemonsInChain.size > 1) {
		const speciesToFetch = getDataToFetch(cachedSpecies, [...pokemonsInChain]);
		fetchedSpecies = await getData('pokemon-species', speciesToFetch, 'id');
		
		let allFormIds = [];
		[...pokemonsInChain].forEach(pokemonId => {
			(cachedSpecies[pokemonId] || fetchedSpecies[pokemonId]).varieties.forEach(variety => {
				allFormIds.push(getIdFromURL(variety.pokemon.url));
			});
		});
		pokemonsToFetch = getDataToFetch(cachedPokemons, allFormIds);
		fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
		const formData = await getFormData(fetchedPokemons);
		Object.values(formData).forEach(entry => {
			fetchedPokemons[getIdFromURL(entry.pokemon.url)].formData = entry;
		});
	} else {
		pokemonsToFetch = getDataToFetch(cachedPokemons, [...pokemonsInChain]);
		fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
	};

	return [chainData, fetchedPokemons, fetchedSpecies];
};

export const getItemsFromChain = chainData => {
	if (!chainData) {
		return undefined
	} else {
		const requiredItems = [];
		Object.values(chainData.details).forEach(pokemon => {
			let selectedDetail = pokemon.find(detail => detail.trigger.name === 'use-item') || pokemon[0];
			const item = selectedDetail['item']?.name || selectedDetail['held_item']?.name;
			if (item) {
				requiredItems.push(item);
			};
		});
		return requiredItems;
	}
};

export const getAllSpecies = async (cachedSpecies, pokemonCount) => {
	const range = [];
	for (let i = 1; i <= pokemonCount; i ++) {
		range.push(i);
	};
	const speciesDataToFetch = getDataToFetch(cachedSpecies, range);
	const fetchedSpecies = await getData('pokemon-species', speciesDataToFetch, 'id');
	return fetchedSpecies;
};

export const getRequiredData = async(pokeData, disaptch, requestPokemonIds, requests, language) => {
	const cachedData = {}, fetchedData = {};
	const getCachedData = (dataType, ids) => {
		// cachedData[dataType] may contain undefined element.
		return fetchedData[dataType] ? [...cachedData[dataType], ...Object.values(fetchedData[dataType])].filter(data => data) : cachedData[dataType]?.every(Boolean) ? [...cachedData[dataType]] : ids.map(id => pokeData[dataType][id]);
	};

	const getCachedSpeciesData = () => {
		const pokemonData = getCachedData('pokemons', requestPokemonIds);
		const speciesIds = Object.values(pokemonData).map(data => getIdFromURL(data?.species?.url));
		const speciesData =  getCachedData('pokemonSpecies', speciesIds);
		return speciesData;
	};
	const initialSpeciesData = getCachedSpeciesData();

	// in our use cases, all requestPokemons will have the same evolution chain, so we can just randomly grab one.
	const randomSpecies = initialSpeciesData.find(data => data);
	const chainData = randomSpecies ? pokeData['evolutionChains'][getIdFromURL(randomSpecies.evolution_chain.url)] : undefined;

	// some data relies on other data, so if one of the following data is present in the requests, they have to be fetched before other data.
	// pokemons, pokemonSpecies, evolutionChains
	const sortedRequests = requests.sort((a, b) => b.indexOf('p') - a.indexOf('p'));
	if (requests.includes('evolutionChains')) {
		const indexOfChain = requests.indexOf('evolutionChains');
		const indexOfInsertion = requests.findLastIndex(req => req.startsWith('p')) + 1;
		sortedRequests.splice(indexOfChain, 1);
		sortedRequests.splice(indexOfInsertion, 0, 'evolutionChains');
	};

	// each entry in cachedData is an array of object/undefined
	sortedRequests.forEach(req => {
		switch(req) {
			case 'pokemons' : {
				cachedData[req] = getCachedData('pokemons', requestPokemonIds);
				break;
			}
			case 'pokemonSpecies' : {
				cachedData[req] = initialSpeciesData;
				break;
			}
			case 'evolutionChains' : 
				cachedData[req] = [chainData];
				break;
			case 'items' : {
				const requiredItems = !chainData ? [undefined] : getItemsFromChain(chainData);
				cachedData[req] = requiredItems.map(item => pokeData[req][transformToKeyName(item)]);
				break;
			}
			case 'abilities' : {
				const pokemonData = getCachedData('pokemons', requestPokemonIds);
				const abilitiesToDisplay = getAbilitiesToDisplay(pokemonData);
				cachedData[req] = abilitiesToDisplay ? abilitiesToDisplay.map(ability => pokeData[req][ability]) : [undefined];
				break;
			};
			default :
				// stat, version, move_damage_class, the structure of their cached data doesn't really matter, only fetch them once when language change.
				cachedData[req] = Object.keys(pokeData[transformToKeyName(req)]).length ? Object.values(pokeData[transformToKeyName(req)]) : [undefined];
		};
	});
	// some data is only required when language is not 'en';
	const langCondition = sortedRequests.reduce((pre, cur) => {
		switch (cur) {
			case 'version' :
			case 'stat' :
			case 'move-damage-class' :
			case 'items' :
			case 'abilities' : 
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
	// pokemons/pokemonSpecies/abilities: object/undefined
	// evolutionChains: an object or undefined.
	for (let req of sortedRequests) {
		// does each await call waits before the previous one's done?
		// can we remove await expression and at the end do a Promise.all(fetchedData)?
		if (cachedData[req].includes(undefined) && langCondition[req] !== language) {
			switch(req) {
				case 'pokemons' : {
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
					const pokemonData = getCachedData('pokemons', requestPokemonIds);
					const speciesIds = Object.values(pokemonData).map(data => getIdFromURL(data.species.url));
					const dataToFetch = getDataToFetch(pokeData[req], speciesIds);
					if (dataToFetch.length) {
						fetchedData[req] = await getData('pokemon-species', dataToFetch, 'id');
					};
					break;
				};
				case 'abilities' : {
					const pokemonData = getCachedData('pokemons', requestPokemonIds);
					fetchedData[req] = await getAbilities(pokemonData, pokeData[req]);
					break;
				};
				case 'evolutionChains' : {
					const speciesData = getCachedSpeciesData();
					const chainToFetch = getDataToFetch(pokeData[req], [getIdFromURL(speciesData[0].evolution_chain.url)]);
					if (chainToFetch.length) {
						const cachedPokemons = {...pokeData.pokemons, ...fetchedData['pokemons']};
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
				case 'items' : {
					const speciesData = getCachedSpeciesData();
					const chainData = pokeData.evolutionChains[getIdFromURL(speciesData[0].evolution_chain.url)] || fetchedData['evolutionChains'].chainData[getIdFromURL(speciesData[0].evolution_chain.url)];
					const requiredItems = getItemsFromChain(chainData);
					const itemToFetch = getDataToFetch(pokeData[req], requiredItems.map(item => transformToKeyName(item)));
					if (itemToFetch.length) {
						fetchedData[req] = await getData('item', requiredItems, 'name');
					};
					break;
				};
				default : {
					// stat, version, move_damage_class
					const dataResponse = await getEndpointData(req);
					const dataToFetch = dataResponse.results.map(data => data.url);
					fetchedData[req] = await getData(req, dataToFetch, 'name');
				};
			};
		};
	};

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
	const unresolvedDataRef = useRef(null);
	const pokeData = useSelector(state => state.pokeData);
	const language = useSelector(selectLanguage);

	const prefetch = (requestPokemonIds, requests, lang = language) => {
		unresolvedDataRef.current = getRequiredData(pokeData, undefined, requestPokemonIds, requests, lang);
	};

	return [unresolvedDataRef, prefetch];
};

export function useNavigateToPokemon() {
	const navigateNoUpdates = useNavigateNoUpdates();
	const dispatch = useDispatch();
	
	const navigateToPokemon = useCallback(async (requestPokemonIds, requests, lang, unresolvedData) => {
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


