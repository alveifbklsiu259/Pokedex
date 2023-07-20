import { getIdFromURL, transformToKeyName, transformToDash } from "./util";
import { dataLoading, pokemonsLoaded, displayChanged, nextRequestChanged, scrolling, pokemonSpeciesLoaded, evolutionChainsLoaded } from "./features/pokemonData/pokemonDataSlice";

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
	const datas = dataResponses.map(response => response.json());
	const finalData = await Promise.all(datas);

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

// utility for getPokemons and getPokemonsOnScroll
const batchDispatch = async (dispatch, pokemonsToFetch, nextRequest, displayedPokemons, pokemonsToDisplay) => {
	let fetchedPokemons;
	// only make request when necessary
	if (pokemonsToFetch.length) {
		fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
	};
	if (fetchedPokemons) {
		dispatch(pokemonsLoaded({data: fetchedPokemons, nextRequest: nextRequest}));
	} else {
		dispatch(nextRequestChanged(nextRequest));
	};
	dispatch(displayChanged([...displayedPokemons, ...pokemonsToDisplay]));
};

export const getPokemons = async (dispatch, cachedPokemons, allPokemonNamesAndIds, request, sortOption, status) => {
	// preload data for weight/height sort options
	const preloadData = async pokemonsToFetch => {
		if (status !== 'loading') {
			dispatch(dataLoading());
		};
		const fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
		const allPokemons = {...cachedPokemons, ...fetchedPokemons};
		return [fetchedPokemons, allPokemons];
	};
	
	// sort request
	const sortPokemons = allPokemons => {
		const sortPokemonsByName = () => {
			let sortedNames;
			let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
			if (sort === 'asc') {
				sortedNames = Object.keys(allPokemonNamesAndIds).sort((a, b) => a.localeCompare(b));
			} else if(sort === 'desc') {
				sortedNames = Object.keys(allPokemonNamesAndIds).sort((a, b) => b.localeCompare(a));
			};
			const sortedPokemons = sortedNames.reduce((prev, cur) => {
				prev[cur] = allPokemonNamesAndIds[cur];
				return prev;
			}, {});
			return Object.values(sortedPokemons).filter(id => request.includes(id));
		};
	
		const sortPokemonsByWeightOrHeight = sortBy => {
			let sortedPokemons;
			let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
			if (sort === 'asc') {
				sortedPokemons = Object.values(allPokemons).sort((a, b) => a[sortBy] - b[sortBy]);
			} else if (sort === 'desc') {
				sortedPokemons = Object.values(allPokemons).sort((a, b) => b[sortBy] - a[sortBy]);
			};
			const sortedPokemonIds = sortedPokemons.map(pokemon => pokemon.id)
			return sortedPokemonIds.filter(id => request.includes(id));
		};
	
		switch(sortOption) {
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
				// 'numberAsc'
				return [...request].sort((a, b) => a - b);
			}
		};
	};

	let pokemonsToFetch, nextRequest, pokemonsToDisplay, fetchedPokemons, allPokemons

	// for weight / height sort options, fetch all pokemons for sorting
	if (sortOption.includes('weight') || sortOption.includes('height')) {
		pokemonsToFetch = getDataToFetch(cachedPokemons, request);
		if (pokemonsToFetch.length) {
			[fetchedPokemons, allPokemons] = await preloadData(pokemonsToFetch);
		} else {
			allPokemons = {...cachedPokemons};
		};
	};
	const sortedRequest = sortPokemons(allPokemons);
	pokemonsToDisplay = sortedRequest.splice(0, 24);
	nextRequest = sortedRequest.length ? sortedRequest : null;

	// get uncached pokemons for name / id sort options
	if (pokemonsToFetch === undefined) {
		pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
	};

	// for options other than heigh/weight
	if (pokemonsToFetch.length && fetchedPokemons === undefined) {
		if (status !== 'loading') {
			dispatch(dataLoading());
		};
	};
	await batchDispatch(dispatch, pokemonsToFetch, nextRequest, [], pokemonsToDisplay);
};

// request has already been sorted based on sort options
export const getPokemonsOnScroll = async (dispatch, request, cachedPokemons, displayedPokemons) => {
	dispatch(scrolling());
	const copiedRequest = [...request];
	const pokemonsToDisplay = copiedRequest.splice(0, 24);
	const nextRequest = copiedRequest.length ? copiedRequest : null;
	const pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
	await batchDispatch(dispatch, pokemonsToFetch, nextRequest, displayedPokemons, pokemonsToDisplay);
};

export const getChainData = async(chainUrl, cachedPokemons, fetchedPokemon) => {
	let chainData, pokemonsFromChain;
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

	// get pokemon data from the chain(s)
	const pokemonsInChain = new Set(chainData.sortedChains.flat());

	let currentCachedPokemons;
	if (fetchedPokemon) {
		currentCachedPokemons = {...cachedPokemons, ...{[fetchedPokemon.id]: fetchedPokemon}};
	} else {
		currentCachedPokemons = cachedPokemons;
	};
	const pokemonsToFetch = getDataToFetch(currentCachedPokemons, [...pokemonsInChain]);
	pokemonsFromChain = await getData('pokemon', pokemonsToFetch, 'id');

	return [chainData, pokemonsFromChain];
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

export const getAllSpecies = async state => {
	const dispatchType = pokemonSpeciesLoaded;
	let fetchedSpecies;
	const hasAllSpecies = Object.keys(state.pokemonSpecies).length === state.pokemonCount;
	if (!hasAllSpecies) {
		const range = [];
		for (let i = 1; i <= state.pokemonCount; i ++) {
			range.push(i);
		};
		const speciesDataToFetch = getDataToFetch(state.pokemonSpecies, range);
		fetchedSpecies = await getData('pokemon-species', speciesDataToFetch, 'id');
	};
	return [dispatchType, fetchedSpecies];
};

export const getRequiredData = async(state, dispatch, requestPokemonIds, requests, lang, callback) => {
	// lang is an optional parameter (used when language change);
	// callback is an optional function, it may be useful if we have other data to fetch/dispatch, the benefit is that no extra re-render.
	let callbackResult;
	const language = lang ? lang : state.language;
	const cachedData = {}, fetchedData = {};
	const getCachedData = (dataType, ids) => {
		// cachedData[dataType] may contain undefined element.
		return fetchedData[dataType] ? [...cachedData[dataType], ...Object.values(fetchedData[dataType])].filter(data => data) : cachedData[dataType]?.every(Boolean) ? [...cachedData[dataType]] : ids.map(id => state[dataType][id]);
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
	const chainData = randomSpecies ? state['evolutionChains'][getIdFromURL(randomSpecies.evolution_chain.url)] : undefined;

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
				cachedData[req] = requiredItems.map(item => state[req][transformToKeyName(item)]);
				break;
			}
			case 'abilities' : {
				const pokemonData = getCachedData('pokemons', requestPokemonIds);
				const abilitiesToDisplay = getAbilitiesToDisplay(pokemonData);
				cachedData[req] = abilitiesToDisplay ? abilitiesToDisplay.map(ability => state[req][ability]) : [undefined];
				break;
			};
			default :
				// stat, version, move_damage_class, the structure of their cached data doesn't really matter, only fetch them once when language change.
				cachedData[req] = Object.keys(state[transformToKeyName(req)]).length ? Object.values(state[transformToKeyName(req)]) : [undefined];
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
			dispatch(dataLoading());
			break;
		};
	};

	// fetchedData will be:
	// pokemons/pokemonSpecies/abilities: object/undefined
	// chain: an array of object, or undefined
	for (let req of sortedRequests) {
		if (cachedData[req].includes(undefined) && langCondition[req] !== language) {
			switch(req) {
				case 'pokemons' : {
					const pokemonsToFetch = getDataToFetch(state[req], requestPokemonIds);
					if (pokemonsToFetch.length) {
						const fetchedPokemons = await getData('pokemon', pokemonsToFetch, 'id');
						// also get formData (for Move.js)
						const formsToFetch = [];
						Object.values(fetchedPokemons).forEach(pokemon => {
							if (!pokemon.is_default) {
								formsToFetch.push(pokemon.forms[0].url);
							};
						});
						const formData = await getData('pokemon-form', formsToFetch, 'name');
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
					const dataToFetch = getDataToFetch(state[req], speciesIds);
					if (dataToFetch.length) {
						fetchedData[req] = await getData('pokemon-species', dataToFetch, 'id');
					};
					break;
				};
				case 'abilities' : {
					const pokemonData = getCachedData('pokemons', requestPokemonIds);
					fetchedData[req] = await getAbilities(pokemonData, state[req]);
					break;
				};
				case 'evolutionChains' : {
					const speciesData = getCachedSpeciesData();
					const chainToFetch = getDataToFetch(state[req], [getIdFromURL(speciesData[0].evolution_chain.url)]);
					if (chainToFetch.length) {
						const [{sortedChains: chains, evolutionDetails: details} ,fetchedPokemons] = await getChainData(chainToFetch[0], state.pokemons, cachedData['pokemons']);
						fetchedData[req] = [{[chainToFetch[0]]: {chains, details}}, fetchedPokemons];
					};
					break;
				};
				case 'items' : {
					const speciesData = getCachedSpeciesData();
					const chainData = state.evolutionChains[getIdFromURL(speciesData[0].evolution_chain.url)] || fetchedData['evolutionChains'][0][getIdFromURL(speciesData[0].evolution_chain.url)];
					const requiredItems = getItemsFromChain(chainData);
					const itemToFetch = getDataToFetch(state[req], requiredItems.map(item => transformToKeyName(item)));
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

	if (callback) {
		const [dispatchType, data] = await callback(state);
		if (data) {
			dispatch(dispatchType(data));
		};
		callbackResult = data;
	};

	// batch dispatches intentionally
	const dispatchType = {
		'pokemonSpecies': 'pokemonSpeciesLoaded',
		'abilities': 'abilityLoaded',
		'items': 'itemLoaded',
		'version': 'versionLoaded',
		'move-damage-class': 'moveDamageClassLoaded',
		'stat': 'statLoaded'
	};

	sortedRequests.forEach(req => {
		const data = fetchedData[req];
		if (data) {
			switch(req) {
				case 'pokemons' : {
					dispatch(pokemonsLoaded({data: data, nextRequest: 'unchanged'}));
					break;
				}
				case 'evolutionChains' : {
					const [chainData, fetchedPokemons] = data;
					dispatch(evolutionChainsLoaded(chainData));

					if (Object.keys(fetchedPokemons)) {
						dispatch(pokemonsLoaded({data: fetchedPokemons, nextRequest: 'unchanged'}));
					};
					break;
				}
				default : 
					if (dispatchType[req]) {
						dispatch({type: `pokeData/${dispatchType[req]}`, payload: data});
					};
			};
		};
	});

	return callbackResult;
};



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


