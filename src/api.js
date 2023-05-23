import { getIdFromURL } from "./util";

const BASE_URL = 'https://pokeapi.co/api/v2';

export const getIndividualPokemon = async (pokemon, dispatch) => {
    //pass in id or name
    dispatch({type: 'dataLoading'});
    const response = await fetch(`${BASE_URL}/pokemon/${pokemon}`);
    const data = await response.json();
    dispatch({type: 'individualPokemonLoaded', payload: data});
    return data
};

/**
 * 
 * @param {Object} cachedPokemons - The pokemons in cached
 * @param {Array} pokemonsToDisplay 
 * @returns 
 */

export const getPokemonsToFetch = (cachedPokemons, pokemonsToDisplay) => {
    const flattenedCachedPokemons = Object.values(cachedPokemons).map(pokemon => pokemon.id);
    return pokemonsToDisplay.filter(pokemon => !flattenedCachedPokemons.includes(pokemon));
};

/**
 * 
 * @param {*} pokemonsToFetch 
 * @param {*} dispatch 
 * @param {*} nextRequest 
 * @returns 
 */

export const getMultiplePokemons = async (pokemonsToFetch, dispatch, nextRequest) => {
    //pass in id or name
    if (dispatch) {
        dispatch({type: 'dataLoading'});
    }
    const dataResponses = await Promise.all(pokemonsToFetch.map(pokemon => fetch(`${BASE_URL}/pokemon/${pokemon}`)));
    const datas = dataResponses.map(response => response.json());
    const finalData = await Promise.all(datas);
    const obj = {};
    for (let i of finalData) {
        obj[i.id] = i
    };
    if (dispatch) {
        dispatch({type: 'pokemonsLoaded', payload: {data: obj, nextRequest: nextRequest}})
    }
    return obj;
};

export const getPokemons = async (dispatch, state, request, sortOption, isScroll) => {
    dispatch({type:'dataLoading'});
    let nextRequest, pokemonsToDisplay, fetchedPokemons;
    //get next request
    if (typeof request === 'string') { // if nextRequest is url
        const response = await fetch(request);
        const data = await response.json();
        if (sortOption === 'numberAsc') {
            nextRequest = data.next;
            if (nextRequest !== null && nextRequest.includes('pokemon-species')) {
                nextRequest.replace('pokemon-species', 'pokemon');
            };
            const offset = Number(nextRequest.slice(nextRequest.indexOf('=') + 1, nextRequest.indexOf('&')));
            if (offset >= state.pokemonCount) {
                nextRequest = null;
            } else if ( offset < state.pokemonCount && offset + 24 > state.pokemonCount) {
                nextRequest = nextRequest.replace('limit=24', `limit=${state.pokemonCount - offset}`)
            };
        } else if (sortOption === 'numberDesc') {
            nextRequest = data.previous?.replace('pokemon-species', 'pokemon') || null;
        };
        pokemonsToDisplay = data.results.map(pokemon => getIdFromURL(pokemon.url));
    } else if (request instanceof Array) {
        pokemonsToDisplay = request.splice(0, 24);
        console.log(pokemonsToDisplay)

        nextRequest = request;
        if (nextRequest.length === 0) {
            nextRequest = null
        }
    }

    //get not cached pokemons
    const pokemonsToFetch = getPokemonsToFetch(state.pokemons, pokemonsToDisplay);
    if (pokemonsToFetch.length) {
        fetchedPokemons = await getMultiplePokemons(pokemonsToFetch, undefined);
        dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: nextRequest}});
    } else {
        dispatch({type: 'nextRequestChanged', payload: nextRequest});
    };

    if (isScroll === true) {
        // console.log(pokemonsToDisplay)
        dispatch({type: 'displayChanged', payload: [...state.display, ...pokemonsToDisplay]});
    } else {
        dispatch({type: 'displayChanged', payload: pokemonsToDisplay});
    }

};

// custom async hooks