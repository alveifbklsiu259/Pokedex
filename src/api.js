// import { useEffect, useState } from "react";
// import { usePokemonData } from "./components/PokemonsProvider";

import { transformToKeyName } from "./util";

const BASE_URL = 'https://pokeapi.co/api/v2';

// export const getIndividualPokemon = async (pokemon, dispatch) => {
// 	//pass in id or name
// 	dispatch({type: 'dataLoading'});
// 	const response = await fetch(`${BASE_URL}/pokemon/${pokemon}`);
// 	const data = await response.json();
// 	dispatch({type: 'individualPokemonLoaded', payload: data});
// 	return data
// };

export const getIndividualtData = async (dataType, pokemon) => {
	const response = await fetch(`${BASE_URL}/${dataType}/${pokemon}`);
	const data = await response.json();
	return data;
};







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






/**
 * 
 * @param {Object} cachedPokemons - The pokemons in cached
 * @param {Array} pokemonsToDisplay 
 * @returns 
 */

export const getDataToFetch = (cachedData, dataToDisplay) => dataToDisplay.filter(data => !cachedData[data]);


/**
 * 
 * @param {*} pokemonsToFetch 
 * @param {*} dispatch 
 * @param {*} nextRequest 
 * @returns 
 */

export const getMultipleData = async (dataType, dataToFetch, resultKey) => {
	//pass in id or name
	const dataResponses = await Promise.all(dataToFetch.map(entry => fetch(`${BASE_URL}/${dataType}/${entry}`)));
	const datas = dataResponses.map(response => response.json());
	const finalData = await Promise.all(datas);
	const obj = {};
	for (let i of finalData) {
		obj[transformToKeyName(String(i[resultKey]))] = i
	};
	return obj;
};

// utility for getPokemons and getPokemonsOnScroll
const batchDispatch = async (dispatch, pokemonsToFetch, nextRequest, displayedPokemons, pokemonsToDisplay) => {
	let fetchedPokemons;
	// only make request when necessary
	if (pokemonsToFetch.length) {
		fetchedPokemons = await getMultipleData('pokemon', pokemonsToFetch, 'id');
	};
	if (fetchedPokemons) {
		dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: nextRequest}});
	} else {
		dispatch({type: 'nextRequestChanged', payload: nextRequest});
	};
	dispatch({type: 'displayChanged', payload: [...displayedPokemons, ...pokemonsToDisplay]});
};

export const getPokemons = async (dispatch, cachedPokemons, allPokemonNamesAndIds, request, sortOption, status) => {
	// preload data for weight/height sort options
	const preloadData = async pokemonsToFetch => {
		if (status !== 'loading') {
			dispatch({type:'dataLoading'});
		};
		const fetchedPokemons = await getMultipleData('pokemon', pokemonsToFetch, 'id');
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
			dispatch({type:'dataLoading'});
		};
	};
	batchDispatch(dispatch, pokemonsToFetch, nextRequest, [], pokemonsToDisplay)
};

// request has already been sorted based on sort options
export const getPokemonsOnScroll = async (dispatch, request, cachedPokemons, displayedPokemons) => {
	dispatch({type: 'scrolling'});
	const pokemonsToDisplay = request.splice(0, 24);
	const nextRequest = request.length ? request : null;
	const pokemonsToFetch = getDataToFetch(cachedPokemons, pokemonsToDisplay);
	batchDispatch(dispatch, pokemonsToFetch, nextRequest, displayedPokemons, pokemonsToDisplay)
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


