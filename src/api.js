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

export const getMultiplePokemons = async (pokemonsToFetch) => {
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

export const getPokemons = async (dispatch, state, request, sortOption, isScroll) => {
    dispatch({type:'dataLoading'});
    let nextRequest, pokemonsToDisplay, fetchedPokemons;

    // sort request
    const sortPokemons = async () => {
        const sortPokemonsByName = () => {
            let sortedNames;
            let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
            if (sort === 'asc') {
                sortedNames = Object.keys(state.allPokemonNamesAndId).sort((a, b) => a.localeCompare(b));
            } else if(sort === 'desc') {
                sortedNames = Object.keys(state.allPokemonNamesAndId).sort((a, b) => b.localeCompare(a));
            };
            const sortedPokemons = sortedNames.reduce((prev, cur) => {
                prev[cur] = state.allPokemonNamesAndId[cur];
                return prev;
            }, {});
            return Object.values(sortedPokemons).filter(id => request.includes(id));
        };

        const sortPokemonsByWeightOrHeight = async (sortBy) => {
            const pokemonsToFetch = getPokemonsToFetch(state.pokemons, request);
            const fetchedPokemons = await getMultiplePokemons(pokemonsToFetch, dispatch, null);
            const allPokemons = {...state.pokemons, ...fetchedPokemons};
            let sortedPokemons;
            let sort = sortOption.includes('Asc') ? 'asc' : 'desc';
            if (sort === 'asc') {
                sortedPokemons = Object.values(allPokemons).sort((a, b) => a[sortBy] - b[sortBy]);
            } else if (sort === 'desc') {
                sortedPokemons = Object.values(allPokemons).sort((a, b) => b[sortBy] - a[sortBy]);
            };
            return sortedPokemons.map(pokemon => pokemon.id).filter(id => request.includes(id));
        }

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
                return sortPokemonsByWeightOrHeight('height')
            }
            case 'heightDesc' : {
                return sortPokemonsByWeightOrHeight('height')
            }
            case 'weightAsc' : {
                return sortPokemonsByWeightOrHeight('weight')
            }
            case 'weightDesc' : {
                return sortPokemonsByWeightOrHeight('weight')
            }
            default : {
                // 'numberAsc'
                return [...request].sort((a, b) => a - b)
            }
        }
    };
    const sortedRequest = await sortPokemons(request, sortOption)
    pokemonsToDisplay = sortedRequest.splice(0, 24);
    nextRequest = sortedRequest;
    if (nextRequest.length === 0) {
        nextRequest = null
    };

    //get not cached pokemons
    const pokemonsToFetch = getPokemonsToFetch(state.pokemons, pokemonsToDisplay);
    if (pokemonsToFetch.length) {
        fetchedPokemons = await getMultiplePokemons(pokemonsToFetch, undefined);
        dispatch({type: 'pokemonsLoaded', payload: {data: fetchedPokemons, nextRequest: nextRequest}});
    } else {
        dispatch({type: 'nextRequestChanged', payload: nextRequest});
    };

    if (isScroll === true) {
        dispatch({type: 'displayChanged', payload: [...state.display, ...pokemonsToDisplay]});
    } else {
        dispatch({type: 'displayChanged', payload: pokemonsToDisplay});
    }
};

// custom async hooks