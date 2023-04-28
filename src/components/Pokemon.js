
import BasicInfo from "./BasicInfo"
import Detail from "./Detail"
import Stats from "./Stats"
import EvolutionChain from "./EvolutionChain"

import { usePokemonData } from "./PokemonsProvider"
import { Link, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import Spinner from "./Spinner";

export default function Pokemon() {
    const {dispatch, state} = usePokemonData();
    const { pokeId } = useParams();
    const pokemon = state.pokemons[pokeId - 1]
    const speciesInfo = state?.pokemon_species?.[pokeId] || {}
    // const evolutionChainURL = speciesInfo.evolution_chain || '';
    // const evolutionChain = evolutionChainURL?.slice(evolutionChainURL?.indexOf('/', 40) + 1,
    // evolutionChainURL.length - 1);
    // console.log(evolutionChain)



    
    const [data3, setData3] = useState({})
    useEffect(()=>{
        const getInfo = async () => {
            dispatch({type:'dataLoading'});
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeId}`);
            const data = await response.json();
            dispatch({type:"pokemonSpeciesLoaded", payload: {id: data.id, data}})
        };
        getInfo()
    }, [dispatch])


    let content;

    if (pokemon && Object.keys(speciesInfo).length > 0 ) {
        content = (
            <div className="container p-0">
                <div className="row justify-content-center">
                    <div className='basic-info row col-12 col-sm-6 justify-content-center'>
                        <BasicInfo pokemon={pokemon}/>
                    </div>
                    <Detail pokemon={pokemon} speciesInfo={speciesInfo}/>
                    <Stats pokemon={pokemon}/>

                    {/* evolution */}
                    { <EvolutionChain/>}
                    
                    

                    {/* Button */}
                    <div className="row justify-content-center">
                        <Link to='/' className="w-50 m-3 btn btn-block btn-secondary">Explore More Pokemons</Link>
                    </div>
                </div>

            </div>
        )
    } else {
        content = <Spinner />
    }



    return (
        <>
            {content}
        </>
    )
}