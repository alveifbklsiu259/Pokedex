import { useEffect, useState } from "react";
import { usePokemonData } from "./components/PokemonsProvider";

const BASE_URL = 'https://pokeapi.co/api/v2';

export const getIndividualPokemon = async (pokemon, dispatch) => {
	//pass in id or name
	dispatch({type: 'dataLoading'});
	const response = await fetch(`${BASE_URL}/pokemon/${pokemon}`);
	const data = await response.json();
	dispatch({type: 'individualPokemonLoaded', payload: data});
	return data
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

export const getPokemonsToFetch = (cachedPokemons, pokemonsToDisplay) => {
	const cachedPokemonIds = Object.values(cachedPokemons).map(pokemon => pokemon.id);
	return pokemonsToDisplay.filter(pokemon => !cachedPokemonIds.includes(pokemon));
};

/**
 * 
 * @param {*} pokemonsToFetch 
 * @param {*} dispatch 
 * @param {*} nextRequest 
 * @returns 
 */

export const getMultiplePokemons = async pokemonsToFetch => {
	//pass in id or name
	const dataResponses = await Promise.all(pokemonsToFetch.map(pokemon => fetch(`${BASE_URL}/pokemon/${pokemon}`)));
	const datas = dataResponses.map(response => response.json());
	const finalData = await Promise.all(datas);
	const obj = {};
	for (let i of finalData) {
		obj[i.id] = i
	};
	return obj;
};


export const getPokemons = async (dispatch, state, request, sortOption) => {
	// preload data for weight/height sort options
	const preloadDataForSort = async pokemonsToFetch => {
		dispatch({type:'dataLoading'});
		const fetchedPokemons = await getMultiplePokemons(pokemonsToFetch);
		const allPokemons = {...state.pokemons, ...fetchedPokemons};
		return [fetchedPokemons, allPokemons];
	};
	
	// sort request
	const sortPokemons = allPokemons => {
		const sortPokemonsByName = () => {
			let sortedNames;
			let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
			if (sort === 'asc') {
				sortedNames = Object.keys(state.allPokemonNamesAndIds).sort((a, b) => a.localeCompare(b));
			} else if(sort === 'desc') {
				sortedNames = Object.keys(state.allPokemonNamesAndIds).sort((a, b) => b.localeCompare(a));
			};
			const sortedPokemons = sortedNames.reduce((prev, cur) => {
				prev[cur] = state.allPokemonNamesAndIds[cur];
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
			case 'nameAsc' : {
				return sortPokemonsByName();
			}
			case 'nameDesc' : {
				return sortPokemonsByName();
			}
			case 'heightAsc' : {
				return sortPokemonsByWeightOrHeight('height');
			}
			case 'heightDesc' : {
				return sortPokemonsByWeightOrHeight('height');
			}
			case 'weightAsc' : {
				return sortPokemonsByWeightOrHeight('weight');
			}
			case 'weightDesc' : {
				return sortPokemonsByWeightOrHeight('weight');
			}
			default : {
				// 'numberAsc'
				return [...request].sort((a, b) => a - b);
			}
		};
	};

	let pokemonsToFetch, nextRequest, pokemonsToDisplay, fetchedPokemons, allPokemons;

	// for weight / height sort options
	if (sortOption.includes('weight') || sortOption.includes('height')) {
		pokemonsToFetch = getPokemonsToFetch(state.pokemons, request);
		if (pokemonsToFetch.length) {
			[fetchedPokemons, allPokemons] = await preloadDataForSort(pokemonsToFetch);
		} else {
			allPokemons = {...state.pokemons};
		};
	};
	const sortedRequest = sortPokemons(allPokemons);
	pokemonsToDisplay = sortedRequest.splice(0, 24);
	nextRequest = sortedRequest.length ? sortedRequest : null;

	//get uncached pokemons for name / id sort options
	if (pokemonsToFetch === undefined) {
		pokemonsToFetch = getPokemonsToFetch(state.pokemons, pokemonsToDisplay);
	};
	
	// only make request when necessary
	if (pokemonsToFetch.length && fetchedPokemons === undefined) {
		dispatch({type:'dataLoading'});
		fetchedPokemons = await getMultiplePokemons(pokemonsToFetch);
	};

	// for all sort options, if there's any fetched pokemons
	if (fetchedPokemons !== undefined) {
		dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: nextRequest}});
	} else {
		dispatch({type: 'nextRequestChanged', payload: nextRequest})
	};
	dispatch({type: 'displayChanged', payload: pokemonsToDisplay});
};

// request has already been sorted based on sort options
export const getPokemonsOnScroll = async (dispatch, request, cachedPokemons, displayedPokemons) => {
	dispatch({type: 'scrolling'});
	let fetchedPokemons;
	const pokemonsToDisplay = request.splice(0, 24);
	const nextRequest = request.length ? request : null;
	const pokemonsToFetch = getPokemonsToFetch(cachedPokemons, pokemonsToDisplay);
	if (pokemonsToFetch.length) {
		fetchedPokemons = await getMultiplePokemons(pokemonsToFetch);
		dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: nextRequest}});
	} else {
		dispatch({type: 'nextRequestChanged', payload: nextRequest});
	}
	dispatch({type: 'displayChanged', payload: [...displayedPokemons, ...pokemonsToDisplay]});
	// if all pokemons are cached, these dispatches will be batched, which means there will no scrolling status anymore
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


