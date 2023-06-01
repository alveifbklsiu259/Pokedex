// instead of passing down pokemon, pass id or name and check caching
import { useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { useDispatchContenxt, usePokemonData } from "./PokemonsProvider";
import Spinner from "./Spinner";
import { getIndividualtData } from "../api";


// this component is for memoization
export const PokemonCards = memo(function PokemonCards({pokemon}) {
	return (
		<div className="col-6 col-md-4 col-lg-3 card pb-3">
			<Link to={`/pokemons/${pokemon.id}`} style={{height: '100%'}}>
				<BasicInfo pokemon={pokemon}/>
			</Link>
		</div>
	)
});

const BasicInfo = function BasicInfo({pokemon}) {
	const dispatch = useDispatchContenxt();
	const {state} = usePokemonData();
	let pokemonData = pokemon;

	useEffect(() => {
		if (typeof pokemon === 'number') {
			const getPokemon = async() => {
					dispatch({type: 'dataLoading'})
					pokemonData = await getIndividualtData('pokemon', pokemon);
					dispatch({type: 'individualPokemonLoaded', payload: pokemonData})
				};
			getPokemon();
		};
	}, [pokemon]);


	let content;
	if (typeof pokemon === 'number') {
		content = <Spinner />
	} else {
		content =  (
			<>
				<div className="d-flex flex-column align-items-center text-center p-0 h-100 justify-content-start">
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

export default BasicInfo;