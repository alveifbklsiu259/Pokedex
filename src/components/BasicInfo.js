// instead of passing down pokemon, pass id or name and check caching
import { useEffect } from "react";
import { usePokemonData } from "./PokemonsProvider";
import Spinner from "./Spinner";

export default function BasicInfo({pokemon}) {
	const { dispatch, state } = usePokemonData();
	let pokemonData = pokemon;
	useEffect(() => {
		// console.log(typeof pokemon)
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
	if (state.status === 'loading') {
		content =  <Spinner />
	} else if (state.status === 'idle' && state.pokemons[pokemonData?.id]) {
		content =  (
			<>
				<img className="poke-img mx-auto p-0" src={pokemonData.sprites.other['official-artwork'].front_default} alt={pokemonData.name} />
				<div className="p-0 row text-center">
					<span className="id p-0">#{String(pokemonData.id).padStart(4 ,'0')}</span>
					<h1 className="p-0 text-capitalize">{pokemonData.name}</h1>
					<div className="types">
						{pokemonData.types.map(type => <span key={type.type.name} className={`type-${type.type.name}`}>{type.type.name}</span>)}
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