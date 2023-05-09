const BASE_URL = 'https://pokeapi.co/api/v2';

export const getIndividualPokemon = async (pokemon, dispatch) => {
    //pass in id or name
    dispatch({type: 'dataLoading'});
    const response = await fetch(`${BASE_URL}/pokemon/${pokemon}`);
    const data = await response.json();
    dispatch({type: 'individualPokemonLoaded', payload: data});
    return data
};

export const getMultiplePokemons = async (pokemons, dispatch, nextRequest) => {
    //pass in id or name
    dispatch({type: 'dataLoading'});
    const dataResponses = await Promise.all(pokemons.map(pokemon => fetch(`${BASE_URL}/pokemon/${pokemon}`)));
    const datas = dataResponses.map(response => response.json());
    const finalData = await Promise.all(datas);
    const obj = {};
    for (let i of finalData) {
        obj[i.id] = i
    };
    dispatch({type: 'pokemonsLoaded', payload: {data: obj, nextRequest: nextRequest}})
    return finalData;
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
