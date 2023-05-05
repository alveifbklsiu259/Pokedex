// instead of passing down pokemon, pass id or name and check caching
import { useEffect } from "react";
import { usePokemonData } from "./PokemonsProvider";
import Spinner from "./Spinner";

export default function BasicInfo({pokemon}) {
	const { dispatch, state } = usePokemonData();
	let pokemonData = pokemon;
	useEffect(() => {
		const getIndividualPokemon = async () => {
			if (typeof pokemon === 'string') {
				dispatch({type: 'dataLoading'});
				const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);
				const data = await response.json();
				pokemonData = data;
				dispatch({type: 'individualPokemonLoaded', payload: data})
			}
		}
		getIndividualPokemon();
	}, [pokemon, dispatch]);

	let content;
	if (typeof pokemonData === 'string') {
		content = <Spinner />
	} else {
		content =  (
			<>
				<div className="d-flex flex-column align-items-center text-center p-0 h-100 justify-content-between">
				<img className="poke-img mx-auto p-0" src={pokemonData.sprites.other['official-artwork'].front_default} alt={pokemonData.name} />
				<span className="id p-0">#{String(pokemonData.id).padStart(4 ,'0')}</span>
				<h1 className="p-0 text-capitalize">{pokemonData.name}</h1>
				<div className="types row justify-content-center">
					{pokemonData.types.map(type => <span key={type.type.name} className={`type-${type.type.name} type col-5 m-1`}>{type.type.name}</span>)}
				</div>	
				</div>
				
			</>
		)
	}

	return (
		<>
			{content}
		</>
	)
}