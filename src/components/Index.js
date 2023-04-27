import {useEffect} from 'react'
import Search from "./Search"
import Pokemons from "./Pokemons"
import { usePokemonData } from './PokemonsProvider'
import Spinner from './Spinner'

export default function Index() {
    const {dispatch, state} = usePokemonData()
    useEffect(()=> {
        const getPokemons = async () => {
            dispatch({type:'dataLoading'})
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/?limit=151`);
            const data = await response.json();
            const pokemonsResponses = await Promise.all(data.results.map(result => fetch(result.url)));
            const pokemonsPromises = pokemonsResponses.map(pokemonsResponse => pokemonsResponse.json());
            const finalData = await Promise.all(pokemonsPromises);
            dispatch({type: 'pokemonsLoaded', payload: finalData})
        };
        getPokemons()
    }, [dispatch])
    
    let content;
    if (state.status === 'loading' || state.pokemons.length < 1) {
        content = <Spinner />
    } else if (state.status === 'idle' || state.pokemons.length > 0) {
        content = <Pokemons />
    } else if (state.status === 'error') {
        content = <p>Something went wrong...</p>
    }

    return (
        <div className="container">
            <Search />
            {content}
        </div>
    )
}