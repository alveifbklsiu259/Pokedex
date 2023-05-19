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











// const getPokemonNumberPerGen = async (num) => {
//     const response = await fetch(`${BASE_URL}generation/${num}`);
//     const data = await response.json();
//     return data.pokemon_species.length
// }

// const a = getPokemonNumberPerGen(1)
// console.log(a)


// export const fetchPokemons = async gen => {
//     const response = await fetch(BASE_URL + `pokemon`)
// }
