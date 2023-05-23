// instead of passing down pokemon, pass id or name and check caching
import { useEffect } from "react";
import { usePokemonData } from "./PokemonsProvider";
import Spinner from "./Spinner";
import { getIndividualPokemon } from "../api";

export default function BasicInfo({pokemon}) {
	const { dispatch} = usePokemonData();

	useEffect(() => {
		const prepareDate = async() => {
			if (typeof pokemon === 'string') {
				const data = await getIndividualPokemon(pokemon, dispatch);
				pokemon = data;
			}
		};
		prepareDate()
	}, [pokemon, getIndividualPokemon]);

	let content;
	if (typeof pokemon === 'string') {
		content = <Spinner />
	} else {
		content =  (
			<>
				<div className="d-flex flex-column align-items-center text-center p-0 h-100 justify-content-between">
				<img className="poke-img mx-auto p-0" src={pokemon.sprites.other['official-artwork'].front_default} alt={pokemon.name} />
				<span className="id p-0">#{String(pokemon.id).padStart(4 ,'0')}</span>
				<h1 className="p-0 text-capitalize">{pokemon.name}</h1>
				<div className="types row justify-content-center">
					{pokemon.types.map(type => <span key={type.type.name} className={`type-${type.type.name} type col-5 m-1`}>{type.type.name}</span>)}
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